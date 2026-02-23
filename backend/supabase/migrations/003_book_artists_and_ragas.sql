-- ============================================================
-- Carnatic App -- Migration 003
-- Source: Appendix B & C from teacher's reference book
-- This is the authoritative curated list for the app
-- ============================================================

-- ============================================================
-- RAGAS TABLE
-- ============================================================
CREATE TABLE ragas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL UNIQUE,
  name_variants    TEXT[] DEFAULT '{}',
  raga_type        TEXT CHECK (raga_type IN ('melakarta', 'janya', 'other')),
  melakarta_number INTEGER,
  parent_melakarta TEXT,
  is_popular       BOOLEAN DEFAULT FALSE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ragas_name ON ragas(name);
CREATE INDEX idx_ragas_type ON ragas(raga_type);

ALTER TABLE ragas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ragas are public read" ON ragas FOR SELECT USING (true);
CREATE POLICY "Only admins can modify ragas" ON ragas FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
);

-- ============================================================
-- ALL 72 MELAKARTAS
-- ============================================================
INSERT INTO ragas (name, raga_type, melakarta_number, is_popular) VALUES
('Kanakangi',             'melakarta',  1,  FALSE),
('Ratnangi',              'melakarta',  2,  FALSE),
('Ganamoorti',            'melakarta',  3,  FALSE),
('Vanaspati',             'melakarta',  4,  FALSE),
('Manavati',              'melakarta',  5,  FALSE),
('Tanaroopi',             'melakarta',  6,  FALSE),
('Senavati',              'melakarta',  7,  FALSE),
('Hanumatodi',            'melakarta',  8,  FALSE),
('Dhenuka',               'melakarta',  9,  FALSE),
('Natakapriya',           'melakarta', 10,  FALSE),
('Kokilapriya',           'melakarta', 11,  FALSE),
('Roopavati',             'melakarta', 12,  FALSE),
('Gayakapriya',           'melakarta', 13,  FALSE),
('Vakulabharanam',        'melakarta', 14,  FALSE),
('Mayamalavagowla',       'melakarta', 15,  FALSE),
('Chakravakam',           'melakarta', 16,  FALSE),
('Sooryakantam',          'melakarta', 17,  FALSE),
('Hatakambari',           'melakarta', 18,  FALSE),
('Jhankaradhvani',        'melakarta', 19,  FALSE),
('Natabhairavi',          'melakarta', 20,  FALSE),
('Keeravani',             'melakarta', 21,  FALSE),
('Kharaharapriya',        'melakarta', 22,  FALSE),
('Gowrimanohari',         'melakarta', 23,  FALSE),
('Varunapriya',           'melakarta', 24,  FALSE),
('Mararanjani',           'melakarta', 25,  FALSE),
('Charukeshi',            'melakarta', 26,  FALSE),
('Sarasangi',             'melakarta', 27,  FALSE),
('Harikambhodhi',         'melakarta', 28,  FALSE),
('Dheerashankarabharanam','melakarta', 29,  FALSE),
('Naganandini',           'melakarta', 30,  FALSE),
('Yagapriya',             'melakarta', 31,  FALSE),
('Ragavardhini',          'melakarta', 32,  FALSE),
('Gangeyabhooshan',       'melakarta', 33,  FALSE),
('Vagadheeshvari',        'melakarta', 34,  FALSE),
('Shoolini',              'melakarta', 35,  FALSE),
('Chalanata',             'melakarta', 36,  FALSE),
('Salagam',               'melakarta', 37,  FALSE),
('Jalarnavam',            'melakarta', 38,  FALSE),
('Jhalavarali',           'melakarta', 39,  FALSE),
('Navaneetam',            'melakarta', 40,  FALSE),
('Pavani',                'melakarta', 41,  FALSE),
('Raghupriya',            'melakarta', 42,  FALSE),
('Gavambhodhi',           'melakarta', 43,  FALSE),
('Bhavapriya',            'melakarta', 44,  FALSE),
('Shubhapantuvarali',     'melakarta', 45,  FALSE),
('Shadvidhamargini',      'melakarta', 46,  FALSE),
('Suvarnangi',            'melakarta', 47,  FALSE),
('Divyamani',             'melakarta', 48,  FALSE),
('Dhavalamabari',         'melakarta', 49,  FALSE),
('Namanarayani',          'melakarta', 50,  FALSE),
('Kamavardhini',          'melakarta', 51,  FALSE),
('Ramapriya',             'melakarta', 52,  FALSE),
('Gamanashrama',          'melakarta', 53,  FALSE),
('Vishwambhari',          'melakarta', 54,  FALSE),
('Shyamallangi',          'melakarta', 55,  FALSE),
('Shanmukhapriya',        'melakarta', 56,  FALSE),
('Simhendramadhyamam',    'melakarta', 57,  FALSE),
('Hemavati',              'melakarta', 58,  FALSE),
('Dharmavati',            'melakarta', 59,  FALSE),
('Neetimati',             'melakarta', 60,  FALSE),
('Kantamani',             'melakarta', 61,  FALSE),
('Rishabhapriya',         'melakarta', 62,  FALSE),
('Latangi',               'melakarta', 63,  FALSE),
('Vachaspati',            'melakarta', 64,  FALSE),
('Mechakalyani',          'melakarta', 65,  FALSE),
('Chitrambari',           'melakarta', 66,  FALSE),
('Sucharitra',            'melakarta', 67,  FALSE),
('Jyotisvaroopin',        'melakarta', 68,  FALSE),
('Dhatuvardhini',         'melakarta', 69,  FALSE),
('Nasikabhooshani',       'melakarta', 70,  FALSE),
('Kosalam',               'melakarta', 71,  FALSE),
('Rasikapriya',           'melakarta', 72,  FALSE);

