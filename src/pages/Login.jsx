import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn, signUp, configured } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setNotice(''); setBusy(true);
    const { error } = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (error) { setError(error.message); return; }
    if (mode === 'signup') {
      setNotice('Account created. Check your email to confirm, then sign in.');
      setMode('signin');
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 420, paddingTop: 56, paddingBottom: 56 }}>
      <div className="eyebrow">{mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        {mode === 'signin' ? 'Welcome back' : 'Save your progress'}
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 28, lineHeight: 1.6 }}>
        Sign in to save your experiment attempts and viva scores to your dashboard.
        You can still use every experiment without an account.
      </p>

      {!configured && (
        <div className="viva-bubble viva-bubble-incorrect" style={{ marginBottom: 20 }}>
          Supabase isn't configured yet — set <code>VITE_SUPABASE_URL</code> and
          <code> VITE_SUPABASE_ANON_KEY</code> to enable accounts. See the README.
        </div>
      )}

      <form onSubmit={handleSubmit} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Email</label>
          <div className="num-wrap">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" style={{ paddingRight: 12 }} />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Password</label>
          <div className="num-wrap">
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters" style={{ paddingRight: 12 }} />
          </div>
        </div>

        {error && <p style={{ color: 'var(--red)', fontSize: 12.5 }}>{error}</p>}
        {notice && <p style={{ color: 'var(--green)', fontSize: 12.5 }}>{notice}</p>}

        <button className="btn btn-primary" type="submit" disabled={busy || !configured} style={{ justifyContent: 'center' }}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p style={{ marginTop: 18, fontSize: 13, color: 'var(--muted)' }}>
        {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
        <button className="btn-ghost" style={{ border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--cyan)' }}
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setNotice(''); }}>
          {mode === 'signin' ? 'Create one' : 'Sign in'}
        </button>
      </p>

      <RouterLink to="/" style={{ display: 'inline-block', marginTop: 24, fontSize: 12.5, color: 'var(--muted-2)' }}>
        &larr; Back to experiments
      </RouterLink>
    </div>
  );
}
