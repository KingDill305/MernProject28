import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { C } from '../lib/theme';
import { Button, Field, Message, s } from '../components/ui';

export default function Login() {
  const { signIn } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!login.trim() || !password) return setError('Enter your username and password.');
    setError('');
    setBusy(true);
    try {
      const u = await api.login(login.trim(), password);
      await signIn(u); // the layout switches to the logged-in screens
    } catch (err) {
      if (err.status === 401) setError('That username and password don’t match.');
      else if (err.status === 403) setError('Verify your email first. Check your inbox for the link.');
      else setError(err.message);
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[s.pad, { flexGrow: 1, justifyContent: 'center' }]} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Text style={{ fontSize: 44 }}>🎉</Text>
            <Text style={[s.h1, { color: C.accent, fontSize: 36 }]}>Quad</Text>
            <Text style={s.muted}>Clubs and events on campus</Text>
          </View>
          <Field label="Username" value={login} onChangeText={setLogin} autoComplete="username" textContentType="username" returnKeyType="next" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} />
          <Message error={error} />
          <Button title="Log in" onPress={submit} busy={busy} />
          <Link href="/forgot-password" style={s.link}>Forgot password?</Link>
          <Link href="/register" style={s.link}>New here? Create an account</Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
