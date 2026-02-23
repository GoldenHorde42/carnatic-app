import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, FlatList,
} from 'react-native'
import { useRouter } from 'expo-router'
import { getArtists, getRagas, Artist } from '../../lib/api'

type Tab = 'artists' | 'ragas'

export default function BrowseScreen() {
  const router   = useRouter()
  const [tab,     setTab]     = useState<Tab>('artists')
  const [artists, setArtists] = useState<Artist[]>([])
  const [ragas,   setRagas]   = useState<{ name: string; melakarta_number: number | null; is_popular: boolean }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getArtists(), getRagas()])
      .then(([a, r]) => { setArtists(a); setRagas(r) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const instrumentEmoji = (instrument: string | null) => {
    if (!instrument) return '🎤'
    const i = instrument.toLowerCase()
    if (i.includes('violin'))    return '🎻'
    if (i.includes('flute'))     return '🎵'
    if (i.includes('veena'))     return '🪕'
    if (i.includes('mridangam')) return '🥁'
    if (i.includes('ghatam'))    return '🏺'
    if (i.includes('piano'))     return '🎹'
    return '🎸'
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'artists' && styles.activeTab]}
          onPress={() => setTab('artists')}
        >
          <Text style={[styles.tabText, tab === 'artists' && styles.activeTabText]}>
            Artists
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'ragas' && styles.activeTab]}
          onPress={() => setTab('ragas')}
        >
          <Text style={[styles.tabText, tab === 'ragas' && styles.activeTabText]}>
            Ragas
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#c084fc" size="large" style={styles.loader} />
      ) : tab === 'artists' ? (
        <FlatList
          data={artists}
          keyExtractor={a => a.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item: artist }) => (
            <TouchableOpacity
              style={styles.artistRow}
              onPress={() => router.push(`/search?q=${encodeURIComponent(artist.name)}`)}
              activeOpacity={0.7}
            >
              <View style={styles.artistAvatar}>
                <Text style={styles.artistEmoji}>
                  {instrumentEmoji(artist.instrument)}
                </Text>
              </View>
              <View style={styles.artistInfo}>
                <Text style={styles.artistName}>{artist.name}</Text>
                <Text style={styles.artistMeta}>
                  {artist.instrument || (artist.artist_type === 'vocalist' ? 'Vocalist' : artist.artist_type)}
                  {artist.is_deceased ? ' · Archival' : ''}
                  {artist.book_recommended ? ' · 📖 Curated' : ''}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {/* Popular ragas */}
          <Text style={styles.sectionLabel}>Popular Ragas</Text>
          <View style={styles.ragaGrid}>
            {ragas.filter(r => r.is_popular).map(raga => (
              <TouchableOpacity
                key={raga.name}
                style={styles.ragaCard}
                onPress={() => router.push(`/search?q=${encodeURIComponent(raga.name)}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.ragaName}>{raga.name}</Text>
                {raga.melakarta_number && (
                  <Text style={styles.ragaNum}>#{raga.melakarta_number}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* All ragas */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>All Ragas</Text>
          <View style={styles.ragaGrid}>
            {ragas.filter(r => !r.is_popular).map(raga => (
              <TouchableOpacity
                key={raga.name}
                style={[styles.ragaCard, styles.ragaCardDim]}
                onPress={() => router.push(`/search?q=${encodeURIComponent(raga.name)}`)}
                activeOpacity={0.7}
              >
                <Text style={[styles.ragaName, styles.ragaNameDim]}>{raga.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
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
  tabs: {
    flexDirection:   'row',
    marginHorizontal: 16,
    marginBottom:    16,
    backgroundColor: '#1a1433',
    borderRadius:    12,
    padding:         4,
  },
  tabBtn: {
    flex:            1,
    paddingVertical: 10,
    alignItems:      'center',
    borderRadius:    10,
  },
  activeTab: {
    backgroundColor: '#7c3aed',
  },
  tabText: {
    color:      '#6b5a80',
    fontWeight: '600',
    fontSize:   14,
  },
  activeTabText: {
    color: '#fff',
  },
  loader: { marginTop: 60 },
  list:   { paddingBottom: 32 },
  artistRow: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1433',
  },
  artistAvatar: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: '#1a1433',
    alignItems:      'center',
    justifyContent:  'center',
  },
  artistEmoji: { fontSize: 22 },
  artistInfo:  { flex: 1, marginLeft: 12 },
  artistName:  { color: '#f0e6d3', fontSize: 15, fontWeight: '600' },
  artistMeta:  { color: '#a89070', fontSize: 12, marginTop: 2 },
  chevron:     { color: '#6b5a80', fontSize: 20 },
  sectionLabel: {
    color:      '#a89070',
    fontSize:   12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing:  1,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  ragaGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    paddingHorizontal: 12,
    gap:            8,
  },
  ragaCard: {
    backgroundColor: '#1e1040',
    borderRadius:    12,
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderWidth:     1,
    borderColor:     '#7c3aed55',
    alignItems:      'center',
  },
  ragaCardDim: {
    backgroundColor: '#12102a',
    borderColor:     '#2d1b4e',
  },
  ragaName: {
    color:      '#c084fc',
    fontSize:   13,
    fontWeight: '600',
  },
  ragaNameDim: {
    color: '#7c6a9a',
  },
  ragaNum: {
    color:    '#7c3aed',
    fontSize: 10,
    marginTop: 2,
  },
})
