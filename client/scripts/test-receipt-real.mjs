// Runs the OCR + parse pipeline on real receipt photos passed as CLI args.
import { createWorker } from 'tesseract.js';
import { parseReceiptText } from '../src/lib/receipt.js';

const files = process.argv.slice(2);
const worker = await createWorker('eng');
for (const file of files) {
  const { data } = await worker.recognize(file);
  console.log(`\n===== ${file} =====`);
  console.log('--- OCR text ---');
  console.log(data.text.trim());
  const parsed = parseReceiptText(data.text);
  console.log('--- parsed ---');
  for (const a of parsed.amounts) console.log(`${a.isTotal ? '[TOTAL] ' : ''}${a.value}  (${a.label})`);
  console.log('suggestedTotal:', parsed.suggestedTotal);
}
await worker.terminate();
