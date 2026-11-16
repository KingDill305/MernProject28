import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth';
import { C } from '../lib/theme';

function RootStack() {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.paper }}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }
  return (
    <Stack
      screenOptions={{
        headerTintColor: C.accent,
        headerTitleStyle: { color: C.ink, fontWeight: '700' },
        contentStyle: { backgroundColor: C.paper },
      }}
    >
      {/* Logged out: only the account screens exist */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Create account' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Reset password' }} />
      </Stack.Protected>

      {/* Logged in */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="event/[code]" options={{ title: 'Event' }} />
        <Stack.Screen name="club/[id]" options={{ title: 'Club' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootStack />
    </AuthProvider>
  );
}
