-- ============================================================
-- Migration 006: Artist search metadata
--
-- Adds fields that improve video discovery for artists who
-- are deceased, have no YouTube channel, or are known by
-- multiple name variants.
--
-- search_aliases: array of alternate spellings/names to search
--   e.g. M.S. Subbulakshmi → ["MS Subbulakshmi", "Subbulakshmi", "MS Amma"]
--
-- is_deceased: flag so fetch-videos knows to do a broader
--   global YouTube search rather than restricting to sabha channels
--
-- fetch_strategy: override how we fetch for this artist
--   'channel'       = use youtube_channel_id (Tier 1)
--   'sabha_search'  = search by name in sabha/label channels (Tier 2)
--   'global_search' = search YouTube globally (for deceased legends)
--   'skip'          = do not fetch (artist with no content on YouTube)
-- ============================================================

ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS search_aliases   TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_deceased      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fetch_strategy   TEXT DEFAULT 'channel'
    CHECK (fetch_strategy IN ('channel', 'sabha_search', 'global_search', 'skip'));

-- ============================================================
-- Set fetch_strategy for artists who already have channels
-- ============================================================
UPDATE artists
SET fetch_strategy = 'channel'
WHERE youtube_channel_id IS NOT NULL;

UPDATE artists
SET fetch_strategy = 'sabha_search'
WHERE youtube_channel_id IS NULL AND is_deceased = FALSE;

-- ============================================================
-- Mark deceased artists + set global_search strategy
-- ============================================================
UPDATE artists SET
  is_deceased    = TRUE,
  fetch_strategy = 'global_search',
  search_aliases = ARRAY['M S Subbulakshmi', 'MS Subbulakshmi', 'Subbulakshmi', 'M.S.S']
WHERE name ILIKE '%subbulakshmi%';

UPDATE artists SET
  is_deceased    = TRUE,
  fetch_strategy = 'global_search',
  search_aliases = ARRAY['Lalgudi', 'Lalgudi G Jayaraman', 'Lalgudi Violin']
WHERE name ILIKE '%lalgudi jayaraman%';

UPDATE artists SET
  is_deceased    = TRUE,
  fetch_strategy = 'global_search',
  search_aliases = ARRAY['GNB', 'G N Balasubramaniam']
WHERE name ILIKE '%balasubramaniam%' AND name ILIKE '%g%';

UPDATE artists SET
  is_deceased    = TRUE,
  fetch_strategy = 'global_search',
  search_aliases = ARRAY['MDR', 'M D Ramanathan']
WHERE name ILIKE '%ramanathan%' AND name ILIKE '%m%';

UPDATE artists SET
  is_deceased    = TRUE,
  fetch_strategy = 'global_search',
  search_aliases = ARRAY['KVN', 'K V Narayanaswamy']
WHERE name ILIKE '%narayanaswamy%' AND name ILIKE '%k%';

UPDATE artists SET
  is_deceased    = TRUE,
  fetch_strategy = 'global_search',
  search_aliases = ARRAY['DKP', 'D K Pattammal', 'Pattammal']
WHERE name ILIKE '%pattammal%';

UPDATE artists SET
  is_deceased    = TRUE,
  fetch_strategy = 'global_search',
  search_aliases = ARRAY['Semangudi', 'Semangudi Srinivasa Iyer']
WHERE name ILIKE '%semangudi%';

UPDATE artists SET
  is_deceased    = TRUE,
  fetch_strategy = 'global_search',
  search_aliases = ARRAY['Chembai', 'Chembai Vaidyanatha Bhagavathar']
WHERE name ILIKE '%chembai%';

UPDATE artists SET
  is_deceased    = TRUE,
  fetch_strategy = 'global_search',
  search_aliases = ARRAY['Ariyakudi', 'Ariyakudi Ramanuja Iyengar']
WHERE name ILIKE '%ariyakudi%';

UPDATE artists SET
  is_deceased    = TRUE,
  fetch_strategy = 'global_search',
  search_aliases = ARRAY['Alathur Brothers', 'Alathur Srinivasa Iyer']
WHERE name ILIKE '%alathur%';

UPDATE artists SET
  is_deceased    = TRUE,
  fetch_strategy = 'global_search',
  search_aliases = ARRAY['Madurai Mani', 'Madurai Mani Iyer']
WHERE name ILIKE '%madurai mani%';

UPDATE artists SET
  is_deceased    = TRUE,
  fetch_strategy = 'global_search',
  search_aliases = ARRAY['Semmangudi', 'Semmangudi Srinivasa Iyer']
WHERE name ILIKE '%semmangudi%';

-- ============================================================
-- Add search aliases for living artists with common abbreviations
-- ============================================================
UPDATE artists SET
  search_aliases = ARRAY['Sanjay', 'Sanjay S']
WHERE name ILIKE '%sanjay subrahmanyan%';

UPDATE artists SET
  search_aliases = ARRAY['TMK', 'TM Krishna']
WHERE name ILIKE '%t.m. krishna%' OR name ILIKE '%tm krishna%';

UPDATE artists SET
  search_aliases = ARRAY['Unni', 'P Unnikrishnan']
WHERE name ILIKE '%unnikrishnan%';

UPDATE artists SET
  search_aliases = ARRAY['Bombay Jayashri', 'Bombay Jayashree']
WHERE name ILIKE '%jayashri%' OR name ILIKE '%jayashree%';

-- ============================================================
-- Index for fetch_strategy queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_artists_fetch_strategy
  ON artists (fetch_strategy, is_active);
