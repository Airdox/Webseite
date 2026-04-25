import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_FLIGHT_DECK_SETTINGS } from '../../../src/desktop/lib/setManifest.js';
import { ensureDirectory, fileExists, findDefaultWorkspace } from './workspace.mjs';

const SETTINGS_FILENAME = 'flightdeck.settings.json';
const FALLBACK_SETTINGS_DIR = path.resolve(process.cwd(), '.flightdeck');

const getSettingsPath = async (userDataPath = FALLBACK_SETTINGS_DIR) => {
  const settingsDir = await ensureDirectory(userDataPath || FALLBACK_SETTINGS_DIR);
  return path.join(settingsDir, SETTINGS_FILENAME);
};

export const loadSettings = async (userDataPath) => {
  const settingsPath = await getSettingsPath(userDataPath);
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

export const saveSettings = async (userDataPath, nextSettings) => {
  const settingsPath = await getSettingsPath(userDataPath);
  const current = await loadSettings(userDataPath);
  const merged = { ...current, ...nextSettings };
  await fs.writeFile(settingsPath, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
};
