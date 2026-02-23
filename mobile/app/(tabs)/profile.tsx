import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'

export default function ProfileScreen() {
  const router                            = useRouter()
  const { user, loading, signInWithGoogle, signOut } = useAuth()

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ])
  }

  if (loading) return <View style={styles.container} />

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {user ? (
          <>
            {/* User card */}
            <View style={styles.userCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>

            {/* Menu items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Library</Text>
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/search?q=my history')}>
                <Text style={styles.menuEmoji}>📜</Text>
                <Text style={styles.menuLabel}>Watch History</Text>
                <Text style={styles.menuChevron}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuEmoji}>📋</Text>
                <Text style={styles.menuLabel}>My Playlists</Text>
                <Text style={styles.menuChevron}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                <Text style={styles.menuEmoji}>🚪</Text>
                <Text style={[styles.menuLabel, styles.signOutText]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Not logged in */
          <View style={styles.signInSection}>
            <Text style={styles.signInEmoji}>🎵</Text>
            <Text style={styles.signInTitle}>Sign in to unlock more</Text>
            <Text style={styles.signInSubtitle}>
              Get personalised recommendations, save playlists, and track your progress
            </Text>

            <TouchableOpacity style={styles.googleBtn} onPress={signInWithGoogle}>
              <Text style={styles.googleBtnText}>🔑  Sign in with Google</Text>
            </TouchableOpacity>

            <Text style={styles.skipText}>
              You can still browse and search without an account
            </Text>
          </View>
        )}

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Carnatic App v1.0</Text>
          <Text style={styles.appInfoText}>Curated Carnatic classical music</Text>
        </View>
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
    paddingHorizontal: 16,
    marginBottom:      24,
  },
  title: {
    color:      '#f0e6d3',
    fontSize:   24,
    fontWeight: '700',
  },
  userCard: {
    flexDirection:  'row',
    alignItems:     'center',
    marginHorizontal: 16,
    marginBottom:   24,
    backgroundColor: '#1a1433',
    borderRadius:   16,
    padding:        16,
  },
  avatar: {
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: '#2d1b4e',
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarEmoji: { fontSize: 28 },
  userInfo:    { flex: 1, marginLeft: 12 },
  userName:    { color: '#f0e6d3', fontSize: 17, fontWeight: '700' },
  userEmail:   { color: '#a89070', fontSize: 13, marginTop: 2 },
  section:     { marginBottom: 24 },
  sectionTitle: {
    color:      '#a89070',
    fontSize:   12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing:  1,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1a1433',
    marginHorizontal: 16,
    marginBottom:   2,
    borderRadius:   10,
  },
  menuEmoji:   { fontSize: 20, marginRight: 12 },
  menuLabel:   { flex: 1, color: '#f0e6d3', fontSize: 15 },
  menuChevron: { color: '#6b5a80', fontSize: 20 },
  signOutText: { color: '#f87171' },
  signInSection: {
    alignItems:      'center',
    paddingHorizontal: 32,
    paddingTop:      40,
  },
  signInEmoji: { fontSize: 64, marginBottom: 16 },
  signInTitle: {
    color:      '#f0e6d3',
    fontSize:   22,
    fontWeight: '700',
    textAlign:  'center',
  },
  signInSubtitle: {
    color:     '#a89070',
    fontSize:  14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  googleBtn: {
    backgroundColor: '#fff',
    borderRadius:    28,
    paddingVertical:  14,
    paddingHorizontal: 32,
    marginTop:        28,
    width:           '100%',
    alignItems:      'center',
  },
  googleBtnText: {
    color:      '#1a1433',
    fontSize:   16,
    fontWeight: '700',
  },
  skipText: {
    color:    '#6b5a80',
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  appInfo: {
    alignItems:  'center',
    marginTop:   40,
    marginBottom: 32,
    gap:          4,
  },
  appInfoText: {
    color:    '#3d2a5a',
    fontSize: 12,
  },
})
