import { inputCls } from './Field';

const fmt = new Intl.NumberFormat('id-ID');

// Currency input: shows "Rp" + live thousand separators, keeps only digits in state.
// `value` is a digit string (e.g. "150000"); `onChange` receives the new digit string.
export default function MoneyInput({ value, onChange, className = '', ...props }) {
  const display = value ? fmt.format(Number(value)) : '';

  function handle(e) {
    const digits = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12);
    onChange(digits);
  }

  return (
    <div className={`relative ${className}`}>
      <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={handle}
        className={`${inputCls} amount pl-9`}
        {...props}
      />
    </div>
  );
}
