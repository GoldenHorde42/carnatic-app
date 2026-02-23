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

// ── Deterministic pre-parser: handles known artists & mood keywords without LLM ───────
// Much faster and 100% reliable for common queries. Groq only runs for complex ones.

const KNOWN_ARTIST_PATTERNS: [string, string][] = [
  ['ranjani gayatri',     'Ranjani & Gayatri'],
  ['ranjani and gayatri', 'Ranjani & Gayatri'],
  ['bombay jayashri',     'Bombay Jayashri'],
  ['sanjay subrahmanyan', 'Sanjay Subrahmanyan'],
  ['sanjay subrahmanyam', 'Sanjay Subrahmanyan'],
  ['tm krishna',          'T.M. Krishna'],
  ['t.m. krishna',        'T.M. Krishna'],
  ['t m krishna',         'T.M. Krishna'],
  ['unnikrishnan',        'Unnikrishnan'],
  ['p unnikrishnan',      'Unnikrishnan'],
  ['ms subbulakshmi',     'M.S. Subbulakshmi'],
  ['m.s. subbulakshmi',   'M.S. Subbulakshmi'],
  ['m.s subbulakshmi',    'M.S. Subbulakshmi'],
  ['sudha raghunathan',   'Sudha Raghunathan'],
  ['nithyashree mahadevan', 'Nithyashree Mahadevan'],
  ['nithyashree',         'Nithyashree Mahadevan'],
  ['aruna sairam',        'Aruna Sairam'],
  ['vijay siva',          'Vijay Siva'],
  ['abhishek raghuram',   'Abhishek Raghuram'],
  ['ambi subramaniam',    'Ambi Subramaniam'],
  ['l subramaniam',       'L. Subramaniam'],
  ['dr l subramaniam',    'L. Subramaniam'],
  ['lalgudi jayaraman',   'Lalgudi Jayaraman'],
  ['r.k. srikantan',      'R.K. Srikantan'],
  ['rk srikantan',        'R.K. Srikantan'],
  ['m.s. gopalakrishnan', 'M.S. Gopalakrishnan'],
  ['ms gopalakrishnan',   'M.S. Gopalakrishnan'],
  ['sowmya',              'Sowmya'],
  ['neyveli santhanagopalan', 'Neyveli Santhanagopalan'],
  ['music academy',       'Music Academy Chennai'],
  ['kartik fine arts',    'Kartik Fine Arts'],
]

function tryQuickParse(query: string): SearchIntent | null {
  const q = query.toLowerCase().trim()

  // 1. Mood keywords — check BEFORE artist names so "calm aruna sairam" still works
  for (const [mood, ragas] of Object.entries(MOOD_RAGA_MAP)) {
    // Match the mood word as a whole word (surrounded by space/punctuation/start/end)
    const regex = new RegExp(`(^|\\s|,)${mood}(\\s|,|$|\\.|!)`, 'i')
    if (regex.test(q)) {
      // Check if there's also an artist in the query
      for (const [pattern, canonicalName] of KNOWN_ARTIST_PATTERNS) {
        if (q.includes(pattern)) {
          return { raga: null, ragas, tala: null, artist: canonicalName,
                   video_type: null, instrument: null, composer: null,
                   difficulty: null, mood, keywords: [] }
        }
      }
      return { raga: null, ragas, tala: null, artist: null,
               video_type: null, instrument: null, composer: null,
               difficulty: null, mood, keywords: [] }
    }
  }

  // 2. Known artist names (exact lowercase substring)
  for (const [pattern, canonicalName] of KNOWN_ARTIST_PATTERNS) {
    if (q.includes(pattern)) {
      return { raga: null, ragas: [], tala: null, artist: canonicalName,
               video_type: null, instrument: null, composer: null,
               difficulty: null, mood: null, keywords: [] }
    }
  }

  return null // Complex query — let Groq handle it
}

// ── Groq: extract structured intent ──────────────────────────────────────────────────

