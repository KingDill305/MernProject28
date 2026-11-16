import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { C } from '../../lib/theme';
import { Button, s } from '../../components/ui';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [clubs, setClubs] = useState([]);

  useFocusEffect(useCallback(() => {
    api.listClubs(user.id, { mine: 'member' }).then(setClubs).catch(() => {});
  }, [user.id]));

  const initials = `${user.FirstName?.[0] || ''}${user.LastName?.[0] || ''}`.toUpperCase();

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <View style={{ alignItems: 'center', marginVertical: 16 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>{initials}</Text>
        </View>
        <Text style={[s.h1, { marginTop: 12 }]}>{user.FirstName} {user.LastName}</Text>
      </View>

      <Text style={s.h2}>My clubs</Text>
      {clubs.length === 0 ? (
        <Text style={s.muted}>You haven’t joined any clubs yet.</Text>
      ) : (
        clubs.map((c) => (
          <Text key={c._id} style={[s.body, { paddingVertical: 8 }]} onPress={() => router.push(`/club/${c._id}`)}>
            {c.Emoji || '⭐'}  {c.Name}{c.MyRole === 'officer' ? '  · Officer' : ''}
          </Text>
        ))
      )}

      <Button title="Log out" kind="ghost" onPress={signOut} style={{ marginTop: 32 }} />
    </ScrollView>
  );
}
