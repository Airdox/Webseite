import { ASSISTANT_KNOWLEDGE, ASSISTANT_ACTIONS } from './assistantKnowledge.js';
import { formatAssistantGuide } from './assistantGuides.js';

const ERROR_EXPLAINERS = [
  {
    id: 'no-audio',
    pattern: /(no supported audio file|keine unterstuetzte audio|keine unterstützte audio)/i,
    title: 'Keine Audiodatei gefunden',
    cause: 'Im Import lagen keine Dateien, die Flight Deck als Audio erkennt.',
    steps: [
      'Wähle eine echte MP3, WAV, FLAC, M4A oder ähnliche Audiodatei aus.',
      'Ziehe nicht nur Cover oder Tracklist in den Import.',
      'Wenn du im Browser-Testmodus bist: nutze "Demo Import" oder starte das Windows Flight Deck.',
    ],
  },
  {
    id: 'tracklist-no-timestamps',
    pattern: /(no seekable timestamps|no seekable tracklist|has no seekable tracklist|tracklist detected)/i,
    title: 'Tracklist hat keine nutzbaren Zeitmarken',
    cause: 'Die Tracklist wurde gefunden, aber Flight Deck kann keine springbaren Zeiten wie 00:00, 12:34 oder 01:02:03 lesen.',
    steps: [
      'Öffne die Tracklist-Datei und prüfe, ob jede Zeile eine Zeit enthält.',
      'Nutze ein klares Format, z.B. "00:00 Artist - Titel" oder "time | artist | title".',
      'Alternativ importiere eine passende .tracks.json, .mixcloud.txt oder Rekordbox .cue Datei.',
      'Danach den Import neu vorbereiten und die Tracklist im Draft prüfen.',
    ],
  },
  {
    id: 'missing-draft-fields',
    pattern: /(draft is missing|required fields|id, title, file)/i,
    title: 'Pflichtfelder im Draft fehlen',
    cause: 'Der Set-Entwurf ist noch nicht vollständig. Mindestens ID, Titel oder Datei fehlt.',
    steps: [
      'Öffne den Tab "Set Import".',
      'Fülle ID, Titel und Datei aus.',
      'Prüfe, ob die Audio Source gesetzt ist.',
      'Erst danach erneut "Publish nach Settings" oder "Alles ausführen & Live" starten.',
    ],
  },
  {
    id: 'generic-title',
    pattern: /(keinen publish-faehigen set-titel|keinen publish-fähigen set-titel|generic set title|set title needs review)/i,
    title: 'Set-Titel ist zu allgemein',
    cause: 'Flight Deck konnte keinen echten Namen für das Set ableiten.',
    steps: [
      'Trage im Draft einen klaren Titel ein, z.B. "Berlin Pressure Set 06.06.2026".',
      'Lass nicht nur "AIRDOX Set" oder einen reinen Recorder-Dateinamen stehen.',
      'Prüfe danach ID und Datei, damit keine doppelten Einträge entstehen.',
    ],
  },
  {
    id: 'safe-mode-audio',
    pattern: /(safe mode blocked|source audio path is missing|audio source)/i,
    title: 'Safe Mode blockiert wegen fehlender Audio-Quelle',
    cause: 'Safe Mode schützt dich davor, ein Set ohne echte lokale Audiodatei live zu stellen.',
    steps: [
      'Wähle die Audiodatei erneut über "Dateien wählen" im Windows Flight Deck aus.',
      'Prüfe im Draft das Feld "Audio Source". Dort muss ein Windows-Dateipfad stehen.',
      'Wenn die Audiodatei bereits sicher in R2 liegt, kannst du Safe Mode bewusst deaktivieren. Für normale Publishes besser anlassen.',
    ],
  },
  {
    id: 'wav-conversion',
    pattern: /(wav files|convert wav|ffmpeg|failed to convert wav)/i,
    title: 'WAV kann nicht in MP3 umgewandelt werden',
    cause: 'WAV-Dateien müssen vor dem Publish in MP3 konvertiert werden. Dafür braucht Flight Deck die lokale Quelldatei und ffmpeg.',
    steps: [
      'Prüfe, ob im Draft eine Audio Source gesetzt ist.',
      'Installiere ffmpeg oder stelle eine fertige MP3 bereit.',
      'Importiere danach die Audiodatei neu.',
      'Wenn möglich: direkt eine MP3 statt WAV verwenden.',
    ],
  },
  {
    id: 'workspace',
    pattern: /(workspace is not configured|workspace.*invalid|workspace fehlt|workspace nicht verbunden)/i,
    title: 'Workspace ist nicht verbunden oder ungültig',
    cause: 'Flight Deck weiß nicht sicher, in welchem AIRDOX-Projekt es arbeiten soll.',
    steps: [
      'Öffne "Flight Deck" oder "Advanced Settings".',
      'Klicke "Workspace auswählen".',
      'Wähle den Ordner, in dem package.json, wrangler.jsonc und src/data/musicSets.js liegen.',
      'Speichere die Settings und drücke Refresh.',
    ],
  },
  {
    id: 'r2',
    pattern: /(r2|bucket|aws_access_key|aws_secret|s3|uploaded audio|access denied|signature)/i,
    title: 'R2 Upload oder Cloudflare-Zugang macht Probleme',
    cause: 'Der Upload zur Audio-Ablage kann Credentials, Bucket, Prefix oder Netzwerk nicht sauber nutzen.',
    steps: [
      'Prüfe die .env im Workspace: AWS_ACCESS_KEY_ID und AWS_SECRET_ACCESS_KEY müssen gesetzt sein.',
      'Prüfe Bucket und R2 Prefix in den Settings.',
      'Teste die Internetverbindung und Cloudflare-Zugänge.',
      'Starte danach den Publish erneut.',
    ],
  },
  {
    id: 'build',
    pattern: /(build failed|vite|npm run build|command failed:.*build|failed to build)/i,
    title: 'Build ist fehlgeschlagen',
    cause: 'Die Website konnte lokal nicht erfolgreich gebaut werden.',
    steps: [
      'Öffne ein Terminal im Workspace.',
      'Führe den Build Command aus den Settings manuell aus, meistens "npm run build".',
      'Lies die erste konkrete Fehlermeldung, nicht nur die letzte Zeile.',
      'Behebe den Code- oder Dependency-Fehler und starte danach den Publish erneut.',
    ],
  },
  {
    id: 'deploy',
    pattern: /(deploy failed|wrangler|cloudflare|command failed:.*deploy)/i,
    title: 'Deploy ist fehlgeschlagen',
    cause: 'Der Build kann fertig sein, aber das Hochladen zu Cloudflare ist gescheitert.',
    steps: [
      'Prüfe den Deploy Command in den Settings.',
      'Prüfe, ob Wrangler angemeldet ist und Cloudflare erreichbar ist.',
      'Führe den Deploy Command einmal manuell im Terminal aus.',
      'Wenn der manuelle Deploy klappt, starte im Flight Deck erneut.',
    ],
  },
  {
    id: 'verify',
    pattern: /(live verify failed|missing.*bundle|fingerprint mismatch|no javascript bundle|deployed bundle is missing|fetch failed)/i,
    title: 'Live-Verify findet das Set noch nicht auf der Website',
    cause: 'Der Deploy ist nicht sicher auf der Live-Seite angekommen oder das Live-Bundle enthält die erwarteten Set-Daten noch nicht.',
    steps: [
      'Warte kurz und drücke Refresh, weil Cloudflare-Caches manchmal nachlaufen.',
      'Öffne die Website und prüfe, ob das neue Set sichtbar ist.',
      'Wenn es nicht sichtbar ist: Deploy Command erneut prüfen und ausführen.',
      'Wenn es sichtbar ist, aber Verify scheitert: Set-ID, Titel und Track-Zeiten im Draft prüfen.',
    ],
  },
  {
    id: 'database',
    pattern: /(database|datenbank|neon|postgres|track_stats|connection|fetch failed)/i,
    title: 'Datenbank ist nicht erreichbar oder Stats konnten nicht geschrieben werden',
    cause: 'Analytics, User-Daten oder track_stats brauchen eine funktionierende Neon/Postgres-Verbindung.',
    steps: [
      'Prüfe die .env im Workspace: DATABASE_URL oder NEON_DATABASE_URL muss gesetzt sein.',
      'Prüfe Internet/VPN/Firewall.',
      'Öffne das Neon-Dashboard und wecke die Datenbank, falls sie schläft.',
      'Das Flight Deck bleibt nutzbar, aber Analytics/Users/Sessions können fehlen.',
    ],
  },
];

