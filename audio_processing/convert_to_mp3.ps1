# Konvertierung zu einer einzigen MP3-Datei (192kbps)
$ffmpeg = "d:\webseeite-main\platform-tools\ffmpeg.exe"
$input = "D:\Neuer Ordner (2)\Airdox - weg du dreck\livesets\01 REC-2026-04-12.wav"
$output = "d:\webseeite-main\audio_processing\Airdox_REC_2026_04_12.mp3"

& $ffmpeg -i $input -codec:a libmp3lame -b:a 192k $output

Write-Host "Konvertierung abgeschlossen: $output"
