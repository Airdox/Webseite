-- Create track_stats table
CREATE TABLE IF NOT EXISTS track_stats (
    id TEXT PRIMARY KEY,
    plays INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0
);

-- Seed initial data
INSERT INTO track_stats (id, plays, likes, dislikes)
VALUES ('secret_set_2025_12_22', 44, 0, 0)
ON CONFLICT (id) DO UPDATE
SET plays = GREATEST(track_stats.plays, EXCLUDED.plays);
