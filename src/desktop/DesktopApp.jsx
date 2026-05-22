import React, { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  CircleAlert, Database, LayoutDashboard, RadioTower, UploadCloud,
  BarChart3, Settings2, Package, Activity, BookOpen, Rocket, Bot,
  RefreshCw, Gauge, ListChecks, Sparkles, Palette,
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
import AssistantTab from './components/AssistantTab.jsx';
import ManniApprovalTab from './components/ManniApprovalTab.jsx';
import DesignAgentTab from './components/DesignAgentTab.jsx';
import GuidedTutorialOverlay from './components/GuidedTutorialOverlay.jsx';
import { TUTORIAL_TOURS } from './lib/tutorialContent.js';
import {
  AUDIO_EXTENSIONS,
  extractFilename,
  stripExtension,
} from './lib/setManifest.js';
import './desktop.css';

const TAB_GROUPS = [
  {
    id: 'run',
    label: 'Betrieb',
    description: 'Startpunkt, Live-Pipeline und tägliche Kontrolle.',
  },
  {
    id: 'publish',
    label: 'Publish',
    description: 'Sets vorbereiten, prüfen und gesammelt live stellen.',
  },
  {
    id: 'data',
    label: 'Daten',
    description: 'Analytics, Tabellen und Nutzer-/Eventsignale auswerten.',
  },
  {
    id: 'system',
    label: 'System',
    description: 'Workspace, Settings, Monitoring und Hilfe.',
  },
];

const TABS = [
  {
    id: 'overview',
    label: 'Overview',
    group: 'run',
    icon: LayoutDashboard,
    description: 'Status, Risiken und die wichtigsten nächsten Aktionen auf einen Blick.',
  },
  {
    id: 'flightdeck',
    label: 'Flight Deck',
    group: 'run',
    icon: RadioTower,
    description: 'Workspace und lokale Pipeline-Grundlagen verbinden.',
  },
  {
    id: 'import',
    label: 'Set Import',
    group: 'publish',
    icon: UploadCloud,
    description: 'Ein einzelnes Set vorbereiten, Tracklist prüfen und gezielt publizieren.',
  },
  {
    id: 'batch',
    label: 'Batch Import',
    group: 'publish',
    icon: Package,
    description: 'Mehrere Sets als Queue vorbereiten und kontrolliert live stellen.',
  },
  {
    id: 'marketing',
    label: 'Marketing Manager',
    group: 'publish',
    icon: Sparkles,
    description: 'Manni-Entwürfe, Freigaben und externe Aktionen sauber trennen.',
  },
  {
    id: 'design',
    label: 'Design Agent',
    group: 'publish',
    icon: Palette,
    description: 'Bilder, Cover & Reels über Photoshop und Gemini KI erzeugen.',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    group: 'data',
    icon: BarChart3,
    description: 'Plays, Views, Geräte, Länder und Set-Performance analysieren.',
  },
  {
    id: 'explorer',
    label: 'Data Explorer',
    group: 'data',
    icon: Database,
    description: 'Tabellen prüfen, exportieren und gezielte Read-only-Abfragen fahren.',
  },
  {
    id: 'settings',
    label: 'Advanced Settings',
    group: 'system',
    icon: Settings2,
    description: 'Pipeline-Optionen, Deploy-Verhalten und lokale Pfade einstellen.',
  },
  {
    id: 'monitor',
    label: 'System Monitor',
    group: 'system',
    icon: Activity,
    description: 'Lokale Ressourcen, Warnungen und Prozesse beobachten.',
  },
  {
    id: 'tutorial',
    label: 'Tutorial',
    group: 'system',
    icon: BookOpen,
    description: 'Geführte Szenarien für Import, Auswertung und Go Live.',
  },
  {
    id: 'assistant',
    label: 'AI Assistant',
    group: 'system',
    icon: Bot,
    description: 'Konkrete Fragen stellen und passende Bereiche direkt öffnen.',
  },
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

const getFilePath = (file) => {
  if (typeof file === 'string') return file;
  return file?.path || file?.webkitRelativePath || '';
};

const getFileExtension = (filePath = '') => {
  const filename = extractFilename(filePath);
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : '';
};

const normalizeBatchStem = (filePath = '') => stripExtension(extractFilename(filePath))
  .replace(/\.(tracks|mixcloud)$/i, '')
  .toLowerCase();

const isAudioFilePath = (filePath = '') => AUDIO_EXTENSIONS.includes(getFileExtension(filePath));

const buildBatchQueueItems = (filePaths = []) => {
  const uniquePaths = [...new Set(filePaths.map((entry) => String(entry || '').trim()).filter(Boolean))];
  const audioPaths = uniquePaths.filter(isAudioFilePath);
  const sidecarPaths = uniquePaths.filter((candidate) => !isAudioFilePath(candidate));

  return audioPaths.map((audioPath, index) => {
    const audioStem = normalizeBatchStem(audioPath);
    const matchingSidecars = sidecarPaths.filter((candidate) => normalizeBatchStem(candidate) === audioStem);
    const fallbackSidecars = audioPaths.length === 1
      ? sidecarPaths.filter((candidate) => !matchingSidecars.includes(candidate))
      : [];
    const groupedPaths = [...new Set([audioPath, ...matchingSidecars, ...fallbackSidecars])];

    return {
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
      fileName: extractFilename(audioPath),
      filePaths: groupedPaths,
      selected: true,
      status: 'pending',
      progress: 0,
      message: `${groupedPaths.length} Datei${groupedPaths.length === 1 ? '' : 'en'} erkannt`,
    };
  });
};

const isBatchLiveCandidate = (item) => (
  item?.selected !== false
  && item?.status !== 'processing'
  && item?.status !== 'success'
);

const buildLiveSettings = (settings = {}) => ({
  ...settings,
  uploadAudioToR2: true,
  autoBuild: true,
  autoDeploy: true,
});

const createPublishLogEntry = (step, status, detail) => ({
  timestamp: new Date().toISOString(),
  step,
  status,
  detail,
});

const getBatchProgressPercent = ({ current = 0, total = 0 } = {}) => (
  total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0
);

const confirmRiskyAction = (message) => {
  if (typeof window.confirm !== 'function') return true;
  return window.confirm(message);
};

const buildReservedSetValues = (sets = [], batchQueue = []) => {
  const queueDrafts = batchQueue
    .map((item) => item.draft)
    .filter(Boolean);
  const entries = [...(sets || []), ...queueDrafts];
  return {
    reservedSetIds: entries.map((entry) => entry.id).filter(Boolean),
    reservedSetTitles: entries.map((entry) => entry.title).filter(Boolean),
    reservedSetFiles: entries.map((entry) => entry.file).filter(Boolean),
  };
};

const DesktopApp = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [appState, setAppState] = useState({
    settings: null,
    sets: [],
    snapshot: null,
    dbError: null,
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
  const [publishStatus, setPublishStatus] = useState({
    state: 'idle',
    mode: '',
    label: 'Bereit',
    detail: 'Noch kein Publish gestartet.',
    progress: 0,
  });
  const [analyticsData, setAnalyticsData] = useState({});
  const [batchQueue, setBatchQueue] = useState([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const batchCancelRef = useRef(false);
  const [systemStats, setSystemStats] = useState({});
  const [manniCampaignState, setManniCampaignState] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialTourId, setTutorialTourId] = useState(DEFAULT_TOUR_ID);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [tutorialChecklist, setTutorialChecklist] = useState(loadTutorialChecklist);
  const liveRequiresSourceAudio = settingsDraft?.safeMode !== false;
  const canDraftGoLive = Boolean(
    settingsDraft?.workspaceRoot
    && draft?.id
    && draft?.file
    && (!liveRequiresSourceAudio || draft?.sourceAudioPath),
  );
  const selectedBatchCount = batchQueue.filter(isBatchLiveCandidate).length;
  const canGoLive = Boolean(
    settingsDraft?.workspaceRoot
    && (activeTab === 'batch' ? selectedBatchCount > 0 : (canDraftGoLive || selectedBatchCount > 0)),
  );
  const workspaceLabel = appState.workspaceValid ? 'Verbunden' : 'Fehlt';
  const gitLabel = appState.gitStatus.dirty ? 'Git offen' : 'Git sauber';
  const databaseLabel = appState.dbError ? 'DB Fehler' : 'DB bereit';
  const liveLabel = canGoLive ? 'Live bereit' : 'Live blockiert';
  const headerStats = [
    { label: 'Workspace', value: workspaceLabel, tone: appState.workspaceValid ? 'ok' : 'warn' },
    { label: 'Repository', value: gitLabel, tone: appState.gitStatus.dirty ? 'warn' : 'ok' },
    { label: 'Datenbank', value: databaseLabel, tone: appState.dbError ? 'danger' : 'ok' },
    { label: 'Queue', value: `${selectedBatchCount} aktiv`, tone: selectedBatchCount > 0 ? 'info' : 'neutral' },
  ];
  const readinessItems = useMemo(() => {
    const draftReady = Boolean(draft?.id && draft?.file);
    const sourceReady = !liveRequiresSourceAudio || Boolean(draft?.sourceAudioPath);
    return [
      {
        label: 'Workspace',
        detail: appState.workspaceValid ? 'verbunden' : 'fehlt',
        tone: appState.workspaceValid ? 'ok' : 'warn',
      },
      {
        label: 'Draft',
        detail: draftReady ? draft.id : selectedBatchCount > 0 ? `${selectedBatchCount} Batch` : 'nicht bereit',
        tone: draftReady || selectedBatchCount > 0 ? 'ok' : 'neutral',
      },
      {
        label: 'Audio',
        detail: sourceReady ? 'Quelle klar' : 'Quelle fehlt',
        tone: sourceReady ? 'ok' : 'warn',
      },
      {
        label: 'Pipeline',
        detail: busy || isBatchRunning ? 'laeuft' : canGoLive ? 'bereit' : 'blockiert',
        tone: busy || isBatchRunning ? 'info' : canGoLive ? 'ok' : 'warn',
      },
    ];
  }, [
    appState.workspaceValid,
    busy,
    canGoLive,
    draft?.file,
    draft?.id,
    draft?.sourceAudioPath,
    isBatchRunning,
    liveRequiresSourceAudio,
    selectedBatchCount,
  ]);
  const activeProgress = publishStatus.state === 'running'
    ? publishStatus.progress
    : isBatchRunning
      ? getBatchProgressPercent(batchProgress)
      : 0;
  const activeProgressLabel = publishStatus.state === 'running'
    ? publishStatus.label
    : isBatchRunning
      ? `Batch ${batchProgress.current} / ${batchProgress.total}`
      : canGoLive ? 'Pipeline bereit' : 'Pipeline wartet';
  const activeTabConfig = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const activeTabGroup = TAB_GROUPS.find((group) => group.id === activeTabConfig.group) || TAB_GROUPS[0];
  const blockingItems = readinessItems.filter((item) => item.tone === 'warn' || item.tone === 'danger');
  const nextStep = (() => {
    if (!appState.workspaceValid) {
      return {
        label: 'Workspace verbinden',
        detail: 'Ohne gueltiges AIRDOX-Verzeichnis bleiben Import, Datenbank und Deploy blockiert.',
        action: () => jumpToTab('flightdeck'),
        actionLabel: 'Workspace öffnen',
      };
    }
    if (activeTab === 'batch' && selectedBatchCount > 0) {
      return {
        label: 'Batch pruefen und live stellen',
        detail: `${selectedBatchCount} Set${selectedBatchCount === 1 ? '' : 's'} sind fuer die Live-Aktion markiert.`,
        action: () => goLiveBatchSelection(),
        actionLabel: 'Auswahl live stellen',
      };
    }
    if (canDraftGoLive) {
      return {
        label: 'Draft live bringen',
        detail: `${draft.id} ist vorbereitet. Vor Live kurz Titel, Audioquelle und Tracklist pruefen.`,
        action: () => goLiveNow(),
        actionLabel: 'Live ausfuehren',
      };
    }
    if (selectedBatchCount > 0) {
      return {
        label: 'Batch wartet',
        detail: 'Es gibt ausgewaehlte Batch-Sets. Wechsle in Batch Import fuer Kontrolle und Live-Lauf.',
        action: () => jumpToTab('batch'),
        actionLabel: 'Batch öffnen',
      };
    }
    return {
      label: 'Set vorbereiten',
      detail: 'Importiere ein Set oder baue eine Batch-Queue. Danach werden Publish und Go Live freigeschaltet.',
      action: () => jumpToTab('import'),
      actionLabel: 'Import starten',
    };
  })();

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
      if (!state?.settings) {
        throw new Error('Flight Deck state is unavailable.');
      }
      setAppState(state);
      setSettingsDraft(state.settings);
      if (state?.dbError) {
        setNotice({ tone: 'error', message: `Database unavailable: ${state.dbError}` });
      } else {
        setNotice(null);
      }
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
    setManniCampaignState(null);
  }, [settingsDraft?.workspaceRoot]);

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

  // Auto-load analytics data when switching to analytics tab
  useEffect(() => {
    if (activeTab === 'analytics' && (!analyticsData || !analyticsData.eventLogs)) {
      (async () => {
        setBusy(true);
        try {
          const data = await flightDeckApi.getAnalyticsData({ workspaceRoot: settingsDraft?.workspaceRoot });
          if (data) setAnalyticsData(data);
        } catch (error) {
          setNotice({ tone: 'error', message: `Analytics laden fehlgeschlagen: ${error.message}` });
        } finally {
          setBusy(false);
        }
      })();
    }
  }, [activeTab, analyticsData, settingsDraft?.workspaceRoot]);

  // Auto-load system stats when switching to monitor tab
  useEffect(() => {
    if (activeTab === 'monitor' && (!systemStats || !systemStats.memory)) {
      (async () => {
        setBusy(true);
        try {
          const stats = await flightDeckApi.getSystemStats({ workspaceRoot: settingsDraft?.workspaceRoot });
          if (stats) setSystemStats(stats);
        } catch {
          // Ignore — mock returns {}
        } finally {
          setBusy(false);
        }
      })();
    }
  }, [activeTab, settingsDraft?.workspaceRoot, systemStats]);

  useEffect(() => {
    if (activeTab === 'marketing' && !manniCampaignState) {
      (async () => {
        setBusy(true);
        try {
          const campaignState = await flightDeckApi.getManniCampaignState({ workspaceRoot: settingsDraft?.workspaceRoot });
          if (campaignState) setManniCampaignState(campaignState);
        } catch (error) {
          setNotice({ tone: 'error', message: `Manni-Daten laden fehlgeschlagen: ${error.message}` });
        } finally {
          setBusy(false);
        }
      })();
    }
  }, [activeTab, manniCampaignState, settingsDraft?.workspaceRoot]);

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

  const refreshWorkspaceStateForPublish = async () => {
    const latestState = await flightDeckApi.getState();
    if (!latestState?.workspaceValid) {
      throw new Error('Workspace ist ungueltig. Publish wurde gestoppt, bevor Daten geschrieben wurden.');
    }

    const latestWorkspaceRoot = latestState.settings?.workspaceRoot || settingsDraft?.workspaceRoot;
    const latestSettings = {
      ...(settingsDraft || {}),
      ...(latestState.settings || {}),
      workspaceRoot: latestWorkspaceRoot,
    };

    startTransition(() => {
      setAppState({ ...latestState, settings: latestSettings });
      setSettingsDraft(latestSettings);
    });

    return latestSettings;
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
    setPublishLogs([]);
    setLastPublish(null);
    setPublishStatus({
      state: 'idle',
      mode: '',
      label: 'Draft bereit',
      detail: `Import vorbereitet: ${result.draft?.id || 'new-set'}. Pruefe Titel, Tracklist und Quellen vor dem Publish.`,
      progress: 0,
    });
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

  const startPublishRun = ({ mode, label, detail, progress = 8 }) => {
    setBusy(true);
    setLastPublish(null);
    setPublishStatus({ state: 'running', mode, label, detail, progress });
    setPublishLogs([createPublishLogEntry(label, 'running', detail)]);
    setNotice({ tone: 'info', message: detail });
  };

  const updatePublishRun = ({ mode, label, detail, progress, appendLog = true }) => {
    setPublishStatus((currentStatus) => ({
      state: 'running',
      mode,
      label,
      detail,
      progress: progress ?? currentStatus.progress ?? 25,
    }));
    if (appendLog) {
      setPublishLogs((currentLogs) => [
        ...currentLogs,
        createPublishLogEntry(label, 'running', detail),
      ]);
    }
  };

  const finishPublishRun = ({ mode, label, detail, tone = 'success' }) => {
    setPublishStatus({
      state: tone === 'error' ? 'error' : 'success',
      mode,
      label,
      detail,
      progress: tone === 'error' ? 100 : 100,
    });
    setNotice({ tone, message: detail });
  };

  const hasSuccessfulLogStep = (result, stepName) => (result?.logs || []).some((entry) => (
    entry?.step === stepName && entry?.status === 'success'
  ));

  const publishCurrentDraft = async () => {
    startPublishRun({
      mode: 'publish',
      label: 'Preflight',
      detail: `Publish gestartet: ${draft.id || 'new-set'}. Workspace, Manifest und Flight-Deck-Settings werden geprueft.`,
      progress: 12,
    });

    try {
      const latestSettings = await refreshWorkspaceStateForPublish();
      updatePublishRun({
        mode: 'publish',
        label: 'Manifest',
        detail: latestSettings?.autoDeploy
          ? 'Workspace ist gueltig. Publish folgt deinen Settings inklusive Build, Deploy und Live-Verify.'
          : 'Workspace ist gueltig. Manifest wird aktualisiert; Auto Deploy ist in den Settings aus.',
        progress: 38,
      });
      const result = await flightDeckApi.publishSet({
        workspaceRoot: latestSettings?.workspaceRoot,
        draft,
        settings: latestSettings,
      });
      updatePublishRun({
        mode: 'publish',
        label: 'Finalize',
        detail: 'Manifest und Logs werden uebernommen, UI wird aktualisiert.',
        progress: 88,
      });
      if (result.publishedSet) {
        setDraft((currentDraft) => ({ ...currentDraft, ...result.publishedSet }));
      }
      setPublishLogs((currentLogs) => [
        ...currentLogs,
        ...(result.logs || []),
      ]);
      setLastPublish(result);
      const wentLive = hasSuccessfulLogStep(result, 'verify');
      const deployedWithoutVerify = hasSuccessfulLogStep(result, 'deploy') && latestSettings?.verifyLiveAfterDeploy === false;
      finishPublishRun({
        mode: 'publish',
        label: wentLive || deployedWithoutVerify ? 'Live abgeschlossen' : 'Publish lokal abgeschlossen',
        detail: wentLive
          ? `Set ${result?.publishedSet?.id || draft.id} ist live verifiziert.`
          : deployedWithoutVerify
            ? `Set ${result?.publishedSet?.id || draft.id} wurde deployed; Live-Verify ist deaktiviert.`
            : `Set ${result?.publishedSet?.id || draft.id} wurde lokal publiziert. Auto Deploy ist aus, daher ist es noch nicht live.`,
      });
      await refreshState();
      await refreshTable();
    } catch (error) {
      setPublishLogs((currentLogs) => [
        ...currentLogs,
        createPublishLogEntry('Publish fehlgeschlagen', 'error', error.message),
      ]);
      finishPublishRun({
        mode: 'publish',
        label: 'Publish fehlgeschlagen',
        detail: error.message,
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const publishLiveDraft = (targetDraft, savedSettings) => flightDeckApi.publishSet({
    workspaceRoot: savedSettings?.workspaceRoot,
    draft: targetDraft,
    settings: buildLiveSettings(savedSettings),
  });

  const goLiveNow = async () => {
    if (!draft?.id || !draft?.file) {
      setNotice({ tone: 'error', message: 'Bitte zuerst ein Set importieren und Draft-Felder pruefen.' });
      setActiveTab('import');
      return;
    }
    if (liveRequiresSourceAudio && !draft?.sourceAudioPath) {
      setNotice({ tone: 'error', message: 'Go Live braucht eine Audio Source aus dem Windows-Dateisystem.' });
      setActiveTab('import');
      return;
    }

    startPublishRun({
      mode: 'live',
      label: 'Live-Preflight',
      detail: `Live-Pipeline gestartet: ${draft.id}. Settings, Upload, Build und Deploy werden vorbereitet.`,
      progress: 10,
    });
    try {
      const latestSettings = await refreshWorkspaceStateForPublish();
      updatePublishRun({
        mode: 'live',
        label: 'Settings',
        detail: 'Workspace ist gueltig. Settings werden gespeichert.',
        progress: 25,
      });
      const savedSettings = await flightDeckApi.saveSettings(latestSettings);
      setSettingsDraft(savedSettings);

      updatePublishRun({
        mode: 'live',
        label: 'Live-Pipeline',
        detail: 'Upload, Manifest, Build, Deploy und Live-Verify laufen.',
        progress: 55,
      });
      const result = await publishLiveDraft(draft, savedSettings);
      updatePublishRun({
        mode: 'live',
        label: 'Live-Verify',
        detail: 'Live-Ergebnis wird uebernommen, Workspace und Tabellen werden aktualisiert.',
        progress: 88,
      });

      setPublishLogs((currentLogs) => [
        ...currentLogs,
        ...(result?.logs || []),
      ]);
      setLastPublish(result);
      if (result?.publishedSet) {
        setDraft((currentDraft) => ({ ...currentDraft, ...result.publishedSet }));
      }
      finishPublishRun({
        mode: 'live',
        label: 'Live abgeschlossen',
        detail: `Go Live ausgefuehrt: ${result?.publishedSet?.id || draft.id}`,
      });
      await refreshState();
      await refreshTable();
      setActiveTab('import');
    } catch (error) {
      setPublishLogs((currentLogs) => [
        ...currentLogs,
        createPublishLogEntry('Live fehlgeschlagen', 'error', error.message),
      ]);
      finishPublishRun({
        mode: 'live',
        label: 'Live fehlgeschlagen',
        detail: error.message,
        tone: 'error',
      });
      setActiveTab('import');
    } finally {
      setBusy(false);
    }
  };

  const addBatchItems = async (files = []) => {
    const filePaths = files.length
      ? files.map(getFilePath).filter(Boolean)
      : await flightDeckApi.pickImportFiles();

    if (!filePaths.length) {
      if (flightDeckApi.isElectron) return;
      setNotice({ tone: 'error', message: 'Batch braucht echte Dateipfade aus dem Windows-Tool.' });
      return;
    }

    const items = buildBatchQueueItems(filePaths);
    if (!items.length) {
      setNotice({ tone: 'error', message: 'Keine unterstuetzte Audio-Datei fuer den Batch gefunden.' });
      return;
    }

    setBatchQueue((prev) => [...prev, ...items]);
    setNotice({ tone: 'success', message: `${items.length} Set${items.length === 1 ? '' : 's'} zur Batch-Auswahl hinzugefuegt.` });
  };

  const updateBatchItem = (itemId, patch) => {
    setBatchQueue((prev) => prev.map((item) => (
      item.id === itemId ? { ...item, ...patch } : item
    )));
  };

  const prepareBatchSelection = async () => {
    const targets = batchQueue.filter((item) => (
      item.selected !== false
      && (item.status === 'pending' || item.status === 'error')
    ));

    if (!targets.length) {
      setNotice({ tone: 'error', message: 'Bitte waehle mindestens ein Batch-Set aus.' });
      return;
    }

    batchCancelRef.current = false;
    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: targets.length });
    let current = 0;
    const reserved = buildReservedSetValues(appState.sets, batchQueue);

    for (const item of targets) {
      if (batchCancelRef.current) break;
      try {
        updateBatchItem(item.id, {
          status: 'processing',
          progress: 20,
          errorMessage: '',
          message: 'Import-Draft wird vorbereitet...',
        });

        const result = await flightDeckApi.prepareImport({
          filePaths: item.filePaths || [],
          settings: settingsDraft,
          ...reserved,
        });
        if (result.draft?.id) reserved.reservedSetIds.push(result.draft.id);
        if (result.draft?.title) reserved.reservedSetTitles.push(result.draft.title);
        if (result.draft?.file) reserved.reservedSetFiles.push(result.draft.file);

        updateBatchItem(item.id, {
          draft: result.draft,
          warnings: result.warnings || [],
          title: result.draft?.title || item.title,
          setId: result.draft?.id || item.setId,
          status: 'ready',
          progress: 100,
          message: `Bereit: ${result.draft?.id || item.fileName}`,
        });
      } catch (error) {
        updateBatchItem(item.id, {
          status: 'error',
          progress: 0,
          errorMessage: error.message,
          message: '',
        });
      } finally {
        current += 1;
        setBatchProgress({ current, total: targets.length });
      }
    }

    if (batchCancelRef.current) {
      setNotice({ tone: 'info', message: `Batch pausiert nach ${current} von ${targets.length} Set${targets.length === 1 ? '' : 's'}.` });
    }
    setIsBatchRunning(false);
  };

  const goLiveBatchSelection = async () => {
    const targets = batchQueue.filter(isBatchLiveCandidate);
    if (!targets.length) {
      setNotice({ tone: 'error', message: 'Bitte waehle im Batch mindestens ein Set fuer Live aus.' });
      setActiveTab('batch');
      return;
    }

    setBusy(true);
    batchCancelRef.current = false;
    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: targets.length });

    let current = 0;
    let successCount = 0;
    let errorCount = 0;
    let lastResult = null;
    const logs = [];

    try {
      const latestSettings = await refreshWorkspaceStateForPublish();
      const savedSettings = await flightDeckApi.saveSettings(latestSettings);
      setSettingsDraft(savedSettings);
      const reserved = buildReservedSetValues(appState.sets, batchQueue);

      for (const item of targets) {
        if (batchCancelRef.current) break;
        try {
          updateBatchItem(item.id, {
            status: 'processing',
            progress: 15,
            errorMessage: '',
            message: 'Live-Pipeline startet...',
          });

          let itemDraft = item.draft;
          if (!itemDraft?.id || !itemDraft?.file) {
            const prepared = await flightDeckApi.prepareImport({
              filePaths: item.filePaths || [],
              settings: savedSettings,
              ...reserved,
            });
            itemDraft = prepared.draft;
            if (itemDraft?.id) reserved.reservedSetIds.push(itemDraft.id);
            if (itemDraft?.title) reserved.reservedSetTitles.push(itemDraft.title);
            if (itemDraft?.file) reserved.reservedSetFiles.push(itemDraft.file);
            updateBatchItem(item.id, {
              draft: itemDraft,
              warnings: prepared.warnings || [],
              title: itemDraft?.title || item.title,
              setId: itemDraft?.id || item.setId,
              progress: 40,
              message: `Draft bereit: ${itemDraft?.id || item.fileName}`,
            });
          }

          const result = await publishLiveDraft(itemDraft, savedSettings);
          const publishedSet = result?.publishedSet || itemDraft;
          lastResult = result;
          successCount += 1;
          logs.push(...(result?.logs || []).map((entry) => ({
            ...entry,
            step: `${publishedSet.id} / ${entry.step}`,
          })));
          if (publishedSet?.id) reserved.reservedSetIds.push(publishedSet.id);
          if (publishedSet?.title) reserved.reservedSetTitles.push(publishedSet.title);
          if (publishedSet?.file) reserved.reservedSetFiles.push(publishedSet.file);

          updateBatchItem(item.id, {
            draft: { ...itemDraft, ...publishedSet },
            title: publishedSet?.title || itemDraft.title,
            setId: publishedSet?.id || itemDraft.id,
            status: 'success',
            progress: 100,
            message: `Live: ${publishedSet.id}`,
          });
        } catch (error) {
          errorCount += 1;
          logs.push({
            timestamp: new Date().toISOString(),
            step: item.setId || item.title || item.fileName,
            status: 'error',
            detail: error.message,
          });
          updateBatchItem(item.id, {
            status: 'error',
            progress: 0,
            errorMessage: error.message,
            message: '',
          });
        } finally {
          current += 1;
          setBatchProgress({ current, total: targets.length });
        }
      }

      if (batchCancelRef.current) {
        logs.push({
          timestamp: new Date().toISOString(),
          step: 'Batch pausiert',
          status: 'warning',
          detail: `Ausfuehrung nach ${current} von ${targets.length} Sets angehalten.`,
        });
      }

      setPublishLogs(logs);
      setLastPublish({
        ok: errorCount === 0 && !batchCancelRef.current,
        logs,
        gitStatus: lastResult?.gitStatus,
        publishedSet: lastResult?.publishedSet || null,
        batchCount: successCount,
      });

      if (successCount > 0) {
        await refreshState();
        await refreshTable();
      }

      setNotice({
        tone: batchCancelRef.current ? 'info' : errorCount > 0 ? 'error' : 'success',
        message: batchCancelRef.current
          ? `${successCount} Set${successCount === 1 ? '' : 's'} live, Batch pausiert.`
          : errorCount > 0
            ? `${successCount} Set${successCount === 1 ? '' : 's'} live, ${errorCount} Fehler im Batch.`
            : `${successCount} Set${successCount === 1 ? '' : 's'} hochgeladen und live gesetzt.`,
      });
      setActiveTab('batch');
    } catch (error) {
      setNotice({ tone: 'error', message: error.message });
      setActiveTab('batch');
    } finally {
      setBusy(false);
      setIsBatchRunning(false);
    }
  };

  const goLivePrimary = () => {
    if (activeTab === 'batch') {
      return goLiveBatchSelection();
    }
    if (canDraftGoLive) {
      return goLiveNow();
    }
    if (selectedBatchCount > 0) {
      setActiveTab('batch');
      return goLiveBatchSelection();
    }
    setNotice({ tone: 'error', message: 'Bitte zuerst ein Set importieren oder Batch-Sets auswaehlen.' });
    return null;
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
          onJumpToTab={jumpToTab}
          onLoadImport={() => loadImport([])}
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
          isElectron={flightDeckApi.isElectron}
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
            if (!confirmRiskyAction(`${tableName} Eintrag ${id} wirklich loeschen?`)) return;
            await runAsyncAction(() => flightDeckApi.deleteRecords({ workspaceRoot: settingsDraft?.workspaceRoot, table: tableName, ids: [id] }), `${tableName} Eintrag geloescht.`);
            await refreshTable(tableName);
          }}
          onCreateVipUser={async (payload) => {
            await runAsyncAction(() => flightDeckApi.createVipUser({ workspaceRoot: settingsDraft?.workspaceRoot, ...payload }), `VIP User ${payload.username} angelegt.`);
            await refreshTable(tableName);
          }}
          onResetVipPassword={async (payload) => {
            if (!confirmRiskyAction(`Passwort fuer ${payload.username || payload.email || 'VIP User'} wirklich zuruecksetzen?`)) return;
            await runAsyncAction(() => flightDeckApi.resetVipPassword({ workspaceRoot: settingsDraft?.workspaceRoot, ...payload }), 'VIP Passwort ersetzt.');
          }}
          onRevokeSession={async (sessionId) => {
            if (!confirmRiskyAction(`Session ${sessionId} wirklich widerrufen?`)) return;
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
          onGoLive={goLiveNow}
          canGoLive={canDraftGoLive}
          goLiveDisabledReason="Go Live braucht eine Audio Source aus dem Windows-Dateisystem."
          onDraftChange={updateDraftField}
          onTrackChange={updateTrack}
          onTrackAdd={addTrack}
          onTrackRemove={removeTrack}
          publishLogs={publishLogs}
          lastPublish={lastPublish}
          publishStatus={publishStatus}
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
          onRefresh={async (query = {}) => {
            const data = await runAsyncAction(
              () => flightDeckApi.getAnalyticsData({ workspaceRoot: settingsDraft?.workspaceRoot, ...query }),
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
          onAddItems={addBatchItems}
          onRemoveItem={(index) => {
            setBatchQueue(batchQueue.filter((_, i) => i !== index));
          }}
          onToggleItem={(index, selected) => {
            setBatchQueue((prev) => prev.map((item, idx) => (
              idx === index ? { ...item, selected } : item
            )));
          }}
          onToggleAll={(selected) => {
            setBatchQueue((prev) => prev.map((item) => (
              item.status === 'processing' || item.status === 'success' ? item : { ...item, selected }
            )));
          }}
          onStartBatch={prepareBatchSelection}
          onGoLiveBatch={goLiveBatchSelection}
          onClearCompleted={() => {
            setBatchQueue(batchQueue.filter((item) => item.status !== 'success'));
          }}
          onRetryItem={(index) => {
            const target = batchQueue[index];
            if (!target) return;
            updateBatchItem(target.id, {
              status: 'pending',
              progress: 0,
              errorMessage: '',
              message: 'Bereit fuer erneuten Versuch',
            });
          }}
          onPauseBatch={() => {
            batchCancelRef.current = true;
            setIsBatchRunning(false);
            setNotice({ tone: 'info', message: 'Batch pausiert nach dem aktuell laufenden Set.' });
          }}
          isBatchRunning={isBatchRunning}
          batchProgress={batchProgress}
          busy={busy}
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
              'Cache geloescht.',
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

    if (activeTab === 'marketing') {
      return (
        <ManniApprovalTab
          state={manniCampaignState}
          busy={busy}
          onRefresh={async () => {
            const campaignState = await runAsyncAction(
              () => flightDeckApi.getManniCampaignState({ workspaceRoot: settingsDraft?.workspaceRoot }),
              'Manni-Vorschlaege aktualisiert.',
            );
            if (campaignState) setManniCampaignState(campaignState);
          }}
          onUpdateApproval={async (payload) => {
            const campaignState = await runAsyncAction(
              () => flightDeckApi.updateManniOperationApproval({ workspaceRoot: settingsDraft?.workspaceRoot, ...payload }),
              `Aktion ${payload.operationId} auf ${payload.status} gesetzt.`,
            );
            if (campaignState) {
              setManniCampaignState(campaignState);
              return { ok: true };
            }
            return { ok: false };
          }}
          onCreateDraftRequest={async (payload) => {
            const campaignState = await runAsyncAction(
              () => flightDeckApi.createMarketingDraftRequest({ workspaceRoot: settingsDraft?.workspaceRoot, ...payload }),
              `Entwurfsauftrag "${payload.title}" angelegt.`,
            );
            if (campaignState) setManniCampaignState(campaignState);
          }}
        />
      );
    }

    if (activeTab === 'design') {
      return (
        <DesignAgentTab
          sets={appState?.sets}
          busy={busy}
          flightDeckApi={flightDeckApi}
        />
      );
    }

    if (activeTab === 'assistant') {
      return (
        <AssistantTab
          appState={appState}
          onJumpToTab={jumpToTab}
          onRefresh={refreshState}
          onLoadImport={() => loadImport([])}
          onSyncStats={async () => {
            await runAsyncAction(() => flightDeckApi.syncTrackStats({ workspaceRoot: settingsDraft?.workspaceRoot }), 'Manifest-IDs mit track_stats synchronisiert.');
            await refreshState();
            await refreshTable();
          }}
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
        <div className="fd-brand-block">
          <span className="fd-eyebrow">AIRDOX</span>
          <div>
            <h1>Flight Deck</h1>
            <p>{settingsDraft?.workspaceRoot || 'Kein Workspace gewaehlt'}</p>
          </div>
        </div>
        <div className="fd-top-actions" aria-label="Globale Aktionen">
          <span className={`fd-status-pill ${appState.workspaceValid ? 'ok' : 'warn'}`}>
            {appState.workspaceValid ? 'Workspace verbunden' : 'Workspace fehlt'}
          </span>
          <span className={`fd-status-pill ${canGoLive ? 'ok' : 'warn'}`}>
            <Gauge size={14} />
            {liveLabel}
          </span>
          {!flightDeckApi.isElectron && <span className="fd-status-pill mock">Mock API</span>}
          <button type="button" className="fd-command-button" onClick={refreshState} disabled={busy}>
            <RefreshCw size={15} className={busy ? 'fd-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            className="fd-button"
            onClick={goLivePrimary}
            disabled={busy || isBatchRunning || !canGoLive}
            title="Speichert aktuelle Settings und bringt den aktuellen Draft oder die Batch-Auswahl live."
          >
            <Rocket size={16} />
            Alles ausfuehren & Live
          </button>
        </div>
      </header>

      <div className="fd-workbench">
        <aside className="fd-sidebar" aria-label="Flight Deck navigation">
          <div className="fd-sidebar-section fd-sidebar-primary">
            <span className="fd-sidebar-kicker">Naechster Schritt</span>
            <strong>{nextStep.label}</strong>
            <p>{nextStep.detail}</p>
            <button
              type="button"
              className="fd-button secondary"
              onClick={nextStep.action}
              disabled={busy || isBatchRunning}
            >
              <Rocket size={15} />
              {nextStep.actionLabel}
            </button>
          </div>

          <nav className="fd-sidebar-nav" aria-label="Flight Deck tabs">
            {TAB_GROUPS.map((group) => (
              <section key={group.id} className="fd-nav-group">
                <div className="fd-nav-group-head">
                  <span>{group.label}</span>
                  <small>{group.description}</small>
                </div>
                {TABS.filter((tab) => tab.group === group.id).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`fd-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                      <small aria-hidden="true">{tab.description}</small>
                    </button>
                  );
                })}
              </section>
            ))}
          </nav>
        </aside>

        <section className="fd-workspace">
          <section className="fd-workspace-head">
            <div className="fd-workspace-title">
              <span className="fd-eyebrow">{activeTabGroup.label}</span>
              <h2>{activeTabConfig.label}</h2>
              <p>{activeTabConfig.description}</p>
            </div>
            <div className="fd-workspace-actions">
              <button type="button" className="fd-command-button" onClick={() => jumpToTab('import')}>
                <UploadCloud size={15} />
                Import
              </button>
              <button type="button" className="fd-command-button" onClick={() => jumpToTab('batch')}>
                <ListChecks size={15} />
                Batch
              </button>
              <button type="button" className="fd-command-button" onClick={() => jumpToTab('assistant')}>
                <Bot size={15} />
                Assistant
              </button>
              <button
                type="button"
                className="fd-command-button"
                onClick={() => openTutorial({ tourId: DEFAULT_TOUR_ID, tabId: activeTab })}
              >
                <BookOpen size={15} />
                Interaktive Tour
              </button>
            </div>
          </section>

          <section className="fd-ops-brief" aria-label="Operations Status">
            <div className="fd-ops-states">
              {headerStats.map((stat) => (
                <span key={stat.label} className={`fd-health-tile ${stat.tone}`}>
                  <small>{stat.label}</small>
                  <strong>{stat.value}</strong>
                </span>
              ))}
            </div>
            <div className="fd-ops-readiness">
              {readinessItems.map((item) => (
                <span key={item.label} className={`fd-readiness-item ${item.tone}`}>
                  <small>{item.label}</small>
                  <strong>{item.detail}</strong>
                </span>
              ))}
            </div>
            <div
              className={`fd-operation-progress ${busy || isBatchRunning ? 'active' : ''}`}
              role="progressbar"
              aria-label="Aktueller Prozessfortschritt"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={activeProgress}
            >
              <div className="fd-operation-progress-head">
                <span>{activeProgressLabel}</span>
                <strong>{activeProgress}%</strong>
              </div>
              <div className="fd-operation-progress-track">
                <span style={{ width: `${activeProgress}%` }} />
              </div>
            </div>
            <div className={`fd-blocker-summary ${blockingItems.length ? 'warn' : 'ok'}`}>
              <strong>{blockingItems.length ? `${blockingItems.length} Blocker` : 'Betrieb klar'}</strong>
              <span>
                {blockingItems.length
                  ? blockingItems.map((item) => `${item.label}: ${item.detail}`).join(' / ')
                  : 'Keine akuten Blocker in Workspace, Draft, Audio oder Pipeline.'}
              </span>
            </div>
          </section>

          {notice && (
            <section className={`fd-notice ${notice.tone}`}>
              <CircleAlert size={16} />
              <span>{notice.message}</span>
            </section>
          )}

          <main className="fd-main-content">
            {settingsDraft && renderTab()}
          </main>

          <button
            type="button"
            className="fd-tour-fab"
            onClick={() => openTutorial({ tourId: DEFAULT_TOUR_ID, tabId: activeTab })}
            aria-label="Tour öffnen"
          >
            <BookOpen size={16} />
          </button>
        </section>
      </div>

      {tutorialOpen && (
        <GuidedTutorialOverlay
          isOpen
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
      )}
    </div>
  );
};

export default DesktopApp;