export const explainFlightDeckError = (message = '') => {
  const raw = String(message || '').trim();
  if (!raw) return null;
  const match = ERROR_EXPLAINERS.find((entry) => entry.pattern.test(raw));
  if (!match) {
    return {
      title: 'Fehler erkannt',
      cause: 'Flight Deck hat einen Fehler gemeldet, aber er passt zu keinem bekannten Muster.',
      steps: [
        'Kopiere die genaue Fehlermeldung aus dem Publish Log.',
        'Nenne den letzten Schritt: Import, Publish, Build, Deploy oder Verify.',
        'Prüfe zuerst Workspace, Audio Source und Tracklist, weil diese drei Punkte die häufigsten Ursachen sind.',
      ],
      raw,
    };
  }
  return { ...match, raw };
};

export const formatFlightDeckErrorHelp = (message = '') => {
  const help = explainFlightDeckError(message);
  if (!help) return '';
  return [
    `Hilfe: ${help.title}`,
    `Was bedeutet das? ${help.cause}`,
    'So behebst du es:',
    ...help.steps.map((step, index) => `${index + 1}. ${step}`),
  ].join('\n');
};

const tokenize = (text = '') => text
  .toLowerCase()
  .replace(/[^a-z0-9äöüß\s]/gi, ' ')
  .split(/\s+/)
  .filter(Boolean);

