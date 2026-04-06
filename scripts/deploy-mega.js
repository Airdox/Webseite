import { Storage } from 'megajs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioDir = process.env.AUDIO_DIR || path.join(__dirname, '../public/sets');
const email = process.env.MEGA_EMAIL;
const password = process.env.MEGA_PASSWORD;

if (!email || !password) {
    console.error('Missing MEGA_EMAIL or MEGA_PASSWORD environment variables.');
    process.exit(1);
}

async function uploadToMega() {
    try {
        console.log('Logging into Mega.nz...');
        const storage = await new Storage({
            email,
            password
        }).ready;

        console.log('Logged in successfully.');

        // Create a folder for the website if it doesn't exist
        let folder = storage.root.children.find(c => c.name === 'Airdox-Webseite' && c.directory);
        if (!folder) {
            console.log('Creating folder "Airdox-Webseite"...');
            folder = await storage.mkdir('Airdox-Webseite');
        }

        const files = fs.readdirSync(audioDir, { recursive: true });
        const results = {};

        for (const file of files) {
            const filePath = path.join(audioDir, file);
            if (fs.statSync(filePath).isDirectory()) continue;

            console.log(`Uploading ${file}...`);
            const fileData = fs.readFileSync(filePath);
            const uploadedFile = await folder.upload(file, fileData).complete;
            const link = await uploadedFile.link();
            
            // Mega links are usually for the web UI, we need direct links if possible
            // or we use a proxy worker. For now, let's store the links.
            results[file] = link;
            console.log(`Uploaded ${file}: ${link}`);
        }

        fs.writeFileSync(path.join(__dirname, '../mega-links.json'), JSON.stringify(results, null, 2));
        console.log('Upload complete. Links saved to mega-links.json');

    } catch (error) {
        console.error('Upload failed:', error);
        process.exit(1);
    }
}

uploadToMega();
