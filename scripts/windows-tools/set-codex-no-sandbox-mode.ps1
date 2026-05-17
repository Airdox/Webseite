param(
    [string]$ConfigPath = "$env:USERPROFILE\.codex\config.toml"
)

$ErrorActionPreference = "Stop"

$configDir = Split-Path -Parent $ConfigPath
New-Item -ItemType Directory -Force -Path $configDir | Out-Null

if (Test-Path -LiteralPath $ConfigPath) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = "$ConfigPath.bak-$timestamp"
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

function Set-TomlSectionValue {
    param(
        [string]$Text,
        [string]$Section,
        [string]$Key,
        [string]$Value
    )

    $sectionHeader = "[$Section]"
    $sectionPattern = "(?ms)^\[$([regex]::Escape($Section))\]\s*(.*?)(?=^\[|\z)"

    if ($Text -notmatch "(?m)^\[$([regex]::Escape($Section))\]\s*$") {
        return $Text.TrimEnd() + "`r`n`r`n$sectionHeader`r`n$Key = $Value`r`n"
    }

    return [regex]::Replace($Text, $sectionPattern, {
        param($match)

        $body = $match.Groups[1].Value
        $keyPattern = "(?m)^$([regex]::Escape($Key))\s*=.*$"

        if ($body -match $keyPattern) {
            $body = $body -replace $keyPattern, "$Key = $Value"
        } else {
            $body = "$Key = $Value`r`n$body"
        }

        return "$sectionHeader`r`n$body"
    }, 1)
}

$config = Set-TopLevelTomlValue -Text $config -Key "sandbox_mode" -Value '"danger-full-access"'
$config = Set-TopLevelTomlValue -Text $config -Key "approval_policy" -Value '"never"'
$config = Set-TomlSectionValue -Text $config -Section "features" -Key "unified_exec" -Value "false"
$config = Set-TomlSectionValue -Text $config -Section "windows" -Key "sandbox" -Value '"unelevated"'

Set-Content -LiteralPath $ConfigPath -Value $config.TrimStart() -Encoding UTF8

Write-Host "Updated $ConfigPath"
Write-Host ""
Write-Host "Codex is now configured for temporary no-sandbox local work:"
Write-Host '  sandbox_mode = "danger-full-access"'
Write-Host '  approval_policy = "never"'
Write-Host '  [features] unified_exec = false'
Write-Host '  [windows] sandbox = "unelevated"'
Write-Host ""
Write-Host "Restart Codex Desktop completely before starting the other agent."
Write-Host ""
Write-Host "Note: this mode hides approval prompts. Run restore-codex-approval-button.cmd to bring them back."