const normalizeToken = (token = '') => token
  .toLowerCase()
  .replace(/[ä]/g, 'ae')
  .replace(/[ö]/g, 'oe')
  .replace(/[ü]/g, 'ue')
  .replace(/[ß]/g, 'ss')
  .replace(/(en|er|es|e|n|s)$/i, '');

export const findBestKnowledgeMatch = (question = '') => {
  const rawWords = tokenize(question);
  const words = new Set(rawWords);
  const normalizedWords = new Set(rawWords.map(normalizeToken));
  let best = null;
  let bestScore = 0;

  for (const item of ASSISTANT_KNOWLEDGE) {
    const score = item.keywords.reduce((sum, keyword) => {
      const keyParts = tokenize(keyword);
      if (keyParts.length === 1) {
        const key = keyParts[0];
        const keyNorm = normalizeToken(key);
        if (words.has(key)) return sum + 2;
        if (normalizedWords.has(keyNorm)) return sum + 1;
        for (const w of rawWords) {
          const wNorm = normalizeToken(w);
          if (w.length >= 4 && key.length >= 4 && (w.includes(key) || key.includes(w))) return sum + 1;
          if (wNorm.length >= 4 && keyNorm.length >= 4 && (wNorm.includes(keyNorm) || keyNorm.includes(wNorm))) return sum + 1;
        }
        return sum;
      }
      const phrase = keyParts.join(' ');
      return sum + (question.toLowerCase().includes(phrase) ? 2 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return { match: best, score: bestScore };
};

/**
 * Parse action intents from user messages.
 * Returns array of action IDs that should be suggested.
 */
export const parseActionIntents = (question = '') => {
  const lower = question.toLowerCase();
  const intents = [];

  // Navigation intents
  const navPatterns = [
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:overview|übersicht|dashboard)/i, action: 'navigate:overview' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:analytics|statistik|auswertung)/i, action: 'navigate:analytics' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:explorer|daten|tabelle)/i, action: 'navigate:explorer' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:import|set import)/i, action: 'navigate:import' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:batch)/i, action: 'navigate:batch' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:marketing|manni)/i, action: 'navigate:marketing' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:design|designer|creative|studio)/i, action: 'navigate:design' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:flight deck|flightdeck)/i, action: 'navigate:flightdeck' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:setting|einstellung|konfiguration)/i, action: 'navigate:settings' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:monitor|system)/i, action: 'navigate:monitor' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:tutorial|hilfe|guide)/i, action: 'navigate:tutorial' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:assistant|assistent|ki)/i, action: 'navigate:assistant' },
  ];

  for (const { pattern, action } of navPatterns) {
    if (pattern.test(lower)) {
      intents.push(action);
    }
  }

  // Action intents
  if (/(?:aktualisier|refresh|neu laden|lade.*neu)/i.test(lower)) {
    intents.push('action:refresh');
  }
  if (/(?:import.*starten|set.*importieren|starte.*import)/i.test(lower)) {
    intents.push('action:import');
  }
  if (/(?:stats.*sync|synchronisier|sync.*stats)/i.test(lower)) {
    intents.push('action:sync-stats');
  }

  return intents;
};

/**
 * Build a status summary from the current app state.
 */
