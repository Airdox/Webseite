$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$releaseDir = Join-Path $repoRoot 'release'
$sourceDir = Join-Path $releaseDir 'win-unpacked'
$stagingDir = Join-Path $repoRoot 'scratch\iexpress-win-installer'
$zipPath = Join-Path $stagingDir 'app.zip'
$installScriptSource = Join-Path $PSScriptRoot 'install-win-tool.ps1'
$installScriptTarget = Join-Path $stagingDir 'install-win-tool.ps1'
$sedPath = Join-Path $stagingDir 'installer.sed'
$outputExe = Join-Path $releaseDir 'AIRDOX-Flight-Deck-Installer-0.1.2.exe'
$iexpress = Join-Path $env:SystemRoot 'System32\iexpress.exe'

if (-not (Test-Path $sourceDir)) {
  throw "Missing source directory: $sourceDir"
}

if (-not (Test-Path $iexpress)) {
  throw "iexpress.exe not found: $iexpress"
}

if (Test-Path $stagingDir) {
  Remove-Item $stagingDir -Recurse -Force
}

New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

Compress-Archive -Path (Join-Path $sourceDir '*') -DestinationPath $zipPath -CompressionLevel Optimal -Force
Copy-Item $installScriptSource $installScriptTarget -Force

$escapedOutput = $outputExe.Replace('\', '\\')
$escapedScript = 'install-win-tool.ps1'
$escapedZip = 'app.zip'

$sed = @"
[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=0
HideExtractAnimation=0
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=
DisplayLicense=
FinishMessage=
TargetName=$outputExe
FriendlyName=AIRDOX Flight Deck Installer
AppLaunched=powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$escapedScript"
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
SourceFiles=SourceFiles
[SourceFiles]
SourceFiles0=$stagingDir
[SourceFiles0]
%FILE0%=$escapedScript
%FILE1%=$escapedZip
[Strings]
FILE0=$escapedScript
FILE1=$escapedZip
"@

Set-Content -Path $sedPath -Value $sed -Encoding ASCII

Start-Process -FilePath $iexpress -ArgumentList "/N", $sedPath -Wait -NoNewWindow

if (-not (Test-Path $outputExe)) {
  throw "Installer was not created: $outputExe"
}

Get-Item $outputExe | Select-Object FullName, Length, LastWriteTime
