import { afterEach, describe, expect, it, vi } from 'vitest';
import { answerFromWiki, answerWithOllama } from '../../../desktop/main/services/assistant.mjs';

describe('desktop assistant service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers from the local FlightDeck wiki and returns null for unusable questions', async () => {
    await expect(answerFromWiki('')).resolves.toBeNull();

    const answer = await answerFromWiki('FlightDeck Import Set Tracklist Workspace');
    expect(answer).toMatchObject({
      source: expect.stringMatching(/\.md$/),
      answer: expect.stringContaining('Wiki-Treffer'),
      context: expect.any(String),
    });
    expect(answer.context.length).toBeGreaterThan(20);

    await expect(answerFromWiki('qwertyuiopasdfghjkl')).resolves.toBeNull();
  });

  it('uses Ollama only through the HTTP API and handles empty/error answers truthfully', async () => {
    await expect(answerWithOllama({ question: '' })).resolves.toBeNull();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: '1) Kurzantwort\n2) Schritte\n3) Pruefpunkte' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(answerWithOllama({ question: 'Wie importiere ich ein Set?', wikiContext: 'Import ueber Set Import.' }))
      .resolves.toMatchObject({
        source: expect.stringMatching(/^ollama:/),
        answer: expect.stringContaining('Kurzantwort'),
      });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/generate'), expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.prompt).toContain('Import ueber Set Import.');
    expect(payload.options).toMatchObject({ temperature: 0.1 });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ response: '   ' }) }));
    await expect(answerWithOllama({ question: 'leer', wikiContext: '' })).resolves.toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(answerWithOllama({ question: 'down', wikiContext: '' })).rejects.toThrow(/Ollama HTTP 503/);
  });
});
