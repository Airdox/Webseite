$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$viteProcess = $null

try {
    Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

    $viteProcess = Start-Process -FilePath "npm.cmd" `
        -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "4174") `
        -WorkingDirectory $repoRoot `
        -WindowStyle Hidden `
        -PassThru

    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 1
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:4174/desktop.html" -TimeoutSec 2
            if ($response.StatusCode -ge 200) {
                $ready = $true
                break
            }
        } catch {
        }
    }

    if (-not $ready) {
        throw "Vite dev server did not start on http://127.0.0.1:4174"
    }

    $env:VITE_DEV_SERVER_URL = "http://127.0.0.1:4174/desktop.html"
    & "$repoRoot\node_modules\.bin\electron.cmd" .
} finally {
    if ($viteProcess -and -not $viteProcess.HasExited) {
        Stop-Process -Id $viteProcess.Id -Force
    }
}
