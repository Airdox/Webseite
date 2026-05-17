@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0restore-codex-approval-button.ps1"
pause
