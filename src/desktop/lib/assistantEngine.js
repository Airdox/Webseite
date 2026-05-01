import { ASSISTANT_KNOWLEDGE } from './assistantKnowledge.js';

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
          if (w.includes(key) || key.includes(w)) return sum + 1;
          if (normalizeToken(w).includes(keyNorm) || keyNorm.includes(normalizeToken(w))) return sum + 1;
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

export const answerToolQuestion = (question = '') => {
  const trimmed = String(question || '').trim();
  if (!trimmed) {
    return 'Stelle mir eine konkrete Frage zum Flight Deck, z.B. "Wie importiere ich ein Set?"';
  }

  const { match, score } = findBestKnowledgeMatch(trimmed);
  if (!match || score <= 0) {
    return [
      'Ich habe dazu noch kein exaktes Muster, kann es aber strukturiert lösen.',
      'Sofortplan:',
      '1. Ziel und betroffenen Tab benennen (z.B. Analytics, Import, Settings).',
      '2. Exakte Fehlermeldung oder beobachtetes Verhalten notieren.',
      '3. Reproduktionsschritte mit Zeit/Filter/Datei festhalten.',
      '4. Workspace + Datenquelle + letzte Änderung prüfen.',
      '5. Konkrete Korrektur ausführen und direkt validieren (Test/Screenshot).',
      'Wenn du mir diese 3 Infos gibst: Ziel, Fehlertext, letzter Schritt, liefere ich dir sofort eine konkrete Lösung.',
    ].join('\n');
  }

  return `${match.answer}\n\nWenn du willst, erstelle ich dir direkt die nächsten 3 konkreten Schritte für deinen aktuellen Status.`;
};
