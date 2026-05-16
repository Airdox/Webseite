#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const getArg = (name, fallback = '') => {
  const prefix = `${name}=`;
  const raw = args.find((entry) => entry.startsWith(prefix));
  return raw ? raw.slice(prefix.length).trim() : fallback;
};

const videoId = getArg('--video-id');
const timeoutSec = Number(getArg('--timeout-sec', '900'));
const intervalSec = Number(getArg('--interval-sec', '20'));

if (!videoId) {
  throw new Error('Missing required argument: --video-id=<YouTubeVideoId>');
}

const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
const outDir = join(root, 'docs', 'agent-system', 'proof');
mkdirSync(outDir, { recursive: true });
const screenshotPath = join(outDir, `youtube-playback-${videoId}.png`);

const deadline = Date.now() + timeoutSec * 1000;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

let lastReason = 'unknown';

const tryOnce = async () => {
  await page.goto(watchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const unavailable = await page.locator('text=Dieses Video ist nicht mehr verfügbar').count()
    + await page.locator('text=This video is unavailable').count();
  if (unavailable > 0) {
    lastReason = 'video-unavailable';
    return false;
  }

  const consentButton = page.locator('button:has-text("Alle ablehnen"), button:has-text("Reject all"), button:has-text("Ich stimme zu"), button:has-text("I agree")').first();
  if (await consentButton.count() > 0) {
    await consentButton.click({ timeout: 3000 }).catch(() => {});
  }

  const video = page.locator('video').first();
  if (await video.count() === 0) {
    lastReason = 'no-video-element-yet';
    return false;
  }

  await video.scrollIntoViewIfNeeded().catch(() => {});
  await page.evaluate(async () => {
    const v = document.querySelector('video');
    if (!v) return;
    v.muted = true;
    v.volume = 0;
    await v.play().catch(() => {});
  });
  await page.locator('.ytp-large-play-button, button.ytp-play-button').first().click({ timeout: 3000 }).catch(() => {});
  await page.keyboard.press('k').catch(() => {});
  await page.waitForTimeout(5000);

  await page.evaluate(async () => {
    const v = document.querySelector('video');
    if (!v || !v.paused) return;
    v.muted = true;
    await v.play().catch(() => {});
  });
  await page.waitForTimeout(3000);

  const state = await page.evaluate(() => {
    const v = document.querySelector('video');
    if (!v) return { ok: false, reason: 'missing-video' };
    return {
      ok: !v.paused && !v.ended && v.currentTime > 1.5,
      paused: v.paused,
      ended: v.ended,
      currentTime: v.currentTime,
      readyState: v.readyState,
    };
  });

  if (!state.ok) {
    lastReason = `not-playing paused=${state.paused} ended=${state.ended} t=${state.currentTime} rs=${state.readyState}`;
    return false;
  }

  await page.screenshot({ path: screenshotPath, fullPage: true });
  return true;
};

let verified = false;
while (Date.now() < deadline) {
  // retry loop until processed and playable
  verified = await tryOnce();
  if (verified) break;
  await page.waitForTimeout(intervalSec * 1000);
}

await browser.close();

if (!verified) {
  throw new Error(`Playback verification timed out for ${videoId}. Last reason: ${lastReason}`);
}

process.stdout.write(JSON.stringify({
  status: 'playback_verified',
  videoId,
  watchUrl,
  screenshotPath,
}, null, 2));
process.stdout.write('\n');
