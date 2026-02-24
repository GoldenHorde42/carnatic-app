-- 007_daily_cron.sql
-- Sets up a daily cron job to keep the video library fresh.
-- Runs at 6:00 AM UTC (= midnight Pacific Time) every day.
--
-- Prerequisites:
--   pg_cron and pg_net extensions must be enabled on the Supabase project.
--   Both are available by default on Supabase Pro and free tiers.
--   Enable them in: Supabase Dashboard -> Database -> Extensions
--     - pg_cron  (for scheduling)
--     - pg_net   (for HTTP calls from SQL)
--
-- To apply: paste this entire file into Supabase Dashboard -> SQL Editor -> Run
-- To verify job was created: SELECT * FROM cron.job;
-- To remove the job: SELECT cron.unschedule('daily-fetch-videos');

-- Enable required extensions (safe to run even if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove old job if it exists (idempotent)
SELECT cron.unschedule('daily-fetch-videos') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-fetch-videos'
);

-- Schedule daily fetch: fetches videos published in the last 2 days for all artists
-- Fetches incrementally, costs ~600 quota units (well within the 10,000 daily limit)
SELECT cron.schedule(
  'daily-fetch-videos',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos?days=2',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dmJpaW9nZGFvZWF3YWtveGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTAwMDMsImV4cCI6MjA4NzM4NjAwM30.tBBG-L49gDEz67c9kfzoANogbKr3Bb8hXfwq3iH-iq8',
      'Content-Type', 'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Optional: also schedule a weekly full seed on Sundays at 7 AM UTC
-- to catch any missed videos. Costs ~6,600 units — only run if quota allows.
-- Uncomment when YouTube quota increase is approved:
/*
SELECT cron.schedule(
  'weekly-seed-videos',
  '0 7 * * 0',
  $$
  SELECT net.http_post(
    url     := 'https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos?seed=true',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dmJpaW9nZGFvZWF3YWtveGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTAwMDMsImV4cCI6MjA4NzM4NjAwM30.tBBG-L49gDEz67c9kfzoANogbKr3Bb8hXfwq3iH-iq8',
      'Content-Type', 'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);
*/

-- Verify: should show one row with jobname = 'daily-fetch-videos'
SELECT jobname, schedule, command FROM cron.job ORDER BY jobid DESC LIMIT 5;
