export const ASSISTANT_KNOWLEDGE = [
  {
    id: 'online-publish',
    title: 'Set online stellen (Website verfügbar machen)',
    keywords: ['online', 'website', 'webseite', 'verfügbar', 'set online stellen', 'veröffentlichen', 'publizieren', 'go live', 'live stellen'],
    answer: 'So stellst du ein Set online: 1) Workspace verbinden und Settings speichern. 2) Im Tab "Set Import" Audio/Cover/Tracklist laden. 3) Draft prüfen (id, title, file, tracks). 4) "Publizieren" für Manifest/Assets oder direkt "Alles ausführen & Live" für Publish + Build/Deploy. 5) Danach im Browser prüfen, ob das Set in der Music-Sektion sichtbar ist. Bei Fehlern: Build-/Deploy-Command in Advanced Settings prüfen.',
  },
  {
    id: 'workspace',
    title: 'Workspace konfigurieren',
    keywords: ['workspace', 'ordner', 'projekt', 'verbinden', 'pfad'],
    answer: 'Öffne den Tab "Flight Deck" oder "Advanced Settings", wähle "Workspace auswählen" und speichere. Ein gültiger Workspace braucht package.json, src/data/musicSets.js und wrangler.jsonc.',
  },
  {
    id: 'import',
    title: 'Set importieren',
    keywords: ['import', 'set import', 'audio', 'cover', 'tracklist', 'demo import'],
    answer: 'Im Tab "Set Import" kannst du Dateien wählen oder "Demo Import" nutzen. Prüfe ID, Titel, Datei, Tracks und starte danach "Publizieren" oder "Alles ausführen & Live".',
  },
  {
    id: 'publish',
    title: 'Publizieren und live stellen',
    keywords: ['publish', 'publizieren', 'live', 'deploy', 'build', 'go live'],
    answer: 'Mit "Alles ausführen & Live" speichert das Tool Settings und startet Publish plus Build/Deploy gemäß Konfiguration. Wenn es fehlschlägt, prüfe Build-/Deploy-Command im Tab "Advanced Settings".',
  },
  {
    id: 'analytics',
    title: 'Analytics und Filter',
    keywords: ['analytics', 'filter', 'zeitraum', 'event', 'gerät', 'land'],
    answer: 'Im Tab "Analytics" wirken Zeitraum-, Event-, Geräte- und Länderfilter direkt auf Kennzahlen, Top-Sets, Geo-Verteilung und Event-Typ-Übersicht.',
  },
  {
    id: 'db-error',
    title: 'Datenbankfehler',
    keywords: ['datenbank', 'neon', 'fetch failed', 'db', 'error'],
    answer: 'Bei Neon/DB-Fehlern bleibt die App jetzt lauffähig. Prüfe DATABASE_URL/NEON_DATABASE_URL/POSTGRES_URL in der Workspace-.env und Netzwerkzugang zur Datenbank.',
  },
  {
    id: 'explorer',
    title: 'Data Explorer',
    keywords: ['data explorer', 'sql', 'query', 'readonly', 'table', 'track_stats'],
    answer: 'Im Data Explorer sind Read-only Queries erlaubt (SELECT/WITH/EXPLAIN). Du kannst Tabellen laden, Datensätze exportieren und ausgewählte Datensätze bearbeiten/löschen.',
  },
  {
    id: 'monitor',
    title: 'System Monitor',
    keywords: ['monitor', 'system', 'cpu', 'ram', 'cache', 'optimize'],
    answer: 'Der System Monitor zeigt RAM/CPU/Prozesse, kann Cache leeren und Optimierung anstoßen. Nutze ihn für schnelle Diagnose vor Build/Deploy.',
  },
];
