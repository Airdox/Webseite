$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms

$packageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$zipPath = Join-Path $packageRoot 'app.zip'
$installRoot = Join-Path $env:LOCALAPPDATA 'Programs\AIRDOX Flight Deck'
$exePath = Join-Path $installRoot 'AIRDOX Flight Deck.exe'
$desktopShortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) 'AIRDOX Flight Deck.lnk'
$startMenuDir = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\AIRDOX'
$startMenuShortcut = Join-Path $startMenuDir 'AIRDOX Flight Deck.lnk'

if (-not (Test-Path $zipPath)) {
  throw "Installer package missing: $zipPath"
}

if (Test-Path $installRoot) {
  Remove-Item $installRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
Expand-Archive -LiteralPath $zipPath -DestinationPath $installRoot -Force

if (-not (Test-Path $exePath)) {
  throw "Installed executable missing: $exePath"
}

New-Item -ItemType Directory -Path $startMenuDir -Force | Out-Null

$shell = New-Object -ComObject WScript.Shell

$desktop = $shell.CreateShortcut($desktopShortcut)
$desktop.TargetPath = $exePath
$desktop.WorkingDirectory = $installRoot
$desktop.IconLocation = $exePath
$desktop.Save()

$startMenu = $shell.CreateShortcut($startMenuShortcut)
$startMenu.TargetPath = $exePath
$startMenu.WorkingDirectory = $installRoot
$startMenu.IconLocation = $exePath
$startMenu.Save()

[System.Windows.Forms.MessageBox]::Show(
  "AIRDOX Flight Deck wurde installiert.`n`nPfad:`n$installRoot",
  'Installation abgeschlossen',
  [System.Windows.Forms.MessageBoxButtons]::OK,
  [System.Windows.Forms.MessageBoxIcon]::Information
) | Out-Null
