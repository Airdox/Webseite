#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const withPdf = args.has('--pdf');

const readJson = (filePath) => JSON.parse(readFileSync(join(root, filePath), 'utf8'));
const readText = (filePath) => readFileSync(join(root, filePath), 'utf8');

const tokens = readJson('docs/brand/airdox-brand-tokens.json');
const content = readJson('docs/brand/airdox-epk-content.json');
const template = readText('docs/brand/templates/airdox-epk.template.html');

const bioHtml = (content.bio || []).map((entry) => `<p>${entry}</p>`).join('\n');
const highlightsHtml = `<ul>${(content.highlights || []).map((entry) => `<li>${entry}</li>`).join('')}</ul>`;
const bookingHtml = `
<p><strong>Set Length:</strong> ${content.booking?.setLength || '-'}</p>
<p><strong>Format:</strong> ${content.booking?.format || '-'}</p>
<p><strong>Contact:</strong> ${content.booking?.contact || '-'}</p>
`;
const linksHtml = `<ul>${(content.links || []).map((entry) => `<li><a href="${entry.url}">${entry.label}</a></li>`).join('')}</ul>`;

const map = new Map([
  ['brandName', tokens.brandName],
  ['identity.tagline', tokens.identity?.tagline || ''],
  ['identity.website', tokens.identity?.website || ''],
  ['palette.bg', tokens.palette?.bg || '#050608'],
  ['palette.surface', tokens.palette?.surface || '#0f141a'],
  ['palette.accentCyan', tokens.palette?.accentCyan || '#00f0ff'],
  ['palette.accentLime', tokens.palette?.accentLime || '#9adf6b'],
  ['palette.textPrimary', tokens.palette?.textPrimary || '#f5f8ff'],
  ['palette.textMuted', tokens.palette?.textMuted || '#9aa6b2'],
  ['palette.border', tokens.palette?.border || '#263241'],
  ['typography.fontFamily', tokens.typography?.fontFamily || 'Inter, Arial, sans-serif'],
  ['content.title', content.title || 'Electronic Press Kit'],
  ['content.subtitle', content.subtitle || 'AIRDOX'],
  ['content.updatedAt', content.updatedAt || new Date().toISOString().slice(0, 10)],
  ['content.bioHtml', bioHtml],
  ['content.highlightsHtml', highlightsHtml],
  ['content.bookingHtml', bookingHtml],
  ['content.linksHtml', linksHtml],
]);

let html = template;
for (const [key, value] of map.entries()) {
  html = html.replaceAll(`{{${key}}}`, String(value));
}

const outDir = join(root, 'public', 'epk');
mkdirSync(outDir, { recursive: true });
const htmlOut = join(outDir, 'airdox-epk.html');
writeFileSync(htmlOut, html);

const lines = [
  'AIRDOX EPK Build: DONE',
  `HTML: ${htmlOut}`,
];

if (withPdf) {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdfOut = join(outDir, 'airdox-epk.pdf');
    await page.pdf({
      path: pdfOut,
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    await browser.close();
    lines.push(`PDF: ${pdfOut}`);
  } catch (error) {
    lines.push(`PDF skipped: ${String(error?.message || error)}`);
  }
}

process.stdout.write(`${lines.join('\n')}\n`);