-- ============================================================
-- APPENDIX B -- POPULAR JANYA RAGAS (teacher's book)
-- ============================================================
INSERT INTO ragas (name, name_variants, raga_type, is_popular) VALUES
('Abheri',           ARRAY['Abhiri'],                         'janya', TRUE),
('Abhogi',           ARRAY[]::TEXT[],                         'janya', TRUE),
('Ahiri',            ARRAY[]::TEXT[],                         'janya', TRUE),
('Amrtavarshini',    ARRAY['Amrutavarshini','Amritavarshini'],'janya', TRUE),
('Athanaa',          ARRAY['Athana'],                         'janya', TRUE),
('Behag',            ARRAY['Behaga'],                         'janya', TRUE),
('Bilahari',         ARRAY[]::TEXT[],                         'janya', TRUE),
('Bindhumalini',     ARRAY['Bindumalini'],                    'janya', TRUE),
('Bowli',            ARRAY[]::TEXT[],                         'janya', TRUE),
('Darbar',           ARRAY['Durbar'],                         'janya', TRUE),
('Devagandhari',     ARRAY[]::TEXT[],                         'janya', TRUE),
('Hamsadhvani',      ARRAY['Hamsadhwani'],                    'janya', TRUE),
('Huseni',           ARRAY['Husaini'],                        'janya', TRUE),
('Jaganmohini',      ARRAY[]::TEXT[],                         'janya', TRUE),
('Janaranjani',      ARRAY[]::TEXT[],                         'janya', TRUE),
('Jayantashree',     ARRAY['Jayantasri','Jayanthasri'],       'janya', TRUE),
('Kadanakutoohalam', ARRAY['Kadanakudhuhalam'],               'janya', TRUE),
('Kalyanavasamtam',  ARRAY['Kalyanavasamtham'],               'janya', TRUE),
('Kamalaamanohari',  ARRAY['Kamalamannohari'],                'janya', TRUE),
('Kanada',           ARRAY['Kannada'],                        'janya', TRUE),
('Kannadagowla',     ARRAY[]::TEXT[],                         'janya', TRUE),
('Karnaranjani',     ARRAY[]::TEXT[],                         'janya', TRUE),
('Kedaragowla',      ARRAY['Kedharagowla'],                   'janya', TRUE),
('Kedaram',          ARRAY[]::TEXT[],                         'janya', TRUE),
('Kuntalavarali',    ARRAY['Kunthalavarali'],                 'janya', TRUE),
('Lalita',           ARRAY[]::TEXT[],                         'janya', TRUE),
('Madhyamavati',     ARRAY['Madhyamavathi'],                  'janya', TRUE),
('Malayamarutam',    ARRAY['Malayamarutham'],                 'janya', TRUE),
('Mohanakalyani',    ARRAY[]::TEXT[],                         'janya', TRUE),
('Mohanam',          ARRAY['Mohana'],                         'janya', TRUE),
('Mukhari',          ARRAY[]::TEXT[],                         'janya', TRUE),
('Nalinakanti',      ARRAY['Nalinakanthi'],                   'janya', TRUE),
('Nattaikuranji',    ARRAY['Nattaikurinji'],                  'janya', TRUE),
('Navarasakannada',  ARRAY[]::TEXT[],                         'janya', TRUE),
('Paras',            ARRAY['Paraas'],                         'janya', TRUE),
('Poorvikalyani',    ARRAY['Purvi Kalyani'],                  'janya', TRUE),
('Ranjani',          ARRAY[]::TEXT[],                         'janya', TRUE),
('Reetigowla',       ARRAY['Reeti Gowla'],                    'janya', TRUE),
('Saranga',          ARRAY[]::TEXT[],                         'janya', TRUE),
('Sarasvati',        ARRAY['Saraswati'],                      'janya', TRUE),
('Saveri',           ARRAY[]::TEXT[],                         'janya', TRUE),
('Shreeranjani',     ARRAY['Sree Ranjani','Sri Ranjani'],     'janya', TRUE),
('Shuddhadhanyasi',  ARRAY['Suddha Dhanyasi'],                'janya', TRUE),
('Sindhubhairavi',   ARRAY['Sindhu Bhairavi'],                'janya', TRUE),
('Sowrashthra',      ARRAY['Saurashtra','Sowrashtram'],       'janya', TRUE),
('Sunadavinodini',   ARRAY[]::TEXT[],                         'janya', TRUE),
('Surati',           ARRAY[]::TEXT[],                         'janya', TRUE),
('Todi',             ARRAY[]::TEXT[],                         'janya', TRUE),
('Valachi',          ARRAY['Valaji'],                         'janya', TRUE),
('Vasanta',          ARRAY['Vasantha'],                       'janya', TRUE),
('Yamunakalyani',    ARRAY['Yamuna Kalyani','Yaman Kalyani'], 'janya', TRUE),
('Anandabhairavi',   ARRAY[]::TEXT[],                         'janya', TRUE),
('Begada',           ARRAY[]::TEXT[],                         'janya', TRUE),
('Bhairavi',         ARRAY[]::TEXT[],                         'janya', TRUE),
('Kalyani',          ARRAY[]::TEXT[],                         'janya', TRUE),
('Kambhoji',         ARRAY['Khambhoji'],                      'janya', TRUE),
('Nattai',           ARRAY[]::TEXT[],                         'janya', TRUE),
('Pantuvarali',      ARRAY['Purvi Kalyani'],                  'janya', TRUE),
('Varali',           ARRAY[]::TEXT[],                         'janya', TRUE);

-- Mark commonly-used Melakartas as popular too
UPDATE ragas SET is_popular = TRUE WHERE name IN (
  'Kharaharapriya','Mayamalavagowla','Hanumatodi','Harikambhodhi',
  'Mechakalyani','Natabhairavi','Dheerashankarabharanam','Charukeshi',
  'Hemavati','Dharmavati','Kamavardhini','Shanmukhapriya'
);

-- ============================================================
-- ADD COLUMNS TO ARTISTS TABLE
-- ============================================================
ALTER TABLE artists ADD COLUMN IF NOT EXISTS book_recommended BOOLEAN DEFAULT FALSE;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS category TEXT;

-- Mark existing artists from the book as book_recommended
UPDATE artists SET book_recommended = TRUE WHERE name IN (
  'M.S. Subbulakshmi', 'L. Subramaniam', 'Lalgudi Jayaraman',
  'M.S. Gopalakrishnan', 'N. Ramani', 'Sikkil Sisters'
);

-- ============================================================
-- VOCAL LEGENDS FROM APPENDIX C
-- ============================================================
INSERT INTO artists (name, artist_type, tags, book_recommended, category, is_active, verified)
VALUES
  ('Ariyakudi Ramanuja Iyengar',     'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE),
  ('Maharajapuram Vishwanatha Iyer', 'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE),
  ('Musiri Subramania Iyer',         'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE),
  ('Semmangudi Srinivasa Iyer',      'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE),
  ('G N Balasubramaniam',            'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE),
  ('Madurai Mani Iyer',              'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE),
  ('Alathur Brothers',               'vocalist', ARRAY['carnatic','classical','legend','vocal','duo'], TRUE, 'legend', TRUE, TRUE),
  ('T Brinda',                       'vocalist', ARRAY['carnatic','classical','legend','vocal','female'], TRUE, 'legend', TRUE, TRUE),
  ('D K Pattammal',                  'vocalist', ARRAY['carnatic','classical','legend','vocal','female'], TRUE, 'legend', TRUE, TRUE),
  ('M L Vasantakumari',              'vocalist', ARRAY['carnatic','classical','legend','vocal','female'], TRUE, 'legend', TRUE, TRUE),
  ('Ramnad Krishnan',                'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE),
  ('Palghat K V Narayanaswamy',      'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE),
  ('M Balamuralikrishna',            'vocalist', ARRAY['carnatic','classical','legend','vocal','composer'], TRUE, 'legend', TRUE, TRUE),
  ('M D Ramanathan',                 'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE),
  ('T N Seshagopalan',               'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE),
  ('T V Sankaranarayanan',           'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE),
  ('Voleti Venkateshwarulu',         'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE),
  ('Nedunuri Krishnamurthy',         'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE),
  ('R K Srikantan',                  'vocalist', ARRAY['carnatic','classical','legend','vocal'], TRUE, 'legend', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- VIOLIN LEGENDS FROM APPENDIX C
-- ============================================================
INSERT INTO artists (name, artist_type, instrument, tags, book_recommended, category, is_active, verified)
VALUES
  ('Dwaram Venkataswami Naidu', 'instrumentalist', 'violin', ARRAY['carnatic','classical','legend','violin'], TRUE, 'legend', TRUE, TRUE),
  ('Mysore Chowdaiah',          'instrumentalist', 'violin', ARRAY['carnatic','classical','legend','violin'], TRUE, 'legend', TRUE, TRUE),
  ('T N Krishnan',              'instrumentalist', 'violin', ARRAY['carnatic','classical','legend','violin'], TRUE, 'legend', TRUE, TRUE),
  ('L Shankar',                 'instrumentalist', 'violin', ARRAY['carnatic','classical','legend','violin','fusion'], TRUE, 'legend', TRUE, TRUE),
  ('M Chandrasekaran',          'instrumentalist', 'violin', ARRAY['carnatic','classical','violin'], TRUE, 'legend', TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- FLUTE LEGENDS FROM APPENDIX C
-- ============================================================
INSERT INTO artists (name, artist_type, instrument, tags, book_recommended, category, is_active, verified)
VALUES
  ('K S Gopalakrishnan', 'instrumentalist', 'flute', ARRAY['carnatic','classical','legend','flute'], TRUE, 'legend', TRUE, TRUE),
  ('T R Mahalingam',     'instrumentalist', 'flute', ARRAY['carnatic','classical','legend','flute'], TRUE, 'legend', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ADD raga_id LINK to videos table
-- ============================================================
ALTER TABLE videos ADD COLUMN IF NOT EXISTS raga_id UUID REFERENCES ragas(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_videos_raga_id ON videos(raga_id);
