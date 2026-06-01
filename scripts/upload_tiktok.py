import os
import sys
import requests
from tiktok_uploader.upload import TikTokUploader

def download_video(url, output_path):
    """
    Lädt ein Video von einer URL herunter.
    """
    try:
        print(f"Lade Video herunter von: {url}")
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Download abgeschlossen: {output_path}")
        return True
    except Exception as e:
        print(f"Fehler beim Download: {str(e)}")
        return False

def upload_video_to_tiktok(video_path, description, cookies_file, headless=True):
    """
    Lädt ein Video auf TikTok hoch.
    """
    try:
        print(f"Starte Upload-Prozess für: {video_path}")
        print(f"Beschreibung: {description}")
        
        # Initialisiere den Uploader (Chrome wird benötigt)
        uploader = TikTokUploader(cookies=cookies_file, headless=headless, browser='chrome')
        
        videos_to_upload = [
            {
                'video': video_path,
                'description': description,
                'comment': True,
                'stitch': True,
                'duet': True
            }
        ]
        
        failed_videos = uploader.upload_videos(videos=videos_to_upload)
        
        if failed_videos:
            print("Fehler: Das Video konnte nicht hochgeladen werden.")
            return False
        else:
            print("Erfolg: Video wurde erfolgreich hochgeladen.")
            return True

    except Exception as e:
        print(f"Ein unerwarteter Fehler ist aufgetreten: {str(e)}")
        return False

def get_input(prompt, default=None):
    """
    Hilfsfunktion für Benutzereingaben (lokal interaktiv, in CI Standardwert).
    """
    if os.getenv("GITHUB_ACTIONS"):
        return default
    try:
        user_input = input(f"{prompt} [{default}]: ").strip()
        return user_input if user_input else default
    except EOFError:
        return default

if __name__ == "__main__":
    # In GitHub Actions werden diese Variablen über env gesetzt
    is_ci = os.getenv("GITHUB_ACTIONS")
    
    video_url = os.getenv("VIDEO_URL")
    video_path = os.getenv("VIDEO_FILE")
    description = os.getenv("VIDEO_DESCRIPTION")
    cookies_file = os.getenv("COOKIES_FILE", "cookies.txt")

    # Falls lokal und keine env-Variablen: Interaktive Abfrage
    if not is_ci:
        print("--- TikTok Upload (Lokal Modus) ---")
        if not video_url and not video_path:
            choice = input("Möchten Sie eine (U)RL angeben oder einen lokalen (P)fad? [P]: ").strip().upper()
            if choice == 'U':
                video_url = input("Geben Sie die Video-URL ein: ").strip()
            else:
                video_path = input("Geben Sie den Pfad zur Videodatei ein: ").strip()
        
        if not description:
            description = get_input("Geben Sie die Video-Beschreibung ein", "Mein automatisierter Upload #tiktok")
        
        if not os.path.exists(cookies_file):
            cookies_file = get_input("Pfad zur Cookies-Datei", "cookies.txt")

    # Fallback für CI Standardwerte
    video_path = video_path or "public/video.mp4"
    description = description or "Automated Upload #tiktok"

    # 1. Download falls URL vorhanden
    if video_url:
        temp_path = "temp_download.mp4"
        if download_video(video_url, temp_path):
            video_path = temp_path
        else:
            sys.exit(1)
    
    # 2. Validierung
    if not os.path.exists(video_path):
        print(f"Fehler: Videodatei nicht gefunden: {video_path}")
        if is_ci:
            print(f"Arbeitsverzeichnis: {os.getcwd()}")
            print(f"Inhalt: {os.listdir('.')}")
        sys.exit(1)

    if not os.path.exists(cookies_file):
        print(f"Fehler: Cookies-Datei nicht gefunden: {cookies_file}")
        sys.exit(1)

    # 3. Upload
    # In CI nutzen wir headless=True, lokal können wir den Browser sehen (headless=False)
    success = upload_video_to_tiktok(video_path, description, cookies_file, headless=bool(is_ci))
    
    # 4. Aufräumen
    if video_url and os.path.exists(video_path) and video_path == "temp_download.mp4":
        os.remove(video_path)
        print("Temporäre Videodatei gelöscht.")

    if not success:
        sys.exit(1)
