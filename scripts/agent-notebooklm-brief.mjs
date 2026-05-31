#!/usr/bin/env node
/**
 * NotebookLM Deep Research -> Agent Brief
 *
 * Purpose:
 * - Convert NotebookLM artifacts/history into actionable tasks for other agents.
 * - Write a short brief + a task queue file that downstream agents can treat as mandatory.
 *
 * Output:
 * - docs/agent-system/latest-notebooklm-brief.md
 * - docs/agent-system/latest-notebooklm-brief.json
 * - docs/agent-system/latest-agent-task-queue.json
 *
 * Notes:
 * - This script uses the `notebooklm` CLI; auth must be valid (`notebooklm auth check --test`).
 * - Keep it short and operational; no long essays.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docsDir = join(root, 'docs', 'agent-system');

const nowIso = new Date().toISOString();

const getArg = (name, fallback = null) => {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
};

const notebookId = getArg('--notebook', null) ?? process.env.NOTEBOOKLM_NOTEBOOK_ID ?? null;
if (!notebookId) {
  mkdirSync(docsDir, { recursive: true });
  const brief = {
    generatedAt: nowIso,
    status: 'skipped',
    reason: 'Missing --notebook <id> or NOTEBOOKLM_NOTEBOOK_ID.',
    nextAction: 'Set NOTEBOOKLM_NOTEBOOK_ID or run this script manually with --notebook <id> when a research refresh is required.',
  };
  const md = [
    '# NotebookLM Deep Research Brief',
    '',
    `Stand: ${nowIso}`,
    'Status: skipped',
    '',
    '## Reason',
    '',
    brief.reason,
    '',
    '## Next Action',
    '',
    brief.nextAction,
    '',
    'Existing `latest-agent-task-queue.json` is left untouched so previous mandatory tasks are not erased by a scheduler without NotebookLM configuration.',
    '',
  ].join('\n');
  writeFileSync(join(docsDir, 'latest-notebooklm-brief.json'), `${JSON.stringify(brief, null, 2)}\n`);
  writeFileSync(join(docsDir, 'latest-notebooklm-brief.md'), `${md}\n`);
  process.stdout.write('NotebookLM brief skipped: missing notebook id. Existing task queue preserved.\n');
  process.exit(0);
}

const runJson = (cmd, args) => {
  const result = spawnSync(cmd, args, {
    cwd: root,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
};

const runText = (cmd, args) => {
  const result = spawnSync(cmd, args, {
    cwd: root,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
};

const main = () => {
  mkdirSync(docsDir, { recursive: true });

  // 1) Auth sanity.
  const auth = runJson('notebooklm', ['auth', 'check', '--test', '--json']);
  if (auth.status !== 'ok') throw new Error('NotebookLM auth not ok.');

  // 2) Pull latest artifacts + sources list (for context).
  const artifacts = runJson('notebooklm', ['artifact', 'list', '-n', notebookId, '--json']);
  const sources = runJson('notebooklm', ['source', 'list', '-n', notebookId, '--json']);

  // 3) Ask NotebookLM to generate an "agent brief" (structured JSON).
  const question = [
    'Erstelle einen OPERATIVEN Agent-Brief fuer AIRDOX aus den Notebook-Inhalten.',
    'Output als JSON mit Schluesseln:',
    '- summary (max 8 Saetze, deutsch, keine Floskeln)',
    '- insights (max 12 bullets, jeweils 1 Satz)',
    '- prototypes (5 items: name, goal, look, toolchain, steps[3])',
    '- tasks (max 12 items: owner(one of: Orchestrator, Designer, Renderer, Publisher, Quality, Research), title, acceptance, priority(1-3))',
    '- risks (max 8 bullets)',
    'Kontext: Wir bauen 9:16 Reels/Shorts mit Daumenkino-Lettering, audio-driven (Envelope/Peaks), Chaos->Lock.',
  ].join(' ');

  const asked = runJson('notebooklm', ['ask', '-n', notebookId, '--json', question]);

  // 4) Build task queue file (mandatory consumption for other agents).
  const brief = {
    generatedAt: nowIso,
    notebookId,
    artifactsCount: Array.isArray(artifacts?.artifacts) ? artifacts.artifacts.length : artifacts?.count ?? null,
    sourcesCount: Array.isArray(sources?.sources) ? sources.sources.length : sources?.count ?? null,
    agentBrief: asked,
  };

  const tasks = (asked?.answer ? null : null); // defensive: asked is already structured by CLI.
  // The CLI `--json` returns {answer, conversation_id, references...}. We store raw and also extract tasks if possible.
  const tryParseJsonFromText = (text) => {
    if (typeof text !== 'string') return null;
    // Strip common markdown code fences.
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/```$/i, '').trim();
    // If NotebookLM wrapped JSON in a longer prose, extract the first {...} block.
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      const candidate = cleaned.slice(first, last + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // continue below
      }
    }
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  };

  const extracted = tryParseJsonFromText(asked.answer) ?? {
    summary: asked.answer,
    insights: [],
    prototypes: [],
    tasks: [],
    risks: [],
  };

  const queue = {
    generatedAt: nowIso,
    source: { notebookId },
    mandatory: true,
    tasks: Array.isArray(extracted.tasks) ? extracted.tasks : [],
    prototypes: Array.isArray(extracted.prototypes) ? extracted.prototypes : [],
  };

  const md = [
    '# NotebookLM Deep Research Brief',
    '',
    `Stand: ${nowIso}`,
    `Notebook: ${notebookId}`,
    '',
    '## Summary',
    '',
    ...(typeof extracted.summary === 'string' ? [extracted.summary] : ['(no summary)']),
    '',
    '## Prototypes (5)',
    '',
    ...(Array.isArray(extracted.prototypes) && extracted.prototypes.length
      ? extracted.prototypes.map((p, idx) => {
        const name = p?.name ?? `Prototype ${idx + 1}`;
        const goal = p?.goal ?? '';
        const look = p?.look ?? '';
        const toolchain = p?.toolchain ?? '';
        const steps = Array.isArray(p?.steps) ? p.steps : [];
        return [
          `### ${name}`,
          '',
          goal ? `Ziel: ${goal}` : 'Ziel: (n/a)',
          look ? `Look: ${look}` : 'Look: (n/a)',
          toolchain ? `Toolchain: ${toolchain}` : 'Toolchain: (n/a)',
          '',
          'Steps:',
          ...steps.slice(0, 3).map((s) => `- ${s}`),
          '',
        ].join('\n');
      })
      : ['(no prototypes)']),
    '',
    '## Tasks (mandatory queue)',
    '',
    ...(Array.isArray(queue.tasks) && queue.tasks.length
      ? queue.tasks.map((t) => `- [P${t?.priority ?? 2}] ${t?.owner ?? 'Unassigned'}: ${t?.title ?? '(no title)'} | Acceptance: ${t?.acceptance ?? '(n/a)'}`)
      : ['(no tasks)']),
    '',
    '## Risks',
    '',
    ...(Array.isArray(extracted.risks) && extracted.risks.length ? extracted.risks.map((r) => `- ${r}`) : ['(none)']),
    '',
  ].join('\n');

  writeFileSync(join(docsDir, 'latest-notebooklm-brief.json'), `${JSON.stringify(brief, null, 2)}\n`);
  writeFileSync(join(docsDir, 'latest-notebooklm-brief.md'), `${md}\n`);
  writeFileSync(join(docsDir, 'latest-agent-task-queue.json'), `${JSON.stringify(queue, null, 2)}\n`);

  // Print a tiny status line for CI-like usage.
  process.stdout.write(`Wrote latest-notebooklm-brief.* + latest-agent-task-queue.json for notebook ${notebookId}\n`);
};

main();
