/* global process */
import 'dotenv/config';
import worker from '../src/server/worker.js';

async function testWorker() {
    console.log('Testing Worker Routing...');

    // Mock Environment
    const env = {
        ...process.env,
        ASSETS: {
            fetch: async (req) => {
                console.log('Mocking ASSETS.fetch for:', req.url);
                return new Response('Mocked Static Asset', { status: 200 });
            }
        }
    };

    // 1. Test API Routing
    console.log('\n--- 1. Testing API Route (/api/stats) ---');
    const apiRequest = new Request('https://airdox.de/api/stats');
    const apiResponse = await worker.fetch(apiRequest, env);
    console.log('Status:', apiResponse.status);
    const apiData = await apiResponse.json();
    console.log('API Response Logic Working (Received Keys):', Object.keys(apiData).length > 0);

    // 2. Test Asset Routing
    console.log('\n--- 2. Testing Asset Route (/) ---');
    const assetRequest = new Request('https://airdox.de/');
    const assetResponse = await worker.fetch(assetRequest, env);
    console.log('Status:', assetResponse.status);
    const assetText = await assetResponse.text();
    console.log('Asset Response:', assetText);

    if (apiResponse.status === 200 && assetText === 'Mocked Static Asset') {
        console.log('\n✅ Worker Routing Logic Verified!');
    } else {
        console.error('\n❌ Worker Routing Logic Failed!');
    }
}

testWorker().catch(err => {
    console.error('Fatal Error during test:', err);
    process.exit(1);
});
