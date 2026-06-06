#!/usr/bin/env node
import { existsSync, rmSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const jsxPath = resolve(root, 'scripts/photoshop-export-airdox-separated-letter-masks.jsx');
const donePath = resolve(root, 'public/brand-assets/airdox-lettering/strobe-proof/photoshop-separated-letter-mask.done');
const errorPath = resolve(root, 'public/brand-assets/airdox-lettering/strobe-proof/photoshop-separated-letter-mask.error.txt');

const candidates = [
  process.env.AIRDOX_PHOTOSHOP_EXE,
  'C:/Users/p_kro/OneDrive/Desktop/ps/Adobe Photoshop 2020 Portable.exe',
  'C:/Users/p_kro/OneDrive/Desktop/ps/Photoshop.exe',
  'C:/Program Files/Adobe/Adobe Photoshop 2026/Photoshop.exe',
  'C:/Program Files/Adobe/Adobe Photoshop 2025/Photoshop.exe',
  'C:/Program Files/Adobe/Adobe Photoshop 2024/Photoshop.exe',
].filter(Boolean);

const photoshopExe = candidates.find((candidate) => existsSync(candidate));
const usesPortableLauncher = photoshopExe?.toLowerCase().includes('portable');

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

rmSync(donePath, { force: true });
rmSync(errorPath, { force: true });

if (!usesPortableLauncher) {
  const escapedJsxPath = jsxPath.replaceAll("'", "''");
  const comScript = [
    '$ErrorActionPreference = "Stop"',
    '$app = New-Object -ComObject Photoshop.Application',
    '$app.Visible = $true',
    `$app.DoJavaScriptFile('${escapedJsxPath}')`,
  ].join('; ');

  const comResult = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', comScript],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: 240000,
    },
  );

  if (comResult.status === 0 && existsSync(donePath)) {
    console.log('Photoshop separated letter masks exported through COM.');
    process.exit(0);
  }

  if (comResult.status !== 0) {
    console.error('Photoshop COM execution failed; falling back to launching Photoshop with -r.');
    if (comResult.stderr) console.error(comResult.stderr.trim());
  }

  if (existsSync(errorPath)) {
    console.error(`Photoshop script wrote an error: ${errorPath}`);
    process.exit(1);
  }
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

const deadline = Date.now() + 240000;
const timer = setInterval(() => {
  if (existsSync(donePath)) {
    clearInterval(timer);
    console.log('Photoshop separated letter masks exported.');
    return;
  }

  if (existsSync(errorPath)) {
    clearInterval(timer);
    console.error(`Photoshop script wrote an error: ${errorPath}`);
    process.exitCode = 1;
    return;
  }

  if (Date.now() > deadline) {
    clearInterval(timer);
    console.error('Timed out waiting for Photoshop export marker.');
    console.error(`If Photoshop is still open, run manually: ${jsxPath}`);
    process.exitCode = 1;
  }
}, 1000);
