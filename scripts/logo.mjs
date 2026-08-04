/**
 * Erzeugt die Logo-Dateien aus der EINZIGEN Vorlage, die der Kunde geliefert hat.
 *
 * Ausgangslage: Im ausgefüllten Fragebogen (`Fragebogen_Website_optimiert tr_5160.docx`,
 * eingebettet als `word/media/image1.jpeg`) steckt das echte Logo — als 1600×1600-JPEG,
 * ohne Transparenz, auf einem unscharfen Bürofoto, und die Wortmarke in Mittelgrau.
 * So ist es auf dem dunklen Grund dieser Seite unbrauchbar: Grau fällt durch jede
 * Kontraststufe, und das Foto bringt eine Kante mit.
 *
 * Was dieses Skript daraus macht:
 *   1. Die Tinte einrahmen (dunkle Pixel plus die roten Pixel des Balkens).
 *   2. Die Deckkraft aus der Dunkelheit ableiten — der Fotohintergrund verschwindet,
 *      weil er hell ist. Nebeneffekt, den wir behalten: das Grau hat ungleiche
 *      Helligkeit, wird also ungleich deckend und liest sich wie gebürstetes Metall.
 *   3. Zwei Fassungen einfärben:
 *        logo-light.png — Wortmarke in Frostweiß, für den dunklen Grund (Standard).
 *        logo-dark.png  — Wortmarke in Graphit, für das helle Papier-Thema.
 *      Der rote Balken bleibt in beiden rot — er ist das Markenzeichen.
 *
 * ⚠ Das bleibt ein Rasterbild aus einer JPEG-Vorlage. Für Druck, große Flächen und
 *   scharfe Kanten auf sehr hohen Auflösungen gehört das Vektor-Original her
 *   (AI/EPS/PDF/SVG). Für die Kopfzeile einer Website genügt diese Fassung.
 *   Kommt die Vektordatei, ersetzt sie beide Dateien und dieses Skript entfällt.
 *
 *   Aufruf:  node scripts/logo.mjs [pfad/zur/quelle.jpeg]
 */

import sharp from 'sharp'
import { existsSync } from 'node:fs'

const SRC =
  process.argv[2] ||
  'D:/Real Estate CRM/Cati/.tmp/claude/D--Global-Tecnik-Klima/9b196ab3-db7d-4758-98c7-75972cfa4752/scratchpad/docx_tr/word/media/image1.jpeg'

if (!existsSync(SRC)) {
  console.error(
    `Vorlage nicht gefunden: ${SRC}\n` +
      `Das Logo steckt im ausgefüllten Fragebogen. Entpacken mit:\n` +
      `  unzip "Fragebogen_Website_optimiert tr_5160.docx" -d entpackt\n` +
      `Die Datei liegt dann unter entpackt/word/media/image1.jpeg\n` +
      `Dann: node scripts/logo.mjs entpackt/word/media/image1.jpeg`
  )
  process.exit(1)
}

const FROST = [234, 246, 244] // --frost, für den dunklen Grund
const GRAPHITE = [42, 36, 30] // --fg des hellen Themas
const EMBER = [234, 61, 20] // --gree-ember, der rote Balken

const isRed = (r, g, b) => r > 110 && r > g * 1.55 && r > b * 1.55
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b

// ── 1. Tinten-Rahmen finden ──────────────────────────────────────────────────
const base = sharp(SRC)
const { data, info } = await base.raw().toBuffer({ resolveWithObject: true })
const { width: W0, height: H0, channels: C0 } = info

let x0 = W0, x1 = 0, y0 = H0, y1 = 0
for (let y = 0; y < H0; y++) {
  for (let x = 0; x < W0; x++) {
    const i = (y * W0 + x) * C0
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (lum(r, g, b) < 150 || isRed(r, g, b)) {
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
}
const PAD = 14
const box = { left: x0 - PAD, top: y0 - PAD, width: x1 - x0 + PAD * 2, height: y1 - y0 + PAD * 2 }
console.log('Tinten-Rahmen:', box)

// ── 2./3. Freistellen und einfärben ──────────────────────────────────────────
const crop = await sharp(SRC).extract(box).raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H, channels: C } = crop.info

const render = async (wordmark, file) => {
  const out = Buffer.alloc(W * H * 4)
  for (let p = 0; p < W * H; p++) {
    const i = p * C
    const r = crop.data[i], g = crop.data[i + 1], b = crop.data[i + 2]
    const red = isRed(r, g, b)
    // L<=40 voll deckend, L>=215 durchsichtig — der helle Fotogrund fällt weg.
    let a = Math.round(((215 - lum(r, g, b)) * 255) / 175)
    if (red) a = Math.max(a, 235)
    a = Math.max(0, Math.min(255, a))
    const col = red ? EMBER : wordmark
    const o = p * 4
    out[o] = col[0]
    out[o + 1] = col[1]
    out[o + 2] = col[2]
    out[o + 3] = a
  }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .resize({ width: 600 })
    .png({ compressionLevel: 9 })
    .toFile(file)
  const m = await sharp(file).metadata()
  console.log(`${file}: ${m.width}×${m.height}, Seitenverhältnis ${(m.width / m.height).toFixed(2)}`)
}

await render(FROST, 'public/images/logo-light.png')
await render(GRAPHITE, 'public/images/logo-dark.png')
