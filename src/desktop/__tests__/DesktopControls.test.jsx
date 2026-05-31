import React, { useMemo, useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BatchImportTab from '../components/BatchImportTab.jsx';
import DataExplorerTab from '../components/DataExplorerTab.jsx';
import DesignAgentTab from '../components/DesignAgentTab.jsx';
import FlightDeckTab from '../components/FlightDeckTab.jsx';
import SetImportTab from '../components/SetImportTab.jsx';

const tableRows = {
  track_stats: [
    { id: 'public_april_set', plays: 18, likes: 3, dislikes: 0, last_played_at: null },
    { id: 'vip_archive_set', plays: 3, likes: 1, dislikes: 0, last_played_at: null },
    { id: 'public_may_set', plays: 12, likes: 2, dislikes: 0, last_played_at: null },
  ],
  subscribers: [
    { id: 1, email: 'vip@airdox.info', status: 'active', created_at: '2026-05-01T10:00:00.000Z' },
  ],
  users: [
    { id: 7, username: 'manni', email: 'manni@airdox.info', created_at: '2026-05-02T10:00:00.000Z' },
  ],
  sessions: [
    {
      id: 'sess-1',
      user_id: 7,
      username: 'manni',
      email: 'manni@airdox.info',
      created_at: '2026-05-02T10:00:00.000Z',
      expires_at: '2026-05-23T10:00:00.000Z',
    },
  ],
  bookings: [
    {
      id: 9,
      name: 'Club Reset',
      email: 'booking@club.test',
      event: 'Peak Slot',
      message: 'Techno night',
      created_at: '2026-05-03T10:00:00.000Z',
    },
  ],
  analytics_logs: [
    {
      id: 11,
      event_type: 'play',
      item_id: 'public_may_set',
      session_id: 'sess-1',
      country: 'DE',
      city: 'Berlin',
      region: 'BE',
      device_type: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
      referrer: 'direct',
      created_at: '2026-05-20T18:00:00.000Z',
    },
  ],
};

const setsForAccessFilter = [
  { id: 'public_may_set', title: 'Public May', publishedAt: '2026-05-20' },
  { id: 'public_april_set', title: 'Public April', publishedAt: '2026-04-20' },
  { id: 'public_march_set', title: 'Public March', publishedAt: '2026-03-20' },
  { id: 'public_february_set', title: 'Public February', publishedAt: '2026-02-20' },
  { id: 'vip_archive_set', title: 'VIP Archive', publishedAt: '2025-12-20' },
];

const renderDataExplorerHarness = ({
  isElectron = false,
  handlers = {},
  initialTable = 'track_stats',
  queryResult = null,
} = {}) => {
  const Harness = () => {
    const [tableName, setTableName] = useState(initialTable);
    const [search, setSearch] = useState('');
    const [queryText, setQueryText] = useState('select id from track_stats limit 5;');
    const rows = useMemo(() => tableRows[tableName] || [], [tableName]);
    const filteredRows = useMemo(() => {
      const needle = search.toLowerCase();
      if (!needle) return rows;
      return rows.filter((row) => Object.values(row).join(' ').toLowerCase().includes(needle));
    }, [rows, search]);

    return (
      <DataExplorerTab
        isElectron={isElectron}
        tableName={tableName}
        setTableName={setTableName}
        search={search}
        setSearch={setSearch}
        rows={rows}
        filteredRows={filteredRows}
        sets={setsForAccessFilter}
        queryText={queryText}
        setQueryText={setQueryText}
        queryResult={queryResult}
        onRefresh={handlers.onRefresh || vi.fn()}
        onExportJson={handlers.onExportJson || vi.fn()}
        onExportCsv={handlers.onExportCsv || vi.fn()}
        onSaveTrackStats={handlers.onSaveTrackStats || vi.fn()}
        onSaveSubscriber={handlers.onSaveSubscriber || vi.fn()}
        onDeleteRow={handlers.onDeleteRow || vi.fn()}
        onCreateVipUser={handlers.onCreateVipUser || vi.fn()}
        onResetVipPassword={handlers.onResetVipPassword || vi.fn()}
        onRevokeSession={handlers.onRevokeSession || vi.fn()}
        onRunQuery={handlers.onRunQuery || vi.fn()}
      />
    );
  };

  return render(<Harness />);
};

describe('DataExplorerTab controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('changes tables, filters visible rows and triggers toolbar actions', () => {
    const handlers = {
      onExportJson: vi.fn(),
      onExportCsv: vi.fn(),
      onRefresh: vi.fn(),
    };
    renderDataExplorerHarness({ handlers });

    fireEvent.change(screen.getByLabelText('Tabelle'), { target: { value: 'subscribers' } });
    expect(screen.getByText('vip@airdox.info')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Filtern...'), { target: { value: 'missing' } });
    expect(screen.queryByText('vip@airdox.info')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Filtern...'), { target: { value: 'vip@airdox.info' } });
    expect(screen.getByText('vip@airdox.info')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^CSV$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^JSON$/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /^Refresh$/i }).at(-1));

    expect(handlers.onExportCsv).toHaveBeenCalledTimes(1);
    expect(handlers.onExportJson).toHaveBeenCalledTimes(1);
    expect(handlers.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('edits track_stats, deletes rows and applies the live-only set filter', () => {
    const handlers = {
      onSaveTrackStats: vi.fn(),
      onDeleteRow: vi.fn(),
    };
    renderDataExplorerHarness({ handlers });

    expect(screen.getByText('public_may_set')).toBeInTheDocument();
    expect(screen.getByText('vip_archive_set')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Live \(ohne VIP\)/i }));
    expect(screen.getByText('public_may_set')).toBeInTheDocument();
    expect(screen.getByText('public_april_set')).toBeInTheDocument();
    expect(screen.queryByText('vip_archive_set')).not.toBeInTheDocument();
    expect(screen.getByText('public_may_set').compareDocumentPosition(screen.getByText('public_april_set'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    fireEvent.click(screen.getByRole('button', { name: /Alle Sets/i }));
    const firstCard = screen.getByText('public_may_set').closest('form');
    fireEvent.change(within(firstCard).getByLabelText('Plays'), { target: { value: '42' } });
    fireEvent.change(within(firstCard).getByLabelText('Likes'), { target: { value: '8' } });
    fireEvent.click(within(firstCard).getByRole('button', { name: /Save Row/i }));

    expect(handlers.onSaveTrackStats).toHaveBeenCalledWith({
      id: 'public_may_set',
      plays: '42',
      likes: '8',
      dislikes: '0',
      last_played_at: null,
    });

    fireEvent.click(screen.getByRole('button', { name: /Delete public_may_set/i }));
    expect(handlers.onDeleteRow).toHaveBeenCalledWith('public_may_set');
  });

  it('runs subscriber, VIP user, session and booking admin actions with the expected payloads', () => {
    const handlers = {
      onSaveSubscriber: vi.fn(),
      onCreateVipUser: vi.fn(),
      onResetVipPassword: vi.fn(),
      onRevokeSession: vi.fn(),
      onDeleteRow: vi.fn(),
    };
    renderDataExplorerHarness({ handlers });

    fireEvent.change(screen.getByLabelText('Tabelle'), { target: { value: 'subscribers' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'paused' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Subscriber/i }));
    expect(handlers.onSaveSubscriber).toHaveBeenCalledWith({ id: 1, email: 'vip@airdox.info', status: 'paused' });

    fireEvent.change(screen.getByLabelText('Tabelle'), { target: { value: 'users' } });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'captain' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'captain@airdox.info' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret-123' } });
    fireEvent.click(screen.getByRole('button', { name: /Create User/i }));
    expect(handlers.onCreateVipUser).toHaveBeenCalledWith({
      username: 'captain',
      email: 'captain@airdox.info',
      password: 'secret-123',
    });

    fireEvent.change(screen.getByLabelText('Neues Passwort'), { target: { value: 'next-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(handlers.onResetVipPassword).toHaveBeenCalledWith({ userId: 7, password: 'next-secret' });

    fireEvent.click(screen.getByRole('button', { name: /Delete manni/i }));
    expect(handlers.onDeleteRow).toHaveBeenCalledWith(7);

    fireEvent.change(screen.getByLabelText('Tabelle'), { target: { value: 'sessions' } });
    fireEvent.click(screen.getByRole('button', { name: /Revoke sess-1/i }));
    expect(handlers.onRevokeSession).toHaveBeenCalledWith('sess-1');

    fireEvent.change(screen.getByLabelText('Tabelle'), { target: { value: 'bookings' } });
    fireEvent.click(screen.getByRole('button', { name: /Delete 9/i }));
    expect(handlers.onDeleteRow).toHaveBeenLastCalledWith(9);
  });

  it('blocks read-only SQL in browser mode and runs it in Electron mode', async () => {
    const blockedRunQuery = vi.fn();
    const blockedHarness = renderDataExplorerHarness({ isElectron: false, handlers: { onRunQuery: blockedRunQuery } });

    fireEvent.click(screen.getByRole('button', { name: /Run Query/i }));
    expect(blockedRunQuery).not.toHaveBeenCalled();
    expect(screen.getByText(/Read-only SQL braucht die Windows-App/i)).toBeInTheDocument();

    blockedHarness.unmount();

    const runQuery = vi.fn();
    renderDataExplorerHarness({
      isElectron: true,
      handlers: { onRunQuery: runQuery },
      queryResult: { rows: [{ id: 'query_set', plays: 4 }] },
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Run Query/i }).at(-1));
    expect(runQuery).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/query_set/i)).toBeInTheDocument();
  });
});

describe('SetImportTab controls', () => {
  const draft = {
    id: 'recording_2026_05_01',
    title: 'MAYDAY SIGNAL',
    date: 'MAY 2026',
    file: 'Airdox_REC_2026_05_01.mp3',
    duration: '1:42:08',
    isNew: true,
    vinylColor: '#9adf6b',
    cover: '/assets/mayday.jpg',
    sourceAudioPath: 'D:\\Music\\Airdox_REC_2026_05_01.mp3',
    sourceImagePath: 'D:\\Music\\mayday.jpg',
    sourceTracklistPath: 'D:\\Music\\mayday.txt',
    tracks: [{ time: '00:00', artist: 'Airdox', title: 'Opening ID' }],
  };

  it('updates draft fields, tracklist rows and command buttons through callbacks', () => {
    const handlers = {
      onPickFiles: vi.fn(),
      onLoadDemo: vi.fn(),
      onPublish: vi.fn(),
      onGoLive: vi.fn(),
      onDraftChange: vi.fn(),
      onTrackChange: vi.fn(),
      onTrackAdd: vi.fn(),
      onTrackRemove: vi.fn(),
    };

    render(
      <SetImportTab
        draft={draft}
        warnings={['Tracklist braucht Review.']}
        busy={false}
        isElectron={false}
        canGoLive
        publishLogs={[{ step: 'manifest', status: 'success', detail: 'Updated', timestamp: '2026-05-22T10:00:00.000Z' }]}
        lastPublish={{ publishedSet: draft, gitStatus: { branch: 'main' } }}
        publishStatus={{ state: 'idle', mode: '', label: 'Draft bereit', detail: 'Bereit', progress: 0 }}
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Demo Import/i }));
    fireEvent.click(screen.getByRole('button', { name: /Dateien waehlen/i }));
    expect(handlers.onLoadDemo).toHaveBeenCalledTimes(1);
    expect(handlers.onPickFiles).toHaveBeenCalledWith();

    fireEvent.change(screen.getByLabelText(/^Titel$/i), { target: { value: 'New Title' } });
    fireEvent.change(screen.getByLabelText(/^BPM$/i), { target: { value: '132' } });
    fireEvent.click(screen.getByLabelText(/New Badge aktiv/i));
    expect(handlers.onDraftChange).toHaveBeenCalledWith('title', 'New Title');
    expect(handlers.onDraftChange).toHaveBeenCalledWith('bpm', 132);
    expect(handlers.onDraftChange).toHaveBeenCalledWith('isNew', false);

    fireEvent.change(screen.getByPlaceholderText('Artist'), { target: { value: 'Alignment' } });
    fireEvent.click(screen.getByRole('button', { name: /Track hinzufuegen/i }));
    fireEvent.click(screen.getByRole('button', { name: /Remove track 1/i }));
    expect(handlers.onTrackChange).toHaveBeenCalledWith(0, 'artist', 'Alignment');
    expect(handlers.onTrackAdd).toHaveBeenCalledWith({ time: '', artist: '', title: '' });
    expect(handlers.onTrackRemove).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByRole('button', { name: /Publish nach Settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /Alles ausfuehren & Live/i }));
    expect(handlers.onPublish).toHaveBeenCalledTimes(1);
    expect(handlers.onGoLive).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Tracklist braucht Review/i)).toBeInTheDocument();
    expect(screen.getByText(/Letztes Publish/i)).toBeInTheDocument();
  });

  it('uses dropped Windows file paths and disables Go Live when the source audio is missing', () => {
    const onPickFiles = vi.fn();
    const onLoadDemo = vi.fn();
    const { container } = render(
      <SetImportTab
        draft={{ ...draft, sourceAudioPath: '' }}
        warnings={[]}
        busy={false}
        isElectron={false}
        onPickFiles={onPickFiles}
        onLoadDemo={onLoadDemo}
        onPublish={vi.fn()}
        onGoLive={vi.fn()}
        canGoLive={false}
        goLiveDisabledReason="Audio fehlt"
        onDraftChange={vi.fn()}
        onTrackChange={vi.fn()}
        onTrackAdd={vi.fn()}
        onTrackRemove={vi.fn()}
        publishLogs={[]}
      />,
    );

    fireEvent.drop(container.querySelector('.fd-dropzone'), {
      dataTransfer: { files: [{ path: 'D:\\Sets\\mix.mp3' }, { path: 'D:\\Sets\\mix.txt' }] },
    });
    expect(onPickFiles).toHaveBeenCalledWith(['D:\\Sets\\mix.mp3', 'D:\\Sets\\mix.txt']);
    expect(screen.getByRole('button', { name: /Alles ausfuehren & Live/i })).toBeDisabled();
  });
});

