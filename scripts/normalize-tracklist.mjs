#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  parseTracklistText,
  toPipeTracklistText,
} from '../src/desktop/lib/tracklistCore.js';

const usage = `
Usage:
  node scripts/normalize-tracklist.mjs --input "<tracklist.cue|tracklist.tracks.json|tracklist.mixcloud.txt>" [--output "<file>"]

Writes a canonical pipe-delimited tracklist:
  HH:MM:SS | Artist | Title

This intentionally avoids comma-separated columns because artist names often contain commas.
`;

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
};

const stripTextBom = (value = '') => String(value || '').replace(/^\uFEFF/, '');

const swapUtf16Bytes = (buffer) => {
  const swapped = Buffer.alloc(buffer.length);
  for (let index = 0; index < buffer.length - 1; index += 2) {
    swapped[index] = buffer[index + 1];
    swapped[index + 1] = buffer[index];
  }
  if (buffer.length % 2 === 1) {
    swapped[buffer.length - 1] = buffer[buffer.length - 1];
  }
  return swapped;
};

const decodeTextBuffer = (buffer = Buffer.alloc(0)) => {
  if (!buffer?.length) return '';
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return stripTextBom(buffer.toString('utf8', 3));
  }
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return stripTextBom(buffer.toString('utf16le', 2));
  }
  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return stripTextBom(swapUtf16Bytes(buffer.subarray(2)).toString('utf16le'));
  }

  const sampleLength = Math.min(buffer.length, 2048);
  let oddNulls = 0;
  let evenNulls = 0;
  for (let index = 0; index < sampleLength; index += 1) {
    if (buffer[index] !== 0) continue;
    if (index % 2 === 0) evenNulls += 1;
    else oddNulls += 1;
  }
  if (oddNulls > sampleLength * 0.2) return stripTextBom(buffer.toString('utf16le'));
  if (evenNulls > sampleLength * 0.2) return stripTextBom(swapUtf16Bytes(buffer).toString('utf16le'));
  return stripTextBom(buffer.toString('utf8'));
};

const defaultOutputPath = (inputPath) => {
  const parsed = path.parse(inputPath);
  const normalizedName = parsed.base
    .replace(/\.tracks\.json$/i, '')
    .replace(/\.mixcloud\.txt$/i, '')
    .replace(/\.[^.]+$/i, '');
  return path.join(parsed.dir, `${normalizedName}.clean.tracklist.txt`);
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage);
    return;
  }

  const inputPath = args.input ? path.resolve(String(args.input)) : '';
  if (!inputPath) {
    throw new Error(`Missing --input argument.${usage}`);
  }

  const outputPath = args.output
    ? path.resolve(String(args.output))
    : defaultOutputPath(inputPath);

  const raw = decodeTextBuffer(await fs.readFile(inputPath));
  const tracks = parseTracklistText(raw);
  if (!tracks.length) {
    throw new Error(`No valid seekable tracks parsed from ${inputPath}`);
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, toPipeTracklistText(tracks), 'utf8');

  console.log(`Normalized ${tracks.length} tracks`);
  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputPath}`);
};

main().catch((error) => {
  console.error(`[normalize-tracklist] ${error.message}`);
  process.exit(1);
});
