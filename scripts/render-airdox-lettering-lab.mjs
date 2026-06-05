#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outDir = join(root, 'docs', 'agent-system', 'lettering-lab', 'airdox-2026-06-02');
mkdirSync(outDir, { recursive: true });

const W = 1600;
const H = 560;
const colors = {
  bg: '#050608',
  paper: '#f5f8ff',
  cyan: '#00f0ff',
  pink: '#ff00aa',
  lime: '#9adf6b',
  muted: '#9aa6b2',
  ink: '#02030a',
  red: '#ff3d4d',
  amber: '#ffc857',
};

const esc = (value) => String(value).replace(/[&<>"]/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}[char]));

const defs = () => `
  <defs>
    <filter id="paperNoise" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="12"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.18"/>
      </feComponentTransfer>
      <feBlend mode="screen" in2="SourceGraphic"/>
    </filter>
    <filter id="rough" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="12"/>
    </filter>
    <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="13" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="chrome" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.22" stop-color="#00f0ff"/>
      <stop offset="0.48" stop-color="#10131b"/>
      <stop offset="0.68" stop-color="#ff00aa"/>
      <stop offset="1" stop-color="#f5f8ff"/>
    </linearGradient>
    <pattern id="dotgrid" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="2" fill="${colors.cyan}" opacity="0.23"/>
    </pattern>
  </defs>`;

const path = (d, attrs = '') => `<path d="${d}" ${attrs}/>`;
const poly = (points, attrs = '') => `<polygon points="${points}" ${attrs}/>`;
const rect = (x, y, width, height, attrs = '') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${attrs}/>`;
const circle = (cx, cy, r, attrs = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs}/>`;

const letter = {
  A: 'M20 370 L96 35 L183 35 L265 370 L194 370 L178 304 L84 304 L66 370 Z M101 238 L160 238 L130 108 Z',
  I: 'M34 35 L174 35 L162 96 L122 96 L105 310 L154 310 L140 370 L0 370 L12 310 L52 310 L70 96 L20 96 Z',
  R: 'M18 370 L54 35 L184 35 C255 35 286 78 274 137 C265 184 234 209 196 220 L258 370 L179 370 L128 234 L94 234 L79 370 Z M106 96 L96 178 L162 178 C196 178 213 162 217 136 C222 108 207 96 174 96 Z',
  D: 'M20 370 L56 35 L172 35 C272 35 328 102 318 198 C307 302 236 370 134 370 Z M109 101 L84 304 L139 304 C198 304 241 264 249 197 C257 133 223 101 166 101 Z',
  O: 'M28 200 C42 82 116 25 221 35 C323 45 370 116 356 226 C342 330 270 385 169 373 C68 362 15 299 28 200 Z M99 205 C91 269 124 307 178 313 C234 319 275 284 284 221 C292 158 261 112 212 107 C154 101 107 139 99 205 Z',
  X: 'M32 35 L116 35 L181 142 L259 35 L338 35 L220 188 L324 370 L235 370 L168 248 L76 370 L-2 370 L126 203 Z',
};

const layout = [
  ['A', 0, 1.06],
  ['I', 250, 1.02],
  ['R', 390, 1.02],
  ['D', 650, 1.02],
  ['O', 920, 1.0],
  ['X', 1215, 1.04],
];

const wordPaths = ({ fill = colors.paper, stroke = colors.ink, strokeWidth = 16, filter = '', transform = '', extra = '' }) => `
  <g transform="translate(82 92) ${transform}" ${filter ? `filter="${filter}"` : ''}>
    ${layout.map(([key, x, scale]) => `
      <g transform="translate(${x} 0) scale(${scale})">
        ${path(letter[key], `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" fill-rule="evenodd"`)}
      </g>
    `).join('')}
    ${extra}
  </g>`;

const stencilCuts = () => `
  <g fill="${colors.bg}" opacity="0.95">
    ${rect(160, 206, 1350, 26, 'transform="rotate(-3 160 206)"')}
    ${rect(120, 332, 1420, 18, 'transform="rotate(2 120 332)"')}
    ${rect(620, 62, 54, 360, 'transform="rotate(9 620 62)"')}
    ${rect(1030, 44, 42, 380, 'transform="rotate(-11 1030 44)"')}
  </g>`;

const splatter = (count, color, opacity = 0.55) => Array.from({ length: count }, (_, i) => {
  const cx = 70 + ((i * 197) % 1470);
  const cy = 42 + ((i * 89) % 470);
  const r = 3 + ((i * 17) % 18);
  return circle(cx, cy, r, `fill="${color}" opacity="${opacity * (0.35 + (i % 6) / 9)}"`);
}).join('\n');

const arrows = (color = colors.lime) => `
  <g fill="${color}" stroke="${colors.ink}" stroke-width="12" stroke-linejoin="round">
    ${poly('210,380 282,332 250,430')}
    ${poly('520,68 624,42 582,124')}
    ${poly('850,326 952,276 908,390')}
    ${poly('1236,80 1322,42 1304,132')}
    ${poly('1450,382 1532,330 1502,444')}
  </g>`;

const variantFrame = ({ id, title, subtitle, body }) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="AIRDOX lettering study ${esc(title)}">
  ${defs()}
  <rect width="100%" height="100%" fill="${colors.bg}"/>
  <rect width="100%" height="100%" fill="url(#dotgrid)" opacity="0.25"/>
  <g font-family="Inter, Arial, sans-serif" letter-spacing="0">
    <text x="52" y="54" fill="${colors.muted}" font-size="21" font-weight="800">${esc(id)} / ${esc(title)}</text>
    <text x="52" y="526" fill="${colors.muted}" font-size="20" font-weight="700">${esc(subtitle)}</text>
  </g>
  ${body}
</svg>`;

const variants = [
  {
    id: '01',
    slug: 'berlin-stencil-break',
    title: 'Berlin Stencil Break',
    subtitle: 'Sharp stencil skeleton, hard cuts, useful for industrial poster motion.',
    svg: variantFrame({
      id: '01',
      title: 'Berlin Stencil Break',
      subtitle: 'Sharp stencil skeleton, hard cuts, useful for industrial poster motion.',
      body: `
        <g transform="translate(10 0)">
          ${wordPaths({ fill: colors.paper, stroke: colors.ink, strokeWidth: 22 })}
          ${stencilCuts()}
          ${rect(52, 84, 1494, 412, 'fill="none" stroke="#263241" stroke-width="3"')}
          ${rect(82, 446, 380, 18, `fill="${colors.cyan}"`)}
          ${rect(1076, 76, 270, 18, `fill="${colors.pink}"`)}
        </g>`,
    }),
  },
  {
    id: '02',
    slug: 'wildline-marker-pressure',
    title: 'Wildline Marker Pressure',
    subtitle: 'Hand-marker direction with overdraw, arrows, imperfect pressure.',
    svg: variantFrame({
      id: '02',
      title: 'Wildline Marker Pressure',
      subtitle: 'Hand-marker direction with overdraw, arrows, imperfect pressure.',
      body: `
        ${wordPaths({ fill: '#f9fbff', stroke: colors.ink, strokeWidth: 28, filter: 'url(#rough)', transform: 'rotate(-3 760 230)' })}
        <g opacity="0.92" transform="translate(82 92) rotate(-3 760 230)">
          ${layout.map(([key, x, scale], i) => `<g transform="translate(${x + 8} ${10 + (i % 2) * 8}) scale(${scale})">${path(letter[key], `fill="none" stroke="${i % 2 ? colors.pink : colors.cyan}" stroke-width="14" stroke-linejoin="round" opacity="0.85"`)} </g>`).join('')}
        </g>
        ${arrows(colors.lime)}
        ${splatter(42, colors.pink, 0.46)}
        ${splatter(28, colors.cyan, 0.38)}`,
    }),
  },
  {
    id: '03',
    slug: 'tape-cut-industrial',
    title: 'Tape Cut Industrial',
    subtitle: 'Letters assembled from torn tape blocks, strong for beat-by-beat build animations.',
    svg: variantFrame({
      id: '03',
      title: 'Tape Cut Industrial',
      subtitle: 'Letters assembled from torn tape blocks, strong for beat-by-beat build animations.',
      body: `
        <g transform="translate(95 118) rotate(1 720 200)">
          ${layout.map(([key, x], i) => `
            <g transform="translate(${x} ${i % 2 ? -12 : 14}) skewX(${i % 2 ? -6 : 4})">
              ${path(letter[key], `fill="${i % 3 === 0 ? colors.cyan : i % 3 === 1 ? colors.paper : colors.pink}" stroke="${colors.ink}" stroke-width="18" stroke-linejoin="round" fill-rule="evenodd"`)}
              ${rect(12, 110, 310, 28, `fill="${colors.ink}" opacity="0.85" transform="rotate(${i % 2 ? -8 : 7} 12 110)"`)}
              ${rect(32, 252, 280, 18, `fill="${colors.bg}" opacity="0.8" transform="rotate(${i % 2 ? 5 : -4} 32 252)"`)}
            </g>`).join('')}
        </g>
        ${rect(60, 78, 520, 42, `fill="${colors.lime}" transform="rotate(-4 60 78)"`)}
        ${rect(1020, 430, 500, 46, `fill="${colors.paper}" transform="rotate(3 1020 430)"`)}`,
    }),
  },
  {
    id: '04',
    slug: 'chrome-bubble-skeleton',
    title: 'Chrome Bubble Skeleton',
    subtitle: 'Bigger graffiti mass, chrome body, but with curated AIRDOX readability.',
    svg: variantFrame({
      id: '04',
      title: 'Chrome Bubble Skeleton',
      subtitle: 'Bigger graffiti mass, chrome body, but with curated AIRDOX readability.',
      body: `
        ${wordPaths({ fill: 'url(#chrome)', stroke: colors.ink, strokeWidth: 34, filter: 'url(#glow)', transform: 'translate(0 12) scale(1.02 1.08)' })}
        ${wordPaths({ fill: 'none', stroke: colors.paper, strokeWidth: 5, transform: 'translate(0 12) scale(1.02 1.08)' })}
        ${arrows(colors.lime)}
        ${rect(80, 420, 1400, 16, `fill="${colors.cyan}" opacity="0.76" transform="rotate(-2 80 420)"`)}`,
    }),
  },
  {
    id: '05',
    slug: 'broken-neon-sign',
    title: 'Broken Neon Sign',
    subtitle: 'AIRDOX as a damaged club sign: missing tubes, glow hits, readable silhouette.',
    svg: variantFrame({
      id: '05',
      title: 'Broken Neon Sign',
      subtitle: 'AIRDOX as a damaged club sign: missing tubes, glow hits, readable silhouette.',
      body: `
        <g opacity="0.98">
          ${wordPaths({ fill: 'none', stroke: colors.cyan, strokeWidth: 22, filter: 'url(#glow)', transform: 'translate(0 20)' })}
          ${wordPaths({ fill: 'none', stroke: colors.paper, strokeWidth: 7, transform: 'translate(0 20)' })}
          ${rect(198, 164, 210, 26, `fill="${colors.bg}" transform="rotate(-9 198 164)"`)}
          ${rect(704, 340, 260, 22, `fill="${colors.bg}" transform="rotate(4 704 340)"`)}
          ${rect(1135, 122, 240, 30, `fill="${colors.bg}" transform="rotate(-6 1135 122)"`)}
        </g>
        ${splatter(18, colors.cyan, 0.5)}
        ${rect(100, 448, 680, 14, `fill="${colors.pink}" opacity="0.82"`)}
        ${rect(910, 448, 390, 14, `fill="${colors.lime}" opacity="0.82"`)}`,
    }),
  },
  {
    id: '06',
    slug: 'spray-skeleton-raw',
    title: 'Spray Skeleton Raw',
    subtitle: 'Wireframe outline, overspray field, meant for Photoshop cleanup and mask work.',
    svg: variantFrame({
      id: '06',
      title: 'Spray Skeleton Raw',
      subtitle: 'Wireframe outline, overspray field, meant for Photoshop cleanup and mask work.',
      body: `
        ${splatter(120, colors.paper, 0.22)}
        ${splatter(80, colors.pink, 0.2)}
        ${wordPaths({ fill: 'rgba(5,6,8,0.42)', stroke: colors.paper, strokeWidth: 26, filter: 'url(#rough)', transform: 'rotate(2 760 230)' })}
        ${wordPaths({ fill: 'none', stroke: colors.cyan, strokeWidth: 6, transform: 'rotate(2 760 230) translate(8 -8)' })}
        ${arrows(colors.pink)}`,
    }),
  },
  {
    id: '07',
    slug: 'x-lock-block-assembly',
    title: 'X-Lock Block Assembly',
    subtitle: 'Modular letters that can assemble on beat; X gets its own final lock.',
    svg: variantFrame({
      id: '07',
      title: 'X-Lock Block Assembly',
      subtitle: 'Modular letters that can assemble on beat; X gets its own final lock.',
      body: `
        <g transform="translate(84 104)">
          ${layout.map(([key, x, scale], i) => `
            <g transform="translate(${x} 0) scale(${scale})">
              ${path(letter[key], `fill="${colors.paper}" stroke="${colors.ink}" stroke-width="18" stroke-linejoin="round" fill-rule="evenodd"`)}
              ${Array.from({ length: 5 }, (_, j) => rect(10 + j * 54, 44 + ((i + j) % 5) * 58, 42, 34, `fill="${j % 2 ? colors.cyan : colors.pink}" opacity="0.78"`)).join('')}
            </g>`).join('')}
        </g>
        ${rect(1240, 78, 230, 58, `fill="${colors.lime}" transform="rotate(6 1240 78)"`)}
        ${rect(1280, 150, 180, 20, `fill="${colors.paper}" transform="rotate(-8 1280 150)"`)}
        ${rect(105, 450, 1320, 22, `fill="${colors.cyan}" opacity="0.74"`)}
        ${rect(105, 476, 1320, 10, `fill="${colors.pink}" opacity="0.74"`)}`,
    }),
  },
  {
    id: '08',
    slug: 'acid-poster-slash',
    title: 'Acid Poster Slash',
    subtitle: 'Club flyer version: slash composition, aggressive negative space, less sticker-like.',
    svg: variantFrame({
      id: '08',
      title: 'Acid Poster Slash',
      subtitle: 'Club flyer version: slash composition, aggressive negative space, less sticker-like.',
      body: `
        ${rect(-60, 100, 1740, 160, `fill="${colors.lime}" transform="rotate(-8 800 180)"`)}
        ${rect(-80, 270, 1760, 126, `fill="${colors.pink}" transform="rotate(5 800 330)"`)}
        ${wordPaths({ fill: colors.bg, stroke: colors.paper, strokeWidth: 14, transform: 'rotate(-5 760 230) translate(0 22)' })}
        ${wordPaths({ fill: 'none', stroke: colors.cyan, strokeWidth: 7, transform: 'rotate(-5 760 230) translate(16 2)' })}
        ${stencilCuts()}
        ${splatter(36, colors.bg, 0.5)}`,
    }),
  },
];

const writeHtml = () => {
  const cards = variants.map((variant) => `
    <article>
      <img src="./${variant.slug}.svg" alt="AIRDOX ${esc(variant.title)}" />
      <h2>${variant.id}. ${esc(variant.title)}</h2>
      <p>${esc(variant.subtitle)}</p>
    </article>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AIRDOX Lettering Lab</title>
  <style>
    body { margin: 0; background: ${colors.bg}; color: ${colors.paper}; font-family: Inter, Arial, sans-serif; }
    main { padding: 28px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
    article { border: 1px solid #263241; background: #0f141a; padding: 14px; }
    img { width: 100%; display: block; background: ${colors.bg}; }
    h1 { margin: 28px 28px 0; font-size: 32px; }
    h2 { font-size: 18px; margin: 12px 0 6px; }
    p { margin: 0 0 4px; color: ${colors.muted}; font-size: 14px; }
  </style>
</head>
<body>
  <h1>AIRDOX Lettering Lab / 2026-06-02</h1>
  <main>${cards}</main>
</body>
</html>`;
};

const render = async () => {
  const manifest = [];
  for (const variant of variants) {
    const svgPath = join(outDir, `${variant.slug}.svg`);
    const pngPath = join(outDir, `${variant.slug}.png`);
    writeFileSync(svgPath, variant.svg, 'utf8');
    await sharp(Buffer.from(variant.svg)).png().toFile(pngPath);
    manifest.push({
      id: variant.id,
      slug: variant.slug,
      title: variant.title,
      subtitle: variant.subtitle,
      svg: relative(root, svgPath).replaceAll('\\', '/'),
      png: relative(root, pngPath).replaceAll('\\', '/'),
    });
  }

  const thumbW = 720;
  const thumbH = 252;
  const gap = 26;
  const labelH = 64;
  const sheetW = thumbW * 2 + gap * 3;
  const sheetH = (thumbH + labelH) * 4 + gap * 5;
  const composites = [];

  for (const [index, variant] of variants.entries()) {
    const x = gap + (index % 2) * (thumbW + gap);
    const y = gap + Math.floor(index / 2) * (thumbH + labelH + gap);
    const png = await sharp(join(outDir, `${variant.slug}.png`)).resize(thumbW, thumbH).png().toBuffer();
    const labelSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${thumbW}" height="${labelH}">
      <rect width="100%" height="100%" fill="#0f141a"/>
      <text x="0" y="25" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="900" fill="${colors.paper}">${esc(`${variant.id}. ${variant.title}`)}</text>
      <text x="0" y="50" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700" fill="${colors.muted}">${esc(variant.subtitle)}</text>
    </svg>`;
    composites.push({ input: png, left: x, top: y });
    composites.push({ input: Buffer.from(labelSvg), left: x, top: y + thumbH + 8 });
  }

  const contactPath = join(outDir, 'contact-sheet.png');
  await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 4,
      background: colors.bg,
    },
  }).composite(composites).png().toFile(contactPath);

  const htmlPath = join(outDir, 'index.html');
  const manifestPath = join(outDir, 'manifest.json');
  writeFileSync(htmlPath, writeHtml(), 'utf8');
  writeFileSync(manifestPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    objective: 'AIRDOX custom lettering exploration, not normal fonts',
    rule: 'Main AIRDOX wordmarks are built from SVG paths and polygons.',
    outputs: {
      contactSheet: relative(root, contactPath).replaceAll('\\', '/'),
      html: relative(root, htmlPath).replaceAll('\\', '/'),
    },
    variants: manifest,
  }, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${variants.length} AIRDOX lettering variants`);
  console.log(relative(root, contactPath).replaceAll('\\', '/'));
  console.log(relative(root, htmlPath).replaceAll('\\', '/'));
};

render().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
