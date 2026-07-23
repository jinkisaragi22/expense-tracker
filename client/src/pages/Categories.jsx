import { useCallback, useEffect, useState } from 'react';
import { api, apiError } from '../api/client';
import Modal from '../components/Modal';
import { Field, inputCls, btnPrimary, btnGhost, ErrorNote } from '../components/Field';

const ICONS = ['🍔', '🚗', '🏠', '🛒', '💡', '🎬', '🏥', '🛍️', '📦', '💼', '💻', '📈', '💰', '✈️', '🎓', '🐾', '🎁', '☕'];
const COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#eab308', '#ec4899', '#ef4444', '#f97316', '#64748b', '#22c55e', '#14b8a6', '#06b6d4', '#84cc16'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'new' | category
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
    } catch (err) {
      setError(apiError(err));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id) {
    setError('');
    try {
      await api.delete(`/categories/${id}`);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(apiError(err));
      setConfirmDelete(null);
    }
  }

  const grouped = [
    { title: 'Expense categories', items: categories.filter((c) => c.type === 'expense') },
    { title: 'Income categories', items: categories.filter((c) => c.type === 'income') },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Categories</h1>
        <button onClick={() => setModal('new')} className={btnPrimary}>+ Add category</button>
      </div>

      <ErrorNote>{error}</ErrorNote>

      <div className="space-y-8 mt-2">
        {grouped.map((group) => (
          <section key={group.title}>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">{group.title}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                      style={{ backgroundColor: `${c.color}22` }}
                    >
                      {c.icon}
                    </span>
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setModal(c)} className="text-xs text-muted hover:text-ink cursor-pointer">Edit</button>
                    <button onClick={() => setConfirmDelete(c)} className="text-xs text-expense/80 hover:text-expense cursor-pointer">Delete</button>
                  </div>
                </div>
              ))}
              {group.items.length === 0 && (
                <p className="text-sm text-muted">None yet.</p>
              )}
            </div>
          </section>
        ))}
      </div>

      {modal && (
        <Modal title={modal === 'new' ? 'Add category' : 'Edit category'} onClose={() => setModal(null)}>
          <CategoryForm
            initial={modal === 'new' ? null : modal}
            onCancel={() => setModal(null)}
            onSaved={() => { setModal(null); load(); }}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete category" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-muted">
            Delete <span className="font-medium text-ink">{confirmDelete.icon} {confirmDelete.name}</span>?
            Categories with transactions can't be deleted.
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

function CategoryForm({ initial, onCancel, onSaved }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? 'expense');
  const [icon, setIcon] = useState(initial?.icon ?? ICONS[0]);
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (initial?.id) await api.put(`/categories/${initial.id}`, { name, type, icon, color });
      else await api.post('/categories', { name, type, icon, color });
      onSaved();
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNote>{error}</ErrorNote>
      <Field label="Name">
        <input required maxLength={50} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Coffee" />
      </Field>
      <Field label="Type">
        <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls} disabled={!!initial}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </Field>
      <Field label="Icon">
        <div className="flex flex-wrap gap-1.5">
          {ICONS.map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => setIcon(i)}
              aria-pressed={icon === i}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg cursor-pointer ${icon === i ? 'bg-brand-soft ring-2 ring-brand' : 'hover:bg-surface'}`}
            >
              {i}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Color">
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className={`h-7 w-7 rounded-full cursor-pointer ${color === c ? 'ring-2 ring-ink ring-offset-2' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
        <button disabled={busy} className={btnPrimary}>{busy ? 'Saving…' : initial?.id ? 'Save changes' : 'Add category'}</button>
      </div>
    </form>
  );
}
