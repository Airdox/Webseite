import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { closeFlightDeck, launchBuiltFlightDeck } from './helpers/flightdeckElectron.js';

const execFileAsync = promisify(execFile);

test.describe('Flight Deck Audio Mastering – real Electron/FFmpeg', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  let testRoot;
  let sourcePath;
  let outputDirectory;
  let electronApp;
  let page;
  let masteredOutputPath;

  test.beforeAll(async () => {
    testRoot = await mkdtemp(path.join(tmpdir(), 'airdox-audio-e2e-'));
    sourcePath = path.join(testRoot, `gig-test-${path.basename(testRoot)}.wav`);
    outputDirectory = path.join(testRoot, 'saved-master');
    await execFileAsync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'lavfi', '-i', 'sine=frequency=80:duration=4',
      '-f', 'lavfi', '-i', 'sine=frequency=8000:duration=4',
      '-filter_complex', '[0:a][1:a]amix=inputs=2:weights=1 0.18,volume=0.35',
      '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', sourcePath,
    ]);
    electronApp = await launchBuiltFlightDeck(testRoot);
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Flight Deck', exact: true })).toBeVisible({ timeout: 30_000 });
  });

  test.afterAll(async () => {
    await closeFlightDeck(electronApp);
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
    await electronApp.evaluate(({ dialog }, paths) => {
      let selectionCount = 0;
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [selectionCount++ === 0 ? paths.sourcePath : paths.outputDirectory],
      });
    }, { sourcePath, outputDirectory });

    await page.getByRole('button', { name: /^Audio Mastering$/i }).click();
    await expect(page.getByRole('heading', { name: 'Ein Set. Ein sauberer Master.' })).toBeVisible();
    expect(await page.evaluate(() => window.flightDeckApi?.isElectron)).toBe(true);
    const operationStatus = page.getByRole('status', { name: 'Audio-Verarbeitungsstatus' });
    await page.getByRole('button', { name: 'Datei auswählen', exact: true }).click();
    await expect(page.getByText(sourcePath, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Speicherort wählen' }).click();
    await expect(page.getByText(outputDirectory, { exact: true })).toBeVisible();

    const profiles = page.getByRole('radiogroup', { name: 'Mastering-Profil' }).getByRole('radio');
    await expect(profiles).toHaveCount(5);
    const transparentProfile = page.getByRole('radio', { name: /^Transparent/ });
    await transparentProfile.click();
    await expect(transparentProfile).toHaveAttribute('aria-checked', 'true');
    const formatSelect = page.getByLabel('Format');
    await expect(formatSelect).toBeVisible();
    await expect(formatSelect.locator('option')).toHaveCount(8);
    await formatSelect.selectOption('wav');
    await expect(formatSelect).toHaveValue('wav');

    await page.getByLabel('Details').check();
    const numericControls = page.locator('.fd-audio-slider input[type="number"]');
    await expect(numericControls).toHaveCount(14);
    await numericControls.first().fill('-15');
    await expect(numericControls.first()).toHaveValue('-15');
    await page.getByLabel('Samplerate').selectOption('44100');
    await expect(page.getByLabel('Samplerate')).toHaveValue('44100');

    await page.getByRole('button', { name: 'Set jetzt analysieren' }).click();
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
    await expect(page.getByRole('article', { name: 'Nach Bearbeitung' })).toHaveCount(0);
    await expect(page.locator('.fd-audio-workflow [aria-current="step"]')).toContainText('Master');
    const saveButton = page.locator('.fd-audio-action-card').getByRole('button', { name: 'Master erstellen und speichern' });
    await expect(saveButton).toBeEnabled();

    await saveButton.click();
    await expect(page.getByText(/Master gespeichert und verifiziert:/i)).toBeVisible({ timeout: 60000 });
    masteredOutputPath = (await page.locator('.fd-audio-action-card p').innerText()).trim();
    expect(path.dirname(masteredOutputPath)).toBe(outputDirectory);
    await access(masteredOutputPath);
    await access(`${masteredOutputPath}.mastering.json`);
    await expect(page.getByRole('progressbar', { name: 'Audio-Verarbeitungsfortschritt' })).toHaveAttribute('aria-valuenow', '100');
    await expect(page.getByRole('article', { name: 'Fertiges Master' })).toContainText(/\/ 100/);
    await expect(page.getByRole('article', { name: 'Fertiges Master' })).toContainText('Messwert');

    await page.getByRole('button', { name: 'Set-Publish vorbereiten' }).click();
    await expect(page.getByRole('main').getByRole('heading', { name: 'Set Import', exact: true })).toBeVisible();
    await expect(page.getByLabel('Audio Source')).toHaveValue(masteredOutputPath);
    await expect(page.getByRole('main').getByRole('button', { name: 'Alles ausfuehren & Live' })).toBeDisabled();

    await page.getByRole('button', { name: /^Audio Mastering$/i }).click();
    await expect(page.getByRole('button', { name: 'Datei im Ordner zeigen' })).toBeEnabled();
    await page.getByRole('button', { name: 'Datei im Ordner zeigen' }).click();

    await page.getByRole('button', { name: 'Mastering zurücksetzen' }).click();
    await expect(page.getByRole('progressbar', { name: 'Audio-Verarbeitungsfortschritt' })).toHaveAttribute('aria-valuenow', '0');
    await expect(formatSelect).toHaveValue('wav');
    await page.getByLabel('Details').uncheck();
    await expect(page.locator('.fd-audio-parameters')).toBeHidden();
    await expect(formatSelect).toBeVisible();
  });
});
