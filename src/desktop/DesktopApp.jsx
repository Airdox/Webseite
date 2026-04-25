import React, { startTransition, useCallback, useDeferredValue, useEffect, useState } from 'react';
import {
  CircleAlert, Database, LayoutDashboard, RadioTower, UploadCloud,
  BarChart3, Settings2, Package, Activity, BookOpen
} from 'lucide-react';
import { flightDeckApi } from './api.js';
import OverviewTab from './components/OverviewTab.jsx';
import DataExplorerTab from './components/DataExplorerTab.jsx';
import SetImportTab from './components/SetImportTab.jsx';
import FlightDeckTab from './components/FlightDeckTab.jsx';
import AdvancedAnalyticsTab from './components/AdvancedAnalyticsTab.jsx';
import BatchImportTab from './components/BatchImportTab.jsx';
import AdvancedSettingsTab from './components/AdvancedSettingsTab.jsx';
import SystemMonitorTab from './components/SystemMonitorTab.jsx';
import TutorialTab from './components/TutorialTab.jsx';
import GuidedTutorialOverlay from './components/GuidedTutorialOverlay.jsx';
import { TUTORIAL_TOURS } from './lib/tutorialContent.js';
import './desktop.css';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'explorer', label: 'Data Explorer', icon: Database },
  { id: 'import', label: 'Set Import', icon: UploadCloud },
  { id: 'batch', label: 'Batch Import', icon: Package },
  { id: 'flightdeck', label: 'Flight Deck', icon: RadioTower },
  { id: 'settings', label: 'Advanced Settings', icon: Settings2 },
  { id: 'monitor', label: 'System Monitor', icon: Activity },
  { id: 'tutorial', label: 'Tutorial', icon: BookOpen },
];

const TUTORIAL_CHECKLIST_KEY = 'flightdeck-tutorial-checklist';
const TUTORIAL_WELCOME_KEY = 'flightdeck-tutorial-welcome-dismissed';
const DEFAULT_TOUR_ID = 'full';

