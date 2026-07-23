import { useCallback, useEffect, useState } from 'react';
import { api, apiError } from '../api/client';
import { money } from '../lib/money';
import Modal from '../components/Modal';
import { Field, inputCls, btnPrimary, btnGhost, ErrorNote } from '../components/Field';
import ReceiptScanner from '../components/ReceiptScanner';

export default function Splits() {
  const [splits, setSplits] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'new' | split object
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/splits');
      setSplits(data.splits);
    } catch (err) {
      setError(apiError(err));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function togglePaid(split, participant) {
    try {
      await api.patch(`/splits/${split.id}/participants/${participant.id}`, { paid: !participant.paid });
      load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/splits/${id}`);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(apiError(err));
      setConfirmDelete(null);
    }
  }

  async function copyLink(split) {
    const url = `${window.location.origin}/s/${split.shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(split.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt('Copy this link:', url);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Split bills</h1>
        <button onClick={() => setModal('new')} className={btnPrimary}>+ New split</button>
      </div>

      <ErrorNote>{error}</ErrorNote>

      {splits?.length === 0 && (
        <div className="rounded-2xl border border-line bg-card p-10 text-center text-sm text-muted">
          <p className="mb-1 font-medium text-ink">No split bills yet</p>
          <p>Split a dinner, trip, or rent with friends — then share the link so everyone knows what they owe.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {splits?.map((split) => {
          const paidCount = split.participants.filter((p) => p.paid).length;
          const collected = split.participants.filter((p) => p.paid).reduce((a, p) => a + p.amount, 0);
          return (
            <section key={split.id} className="rounded-2xl border border-line bg-card p-5">
              <div className="mb-1 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display font-semibold">{split.title}</h2>
                  <p className="amount text-xs text-muted">
                    {money(split.total)} · {paidCount}/{split.participants.length} paid · {money(collected)} collected
                  </p>
                </div>
                <div className="flex shrink-0 gap-3 text-xs">
                  <button onClick={() => copyLink(split)} className="font-medium text-brand hover:underline cursor-pointer">
                    {copiedId === split.id ? 'Copied!' : 'Share'}
                  </button>
                  <button onClick={() => setModal(split)} className="text-muted hover:text-ink cursor-pointer">Edit</button>
                  <button onClick={() => setConfirmDelete(split)} className="text-expense/80 hover:text-expense cursor-pointer">Delete</button>
                </div>
              </div>
              {split.note && <p className="mb-2 text-sm text-muted">{split.note}</p>}
              <ul className="divide-y divide-line">
                {split.participants.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={p.paid}
                        onChange={() => togglePaid(split, p)}
                        className="h-4 w-4 accent-[#1f8a70]"
                      />
                      <span className={p.paid ? 'text-muted line-through' : ''}>{p.name}</span>
                    </label>
                    <span className={`amount ${p.paid ? 'text-muted' : 'font-medium'}`}>{money(p.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal === 'new' ? 'New split bill' : 'Edit split bill'} onClose={() => setModal(null)}>
          <SplitForm
            initial={modal === 'new' ? null : modal}
            onCancel={() => setModal(null)}
            onSaved={() => { setModal(null); load(); }}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete split bill" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-muted">
            Delete <span className="font-medium text-ink">{confirmDelete.title}</span>? The share link will stop working.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setConfirmDelete(null)} className={btnGhost}>Cancel</button>
            <button onClick={() => remove(confirmDelete.id)} className="rounded-lg bg-expense px-4 py-2 text-sm font-medium text-white hover:opacity-90 cursor-pointer">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SplitForm({ initial, onCancel, onSaved }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [total, setTotal] = useState(initial?.total != null ? String(initial.total) : '');
  const [participants, setParticipants] = useState(
    initial?.participants.map((p) => ({ name: p.name, amount: String(p.amount), paid: p.paid }))
      ?? [{ name: '', amount: '', paid: false }, { name: '', amount: '', paid: false }]
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function setP(i, key, value) {
    setParticipants((ps) => ps.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));
  }

  function splitEqually() {
    const t = Number(total);
    const n = participants.length;
    if (!t || !n) return;
    const base = Math.floor((t / n) * 100) / 100;
    const remainder = Math.round((t - base * n) * 100) / 100;
    setParticipants((ps) => ps.map((p, i) => ({ ...p, amount: String(i === 0 ? Math.round((base + remainder) * 100) / 100 : base) })));
  }

  const assigned = participants.reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const diff = Math.round(((Number(total) || 0) - assigned) * 100) / 100;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload = {
      title,
      note,
      total: Number(total),
      participants: participants.map((p) => ({ name: p.name.trim(), amount: Number(p.amount) || 0, paid: p.paid })),
    };
    try {
      if (initial?.id) await api.put(`/splits/${initial.id}`, payload);
      else await api.post('/splits', payload);
      onSaved();
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNote>{error}</ErrorNote>
      <Field label="Title">
        <input required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Dinner at Sate Khas" />
      </Field>
      <ReceiptScanner onPickAmount={(value) => setTotal(String(value))} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Total amount">
          <input type="number" step="any" min="1" required value={total} onChange={(e) => setTotal(e.target.value)} className={`${inputCls} amount`} placeholder="300000" />
        </Field>
        <Field label="Note (optional)">
          <input maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="e.g. Pay via GoPay" />
        </Field>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">People</span>
          <button type="button" onClick={splitEqually} className="text-xs font-medium text-brand hover:underline cursor-pointer">
            Split equally
          </button>
        </div>
        <div className="space-y-2">
          {participants.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                required
                maxLength={50}
                value={p.name}
                onChange={(e) => setP(i, 'name', e.target.value)}
                className={inputCls}
                placeholder={`Person ${i + 1}`}
              />
              <input
                type="number"
                step="any"
                min="0"
                required
                value={p.amount}
                onChange={(e) => setP(i, 'amount', e.target.value)}
                className={`${inputCls} amount w-32 shrink-0`}
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => setParticipants((ps) => ps.filter((_, idx) => idx !== i))}
                disabled={participants.length <= 1}
                aria-label={`Remove person ${i + 1}`}
                className="shrink-0 text-muted hover:text-expense disabled:opacity-30 cursor-pointer px-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setParticipants((ps) => [...ps, { name: '', amount: '', paid: false }])}
            disabled={participants.length >= 50}
            className="text-xs font-medium text-brand hover:underline cursor-pointer"
          >
            + Add person
          </button>
          {total && (
            <span className={`amount text-xs ${diff === 0 ? 'text-brand-dark' : 'text-expense'}`}>
              {diff === 0 ? 'All assigned ✓' : diff > 0 ? `${money(diff)} unassigned` : `${money(-diff)} over`}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
        <button disabled={busy} className={btnPrimary}>{busy ? 'Saving…' : initial?.id ? 'Save changes' : 'Create split'}</button>
      </div>
    </form>
  );
}
