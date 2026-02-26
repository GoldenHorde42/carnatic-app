import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getLikedVideos, Video } from '../lib/api'
import { VideoCard } from '../components/VideoCard'
import { YT } from '../lib/theme'

export default function LikedScreen() {
  const router = useRouter()
  const [videos,  setVideos]  = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [total,   setTotal]   = useState(0)

  useEffect(() => {
    getLikedVideos(50, 0)
      .then(({ videos, total }) => { setVideos(videos); setTotal(total) })
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
        <Text style={styles.title}>Liked Videos</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={YT.textSecondary} size="large" style={styles.loader} />
      ) : videos.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={YT.textTertiary} />
          <Text style={styles.emptyTitle}>No liked videos yet</Text>
          <Text style={styles.emptySubtitle}>Tap the ♥ button while watching to save videos here</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={v => v.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.count}>{total} liked video{total !== 1 ? 's' : ''}</Text>
          }
          renderItem={({ item }) => <VideoCard video={item} />}
        />
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
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color:      YT.textPrimary,
    fontSize:   16,
    fontWeight: '600',
  },
  emptySubtitle: {
    color:     YT.textSecondary,
    fontSize:  13,
    textAlign: 'center',
  },
})
