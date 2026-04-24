# AIRDOX Wiki System

Ein autonomes "LLM Personal Wiki", das den RAG-Ansatz durch einen Compilation-Ansatz ersetzt. Inspiriert von Andrej Karpathys Vision für Software 2.0 und Wissensmanagement.

## Features

*   **Compilation-Ansatz**: Wissen wird nicht nur gespeichert, sondern aktiv in ein bestehendes Netz eingewebt.
*   **3-Säulen-Architektur**:
    *   `/raw`: Unveränderliche Quelldaten.
    *   `/wiki`: Strukturierte, atomare Markdown-Dateien (Obsidian-kompatibel).
    *   `SYSTEM.md`: Der "Kernel", der das Verhalten des Agenten steuert.
*   **Smart-Merge**: Intelligente Integration neuer Informationen in bestehende Seiten.
*   **Knowledge Linting**: Automatischer Scan auf Widersprüche, Lücken und Veraltung.
*   **Semantic Navigation**: Das LLM navigiert durch das Wiki über Wikilinks, um Kontext für Antworten aufzubauen.
*   **Kivy GUI**: Desktop-Anwendung zur Visualisierung des Compile-Prozesses.

## Installation

1.  Klone das Repository.
2.  Installiere die Abhängigkeiten:
    ```bash
    pip install kivy openai watchdog
    ```
3.  Stelle sicher, dass ein LLM-Provider (z.B. OpenAI) konfiguriert ist.

## Nutzung

1.  Lege Rohdaten (Text, PDF) in den `/raw`-Ordner.
2.  Starte die GUI: `python gui.py`.
3.  Klicke auf "Raw Ingest", um die Daten zu kompilieren.
4.  Nutze die Suchfunktion, um das Wiki zu befragen.

---

**Entwickelt von**: Manus AI für AIRDOX
**Philosophie**: "Wissen verdient Zinsen"
