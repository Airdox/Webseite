import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    window.history.pushState({}, '', '/desktop.html');
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(window, 'open').mockImplementation(() => null);
    Object.keys(flightDeckApi).forEach((key) => {
      delete flightDeckApi[key];
    });
    Object.assign(flightDeckApi, mockFlightDeckApi);
  });

  it('renders the Orbital overview from the desktop API', async () => {
    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });
    const globalHealth = await screen.findByLabelText('Globaler Systemstatus');
    expect(within(globalHealth).getByText('Verbunden')).toBeInTheDocument();
    expect(document.querySelector('[data-ui-version="orbital-command-v1"]')).toBeInTheDocument();
    expect(screen.getByText('Operations Overview')).toBeInTheDocument();
  }, 30000);

  it('loads an empty monitor response only once instead of looping indefinitely', async () => {
    const getSystemStats = vi.fn().mockResolvedValue({});
    Object.assign(flightDeckApi, { getSystemStats });
    render(<DesktopApp />);

    await screen.findByRole('heading', { name: 'Flight Deck' });
    fireEvent.click(screen.getByRole('button', { name: 'System Monitor', exact: true }));
    await screen.findAllByRole('heading', { name: 'System Monitor' });
    await waitFor(() => expect(getSystemStats).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getSystemStats).toHaveBeenCalledTimes(1);
  }, 30000);

  it('shows live phase and percentage updates while a real audio analysis request is pending', async () => {
    let progressListener;
    let resolveAnalysis;
    const analyzeAudio = vi.fn(() => new Promise((resolve) => {
      resolveAnalysis = resolve;
    }));
    Object.assign(flightDeckApi, {
      getAudioMasteringProfiles: vi.fn().mockResolvedValue({
        liveBalanced: {
          id: 'liveBalanced',
          name: 'Live Set – Druckvoll & Klar',
          description: 'Standard',
          profileId: 'liveBalanced',
          targetLufs: -14,
        },
      }),
      getAudioOutputFormats: vi.fn().mockResolvedValue([
        {
          id: 'mp3',
          name: 'MP3 – 320 kbit/s',
          extension: 'mp3',
          lossless: false,
        },
      ]),
      pickAudioMasteringFile: vi.fn().mockResolvedValue('D:\\Gigs\\long-live-set.wav'),
      analyzeAudio,
      onAudioMasteringProgress: vi.fn((callback) => {
        progressListener = callback;
        return () => {};
      }),
    });
    render(<DesktopApp />);

    await screen.findByRole('heading', { name: 'Flight Deck' });
    fireEvent.click(screen.getByRole('button', { name: 'Audio Mastering', exact: true }));
    await screen.findByRole('heading', { name: 'Live-Set Optimierung' });
    fireEvent.click(screen.getAllByRole('button', { name: /Audio wählen/i })[0]);
    await screen.findByText('D:\\Gigs\\long-live-set.wav');
    fireEvent.click(screen.getByRole('button', { name: 'Analysieren' }));

    await screen.findByRole('button', { name: 'Analysiere… 1%' });
    const payload = analyzeAudio.mock.calls[0][0];
    expect(payload).toMatchObject({
      sourcePath: 'D:\\Gigs\\long-live-set.wav',
      jobId: expect.stringMatching(/^audio-analysis-/),
    });

    act(() => progressListener({
      jobId: payload.jobId,
      operation: 'analysis',
      progress: 37,
      phase: 'Loudness messen',
      message: 'Signal wird vollständig gelesen · FFmpeg 32%',
    }));
    expect(screen.getByRole('status', { name: 'Audio-Verarbeitungsstatus' })).toHaveTextContent('Loudness messen');
    expect(screen.getByRole('progressbar', { name: 'Audio-Verarbeitungsfortschritt' })).toHaveAttribute('aria-valuenow', '37');

    fireEvent.click(screen.getByRole('button', { name: 'Overview', exact: true }));
    expect(screen.getByRole('status', { name: 'Laufende Audio-Verarbeitung' })).toHaveTextContent('Loudness messen');
    expect(screen.getByRole('status', { name: 'Laufende Audio-Verarbeitung' })).toHaveTextContent('37%');
    fireEvent.click(screen.getByRole('button', { name: 'Zum Audio Lab' }));
    await screen.findByRole('heading', { name: 'Live-Set Optimierung' });

    await act(async () => {
      resolveAnalysis({
        sourcePath: 'D:\\Gigs\\long-live-set.wav',
        playbackUrl: 'file:///D:/Gigs/long-live-set.wav',
        probe: { duration: 4388, codec: 'pcm_s16le', sampleRate: 44100, channels: 2 },
        loudness: { input_i: '-15.2', input_tp: '-0.7' },
      });
    });
    await waitFor(() => expect(
      screen.getByRole('status', { name: 'Audio-Verarbeitungsstatus' }),
    ).toHaveTextContent('Analyse abgeschlossen'));
    expect(screen.getByRole('progressbar', { name: 'Audio-Verarbeitungsfortschritt' })).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByRole('button', { name: 'Erneut analysieren' })).toBeEnabled();
  }, 30000);

  it('lets the user choose a real save folder and sends it through the explicit save workflow', async () => {
    const masteringProfile = {
      id: 'liveBalanced',
      name: 'Live Set – Druckvoll & Klar',
      description: 'Standard',
      targetLufs: -14,
      truePeak: -1.2,
      loudnessRange: 9,
      highpassHz: 28,
      bassGainDb: 1.2,
      mudCutDb: -1,
      presenceGainDb: 0.8,
      trebleGainDb: 1.4,
      compressorThresholdDb: -18,
      compressorRatio: 1.65,
      attackMs: 24,
      releaseMs: 260,
      makeupDb: 0.8,
      stereoWidth: 1,
      outputFormat: 'wav',
      sampleRate: 48000,
    };
    const measuredScore = {
      scoreAvailable: true,
      score: 82,
      grade: { label: 'Technisch gut' },
      confidence: { level: 'hoch', percent: 90 },
      breakdown: {},
      disclaimer: 'Technischer Orientierungswert.',
    };
    const masterAudio = vi.fn().mockResolvedValue({
      sourcePath: 'D:\\Gigs\\set.wav',
      outputPath: 'D:\\Masters\\set-mastered.wav',
      outputPlaybackUrl: 'app://flightdeck/audio/master-token',
      input: {},
      output: { qualityScore: measuredScore, loudness: {} },
    });
    Object.assign(flightDeckApi, {
      getAudioMasteringProfiles: vi.fn().mockResolvedValue({ liveBalanced: masteringProfile }),
      getAudioOutputFormats: vi.fn().mockResolvedValue([
        {
          id: 'wav', name: 'WAV – 24-Bit PCM', extension: 'wav', lossless: true,
        },
      ]),
      pickAudioMasteringFile: vi.fn().mockResolvedValue('D:\\Gigs\\set.wav'),
      pickAudioMasteringOutputDirectory: vi.fn().mockResolvedValue('D:\\Masters'),
      analyzeAudio: vi.fn().mockResolvedValue({
        sourcePath: 'D:\\Gigs\\set.wav',
        playbackUrl: 'app://flightdeck/audio/source-token',
        probe: {
          duration: 60, codec: 'pcm_s24le', sampleRate: 48000, channels: 2,
        },
        loudness: { input_i: '-16', input_tp: '-1' },
        qualityScore: measuredScore,
        predictedQualityScore: {
          ...measuredScore,
          predicted: true,
          scoreRange: { min: 84, max: 96 },
        },
      }),
      masterAudio,
    });

    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });
    fireEvent.click(screen.getByRole('button', { name: 'Audio Mastering', exact: true }));
    await screen.findByRole('heading', { name: 'Live-Set Optimierung' });
    fireEvent.click(screen.getAllByRole('button', { name: 'Audio wählen' })[0]);
    await screen.findByText('D:\\Gigs\\set.wav');
    fireEvent.click(screen.getByRole('button', { name: 'Speicherort wählen' }));
    await screen.findByText('D:\\Masters');
    fireEvent.click(screen.getByRole('button', { name: 'Analysieren', exact: true }));
    await screen.findByRole('button', { name: 'Jetzt Master erstellen & speichern' });
    fireEvent.click(screen.getByRole('button', { name: 'Jetzt Master erstellen & speichern' }));

    await waitFor(() => expect(masterAudio).toHaveBeenCalledWith(expect.objectContaining({
      sourcePath: 'D:\\Gigs\\set.wav',
      outputDirectory: 'D:\\Masters',
    })));
    await screen.findByText(/Master gespeichert und verifiziert:/i);
    expect(screen.getByRole('region', { name: 'Nächster Mastering-Schritt' })).toHaveTextContent(
      'Dein Master ist gespeichert.',
    );
  }, 30000);

  it('offers a return action from the standalone Design Studio window', async () => {
    window.history.pushState({}, '', '/desktop.html?view=design-studio');
    const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});
    Object.assign(flightDeckApi, { isElectron: true });

    render(<DesktopApp />);

    await screen.findByRole('heading', { name: 'Design Studio' });
    fireEvent.click(screen.getByRole('button', { name: /Zurueck zur Hauptansicht/i }));

    expect(closeSpy).toHaveBeenCalledTimes(1);
  }, 30000);

  it('remixes the Design Agent setup into a visible new variant', async () => {
    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });

    fireEvent.click(screen.getByRole('button', { name: /^Design Agent$/i }));
    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: 'Design Agent' }).length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText('Signal System').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Square').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole('button', { name: /^Remix$/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Club Still Parallax').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Reel').length).toBeGreaterThanOrEqual(1);
    });
  }, 30000);

  it('keeps assistant usable when backend returns an object fallback answer', async () => {
    Object.assign(flightDeckApi, {
      askAssistant: vi.fn().mockResolvedValue({
        source: 'local-expert-fallback',
        answer: {
          text: 'Objekt-Fallback wurde sauber gerendert.',
          actions: [],
          source: 'fallback',
        },
      }),
    });

    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });

    fireEvent.click(screen.getByRole('button', { name: /^AI Assistant$/i }));
    await screen.findByRole('heading', { name: /KI Flight-Deck Assistant/i });

    fireEvent.change(screen.getByPlaceholderText(/Frage stellen/i), {
      target: { value: 'asdf qwerty zxcv' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Senden/i }));

    await waitFor(() => expect(flightDeckApi.askAssistant).toHaveBeenCalledTimes(1));
    await screen.findByText('Objekt-Fallback wurde sauber gerendert.');
    expect(screen.getByPlaceholderText(/Frage stellen/i)).toBeInTheDocument();
  }, 30000);

  it('shows compact assistant help with matching software screenshots', async () => {
    Object.assign(flightDeckApi, {
      askAssistant: vi.fn().mockResolvedValue(null),
    });

    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });

    fireEvent.click(screen.getByRole('button', { name: /^AI Assistant$/i }));
    await screen.findByRole('heading', { name: /KI Flight-Deck Assistant/i });

    fireEvent.click(screen.getByRole('button', { name: /Was kannst du alles/i }));

    await screen.findByAltText(/AIRDOX KI Assistant im Windows Tool/i);
    expect(screen.getByText(/Assistant: Frage stellen oder einen Einstieg oben wählen/i)).toBeInTheDocument();
    expect(screen.getByText('Detaillierten Weg anzeigen')).toBeInTheDocument();
    expect(screen.getByText('Textantwort anzeigen')).toBeInTheDocument();
  }, 30000);

  it('loads a demo import draft in browser mode', async () => {
    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });

    fireEvent.click(screen.getByRole('button', { name: /Set Import/i }));
    fireEvent.click(screen.getByRole('button', { name: /Demo Import/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('recording_2026_05_01')).toBeInTheDocument();
    });
  }, 30000);

  it('exports Data Explorer rows as a real browser download in preview mode', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createObjectUrl = vi.fn(() => 'blob:flightdeck-export');
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });

    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });

    fireEvent.click(screen.getByRole('button', { name: /^Data Explorer$/i }));
    await screen.findByText('NO SQL MOCK');
    fireEvent.click(screen.getByRole('button', { name: /^JSON$/i }));

    await waitFor(() => expect(createObjectUrl).toHaveBeenCalledTimes(1));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:flightdeck-export');
  }, 30000);

  it('does not fake read-only SQL results in browser preview mode', async () => {
    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });

    fireEvent.click(screen.getByRole('button', { name: /^Data Explorer$/i }));
    await screen.findByText('NO SQL MOCK');
    fireEvent.click(screen.getByRole('button', { name: /Run Query/i }));

    await screen.findByText(/Read-only SQL braucht die Windows-App mit echter Datenbankverbindung/i);
  }, 30000);

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
  }, 30000);

  it('refreshes workspace state before publish and respects latest publish settings', async () => {
    const staleState = {
      settings: {
        workspaceRoot: 'D:\\OLD_WORKSPACE',
        publishPosition: 'bottom',
        autoBuild: false,
        autoDeploy: true,
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
        autoDeploy: true,
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

    fireEvent.click(screen.getByRole('button', { name: /Publish nach Settings/i }));

    await waitFor(() => expect(publishSetMock).toHaveBeenCalledTimes(1));

    const publishPayload = publishSetMock.mock.calls[0][0];
    expect(publishPayload.workspaceRoot).toBe('D:\\LATEST_WORKSPACE');
    expect(publishPayload.settings.workspaceRoot).toBe('D:\\LATEST_WORKSPACE');
    expect(publishPayload.settings.autoBuild).toBe(false);
    expect(publishPayload.settings.autoDeploy).toBe(true);

    expect(getStateMock).toHaveBeenCalledTimes(3);
    expect(listTableMock).toHaveBeenCalled();
  }, 30000);

  it('shows immediate publish progress while the Windows pipeline is running', async () => {
    const state = {
      settings: {
        workspaceRoot: 'D:\\LATEST_WORKSPACE',
        publishPosition: 'top',
        autoBuild: false,
      },
      sets: [],
      snapshot: null,
      dbError: null,
      gitStatus: { branch: 'main', dirty: false, summary: '' },
      workspaceValid: true,
    };

    let resolvePublish;
    const publishPromise = new Promise((resolve) => {
      resolvePublish = resolve;
    });
    const publishSetMock = vi.fn().mockReturnValue(publishPromise);

    Object.assign(flightDeckApi, {
      isElectron: false,
      getState: vi.fn().mockResolvedValue(state),
      listTable: vi.fn().mockResolvedValue([]),
      prepareImport: vi.fn().mockResolvedValue({
        draft: {
          id: 'recording_2026_05_01',
          title: 'MAYDAY SIGNAL',
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

    fireEvent.click(screen.getByRole('button', { name: /Publish nach Settings/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Publish gestartet: recording_2026_05_01/i).length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByRole('button', { name: /Publish laeuft/i })).toBeDisabled();
    expect(screen.getAllByText(/Workspace, Manifest und Flight-Deck-Settings werden geprueft/i).length).toBeGreaterThanOrEqual(1);

    await waitFor(() => expect(publishSetMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      resolvePublish({
        ok: true,
        logs: [{ step: 'manifest', status: 'success', detail: 'Manifest updated.', timestamp: new Date().toISOString() }],
        gitStatus: { branch: 'main', dirty: true, summary: 'published' },
        publishedSet: { id: 'recording_2026_05_01', title: 'MAYDAY SIGNAL', file: 'Airdox_REC_2026_05_01.mp3' },
      });
      await publishPromise;
    });

    await screen.findByText(/Set recording_2026_05_01 wurde lokal publiziert/i);
    expect(screen.getByText('manifest')).toBeInTheDocument();
  }, 30000);

  it('marks publish as live only after deploy verification succeeds', async () => {
    const state = {
      settings: {
        workspaceRoot: 'D:\\LATEST_WORKSPACE',
        publishPosition: 'top',
        autoBuild: true,
        autoDeploy: true,
        verifyLiveAfterDeploy: true,
      },
      sets: [],
      snapshot: null,
      dbError: null,
      gitStatus: { branch: 'main', dirty: false, summary: '' },
      workspaceValid: true,
    };

    const publishSetMock = vi.fn().mockResolvedValue({
      ok: true,
      logs: [
        { step: 'build', status: 'success', detail: 'Build completed.', timestamp: new Date().toISOString() },
        { step: 'deploy', status: 'success', detail: 'Deploy completed.', timestamp: new Date().toISOString() },
        { step: 'verify', status: 'success', detail: 'Verified live bundle.', timestamp: new Date().toISOString() },
      ],
      gitStatus: { branch: 'main', dirty: true, summary: 'published' },
      publishedSet: { id: 'recording_2026_05_01', title: 'MAYDAY SIGNAL', file: 'Airdox_REC_2026_05_01.mp3' },
    });

    Object.assign(flightDeckApi, {
      isElectron: false,
      getState: vi.fn().mockResolvedValue(state),
      listTable: vi.fn().mockResolvedValue([]),
      prepareImport: vi.fn().mockResolvedValue({
        draft: {
          id: 'recording_2026_05_01',
          title: 'MAYDAY SIGNAL',
          date: 'MAY 2026',
          file: 'Airdox_REC_2026_05_01.mp3',
          duration: '1:42:08',
          isNew: true,
          vinylColor: '#9adf6b',
          cover: '/assets/recording_2026_05_01.jpg',
          tracks: [{ time: '00:00:00', artist: 'Airdox', title: 'Intro' }],
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

    fireEvent.click(screen.getByRole('button', { name: /Publish nach Settings/i }));

    await screen.findByText(/Set recording_2026_05_01 ist live verifiziert/i);
    expect(publishSetMock.mock.calls[0][0].settings.autoDeploy).toBe(true);
  }, 30000);

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
  }, 30000);

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
    const globalHealth = await screen.findByLabelText('Globaler Systemstatus');
    expect(within(globalHealth).getByText('Verbunden')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Set Import/i }));
    fireEvent.change(screen.getByLabelText(/^ID$/i), { target: { value: 'manual_set' } });
    fireEvent.change(screen.getByLabelText(/^Datei$/i), { target: { value: 'manual_set.mp3' } });

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Alles ausfuehren & Live/i })[0]).toBeDisabled();
    });
  }, 10000);

  it('proof: Manni approval actions call the approval API and refresh the visible operation state', async () => {
    const initialCampaignState = {
      proposal: {
        metadata: {
          title: 'Manni PR Push KW 20',
          status: 'draft',
          goal: 'Organische Reach fuer AIRDOX erhoehen.',
          approval: 'Nur nach explizitem Go.',
        },
        executionBoundary: {
          summary: 'Kein Paid Spend.',
        },
        executionChecklist: ['Caption pruefen', 'Asset pruefen'],
        measurementWindows: [{ window: '2h', detail: 'Reach check' }],
        sourceMarkdown: '# Proposal',
      },
      summary: {
        title: 'Manni PR Push KW 20',
        status: 'draft',
        goal: 'Organische Reach fuer AIRDOX erhoehen.',
        approval: 'Nur nach explizitem Go.',
      },
      operations: [
        {
          id: 'OPS-IG-01',
          platform: 'Instagram',
          action: 'Reel posten',
          copyHook: 'Peak-slot pressure check.',
          asset: 'reel-slot-1.mp4',
          targetUrl: 'https://airdox.info/music',
          timing: '18:30',
          kpiGoal: 'Profilbesuche',
          budget: '0 EUR',
          decision: { status: 'pending', notes: '' },
        },
        {
          id: 'OPS-FB-02',
          platform: 'Facebook',
          action: 'Community Post',
          copyHook: 'Full set jetzt online.',
          asset: 'community-card.png',
          targetUrl: 'https://airdox.info/epk',
          timing: '19:00',
          kpiGoal: 'Link-Klicks',
          budget: '0 EUR',
          decision: { status: 'pending', notes: '' },
        },
      ],
      visualAssets: [{ title: 'Assets', items: [{ label: 'Video', value: 'reel-slot-1.mp4' }] }],
      rawMarkdownPath: 'docs/agent-system/MANNI_PR_PUSH.md',
      approvalsPath: 'docs/agent-system/approvals.json',
    };

    const approvedCampaignState = {
      ...initialCampaignState,
      operations: initialCampaignState.operations.map((operation) => (
        operation.id === 'OPS-FB-02'
          ? {
            ...operation,
            decision: { status: 'approved', notes: 'Freigegeben fuer den 19:00 Slot.' },
          }
          : operation
      )),
    };

    const rejectedCampaignState = {
      ...approvedCampaignState,
      operations: approvedCampaignState.operations.map((operation) => (
        operation.id === 'OPS-FB-02'
          ? {
            ...operation,
            decision: { status: 'rejected', notes: 'Heute doch nicht posten.' },
          }
          : operation
      )),
    };

    const getManniCampaignStateMock = vi
      .fn()
      .mockResolvedValueOnce(initialCampaignState)
      .mockResolvedValueOnce(approvedCampaignState)
      .mockResolvedValueOnce(rejectedCampaignState);
    const updateManniOperationApprovalMock = vi
      .fn()
      .mockResolvedValueOnce(approvedCampaignState)
      .mockResolvedValueOnce(rejectedCampaignState);

    Object.assign(flightDeckApi, {
      isElectron: false,
      getState: vi.fn().mockResolvedValue({
        settings: { workspaceRoot: 'D:\\LATEST_WORKSPACE' },
        sets: [],
        snapshot: null,
        dbError: null,
        gitStatus: { branch: 'main', dirty: false, summary: '' },
        workspaceValid: true,
      }),
      listTable: vi.fn().mockResolvedValue([]),
      getManniCampaignState: getManniCampaignStateMock,
      updateManniOperationApproval: updateManniOperationApprovalMock,
    });

    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });
    const nav = screen.getByRole('navigation', { name: 'Flight Deck tabs' });

    fireEvent.click(within(nav).getByRole('button', { name: 'Marketing Manager' }));
    await screen.findByRole('heading', { name: 'Marketing Manager' });
    fireEvent.click(screen.getByRole('button', { name: /Freigaben & Ausspielung/i }));
    await screen.findByRole('button', { name: /OPS-IG-01/i });

    fireEvent.click(screen.getByRole('button', { name: /OPS-FB-02/i }));
    await waitFor(() => {
      expect(screen.getAllByText('Full set jetzt online.').length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByPlaceholderText(/Optional: warum freigegeben/i), {
      target: { value: 'Freigegeben fuer den 19:00 Slot.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Freigeben' }));

    await waitFor(() => expect(updateManniOperationApprovalMock).toHaveBeenCalledWith({
      workspaceRoot: 'D:\\LATEST_WORKSPACE',
      operationId: 'OPS-FB-02',
      status: 'approved',
      note: 'Freigegeben fuer den 19:00 Slot.',
    }));
    await waitFor(() => {
      expect(screen.getAllByText('Freigegeben').length).toBeGreaterThan(0);
    });
    expect(screen.getByDisplayValue('Freigegeben fuer den 19:00 Slot.')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Optional: warum freigegeben/i), {
      target: { value: 'Heute doch nicht posten.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ablehnen' }));

    await waitFor(() => expect(updateManniOperationApprovalMock).toHaveBeenLastCalledWith({
      workspaceRoot: 'D:\\LATEST_WORKSPACE',
      operationId: 'OPS-FB-02',
      status: 'rejected',
      note: 'Heute doch nicht posten.',
    }));
    await waitFor(() => {
      expect(screen.getAllByText('Abgelehnt').length).toBeGreaterThan(0);
    });
    expect(screen.getByDisplayValue('Heute doch nicht posten.')).toBeInTheDocument();
    expect(getManniCampaignStateMock).toHaveBeenCalledTimes(1);
  }, 30000);

  it('legt einen Entwurfsauftrag im Marketing Manager an und aktualisiert die Liste', async () => {
    const baseState = {
      proposal: {
        metadata: { title: 'Marketing Paket', status: 'draft', goal: 'Mehr Reichweite', approval: 'OK erforderlich' },
        executionBoundary: { summary: 'Nur organisch' },
        executionChecklist: [],
        measurementWindows: [],
        sourceMarkdown: '# Proposal',
      },
      summary: { title: 'Marketing Paket', status: 'draft', goal: 'Mehr Reichweite', approval: 'OK erforderlich' },
      operations: [],
      draftRequests: [],
      visualAssets: [],
      rawMarkdownPath: 'docs/agent-system/MARKETING.md',
      approvalsPath: 'docs/agent-system/manni-approval-state.json',
    };
    const withRequest = {
      ...baseState,
      draftRequests: [{
        id: 'MRQ-1',
        title: 'Booking Push Berlin',
        channels: ['Instagram', 'Facebook'],
        objective: 'Mehr Booking-Anfragen',
        constraints: 'Nur organisch',
        ownerAgent: 'Manni',
        status: 'angefragt',
        createdAt: '2026-05-13T10:00:00.000Z',
      }],
    };

    const getManniCampaignStateMock = vi.fn().mockResolvedValue(baseState);
    const createMarketingDraftRequestMock = vi.fn().mockResolvedValue(withRequest);

    Object.assign(flightDeckApi, {
      isElectron: false,
      getState: vi.fn().mockResolvedValue({
        settings: { workspaceRoot: 'D:\\LATEST_WORKSPACE' },
        sets: [],
        snapshot: null,
        dbError: null,
        gitStatus: { branch: 'main', dirty: false, summary: '' },
        workspaceValid: true,
      }),
      listTable: vi.fn().mockResolvedValue([]),
      getManniCampaignState: getManniCampaignStateMock,
      createMarketingDraftRequest: createMarketingDraftRequestMock,
      updateManniOperationApproval: vi.fn(),
    });

    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });
    const nav = screen.getByRole('navigation', { name: 'Flight Deck tabs' });
    fireEvent.click(within(nav).getByRole('button', { name: 'Marketing Manager' }));
    await screen.findByPlaceholderText(/Kampagne Booking Push/i);

    fireEvent.change(screen.getByPlaceholderText(/Kampagne Booking Push/i), { target: { value: 'Booking Push Berlin' } });
    fireEvent.change(screen.getByPlaceholderText(/Welche Wirkung soll der Entwurf erzielen/i), { target: { value: 'Mehr Booking-Anfragen' } });
    fireEvent.change(screen.getByPlaceholderText(/Budget, Tonalitaet, No-Gos/i), { target: { value: 'Nur organisch' } });
    fireEvent.click(screen.getByRole('button', { name: /Unteragentenauftrag speichern/i }));

    await waitFor(() => expect(createMarketingDraftRequestMock).toHaveBeenCalledWith({
      workspaceRoot: 'D:\\LATEST_WORKSPACE',
      title: 'Booking Push Berlin',
      objective: 'Mehr Booking-Anfragen',
      constraints: 'Nur organisch',
      ownerAgent: 'Manni',
      channels: ['Instagram', 'Facebook'],
    }));
    await screen.findByText('Booking Push Berlin');
  }, 30000);
});
