// Generates public/og-image.png (1200x630) in the CashTrail visual style.
// Run from client/: node scripts/generate-og.mjs
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const INK = '#182b25';
const CARD = '#20362e';
const BRAND = '#1f8a70';
const COPPER = '#c9812e';
const PAPER = '#f5f7f6';
const MUTED = '#9fb5ac';

// Mini income/expense bar chart, echoing the dashboard trend chart.
const months = [
  { income: 90, expense: 62 },
  { income: 70, expense: 84 },
  { income: 118, expense: 74 },
  { income: 96, expense: 58 },
  { income: 140, expense: 92 },
  { income: 124, expense: 66 },
];
const chart = months
  .map((m, i) => {
    const x = 780 + i * 62;
    const base = 470;
    return `
      <rect x="${x}" y="${base - m.income}" width="20" height="${m.income}" rx="4" fill="${BRAND}" />
      <rect x="${x + 24}" y="${base - m.expense}" width="20" height="${m.expense}" rx="4" fill="${COPPER}" />`;
  })
  .join('');

// Dotted "trail" wandering from the wordmark toward the chart.
const trailDots = [];
for (let i = 0; i < 26; i++) {
  const t = i / 25;
  const x = 95 + t * 1010;
  const y = 545 + Math.sin(t * Math.PI * 1.6) * 22;
  trailDots.push(`<circle cx="${x}" cy="${y}" r="${3 + t * 2}" fill="${BRAND}" opacity="${0.25 + t * 0.6}" />`);
}

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${INK}" />
  <rect x="720" y="120" width="390" height="390" rx="28" fill="${CARD}" />
  <line x1="760" y1="470" x2="1070" y2="470" stroke="${MUTED}" stroke-opacity="0.4" stroke-width="2" />
  ${chart}
  <text x="760" y="170" font-family="IBM Plex Mono" font-weight="600" font-size="26" fill="${PAPER}">Rp</text>
  <text x="800" y="170" font-family="IBM Plex Mono" font-size="26" fill="${MUTED}">in / out</text>

  <text x="90" y="285" font-family="IBM Plex Mono" font-weight="600" font-size="104" fill="${PAPER}">cashtrail<tspan fill="${BRAND}">.</tspan></text>
  <text x="94" y="352" font-family="IBM Plex Mono" font-size="34" fill="${MUTED}">Follow every rupiah.</text>

  <text x="94" y="435" font-family="IBM Plex Mono" font-size="24" fill="${PAPER}" opacity="0.85">income · expenses · categories · charts</text>
  ${trailDots.join('')}
</svg>`;

const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    fontFiles: [
      join(here, 'fonts', 'IBMPlexMono-Regular.ttf'),
      join(here, 'fonts', 'IBMPlexMono-SemiBold.ttf'),
    ],
    loadSystemFonts: false,
    defaultFontFamily: 'IBM Plex Mono',
  },
}).render().asPng();

const out = join(here, '..', 'public', 'og-image.png');
writeFileSync(out, png);
console.log(`wrote ${out} (${(png.length / 1024).toFixed(0)} KB)`);
