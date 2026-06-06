#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outputDir = join(root, 'public', 'brand-assets', 'airdox-lettering', 'strobe-proof');
const source = join(outputDir, 'source-separated-airdox.png');

mkdirSync(outputDir, { recursive: true });

const crops = [
  { name: 'letter-a', label: 'A', left: 20, top: 190, width: 380, height: 420 },
  { name: 'letter-i', label: 'i', left: 405, top: 205, width: 200, height: 400 },
  { name: 'letter-r', label: 'R', left: 640, top: 210, width: 320, height: 410 },
  { name: 'letter-d', label: 'D', left: 960, top: 195, width: 310, height: 430 },
  { name: 'letter-o', label: 'O', left: 1295, top: 230, width: 295, height: 380 },
  { name: 'letter-x', label: 'X', left: 1595, top: 215, width: 370, height: 410 },
];

const alphaFromBlackBackground = async (buffer, erase = []) => {
  const image = sharp(buffer).removeAlpha().ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const luminance = Math.max(r, g, b);
    const alpha = Math.max(0, Math.min(255, Math.round((luminance - 18) * 3.2)));
    data[index + 3] = alpha;
  }

  for (const region of erase) {
    const startX = Math.max(0, region.x);
    const startY = Math.max(0, region.y);
    const endX = Math.min(info.width, region.x + region.width);
    const endY = Math.min(info.height, region.y + region.height);

    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        data[(y * info.width + x) * 4 + 3] = 0;
      }
    }
  }

  return sharp(data, { raw: info }).png().toBuffer();
};

const solidFromAlpha = async (buffer) => {
  const image = sharp(buffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];
    data[index] = 255;
    data[index + 1] = 255;
    data[index + 2] = 255;
    data[index + 3] = alpha;
  }

  return sharp(data, { raw: info }).png().toBuffer();
};

for (const crop of crops) {
  const cropped = await sharp(source)
    .extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height })
    .png()
    .toBuffer();
  const cutout = await alphaFromBlackBackground(cropped, crop.erase);
  const solid = await solidFromAlpha(cutout);

  await sharp(cutout).png().toFile(join(outputDir, `${crop.name}.png`));
  await sharp(solid).png().toFile(join(outputDir, `${crop.name}-solid.png`));
}

writeFileSync(
  join(outputDir, 'separated-letter-mask-manifest.json'),
  JSON.stringify(
    {
      schema: 'airdox.separated-letter-masks.v1',
      source: 'source-separated-airdox.png',
      note: 'Generated from isolated AIRDOX image with non-overlapping letters.',
      crops,
    },
    null,
    2,
  ),
);

console.log(`Extracted ${crops.length} separated AIRDOX letter assets to ${outputDir}`);
