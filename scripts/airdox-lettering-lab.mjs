import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const version = 'v2026-06-02';
const outDir = path.join(root, 'public', 'brand-assets', 'lettering-lab', version);
const W = 1800;
const H = 720;

const palette = {
  bg: '#050608',
  ink: '#020309',
  paper: '#f5f8ff',
  cyan: '#00f0ff',
  pink: '#ff00aa',
  lime: '#9adf6b',
  muted: '#9aa6b2',
  border: '#263241',
};

const letters = {
  A: {
    width: 210,
    body: 'M16 300 L82 20 L154 20 L206 300 L152 300 L140 238 L70 238 L56 300 Z M83 186 L129 186 L107 82 Z',
    cuts: ['M82 206 L135 206 L129 226 L74 226 Z'],
  },
  I: {
    width: 120,
    body: 'M20 28 L112 12 L102 64 L80 66 L66 246 L96 244 L84 300 L6 300 L18 248 L40 248 L54 70 L24 74 Z',
    cuts: ['M49 84 L68 80 L55 234 L36 238 Z'],
  },
  R: {
    width: 210,
    body: 'M18 300 L44 22 L136 18 C190 22 210 56 202 104 C196 144 170 168 134 174 L202 300 L140 300 L91 190 L76 300 Z M92 70 L84 136 L124 134 C146 132 158 116 160 96 C162 76 150 68 128 66 Z',
    cuts: ['M91 80 L128 78 C142 78 148 86 146 99 C144 113 134 121 114 122 L86 123 Z'],
  },
  D: {
    width: 230,
    body: 'M18 300 L46 24 L126 18 C194 14 226 58 218 134 L210 190 C202 254 158 300 88 300 Z M93 72 L76 246 L106 246 C140 246 158 222 164 180 L171 126 C176 88 160 68 124 70 Z',
    cuts: ['M101 88 L123 86 C145 86 155 100 153 128 L146 180 C142 208 128 226 106 228 L96 228 Z'],
  },
  O: {
    width: 230,
    body: 'M116 16 C182 16 224 58 224 128 L214 194 C204 264 156 306 88 306 C32 306 0 268 6 210 L16 98 C22 44 58 16 116 16 Z M113 76 C84 76 68 94 64 128 L56 200 C52 232 68 248 96 248 C126 248 146 226 151 188 L158 132 C162 96 146 76 113 76 Z',
    cuts: ['M112 96 C135 96 143 112 140 138 L134 184 C130 210 118 228 98 228 C78 228 69 214 72 190 L79 130 C82 110 94 96 112 96 Z'],
  },
  X: {
    width: 230,
    body: 'M0 300 L82 148 L32 22 L96 22 L126 98 L176 22 L228 22 L151 148 L214 300 L150 300 L116 218 L64 300 Z',
    cuts: ['M95 152 L121 118 L136 154 L111 190 Z'],
  },
};

const variants = [
  {
    id: '01-stencil-pressure',
    title: 'Stencil Pressure',
    note: 'Industrial cut letterforms, strong D/O counters, usable for hard techno drops.',
    fill: palette.paper,
    stroke: palette.ink,
    shadow: palette.cyan,
    accent: palette.pink,
    mode: 'stencil',
    skew: -6,
  },
  {
    id: '02-marker-burn',
    title: 'Marker Burn',
    note: 'Hand-marker weight with uneven slant and scratched negative space.',
    fill: palette.paper,
    stroke: palette.ink,
    shadow: palette.pink,
    accent: palette.lime,
    mode: 'marker',
    skew: -12,
  },
  {
    id: '03-chrome-cuts',
    title: 'Chrome Cuts',
    note: 'Chrome-inspired chunky blocks with slash highlights, not a normal font.',
    fill: '#dbe4f6',
    stroke: palette.ink,
    shadow: palette.cyan,
    accent: palette.pink,
    mode: 'chrome',
    skew: 4,
  },
  {
    id: '04-tape-wild',
    title: 'Tape Wild',
    note: 'Letter pieces behave like torn club tape: aggressive but still readable.',
    fill: palette.paper,
    stroke: palette.ink,
    shadow: palette.lime,
    accent: palette.pink,
    mode: 'tape',
    skew: -2,
  },
  {
    id: '05-broken-neon',
    title: 'Broken Neon',
    note: 'Open tube logic, gaps and sparks; good for light-gate motion.',
    fill: 'none',
    stroke: palette.cyan,
    shadow: palette.pink,
    accent: palette.paper,
    mode: 'neon',
    skew: 0,
  },
  {
    id: '06-block-assembly',
    title: 'Block Assembly',
    note: 'Modular blocks built for Remotion letter-by-letter construction.',
    fill: palette.paper,
    stroke: palette.ink,
    shadow: palette.pink,
    accent: palette.cyan,
    mode: 'block',
    skew: 0,
  },
  {
    id: '07-spray-skeleton',
    title: 'Spray Skeleton',
    note: 'Outline-first graffiti skeleton with corner arrows and mist fields.',
    fill: palette.bg,
    stroke: palette.paper,
    shadow: palette.cyan,
    accent: palette.lime,
    mode: 'spray',
    skew: -8,
  },
  {
    id: '08-ripped-poster',
    title: 'Ripped Poster',
    note: 'Paste-up letter fragments, rough enough for Photoshop distress passes.',
    fill: palette.paper,
    stroke: palette.ink,
    shadow: palette.cyan,
    accent: palette.pink,
    mode: 'poster',
    skew: 3,
  },
];

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}[char]));

