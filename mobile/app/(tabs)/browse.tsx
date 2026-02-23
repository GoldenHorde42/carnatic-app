import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet, FlatList, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getArtists, getRagas, Artist } from '../../lib/api'
import { YT } from '../../lib/theme'

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

  const instrumentIcon = (instrument: string | null): React.ComponentProps<typeof Ionicons>['name'] => {
    if (!instrument) return 'mic-outline'
    const i = instrument.toLowerCase()
    if (i.includes('violin') || i.includes('fiddle')) return 'musical-notes-outline'
    if (i.includes('flute'))                          return 'musical-note-outline'
    return 'mic-outline'
  }

  const popularRagas  = ragas.filter(r =>  r.is_popular)
  const otherRagas    = ragas.filter(r => !r.is_popular)

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Browse</Text>
      </View>

      {/* ── Tab switcher ── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabPill, tab === 'artists' && styles.tabPillActive]}
          onPress={() => setTab('artists')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabPillText, tab === 'artists' && styles.tabPillTextActive]}>
            Artists
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, tab === 'ragas' && styles.tabPillActive]}
          onPress={() => setTab('ragas')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabPillText, tab === 'ragas' && styles.tabPillTextActive]}>
            Ragas
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {loading ? (
        <ActivityIndicator color={YT.textSecondary} size="large" style={styles.loader} />
      ) : tab === 'artists' ? (

        /* ── Artist list ── */
        <FlatList
          data={artists}
          keyExtractor={a => a.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: artist }) => (
            <TouchableOpacity
              style={styles.artistRow}
              onPress={() => router.push(`/search?q=${encodeURIComponent(artist.name)}`)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {artist.name[0].toUpperCase()}
                </Text>
              </View>

              <View style={styles.artistInfo}>
                <Text style={styles.artistName}>{artist.name}</Text>
                <Text style={styles.artistMeta} numberOfLines={1}>
                  {[
                    artist.instrument || (artist.artist_type === 'vocalist' ? 'Vocal' : artist.artist_type),
                    artist.is_deceased ? 'Archival' : null,
                    artist.book_recommended ? '📖 Curated' : null,
                  ].filter(Boolean).join('  ·  ')}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color={YT.textTertiary} />
            </TouchableOpacity>
          )}
        />

      ) : (

        /* ── Ragas grid ── */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ragaScroll}>

          <Text style={styles.sectionLabel}>Popular Ragas</Text>
          <View style={styles.ragaGrid}>
            {popularRagas.map(raga => (
              <TouchableOpacity
                key={raga.name}
                style={styles.ragaChip}
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

          <Text style={[styles.sectionLabel, { marginTop: 28 }]}>All Ragas</Text>
          <View style={styles.ragaGrid}>
            {otherRagas.map(raga => (
              <TouchableOpacity
                key={raga.name}
                style={[styles.ragaChip, styles.ragaChipDim]}
                onPress={() => router.push(`/search?q=${encodeURIComponent(raga.name)}`)}
                activeOpacity={0.7}
              >
                <Text style={[styles.ragaName, styles.ragaNameDim]}>{raga.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: YT.bg,
    paddingTop:      56,
  },

  header: {
    paddingHorizontal: 14,
    paddingBottom:     12,
  },
  title: {
    color:      YT.textPrimary,
    fontSize:   20,
    fontWeight: '700',
  },

  // ── Tab pills ──
  tabRow: {
    flexDirection:    'row',
    paddingHorizontal: 14,
    gap:               8,
    paddingBottom:     12,
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical:    7,
    borderRadius:      20,
    backgroundColor:   YT.chip,
    borderWidth:       1,
    borderColor:       YT.border,
  },
  tabPillActive: {
    backgroundColor: YT.textPrimary,
    borderColor:     YT.textPrimary,
  },
  tabPillText: {
    color:      YT.textSecondary,
    fontSize:   13,
    fontWeight: '600',
  },
  tabPillTextActive: {
    color: YT.bg,
  },

  divider: {
    height:          1,
    backgroundColor: YT.border,
    marginBottom:    2,
  },

  loader: { marginTop: 60 },

  // ── Artist row ──
  artistRow: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap:            12,
    borderBottomWidth: 1,
    borderBottomColor: YT.surface,
  },
  avatar: {
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: YT.surface,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  avatarLetter: {
    color:      YT.textSecondary,
    fontSize:   16,
    fontWeight: '700',
  },
  artistInfo: {
    flex: 1,
    gap:  2,
  },
  artistName: {
    color:      YT.textPrimary,
    fontSize:   14,
    fontWeight: '500',
  },
  artistMeta: {
    color:    YT.textTertiary,
    fontSize: 12,
  },

  // ── Ragas ──
  ragaScroll: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  sectionLabel: {
    color:      YT.textSecondary,
    fontSize:   12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing:  1,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  ragaGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    paddingHorizontal: 12,
    gap:            8,
  },
  ragaChip: {
    backgroundColor: YT.surface,
    borderRadius:    4,
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderWidth:     1,
    borderColor:     YT.border,
    alignItems:      'center',
  },
  ragaChipDim: {
    backgroundColor: 'transparent',
    borderColor:     YT.chip,
  },
  ragaName: {
    color:      YT.textPrimary,
    fontSize:   13,
    fontWeight: '500',
  },
  ragaNameDim: {
    color:      YT.textSecondary,
    fontWeight: '400',
  },
  ragaNum: {
    color:    YT.red,
    fontSize: 10,
    marginTop: 1,
  },
})
