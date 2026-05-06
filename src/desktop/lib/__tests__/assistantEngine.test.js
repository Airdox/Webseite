import { describe, expect, it } from 'vitest';
import { answerToolQuestion, findBestKnowledgeMatch } from '../assistantEngine.js';

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
});
