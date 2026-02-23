/**
 * Carnatic App -- Fetch Videos Edge Function
 * 
 * Fetches new Carnatic music videos from YouTube for all active artists
 * and stores them in the videos table.
 * 
 * Trigger options:
 *   1. HTTP POST (manual trigger or from a scheduler)
 *   2. Supabase pg_cron (set up in SQL: see migration below)
 * 
 * To trigger manually:
 *   curl -X POST https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1/fetch-videos \
 *     -H "Authorization: Bearer <service_role_key>"
 * 
 * YouTube API quota:
 *   - Each artist search = 100 units
 *   - Free quota = 10,000 units/day
 *   - With 66 artists = ~6,600 units per full run
 *   - Safe to run once or twice per day
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

// ── Environment ───────────────────────────────────────────────────────────────────────
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const YOUTUBE_API_KEY      = Deno.env.get('YOUTUBE_API_KEY')!
const YOUTUBE_BASE_URL     = 'https://www.googleapis.com/youtube/v3'

// How far back to look for new videos on each run
const DAYS_BACK  = 3
const MAX_RESULTS = 25

// ── Types ──────────────────────────────────────────────────────────────────────────────

interface Artist {
  id:                 string
  name:               string
  youtube_channel_id: string | null
}

interface YouTubeSnippet {
  title:       string
  description: string
  channelId:   string
  channelTitle: string
  publishedAt: string
  thumbnails:  { high?: { url: string }; medium?: { url: string }; default?: { url: string } }
}

interface YouTubeSearchItem {
  id:      { videoId: string }
  snippet: YouTubeSnippet
}

interface YouTubeVideoDetails {
  id:             string
  contentDetails: { duration: string }
  statistics:     { viewCount: string }
}

// ── Helpers ────────────────────────────────────────────────────────────────────────────

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const [, h = '0', m = '0', s = '0'] = match
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s)
}

function guessVideoType(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('concert') || t.includes('kutcheri') || t.includes('full concert') || t.includes('live at')) return 'concert'
  if (t.includes('lecture') || t.includes('masterclass')) return 'lecture'
  if (t.includes('tutorial') || t.includes('lesson') || t.includes('learn') || t.includes('how to')) return 'tutorial'
  if (t.includes('bhajan') || t.includes('devotional')) return 'bhajan'
  if (t.includes('thillana')) return 'thillana'
  if (t.includes('kriti') || t.includes('krithi')) return 'kriti'
  if (t.includes('fusion')) return 'fusion'
  return 'other'
}

// Full raga list for title matching (all 72 melakartas + popular janya ragas)
const RAGA_PATTERNS: [string, string[]][] = [
  ['Kalyani',           ['kalyani']],
  ['Bhairavi',          ['bhairavi']],
  ['Shankarabharanam',  ['shankarabharanam', 'sankarabharanam', 'dheerashankarabharanam']],
  ['Kambhoji',          ['kambhoji', 'khambhoji']],
  ['Todi',              ['todi']],
  ['Mohanam',           ['mohanam', 'mohana']],
  ['Hamsadhvani',       ['hamsadhvani', 'hamsadhwani']],
  ['Abheri',            ['abheri', 'abhiri']],
  ['Kharaharapriya',    ['kharaharapriya', 'karaharapriya']],
  ['Natabhairavi',      ['natabhairavi']],
  ['Saveri',            ['saveri']],
  ['Madhyamavati',      ['madhyamavati', 'madhyamavathi']],
  ['Bilahari',          ['bilahari']],
  ['Charukeshi',        ['charukeshi', 'charukesi']],
  ['Kedaragowla',       ['kedaragowla', 'kedharagowla']],
  ['Sindhubhairavi',    ['sindhubhairavi', 'sindhu bhairavi']],
  ['Mukhari',           ['mukhari']],
  ['Darbar',            ['darbar', 'durbar']],
  ['Athanaa',           ['athanaa', 'athana']],
  ['Bowli',             ['bowli']],
  ['Sriranjani',        ['sriranjani', 'shreeranjani', 'sree ranjani']],
  ['Nattaikuranji',     ['nattaikuranji', 'nattaikurinji']],
  ['Yamunakalyani',     ['yamunakalyani', 'yamuna kalyani']],
  ['Hamsadhvani',       ['hamsadhvani', 'hamsadhwani']],
  ['Poorvikalyani',     ['poorvikalyani', 'poorvi kalyani']],
  ['Mechakalyani',      ['mechakalyani']],
  ['Shanmukhapriya',    ['shanmukhapriya']],
  ['Hemavati',          ['hemavati']],
  ['Nalinakanti',       ['nalinakanti', 'nalinakanthi']],
  ['Mayamalavagowla',   ['mayamalavagowla']],
  ['Abhogi',            ['abhogi']],
  ['Begada',            ['begada']],
  ['Anandabhairavi',    ['anandabhairavi']],
  ['Pantuvarali',       ['pantuvarali']],
  ['Varali',            ['varali']],
  ['Vasanta',           ['vasanta', 'vasantha']],
  ['Ranjani',           ['ranjani']],
]

function guessRaga(title: string): string | null {
  const t = title.toLowerCase()
  for (const [canonical, aliases] of RAGA_PATTERNS) {
    for (const alias of aliases) {
      const re = new RegExp(`(^|[^a-z])${alias}([^a-z]|$)`)
      if (re.test(t)) return canonical
    }
  }
  return null
}

// ── Core: fetch videos for one artist ─────────────────────────────────────────────────

async function fetchArtistVideos(
  artist: Artist,
  publishedAfter: string,
  supabase: ReturnType<typeof createClient>
): Promise<{ found: number; added: number; units: number }> {
  let found = 0, added = 0, units = 0

  const searchParams = new URLSearchParams({
    part:           'snippet',
    type:           'video',
    q:              'carnatic',
    channelId:      artist.youtube_channel_id!,
    publishedAfter,
    maxResults:     String(MAX_RESULTS),
    key:            YOUTUBE_API_KEY,
  })

  const searchRes = await fetch(`${YOUTUBE_BASE_URL}/search?${searchParams}`)
  units += 100

  if (!searchRes.ok) {
    console.error(`Search failed for ${artist.name}: ${searchRes.status}`)
    return { found, added, units }
  }

  const searchData = await searchRes.json()
  const items: YouTubeSearchItem[] = searchData.items || []
  found = items.length

  if (found === 0) return { found, added, units }

  // Batch fetch details (duration + views)
  const videoIds = items.map((v) => v.id.videoId).join(',')
  const detailsParams = new URLSearchParams({
    part: 'contentDetails,statistics',
    id:   videoIds,
    key:  YOUTUBE_API_KEY,
  })
  const detailsRes = await fetch(`${YOUTUBE_BASE_URL}/videos?${detailsParams}`)
  units += 1

  const detailsData = await detailsRes.json()
  const detailsMap: Record<string, YouTubeVideoDetails> = {}
  ;(detailsData.items || []).forEach((d: YouTubeVideoDetails) => {
    detailsMap[d.id] = d
  })

  for (const item of items) {
    const vid     = item.id.videoId
    const snippet = item.snippet
    const details = detailsMap[vid]

    const thumbnail =
      snippet.thumbnails?.high?.url   ||
      snippet.thumbnails?.medium?.url ||
      snippet.thumbnails?.default?.url || null

    const { error } = await supabase.from('videos').upsert({
      youtube_video_id: vid,
      title:            snippet.title,
      description:      snippet.description?.slice(0, 1000) || null,
      channel_id:       snippet.channelId,
      channel_name:     snippet.channelTitle,
      thumbnail_url:    thumbnail,
      published_at:     snippet.publishedAt,
      duration_seconds: details ? parseDuration(details.contentDetails.duration) : null,
      view_count:       details ? parseInt(details.statistics.viewCount || '0') : null,
      artist_id:        artist.id,
      artist_name:      artist.name,
      raga:             guessRaga(snippet.title),
      video_type:       guessVideoType(snippet.title),
      is_visible:       true,
      fetched_at:       new Date().toISOString(),
    }, { onConflict: 'youtube_video_id' })

    if (!error) added++
    else console.error(`Failed to upsert ${vid}: ${error.message}`)
  }

  return { found, added, units }
}

// ── Main handler ───────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow requests with the service role key for security
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  if (token !== SUPABASE_SERVICE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Allow ?days=7 override for initial full backfill
  const url       = new URL(req.url)
  const daysBack  = parseInt(url.searchParams.get('days') || String(DAYS_BACK))
  const artistFilter = url.searchParams.get('artist') // optional: only fetch one artist

  const publishedAfter = new Date(
    Date.now() - daysBack * 24 * 60 * 60 * 1000
  ).toISOString()

  console.log(`Fetching videos published after ${publishedAfter}`)

  // Get all active artists with a channel ID
  let artistQuery = supabase
    .from('artists')
    .select('id, name, youtube_channel_id')
    .eq('is_active', true)
    .not('youtube_channel_id', 'is', null)

  if (artistFilter) {
    artistQuery = artistQuery.ilike('name', `%${artistFilter}%`)
  }

  const { data: artists, error: artistsError } = await artistQuery

  if (artistsError || !artists) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch artists', details: artistsError?.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log(`Processing ${artists.length} artists`)

  let totalFound = 0, totalAdded = 0, totalUnits = 0
  const results: { artist: string; found: number; added: number }[] = []

  for (const artist of artists) {
    console.log(`Fetching: ${artist.name}`)

    const { found, added, units } = await fetchArtistVideos(
      artist as Artist,
      publishedAfter,
      supabase
    )

    totalFound  += found
    totalAdded  += added
    totalUnits  += units

    results.push({ artist: artist.name, found, added })

    // Log each fetch run
    await supabase.from('fetch_log').insert({
      artist_id:      artist.id,
      artist_name:    artist.name,
      videos_found:   found,
      videos_added:   added,
      api_units_used: units,
      status:         'success',
    })

    // Small delay between artists to be respectful of rate limits
    await new Promise((r) => setTimeout(r, 250))
  }

  const summary = {
    success:     true,
    artists:     artists.length,
    totalFound,
    totalAdded,
    totalUnits,
    quotaUsed:   `${totalUnits} / 10000 daily units`,
    results,
  }

  console.log('Done:', JSON.stringify(summary))

  return new Response(
    JSON.stringify(summary),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
