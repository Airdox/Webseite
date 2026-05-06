import { ASSISTANT_KNOWLEDGE, ASSISTANT_ACTIONS } from './assistantKnowledge.js';

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
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:flight deck|flightdeck)/i, action: 'navigate:flightdeck' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:setting|einstellung|konfiguration)/i, action: 'navigate:settings' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:monitor|system)/i, action: 'navigate:monitor' },
    { pattern: /(?:öffne|zeig|geh|navigiere|wechsel).*(?:tutorial|hilfe|guide)/i, action: 'navigate:tutorial' },
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
    parts.push(`👤 ${counts?.users_count || 0} VIP User`);
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
      text: match.answer,
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
