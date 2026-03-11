import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen
          name="privacy"
          options={{
            presentation: 'modal',
            headerShown:  false,
            animation:    'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="player/[videoId]"
          options={{
            presentation:   'modal',
            headerShown:    false,
            animation:      'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            presentation: 'card',
            headerShown:  false,
            animation:    'slide_from_right',
          }}
        />
        <Stack.Screen
          name="liked"
          options={{
            presentation: 'card',
            headerShown:  false,
            animation:    'slide_from_right',
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            presentation: 'modal',
            headerShown:  false,
            animation:    'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  )
}
