#!/usr/bin/env node
import { existsSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';

const root = process.cwd();
const jsxPath = resolve(root, 'scripts/photoshop-export-airdox-letter-masks.jsx');
const donePath = resolve(root, 'public/brand-assets/airdox-lettering/strobe-proof/photoshop-letter-mask.done');

const candidates = [
  process.env.AIRDOX_PHOTOSHOP_EXE,
  'C:/Users/p_kro/OneDrive/Desktop/ps/Adobe Photoshop 2020 Portable.exe',
  'C:/Users/p_kro/OneDrive/Desktop/ps/Photoshop.exe',
  'C:/Program Files/Adobe/Adobe Photoshop 2026/Photoshop.exe',
  'C:/Program Files/Adobe/Adobe Photoshop 2025/Photoshop.exe',
  'C:/Program Files/Adobe/Adobe Photoshop 2024/Photoshop.exe',
  'C:/Program Files/Adobe/Adobe Photoshop 2020/Photoshop.exe',
].filter(Boolean);

const photoshopExe = candidates.find((candidate) => existsSync(candidate));

if (!existsSync(jsxPath)) {
  console.error(`Photoshop JSX not found: ${jsxPath}`);
  process.exit(1);
}

if (!photoshopExe) {
  console.error('Photoshop executable not found. Checked:');
  for (const candidate of candidates) console.error(`- ${candidate}`);
  console.error(`Run manually in Photoshop: File > Scripts > Browse... > ${jsxPath}`);
  process.exit(1);
}

try {
  rmSync(donePath, { force: true });
} catch {
  // Ignore cleanup failures; Photoshop will overwrite the marker if it can run.
}

const child = spawn(photoshopExe, ['-r', jsxPath], {
  cwd: root,
  detached: true,
  stdio: 'ignore',
});
child.unref();

console.log(`Launched Photoshop: ${photoshopExe}`);
console.log(`JSX: ${jsxPath}`);
console.log(`Waiting for marker: ${donePath}`);

const deadline = Date.now() + 180000;
const timer = setInterval(() => {
  if (existsSync(donePath)) {
    clearInterval(timer);
    console.log('Photoshop letter masks exported.');
    console.log(`Output: ${join(root, 'public/brand-assets/airdox-lettering/strobe-proof')}`);
    return;
  }

  if (Date.now() > deadline) {
    clearInterval(timer);
    console.error('Timed out waiting for Photoshop export marker.');
    console.error(`If Photoshop is still open, check for script errors or run manually: ${jsxPath}`);
    process.exitCode = 1;
  }
}, 1000);
