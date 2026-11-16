import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Field, { FormMessage } from '../components/Field.jsx';
import { api } from '../api.js';

const EMPTY = { FirstName: '', LastName: '', Email: '', Login: '', Password: '', Confirm: '' };

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
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // { email } once the account is created
  const from = useLocation().state?.from;

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const problem = validate(form);
    if (problem) return setError(problem);
    setError('');
    setBusy(true);
    try {
      const { Confirm, ...body } = form;
      const email = body.Email.trim();
      await api.register({
        ...body, FirstName: body.FirstName.trim(), LastName: body.LastName.trim(), Login: body.Login.trim(),
        Email: email || undefined, // blank email: account is active right away
      });
      setDone({ email });
    } catch (err) {
      if (err.status === 409) setError(/email/i.test(err.message) ? 'That email already has an account. Log in or use another email.' : 'That username is taken. Try another one.');
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done && done.email) {
    return (
      <AuthLayout title="Check your email" intro={`We sent a verification link to ${done.email}. Open it to activate your account, then log in.`}>
        <p className="auth-switch"><Link className="btn btn-primary" to="/login" state={{ from }}>Go to log in</Link></p>
        <p className="auth-links">
          Didn’t get it? <ResendLink email={done.email} />
        </p>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Account created" intro="You’re all set. Log in with the username and password you just chose.">
        <p className="auth-switch"><Link className="btn btn-primary" to="/login" state={{ from }}>Go to log in</Link></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" intro="Join clubs and RSVP to events on campus.">
      <form className="form" onSubmit={submit} noValidate>
        <div className="field-row">
          <Field label="First name" name="FirstName" autoComplete="given-name" value={form.FirstName} onChange={update} />
          <Field label="Last name" name="LastName" autoComplete="family-name" value={form.LastName} onChange={update} />
        </div>
        <Field label="Email (optional)" name="Email" type="email" autoComplete="email" hint="Add one to get a verification link, or leave it blank for now."
          value={form.Email} onChange={update} />
        <Field label="Username" name="Login" autoComplete="username" value={form.Login} onChange={update} />
        <Field label="Password" name="Password" type="password" autoComplete="new-password" hint="At least 8 characters." value={form.Password} onChange={update} />
        <Field label="Confirm password" name="Confirm" type="password" autoComplete="new-password" value={form.Confirm} onChange={update} />
        <FormMessage error={error} />
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login" state={{ from }}>Log in</Link></p>
    </AuthLayout>
  );
}

export function ResendLink({ email }) {
  const [state, setState] = useState('idle');
  async function resend() {
    setState('sending');
    try { await api.resendVerification(email); setState('sent'); } catch { setState('failed'); }
  }
  if (state === 'sent') return <span role="status">Sent another link.</span>;
  if (state === 'failed') return <span role="alert">Couldn’t resend right now. Try again in a minute.</span>;
  return <button type="button" className="link-button" onClick={resend} disabled={state === 'sending'}>Send it again</button>;
}
