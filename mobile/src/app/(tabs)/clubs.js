import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { C, themeOf } from '../../lib/theme';
import { Empty, Message, Tag, s } from '../../components/ui';

export default function Clubs() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Wait until typing pauses before searching
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setClubs(await api.listClubs(user.id, { search: query }));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [user.id, query]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={s.screen}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <TextInput
          style={s.input}
          value={search}
          onChangeText={setSearch}
          placeholder="Search clubs by name"
          placeholderTextColor={C.muted}
          accessibilityLabel="Search clubs"
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <FlatList
        data={clubs || []}
        keyExtractor={(c) => String(c._id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.accent} />}
        ListHeaderComponent={<Message error={error} />}
        ListEmptyComponent={<Empty text={clubs ? (query ? `No clubs match “${query}”.` : 'No clubs yet.') : 'Loading…'} />}
        renderItem={({ item: c }) => (
          <Pressable onPress={() => router.push(`/club/${c._id}`)} accessibilityRole="button" style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}>
            <View style={[s.poster, { backgroundColor: themeOf(c.Theme).bg }]}>
              <Text style={s.posterEmoji}>{c.Emoji || '⭐'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{c.Name}</Text>
              <Text style={s.cardMeta} numberOfLines={2}>{c.Description}</Text>
              <View style={s.row}>
                {c.Category ? <Tag text={c.Category} color={C.muted} /> : null}
                {c.MyRole ? <Tag text={c.MyRole === 'officer' ? 'Officer' : 'Member'} color={C.accent} /> : null}
                <Text style={s.cardMeta}>{c.MemberCount} {c.MemberCount === 1 ? 'member' : 'members'}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
