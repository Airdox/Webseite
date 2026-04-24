import os
import re
import json
from datetime import datetime
from typing import List, Dict, Optional

class AirdoxWikiCore:
    def __init__(self, base_path: str):
        self.base_path = base_path
        self.raw_path = os.path.join(base_path, 'raw')
        self.wiki_path = os.path.join(base_path, 'wiki')
        self.system_md = os.path.join(base_path, 'SYSTEM.md')
        self.index_md = os.path.join(self.wiki_path, 'index.md')
        self.log_md = os.path.join(self.wiki_path, 'log.md')
        
        self._ensure_dirs()

    def _ensure_dirs(self):
        os.makedirs(self.raw_path, exist_ok=True)
        os.makedirs(self.wiki_path, exist_ok=True)

    def log_change(self, message: str):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"\n* [{timestamp}] {message}"
        with open(self.log_md, 'a', encoding='utf-8') as f:
            f.write(log_entry)

    def update_index(self):
        files = [f for f in os.listdir(self.wiki_path) if f.endswith('.md') and f not in ['index.md', 'log.md']]
        files.sort()
        
        with open(self.index_md, 'w', encoding='utf-8') as f:
            f.write("# Index des AIRDOX Wiki\n\n")
            f.write("Dies ist das automatisch gepflegte Inhaltsverzeichnis aller Konzepte und Seiten im AIRDOX Wiki.\n\n---\n\n")
            f.write(f"**Zuletzt aktualisiert**: {datetime.now().strftime('%d. %B %Y')}\n\n")
            for file in files:
                title = file[:-3]
                f.write(f"* [[{title}]]\n")

    def get_wiki_page(self, title: str) -> Optional[str]:
        file_path = os.path.join(self.wiki_path, f"{title}.md")
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        return None

    def save_wiki_page(self, title: str, content: str):
        file_path = os.path.join(self.wiki_path, f"{title}.md")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        self.update_index()

    def extract_links(self, content: str) -> List[str]:
        return re.findall(r'\[\[(.*?)\]\]', content)

    def find_orphans(self) -> List[str]:
        all_pages = [f[:-3] for f in os.listdir(self.wiki_path) if f.endswith('.md') and f not in ['index.md', 'log.md']]
        linked_pages = set()
        
        for page in all_pages:
            content = self.get_wiki_page(page)
            if content:
                links = self.extract_links(content)
                for link in links:
                    linked_pages.add(link)
        
        orphans = [page for page in all_pages if page not in linked_pages]
        return orphans

    def smart_merge(self, existing_content: str, new_info: str) -> str:
        # Dies ist ein Platzhalter für die LLM-basierte Smart-Merge-Logik.
        # In der finalen Version wird hier das LLM aufgerufen.
        # Für den Moment hängen wir die neue Info einfach an.
        separator = "\n\n---\n\n### Neue Erkenntnisse (Smart-Merge)\n\n"
        return existing_content + separator + new_info

if __name__ == "__main__":
    # Test der Basisfunktionalität
    core = AirdoxWikiCore("/home/ubuntu/AirdoxWebseite/airdoX_wiki")
    core.log_change("Core-System initialisiert.")
    core.update_index()
    print("Index aktualisiert.")
