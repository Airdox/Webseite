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
  'Was kann der Design Assistant?',
  'Welche Bereiche gibt es im Flight Deck?',
  'Was bedeutet Manifest?',
  'Was ist der Unterschied zwischen Publish und Go Live?',
  'Welche Tabellen gibt es im Data Explorer?',
  'Was bedeutet Engagement Rate?',
  'Was macht Auto Deploy?',
  'Was ist ein R2 Prefix?',
  'Wie lese ich den Publish Log?',
  'Safe mode blocked publish: the source audio path is missing.',
  'Live publish blocked: the set has no seekable tracklist.',
  'Live verify failed: deployed bundle is missing recording_2026_06_06',
  'Was kann der Marketing Manager?',
  'Wo liegen die aktuellen Agenten Reports?',
  'Wofür ist das Tutorial da?',
  'Wie gehe ich vor wenn ich keine Ahnung vom Fehler habe?',
];

describe('assistant coverage', () => {
  it('answers all common questions with non-empty actionable text', () => {
    const answers = QUESTIONS.map((q) => answerToolQuestion(q));
    for (const answer of answers) {
      expect(answer.text).toBeTruthy();
      expect(answer.text.length).toBeGreaterThan(40);
    }
  });

  it('recognizes intent for most common tool questions', () => {
    const matched = QUESTIONS
      .map((q) => findBestKnowledgeMatch(q))
      .filter((entry) => entry.score > 0);
    expect(matched.length).toBeGreaterThanOrEqual(24);
  });
});
