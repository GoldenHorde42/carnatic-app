import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, Keyboard,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { searchVideos, SearchResult } from '../../lib/api'
import { VideoCard } from '../../components/VideoCard'
import { YT } from '../../lib/theme'

const QUICK_SEARCHES = [
  { label: 'Melancholic mood',  q: 'i am feeling melancholic' },
  { label: 'Morning ragas',     q: 'peaceful morning music' },
  { label: 'Kalyani',          q: 'kalyani raga' },
  { label: 'Bhairavi',         q: 'bhairavi' },
  { label: 'Tyagaraja kritis', q: 'tyagaraja kriti' },
  { label: 'Violin',           q: 'violin carnatic' },
  { label: 'Adi tala',         q: 'adi tala' },
  { label: 'Beginner lessons', q: 'beginner carnatic tutorial' },
]

export default function SearchScreen() {
  const params   = useLocalSearchParams<{ q?: string }>()
  const inputRef = useRef<TextInput>(null)

  const [query,   setQuery]   = useState(params.q || '')
  const [result,  setResult]  = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (params.q) { setQuery(params.q); doSearch(params.q) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q])

  const doSearch = async (q: string) => {
    if (!q.trim()) return
    Keyboard.dismiss()
    setLoading(true)
    setError(null)
    try {
      setResult(await searchVideos(q.trim()))
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const clear = () => { setQuery(''); setResult(null); inputRef.current?.focus() }

  return (
    <View style={styles.container}>

      {/* ── Search bar (YouTube-style) ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={YT.textTertiary} style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => doSearch(query)}
            placeholder='Search ragas, artists, moods…'
            placeholderTextColor={YT.textTertiary}
            returnKeyType="search"
            autoCorrect={false}
            selectionColor={YT.red}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={YT.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        {query.length > 0 && (
          <TouchableOpacity onPress={() => doSearch(query)} style={styles.searchBtn}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Quick-search chips ── */}
        {!result && !loading && (
          <>
            <Text style={styles.sectionTitle}>Quick searches</Text>
            <View style={styles.chipGrid}>
              {QUICK_SEARCHES.map(s => (
                <TouchableOpacity
                  key={s.q}
                  style={styles.chip}
                  onPress={() => { setQuery(s.label); doSearch(s.q) }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="search-outline" size={13} color={YT.textTertiary} style={{ marginRight: 5 }} />
                  <Text style={styles.chipText}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Loading ── */}
        {loading && (
          <ActivityIndicator color={YT.textSecondary} size="large" style={styles.loader} />
        )}

        {/* ── Error ── */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* ── Results ── */}
        {result && !loading && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsLabel}>{result.searchSummary}</Text>
              <Text style={styles.resultsCount}>{result.total} result{result.total !== 1 ? 's' : ''}</Text>
            </View>

            {result.videos.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="musical-notes-outline" size={56} color={YT.textTertiary} />
                <Text style={styles.emptyText}>No videos found</Text>
                <Text style={styles.emptySubText}>
                  The library is still growing — try a different search
                </Text>
              </View>
            ) : (
              <View>
                {result.videos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </View>
            )}
          </>
        )}

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: YT.bg,
    paddingTop:      56,
  },

  // ── Search bar ──
  searchRow: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 12,
    paddingBottom:     12,
    gap:               8,
  },
  searchBar: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: YT.chip,
    borderRadius:    22,
    paddingHorizontal: 14,
    height:          42,
    borderWidth:     1,
    borderColor:     YT.border,
  },
  input: {
    flex:     1,
    color:    YT.textPrimary,
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: YT.red,
    borderRadius:    4,
    paddingHorizontal: 14,
    paddingVertical:   10,
  },
  searchBtnText: {
    color:      '#fff',
    fontSize:   13,
    fontWeight: '700',
  },

  // ── Quick chips ──
  sectionTitle: {
    color:      YT.textSecondary,
    fontSize:   14,
    fontWeight: '600',
    paddingHorizontal: 14,
    marginBottom: 10,
    marginTop:    6,
  },
  chipGrid: {
    paddingHorizontal: 12,
    gap: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingHorizontal: 14,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: YT.surface,
  },
  chipText: {
    color:    YT.textPrimary,
    fontSize: 14,
  },

  loader: { marginTop: 60 },
  errorText: {
    color:     '#F44',
    textAlign: 'center',
    marginTop: 20,
    fontSize:  14,
    paddingHorizontal: 24,
  },

  // ── Results ──
  resultsHeader: {
    paddingHorizontal: 14,
    paddingBottom:     10,
    paddingTop:        4,
  },
  resultsLabel: {
    color:      YT.textPrimary,
    fontSize:   14,
    fontWeight: '600',
  },
  resultsCount: {
    color:    YT.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems:  'center',
    marginTop:   60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText:    { color: YT.textSecondary, fontSize: 16, textAlign: 'center' },
  emptySubText: { color: YT.textTertiary,  fontSize: 13, textAlign: 'center', lineHeight: 18 },
})
