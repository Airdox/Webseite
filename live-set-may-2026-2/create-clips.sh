#!/usr/bin/env bash
set -euo pipefail

AUDIO_URL="${AUDIO_URL:-https://airdox.info/api/audio/recording_2026_05_07-2.mp3}"
OUT_DIR="${OUT_DIR:-./exports/live-set-may-2026-2}"
START_TS="${START_TS:-00:17:58}"

mkdir -p "$OUT_DIR/audio"

echo "Source: $AUDIO_URL"
echo "Output: $OUT_DIR"
echo "Start:  $START_TS"

cut_audio() {
  local duration="$1"
  local filename="$2"

  ffmpeg -y \
    -ss "$START_TS" \
    -i "$AUDIO_URL" \
    -filter:a "atrim=start=0:duration=${duration},asetpts=PTS-STARTPTS" \
    -c:a aac \
    -b:a 192k \
    "$OUT_DIR/audio/$filename"
}

cut_audio 59 "airdox-live-set-may-2026-2-master-59s.m4a"
cut_audio 15 "airdox-live-set-may-2026-2-hook-15s.m4a"
cut_audio 30 "airdox-live-set-may-2026-2-drop-30s.m4a"
cut_audio 180 "airdox-live-set-may-2026-2-extended-3min.m4a"

echo "Audio clips rendered."
