import { test, expect, _electron as electron } from '@playwright/test';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test.describe('Flight Deck Audio Mastering – real Electron/FFmpeg', () => {
  let testRoot;
  let sourcePath;
  let electronApp;
  let page;
  let masteredOutputPath;

  test.beforeAll(async () => {
    testRoot = await mkdtemp(path.join(tmpdir(), 'airdox-audio-e2e-'));
    sourcePath = path.join(testRoot, `gig-test-${path.basename(testRoot)}.wav`);
    await execFileAsync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'lavfi', '-i', 'sine=frequency=80:duration=4',
      '-f', 'lavfi', '-i', 'sine=frequency=8000:duration=4',
      '-filter_complex', '[0:a][1:a]amix=inputs=2:weights=1 0.18,volume=0.35',
      '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', sourcePath,
    ]);

    const electronEnv = { ...process.env };
    delete electronEnv.ELECTRON_RUN_AS_NODE;
    electronApp = await electron.launch({
      args: ['.', `--user-data-dir=${path.join(testRoot, 'electron-profile')}`],
      env: electronEnv,
    });
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    await electronApp?.close().catch(() => {});
    if (masteredOutputPath) {
      await rm(masteredOutputPath, { force: true }).catch(() => {});
      await rm(`${masteredOutputPath}.mastering.json`, { force: true }).catch(() => {});
    }
    if (testRoot) await rm(testRoot, { recursive: true, force: true });
  });

  test('every audio control drives the real mastering workflow', async () => {
    const tutorialClose = page.getByRole('button', { name: 'Tutorial schliessen' });
    await tutorialClose.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    if (await tutorialClose.isVisible().catch(() => false)) await tutorialClose.click();
    await electronApp.evaluate(({ dialog }, selectedPath) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [selectedPath] });
    }, sourcePath);

    await page.getByRole('button', { name: /^Audio Mastering$/i }).click();
    await expect(page.getByRole('heading', { name: 'Live-Set Optimierung' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Analysieren/i })).toBeDisabled();
    await page.getByRole('button', { name: /Audio wählen/i }).click();
    await expect(page.getByText(sourcePath, { exact: true })).toBeVisible();

    const profiles = page.getByRole('radiogroup', { name: 'Mastering-Profil' }).getByRole('radio');
    await expect(profiles).toHaveCount(4);
    for (const profile of await profiles.all()) {
      await profile.click();
      await expect(profile).toHaveAttribute('aria-checked', 'true');
    }

    await page.getByLabel('Expertenmodus').check();
    const numericControls = page.locator('.fd-audio-slider input[type="number"]');
    await expect(numericControls).toHaveCount(13);
    for (const control of await numericControls.all()) {
      const current = Number(await control.inputValue());
      const min = Number(await control.getAttribute('min'));
      const max = Number(await control.getAttribute('max'));
      const step = Number(await control.getAttribute('step'));
      const next = current + step <= max ? current + step : Math.max(min, current - step);
      await control.fill(String(next));
      await expect(control).toHaveValue(String(next));
    }
    await page.getByLabel('Format').selectOption('wav');
    await expect(page.getByLabel('Format')).toHaveValue('wav');
    await page.getByLabel('Samplerate').selectOption('44100');
    await expect(page.getByLabel('Samplerate')).toHaveValue('44100');

    await page.getByRole('button', { name: /Analysieren/i }).click();
    await expect(page.getByText(/Audioanalyse abgeschlossen/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('pcm_s24le', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Optimieren & prüfen/i })).toBeEnabled();

    await page.getByRole('button', { name: /Optimieren & prüfen/i }).click();
    await expect(page.getByRole('button', { name: /Abbrechen/i })).toBeVisible();
    await page.getByRole('button', { name: /Abbrechen/i }).click();
    await expect(page.getByText(/abgebrochen/i)).toBeVisible({ timeout: 30000 });

    await page.getByRole('button', { name: /Analysieren/i }).click();
    await expect(page.getByText(/Audioanalyse abgeschlossen/i)).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: /Optimieren & prüfen/i }).click();
    await expect(page.getByText(/Mastering verifiziert:/i)).toBeVisible({ timeout: 60000 });
    masteredOutputPath = (await page.locator('.fd-audio-progress-copy span').innerText()).trim();
    await expect(page.getByRole('progressbar', { name: 'Mastering-Fortschritt' })).toHaveAttribute('aria-valuenow', '100');
    await expect(page.getByRole('button', { name: /Im Ordner zeigen/i })).toBeEnabled();
    await page.getByRole('button', { name: /Im Ordner zeigen/i }).click();

    await page.getByRole('button', { name: 'Mastering zurücksetzen' }).click();
    await expect(page.getByRole('progressbar', { name: 'Mastering-Fortschritt' })).toHaveAttribute('aria-valuenow', '0');
    await expect(page.getByLabel('Format')).toHaveValue('mp3');
    await page.getByLabel('Expertenmodus').uncheck();
    await expect(page.locator('.fd-audio-parameters')).toBeHidden();
  });
});
