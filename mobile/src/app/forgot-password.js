import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { api } from '../lib/api';
import { Button, Field, Message, s } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter the email on your account.');
    setError('');
    setBusy(true);
    try {
      await api.forgotPassword(email.trim());
      setInfo('If that email has an account, we sent a reset link. It expires in 1 hour.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Text style={[s.muted, { marginBottom: 16 }]}>We’ll email you a link to choose a new password.</Text>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" onSubmitEditing={submit} />
      <Message error={error} info={info} />
      <Button title="Send reset link" onPress={submit} busy={busy} />
    </ScrollView>
  );
}
