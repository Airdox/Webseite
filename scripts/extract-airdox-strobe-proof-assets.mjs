#!/usr/bin/env node
import { mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const source = join(
  process.env.USERPROFILE || 'C:/Users/p_kro',
  '.codex',
  'generated_images',
  '019e8714-5ffb-7211-a366-0ed865c06d89',
  'ig_053cfc4d25a80922016a1edf0ebe9c8191ade9777ad1bff752.png',
);
const outputDir = join(root, 'public', 'brand-assets', 'airdox-lettering', 'strobe-proof');
mkdirSync(outputDir, { recursive: true });

const makeAlpha = async (inputBuffer) => {
  const image = sharp(inputBuffer).removeAlpha().ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const luminance = Math.max(r, g, b);
    const alpha = Math.max(0, Math.min(255, (luminance - 16) * 3.8));
    data[index + 3] = alpha;
  }
  return sharp(data, { raw: info }).png().toBuffer();
};

const crops = [
  { name: 'wordmark-02', left: 45, top: 55, width: 720, height: 300 },
  { name: 'letter-a', left: 48, top: 70, width: 245, height: 250 },
  { name: 'letter-i', left: 220, top: 72, width: 128, height: 215 },
  { name: 'letter-r', left: 300, top: 108, width: 210, height: 200 },
  { name: 'letter-d', left: 445, top: 108, width: 170, height: 182 },
  { name: 'letter-o', left: 565, top: 112, width: 125, height: 160 },
  { name: 'letter-x', left: 622, top: 96, width: 155, height: 200 },
];

copyFileSync(source, join(outputDir, 'source-sheet.png'));

for (const crop of crops) {
  const cropped = await sharp(source).extract({
    left: crop.left,
    top: crop.top,
    width: crop.width,
    height: crop.height,
  }).png().toBuffer();
  await sharp(cropped).png().toFile(join(outputDir, `${crop.name}-raw.png`));
  const alpha = await makeAlpha(cropped);
  await sharp(alpha).png().toFile(join(outputDir, `${crop.name}.png`));
}

console.log(`Extracted ${crops.length} strobe proof assets to ${outputDir}`);
