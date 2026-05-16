#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const args = process.argv.slice(2);
const argSet = new Set(args);

const getArgValue = (name, fallback = '') => {
  const prefix = `${name}=`;
  const raw = args.find((entry) => entry.startsWith(prefix));
  if (!raw) return fallback;
  return raw.slice(prefix.length).trim() || fallback;
};

const generatedAt = new Date().toISOString();
const today = generatedAt.slice(0, 10);
const version = getArgValue('--version', `v${today}`);
const validateOnly = argSet.has('--validate-only');
const strict = argSet.has('--strict');
const tokensPath = join(root, 'docs', 'brand', 'airdox-brand-tokens.json');
const outputRoot = join(root, 'public', 'brand-assets');
const versionDir = join(outputRoot, version);
const reportJsonPath = join(root, 'docs', 'agent-system', 'latest-brand-asset-generator.json');
const reportMdPath = join(root, 'docs', 'agent-system', 'latest-brand-asset-generator.md');

const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
const palette = tokens.palette || {};
const identity = tokens.identity || {};
const typography = tokens.typography || {};

const requiredPalette = [
  'bg',
  'surface',
  'accentCyan',
  'accentLime',
  'textPrimary',
  'textMuted',
  'border',
];

const blockedVisibleTerms = [
  'draft',
  'pending',
  'approval',
  'internal',
  'placeholder',
  'todo',
];

const assetSpecs = [
  {
    id: 'reel-drop-peak',
    type: 'reel',
    width: 1080,
    height: 1920,
    title: 'PEAK MOMENT',
    subtitle: 'FULL SET ONLINE',
    cta: 'AIRDOX.INFO',
    safeArea: { top: 190, right: 90, bottom: 300, left: 90 },
  },
  {
    id: 'story-pressure-test',
    type: 'story',
    width: 1080,
    height: 1920,
    title: 'PRESSURE TEST',
    subtitle: 'BERLIN UNDERGROUND TECHNO',
    cta: 'BOOKING / EPK / MUSIC ARCHIVE',
    safeArea: { top: 190, right: 90, bottom: 300, left: 90 },
  },
  {
    id: 'thumbnail-full-set',
    type: 'thumbnail',
    width: 1280,
    height: 720,
    title: 'AIRDOX LIVE SET',
    subtitle: 'DARK ROOM ENERGY',
    cta: 'FULL SET ON AIRDOX.INFO',
    safeArea: { top: 96, right: 80, bottom: 104, left: 80 },
  },
  {
    id: 'square-release-card',
    type: 'square',
    width: 1080,
    height: 1080,
    title: 'NEW SET',
    subtitle: 'AIRDOX SIGNAL DROP',
    cta: 'LISTEN / SHARE / BOOK',
    safeArea: { top: 90, right: 80, bottom: 100, left: 80 },
  },
];

const escapeXml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const hexToRgb = (hex) => {
  const normalized = String(hex || '').trim().replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const channelToLinear = (value) => {
  const channel = value / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
};

const luminance = (rgb) => (
  0.2126 * channelToLinear(rgb.r)
  + 0.7152 * channelToLinear(rgb.g)
  + 0.0722 * channelToLinear(rgb.b)
);

const contrastRatio = (fg, bg) => {
  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);
  if (!fgRgb || !bgRgb) return 0;
  const lighter = Math.max(luminance(fgRgb), luminance(bgRgb));
  const darker = Math.min(luminance(fgRgb), luminance(bgRgb));
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
};

