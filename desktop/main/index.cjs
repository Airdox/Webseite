const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const electron = require('electron');
const { resolveAppProtocolAssetPath } = require('./protocolPath.cjs');

const app = electron?.app;
const BrowserWindow = electron?.BrowserWindow;
const dialog = electron?.dialog;
const ipcMain = electron?.ipcMain;
const net = electron?.net;
const protocol = electron?.protocol;
const shell = electron?.shell;

const DEV_DESKTOP_URL = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:4174/desktop.html';
const PACKAGED_DESKTOP_URL = 'app://flightdeck/desktop.html';

let mainWindow = null;
let servicesPromise = null;

const getServices = async () => {
  if (!servicesPromise) {
    servicesPromise = Promise.all([
      import('./services/database.mjs'),
      import('./services/manifest.mjs'),
      import('./services/pipeline.mjs'),
      import('./services/state.mjs'),
      import('./services/workspace.mjs'),
    ]).then(([database, manifest, pipeline, state, workspace]) => ({
      ...database,
      readSets: manifest.readSets,
      prepareImportBundle: pipeline.prepareImportBundle,
      publishSet: pipeline.publishSet,
      loadSettings: state.loadSettings,
      saveSettings: state.saveSettings,
      getGitStatus: workspace.getGitStatus,
      isWorkspaceRoot: workspace.isWorkspaceRoot,
    }));
  }

  return servicesPromise;
};

const getStartupLogPath = () => {
  try {
    if (app.isReady()) {
      return path.join(app.getPath('userData'), 'flightdeck-startup.log');
    }
  } catch {
    // fall through to temp log path
  }

  return path.join(os.tmpdir(), 'airdox-flightdeck-startup.log');
};

const writeStartupLog = async (message) => {
  try {
    const logPath = getStartupLogPath();
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.appendFile(logPath, `[${new Date().toISOString()}] ${message}\n`, 'utf8');
  } catch {
    // ignore logging failures
  }
};

