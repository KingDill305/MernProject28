import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { C, formatWhen, themeOf } from '../../lib/theme';
import { Button, Empty, Message, s } from '../../components/ui';

const CHOICES = [
  { id: 'going', label: 'Going', color: C.going },
  { id: 'maybe', label: 'Maybe', color: C.maybe },
  { id: 'no', label: 'Can’t go', color: C.danger },
];

export default function EventScreen() {
  const { code } = useLocalSearchParams();
  const { user } = useAuth();
  const [ev, setEv] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [e, c] = await Promise.all([api.getEvent(code, user.id), api.listComments(code)]);
      setEv(e);
      setComments(c);
      setError('');
    } catch (err) {
      setError(err.status === 404 ? 'This event doesn’t exist.' : err.message);
    }
  }, [code, user.id]);

  useEffect(() => { load(); }, [load]);

  async function rsvp(Status, PlusOnes = 0) {
    setSaving(true);
    try {
      await api.rsvp(code, user.id, Status, PlusOnes);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function post() {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await api.addComment(code, user.id, text.trim());
      setText('');
      setComments(await api.listComments(code));
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  if (!ev) return <View style={s.screen}>{error ? <Empty text={error} /> : <Empty text="Loading…" />}</View>;

  const t = themeOf(ev.Theme);
  const my = ev.MyRsvp;
  const plus = my?.Status === 'going' ? my.PlusOnes : 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: ev.ClubName || 'Event' }} />
      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: t.bg, padding: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 56 }}>{ev.Emoji || '🎉'}</Text>
          <Text style={{ color: t.fg, fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 8 }}>{ev.Title}</Text>
          {ev.Cancelled ? <Text style={{ color: t.fg, fontWeight: '800', marginTop: 6 }}>CANCELLED</Text> : null}
        </View>

        <View style={s.pad}>
          <Message error={error} />
          <Text style={s.body}>🕒  {formatWhen(ev.Start)}{ev.End ? ` – ${formatWhen(ev.End)}` : ''}</Text>
          {ev.Location ? <Text style={[s.body, { marginTop: 6 }]}>📍  {ev.Location}</Text> : null}
          <Text style={[s.body, { marginTop: 6, color: C.accent }]} onPress={() => router.push(`/club/${ev.ClubId}`)}>
            ⭐  Hosted by {ev.ClubName}
          </Text>
          {ev.Description ? <Text style={[s.body, { marginTop: 14 }]}>{ev.Description}</Text> : null}

          {!ev.Cancelled ? (
            <>
              <Text style={s.h2}>Are you going?</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CHOICES.map((c) => {
                  const on = my?.Status === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      disabled={saving}
                      onPress={() => rsvp(c.id, c.id === 'going' ? plus : 0)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 2, borderColor: c.color, backgroundColor: on ? c.color : C.surface, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
                    >
                      <Text style={{ color: on ? '#fff' : c.color, fontWeight: '700' }}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {my?.Status === 'going' ? (
                <View style={[s.row, { marginTop: 12, justifyContent: 'space-between' }]}>
                  <Text style={s.body}>Bringing guests (+{plus})</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Button title="−" kind="ghost" disabled={saving || plus <= 0} onPress={() => rsvp('going', plus - 1)} style={{ minHeight: 40, paddingVertical: 6, width: 48 }} />
                    <Button title="+" kind="ghost" disabled={saving || plus >= 5} onPress={() => rsvp('going', plus + 1)} style={{ minHeight: 40, paddingVertical: 6, width: 48 }} />
                  </View>
                </View>
              ) : null}
            </>
          ) : null}

          <Text style={s.h2}>Guest list · {ev.Counts.going} going, {ev.Counts.maybe} maybe</Text>
          {ev.Guests.length === 0 ? (
            <Text style={s.muted}>No one yet. Be the first!</Text>
          ) : (
            ev.Guests.map((g) => (
              <Text key={String(g.UserId)} style={[s.body, { paddingVertical: 3 }]}>
                • {g.Name}{g.PlusOnes ? ` (+${g.PlusOnes})` : ''}
              </Text>
            ))
          )}

          <Text style={s.h2}>Comments</Text>
          {comments.length === 0 ? <Text style={s.muted}>No comments yet.</Text> : null}
          {comments.map((c) => (
            <View key={String(c._id)} style={{ backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.line, padding: 10, marginBottom: 8 }}>
              <Text style={{ fontWeight: '700', color: C.ink }}>{c.Name} <Text style={s.cardMeta}>{formatWhen(c.CreatedAt)}</Text></Text>
              <Text style={[s.body, { marginTop: 2 }]}>{c.Text}</Text>
            </View>
          ))}
          <TextInput
            style={[s.input, { marginTop: 8, minHeight: 60, textAlignVertical: 'top' }]}
            value={text}
            onChangeText={setText}
            placeholder="Add a comment"
            placeholderTextColor={C.muted}
            accessibilityLabel="Add a comment"
            multiline
            autoCapitalize="sentences"
          />
          <Button title="Post comment" onPress={post} busy={posting} disabled={!text.trim()} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
