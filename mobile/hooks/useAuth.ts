import { useState, useEffect } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

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
    // Production deep-link uses the bundle identifier scheme
    // Development (Expo Go) uses the exp:// scheme handled by Supabase
    const redirectUrl = 'com.carnaticapp.music://auth/callback'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  {
        redirectTo: redirectUrl,
        // Skip browser prompt if already signed in
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { session, user, loading, signInWithGoogle, signOut }
}
