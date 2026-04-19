import os
from core import AirdoxWikiCore
from typing import List, Dict

class AirdoxLinting:
    def __init__(self, core: AirdoxWikiCore):
        self.core = core

    def run_full_scan(self) -> Dict[str, List[str]]:
        results = {
            "orphans": self.core.find_orphans(),
            "missing_pages": self.find_missing_pages(),
            "potential_contradictions": [], # Erfordert LLM
            "outdated_info": [] # Erfordert LLM/Metadaten
        }
        return results

    def find_missing_pages(self) -> List[str]:
        all_pages = [f[:-3] for f in os.listdir(self.core.wiki_path) if f.endswith('.md') and f not in ['index.md', 'log.md']]
        missing = set()
        
        for page in all_pages:
            content = self.core.get_wiki_page(page)
            if content:
                links = self.core.extract_links(content)
                for link in links:
                    if link not in all_pages and link not in ['index', 'log']:
                        missing.add(link)
        
        return list(missing)

    def report_linting_results(self):
        results = self.run_full_scan()
        report = "\n\n### Knowledge Linting Report\n"
        
        if results["orphans"]:
            report += f"* **Waisenseiten gefunden**: {', '.join(['[['+p+']]' for p in results['orphans']])}\n"
        
        if results["missing_pages"]:
            report += f"* **Fehlende Seiten (Lücken)**: {', '.join(['[['+p+']]' for p in results['missing_pages']])}\n"
            
        if not results["orphans"] and not results["missing_pages"]:
            report += "* Keine strukturellen Probleme gefunden.\n"
            
        self.core.log_change(report)
        print("Linting abgeschlossen. Ergebnisse im Log protokolliert.")

if __name__ == "__main__":
    core = AirdoxWikiCore("/home/ubuntu/AirdoxWebseite/airdoX_wiki")
    linting = AirdoxLinting(core)
    linting.report_linting_results()
