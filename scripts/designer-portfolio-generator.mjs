#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const generatedAt = new Date().toISOString();
const today = generatedAt.slice(0, 10);
const args = process.argv.slice(2);

const getArgValue = (name, fallback = '') => {
  const prefix = `${name}=`;
  const raw = args.find((entry) => entry.startsWith(prefix));
  if (!raw) return fallback;
  return raw.slice(prefix.length).trim() || fallback;
};

const tokensPath = join(root, 'docs', 'brand', 'airdox-brand-tokens.json');
const postingPackPath = join(root, 'docs', 'agent-system', 'SOCIAL_POSTING_PACK_2026-05-23.md');
const daumenkinoPublicDir = join(root, 'public', 'brand-assets', 'daumenkino');
const daumenkinoScratchDir = join(root, 'scratch', 'daumenkino-contact');
const outputRoot = join(root, 'docs', 'agent-system', 'designer-portfolio-output');
const batchId = getArgValue('--batch', `sissygut-airdox-portfolio-${today}`);
const outputDir = join(outputRoot, batchId);
const reportJsonPath = join(root, 'docs', 'agent-system', 'latest-designer-portfolio.json');
const reportMdPath = join(root, 'docs', 'agent-system', 'latest-designer-portfolio.md');

const readJson = (filePath, fallback = {}) => {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
};

const readText = (filePath, fallback = '') => {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return fallback;
  }
};

const toRepoPath = (filePath) => relative(root, filePath).replaceAll('\\', '/');

const listImages = (dir, limit = 16) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(dir, entry.name))
    .filter((filePath) => ['.jpg', '.jpeg', '.png', '.svg', '.webp'].includes(extname(filePath).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, limit)
    .map(toRepoPath);
};

const escapeXml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const tokens = readJson(tokensPath, {});
const palette = {
  bg: tokens?.palette?.bg || '#050608',
  surface: tokens?.palette?.surface || '#0f141a',
  border: tokens?.palette?.border || '#263241',
  cyan: tokens?.palette?.accentCyan || '#00f0ff',
  lime: tokens?.palette?.accentLime || '#9adf6b',
  text: tokens?.palette?.textPrimary || '#f5f8ff',
  muted: tokens?.palette?.textMuted || '#9aa6b2',
  pink: '#ff00aa',
};
const postingPack = readText(postingPackPath);
const campaignMatch = postingPack.match(/^Set:\s*(.+)$/m);
const hookMatch = postingPack.match(/^Hook-Fokus:\s*(.+)$/m);
const campaign = {
  set: campaignMatch ? campaignMatch[1].trim() : 'SISSYGUT ALLES GUT',
  hook: hookMatch ? hookMatch[1].trim() : '00:03:50-00:04:50',
  requiredText: [
    'NEW SET ONLINE',
    'SISSYGUT ALLES GUT',
    'FULL SET ON AIRDOX.INFO',
  ],
};

const references = {
  daumenkinoPublic: listImages(daumenkinoPublicDir, 8),
  daumenkinoScratch: listImages(daumenkinoScratchDir, 16),
  requiredSources: [
    'docs/agent-system/SOCIAL_POSTING_PACK_2026-05-23.md',
    'docs/brand/AIRDOX_CORPORATE_DESIGN.md',
    'docs/brand/airdox-brand-tokens.json',
  ],
};

