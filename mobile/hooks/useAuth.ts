import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// OAuth Client IDs (safe to embed — these are public identifiers)
// iOS client ID: add after Apple Developer enrollment + iOS OAuth client creation
const ANDROID_CLIENT_ID = '298276742704-mue9um64sv808up3ehfudct13ma8bbdi.apps.googleusercontent.com'
const IOS_CLIENT_ID     = '298276742704-o8c0k7i2l5fefjdvphdntsvrl8c43pjg.apps.googleusercontent.com'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const redirectUrl = 'carnatic://auth/callback'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  {
        redirectTo: redirectUrl,
        queryParams: {
          prompt:    'select_account',
          // Pass the platform-specific client ID so Google knows which app is requesting
          client_id: Platform.OS === 'android' ? ANDROID_CLIENT_ID : IOS_CLIENT_ID || ANDROID_CLIENT_ID,
        },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { session, user, loading, signInWithGoogle, signOut }
}
