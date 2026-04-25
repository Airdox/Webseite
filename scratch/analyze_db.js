/* global process */
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

async function analyze() {
    if (!dbUrl) {
        console.error('No database URL configured in .env');
        process.exit(1);
    }

    const sql = neon(dbUrl);
    
    console.log("--- AIRDOX DATABASE ANALYSIS ---");
    
    try {
        // Fetch track stats
        const rows = await sql`SELECT * FROM track_stats ORDER BY plays DESC`;
        
        if (rows.length === 0) {
            console.log("No data found in track_stats.");
            return;
        }

        let totalPlays = 0;
        let totalLikes = 0;
        let totalDislikes = 0;

        console.log("\nTop 5 Sets by Plays:");
        rows.slice(0, 5).forEach((row, i) => {
            console.log(`${i+1}. ${row.id}: ${row.plays} plays, ${row.likes} likes`);
            totalPlays += row.plays;
            totalLikes += row.likes;
            totalDislikes += row.dislikes;
        });

        // Sum remaining
        rows.slice(5).forEach(row => {
            totalPlays += row.plays;
            totalLikes += row.likes;
            totalDislikes += row.dislikes;
        });

        console.log("\nOverall Totals:");
        console.log(`Total Plays: ${totalPlays}`);
        console.log(`Total Likes: ${totalLikes}`);
        console.log(`Total Dislikes: ${totalDislikes}`);
        
        // Fetch analytics logs [MAX DENSITY]
        const logs = await sql`SELECT * FROM analytics_logs ORDER BY created_at DESC LIMIT 10`;
        console.log("\n--- Latest Detailed Logs (Max Density) ---");
        if (logs.length === 0) {
            console.log("No detailed logs found.");
        } else {
            logs.forEach((log, i) => {
                console.log(`${i+1}. [${log.created_at.toISOString()}] ${log.event_type} - ${log.item_id}`);
                console.log(`   Location: ${log.city}, ${log.region}, ${log.country}`);
                console.log(`   Device: ${log.device_type} (${log.browser} on ${log.os})`);
                console.log(`   Referrer: ${log.referrer || 'Direct'}`);
                console.log("-------------------------------------------");
            });
        }

        // Check bookings
        const bookings = await sql`SELECT count(*) as count FROM bookings`;
        console.log(`\nTotal Bookings: ${bookings[0].count}`);

        // Check subscribers [NEW]
        try {
            const subscribers = await sql`SELECT count(*) as count FROM subscribers`;
            const latestSubscribers = await sql`SELECT email, created_at FROM subscribers ORDER BY created_at DESC LIMIT 5`;
            console.log(`Total Newsletter Subscribers: ${subscribers[0].count}`);
            if (latestSubscribers.length > 0) {
                console.log("Latest Subscribers:");
                latestSubscribers.forEach(s => console.log(` - ${s.email} (${s.created_at.toISOString()})`));
            }
        } catch (e) {
            console.log("Subscribers table not yet created or error:", e.message);
        }

        // Check users
        const users = await sql`SELECT count(*) as count FROM users`;
        console.log(`Total Registered VIP Users: ${users[0].count}`);

    } catch (err) {
        console.error("Error during analysis:", err);
    }
}

analyze();
