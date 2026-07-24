import { test, expect, _electron as electron } from '@playwright/test';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test.describe('Flight Deck Audio Mastering – real Electron/FFmpeg', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  let testRoot;
  let sourcePath;
  let longSourcePath;
  let outputDirectory;
  let electronApp;
  let page;
  let masteredOutputPath;

  test.beforeAll(async () => {
    testRoot = await mkdtemp(path.join(tmpdir(), 'airdox-audio-e2e-'));
    sourcePath = path.join(testRoot, `gig-test-${path.basename(testRoot)}.wav`);
    longSourcePath = path.join(testRoot, `gig-long-${path.basename(testRoot)}.wav`);
    outputDirectory = path.join(testRoot, 'saved-master');
    await execFileAsync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'lavfi', '-i', 'sine=frequency=80:duration=4',
      '-f', 'lavfi', '-i', 'sine=frequency=8000:duration=4',
      '-filter_complex', '[0:a][1:a]amix=inputs=2:weights=1 0.18,volume=0.35',
      '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', sourcePath,
    ]);
    await execFileAsync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'lavfi', '-i', 'sine=frequency=220:duration=90',
      '-filter:a', 'volume=0.3',
      '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', longSourcePath,
    ]);

    const electronEnv = {
      ...process.env,
      FLIGHTDECK_E2E: '1',
      VITE_DEV_SERVER_URL: 'http://127.0.0.1:4173/desktop.html',
    };
    delete electronEnv.ELECTRON_RUN_AS_NODE;
    electronApp = await electron.launch({
      args: ['.', `--user-data-dir=${path.join(testRoot, 'electron-profile')}`],
      env: electronEnv,
    });
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Flight Deck', exact: true })).toBeVisible({ timeout: 30_000 });
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
    if (await tutorialClose.isVisible().catch(() => false)) {
      await tutorialClose.click();
      await expect(page.getByRole('dialog', { name: 'Interaktive Flight Deck Tour' })).toBeHidden();
    }
    await electronApp.evaluate(({ dialog }, selectedPath) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [selectedPath] });
    }, longSourcePath);

    await page.getByRole('button', { name: /^Audio Mastering$/i }).click();
    await expect(page.getByRole('heading', { name: 'Live-Set Optimierung' })).toBeVisible();
    const analyzeButton = page.locator('.fd-audio-hero-actions').getByRole('button').filter({ hasText: /analys/i });
    const operationStatus = page.getByRole('status', { name: 'Audio-Verarbeitungsstatus' });
    await expect(analyzeButton).toBeDisabled();
    await page.locator('.fd-audio-hero-actions').getByRole('button', { name: 'Audio wählen' }).click();
    await expect(page.getByText(longSourcePath, { exact: true })).toBeVisible();

    await analyzeButton.click();
    await expect(operationStatus).toContainText(/FFmpeg \d+%/, { timeout: 30_000 });
    await expect.poll(async () => Number(
      await page.getByRole('progressbar', { name: 'Audio-Verarbeitungsfortschritt' }).getAttribute('aria-valuenow'),
    )).toBeGreaterThan(8);
    await page.getByRole('navigation', { name: 'Flight Deck tabs' })
      .getByRole('button', { name: 'Overview', exact: true })
      .click();
    await expect(page.getByRole('status', { name: 'Laufende Audio-Verarbeitung' })).toContainText(/Loudness messen|Signal wird vollständig gelesen/);
    await page.getByRole('button', { name: 'Zum Audio Lab' }).click();
    await page.getByRole('button', { name: /Analyse abbrechen/i }).click();
    await expect(operationStatus).toContainText(/Analyse abgebrochen/i, { timeout: 30_000 });

    await electronApp.evaluate(({ dialog }, paths) => {
      let selectionCount = 0;
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [selectionCount++ === 0 ? paths.sourcePath : paths.outputDirectory],
      });
    }, { sourcePath, outputDirectory });
    await page.locator('.fd-audio-hero-actions').getByRole('button', { name: 'Audio wählen' }).click();
    await expect(page.getByText(sourcePath, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Speicherort wählen' }).click();
    await expect(page.getByText(outputDirectory, { exact: true })).toBeVisible();

    const profiles = page.getByRole('radiogroup', { name: 'Mastering-Profil' }).getByRole('radio');
    await expect(profiles).toHaveCount(5);
    for (const profileName of [
      'Live Set – Druckvoll & Klar',
      '3D Plastisch & Wide',
      'Transparent',
      'Club Pressure',
      'Streaming Safe',
    ]) {
      await expect(page.getByRole('radio', { name: new RegExp(`^${profileName}`) })).toBeVisible();
    }
    const formatSelect = page.getByLabel('Format');
    await expect(formatSelect).toBeVisible();
    await expect(formatSelect.locator('option')).toHaveCount(8);
    await formatSelect.selectOption('alac');
    for (const profile of await profiles.all()) {
      await profile.click();
      await expect(profile).toHaveAttribute('aria-checked', 'true');
      await expect(formatSelect).toHaveValue('alac');
    }

    for (const format of ['mp3', 'wav', 'flac', 'ogg', 'opus', 'aac', 'aiff', 'alac']) {
      await formatSelect.selectOption(format);
      await expect(formatSelect).toHaveValue(format);
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
    await formatSelect.selectOption('wav');
    await expect(formatSelect).toHaveValue('wav');
    await page.getByLabel('Samplerate').selectOption('44100');
    await expect(page.getByLabel('Samplerate')).toHaveValue('44100');

    await analyzeButton.click();
    await expect(operationStatus).toBeVisible();
    await expect.poll(async () => Number(
      await page.getByRole('progressbar', { name: 'Audio-Verarbeitungsfortschritt' }).getAttribute('aria-valuenow'),
    )).toBeGreaterThan(0);
    await expect(page.getByText(/Audioanalyse abgeschlossen/i)).toBeVisible({ timeout: 30000 });
    await expect(operationStatus).toContainText('Analyse abgeschlossen');
    await expect(page.getByRole('progressbar', { name: 'Audio-Verarbeitungsfortschritt' })).toHaveAttribute('aria-valuenow', '100');
    await expect(page.getByText('pcm_s24le', { exact: true })).toBeVisible();
    await expect(page.getByRole('article', { name: 'Originalaufnahme' })).toContainText(/\/ 100/);
    await expect(page.getByRole('article', { name: 'Originalaufnahme' })).toContainText('Messwert');
    await expect(page.getByRole('article', { name: 'Nach Bearbeitung' })).toContainText(/Erwarteter Bereich \d+–\d+/);
    await expect(page.getByRole('article', { name: 'Nach Bearbeitung' })).toContainText('Zielprognose');
    await expect(page.locator('.fd-audio-workflow [aria-current="step"]')).toContainText('Master einstellen');
    await expect(page.getByRole('region', { name: 'Nächster Mastering-Schritt' })).toContainText('Prüfe Profil, Format und Speicherort');
    const sourcePreview = page.locator('.fd-audio-preview audio').first();
    await expect.poll(() => sourcePreview.evaluate((audio) => audio.readyState)).toBeGreaterThanOrEqual(1);
    await sourcePreview.evaluate((audio) => { audio.volume = 0; });
    await page.getByRole('button', { name: 'Quelle vorhören', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Quelle vorhören Wiedergabestatus' })).toContainText('Wiedergabe läuft');
    await expect.poll(() => sourcePreview.evaluate((audio) => audio.currentTime)).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Quelle vorhören Wiedergabestatus' })).toContainText('Pausiert');
    const saveButton = page.locator('.fd-audio-flightbar').getByRole('button', { name: 'Master erstellen & speichern' });
    await expect(saveButton).toBeEnabled();

    await saveButton.click();
    await expect(page.getByRole('button', { name: /Abbrechen/i })).toBeVisible();
    await page.getByRole('button', { name: /Abbrechen/i }).click();
    await expect(page.getByRole('status', { name: 'Audio-Verarbeitungsstatus' })).toContainText(/abgebrochen/i, { timeout: 30000 });

    await analyzeButton.click();
    await expect(page.getByText(/Audioanalyse abgeschlossen/i)).toBeVisible({ timeout: 30000 });
    await saveButton.click();
    await expect(page.getByText(/Master gespeichert und verifiziert:/i)).toBeVisible({ timeout: 60000 });
    masteredOutputPath = (await page.locator('.fd-audio-progress-copy span').innerText()).trim();
    expect(path.dirname(masteredOutputPath)).toBe(outputDirectory);
    await expect(page.getByRole('progressbar', { name: 'Audio-Verarbeitungsfortschritt' })).toHaveAttribute('aria-valuenow', '100');
    await expect(page.getByRole('article', { name: 'Fertiges Master' })).toContainText(/\/ 100/);
    await expect(page.getByRole('article', { name: 'Fertiges Master' })).toContainText('Messwert');
    const masterPreview = page.locator('.fd-audio-preview audio').last();
    await expect.poll(() => masterPreview.evaluate((audio) => audio.readyState)).toBeGreaterThanOrEqual(1);
    await masterPreview.evaluate((audio) => { audio.volume = 0; });
    await page.getByRole('button', { name: 'Master vorhören', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Master vorhören Wiedergabestatus' })).toContainText('Wiedergabe läuft');
    await expect.poll(() => masterPreview.evaluate((audio) => audio.currentTime)).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Gespeicherte Datei zeigen' })).toBeEnabled();
    await page.getByRole('button', { name: 'Gespeicherte Datei zeigen' }).click();

    await page.getByRole('button', { name: 'Mastering zurücksetzen' }).click();
    await expect(page.getByRole('progressbar', { name: 'Audio-Verarbeitungsfortschritt' })).toHaveAttribute('aria-valuenow', '0');
    await expect(formatSelect).toHaveValue('mp3');
    await page.getByLabel('Expertenmodus').uncheck();
    await expect(page.locator('.fd-audio-parameters')).toBeHidden();
    await expect(formatSelect).toBeVisible();
  });
});
