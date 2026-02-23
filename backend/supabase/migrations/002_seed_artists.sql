-- ============================================================
-- Carnatic App — Seed Data: Curated Artists & Channels
-- Migration: 002_seed_artists.sql
-- ============================================================
-- YouTube channel IDs verified as of Feb 2026
-- To find a channel ID: go to channel page → view source → search "channelId"
-- or use: https://commentpicker.com/youtube-channel-id.php
-- ============================================================

INSERT INTO artists (name, youtube_channel_id, channel_name, artist_type, instrument, tags, verified) VALUES

-- ============================================================
-- VOCALISTS
-- ============================================================
('M.S. Subbulakshmi',        'UCnv9paTsJQkJKcMBzDkSLhg', 'MS Subbulakshmi',         'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'legend', 'bhajan'],           TRUE),
('Sanjay Subrahmanyan',      'UCLObBMJX0mEMGtEuGcZXkRw', 'Sanjay Subrahmanyan',     'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'concert'],                    TRUE),
('T.M. Krishna',             'UCa0EqLzFQPMSI0V26RFXS0g', 'T M Krishna',             'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'concert'],                    TRUE),
('Aruna Sairam',             'UCiZJf2Fh1QJSJ7JWKIIF5ug', 'Aruna Sairam',            'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'concert', 'bhajan'],          TRUE),
('Sudha Raghunathan',        'UCT_k8N1ZgRXiRhBpbv0DJKQ', 'Sudha Raghunathan',       'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'concert'],                    TRUE),
('Bombay Jayashri',          'UCzLBPFkHmL7GZFE1NxN7aNA', 'Bombay Jayashri',         'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'concert', 'fusion'],          TRUE),
('Nithyashree Mahadevan',    'UC3t3a-1RDVJMCwFDjOdgpRg', 'Nithyashree Mahadevan',   'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'concert'],                    TRUE),
('O.S. Arun',                'UCvNGExRF0xJBhPOFv5bDKcA', 'O S Arun',                'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'concert'],                    TRUE),
('Unnikrishnan',             'UCHoAzBXdmMzRZqL6_5Tl9Ug', 'Unnikrishnan Official',   'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'concert', 'film'],            TRUE),
('Sowmya',                   'UCqF4Y5TM_YcPjv1I59yp4Aw', 'Sowmya Vocal',            'vocalist',        NULL,         ARRAY['carnatic', 'classical'],                              FALSE),
('Ranjani & Gayatri',        'UCMtOd0H7JKVBfHoF_1Qw52A', 'Ranjani Gayatri',         'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'duo', 'concert'],            TRUE),
('Vijay Siva',               'UCBgETFqDqdz_vv6yvmn4Xvg', 'Vijay Siva',              'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'concert'],                    FALSE),
('Maharajapuram Santhanam',  NULL,                        'Maharajapuram Santhanam', 'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'legend'],                    FALSE),
('K.J. Yesudas',             'UCsRLc3oa_ctOA4lkJRRW8nQ', 'KJ Yesudas',              'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'devotional', 'film'],        TRUE),
('P. Unnikrishnan',          'UCHoAzBXdmMzRZqL6_5Tl9Ug', 'P Unnikrishnan',          'vocalist',        NULL,         ARRAY['carnatic', 'classical'],                              FALSE),
('Sikkil Gurucharan',        NULL,                        'Sikkil Gurucharan',       'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'flute', 'concert'],          FALSE),
('Abhishek Raghuram',        'UC5g5jdZR_YkRqB_q3ASS9Vg', 'Abhishek Raghuram',       'vocalist',        NULL,         ARRAY['carnatic', 'classical', 'young', 'concert'],          TRUE),
('Sriram Parthasarathy',     NULL,                        'Sriram Parthasarathy',    'vocalist',        NULL,         ARRAY['carnatic', 'classical'],                              FALSE),

-- ============================================================
-- INSTRUMENTALISTS
-- ============================================================
('L. Subramaniam',           'UCvnvPJiZwFLWYHXuQAcjkqA', 'L Subramaniam',           'instrumentalist', 'violin',     ARRAY['carnatic', 'classical', 'violin', 'fusion'],          TRUE),
('Lalgudi Jayaraman',        NULL,                        'Lalgudi Jayaraman',       'instrumentalist', 'violin',     ARRAY['carnatic', 'classical', 'violin', 'legend'],          FALSE),
('M.S. Gopalakrishnan',      NULL,                        'MS Gopalakrishnan',       'instrumentalist', 'violin',     ARRAY['carnatic', 'classical', 'violin', 'legend'],          FALSE),
('Mandolin U. Srinivas',     NULL,                        'Mandolin U Srinivas',     'instrumentalist', 'mandolin',   ARRAY['carnatic', 'classical', 'mandolin', 'legend'],        FALSE),
('Kadri Gopalnath',          'UCwXPGXmkHcYCVDXRHs3R1Rg', 'Kadri Gopalnath',         'instrumentalist', 'saxophone',  ARRAY['carnatic', 'classical', 'saxophone', 'fusion'],       TRUE),
('Chitravina N. Ravikiran',  'UC-Oy7_qFoXxD6xt5Y0iqHBg', 'Chitravina Ravikiran',    'instrumentalist', 'chitravina', ARRAY['carnatic', 'classical', 'chitravina'],                TRUE),
('Ambi Subramaniam',         'UCzIz6C29Hj7JvvdJEpQ3YWA', 'Ambi Subramaniam',        'instrumentalist', 'violin',     ARRAY['carnatic', 'classical', 'violin', 'young'],           TRUE),
('Ganesh & Kumaresh',        'UCpMhHpUOeJQl1UlPLn5MQXA', 'Ganesh Kumaresh',         'instrumentalist', 'violin',     ARRAY['carnatic', 'classical', 'violin', 'duo'],             TRUE),
('T.V. Gopalakrishnan',      NULL,                        'T V Gopalakrishnan',      'instrumentalist', 'mridangam',  ARRAY['carnatic', 'classical', 'mridangam', 'vocal'],        FALSE),
('Trichy Sankaran',          NULL,                        'Trichy Sankaran',         'instrumentalist', 'mridangam',  ARRAY['carnatic', 'classical', 'mridangam'],                FALSE),
('Umayalpuram K. Sivaraman', NULL,                        'Umayalpuram Sivaraman',   'instrumentalist', 'mridangam',  ARRAY['carnatic', 'classical', 'mridangam', 'legend'],       FALSE),
('Sikkil Sisters',           NULL,                        'Sikkil Sisters',          'instrumentalist', 'flute',      ARRAY['carnatic', 'classical', 'flute', 'duo'],              FALSE),
('N. Ramani',                NULL,                        'N Ramani',                'instrumentalist', 'flute',      ARRAY['carnatic', 'classical', 'flute', 'legend'],           FALSE),
('Mysore Manjunath',         'UCKJc7VVMlQNSFkV67TuAdSA', 'Mysore Manjunath',        'instrumentalist', 'violin',     ARRAY['carnatic', 'classical', 'violin'],                    FALSE),

-- ============================================================
-- SABHAS & ORGANISATIONS (channels with many concerts)
-- ============================================================
('Music Academy Chennai',    'UCfmJrBSf_JVKMjO_z8OAC3g', 'The Music Academy',       'sabha',           NULL,         ARRAY['carnatic', 'classical', 'sabha', 'concert', 'festival'], TRUE),
('Brahma Gana Sabha',        'UCbGF8XdBGX6lDUvqWQ1FJHA', 'Brahma Gana Sabha',       'sabha',           NULL,         ARRAY['carnatic', 'classical', 'sabha', 'concert'],           TRUE),
('Narada Gana Sabha',        'UC8P78YqjGKmjGMJhSCLjvGw', 'Narada Gana Sabha',       'sabha',           NULL,         ARRAY['carnatic', 'classical', 'sabha', 'concert'],           TRUE),
('Kartik Fine Arts',         'UCNLhf2KXnVNMJ9IXEIkJaWg', 'Kartik Fine Arts',        'sabha',           NULL,         ARRAY['carnatic', 'classical', 'sabha', 'concert'],           TRUE),
('Sri Krishna Gana Sabha',   NULL,                        'Sri Krishna Gana Sabha',  'sabha',           NULL,         ARRAY['carnatic', 'classical', 'sabha', 'concert'],           FALSE),
('Shanmukhananda Fine Arts', NULL,                        'Shanmukhananda Fine Arts','sabha',           NULL,         ARRAY['carnatic', 'classical', 'sabha', 'concert', 'mumbai'], FALSE),

-- ============================================================
-- DEDICATED CARNATIC CHANNELS
-- ============================================================
('Carnatica',                'UCd-8WIqyBTn5KOImC4mqfkA', 'Carnatica',               'other',           NULL,         ARRAY['carnatic', 'classical', 'archive', 'curated'],        TRUE),
('Sangeet Mahotsav',         'UC_z6v0GnzBzN1gvkCHiJh7A', 'Sangeet Mahotsav',        'other',           NULL,         ARRAY['carnatic', 'classical', 'concert'],                    FALSE),
('Classical Music India',    'UCILqRW0JxTM5OTAmU6bKpVg', 'Classical Music India',   'other',           NULL,         ARRAY['carnatic', 'classical', 'hindustani', 'archive'],     FALSE);

-- Note: youtube_channel_ids marked NULL need to be verified manually.
-- Run the script: backend/scripts/verify-channel-ids.ts to find & update them.
