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
let designStudioWindow = null;
let servicesPromise = null;

const getServices = async () => {
  if (!servicesPromise) {
    servicesPromise = Promise.all([
      import('./services/database.mjs'),
      import('./services/manifest.mjs'),
      import('./services/pipeline.mjs'),
      import('./services/state.mjs'),
      import('./services/workspace.mjs'),
      import('./services/manniApproval.mjs'),
    ]).then(([database, manifest, pipeline, state, workspace, manniApproval]) => ({
      ...database,
      readSets: manifest.readSets,
      prepareImportBundle: pipeline.prepareImportBundle,
      publishSet: pipeline.publishSet,
      loadSettings: state.loadSettings,
      saveSettings: state.saveSettings,
      getGitStatus: workspace.getGitStatus,
      isWorkspaceRoot: workspace.isWorkspaceRoot,
      getManniCampaignState: manniApproval.getManniCampaignState,
      updateManniOperationApproval: manniApproval.updateManniOperationApproval,
      createMarketingDraftRequest: manniApproval.createMarketingDraftRequest,
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

const getAnalyticsCachePath = () => {
  try {
    if (app.isReady()) {
      return path.join(app.getPath('userData'), 'analytics-cache.json');
    }
  } catch {
    // fall through to temp cache path
  }

  return path.join(os.tmpdir(), 'airdox-flightdeck-analytics-cache.json');
};

const writeAnalyticsCache = async (payload) => {
  const cachePath = getAnalyticsCachePath();
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(payload, null, 2), 'utf8');
};

const readAnalyticsCache = async () => {
  const cachePath = getAnalyticsCachePath();
  const raw = await fs.readFile(cachePath, 'utf8');
  return JSON.parse(raw);
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
      sandbox: true,
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

const createDesignStudioWindow = async () => {
  if (designStudioWindow && !designStudioWindow.isDestroyed()) {
    designStudioWindow.focus();
    return true;
  }

  const preloadPath = path.join(__dirname, 'preload.cjs');
  designStudioWindow = new BrowserWindow({
    width: 1920,
    height: 1120,
    minWidth: 1440,
    minHeight: 900,
    backgroundColor: '#050608',
    title: 'AIRDOX Design Studio',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  designStudioWindow.on('closed', () => {
    designStudioWindow = null;
  });

  const studioUrl = app.isPackaged
    ? `${PACKAGED_DESKTOP_URL}?view=design-studio`
    : `${DEV_DESKTOP_URL}?view=design-studio`;
  await designStudioWindow.loadURL(studioUrl);
  return true;
};

ipcMain.handle('flightdeck:get-state', getAppState);

ipcMain.handle('flightdeck:open-design-studio', createDesignStudioWindow);

ipcMain.handle('flightdeck:get-settings', async () => {
  const { loadSettings } = await getServices();
  return loadSettings(getUserDataPath());
});

ipcMain.handle('flightdeck:save-settings', async (_event, patch) => {
  const { saveSettings } = await getServices();
  return saveSettings(getUserDataPath(), patch);
});

ipcMain.handle('flightdeck:get-manni-campaign-state', async (_event, payload) => {
  const { getManniCampaignState } = await getServices();
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return getManniCampaignState(workspaceRoot);
});

ipcMain.handle('flightdeck:update-manni-operation-approval', async (_event, payload) => {
  const { updateManniOperationApproval } = await getServices();
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return updateManniOperationApproval(workspaceRoot, payload);
});

ipcMain.handle('flightdeck:create-marketing-draft-request', async (_event, payload) => {
  const { createMarketingDraftRequest } = await getServices();
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  return createMarketingDraftRequest(workspaceRoot, payload);
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

const resolvePhotoshopExecutable = async (configuredPath = '') => {
  const candidates = [];
  const addCandidate = (value) => {
    const candidate = String(value || '').trim().replace(/^"|"$/g, '');
    if (candidate && !candidates.includes(candidate)) candidates.push(candidate);
  };

  addCandidate(configuredPath);
  if (configuredPath && !path.extname(configuredPath)) {
    addCandidate(path.join(configuredPath, 'Photoshop.exe'));
    addCandidate(path.join(configuredPath, 'Adobe Photoshop 2020 Portable.exe'));
  }
  addCandidate('C:\\Users\\p_kro\\OneDrive\\Desktop\\ps\\Adobe Photoshop 2020 Portable.exe');
  addCandidate('C:\\Users\\p_kro\\OneDrive\\Desktop\\ps\\Photoshop.exe');
  addCandidate('C:\\Program Files\\Adobe\\Adobe Photoshop 2020\\Photoshop.exe');
  addCandidate('C:\\Program Files\\Adobe\\Adobe Photoshop 2024\\Photoshop.exe');
  addCandidate('C:\\Program Files\\Adobe\\Adobe Photoshop 2025\\Photoshop.exe');
  addCandidate('C:\\Program Files\\Adobe\\Adobe Photoshop 2026\\Photoshop.exe');

  for (const candidate of candidates) {
    const found = await fs.access(candidate).then(() => true).catch(() => false);
    if (found) return { found: true, path: candidate, candidates };
  }

  return { found: false, path: candidates[0] || '', candidates };
};

ipcMain.handle('flightdeck:render-design', async (_event, payload) => {
  const { spawn } = require('node:child_process');
  const style = payload?.style || 'flicker';
  const mode = payload?.mode || 'auto';
  const photoshopAction = payload?.photoshopAction || 'script_and_launch';
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  const releaseDir = path.join(workspaceRoot, 'release');
  const outputBase = String(payload?.outputSlug || `daumenkino_${style}`).replace(/[^a-z0-9_-]/gi, '_');
  const outputPaths = {
    gifPath: path.join(releaseDir, `${outputBase}.gif`),
    mp4Path: path.join(releaseDir, `${outputBase}.mp4`),
    manifestPath: path.join(releaseDir, `${outputBase}.manifest.json`),
    handoffPath: path.join(releaseDir, `${outputBase}.handoff.md`),
    photoshopFramePath: path.join(releaseDir, `${outputBase}.photoshop-frame.png`),
    photoshopScriptPath: path.join(releaseDir, `${outputBase}.photoshop-setup.jsx`),
    outputDir: releaseDir,
  };
  let photoshopPath = '';
  let photoshopAvailable = false;
  
  const sendLog = (message, type = 'info') => {
    mainWindow?.webContents.send('flightdeck:design-log', {
      timestamp: new Date().toLocaleTimeString('de-DE'),
      message,
      type
    });
  };

  const { readSets } = await getServices();
  const setsList = await readSets(workspaceRoot).catch(() => []);
  const currentSet = setsList.find((entry) => entry.id === payload.setId) || setsList[0];
  const vinylColor = currentSet?.vinylColor || '#00f0ff';
  
  let resolvedBgPath = '';
  const bgSource = payload.bgSource || 'cover';
  if (bgSource === 'cover' && currentSet?.cover) {
    const rel = String(currentSet.cover).replace(/^\//, '');
    resolvedBgPath = path.join(workspaceRoot, 'public', rel);
  } else if (bgSource === 'vinyl') {
    resolvedBgPath = path.join(workspaceRoot, 'public', 'assets', 'airdox-vinyl.jpg');
  } else if (bgSource === 'music_area') {
    resolvedBgPath = path.join(workspaceRoot, 'docs', 'agent-system', 'proof', 'designer-visual-quality', 'desktop-music.png');
  } else if (bgSource === 'flight_deck') {
    resolvedBgPath = path.join(workspaceRoot, 'docs', 'proof', 'agent-system-desktop.png');
  } else if (bgSource === 'custom' && payload.customBgPath) {
    resolvedBgPath = payload.customBgPath;
  }

  sendLog(`[AGENT] Starte Design-Agenten (${payload?.presetId || style}, ${payload?.fps || 12} FPS)...`, 'info');
  if (payload?.controls) {
    sendLog(`[PARAMETER] Motion ${payload.controls.motion ?? '-'} / Glitch ${payload.controls.glitch ?? '-'} / Type ${payload.controls.typography ?? '-'}`, 'help');
  }
  sendLog(`[HINTERGRUND] Quelle: ${bgSource} -> Pfad: "${resolvedBgPath || 'keiner'}"`, 'help');
  sendLog(`[FARBE] Theme: ${vinylColor}`, 'help');
 
  if (mode === '5050' && photoshopAction !== 'prompt_only') {
    const { loadSettings } = await getServices();
    const settings = await loadSettings(getUserDataPath());
    const configuredPhotoshopPath = settings.photoshopPath || 'C:\\Users\\p_kro\\OneDrive\\Desktop\\ps';
    
    sendLog(`[PHOTOSHOP] Pruefe Photoshop-Pfad: "${configuredPhotoshopPath}"...`, 'info');
    
    const resolvedPhotoshop = await resolvePhotoshopExecutable(configuredPhotoshopPath);
    photoshopPath = resolvedPhotoshop.path;
    photoshopAvailable = resolvedPhotoshop.found;
    if (photoshopAvailable) {
      sendLog(`[PHOTOSHOP] Gefunden: "${photoshopPath}". Der Agent baut zuerst das Handoff, danach startet das JSX-Skript.`, 'success');
    } else {
      sendLog(`[PHOTOSHOP] Nicht gefunden. Geprueft: ${resolvedPhotoshop.candidates.join(' | ')}`, 'warning');
    }
  } else if (mode === '5050') {
    sendLog('[PHOTOSHOP] Prompt-only: Es wird kein Photoshop-Start versucht, nur Handoff/Prompt/Manifest.', 'help');
  }
 
  return new Promise((resolve) => {
    const scriptPath = path.join(workspaceRoot, 'scripts', 'render-daumenkino.mjs');
    const encodedPayload = Buffer.from(JSON.stringify({
      ...payload,
      style,
      vinylColor,
      bgPath: resolvedBgPath,
    }), 'utf8').toString('base64');
 
    sendLog(`[AGENT] Starte Playwright und FFmpeg-Pipeline...`, 'info');
 
    const child = spawn('node', [scriptPath, style, encodedPayload], {
      cwd: workspaceRoot,
      env: { ...process.env }
    });

    child.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        output.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed.includes('SUCCESSFUL')) {
            sendLog(trimmed, 'success');
          } else if (trimmed.includes('Kompiliere') || trimmed.includes('FFmpeg')) {
            sendLog(trimmed, 'help');
          } else if (trimmed.includes('fotografiert') || trimmed.includes('photographiert')) {
            sendLog(trimmed, 'success');
          } else {
            sendLog(trimmed, 'info');
          }
        });
      }
    });

    child.stderr.on('data', (data) => {
      const errorOutput = data.toString().trim();
      if (errorOutput) {
        sendLog(`[PIPELINE] ${errorOutput}`, 'warning');
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        sendLog(`Kreativ-Prozess erfolgreich abgeschlossen.`, 'success');
        sendLog(`[TRANSFER] GIF, MP4, Manifest und Handoff liegen in ${releaseDir}.`, 'success');
        if (mode === '5050' && photoshopAction === 'script_and_launch' && photoshopAvailable) {
          try {
            spawn(photoshopPath, ['-r', outputPaths.photoshopScriptPath], { detached: true, stdio: 'ignore' }).unref();
            sendLog(`[PHOTOSHOP] Setup-Skript an Photoshop uebergeben: ${outputPaths.photoshopScriptPath}`, 'success');
          } catch (error) {
            sendLog(`[PHOTOSHOP] Uebergabe fehlgeschlagen: ${error.message}`, 'warning');
          }
        } else if (mode === '5050' && photoshopAction === 'script_only') {
          sendLog(`[PHOTOSHOP] JSX erzeugt, Photoshop bewusst nicht gestartet: ${outputPaths.photoshopScriptPath}`, 'success');
        }
        resolve({ ok: true, outputs: { ...outputPaths, photoshopAvailable, photoshopAction } });
      } else {
        sendLog(`Pipeline abgebrochen mit Exit-Code ${code}.`, 'warning');
        resolve({ ok: false, error: `Exit code ${code}` });
      }
    });
  });
});

ipcMain.handle('flightdeck:get-design-preview', async (_event, payload) => {
  const style = payload?.style || 'flicker';
  const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
  const filePath = payload?.gifPath || path.join(workspaceRoot, 'release', `daumenkino_${style}.gif`);
  try {
    const data = await fs.readFile(filePath);
    return `data:image/gif;base64,${data.toString('base64')}`;
  } catch (error) {
    return null;
  }
});

ipcMain.handle('flightdeck:get-analytics-data', async (_event, payload) => {
  try {
    const { buildAnalyticsStatsFromEvents, normalizeEventLog } = await import('../../src/desktop/lib/analytics.js');
    const { getAnalyticsEvents } = await getServices();
    const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
    const query = {
      limit: payload?.limit || 5000,
      startDate: payload?.startDate || '',
      endDate: payload?.endDate || '',
      filters: payload?.filters || {},
    };
    const rows = await getAnalyticsEvents(workspaceRoot, query);
    const normalized = rows.map(normalizeEventLog);
    const response = {
      ...buildAnalyticsStatsFromEvents(normalized),
      eventLogs: rows,
      source: 'database',
      realData: true,
      sourceLabel: 'Neon/Postgres analytics_logs',
      workspaceRoot,
      query,
      rowCount: rows.length,
      generatedAt: new Date().toISOString(),
    };
    await writeAnalyticsCache(response);
    return response;
  } catch (error) {
    await writeStartupLog(`Analytics error: ${error.message}`);
    try {
      const cached = await readAnalyticsCache();
      return {
        ...cached,
        source: 'database-cache',
        realData: true,
        cached: true,
        sourceLabel: 'Lokaler Cache der letzten erfolgreichen DB-Abfrage',
        cacheReason: error.message,
        generatedAt: cached.generatedAt,
        servedAt: new Date().toISOString(),
      };
    } catch {
      return {
        totalViews: 0,
        totalPlays: 0,
        totalLikes: 0,
        totalDislikes: 0,
        eventsByType: {},
        topSets: [],
        topCountries: [],
        deviceTypeBreakdown: {},
        hourlyDistribution: new Array(24).fill(0),
        conversionRate: 0,
        eventLogs: [],
        source: 'database-unavailable',
        realData: false,
        sourceLabel: 'Datenbank nicht erreichbar und kein lokaler Cache vorhanden',
        error: error.message,
      };
    }
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
    const local = answerToolQuestion(question);
    return {
      source: local?.source || 'local-expert-fallback',
      answer: local?.text || String(local || ''),
      actions: local?.actions || [],
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
