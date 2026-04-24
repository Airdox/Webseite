import fs from 'fs';
import path from 'path';

const TRACKLISTS_DIR = path.join(process.cwd(), 'data', 'tracklists');
const SETS_FILE = path.join(process.cwd(), 'src', 'data', 'musicSets.js');

// Parse a time string like "HH:MM:SS" or "MM:SS" into total seconds
function timeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return 0;
}

// Format seconds into MM:SS or HH:MM:SS
function formatSeconds(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    
    if (h > 0) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

async function run() {
    console.log('Starting Rekordbox tracklist import...');
    
    if (!fs.existsSync(TRACKLISTS_DIR)) {
        console.log(`Creating directory: ${TRACKLISTS_DIR}`);
        fs.mkdirSync(TRACKLISTS_DIR, { recursive: true });
        console.log('Please put your Rekordbox .txt export files in the data/tracklists directory.');
        return;
    }

    const files = fs.readdirSync(TRACKLISTS_DIR).filter(f => f.endsWith('.txt'));
    if (files.length === 0) {
        console.log('No .txt files found in data/tracklists.');
        return;
    }

    // Read the current musicSets.js file
    let setsFileContent = fs.readFileSync(SETS_FILE, 'utf-8');

    for (const file of files) {
        const setId = file.replace('.txt', '');
        console.log(`\nProcessing tracklist for set ID: ${setId}`);

        // Read the TSV file (Rekordbox exports UTF-16LE, so we try to handle it gracefully if possible)
        const rawContent = fs.readFileSync(path.join(TRACKLISTS_DIR, file));
        
        // Convert UTF-16LE to UTF-8 if necessary
        let content = rawContent.toString('utf-8');
        if (rawContent[0] === 0xFF && rawContent[1] === 0xFE) {
            content = rawContent.toString('utf16le');
        }

        const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
        let headers = [];
        let tracks = [];
        
        if (lines.length >= 2) {
            headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
            
            const idxTitle = headers.findIndex(h => h === 'track title' || h === 'title');
            const idxArtist = headers.findIndex(h => h === 'artist');
            let idxTime = headers.findIndex(h => h.includes('start time') || h.includes('startzeit'));
            
            if (idxTitle !== -1 && idxArtist !== -1) {
                let firstTrackStartTime = null;

                for (let i = 1; i < lines.length; i++) {
                    const columns = lines[i].split('\t');
                    if (columns.length < 2) continue;

                    const title = columns[idxTitle]?.trim().replace(/"/g, '');
                    const artist = columns[idxArtist]?.trim().replace(/"/g, '');
                    
                    // Skip empty rows to ensure 1:1 output with valid Rekordbox tracks
                    if (!title && !artist) continue;

                    let timeFormatted = '';

                    if (idxTime !== -1 && columns[idxTime]) {
                        const timeStr = columns[idxTime].trim();
                        const seconds = timeToSeconds(timeStr);
                        
                        if (firstTrackStartTime === null) {
                            firstTrackStartTime = seconds;
                        }
                        
                        let relativeSeconds = seconds - firstTrackStartTime;
                        if (relativeSeconds < 0) {
                            relativeSeconds += 24 * 3600;
                        }
                        
                        timeFormatted = formatSeconds(relativeSeconds);
                    } else {
                        timeFormatted = formatSeconds((i - 1) * 3 * 60);
                    }

                    tracks.push({ time: timeFormatted, artist, title });
                }
            }
        }

        if (tracks.length > 0) {
            console.log(`Found ${tracks.length} tracks.`);
            
            // Better parsing to handle existing tracks reliably
            const searchStr = `id: '${setId}'`;
            const startIndex = setsFileContent.indexOf(searchStr);
            if (startIndex !== -1) {
                // Find where this object ends (roughly looking for the next object or end of array)
                const nextIdIndex = setsFileContent.indexOf(`id: '`, startIndex + searchStr.length);
                const endIndex = nextIdIndex !== -1 ? nextIdIndex : setsFileContent.length;
                
                let objectContent = setsFileContent.substring(startIndex, endIndex);
                
                const tracklistString = `\n      tracks: [\n` + 
                    tracks.map(t => `          { time: '${t.time}', artist: '${t.artist.replace(/'/g, "\\'")}', title: '${t.title.replace(/'/g, "\\'")}' }`).join(',\n') +
                    `\n      ]`;

                // If tracks exist, replace them.
                if (objectContent.includes('tracks: [')) {
                    objectContent = objectContent.replace(/tracks:\s*\[[\s\S]*?\]/, tracklistString.trim());
                } else {
                    // Inject before the closing bracket of this object
                    // The object closes with "  }," or "  }"
                    const closeMatch = objectContent.match(/(\s*},?\s*)$/);
                    if (closeMatch) {
                        objectContent = objectContent.replace(/(\s*},?\s*)$/, `,${tracklistString}$1`);
                    } else {
                        // Fallback (might not format perfectly but works)
                        objectContent = objectContent.replace(/(\s*})$/, `,${tracklistString}$1`);
                    }
                }
                
                setsFileContent = setsFileContent.substring(0, startIndex) + objectContent + setsFileContent.substring(endIndex);
                console.log(`Successfully injected tracklist into musicSets.js for ${setId}`);
            } else {
                console.log(`Set ID '${setId}' not found in musicSets.js! Make sure the filename matches the set ID.`);
            }
        } else {
            console.log(`No valid tracks found in export for ${setId}. Removing tracklist if it exists to match 1:1.`);
            const searchStr = `id: '${setId}'`;
            const startIndex = setsFileContent.indexOf(searchStr);
            if (startIndex !== -1) {
                const nextIdIndex = setsFileContent.indexOf(`id: '`, startIndex + searchStr.length);
                const endIndex = nextIdIndex !== -1 ? nextIdIndex : setsFileContent.length;
                let objectContent = setsFileContent.substring(startIndex, endIndex);
                if (objectContent.includes('tracks: [')) {
                    objectContent = objectContent.replace(/,\s*tracks:\s*\[[\s\S]*?\]/, '');
                    setsFileContent = setsFileContent.substring(0, startIndex) + objectContent + setsFileContent.substring(endIndex);
                    console.log(`Removed empty tracklist for ${setId}`);
                }
            }
        }
    }

    fs.writeFileSync(SETS_FILE, setsFileContent, 'utf-8');
    console.log('Done!');
}

run();
