import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { chromium } from 'playwright';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error("DATABASE_URL is missing in .env!");
  process.exit(1);
}

const sql = neon(dbUrl);

async function generateReport() {
  console.log("Fetching live telemetry data from Neon Database...");
  
  // 1. Fetch counts
  const countsRes = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM track_stats) AS track_stats_count,
      (SELECT COUNT(*)::int FROM analytics_logs) AS analytics_logs_count,
      (SELECT COUNT(*)::int FROM users) AS users_count,
      (SELECT COUNT(*)::int FROM sessions) AS sessions_count
  `;
  const counts = countsRes[0];

  // 2. Top Music Sets
  const topTracks = await sql`
    SELECT id, plays, likes, last_played_at 
    FROM track_stats 
    ORDER BY plays DESC
  `;

  // 3. Country Breakdown
  const countryStats = await sql`
    SELECT country, COUNT(*)::int as count 
    FROM analytics_logs 
    WHERE country IS NOT NULL AND country != ''
    GROUP BY country 
    ORDER BY count DESC
    LIMIT 5
  `;

  // 4. City Breakdown
  const cityStats = await sql`
    SELECT city, COUNT(*)::int as count 
    FROM analytics_logs 
    WHERE city IS NOT NULL AND city != ''
    GROUP BY city 
    ORDER BY count DESC
    LIMIT 8
  `;

  // 5. Device Breakdown
  const deviceStats = await sql`
    SELECT device_type, COUNT(*)::int as count 
    FROM analytics_logs 
    WHERE device_type IS NOT NULL AND device_type != ''
    GROUP BY device_type 
    ORDER BY count DESC
  `;

  // 6. OS Breakdown
  const osStats = await sql`
    SELECT os, COUNT(*)::int as count 
    FROM analytics_logs 
    WHERE os IS NOT NULL AND os != ''
    GROUP BY os 
    ORDER BY count DESC
  `;

  // 7. Referrer Stats
  const referrerStats = await sql`
    SELECT referrer, COUNT(*)::int as count 
    FROM analytics_logs 
    WHERE referrer IS NOT NULL AND referrer != ''
    GROUP BY referrer 
    ORDER BY count DESC
    LIMIT 8
  `;

  // 8. Recent Events
  const recentEvents = await sql`
    SELECT event_type, item_id, country, city, device_type, os, created_at 
    FROM analytics_logs 
    ORDER BY created_at DESC 
    LIMIT 15
  `;

  console.log("Analyzing telemetry and compiling HTML report...");

  const formatDate = (dateStr) => {
    if (!dateStr) return 'n/a';
    return new Date(dateStr).toLocaleString('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Berlin'
    });
  };

  const cleanReferrer = (ref) => {
    if (!ref) return 'Direct / Search';
    try {
      const url = new URL(ref);
      return url.hostname;
    } catch {
      return ref;
    }
  };

  const totalPlays = topTracks.reduce((acc, curr) => acc + (curr.plays || 0), 0);
  const totalLikes = topTracks.reduce((acc, curr) => acc + (curr.likes || 0), 0);

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>AIRDOX Flight Deck Analytics Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Space+Grotesk:wght@400;600&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: #050608;
      color: #f5f8ff;
      line-height: 1.5;
      padding: 40px;
    }

    .report-container {
      max-width: 1000px;
      margin: 0 auto;
    }

    header {
      border-bottom: 2px solid #1f2a38;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .brand-title h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #f5f8ff;
      text-transform: uppercase;
    }

    .brand-title h1 span {
      color: #00f0ff;
    }

    .brand-title p {
      color: #9aa6b2;
      font-size: 14px;
      margin-top: 4px;
    }

    .meta-date {
      text-align: right;
      font-size: 13px;
      color: #9aa6b2;
    }

    .meta-date strong {
      color: #9adf6b;
    }

    /* Grid layout */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 35px;
    }

    .metric-card {
      background: #0f141a;
      border: 1px solid #1f2a38;
      border-radius: 12px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: #00f0ff;
    }

    .metric-card.green::before {
      background: #9adf6b;
    }

    .metric-card .label {
      font-size: 13px;
      color: #9aa6b2;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-card .value {
      font-size: 28px;
      font-weight: 700;
      font-family: 'Space Grotesk', sans-serif;
      margin-top: 5px;
    }

    .metric-card .subtext {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }

    /* Sections */
    section {
      background: #0f141a;
      border: 1px solid #1f2a38;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    section h2 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 1px solid #1f2a38;
      display: flex;
      justify-content: space-between;
      color: #00f0ff;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      font-size: 13px;
      color: #9aa6b2;
      text-transform: uppercase;
      padding: 10px 12px;
      border-bottom: 2px solid #1f2a38;
      font-weight: 600;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #1f2a38;
      font-size: 14px;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .badge-code {
      font-family: monospace;
      background: #1e293b;
      color: #00f0ff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }

    /* Sub grids */
    .columns-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
    }

    .bar-row {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      font-size: 14px;
    }

    .bar-row .bar-label {
      width: 140px;
      color: #f5f8ff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar-row .bar-outer {
      flex-grow: 1;
      height: 8px;
      background: #1e293b;
      border-radius: 4px;
      margin: 0 15px;
      position: relative;
    }

    .bar-row .bar-inner {
      height: 100%;
      background: linear-gradient(90deg, #00f0ff, #9adf6b);
      border-radius: 4px;
    }

    .bar-row .bar-val {
      width: 40px;
      text-align: right;
      font-weight: 600;
      color: #9adf6b;
    }

    /* Log entries */
    .log-item {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 8px 12px;
      border-bottom: 1px solid #1a232d;
    }

    .log-item:last-child {
      border-bottom: none;
    }

    .log-item .type {
      text-transform: uppercase;
      font-weight: 600;
      color: #00f0ff;
      width: 70px;
    }

    .log-item .id {
      color: #9adf6b;
      flex-grow: 1;
      font-family: monospace;
    }

    .log-item .meta {
      color: #9aa6b2;
      margin-right: 20px;
    }

    .log-item .time {
      color: #64748b;
    }

    .footer-text {
      text-align: center;
      font-size: 12px;
      color: #64748b;
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #1f2a38;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <header>
      <div class="brand-title">
        <h1>AIRDOX <span>Flight Deck</span></h1>
        <p>Live-Statistiken, Hörer-Insights & Telemetrie-Auswertung</p>
      </div>
      <div class="meta-date">
        Bericht erstellt am: <strong>${formatDate(new Date())}</strong><br>
        Datenquelle: <strong>Neon cloud (PostgreSQL)</strong>
      </div>
    </header>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="label">Hörer-Events</div>
        <div class="value">${counts.analytics_logs_count}</div>
        <div class="subtext">Aktiv aufgezeichnet</div>
      </div>
      <div class="metric-card">
        <div class="label">Gesamte Plays</div>
        <div class="value">${totalPlays}</div>
        <div class="subtext">Über alle Sets</div>
      </div>
      <div class="metric-card green">
        <div class="label">Registrierte Sets</div>
        <div class="value">${counts.track_stats_count}</div>
        <div class="subtext">In Statistiken</div>
      </div>
      <div class="metric-card green">
        <div class="label">VIP Accounts</div>
        <div class="value">${counts.users_count}</div>
        <div class="subtext">Hörer-Logins</div>
      </div>
    </div>

    <section>
      <h2>Top Musik-Sets <span>Plays & Interaktionen</span></h2>
      <table>
        <thead>
          <tr>
            <th>Set ID / Name</th>
            <th style="text-align: center;">Plays</th>
            <th style="text-align: center;">Likes</th>
            <th style="text-align: right;">Zuletzt abgespielt</th>
          </tr>
        </thead>
        <tbody>
          ${topTracks.slice(0, 10).map(row => `
            <tr>
              <td><span class="badge-code">${row.id}</span></td>
              <td style="text-align: center; font-weight: 600; color: #9adf6b;">${row.plays}</td>
              <td style="text-align: center; color: #00f0ff;">${row.likes}</td>
              <td style="text-align: right; color: #9aa6b2;">${formatDate(row.last_played_at)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>

    <div class="columns-2">
      <section>
        <h2>Hörer-Herkunft (Städte) <span>Geografie</span></h2>
        <div style="padding-top: 10px;">
          ${cityStats.length ? cityStats.map(row => {
            const maxVal = cityStats[0].count || 1;
            const pct = Math.round((row.count / maxVal) * 100);
            return `
              <div class="bar-row">
                <span class="bar-label">${row.city}</span>
                <div class="bar-outer">
                  <div class="bar-inner" style="width: ${pct}%;"></div>
                </div>
                <span class="bar-val">${row.count}</span>
              </div>
            `;
          }).join('') : '<p style="color: #64748b; font-size: 14px;">Keine Städtewerte erfasst.</p>'}
        </div>
      </section>

      <section>
        <h2>Traffic-Quellen <span>Referrer</span></h2>
        <div style="padding-top: 10px;">
          ${referrerStats.length ? referrerStats.map(row => {
            const maxVal = referrerStats[0].count || 1;
            const pct = Math.round((row.count / maxVal) * 100);
            return `
              <div class="bar-row">
                <span class="bar-label">${cleanReferrer(row.referrer)}</span>
                <div class="bar-outer">
                  <div class="bar-inner" style="width: ${pct}%;"></div>
                </div>
                <span class="bar-val">${row.count}</span>
              </div>
            `;
          }).join('') : '<p style="color: #64748b; font-size: 14px;">Direct Traffic oder keine Quellenangaben.</p>'}
        </div>
      </section>
    </div>

    <div class="columns-2">
      <section>
        <h2>Geräte-Klassen <span>Endgeräte</span></h2>
        <div style="padding-top: 10px;">
          ${deviceStats.length ? deviceStats.map(row => {
            const maxVal = deviceStats[0].count || 1;
            const pct = Math.round((row.count / maxVal) * 100);
            return `
              <div class="bar-row">
                <span class="bar-label">${row.device_type}</span>
                <div class="bar-outer">
                  <div class="bar-inner" style="width: ${pct}%;"></div>
                </div>
                <span class="bar-val">${row.count}</span>
              </div>
            `;
          }).join('') : '<p style="color: #64748b; font-size: 14px;">Keine Gerätedaten erfasst.</p>'}
        </div>
      </section>

      <section>
        <h2>Betriebssysteme <span>OS-Plattformen</span></h2>
        <div style="padding-top: 10px;">
          ${osStats.length ? osStats.map(row => {
            const maxVal = osStats[0].count || 1;
            const pct = Math.round((row.count / maxVal) * 100);
            return `
              <div class="bar-row">
                <span class="bar-label">${row.os}</span>
                <div class="bar-outer">
                  <div class="bar-inner" style="width: ${pct}%;"></div>
                </div>
                <span class="bar-val">${row.count}</span>
              </div>
            `;
          }).join('') : '<p style="color: #64748b; font-size: 14px;">Keine OS-Daten erfasst.</p>'}
        </div>
      </section>
    </div>

    <section style="page-break-before: always;">
      <h2>Letzte Live-Aktivitäten <span>Hörer-Echtzeitlog</span></h2>
      <div style="margin-top: 10px;">
        ${recentEvents.map(item => `
          <div class="log-item">
            <span class="type">${item.event_type}</span>
            <span class="id">${item.item_id || '-'}</span>
            <span class="meta">${item.country || 'n/a'} (${item.city || 'n/a'}) • ${item.device_type || 'n/a'} • ${item.os || 'n/a'}</span>
            <span class="time">${formatDate(item.created_at)}</span>
          </div>
        `).join('')}
      </div>
    </section>

    <div class="footer-text">
      AIRDOX Flight Deck Analytics • Vertraulich • Nur für interne Auswertung
    </div>
  </div>
</body>
</html>
  `;

  const outDir = join(process.cwd(), 'release');
  mkdirSync(outDir, { recursive: true });
  
  const pdfOut = join(outDir, 'AIRDOX-Analytics-Report.pdf');
  console.log("Launching Chromium via Playwright to generate high-fidelity PDF...");
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  
  await page.pdf({
    path: pdfOut,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
  });
  
  await browser.close();
  console.log(`Report successfully saved: ${pdfOut}`);
  console.log("FINISHED");
}

generateReport().catch(err => {
  console.error("Failed to generate report:", err);
  process.exit(1);
});