describe('FlightDeckTab controls', () => {
  it('writes settings changes and triggers workspace/save commands', () => {
    const onSettingChange = vi.fn();
    const onSave = vi.fn();
    const onSelectWorkspace = vi.fn();

    render(
      <FlightDeckTab
        settings={{
          workspaceRoot: 'D:\\Airdox\\Webseite',
          r2ObjectPrefix: 'public',
          coverOutputDir: 'public/assets',
          defaultCoverPath: '/assets/airdox-vinyl.jpg',
          buildCommand: 'npm run build',
          deployCommand: 'npm run deploy',
          gitCommitTemplate: 'feat: {{id}}',
          publishPosition: 'top',
          defaultVinylColor: '#9adf6b',
          safeMode: true,
          autoDeploy: false,
        }}
        gitStatus={{ branch: 'main' }}
        busy={false}
        onSettingChange={onSettingChange}
        onSave={onSave}
        onSelectWorkspace={onSelectWorkspace}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Workspace$/i }));
    fireEvent.change(screen.getByLabelText('R2 Prefix'), { target: { value: 'sets/live' } });
    fireEvent.change(screen.getByLabelText('Publish Position'), { target: { value: 'bottom' } });
    fireEvent.click(screen.getByText('Auto Deploy').closest('label').querySelector('input'));
    fireEvent.click(screen.getByRole('button', { name: /Settings speichern/i }));

    expect(onSelectWorkspace).toHaveBeenCalledTimes(1);
    expect(onSettingChange).toHaveBeenCalledWith('r2ObjectPrefix', 'sets/live');
    expect(onSettingChange).toHaveBeenCalledWith('publishPosition', 'bottom');
    expect(onSettingChange).toHaveBeenCalledWith('autoDeploy', true);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

describe('BatchImportTab controls', () => {
  it('runs queue selection, start, live, retry, delete and clear actions', () => {
    const handlers = {
      onAddItems: vi.fn(),
      onRemoveItem: vi.fn(),
      onToggleItem: vi.fn(),
      onToggleAll: vi.fn(),
      onStartBatch: vi.fn(),
      onGoLiveBatch: vi.fn(),
      onClearCompleted: vi.fn(),
      onRetryItem: vi.fn(),
    };

    render(
      <BatchImportTab
        batchQueue={[
          { id: 'pending-1', fileName: 'set-a.mp3', selected: true, status: 'pending', progress: 0, filePaths: ['set-a.mp3'] },
          { id: 'error-1', fileName: 'set-b.mp3', selected: true, status: 'error', progress: 0, errorMessage: 'Audio fehlt' },
          { id: 'success-1', fileName: 'set-c.mp3', selected: false, status: 'success', progress: 100 },
        ]}
        batchProgress={{ current: 1, total: 3 }}
        isBatchRunning={false}
        busy={false}
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Oder Dateien waehlen/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Start$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Auswahl live stellen/i }));
    fireEvent.click(screen.getByRole('button', { name: /Auswahl aufheben/i }));
    fireEvent.click(screen.getByRole('button', { name: /Fertige loeschen/i }));
    fireEvent.click(screen.getByTitle('Entfernen'));
    fireEvent.click(screen.getByTitle('Nochmal versuchen'));
    fireEvent.click(screen.getAllByRole('checkbox')[1]);

    expect(handlers.onAddItems).toHaveBeenCalledWith([]);
    expect(handlers.onStartBatch).toHaveBeenCalledTimes(1);
    expect(handlers.onGoLiveBatch).toHaveBeenCalledTimes(1);
    expect(handlers.onToggleAll).toHaveBeenCalledWith(false);
    expect(handlers.onClearCompleted).toHaveBeenCalledTimes(1);
    expect(handlers.onRemoveItem).toHaveBeenCalledWith(0);
    expect(handlers.onRetryItem).toHaveBeenCalledWith(1);
    expect(handlers.onToggleItem).toHaveBeenCalledWith(1, false);
    expect(screen.getByText(/Audio fehlt/i)).toBeInTheDocument();
  });

  it('shows Pause instead of Start while the batch is running', () => {
    const onPauseBatch = vi.fn();
    render(
      <BatchImportTab
        batchQueue={[{ id: 'pending-1', fileName: 'set-a.mp3', selected: true, status: 'processing', progress: 50 }]}
        batchProgress={{ current: 1, total: 2 }}
        isBatchRunning
        busy={false}
        onPauseBatch={onPauseBatch}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Pause/i }));
    expect(onPauseBatch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });
});

