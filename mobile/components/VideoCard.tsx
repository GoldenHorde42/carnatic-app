import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Video, formatDuration, formatViews, timeAgo } from '../lib/api'
import { YT } from '../lib/theme'

interface Props {
  video:       Video
  showArtist?: boolean
}

export function VideoCard({ video, showArtist = true }: Props) {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/player/${video.youtube_video_id}`)}
    >
      {/* Full-width 16:9 thumbnail */}
      <View style={styles.thumbWrap}>
        {video.thumbnail_url ? (
          <Image source={{ uri: video.thumbnail_url }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.thumbPlaceholder]}>
            <Text style={styles.thumbPlaceholderText}>♪</Text>
          </View>
        )}
        {video.duration_seconds ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(video.duration_seconds)}</Text>
          </View>
        ) : null}
      </View>

      {/* Info row */}
      <View style={styles.info}>
        {/* Channel avatar placeholder */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(video.artist_name || '?')[0].toUpperCase()}
          </Text>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={2}>{video.title}</Text>

          <View style={styles.metaRow}>
            {showArtist && (
              <Text style={styles.channel}>{video.artist_name}</Text>
            )}
            {video.raga ? (
              <Text style={styles.raga}> · {video.raga}</Text>
            ) : null}
          </View>

          <Text style={styles.stats}>
            {[
              video.view_count ? formatViews(video.view_count) + ' views' : null,
              video.published_at ? timeAgo(video.published_at) : null,
            ].filter(Boolean).join('  ·  ')}
          </Text>
        </View>

        {/* Three-dot menu placeholder */}
        <Text style={styles.dots}>⋮</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: YT.bg,
  },

  // Thumbnail — full width, 16:9 ratio
  thumbWrap: {
    width:           '100%',
    aspectRatio:     16 / 9,
    backgroundColor: YT.surface,
    position:        'relative',
  },
  thumbnail: {
    width:  '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    backgroundColor: YT.surface,
    alignItems:      'center',
    justifyContent:  'center',
  },
  thumbPlaceholderText: {
    color:    YT.textTertiary,
    fontSize: 40,
  },
  durationBadge: {
    position:        'absolute',
    bottom:          6,
    right:           8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius:    3,
    paddingHorizontal: 5,
    paddingVertical:   2,
  },
  durationText: {
    color:      YT.textPrimary,
    fontSize:   12,
    fontWeight: '600',
  },

  // Info row
  info: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop:        10,
    paddingBottom:     4,
    gap:               10,
  },
  avatar: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: YT.surface,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
    marginTop:       2,
  },
  avatarText: {
    color:      YT.textSecondary,
    fontSize:   15,
    fontWeight: '700',
  },
  textBlock: {
    flex: 1,
    gap:  2,
  },
  title: {
    color:      YT.textPrimary,
    fontSize:   14,
    fontWeight: '500',
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    marginTop:     3,
  },
  channel: {
    color:    YT.textSecondary,
    fontSize: 12,
  },
  raga: {
    color:    YT.textTertiary,
    fontSize: 12,
  },
  stats: {
    color:    YT.textTertiary,
    fontSize: 12,
    marginTop: 1,
  },
  dots: {
    color:    YT.textTertiary,
    fontSize: 20,
    lineHeight: 20,
    paddingTop: 2,
    flexShrink: 0,
  },
})

