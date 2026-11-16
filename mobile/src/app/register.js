import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { api } from '../lib/api';
import { Button, Field, Message, s } from '../components/ui';

const EMPTY = { FirstName: '', LastName: '', Email: '', Login: '', Password: '', Confirm: '' };

// Same rules as the web sign-up form
function validate(f) {
  if (!f.FirstName.trim() || !f.LastName.trim()) return 'Enter your first and last name.';
  if (f.Email.trim() && !/^\S+@\S+\.\S+$/.test(f.Email.trim())) return 'Enter a valid email address, or leave it blank.';
  if (f.Login.trim().length < 3) return 'Usernames need at least 3 characters.';
  if (f.Password.length < 8) return 'Passwords need at least 8 characters.';
  if (f.Password !== f.Confirm) return 'The two passwords don’t match.';
  return '';
}

export default function Register() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // { email } once created

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    const problem = validate(form);
    if (problem) return setError(problem);
    setError('');
    setBusy(true);
    try {
      const email = form.Email.trim();
      await api.register({
        FirstName: form.FirstName.trim(),
        LastName: form.LastName.trim(),
        Login: form.Login.trim(),
        Password: form.Password,
        Email: email || undefined, // blank email: account is active right away
      });
      setDone({ email });
    } catch (err) {
      if (err.status === 409) setError(/email/i.test(err.message) ? 'That email already has an account.' : 'That username is taken. Try another one.');
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    try {
      await api.resendVerification(done.email);
      setInfo('Sent. Check your inbox (and spam folder).');
    } catch (err) {
      setError(err.message);
    }
  }

  if (done) {
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.pad}>
        <Text style={s.h1}>{done.email ? 'Check your email' : 'Account created'}</Text>
        <Text style={[s.body, { marginBottom: 20 }]}>
          {done.email
            ? `We sent a verification link to ${done.email}. Open it to activate your account, then log in.`
            : 'You’re all set. Log in with the username and password you just chose.'}
        </Text>
        <Message error={error} info={info} />
        <Button title="Go to log in" onPress={() => router.back()} />
        {done.email ? <Button title="Resend the email" kind="ghost" onPress={resend} style={{ marginTop: 10 }} /> : null}
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
        <Text style={[s.muted, { marginBottom: 16 }]}>Join clubs and RSVP to events on campus.</Text>
        <Field label="First name" value={form.FirstName} onChangeText={set('FirstName')} autoCapitalize="words" autoComplete="given-name" />
        <Field label="Last name" value={form.LastName} onChangeText={set('LastName')} autoCapitalize="words" autoComplete="family-name" />
        <Field label="Email" value={form.Email} onChangeText={set('Email')} keyboardType="email-address" autoComplete="email" />
        <Field label="Username" value={form.Login} onChangeText={set('Login')} autoComplete="username" />
        <Field label="Password" value={form.Password} onChangeText={set('Password')} secureTextEntry autoComplete="new-password" hint="At least 8 characters." />
        <Field label="Confirm password" value={form.Confirm} onChangeText={set('Confirm')} secureTextEntry autoComplete="new-password" />
        <Message error={error} />
        <Button title="Create account" onPress={submit} busy={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
