import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { C } from '../../lib/theme';

const icon = (glyph) => ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{glyph}</Text>;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        headerTitleStyle: { color: C.ink, fontWeight: '800' },
        sceneStyle: { backgroundColor: C.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Events', tabBarIcon: icon('📅') }} />
      <Tabs.Screen name="clubs" options={{ title: 'Clubs', tabBarIcon: icon('⭐') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
