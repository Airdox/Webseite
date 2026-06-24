export const ASSISTANT_GUIDES = {
  'online-publish': {
    quick: [
      'Workspace verbinden.',
      'Set Import öffnen und Dateien laden.',
      'Draft prüfen.',
      '"Alles ausführen & Live" starten.',
      'Erst nach erfolgreichem Verify als live betrachten.',
    ],
    detailed: [
      'Im Header prüfen: Workspace verbunden, Datenbank bereit, Git-Status verstanden.',
      'In Advanced Settings Build-, Deploy-, R2- und Safe-Mode-Optionen prüfen.',
      'Im Set Import Audio, Cover und Tracklist laden und die erkannten Felder kontrollieren.',
      'ID, Titel, Datei, Dauer, Audio Source und Tracklist korrigieren.',
      'Publish starten und im Log bei jedem Schritt stehen bleiben, wenn ein Fehler erscheint.',
      'Nach Verify die Website öffnen, Overview refreshen und track_stats im Data Explorer prüfen.',
    ],
  },
  workspace: {
    quick: ['Flight Deck öffnen.', 'Workspace auswählen.', 'AIRDOX-Projektordner wählen.', 'Speichern und Refresh drücken.'],
    detailed: [
      'Den Ordner wählen, in dem package.json, wrangler.jsonc und src/data/musicSets.js liegen.',
      'Prüfen, ob .env oder die erwarteten Secrets für DB/R2 vorhanden sind.',
      'Settings speichern und danach den Header-Status kontrollieren.',
      'Wenn der Workspace ungültig bleibt, Pfad korrigieren statt mit Import/Deploy fortzufahren.',
    ],
  },
  import: {
    quick: ['Set Import öffnen.', 'Audio, Cover und Tracklist hineinziehen.', 'Draft prüfen.', 'Publish oder Go Live starten.'],
    detailed: [
      'Erst die Audiodatei auswählen, weil daraus Dauer, Dateiname und oft Cover abgeleitet werden.',
      'Cover und Tracklist ergänzen und prüfen, ob die Trackzeiten lesbar sind.',
      'ID und Titel bewusst setzen, damit keine Duplikate oder generischen Set-Namen entstehen.',
      'Audio Source muss im Safe Mode ein echter Windows-Dateipfad sein.',
      'Vor Publish kurz Tracklist, Cover, Vinyl-Farbe und Zielposition prüfen.',
    ],
  },
  publish: {
    quick: ['Draft vorbereiten.', 'Publish nach Settings oder Alles ausführen & Live wählen.', 'Log beobachten.', 'Verify abwarten.'],
    detailed: [
      'Publish nach Settings nutzt deine gespeicherten Automationen; Alles ausführen & Live erzwingt Build/Deploy.',
      'Bei Upload-Fehlern R2 und .env prüfen.',
      'Bei Manifest-Fehlern Draft-ID, Datei und Schreibrechte prüfen.',
      'Bei Build-Fehlern npm run build manuell ausführen und die erste Fehlermeldung beheben.',
      'Bei Deploy-Fehlern Wrangler/Auth/Cloudflare prüfen.',
      'Bei Verify-Fehlern Live-Seite, Set-ID und Track-Tokens kontrollieren.',
    ],
  },
  analytics: {
    quick: ['Analytics öffnen.', 'Zeitraum setzen.', 'Event-Typ wählen.', 'Top Sets und Geräte prüfen.', 'Aktualisieren klicken.'],
    detailed: [
      'Zuerst den Zeitraum eingrenzen, sonst vergleichst du alte und neue Kampagnen durcheinander.',
      'Views und Plays getrennt betrachten: Views zeigen Sichtbarkeit, Plays zeigen echte Nutzung.',
      'Land und Gerät filtern, wenn ein Set nur in bestimmten Situationen schwach ist.',
      'Top Sets mit schwachen Sets vergleichen und danach im Data Explorer analytics_logs prüfen.',
      'Bei vielen Views und wenigen Plays Hook, Cover, Titel, Ladezeit und Player-Verhalten prüfen.',
    ],
  },
  'db-error': {
    quick: ['Workspace-.env öffnen.', 'DATABASE_URL oder NEON_DATABASE_URL prüfen.', 'Netzwerk/VPN prüfen.', 'Refresh drücken.'],
    detailed: [
      'Die Connection-URL muss vollständig sein und sslmode=require enthalten, wenn Neon es braucht.',
      'Neon-Dashboard öffnen und prüfen, ob die Datenbank schläft oder Credentials geändert wurden.',
      'Firewall, VPN und Internet prüfen.',
      'Flight Deck bleibt für lokale Arbeit nutzbar, aber Analytics, VIP, Sessions und Stats können fehlen.',
    ],
  },
  explorer: {
    quick: ['Data Explorer öffnen.', 'Tabelle wählen.', 'Suche/Filter nutzen.', 'Änderung oder Export ausführen.'],
    detailed: [
      'track_stats für Set-Metriken, subscribers für Newsletter, users/sessions für VIP-Zugänge nutzen.',
      'Vor Inline-Änderungen die konkrete Zeile über Suche eingrenzen.',
      'Read-only SQL nur für SELECT/WITH/EXPLAIN verwenden.',
      'Für externe Auswertung CSV exportieren, für technische Weiterverarbeitung JSON exportieren.',
      'Nach Änderungen Refresh drücken und prüfen, ob die Tabelle den erwarteten Zustand zeigt.',
    ],
  },
  monitor: {
    quick: ['System Monitor öffnen.', 'Aktualisieren klicken.', 'RAM/CPU/Disk prüfen.', 'Bei Bedarf Cache löschen.'],
    detailed: [
      'Hohe RAM- oder CPU-Werte zuerst mit laufenden Prozessen abgleichen.',
      'Cache löschen, wenn Preview/Build alte Artefakte zeigt.',
      'Optimieren nur nutzen, wenn lokale Last oder temporäre Dateien auffällig sind.',
      'Danach den ursprünglichen Flight-Deck-Schritt erneut ausführen und vergleichen.',
    ],
  },
  batch: {
    quick: ['Batch Import öffnen.', 'Dateien gruppiert hineinziehen.', 'Queue prüfen.', 'Start drücken.', 'Auswahl live stellen.'],
    detailed: [
      'Dateien vorab gleich benennen, z.B. set.mp3, set.jpg, set.tracks.txt.',
      'Nach dem Hinzufügen prüfen, ob Audio, Cover und Tracklist pro Queue-Eintrag zusammenpassen.',
      'Nur Einträge markieren, die wirklich live gehen sollen.',
      'Erst Drafts vorbereiten, dann Fehler pro Eintrag korrigieren.',
      'Auswahl live stellen und erfolgreiche Einträge erst danach aus der Queue räumen.',
    ],
  },
  'design-agent': {
    quick: [
      'Design Agent öffnen.',
      'Set wählen.',
      'Reel oder Square wählen.',
      'Signal System oder Club Still Parallax wählen.',
      'Nur Motion, Glitch und Waveform grob setzen.',
      'Render starten.',
    ],
    detailed: [
      'Set bewusst wählen, weil Musik, Titel und Cover die spätere Visual-Richtung bestimmen.',
      'Format festlegen: Square für Cover/Post, Reel für 9:16 Video, Story für Hook-Frame.',
      'Preset auswählen und erst danach entscheiden, ob du Hintergrund, Marke oder Motion ändern musst.',
      'In Feintuning & Marke alle Regler systematisch durchgehen: Motion, Beat-Energie, Glitch, Parallax, Waveform, Typografie.',
      'Markentext, Markstyle und Hintergrundquelle prüfen; eigene Hintergründe nur setzen, wenn du wirklich ein anderes Motiv brauchst.',
      'Render starten, Logs verfolgen und danach im Export den passenden Output öffnen.',
      'Mit "Hauptansicht" aus dem separaten Design Studio zurück ins Flight Deck wechseln.',
    ],
  },
  'flightdeck-map': {
    quick: ['Overview für Lage.', 'Publish-Tabs für Sets.', 'Daten-Tabs für Auswertung.', 'System-Tabs für Settings und Hilfe nutzen.'],
    detailed: [
      'Starte in Overview, wenn du nicht weißt, was als Nächstes wichtig ist.',
      'Nutze Set Import für ein einzelnes Set und Batch Import für mehrere Sets.',
      'Nutze Marketing Manager und Design Agent nur für externe Assets, Kampagnen und Visuals.',
      'Nutze Analytics und Data Explorer, wenn du Verhalten oder Tabellen prüfen musst.',
      'Nutze Advanced Settings, Monitor, Tutorial und Assistant für Konfiguration, Diagnose und Lernen.',
    ],
  },
  'go-live-preflight': {
    quick: ['Overview prüfen.', 'Settings prüfen.', 'Draft prüfen.', 'Publish starten.', 'Verify und Website prüfen.'],
    detailed: [
      'Workspace, Git, DB und Queue im Header kontrollieren.',
      'Safe Mode, R2 Prefix, Build Command und Deploy Command prüfen.',
      'Draft mit ID, Titel, Datei, Audio Source, Cover und Tracklist kontrollieren.',
      'Publish Log Schritt für Schritt beobachten.',
      'Nach Verify Website, Overview und track_stats kontrollieren.',
    ],
  },
  glossary: {
    quick: ['Begriff suchen.', 'Bedeutung lesen.', 'Passenden Tab öffnen.', 'Dort den Status oder die Daten prüfen.'],
    detailed: [
      'Bei Workflow-Begriffen wie Draft, Publish, Go Live immer den zugehörigen Tab öffnen.',
      'Bei Datenbegriffen wie track_stats oder analytics_logs den Data Explorer öffnen.',
      'Bei Infrastrukturbegriffen wie R2, Safe Mode oder Deploy die Advanced Settings öffnen.',
      'Begriffe nicht isoliert behandeln: immer prüfen, welche konkrete Aktion davon abhängt.',
    ],
  },
  'data-model': {
    quick: ['Data Explorer öffnen.', 'Tabelle wählen.', 'Spalten lesen.', 'Bei Bedarf exportieren.'],
    detailed: [
      'track_stats für Set-Metriken verwenden.',
      'analytics_logs für Ereignisse und Ursachenanalyse verwenden.',
      'users und sessions für VIP-Zugänge verwenden.',
      'subscribers und bookings für Kontakt- und Newsletter-Arbeit verwenden.',
      'Schreibende Änderungen nur über die vorgesehenen UI-Aktionen durchführen.',
    ],
  },
  'analytics-terms': {
    quick: ['Views prüfen.', 'Plays prüfen.', 'Engagement vergleichen.', 'Land/Gerät filtern.'],
    detailed: [
      'Views zeigen Reichweite, Plays zeigen echte Nutzung.',
      'Likes und Dislikes nur mit ausreichendem Volumen interpretieren.',
      'Engagement immer im gewählten Zeitraum betrachten.',
      'Schwache Sets nach Sichtbarkeit, Startverhalten, Gerät und Land untersuchen.',
      'Auffälligkeiten im Data Explorer mit analytics_logs gegenprüfen.',
    ],
  },
  'publish-pipeline': {
    quick: ['Log-Schritt finden.', 'Ursache zum Schritt zuordnen.', 'Fehler beheben.', 'Publish erneut starten.'],
    detailed: [
      'Preflight-Fehler bedeuten meist Workspace, Settings oder Draft.',
      'Upload-Fehler bedeuten meist R2 oder Credentials.',
      'Manifest-Fehler bedeuten meist Set-Daten oder Schreibrechte.',
      'Build-Fehler bedeuten Code oder Dependencies.',
      'Deploy-Fehler bedeuten Cloudflare/Wrangler.',
      'Verify-Fehler bedeuten Live-Bundle, Cache oder falsche Set-Daten.',
    ],
  },
  'settings-toggles': {
    quick: ['Advanced Settings öffnen.', 'Nur benötigte Toggles aktivieren.', 'Speichern.', 'Refresh prüfen.'],
    detailed: [
      'Safe Mode normalerweise aktiv lassen.',
      'Upload Audio to R2 nur aktivieren, wenn Credentials und Bucket stimmen.',
      'Auto Build/Deploy nur aktivieren, wenn die Commands geprüft sind.',
      'Auto Commit/Push nur nutzen, wenn der Branch sauber und bewusst gewählt ist.',
      'Nach jeder Änderung speichern und einen kleinen Testlauf machen.',
    ],
  },
  'agent-system': {
    quick: ['Gesuchten Agenten oder Report identifizieren.', 'latest-Report öffnen.', 'Entscheidung oder Aktion ableiten.'],
    detailed: [
      'latest-*.md/json für aktuellen Maschinenstand verwenden.',
      'reports/ für dauerhafte Runbooks und Kampagnen verwenden.',
      'visual-templates/ für Designer-Ausgaben verwenden.',
      'DECISION_LOG.md für verbindliche Entscheidungen prüfen.',
      'Alte Pfade nicht als aktuelle Wahrheit behandeln.',
    ],
  },
  'marketing-manager': {
    quick: ['Marketing Manager öffnen.', 'Operation auswählen.', 'Copy/Asset prüfen.', 'Freigeben oder ablehnen.'],
    detailed: [
      'Kampagnenziel und Grenzen lesen.',
      'Jede Operation einzeln prüfen: Plattform, Asset, Copy, Timing, KPI, Budget.',
      'Freigabe nur geben, wenn Copy, Asset und Budget exakt passen.',
      'Ablehnung mit kurzer Notiz versehen.',
      'Neue Draft Requests mit Ziel, Kanal und Einschränkungen anlegen.',
    ],
  },
  'tutorial-workflows': {
    quick: ['Tutorial öffnen.', 'Passende Tour wählen.', 'Schritt ausführen.', 'Status prüfen.'],
    detailed: [
      'Quick Start für erste Orientierung nutzen.',
      'Go-Live-Tour vor echten Veröffentlichungen nutzen.',
      'Analytics/Data-Explorer-Tour für Auswertung nutzen.',
      'Nach jedem Tour-Schritt den sichtbaren Zustand prüfen, nicht nur weiterklicken.',
    ],
  },
  settings: {
    quick: ['Advanced Settings öffnen.', 'Pfade und Commands prüfen.', 'Toggles setzen.', 'Speichern.'],
    detailed: [
      'Workspace Root, R2 Prefix und Cover Output Dir prüfen.',
      'Build- und Deploy-Commands manuell kennen, bevor Auto Build/Deploy aktiv ist.',
      'Safe Mode und Upload-Optionen passend zum Workflow setzen.',
      'Git-Automation erst aktivieren, wenn Commit/Push bewusst gewünscht sind.',
      'Nach Speichern Header und Notice prüfen.',
    ],
  },
  tutorial: {
    quick: ['Interaktive Tour öffnen.', 'Tour wählen.', 'Schrittweise durchgehen.', 'Bei Bedarf neu starten.'],
    detailed: [
      'Nicht alle Touren gleichzeitig nutzen; wähle die zum aktuellen Ziel passende Tour.',
      'Bei jedem Schritt den betroffenen Tab wirklich ansehen.',
      'Wenn ein Schritt unklar ist, Assistant nach genau diesem Tab fragen.',
      'Tour danach im Tutorial-Tab erneut starten oder abhaken.',
    ],
  },
  'vip-users': {
    quick: ['Data Explorer öffnen.', 'users oder sessions wählen.', 'User anlegen oder Session widerrufen.'],
    detailed: [
      'Für neue Zugänge users öffnen und Username, Email und Passwort setzen.',
      'Für Login-Probleme Passwort resetten.',
      'Für aktive Zugriffe sessions öffnen und betroffene Session widerrufen.',
      'Nach Änderungen Refresh drücken und prüfen, ob die Zeile aktualisiert wurde.',
    ],
  },
  'git-status': {
    quick: ['Header prüfen.', 'Bei dirty Änderungen ansehen.', 'Erst dann Publish/Commit ausführen.'],
    detailed: [
      'Branch bewusst prüfen.',
      'Dirty heißt: es gibt uncommittete Änderungen, nicht automatisch ein Problem.',
      'Vor Auto Commit/Push prüfen, ob die Änderungen wirklich zum Publish gehören.',
      'Nach erfolgreichem Publish Git-Status erneut ansehen.',
    ],
  },
  'r2-upload': {
    quick: ['.env prüfen.', 'R2 Prefix prüfen.', 'Audio Source prüfen.', 'Go Live starten.'],
    detailed: [
      'AWS_ACCESS_KEY_ID und AWS_SECRET_ACCESS_KEY müssen zur R2-Konfiguration passen.',
      'Bucket und Prefix müssen in Cloudflare existieren.',
      'Audio muss lokal verfügbar sein, wenn Safe Mode aktiv ist.',
      'Nach Upload Manifest und Website-Audio prüfen.',
    ],
  },
  'tracklist-editor': {
    quick: ['Set Import öffnen.', 'Tracklist prüfen.', 'Zeiten korrigieren.', 'Tracks hinzufügen oder entfernen.'],
    detailed: [
      'Jede Zeile braucht eine springbare Zeit wie 00:00 oder 01:02:03.',
      'Artist und Titel klar trennen.',
      'Fehlende Tracks über Track hinzufügen ergänzen.',
      'Falsche Tracks entfernen und danach Publish-Preview prüfen.',
    ],
  },
  'vinyl-cover': {
    quick: ['Set Import öffnen.', 'Cover prüfen.', 'Vinyl-Farbe wählen.', 'Draft speichern/publishen.'],
    detailed: [
      'Cover Source ist die lokale Originaldatei.',
      'Cover Path ist der Pfad, den die Website später nutzt.',
      'Embedded Cover nur nutzen, wenn die Audiodatei ein brauchbares Bild enthält.',
      'Vinyl-Farbe passend zum Cover wählen und im Preview prüfen.',
    ],
  },
  'overview-dashboard': {
    quick: ['Overview öffnen.', 'Blocker lesen.', 'Nächsten Schritt klicken.', 'Nach Aktionen refreshen.'],
    detailed: [
      'Header-Status für Workspace, Git, DB und Queue lesen.',
      'Top Sets und Recent Analytics als Lagebild verwenden.',
      'Manifest-Health prüfen, wenn Stats oder Set-Anzeige fehlen.',
      'Nach Import, Publish oder Settings-Änderung Refresh drücken.',
    ],
  },
  'keyboard-shortcuts': {
    quick: ['Enter im Chat senden.', 'Escape für Overlay schließen.', 'Header-Aktionen für Tabwechsel nutzen.'],
    detailed: [
      'Shortcuts nur für kleine Aktionen nutzen.',
      'Für kritische Aktionen wie Publish immer sichtbare Buttons und Logs verwenden.',
      'Wenn ein Shortcut nicht greift, Fokus ins passende Eingabefeld setzen.',
    ],
  },
  troubleshooting: {
    quick: ['Workspace prüfen.', 'DB prüfen.', 'Git prüfen.', 'Refresh drücken.', 'Log-Schritt lesen.'],
    detailed: [
      'Fehler erst einem Bereich zuordnen: Import, Publish, Build, Deploy, Verify, DB oder UI.',
      'Die erste konkrete Fehlermeldung notieren.',
      'Workspace, Audio Source und Tracklist prüfen, weil sie häufige Ursachen sind.',
      'Danach gezielt den betroffenen Tab öffnen und nicht mehrere Dinge gleichzeitig ändern.',
    ],
  },
  'safe-mode': {
    quick: ['Safe Mode anlassen.', 'Audio Source setzen.', 'Publish erneut starten.'],
    detailed: [
      'Safe Mode schützt echte Publishes vor fehlender lokaler Audiodatei.',
      'Wenn Audio bereits sicher in R2 liegt, kann Safe Mode bewusst deaktiviert werden.',
      'Für normale Imports bleibt Safe Mode aktiv.',
      'Bei Blockade im Draft die Audio Source neu über Dateien wählen setzen.',
    ],
  },
  'assistant-help': {
    quick: ['Konkreten Tab oder Fehler nennen.', 'Frage stellen.', 'Vorgeschlagene Aktion öffnen.', 'Ergebnis prüfen.'],
    detailed: [
      'Gute Fragen enthalten Ziel, betroffenen Tab und beobachtetes Verhalten.',
      'Bei Fehlern den exakten Log-Schritt und die Fehlermeldung nennen.',
      'Bei Workflows nach Schnellweg oder detailliertem Weg fragen.',
      'Assistant-Aktionen als Abkürzung nutzen, aber sichtbaren Zustand danach prüfen.',
    ],
  },
  'export-data': {
    quick: ['Data Explorer öffnen.', 'Tabelle und Filter setzen.', 'CSV oder JSON exportieren.'],
    detailed: [
      'Vor Export die Suche setzen, wenn nur ein Ausschnitt gebraucht wird.',
      'CSV für Tabellenprogramme verwenden.',
      'JSON für technische Weiterverarbeitung verwenden.',
      'Nach Export Datei öffnen und prüfen, ob Filter und Spalten stimmen.',
    ],
  },
  'subscriber-management': {
    quick: ['Data Explorer öffnen.', 'subscribers wählen.', 'Status bearbeiten.', 'CSV exportieren.'],
    detailed: [
      'Newsletter-Status nur gezielt ändern: active, paused oder unsubscribed.',
      'Email vor externem Export auf Tippfehler prüfen.',
      'Für Newsletter-Tools CSV exportieren.',
      'Nach Inline-Edit Refresh drücken.',
    ],
  },
  'first-set': {
    quick: ['Workspace verbinden.', 'Set Import laden.', 'Draft prüfen.', 'Alles ausführen & Live starten.', 'Website prüfen.'],
    detailed: [
      'Vor dem ersten Set einmal .env, Build Command und Deploy Command prüfen.',
      'Audio, Cover und Tracklist laden.',
      'ID, Titel, Dauer, Tracks, Cover und Vinyl-Farbe korrigieren.',
      'Alles ausführen & Live starten und alle Log-Schritte bis Verify abwarten.',
      'Website öffnen, Overview refreshen und track_stats prüfen.',
    ],
  },
};

export const formatAssistantGuide = (entryId) => {
  const guide = ASSISTANT_GUIDES[entryId];
  if (!guide) return '';

  return [
    'Schnellweg:',
    ...guide.quick.map((step, index) => `${index + 1}) ${step}`),
    '',
    'Detaillierter Weg:',
    ...guide.detailed.map((step, index) => `${index + 1}) ${step}`),
  ].join('\n');
};
