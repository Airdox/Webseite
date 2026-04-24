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
        if (lines.length < 2) continue;

        // Parse headers
        const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
        
        const idxTitle = headers.findIndex(h => h === 'track title' || h === 'title');
        const idxArtist = headers.findIndex(h => h === 'artist');
        
        // Find time column (Start Time, Date Created, etc. - in German it might be 'Startzeit')
        let idxTime = headers.findIndex(h => h.includes('start time') || h.includes('startzeit'));
        
        if (idxTitle === -1 || idxArtist === -1) {
            console.error(`Error: Could not find 'Track Title' or 'Artist' columns in ${file}. Headers found: ${headers.join(', ')}`);
            continue;
        }

        const tracks = [];
        let firstTrackStartTime = null;

        for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split('\t');
            if (columns.length < 2) continue;

            const title = columns[idxTitle]?.trim().replace(/"/g, '');
            const artist = columns[idxArtist]?.trim().replace(/"/g, '');
            
            let timeFormatted = '';

            if (idxTime !== -1 && columns[idxTime]) {
                // Example: 23:15:30
                const timeStr = columns[idxTime].trim();
                const seconds = timeToSeconds(timeStr);
                
                if (firstTrackStartTime === null) {
                    firstTrackStartTime = seconds;
                }
                
                let relativeSeconds = seconds - firstTrackStartTime;
                if (relativeSeconds < 0) {
                    // Passed midnight
                    relativeSeconds += 24 * 3600;
                }
                
                timeFormatted = formatSeconds(relativeSeconds);
            } else {
                // Fallback if no start time is found: just empty or approximate
                timeFormatted = formatSeconds((i - 1) * 3 * 60); // 3 minutes each approximate
            }

            tracks.push({ time: timeFormatted, artist, title });
        }

        if (tracks.length > 0) {
            console.log(`Found ${tracks.length} tracks.`);
            
            // Now we inject this into the musicSets.js file
            // We look for: id: 'recording_2026_04_12'
            const idRegex = new RegExp(`(id:\\s*['"]${setId}['"][\\s\\S]*?)(?:\\s*tracks:\\s*\\[[\\s\\S]*?\\]\\s*,?)?(\\s*})`);
            
            if (idRegex.test(setsFileContent)) {
                const tracklistString = `\n      tracks: [\n` + 
                    tracks.map(t => `          { time: '${t.time}', artist: '${t.artist.replace(/'/g, "\\'")}', title: '${t.title.replace(/'/g, "\\'")}' }`).join(',\n') +
                    `\n      ]\n    }`;
                
                setsFileContent = setsFileContent.replace(idRegex, (match, p1) => {
                    // Remove trailing comma from p1 if it exists
                    const cleanedP1 = p1.trim().replace(/,$/, '');
                    return `${cleanedP1},${tracklistString}`;
                });
                console.log(`Successfully injected tracklist into musicSets.js for ${setId}`);
            } else {
                console.log(`Set ID '${setId}' not found in musicSets.js! Make sure the filename matches the set ID.`);
            }
        }
    }

    fs.writeFileSync(SETS_FILE, setsFileContent, 'utf-8');
    console.log('Done!');
}

run();
