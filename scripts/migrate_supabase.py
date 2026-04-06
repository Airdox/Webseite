import psycopg2
import sys

db_url = "postgresql://postgres:Fxem,2_Qa7baEuA@db.zhotpnptilrpjsqlypxt.supabase.co:5432/postgres"

sql_commands = """
CREATE TABLE IF NOT EXISTS track_stats (
    id TEXT PRIMARY KEY,
    plays INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0
);

INSERT INTO track_stats (id, plays, likes, dislikes)
VALUES ('secret_set_2025_12_22', 44, 0, 0)
ON CONFLICT (id) DO UPDATE
SET plays = GREATEST(track_stats.plays, EXCLUDED.plays);
"""

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute(sql_commands)
    conn.commit()
    cur.close()
    conn.close()
    print("Migration successful")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
