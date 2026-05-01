import { describe, expect, it } from 'vitest';
import { answerToolQuestion, findBestKnowledgeMatch } from '../assistantEngine.js';

const QUESTIONS = [
  'Wie verbinde ich meinen Workspace?',
  'Warum zeigt Flight Deck workspace fehlt?',
  'Wie importiere ich ein Set mit Audio und Cover?',
  'Wie mache ich Go Live?',
  'Deploy schlägt fehl, was prüfen?',
  'Wie funktioniert Analytics Filter nach Land?',
  'Gerätefilter im Analytics gibt falsche Werte',
  'Wie prüfe ich Event Typ Filter?',
  'Wie behebe ich Neon Datenbank Fehler?',
  'Welche ENV Variablen braucht die Datenbank?',
  'Wie nutze ich Data Explorer richtig?',
  'Welche SQL sind im Explorer erlaubt?',
  'Wie lege ich VIP User an?',
  'Wie setze ich ein Passwort zurück?',
  'Wie widerrufe ich Sessions?',
  'Wie exportiere ich Tabellen als CSV?',
  'Wie finde ich Performanceprobleme?',
  'Wie nutze ich den System Monitor?',
  'Wie kann ich den Cache löschen?',
  'Wie gehe ich vor wenn ich keine Ahnung vom Fehler habe?',
];

describe('assistant coverage', () => {
  it('answers all common questions with non-empty actionable text', () => {
    const answers = QUESTIONS.map((q) => answerToolQuestion(q));
    for (const answer of answers) {
      expect(answer).toBeTruthy();
      expect(answer.length).toBeGreaterThan(40);
    }
  });

  it('recognizes intent for most common tool questions', () => {
    const matched = QUESTIONS
      .map((q) => findBestKnowledgeMatch(q))
      .filter((entry) => entry.score > 0);
    expect(matched.length).toBeGreaterThanOrEqual(14);
  });
});

