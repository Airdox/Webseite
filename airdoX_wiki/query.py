from core import AirdoxWikiCore
from llm_interface import AirdoxLLM

class AirdoxQuery:
    def __init__(self, core: AirdoxWikiCore, llm: AirdoxLLM):
        self.core = core
        self.llm = llm

    def answer_question(self, question: str) -> str:
        # 1. Index lesen
        with open(self.core.index_md, 'r', encoding='utf-8') as f:
            index_content = f.read()
            
        # 2. LLM fragen, welche Seiten relevant sind
        navigation_advice = self.llm.navigate_wiki(question, index_content)
        
        # 3. Relevante Seiten laden (vereinfacht: wir nehmen die vom LLM genannten Links)
        import re
        relevant_titles = re.findall(r'\[\[(.*?)\]\]', navigation_advice)
        
        context = ""
        for title in relevant_titles:
            page_content = self.core.get_wiki_page(title)
            if page_content:
                context += f"--- Seite: {title} ---\n{page_content}\n\n"
        
        # 4. Finale Antwort generieren
        system_prompt = "Du bist der AIRDOX Wiki Agent. Beantworte die Frage basierend auf dem bereitgestellten Wiki-Kontext."
        user_prompt = f"Frage: {question}\n\nKontext:\n{context if context else 'Kein spezifischer Kontext gefunden.'}"
        
        return self.llm.ask(system_prompt, user_prompt)

if __name__ == "__main__":
    core = AirdoxWikiCore("/home/ubuntu/AirdoxWebseite/airdoX_wiki")
    llm = AirdoxLLM()
    query_engine = AirdoxQuery(core, llm)
    print(query_engine.answer_question("Was ist Quantenmechanik?"))
