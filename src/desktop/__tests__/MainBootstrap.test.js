import Module from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const requireFromRoot = createRequire(`${process.cwd()}${path.sep}`);
const indexPath = path.join(process.cwd(), 'desktop', 'main', 'index.cjs');
const preloadPath = path.join(process.cwd(), 'desktop', 'main', 'preload.cjs');

describe('Electron main/preload bootstrap', () => {
  let originalLoad;
  let electronMock;
  let windows;
  let handlers;

  beforeEach(() => {
    vi.resetModules();
    delete requireFromRoot.cache[indexPath];
    delete requireFromRoot.cache[preloadPath];
    windows = [];
    handlers = new Map();

    class BrowserWindowMock {
      static getAllWindows = vi.fn(() => windows.filter((window) => !window.destroyed));

      constructor(options) {
        this.options = options;
        this.destroyed = false;
        this.focus = vi.fn();
        this.loadURL = vi.fn(async () => true);
        this.on = vi.fn((event, callback) => {
          if (event === 'closed') this.closeCallback = callback;
        });
        this.isDestroyed = vi.fn(() => this.destroyed);
        this.webContents = {
          on: vi.fn(),
          send: vi.fn(),
          openDevTools: vi.fn(),
          session: {
            clearCache: vi.fn(async () => true),
            flushStorageData: vi.fn(async () => true),
          },
        };
        windows.push(this);
      }
    }

    electronMock = {
      app: {
        isPackaged: false,
        isReady: vi.fn(() => true),
        getPath: vi.fn(() => path.join(process.cwd(), 'coverage-desktop', '.tmp')),
        getAppPath: vi.fn(() => process.cwd()),
        whenReady: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
        quit: vi.fn(),
      },
      BrowserWindow: BrowserWindowMock,
      dialog: {
        showOpenDialog: vi.fn(async () => ({ canceled: true, filePaths: [] })),
        showSaveDialog: vi.fn(async () => ({ canceled: true, filePath: '' })),
      },
      ipcMain: {
        handle: vi.fn((channel, callback) => {
          handlers.set(channel, callback);
        }),
      },
      net: {
        fetch: vi.fn(async () => new Response('ok')),
      },
      protocol: {
        registerSchemesAsPrivileged: vi.fn(),
        handle: vi.fn(),
      },
      shell: {
        showItemInFolder: vi.fn(),
      },
      session: {
        defaultSession: {
          clearCache: vi.fn(async () => true),
          flushStorageData: vi.fn(async () => true),
        },
      },
      contextBridge: {
        exposeInMainWorld: vi.fn(),
      },
      ipcRenderer: {
        invoke: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn(),
      },
    };

    originalLoad = Module._load;
    Module._load = function loadWithElectronMock(request, parent, isMain) {
      if (request === 'electron') return electronMock;
      return originalLoad.call(this, request, parent, isMain);
    };
  });

  afterEach(() => {
    Module._load = originalLoad;
    vi.restoreAllMocks();
    delete requireFromRoot.cache[indexPath];
    delete requireFromRoot.cache[preloadPath];
  });

  it('registers privileged app protocol, creates the main window and wires every IPC channel', async () => {
    requireFromRoot(indexPath);

    await vi.waitFor(() => expect(windows).toHaveLength(1));
    expect(electronMock.protocol.registerSchemesAsPrivileged).toHaveBeenCalledWith([
      expect.objectContaining({
        scheme: 'app',
        privileges: expect.objectContaining({ standard: true, secure: true, supportFetchAPI: true }),
      }),
    ]);
    expect(electronMock.protocol.handle).toHaveBeenCalledWith('app', expect.any(Function));
    expect(windows[0].options).toMatchObject({
      width: 1600,
      height: 1040,
      minWidth: 1280,
      minHeight: 820,
      backgroundColor: '#141916',
      title: 'AIRDOX Flight Deck',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    expect(windows[0].loadURL).toHaveBeenCalledWith('http://127.0.0.1:4174/desktop.html');

    for (const channel of [
      'flightdeck:get-state',
      'flightdeck:open-design-studio',
      'flightdeck:get-settings',
      'flightdeck:save-settings',
      'flightdeck:get-manni-campaign-state',
      'flightdeck:update-manni-operation-approval',
      'flightdeck:create-marketing-draft-request',
      'flightdeck:select-workspace',
      'flightdeck:pick-import-files',
      'flightdeck:get-audio-mastering-profiles',
      'flightdeck:get-audio-output-formats',
      'flightdeck:pick-audio-mastering-file',
      'flightdeck:pick-audio-mastering-output-directory',
      'flightdeck:analyze-audio',
      'flightdeck:master-audio',
      'flightdeck:cancel-audio-mastering',
      'flightdeck:prepare-import',
      'flightdeck:publish-set',
      'flightdeck:list-table',
      'flightdeck:update-track-stats',
      'flightdeck:update-subscriber',
      'flightdeck:delete-records',
      'flightdeck:create-user',
      'flightdeck:reset-user-password',
      'flightdeck:revoke-session',
      'flightdeck:run-readonly-query',
      'flightdeck:sync-track-stats',
      'flightdeck:export-records',
      'flightdeck:reveal-path',
      'flightdeck:render-design',
      'flightdeck:get-design-preview',
      'flightdeck:get-analytics-data',
      'flightdeck:export-analytics-report',
      'flightdeck:get-system-stats',
      'flightdeck:clear-cache',
      'flightdeck:optimize-system',
      'flightdeck:assistant-ask',
    ]) {
      expect(handlers.get(channel)).toEqual(expect.any(Function));
    }

    await expect(handlers.get('flightdeck:open-design-studio')()).resolves.toBe(true);
    expect(windows[1].options).toMatchObject({
      width: 1920,
      height: 1120,
      title: 'AIRDOX Design Studio',
    });
    expect(windows[1].loadURL).toHaveBeenCalledWith('http://127.0.0.1:4174/desktop.html?view=design-studio');

    await expect(handlers.get('flightdeck:pick-import-files')()).resolves.toEqual([]);
    await expect(handlers.get('flightdeck:export-records')(null, { rows: [{ a: 1 }], format: 'json' })).resolves.toBeNull();
    await expect(handlers.get('flightdeck:reveal-path')(null, {})).resolves.toBe(false);
    await expect(handlers.get('flightdeck:clear-cache')(null, {})).resolves.toMatchObject({ cleared: true });
    await expect(handlers.get('flightdeck:optimize-system')(null, {})).resolves.toMatchObject({ optimized: true });
  });

  it('exposes the complete preload bridge without executing IPC calls eagerly', () => {
    requireFromRoot(preloadPath);

    expect(electronMock.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('flightDeckApi', expect.objectContaining({
      isElectron: true,
      getState: expect.any(Function),
      saveSettings: expect.any(Function),
      getAudioOutputFormats: expect.any(Function),
      pickAudioMasteringOutputDirectory: expect.any(Function),
      prepareImport: expect.any(Function),
      publishSet: expect.any(Function),
      analyzeAudio: expect.any(Function),
      masterAudio: expect.any(Function),
      askAssistant: expect.any(Function),
      renderDesign: expect.any(Function),
    }));

    const api = electronMock.contextBridge.exposeInMainWorld.mock.calls[0][1];
    api.getState();
    api.saveSettings({ workspaceRoot: 'D:/AIRDOX' });
    api.getAudioOutputFormats();
    api.pickAudioMasteringOutputDirectory();
    api.onAudioMasteringProgress(() => {});
    api.onDesignLog(() => {});

    expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('flightdeck:get-state');
    expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('flightdeck:save-settings', { workspaceRoot: 'D:/AIRDOX' });
    expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('flightdeck:get-audio-output-formats');
    expect(electronMock.ipcRenderer.invoke).toHaveBeenCalledWith('flightdeck:pick-audio-mastering-output-directory');
    expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith('flightdeck:audio-mastering-progress', expect.any(Function));
    expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith('flightdeck:design-log', expect.any(Function));
  });
});
