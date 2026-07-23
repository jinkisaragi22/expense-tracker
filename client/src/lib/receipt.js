// Parses raw OCR text from a receipt into candidate amounts.
// Handles Indonesian formats (Rp 25.000 / 25.000,00) and plain digit runs.

const AMOUNT_RE = /(?:rp[.\s]*)?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d+[.,]\d{2}|\d{4,})/gi;
const TOTAL_RE = /\b(grand\s*total|total|jumlah|tagihan|amount\s*due|to\s*pay)\b/i;
const SUBTOTAL_RE = /\b(sub\s*total|subtotal)\b/i;

export function normalizeAmount(raw) {
  let s = raw.replace(/rp[.\s]*/gi, '').trim();
  // Trailing ,00 / .00 are decimals on IDR receipts — drop them.
  s = s.replace(/[.,]00$/, '');
  // Remaining separators are thousands.
  const digits = s.replace(/[.,]/g, '');
  const value = Number(digits);
  return Number.isFinite(value) ? value : null;
}

export function parseReceiptText(text) {
  const amounts = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    for (const match of line.matchAll(AMOUNT_RE)) {
      const value = normalizeAmount(match[1]);
      if (value == null || value < 100 || value > 999999999999) continue;
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
  // De-duplicate identical value+label pairs (OCR often repeats).
  const seen = new Set();
  const unique = amounts.filter((a) => {
    const key = `${a.label}|${a.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const totalLine = unique.find((a) => a.isTotal);
  const suggestedTotal = totalLine?.value ?? (unique.length ? Math.max(...unique.map((a) => a.value)) : null);
  return { amounts: unique, suggestedTotal };
}