const loadTutorialChecklist = () => {
  try {
    return JSON.parse(window.localStorage.getItem(TUTORIAL_CHECKLIST_KEY) || '{}');
  } catch {
    return {};
  }
};

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
  const [analyticsData, setAnalyticsData] = useState({});
  const [batchQueue, setBatchQueue] = useState([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [systemStats, setSystemStats] = useState({});
  const [saveStatus, setSaveStatus] = useState(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialTourId, setTutorialTourId] = useState(DEFAULT_TOUR_ID);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [tutorialChecklist, setTutorialChecklist] = useState(loadTutorialChecklist);

  const deferredSearch = useDeferredValue(search);
  const filteredRows = rows.filter((row) => matchesSearch(row, deferredSearch));
  const activeTutorialTour = TUTORIAL_TOURS[tutorialTourId] || TUTORIAL_TOURS[DEFAULT_TOUR_ID];
  const tutorialSteps = activeTutorialTour.steps;

  const markTutorialVisited = useCallback((tabId) => {
    if (!tabId || tabId === 'tutorial') return;
    setTutorialChecklist((currentChecklist) => {
      if (currentChecklist[tabId]) {
        return currentChecklist;
      }
      const nextChecklist = { ...currentChecklist, [tabId]: true };
      try {
        window.localStorage.setItem(TUTORIAL_CHECKLIST_KEY, JSON.stringify(nextChecklist));
      } catch {
        // ignore persistence errors
      }
      return nextChecklist;
    });
  }, []);

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

  const refreshTable = useCallback(async (currentTable = tableName, workspaceRoot = settingsDraft?.workspaceRoot) => {
    if (!appState.workspaceValid) {
      setRows([]);
      return;
    }
    setBusy(true);
    try {
      const nextRows = await flightDeckApi.listTable({ table: currentTable, workspaceRoot });
      startTransition(() => setRows(nextRows));
    } catch (error) {
      setNotice({ tone: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  }, [appState.workspaceValid, settingsDraft?.workspaceRoot, tableName]);

  useEffect(() => {
    refreshState();
  }, []);

  useEffect(() => {
    markTutorialVisited(activeTab);
  }, [activeTab, markTutorialVisited]);

  useEffect(() => {
    if (!flightDeckApi.isElectron) return;
    try {
      const dismissed = window.localStorage.getItem(TUTORIAL_WELCOME_KEY);
      if (!dismissed) {
        setTutorialOpen(true);
      }
    } catch {
      setTutorialOpen(true);
    }
  }, []);

  useEffect(() => {
    if (settingsDraft) {
      refreshTable(tableName, settingsDraft.workspaceRoot);
    }
  }, [tableName, appState.workspaceValid, refreshTable, settingsDraft]);

  useEffect(() => {
    if (!tutorialOpen) return;
    const currentStep = tutorialSteps[tutorialStepIndex];
    if (currentStep?.tabId && currentStep.tabId !== activeTab) {
      setActiveTab(currentStep.tabId);
    }
    if (currentStep?.checklistId && currentStep.checklistId !== 'tutorial') {
      markTutorialVisited(currentStep.checklistId);
    }
  }, [activeTab, markTutorialVisited, tutorialOpen, tutorialStepIndex, tutorialSteps]);

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
      return null;
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
    if (!result) return;
    setDraft(result.draft);
    setWarnings(result.warnings || []);
    setActiveTab('import');
  };

  const saveSettings = async () => {
    const nextSettings = await runAsyncAction(
      () => flightDeckApi.saveSettings(settingsDraft),
      'Flight-Deck-Settings gespeichert.',
    );
    if (!nextSettings) return;
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
    if (!result) return;
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

  const openTutorial = (target = null) => {
    let nextTourId = DEFAULT_TOUR_ID;
    let nextIndex = 0;

    if (typeof target === 'string') {
      if (TUTORIAL_TOURS[target]) {
        nextTourId = target;
      } else {
        const defaultSteps = TUTORIAL_TOURS[DEFAULT_TOUR_ID].steps;
        nextIndex = Math.max(defaultSteps.findIndex((step) => step.tabId === target), 0);
      }
    }

    if (target && typeof target === 'object') {
      if (target.tourId && TUTORIAL_TOURS[target.tourId]) {
        nextTourId = target.tourId;
      }
      const nextSteps = TUTORIAL_TOURS[nextTourId].steps;
      if (target.stepId) {
        nextIndex = Math.max(nextSteps.findIndex((step) => step.id === target.stepId), 0);
      } else if (target.tabId) {
        nextIndex = Math.max(nextSteps.findIndex((step) => step.tabId === target.tabId), 0);
      }
    }

    setTutorialTourId(nextTourId);
    setTutorialStepIndex(nextIndex);
    setTutorialOpen(true);
  };

  const closeTutorial = () => {
    setTutorialOpen(false);
    try {
      window.localStorage.setItem(TUTORIAL_WELCOME_KEY, 'true');
    } catch {
      // ignore persistence errors
    }
  };

  const goToTutorialStep = (direction) => {
    const nextIndex = Math.min(
      Math.max(tutorialStepIndex + direction, 0),
      tutorialSteps.length - 1,
    );
    setTutorialStepIndex(nextIndex);
  };

  const jumpToTab = (tabId) => {
    setActiveTab(tabId);
    markTutorialVisited(tabId);
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
            if (!result) return;
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

    if (activeTab === 'analytics') {
      return (
        <AdvancedAnalyticsTab
          analyticsData={analyticsData}
          onExport={(type) => runAsyncAction(
            () => flightDeckApi.exportAnalyticsReport({ workspaceRoot: settingsDraft?.workspaceRoot, type }),
            `${type} Report exportiert.`,
          )}
          onRefresh={async () => {
            const data = await runAsyncAction(
              () => flightDeckApi.getAnalyticsData({ workspaceRoot: settingsDraft?.workspaceRoot }),
              'Analytics aktualisiert.',
            );
            if (data) setAnalyticsData(data);
          }}
          busy={busy}
        />
      );
    }

    if (activeTab === 'batch') {
      return (
        <BatchImportTab
          batchQueue={batchQueue}
          onAddItems={async (files) => {
            const items = files.map((file) => ({
              id: `${Date.now()}-${Math.random()}`,
              fileName: file.name,
              status: 'pending',
              progress: 0,
            }));
            setBatchQueue([...batchQueue, ...items]);
          }}
          onRemoveItem={(index) => {
            setBatchQueue(batchQueue.filter((_, i) => i !== index));
          }}
          onStartBatch={async () => {
            setIsBatchRunning(true);
            const total = batchQueue.filter((item) => item.status === 'pending').length;
            let current = 0;
            setBatchProgress({ current, total });

            for (let i = 0; i < batchQueue.length; i += 1) {
              const item = batchQueue[i];
              if (item.status !== 'pending') {
                 
                continue;
              }

              try {
                setBatchQueue((prev) =>
                  prev.map((it, idx) => (idx === i ? { ...it, status: 'processing' } : it)),
                );

                // Simulate batch processing
                await new Promise((resolve) => setTimeout(resolve, 1000));

                current += 1;
                setBatchProgress({ current, total });

                setBatchQueue((prev) =>
                  prev.map((it, idx) =>
                    idx === i ? { ...it, status: 'success', message: 'Import erfolgreich' } : it,
                  ),
                );
              } catch (error) {
                setBatchQueue((prev) =>
                  prev.map((it, idx) =>
                    idx === i ? { ...it, status: 'error', errorMessage: error.message } : it,
                  ),
                );
              }
            }

            setIsBatchRunning(false);
          }}
          onClearCompleted={() => {
            setBatchQueue(batchQueue.filter((item) => item.status === 'pending'));
          }}
          onPauseBatch={() => {
            setIsBatchRunning(false);
          }}
          isBatchRunning={isBatchRunning}
          batchProgress={batchProgress}
        />
      );
    }

    if (activeTab === 'settings') {
      return (
        <AdvancedSettingsTab
          settings={settingsDraft}
          onSettingChange={(field, value) => setSettingsDraft((prev) => ({ ...prev, [field]: value }))}
          onSave={async (newSettings) => {
            setSaveStatus({ type: 'pending', message: 'Speichern...' });
            const saved = await runAsyncAction(
              () => flightDeckApi.saveSettings(newSettings),
              'Settings gespeichert.',
            );
            if (saved) {
              setSettingsDraft(saved);
              setSaveStatus({ type: 'success', message: 'Erfolgreich gespeichert!' });
              setTimeout(() => setSaveStatus(null), 3000);
            } else {
              setSaveStatus({ type: 'error', message: 'Speichern fehlgeschlagen.' });
            }
          }}
          onReset={async () => {
            const state = await runAsyncAction(
              () => flightDeckApi.getState(),
              'Settings zurückgesetzt.',
            );
            if (state) {
              setSettingsDraft(state.settings);
              setSaveStatus({ type: 'success', message: 'Zurückgesetzt!' });
              setTimeout(() => setSaveStatus(null), 3000);
            }
          }}
          gitStatus={appState.gitStatus}
          busy={busy}
          saveStatus={saveStatus}
        />
      );
    }

    if (activeTab === 'monitor') {
      return (
        <SystemMonitorTab
          systemStats={systemStats}
          onRefresh={async () => {
            const stats = await runAsyncAction(
              () => flightDeckApi.getSystemStats({ workspaceRoot: settingsDraft?.workspaceRoot }),
              'System Monitor aktualisiert.',
            );
            if (stats) setSystemStats(stats);
          }}
          onClearCache={async () => {
            await runAsyncAction(
              () => flightDeckApi.clearCache({ workspaceRoot: settingsDraft?.workspaceRoot }),
              'Cache gelöschrt.',
            );
          }}
          onOptimize={async () => {
            await runAsyncAction(
              () => flightDeckApi.optimizeSystem({ workspaceRoot: settingsDraft?.workspaceRoot }),
              'System optimiert.',
            );
          }}
          busy={busy}
        />
      );
    }

    if (activeTab === 'tutorial') {
      return (
        <TutorialTab
          checklistState={tutorialChecklist}
          onJumpToTab={jumpToTab}
          onStartTour={openTutorial}
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
          <button
            type="button"
            className="fd-button secondary"
            onClick={() => openTutorial({ tourId: DEFAULT_TOUR_ID, tabId: activeTab })}
          >
            <BookOpen size={16} />
            Interaktive Tour
          </button>
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

      <GuidedTutorialOverlay
        isOpen={tutorialOpen}
        tour={activeTutorialTour}
        step={tutorialSteps[tutorialStepIndex]}
        stepIndex={tutorialStepIndex}
        totalSteps={tutorialSteps.length}
        checklistState={tutorialChecklist}
        onClose={closeTutorial}
        onPrevious={() => goToTutorialStep(-1)}
        onNext={() => {
          if (tutorialStepIndex >= tutorialSteps.length - 1) {
            closeTutorial();
            jumpToTab('tutorial');
            return;
          }
          goToTutorialStep(1);
        }}
        onJumpToTab={jumpToTab}
      />
    </div>
  );
};

export default DesktopApp;