const directions = [
  {
    id: 'airdox-block-assembly',
    title: 'AIRDOX Block Assembly',
    status: 'prototype_next',
    intent: 'AIRDOX wird nicht gesetzt, sondern aus Balken, Shards und harten Blockformen beat-synchron zusammengesetzt.',
    firstFrame: 'Einzelteile fliegen aus vier Richtungen ein; nach 0.8s rastet AIRDOX zentral ein.',
    motion: 'Block fly-in, snap-to-grid, kurzer Strobe-Hit, danach leichter Beat-Pulse pro Buchstabengruppe.',
    typographyRule: 'Kein Normalfont als Logo. Buchstaben muessen als konstruierte Formen oder manuell kuratierte Letterforms gebaut werden.',
    sourceUse: 'Daumenkino-Ideen nur fuer Energie, Kanten, Ueberlagerung und handgemachte Stoerung; nicht der clean extrahierte Logo-Versuch.',
    risk: 'Kann zu geometrisch/techno-clean werden, wenn keine rauen Kanten und unregelmaessigen Versatzlayer dazukommen.',
    nextPrototype: '5s Motion-Test: 12-18 AIRDOX-Segmente, 6 Beat-Zustaende, SISSYGUT/CTA nur als klare Nebenebene.',
    recommendation: 'ja - direkt als erste neue Visualisierung bauen',
  },
  {
    id: 'airdox-stencil-industrial',
    title: 'AIRDOX Stencil Industrial',
    status: 'candidate',
    intent: 'AIRDOX als harter Schablonen-/Industrial-Schriftzug mit ausgeschnittenen Stegen, Club-Poster-Kante und Neon-Rimlight.',
    firstFrame: 'Schwarze Stencil-Masse auf dunklem Grund, Cyan-Kante zieht von links nach rechts ueber die Buchstaben.',
    motion: 'Mask reveal, Scanline-Sweep, kurze horizontale Glitch-Slices im Drop.',
    typographyRule: 'Modular und roh, aber sofort lesbar; keine langweilige Arial/Inter-Logozeile.',
    sourceUse: 'Daumenkino-Ideen fuer Kontrast, Farbschmutz und unperfekte Outline als Overlay-Textur.',
    risk: 'Zu nah an normaler Techno-Schablone, wenn die Letterforms nicht speziell genug werden.',
    nextPrototype: 'Still plus 3 Frame-Zustaende: verborgen, halb gescannt, voll eingerastet.',
    recommendation: 'vielleicht - gut als Backup, wenn Wildstyle zu unlesbar wird',
  },
  {
    id: 'daumenkino-wildstyle-controlled',
    title: 'Controlled Daumenkino Wildstyle',
    status: 'candidate',
    intent: 'Graffiti-Energie aus den Daumenkino-Ideen, aber mit kontrollierter Lesbarkeit und getrenntem CTA-System.',
    firstFrame: 'AIRDOX als wuchtiger Wildstyle-Block zentral, SISSYGUT/CTA in eigener ruhiger Safe-Area.',
    motion: 'Frame-by-frame Letter-Jitter, Farbwechsel auf einzelnen Kanten, Outline-Duplikate und kurze Drip-/Arrow-Hits.',
    typographyRule: 'KI darf Varianten skizzieren, aber finale Buchstaben muessen gegen echte AIRDOX-Lesbarkeit kuratiert werden.',
    sourceUse: 'Scratch-Daumenkino-Referenzen sind Pflichtanker; der verworfene clean-Schriftzug ist ausgeschlossen.',
    risk: 'Hoher Lesbarkeitsverlust; darf nicht als zufaelliges Pseudo-Graffiti enden.',
    nextPrototype: 'Kontaktbogen aus 6 AIRDOX-Letter-Ideen, noch ohne Audio, nur zur Stilentscheidung.',
    recommendation: 'ja, aber nur als Ideation-Portfolio, nicht sofort final rendern',
  },
  {
    id: 'fragment-glitch-type-drop',
    title: 'Fragment Glitch Type Drop',
    status: 'candidate',
    intent: 'AIRDOX entsteht aus zerrissenen horizontalen Typo-Fragmenten, Waveform-Spine und Drop-Impuls.',
    firstFrame: 'Unlesbare Fragmente, dann fuer 1 Sekunde glasklares AIRDOX als zentrales Signal.',
    motion: 'Slit-scan, Time-slice, Waveform-getriggerte Verschiebung, kurzer Vollbild-Hit beim Einrasten.',
    typographyRule: 'Basis darf aus konstruierten Letterforms kommen; Font nur als unsichtbare Geometriehilfe.',
    sourceUse: 'Portrait/Daumenkino als Stoerlayer, nicht als hauptsaechlicher Schriftzug.',
    risk: 'Kann generisch wirken, wenn AIRDOX nicht speziell gezeichnet ist.',
    nextPrototype: '5s Drop-Test mit 3 Stufen: Chaos, Lock, Pulse.',
    recommendation: 'vielleicht - stark fuer Motion, aber zweite Prioritaet',
  },
  {
    id: 'portrait-logo-lightgate',
    title: 'Portrait + AIRDOX Light Gate',
    status: 'hold',
    intent: 'Portrait bleibt als Figur, AIRDOX wird durch harte Lichtklappen ueber/um das Gesicht aufgebaut.',
    firstFrame: 'Gesicht als dunkle Silhouette, AIRDOX-Segmente schneiden als Lichtklappen durch das Bild.',
    motion: 'Parallax-Portrait, vertikale Light-Gates, Logo-Teile werden aus Lichtmasken sichtbar.',
    typographyRule: 'AIRDOX zentral und gross, aber nicht unter das Portrait geschoben; keine Posterkarte.',
    sourceUse: 'Nur sauberes `portrait-cutout.png` plus Daumenkino-Textur, keine alten GIF-Artefakte.',
    risk: 'Kann wieder nach Freistellungsproblem aussehen, wenn Cutout/Masken nicht hochwertig sind.',
    nextPrototype: 'Erst nach erfolgreichem AIRDOX-Letter-System wieder aufnehmen.',
    recommendation: 'naechste Woche',
  },
];

