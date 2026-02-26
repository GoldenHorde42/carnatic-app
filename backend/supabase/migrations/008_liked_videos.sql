-- ============================================================
-- Migration 008: Liked Videos
--
-- Adds a liked_videos table so users can heart/like videos.
-- RLS: users can only see/manage their own likes.
-- ============================================================

CREATE TABLE liked_videos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id   UUID NOT NULL REFERENCES videos(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, video_id)
);

ALTER TABLE liked_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own likes"
  ON liked_videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own likes"
  ON liked_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON liked_videos FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast per-user lookups
CREATE INDEX idx_liked_videos_user ON liked_videos (user_id, created_at DESC);
