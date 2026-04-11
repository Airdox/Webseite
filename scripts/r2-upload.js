import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Lade .env Datei
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  AUDIO_DIR = "public/sets"
} = process.env;

// Validierung der Umgebungsvariablen
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("❌ Fehler: Fehlende Cloudflare R2 Zugangsdaten in der .env Datei.");
  process.exit(1);
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function uploadFile(filePath, relativePath) {
  const fileContent = fs.readFileSync(filePath);
  const extension = path.extname(filePath).toLowerCase();
  
  // Bestimme Content-Type
  let contentType = "application/octet-stream";
  if (extension === ".mp3") contentType = "audio/mpeg";
  if (extension === ".jpg" || extension === ".jpeg") contentType = "image/jpeg";
  if (extension === ".png") contentType = "image/png";

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: relativePath.replace(/\\/g, "/"), // Cloudflare nutzt Slashes
    Body: fileContent,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable" // 1 Jahr Caching für Audio
  });

  try {
    await s3Client.send(command);
    console.log(`✅ Hochgeladen: ${relativePath}`);
  } catch (err) {
    console.error(`❌ Fehler beim Hochladen von ${relativePath}:`, err.message);
  }
}

async function walkDir(dir, baseDir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (fs.statSync(fullPath).isDirectory()) {
      await walkDir(fullPath, baseDir);
    } else {
      await uploadFile(fullPath, relativePath);
    }
  }
}

const sourcePath = path.resolve(__dirname, "..", AUDIO_DIR);

if (!fs.existsSync(sourcePath)) {
  console.error(`❌ Fehler: Quellverzeichnis ${sourcePath} nicht gefunden.`);
  process.exit(1);
}

console.log(`\n🚀 Starte Audio-Migration zu Cloudflare R2...`);
console.log(`📂 Quelle: ${sourcePath}`);
console.log(`📦 Bucket: ${R2_BUCKET_NAME}\n`);

walkDir(sourcePath, sourcePath)
  .then(() => console.log("\n✨ Migration abgeschlossen!"))
  .catch(err => console.error("\n💥 Migration fehlgeschlagen:", err));
