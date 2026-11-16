param(
  [string]$AudioPath = "D:\Neuer Ordner (2)\STROHPUPPE - IST UND IMMER WAR_2\ IST UND IMMER WAR\01-REC-2026-08-23-mastered.mp3",
  [string]$AnimPath = "D:\Neuer Ordner (2)\STROHPUPPE - IST UND IMMER WAR_2\ IST UND IMMER WAR\Bitte_entwerfe_mir_eine_GIF_Da.mp4",
  [int]$StartSeconds = 665,
  [int]$Duration = 20,
  [string]$SetTitle = "STROHPUPPE - IST UND IMMER WAR",
  [string]$Artist = "ALFRED HEINRICHS",
  [string]$Track = "BITCH (ORIGINAL MIX)",
  [string]$OutputPath = "docs/agent-system/manni-reel-output/airdox-reel-strohpuppe-ist-und-immer-war.mp4",
  [string]$GifOutputPath = "docs/agent-system/social-auto-output/strohpuppe-daumenkino.gif"
)

$ErrorActionPreference = "Stop"

$outputFull = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputPath))
$outputDir = [System.IO.Path]::GetDirectoryName($outputFull)
if (-not (Test-Path -LiteralPath $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$gifOutputFull = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $GifOutputPath))
$gifOutputDir = [System.IO.Path]::GetDirectoryName($gifOutputFull)
if (-not (Test-Path -LiteralPath $gifOutputDir)) {
  New-Item -ItemType Directory -Path $gifOutputDir | Out-Null
}

$baseName = [System.IO.Path]::GetFileNameWithoutExtension($outputFull)
$previewPath = Join-Path $outputDir "$baseName-preview.png"

$fontBold = "C\:/Windows/Fonts/arialbd.ttf"
$font = "C\:/Windows/Fonts/arial.ttf"

