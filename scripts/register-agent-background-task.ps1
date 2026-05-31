param(
  [string]$TaskName = "AIRDOX Agent Background Cycle",
  [string]$Mode = "deep",
  [int]$Hours = 6
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$scriptName = if ($Mode -eq "standard") { "agents:background" } else { "agents:background:deep" }
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue)

if (-not $npm) {
  throw "npm.cmd was not found in PATH. Install Node.js or run from a shell where npm is available."
}

$action = New-ScheduledTaskAction `
  -Execute $npm.Source `
  -Argument "run $scriptName" `
  -WorkingDirectory $repoRoot.Path

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) `
  -RepetitionInterval (New-TimeSpan -Hours $Hours) `
  -RepetitionDuration (New-TimeSpan -Days 3650)

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Runs npm run $scriptName in $($repoRoot.Path) every $Hours hours and writes AIRDOX agent reports." `
  -Force | Out-Null

Write-Host "Registered scheduled task '$TaskName'"
Write-Host "Command: npm run $scriptName"
Write-Host "Working directory: $($repoRoot.Path)"
Write-Host "Interval: every $Hours hours"
