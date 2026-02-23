/**
 * Carnatic App — YouTube Video Fetch Script
 * 
 * Fetches new Carnatic music videos from YouTube for all active artists
 * in the database and stores them in the videos table.
 * 
 * Run manually:   npx ts-node fetch-videos.ts
 * Run via cron:   Set up in Supabase pg_cron or as a Supabase Edge Function
 * 
 * Quota usage: ~100 units per artist search (YouTube Data API v3)
 */

import { createClient } from '@supabase/supabase-js';

// ── Config ──────────────────────────────────────────────────
const SUPABASE_URL      = process.env.SUPABASE_URL!;
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY!; // needs service role to bypass RLS
const YOUTUBE_API_KEY   = process.env.YOUTUBE_API_KEY!;
const YOUTUBE_BASE_URL  = 'https://www.googleapis.com/youtube/v3';

// How many days back to look for new videos (keep low to save quota)
const DAYS_BACK = 2;

// Max results per artist search
const MAX_RESULTS = 25;

// ── Types ────────────────────────────────────────────────────
interface Artist {
  id: string;
  name: string;
  youtube_channel_id: string | null;
  channel_name: string | null;
}

interface YouTubeVideo {
  kind: string;
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
}

interface VideoDetails {
  id: string;
  contentDetails: { duration: string }; // ISO 8601 e.g. PT4M13S
  statistics: { viewCount: string };
}

// ── Helpers ──────────────────────────────────────────────────

/** Convert ISO 8601 duration (PT4M13S) to seconds */
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h = '0', m = '0', s = '0'] = match;
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
}

/** Guess video type from title keywords */
function guessVideoType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('concert') || t.includes('kutcheri') || t.includes('full concert')) return 'concert';
  if (t.includes('lecture') || t.includes('masterclass') || t.includes('class')) return 'lecture';
  if (t.includes('tutorial') || t.includes('lesson') || t.includes('learn')) return 'tutorial';
  if (t.includes('bhajan') || t.includes('devotional')) return 'bhajan';
  if (t.includes('thillana')) return 'thillana';
  if (t.includes('kriti') || t.includes('krithi')) return 'kriti';
  if (t.includes('fusion')) return 'fusion';
  return 'other';
}

/**
 * Guess raga from video title.
 * Uses comprehensive list from teacher's book:
 *   - Appendix B (popular janya ragas)
 *   - All 72 Melakartas
 *   - Common aliases / alternate spellings
 * Returns the canonical name if found, else null.
 */
