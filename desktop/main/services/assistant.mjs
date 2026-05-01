import fs from 'node:fs/promises';
import path from 'node:path';

const WIKI_ROOT = path.resolve(process.cwd(), 'airdoX_wiki', 'wiki');

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
  };
};