const svg = (body, width = W, height = H) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
${body}
</svg>
`;

const bg = (width = W, height = H) => `
  <rect width="${width}" height="${height}" fill="${palette.bg}"/>
  <path d="M0 560 C320 500 510 620 880 540 S1410 480 1800 548" fill="none" stroke="${palette.border}" stroke-width="2" opacity="0.75"/>
  ${Array.from({ length: 34 }, (_, i) => `<rect x="${i * 58 - 20}" y="${70 + (i % 7) * 74}" width="${18 + (i % 4) * 12}" height="2" fill="${i % 3 === 0 ? palette.pink : palette.cyan}" opacity="0.24"/>`).join('\n  ')}
`;

const texture = (variant) => {
  if (variant.mode === 'spray') {
    return Array.from({ length: 90 }, (_, i) => {
      const x = (i * 97) % W;
      const y = 120 + ((i * 53) % 420);
      const r = 2 + (i % 9);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? variant.shadow : variant.accent}" opacity="${0.08 + (i % 5) * 0.018}"/>`;
    }).join('\n');
  }
  if (variant.mode === 'poster') {
    return Array.from({ length: 18 }, (_, i) => `<path d="M${i * 104 - 60} ${110 + (i % 5) * 82} l${80 + (i % 3) * 60} ${-28 + (i % 4) * 16}" stroke="${variant.accent}" stroke-width="${8 + (i % 4) * 3}" opacity="0.28"/>`).join('\n');
  }
  return Array.from({ length: 24 }, (_, i) => `<path d="M${i * 78} ${90 + (i % 6) * 86} h${28 + (i % 7) * 20}" stroke="${i % 2 ? variant.shadow : variant.accent}" stroke-width="3" opacity="0.18"/>`).join('\n');
};

const letterGroup = (char, variant, x, y, index) => {
  const def = letters[char];
  const rotate = variant.mode === 'marker' ? [-6, 4, -3, 5, -4, 6][index] : variant.mode === 'tape' ? [-9, 8, -5, 4, -7, 9][index] : 0;
  const scaleY = variant.mode === 'block' ? 1 + (index % 2) * 0.07 : 1;
  const translateY = variant.mode === 'tape' ? [12, -20, 5, -14, 18, -8][index] : 0;
  const strokeWidth = variant.mode === 'neon' ? 16 : variant.mode === 'spray' ? 12 : 10;
  const fill = variant.mode === 'neon' || variant.mode === 'spray' ? 'none' : variant.fill;
  const opacity = variant.mode === 'neon' ? '0.95' : '1';
  const cuts = variant.mode === 'neon' ? '' : def.cuts.map((d) => `<path d="${d}" fill="${variant.mode === 'chrome' ? variant.accent : palette.bg}" opacity="${variant.mode === 'marker' ? 0.86 : 1}"/>`).join('\n      ');
  const highlights = variant.mode === 'chrome'
    ? `<path d="M32 46 L150 34 M54 104 L180 92 M48 236 L152 218" stroke="${palette.paper}" stroke-width="12" opacity="0.82" stroke-linecap="round"/>`
    : variant.mode === 'marker'
      ? `<path d="M26 258 C76 236 132 252 186 224" stroke="${variant.accent}" stroke-width="12" opacity="0.62" stroke-linecap="round"/>`
      : variant.mode === 'block'
        ? `<rect x="18" y="26" width="52" height="54" fill="${variant.accent}" opacity="0.88"/><rect x="126" y="230" width="54" height="46" fill="${variant.shadow}" opacity="0.78"/>`
        : '';
  const arrow = variant.mode === 'spray' || variant.mode === 'tape'
    ? `<path d="M${def.width - 26} 16 l54 18 l-42 36 z" fill="${variant.accent}" stroke="${palette.ink}" stroke-width="7"/>`
    : '';

  return `
    <g transform="translate(${x} ${y + translateY}) rotate(${rotate} ${def.width / 2} 150) skewX(${variant.skew}) scale(1 ${scaleY})">
      <path d="${def.body}" fill="none" stroke="${variant.shadow}" stroke-width="${strokeWidth + 15}" stroke-linejoin="round" opacity="0.82" transform="translate(18 18)"/>
      <path d="${def.body}" fill="${fill}" stroke="${variant.stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" opacity="${opacity}"/>
      ${cuts}
      ${highlights}
      ${arrow}
    </g>`;
};

