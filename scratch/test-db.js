
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
}

console.log('Connecting to:', dbUrl.split('@')[1]); // Log host part for safety

const sql = neon(dbUrl);

async function test() {
    try {
        const rows = await sql`SELECT 1 as connected`;
        console.log('Database Status:', rows[0].connected === 1 ? 'OK' : 'FAILED');
        
        const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('Existing tables:', tables.map(t => t.table_name).join(', '));
    } catch (error) {
        console.error('Database connection error:', error);
    }
}

test();
