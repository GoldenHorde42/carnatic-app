import { useEffect, useRef, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator, Linking,
} from 'react-native'
import YoutubePlayer from 'react-native-youtube-iframe'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Video, formatDuration, formatViews, timeAgo, recordWatch, toggleLike, isLiked } from '../../lib/api'

const { width } = Dimensions.get('window')
const PLAYER_HEIGHT = width * (9 / 16)

export default function PlayerScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>()
  const router      = useRouter()

  const [video,   setVideo]   = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [liked,   setLiked]   = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  useEffect(() => {
    if (!videoId) return

    // Fetch video metadata from our DB
    supabase
      .from('videos')
      .select('*')
      .eq('youtube_video_id', videoId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setVideo(data as Video)
          recordWatch(data.id)
          isLiked(data.id).then(setLiked)
        }
        setLoading(false)
      })
  }, [videoId])

  if (!videoId) return null

  return (
    <View style={styles.container}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      {/* YouTube Player */}
      <View style={styles.playerWrapper}>
        <YoutubePlayer
          height={PLAYER_HEIGHT}
          videoId={videoId}
          play={playing}
          onChangeState={(state: string) => {
            if (state === 'ended') setPlaying(false)
          }}
        />
      </View>

      <ScrollView style={styles.info} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color="#c084fc" style={{ marginTop: 20 }} />
        ) : video ? (
          <>
            {/* Title — tapping opens the video on YouTube (III.I.4 compliance) */}
            <TouchableOpacity
              onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`)}
              activeOpacity={0.8}
            >
              <Text style={[styles.title, styles.titleLink]}>{video.title}</Text>
            </TouchableOpacity>

            <View style={styles.metaRow}>
              <Text style={styles.artist}>{video.artist_name}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.metaText}>{timeAgo(video.published_at)}</Text>
              {video.view_count ? (
                <>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.metaText}>{formatViews(video.view_count)}</Text>
                </>
              ) : null}
            </View>

            {/* Tags */}
            <View style={styles.tags}>
              {video.raga && (
                <View style={styles.tag}>
                  <Text style={styles.tagLabel}>Raga</Text>
                  <Text style={styles.tagValue}>{video.raga}</Text>
                </View>
              )}
              {video.tala && (
                <View style={styles.tag}>
                  <Text style={styles.tagLabel}>Tala</Text>
                  <Text style={styles.tagValue}>{video.tala}</Text>
                </View>
              )}
              {video.video_type && video.video_type !== 'other' && (
                <View style={styles.tag}>
                  <Text style={styles.tagLabel}>Type</Text>
                  <Text style={styles.tagValue}>{video.video_type}</Text>
                </View>
              )}
              {video.duration_seconds ? (
                <View style={styles.tag}>
                  <Text style={styles.tagLabel}>Duration</Text>
                  <Text style={styles.tagValue}>{formatDuration(video.duration_seconds)}</Text>
                </View>
              ) : null}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {/* Like button */}
              <TouchableOpacity
                style={[styles.actionBtn, liked && styles.actionBtnLiked]}
                disabled={likeLoading}
                onPress={async () => {
                  setLikeLoading(true)
                  const nowLiked = await toggleLike(video.id)
                  setLiked(nowLiked)
                  setLikeLoading(false)
                }}
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={16}
                  color={liked ? '#ff4d4d' : '#c084fc'}
                />
                <Text style={[styles.actionText, liked && styles.actionTextLiked]}>
                  {liked ? 'Liked' : 'Like'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push(`/search?q=${encodeURIComponent(video.artist_name)}`)}
              >
                <Text style={styles.actionEmoji}>🎤</Text>
                <Text style={styles.actionText}>More by {video.artist_name.split(' ')[0]}</Text>
              </TouchableOpacity>

              {video.raga && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push(`/search?q=${encodeURIComponent(video.raga!)}`)}
                >
                  <Text style={styles.actionEmoji}>🎵</Text>
                  <Text style={styles.actionText}>More {video.raga}</Text>
                </TouchableOpacity>
              )}

              {/* Watch on YouTube — required by YouTube API ToS (III.I.4 + III.F.2a,b) */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.ytBtn]}
                onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`)}
              >
                <Ionicons name="logo-youtube" size={16} color="#FF0000" />
                <Text style={styles.ytBtnText}>Watch on YouTube</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.noMeta}>Playing video…</Text>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: '#0f0a1e',
  },
  closeBtn: {
    position:  'absolute',
    top:       48,
    right:     16,
    zIndex:    10,
    width:     36,
    height:    36,
    borderRadius:    18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16 },
  playerWrapper: {
    backgroundColor: '#000',
    marginTop:       80,
  },
  info: {
    flex:    1,
    padding: 16,
  },
  title: {
    color:      '#f0e6d3',
    fontSize:   16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    flexWrap:      'wrap',
    gap:           6,
    marginBottom:  16,
  },
  artist:   { color: '#c084fc', fontSize: 14, fontWeight: '600' },
  dot:      { color: '#6b5a80', fontSize: 14 },
  metaText: { color: '#a89070', fontSize: 13 },
  tags: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
    marginBottom:  20,
  },
  tag: {
    backgroundColor: '#1a1433',
    borderRadius:    10,
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderWidth:     1,
    borderColor:     '#2d1b4e',
  },
  tagLabel: { color: '#6b5a80', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  tagValue: { color: '#c084fc', fontSize: 13, fontWeight: '600', marginTop: 2 },
  actions: {
    flexDirection: 'row',
    gap:           10,
    flexWrap:      'wrap',
  },
  actionBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#1a1433',
    borderRadius:    20,
    paddingHorizontal: 14,
    paddingVertical:   10,
    gap:             6,
    borderWidth:     1,
    borderColor:     '#2d1b4e',
  },
  actionBtnLiked: {
    borderColor: '#ff4d4d',
  },
  actionEmoji: { fontSize: 16 },
  actionText:  { color: '#c084fc', fontSize: 13, fontWeight: '500' },
  actionTextLiked: { color: '#ff4d4d' },
  noMeta:      { color: '#6b5a80', textAlign: 'center', marginTop: 20 },
  titleLink:   { textDecorationLine: 'underline', textDecorationColor: '#3a2a50' },
  ytBtn: {
    borderColor: '#3a0000',
    backgroundColor: '#1a0000',
  },
  ytBtnText: { color: '#FF0000', fontSize: 13, fontWeight: '600' },
})
