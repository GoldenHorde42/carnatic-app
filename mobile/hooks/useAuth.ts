import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as QueryParams from 'expo-auth-session/build/QueryParams'
import { makeRedirectUri } from 'expo-auth-session'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Required for OAuth on iOS to properly close the browser
WebBrowser.maybeCompleteAuthSession()

const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url)
  if (errorCode) throw new Error(errorCode)
  const { access_token, refresh_token } = params
  if (!access_token) return null
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
  if (error) throw error
  return data.session
}

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
    const redirectTo = makeRedirectUri({
      scheme: 'carnatic',
      path:   'auth/callback',
    })

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
    if (!data.url) throw new Error('No OAuth URL returned')

    // Open the OAuth URL in an in-app browser
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

    if (result.type === 'success') {
      // Extract tokens from the redirect URL and set the Supabase session
      await createSessionFromUrl(result.url)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { session, user, loading, signInWithGoogle, signOut }
}
