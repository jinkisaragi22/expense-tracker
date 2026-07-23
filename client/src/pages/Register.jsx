import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../api/client';
import { useAuthStore } from '../store/auth';
import { Field, inputCls, btnPrimary, ErrorNote } from '../components/Field';
import { AuthShell } from './Login';
import GoogleButton from '../components/GoogleButton';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setAuth(data);
      navigate('/');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Start your trail" subtitle="Track every dollar in and out.">
      <form onSubmit={submit} className="space-y-4">
        <ErrorNote>{error}</ErrorNote>
        <Field label="Name">
          <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Your name" />
        </Field>
        <Field label="Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="At least 8 characters" />
        </Field>
        <button disabled={busy} className={`${btnPrimary} w-full`}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <GoogleButton onError={setError} />
      <p className="mt-4 text-center text-sm text-muted">
        Already tracking? <Link to="/login" className="font-medium text-brand hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
