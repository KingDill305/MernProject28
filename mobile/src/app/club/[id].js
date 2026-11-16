import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { C, themeOf } from '../../lib/theme';
import { Button, Empty, EventCard, Message, Tag, s } from '../../components/ui';

export default function ClubScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setClub(await api.getClub(id, user.id));
      setError('');
    } catch (err) {
      setError(err.status === 404 ? 'This club doesn’t exist.' : err.message);
    }
  }, [id, user.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggle() {
    setBusy(true);
    try {
      if (club.MyRole) await api.leaveClub(id, user.id);
      else await api.joinClub(id, user.id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!club) return <View style={s.screen}><Empty text={error || 'Loading…'} /></View>;

  const t = themeOf(club.Theme);
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <Stack.Screen options={{ title: club.Name }} />
      <View style={{ backgroundColor: t.bg, padding: 24, alignItems: 'center' }}>
        <Text style={{ fontSize: 56 }}>{club.Emoji || '⭐'}</Text>
        <Text style={{ color: t.fg, fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 8 }}>{club.Name}</Text>
        {club.Category ? <Text style={{ color: t.fg, marginTop: 4 }}>{club.Category}</Text> : null}
      </View>

      <View style={s.pad}>
        <Message error={error} />
        {club.Description ? <Text style={[s.body, { marginBottom: 16 }]}>{club.Description}</Text> : null}
        <Button title={club.MyRole ? 'Leave club' : 'Join club'} kind={club.MyRole ? 'ghost' : 'primary'} onPress={toggle} busy={busy} />

        <Text style={s.h2}>Upcoming events</Text>
        {club.Events.length === 0 ? <Text style={s.muted}>Nothing scheduled.</Text> : null}
        {club.Events.map((e) => (
          <EventCard key={e.Code} ev={{ ...e, ClubName: club.Name }} onPress={() => router.push(`/event/${e.Code}`)} />
        ))}

        <Text style={s.h2}>Members · {club.Members.length}</Text>
        {club.Members.map((m) => (
          <View key={String(m.UserId)} style={[s.row, { marginTop: 0, paddingVertical: 6 }]}>
            <Text style={s.body}>{m.Name}</Text>
            {m.Role === 'officer' ? <Tag text="Officer" color={C.accent} /> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
