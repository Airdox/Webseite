import os
from core import AirdoxWikiCore
from typing import Optional

class AirdoxIngest:
    def __init__(self, core: AirdoxWikiCore):
        self.core = core

    def process_raw_file(self, filename: str):
        raw_file_path = os.path.join(self.core.raw_path, filename)
        if not os.path.exists(raw_file_path):
            print(f"Datei {filename} nicht gefunden.")
            return

        with open(raw_file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Hier würde normalerweise das LLM entscheiden:
        # 1. Was ist das Hauptthema? (Titel)
        # 2. Gibt es die Seite schon?
        # 3. Smart-Merge oder neue Seite?
        
        # Simulierter Prozess für die Entwicklung:
        title = filename.split('.')[0]
        existing_content = self.core.get_wiki_page(title)
        
        if existing_content:
            print(f"Aktualisiere bestehende Seite: [[{title}]]")
            merged_content = self.core.smart_merge(existing_content, content)
            self.core.save_wiki_page(title, merged_content)
            self.core.log_change(f"Seite [[{title}]] via Ingest aktualisiert.")
        else:
            print(f"Erstelle neue Seite: [[{title}]]")
            # Sicherstellen, dass mindestens zwei Links vorhanden sind (Simuliert)
            header = f"# {title}\n\n"
            links = "\n\n---\n\n**Verknüpfungen**: [[index]], [[log]]"
            self.core.save_wiki_page(title, header + content + links)
            self.core.log_change(f"Neue Seite [[{title}]] via Ingest erstellt.")

if __name__ == "__main__":
    core = AirdoxWikiCore("/home/ubuntu/AirdoxWebseite/airdoX_wiki")
    ingest = AirdoxIngest(core)
    
    # Test-Datei erstellen
    test_file = "Quantenmechanik.txt"
    with open(os.path.join(core.raw_path, test_file), 'w', encoding='utf-8') as f:
        f.write("Quantenmechanik ist ein Teilgebiet der Physik...")
    
    ingest.process_raw_file(test_file)
