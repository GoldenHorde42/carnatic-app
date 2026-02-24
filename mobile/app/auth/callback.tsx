/**
 * auth/callback.tsx
 *
 * This screen handles the OAuth redirect after Google Sign-In.
 * The deep-link com.carnaticapp.music://auth/callback lands here.
 * Supabase automatically extracts the session from the URL hash,
 * so we just show a loading spinner and redirect to home.
 */
import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { YT } from '../../lib/theme'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Give Supabase a moment to process the auth session from URL params
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/(tabs)')
      } else {
        router.replace('/(tabs)/profile')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={YT.red} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: YT.bg,
    alignItems:      'center',
    justifyContent:  'center',
  },
})
