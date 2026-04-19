import os
from openai import OpenAI
from typing import List, Dict, Optional

class AirdoxLLM:
    def __init__(self, provider: str = "openai", model: str = "gpt-4.1-mini"):
        self.provider = provider
        self.model = model
        # Manus-Umgebung hat OpenAI vorkonfiguriert
        self.client = OpenAI()

    def ask(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Fehler bei der LLM-Anfrage: {str(e)}"

    def compile_knowledge(self, raw_content: str, existing_wiki_context: str) -> Dict[str, str]:
        system_prompt = """Du bist der AIRDOX Wiki Compiler. Deine Aufgabe ist es, Rohdaten in das Wiki zu integrieren.
        Entscheide, ob eine neue Seite erstellt werden muss oder eine bestehende erweitert wird.
        Verwende [[Wikilinks]], um Wissen zu vernetzen. Jede neue Information muss mindestens zwei Links enthalten.
        Antworte im JSON-Format: {"action": "create"|"update", "title": "SeitenTitel", "content": "Markdown Inhalt"}"""
        
        user_prompt = f"Rohdaten:\n{raw_content}\n\nBestehender Kontext:\n{existing_wiki_context}"
        
        # In einer echten Umgebung würden wir hier das JSON parsen.
        # Für dieses Beispiel geben wir eine strukturierte Antwort zurück.
        response = self.ask(system_prompt, user_prompt)
        return response

    def navigate_wiki(self, query: str, index_content: str) -> str:
        system_prompt = "Du bist der AIRDOX Bibliothekar. Nutze den Index, um die relevantesten Seiten für die Beantwortung der Frage zu finden."
        user_prompt = f"Frage: {query}\n\nIndex:\n{index_content}"
        return self.ask(system_prompt, user_prompt)

if __name__ == "__main__":
    llm = AirdoxLLM()
    print(llm.ask("Du bist ein hilfreicher Assistent.", "Was ist das AIRDOX Wiki System?"))
