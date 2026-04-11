/* global process */
import 'dotenv/config';
import { handleStatsRequest } from '../src/lib/stats-logic.js';

async function testConnection() {
    console.log('Testing Database Connection...');
    console.log('Using URL from .env...');

    const result = await handleStatsRequest({
        method: 'GET',
        env: process.env,
        allowNetlify: false
    });

    if (result.status === 200) {
        console.log('✅ Connection Successful!');
        console.log('Data returned:', JSON.stringify(result.body, null, 2));
    } else {
        console.error('❌ Connection Failed!');
        console.error('Status:', result.status);
        console.error('Error:', result.body);
    }
}

testConnection().catch(err => {
    console.error('Fatal Error during test:', err);
    process.exit(1);
});