export const buildStatusSummary = (appState = {}) => {
  const parts = [];

  if (appState.workspaceValid) {
    parts.push('✅ Workspace verbunden');
  } else {
    parts.push('⚠️ Workspace nicht verbunden');
  }

  if (appState.dbError) {
    parts.push(`❌ DB-Fehler: ${appState.dbError}`);
  } else {
    parts.push('✅ Datenbank bereit');
  }

  if (appState.gitStatus) {
    const git = appState.gitStatus;
    parts.push(`${git.dirty ? '⚠️' : '✅'} Git: ${git.branch || 'kein Branch'} ${git.dirty ? '(ungespeicherte Änderungen)' : '(sauber)'}`);
  }

  if (appState.snapshot) {
    const { counts, manifestSummary } = appState.snapshot;
    parts.push(`📊 ${manifestSummary?.totalSets || 0} Sets im Manifest`);
    parts.push(`📈 ${counts?.analytics_logs_count || 0} Analytics Events`);
    parts.push(`👤 ${counts?.users_count || 0} User`);
    if (manifestSummary?.missingStats?.length > 0) {
      parts.push(`⚠️ ${manifestSummary.missingStats.length} Sets ohne track_stats`);
    }
  }

  return parts.join('\n');
};

/**
 * Enhanced answer function with state awareness and action detection.
 */
export const answerToolQuestion = (question = '', appState = null) => {
  const trimmed = String(question || '').trim();
  if (!trimmed) {
    return {
      text: 'Stelle mir eine konkrete Frage zum Flight Deck, z.B. "Wie importiere ich ein Set?" oder "Zeige den Status".',
      actions: [],
      source: 'system',
    };
  }

  const errorHelp = explainFlightDeckError(trimmed);
  if (
    errorHelp?.id
    && /(error|fehler|failed|blocked|missing|workspace|tracklist|verify|deploy|build|r2|datenbank|database|wav|audio source)/i.test(trimmed)
  ) {
    return {
      text: formatFlightDeckErrorHelp(trimmed),
      actions: ['navigate:import'],
      source: 'knowledge',
      matchId: `error:${errorHelp.id}`,
      matchTitle: errorHelp.title,
    };
  }

  // Status query
  if (/(?:status|zustand|übersicht|wie sieht es aus|was läuft|health)/i.test(trimmed)) {
    if (appState) {
      return {
        text: `Aktueller System-Status:\n\n${buildStatusSummary(appState)}`,
        actions: ['action:refresh'],
        source: 'state',
      };
    }
    return {
      text: 'Ich kann den Status anzeigen, wenn du den "Status aktualisieren" Button drückst.',
      actions: ['action:refresh'],
      source: 'local',
    };
  }

  // Parse actions from question
  const actionIntents = parseActionIntents(trimmed);

  // Knowledge match
  const { match, score } = findBestKnowledgeMatch(trimmed);

  if (match && score > 0) {
    const actions = [
      ...(actionIntents.length > 0 ? actionIntents : []),
      ...(match.actions || []),
    ];
    // Deduplicate
    const uniqueActions = [...new Set(actions)];

    return {
      text: [match.answer, formatAssistantGuide(match.id)].filter(Boolean).join('\n\n'),
      actions: uniqueActions,
      source: 'knowledge',
      matchId: match.id,
      matchTitle: match.title,
    };
  }

  // Action-only response
  if (actionIntents.length > 0) {
    const actionLabels = actionIntents
      .map((id) => ASSISTANT_ACTIONS[id]?.label)
      .filter(Boolean);
    return {
      text: `Verstanden! Ich kann folgende Aktionen ausführen:\n\n${actionLabels.map((label) => `• ${label}`).join('\n')}`,
      actions: actionIntents,
      source: 'action',
    };
  }

  // Fallback
  return {
    text: [
      'Ich habe dazu noch kein exaktes Muster, kann es aber strukturiert lösen.',
      '',
      '📋 Sofortplan:',
      '1. Ziel und betroffenen Tab benennen (z.B. Analytics, Import, Settings)',
      '2. Exakte Fehlermeldung oder beobachtetes Verhalten notieren',
      '3. Reproduktionsschritte mit Zeit/Filter/Datei festhalten',
      '4. Workspace + Datenquelle + letzte Änderung prüfen',
      '5. Konkrete Korrektur ausführen und direkt validieren',
      '',
      'Gib mir diese 3 Infos: Ziel, Fehlertext, letzter Schritt — und ich liefere eine konkrete Lösung.',
    ].join('\n'),
    actions: [],
    source: 'fallback',
  };
};
