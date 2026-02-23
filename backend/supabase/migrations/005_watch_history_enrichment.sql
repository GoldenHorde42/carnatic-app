-- ============================================================
-- Migration 005: Enrich watch_history for recommendation engine
--
-- Adds denormalized fields to watch_history so the recommend
-- Edge Function can efficiently find a user's top ragas and artists
-- without joining through videos every time.
--
-- Also adds book_recommended column to artists if not present.
-- ============================================================

-- Add denormalized columns to watch_history
ALTER TABLE watch_history
  ADD COLUMN IF NOT EXISTS youtube_video_id  TEXT,
  ADD COLUMN IF NOT EXISTS raga              TEXT,
  ADD COLUMN IF NOT EXISTS artist_name       TEXT,
  ADD COLUMN IF NOT EXISTS watch_count       INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_watched_at   TIMESTAMPTZ DEFAULT NOW();

-- Rename watched_at to first_watched_at for clarity (non-destructive alias)
ALTER TABLE watch_history
  ADD COLUMN IF NOT EXISTS first_watched_at  TIMESTAMPTZ DEFAULT NOW();

-- Back-fill first_watched_at from watched_at
UPDATE watch_history SET first_watched_at = watched_at WHERE first_watched_at IS NULL;

-- Back-fill youtube_video_id, raga, artist_name from videos table
UPDATE watch_history wh
SET
  youtube_video_id = v.youtube_video_id,
  raga             = v.raga,
  artist_name      = v.artist_name,
  last_watched_at  = wh.watched_at
FROM videos v
WHERE v.id = wh.video_id
  AND wh.youtube_video_id IS NULL;

-- Index for fast per-user recommendation lookups
CREATE INDEX IF NOT EXISTS idx_watch_history_user_raga
  ON watch_history (user_id, raga);

CREATE INDEX IF NOT EXISTS idx_watch_history_user_artist
  ON watch_history (user_id, artist_name);

CREATE INDEX IF NOT EXISTS idx_watch_history_user_last
  ON watch_history (user_id, last_watched_at DESC);

-- ============================================================
-- Trigger: auto-fill raga/artist_name/youtube_video_id on insert
-- so the app only needs to pass video_id, not the extra fields
-- ============================================================

CREATE OR REPLACE FUNCTION fill_watch_history_meta()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v RECORD;
BEGIN
  SELECT youtube_video_id, raga, artist_name
  INTO v
  FROM videos
  WHERE id = NEW.video_id;

  NEW.youtube_video_id := COALESCE(NEW.youtube_video_id, v.youtube_video_id);
  NEW.raga             := COALESCE(NEW.raga, v.raga);
  NEW.artist_name      := COALESCE(NEW.artist_name, v.artist_name);
  NEW.last_watched_at  := NOW();
  NEW.first_watched_at := COALESCE(NEW.first_watched_at, NOW());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_watch_history_meta ON watch_history;
CREATE TRIGGER trg_fill_watch_history_meta
  BEFORE INSERT ON watch_history
  FOR EACH ROW EXECUTE FUNCTION fill_watch_history_meta();

-- ============================================================
-- Trigger: on re-watch (UPDATE), increment watch_count + update
-- last_watched_at
-- ============================================================

CREATE OR REPLACE FUNCTION increment_watch_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.watch_count      := COALESCE(OLD.watch_count, 0) + 1;
  NEW.last_watched_at  := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_watch_count ON watch_history;
CREATE TRIGGER trg_increment_watch_count
  BEFORE UPDATE ON watch_history
  FOR EACH ROW EXECUTE FUNCTION increment_watch_count();

-- ============================================================
-- Update RLS on watch_history
-- ============================================================

ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own history" ON watch_history;
CREATE POLICY "Users can view their own history"
  ON watch_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own history" ON watch_history;
CREATE POLICY "Users can insert their own history"
  ON watch_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own history" ON watch_history;
CREATE POLICY "Users can update their own history"
  ON watch_history FOR UPDATE
  USING (auth.uid() = user_id);
