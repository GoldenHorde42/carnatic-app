/**
 * Carnatic App -- Recommend Edge Function
 *
 * GET /functions/v1/recommend
 *
 * Returns personalised video recommendations.
 *
 * For authenticated users:
 *   - Analyses watch_history to find their top ragas and artists
 *   - Returns unwatched videos matching those preferences
 *   - Falls back to popular videos if history is thin (<3 items)
 *
 * For anonymous users (no Authorization header or no user):
 *   - Returns most-viewed recent videos
 *
 * Query params:
 *   ?limit=N      (default 20, max 50)
 *   ?offset=N     (default 0)
 *   ?context=raga:Kalyani  override: "I want more of this raga"
 *   ?context=artist:Sanjay override: "more from this artist"
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY    = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

// ── Types ─────────────────────────────────────────────────────────────────────────────

interface WatchHistoryRow {
  youtube_video_id: string
  raga:             string | null
  artist_name:      string | null
  watch_count:      number
}

interface VideoRow {
  id:               string
  youtube_video_id: string
  title:            string
  thumbnail_url:    string | null
  channel_name:     string
  published_at:     string
  duration_seconds: number | null
  view_count:       number | null
  raga:             string | null
  tala:             string | null
  artist_name:      string
  video_type:       string
  artist_id:        string
}

// ── Helpers ───────────────────────────────────────────────────────────────────────────

// Count occurrences and return top N items
function topN<T extends string>(items: (T | null)[], n: number): T[] {
  const counts: Record<string, number> = {}
  for (const item of items) {
    if (item) counts[item] = (counts[item] || 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key]) => key as T)
}

// ── Anonymous recommendations ─────────────────────────────────────────────────────────
// Returns the most-viewed recent videos from book_recommended artists
async function anonymousRecommendations(
  limit: number,
  offset: number,
  context: string | null,
  serviceClient: ReturnType<typeof createClient>
): Promise<{ videos: VideoRow[]; total: number; reason: string }> {
  let query = serviceClient
    .from('videos')
    .select('*, artists!inner(book_recommended)', { count: 'exact' })
    .eq('is_visible', true)
    .eq('artists.book_recommended', true)

  // Context override
  if (context?.startsWith('raga:')) {
    query = query.ilike('raga', `%${context.slice(5)}%`)
  } else if (context?.startsWith('artist:')) {
    query = query.ilike('artist_name', `%${context.slice(7)}%`)
  }

  const { data, error, count } = await query
    .order('view_count', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)
  return {
    videos: (data || []) as VideoRow[],
    total:  count || 0,
    reason: context ? `Popular videos · ${context}` : 'Most-watched from curated artists',
  }
}

// ── Personalised recommendations ──────────────────────────────────────────────────────
async function personalisedRecommendations(
  userId: string,
  limit: number,
  offset: number,
  context: string | null,
  serviceClient: ReturnType<typeof createClient>
): Promise<{ videos: VideoRow[]; total: number; reason: string; topRagas: string[]; topArtists: string[] }> {
  // 1. Fetch user's watch history (last 100 views)
  const { data: history, error: histErr } = await serviceClient
    .from('watch_history')
    .select('youtube_video_id, raga, artist_name, watch_count')
    .eq('user_id', userId)
    .order('last_watched_at', { ascending: false })
    .limit(100)

  if (histErr) throw new Error(histErr.message)

  const rows = (history || []) as WatchHistoryRow[]

  // If very little history, fall back to anonymous recs
  if (rows.length < 3) {
    const anon = await anonymousRecommendations(limit, offset, context, serviceClient)
    return {
      ...anon,
      reason: 'Popular picks — watch more to personalise',
      topRagas: [],
      topArtists: [],
    }
  }

  // 2. Derive preferences
  const watchedIds   = new Set(rows.map(r => r.youtube_video_id))
  const topRagas     = topN(rows.map(r => r.raga),        3)
  const topArtists   = topN(rows.map(r => r.artist_name), 3)

  // Context override takes precedence
  let filterRagas   = topRagas
  let filterArtists = topArtists
  let reason        = ''

  if (context?.startsWith('raga:')) {
    filterRagas   = [context.slice(5)]
    filterArtists = []
    reason        = `More of raga: ${filterRagas[0]}`
  } else if (context?.startsWith('artist:')) {
    filterArtists = [context.slice(7)]
    filterRagas   = []
    reason        = `More from: ${filterArtists[0]}`
  } else {
    reason = buildPersonalReason(topRagas, topArtists)
  }

  // 3. Query videos matching preferences, excluding already-watched
  // Strategy: OR(raga IN topRagas, artist IN topArtists)
  // Supabase does not support OR across different columns directly,
  // so we run two queries and merge + deduplicate.
  // IMPORTANT: do NOT share a single queryBase object — Supabase query builders
  // are mutable (.in() modifies in place), so each promise needs its own builder.

  const ragaPromise = filterRagas.length
    ? serviceClient.from('videos').select('*').eq('is_visible', true)
        .in('raga', filterRagas).order('published_at', { ascending: false }).limit(limit * 2)
    : Promise.resolve({ data: [], count: 0, error: null })

  const artistPromise = filterArtists.length
    ? serviceClient.from('videos').select('*').eq('is_visible', true)
        .in('artist_name', filterArtists).order('published_at', { ascending: false }).limit(limit * 2)
    : Promise.resolve({ data: [], count: 0, error: null })

  const [ragaRes, artistRes] = await Promise.all([ragaPromise, artistPromise])

  // Merge, deduplicate, exclude watched
  const seen  = new Set<string>()
  const merged: VideoRow[] = []
  for (const video of [...(ragaRes.data || []), ...(artistRes.data || [])]) {
    const v = video as VideoRow
    if (!seen.has(v.youtube_video_id) && !watchedIds.has(v.youtube_video_id)) {
      seen.add(v.youtube_video_id)
      merged.push(v)
    }
  }

  // Interleave raga and artist results for variety
  merged.sort((a, b) => {
    const aScore = (filterRagas.includes(a.raga || '') ? 2 : 0) +
                   (filterArtists.includes(a.artist_name) ? 1 : 0)
    const bScore = (filterRagas.includes(b.raga || '') ? 2 : 0) +
                   (filterArtists.includes(b.artist_name) ? 1 : 0)
    return bScore - aScore
  })

  const paginated = merged.slice(offset, offset + limit)

  // If personalised results are thin, pad with popular
  if (paginated.length < limit / 2) {
    const anon = await anonymousRecommendations(limit - paginated.length, 0, null, serviceClient)
    const combined = [
      ...paginated,
      ...anon.videos.filter(v => !seen.has(v.youtube_video_id)),
    ].slice(0, limit)
    return { videos: combined, total: combined.length, reason: reason + ' · topped with popular', topRagas, topArtists }
  }

  return { videos: paginated, total: merged.length, reason, topRagas, topArtists }
}

function buildPersonalReason(topRagas: string[], topArtists: string[]): string {
  const parts: string[] = []
  if (topRagas.length)   parts.push(`ragas you love: ${topRagas.join(', ')}`)
  if (topArtists.length) parts.push(`artists you follow: ${topArtists.join(', ')}`)
  return parts.length ? `Based on ${parts.join(' · ')}` : 'Personalised for you'
}

// ── Main handler ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url     = new URL(req.url)
    const limit   = Math.min(parseInt(url.searchParams.get('limit')  || '20'), 50)
    const offset  = parseInt(url.searchParams.get('offset') || '0')
    const context = url.searchParams.get('context') // e.g. "raga:Kalyani"

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Determine if user is authenticated
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      // Use anon client to verify the JWT and get user
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: { user } } = await userClient.auth.getUser()
      if (user) userId = user.id
    }

    if (userId) {
      // Authenticated path — try personalised, fall back to popular on any error
      try {
        const result = await personalisedRecommendations(userId, limit, offset, context, serviceClient)
        return new Response(
          JSON.stringify({ ...result, personalised: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (personalisedErr) {
        console.error('Personalised recs failed, falling back to popular:', personalisedErr)
        const result = await anonymousRecommendations(limit, offset, context, serviceClient)
        return new Response(
          JSON.stringify({ ...result, personalised: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // Anonymous path
      const result = await anonymousRecommendations(limit, offset, context, serviceClient)
      return new Response(
        JSON.stringify({ ...result, personalised: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (err) {
    console.error('Recommend error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
