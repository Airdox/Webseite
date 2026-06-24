import { describe, expect, it } from 'vitest';
import { answerToolQuestion, findBestKnowledgeMatch } from '../assistantEngine.js';
import { ASSISTANT_KNOWLEDGE } from '../assistantKnowledge.js';
import { ASSISTANT_GUIDES } from '../assistantGuides.js';

describe('assistantEngine', () => {
  it('matches workspace question', () => {
    const { match, score } = findBestKnowledgeMatch('Wie verbinde ich meinen Workspace Ordner?');
    expect(match?.id).toBe('workspace');
    expect(score).toBeGreaterThan(0);
  });

  it('returns fallback for unknown question', () => {
    const response = answerToolQuestion('asdf qwerty zxcv');
    expect(response.text.toLowerCase()).toContain('sofortplan');
    expect(response.text.toLowerCase()).toContain('struktur');
  });

  it('returns guided answer for analytics question', () => {
    const response = answerToolQuestion('Wie nutze ich den Analytics Filter nach Land und Gerät?');
    expect(response.text.toLowerCase()).toContain('analytics');
    expect(response.text.toLowerCase()).toContain('filter');
  });

  it('adds quick and detailed user-action guidance to every knowledge answer', () => {
    for (const entry of ASSISTANT_KNOWLEDGE) {
      const guide = ASSISTANT_GUIDES[entry.id];
      expect(guide, `${entry.id} needs an actionable guide`).toBeTruthy();
      expect(guide.quick.length, `${entry.id} needs quick steps`).toBeGreaterThanOrEqual(3);
      expect(guide.detailed.length, `${entry.id} needs detailed steps`).toBeGreaterThanOrEqual(3);
    }
  });

  it('explains Design Agent with both fast path and detailed fine-tuning path', () => {
    const response = answerToolQuestion('Was kann der Design Assistant?');
    expect(response.text).toContain('Schnellweg:');
    expect(response.text).toContain('Detaillierter Weg:');
    expect(response.text).toContain('Motion');
    expect(response.text).toContain('Glitch');
    expect(response.text).toContain('Waveform');
    expect(response.text).toContain('Hauptansicht');
  });
});
