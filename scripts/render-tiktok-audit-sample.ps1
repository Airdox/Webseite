param(
    [string]$OutputPath = "docs/agent-system/evidence/tiktok-direct-post-original-sample.mp4"
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$resolvedOutput = Join-Path $workspaceRoot $OutputPath
$outputDirectory = Split-Path -Parent $resolvedOutput

New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$videoFilter = @(
    "color=c=0x08090d:s=720x1280:r=30:d=10",
    "drawbox=x='80+40*sin(t*1.3)':y='180+80*cos(t*0.9)':w=220:h=220:color=0x25f4ee@0.75:t=fill",
    "drawbox=x='420+55*cos(t*1.1)':y='720+100*sin(t*0.8)':w=180:h=180:color=0xfe2c55@0.70:t=fill",
    "drawbox=x='170+70*cos(t*0.7)':y='1010+45*sin(t*1.4)':w=380:h=24:color=white@0.55:t=fill",
    "format=yuv420p"
) -join ","

& ffmpeg -hide_banner -loglevel error -y -f lavfi -i $videoFilter -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=48000" -shortest -t 10 -c:v libx264 -preset medium -crf 22 -c:a aac -b:a 96k -movflags +faststart $resolvedOutput

if ($LASTEXITCODE -ne 0 -or -not (Test-Path $resolvedOutput)) {
    throw "Failed to render TikTok audit sample video."
}

$result = Get-Item $resolvedOutput
if ($result.Length -gt 50MB) {
    throw "Rendered TikTok audit sample exceeds the 50 MB evidence limit."
}

$result | Select-Object FullName, Length, LastWriteTime