const buildWord = (variant, startX = 95, startY = 210) => {
  let x = startX;
  return 'AIRDOX'.split('').map((char, index) => {
    const group = letterGroup(char, variant, x, startY, index);
    x += letters[char].width + (variant.mode === 'wild' ? -4 : 8);
    return group;
  }).join('\n');
};

const variantSvg = (variant) => svg(`
  ${bg()}
  <defs>
    <filter id="rough">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="8"/>
      <feDisplacementMap in="SourceGraphic" scale="${variant.mode === 'marker' || variant.mode === 'poster' ? 10 : 4}"/>
    </filter>
  </defs>
  ${texture(variant)}
  <g filter="url(#rough)">
    ${buildWord(variant)}
  </g>
  <path d="M82 604 L1560 604" stroke="${variant.accent}" stroke-width="8" opacity="0.78"/>
  <text x="92" y="656" fill="${palette.paper}" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800">${esc(variant.title)}</text>
  <text x="92" y="692" fill="${palette.muted}" font-family="Inter, Arial, sans-serif" font-size="24">${esc(variant.note)}</text>
  <text x="1590" y="656" fill="${variant.shadow}" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="900" text-anchor="end">AIRDOX.INFO</text>
`);

const tile = (variant, i) => {
  const x = 40 + (i % 2) * 900;
  const y = 40 + Math.floor(i / 2) * 410;
  const inner = variantSvg(variant)
    .replace(/<\?xml[^>]+>\n/, '')
    .replace(/<svg[^>]+>/, '')
    .replace('</svg>', '');
  return `<g transform="translate(${x} ${y}) scale(0.48)">
    <rect x="-12" y="-12" width="${W + 24}" height="${H + 24}" fill="${palette.bg}" stroke="${palette.border}" stroke-width="4"/>
    ${inner}
  </g>`;
};

const contactSheet = () => svg(`
  <rect width="1800" height="1740" fill="${palette.bg}"/>
  <text x="40" y="34" fill="${palette.paper}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900">AIRDOX LETTERING LAB / ${version}</text>
  ${variants.map(tile).join('\n')}
`, 1800, 1740);

const html = () => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AIRDOX Lettering Lab ${version}</title>
  <style>
    body { margin: 0; background: ${palette.bg}; color: ${palette.paper}; font-family: Inter, Arial, sans-serif; }
    main { max-width: 1240px; margin: 0 auto; padding: 32px; }
    h1 { font-size: 28px; margin: 0 0 8px; }
    p { color: ${palette.muted}; margin: 0 0 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; }
    a { color: inherit; text-decoration: none; border: 1px solid ${palette.border}; background: #0f141a; display: block; }
    img { display: block; width: 100%; height: auto; }
    span { display: block; padding: 12px 14px 14px; font-weight: 800; }
  </style>
</head>
<body>
  <main>
    <h1>AIRDOX Lettering Lab / ${version}</h1>
    <p>Vector roughs for custom AIRDOX lettering. The logo studies use SVG shapes, not normal font text.</p>
    <div class="grid">
      <a href="contact-sheet.svg"><img src="contact-sheet.svg" alt="AIRDOX lettering contact sheet"><span>Contact Sheet</span></a>
      ${variants.map((v) => `<a href="${v.id}.svg"><img src="${v.id}.svg" alt="${esc(v.title)}"><span>${esc(v.title)}</span></a>`).join('\n      ')}
    </div>
  </main>
</body>
</html>
`;

await fs.mkdir(outDir, { recursive: true });
await Promise.all(variants.map((variant) => fs.writeFile(path.join(outDir, `${variant.id}.svg`), variantSvg(variant), 'utf8')));
await fs.writeFile(path.join(outDir, 'contact-sheet.svg'), contactSheet(), 'utf8');
await fs.writeFile(path.join(outDir, 'index.html'), html(), 'utf8');
await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  version,
  purpose: 'AIRDOX custom lettering exploration; vector roughs for Photoshop/vector refinement and Remotion motion tests.',
  rule: 'AIRDOX wordmarks are built from SVG shapes, not normal font text. Captions and notes may use standard UI type.',
  variants: variants.map(({ id, title, note, mode }) => ({ id, title, note, mode, svg: `${id}.svg` })),
}, null, 2), 'utf8');

console.log(`Wrote ${variants.length} lettering variants to ${outDir}`);
