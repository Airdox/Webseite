import fs from 'node:fs/promises';
import path from 'node:path';

const WIKI_ROOT = path.resolve(process.cwd(), 'airdoX_wiki', 'wiki');
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:4b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 30000);

const tokenize = (text = '') => text
  .toLowerCase()
  .replace(/[^a-z0-9äöüß\s]/gi, ' ')
  .split(/\s+/)
  .filter(Boolean);

const scoreText = (queryWords, body) => {
  const lowerBody = body.toLowerCase();
  let score = 0;
  for (const word of queryWords) {
    if (word.length < 3) continue;
    if (lowerBody.includes(word)) score += 1;
  }
  return score;
};

const extractBestSnippet = (content, queryWords) => {
  const lines = content.split('\n');
  let bestLineIdx = 0;
  let bestScore = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const lower = lines[i].toLowerCase();
    const score = queryWords.reduce((sum, word) => (word.length >= 3 && lower.includes(word) ? sum + 1 : sum), 0);
    if (score > bestScore) {
      bestScore = score;
      bestLineIdx = i;
    }
  }

  const start = Math.max(0, bestLineIdx - 2);
  const end = Math.min(lines.length, bestLineIdx + 6);
  return lines
    .slice(start, end)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .slice(0, 700);
};

const readWikiDocuments = async () => {
  try {
    const files = await fs.readdir(WIKI_ROOT);
    const markdownFiles = files.filter((file) => file.endsWith('.md'));
    const docs = await Promise.all(markdownFiles.map(async (file) => {
      const fullPath = path.join(WIKI_ROOT, file);
      const content = await fs.readFile(fullPath, 'utf8');
      return { file, content };
    }));
    return docs;
  } catch {
    return [];
  }
};

export const answerFromWiki = async (question = '') => {
  const query = String(question || '').trim();
  if (!query) return null;

  const docs = await readWikiDocuments();
  if (!docs.length) return null;

  const words = tokenize(query);
  const scored = docs
    .map((doc) => ({ ...doc, score: scoreText(words, doc.content) }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  const top = scored.slice(0, 2);
  const best = top[0];
  const snippet = top
    .map((doc) => `Aus ${doc.file}: ${extractBestSnippet(doc.content, words)}`)
    .join('\n\n');
  return {
    source: best.file,
    answer: `Wiki-Treffer:\n${snippet}`,
    context: snippet,
  };
};

const withTimeout = async (promise, ms) => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Ollama timeout')), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

export const answerWithOllama = async ({ question = '', wikiContext = '' } = {}) => {
  const query = String(question || '').trim();
  if (!query) return null;

  const prompt = [
    'Du bist Vicky, ein präziser Flight-Deck/Windtool-Experte.',
    'Antworte konkret, schrittweise und ohne Halluzination.',
    'Nutze nur den bereitgestellten Kontext. Wenn Kontext fehlt, sag das klar und gib sichere nächste Schritte.',
    '',
    'KONTEXT:',
    wikiContext || 'Kein Wiki-Kontext gefunden.',
    '',
    `FRAGE: ${query}`,
    '',
    'ANTWORTFORMAT:',
    '1) Kurzantwort',
    '2) Schritte',
    '3) Prüfpunkte',
  ].join('\n');

  const request = fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.1,
      },
    }),
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    return response.json();
  });

  const data = await withTimeout(request, OLLAMA_TIMEOUT_MS);
  const text = String(data?.response || '').trim();
  if (!text) return null;

  return {
    source: `ollama:${OLLAMA_MODEL}`,
    answer: text,
  };
};
