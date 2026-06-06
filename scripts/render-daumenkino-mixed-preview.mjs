import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, 'docs/agent-system/visual-templates/social/social-auto-output/daumenkino-preview/mixed-graffiti-portrait');
const logoPath = join(outDir, 'logo-source.png');
const bgPath = join(outDir, 'portrait-source.png');
const portraitCutoutPath = join(outDir, 'portrait-cutout.png');
const outPath = join(outDir, 'mixed-graffiti-portrait-preview.png');
const beatOutPath = join(outDir, 'mixed-graffiti-portrait-beat-invert-preview.gif');
const beatStillPath = join(outDir, 'mixed-graffiti-portrait-beat-invert-still.png');
const letterBeatOutPath = join(outDir, 'mixed-graffiti-portrait-letter-beat-preview.gif');
const letterBeatStillPath = join(outDir, 'mixed-graffiti-portrait-letter-beat-still.png');
const alphaPath = join(outDir, 'airdox-logo-extracted-alpha-preview.png');

const W = 626;
const H = 502;

function hexToRgb(hex) {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

async function makeColoredLayer(sourcePng, hex, blur = 0, opacity = 1) {
  const meta = await sharp(sourcePng).metadata();
  const alpha = await sharp(sourcePng).ensureAlpha().extractChannel('alpha').raw().toBuffer();
  const { r, g, b } = hexToRgb(hex);
  const rgba = Buffer.alloc(meta.width * meta.height * 4);

  for (let i = 0; i < meta.width * meta.height; i += 1) {
    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = Math.round(alpha[i] * opacity);
  }

  let layer = sharp(rgba, { raw: { width: meta.width, height: meta.height, channels: 4 } });
  if (blur > 0) layer = layer.blur(blur);
  return layer.png().toBuffer();
}

async function makeLetterBeatLayer(sourcePng, beatIndex, inverted = false) {
  const meta = await sharp(sourcePng).metadata();
  const alpha = await sharp(sourcePng).ensureAlpha().extractChannel('alpha').raw().toBuffer();
  const colors = ['#9adf6b', '#ff00aa', '#00f0ff', '#b6ff4f', '#ff3fc5', '#37f5ff'];
  const zones = [
    [0.00, 0.18],
    [0.14, 0.32],
    [0.28, 0.47],
    [0.43, 0.64],
    [0.58, 0.80],
    [0.76, 1.00],
  ];
  const active = beatIndex % zones.length;
  const activeColor = hexToRgb(colors[active]);
  const base = hexToRgb(inverted ? '#050608' : '#f5f8ff');
  const rgba = Buffer.alloc(meta.width * meta.height * 4);

  for (let y = 0; y < meta.height; y += 1) {
    for (let x = 0; x < meta.width; x += 1) {
      const i = y * meta.width + x;
      const relativeX = x / Math.max(1, meta.width - 1);
      const [start, end] = zones[active];
      const center = (start + end) / 2;
      const width = (end - start) / 2;
      const distance = Math.abs(relativeX - center) / width;
      const activeMix = Math.max(0, Math.min(1, 1 - distance));
      const pulse = activeMix ** 0.72;
      const r = Math.round(base.r * (1 - pulse) + activeColor.r * pulse);
      const g = Math.round(base.g * (1 - pulse) + activeColor.g * pulse);
      const b = Math.round(base.b * (1 - pulse) + activeColor.b * pulse);

      rgba[i * 4] = r;
      rgba[i * 4 + 1] = g;
      rgba[i * 4 + 2] = b;
      rgba[i * 4 + 3] = alpha[i];
    }
  }

  return sharp(rgba, { raw: { width: meta.width, height: meta.height, channels: 4 } }).png().toBuffer();
}

async function preservePortraitOnWhite(backgroundBase) {
  if (existsSync(portraitCutoutPath)) {
    const meta = await sharp(backgroundBase).metadata();
    const portrait = await sharp(portraitCutoutPath)
      .resize(meta.width, meta.height, { fit: 'cover' })
      .png()
      .toBuffer();

    return sharp({
      create: {
        width: meta.width,
        height: meta.height,
        channels: 4,
        background: '#f5f8ff',
      },
    })
      .composite([{ input: portrait, left: 0, top: 0, blend: 'over' }])
      .png()
      .toBuffer();
  }

  const image = sharp(backgroundBase).ensureAlpha();
  const meta = await image.metadata();
  const { data } = await image.raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(meta.width * meta.height * 4);

  for (let y = 0; y < meta.height; y += 1) {
    for (let x = 0; x < meta.width; x += 1) {
      const i = (y * meta.width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max - min;
      const head = 1 - Math.min(1, Math.hypot((x - meta.width * 0.5) / (meta.width * 0.32), (y - meta.height * 0.36) / (meta.height * 0.42)));
      const torso = 1 - Math.min(1, Math.hypot((x - meta.width * 0.5) / (meta.width * 0.42), (y - meta.height * 0.72) / (meta.height * 0.34)));
      const portraitWeight = Math.max(head, torso * 0.84);
      const detailWeight = (saturation > 22 || luma > 46) && y < meta.height * 0.9 ? 0.42 : 0;
      const alpha = Math.min(255, Math.round(Math.max(portraitWeight ** 0.42, detailWeight) * 255));

      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = alpha;
    }
  }

  const portrait = await sharp(rgba, { raw: { width: meta.width, height: meta.height, channels: 4 } })
    .blur(0.35)
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 4,
      background: '#f5f8ff',
    },
  })
    .composite([{ input: portrait, left: 0, top: 0, blend: 'over' }])
    .png()
    .toBuffer();
}

