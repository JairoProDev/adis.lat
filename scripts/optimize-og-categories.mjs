/**
 * Redimensiona OG de categorías a 1200×630 y comprime para WhatsApp/Facebook.
 * Uso: node scripts/optimize-og-categories.mjs
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const DIR = path.join(process.cwd(), 'public/og/categories');
const TARGET_W = 1200;
const TARGET_H = 630;

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.png') && f !== 'README.png');

for (const file of files) {
  const input = path.join(DIR, file);
  const tmp = path.join(DIR, `.${file}.tmp`);
  const before = fs.statSync(input).size;

  await sharp(input)
    .resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9, quality: 85, effort: 10 })
    .toFile(tmp);

  fs.renameSync(tmp, input);
  const after = fs.statSync(input).size;
  console.log(`${file}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB (${TARGET_W}×${TARGET_H})`);
}

console.log('Listo.');
