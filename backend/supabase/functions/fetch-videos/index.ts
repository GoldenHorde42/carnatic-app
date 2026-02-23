/**
 * Carnatic App -- Fetch Videos Edge Function
 *
 * TWO-TIER STRATEGY:
 *   Tier 1 — Channel fetch: artists with their own YouTube channel
 *             → fetch all recent videos from that channel
 *   Tier 2 — Name search:   artists without their own channel
 *             → search YouTube by "artist name carnatic", restricted to
 *               a whitelist of trusted sabha/label channels
 *
 * Query params:
 *   ?seed=true      no date filter — get latest 25 per artist (initial seed)
 *   ?days=N         look back N days (default 3, for daily cron)
 *   ?artist=name    only process artists matching name (debug / single refresh)
 *
 * YouTube API quota:
 *   Tier 1: 100 units/artist search + 1 unit/details batch
 *   Tier 2: 100 units/artist search + 1 unit/details batch
 *   66 artists × 101 ≈ 6,666 units — well within 10,000/day free tier
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const YOUTUBE_API_KEY      = Deno.env.get('YOUTUBE_API_KEY')!
const YOUTUBE_BASE_URL     = 'https://www.googleapis.com/youtube/v3'

const DAYS_BACK   = 3
const MAX_RESULTS = 25

// ── Trusted sabha / label channels used for Tier-2 name search ────────────────────────
// SABHAS: post concerts by many different artists
const SABHA_CHANNEL_IDS = [
  'UCKmE9i2iW0KaqgSxVFYmZUw',  // The Music Academy Madras
  'UCfDNeYjoqsfOhU-nX_g8GoA',  // Brahma Gana Sabha
  'UCE5dTxYYk-zRi7i8q7F9OZg',  // Narada Gana Sabha
  'UCLEaUPYUV3qZlHhOM-44R1Q',  // Kartik Fine Arts
  'UCmZlcYYHVjF-0EZ0fj_-B6g',  // Carnatica
  'UCdWghuUa0qb1bgt0fdX6i0w',  // Manorama Music (Carnatic section)
]

// LABELS: major record labels with classic/archival Carnatic recordings
// Critical for deceased artists (M.S. Subbulakshmi, Lalgudi, GNB, etc.)
const LABEL_CHANNEL_IDS = [
  'UCMexzFKFfRqeVtSKQ7vxRNA',  // Saregama Music (largest Carnatic archive)
  'UCx3LGGBiId60_8FEWXV4MKg',  // Sony Music India
  'UC3MLnJtqc_phABBriLRhtgQ',  // Times Music Spiritual
  'UCmMUZbaYdNH0bEd1PAlAqsA',  // Carnatic Music (aggregator channel)
]

const TRUSTED_CHANNEL_IDS = [...SABHA_CHANNEL_IDS, ...LABEL_CHANNEL_IDS]

// ── Types ─────────────────────────────────────────────────────────────────────────────

interface Artist {
  id:                 string
  name:               string
  youtube_channel_id: string | null
  search_aliases:     string[]
  is_deceased:        boolean
  fetch_strategy:     'channel' | 'sabha_search' | 'global_search' | 'skip'
}

interface YouTubeSnippet {
  title:        string
  description:  string
  channelId:    string
  channelTitle: string
  publishedAt:  string
  thumbnails:   { high?: { url: string }; medium?: { url: string }; default?: { url: string } }
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

// ── Helpers ───────────────────────────────────────────────────────────────────────────

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

// Tala patterns for title matching
const TALA_PATTERNS: [string, string[]][] = [
  ['Adi',          ['adi tala', 'adi taala', 'chatusra nadai']],
  ['Rupaka',       ['rupaka', 'roopaka']],
  ['Misra Chapu',  ['misra chapu', 'mishra chapu', 'misrachapu']],
  ['Khanda Chapu', ['khanda chapu', 'kanda chapu']],
  ['Tisra Triputa',['tisra triputa', 'tisra eka']],
  ['Khanda Ata',   ['khanda ata', 'kanda ata']],
]

function guessTala(title: string): string | null {
  const t = title.toLowerCase()
  for (const [canonical, aliases] of TALA_PATTERNS) {
    for (const alias of aliases) {
      if (t.includes(alias)) return canonical
    }
  }
  return null
}

// Raga patterns for title matching
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
  ['Punnagavarali',     ['punnagavarali']],
  ['Suddha Saveri',     ['suddha saveri', 'shuddha saveri']],
  ['Sahana',            ['sahana']],
  ['Kapi',              ['kapi']],
  ['Khamas',            ['khamas', 'khamaas']],
  ['Devagandhari',      ['devagandhari']],
  ['Brindavana Saranga',['brindavana saranga', 'vrindavana sarang']],
  ['Hindolam',          ['hindolam', 'hindola']],
  ['Nayaki',            ['nayaki']],
  ['Gamanasrama',       ['gamanasrama']],
  ['Darbari Kanada',    ['darbari kanada']],
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

// ── Core: upsert a batch of YouTube search items into DB ──────────────────────────────

async function upsertVideos(
  items: YouTubeSearchItem[],
  artistId: string,
  artistName: string,
  supabase: ReturnType<typeof createClient>
): Promise<number> {
  if (items.length === 0) return 0

  // Batch fetch video details (duration + views) — 1 unit for all
  const videoIds = items.map((v) => v.id.videoId).join(',')
  const detailsParams = new URLSearchParams({
    part: 'contentDetails,statistics',
    id:   videoIds,
    key:  YOUTUBE_API_KEY,
  })
  const detailsRes  = await fetch(`${YOUTUBE_BASE_URL}/videos?${detailsParams}`)
  const detailsData = await detailsRes.json()
  const detailsMap: Record<string, YouTubeVideoDetails> = {}
  ;(detailsData.items || []).forEach((d: YouTubeVideoDetails) => {
    detailsMap[d.id] = d
  })

  let added = 0
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
      artist_id:        artistId,
      artist_name:      artistName,
      raga:             guessRaga(snippet.title),
      tala:             guessTala(snippet.title),
      video_type:       guessVideoType(snippet.title),
      is_visible:       true,
      fetched_at:       new Date().toISOString(),
    }, { onConflict: 'youtube_video_id' })

    if (!error) added++
    else console.error(`Failed to upsert ${vid}: ${error.message}`)
  }
  return added
}

// ── Tier 1: fetch from artist's own channel ───────────────────────────────────────────

async function fetchByChannel(
  artist: Artist,
  publishedAfter: string | null,
  supabase: ReturnType<typeof createClient>
): Promise<{ found: number; added: number; units: number; error?: string }> {
  const paramsObj: Record<string, string> = {
    part:       'snippet',
    type:       'video',
    channelId:  artist.youtube_channel_id!,
    maxResults: String(MAX_RESULTS),
    order:      'date',
    key:        YOUTUBE_API_KEY,
  }
  if (publishedAfter) paramsObj.publishedAfter = publishedAfter

  const searchRes = await fetch(`${YOUTUBE_BASE_URL}/search?${new URLSearchParams(paramsObj)}`)
  const units = 101  // 100 search + 1 details

  if (!searchRes.ok) {
    const errText = await searchRes.text()
    return { found: 0, added: 0, units: 100, error: `${searchRes.status}: ${errText.slice(0, 200)}` }
  }

  const items: YouTubeSearchItem[] = (await searchRes.json()).items || []
  const added = await upsertVideos(items, artist.id, artist.name, supabase)
  return { found: items.length, added, units }
}

// ── Tier 2: search by artist name across trusted channels ─────────────────────────────

async function fetchByNameSearch(
  artist: Artist,
  publishedAfter: string | null,
  supabase: ReturnType<typeof createClient>
): Promise<{ found: number; added: number; units: number; error?: string }> {
  let totalFound = 0, totalAdded = 0, totalUnits = 0

  // Search for this artist in each trusted channel
  // We only need a few — sabhas post the most relevant content
  const channelsToSearch = TRUSTED_CHANNEL_IDS.slice(0, 4) // limit to save quota

  for (const channelId of channelsToSearch) {
    const paramsObj: Record<string, string> = {
      part:       'snippet',
      type:       'video',
      channelId,
      q:          artist.name,               // search by artist name within channel
      maxResults: '10',                      // fewer per channel to save quota
      order:      'relevance',
      key:        YOUTUBE_API_KEY,
    }
    if (publishedAfter) paramsObj.publishedAfter = publishedAfter

    const searchRes = await fetch(`${YOUTUBE_BASE_URL}/search?${new URLSearchParams(paramsObj)}`)
    totalUnits += 101

    if (!searchRes.ok) continue

    const items: YouTubeSearchItem[] = (await searchRes.json()).items || []
    if (items.length === 0) continue

    // Filter: only keep videos where title/description actually mentions artist
    const relevant = items.filter(item => {
      const combined = (item.snippet.title + ' ' + item.snippet.description).toLowerCase()
      const nameParts = artist.name.toLowerCase().split(/[\s.]+/).filter(p => p.length > 2)
      return nameParts.some(part => combined.includes(part))
    })

    const added = await upsertVideos(relevant, artist.id, artist.name, supabase)
    totalFound += relevant.length
    totalAdded += added

    await new Promise(r => setTimeout(r, 100))
  }

  return { found: totalFound, added: totalAdded, units: totalUnits }
}

// ── Tier 3: global YouTube search for deceased / archival artists ─────────────────────
// Used for legends like M.S. Subbulakshmi, Lalgudi Jayaraman, GNB, DKP etc.
// Searches globally (no channel restriction) using the artist's name + aliases.
// Strict title-matching ensures we only keep videos actually about the artist.

async function fetchByGlobalSearch(
  artist: Artist,
  publishedAfter: string | null,
  supabase: ReturnType<typeof createClient>
): Promise<{ found: number; added: number; units: number; error?: string }> {
  let totalFound = 0, totalAdded = 0, totalUnits = 0

  // Build list of search terms: canonical name + aliases
  const searchTerms = [artist.name, ...(artist.search_aliases || [])]
    .slice(0, 3) // cap at 3 to save quota

  for (const term of searchTerms) {
    const paramsObj: Record<string, string> = {
      part:       'snippet',
      type:       'video',
      q:          `${term} carnatic`,  // add "carnatic" to narrow global search
      maxResults: '15',
      order:      'relevance',
      videoCategoryId: '10',  // Music category
      key:        YOUTUBE_API_KEY,
    }
    if (publishedAfter) paramsObj.publishedAfter = publishedAfter

    const searchRes = await fetch(`${YOUTUBE_BASE_URL}/search?${new URLSearchParams(paramsObj)}`)
    totalUnits += 101

    if (!searchRes.ok) continue

    const items: YouTubeSearchItem[] = (await searchRes.json()).items || []
    if (items.length === 0) continue

    // Strict filter: title or description must mention the artist
    // Use all aliases + canonical name parts
    const allTerms = [artist.name, ...(artist.search_aliases || [])]
    const relevant = items.filter(item => {
      const combined = (item.snippet.title + ' ' + item.snippet.description).toLowerCase()
      return allTerms.some(t =>
        t.toLowerCase().split(/[\s.]+/)
          .filter(p => p.length > 2)
          .every(part => combined.includes(part))
      )
    })

    const added = await upsertVideos(relevant, artist.id, artist.name, supabase)
    totalFound += relevant.length
    totalAdded += added

    await new Promise(r => setTimeout(r, 200))
  }

  return { found: totalFound, added: totalAdded, units: totalUnits }
}

// ── Main handler ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const url          = new URL(req.url)
  const daysBack     = parseInt(url.searchParams.get('days') || String(DAYS_BACK))
  const seedMode     = url.searchParams.get('seed') === 'true'
  const artistFilter = url.searchParams.get('artist')

  const publishedAfter = seedMode
    ? null
    : new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

  console.log(seedMode ? 'Seed mode: no date filter' : `Fetching videos after ${publishedAfter}`)

  let artistQuery = supabase
    .from('artists')
    .select('id, name, youtube_channel_id, search_aliases, is_deceased, fetch_strategy')
    .eq('is_active', true)
    .neq('fetch_strategy', 'skip')

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

  const tier1Artists = artists.filter(a => a.fetch_strategy === 'channel' && a.youtube_channel_id)
  const tier2Artists = artists.filter(a => a.fetch_strategy === 'sabha_search')
  const tier3Artists = artists.filter(a => a.fetch_strategy === 'global_search')

  console.log(`T1 (channel): ${tier1Artists.length}, T2 (sabha): ${tier2Artists.length}, T3 (global/deceased): ${tier3Artists.length}`)

  let totalFound = 0, totalAdded = 0, totalUnits = 0
  const results: { artist: string; tier: number; found: number; added: number; error?: string }[] = []

  const runArtist = async (artist: Artist, tier: number, fn: () => Promise<{ found: number; added: number; units: number; error?: string }>) => {
    const result = await fn()
    totalFound += result.found
    totalAdded += result.added
    totalUnits += result.units
    results.push({ artist: artist.name, tier, found: result.found, added: result.added, ...(result.error ? { error: result.error } : {}) })
    await supabase.from('fetch_log').insert({
      artist_id: artist.id, artist_name: artist.name,
      videos_found: result.found, videos_added: result.added,
      api_units_used: result.units, status: result.error ? 'error' : 'success',
    })
    await new Promise(r => setTimeout(r, 150))
  }

  for (const a of tier1Artists) {
    console.log(`[T1] ${a.name}`)
    await runArtist(a as Artist, 1, () => fetchByChannel(a as Artist, publishedAfter, supabase))
  }
  for (const a of tier2Artists) {
    console.log(`[T2] ${a.name}`)
    await runArtist(a as Artist, 2, () => fetchByNameSearch(a as Artist, publishedAfter, supabase))
  }
  for (const a of tier3Artists) {
    console.log(`[T3 - deceased/archival] ${a.name}`)
    await runArtist(a as Artist, 3, () => fetchByGlobalSearch(a as Artist, publishedAfter, supabase))
  }

  const summary = {
    success: true,
    artists: { total: artists.length, tier1: tier1Artists.length, tier2: tier2Artists.length, tier3: tier3Artists.length },
    totalFound, totalAdded,
    quotaUsed: `${totalUnits} / 10000 daily units`,
    results,
  }

  console.log('Done:', JSON.stringify({ totalFound, totalAdded, totalUnits }))

  return new Response(
    JSON.stringify(summary),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
