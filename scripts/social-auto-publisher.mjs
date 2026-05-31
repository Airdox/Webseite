#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(root, '.env'), quiet: true });
const args = process.argv.slice(2);

const getArg = (name, fallback = '') => {
  const prefix = `${name}=`;
  const found = args.find((entry) => entry.startsWith(prefix));
  return found ? found.slice(prefix.length).trim() : fallback;
};

const flags = new Set(args.filter((entry) => entry.startsWith('--') && !entry.includes('=')));
const shouldRender = !flags.has('--skip-render');
const selectedSetId = getArg('--set-id');
const selectedStart = getArg('--start');
const selectedDurations = getArg('--durations', '15,30,59')
  .split(',')
  .map((entry) => Number(entry.trim()))
  .filter((entry) => Number.isFinite(entry) && entry > 0);

const parseTimeToSeconds = (value = '') => {
  const parts = String(value).split(':').map((entry) => Number(entry));
  if (parts.some((entry) => !Number.isFinite(entry))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
};

const secondsToClock = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const slugify = (value) => String(value)
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80) || 'airdox-set';

const chooseHookTrack = (set) => {
  const tracks = Array.isArray(set.tracks) ? set.tracks : [];
  if (selectedStart) {
    const selectedSeconds = parseTimeToSeconds(selectedStart);
    const before = [...tracks]
      .filter((track) => parseTimeToSeconds(track.time) <= selectedSeconds)
      .pop();
    return {
      seconds: selectedSeconds,
      track: before || tracks[0] || null,
      reason: 'manual start',
    };
  }

  const rene = tracks.find((track) => /rene bourgeois/i.test(`${track.artist || ''} ${track.title || ''}`));
  if (rene) {
    return {
      seconds: parseTimeToSeconds(rene.time),
      track: rene,
      reason: 'Rene Bourgeois hook',
    };
  }

  const midSet = tracks.find((track) => parseTimeToSeconds(track.time) >= 15 * 60)
    || tracks.find((track) => parseTimeToSeconds(track.time) >= 5 * 60)
    || tracks[0]
    || null;

  return {
    seconds: midSet ? parseTimeToSeconds(midSet.time) : 0,
    track: midSet,
    reason: 'first usable set moment',
  };
};

