import { useCallback, useEffect, useState } from 'react';
import { api, apiError } from '../api/client';
import { signedMoney } from '../lib/money';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import { Field, inputCls, btnPrimary, btnGhost, ErrorNote } from '../components/Field';

const emptyFilters = { from: '', to: '', category: '', type: '', search: '' };

export default function Transactions() {
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'new' | transaction object
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setError('');
    try {
      const params = { page, pageSize: 15 };
      for (const [k, v] of Object.entries(filters)) if (v) params[k] = v;
      const { data } = await api.get('/transactions', { params });
      setData(data);
    } catch (err) {
      setError(apiError(err));
    }
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  function setFilter(k, v) {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: v }));
  }

  async function remove(id) {
    try {
      await api.delete(`/transactions/${id}`);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(apiError(err));
      setConfirmDelete(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Transactions</h1>
        <button onClick={() => setModal('new')} className={btnPrimary}>+ Add transaction</button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Field label="From">
          <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} className={inputCls} />
        </Field>
        <Field label="To">
          <input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Type">
          <select value={filters.type} onChange={(e) => setFilter('type', e.target.value)} className={inputCls}>
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </Field>
        <Field label="Category">
          <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} className={inputCls}>
            <option value="">All</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </Field>
        <Field label="Search">
          <input value={filters.search} onChange={(e) => setFilter('search', e.target.value)} className={inputCls} placeholder="Description…" />
        </Field>
      </div>

      <ErrorNote>{error}</ErrorNote>

      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-2.5 py-2.5 sm:px-4 sm:py-3 font-medium">Date</th>
              <th className="px-2.5 py-2.5 sm:px-4 sm:py-3 font-medium">Category</th>
              <th className="px-2.5 py-2.5 sm:px-4 sm:py-3 font-medium">Description</th>
              <th className="px-2.5 py-2.5 sm:px-4 sm:py-3 font-medium text-right">Amount</th>
              <th className="px-2.5 py-2.5 sm:px-4 sm:py-3" />
            </tr>
          </thead>
          <tbody>
            {data?.transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No transactions match. Add one to start the trail.
                </td>
              </tr>
            )}
            {data?.transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                <td className="amount px-2.5 py-2.5 sm:px-4 sm:py-3 whitespace-nowrap text-muted">{tx.date}</td>
                <td className="px-2.5 py-2.5 sm:px-4 sm:py-3 whitespace-nowrap">
                  <span className="mr-1.5" aria-hidden>{tx.category.icon}</span>
                  {tx.category.name}
                </td>
                <td className="px-2.5 py-2.5 sm:px-4 sm:py-3 max-w-55 truncate text-muted">{tx.description || '—'}</td>
                <td className={`amount px-2.5 py-2.5 sm:px-4 sm:py-3 text-right font-medium whitespace-nowrap ${tx.type === 'income' ? 'text-brand-dark' : 'text-expense'}`}>
                  {signedMoney(tx.amount, tx.type)}
                </td>
                <td className="px-2.5 py-2.5 sm:px-4 sm:py-3 text-right whitespace-nowrap">
                  <button onClick={() => setModal(tx)} className="text-xs text-muted hover:text-ink cursor-pointer mr-3">Edit</button>
                  <button onClick={() => setConfirmDelete(tx)} className="text-xs text-expense/80 hover:text-expense cursor-pointer">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>{data.total} transactions</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={`${btnGhost} disabled:opacity-40`}>Previous</button>
            <span className="amount">{page} / {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className={`${btnGhost} disabled:opacity-40`}>Next</button>
          </div>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'new' ? 'Add transaction' : 'Edit transaction'} onClose={() => setModal(null)}>
          <TransactionForm
            categories={categories}
            initial={modal === 'new' ? null : modal}
            onCancel={() => setModal(null)}
            onSaved={() => { setModal(null); load(); }}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete transaction" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-muted">
            Delete <span className="amount font-medium text-ink">{signedMoney(confirmDelete.amount, confirmDelete.type)}</span>{' '}
            ({confirmDelete.category.name}, {confirmDelete.date})? This can't be undone.
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
