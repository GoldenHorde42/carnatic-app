import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { YT } from '../../lib/theme'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

function tabIcon(
  outlineName: IoniconsName,
  filledName:  IoniconsName,
) {
  return ({ focused }: { focused: boolean }) => (
    <Ionicons
      name={focused ? filledName : outlineName}
      size={24}
      color={focused ? YT.textPrimary : YT.textTertiary}
    />
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:     false,
        tabBarStyle: {
          backgroundColor: YT.bg,
          borderTopColor:  YT.border,
          borderTopWidth:  0.5,
          height:          58,
          paddingBottom:   8,
          paddingTop:      6,
        },
        tabBarActiveTintColor:   YT.textPrimary,
        tabBarInactiveTintColor: YT.textTertiary,
        tabBarLabelStyle: {
          fontSize:   10,
          fontWeight: '500',
          marginTop:  -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:       'Home',
          tabBarIcon:  tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title:       'Search',
          tabBarIcon:  tabIcon('search-outline', 'search'),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title:       'Browse',
          tabBarIcon:  tabIcon('grid-outline', 'grid'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title:       'Library',
          tabBarIcon:  tabIcon('person-outline', 'person'),
        }}
      />
    </Tabs>
  )
}