async function extractSearchIntent(query: string): Promise<SearchIntent> {
  // Fast path: deterministic pre-parser for known artists & moods
  const quick = tryQuickParse(query)
  if (quick) {
    console.log('Pre-parser hit:', JSON.stringify(quick))
    return quick
  }
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
- Known Carnatic artists — ALWAYS treat these as artist names, never as raga names:
  "ranjani gayatri" / "ranjani and gayatri" → artist: "Ranjani & Gayatri"  (sister duo, NOT the raga Ranjani)
  "bombay jayashri" / "jayashri" → artist: "Bombay Jayashri"
  "vijay siva" → artist: "Vijay Siva"
  "sudha raghunathan" / "sudha" → artist: "Sudha Raghunathan"
  "nithyashree" → artist: "Nithyashree Mahadevan"
  "aruna sairam" / "aruna" → artist: "Aruna Sairam"
  "unnikrishnan" → artist: "Unnikrishnan"
  "tm krishna" / "t.m. krishna" → artist: "T.M. Krishna"
  "ambi subramaniam" / "ambi" → artist: "Ambi Subramaniam"
  "l subramaniam" → artist: "L. Subramaniam"
- If a word could be BOTH a raga AND an artist (e.g. "Ranjani", "Saveri", "Vasanta"), and it appears with another person’s name, prefer artist.

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
Query: "ranjani gayatri" → {"raga":null,"ragas":[],"tala":null,"artist":"Ranjani & Gayatri","video_type":null,"instrument":null,"composer":null,"difficulty":null,"mood":null,"keywords":[]}
Query: "bombay jayashri concert" → {"raga":null,"ragas":[],"tala":null,"artist":"Bombay Jayashri","video_type":"concert","instrument":null,"composer":null,"difficulty":null,"mood":null,"keywords":[]}
Query: "something peaceful for studying" → {"raga":null,"ragas":["Sahana","Hamsadhvani","Kalyani"],"tala":null,"artist":null,"video_type":null,"instrument":null,"composer":null,"difficulty":null,"mood":"peaceful","keywords":["studying"]}`

  // Retry up to 2 times with 600 ms gap — Groq 8B is fast but occasionally times out
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000) // 5 s per attempt

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          model:           'llama-3.3-70b-versatile',   // upgraded to 70B on dev account
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: `Query: "${query}"` },
          ],
          temperature:     0.1,
          max_tokens:      300,
          response_format: { type: 'json_object' },
        }),
      })
      clearTimeout(timeout)

      if (!res.ok) {
        console.error(`Groq attempt ${attempt} error:`, res.status)
        if (attempt < 2) { await new Promise(r => setTimeout(r, 600)); continue }
        return fallbackIntent(query)
      }

      const data    = await res.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 600)); continue }
        return fallbackIntent(query)
      }

      const intent = JSON.parse(content) as SearchIntent
      if (!intent.ragas) intent.ragas = []
      return intent
    } catch (err) {
      console.error(`Groq attempt ${attempt} error:`, err)
      if (attempt < 2) { await new Promise(r => setTimeout(r, 600)); continue }
      return fallbackIntent(query)
    }
  }
  return fallbackIntent(query)
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

  // NOTE: video_type filter intentionally omitted — most videos have video_type=null
  // so filtering by it eliminates valid results. Add back once we have richer metadata.

  // ── Artist name ──
  // Use plain .ilike() — NOT .or() — because PostgREST's or() filter string
  // treats '.' as a syntax separator, silently breaking names like "T.M. Krishna".
  if (intent.artist) {
    query = query.ilike('artist_name', `%${intent.artist}%`)
  }

  // ── Composer ──
  if (intent.composer) {
    query = query.ilike('composer', `%${intent.composer}%`)
  }

  // ── Keyword fallback: search each keyword individually against title + artist_name ──
  if (intent.keywords.length > 0 && !intent.raga && intent.ragas.length === 0 && !intent.artist) {
    // Use the most-specific keyword (longest word) to avoid overly broad matches
    const kw = intent.keywords.reduce((a, b) => (b.length > a.length ? b : a), intent.keywords[0])
    const safe = kw.replace(/%/g, '\\%').replace(/_/g, '\\_')
    query = query.or(`title.ilike.%${safe}%,artist_name.ilike.%${safe}%`)
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
    // Sort by popularity first so best content surfaces on top
    .order('view_count', { ascending: false, nullsFirst: false })
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

    // Fallback: if no structured results, try a broad OR search across title + artist_name
    if (videos.length === 0) {
      console.log('No structured results, running broad fallback search')

      // Special case: mood search → try matching raga names in video TITLES
      // (most videos don't have raga column tagged, but many have raga names in title)
      if (intent.mood && intent.ragas.length > 0) {
        console.log('Mood fallback: searching raga names in titles')
        // Build OR filter: title ILIKE '%Bhairavi%' OR title ILIKE '%Sindhubhairavi%' etc.
        const ragaFilter = intent.ragas
          .map(r => `title.ilike.%${r}%`)
          .join(',')
        const { data: moodData, error: moodErr, count: moodCount } = await supabase
          .from('videos')
          .select(`
            id, youtube_video_id, title, thumbnail_url,
            channel_name, published_at, duration_seconds, view_count,
            raga, tala, composer, artist_name, video_type, artist_id,
            artists ( name, instrument, book_recommended )
          `, { count: 'exact' })
          .eq('is_visible', true)
          .or(ragaFilter)
          .order('view_count', { ascending: false, nullsFirst: false })
          .range(offset, offset + limit - 1)
        if (!moodErr && moodData && moodData.length > 0) {
          videos = moodData
          total  = moodCount || 0
        }
      }

      // If still 0 results: broad keyword/term search across title + artist_name
      if (videos.length === 0) {
        // Collect all meaningful terms: artist, raga, composer, keywords
        const terms = [
          ...(intent.artist   ? intent.artist.split(/\s+/)   : []),
          ...(intent.raga     ? [intent.raga]                : []),
          ...(intent.ragas    || []),
          ...(intent.composer ? intent.composer.split(/\s+/) : []),
          ...intent.keywords,
        ].filter(w => w.length > 2) // skip very short words

      if (terms.length > 0) {
        // Use the longest/most-specific term for the broad search
        const bestTerm = terms.reduce((a, b) => (b.length > a.length ? b : a), terms[0])
        const safe = bestTerm.replace(/%/g, '\\%').replace(/_/g, '\\_')
        const { data: fbData, error: fbError, count: fbCount } = await supabase
          .from('videos')
          .select(`
            id, youtube_video_id, title, thumbnail_url,
            channel_name, published_at, duration_seconds, view_count,
            raga, tala, composer, artist_name, video_type, artist_id,
            artists ( name, instrument, book_recommended )
          `, { count: 'exact' })
          .eq('is_visible', true)
          .or(`title.ilike.%${safe}%,artist_name.ilike.%${safe}%`)
          .order('view_count', { ascending: false, nullsFirst: false })
          .order('published_at', { ascending: false })
          .range(offset, offset + limit - 1)
        if (!fbError) {
          videos = fbData || []
          total  = fbCount || 0
        }
      }
    }
    } // end outer if (videos.length === 0)

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
