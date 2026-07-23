import { useRef, useState } from 'react';
import { parseReceiptText } from '../lib/receipt';

// Client-side receipt OCR (tesseract.js, lazy-loaded). The photo never leaves the device.
export default function ReceiptScanner({ onPickAmount }) {
  const inputRef = useRef(null);
  const [state, setState] = useState('idle'); // idle | working | done | error
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  async function scan(file) {
    if (!file) return;
    setState('working');
    setProgress(0);
    setResult(null);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100));
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      const parsed = parseReceiptText(data.text);
      setResult(parsed);
      setState('done');
      if (parsed.suggestedTotal != null) onPickAmount(parsed.suggestedTotal, { suggested: true });
    } catch (err) {
      console.error(err);
      setState('error');
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-line p-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { scan(e.target.files?.[0]); e.target.value = ''; }}
      />
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={state === 'working'}
          className="text-sm font-medium text-brand hover:underline disabled:opacity-50 cursor-pointer"
        >
          📷 Scan receipt
        </button>
        {state === 'idle' && <span className="text-xs text-muted">Photo stays on your device</span>}
        {state === 'working' && (
          <span className="amount text-xs text-muted" role="status">Reading… {progress}%</span>
        )}
        {state === 'error' && <span className="text-xs text-expense">Couldn't read that photo — try again.</span>}
      </div>

      {state === 'working' && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {state === 'done' && result && (
        result.amounts.length === 0 ? (
          <p className="mt-2 text-xs text-muted">No amounts found. Try a sharper, well-lit photo taken straight-on.</p>
        ) : (
          <div className="mt-2">
            <p className="mb-1.5 text-xs text-muted">Tap an amount to use it as the total:</p>
            <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
              {result.amounts.map((a, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => onPickAmount(a.value)}
                  className={`rounded-full border px-2.5 py-1 text-xs cursor-pointer ${
                    a.isTotal
                      ? 'border-brand bg-brand-soft font-medium text-brand-dark'
                      : 'border-line text-ink hover:bg-surface'
                  }`}
                  title={a.label}
                >
                  <span className="amount">{a.value.toLocaleString('id-ID')}</span>
                  {a.label !== 'amount' && <span className="ml-1 text-muted">{a.label.slice(0, 14)}</span>}
                </button>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
