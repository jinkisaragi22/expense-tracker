import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { money } from '../lib/money';

export default function SharedSplit() {
  const { token } = useParams();
  const [split, setSplit] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | missing

  useEffect(() => {
    axios.get(`/api/splits/shared/${token}`)
      .then(({ data }) => { setSplit(data.split); setStatus('ok'); })
      .catch(() => setStatus('missing'));
  }, [token]);

  const paidCount = split?.participants.filter((p) => p.paid).length ?? 0;

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center font-display text-2xl font-bold tracking-tight">
          cash<span className="text-brand">trail.</span>
        </div>

        {status === 'loading' && <p className="text-center text-sm text-muted">Loading…</p>}

        {status === 'missing' && (
          <div className="rounded-2xl border border-line bg-card p-8 text-center">
            <p className="mb-1 font-display font-semibold">Split bill not found</p>
            <p className="text-sm text-muted">This link may have been deleted by its owner.</p>
          </div>
        )}

        {status === 'ok' && (
          <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {split.ownerName} split a bill
            </p>
            <h1 className="mt-1 font-display text-xl font-semibold">{split.title}</h1>
            <p className="amount mt-1 text-sm text-muted">
              {money(split.total)} total · {paidCount}/{split.participants.length} paid
            </p>
            {split.note && (
              <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">{split.note}</p>
            )}
            <ul className="mt-4 divide-y divide-line">
              {split.participants.map((p, i) => (
                <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <span className={`flex items-center gap-2 ${p.paid ? 'text-muted' : ''}`}>
                    <span aria-hidden className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${p.paid ? 'bg-brand text-white' : 'border border-line text-transparent'}`}>
                      ✓
                    </span>
                    <span className={p.paid ? 'line-through' : ''}>{p.name}</span>
                    {p.paid && <span className="sr-only">(paid)</span>}
                  </span>
                  <span className={`amount ${p.paid ? 'text-muted' : 'font-semibold'}`}>{money(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          Made with{' '}
          <Link to="/register" className="font-medium text-brand hover:underline">CashTrail</Link>
          {' '}— track your money, split your bills.
        </p>
      </div>
    </div>
  );
}
