import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAttempts(data || []);
        setFetching(false);
      });
  }, [user]);

  if (loading) return <div className="wrap" style={{ paddingTop: 56 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  const vivaAttempts = attempts.filter(a => a.viva_score !== null);
  const avgScore = vivaAttempts.length
    ? (vivaAttempts.reduce((sum, a) => sum + a.viva_score / a.viva_total, 0) / vivaAttempts.length) * 100
    : null;

  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 56 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow">DASHBOARD</div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Your progress</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{user.email}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
      </div>

      <div className="grid" style={{ marginBottom: 40, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="panel">
          <h2>Total attempts</h2>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600, color: 'var(--cyan)' }}>{attempts.length}</div>
        </div>
        <div className="panel">
          <h2>Viva sessions</h2>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600, color: 'var(--cyan)' }}>{vivaAttempts.length}</div>
        </div>
        <div className="panel">
          <h2>Avg. viva score</h2>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600, color: 'var(--cyan)' }}>
            {avgScore !== null ? `${avgScore.toFixed(0)}%` : '—'}
          </div>
        </div>
      </div>

      <div className="obs-panel" style={{ margin: 0 }}>
        <h2>Attempt history</h2>
        {fetching ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading attempts…</p>
        ) : attempts.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            No attempts logged yet — <Link to="/" style={{ color: 'var(--cyan)' }}>try an experiment</Link> and click "Log this reading".
          </p>
        ) : (
          <table className="obs-table">
            <thead><tr><th>Date</th><th>Experiment</th><th>Code</th><th>Result</th><th>Viva score</th></tr></thead>
            <tbody>
              {attempts.map(a => (
                <tr key={a.id}>
                  <td>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td>{a.experiment}</td>
                  <td>{a.code}</td>
                  <td style={{ maxWidth: 260 }}>{summarize(a.result_data)}</td>
                  <td>{a.viva_score !== null ? `${a.viva_score}/${a.viva_total}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function summarize(resultData) {
  if (!resultData) return '—';
  return Object.entries(resultData).map(([k, v]) => `${k}: ${v}`).join(', ');
}
