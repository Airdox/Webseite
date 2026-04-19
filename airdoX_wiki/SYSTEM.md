# SYSTEM.md - AIRDOX Wiki Kernel

Dies ist die zentrale Steuerdatei, die das Verhalten des AIRDOX Wiki Agenten definiert. Sie enthält die Vision, Philosophie, Architektur und die detaillierten Workflows für die Wissenskompilierung.

## 1. Vision & Philosophie (The Karpathy Way)

### Ziel
Erstelle das "AIRDOX Wiki System" – ein autonomes "LLM Personal Wiki", das den RAG-Ansatz durch einen Compilation-Ansatz ersetzt.

### Kern-Philosophie

*   **"Wissen verdient Zinsen"**: Jede neue Information wird nicht nur gespeichert, sondern mit dem bestehenden Netz verwebt, wodurch der Wert des Wikis exponentiell steigt.
*   **Vom Suchenden zum Verwalter**: Das LLM agiert nicht als Suchmaschine, sondern als ein aktiver Wiki-Maintainer (Software 2.0), der Wissen strukturiert und sauber hält.

## 2. Die 3-Säulen-Architektur

### A. /raw (The Source of Truth)

*   Unveränderliche Quelldaten (PDFs, Web-Clips, Audio-Transkripte).
*   Dient als Referenz für den "Compiler", wird aber niemals vom Agenten verändert.

### B. /wiki (The Compiled Kernel)

*   Strukturierte, atomare Markdown-Dateien.
*   Enthält zwei spezialisierte Meta-Dateien:
    *   `index.md`: Ein vom Agenten selbst gepflegtes Inhaltsverzeichnis aller Konzepte.
    *   `log.md`: Ein Journal aller Änderungen und Ingest-Vorgänge ("Journal of Growth").

### C. SYSTEM.md / Kernel (The Brain)

*   Die zentrale Steuerdatei (wie Karpathys CLAUDE.md), die das Verhalten des Agenten definiert.
*   Enthält Workflows für Ingest, Update, Query und Linting.

## 3. Der "Compilation-Workflow"

### Ingest & Compilation

*   Das LLM erhält Rohdaten und entscheidet, ob es eine neue Seite erstellt oder eine bestehende Seite im /wiki erweitert (Smart-Merge).
*   Jede neue Information muss mit mindestens zwei anderen Seiten verlinkt werden ([[Wikilinks]]), um "Waisenseiten" zu vermeiden.

### Knowledge Linting (Aktivität im Hintergrund)

Das System scannt das Wiki regelmäßig auf:

*   **Widersprüche**: Wenn Seite A Fakten behauptet, die Seite B widersprechen.
*   **Lücken**: Wenn Begriffe oft verlinkt, aber noch nicht definiert sind.
*   **Veraltung**: Markierung von Informationen, die durch neuere Ingests überschrieben wurden.

### Semantic Search vs. Wiki-Navigation

*   Anstelle von einfachem Keyword-Matching navigiert das LLM durch das Wiki, indem es die `index.md` und die Querverweise nutzt, um Kontext für Antworten aufzubauen.

## 4. UI/UX & Technischer Stack

*   **Stack**: Python, Kivy, Ollama/Groq, Whisper, watchdog.
*   **Obsidian Integration**: Das `/wiki` ist so formatiert, dass die Obsidian-Graphen-Ansicht ein dichtes, logisches Wissensnetzwerk zeigt.
*   **Echtzeit-Feedback**: Die GUI zeigt den "Compile-Prozess" visualisiert an (z.B. "Webe Wissen in [[Physik]] ein...", "Löse Widerspruch in [[Quantenmechanik]] auf...").

## 5. Auftrag für die KI

"Baue dieses System als eine Wissens-Kompilierungs-Maschine. Priorisiere die Vernetzung und Widerspruchsfreiheit des /wiki-Ordners über die schiere Menge an Daten. Das System muss sich anfühlen wie ein digitaler Bibliothekar, der nachts (oder bei jedem Ingest) Ihre Notizen ordnet, verbindet und optimiert."

## Workflows (Detaillierte Beschreibung)

### Workflow: Ingest

1.  **Eingabe**: Neue Rohdaten (Text, PDF, Audio-Transkript) im `/raw`-Ordner oder über eine API.
2.  **Analyse**: Das LLM analysiert die Rohdaten, extrahiert Schlüsselkonzepte und identifiziert potenzielle Verbindungen zu bestehendem Wissen.
3.  **Entscheidung**: Das LLM entscheidet, ob die Informationen eine neue Wiki-Seite erfordern oder in eine bestehende integriert werden sollen.
    *   **Neue Seite**: Erstelle eine neue Markdown-Datei im `/wiki`-Ordner mit dem extrahierten Wissen. Stelle sicher, dass die neue Seite mit mindestens zwei bestehenden Seiten über `[[Wikilinks]]` verknüpft wird. Aktualisiere `index.md`.
    *   **Bestehende Seite**: Führe die neuen Informationen intelligent (`Smart-Merge`) in die relevante(n) bestehende(n) Wiki-Seite(n) ein. Achte auf Konsistenz und vermeide Redundanz. Füge neue `[[Wikilinks]]` hinzu, falls relevant. Aktualisiere `index.md`.