const run = (command, commandArgs) => {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(' ')} failed with exit code ${result.status ?? 1}`);
  }
};

const readWindowsUserEnv = (key) => {
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

const getEnv = (key) => process.env[key] || readWindowsUserEnv(key);

const setsModulePath = pathToFileURL(join(root, 'src', 'data', 'musicSets.js')).href;
const { sets } = await import(setsModulePath);
const availableSets = Array.isArray(sets) ? sets : [];
const set = selectedSetId
  ? availableSets.find((entry) => entry.id === selectedSetId)
  : availableSets.find((entry) => entry.isNew === true) || availableSets[0];

if (!set) {
  throw new Error('No music set found in src/data/musicSets.js');
}

const hook = chooseHookTrack(set);
const trackArtist = String(hook.track?.artist || 'AIRDOX').toUpperCase();
const trackTitle = String(hook.track?.title || set.title || 'LIVE SET').toUpperCase();
const setTitle = String(set.title || set.id || 'AIRDOX SET').toUpperCase();
const streamUrl = `https://airdox.info/api/audio/${encodeURIComponent(set.file)}`;
const coverPath = join(root, String(set.cover || '/assets/airdox-vinyl.jpg').replace(/^\//, 'public/'));
const outputDir = join(root, 'docs', 'agent-system', 'social-auto-output', slugify(set.id || set.title));
mkdirSync(outputDir, { recursive: true });

const variants = selectedDurations.map((duration) => {
  const label = duration === 15 ? 'story-hook' : duration === 30 ? 'teaser' : `${duration}s-reel`;
  const fileBase = `${slugify(set.id || set.title)}-${label}-${hook.seconds}`;
  const video = join(outputDir, `${fileBase}.mp4`);
  return {
    label,
    duration,
    video,
    outputArg: relative(root, video),
    preview: join(outputDir, `${fileBase}-preview.png`),
    audioCheck: join(outputDir, `${fileBase}-audio-check.wav`),
  };
});

if (shouldRender) {
  if (!existsSync(coverPath)) {
    throw new Error(`Cover image not found: ${coverPath}`);
  }

  for (const variant of variants) {
    run('powershell', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      join(root, '.agents', 'skills', 'airdox-reel-workflow', 'scripts', 'render-airdox-reel.ps1'),
      '-AudioPath',
      streamUrl,
      '-CoverPath',
      coverPath,
      '-StartSeconds',
      String(hook.seconds),
      '-Duration',
      String(variant.duration),
      '-SetTitle',
      setTitle,
      '-Artist',
      trackArtist,
      '-Track',
      trackTitle,
      '-OutputPath',
      variant.outputArg,
    ]);
  }
}

const captionBase = `${setTitle}\n\n${trackArtist} - ${trackTitle}\nStart at ${secondsToClock(hook.seconds)}. Full set on AIRDOX.INFO.`;
const hashtags = [
  '#AIRDOX',
  '#BerlinTechno',
  '#UndergroundTechno',
  '#TechnoDJ',
  '#LiveSet',
  '#DJSet',
  '#TechnoReel',
];

const credentials = {
  youtube: Boolean(getEnv('YOUTUBE_CLIENT_ID') && getEnv('YOUTUBE_CLIENT_SECRET') && getEnv('YOUTUBE_REFRESH_TOKEN')),
  meta: Boolean(getEnv('META_PAGE_ACCESS_TOKEN') && getEnv('FACEBOOK_PAGE_ID') && getEnv('INSTAGRAM_BUSINESS_ACCOUNT_ID')),
  tiktok: Boolean(getEnv('TIKTOK_CLIENT_KEY') && getEnv('TIKTOK_CLIENT_SECRET') && getEnv('TIKTOK_REFRESH_TOKEN')),
};

const manifest = {
  generatedAt: new Date().toISOString(),
  mode: shouldRender ? 'rendered' : 'metadata-only',
  set: {
    id: set.id,
    title: set.title,
    date: set.date,
    file: set.file,
    cover: set.cover || '/assets/airdox-vinyl.jpg',
    r2ObjectKey: `public/${set.file}`,
    streamUrl,
    landingUrl: `https://airdox.info/#set-${set.id}`,
  },
  hook: {
    startSeconds: hook.seconds,
    startTime: secondsToClock(hook.seconds),
    reason: hook.reason,
    artist: hook.track?.artist || '',
    title: hook.track?.title || '',
  },
  variants: variants.map((variant) => ({
    label: variant.label,
    duration: variant.duration,
    video: variant.video.replace(`${root}\\`, '').replaceAll('\\', '/'),
    preview: variant.preview.replace(`${root}\\`, '').replaceAll('\\', '/'),
    audioCheck: variant.audioCheck.replace(`${root}\\`, '').replaceAll('\\', '/'),
  })),
  captions: {
    instagram: `${captionBase}\n\n${hashtags.join(' ')}`,
    facebook: `${setTitle} is online. ${trackArtist} - ${trackTitle}. Stream the full set on AIRDOX.INFO.`,
    tiktok: `${setTitle} - ${trackArtist}. Full set on AIRDOX.INFO. ${hashtags.slice(0, 5).join(' ')}`,
    youtubeShorts: `${setTitle} | ${trackArtist} - ${trackTitle} | AIRDOX.INFO`,
  },
  publishStatus: {
    youtube: credentials.youtube ? 'credentials-present-not-uploaded' : 'blocked-missing-oauth',
    instagram: credentials.meta ? 'credentials-present-not-uploaded' : 'blocked-missing-meta-oauth',
    facebook: credentials.meta ? 'credentials-present-not-uploaded' : 'blocked-missing-meta-oauth',
    tiktok: credentials.tiktok ? 'credentials-present-not-uploaded' : 'blocked-missing-tiktok-oauth',
  },
};

writeFileSync(join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(join(outputDir, 'captions.json'), `${JSON.stringify(manifest.captions, null, 2)}\n`);
writeFileSync(join(outputDir, 'upload-copy-paste.md'), [
  `# AIRDOX Social Auto Package - ${set.title}`,
  '',
  `Generated: ${manifest.generatedAt}`,
  `Set: ${set.title}`,
  `Hook: ${manifest.hook.startTime} - ${manifest.hook.artist} - ${manifest.hook.title}`,
  `Landing URL: ${manifest.set.landingUrl}`,
  '',
  '## Assets',
  '',
  ...manifest.variants.map((variant) => `- ${variant.label}: \`${variant.video}\``),
  '',
  '## Instagram',
  '',
  manifest.captions.instagram,
  '',
  '## Facebook',
  '',
  manifest.captions.facebook,
  '',
  '## TikTok',
  '',
  manifest.captions.tiktok,
  '',
  '## YouTube Shorts',
  '',
  manifest.captions.youtubeShorts,
  '',
  '## Automation Gate',
  '',
  `- YouTube: ${manifest.publishStatus.youtube}`,
  `- Instagram: ${manifest.publishStatus.instagram}`,
  `- Facebook: ${manifest.publishStatus.facebook}`,
  `- TikTok: ${manifest.publishStatus.tiktok}`,
  '',
  'No browser cookies or session tokens are used.',
  '',
].join('\n'));

process.stdout.write([
  'AIRDOX Social Auto: DONE',
  `Set: ${set.title} (${set.id})`,
  `Hook: ${secondsToClock(hook.seconds)} (${hook.reason})`,
  `Output: ${outputDir}`,
  `Render: ${shouldRender ? 'yes' : 'skipped'}`,
  `Publish: YouTube=${manifest.publishStatus.youtube}, Instagram=${manifest.publishStatus.instagram}, Facebook=${manifest.publishStatus.facebook}, TikTok=${manifest.publishStatus.tiktok}`,
].join('\n'));
process.stdout.write('\n');
