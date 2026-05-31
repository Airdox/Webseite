#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import dotenv from 'dotenv';

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:\/)/, '$1'));
dotenv.config({ path: join(root, '.env'), quiet: true, override: true });

const args = process.argv.slice(2);

const getArg = (name, fallback = '') => {
  const prefix = `${name}=`;
  const raw = args.find((entry) => entry.startsWith(prefix));
  return raw ? raw.slice(prefix.length).trim() : fallback;
};

const hasFlag = (name) => args.includes(name);

const explicitVideoIds = getArg('--video-ids')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);
const maxResults = Math.max(1, Math.min(50, Number(getArg('--max-results', '20')) || 20));
const writeReports = hasFlag('--write');
const expectedTitle = getArg('--expected-title');

const outDir = join(root, 'docs', 'agent-system');
const jsonPath = join(outDir, 'latest-youtube-publish-audit.json');
const mdPath = join(outDir, 'latest-youtube-publish-audit.md');

const getUserEnv = (key) => {
  if (process.platform !== 'win32') return '';
  const result = spawnSync('powershell', [
    '-NoProfile',
    '-Command',
    `[Environment]::GetEnvironmentVariable('${key.replaceAll("'", "''")}','User')`,
  ], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
  });
  return result.status === 0 ? String(result.stdout || '').trim() : '';
};

const getEnv = (key) => process.env[key] || getUserEnv(key);

const getAccessToken = async () => {
  const missing = ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN'].filter((key) => !getEnv(key));
  if (missing.length > 0) {
    throw new Error(`Missing YouTube OAuth env vars: ${missing.join(', ')}`);
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getEnv('YOUTUBE_CLIENT_ID'),
      client_secret: getEnv('YOUTUBE_CLIENT_SECRET'),
      refresh_token: getEnv('YOUTUBE_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()).access_token;
};

const youtubeGet = async (url, accessToken) => {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
};

const listRecentUploadIds = async (accessToken) => {
  const channelData = await youtubeGet('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true', accessToken);
  const uploadsPlaylist = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylist) {
    throw new Error('No uploads playlist found for authenticated YouTube account.');
  }

  const playlistData = await youtubeGet(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylist}&maxResults=${maxResults}`,
    accessToken,
  );

  return (playlistData.items || [])
    .map((item) => item.snippet?.resourceId?.videoId)
    .filter(Boolean);
};

const loadVideos = async (videoIds, accessToken) => {
  if (videoIds.length === 0) return [];
  const data = await youtubeGet(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,status,processingDetails&id=${videoIds.join(',')}`,
    accessToken,
  );
  return data.items || [];
};

const normalizeVideo = (item) => ({
  id: item.id,
  title: item.snippet?.title || '',
  publishedAt: item.snippet?.publishedAt || '',
  privacyStatus: item.status?.privacyStatus || '',
  uploadStatus: item.status?.uploadStatus || '',
  processingStatus: item.processingDetails?.processingStatus || '',
  processingFailureReason: item.processingDetails?.processingFailureReason || '',
  thumbnails: item.snippet?.thumbnails || {},
});

const buildFindings = (videos) => {
  const findings = [];
  const byTitle = new Map();

  for (const video of videos) {
    const titleKey = video.title.trim().toLowerCase();
    if (!byTitle.has(titleKey)) byTitle.set(titleKey, []);
    byTitle.get(titleKey).push(video);

    if (video.privacyStatus === 'public' && video.processingStatus && video.processingStatus !== 'succeeded') {
      findings.push({
        severity: 'high',
        videoId: video.id,
        message: 'Public video is not fully processed.',
      });
    }

    if (video.uploadStatus !== 'processed') {
      findings.push({
        severity: video.privacyStatus === 'public' ? 'high' : 'medium',
        videoId: video.id,
        message: `Upload status is ${video.uploadStatus || 'unknown'}.`,
      });
    }

    if (expectedTitle && video.title === expectedTitle && video.privacyStatus === 'public') {
      findings.push({
        severity: 'high',
        videoId: video.id,
        message: 'Expected-title candidate is public; verify thumbnail approval before keeping live.',
      });
    }
  }

  for (const sameTitleVideos of byTitle.values()) {
    if (sameTitleVideos.length > 1) {
      findings.push({
        severity: 'medium',
        videoIds: sameTitleVideos.map((video) => video.id),
        message: `Duplicate YouTube title detected: ${sameTitleVideos[0].title}`,
      });
    }
  }

  return findings;
};

const toMarkdown = (report) => [
  '# YouTube Publish Audit',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  '## Findings',
  '',
  ...(report.findings.length
    ? report.findings.map((finding) => `- ${finding.severity.toUpperCase()}: ${finding.message} ${finding.videoId ? `(${finding.videoId})` : finding.videoIds ? `(${finding.videoIds.join(', ')})` : ''}`)
    : ['- No findings.']),
  '',
  '## Videos',
  '',
  '| Video | Privacy | Upload | Processing | Title |',
  '|---|---|---|---|---|',
  ...report.videos.map((video) => `| ${video.id} | ${video.privacyStatus || '-'} | ${video.uploadStatus || '-'} | ${video.processingStatus || '-'} | ${video.title.replaceAll('|', '\\|')} |`),
  '',
].join('\n');

const accessToken = await getAccessToken();
const videoIds = explicitVideoIds.length ? explicitVideoIds : await listRecentUploadIds(accessToken);
const videos = (await loadVideos(videoIds, accessToken)).map(normalizeVideo);
const report = {
  generatedAt: new Date().toISOString(),
  mode: explicitVideoIds.length ? 'explicit-video-ids' : 'recent-uploads',
  expectedTitle: expectedTitle || null,
  videoIds,
  videos,
  findings: buildFindings(videos),
};

if (writeReports) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(mdPath, toMarkdown(report));
}

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
