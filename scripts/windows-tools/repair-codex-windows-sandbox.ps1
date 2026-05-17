param(
    [string]$Workspace = "D:\webseeite-main"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $Workspace)) {
    throw "Workspace not found: $Workspace"
}

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    throw "This repair must run as Administrator. Use repair-codex-windows-sandbox.cmd so it can request elevation."
}

$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$sandboxUsers = @("CodexSandboxOffline", "CodexSandboxOnline")

Write-Host "Repairing ownership for $Workspace ..."
& takeown /F $Workspace /R /D Y | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Failed to take ownership of $Workspace"
}

Write-Host "Enabling inherited permissions ..."
& icacls $Workspace /inheritance:e /T /C | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Failed to enable inherited permissions for $Workspace"
}

Write-Host "Granting workspace access for $currentUser ..."
& icacls $Workspace /grant "${currentUser}:(OI)(CI)(M)" /T /C | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Failed to grant workspace access for $currentUser"
}

foreach ($user in $sandboxUsers) {
    Write-Host "Granting workspace access for $user ..."
    & icacls $Workspace /grant "${user}:(OI)(CI)(M)" /T /C | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to grant workspace access for $user"
    }
}

Write-Host "Clearing read-only attributes ..."
& attrib -R "$Workspace\*" /S /D

$configDir = Join-Path $env:USERPROFILE ".codex"
$configPath = Join-Path $configDir "config.toml"

New-Item -ItemType Directory -Force -Path $configDir | Out-Null

if (-not (Test-Path -LiteralPath $configPath)) {
    @"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[features]
unified_exec = false

[windows]
sandbox = "unelevated"
"@ | Set-Content -LiteralPath $configPath -Encoding UTF8
    Write-Host "Created $configPath"
} else {
    $config = Get-Content -LiteralPath $configPath -Raw

    if ($config -match '(?m)^approval_policy\s*=') {
        $config = $config -replace '(?m)^approval_policy\s*=.*$', 'approval_policy = "on-request"'
    } else {
        $config = "approval_policy = `"on-request`"`r`n$config"
    }

    if ($config -match '(?m)^sandbox_mode\s*=') {
        $config = $config -replace '(?m)^sandbox_mode\s*=.*$', 'sandbox_mode = "workspace-write"'
    } else {
        $config = "sandbox_mode = `"workspace-write`"`r`n$config"
    }

    if ($config -notmatch '(?m)^\[features\]') {
        $config = $config.TrimEnd() + "`r`n`r`n[features]`r`nunified_exec = false`r`n"
    } elseif ($config -match '(?m)^unified_exec\s*=') {
        $config = $config -replace '(?m)^unified_exec\s*=.*$', 'unified_exec = false'
    } else {
        $config = $config -replace '(?m)^\[features\]\s*$', "[features]`r`nunified_exec = false"
    }

    if ($config -notmatch '(?m)^\[windows\]') {
        $config = $config.TrimEnd() + "`r`n`r`n[windows]`r`nsandbox = `"unelevated`"`r`n"
    } elseif ($config -match '(?m)^sandbox\s*=') {
        $config = $config -replace '(?m)^sandbox\s*=.*$', 'sandbox = "unelevated"'
    } else {
        $config = $config -replace '(?m)^\[windows\]\s*$', "[windows]`r`nsandbox = `"unelevated`""
    }

    Set-Content -LiteralPath $configPath -Value $config -Encoding UTF8
    Write-Host "Updated $configPath"
}

$psWriteTest = Join-Path $Workspace "codex-powershell-write-test.tmp"
$nodeWriteTest = Join-Path $Workspace "codex-node-write-test.tmp"

Set-Content -LiteralPath $psWriteTest -Value "ok" -Encoding UTF8
Remove-Item -LiteralPath $psWriteTest -Force

& node -e "require('fs').writeFileSync(process.argv[1], 'ok'); require('fs').unlinkSync(process.argv[1]); console.log('Node write test ok')" $nodeWriteTest
if ($LASTEXITCODE -ne 0) {
    throw "Node write test failed"
}

Write-Host ""
Write-Host "Codex workspace repair applied and verified."
Write-Host "Restart Codex Desktop before continuing."
