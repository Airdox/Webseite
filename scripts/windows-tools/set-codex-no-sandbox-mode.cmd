@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0set-codex-no-sandbox-mode.ps1"
pause
