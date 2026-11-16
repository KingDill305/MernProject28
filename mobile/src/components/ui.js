import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { C, formatWhen, themeOf } from '../lib/theme';

export function Field({ label, hint, ...props }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} placeholderTextColor={C.muted} autoCapitalize="none" accessibilityLabel={label} {...props} />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Button({ title, onPress, busy, kind = 'primary', disabled, style }) {
  const ghost = kind === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      accessibilityRole="button"
      style={({ pressed }) => [s.btn, ghost ? s.btnGhost : s.btnPrimary, (pressed || disabled) && { opacity: 0.7 }, style]}
    >
      {busy ? (
        <ActivityIndicator color={ghost ? C.accent : '#fff'} />
      ) : (
        <Text style={[s.btnText, ghost && { color: C.accent }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export const Message = ({ error, info }) =>
  error ? <Text style={[s.msg, { color: C.danger }]}>{error}</Text>
  : info ? <Text style={[s.msg, { color: C.going }]}>{info}</Text>
  : null;

export const Empty = ({ text }) => <Text style={s.empty}>{text}</Text>;

export function EventCard({ ev, onPress }) {
  const t = themeOf(ev.Theme);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}>
      <View style={[s.poster, { backgroundColor: t.bg }]}>
        <Text style={s.posterEmoji}>{ev.Emoji || '🎉'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.cardTitle} numberOfLines={2}>{ev.Title}</Text>
        <Text style={s.cardMeta}>{formatWhen(ev.Start)}</Text>
        <Text style={s.cardMeta} numberOfLines={1}>{[ev.ClubName, ev.Location].filter(Boolean).join(' · ')}</Text>
        <View style={s.row}>
          {ev.Cancelled ? <Tag text="Cancelled" color={C.danger} /> : null}
          {ev.MyStatus === 'going' ? <Tag text="Going" color={C.going} /> : null}
          {ev.MyStatus === 'maybe' ? <Tag text="Maybe" color={C.maybe} /> : null}
          {typeof ev.GoingCount === 'number' ? <Text style={s.cardMeta}>{ev.GoingCount} going</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

export const Tag = ({ text, color }) => (
  <View style={[s.tag, { borderColor: color }]}><Text style={[s.tagText, { color }]}>{text}</Text></View>
);

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  pad: { padding: 16 },
  h1: { fontSize: 28, fontWeight: '800', color: C.ink, marginBottom: 6 },
  h2: { fontSize: 18, fontWeight: '700', color: C.ink, marginTop: 20, marginBottom: 8 },
  body: { fontSize: 15, color: C.ink, lineHeight: 22 },
  muted: { fontSize: 14, color: C.muted, lineHeight: 20 },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 6 },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: C.ink },
  hint: { fontSize: 13, color: C.muted, marginTop: 4 },
  btn: { borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  btnPrimary: { backgroundColor: C.accent },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.accent },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  msg: { fontSize: 14, marginBottom: 12 },
  link: { color: C.accent, fontWeight: '600', fontSize: 15, textAlign: 'center', paddingVertical: 10 },
  empty: { textAlign: 'center', color: C.muted, fontSize: 15, marginTop: 40, paddingHorizontal: 24 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.line, padding: 12, marginBottom: 10 },
  poster: { width: 64, height: 64, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  posterEmoji: { fontSize: 30 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.ink },
  cardMeta: { fontSize: 13, color: C.muted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 12, fontWeight: '700' },
});
