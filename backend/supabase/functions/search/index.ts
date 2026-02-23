/**
 * Carnatic App -- Search Edge Function
 *
 * POST /functions/v1/search
 * Body: { query: string, limit?: number, offset?: number }
 *
 * Uses Groq (Llama 3.1 8B) to understand natural language queries including:
 *   - Raga names:    "kalyani concert" → filter raga = Kalyani
 *   - Tala names:   "adi tala kriti"  → filter tala = Adi
 *   - Artist names:  "sanjay" → filter artist_name ILIKE %Sanjay%
 *   - Moods:         "melancholic"    → maps to Bhairavi, Sindhubhairavi, etc.
 *   - Instruments:   "violin"         → filter artists by instrument
 *   - Composers:     "tyagaraja"      → filter composer field
 *   - Difficulty:    "beginner"       → filter (future use, for tutorials)
 *   - Free text:     "calm evening"   → keyword fallback on title
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

const GROQ_API_KEY         = Deno.env.get('GROQ_API_KEY')!
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ── Mood → Raga map (Carnatic rasa theory) ────────────────────────────────────────────
// Used by the LLM system prompt — explicitly telling the LLM which ragas match moods
// so it can resolve "I'm in a melancholic mood" without hallucinating.
const MOOD_RAGA_MAP: Record<string, string[]> = {
  // Karuna rasa (compassion / melancholy)
  melancholic:  ['Bhairavi', 'Sindhubhairavi', 'Charukeshi', 'Mukhari', 'Anandabhairavi'],
  sad:          ['Bhairavi', 'Sindhubhairavi', 'Mukhari', 'Saveri'],
  longing:      ['Bhairavi', 'Sindhubhairavi', 'Kapi', 'Abheri'],

  // Shanta rasa (peace / serenity)
  calm:         ['Sahana', 'Kedaragowla', 'Anandabhairavi', 'Hamsadhvani', 'Kalyani'],
  peaceful:     ['Sahana', 'Hamsadhvani', 'Kalyani', 'Kedaragowla'],
  meditative:   ['Karaharapriya', 'Natabhairavi', 'Punnagavarali', 'Kedaragowla'],
  relaxing:     ['Hamsadhvani', 'Kalyani', 'Mohanam', 'Sahana'],

  // Sringara rasa (love / romance)
  romantic:     ['Kapi', 'Khamas', 'Sindhubhairavi', 'Kambhoji'],
  joyful:       ['Hamsadhvani', 'Bilahari', 'Mohanam', 'Kalyani', 'Vasanta'],
  happy:        ['Hamsadhvani', 'Bilahari', 'Mohanam', 'Kalyani'],
  celebratory:  ['Shankarabharanam', 'Kalyani', 'Bilahari', 'Hamsadhvani'],

  // Veera rasa (heroic / energetic)
  energetic:    ['Shankarabharanam', 'Kalyani', 'Charukeshi', 'Kambhoji'],
  uplifting:    ['Kalyani', 'Shankarabharanam', 'Hamsadhvani', 'Bilahari'],
  powerful:     ['Shankarabharanam', 'Kambhoji', 'Athanaa', 'Todi'],

  // Bhakti (devotion)
  devotional:   ['Todi', 'Kambhoji', 'Bhairavi', 'Kedaragowla', 'Sankarabharanam'],
  spiritual:    ['Todi', 'Bhairavi', 'Kalyani', 'Kambhoji'],

  // Time of day
  morning:      ['Bowli', 'Saveri', 'Shankarabharanam', 'Bilahari'],
  evening:      ['Bhairavi', 'Sindhubhairavi', 'Kambhoji', 'Anandabhairavi'],
  night:        ['Sindhubhairavi', 'Kapi', 'Charukeshi', 'Mohanam'],
}

// Flat list of mood keywords for the system prompt
const MOOD_EXAMPLES = Object.entries(MOOD_RAGA_MAP)
  .map(([mood, ragas]) => `"${mood}" → ${ragas.slice(0, 2).join(', ')}`)
  .join('; ')

// ── Types ─────────────────────────────────────────────────────────────────────────────

interface SearchIntent {
  raga:        string | null   // single canonical raga name
  ragas:       string[]        // multiple ragas (from mood resolution)
  tala:        string | null   // e.g. "Adi", "Rupaka"
  artist:      string | null
  video_type:  string | null
  instrument:  string | null
  composer:    string | null
  difficulty:  'beginner' | 'intermediate' | 'advanced' | null
  mood:        string | null   // original mood word if detected
  keywords:    string[]
}

// ── Groq: extract structured intent ──────────────────────────────────────────────────

async function extractSearchIntent(query: string): Promise<SearchIntent> {
  const systemPrompt = `You are a search intent parser for a Carnatic classical music app.
Extract structured search intent and return ONLY valid JSON. No explanation.

Return this exact JSON structure:
{
  "raga":       string or null,
  "ragas":      array of strings (use when mood maps to multiple ragas; else []),
  "tala":       string or null (e.g. "Adi", "Rupaka", "Misra Chapu", "Khanda Chapu"),
  "artist":     string or null,
  "video_type": one of ["concert","tutorial","lecture","kriti","bhajan","thillana","fusion","other"] or null,
  "instrument": string or null (e.g. "violin", "flute", "mridangam", "veena", "ghatam"),
  "composer":   string or null (e.g. "Tyagaraja", "Muthuswami Dikshitar", "Syama Sastri", "Swati Tirunal", "Purandaradasa"),
  "difficulty": one of ["beginner","intermediate","advanced"] or null,
  "mood":       the mood word if the user expresses a mood (e.g. "melancholic"), else null,
  "keywords":   array of remaining search terms (not covered above)
}

MOOD RULES — when a mood/feeling is detected, set "mood" AND populate "ragas" with matching ragas:
${MOOD_EXAMPLES}

RAGA RULES:
- Normalize to title case (e.g. "kalyani" → "Kalyani")
- Common aliases: "sankarabharanam" → "Shankarabharanam", "khamaas" → "Khamas"

TALA RULES:
- "adi" / "chatusra" → "Adi"
- "rupaka" / "roopaka" → "Rupaka"
- "misra chapu" / "mishra" → "Misra Chapu"
- "khanda chapu" → "Khanda Chapu"

ARTIST RULES:
- Normalize to proper case. If first name only and unambiguous, expand:
  "sanjay" → "Sanjay Subrahmanyan", "ms" or "m.s." → "M.S. Subbulakshmi"

VIDEO TYPE RULES:
- "concert" / "performance" / "kutcheri" / "live" → "concert"
- "lesson" / "class" / "learn" / "how to" / "beginner" → "tutorial"
- "lecture" / "masterclass" → "lecture"

EXAMPLES:
Query: "i am feeling melancholic today" → {"raga":null,"ragas":["Bhairavi","Sindhubhairavi","Charukeshi"],"tala":null,"artist":null,"video_type":null,"instrument":null,"composer":null,"difficulty":null,"mood":"melancholic","keywords":[]}
Query: "calm morning music" → {"raga":null,"ragas":["Bowli","Saveri","Shankarabharanam"],"tala":null,"artist":null,"video_type":null,"instrument":null,"composer":null,"difficulty":null,"mood":"morning","keywords":[]}
Query: "sanjay subrahmanyan kalyani concert" → {"raga":"Kalyani","ragas":[],"tala":null,"artist":"Sanjay Subrahmanyan","video_type":"concert","instrument":null,"composer":null,"difficulty":null,"mood":null,"keywords":[]}
Query: "beginner violin tutorial adi tala" → {"raga":null,"ragas":[],"tala":"Adi","artist":null,"video_type":"tutorial","instrument":"violin","composer":null,"difficulty":"beginner","mood":null,"keywords":[]}
Query: "tyagaraja krithi in todi" → {"raga":"Todi","ragas":[],"tala":null,"artist":null,"video_type":"kriti","instrument":null,"composer":"Tyagaraja","difficulty":null,"mood":null,"keywords":[]}
Query: "something peaceful for studying" → {"raga":null,"ragas":["Sahana","Hamsadhvani","Kalyani"],"tala":null,"artist":null,"video_type":null,"instrument":null,"composer":null,"difficulty":null,"mood":"peaceful","keywords":["studying"]}`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:           'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: `Query: "${query}"` },
        ],
        temperature:     0.1,
        max_tokens:      300,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      console.error('Groq error:', res.status)
      return fallbackIntent(query)
    }

    const data    = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return fallbackIntent(query)

    const intent = JSON.parse(content) as SearchIntent
    // Ensure ragas array is always present
    if (!intent.ragas) intent.ragas = []
    return intent
  } catch (err) {
    console.error('Groq parse error:', err)
    return fallbackIntent(query)
  }
}

function fallbackIntent(query: string): SearchIntent {
  return {
    raga: null, ragas: [], tala: null, artist: null,
    video_type: null, instrument: null, composer: null,
    difficulty: null, mood: null,
    keywords: query.trim().split(/\s+/).filter(Boolean),
  }
}

// ── DB Query ──────────────────────────────────────────────────────────────────────────

async function queryVideos(
  intent: SearchIntent,
  limit: number,
  offset: number,
  supabase: ReturnType<typeof createClient>
) {
  let query = supabase
    .from('videos')
    .select(`
      id, youtube_video_id, title, thumbnail_url,
      channel_name, published_at, duration_seconds, view_count,
      raga, tala, composer, artist_name, video_type, artist_id,
      artists ( name, instrument, book_recommended )
    `, { count: 'exact' })
    .eq('is_visible', true)

  // ── Raga filter ──
  // If mood returned multiple ragas, use OR across all of them
  if (intent.ragas && intent.ragas.length > 0) {
    query = query.in('raga', intent.ragas)
  } else if (intent.raga) {
    query = query.ilike('raga', `%${intent.raga}%`)
  }

  // ── Tala filter ──
  if (intent.tala) {
    query = query.ilike('tala', `%${intent.tala}%`)
  }

  // ── Video type ──
  if (intent.video_type) {
    query = query.eq('video_type', intent.video_type)
  }

  // ── Artist name ──
  if (intent.artist) {
    query = query.ilike('artist_name', `%${intent.artist}%`)
  }

  // ── Composer ──
  if (intent.composer) {
    query = query.ilike('composer', `%${intent.composer}%`)
  }

  // ── Keyword fallback ──
  if (intent.keywords.length > 0 && !intent.raga && intent.ragas.length === 0 && !intent.artist) {
    query = query.ilike('title', `%${intent.keywords.join(' ')}%`)
  }

  // ── Instrument: join through artists ──
  if (intent.instrument) {
    const { data: matchedArtists } = await supabase
      .from('artists')
      .select('id')
      .ilike('instrument', `%${intent.instrument}%`)
    if (matchedArtists?.length) {
      query = query.in('artist_id', matchedArtists.map((a: { id: string }) => a.id))
    }
  }

  query = query
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { videos: data || [], total: count || 0 }
}

// ── Main handler ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    const body   = await req.json()
    const query  = body.query?.trim() || ''
    const limit  = Math.min(body.limit  || 20, 50)
    const offset = body.offset || 0

    if (!query) {
      return new Response(JSON.stringify({ error: 'query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const intent   = await extractSearchIntent(query)
    console.log('Intent:', JSON.stringify(intent))

    let { videos, total } = await queryVideos(intent, limit, offset, supabase)

    // Fallback: if no structured results, try plain keyword search
    if (videos.length === 0 && (intent.raga || intent.ragas.length || intent.artist || intent.tala)) {
      console.log('No structured results, falling back to keyword search')
      const fallback = fallbackIntent(query)
      const fb = await queryVideos(fallback, limit, offset, supabase)
      videos = fb.videos
      total  = fb.total
    }

    // Build a human-readable description of what we searched for
    const searchSummary = buildSummary(intent)

    return new Response(
      JSON.stringify({ videos, total, intent, query, searchSummary, limit, offset }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Search error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

// Build a short human-readable string for the app to display
// e.g. "Showing: melancholic mood (Bhairavi, Sindhubhairavi) · Sanjay Subrahmanyan"
function buildSummary(intent: SearchIntent): string {
  const parts: string[] = []
  if (intent.mood) {
    const ragaStr = intent.ragas.length ? ` (${intent.ragas.slice(0, 3).join(', ')})` : ''
    parts.push(`${intent.mood} mood${ragaStr}`)
  } else if (intent.raga) {
    parts.push(`Raga: ${intent.raga}`)
  }
  if (intent.tala)       parts.push(`Tala: ${intent.tala}`)
  if (intent.artist)     parts.push(intent.artist)
  if (intent.instrument) parts.push(intent.instrument)
  if (intent.composer)   parts.push(`Composer: ${intent.composer}`)
  if (intent.video_type) parts.push(intent.video_type)
  if (intent.keywords.length) parts.push(intent.keywords.join(' '))
  return parts.length ? parts.join(' · ') : 'All videos'
}
