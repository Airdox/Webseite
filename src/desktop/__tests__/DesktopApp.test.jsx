import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DesktopApp from '../DesktopApp.jsx';
import { flightDeckApi } from '../api.js';
import { mockFlightDeckApi } from '../mockApi.js';

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return { ...actual, flightDeckApi: { ...actual.flightDeckApi } };
});

describe('DesktopApp', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    Object.keys(flightDeckApi).forEach((key) => {
      delete flightDeckApi[key];
    });
    Object.assign(flightDeckApi, mockFlightDeckApi);
  });

  it('renders the overview in mock mode', async () => {
    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });
    await screen.findByText('Workspace verbunden');
    expect(screen.getByText('Mock API')).toBeInTheDocument();
    expect(screen.getByText('Operations Overview')).toBeInTheDocument();
  });

  it('loads a demo import draft in browser mode', async () => {
    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });

    fireEvent.click(screen.getByRole('button', { name: /Set Import/i }));
    fireEvent.click(screen.getByRole('button', { name: /Demo Import/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('recording_2026_05_01')).toBeInTheDocument();
    });
  });

  it('opens the interactive tutorial and exposes scenario tours', async () => {
    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });

    fireEvent.click(screen.getByRole('button', { name: /Interaktive Tour/i }));

    await waitFor(() => {
      expect(screen.getByText(/Volltour: Alle Betriebsbereiche verstehen/i)).toBeInTheDocument();
      expect(screen.getByText(/Schritt 1: Overview als Startpunkt/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tutorial schliessen/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /^Tutorial$/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Szenario 2: Auswertung der Datenbank nach verschiedenen Kriterien/i)).toBeInTheDocument();
    });
  });

  it('refreshes workspace state before publish and uses latest settings', async () => {
    const staleState = {
      settings: {
        workspaceRoot: 'D:\\OLD_WORKSPACE',
        publishPosition: 'bottom',
        autoBuild: false,
      },
      sets: [],
      snapshot: null,
      dbError: null,
      gitStatus: { branch: 'main', dirty: false, summary: '' },
      workspaceValid: true,
    };

    const freshState = {
      ...staleState,
      settings: {
        workspaceRoot: 'D:\\LATEST_WORKSPACE',
        publishPosition: 'top',
        autoBuild: false,
      },
    };

    const getStateMock = vi
      .fn()
      .mockResolvedValueOnce(staleState)
      .mockResolvedValueOnce(freshState)
      .mockResolvedValue(freshState);

    const publishSetMock = vi.fn().mockResolvedValue({
      ok: true,
      logs: [],
      gitStatus: { branch: 'main', dirty: true, summary: 'published' },
      publishedSet: { id: 'recording_2026_05_01', title: 'REC 01.05.2026', file: 'Airdox_REC_2026_05_01.mp3' },
    });

    const listTableMock = vi.fn().mockResolvedValue([]);

    Object.assign(flightDeckApi, {
      isElectron: false,
      getState: getStateMock,
      listTable: listTableMock,
      prepareImport: vi.fn().mockResolvedValue({
        draft: {
          id: 'recording_2026_05_01',
          title: 'REC 01.05.2026',
          date: 'MAY 2026',
          file: 'Airdox_REC_2026_05_01.mp3',
          duration: '1:42:08',
          isNew: true,
          vinylColor: '#9adf6b',
          cover: '/assets/recording_2026_05_01.jpg',
          tracks: [],
          sourceAudioPath: 'D:\\Music\\Airdox_REC_2026_05_01.mp3',
        },
        warnings: [],
      }),
      pickImportFiles: vi.fn().mockResolvedValue([]),
      publishSet: publishSetMock,
    });

    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });

    fireEvent.click(screen.getByRole('button', { name: /Set Import/i }));
    fireEvent.click(screen.getByRole('button', { name: /Demo Import/i }));
    await screen.findByDisplayValue('recording_2026_05_01');

    fireEvent.click(screen.getByRole('button', { name: /Publish Set/i }));

    await waitFor(() => expect(publishSetMock).toHaveBeenCalledTimes(1));

    const publishPayload = publishSetMock.mock.calls[0][0];
    expect(publishPayload.workspaceRoot).toBe('D:\\LATEST_WORKSPACE');
    expect(publishPayload.settings.workspaceRoot).toBe('D:\\LATEST_WORKSPACE');
    expect(publishPayload.settings.autoBuild).toBe(false);
    expect(publishPayload.settings.autoDeploy).toBe(false);

    expect(getStateMock).toHaveBeenCalledTimes(3);
    expect(listTableMock).toHaveBeenCalled();
  });

  it('refreshes workspace state before "Alles ausfuehren & Live" and publishes with live settings', async () => {
    const staleState = {
      settings: {
        workspaceRoot: 'D:\\OLD_WORKSPACE',
        uploadAudioToR2: false,
        autoBuild: false,
        autoDeploy: false,
      },
      sets: [],
      snapshot: null,
      dbError: null,
      gitStatus: { branch: 'main', dirty: false, summary: '' },
      workspaceValid: true,
    };

    const freshState = {
      ...staleState,
      settings: {
        workspaceRoot: 'D:\\LATEST_WORKSPACE',
        uploadAudioToR2: false,
        autoBuild: false,
        autoDeploy: false,
      },
    };

    const getStateMock = vi
      .fn()
      .mockResolvedValueOnce(staleState)
      .mockResolvedValueOnce(freshState)
      .mockResolvedValue(freshState);

    const saveSettingsMock = vi.fn().mockImplementation(async (payload) => payload);
    const publishSetMock = vi.fn().mockResolvedValue({
      ok: true,
      logs: [],
      gitStatus: { branch: 'main', dirty: true, summary: 'live-published' },
      publishedSet: { id: 'recording_2026_05_01', title: 'REC 01.05.2026', file: 'Airdox_REC_2026_05_01.mp3' },
    });

    Object.assign(flightDeckApi, {
      isElectron: false,
      getState: getStateMock,
      saveSettings: saveSettingsMock,
      listTable: vi.fn().mockResolvedValue([]),
      prepareImport: vi.fn().mockResolvedValue({
        draft: {
          id: 'recording_2026_05_01',
          title: 'REC 01.05.2026',
          date: 'MAY 2026',
          file: 'Airdox_REC_2026_05_01.mp3',
          duration: '1:42:08',
          isNew: true,
          vinylColor: '#9adf6b',
          cover: '/assets/recording_2026_05_01.jpg',
          tracks: [],
          sourceAudioPath: 'D:\\Music\\Airdox_REC_2026_05_01.mp3',
        },
        warnings: [],
      }),
      pickImportFiles: vi.fn().mockResolvedValue([]),
      publishSet: publishSetMock,
    });

    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });

    fireEvent.click(screen.getByRole('button', { name: /Set Import/i }));
    fireEvent.click(screen.getByRole('button', { name: /Demo Import/i }));
    await screen.findByDisplayValue('recording_2026_05_01');

    fireEvent.click(screen.getByTitle('Speichert aktuelle Settings und bringt den aktuellen Draft oder die Batch-Auswahl live.'));

    await waitFor(() => expect(saveSettingsMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(publishSetMock).toHaveBeenCalledTimes(1));

    const savedSettings = saveSettingsMock.mock.calls[0][0];
    expect(savedSettings.workspaceRoot).toBe('D:\\LATEST_WORKSPACE');

    const livePayload = publishSetMock.mock.calls[0][0];
    expect(livePayload.workspaceRoot).toBe('D:\\LATEST_WORKSPACE');
    expect(livePayload.settings.workspaceRoot).toBe('D:\\LATEST_WORKSPACE');
    expect(livePayload.settings.uploadAudioToR2).toBe(true);
    expect(livePayload.settings.autoBuild).toBe(true);
    expect(livePayload.settings.autoDeploy).toBe(true);
  });

  it('keeps Go Live disabled for safe-mode drafts without an audio source path', async () => {
    Object.assign(flightDeckApi, {
      isElectron: false,
      getState: vi.fn().mockResolvedValue({
        settings: {
          workspaceRoot: 'D:\\LATEST_WORKSPACE',
          safeMode: true,
        },
        sets: [],
        snapshot: null,
        dbError: null,
        gitStatus: { branch: 'main', dirty: false, summary: '' },
        workspaceValid: true,
      }),
      listTable: vi.fn().mockResolvedValue([]),
      saveSettings: vi.fn(),
      publishSet: vi.fn(),
    });

    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });
    await screen.findByText('Workspace verbunden');

    fireEvent.click(screen.getByRole('button', { name: /Set Import/i }));
    fireEvent.change(screen.getByLabelText(/^ID$/i), { target: { value: 'manual_set' } });
    fireEvent.change(screen.getByLabelText(/^Datei$/i), { target: { value: 'manual_set.mp3' } });

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Alles ausfuehren & Live/i })[0]).toBeDisabled();
    });
  });
});
