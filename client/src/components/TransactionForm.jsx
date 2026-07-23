import { useMemo, useState } from 'react';
import { api, apiError } from '../api/client';
import { Field, inputCls, btnPrimary, btnGhost, ErrorNote } from './Field';
import MoneyInput from './MoneyInput';
import { today } from '../lib/money';

export default function TransactionForm({ categories, initial, onSaved, onCancel, lockType = false }) {
  const [type, setType] = useState(initial?.type ?? 'expense');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [amount, setAmount] = useState(initial?.amount != null ? String(Math.round(initial.amount)) : '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [date, setDate] = useState(initial?.date ?? today());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const options = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);
  const validCategory = options.some((c) => c.id === categoryId) ? categoryId : '';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload = { type, categoryId: validCategory, amount: Number(amount), description, date };
    try {
      if (initial?.id) await api.put(`/transactions/${initial.id}`, payload);
      else await api.post('/transactions', payload);
      onSaved();
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNote>{error}</ErrorNote>
      <div className={`grid grid-cols-2 gap-2 ${lockType ? 'hidden' : ''}`} role="radiogroup" aria-label="Type">
        {['expense', 'income'].map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setType(t)}
            aria-pressed={type === t}
            className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize cursor-pointer ${
              type === t
                ? t === 'income' ? 'border-brand bg-brand-soft text-brand-dark' : 'border-expense bg-expense-soft text-expense'
                : 'border-line text-muted hover:bg-surface'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <Field label="Amount">
        <MoneyInput required value={amount} onChange={setAmount} placeholder="50.000" />
      </Field>
      <Field label="Category">
        <select required value={validCategory} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
          <option value="" disabled>Select a category</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Date">
        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Description (optional)">
        <input maxLength={255} value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="e.g. Groceries at the market" />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
        <button disabled={busy} className={btnPrimary}>
          {busy ? 'Saving…' : initial?.id ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}
