import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadSettings, saveSettings } from '../../../desktop/main/services/state.mjs';
import { DEFAULT_FLIGHT_DECK_SETTINGS } from '../lib/setManifest.js';

describe('desktop settings state service', () => {
  let settingsDir;

  beforeEach(async () => {
    settingsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'airdox-state-test-'));
  });

  afterEach(async () => {
    await fs.rm(settingsDir, { recursive: true, force: true });
  });

  it('loads defaults and discovers a real workspace when no settings file exists', async () => {
    const settings = await loadSettings(settingsDir);

    expect(settings).toMatchObject({
      ...DEFAULT_FLIGHT_DECK_SETTINGS,
      workspaceRoot: expect.any(String),
    });
    expect(typeof settings.workspaceRoot).toBe('string');
    expect(settings.workspaceRoot.length).toBeGreaterThan(0);
  });

  it('falls back safely when a persisted settings file contains invalid JSON', async () => {
    await fs.writeFile(path.join(settingsDir, 'flightdeck.settings.json'), '{broken', 'utf8');

    const settings = await loadSettings(settingsDir);

    expect(settings.safeMode).toBe(DEFAULT_FLIGHT_DECK_SETTINGS.safeMode);
    expect(settings.buildCommand).toBe(DEFAULT_FLIGHT_DECK_SETTINGS.buildCommand);
  });

  it('merges, persists and reloads user changes without dropping defaults', async () => {
    const saved = await saveSettings(settingsDir, {
      workspaceRoot: 'D:\\AIRDOX',
      autoBuild: false,
      siteUrl: 'https://example.test',
    });

    expect(saved).toMatchObject({
      workspaceRoot: 'D:\\AIRDOX',
      autoBuild: false,
      siteUrl: 'https://example.test',
      safeMode: DEFAULT_FLIGHT_DECK_SETTINGS.safeMode,
    });

    const raw = JSON.parse(await fs.readFile(path.join(settingsDir, 'flightdeck.settings.json'), 'utf8'));
    expect(raw).toEqual(saved);
    await expect(loadSettings(settingsDir)).resolves.toEqual(saved);
  });
});
