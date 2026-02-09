import { checkDbHealth, dbHealthCorsHeaders } from '../server/db-health-core.js';

export default async function handler(request, response) {
    Object.entries(dbHealthCorsHeaders).forEach(([key, value]) => response.setHeader(key, value));

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    const payload = await checkDbHealth('fallback');
    return response.status(200).json(payload);
}
