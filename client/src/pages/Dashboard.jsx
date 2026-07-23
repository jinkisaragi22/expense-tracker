import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';
import { api } from '../api/client';
import { useAuthStore } from '../store/auth';
import { money, moneyCompact, signedMoney, monthLabel, thisMonth } from '../lib/money';
import { Field, inputCls, btnPrimary, btnGhost, ErrorNote } from '../components/Field';
import Modal from '../components/Modal';
import MoneyInput from '../components/MoneyInput';
import { apiError } from '../api/client';

const INCOME = '#1f8a70';
const EXPENSE = '#b3541e';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [month, setMonth] = useState(thisMonth());
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  const [editStart, setEditStart] = useState(false);

  const loadMonth = useCallback(() => {
    api.get('/analytics/summary', { params: { month } }).then(({ data }) => setSummary(data));
    api.get('/analytics/by-category', { params: { month } }).then(({ data }) => setByCategory(data.categories));
  }, [month]);

  const loadGlobal = useCallback(() => {
    api.get('/analytics/trend', { params: { months: 6 } }).then(({ data }) => setTrend(data.trend));
    api.get('/transactions', { params: { pageSize: 6 } }).then(({ data }) => setRecent(data.transactions));
  }, []);

  useEffect(() => { loadMonth(); }, [loadMonth]);
  useEffect(() => { loadGlobal(); }, [loadGlobal]);

  const balancePositive = (summary?.balance ?? 0) >= 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Hey {user?.name?.split(' ')[0]},</p>
          <h1 className="font-display text-2xl font-bold">here's your trail for {monthLabel(month)}</h1>
        </div>
        <div className="flex w-full items-stretch gap-2 sm:w-auto">
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className={`${inputCls} h-10 flex-1 sm:w-44 sm:flex-none`}
            aria-label="Month"
          />
          <button
            onClick={() => setEditStart(true)}
            className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-lg bg-brand px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-dark cursor-pointer"
          >
            Set starting balance
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Starting balance"
          value={summary ? money(summary.startingBalance) : '—'}
          accent="text-ink"
          sub={summary && !summary.hasStartingBalance ? 'Not set for this month' : monthLabel(month)}
        />
        <StatTile label="Income" value={summary ? money(summary.income) : '—'} accent="text-brand-dark" sub={monthLabel(month)} />
        <StatTile label="Expenses" value={summary ? money(summary.expense) : '—'} accent="text-expense" sub={monthLabel(month)} />
        <StatTile
          label="Month-end balance"
          value={summary ? money(summary.endingBalance) : '—'}
          accent={(summary?.endingBalance ?? 0) >= 0 ? 'text-brand-dark' : 'text-expense'}
          sub={summary ? `${balancePositive ? '+' : '−'}${money(Math.abs(summary.balance))} net · ${summary.transactionCount} transactions` : ''}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Income vs expenses · last 6 months">
          {trend.every((t) => t.income === 0 && t.expense === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trend} barGap={2} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e2e8e5" />
                <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 12, fill: '#5c6b65' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={moneyCompact} tick={{ fontSize: 12, fill: '#5c6b65' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  formatter={(v, name) => [money(v), name]}
                  labelFormatter={monthLabel}
                  cursor={{ fill: '#182b2510' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8e5', fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} iconType="circle" iconSize={9} />
                <Bar dataKey="income" name="Income" fill={INCOME} radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="expense" name="Expense" fill={EXPENSE} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title={`Spending by category · ${monthLabel(month)}`}>
          {byCategory.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(240, byCategory.length * 40)}>
              <BarChart data={byCategory} layout="vertical" margin={{ top: 8, right: 60, left: 8, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 12, fill: '#182b25' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [money(v), 'Spent']}
                  cursor={{ fill: '#182b2510' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8e5', fontSize: 13 }}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={16} label={{ position: 'right', formatter: (v) => moneyCompact(v), fontSize: 11, fill: '#5c6b65' }}>
                  {byCategory.map((c) => <Cell key={c.categoryId} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card title="Recent transactions" className="mt-4">
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Nothing yet. <Link to="/transactions" className="text-brand hover:underline">Add your first transaction</Link> to start the trail.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${tx.category.color}22` }}>
                    {tx.category.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{tx.description || tx.category.name}</p>
                    <p className="amount text-xs text-muted">{tx.date} · {tx.category.name}</p>
                  </div>
                </div>
                <span className={`amount font-medium whitespace-nowrap ${tx.type === 'income' ? 'text-brand-dark' : 'text-expense'}`}>
                  {signedMoney(tx.amount, tx.type)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 text-right">
          <Link to="/transactions" className="text-sm font-medium text-brand hover:underline">View all →</Link>
        </div>
      </Card>

      {editStart && (
        <Modal title={`Starting balance · ${monthLabel(month)}`} onClose={() => setEditStart(false)}>
          <StartingBalanceForm
            month={month}
            current={summary?.hasStartingBalance ? summary.startingBalance : null}
            onCancel={() => setEditStart(false)}
            onSaved={() => { setEditStart(false); loadMonth(); }}
          />
        </Modal>
      )}
    </div>
  );
}

function StartingBalanceForm({ month, current, onCancel, onSaved }) {
  const [amount, setAmount] = useState(current != null ? String(Math.round(current)) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.put('/analytics/starting-balance', { month, amount: Number(amount) });
      onSaved();
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted">
        How much money you're starting {monthLabel(month)} with. Income adds to it, expenses subtract, and the dashboard shows where you'll end the month.
      </p>
      <ErrorNote>{error}</ErrorNote>
      <Field label="Amount">
        <MoneyInput required autoFocus value={amount} onChange={setAmount} placeholder="1.000.000" />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
        <button disabled={busy} className={btnPrimary}>
          {busy ? 'Saving…' : current != null ? 'Update balance' : 'Set balance'}
        </button>
      </div>
    </form>
  );
}

function StatTile({ label, value, accent, sub, hero }) {
  return (
    <div className={`rounded-2xl border border-line bg-card p-5 ${hero ? 'sm:order-none' : ''}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`amount mt-1 text-2xl font-semibold ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Card({ title, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-line bg-card p-5 ${className}`}>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-muted">
      No data for this period yet.
    </div>
  );
}
