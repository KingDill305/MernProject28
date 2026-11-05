import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Field, { FormMessage } from '../components/Field.jsx';
import { api } from '../api.js';

// Landing page for the link in the reset email: /reset-password?token=...
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [form, setForm] = useState({ Password: '', Confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (form.Password.length < 8) return setError('Passwords need at least 8 characters.');
    if (form.Password !== form.Confirm) return setError('The two passwords don’t match.');
    setError('');
    setBusy(true);
    try {
      await api.resetPassword(token, form.Password);
      setDone(true);
    } catch (err) {
      setError(err.status === 400 ? 'This reset link has expired or was already used. Request a new one.' : err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout title="This link is incomplete" intro="Open the link straight from the reset email, or request a new one.">
        <p className="auth-switch"><Link className="btn btn-primary" to="/forgot-password">Request a new link</Link></p>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Password changed" intro="Log in with your new password.">
        <p className="auth-switch"><Link className="btn btn-primary" to="/login">Go to log in</Link></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password">
      <form className="form" onSubmit={submit} noValidate>
        <Field label="New password" name="Password" type="password" autoComplete="new-password" hint="At least 8 characters." value={form.Password} onChange={update} />
        <Field label="Confirm new password" name="Confirm" type="password" autoComplete="new-password" value={form.Confirm} onChange={update} />
        <FormMessage error={error} />
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
      </form>
    </AuthLayout>
  );
}
