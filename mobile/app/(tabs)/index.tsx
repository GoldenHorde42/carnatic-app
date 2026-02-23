import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { getRecommendations, RecommendResult } from '../../lib/api'
import { VideoCard } from '../../components/VideoCard'
import { useAuth } from '../../hooks/useAuth'

const MOODS = [
  { label: 'Melancholic', emoji: '🌧️', context: undefined },
  { label: 'Peaceful',    emoji: '🕊️', context: undefined },
  { label: 'Devotional',  emoji: '🪔', context: undefined },
  { label: 'Joyful',      emoji: '🌸', context: undefined },
  { label: 'Energetic',   emoji: '⚡',  context: undefined },
  { label: 'Evening',     emoji: '🌅', context: undefined },
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
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onRefresh = () => {
    setRefreshing(true)
    load()
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>🎵 Carnatic</Text>
          <Text style={styles.subtitle}>
            {user ? `Welcome back` : 'Curated classical music'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileBtn}>
          <Text style={styles.profileEmoji}>{user ? '👤' : '🔑'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c084fc" />
        }
      >
        {/* Mood selector */}
        <Text style={styles.sectionTitle}>How are you feeling?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodRow}>
          {MOODS.map(mood => (
            <TouchableOpacity
              key={mood.label}
              style={styles.moodChip}
              onPress={() => router.push(`/search?q=${encodeURIComponent(mood.label.toLowerCase())}`)}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodLabel}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recommendations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {data?.personalised ? '✨ For You' : '🔥 Popular Now'}
          </Text>
          {data?.reason ? (
            <Text style={styles.sectionReason}>{data.reason}</Text>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator color="#c084fc" size="large" style={styles.loader} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>😔</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : data?.videos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎼</Text>
            <Text style={styles.emptyText}>Library is being built…</Text>
            <Text style={styles.emptySubText}>Check back soon!</Text>
          </View>
        ) : (
          <View style={styles.videoList}>
            {data?.videos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </View>
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
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingHorizontal: 16,
    marginBottom:   20,
  },
  appName: {
    color:      '#f0e6d3',
    fontSize:   24,
    fontWeight: '700',
  },
  subtitle: {
    color:    '#a89070',
    fontSize: 13,
    marginTop: 2,
  },
  profileBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: '#1a1433',
    alignItems:      'center',
    justifyContent:  'center',
  },
  profileEmoji: { fontSize: 18 },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom:      12,
  },
  sectionTitle: {
    color:      '#f0e6d3',
    fontSize:   16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop:  20,
    marginBottom: 12,
  },
  sectionReason: {
    color:     '#a89070',
    fontSize:  12,
    marginTop: 2,
  },
  moodRow: {
    paddingLeft:  16,
    marginBottom: 8,
  },
  moodChip: {
    backgroundColor: '#1a1433',
    borderRadius:    16,
    paddingHorizontal: 14,
    paddingVertical:   10,
    marginRight:     8,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     '#2d1b4e',
  },
  moodEmoji: { fontSize: 20 },
  moodLabel: {
    color:     '#c084fc',
    fontSize:  11,
    marginTop: 4,
    fontWeight: '500',
  },
  videoList: {
    paddingTop: 8,
  },
  loader: {
    marginTop: 60,
  },
  emptyState: {
    alignItems:  'center',
    marginTop:   60,
    paddingHorizontal: 32,
  },
  emptyEmoji:   { fontSize: 48, marginBottom: 12 },
  emptyText:    { color: '#a89070', fontSize: 16, textAlign: 'center' },
  emptySubText: { color: '#6b5a80', fontSize: 13, marginTop: 6, textAlign: 'center' },
  retryBtn: {
    marginTop:       16,
    backgroundColor: '#7c3aed',
    borderRadius:    20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
})