function guessRaga(title: string): string | null {
  // Each entry: [canonical name, ...search terms / aliases]
  const RAGA_LIST: [string, ...string[]][] = [
    // ── Popular Janya Ragas (Appendix B) ────────────────────
    ['Abheri',            'abheri', 'abhiri'],
    ['Abhogi',            'abhogi'],
    ['Ahiri',             'ahiri'],
    ['Amrtavarshini',     'amrtavarshini', 'amritavarshini', 'amrutavarshini'],
    ['Athanaa',           'athanaa', 'athana'],
    ['Behag',             'behag', 'behaga'],
    ['Bilahari',          'bilahari'],
    ['Bindhumalini',      'bindhumalini', 'bindumalini'],
    ['Bowli',             'bowli'],
    ['Darbar',            'darbar', 'durbar'],
    ['Devagandhari',      'devagandhari'],
    ['Hamsadhvani',       'hamsadhvani', 'hamsadhwani'],
    ['Huseni',            'huseni', 'husaini'],
    ['Jaganmohini',       'jaganmohini'],
    ['Janaranjani',       'janaranjani'],
    ['Jayantashree',      'jayantashree', 'jayantasri', 'jayanthasri'],
    ['Kadanakutoohalam',  'kadanakutoohalam', 'kadanakudhuhalam'],
    ['Kalyanavasamtam',   'kalyanavasamtam', 'kalyanavasamtham'],
    ['Kamalaamanohari',   'kamalaamanohari', 'kamalamannohari'],
    ['Kanada',            'kanada'],
    ['Kannadagowla',      'kannadagowla'],
    ['Karnaranjani',      'karnaranjani'],
    ['Kedaragowla',       'kedaragowla', 'kedharagowla'],
    ['Kedaram',           'kedaram'],
    ['Kuntalavarali',     'kuntalavarali', 'kunthalavarali'],
    ['Lalita',            'lalita'],
    ['Madhyamavati',      'madhyamavati', 'madhyamavathi'],
    ['Malayamarutam',     'malayamarutam', 'malayamarutham'],
    ['Mohanakalyani',     'mohanakalyani'],
    ['Mohanam',           'mohanam', 'mohana'],
    ['Mukhari',           'mukhari'],
    ['Nalinakanti',       'nalinakanti', 'nalinakanthi'],
    ['Nattaikuranji',     'nattaikuranji', 'nattaikurinji'],
    ['Navarasakannada',   'navarasakannada'],
    ['Paras',             'paras'],
    ['Poorvikalyani',     'poorvikalyani', 'poorvi kalyani'],
    ['Ranjani',           'ranjani'],
    ['Reetigowla',        'reetigowla', 'reeti gowla'],
    ['Saranga',           'saranga'],
    ['Sarasvati',         'sarasvati', 'saraswati'],
    ['Saveri',            'saveri'],
    ['Shreeranjani',      'shreeranjani', 'sree ranjani', 'sri ranjani'],
    ['Shuddhadhanyasi',   'shuddhadhanyasi', 'suddha dhanyasi'],
    ['Sindhubhairavi',    'sindhubhairavi', 'sindhu bhairavi'],
    ['Sowrashthra',       'sowrashthra', 'saurashtra', 'sowrashtram'],
    ['Sunadavinodini',    'sunadavinodini'],
    ['Surati',            'surati'],
    ['Todi',              'todi'],
    ['Valachi',           'valachi', 'valaji'],
    ['Vasanta',           'vasanta', 'vasantha'],
    ['Yamunakalyani',     'yamunakalyani', 'yamuna kalyani', 'yaman kalyani'],
    ['Anandabhairavi',    'anandabhairavi'],
    ['Begada',            'begada'],
    ['Bhairavi',          'bhairavi'],
    ['Kalyani',           'kalyani'],
    ['Kambhoji',          'kambhoji', 'khambhoji'],
    ['Nattai',            'nattai'],
    ['Pantuvarali',       'pantuvarali', 'purvi kalyani'],
    ['Sri',               ' sri raga', 'sree raga'],
    ['Varali',            'varali'],

    // ── All 72 Melakartas ────────────────────────────────────
    ['Kanakangi',             'kanakangi'],
    ['Ratnangi',              'ratnangi'],
    ['Ganamoorti',            'ganamoorti'],
    ['Vanaspati',             'vanaspati'],
    ['Manavati',              'manavati'],
    ['Tanaroopi',             'tanaroopi'],
    ['Senavati',              'senavati'],
    ['Hanumatodi',            'hanumatodi'],
    ['Dhenuka',               'dhenuka'],
    ['Natakapriya',           'natakapriya'],
    ['Kokilapriya',           'kokilapriya'],
    ['Roopavati',             'roopavati'],
    ['Gayakapriya',           'gayakapriya'],
    ['Vakulabharanam',        'vakulabharanam'],
    ['Mayamalavagowla',       'mayamalavagowla', 'mayamalavagaula'],
    ['Chakravakam',           'chakravakam'],
    ['Sooryakantam',          'sooryakantam', 'suryakantam'],
    ['Hatakambari',           'hatakambari'],
    ['Jhankaradhvani',        'jhankaradhvani'],
    ['Natabhairavi',          'natabhairavi'],
    ['Keeravani',             'keeravani'],
    ['Kharaharapriya',        'kharaharapriya', 'karaharapriya'],
    ['Gowrimanohari',         'gowrimanohari', 'gouri manohari'],
    ['Varunapriya',           'varunapriya'],
    ['Mararanjani',           'mararanjani'],
    ['Charukeshi',            'charukeshi', 'charukesi'],
    ['Sarasangi',             'sarasangi'],
    ['Harikambhodhi',         'harikambhodhi', 'hari kambodhi'],
    ['Shankarabharanam',      'shankarabharanam', 'dheerashankarabharanam', 'sankarabharanam'],
    ['Naganandini',           'naganandini'],
    ['Yagapriya',             'yagapriya'],
    ['Ragavardhini',          'ragavardhini'],
    ['Gangeyabhooshan',       'gangeyabhooshan'],
    ['Vagadheeshvari',        'vagadheeshvari'],
    ['Shoolini',              'shoolini'],
    ['Chalanata',             'chalanata', 'chalanatta'],
    ['Salagam',               'salagam'],
    ['Jalarnavam',            'jalarnavam'],
    ['Jhalavarali',           'jhalavarali'],
    ['Navaneetam',            'navaneetam'],
    ['Pavani',                'pavani'],
    ['Raghupriya',            'raghupriya'],
    ['Gavambhodhi',           'gavambhodhi'],
    ['Bhavapriya',            'bhavapriya'],
    ['Shubhapantuvarali',     'shubhapantuvarali'],
    ['Shadvidhamargini',      'shadvidhamargini'],
    ['Suvarnangi',            'suvarnangi'],
    ['Divyamani',             'divyamani'],
    ['Dhavalamabari',         'dhavalamabari', 'dhavalambari'],
    ['Namanarayani',          'namanarayani'],
    ['Kamavardhini',          'kamavardhini'],
    ['Ramapriya',             'ramapriya'],
    ['Gamanashrama',          'gamanashrama'],
    ['Vishwambhari',          'vishwambhari'],
    ['Shyamallangi',          'shyamallangi'],
    ['Shanmukhapriya',        'shanmukhapriya'],
    ['Simhendramadhyamam',    'simhendramadhyamam'],
    ['Hemavati',              'hemavati'],
    ['Dharmavati',            'dharmavati'],
    ['Neetimati',             'neetimati'],
    ['Kantamani',             'kantamani'],
    ['Rishabhapriya',         'rishabhapriya'],
    ['Latangi',               'latangi'],
    ['Vachaspati',            'vachaspati'],
    ['Mechakalyani',          'mechakalyani'],
    ['Chitrambari',           'chitrambari'],
    ['Sucharitra',            'sucharitra'],
    ['Jyotisvaroopin',        'jyotisvaroopin'],
    ['Dhatuvardhini',         'dhatuvardhini'],
    ['Nasikabhooshani',       'nasikabhooshani'],
    ['Kosalam',               'kosalam'],
    ['Rasikapriya',           'rasikapriya'],
  ];

  const t = title.toLowerCase();
  for (const [canonical, ...aliases] of RAGA_LIST) {
    for (const alias of aliases) {
      // Use word-boundary style check: alias must appear as a standalone word
      const re = new RegExp(`(^|[^a-z])${alias}([^a-z]|$)`);
      if (re.test(t)) return canonical;
    }
  }
  return null;
}

