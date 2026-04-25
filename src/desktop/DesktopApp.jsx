import React, { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { CircleAlert, Database, LayoutDashboard, RadioTower, UploadCloud } from 'lucide-react';
import { flightDeckApi } from './api.js';
import OverviewTab from './components/OverviewTab.jsx';
import DataExplorerTab from './components/DataExplorerTab.jsx';
import SetImportTab from './components/SetImportTab.jsx';
import FlightDeckTab from './components/FlightDeckTab.jsx';
import './desktop.css';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'explorer', label: 'Data Explorer', icon: Database },
  { id: 'import', label: 'Set Import', icon: UploadCloud },
  { id: 'flightdeck', label: 'Flight Deck', icon: RadioTower },
];

const matchesSearch = (row, search) => {
  if (!search) return true;
  const haystack = Object.values(row).join(' ').toLowerCase();
  return haystack.includes(search.toLowerCase());
};

const DesktopApp = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [appState, setAppState] = useState({
    settings: null,
    sets: [],
    snapshot: null,
    gitStatus: { branch: '', dirty: false, summary: '' },
    workspaceValid: false,
  });
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [tableName, setTableName] = useState('track_stats');
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [queryText, setQueryText] = useState('select id, plays, likes, dislikes from track_stats order by plays desc limit 20;');
  const [queryResult, setQueryResult] = useState(null);
  const [draft, setDraft] = useState({
    id: '',
    title: '',
    date: '',
    file: '',
    duration: '',
    isNew: true,
    vinylColor: '#9adf6b',
    cover: '',
    tracks: [],
    publishedAt: '',
  });
  const [warnings, setWarnings] = useState([]);
  const [publishLogs, setPublishLogs] = useState([]);
  const [lastPublish, setLastPublish] = useState(null);

  const deferredSearch = useDeferredValue(search);
  const filteredRows = rows.filter((row) => matchesSearch(row, deferredSearch));

  const refreshState = async () => {
    setBusy(true);
    try {
      const state = await flightDeckApi.getState();
      startTransition(() => {
        setAppState(state);
        setSettingsDraft(state.settings);
      });
      setNotice(null);
    } catch (error) {
      setNotice({ tone: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  };

  const refreshTable = async (currentTable = tableName) => {
    if (!appState.workspaceValid) {
      setRows([]);
      return;
    }
    setBusy(true);
    try {
      const nextRows = await flightDeckApi.listTable({ table: currentTable, workspaceRoot: settingsDraft?.workspaceRoot });
      startTransition(() => setRows(nextRows));
    } catch (error) {
      setNotice({ tone: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    refreshState();
  }, []);

  useEffect(() => {
    if (settingsDraft) {
      refreshTable(tableName);
    }
  }, [tableName, appState.workspaceValid]);

  const runAsyncAction = async (work, successMessage) => {
    setBusy(true);
    try {
      const result = await work();
      if (successMessage) {
        setNotice({ tone: 'success', message: successMessage });
      }
      return result;
    } catch (error) {
      setNotice({ tone: 'error', message: error.message });
      throw error;
    } finally {
      setBusy(false);
    }
  };

  const loadImport = async (filePaths = []) => {
    const selectedPaths = filePaths.length ? filePaths : await flightDeckApi.pickImportFiles();
    if (!selectedPaths.length && flightDeckApi.isElectron) return;
    const result = await runAsyncAction(
      () => flightDeckApi.prepareImport({ filePaths: selectedPaths, settings: settingsDraft }),
      'Import-Draft aktualisiert.',
    );
    setDraft(result.draft);
    setWarnings(result.warnings || []);
    setActiveTab('import');
  };

  const saveSettings = async () => {
    const nextSettings = await runAsyncAction(
      () => flightDeckApi.saveSettings(settingsDraft),
      'Flight-Deck-Settings gespeichert.',
    );
    setSettingsDraft(nextSettings);
    await refreshState();
  };

  const exportRows = async (format) => {
    const result = await runAsyncAction(
      () => flightDeckApi.exportRecords({
        format,
        rows: filteredRows,
        suggestedName: `${tableName}-${new Date().toISOString().slice(0, 10)}.${format}`,
      }),
      'Export geschrieben.',
    );
    if (result?.filePath) {
      await flightDeckApi.revealPath({ filePath: result.filePath });
    }
  };

  const publishCurrentDraft = async () => {
    const result = await runAsyncAction(
      () => flightDeckApi.publishSet({
        workspaceRoot: settingsDraft?.workspaceRoot,
        draft,
        settings: settingsDraft,
      }),
      `Set ${draft.id} publiziert.`,
    );
    setPublishLogs(result.logs || []);
    setLastPublish(result);
    await refreshState();
    await refreshTable();
  };

  const updateDraftField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const updateTrack = (index, field, value) => {
    setDraft((prev) => ({
      ...prev,
      tracks: (prev.tracks || []).map((track, trackIndex) => (
        trackIndex === index ? { ...track, [field]: value } : track
      )),
    }));
  };

  const addTrack = (nextTrack) => {
    setDraft((prev) => ({ ...prev, tracks: [...(prev.tracks || []), nextTrack] }));
  };

  const removeTrack = (index) => {
    setDraft((prev) => ({
      ...prev,
      tracks: (prev.tracks || []).filter((_, trackIndex) => trackIndex !== index),
    }));
  };

  const renderTab = () => {
    if (activeTab === 'overview') {
      return (
        <OverviewTab
          snapshot={appState.snapshot}
          gitStatus={appState.gitStatus}
          busy={busy}
          onRefresh={refreshState}
          onSyncStats={async () => {
            await runAsyncAction(() => flightDeckApi.syncTrackStats({ workspaceRoot: settingsDraft?.workspaceRoot }), 'Manifest-IDs mit track_stats synchronisiert.');
            await refreshState();
            await refreshTable();
          }}
        />
      );
    }

    if (activeTab === 'explorer') {
      return (
        <DataExplorerTab
          tableName={tableName}
          setTableName={setTableName}
          search={search}
          setSearch={setSearch}
          rows={rows}
          filteredRows={filteredRows}
          queryText={queryText}
          setQueryText={setQueryText}
          queryResult={queryResult}
          onRefresh={() => refreshTable(tableName)}
          onExportJson={() => exportRows('json')}
          onExportCsv={() => exportRows('csv')}
          onSaveTrackStats={async (row) => {
            await runAsyncAction(() => flightDeckApi.updateTrackStats({ workspaceRoot: settingsDraft?.workspaceRoot, row }), `track_stats ${row.id} gespeichert.`);
            await refreshTable(tableName);
          }}
          onSaveSubscriber={async (row) => {
            await runAsyncAction(() => flightDeckApi.updateSubscriber({ workspaceRoot: settingsDraft?.workspaceRoot, row }), `Subscriber ${row.email} gespeichert.`);
            await refreshTable(tableName);
          }}
          onDeleteRow={async (id) => {
            await runAsyncAction(() => flightDeckApi.deleteRecords({ workspaceRoot: settingsDraft?.workspaceRoot, table: tableName, ids: [id] }), `${tableName} Eintrag geloescht.`);
            await refreshTable(tableName);
          }}
          onCreateVipUser={async (payload) => {
            await runAsyncAction(() => flightDeckApi.createVipUser({ workspaceRoot: settingsDraft?.workspaceRoot, ...payload }), `VIP User ${payload.username} angelegt.`);
            await refreshTable(tableName);
          }}
          onResetVipPassword={async (payload) => {
            await runAsyncAction(() => flightDeckApi.resetVipPassword({ workspaceRoot: settingsDraft?.workspaceRoot, ...payload }), 'VIP Passwort ersetzt.');
          }}
          onRevokeSession={async (sessionId) => {
            await runAsyncAction(() => flightDeckApi.revokeSession({ workspaceRoot: settingsDraft?.workspaceRoot, sessionId }), `Session ${sessionId} widerrufen.`);
            await refreshTable(tableName);
          }}
          onRunQuery={async () => {
            const result = await runAsyncAction(
              () => flightDeckApi.runReadonlyQuery({ workspaceRoot: settingsDraft?.workspaceRoot, queryText }),
              'Read-only Query ausgefuehrt.',
            );
            setQueryResult(result);
          }}
        />
      );
    }

    if (activeTab === 'import') {
      return (
        <SetImportTab
          draft={draft}
          warnings={warnings}
          busy={busy}
          isElectron={flightDeckApi.isElectron}
          onPickFiles={loadImport}
          onLoadDemo={() => loadImport([])}
          onPublish={publishCurrentDraft}
          onDraftChange={updateDraftField}
          onTrackChange={updateTrack}
          onTrackAdd={addTrack}
          onTrackRemove={removeTrack}
          publishLogs={publishLogs}
          lastPublish={lastPublish}
        />
      );
    }

    return (
      <FlightDeckTab
        settings={settingsDraft}
        gitStatus={appState.gitStatus}
        busy={busy}
        onSettingChange={(field, value) => setSettingsDraft((prev) => ({ ...prev, [field]: value }))}
        onSave={saveSettings}
        onSelectWorkspace={async () => {
          const nextSettings = await runAsyncAction(() => flightDeckApi.selectWorkspace(), 'Workspace aktualisiert.');
          if (nextSettings) {
            setSettingsDraft(nextSettings);
            await refreshState();
            await refreshTable();
          }
        }}
      />
    );
  };

  return (
    <div className="fd-app-shell">
      <header className="fd-app-header">
        <div>
          <span className="fd-eyebrow">AIRDOX</span>
          <h1>Flight Deck</h1>
          <p>{settingsDraft?.workspaceRoot || 'Kein Workspace gewaehlt'}</p>
        </div>
        <div className="fd-runtime-meta">
          <span className={`fd-status-pill ${appState.workspaceValid ? 'ok' : 'warn'}`}>
            {appState.workspaceValid ? 'Workspace verbunden' : 'Workspace fehlt'}
          </span>
          <span className="fd-status-pill neutral">{appState.gitStatus.branch || 'no-branch'}</span>
          {!flightDeckApi.isElectron && <span className="fd-status-pill mock">Mock API</span>}
        </div>
      </header>

      <nav className="fd-tabbar" aria-label="Flight Deck tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`fd-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {notice && (
        <section className={`fd-notice ${notice.tone}`}>
          <CircleAlert size={16} />
          <span>{notice.message}</span>
        </section>
      )}

      <main className="fd-main-content">
        {settingsDraft && renderTab()}
      </main>
    </div>
  );
};

export default DesktopApp;
