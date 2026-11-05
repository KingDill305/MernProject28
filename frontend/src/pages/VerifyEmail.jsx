import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { api } from '../api.js';

// Landing page for the link in the verification email: /verify-email?token=...
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState(token ? 'checking' : 'missing');
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    api.verifyEmail(token)
      .then(() => setState('done'))
      .catch((err) => { setError(err.message); setState('failed'); });
  }, [token]);

  const copy = {
    checking: ['Verifying your email', 'One moment…'],
    done: ['Email verified', 'Your account is active. Log in to find your clubs.'],
    failed: ['This link didn’t work', `${error} Links expire after 24 hours; log in to request a new one.`],
    missing: ['This link is incomplete', 'Open the link straight from the verification email, or copy the whole address.'],
  }[state];

  return (
    <AuthLayout title={copy[0]} intro={copy[1]}>
      {state !== 'checking' && (
        <p className="auth-switch"><Link className="btn btn-primary" to="/login">Go to log in</Link></p>
      )}
    </AuthLayout>
  );
}
