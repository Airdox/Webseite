import { ASSISTANT_KNOWLEDGE } from './assistantKnowledge.js';

const tokenize = (text = '') => text
  .toLowerCase()
  .replace(/[^a-z0-9äöüß\s]/gi, ' ')
  .split(/\s+/)
  .filter(Boolean);

export const findBestKnowledgeMatch = (question = '') => {
  const words = new Set(tokenize(question));
  let best = null;
  let bestScore = 0;

  for (const item of ASSISTANT_KNOWLEDGE) {
    const score = item.keywords.reduce((sum, keyword) => {
      const keyParts = tokenize(keyword);
      if (keyParts.length === 1) return sum + (words.has(keyParts[0]) ? 1 : 0);
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
