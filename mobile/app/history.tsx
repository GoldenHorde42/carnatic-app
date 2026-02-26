import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getWatchHistory, WatchHistoryEntry, formatDuration, formatViews, timeAgo } from '../lib/api'
import { YT } from '../lib/theme'

export default function HistoryScreen() {
  const router = useRouter()
  const [entries, setEntries] = useState<WatchHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [total,   setTotal]   = useState(0)

  useEffect(() => {
    getWatchHistory(50, 0)
      .then(({ entries, total }) => { setEntries(entries); setTotal(total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={YT.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Watch History</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={YT.textSecondary} size="large" style={styles.loader} />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={48} color={YT.textTertiary} />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySubtitle}>Videos you watch will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={e => e.video.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.count}>{total} video{total !== 1 ? 's' : ''} watched</Text>
          }
          renderItem={({ item: entry }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.8}
              onPress={() => router.push(`/player/${entry.video.youtube_video_id}`)}
            >
              {/* Thumbnail */}
              <View style={styles.thumb}>
                {entry.video.thumbnail_url ? (
                  <Image source={{ uri: entry.video.thumbnail_url }} style={styles.thumbImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumbImg, styles.thumbPlaceholder]}>
                    <Text style={{ color: YT.textTertiary, fontSize: 20 }}>♪</Text>
                  </View>
                )}
                {entry.video.duration_seconds ? (
                  <View style={styles.duration}>
                    <Text style={styles.durationText}>{formatDuration(entry.video.duration_seconds)}</Text>
                  </View>
                ) : null}
              </View>

              {/* Info */}
              <View style={styles.info}>
                <Text style={styles.videoTitle} numberOfLines={2}>{entry.video.title}</Text>
                <Text style={styles.artist}>{entry.video.artist_name}</Text>
                <Text style={styles.meta}>
                  {[
                    entry.video.view_count ? formatViews(entry.video.view_count) : null,
                    `Last watched ${timeAgo(entry.last_watched_at)}`,
                    entry.watch_count > 1 ? `${entry.watch_count}× watched` : null,
                  ].filter(Boolean).join('  ·  ')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const THUMB_W = 120
const THUMB_H = THUMB_W * (9 / 16)

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: YT.bg,
    paddingTop:      56,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 14,
    paddingBottom:  14,
    gap:            12,
    borderBottomWidth: 1,
    borderBottomColor: YT.border,
  },
  backBtn: { padding: 2 },
  title: {
    color:      YT.textPrimary,
    fontSize:   18,
    fontWeight: '700',
  },
  loader: { marginTop: 60 },
  count: {
    color:    YT.textTertiary,
    fontSize: 12,
    paddingHorizontal: 14,
    paddingVertical:   10,
  },
  empty: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            10,
    paddingBottom:  60,
  },
  emptyTitle: {
    color:      YT.textPrimary,
    fontSize:   16,
    fontWeight: '600',
  },
  emptySubtitle: {
    color:    YT.textSecondary,
    fontSize: 13,
  },
  row: {
    flexDirection:     'row',
    paddingHorizontal: 14,
    paddingVertical:   10,
    gap:               12,
    borderBottomWidth: 1,
    borderBottomColor: YT.surface,
  },
  thumb: {
    width:        THUMB_W,
    height:       THUMB_H,
    borderRadius: 4,
    overflow:     'hidden',
    flexShrink:   0,
    position:     'relative',
    backgroundColor: YT.surface,
  },
  thumbImg: {
    width:  '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: YT.surface,
  },
  duration: {
    position:        'absolute',
    bottom:          4,
    right:           4,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius:    3,
    paddingHorizontal: 4,
    paddingVertical:   1,
  },
  durationText: {
    color:      YT.textPrimary,
    fontSize:   10,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    gap:  3,
    justifyContent: 'center',
  },
  videoTitle: {
    color:      YT.textPrimary,
    fontSize:   13,
    fontWeight: '500',
    lineHeight: 18,
  },
  artist: {
    color:    YT.red,
    fontSize: 12,
  },
  meta: {
    color:    YT.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
})
