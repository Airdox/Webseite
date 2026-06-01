import os
import sys
import threading
import tkinter as tk
from tkinter import filedialog
import customtkinter as ctk

# Ensure scripts directory is in path for imports
scripts_dir = os.path.dirname(os.path.abspath(__file__))
if scripts_dir not in sys.path:
    sys.path.append(scripts_dir)

from upload_tiktok import upload_video_to_tiktok

# Theme & Appearance
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class CustomTextRedirector:
    def __init__(self, text_widget):
        self.text_widget = text_widget

    def write(self, string):
        self.text_widget.configure(state="normal")
        self.text_widget.insert("end", string)
        self.text_widget.see("end")
        self.text_widget.configure(state="disabled")

    def flush(self):
        pass

class TikTokUploaderApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window Config
        self.title("AIRDOX - TikTok Video Uploader")
        self.geometry("700x650")
        self.resizable(False, False)

        # Main Layout Grid
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(0, weight=0) # Header
        self.grid_rowconfigure(1, weight=0) # Form
        self.grid_rowconfigure(2, weight=1) # Log area

        # 1. Header Frame
        self.header_frame = ctk.CTkFrame(self, corner_radius=0, fg_color="transparent")
        self.header_frame.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="ew")
        
        self.title_label = ctk.CTkLabel(
            self.header_frame, 
            text="AIRDOX TIKTOK PUBLISHER", 
            font=ctk.CTkFont(size=24, weight="bold")
        )
        self.title_label.pack(anchor="w")

        self.subtitle_label = ctk.CTkLabel(
            self.header_frame, 
            text="Automatisierter Video-Upload über Browser-Session", 
            font=ctk.CTkFont(size=13),
            text_color="gray"
        )
        self.subtitle_label.pack(anchor="w", pady=(2, 0))

        # 2. Form Frame
        self.form_frame = ctk.CTkFrame(self, corner_radius=10)
        self.form_frame.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")
        self.form_frame.grid_columnconfigure(0, weight=0)
        self.form_frame.grid_columnconfigure(1, weight=1)
        self.form_frame.grid_columnconfigure(2, weight=0)

        # Video File Row
        self.video_label = ctk.CTkLabel(self.form_frame, text="Video-Datei:", font=ctk.CTkFont(weight="bold"))
        self.video_label.grid(row=0, column=0, padx=15, pady=(15, 10), sticky="w")
        self.video_entry = ctk.CTkEntry(self.form_frame, placeholder_text="Pfad zu Ihrer Videodatei (.mp4)")
        self.video_entry.grid(row=0, column=1, padx=(0, 10), pady=(15, 10), sticky="ew")
        self.video_btn = ctk.CTkButton(self.form_frame, text="Suchen...", width=90, command=self.select_video)
        self.video_btn.grid(row=0, column=2, padx=(0, 15), pady=(15, 10))

        # Cookies Row
        self.cookies_label = ctk.CTkLabel(self.form_frame, text="Cookies-Datei:", font=ctk.CTkFont(weight="bold"))
        self.cookies_label.grid(row=1, column=0, padx=15, pady=10, sticky="w")
        
        default_cookies = "cookies.txt"
        if not os.path.exists(default_cookies) and os.path.exists(os.path.join(scripts_dir, "cookies.txt")):
            default_cookies = os.path.join(scripts_dir, "cookies.txt")
            
        self.cookies_entry = ctk.CTkEntry(self.form_frame, placeholder_text="cookies.txt")
        self.cookies_entry.insert(0, default_cookies)
        self.cookies_entry.grid(row=1, column=1, padx=(0, 10), pady=10, sticky="ew")
        self.cookies_btn = ctk.CTkButton(self.form_frame, text="Suchen...", width=90, command=self.select_cookies)
        self.cookies_btn.grid(row=1, column=2, padx=(0, 15), pady=10)

        # Description Row
        self.desc_label = ctk.CTkLabel(self.form_frame, text="Beschreibung:", font=ctk.CTkFont(weight="bold"))
        self.desc_label.grid(row=2, column=0, padx=15, pady=10, sticky="w")
        self.desc_entry = ctk.CTkEntry(
            self.form_frame, 
            placeholder_text="Geben Sie eine Beschreibung inkl. Hashtags ein..."
        )
        self.desc_entry.insert(0, "Mein automatisierter Upload #tiktok #airdox")
        self.desc_entry.grid(row=2, column=1, columnspan=2, padx=(0, 15), pady=10, sticky="ew")

        # Headless Checkbox
        self.headless_var = tk.BooleanVar(value=True)
        self.headless_check = ctk.CTkCheckBox(
            self.form_frame, 
            text="Browser unsichtbar im Hintergrund ausführen (Headless)", 
            variable=self.headless_var
        )
        self.headless_check.grid(row=3, column=1, columnspan=2, padx=(0, 15), pady=(5, 10), sticky="w")

        # Progress Row (Progress Bar & Status Label)
        self.status_label = ctk.CTkLabel(self.form_frame, text="Status: Bereit", font=ctk.CTkFont(size=12, weight="bold"))
        self.status_label.grid(row=4, column=0, padx=15, pady=(10, 15), sticky="w")
        
        self.progress_bar = ctk.CTkProgressBar(self.form_frame, fg_color="#2c3e50", progress_color="#3498db")
        self.progress_bar.set(0.0)
        self.progress_bar.grid(row=4, column=1, padx=(0, 10), pady=(10, 15), sticky="ew")

        # Action Buttons
        self.upload_btn = ctk.CTkButton(
            self.form_frame, 
            text="Upload starten", 
            fg_color="#2ecc71", 
            hover_color="#27ae60",
            font=ctk.CTkFont(size=14, weight="bold"),
            command=self.start_upload_thread
        )
        self.upload_btn.grid(row=4, column=2, padx=(0, 15), pady=(10, 15), sticky="e")

        # 3. Log/Terminal Output Frame
        self.log_frame = ctk.CTkFrame(self, corner_radius=10)
        self.log_frame.grid(row=2, column=0, padx=20, pady=(10, 20), sticky="nsew")
        self.log_frame.grid_columnconfigure(0, weight=1)
        self.log_frame.grid_rowconfigure(1, weight=1)

        self.log_label = ctk.CTkLabel(self.log_frame, text="Upload-Prozess Protokoll:", font=ctk.CTkFont(weight="bold"))
        self.log_label.grid(row=0, column=0, padx=15, pady=(10, 5), sticky="w")

        self.log_textbox = ctk.CTkTextbox(
            self.log_frame, 
            state="disabled", 
            font=ctk.CTkFont(family="Courier", size=12),
            fg_color="#1e1e1e",
            text_color="#39ff14" # Matrix green text style
        )
        self.log_textbox.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="nsew")

        # Redirect standard stdout & stderr
        self.redirector = CustomTextRedirector(self.log_textbox)
        sys.stdout = self.redirector
        sys.stderr = self.redirector

    def select_video(self):
        file_path = filedialog.askopenfilename(
            title="Video-Datei auswählen",
            filetypes=[("Video-Dateien", "*.mp4 *.mov *.avi *.mkv"), ("Alle Dateien", "*.*")]
        )
        if file_path:
            self.video_entry.delete(0, "end")
            self.video_entry.insert(0, file_path)

    def select_cookies(self):
        file_path = filedialog.askopenfilename(
            title="Cookies-Datei auswählen",
            filetypes=[("Text-Dateien", "*.txt"), ("Alle Dateien", "*.*")]
        )
        if file_path:
            self.cookies_entry.delete(0, "end")
            self.cookies_entry.insert(0, file_path)

    def update_progress(self, progress, status_text):
        def _update():
            self.progress_bar.set(progress)
            self.status_label.configure(text=f"Status: {status_text}")
        self.after(0, _update)

    def start_upload_thread(self):
        # Validate inputs
        video = self.video_entry.get().strip()
        cookies = self.cookies_entry.get().strip()
        description = self.desc_entry.get().strip()
        headless = self.headless_var.get()

        if not video:
            print("Fehler: Bitte wählen Sie eine Video-Datei aus.")
            return

        if not cookies:
            print("Fehler: Bitte wählen Sie eine Cookies-Datei aus.")
            return

        if not os.path.exists(video):
            print(f"Fehler: Die Video-Datei wurde nicht gefunden: {video}")
            return

        if not os.path.exists(cookies):
            print(f"Fehler: Die Cookies-Datei wurde nicht gefunden: {cookies}")
            return

        # Disable buttons during upload
        self.upload_btn.configure(state="disabled", text="Lädt hoch...")
        self.video_btn.configure(state="disabled")
        self.cookies_btn.configure(state="disabled")
        self.progress_bar.set(0.0)
        self.status_label.configure(text="Status: Bereite vor...")

        # Run background thread
        upload_thread = threading.Thread(
            target=self.run_upload,
            args=(video, description, cookies, headless),
            daemon=True
        )
        upload_thread.start()

    def run_upload(self, video, description, cookies, headless):
        try:
            def progress_cb(pct, msg):
                self.update_progress(pct, msg)

            success = upload_video_to_tiktok(
                video_path=video,
                description=description,
                cookies_file=cookies,
                headless=headless,
                progress_callback=progress_cb
            )
            if success:
                print("\n[ERFOLG] Das Video wurde erfolgreich auf TikTok veröffentlicht!")
                self.update_progress(1.0, "Erfolgreich hochgeladen!")
            else:
                print("\n[FEHLER] Der Upload ist fehlgeschlagen. Bitte überprüfen Sie das Protokoll.")
                self.update_progress(1.0, "Fehler beim Upload.")
        except Exception as e:
            print(f"\n[FEHLER] Ein unerwarteter Ausnahmefehler ist aufgetreten: {str(e)}")
            self.update_progress(1.0, "Fehler aufgetreten.")
        finally:
            # Re-enable buttons on main thread
            self.after(0, self.reset_buttons)

    def reset_buttons(self):
        self.upload_btn.configure(state="normal", text="Upload starten")
        self.video_btn.configure(state="normal")
        self.cookies_btn.configure(state="normal")

if __name__ == "__main__":
    app = TikTokUploaderApp()
    app.mainloop()
