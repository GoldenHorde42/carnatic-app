-- ============================================================
-- Carnatic App — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ARTISTS TABLE
-- Curated list of Carnatic music artists/channels
-- ============================================================
CREATE TABLE artists (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  youtube_channel_id  TEXT UNIQUE,          -- e.g. UCxxxxx
  channel_name  TEXT,                       -- display name on YouTube
  artist_type   TEXT CHECK (artist_type IN ('vocalist', 'instrumentalist', 'ensemble', 'sabha', 'other')),
  instrument    TEXT,                       -- for instrumentalists e.g. 'violin', 'mridangam'
  tags          TEXT[] DEFAULT '{}',        -- e.g. ['carnatic', 'classical']
  is_active     BOOLEAN DEFAULT TRUE,       -- false = stop fetching new videos
  verified      BOOLEAN DEFAULT FALSE,      -- manually verified channel
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIDEOS TABLE
-- Cached videos fetched from YouTube API
-- ============================================================
CREATE TABLE videos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_video_id  TEXT UNIQUE NOT NULL,   -- YouTube's video ID (e.g. dQw4w9WgXcQ)
  title             TEXT NOT NULL,
  description       TEXT,
  channel_id        TEXT,                   -- YouTube channel ID
  channel_name      TEXT,
  thumbnail_url     TEXT,
  published_at      TIMESTAMPTZ,
  duration_seconds  INTEGER,               -- video length in seconds
  view_count        BIGINT,
  -- Carnatic metadata (enriched manually or via AI later)
  raga              TEXT,                   -- e.g. 'Shankarabharanam'
  tala              TEXT,                   -- e.g. 'Adi'
  composer          TEXT,                   -- e.g. 'Tyagaraja'
  artist_name       TEXT,                   -- primary performer
  artist_id         UUID REFERENCES artists(id) ON DELETE SET NULL,
  video_type        TEXT CHECK (video_type IN (
                      'concert', 'kutcheri', 'lecture', 'tutorial',
                      'bhajan', 'fusion', 'thillana', 'kriti', 'other'
                    )),
  language          TEXT CHECK (language IN ('tamil', 'telugu', 'sanskrit', 'kannada', 'malayalam', 'hindi', 'other')),
  tags              TEXT[] DEFAULT '{}',
  is_visible        BOOLEAN DEFAULT TRUE,   -- false = hidden from app
  fetched_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES TABLE
-- Extends Supabase auth.users
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  account_type  TEXT DEFAULT 'student' CHECK (account_type IN ('student', 'teacher', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WATCH HISTORY TABLE
-- Tracks what logged-in users have watched
-- ============================================================
CREATE TABLE watch_history (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id              UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  watched_at            TIMESTAMPTZ DEFAULT NOW(),
  watch_duration_seconds INTEGER DEFAULT 0,  -- how long they actually watched
  UNIQUE(user_id, video_id)                  -- one record per user/video, updated on re-watch
);

-- ============================================================
-- PLAYLISTS TABLE
-- User playlists + teacher class playlists
-- ============================================================
CREATE TABLE playlists (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  is_public         BOOLEAN DEFAULT FALSE,
  is_class_playlist BOOLEAN DEFAULT FALSE,   -- teacher-created for students
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE playlist_videos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id  UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id     UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  position     INTEGER DEFAULT 0,            -- order within playlist
  note         TEXT,                         -- teacher annotation e.g. "listen to gamakas at 2:34"
  added_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, video_id)
);

-- ============================================================
-- TEACHER-STUDENT RELATIONSHIPS
-- ============================================================
CREATE TABLE teacher_students (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, student_id)
);

-- ============================================================
-- FETCH LOG TABLE
-- Tracks YouTube API cron job runs (for debugging + quota management)
-- ============================================================
CREATE TABLE fetch_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id       UUID REFERENCES artists(id) ON DELETE SET NULL,
  artist_name     TEXT,
  videos_found    INTEGER DEFAULT 0,
  videos_added    INTEGER DEFAULT 0,
  api_units_used  INTEGER DEFAULT 0,
  status          TEXT CHECK (status IN ('success', 'error', 'skipped')),
  error_message   TEXT,
  fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES (for query performance)
-- ============================================================
CREATE INDEX idx_videos_artist_id       ON videos(artist_id);
CREATE INDEX idx_videos_published_at    ON videos(published_at DESC);
CREATE INDEX idx_videos_raga            ON videos(raga);
CREATE INDEX idx_videos_video_type      ON videos(video_type);
CREATE INDEX idx_videos_channel_id      ON videos(channel_id);
CREATE INDEX idx_videos_is_visible      ON videos(is_visible);
CREATE INDEX idx_watch_history_user_id  ON watch_history(user_id);
CREATE INDEX idx_watch_history_video_id ON watch_history(video_id);
CREATE INDEX idx_playlist_videos_pid    ON playlist_videos(playlist_id);
CREATE INDEX idx_teacher_students_tid   ON teacher_students(teacher_id);
CREATE INDEX idx_teacher_students_sid   ON teacher_students(student_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Required for safe use of anon key in mobile app
-- ============================================================

-- Artists: public read
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read artists" ON artists FOR SELECT USING (true);
CREATE POLICY "Only admins can modify artists" ON artists FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
);

-- Videos: public read (only visible ones)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read visible videos" ON videos FOR SELECT USING (is_visible = true);
CREATE POLICY "Only admins can modify videos" ON videos FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
);

-- Profiles: users can read all, only update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Watch history: users can only see/write their own
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own watch history" ON watch_history FOR ALL USING (auth.uid() = user_id);

-- Playlists: public playlists visible to all, private only to owner
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public playlists visible to all" ON playlists FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage their own playlists" ON playlists FOR ALL USING (auth.uid() = user_id);

-- Playlist videos: visible if playlist is visible
ALTER TABLE playlist_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Playlist videos visible if playlist visible" ON playlist_videos FOR SELECT USING (
  playlist_id IN (SELECT id FROM playlists WHERE is_public = true OR user_id = auth.uid())
);
CREATE POLICY "Users can manage their own playlist videos" ON playlist_videos FOR ALL USING (
  playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid())
);

-- Teacher-student: visible to involved parties
ALTER TABLE teacher_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers and students can see their relationships" ON teacher_students FOR SELECT USING (
  auth.uid() = teacher_id OR auth.uid() = student_id
);
CREATE POLICY "Teachers can add students" ON teacher_students FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can remove students" ON teacher_students FOR DELETE USING (auth.uid() = teacher_id);

-- Fetch log: admin only
ALTER TABLE fetch_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can read fetch logs" ON fetch_log FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- Trigger that creates a profile row when a user signs up
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- AUTO-UPDATE updated_at TIMESTAMPS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artists_updated_at   BEFORE UPDATE ON artists   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER videos_updated_at    BEFORE UPDATE ON videos    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at  BEFORE UPDATE ON profiles  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER playlists_updated_at BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
