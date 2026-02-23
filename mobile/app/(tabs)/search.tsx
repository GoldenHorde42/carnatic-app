import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, Keyboard,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { searchVideos, SearchResult } from '../../lib/api'
import { VideoCard } from '../../components/VideoCard'

const QUICK_SEARCHES = [
  { label: 'Melancholic mood',  q: 'i am feeling melancholic' },
  { label: 'Morning ragas',     q: 'peaceful morning music' },
  { label: 'Kalyani',          q: 'kalyani raga' },
  { label: 'Bhairavi',         q: 'bhairavi' },
  { label: 'Tyagaraja kritis', q: 'tyagaraja kriti' },
  { label: 'Beginner lessons', q: 'beginner carnatic tutorial' },
  { label: 'Violin',           q: 'violin carnatic' },
  { label: 'Adi tala',         q: 'adi tala' },
]

export default function SearchScreen() {
  const params      = useLocalSearchParams<{ q?: string }>()
  const inputRef    = useRef<TextInput>(null)

  const [query,   setQuery]   = useState(params.q || '')
  const [result,  setResult]  = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (params.q) {
      setQuery(params.q)
      doSearch(params.q)
    }
  }, [params.q])

  const doSearch = async (q: string) => {
    if (!q.trim()) return
    Keyboard.dismiss()
    setLoading(true)
    setError(null)
    try {
      const data = await searchVideos(q.trim())
      setResult(data)
    } catch (e) {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>Search by mood, raga, artist, or anything</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => doSearch(query)}
          placeholder='Try "melancholic" or "kalyani concert"'
          placeholderTextColor="#6b5a80"
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResult(null) }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Quick searches — shown only when no query */}
        {!result && !loading && (
          <>
            <Text style={styles.sectionTitle}>Quick searches</Text>
            <View style={styles.chipGrid}>
              {QUICK_SEARCHES.map(s => (
                <TouchableOpacity
                  key={s.q}
                  style={styles.chip}
                  onPress={() => { setQuery(s.q); doSearch(s.q) }}
                >
                  <Text style={styles.chipText}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Loading */}
        {loading && (
          <ActivityIndicator color="#c084fc" size="large" style={styles.loader} />
        )}

        {/* Error */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsLabel}>{result.searchSummary}</Text>
              <Text style={styles.resultsCount}>{result.total} videos</Text>
            </View>

            {result.videos.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🎼</Text>
                <Text style={styles.emptyText}>No videos found</Text>
                <Text style={styles.emptySubText}>
                  The library is still growing — try a different search
                </Text>
              </View>
            ) : (
              <View style={{ paddingTop: 8 }}>
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
    backgroundColor: '#0f0a1e',
    paddingTop:      56,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom:      16,
  },
  title: {
    color:      '#f0e6d3',
    fontSize:   24,
    fontWeight: '700',
  },
  subtitle: {
    color:    '#a89070',
    fontSize: 13,
    marginTop: 4,
  },
  searchBar: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#1a1433',
    marginHorizontal: 16,
    borderRadius:    12,
    paddingHorizontal: 12,
    marginBottom:    20,
    borderWidth:     1,
    borderColor:     '#2d1b4e',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  input: {
    flex:      1,
    color:     '#f0e6d3',
    fontSize:  15,
    height:    48,
  },
  clearBtn: {
    color:    '#6b5a80',
    fontSize: 16,
    padding:  4,
  },
  sectionTitle: {
    color:      '#f0e6d3',
    fontSize:   15,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    paddingHorizontal: 12,
    gap:            8,
  },
  chip: {
    backgroundColor: '#1a1433',
    borderRadius:    20,
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderWidth:     1,
    borderColor:     '#2d1b4e',
  },
  chipText: {
    color:    '#c084fc',
    fontSize: 13,
  },
  loader: { marginTop: 60 },
  errorText: {
    color:    '#f87171',
    textAlign: 'center',
    marginTop: 20,
    fontSize:  14,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    marginBottom:      12,
  },
  resultsLabel: {
    color:      '#c084fc',
    fontSize:   14,
    fontWeight: '600',
  },
  resultsCount: {
    color:    '#6b5a80',
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems:  'center',
    marginTop:   60,
    paddingHorizontal: 32,
  },
  emptyEmoji:   { fontSize: 48, marginBottom: 12 },
  emptyText:    { color: '#a89070', fontSize: 16, textAlign: 'center' },
  emptySubText: { color: '#6b5a80', fontSize: 13, marginTop: 6, textAlign: 'center' },
})