const renderConceptBoard = (direction, index) => {
  const accent = [palette.cyan, palette.pink, palette.lime, '#37f5ff', '#ff3fc5'][index % 5];
  const yBase = 680;
  const blockRows = Array.from({ length: 6 }, (_, row) => {
    const x = 138 + row * 136;
    const h = 90 + ((row * 37) % 120);
    return `<rect x="${x}" y="${yBase - h}" width="92" height="${h}" fill="${row % 2 ? palette.text : accent}" opacity="${row % 2 ? 0.9 : 1}"/>
    <rect x="${x + 18}" y="${yBase - h - 34}" width="74" height="24" fill="${palette.bg}" stroke="${accent}" stroke-width="3"/>`;
  }).join('\n    ');
  const shardRows = Array.from({ length: 14 }, (_, shard) => {
    const x = 84 + ((shard * 71) % 900);
    const y = 880 + ((shard * 43) % 250);
    const w = 42 + ((shard * 13) % 96);
    const rotate = -18 + ((shard * 11) % 36);
    const color = shard % 3 === 0 ? palette.cyan : shard % 3 === 1 ? palette.pink : palette.lime;
    return `<rect x="${x}" y="${y}" width="${w}" height="18" fill="${color}" opacity="0.78" transform="rotate(${rotate} ${x} ${y})"/>`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" role="img" aria-label="${escapeXml(direction.title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg}"/>
      <stop offset="55%" stop-color="${palette.surface}"/>
      <stop offset="100%" stop-color="${palette.bg}"/>
    </linearGradient>
    <pattern id="scan" width="1" height="8" patternUnits="userSpaceOnUse">
      <rect width="1" height="1" fill="${palette.text}" opacity="0.08"/>
    </pattern>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <rect width="1080" height="1350" fill="url(#scan)"/>
  <path d="M80 92 H1000 M80 1250 H1000 M80 92 V260 M1000 92 V260 M80 1080 V1250 M1000 1080 V1250" fill="none" stroke="${palette.border}" stroke-width="2"/>
  <text x="80" y="158" font-family="Arial, sans-serif" font-size="27" font-weight="900" fill="${accent}">DESIGNER PORTFOLIO</text>
  <text x="80" y="214" font-family="Arial, sans-serif" font-size="50" font-weight="900" fill="${palette.text}">${escapeXml(direction.title)}</text>
  <text x="80" y="272" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="${palette.muted}">${escapeXml(campaign.set)} / ${escapeXml(campaign.hook)}</text>
  <rect x="80" y="360" width="920" height="410" fill="${palette.bg}" stroke="${palette.border}" stroke-width="2"/>
  ${blockRows}
  <text x="540" y="728" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="88" font-weight="900" fill="${palette.text}" opacity="0.18">AIRDOX BUILDS HERE</text>
  ${shardRows}
  <rect x="80" y="1178" width="920" height="72" fill="${accent}"/>
  <text x="540" y="1225" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="${palette.bg}">${escapeXml(direction.recommendation.toUpperCase())}</text>
</svg>`;
};

mkdirSync(outputDir, { recursive: true });

const boards = directions.map((direction, index) => {
  const filePath = join(outputDir, `${String(index + 1).padStart(2, '0')}-${direction.id}.svg`);
  writeFileSync(filePath, renderConceptBoard(direction, index));
  return {
    directionId: direction.id,
    path: toRepoPath(filePath),
  };
});

const report = {
  generatedAt,
  agent: 'Designer',
  job: 'designer-social-portfolio',
  batchId,
  campaign,
  operatingRule: 'Proactive portfolio first: Designer must keep selectable visual directions ready before Manni asks for a final render.',
  hardExclusions: [
    'No normal AIRDOX font line as central logo.',
    'No reuse of the rejected clean graffiti logo direction as final visual language.',
    'No external publishing or live posting from this job.',
  ],
  references,
  directions,
  boards,
  nextAction: 'Build only short visual prototypes from approved directions; do not produce a 60s final or upload without user OK.',
};

const renderMarkdown = () => {
  const lines = [
    '# AIRDOX Designer Portfolio',
    '',
    `Generated: ${generatedAt}`,
    `Agent: Designer`,
    `Batch: ${batchId}`,
    `Campaign: ${campaign.set}`,
    `Hook: ${campaign.hook}`,
    '',
    '## Operating Rule',
    '',
    'Designer must proactively keep a selectable visual portfolio ready. Manni should not have to ask for basic design alternatives after a campaign hook is already known.',
    '',
    '## Hard Exclusions',
    '',
    ...report.hardExclusions.map((item) => `- ${item}`),
    '',
    '## Required On-Screen Message',
    '',
    ...campaign.requiredText.map((item) => `- ${item}`),
    '',
    '## Visual Directions',
    '',
    ...directions.flatMap((direction, index) => [
      `### ${index + 1}. ${direction.title}`,
      '',
      `- Status: ${direction.status}`,
      `- Intent: ${direction.intent}`,
      `- First frame: ${direction.firstFrame}`,
      `- Motion: ${direction.motion}`,
      `- Typography rule: ${direction.typographyRule}`,
      `- Source use: ${direction.sourceUse}`,
      `- Risk: ${direction.risk}`,
      `- Next prototype: ${direction.nextPrototype}`,
      `- Recommendation: ${direction.recommendation}`,
      `- Concept board: \`${boards[index].path}\``,
      '',
    ]),
    '## Reference Pools',
    '',
    'Daumenkino public assets:',
    '',
    ...references.daumenkinoPublic.map((item) => `- \`${item}\``),
    '',
    'Daumenkino scratch/contact assets:',
    '',
    ...references.daumenkinoScratch.map((item) => `- \`${item}\``),
    '',
    '## Next Action',
    '',
    report.nextAction,
    '',
  ];
  return `${lines.join('\n')}\n`;
};

writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(reportMdPath, renderMarkdown());

process.stdout.write([
  'Designer Portfolio Generator: DONE',
  `Batch: ${batchId}`,
  `Directions: ${directions.length}`,
  `Boards: ${boards.length}`,
  `Report: ${toRepoPath(reportMdPath)}`,
].join('\n'));
process.stdout.write('\n');
