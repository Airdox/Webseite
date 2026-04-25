import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import { DEFAULT_FLIGHT_DECK_SETTINGS } from '../../../src/desktop/lib/setManifest.js';
import { ensureDirectory, fileExists, findDefaultWorkspace } from './workspace.mjs';

const SETTINGS_FILENAME = 'flightdeck.settings.json';

const getSettingsPath = async () => {
  const settingsDir = await ensureDirectory(app.getPath('userData'));
  return path.join(settingsDir, SETTINGS_FILENAME);
};

export const loadSettings = async () => {
  const settingsPath = await getSettingsPath();
  const defaultWorkspace = await findDefaultWorkspace();

  let stored = {};
  if (await fileExists(settingsPath)) {
    try {
      stored = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    } catch {
      stored = {};
    }
  }

  return {
    ...DEFAULT_FLIGHT_DECK_SETTINGS,
    ...stored,
    workspaceRoot: stored.workspaceRoot || defaultWorkspace,
  };
};

export const saveSettings = async (nextSettings) => {
  const settingsPath = await getSettingsPath();
  const current = await loadSettings();
  const merged = { ...current, ...nextSettings };
  await fs.writeFile(settingsPath, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
};
