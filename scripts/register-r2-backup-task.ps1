[CmdletBinding()]
param(
  [string]$TaskName = 'AIRDOX-R2-DailyBackup',
  [string]$RunAt = '02:00',
  [string]$BucketName = $env:R2_BACKUP_BUCKET,
  [string]$ObjectPrefix = "backups/$env:COMPUTERNAME/webseeite-main",
  [switch]$IncludeEnvFiles,
  [switch]$StartImmediately
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Write-Step {
  param([string]$Message)
  Write-Host "[task-setup] $Message" -ForegroundColor Cyan
}

if (-not (Get-Command Register-ScheduledTask -ErrorAction SilentlyContinue)) {
  throw "ScheduledTasks module is not available on this system."
}

if (-not $BucketName) {
  if ($env:R2_BUCKET_NAME) {
    $BucketName = $env:R2_BUCKET_NAME
  } else {
    throw "Bucket missing. Use -BucketName or set env:R2_BACKUP_BUCKET (or env:R2_BUCKET_NAME)."
  }
}

try {
  $timeOfDay = [DateTime]::ParseExact($RunAt, 'HH:mm', [System.Globalization.CultureInfo]::InvariantCulture)
} catch {
  throw "Invalid -RunAt value '$RunAt'. Use 24h format HH:mm (example: 02:00)."
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backupScript = Join-Path $PSScriptRoot 'backup-r2.ps1'

if (-not (Test-Path -LiteralPath $backupScript)) {
  throw "Backup script not found: $backupScript"
}

$psExe = (Get-Command powershell.exe -ErrorAction SilentlyContinue).Source
if (-not $psExe) {
  throw "powershell.exe not found."
}

$argumentParts = @(
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-File', "`"$backupScript`"",
  '-BucketName', "`"$BucketName`"",
  '-ObjectPrefix', "`"$ObjectPrefix`""
)

if ($IncludeEnvFiles) {
  $argumentParts += '-IncludeEnvFiles'
}

$argumentLine = $argumentParts -join ' '

$action = New-ScheduledTaskAction -Execute $psExe -Argument $argumentLine -WorkingDirectory $repoRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $timeOfDay
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew

Write-Step "Registering task '$TaskName' (daily $RunAt)"
Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description 'Daily website backup to private Cloudflare R2 bucket' `
  -Force | Out-Null

if ($StartImmediately) {
  Write-Step "Starting task '$TaskName' once for a test run"
  Start-ScheduledTask -TaskName $TaskName
}

Write-Step "Task registration completed."
Write-Host "Task: $TaskName"
