import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Field, { FormMessage } from '../components/Field.jsx';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const [form, setForm] = useState({ Login: '', Password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from || '/events';

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await api.login(form.Login.trim(), form.Password);
      signIn({ id: u.id, FirstName: u.FirstName, LastName: u.LastName });
      navigate(from, { replace: true });
    } catch (err) {
      // 401 = wrong credentials, 403 = account exists but email not verified yet
      if (err.status === 401) setError('Login failed. The username or password is incorrect.');
      else if (err.status === 403) setError('Verify your email first. We sent a link when you signed up.');
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Log in" intro="See what your clubs are up to this week.">
      <form className="form" onSubmit={submit} noValidate>
        <Field label="Username" name="Login" autoComplete="username" required value={form.Login} onChange={update} />
        <Field label="Password" name="Password" type="password" autoComplete="current-password" required value={form.Password} onChange={update} />
        <FormMessage error={error} />
        <button className="btn btn-primary" disabled={busy || !form.Login || !form.Password}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="auth-links">
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
      <p className="auth-switch">
        New to Quad? <Link to="/register" state={{ from }}>Create an account</Link>
      </p>
    </AuthLayout>
  );
}
