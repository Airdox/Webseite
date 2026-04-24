/* global process */
import 'dotenv/config';
import { handleStatsRequest } from '../src/lib/stats-logic.js';
import { sets } from '../src/data/musicSets.js';

async function syncAndSeed() {
    console.log('🔄 Syncing Database Entries with musicSets.js...');

    for (const set of sets) {
        console.log(`Checking set: ${set.id} (${set.title})`);
        
        // Simulating a "GET" to see if it's there (optional)
        // More efficient: Just send a POST with a safe type 'play' or similar
        // Actually, we can just use the handleStatsRequest logic to ensure it exists.
        
        // We'll use a hack: send a POST for each ID with a type that does nothing but exists
        // Wait, handleStatsRequest requires a valid type. 'play' is the safest.
        
        // Let's just use the SQL client directly to be thorough if we want to seed WITHOUT incrementing.
        // But handleStatsRequest is safer.
        
        const result = await handleStatsRequest({
            method: 'POST',
            rawBody: { id: set.id, type: 'play' }, // This will create the row if missing and add 1 play
            env: process.env,
            allowNetlify: false
        });

        if (result.status === 200) {
            console.log(`✅ ${set.id} synced successfully. Current plays: ${result.body.plays}`);
        } else {
            console.error(`❌ Failed to sync ${set.id}:`, result.body);
        }
    }

    console.log('\n--- Final DB State ---');
    const finalState = await handleStatsRequest({
        method: 'GET',
        env: process.env,
        allowNetlify: false
    });
    console.log(JSON.stringify(finalState.body, null, 2));
}

syncAndSeed().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
