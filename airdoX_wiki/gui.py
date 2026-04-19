import os
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.button import Button
from kivy.uix.scrollview import ScrollView
from kivy.clock import Clock
from core import AirdoxWikiCore
from ingest import AirdoxIngest
from query import AirdoxQuery
from llm_interface import AirdoxLLM

class AirdoxWikiGUI(BoxLayout):
    def __init__(self, **kwargs):
        super().__init__(orientation='vertical', padding=10, spacing=10, **kwargs)
        
        self.core = AirdoxWikiCore("/home/ubuntu/AirdoxWebseite/airdoX_wiki")
        self.llm = AirdoxLLM()
        self.ingest = AirdoxIngest(self.core)
        self.query_engine = AirdoxQuery(self.core, self.llm)
        
        # Header
        self.add_widget(Label(text="AIRDOX Wiki System", font_size=24, size_hint_y=None, height=50))
        
        # Status/Log Display
        self.log_display = TextInput(readonly=True, multiline=True, text="System bereit...\n")
        self.add_widget(self.log_display)
        
        # Input Area
        input_layout = BoxLayout(orientation='horizontal', size_hint_y=None, height=50, spacing=10)
        self.query_input = TextInput(hint_text="Frage das Wiki...", multiline=False)
        submit_btn = Button(text="Fragen", size_hint_x=None, width=100)
        submit_btn.bind(on_press=self.handle_query)
        input_layout.add_widget(self.query_input)
        input_layout.add_widget(submit_btn)
        self.add_widget(input_layout)
        
        # Action Buttons
        btn_layout = BoxLayout(orientation='horizontal', size_hint_y=None, height=50, spacing=10)
        ingest_btn = Button(text="Raw Ingest")
        ingest_btn.bind(on_press=self.handle_ingest)
        lint_btn = Button(text="Run Linting")
        lint_btn.bind(on_press=self.handle_linting)
        btn_layout.add_widget(ingest_btn)
        btn_layout.add_widget(lint_btn)
        self.add_widget(btn_layout)

    def log(self, message):
        self.log_display.text += f"> {message}\n"
        self.log_display.cursor = (0, len(self.log_display.text))

    def handle_query(self, instance):
        query = self.query_input.text
        if query:
            self.log(f"Anfrage: {query}")
            # In einer echten App würde dies in einem Thread laufen
            answer = self.query_engine.answer_question(query)
            self.log(f"Antwort: {answer}")
            self.query_input.text = ""

    def handle_ingest(self, instance):
        self.log("Starte Ingest-Prozess...")
        # Simulierter Ingest für die Demo
        files = [f for f in os.listdir(self.core.raw_path) if f.endswith('.txt')]
        if not files:
            self.log("Keine neuen Dateien in /raw gefunden.")
        for f in files:
            self.log(f"Verarbeite {f}...")
            self.ingest.process_raw_file(f)
            self.log(f"[[{f.split('.')[0]}]] eingewebt.")

    def handle_linting(self, instance):
        self.log("Führe Knowledge Linting aus...")
        from linting import AirdoxLinting
        linter = AirdoxLinting(self.core)
        results = linter.run_full_scan()
        self.log(f"Linting abgeschlossen: {len(results['orphans'])} Waisen, {len(results['missing_pages'])} Lücken.")

class AirdoxWikiApp(App):
    def build(self):
        return AirdoxWikiGUI()

if __name__ == "__main__":
    # Hinweis: Kivy benötigt ein Display. In dieser Umgebung führen wir es nicht direkt aus,
    # sondern stellen den Code bereit.
    print("Kivy GUI Code bereit.")
