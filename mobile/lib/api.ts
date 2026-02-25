import { supabase } from './supabase'

const FUNCTIONS_URL = 'https://lyvbiiogdaoeawakoxgf.supabase.co/functions/v1'
const ANON_KEY      = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dmJpaW9nZGFvZWF3YWtveGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTAwMDMsImV4cCI6MjA4NzM4NjAwM30.tBBG-L49gDEz67c9kfzoANogbKr3Bb8hXfwq3iH-iq8'

// ── Types ────────────────────────────────────────────────────────────────────

export interface Video {
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

export interface Artist {
  id:                 string
  name:               string
  instrument:         string | null
  artist_type:        string
  youtube_channel_id: string | null
  book_recommended:   boolean
  is_deceased:        boolean
}

export interface SearchResult {
  videos:        Video[]
  total:         number
  searchSummary: string
  intent:        Record<string, unknown>
}

export interface RecommendResult {
  videos:       Video[]
  total:        number
  reason:       string
  personalised: boolean
  topRagas?:    string[]
  topArtists?:  string[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function authHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  return session ? `Bearer ${session.access_token}` : `Bearer ${ANON_KEY}`
}

// ── Search ───────────────────────────────────────────────────────────────────

export async function searchVideos(
  query: string,
  limit = 20,
  offset = 0
): Promise<SearchResult> {
  // Always use anon key for search — search is public and doesn't need user identity.
  // Using a user JWT here caused 401s after OAuth login due to PKCE token exchange timing.
  const res = await fetch(`${FUNCTIONS_URL}/search`, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query, limit, offset }),
  })
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  return res.json()
}

// ── Recommendations ───────────────────────────────────────────────────────────

export async function getRecommendations(
  limit = 20,
  offset = 0,
  context?: string
): Promise<RecommendResult> {
  // Always use anon key for Authorization — user JWTs cause 401s at the Supabase
  // gateway after PKCE OAuth login (same issue as search). Instead, pass the
  // user ID as a query param so the edge function can personalise without needing
  // to verify a potentially-stale JWT.
  const { data: { user } } = await supabase.auth.getUser()
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (context)  params.set('context', context)
  if (user?.id) params.set('userId',  user.id)
  const res = await fetch(`${FUNCTIONS_URL}/recommend?${params}`, {
    headers: { 'Authorization': `Bearer ${ANON_KEY}` },
  })
  if (!res.ok) throw new Error(`Recommendations failed: ${res.status}`)
  return res.json()
}

// ── Artists ───────────────────────────────────────────────────────────────────

export async function getArtists(): Promise<Artist[]> {
  const { data, error } = await supabase
    .from('artists')
    .select('id, name, instrument, artist_type, youtube_channel_id, book_recommended, is_deceased')
    .eq('is_active', true)
    .order('name')
  if (error) throw new Error(error.message)
  return data || []
}

// ── Videos by artist ──────────────────────────────────────────────────────────

export async function getVideosByArtist(artistId: string, limit = 20, offset = 0): Promise<{ videos: Video[]; total: number }> {
  const { data, error, count } = await supabase
    .from('videos')
    .select('*', { count: 'exact' })
    .eq('artist_id', artistId)
    .eq('is_visible', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw new Error(error.message)
  return { videos: data || [], total: count || 0 }
}

// ── Videos by raga ────────────────────────────────────────────────────────────

export async function getVideosByRaga(raga: string, limit = 20, offset = 0): Promise<{ videos: Video[]; total: number }> {
  const { data, error, count } = await supabase
    .from('videos')
    .select('*', { count: 'exact' })
    .ilike('raga', `%${raga}%`)
    .eq('is_visible', true)
    .order('view_count', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw new Error(error.message)
  return { videos: data || [], total: count || 0 }
}

// ── Ragas list ────────────────────────────────────────────────────────────────

export async function getRagas(): Promise<{ name: string; melakarta_number: number | null; is_popular: boolean }[]> {
  const { data, error } = await supabase
    .from('ragas')
    .select('name, melakarta_number, is_popular')
    .order('is_popular', { ascending: false })
    .order('name')
  if (error) throw new Error(error.message)
  return data || []
}

// ── Record watch ──────────────────────────────────────────────────────────────

export async function recordWatch(videoId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return // anonymous — no history

  await supabase.from('watch_history').upsert({
    user_id:  user.id,
    video_id: videoId,
  }, { onConflict: 'user_id,video_id' })
}

// ── Format helpers ────────────────────────────────────────────────────────────

export function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatViews(views: number | null): string {
  if (!views) return ''
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`
  if (views >= 1_000)     return `${(views / 1_000).toFixed(0)}K views`
  return `${views} views`
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1)   return 'Today'
  if (days < 7)   return `${days}d ago`
  if (days < 30)  return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}
