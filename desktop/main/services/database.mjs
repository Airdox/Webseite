import { createHash, randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { TABLE_NAMES } from '../../../src/desktop/lib/tableDefinitions.js';
import { readWorkspaceEnv } from './workspace.mjs';

const sqlClients = new Map();
const initPromises = new Map();

const getDbUrl = async (workspaceRoot) => {
  const env = await readWorkspaceEnv(workspaceRoot);
  return env.DATABASE_URL || env.NEON_DATABASE_URL || env.POSTGRES_URL || '';
};

const getSql = async (workspaceRoot) => {
  const dbUrl = await getDbUrl(workspaceRoot);
  if (!dbUrl) {
    throw new Error('No DATABASE_URL/NEON_DATABASE_URL/POSTGRES_URL configured in workspace .env');
  }

  if (!sqlClients.has(dbUrl)) {
    sqlClients.set(dbUrl, neon(dbUrl));
  }
  return sqlClients.get(dbUrl);
};

const ensureInitialized = async (workspaceRoot) => {
  if (!initPromises.has(workspaceRoot)) {
    initPromises.set(workspaceRoot, (async () => {
      const sql = await getSql(workspaceRoot);
      await sql.query(`
        CREATE TABLE IF NOT EXISTS track_stats (
          id TEXT PRIMARY KEY,
          plays INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          dislikes INTEGER DEFAULT 0,
          last_played_at TIMESTAMP NULL
        );
      `);

      await sql.query(`
        CREATE TABLE IF NOT EXISTS bookings (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          event TEXT,
          message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await sql.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          salt TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await sql.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
        );
      `);

      await sql.query(`
        CREATE TABLE IF NOT EXISTS analytics_logs (
          id SERIAL PRIMARY KEY,
          event_type TEXT NOT NULL,
          item_id TEXT,
          session_id TEXT,
          country TEXT,
          city TEXT,
          region TEXT,
          device_type TEXT,
          browser TEXT,
          os TEXT,
          referrer TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await sql.query(`
        CREATE TABLE IF NOT EXISTS subscribers (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    })().catch((error) => {
      initPromises.delete(workspaceRoot);
      throw error;
    }));
  }

  await initPromises.get(workspaceRoot);
};

const hashPassword = (password, salt) => createHash('sha256').update(`${password}${salt}`).digest('hex');

export const getDashboardSnapshot = async (workspaceRoot, manifestSets = []) => {
  await ensureInitialized(workspaceRoot);
  const sql = await getSql(workspaceRoot);

  const [counts] = await sql.query(`
    SELECT
      (SELECT COUNT(*)::int FROM track_stats) AS track_stats_count,
      (SELECT COUNT(*)::int FROM analytics_logs) AS analytics_logs_count,
      (SELECT COUNT(*)::int FROM bookings) AS bookings_count,
      (SELECT COUNT(*)::int FROM subscribers) AS subscribers_count,
      (SELECT COUNT(*)::int FROM users) AS users_count,
      (SELECT COUNT(*)::int FROM sessions) AS sessions_count
  `);

  const [topTracks, allTrackStats, recentAnalytics, recentUsers, recentSubscribers, recentSessions] = await Promise.all([
    sql.query('SELECT id, plays, likes, dislikes, last_played_at FROM track_stats ORDER BY plays DESC NULLS LAST, id ASC LIMIT 8'),
    sql.query('SELECT id FROM track_stats'),
    sql.query('SELECT id, event_type, item_id, country, city, device_type, browser, os, created_at FROM analytics_logs ORDER BY created_at DESC LIMIT 12'),
    sql.query('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT 6'),
    sql.query('SELECT id, email, status, created_at FROM subscribers ORDER BY created_at DESC LIMIT 6'),
    sql.query(`
      SELECT s.id, s.user_id, u.username, u.email, s.created_at, s.expires_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at DESC
      LIMIT 6
    `),
  ]);

  const trackIds = new Set(allTrackStats.map((entry) => entry.id));
  const manifestIds = manifestSets.map((entry) => entry.id);
  const missingStats = manifestIds.filter((id) => !trackIds.has(id));

  return {
    counts,
    topTracks,
    recentAnalytics,
    recentUsers,
    recentSubscribers,
    recentSessions,
    manifestSummary: {
      totalSets: manifestSets.length,
      missingStats,
    },
  };
};

export const listTableRows = async (workspaceRoot, table, limit = 200) => {
  await ensureInitialized(workspaceRoot);
  const sql = await getSql(workspaceRoot);

  if (!TABLE_NAMES.includes(table)) {
    throw new Error(`Unsupported table "${table}"`);
  }

  switch (table) {
    case 'track_stats':
      return sql.query('SELECT id, plays, likes, dislikes, last_played_at FROM track_stats ORDER BY plays DESC NULLS LAST, id ASC LIMIT $1', [limit]);
    case 'analytics_logs':
      return sql.query(`
        SELECT id, event_type, item_id, session_id, country, city, region, device_type, browser, os, referrer, created_at
        FROM analytics_logs
        ORDER BY created_at DESC
        LIMIT $1
      `, [limit]);
    case 'bookings':
      return sql.query('SELECT id, name, email, event, message, created_at FROM bookings ORDER BY created_at DESC LIMIT $1', [limit]);
    case 'subscribers':
      return sql.query('SELECT id, email, status, created_at FROM subscribers ORDER BY created_at DESC LIMIT $1', [limit]);
    case 'users':
      return sql.query('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT $1', [limit]);
    case 'sessions':
      return sql.query(`
        SELECT s.id, s.user_id, u.username, u.email, s.created_at, s.expires_at
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        ORDER BY s.created_at DESC
        LIMIT $1
      `, [limit]);
    default:
      return [];
  }
};

export const updateTrackStats = async (workspaceRoot, row) => {
  await ensureInitialized(workspaceRoot);
  const sql = await getSql(workspaceRoot);
  const [updated] = await sql.query(`
    UPDATE track_stats
    SET plays = $2, likes = $3, dislikes = $4, last_played_at = $5
    WHERE id = $1
    RETURNING id, plays, likes, dislikes, last_played_at
  `, [
    row.id,
    Number(row.plays || 0),
    Number(row.likes || 0),
    Number(row.dislikes || 0),
    row.last_played_at || null,
  ]);
  return updated;
};

export const updateSubscriber = async (workspaceRoot, row) => {
  await ensureInitialized(workspaceRoot);
  const sql = await getSql(workspaceRoot);
  const [updated] = await sql.query(`
    UPDATE subscribers
    SET email = $2, status = $3
    WHERE id = $1
    RETURNING id, email, status, created_at
  `, [Number(row.id), row.email, row.status]);
  return updated;
};

export const deleteRecords = async (workspaceRoot, table, ids) => {
  await ensureInitialized(workspaceRoot);
  const sql = await getSql(workspaceRoot);
  const normalizedIds = Array.isArray(ids) ? ids : [ids];

  switch (table) {
    case 'track_stats':
      await sql.query('DELETE FROM track_stats WHERE id = ANY($1::text[])', [normalizedIds.map(String)]);
      return true;
    case 'bookings':
      await sql.query('DELETE FROM bookings WHERE id = ANY($1::int[])', [normalizedIds.map(Number)]);
      return true;
    case 'subscribers':
      await sql.query('DELETE FROM subscribers WHERE id = ANY($1::int[])', [normalizedIds.map(Number)]);
      return true;
    case 'sessions':
      await sql.query('DELETE FROM sessions WHERE id = ANY($1::text[])', [normalizedIds.map(String)]);
      return true;
    case 'users':
      await sql.query('DELETE FROM sessions WHERE user_id = ANY($1::int[])', [normalizedIds.map(Number)]);
      await sql.query('DELETE FROM users WHERE id = ANY($1::int[])', [normalizedIds.map(Number)]);
      return true;
    default:
      throw new Error(`Delete is not supported for "${table}"`);
  }
};

export const createVipUser = async (workspaceRoot, { username, email, password }) => {
  await ensureInitialized(workspaceRoot);
  const sql = await getSql(workspaceRoot);
  const salt = randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  const [created] = await sql.query(`
    INSERT INTO users (username, email, password, salt)
    VALUES ($1, $2, $3, $4)
    RETURNING id, username, email, created_at
  `, [username, email, hash, salt]);
  return created;
};

export const resetVipPassword = async (workspaceRoot, { userId, password }) => {
  await ensureInitialized(workspaceRoot);
  const sql = await getSql(workspaceRoot);
  const salt = randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  const [updated] = await sql.query(`
    UPDATE users
    SET password = $2, salt = $3
    WHERE id = $1
    RETURNING id, username, email, created_at
  `, [Number(userId), hash, salt]);
  return updated;
};

export const revokeSession = async (workspaceRoot, sessionId) => {
  await ensureInitialized(workspaceRoot);
  const sql = await getSql(workspaceRoot);
  await sql.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
  return true;
};

export const seedTrackStats = async (workspaceRoot, manifestIds = []) => {
  await ensureInitialized(workspaceRoot);
  const sql = await getSql(workspaceRoot);
  for (const id of manifestIds) {
    await sql.query(`
      INSERT INTO track_stats (id, plays, likes, dislikes, last_played_at)
      VALUES ($1, 0, 0, 0, NULL)
      ON CONFLICT (id) DO NOTHING
    `, [id]);
  }
  return true;
};

export const getAnalyticsEvents = async (workspaceRoot, limit = 5000) => {
  await ensureInitialized(workspaceRoot);
  const sql = await getSql(workspaceRoot);
  return sql.query(`
    SELECT event_type, item_id, country, device_type, created_at
    FROM analytics_logs
    ORDER BY created_at DESC
    LIMIT $1
  `, [limit]);
};

const READONLY_PREFIX = /^\s*(select|with|explain)\b/i;
const FORBIDDEN_TOKENS = /\b(insert|update|delete|alter|drop|truncate|grant|revoke|create)\b/i;

export const runReadonlyQuery = async (workspaceRoot, queryText) => {
  await ensureInitialized(workspaceRoot);
  if (!READONLY_PREFIX.test(queryText) || FORBIDDEN_TOKENS.test(queryText)) {
    throw new Error('Only read-only SELECT/WITH/EXPLAIN queries are allowed.');
  }

  const body = queryText.trim();
  const semicolonCount = (body.match(/;/g) || []).length;
  if (semicolonCount > 1 || (semicolonCount === 1 && !body.endsWith(';'))) {
    throw new Error('Only a single read-only statement is allowed.');
  }

  const sql = await getSql(workspaceRoot);
  const result = await sql.query(body);
  return {
    rowCount: result.length,
    rows: result,
  };
};