describe('DesignAgentTab controls', () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.assign(window.navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('turns dropdowns, segmented controls and sliders into a render payload and exposes outputs', async () => {
    const api = {
      renderDesign: vi.fn().mockResolvedValue({ ok: true }),
      getDesignPreview: vi.fn().mockResolvedValue('data:image/gif;base64,AAAA'),
      revealPath: vi.fn(),
    };

    render(
      <DesignAgentTab
        sets={[
          { id: 'set-a', title: 'Mayday Signal', bpm: 132, vinylColor: '#00f0ff' },
          { id: 'set-b', title: 'Warehouse Run', bpm: 129, vinylColor: '#9adf6b' },
        ]}
        flightDeckApi={api}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Glitch Type Drop/i }));
    fireEvent.change(screen.getByLabelText('Musik-Set'), { target: { value: 'set-b' } });
    fireEvent.change(screen.getByLabelText('Render-Stil'), { target: { value: 'neon' } });
    fireEvent.change(screen.getByLabelText(/^FPS/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Seed'), { target: { value: '999' } });
    fireEvent.click(screen.getByRole('button', { name: /Photoshop Script/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Reel/i }));
    fireEvent.change(screen.getByLabelText(/^Motion Strength/i), { target: { value: '61' } });

    fireEvent.click(screen.getByRole('button', { name: /Variante rendern/i }));

    await waitFor(() => expect(api.renderDesign).toHaveBeenCalledTimes(1));
    expect(api.renderDesign).toHaveBeenCalledWith(expect.objectContaining({
      style: 'neon',
      mode: '5050',
      presetId: 'glitch_type_drop',
      format: 'reel',
      fps: 20,
      seed: 999,
      setId: 'set-b',
      photoshopAction: 'script_and_launch',
      graffitiStyles: ['wildstyle', 'throwup', 'chrome_3d'],
      outputSlug: 'glitch_type_drop_airdox',
      controls: expect.objectContaining({ motion: 61 }),
    }));

    await screen.findByRole('button', { name: /^MP4$/i });
    fireEvent.click(screen.getByRole('button', { name: /^MP4$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^GIF$/i }));
    expect(api.revealPath).toHaveBeenCalledWith({ filePath: 'D:\\webseeite-main\\release\\glitch_type_drop_airdox.mp4' });
    expect(api.revealPath).toHaveBeenCalledWith({ filePath: 'D:\\webseeite-main\\release\\glitch_type_drop_airdox.gif' });
    expect(screen.getAllByText(/Transfer Pack/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /JSX Script/i })).toBeInTheDocument();
  }, 15000);
});
