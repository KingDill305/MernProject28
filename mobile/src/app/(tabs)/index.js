import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { C } from '../../lib/theme';
import { Empty, EventCard, Message, s } from '../../components/ui';

// Same four views as the web feed
const VIEWS = [
  { id: 'all', label: 'All campus', empty: 'No upcoming events yet.' },
  { id: 'clubs', label: 'My clubs', empty: 'Nothing coming up from your clubs. Join some on the Clubs tab.' },
  { id: 'going', label: 'Going', empty: 'You haven’t RSVP’d Going to anything yet.' },
  { id: 'past', label: 'Past', empty: 'No past events.' },
];

export default function Events() {
  const { user } = useAuth();
  const [view, setView] = useState('all');
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setEvents(await api.listEvents(user.id, view));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [user.id, view]);

  // Reload whenever this tab comes back into view (e.g. after an RSVP)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const current = VIEWS.find((v) => v.id === view);

  return (
    <View style={s.screen}>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
          {VIEWS.map((v) => {
            const on = v.id === view;
            return (
              <Pressable
                key={v.id}
                onPress={() => { setEvents(null); setView(v.id); }}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: on ? C.accent : C.line, backgroundColor: on ? C.accent : C.surface }}
              >
                <Text style={{ color: on ? '#fff' : C.ink, fontWeight: '600' }}>{v.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <FlatList
        data={events || []}
        keyExtractor={(e) => e.Code}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.accent} />}
        ListHeaderComponent={<Message error={error} />}
        ListEmptyComponent={events ? <Empty text={current.empty} /> : <Empty text="Loading…" />}
        renderItem={({ item }) => <EventCard ev={item} onPress={() => router.push(`/event/${item.Code}`)} />}
      />
    </View>
  );
}
