import fs from 'fs';
import path from 'path';
import ffmpegStatic from 'ffmpeg-static';
import { execSync } from 'child_process';

const setsDir = path.join('d:\\webseeite-main', 'public', 'sets', 'public');

export function compressAllMp3() {
    console.log(`Scanning directory: ${setsDir}`);
    const files = fs.readdirSync(setsDir);
    
    for (const file of files) {
        if (file.toLowerCase().endsWith('.mp3')) {
            const inputPath = path.join(setsDir, file);
            const stats = fs.statSync(inputPath);
            const sizeMB = stats.size / (1024 * 1024);
            
            // If already small enough (roughly below 1.2MB per minute, wait, let's just compress it if it's large)
            console.log(`Evaluating ${file} (${sizeMB.toFixed(2)} MB)...`);
            
            // To ensure we don't double compress or compress already highly compressed files
            // Let's just compress all of them with -b:a 96k
            const tempOutputPath = path.join(setsDir, `TEMP_${file}`);
            
            console.log(`Compressing ${file} to 96k to save traffic...`);
            try {
                // Compress to 96k CBR MP3
                const command = `"${ffmpegStatic}" -y -i "${inputPath}" -codec:a libmp3lame -b:a 96k "${tempOutputPath}"`;
                execSync(command, { stdio: 'inherit' });
                
                // Replace old file with compressed one
                fs.unlinkSync(inputPath);
                fs.renameSync(tempOutputPath, inputPath);
                
                const newSizeMB = fs.statSync(inputPath).size / (1024 * 1024);
                console.log(`Success: ${file} is now ${newSizeMB.toFixed(2)} MB (was ${sizeMB.toFixed(2)} MB)\n`);
            } catch (err) {
                console.error(`Error compressing ${file}:`, err.message);
                if (fs.existsSync(tempOutputPath)) {
                    fs.unlinkSync(tempOutputPath);
                }
            }
        }
    }
}

compressAllMp3();