async function extractCentralGraffitiLogo() {
  const logoImage = sharp(logoPath).ensureAlpha();
  const meta = await logoImage.metadata();
  const { data } = await logoImage.raw().toBuffer({ resolveWithObject: true });
  let minX = meta.width;
  let minY = meta.height;
  let maxX = 0;
  let maxY = 0;

  // Ignore the lower part of the reference GIF; it contains a separate marker and dust.
  const searchTop = Math.floor(meta.height * 0.24);
  const searchBottom = Math.floor(meta.height * 0.74);
  const searchLeft = Math.floor(meta.width * 0.12);
  const searchRight = Math.floor(meta.width * 0.84);
  for (let y = searchTop; y < searchBottom; y += 1) {
    for (let x = searchLeft; x < searchRight; x += 1) {
      const i = (y * meta.width + x) * 4;
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (luma > 68) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const pad = 18;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const crop = {
    left,
    top,
    width: Math.min(meta.width - left, maxX - minX + pad * 2),
    height: Math.min(meta.height - top, maxY - minY + pad * 2),
  };

  const cropped = await sharp(logoPath).extract(crop).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cw = cropped.info.width;
  const ch = cropped.info.height;
  const rgba = Buffer.alloc(cw * ch * 4);

  for (let y = 0; y < ch; y += 1) {
    for (let x = 0; x < cw; x += 1) {
      const i = (y * cw + x) * 4;
      const r = cropped.data[i];
      const g = cropped.data[i + 1];
      const b = cropped.data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const alpha = luma < 58 ? 0 : Math.max(0, Math.min(255, Math.round((luma - 58) * 3.4)));
      rgba[i] = 245;
      rgba[i + 1] = 248;
      rgba[i + 2] = 255;
      rgba[i + 3] = alpha;
    }
  }

  const extracted = await sharp(rgba, { raw: { width: cw, height: ch, channels: 4 } })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
    .png()
    .toBuffer();

  await sharp(extracted).png().toFile(alphaPath);
  return sharp(extracted).resize({ width: 470 }).png().toBuffer();
}

async function renderFrame({
  inverted = false,
  outline = '#ff00aa',
  framePath = outPath,
  letterBeat = false,
  beatIndex = 0,
} = {}) {
  await mkdir(outDir, { recursive: true });

  const logo = await extractCentralGraffitiLogo();
  const logoMeta = await sharp(logo).metadata();
  const x = Math.round((W - logoMeta.width) / 2);
  const y = 188;

  const bgMeta = await sharp(bgPath).metadata();
  const portraitCropWidth = Math.min(bgMeta.width, Math.round(bgMeta.width * 0.64));
  const portraitCropLeft = Math.max(0, Math.round((bgMeta.width - portraitCropWidth) / 2));
  const backgroundBase = await sharp(bgPath)
    .extract({ left: portraitCropLeft, top: 0, width: portraitCropWidth, height: bgMeta.height })
    .resize(W, H, { fit: 'cover' })
    .modulate({ brightness: 0.72, saturation: 1.38 })
    .linear(1.12, -10)
    .png()
    .toBuffer();

  const background = inverted
    ? await preservePortraitOnWhite(backgroundBase)
    : backgroundBase;

  const vignette = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <radialGradient id="v" cx="50%" cy="44%" r="68%">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="68%" stop-color="#000" stop-opacity="0.24"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.86"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#v)" opacity="${inverted ? '0' : '1'}"/>
    <rect width="100%" height="100%" fill="${inverted ? '#f5f8ff' : '#050608'}" opacity="${inverted ? '0.06' : '0.18'}"/>
  </svg>`);

  const pinkGlow = await makeColoredLayer(logo, inverted ? outline : '#ff00aa', inverted ? 2 : 5, inverted ? 1 : 0.9);
  const limeGlow = await makeColoredLayer(logo, inverted ? outline : '#9adf6b', inverted ? 5 : 4, inverted ? 0.46 : 0.85);
  const cyanGlow = await makeColoredLayer(logo, inverted ? '#00f0ff' : '#00f0ff', inverted ? 1.5 : 3, inverted ? 0.28 : 0.62);
  const mainLogo = letterBeat
    ? await makeLetterBeatLayer(logo, beatIndex, inverted)
    : await makeColoredLayer(logo, inverted ? '#050608' : '#f5f8ff', 0, inverted ? 0.98 : 0.96);
  const activeLetterGlow = letterBeat
    ? await makeLetterBeatLayer(logo, beatIndex, false)
    : null;

  const layers = [
      { input: vignette, left: 0, top: 0, blend: 'over' },
      { input: pinkGlow, left: x - 6, top: y + 2, blend: inverted ? 'multiply' : 'screen' },
      { input: limeGlow, left: x + 6, top: y - 2, blend: inverted ? 'multiply' : 'screen' },
      { input: cyanGlow, left: x + 2, top: y + 5, blend: inverted ? 'multiply' : 'screen' },
  ];

  if (activeLetterGlow) {
    layers.push({ input: await sharp(activeLetterGlow).blur(4).png().toBuffer(), left: x, top: y, blend: inverted ? 'multiply' : 'screen' });
  }

  layers.push(
      { input: mainLogo, left: x, top: y, blend: 'over' },
  );

  await sharp(background)
    .composite(layers)
    .png()
    .toFile(framePath);
}

async function main() {
  await renderFrame();

  const framesDir = join(outDir, 'beat-invert-frames');
  await mkdir(framesDir, { recursive: true });
  const beatPattern = [
    { inverted: false, outline: '#ff00aa' },
    { inverted: true, outline: '#9adf6b' },
    { inverted: false, outline: '#9adf6b' },
    { inverted: true, outline: '#ff00aa' },
    { inverted: false, outline: '#ff00aa' },
    { inverted: true, outline: '#9adf6b' },
  ];

  for (let i = 0; i < beatPattern.length; i += 1) {
    const framePath = join(framesDir, `frame-${String(i).padStart(2, '0')}.png`);
    await renderFrame({ ...beatPattern[i], framePath });
    if (i === 1) {
      await sharp(framePath).png().toFile(beatStillPath);
    }
  }

  const letterFramesDir = join(outDir, 'letter-beat-frames');
  await mkdir(letterFramesDir, { recursive: true });
  for (let i = 0; i < 12; i += 1) {
    const framePath = join(letterFramesDir, `frame-${String(i).padStart(2, '0')}.png`);
    await renderFrame({
      inverted: i % 2 === 1,
      outline: i % 2 === 0 ? '#ff00aa' : '#9adf6b',
      letterBeat: true,
      beatIndex: i,
      framePath,
    });
    if (i === 1) {
      await sharp(framePath).png().toFile(letterBeatStillPath);
    }
  }

  console.log(outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
