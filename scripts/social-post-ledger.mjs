import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(root, 'docs', 'agent-system');
const outputRoot = join(docsDir, 'social-auto-output');
const ledgerPath = join(docsDir, 'social-post-ledger.json');
const latestJsonPath = join(docsDir, 'latest-social-post-ledger.json');
const latestMdPath = join(docsDir, 'latest-social-post-ledger.md');

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write');
const includeCreative = args.includes('--include-creative');

const toPosix = (value) => String(value || '').replaceAll('\\', '/');
const rel = (value) => toPosix(relative(root, value));

const readJson = (path, fallback) => {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON in ${rel(path)}: ${error.message}`);
  }
};

const walkManifestFiles = (dir) => {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walkManifestFiles(path);
    return entry.isFile() && entry.name === 'manifest.json' ? [path] : [];
  });
};

const classifyStatus = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (['published', 'uploaded', 'live'].includes(normalized)) return 'published';
  if (normalized.includes('credentials-present')) return 'ready_to_upload';
  if (normalized.includes('blocked')) return 'blocked';
  if (normalized.includes('draft') || normalized.includes('pending')) return 'pending_user_ok';
  return normalized || 'unknown';
};

const statusAction = (platform, status) => {
  if (status === 'published') return 'Document KPI and reuse winner signals.';
  if (status === 'ready_to_upload') return platform === 'youtube'
    ? 'Run YouTube upload after OAuth is valid and user approval is confirmed.'
    : 'Run API upload after platform publishing scope is confirmed.';
  if (status === 'blocked') {
    if (platform === 'instagram' || platform === 'facebook') return 'Use Meta Business Suite manually or add Meta Graph credentials.';
    if (platform === 'tiktok') return 'Use manual TikTok upload until Content Posting API review is approved.';
    return 'Resolve missing OAuth/API credential before live upload.';
  }
  return 'Keep as draft until explicit approval or live URL is logged.';
};

const captionFor = (manifest, platform) => {
  if (platform === 'youtube') return manifest?.captions?.youtubeShorts || '';
  return manifest?.captions?.[platform] || '';
};

const primaryAssetFor = (manifest, platform) => {
  const variants = Array.isArray(manifest?.variants) ? manifest.variants : [];
  const reel59 = variants.find((variant) => variant.label === '59s-reel');
  const longest = variants
    .filter((variant) => variant?.video && Number.isFinite(Number(variant.duration)))
    .sort((a, b) => Number(b.duration) - Number(a.duration))[0];
  const story = variants.find((variant) => String(variant.label || '').includes('story'));
  const selected = platform === 'instagram' || platform === 'facebook'
    ? (reel59 || longest || story)
    : (reel59 || longest || variants[0]);
  return selected?.video || '';
};

const loadPackages = () => walkManifestFiles(outputRoot)
  .map((manifestPath) => {
    const manifest = readJson(manifestPath, null);
    const hasSocialShape = manifest?.publishStatus || manifest?.captions || manifest?.set;
    if (!hasSocialShape && !includeCreative) return null;

    const packageDir = dirname(manifestPath);
    const packageId = manifest?.set?.id || packageDir.split(/[\\/]/).pop();
    const platforms = Object.keys(manifest?.publishStatus || {});
    const posts = platforms.map((platform) => {
      const sourceStatus = manifest.publishStatus[platform];
      const status = classifyStatus(sourceStatus);
      return {
        id: `${packageId}:${platform}`,
        packageId,
        platform,
        status,
        sourceStatus,
        liveUrl: '',
        postedAt: '',
        asset: primaryAssetFor(manifest, platform),
        caption: captionFor(manifest, platform),
        nextAction: statusAction(platform, status),
      };
    });

    return {
      packageId,
      title: manifest?.set?.title || manifest?.title || packageId,
      generatedAt: manifest?.generatedAt || '',
      manifestPath: rel(manifestPath),
      packageDir: rel(packageDir),
      landingUrl: manifest?.set?.landingUrl || '',
      hook: manifest?.hook || null,
      posts,
    };
  })
  .filter(Boolean);

const mergeManualRecords = (packages, ledger) => {
  const records = Array.isArray(ledger?.posts) ? ledger.posts : [];
  const byKey = new Map();

  for (const pkg of packages) {
    for (const post of pkg.posts) {
      byKey.set(`${post.packageId}:${post.platform}`, { pkg, post });
    }
  }

  const extraPosts = [];
  for (const record of records) {
    const packageId = record.packageId || record.setId || '';
    const platform = record.platform || '';
    const key = `${packageId}:${platform}`;
    const match = byKey.get(key);
    const normalized = {
      ...record,
      id: record.id || key,
      packageId,
      platform,
      status: classifyStatus(record.status || (record.liveUrl ? 'published' : '')),
      sourceStatus: record.status || '',
      nextAction: record.nextAction || statusAction(platform, classifyStatus(record.status || (record.liveUrl ? 'published' : ''))),
    };
    if (match) {
      match.post.status = normalized.status;
      match.post.sourceStatus = normalized.sourceStatus || match.post.sourceStatus;
      match.post.liveUrl = normalized.liveUrl || match.post.liveUrl;
      match.post.postedAt = normalized.postedAt || match.post.postedAt;
      match.post.asset = normalized.asset || match.post.asset;
      match.post.caption = normalized.caption || match.post.caption;
      match.post.nextAction = normalized.nextAction;
    } else {
      extraPosts.push(normalized);
    }
  }

  return extraPosts;
};

const buildSummary = (packages, extraPosts) => {
  const allPosts = [
    ...packages.flatMap((pkg) => pkg.posts.map((post) => ({ ...post, packageTitle: pkg.title, manifestPath: pkg.manifestPath }))),
    ...extraPosts.map((post) => ({ ...post, packageTitle: post.packageId || 'manual-record', manifestPath: '' })),
  ];
  const counts = allPosts.reduce((acc, post) => {
    acc[post.status] = (acc[post.status] || 0) + 1;
    return acc;
  }, {});
  return {
    generatedAt: new Date().toISOString(),
    source: {
      packagesScanned: packages.length,
      ledgerPath: rel(ledgerPath),
      outputRoot: rel(outputRoot),
    },
    counts,
    posts: allPosts.sort((a, b) => `${a.packageId}:${a.platform}`.localeCompare(`${b.packageId}:${b.platform}`)),
  };
};

const renderMarkdown = (summary) => {
  const lines = [
    '# AIRDOX Social Post Ledger',
    '',
    `Generated: ${summary.generatedAt}`,
    `Packages scanned: ${summary.source.packagesScanned}`,
    '',
    '## Status Counts',
    '',
    ...Object.entries(summary.counts).map(([status, count]) => `- ${status}: ${count}`),
    '',
    '## Posts',
    '',
    '| Package | Platform | Status | Live URL | Asset | Next action |',
    '|---|---|---|---|---|---|',
    ...summary.posts.map((post) => [
      post.packageId || '',
      post.platform || '',
      post.status || '',
      post.liveUrl || '',
      post.asset || '',
      post.nextAction || '',
    ].map((value) => String(value).replaceAll('|', '/')).join(' | ')).map((row) => `| ${row} |`),
    '',
    '## Manual Live-URL Source',
    '',
    `Add confirmed published posts to \`${summary.source.ledgerPath}\` using packageId, platform, status, liveUrl, postedAt, asset, and caption.`,
    '',
  ];
  return lines.join('\n');
};

const ensureLedgerTemplate = () => {
  if (existsSync(ledgerPath)) return;
  const template = {
    schema: 'airdox.social-post-ledger.v1',
    note: 'Manual source of truth for confirmed live social posts. The automation merges this with generated social package manifests.',
    posts: [],
  };
  writeFileSync(ledgerPath, `${JSON.stringify(template, null, 2)}\n`);
};

const main = () => {
  const packages = loadPackages();
  const ledger = readJson(ledgerPath, { posts: [] });
  const extraPosts = mergeManualRecords(packages, ledger);
  const summary = buildSummary(packages, extraPosts);

  if (shouldWrite) {
    mkdirSync(docsDir, { recursive: true });
    ensureLedgerTemplate();
    writeFileSync(latestJsonPath, `${JSON.stringify(summary, null, 2)}\n`);
    writeFileSync(latestMdPath, renderMarkdown(summary));
  }

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
};

main();
