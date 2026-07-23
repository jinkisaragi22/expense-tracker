// Pipeline test: renders a fake receipt PNG, OCRs it with tesseract.js,
// and runs the parser. Run from client/: node scripts/test-receipt.mjs
import { Resvg } from '@resvg/resvg-js';
import { createWorker } from 'tesseract.js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseReceiptText } from '../src/lib/receipt.js';

const here = dirname(fileURLToPath(import.meta.url));

const lines = [
  ['WARUNG MAKAN SEDERHANA', ''],
  ['Jl. Sudirman No. 12', ''],
  ['------------------------', ''],
  ['Nasi Goreng x2', '50.000'],
  ['Sate Ayam', '35.000'],
  ['Es Teh x3', '15.000'],
  ['Gado Gado', '28.000'],
  ['------------------------', ''],
  ['Subtotal', '128.000'],
  ['Pajak 10%', '12.800'],
  ['TOTAL', 'Rp 140.800'],
];

const rows = lines
  .map(([l, r], i) => {
    const y = 60 + i * 44;
    return `
      <text x="40" y="${y}" font-family="IBM Plex Mono" font-size="26" fill="#111">${l}</text>
      <text x="560" y="${y}" text-anchor="end" font-family="IBM Plex Mono" font-size="26" fill="#111">${r}</text>`;
  })
  .join('');

const svg = `<svg width="600" height="${lines.length * 44 + 90}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fff"/>${rows}</svg>`;

const png = new Resvg(svg, {
  font: {
    fontFiles: [join(here, 'fonts', 'IBMPlexMono-Regular.ttf')],
    loadSystemFonts: false,
    defaultFontFamily: 'IBM Plex Mono',
  },
}).render().asPng();

const imgPath = join(here, 'test-receipt.png');
writeFileSync(imgPath, png);

const worker = await createWorker('eng');
const { data } = await worker.recognize(imgPath);
await worker.terminate();

console.log('--- OCR text ---');
console.log(data.text.trim());
console.log('--- parsed ---');
const parsed = parseReceiptText(data.text);
for (const a of parsed.amounts) console.log(`${a.isTotal ? '[TOTAL] ' : ''}${a.value}  (${a.label})`);
console.log('suggestedTotal:', parsed.suggestedTotal);
if (parsed.suggestedTotal !== 140800) {
  console.error('FAIL: expected suggestedTotal 140800');
  process.exit(1);
}
console.log('PASS');