const writeStartupLogSync = (message) => {
  try {
    const logPath = getStartupLogPath();
    fsSync.mkdirSync(path.dirname(logPath), { recursive: true });
    fsSync.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`, 'utf8');
  } catch {
    // ignore logging failures
  }
};

process.on('uncaughtException', async (error) => {
  await writeStartupLog(`uncaughtException: ${error.stack || error.message}`);
});

process.on('unhandledRejection', async (error) => {
  await writeStartupLog(`unhandledRejection: ${error?.stack || error?.message || error}`);
});

writeStartupLogSync('main module loaded');

if (protocol?.registerSchemesAsPrivileged) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);
}

if (!app || !BrowserWindow || !dialog || !ipcMain || !net || !protocol || !shell) {
  writeStartupLogSync(`electron bootstrap invalid type=${typeof electron} runAsNode=${process.env.ELECTRON_RUN_AS_NODE || '<unset>'}`);
  throw new Error('Electron main APIs are unavailable. Ensure ELECTRON_RUN_AS_NODE is unset before launch.');
}

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

const getUserDataPath = () => app.getPath('userData');

const resolveWorkspaceRoot = async (explicitWorkspaceRoot = '') => {
  if (explicitWorkspaceRoot) return explicitWorkspaceRoot;
  const { loadSettings } = await getServices();
  const settings = await loadSettings(getUserDataPath());
  return settings.workspaceRoot;
};

const getAppState = async () => {
  const { loadSettings, readSets, getDashboardSnapshot, getGitStatus, isWorkspaceRoot } = await getServices();
  const settings = await loadSettings(getUserDataPath());
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
  const [snapshotResult, gitStatus] = await Promise.all([
    getDashboardSnapshot(settings.workspaceRoot, sets)
      .then((snapshot) => ({ snapshot, dbError: null }))
      .catch((error) => ({
        snapshot: null,
        dbError: error?.message || 'Unknown database error',
      })),
    getGitStatus(settings.workspaceRoot),
  ]);

  return {
    settings,
    sets,
    snapshot: snapshotResult.snapshot,
    dbError: snapshotResult.dbError,
    gitStatus,
    workspaceValid,
  };
};

const registerAppProtocol = () => {
  protocol.handle('app', (request) => {
    const assetPath = resolveAppProtocolAssetPath({
      appRoot: app.getAppPath(),
      requestUrl: request.url,
    });

    if (!assetPath) {
      return new Response('Not found', { status: 404 });
    }

    return net.fetch(pathToFileURL(assetPath).toString());
  });
};

const createWindow = async () => {
  const appRoot = app.getAppPath();
  const preloadPath = path.join(__dirname, 'preload.cjs');
  const distDesktopPath = path.join(appRoot, 'dist', 'desktop.html');

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1040,
    minWidth: 1280,
    minHeight: 820,
    backgroundColor: '#141916',
    title: 'AIRDOX Flight Deck',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', async (_event, errorCode, errorDescription, validatedURL) => {
    await writeStartupLog(`did-fail-load code=${errorCode} description=${errorDescription} url=${validatedURL}`);
  });

  mainWindow.webContents.on('console-message', async (_event, level, message, line, sourceId) => {
    await writeStartupLog(`renderer-console level=${level} message=${message} line=${line} source=${sourceId}`);
  });

  mainWindow.webContents.on('render-process-gone', async (_event, details) => {
    await writeStartupLog(`render-process-gone reason=${details.reason} exitCode=${details.exitCode}`);
  });

  try {
    if (!app.isPackaged) {
      try {
        await mainWindow.loadURL(DEV_DESKTOP_URL);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
        await writeStartupLog(`loaded dev url ${DEV_DESKTOP_URL}`);
        return;
      } catch (error) {
        await writeStartupLog(`dev url failed, falling back to dist file: ${error.message}`);
      }
    }

    await mainWindow.loadURL(PACKAGED_DESKTOP_URL);
    await writeStartupLog(`loaded desktop url ${PACKAGED_DESKTOP_URL} from ${distDesktopPath}`);
  } catch (error) {
    await writeStartupLog(`window startup error: ${error.stack || error.message}`);
    throw error;
  }
};

ipcMain.handle('flightdeck:get-state', getAppState);

ipcMain.handle('flightdeck:get-settings', async () => {
  const { loadSettings } = await getServices();
  return loadSettings(getUserDataPath());
});

ipcMain.handle('flightdeck:save-settings', async (_event, patch) => {
  const { saveSettings } = await getServices();
  return saveSettings(getUserDataPath(), patch);
});

ipcMain.handle('flightdeck:select-workspace', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select AIRDOX workspace',
  });

  if (result.canceled || !result.filePaths[0]) return null;
  const { saveSettings } = await getServices();
  return saveSettings(getUserDataPath(), { workspaceRoot: result.filePaths[0] });
});

ipcMain.handle('flightdeck:pick-import-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: 'Select audio, cover and tracklist files',
  });
  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle('flightdeck:prepare-import', async (_event, payload) => {
  const { loadSettings, prepareImportBundle } = await getServices();
  const settings = payload?.settings || await loadSettings(getUserDataPath());
  return prepareImportBundle({
    filePaths: payload?.filePaths || [],
    settings,
    reservedSetIds: payload?.reservedSetIds || [],
    reservedSetTitles: payload?.reservedSetTitles || [],
    reservedSetFiles: payload?.reservedSetFiles || [],
  });
});

ipcMain.handle('flightdeck:publish-set', async (_event, payload) => {
  const { loadSettings, publishSet } = await getServices();
  const settings = await loadSettings(getUserDataPath());
  const workspaceRoot = payload?.workspaceRoot || settings.workspaceRoot;
  return publishSet({
    workspaceRoot,
    draft: payload?.draft,
    settings: { ...settings, ...(payload?.settings || {}) },
  });
});

ipcMain.handle('flightdeck:list-table', async (_event, payload) => {
  const { listTableRows } = await getServices();
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return listTableRows(workspaceRoot, payload?.table, payload?.limit || 200);
});

ipcMain.handle('flightdeck:update-track-stats', async (_event, payload) => {
  const { updateTrackStats } = await getServices();
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return updateTrackStats(workspaceRoot, payload?.row);
});

ipcMain.handle('flightdeck:update-subscriber', async (_event, payload) => {
  const { updateSubscriber } = await getServices();
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return updateSubscriber(workspaceRoot, payload?.row);
});

ipcMain.handle('flightdeck:delete-records', async (_event, payload) => {
  const { deleteRecords } = await getServices();
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return deleteRecords(workspaceRoot, payload?.table, payload?.ids);
});

ipcMain.handle('flightdeck:create-vip-user', async (_event, payload) => {
  const { createVipUser } = await getServices();
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return createVipUser(workspaceRoot, payload);
});

ipcMain.handle('flightdeck:reset-vip-password', async (_event, payload) => {
  const { resetVipPassword } = await getServices();
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return resetVipPassword(workspaceRoot, payload);
});

ipcMain.handle('flightdeck:revoke-session', async (_event, payload) => {
  const { revokeSession } = await getServices();
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return revokeSession(workspaceRoot, payload?.sessionId);
});

ipcMain.handle('flightdeck:run-readonly-query', async (_event, payload) => {
  const { runReadonlyQuery } = await getServices();
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return runReadonlyQuery(workspaceRoot, payload?.queryText || '');
});

ipcMain.handle('flightdeck:sync-track-stats', async (_event, payload) => {
  const { readSets, seedTrackStats } = await getServices();
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

ipcMain.handle('flightdeck:get-analytics-data', async (_event, payload) => {
  try {
    const { buildAnalyticsStatsFromEvents, normalizeEventLog } = await import('../../src/desktop/lib/analytics.js');
    const { getAnalyticsEvents } = await getServices();
    const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
    const rows = await getAnalyticsEvents(workspaceRoot, 5000);
    const normalized = rows.map(normalizeEventLog);
    return {
      ...buildAnalyticsStatsFromEvents(normalized),
      eventLogs: rows,
    };
  } catch (error) {
    await writeStartupLog(`Analytics error: ${error.message}`);
    return {};
  }
});

ipcMain.handle('flightdeck:export-analytics-report', async (_event, payload) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `analytics-report-${new Date().toISOString().split('T')[0]}.${payload?.type || 'json'}`,
      title: 'Export Analytics Report',
    });

    if (result.canceled || !result.filePath) return null;

    const reportData = {
      generated: new Date().toISOString(),
      type: payload?.type || 'json',
      workspace: payload?.workspaceRoot,
    };

    const serialized = JSON.stringify(reportData, null, 2);
    await fs.writeFile(result.filePath, serialized, 'utf8');
    return { filePath: result.filePath };
  } catch (error) {
    await writeStartupLog(`Export analytics error: ${error.message}`);
    return null;
  }
});

ipcMain.handle('flightdeck:get-system-stats', async (_event, payload) => {
  try {
    const { getSystemStats } = await import('./services/admin.mjs');
    return getSystemStats();
  } catch (error) {
    await writeStartupLog(`System stats error: ${error.message}`);
    return {};
  }
});

ipcMain.handle('flightdeck:clear-cache', async (_event, payload) => {
  try {
    const { clearCache } = await import('./services/admin.mjs');
    return clearCache();
  } catch (error) {
    await writeStartupLog(`Clear cache error: ${error.message}`);
    return { cleared: false, error: error.message };
  }
});

ipcMain.handle('flightdeck:optimize-system', async (_event, payload) => {
  try {
    const { optimizeSystem } = await import('./services/admin.mjs');
    return optimizeSystem();
  } catch (error) {
    await writeStartupLog(`Optimize system error: ${error.message}`);
    return { optimized: false, error: error.message };
  }
});

ipcMain.handle('flightdeck:assistant-ask', async (_event, payload) => {
  try {
    const { answerFromWiki, answerWithOllama } = await import('./services/assistant.mjs');
    const { answerToolQuestion } = await import('../../src/desktop/lib/assistantEngine.js');
    const question = payload?.question || '';
    const wiki = await answerFromWiki(question);
    const ollama = await answerWithOllama({ question, wikiContext: wiki?.context || wiki?.answer || '' }).catch(() => null);
    if (ollama?.answer) {
      return {
        source: ollama.source,
        answer: `${ollama.answer}\n\nKontextquelle: ${wiki?.source || 'lokales Wiki'}`,
      };
    }
    if (wiki?.answer) return wiki;
    return {
      source: 'local-expert-fallback',
      answer: answerToolQuestion(question),
    };
  } catch (error) {
    await writeStartupLog(`Assistant error: ${error.message}`);
    return {
      source: 'error-fallback',
      answer: 'Assistant konnte Wiki gerade nicht lesen. Bitte frage erneut mit Ziel + Fehlermeldung + betroffenem Tab.',
    };
  }
});

app.whenReady().then(async () => {
  await writeStartupLog('app.whenReady resolved');
  registerAppProtocol();
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
