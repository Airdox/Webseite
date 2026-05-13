#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const args = process.argv.slice(2);
const argSet = new Set(args);
const generatedAt = new Date().toISOString();
const defaultPort = getArgValue('--port', '4173');
const baseUrl = getArgValue('--url', `http://127.0.0.1:${defaultPort}`);
const strictMode = argSet.has('--strict');
const skipBuild = argSet.has('--skip-build');
const npmExecPath = process.env.npm_execpath || '';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const outDir = join(root, 'docs', 'agent-system');
const screenshotDir = join(outDir, 'proof', 'designer-visual-quality');

function getArgValue(name, fallback = '') {
  const prefix = `${name}=`;
  const raw = args.find((entry) => entry.startsWith(prefix));
  if (!raw) return fallback;
  return raw.slice(prefix.length).trim() || fallback;
}

function runNpmScript(scriptName, scriptArgs = []) {
  const command = npmExecPath ? process.execPath : npmCommand;
  const commandArgs = npmExecPath
    ? [npmExecPath, 'run', scriptName, '--', ...scriptArgs]
    : ['run', scriptName, '--', ...scriptArgs];

  const startedAt = new Date().toISOString();
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  const endedAt = new Date().toISOString();

  return {
    startedAt,
    endedAt,
    command: [command, ...commandArgs].join(' '),
    ok: result.status === 0,
    exitCode: Number(result.status ?? 1),
    error: result.error ? String(result.error.message || result.error) : '',
  };
}

function startPreviewServer() {
  const command = npmExecPath ? process.execPath : npmCommand;
  const commandArgs = npmExecPath
    ? [npmExecPath, 'run', 'preview', '--', '--host', '127.0.0.1', '--port', defaultPort]
    : ['run', 'preview', '--', '--host', '127.0.0.1', '--port', defaultPort];

  const child = spawn(command, commandArgs, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });

  const logs = [];
  const handleLog = (prefix) => (chunk) => {
    const text = chunk.toString();
    logs.push(`${prefix}${text}`);
    if (logs.length > 80) logs.shift();
  };

  child.stdout.on('data', handleLog('[preview:out] '));
  child.stderr.on('data', handleLog('[preview:err] '));

  return { child, logs, command: [command, ...commandArgs].join(' ') };
}

async function waitForServer(url, timeoutMs, logsRef) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok || response.status === 404) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  process.stdout.write('Designer Visual Check: preview server did not become ready in time.\n');
  if (logsRef.length) {
    process.stdout.write('Preview logs (tail):\n');
    process.stdout.write(`${logsRef.slice(-20).join('')}\n`);
  }

  return false;
}

const pushCheck = (checks, id, level, detail, evidence = {}) => {
  checks.push({ id, level, detail, evidence });
};

