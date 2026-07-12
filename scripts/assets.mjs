/**
 * Erzeugt die Marken-Assets, die keine Handarbeit sein dürfen:
 *   public/og.jpg              1200×630 — Vorschaubild beim Teilen (WhatsApp!)
 *   public/favicon.svg         seldschukischer Achtstern, Gold auf Noir
 *   public/apple-touch-icon.png 180×180
 *
 * Warum ein Skript und kein von Hand gebautes Bild: Wenn sich das Ladenfoto oder
 * die Bewertung ändert, muss die WhatsApp-Vorschau mitgehen. Von Hand vergisst
 * man das. `npm run assets` nicht.
 *
 * WhatsApp ist der Hauptkanal dieses Betriebs. Wer den Link dort teilt und eine
 * graue Kachel sieht, hat den Kanal entwertet, auf den die ganze Seite zielt.
 */
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(root, 'public')

// Aus src/content/home.ts — bewusst hier gespiegelt, damit das Skript ohne
// TypeScript-Ladekette läuft. Ändert sich die Bewertung, hier UND dort ändern.
const RATING = '5,0'
const COUNT = 65

const NOIR = '#100D0B'
const CHAMP = '#D9C27A'
const GOLD = '#C9A227'

/** Seldschukischer Achtstern (rub el hizb): zwei um 45° versetzte Quadrate. */
const star = (color, size = 100) => {
  const c = size / 2
  const r = size * 0.46
  const pts = (rot) =>
    Array.from({ length: 4 }, (_, i) => {
      const a = rot + (i * Math.PI) / 2
      return `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`
    }).join(' ')
  return `<polygon points="${pts(0)}" fill="${color}"/><polygon points="${pts(Math.PI / 4)}" fill="${color}"/>`
}

// ---------- Favicon ----------
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="14" fill="${NOIR}"/>
  <g opacity="0.95">${star(GOLD, 100)}</g>
  <circle cx="50" cy="50" r="12" fill="${NOIR}"/>
</svg>`
writeFileSync(join(pub, 'favicon.svg'), favicon)

await sharp(Buffer.from(favicon)).resize(180, 180).png().toFile(join(pub, 'apple-touch-icon.png'))

// ---------- og:image ----------
// Sein echtes Ladenfoto, abgedunkelt, mit Wortmarke und der Bewertung.
// Schriften: Georgia/Arial sind auf jedem Rechner da. Cormorant/Jost würden hier
// nicht zuverlässig rendern — das Vorschaubild darf nicht vom Build-Rechner abhängen.
const W = 1200
const H = 630

const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${NOIR}" stop-opacity="0.94"/>
      <stop offset="52%"  stop-color="${NOIR}" stop-opacity="0.80"/>
      <stop offset="100%" stop-color="${NOIR}" stop-opacity="0.30"/>
    </linearGradient>
    <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${NOIR}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${NOIR}" stop-opacity="0.75"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#base)"/>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>

  <g transform="translate(72,150) scale(0.44)">${star(GOLD, 100)}</g>

  <text x="72" y="286" font-family="Georgia, 'Times New Roman', serif" font-size="66" font-weight="bold"
        fill="#EAF6F4" letter-spacing="1">GLOBAL TEKNİK</text>
  <text x="74" y="330" font-family="Arial, Helvetica, sans-serif" font-size="22"
        fill="${CHAMP}" letter-spacing="7">GREE · YETKİLİ BAYİ VE SERVİSİ · ALANYA</text>

  <line x1="72" y1="382" x2="330" y2="382" stroke="${GOLD}" stroke-width="2"/>

  <text x="72" y="478" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="bold"
        fill="${CHAMP}">${RATING}</text>
  <text x="214" y="454" font-family="Arial, Helvetica, sans-serif" font-size="30"
        fill="${GOLD}" letter-spacing="4">★★★★★</text>
  <text x="216" y="490" font-family="Arial, Helvetica, sans-serif" font-size="21"
        fill="#9FB2B5" letter-spacing="1">${COUNT} Google değerlendirmesi</text>

  <text x="72" y="560" font-family="Arial, Helvetica, sans-serif" font-size="24"
        fill="#EAF6F4">Satış · Montaj · Bakım · 7/24 Servis</text>
</svg>`

await sharp(join(pub, 'images', 'hero-shop.webp'))
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .composite([{ input: Buffer.from(overlay) }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(join(pub, 'og.jpg'))

console.log('assets: favicon.svg, apple-touch-icon.png, og.jpg')
