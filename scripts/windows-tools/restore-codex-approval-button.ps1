param(
    [string]$ConfigPath = "$env:USERPROFILE\.codex\config.toml",
    [string]$Workspace = "D:\webseeite-main",
    [string]$GlobalStatePath = "$env:USERPROFILE\.codex\.codex-global-state.json"
)

$ErrorActionPreference = "Stop"

$configDir = Split-Path -Parent $ConfigPath
New-Item -ItemType Directory -Force -Path $configDir | Out-Null

if (Test-Path -LiteralPath $ConfigPath) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = "$ConfigPath.bak-restore-approval-$timestamp"
    Copy-Item -LiteralPath $ConfigPath -Destination $backupPath -Force
    $config = Get-Content -LiteralPath $ConfigPath -Raw
    Write-Host "Backup created: $backupPath"
} else {
    $config = ""
}

function Set-TopLevelTomlValue {
    param(
        [string]$Text,
        [string]$Key,
        [string]$Value
    )

    $pattern = "(?m)^$([regex]::Escape($Key))\s*=.*$"
    if ($Text -match $pattern) {
        return ($Text -replace $pattern, "$Key = $Value")
    }

    return "$Key = $Value`r`n$Text"
}

function Remove-TopLevelTomlValue {
    param(
        [string]$Text,
        [string]$Key
    )

    $pattern = "(?m)^\s*$([regex]::Escape($Key))\s*=.*(?:\r?\n)?"
    return [regex]::Replace($Text, $pattern, "")
}

function Remove-TomlSectionValues {
    param(
        [string]$Text,
        [string]$Section,
        [string[]]$Keys
    )

    $sectionHeader = "[$Section]"
    $sectionPattern = "(?ms)^\[$([regex]::Escape($Section))\]\s*(.*?)(?=^\[|\z)"

    return [regex]::Replace($Text, $sectionPattern, {
        param($match)

        $body = $match.Groups[1].Value
        foreach ($key in $Keys) {
            $keyPattern = "(?m)^\s*$([regex]::Escape($key))\s*=.*(?:\r?\n)?"
            $body = [regex]::Replace($body, $keyPattern, "")
        }

        if ([string]::IsNullOrWhiteSpace($body)) {
            return ""
        }

        return "$sectionHeader`r`n$body"
    }, 1)
}

$config = Remove-TopLevelTomlValue -Text $config -Key "approval_policy"
$config = Remove-TopLevelTomlValue -Text $config -Key "sandbox_mode"
$config = Remove-TomlSectionValues -Text $config -Section "features" -Keys @("unified_exec")
$config = Remove-TomlSectionValues -Text $config -Section "windows" -Keys @("sandbox")

Set-Content -LiteralPath $ConfigPath -Value $config.TrimStart() -Encoding UTF8

if (Test-Path -LiteralPath $GlobalStatePath) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $stateBackupPath = "$GlobalStatePath.bak-restore-permission-ui-$timestamp"
    Copy-Item -LiteralPath $GlobalStatePath -Destination $stateBackupPath -Force

    $state = Get-Content -LiteralPath $GlobalStatePath -Raw | ConvertFrom-Json
    if (-not $state.'electron-persisted-atom-state') {
        $state | Add-Member -NotePropertyName 'electron-persisted-atom-state' -NotePropertyValue ([pscustomobject]@{}) -Force
    }
    if (-not $state.'electron-persisted-atom-state'.'composer-permission-mode-visibility') {
        $state.'electron-persisted-atom-state' | Add-Member -NotePropertyName 'composer-permission-mode-visibility' -NotePropertyValue ([pscustomobject]@{}) -Force
    }

    $visibility = $state.'electron-persisted-atom-state'.'composer-permission-mode-visibility'
    $visibility | Add-Member -NotePropertyName 'guardian-approvals' -NotePropertyValue $true -Force
    $visibility | Add-Member -NotePropertyName 'full-access' -NotePropertyValue $true -Force

    $state | ConvertTo-Json -Depth 100 -Compress | Set-Content -LiteralPath $GlobalStatePath -Encoding UTF8
    Write-Host "Updated $GlobalStatePath"
    Write-Host "Backup created: $stateBackupPath"
}

Write-Host "Updated $ConfigPath"
Write-Host ""
Write-Host "Codex default permission menu restored:"
Write-Host "  removed approval_policy from config.toml"
Write-Host "  removed sandbox_mode from config.toml"
Write-Host "  restored visibility for guardian approvals and full access"
Write-Host ""
Write-Host "Restart Codex Desktop completely before continuing."