// ── Core fetch function ──────────────────────────────────────

async function fetchVideosForArtist(
  artist: Artist,
  supabase: ReturnType<typeof createClient>,
  publishedAfter: string
): Promise<{ found: number; added: number; units: number }> {
  
  let found = 0, added = 0, units = 0;

  try {
    // Build search query
    const query = artist.youtube_channel_id
      ? `carnatic`                          // if we have channel ID, search within channel
      : `${artist.name} carnatic music`;    // fallback: name + carnatic keyword

    const searchParams = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      q: query,
      publishedAfter,
      maxResults: String(MAX_RESULTS),
      key: YOUTUBE_API_KEY,
      ...(artist.youtube_channel_id ? { channelId: artist.youtube_channel_id } : {}),
    });

    // Search for videos
    const searchRes = await fetch(`${YOUTUBE_BASE_URL}/search?${searchParams}`);
    units += 100; // search costs 100 units

    if (!searchRes.ok) {
      console.error(`  ✗ Search failed for ${artist.name}: ${searchRes.status}`);
      return { found, added, units };
    }

    const searchData = await searchRes.json();
    const videos: YouTubeVideo[] = searchData.items || [];
    found = videos.length;

    if (found === 0) {
      console.log(`  → No new videos for ${artist.name}`);
      return { found, added, units };
    }

    // Get video details (duration + view count) in a single batch call
    const videoIds = videos.map((v) => v.id.videoId).join(',');
    const detailsParams = new URLSearchParams({
      part: 'contentDetails,statistics',
      id: videoIds,
      key: YOUTUBE_API_KEY,
    });
    const detailsRes = await fetch(`${YOUTUBE_BASE_URL}/videos?${detailsParams}`);
    units += 1; // videos.list costs 1 unit per video

    const detailsData = await detailsRes.json();
    const detailsMap: Record<string, VideoDetails> = {};
    (detailsData.items || []).forEach((d: VideoDetails) => {
      detailsMap[d.id] = d;
    });

    // Upsert each video into our DB
    for (const video of videos) {
      const vid = video.id.videoId;
      const snippet = video.snippet;
      const details = detailsMap[vid];

      const thumbnail =
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url ||
        null;

      const { error } = await supabase.from('videos').upsert({
        youtube_video_id:  vid,
        title:             snippet.title,
        description:       snippet.description?.slice(0, 1000) || null,
        channel_id:        snippet.channelId,
        channel_name:      snippet.channelTitle,
        thumbnail_url:     thumbnail,
        published_at:      snippet.publishedAt,
        duration_seconds:  details ? parseDuration(details.contentDetails.duration) : null,
        view_count:        details ? parseInt(details.statistics.viewCount || '0') : null,
        artist_id:         artist.id,
        artist_name:       artist.name,
        raga:              guessRaga(snippet.title),
        video_type:        guessVideoType(snippet.title),
        is_visible:        true,
        fetched_at:        new Date().toISOString(),
      }, { onConflict: 'youtube_video_id' });

      if (!error) added++;
      else console.error(`  ✗ Failed to upsert video ${vid}: ${error.message}`);
    }

    console.log(`  ✓ ${artist.name}: found ${found}, added/updated ${added}`);
  } catch (err) {
    console.error(`  ✗ Error for ${artist.name}:`, err);
  }

  return { found, added, units };
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('🎵 Carnatic App — YouTube Video Fetch');
  console.log(`📅 Fetching videos published in the last ${DAYS_BACK} days\n`);

  if (!SUPABASE_URL || !SUPABASE_KEY || !YOUTUBE_API_KEY) {
    console.error('❌ Missing environment variables. Check your .env file.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get all active artists with a channel ID
  const { data: artists, error } = await supabase
    .from('artists')
    .select('id, name, youtube_channel_id, channel_name')
    .eq('is_active', true)
    .order('name');

  if (error || !artists) {
    console.error('❌ Failed to fetch artists:', error?.message);
    process.exit(1);
  }

  console.log(`Found ${artists.length} active artists\n`);

  const publishedAfter = new Date(
    Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000
  ).toISOString();

  let totalFound = 0, totalAdded = 0, totalUnits = 0;

  for (const artist of artists) {
    if (!artist.youtube_channel_id) {
      console.log(`⚠️  Skipping ${artist.name} (no channel ID yet)`);
      continue;
    }

    console.log(`🔍 Fetching: ${artist.name}`);
    const { found, added, units } = await fetchVideosForArtist(
      artist, supabase, publishedAfter
    );

    totalFound  += found;
    totalAdded  += added;
    totalUnits  += units;

    // Log the fetch run
    await supabase.from('fetch_log').insert({
      artist_id:       artist.id,
      artist_name:     artist.name,
      videos_found:    found,
      videos_added:    added,
      api_units_used:  units,
      status:          'success',
    });

    // Small delay between artists to be kind to the API
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('\n══════════════════════════════════');
  console.log(`✅ Done!`);
  console.log(`   Videos found:   ${totalFound}`);
  console.log(`   Videos added:   ${totalAdded}`);
  console.log(`   API units used: ${totalUnits} / 10000`);
  console.log('══════════════════════════════════');
}

main().catch(console.error);
