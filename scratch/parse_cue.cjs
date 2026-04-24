const fs = require('fs');
const path = require('path');

const cuePath = 'D:\\Neuer Ordner (2)\\Airdox - weg du dreck\\livesets\\J. - E.- no thanks now its your turn.cue';
const content = fs.readFileSync(cuePath, 'utf-8');

const tracks = [];
let currentTrack = null;

const lines = content.split('\n');
lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('TRACK')) {
        const match = trimmed.match(/TRACK (\d+) AUDIO/);
        if (match) {
            currentTrack = { id: parseInt(match[1]), title: '', artist: '', offset: '' };
            tracks.push(currentTrack);
        }
    } else if (currentTrack) {
        if (trimmed.startsWith('TITLE')) {
            currentTrack.title = trimmed.match(/TITLE "(.*)"/)?.[1] || '';
        } else if (trimmed.startsWith('PERFORMER')) {
            currentTrack.artist = trimmed.match(/PERFORMER "(.*)"/)?.[1] || '';
        } else if (trimmed.startsWith('INDEX 01')) {
            currentTrack.offset = trimmed.match(/INDEX 01 (.*)/)?.[1] || '';
        }
    }
});

console.log(JSON.stringify(tracks, null, 2));
