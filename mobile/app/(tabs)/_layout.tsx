import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'

function TabIcon({ label, emoji, focused }: { label: string; emoji: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.emoji, focused && styles.focusedEmoji]}>{emoji}</Text>
      <Text style={[styles.label, focused && styles.focusedLabel]}>{label}</Text>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:     false,
        tabBarStyle:     styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Home"   emoji="🎵" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Search" emoji="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Browse" emoji="🎼" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0f0a1e',
    borderTopColor:  '#1e1433',
    borderTopWidth:  1,
    height:          70,
    paddingBottom:   10,
  },
  tabIcon: {
    alignItems: 'center',
    gap:        2,
  },
  emoji: {
    fontSize: 22,
    opacity:  0.5,
  },
  focusedEmoji: {
    opacity: 1,
  },
  label: {
    color:    '#6b5a80',
    fontSize: 10,
  },
  focusedLabel: {
    color: '#c084fc',
  },
})
