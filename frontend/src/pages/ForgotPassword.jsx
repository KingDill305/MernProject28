import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Field, { FormMessage } from '../components/Field.jsx';
import { api } from '../api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter the email address on your account.');
    setError('');
    setBusy(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" intro={`If ${email.trim()} belongs to an account, a reset link is on its way. It works for one hour.`}>
        <p className="auth-switch"><Link to="/login">Back to log in</Link></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" intro="Enter your account email and we’ll send you a link to choose a new password.">
      <form className="form" onSubmit={submit} noValidate>
        <Field label="Email" name="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormMessage error={error} />
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
      </form>
      <p className="auth-switch"><Link to="/login">Back to log in</Link></p>
    </AuthLayout>
  );
}
