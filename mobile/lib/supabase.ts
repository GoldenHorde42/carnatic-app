import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = 'https://lyvbiiogdaoeawakoxgf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dmJpaW9nZGFvZWF3YWtveGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTAwMDMsImV4cCI6MjA4NzM4NjAwM30.tBBG-L49gDEz67c9kfzoANogbKr3Bb8hXfwq3iH-iq8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
})
