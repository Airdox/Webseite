# Manuelles Deployment Anleitung (Deutsch)

Da das automatische Deployment eine Anmeldung erfordert, folgen Sie bitte diesen Schritten:

## Option 1: Drag & Drop (Empfohlen)

1.  Öffnen Sie **[Netlify Drop](https://app.netlify.com/drop)** im Browser.
2.  Öffnen Sie Ihren Projektordner im Datei-Explorer: `z:\teszt\we-close`
3.  Suchen Sie den Ordner `dist`.
4.  Ziehen Sie den Ordner `dist` in das Browser-Fenster auf Netlify Drop.
5.  Fertig! Ihre Seite ist online.

## Option 2: Über die Kommandozeile (CLI)

Falls Sie lieber das Terminal nutzen:

1.  Öffnen Sie ein Terminal (PowerShell oder CMD) im Ordner `z:\teszt\we-close`.
2.  Geben Sie folgenden Befehl ein:
    ```bash
    netlify login
    ```
    (Dies öffnet den Browser zur Anmeldung).
3.  Nach erfolgreicher Anmeldung, führen Sie das Deployment aus:
    ```bash
    netlify deploy --prod --dir=dist
    ```
4.  Folgen Sie den Anweisungen im Terminal.

---
**Status des Builds:**
Der Build wurde erfolgreich erstellt. Der Ordner `dist` enthält die fertige Webseite.