4.  **Protokollierung**: Trage den Ingest-Vorgang und die vorgenommenen Änderungen in `log.md` ein.
5.  **Linting-Trigger**: Löse einen Knowledge Linting-Prozess für die betroffenen und verknüpften Seiten aus.

### Workflow: Update (Manuelle Bearbeitung)

1.  **Erkennung**: Das System erkennt manuelle Änderungen an einer `.md`-Datei im `/wiki`-Ordner (z.B. durch `watchdog`).
2.  **Analyse**: Das LLM analysiert die Änderungen und deren Auswirkungen auf das Wissensnetzwerk.
3.  **Konsistenzprüfung**: Überprüfe die Integrität der `[[Wikilinks]]` und die Konsistenz der Informationen.
4.  **Protokollierung**: Trage die manuelle Änderung in `log.md` ein.
5.  **Linting-Trigger**: Löse einen Knowledge Linting-Prozess für die betroffenen und verknüpften Seiten aus.

### Workflow: Query (Wissensabfrage)

1.  **Eingabe**: Benutzerfrage oder Suchanfrage.
2.  **Initialisierung**: Das LLM beginnt die Suche in `index.md`, um relevante Startpunkte zu identifizieren.
3.  **Navigation**: Das LLM navigiert durch das Wiki-Netzwerk über `[[Wikilinks]]`, um Kontext aufzubauen und die relevantesten Informationen zu sammeln. Dabei wird die `index.md` als Karte und die Links als Pfade genutzt.
4.  **Synthese**: Das LLM synthetisiert die gesammelten Informationen, um eine kohärente und kontextbezogene Antwort zu generieren.
5.  **Referenzierung**: Die Antwort enthält Verweise auf die verwendeten Wiki-Seiten und, falls zutreffend, auf die ursprünglichen Rohdaten im `/raw`-Ordner.

### Workflow: Linting (Knowledge Linting)

1.  **Trigger**: Ausgelöst durch Ingest, Update oder regelmäßigen Hintergrund-Scan.
2.  **Scan**: Das LLM scannt die betroffenen Wiki-Seiten und deren verknüpfte Seiten (oder das gesamte Wiki bei einem Hintergrund-Scan).
3.  **Erkennung**: Identifiziere:
    *   **Widersprüche**: Vergleiche Fakten und Aussagen zwischen verknüpften Seiten.
    *   **Lücken**: Finde häufig verlinkte Begriffe, für die keine eigene Wiki-Seite existiert.
    *   **Veraltung**: Markiere Informationen, die durch neuere Ingests überholt sein könnten (ggf. mit Zeitstempeln in Metadaten).
4.  **Aktion**: Basierend auf der Erkennung:
    *   **Widerspruch**: Versuche, den Widerspruch aufzulösen, indem die betroffenen Seiten überarbeitet werden, oder markiere den Widerspruch zur manuellen Überprüfung.
    *   **Lücke**: Erstelle eine neue Wiki-Seite für den fehlenden Begriff und verknüpfe sie entsprechend.
    *   **Veraltung**: Füge einen Hinweis auf die Veraltung hinzu oder aktualisiere die Informationen basierend auf den neuesten Quellen.
5.  **Protokollierung**: Trage die Linting-Ergebnisse und vorgenommenen Korrekturen in `log.md` ein.

## Technischer Stack (Detailliert)

*   **Sprache**: Python
*   **GUI**: Kivy (für plattformübergreifende Desktop-Anwendung)
*   **LLM-Integration**: Ollama (für lokale Modelle) und/oder Groq (für schnelle Cloud-Inferenzen)
*   **Spracherkennung**: Whisper (für Audio-Transkripte im Ingest-Workflow)
*   **Dateisystem-Überwachung**: `watchdog` (für die Erkennung manueller Updates im `/wiki`-Ordner)
*   **Datenbank (optional)**: SQLite für Metadaten, falls die Dateisystem-basierte `index.md` und `log.md` nicht ausreichen.
*   **Obsidian-Kompatibilität**: Sicherstellung der Markdown-Formatierung und `[[Wikilinks]]` für die Graphen-Ansicht.

## Entwicklungsschritte (Übersicht)

1.  **Grundlagen**: Verzeichnisstruktur, `SYSTEM.md`, `index.md`, `log.md` initialisieren.
2.  **Ingest-Engine**: Implementierung der Rohdatenverarbeitung, Smart-Merge-Logik und Wikilink-Erstellung.
3.  **Linting-Engine**: Implementierung der Widerspruchs-, Lücken- und Veraltungserkennung und -behebung.
4.  **Query-Engine**: Implementierung der Wiki-Navigation und Wissenssynthese.
5.  **LLM-Integration**: Anbindung an Ollama/Groq und Whisper.
6.  **Kivy-GUI**: Entwicklung der Benutzeroberfläche mit Echtzeit-Feedback.
7.  **Tests**: Umfassende Tests für alle Komponenten und Workflows.
8.  **Dokumentation**: Erstellung einer detaillierten Entwickler- und Benutzerdokumentation.

---

**Autor**: Manus AI
**Datum**: 19. April 2026
