/**
 * Carnatic App -- Search Edge Function
 * 
 * Endpoint: POST /functions/v1/search
 * 
 * Takes a plain-text search query from the user, uses Groq (Llama 3.1 8B)
 * to extract structured search intent, then queries the Supabase DB.
 * 
 * Request body:
 *   { query: string, limit?: number, offset?: number }
 * 
 * Response:
 *   { videos: Video[], total: number, intent: SearchIntent }
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

// ── Environment variables (set in Supabase dashboard -> Edge Functions -> Secrets) ──
const GROQ_API_KEY          = Deno.env.get('GROQ_API_KEY')!
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ── Types ────────────────────────────────────────────────────────────────────────────

interface SearchIntent {
  raga:        string | null
  artist:      string | null
  video_type:  string | null
  instrument:  string | null
  composer:    string | null
  difficulty:  'beginner' | 'intermediate' | 'advanced' | null
  keywords:    string[]
}

// ── Groq: Extract search intent from plain-text query ────────────────────────────────

async function extractSearchIntent(query: string): Promise<SearchIntent> {
  const systemPrompt = `You are a search intent parser for a Carnatic classical music app.
Extract structured search intent from user queries and return ONLY valid JSON with no explanation.

Return this exact JSON structure:
{
  "raga":       string or null,
  "artist":     string or null,
  "video_type": one of ["concert","tutorial","lecture","kriti","bhajan","thillana","fusion","other"] or null,
  "instrument": string or null (e.g. "violin", "flute", "mridangam", "veena"),
  "composer":   string or null (e.g. "Tyagaraja", "Dikshitar", "Syama Sastri", "Swati Tirunal"),
  "difficulty": one of ["beginner","intermediate","advanced"] or null,
  "keywords":   array of remaining search terms
}

Rules:
- Normalize raga names to title case (e.g. "kalyani" -> "Kalyani")
- Normalize artist names to proper case (e.g. "sanjay" -> "Sanjay Subrahmanyan" if unambiguous)
- "easy" / "simple" / "basic" = beginner difficulty
- "hard" / "complex" / "advanced" = advanced difficulty
- "concert" / "performance" / "kutcheri" / "live" = video_type concert
- "lesson" / "class" / "learn" / "how to" = video_type tutorial
- Return empty array [] for keywords if nothing remains

Examples:
Query: "beginner kalyani kriti" -> {"raga":"Kalyani","artist":null,"video_type":"kriti","instrument":null,"composer":null,"difficulty":"beginner","keywords":[]}
Query: "sanjay subrahmanyan concert bhairavi" -> {"raga":"Bhairavi","artist":"Sanjay Subrahmanyan","video_type":"concert","instrument":null,"composer":null,"difficulty":null,"keywords":[]}
Query: "violin shankarabharanam" -> {"raga":"Shankarabharanam","artist":null,"video_type":null,"instrument":"violin","composer":null,"difficulty":null,"keywords":[]}
Query: "tyagaraja krithi in mohanam" -> {"raga":"Mohanam","artist":null,"video_type":"kriti","instrument":null,"composer":"Tyagaraja","difficulty":null,"keywords":[]}
Query: "something calm and meditative" -> {"raga":null,"artist":null,"video_type":null,"instrument":null,"composer":null,"difficulty":null,"keywords":["calm","meditative"]}
Query: "ms subbulakshmi" -> {"raga":null,"artist":"M.S. Subbulakshmi","video_type":null,"instrument":null,"composer":null,"difficulty":null,"keywords":[]}`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: `Query: "${query}"` },
        ],
        temperature: 0.1,      // low temp for consistent structured output
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text())
      return fallbackIntent(query)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return fallbackIntent(query)

    const intent = JSON.parse(content) as SearchIntent
    return intent
  } catch (err) {
    console.error('Failed to parse Groq response:', err)
    return fallbackIntent(query)
  }
}

/** If Groq fails, treat the whole query as a keyword search */
function fallbackIntent(query: string): SearchIntent {
  return {
    raga:       null,
    artist:     null,
    video_type: null,
    instrument: null,
    composer:   null,
    difficulty: null,
    keywords:   query.trim().split(/\s+/).filter(Boolean),
  }
}

// ── DB Query: Build and execute Supabase query from intent ──────────────────────────

async function queryVideos(
  intent: SearchIntent,
  limit: number,
  offset: number,
  supabase: ReturnType<typeof createClient>
) {
  let query = supabase
    .from('videos')
    .select(`
      id,
      youtube_video_id,
      title,
      thumbnail_url,
      channel_name,
      published_at,
      duration_seconds,
      view_count,
      raga,
      tala,
      composer,
      artist_name,
      video_type,
      artist_id,
      artists (
        name,
        instrument,
        book_recommended
      )
    `, { count: 'exact' })
    .eq('is_visible', true)

  // -- Structured filters from LLM intent --

  if (intent.raga) {
    // Case-insensitive raga match
    query = query.ilike('raga', `%${intent.raga}%`)
  }

  if (intent.video_type) {
    query = query.eq('video_type', intent.video_type)
  }

  if (intent.artist) {
    query = query.ilike('artist_name', `%${intent.artist}%`)
  }

  if (intent.composer) {
    query = query.ilike('composer', `%${intent.composer}%`)
  }

  // -- Keyword fallback: search in title --
  if (intent.keywords.length > 0 && !intent.raga && !intent.artist) {
    const keywordStr = intent.keywords.join(' ')
    query = query.ilike('title', `%${keywordStr}%`)
  }

  // -- Instrument filter: join through artists table --
  if (intent.instrument) {
    // Get artist IDs with this instrument first
    const { data: artistsWithInstrument } = await supabase
      .from('artists')
      .select('id')
      .ilike('instrument', `%${intent.instrument}%`)

    if (artistsWithInstrument && artistsWithInstrument.length > 0) {
      const ids = artistsWithInstrument.map((a: { id: string }) => a.id)
      query = query.in('artist_id', ids)
    }
  }

  // -- Sort: most recent first --
  query = query
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('DB query error:', error)
    throw new Error(error.message)
  }

  return { videos: data || [], total: count || 0 }
}

// ── Main handler ─────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS headers -- required for mobile app calls
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json()
    const query:  string = body.query?.trim() || ''
    const limit:  number = Math.min(body.limit  || 20, 50) // max 50 per page
    const offset: number = body.offset || 0

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Step 1: Extract structured intent from query using Groq
    const intent = await extractSearchIntent(query)
    console.log('Search intent:', JSON.stringify(intent))

    // Step 2: Query DB with structured filters
    const { videos, total } = await queryVideos(intent, limit, offset, supabase)

    // Step 3: If no results with strict filters, fall back to title keyword search
    let finalVideos = videos
    let finalTotal  = total

    if (videos.length === 0 && (intent.raga || intent.artist || intent.video_type)) {
      console.log('No results with filters, falling back to keyword search')
      const fallback = fallbackIntent(query)
      const fallbackResult = await queryVideos(fallback, limit, offset, supabase)
      finalVideos = fallbackResult.videos
      finalTotal  = fallbackResult.total
    }

    return new Response(
      JSON.stringify({
        videos:  finalVideos,
        total:   finalTotal,
        intent,               // send intent back so app can show "Searching for: Kalyani"
        query,
        limit,
        offset,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('Search function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
