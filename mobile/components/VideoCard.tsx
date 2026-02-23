import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Video, formatDuration, formatViews, timeAgo } from '../lib/api'

interface Props {
  video:       Video
  showArtist?: boolean
}

export function VideoCard({ video, showArtist = true }: Props) {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/player/${video.youtube_video_id}`)}
    >
      {/* Thumbnail */}
      <View style={styles.thumbContainer}>
        {video.thumbnail_url ? (
          <Image source={{ uri: video.thumbnail_url }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbPlaceholder]} />
        )}
        {video.duration_seconds ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(video.duration_seconds)}</Text>
          </View>
        ) : null}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{video.title}</Text>

        <View style={styles.meta}>
          {showArtist && (
            <Text style={styles.metaText}>{video.artist_name}</Text>
          )}
          {video.raga && (
            <View style={styles.ragaChip}>
              <Text style={styles.ragaText}>{video.raga}</Text>
            </View>
          )}
        </View>

        <View style={styles.stats}>
          {video.view_count ? (
            <Text style={styles.statText}>{formatViews(video.view_count)}</Text>
          ) : null}
          {video.view_count && video.published_at ? (
            <Text style={styles.statText}> · </Text>
          ) : null}
          {video.published_at ? (
            <Text style={styles.statText}>{timeAgo(video.published_at)}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection:  'row',
    marginBottom:   16,
    paddingHorizontal: 16,
  },
  thumbContainer: {
    position:     'relative',
    width:        140,
    height:       80,
    borderRadius: 8,
    overflow:     'hidden',
    backgroundColor: '#1a1a2e',
  },
  thumbnail: {
    width:  '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    backgroundColor: '#2a2a3e',
  },
  durationBadge: {
    position:        'absolute',
    bottom:          4,
    right:           4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius:    4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  durationText: {
    color:    '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  info: {
    flex:        1,
    marginLeft:  10,
    justifyContent: 'space-between',
  },
  title: {
    color:      '#f0e6d3',
    fontSize:   13,
    fontWeight: '600',
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems:    'center',
    flexWrap:      'wrap',
    marginTop:     4,
    gap:           6,
  },
  metaText: {
    color:    '#a89070',
    fontSize: 12,
  },
  ragaChip: {
    backgroundColor: '#2d1b4e',
    borderRadius:    12,
    paddingHorizontal: 8,
    paddingVertical:   2,
    borderWidth:     1,
    borderColor:     '#7c3aed44',
  },
  ragaText: {
    color:    '#c084fc',
    fontSize: 11,
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    marginTop:     4,
  },
  statText: {
    color:    '#6b7280',
    fontSize: 11,
  },
})