const renderSvg = (spec) => {
  const safe = spec.safeArea;
  const safeWidth = spec.width - safe.left - safe.right;
  const safeHeight = spec.height - safe.top - safe.bottom;
  const titleSize = spec.type === 'thumbnail' ? 94 : spec.type === 'square' ? 116 : 128;
  const subtitleSize = spec.type === 'thumbnail' ? 38 : 44;
  const ctaSize = spec.type === 'thumbnail' ? 31 : 36;
  const brandSize = spec.type === 'thumbnail' ? 42 : 48;
  const brandName = escapeXml(tokens.brandName || 'AIRDOX');
  const tagline = escapeXml(identity.tagline || 'Berlin Underground Techno');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}" role="img" aria-label="${brandName} ${escapeXml(spec.title)}">
  <defs>
    <linearGradient id="edgeGlow" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.accentCyan}" stop-opacity="0.9"/>
      <stop offset="0.58" stop-color="${palette.surface}" stop-opacity="0.4"/>
      <stop offset="1" stop-color="${palette.accentLime}" stop-opacity="0.8"/>
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${palette.bg}"/>
  <rect x="28" y="28" width="${spec.width - 56}" height="${spec.height - 56}" fill="none" stroke="${palette.border}" stroke-width="2"/>
  <rect x="${safe.left}" y="${safe.top}" width="${safeWidth}" height="${safeHeight}" fill="${palette.surface}" opacity="0.58"/>
  <path d="M${safe.left} ${safe.top + 16} H${safe.left + Math.round(safeWidth * 0.55)}" stroke="${palette.accentCyan}" stroke-width="10" filter="url(#softGlow)"/>
  <path d="M${safe.left + Math.round(safeWidth * 0.5)} ${safe.top + safeHeight - 24} H${safe.left + safeWidth}" stroke="${palette.accentLime}" stroke-width="8" opacity="0.9"/>
  <g font-family="${escapeXml(typography.fontFamily || 'Inter, Arial, sans-serif')}" fill="${palette.textPrimary}">
    <text x="${safe.left}" y="${safe.top + 78}" font-size="${brandSize}" font-weight="800" letter-spacing="0">${brandName}</text>
    <text x="${safe.left}" y="${safe.top + 122}" font-size="24" font-weight="600" fill="${palette.textMuted}" letter-spacing="0">${tagline}</text>
    <text x="${safe.left}" y="${safe.top + Math.round(safeHeight * 0.48)}" font-size="${titleSize}" font-weight="900" letter-spacing="0">${escapeXml(spec.title)}</text>
    <text x="${safe.left}" y="${safe.top + Math.round(safeHeight * 0.48) + subtitleSize + 22}" font-size="${subtitleSize}" font-weight="700" fill="${palette.accentCyan}" letter-spacing="0">${escapeXml(spec.subtitle)}</text>
    <text x="${safe.left}" y="${safe.top + safeHeight - 92}" font-size="${ctaSize}" font-weight="800" fill="${palette.textPrimary}" letter-spacing="0">${escapeXml(spec.cta)}</text>
    <text x="${safe.left}" y="${safe.top + safeHeight - 48}" font-size="22" font-weight="600" fill="${palette.textMuted}" letter-spacing="0">${escapeXml(identity.website || 'https://airdox.info')}</text>
  </g>
  <g opacity="0.75">
    <rect x="${spec.width - safe.right - 170}" y="${safe.top + 28}" width="170" height="14" fill="${palette.accentCyan}"/>
    <rect x="${spec.width - safe.right - 104}" y="${safe.top + 52}" width="104" height="14" fill="${palette.accentLime}"/>
    <rect x="${safe.left}" y="${safe.top + safeHeight - 22}" width="70" height="10" fill="${palette.accentCyan}"/>
  </g>
  <rect x="${safe.left}" y="${safe.top}" width="${safeWidth}" height="${safeHeight}" fill="none" stroke="url(#edgeGlow)" stroke-width="3" opacity="0.72"/>