async function runVisualChecks() {
  const screenshots = [];
  const checks = [];

  const browser = await chromium.launch({ headless: true });

  try {
    const scenarios = [
      {
        id: 'desktop',
        viewport: { width: 1440, height: 1024 },
      },
      {
        id: 'mobile',
        viewport: { width: 390, height: 844 },
      },
    ];

    for (const scenario of scenarios) {
      const context = await browser.newContext({
        viewport: scenario.viewport,
        locale: 'de-DE',
      });
      const page = await context.newPage();

      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.locator('.set-card').first().waitFor({ state: 'visible', timeout: 45000 });
      await page.waitForTimeout(300);

      const pageShot = join(screenshotDir, `${scenario.id}-viewport.png`);
      await page.screenshot({ path: pageShot, fullPage: false });
      screenshots.push(pageShot);

      const musicSection = page.locator('#music');
      await musicSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);

      const musicShot = join(screenshotDir, `${scenario.id}-music.png`);
      await page.screenshot({ path: musicShot, fullPage: false });
      screenshots.push(musicShot);

      const evaluation = await page.evaluate(() => {
        const normalize = (value = '') => String(value).replace(/\s+/g, ' ').trim();
        const englishMonthsNotGerman = new Set(['MAY', 'OCT', 'DEC']);

        const parseColor = (raw) => {
          const value = normalize(raw).toLowerCase();
          if (!value || value === 'transparent') return null;
          if (value.startsWith('rgb')) {
            const nums = value.match(/[\d.]+/g)?.map(Number) || [];
            if (nums.length < 3) return null;
            return {
              r: nums[0],
              g: nums[1],
              b: nums[2],
              a: nums.length > 3 ? nums[3] : 1,
            };
          }
          if (value.startsWith('#')) {
            const hex = value.slice(1);
            const normalizedHex = hex.length === 3
              ? hex.split('').map((char) => `${char}${char}`).join('')
              : hex;
            if (normalizedHex.length !== 6) return null;
            return {
              r: parseInt(normalizedHex.slice(0, 2), 16),
              g: parseInt(normalizedHex.slice(2, 4), 16),
              b: parseInt(normalizedHex.slice(4, 6), 16),
              a: 1,
            };
          }
          return null;
        };

        const blend = (fg, bg) => {
          const alpha = Math.max(0, Math.min(1, fg.a));
          return {
            r: (fg.r * alpha) + (bg.r * (1 - alpha)),
            g: (fg.g * alpha) + (bg.g * (1 - alpha)),
            b: (fg.b * alpha) + (bg.b * (1 - alpha)),
            a: alpha + (bg.a * (1 - alpha)),
          };
        };

        const channelToLinear = (value) => {
          const channel = value / 255;
          return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        };

        const luminance = (rgb) => (
          0.2126 * channelToLinear(rgb.r)
          + 0.7152 * channelToLinear(rgb.g)
          + 0.0722 * channelToLinear(rgb.b)
        );

        const contrastRatio = (fg, bg) => {
          const l1 = luminance(fg);
          const l2 = luminance(bg);
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return Number((((lighter + 0.05) / (darker + 0.05))).toFixed(2));
        };

        const getEffectiveBackground = (el) => {
          let blended = { r: 8, g: 10, b: 14, a: 1 };
          let current = el;

          while (current) {
            const bg = parseColor(getComputedStyle(current).backgroundColor);
            if (bg && bg.a > 0) {
              blended = blend(bg, blended);
              if (blended.a >= 0.99) break;
            }
            current = current.parentElement;
          }

          return {
            r: blended.r,
            g: blended.g,
            b: blended.b,
          };
        };

        const overlap = (a, b) => (
          a.left < b.right
          && a.right > b.left
          && a.top < b.bottom
          && a.bottom > b.top
        );

        const englishUiCandidates = [];
        const labelsToInspect = [
          ...document.querySelectorAll('.set-share-btn span'),
          ...document.querySelectorAll('.tracklist-title'),
          ...document.querySelectorAll('.music-section .section-title'),
          ...document.querySelectorAll('.music-section .section-subtitle'),
        ];

        const blockedEnglishWords = [
          'share', 'latest releases', 'play', 'pause', 'booking', 'contact', 'about',
        ];
        const allowedEnglishWords = ['underground', 'techno', 'vip', 'dj'];

        for (const el of labelsToInspect) {
          const text = normalize(el.textContent || '');
          if (!text) continue;
          const lower = text.toLowerCase();
          const hasBlockedWord = blockedEnglishWords.some((word) => lower.includes(word));
          const allAllowed = allowedEnglishWords.some((word) => lower === word || lower.includes(`${word}-`) || lower.includes(` ${word}`));
          if (hasBlockedWord && !allAllowed) {
            englishUiCandidates.push(text);
          }
        }

        const cards = [...document.querySelectorAll('.set-card')].slice(0, 6);
        const metaChecks = [];
        const monthLanguageIssues = [];
        const layoutIssues = [];
        const readabilityIssues = [];

        for (const card of cards) {
          const title = normalize(card.querySelector('.set-title')?.textContent || '');
          const dateEl = card.querySelector('.set-date');
          const durationEl = card.querySelector('.set-duration');
          const metaEl = card.querySelector('.set-meta');
          const actionsEl = card.querySelector('.set-actions');
          const tracklistEl = card.querySelector('.vip-tracklist');

          const dateText = normalize(dateEl?.textContent || '');
          const durationText = normalize(durationEl?.textContent || '');
          const metaText = normalize(metaEl?.textContent || '');

          if (dateText) {
            const monthToken = dateText.split(/\s+/)[0].replace('.', '').toUpperCase();
            if (englishMonthsNotGerman.has(monthToken)) {
              monthLanguageIssues.push({ title, dateText, monthToken });
            }
          }

          if (dateEl && durationEl) {
            const dateRect = dateEl.getBoundingClientRect();
            const durationRect = durationEl.getBoundingClientRect();
            const gapPx = Number((durationRect.left - dateRect.right).toFixed(2));
            const suspiciousMerge = /\b20\d{2}\d{1,2}:\d{2}(?::\d{2})?\b/.test(metaText)
              || /[A-Z]{3}\s20\d{2}\d/.test(metaText);

            metaChecks.push({
              title,
              dateText,
              durationText,
              metaText,
              gapPx,
              suspiciousMerge,
            });
          }

          if (actionsEl && tracklistEl) {
            const actionsRect = actionsEl.getBoundingClientRect();
            const tracklistRect = tracklistEl.getBoundingClientRect();
            if (overlap(actionsRect, tracklistRect)) {
              layoutIssues.push({
                title,
                type: 'actions-tracklist-overlap',
              });
            }
          }
        }

        const readabilityTargets = [
          ...document.querySelectorAll('.set-meta'),
          ...document.querySelectorAll('.set-share-btn span'),
          ...document.querySelectorAll('.tracklist-title'),
          ...document.querySelectorAll('.play-count span'),
          ...document.querySelectorAll('.like-btn span'),
        ].slice(0, 28);

        for (const target of readabilityTargets) {
          const text = normalize(target.textContent || '');
          if (!text) continue;

          const rect = target.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) continue;

          const style = getComputedStyle(target);
          const fontSizePx = Number.parseFloat(style.fontSize || '0');
          const color = parseColor(style.color);
          if (!color) continue;

          const bg = getEffectiveBackground(target);
          const ratio = contrastRatio(color, bg);

          if (fontSizePx < 10) {
            readabilityIssues.push({
              severity: 'fail',
              type: 'tiny-font',
              selector: target.className || target.tagName,
              text,
              fontSizePx,
              contrast: ratio,
            });
          } else if (fontSizePx < 12) {
            readabilityIssues.push({
              severity: 'warn',
              type: 'small-font',
              selector: target.className || target.tagName,
              text,
              fontSizePx,
              contrast: ratio,
            });
          }

          if (ratio < 2.8) {
            readabilityIssues.push({
              severity: 'fail',
              type: 'low-contrast',
              selector: target.className || target.tagName,
              text,
              fontSizePx,
              contrast: ratio,
            });
          } else if (ratio < 4) {
            readabilityIssues.push({
              severity: 'warn',
              type: 'medium-contrast',
              selector: target.className || target.tagName,
              text,
              fontSizePx,
              contrast: ratio,
            });
          }
        }

        const horizontalOverflowPx = Math.max(0, Math.round(document.documentElement.scrollWidth - window.innerWidth));

        return {
          cardCount: cards.length,
          horizontalOverflowPx,
          metaChecks,
          monthLanguageIssues,
          englishUiCandidates,
          layoutIssues,
          readabilityIssues,
        };
      });

      if (evaluation.cardCount === 0) {
        pushCheck(
          checks,
          `${scenario.id}-set-cards-visible`,
          'fail',
          `${scenario.id}: Keine Set-Cards sichtbar.`,
          evaluation,
        );
      } else {
        pushCheck(
          checks,
          `${scenario.id}-set-cards-visible`,
          'pass',
          `${scenario.id}: ${evaluation.cardCount} Set-Cards sichtbar.`,
        );
      }

      if (evaluation.horizontalOverflowPx > 2) {
        pushCheck(
          checks,
          `${scenario.id}-horizontal-overflow`,
          'warn',
          `${scenario.id}: Horizontaler Overflow erkannt (${evaluation.horizontalOverflowPx}px).`,
          { horizontalOverflowPx: evaluation.horizontalOverflowPx },
        );
      } else {
        pushCheck(
          checks,
          `${scenario.id}-horizontal-overflow`,
          'pass',
          `${scenario.id}: Kein horizontaler Overflow.`,
        );
      }

      const lowMetaSpacing = evaluation.metaChecks.filter((item) => item.gapPx < 4);
      const mergedMeta = evaluation.metaChecks.filter((item) => item.suspiciousMerge);

      if (lowMetaSpacing.length > 0 || mergedMeta.length > 0) {
        pushCheck(
          checks,
          `${scenario.id}-meta-readability`,
          'fail',
          `${scenario.id}: Datum/Dauer wirken zusammengezogen oder zusammengeklebt.`,
          { lowMetaSpacing, mergedMeta },
        );
      } else {
        pushCheck(
          checks,
          `${scenario.id}-meta-readability`,
          'pass',
          `${scenario.id}: Datum und Dauer sind sauber getrennt.`,
        );
      }

      const readabilityFails = evaluation.readabilityIssues.filter((item) => item.severity === 'fail');
      const readabilityWarns = evaluation.readabilityIssues.filter((item) => item.severity === 'warn');
      if (readabilityFails.length > 0) {
        pushCheck(
          checks,
          `${scenario.id}-readability-user-eye`,
          'fail',
          `${scenario.id}: Lesbarkeit ist fuer User teilweise zu schlecht (Kontrast/Schriftgroesse).`,
          { readabilityFails, readabilityWarns },
        );
      } else if (readabilityWarns.length > 0) {
        pushCheck(
          checks,
          `${scenario.id}-readability-user-eye`,
          'warn',
          `${scenario.id}: Lesbarkeit ist grenzwertig (Kontrast/Schriftgroesse).`,
          { readabilityWarns },
        );
      } else {
        pushCheck(
          checks,
          `${scenario.id}-readability-user-eye`,
          'pass',
          `${scenario.id}: Lesbarkeit wirkt stabil fuer User.`,
        );
      }

      if (evaluation.monthLanguageIssues.length > 0) {
        pushCheck(
          checks,
          `${scenario.id}-de-language-months`,
          'fail',
          `${scenario.id}: Englische Monatskuerzel auf deutscher Seite gefunden.`,
          { monthLanguageIssues: evaluation.monthLanguageIssues },
        );
      } else {
        pushCheck(
          checks,
          `${scenario.id}-de-language-months`,
          'pass',
          `${scenario.id}: Monatslabels sind mit deutscher Seite konsistent.`,
        );
      }

      if (evaluation.englishUiCandidates.length > 0) {
        pushCheck(
          checks,
          `${scenario.id}-de-language-ui`,
          'warn',
          `${scenario.id}: Potenziell unerwuenschte englische UI-Texte auf deutscher Seite gefunden.`,
          { englishUiCandidates: evaluation.englishUiCandidates },
        );
      } else {
        pushCheck(
          checks,
          `${scenario.id}-de-language-ui`,
          'pass',
          `${scenario.id}: Keine auffaelligen englischen UI-Texte gefunden.`,
        );
      }

      if (evaluation.layoutIssues.length > 0) {
        pushCheck(
          checks,
          `${scenario.id}-layout-overlaps`,
          'fail',
          `${scenario.id}: Ueberlappende Elemente in Set-Cards erkannt.`,
          { layoutIssues: evaluation.layoutIssues },
        );
      } else {
        pushCheck(
          checks,
          `${scenario.id}-layout-overlaps`,
          'pass',
          `${scenario.id}: Keine Ueberlappungen in geprueften Set-Cards.`,
        );
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  return { checks, screenshots };
}

function renderMarkdown(report) {
  const lines = [
    '# AIRDOX Designer Visual Quality Report',
    '',
    `Generated: ${report.generatedAt}`,
    'Agent: Designer',
    `Base URL: ${report.baseUrl}`,
    `Status: ${report.summary.status}`,
    '',
    '## Summary',
    '',
    `- Total checks: ${report.summary.totalChecks}`,
    `- Failures: ${report.summary.failCount}`,
    `- Warnings: ${report.summary.warnCount}`,
    `- Passes: ${report.summary.passCount}`,
    `- Needs attention: ${report.summary.needsAttention ? 'yes' : 'no'}`,
    '',
    '## Checks',
    '',
    '| Check | Level | Detail |',
    '| --- | --- | --- |',
    ...report.checks.map((item) => `| ${item.id} | ${item.level.toUpperCase()} | ${item.detail} |`),
    '',
    '## Screenshots',
    '',
    ...report.screenshots.map((filePath) => `- ${filePath}`),
    '',
  ];

  const detailedIssues = report.checks.filter((item) => item.level === 'fail' || item.level === 'warn');
  if (detailedIssues.length) {
    lines.push('## Findings Detail');
    lines.push('');
    for (const item of detailedIssues) {
      lines.push(`### ${item.id} (${item.level.toUpperCase()})`);
      lines.push('');
      lines.push(item.detail);
      lines.push('');
      if (item.evidence && Object.keys(item.evidence).length > 0) {
        lines.push('```json');
        lines.push(JSON.stringify(item.evidence, null, 2));
        lines.push('```');
        lines.push('');
      }
    }
  }

  return `${lines.join('\n')}\n`;
}

function renderConsole(report) {
  const lines = [
    `AIRDOX Designer Visual Check (${report.generatedAt})`,
    'Agent: Designer',
    `Base URL: ${report.baseUrl}`,
    `Checks: ${report.summary.totalChecks}`,
    `Failures: ${report.summary.failCount} | Warnings: ${report.summary.warnCount} | Passes: ${report.summary.passCount}`,
    `Needs attention: ${report.summary.needsAttention ? 'yes' : 'no'}`,
    '',
    `Report JSON: docs/agent-system/latest-designer-visual-quality.json`,
    `Report MD: docs/agent-system/latest-designer-visual-quality.md`,
  ];

  return `${lines.join('\n')}\n`;
}

async function main() {
  mkdirSync(screenshotDir, { recursive: true });

  const lifecycle = {
    build: null,
    preview: null,
  };

  if (!skipBuild) {
    lifecycle.build = runNpmScript('build');
    if (!lifecycle.build.ok) {
      process.exitCode = lifecycle.build.exitCode;
      return;
    }
  }

  const preview = startPreviewServer();
  lifecycle.preview = {
    command: preview.command,
    startedAt: new Date().toISOString(),
  };

  let serverReady = false;
  try {
    serverReady = await waitForServer(baseUrl, 90000, preview.logs);
    if (!serverReady) {
      process.exitCode = 1;
      return;
    }

    const { checks, screenshots } = await runVisualChecks();

    const failCount = checks.filter((item) => item.level === 'fail').length;
    const warnCount = checks.filter((item) => item.level === 'warn').length;
    const passCount = checks.filter((item) => item.level === 'pass').length;

    const report = {
      generatedAt,
      agent: 'Designer',
      baseUrl,
      lifecycle,
      checks,
      screenshots,
      summary: {
        totalChecks: checks.length,
        failCount,
        warnCount,
        passCount,
        needsAttention: failCount > 0 || warnCount > 0,
        status: failCount > 0 ? 'fail' : (warnCount > 0 ? 'warn' : 'pass'),
      },
    };

    writeFileSync(join(outDir, 'latest-designer-visual-quality.json'), `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(join(outDir, 'latest-designer-visual-quality.md'), renderMarkdown(report));

    process.stdout.write(renderConsole(report));

    if (strictMode && report.summary.needsAttention) {
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    process.stdout.write(`Designer Visual Check: ERROR\n${message}\n`);
    process.exitCode = 1;
  } finally {
    preview.child.kill('SIGTERM');
  }
}

await main();
