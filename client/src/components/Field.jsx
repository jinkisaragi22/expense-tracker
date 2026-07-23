export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  'w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none';

export const btnPrimary =
  'rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50 cursor-pointer';

export const btnGhost =
  'rounded-lg border border-line px-4 py-2 text-sm text-ink hover:bg-surface cursor-pointer';

export function ErrorNote({ children }) {
  if (!children) return null;
  return <p role="alert" className="rounded-lg bg-expense-soft px-3 py-2 text-sm text-expense">{children}</p>;
}
