import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ToastAndroid, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../hooks/useAuth'
import { YT } from '../../lib/theme'

const comingSoon = () => {
  if (Platform.OS === 'android') {
    ToastAndroid.show('Coming soon!', ToastAndroid.SHORT)
  } else {
    Alert.alert('Coming Soon', 'This feature will be available in a future update.')
  }
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

function MenuItem({
  icon, label, danger, onPress, value,
}: {
  icon:     IoniconName
  label:    string
  danger?:  boolean
  onPress?: () => void
  value?:   string
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={22} color={danger ? '#F44' : YT.textSecondary} style={styles.menuIcon} />
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {value ? (
        <Text style={styles.menuValue}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={YT.textTertiary} />
      )}
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const router                                       = useRouter()
  const { user, loading, signInWithGoogle, signOut } = useAuth()

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel',   style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ])
  }

  if (loading) return <View style={styles.container} />

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {user ? (
          <>
            {/* ── Account card ── */}
            <View style={styles.accountCard}>
              <View style={styles.bigAvatar}>
                <Text style={styles.bigAvatarLetter}>
                  {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <Text style={styles.accountName}>
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={styles.accountEmail}>{user.email}</Text>
            </View>

            {/* ── Your library section ── */}
            <Text style={styles.sectionLabel}>Your Library</Text>
            <View style={styles.section}>
              <MenuItem
                icon="time-outline"
                label="Watch History"
                onPress={comingSoon}
              />
              <MenuItem
                icon="list-outline"
                label="Playlists"
                onPress={comingSoon}
              />
              <MenuItem
                icon="heart-outline"
                label="Liked Videos"
                onPress={comingSoon}
              />
            </View>

            {/* ── Account section ── */}
            <Text style={styles.sectionLabel}>Account</Text>
            <View style={styles.section}>
              <MenuItem
                icon="shield-checkmark-outline"
                label="Privacy Policy"
                onPress={() => router.push('/privacy')}
              />
              <MenuItem
                icon="log-out-outline"
                label="Sign Out"
                danger
                onPress={handleSignOut}
              />
            </View>
          </>
        ) : (
          /* ── Signed-out state ── */
          <View style={styles.signInBlock}>
            <View style={styles.ytLogoLarge}>
              <View style={styles.ytBadgeLarge}>
                <Text style={styles.ytPlayLarge}>▶</Text>
              </View>
              <Text style={styles.ytWordLarge}>Carnatic</Text>
            </View>

            <Text style={styles.signInTitle}>Sign in</Text>
            <Text style={styles.signInSubtitle}>
              Get personalised recommendations, save playlists, and track your progress
            </Text>

            <TouchableOpacity style={styles.googleBtn} onPress={signInWithGoogle} activeOpacity={0.85}>
              <Ionicons name="logo-google" size={18} color="#4285F4" />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <Text style={styles.skipText}>
              You can still browse and search without an account
            </Text>

            <TouchableOpacity onPress={() => router.push('/privacy')}>
              <Text style={styles.privacyLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.ytFooterRow}>
            <View style={styles.ytMini}>
              <Text style={styles.ytMiniPlay}>▶</Text>
            </View>
            <Text style={styles.footerPowered}>Powered by YouTube</Text>
          </View>
          <Text style={styles.footerVersion}>Carnatic App v1.0</Text>
        </View>

      </ScrollView>
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
    paddingBottom:     10,
  },
  title: {
    color:      YT.textPrimary,
    fontSize:   20,
    fontWeight: '700',
  },

  // ── Account card ──
  accountCard: {
    alignItems:  'center',
    paddingTop:  28,
    paddingBottom: 24,
    gap:         6,
    borderBottomWidth: 1,
    borderBottomColor: YT.border,
    marginBottom: 24,
  },
  bigAvatar: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: YT.surface,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    6,
  },
  bigAvatarLetter: {
    color:      YT.textPrimary,
    fontSize:   28,
    fontWeight: '700',
  },
  accountName: {
    color:      YT.textPrimary,
    fontSize:   16,
    fontWeight: '600',
  },
  accountEmail: {
    color:    YT.textTertiary,
    fontSize: 13,
  },

  // ── Sections ──
  sectionLabel: {
    color:      YT.textTertiary,
    fontSize:   12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 14,
    marginBottom: 4,
    marginTop:    8,
  },
  section: {
    marginBottom: 20,
  },

  // ── Menu items ──
  menuItem: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 14,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: YT.surface,
  },
  menuIcon:  { marginRight: 14 },
  menuLabel: {
    flex:     1,
    color:    YT.textPrimary,
    fontSize: 14,
  },
  menuLabelDanger: { color: '#F44' },
  menuValue: {
    color:    YT.textTertiary,
    fontSize: 13,
  },

  // ── Sign-in block ──
  signInBlock: {
    alignItems:      'center',
    paddingHorizontal: 32,
    paddingTop:      40,
    gap:             14,
  },
  ytLogoLarge: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginBottom:  8,
  },
  ytBadgeLarge: {
    width:           40,
    height:          28,
    backgroundColor: YT.red,
    borderRadius:    6,
    alignItems:      'center',
    justifyContent:  'center',
  },
  ytPlayLarge: {
    color:    '#fff',
    fontSize: 14,
    marginLeft: 1,
  },
  ytWordLarge: {
    color:      YT.textPrimary,
    fontSize:   28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  signInTitle: {
    color:      YT.textPrimary,
    fontSize:   22,
    fontWeight: '700',
    textAlign:  'center',
  },
  signInSubtitle: {
    color:     YT.textSecondary,
    fontSize:  14,
    textAlign: 'center',
    lineHeight: 20,
  },
  googleBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    borderWidth:     1,
    borderColor:     YT.border,
    borderRadius:    4,
    paddingVertical:  12,
    paddingHorizontal: 28,
    marginTop:        8,
    backgroundColor:  YT.surface,
  },
  googleBtnText: {
    color:      YT.textPrimary,
    fontSize:   15,
    fontWeight: '600',
  },
  skipText: {
    color:    YT.textTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
  privacyLink: {
    color:    YT.textTertiary,
    fontSize: 11,
    textDecorationLine: 'underline',
    marginTop: 4,
  },

  // ── Footer ──
  footer: {
    alignItems:  'center',
    gap:         6,
    paddingVertical: 40,
    paddingBottom: 20,
  },
  ytFooterRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  ytMini: {
    width:           18,
    height:          12,
    backgroundColor: YT.red,
    borderRadius:    3,
    alignItems:      'center',
    justifyContent:  'center',
  },
  ytMiniPlay: {
    color:    '#fff',
    fontSize: 6,
    marginLeft: 1,
  },
  footerPowered: {
    color:    YT.textTertiary,
    fontSize: 12,
  },
  footerVersion: {
    color:    YT.textTertiary,
    fontSize: 11,
  },
})
