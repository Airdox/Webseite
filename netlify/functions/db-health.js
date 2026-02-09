import { checkDbHealth, dbHealthCorsHeaders } from '../../server/db-health-core.js';

export const handler = async (event) => {
    if (event?.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: dbHealthCorsHeaders, body: '' };
    }

    const payload = await checkDbHealth('unhealthy');
    return {
        statusCode: 200,
        headers: { ...dbHealthCorsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    };
};
