# AIRDOX TikTok GUI Builder Script
# Baut scripts/tiktok_gui.py in eine standalone release/TikTok-Uploader.exe

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  AIRDOX TIKTOK GUI BUILDER" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$WorkspaceDir = "d:\webseeite-main"
$ScriptPath = Join-Path $WorkspaceDir "scripts\tiktok_gui.py"
$ReleaseDir = Join-Path $WorkspaceDir "release"

# 1. Sicherstellen, dass PyInstaller und customtkinter installiert sind
Write-Host "[1/4] Prüfe Abhängigkeiten..." -ForegroundColor Yellow
python -c "import PyInstaller" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "PyInstaller wird installiert..." -ForegroundColor Yellow
    pip install pyinstaller
}

python -c "import customtkinter" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "customtkinter wird installiert..." -ForegroundColor Yellow
    pip install customtkinter
}

# 2. Sicherstellen, dass das release/ Verzeichnis existiert
if (-not (Test-Path $ReleaseDir)) {
    New-Item -ItemType Directory -Path $ReleaseDir | Out-Null
    Write-Host "Verzeichnis erstellt: $ReleaseDir" -ForegroundColor Gray
}

# 3. Kompiliere mit PyInstaller
Write-Host "[2/4] Kompiliere mit PyInstaller..." -ForegroundColor Yellow
cd $WorkspaceDir

# Führe PyInstaller aus
# --noconsole: Blendet die CMD-Konsole aus (reine Windows GUI)
# --onefile: Bündelt alles in eine einzelne .exe
# --clean: Bereinigt PyInstaller-Caches vor dem Build
# --distpath: Zielordner
pyinstaller --clean --noconsole --onefile --distpath "$ReleaseDir" --name "TikTok-Uploader" "$ScriptPath"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[3/4] Bereinige temporäre Build-Dateien..." -ForegroundColor Yellow
    # Entferne die temporären Verzeichnisse (build/ und .spec)
    if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
    if (Test-Path "TikTok-Uploader.spec") { Remove-Item -Force "TikTok-Uploader.spec" }

    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "[ERFOLG] TikTok-Uploader.exe wurde erfolgreich gebaut!" -ForegroundColor Green
    Write-Host "Ort: $ReleaseDir\TikTok-Uploader.exe" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
} else {
    Write-Host "[FEHLER] Kompilierung ist fehlgeschlagen." -ForegroundColor Red
    exit 1
}
