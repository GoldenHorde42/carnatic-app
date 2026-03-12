import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StyleSheet, Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getRecommendations, RecommendResult } from '../../lib/api'
import { VideoCard } from '../../components/VideoCard'
import { useAuth } from '../../hooks/useAuth'
import { YT } from '../../lib/theme'

const MOODS = [
  { label: 'Melancholic', emoji: '🌧️' },
  { label: 'Peaceful',    emoji: '🕊️' },
  { label: 'Devotional',  emoji: '🪔' },
  { label: 'Joyful',      emoji: '🌸' },
  { label: 'Energetic',   emoji: '⚡' },
  { label: 'Evening',     emoji: '🌅' },
]

export default function HomeScreen() {
  const router   = useRouter()
  const { user } = useAuth()

  const [data,       setData]       = useState<RecommendResult | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const load = useCallback(async (context?: string) => {
    try {
      setError(null)
      const result = await getRecommendations(20, 0, context)
      setData(result)
    } catch (e) {
      setError('Could not load recommendations')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <View style={styles.container}>

      {/* ── Top bar (YouTube-style) ── */}
      <View style={styles.topBar}>
        {/* Left: App wordmark */}
        <View style={styles.wordmark}>
          <Text style={styles.appName}>Carnatic</Text>
        </View>

        {/* Right: action icons */}
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/search')}
          >
            <Ionicons name="search-outline" size={24} color={YT.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/profile')}
          >
            {user
              ? <Ionicons name="person-circle-outline" size={28} color={YT.textPrimary} />
              : <Ionicons name="person-outline"        size={24} color={YT.textPrimary} />
            }
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={YT.textSecondary} />
        }
      >

        {/* ── Mood filter chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodRow} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
          {MOODS.map(mood => (
            <TouchableOpacity
              key={mood.label}
              style={styles.moodChip}
              onPress={() => router.push(`/search?q=${encodeURIComponent(mood.label.toLowerCase())}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodLabel}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Section header ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {data?.personalised ? 'For You' : 'Popular Now'}
          </Text>
          {data?.reason ? (
            <Text style={styles.sectionReason}>{data.reason}</Text>
          ) : null}
        </View>

        {/* ── Content ── */}
        {loading ? (
          <ActivityIndicator color={YT.textSecondary} size="large" style={styles.loader} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>😔</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !data?.videos.length ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎼</Text>
            <Text style={styles.emptyText}>Library is being built…</Text>
            <Text style={styles.emptySubText}>Check back soon!</Text>
          </View>
        ) : (
          <View>
            {data.videos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </View>
        )}

        {/* ── "Powered by YouTube" footer (required by YouTube ToS) ── */}
        <TouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com')} style={styles.ytFooter}>
          <Ionicons name="logo-youtube" size={18} color="#FF0000" />
          <Text style={styles.ytFooterText}>Powered by YouTube</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: YT.bg,
    paddingTop:      52,
  },

  // ── Top bar ──
  topBar: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: 14,
    paddingVertical:   10,
    backgroundColor:  YT.bg,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           7,
  },
  appName: {
    color:      YT.textPrimary,
    fontSize:   20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  topActions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  iconBtn: {
    padding: 6,
  },

  // ── Mood chips ──
  moodRow: {
    marginTop:    12,
    marginBottom: 4,
  },
  moodChip: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    backgroundColor: YT.chip,
    borderRadius:    18,
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderWidth:     1,
    borderColor:     YT.border,
  },
  moodEmoji: { fontSize: 14 },
  moodLabel: {
    color:     YT.textPrimary,
    fontSize:  13,
    fontWeight: '500',
  },

  // ── Section ──
  sectionHeader: {
    paddingHorizontal: 14,
    paddingTop:        18,
    paddingBottom:     10,
  },
  sectionTitle: {
    color:      YT.textPrimary,
    fontSize:   16,
    fontWeight: '700',
  },
  sectionReason: {
    color:    YT.textTertiary,
    fontSize: 12,
    marginTop: 3,
  },

  loader: { marginTop: 60 },
  emptyState: {
    alignItems:  'center',
    marginTop:   60,
    paddingHorizontal: 40,
  },
  emptyEmoji:   { fontSize: 48, marginBottom: 12 },
  emptyText:    { color: YT.textSecondary, fontSize: 16, textAlign: 'center' },
  emptySubText: { color: YT.textTertiary,  fontSize: 13, marginTop: 6, textAlign: 'center' },
  retryBtn: {
    marginTop:       20,
    backgroundColor: YT.red,
    borderRadius:    4,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── Footer attribution ──
  ytFooter: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent:'center',
    gap:           7,
    paddingVertical: 28,
    paddingBottom: 12,
  },
  ytFooterPlay: {
    color:    '#fff',
    fontSize: 7,
    marginLeft: 1,
  },
  ytFooterText: {
    color:    YT.textTertiary,
    fontSize: 12,
  },
})
