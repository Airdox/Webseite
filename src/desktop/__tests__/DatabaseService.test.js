import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  neon: vi.fn(),
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: mocks.neon,
}));

vi.mock('../../../desktop/main/services/workspace.mjs', () => ({
  readWorkspaceEnv: vi.fn(async () => ({ DATABASE_URL: 'postgres://desktop-test' })),
}));

const createQueryResponse = async (statement) => {
  const sql = String(statement).replace(/\s+/g, ' ').trim();

  if (sql.startsWith('CREATE TABLE')) return [];
  if (sql.includes('(SELECT COUNT(*)::int FROM track_stats)')) {
    return [{
      track_stats_count: 2,
      analytics_logs_count: 0,
      bookings_count: 0,
      subscribers_count: 0,
      users_count: 0,
      sessions_count: 0,
    }];
  }
  if (sql.startsWith('SELECT id, plays, likes, dislikes')) {
    return [{ id: 'top_set', plays: 10, likes: 0, dislikes: 0, last_played_at: null }];
  }
  if (sql === 'SELECT id FROM track_stats') {
    return [{ id: 'top_set' }, { id: 'quiet_set' }];
  }
  if (sql.startsWith('SELECT id, event_type')) return [];
  if (sql.startsWith('SELECT id, username')) return [];
  if (sql.startsWith('SELECT id, email')) return [];
  if (sql.startsWith('SELECT s.id')) return [];

  return [];
};

describe('database service dashboard snapshot', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.query.mockReset();
    mocks.neon.mockReset();
    mocks.query.mockImplementation(createQueryResponse);
    mocks.neon.mockReturnValue({ query: mocks.query });
  });

  it('computes missing manifest stats against all track_stats rows, not only top tracks', async () => {
    const { getDashboardSnapshot } = await import('../../../desktop/main/services/database.mjs');

    const snapshot = await getDashboardSnapshot('D:\\AIRDOX\\workspace', [
      { id: 'top_set' },
      { id: 'quiet_set' },
      { id: 'missing_set' },
    ]);

    expect(snapshot.manifestSummary.missingStats).toEqual(['missing_set']);
    expect(snapshot.topTracks).toEqual([
      { id: 'top_set', plays: 10, likes: 0, dislikes: 0, last_played_at: null },
    ]);
  });
});
