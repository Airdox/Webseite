import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { getDashboardSnapshot, listTableRows, updateTrackStats, updateSubscriber, deleteRecords, createVipUser, resetVipPassword, revokeSession, runReadonlyQuery, seedTrackStats } from './services/database.mjs';
import { readSets } from './services/manifest.mjs';
import { prepareImportBundle, publishSet } from './services/pipeline.mjs';
import { loadSettings, saveSettings } from './services/state.mjs';
import { getGitStatus, isWorkspaceRoot } from './services/workspace.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DESKTOP_PATH = path.resolve(__dirname, '../../dist/desktop.html');
const DEV_DESKTOP_URL = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:4174/desktop.html';

let mainWindow = null;

const toCsv = (rows = []) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ];
  return `${lines.join('\n')}\n`;
};

const resolveWorkspaceRoot = async (explicitWorkspaceRoot = '') => {
  if (explicitWorkspaceRoot) return explicitWorkspaceRoot;
  const settings = await loadSettings();
  return settings.workspaceRoot;
};

const getAppState = async () => {
  const settings = await loadSettings();
  const workspaceValid = await isWorkspaceRoot(settings.workspaceRoot);

  if (!workspaceValid) {
    return {
      settings,
      sets: [],
      snapshot: null,
      gitStatus: { branch: '', dirty: false, summary: 'No valid workspace selected.' },
      workspaceValid,
    };
  }

  const sets = await readSets(settings.workspaceRoot);
  const [snapshot, gitStatus] = await Promise.all([
    getDashboardSnapshot(settings.workspaceRoot, sets),
    getGitStatus(settings.workspaceRoot),
  ]);

  return {
    settings,
    sets,
    snapshot,
    gitStatus,
    workspaceValid,
  };
};

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1040,
    minWidth: 1280,
    minHeight: 820,
    backgroundColor: '#141916',
    title: 'AIRDOX Flight Deck',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (!app.isPackaged) {
    await mainWindow.loadURL(DEV_DESKTOP_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  await mainWindow.loadFile(DIST_DESKTOP_PATH);
};

ipcMain.handle('flightdeck:get-state', getAppState);

ipcMain.handle('flightdeck:get-settings', async () => loadSettings());

ipcMain.handle('flightdeck:save-settings', async (_event, patch) => saveSettings(patch));

ipcMain.handle('flightdeck:select-workspace', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select AIRDOX workspace',
  });

  if (result.canceled || !result.filePaths[0]) return null;
  return saveSettings({ workspaceRoot: result.filePaths[0] });
});

ipcMain.handle('flightdeck:pick-import-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: 'Select audio, cover and tracklist files',
  });
  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle('flightdeck:prepare-import', async (_event, payload) => {
  const settings = payload?.settings || await loadSettings();
  return prepareImportBundle({
    filePaths: payload?.filePaths || [],
    settings,
  });
});

ipcMain.handle('flightdeck:publish-set', async (_event, payload) => {
  const settings = await loadSettings();
  const workspaceRoot = payload?.workspaceRoot || settings.workspaceRoot;
  return publishSet({
    workspaceRoot,
    draft: payload?.draft,
    settings: { ...settings, ...(payload?.settings || {}) },
  });
});

ipcMain.handle('flightdeck:list-table', async (_event, payload) => {
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return listTableRows(workspaceRoot, payload?.table, payload?.limit || 200);
});

ipcMain.handle('flightdeck:update-track-stats', async (_event, payload) => {
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return updateTrackStats(workspaceRoot, payload?.row);
});

ipcMain.handle('flightdeck:update-subscriber', async (_event, payload) => {
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return updateSubscriber(workspaceRoot, payload?.row);
});

ipcMain.handle('flightdeck:delete-records', async (_event, payload) => {
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return deleteRecords(workspaceRoot, payload?.table, payload?.ids);
});

ipcMain.handle('flightdeck:create-vip-user', async (_event, payload) => {
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return createVipUser(workspaceRoot, payload);
});

ipcMain.handle('flightdeck:reset-vip-password', async (_event, payload) => {
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return resetVipPassword(workspaceRoot, payload);
});

ipcMain.handle('flightdeck:revoke-session', async (_event, payload) => {
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return revokeSession(workspaceRoot, payload?.sessionId);
});

ipcMain.handle('flightdeck:run-readonly-query', async (_event, payload) => {
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return runReadonlyQuery(workspaceRoot, payload?.queryText || '');
});

ipcMain.handle('flightdeck:sync-track-stats', async (_event, payload) => {
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  const sets = await readSets(workspaceRoot);
  await seedTrackStats(workspaceRoot, sets.map((entry) => entry.id));
  return { ok: true, count: sets.length };
});

ipcMain.handle('flightdeck:export-records', async (_event, payload) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: payload?.suggestedName || `flightdeck-export.${payload?.format || 'json'}`,
    title: 'Export records',
  });

  if (result.canceled || !result.filePath) return null;
  const serialized = payload?.format === 'csv'
    ? toCsv(payload?.rows || [])
    : JSON.stringify(payload?.rows || [], null, 2);
  await fs.writeFile(result.filePath, serialized, 'utf8');
  return { filePath: result.filePath };
});

ipcMain.handle('flightdeck:reveal-path', async (_event, payload) => {
  if (!payload?.filePath) return false;
  shell.showItemInFolder(payload.filePath);
  return true;
});

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
