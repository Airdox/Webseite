/* global process */
import { neon as netlifyNeon } from '@netlify/neon';
import { neon as neonClient } from '@neondatabase/serverless';

export const buildCorsHeaders = (methods = 'GET, POST, OPTIONS') => ({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type'
});

export const getSqlClient = () => {
    const dbUrl = process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.NEON_DATABASE_URL ||
        process.env.NETLIFY_DATABASE_URL ||
        process.env.NETLIFY_DATABASE_URL_UNPOOLED;

    if (dbUrl) return neonClient(dbUrl);

    try {
        return netlifyNeon();
    } catch {
        return null;
    }
};
