// Parses raw OCR text from a receipt into candidate amounts.
// Handles Indonesian formats (Rp 25.000 / 25.000,00 / 25,000) and bare digit runs.

const AMOUNT_RE = /(?:rp[.\s]*)?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d+[.,]\d{2}|\d{4,})/gi;
const TOTAL_RE = /\b(grand\s*total|total|jumlah|tagihan|amount\s*due|to\s*pay)\b/i;
const SUBTOTAL_RE = /\b(sub\s*total|subtotal)\b/i;
// Lines that are dates/times/contacts, not prices.
const NOISE_LINE_RE = /\b(jan|feb|mar|apr|may|mei|jun|jul|aug|agu|sep|okt|oct|nov|des|dec)\b|\d{1,2}[:.]\d{2}\s*(am|pm)?\s*$|\b(call|sms|telp|phone|npwp|fax)\b/i;

export function normalizeAmount(raw) {
  let s = raw.replace(/rp[.\s]*/gi, '').trim();
  const hasSeparator = /[.,]/.test(s);
  // Trailing ,00 / .00 are decimals on IDR receipts — drop them.
  s = s.replace(/[.,]00$/, '');
  const digits = s.replace(/[.,]/g, '');
  const value = Number(digits);
  if (!Number.isFinite(value)) return null;
  if (hasSeparator) {
    // Separator-formatted amounts (39.500 / 76,300) are almost always money.
    if (value < 100 || value > 999999999999) return null;
  } else {
    // Bare digit runs: short ones are qty/codes, long ones are receipt/phone/card numbers.
    if (value < 1000 || value > 999999) return null;
  }
  return value;
}

export function parseReceiptText(text) {
  const amounts = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || NOISE_LINE_RE.test(line)) continue;
    for (const match of line.matchAll(AMOUNT_RE)) {
      const value = normalizeAmount(match[1]);
      if (value == null) continue;
      const label = line
        .replace(match[0], '')
        .replace(/[^\p{L}\p{N} %/&.-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      amounts.push({
        label: label || 'amount',
        value,
        isTotal: TOTAL_RE.test(line) && !SUBTOTAL_RE.test(line),
      });
    }
  }
  // One chip per value; prefer the entry flagged as a total.
  const byValue = new Map();
  for (const a of amounts) {
    const existing = byValue.get(a.value);
    if (!existing || (a.isTotal && !existing.isTotal)) byValue.set(a.value, a);
  }
  const unique = [...byValue.values()].sort((a, b) => (b.isTotal - a.isTotal) || (b.value - a.value));
  const totalLine = unique.find((a) => a.isTotal);
  const suggestedTotal = totalLine?.value ?? (unique.length ? Math.max(...unique.map((a) => a.value)) : null);
  return { amounts: unique, suggestedTotal };
}