</svg>
`;
};

const validateAsset = (spec, svg) => {
  const checks = [];
  const add = (id, level, detail) => checks.push({ id: `${spec.id}:${id}`, level, detail });

  if (!svg.includes(String(tokens.brandName || 'AIRDOX').toUpperCase())) {
    add('brand-name-visible', 'fail', 'AIRDOX brand name is not visible in uppercase.');
  } else {
    add('brand-name-visible', 'pass', 'AIRDOX brand name is visible in uppercase.');
  }

  for (const key of requiredPalette) {
    if (!palette[key] || !svg.includes(palette[key])) {
      add(`palette-${key}`, 'fail', `Missing palette token ${key}.`);
    }
  }

  if (requiredPalette.every((key) => palette[key] && svg.includes(palette[key]))) {
    add('palette-complete', 'pass', 'All required brand palette tokens are used.');
  }

  const lower = svg.toLowerCase();
  const blockedTerms = blockedVisibleTerms.filter((term) => lower.includes(term));
  if (blockedTerms.length) {
    add('blocked-visible-terms', 'fail', `Blocked internal terms found: ${blockedTerms.join(', ')}.`);
  } else {
    add('blocked-visible-terms', 'pass', 'No blocked internal terms are visible.');
  }

  const titleContrast = contrastRatio(palette.textPrimary, palette.surface || palette.bg);
  const accentContrast = contrastRatio(palette.accentCyan, palette.bg);
  if (titleContrast < 4.5) {
    add('title-contrast', 'fail', `Title contrast is too low (${titleContrast}).`);
  } else {
    add('title-contrast', 'pass', `Title contrast is stable (${titleContrast}).`);
  }

  if (accentContrast < 3) {
    add('accent-contrast', 'warn', `Accent contrast is low (${accentContrast}).`);
  } else {
    add('accent-contrast', 'pass', `Accent contrast is stable (${accentContrast}).`);
  }

  if (spec.safeArea.bottom < 90 || spec.safeArea.top < 60) {
    add('safe-area', 'fail', 'Safe area is too small for social platform UI.');
  } else {
    add('safe-area', 'pass', 'Safe area is defined for platform UI.');
  }

  return checks;
};

const renderMarkdown = (report) => {
  const lines = [
    '# AIRDOX Brand Asset Generator Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Version: ${report.version}`,
    `Status: ${report.summary.status}`,
    '',
    '## Summary',
    '',
    `- Assets: ${report.summary.assetCount}`,
    `- Checks: ${report.summary.totalChecks}`,
    `- Failures: ${report.summary.failCount}`,
    `- Warnings: ${report.summary.warnCount}`,
    `- Passes: ${report.summary.passCount}`,
    '',
    '## Assets',
    '',
    '| Asset | Type | Size | File |',
    '| --- | --- | --- | --- |',
    ...report.assets.map((asset) => `| ${asset.id} | ${asset.type} | ${asset.width}x${asset.height} | ${asset.file} |`),
    '',
    '## Checks',
    '',
    '| Check | Level | Detail |',
    '| --- | --- | --- |',
    ...report.checks.map((check) => `| ${check.id} | ${check.level.toUpperCase()} | ${check.detail} |`),
    '',
  ];

  return `${lines.join('\n')}\n`;
};

const main = () => {
  mkdirSync(versionDir, { recursive: true });
  mkdirSync(dirname(reportJsonPath), { recursive: true });

  const assets = [];
  const checks = [];

  for (const spec of assetSpecs) {
    const svg = renderSvg(spec);
    const filename = `${spec.id}.svg`;
    const filePath = join(versionDir, filename);

    if (!validateOnly) {
      writeFileSync(filePath, svg, 'utf8');
    }

    assets.push({
      ...spec,
      file: relative(root, filePath).replace(/\\/g, '/'),
    });
    checks.push(...validateAsset(spec, svg));
  }

  const manifest = {
    generatedAt,
    version,
    brandName: tokens.brandName,
    tokens: relative(root, tokensPath).replace(/\\/g, '/'),
    assets,
  };

  const manifestPath = join(versionDir, 'manifest.json');
  if (!validateOnly) {
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }

  const failCount = checks.filter((check) => check.level === 'fail').length;
  const warnCount = checks.filter((check) => check.level === 'warn').length;
  const passCount = checks.filter((check) => check.level === 'pass').length;
  const report = {
    generatedAt,
    agent: 'Designer',
    version,
    manifest: relative(root, manifestPath).replace(/\\/g, '/'),
    assets,
    checks,
    summary: {
      assetCount: assets.length,
      totalChecks: checks.length,
      failCount,
      warnCount,
      passCount,
      status: failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass',
    },
  };

  writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(reportMdPath, renderMarkdown(report), 'utf8');

  process.stdout.write(`AIRDOX Brand Asset Generator (${generatedAt})\n`);
  process.stdout.write(`Version: ${version}\n`);
  process.stdout.write(`Assets: ${assets.length}\n`);
  process.stdout.write(`Failures: ${failCount} | Warnings: ${warnCount} | Passes: ${passCount}\n`);
  process.stdout.write(`Report: ${relative(root, reportMdPath).replace(/\\/g, '/')}\n`);

  if (strict && (failCount > 0 || warnCount > 0)) {
    process.exitCode = 1;
  }
};

main();
