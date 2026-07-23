// Generates PWA icons in public/: pwa-192.png, pwa-512.png, maskable-512.png, apple-touch-icon.png
// Run from client/: node scripts/generate-icons.mjs
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const INK = '#182b25';
const BRAND = '#1f8a70';
const PAPER = '#f5f7f6';

// "ct." monogram; maskable keeps content inside the 80% safe zone.
function iconSvg({ maskable }) {
  const scale = maskable ? 0.72 : 0.92;
  const fontSize = 220 * scale;
  const y = 512 / 2 + fontSize * 0.34;
  return `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="${INK}" ${maskable ? '' : 'rx="112"'} />
  <text x="236" y="${y}" text-anchor="middle" font-family="IBM Plex Mono" font-weight="600" font-size="${fontSize}" fill="${PAPER}">ct</text>
  <circle cx="${236 + fontSize * 0.78}" cy="${y - fontSize * 0.06}" r="${fontSize * 0.11}" fill="${BRAND}" />
</svg>`;
}

function render(svg, size) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: {
      fontFiles: [join(here, 'fonts', 'IBMPlexMono-SemiBold.ttf')],
      loadSystemFonts: false,
      defaultFontFamily: 'IBM Plex Mono',
    },
  }).render().asPng();
}

const pub = join(here, '..', 'public');
const standard = iconSvg({ maskable: false });
const maskable = iconSvg({ maskable: true });

writeFileSync(join(pub, 'pwa-192.png'), render(standard, 192));
writeFileSync(join(pub, 'pwa-512.png'), render(standard, 512));
writeFileSync(join(pub, 'maskable-512.png'), render(maskable, 512));
writeFileSync(join(pub, 'apple-touch-icon.png'), render(maskable, 180));
console.log('wrote pwa-192.png, pwa-512.png, maskable-512.png, apple-touch-icon.png');