Write-Host "1. Rendering optimized GIF loop to $gifOutputFull..."
ffmpeg -hide_banner -loglevel error -y `
  -i $AnimPath `
  -vf "fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:reserve_transparent=0[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" `
  $gifOutputFull

Write-Host "2. Rendering vertical 9:16 Social Reel to $outputFull..."

$safeSetTitle = $SetTitle.Replace("'", "").Replace(":", "\:")
$safeArtist = $Artist.Replace("'", "").Replace(":", "\:")
$safeTrack = $Track.Replace("'", "").Replace(":", "\:")

$filter = "[2:a]asplit=2[aout][awsrc];" +
  "[awsrc]showwaves=s=850x160:mode=line:colors=00F0FF@0.92|FF00AA@0.55,format=rgba[wave];" +
  "[1:v]scale=872:490:force_original_aspect_ratio=increase,crop=872:490[anim];" +
  "[0:v]drawbox=x=0:y=0:w=1080:h=1920:color=050608@1:t=fill," +
  "drawbox=x=70:y=80:w=940:h=216:color=0F141A@0.88:t=fill," +
  "drawbox=x=70:y=80:w=940:h=216:color=263241@0.9:t=2," +
  "drawbox=x=70:y=80:w=10:h=216:color=00F0FF@1:t=fill," +
  "drawbox=x=960:y=80:w=50:h=216:color=FF00AA@0.80:t=fill," +
  "drawtext=fontfile='$fontBold':text='AIRDOX':x=104:y=114:fontsize=82:fontcolor=F5F8FF," +
  "drawtext=fontfile='$font':text='BERLIN UNDERGROUND TECHNO':x=108:y=214:fontsize=29:fontcolor=00F0FF," +
  "drawtext=fontfile='$font':text='NEW SET':x=760:y=214:fontsize=29:fontcolor=9ADF6B," +
  "drawbox=x=86:y=330:w=908:h=526:color=0F141A@0.88:t=fill," +
  "drawbox=x=86:y=330:w=908:h=526:color=263241@0.95:t=2," +
  "drawbox=x=104:y=348:w=872:h=490:color=000000@0.35:t=fill[base1];" +
  "[base1][anim]overlay=x=104:y=348[base2];" +
  "[base2]drawbox=x=70:y=890:w=940:h=340:color=0F141A@0.92:t=fill," +
  "drawbox=x=70:y=890:w=940:h=340:color=00F0FF@0.65:t=2," +
  "drawbox=x=70:y=890:w=12:h=340:color=00F0FF@1:t=fill," +
  "drawtext=fontfile='$font':text='$safeSetTitle':x=104:y=920:fontsize=32:fontcolor=00F0FF," +
  "drawtext=fontfile='$fontBold':text='$safeArtist':x=104:y=980:fontsize=52:fontcolor=F5F8FF," +
  "drawtext=fontfile='$font':text='$safeTrack':x=104:y=1055:fontsize=36:fontcolor=9ADF6B," +
  "drawtext=fontfile='$font':text='NOW STREAMING // 26 TRACKS // 1\:54 H':x=104:y=1150:fontsize=27:fontcolor=9AA6B2," +
  "drawbox=x=70:y=1270:w=940:h=260:color=0F141A@0.90:t=fill," +
  "drawbox=x=70:y=1270:w=940:h=260:color=263241@0.95:t=2," +
  "drawbox=x=70:y=1270:w=940:h=4:color=00F0FF@1:t=fill," +
  "drawbox=x=70:y=1526:w=940:h=4:color=FF00AA@0.85:t=fill," +
  "drawtext=fontfile='$fontBold':text='FULL SET ON':x=108:y=1305:fontsize=46:fontcolor=F5F8FF," +
  "drawtext=fontfile='$fontBold':text='AIRDOX.INFO':x=108:y=1370:fontsize=88:fontcolor=00F0FF," +
  "drawtext=fontfile='$font':text='music / video / epk / booking':x=112:y=1475:fontsize=28:fontcolor=9AA6B2," +
  "drawbox=x=70:y=1570:w=940:h=170:color=050608@0.72:t=fill," +
  "drawbox=x=70:y=1570:w=940:h=170:color=00F0FF@0.35:t=1," +
  "drawtext=fontfile='$font':text='LIVE WAVEFORM':x=108:y=1588:fontsize=24:fontcolor=9AA6B2," +
  "drawtext=fontfile='$fontBold':text='@airdox_bln':x=108:y=1680:fontsize=42:fontcolor=F5F8FF," +
  "drawtext=fontfile='$font':text='AIRDOX.INFO':x=735:y=1685:fontsize=32:fontcolor=FF00AA[base3];" +
  "[base3][wave]overlay=x=115:y=1590:format=auto," +
  "drawbox=x=70:y=1780:w=940:h=2:color=263241@0.9:t=fill," +
  "drawtext=fontfile='$font':text='>>> AIRDOX.INFO >>> $safeSetTitle >>> AIRDOX.INFO':x='mod(1080-60*t,1720)-1350':y=1820:fontsize=32:fontcolor=00F0FF@0.85,format=yuv420p[v]"

ffmpeg -hide_banner -loglevel error -y `
  -f lavfi -i "color=c=0x050608:s=1080x1920:r=30:d=$Duration" `
  -stream_loop 3 -i $AnimPath `
  -ss $StartSeconds -t $Duration -i $AudioPath `
  -filter_complex $filter `
  -map "[v]" -map "[aout]" `
  -c:v libx264 -preset fast -crf 20 `
  -c:a aac -b:a 192k `
  -t $Duration `
  $outputFull

Write-Host "3. Generating preview screenshot to $previewPath..."
ffmpeg -hide_banner -loglevel error -y `
  -ss 00:00:05 -i $outputFull `
  -vframes 1 `
  $previewPath

Write-Host "Done! Files generated:"
Write-Host "- Reel: $outputFull"
Write-Host "- Preview: $previewPath"
Write-Host "- GIF: $gifOutputFull"
