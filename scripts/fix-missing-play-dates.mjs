import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envUrlMatch = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
const dbUrl = envUrlMatch ? envUrlMatch[1] : null;

if (!dbUrl) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const sql = neon(dbUrl);

async function fix() {
  console.log('Fixing missing last_played_at timestamps...');
  
  // Backfill with current timestamp for all played sets that have no date
  const result = await sql`
    UPDATE track_stats 
    SET last_played_at = CURRENT_TIMESTAMP 
    WHERE plays > 0 AND last_played_at IS NULL
    RETURNING id;
  `;
  
  console.log(`Fixed ${result.length} sets:`, result.map(r => r.id).join(', '));
  console.log('Done.');
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
