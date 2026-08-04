// Beweist, dass das Bewegungssystem wirklich läuft — und nicht nur der
// Rettungs-Timer den Inhalt sichtbar macht.
import { chromium } from 'playwright'

const BASE = process.env.BASE || 'http://localhost:4321'
const b = await chromium.launch()
let fails = 0
const say = (ok, msg) => { console.log(`  ${ok ? '✓' : '✗'} ${msg}`); if (!ok) fails++ }

// ── 1. Normalfall: Bewegung an ────────────────────────────────────────────────
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
  const errs = []
  p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })

  say(await p.evaluate(() => document.documentElement.classList.contains('motion')),
      'html.motion gesetzt (Inline-Skript lief vor dem Bild)')

  // Vor dem Scrollen: eine Sektion weit unten muss noch verborgen sein.
  const hiddenBefore = await p.evaluate(() => {
    const el = document.querySelector('#yorumlar [data-reveal]')
    return el ? getComputedStyle(el).opacity : 'MISSING'
  })
  say(hiddenBefore === '0', `Bewertungen vor dem Scrollen verborgen (opacity ${hiddenBefore})`)

  // Warten, bis GSAP den Rettungs-Timer entschärft hat. Bleibt der Timer stehen,
  // ist das Modul nie angekommen und wir hätten nur eine Notbremse gebaut.
  await p.waitForFunction(() => window.__motionFailsafe === undefined, { timeout: 6000 })
    .then(() => say(true, 'GSAP geladen — Rettungs-Timer entschärft'))
    .catch(() => say(false, 'Rettungs-Timer lief ab: GSAP kam nie an'))

  say(await p.evaluate(() => document.documentElement.classList.contains('motion')),
      'html.motion bleibt (Notbremse hat NICHT gefeuert)')

  // Hinunterscrollen und den Einzug abwarten.
  await p.locator('#yorumlar').scrollIntoViewIfNeeded()
  await p.waitForTimeout(1400)
  const shown = await p.evaluate(() => {
    const el = document.querySelector('#yorumlar [data-reveal]')
    return el ? { op: getComputedStyle(el).opacity, cls: el.classList.contains('shown'), tf: getComputedStyle(el).transform } : null
  })
  say(shown?.cls === true, 'Bewertungen bekommen .shown beim Hereinscrollen')
  say(Number(shown?.op) > 0.95, `Bewertungen ausgefahren (opacity ${shown?.op})`)
  say(shown?.tf === 'none' || shown?.tf === 'matrix(1, 0, 0, 1, 0, 0)', `Verschiebung zurückgesetzt (${shown?.tf})`)

  // Anker-Springen: ersetzt das entfernte globale scroll-behavior.
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.waitForTimeout(200)
  await p.click('.mainnav a[href$="#kontakt"]')
  // Direkt auf das Ergebnis warten statt auf eine Dauer. #kontakt liegt ~6800 px
  // tief; jeder feste Timeout misst entweder vor dem Start oder mitten in der
  // Bewegung. Ziel ist `scroll-margin-top` (74 px), nicht 0 — die Sticky-Kopfzeile
  // darf das Ziel nicht verdecken.
  const landed = await p
    .waitForFunction(
      () => {
        const el = document.querySelector('#kontakt')
        const want = parseInt(getComputedStyle(el).scrollMarginTop) || 0
        return Math.abs(el.getBoundingClientRect().top - want) <= 4
      },
      { timeout: 8000, polling: 100 }
    )
    .then(() => true)
    .catch(() => false)
  const aty = await p.evaluate(() => Math.round(document.querySelector('#kontakt').getBoundingClientRect().top))
  say(landed, `Anker-Klick landet auf #kontakt (top ${aty}px, erwartet 74px)`)
  say(await p.evaluate(() => location.hash === '#kontakt'), 'Adresszeile trägt #kontakt')

  // ── Phase 2: Zähler, Trennlinien, Parallaxe ────────────────────────────────
  await p.locator('#hakkimizda').scrollIntoViewIfNeeded()
  await p.waitForTimeout(1800)
  const counts = await p.evaluate(() =>
    [...document.querySelectorAll('[data-count]')].map((e) => ({ want: e.dataset.count, got: e.textContent.trim() })))
  say(counts.length === 2, `zwei Zähler gefunden (${counts.length})`)
  say(counts.some((c) => /5[.,]0$/.test(c.got)), `Bewertung zählt auf 5,0 (${counts[0]?.got})`)
  say(counts.some((c) => c.got === '65'), `Anzahl zählt auf 65 (${counts[1]?.got})`)

  // Trennlinien: müssen nach dem Zeichnen voll ausgefahren sein.
  const rules = await p.evaluate(() => {
    const el = document.querySelector('.sdiv .rule')
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform)
    return { a: Number(m.a.toFixed(2)), star: Number(getComputedStyle(document.querySelector('.sdiv svg')).opacity) }
  })
  say(rules.a === 1, `Trennlinie ausgezeichnet (scaleX ${rules.a})`)
  say(rules.star > 0.4, `Achtstern eingedreht (opacity ${rules.star})`)

  // Parallaxe: das Hero-Foto muss beim Scrollen versetzt sein, nicht auf 0 stehen.
  await p.evaluate(() => window.scrollTo(0, 400))
  await p.waitForTimeout(500)
  const shift = await p.evaluate(() => {
    const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.hero-parallax')).transform)
    return Math.round(m.f)
  })
  say(shift > 4, `Hero-Foto parallax versetzt (${shift}px)`)

  say(errs.length === 0, `keine Seitenfehler${errs.length ? ': ' + errs[0] : ''}`)
  await p.close()
}

// ── 2. Bewegung reduziert: alles muss sofort sichtbar sein ────────────────────
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  say(!(await p.evaluate(() => document.documentElement.classList.contains('motion'))),
      'prefers-reduced-motion: html.motion NICHT gesetzt')
  const worst = await p.evaluate(() =>
    Math.min(...[...document.querySelectorAll('[data-reveal]')].map((e) => Number(getComputedStyle(e).opacity))))
  say(worst === 1, `prefers-reduced-motion: jeder Abschnitt sichtbar (min opacity ${worst})`)
  // Die Trennlinien dürfen NICHT auf scaleX(0) hängen, und die Zahlen müssen
  // ihren Endwert zeigen statt bei 0 zu stehen.
  const rm = await p.evaluate(() => {
    const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.sdiv .rule')).transform)
    return {
      a: Number(m.a.toFixed(2)),
      counts: [...document.querySelectorAll('[data-count]')].map((e) => e.textContent.trim()),
    }
  })
  say(rm.a === 1, `prefers-reduced-motion: Trennlinie voll sichtbar (scaleX ${rm.a})`)
  say(rm.counts.every((t) => t !== '0' && t !== ''), `prefers-reduced-motion: Zahlen stehen (${rm.counts.join(' / ')})`)
  await p.close()
}

// ── 3. Ohne JavaScript: der Inhalt muss trotzdem stehen ──────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false })
  const p = await ctx.newPage()
  await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  const worst = await p.evaluate(() =>
    Math.min(...[...document.querySelectorAll('[data-reveal]')].map((e) => Number(getComputedStyle(e).opacity))))
    .catch(() => 'n/a')
  // Ohne JS greift html.motion nie, also darf nichts verborgen sein.
  say(worst === 1 || worst === 'n/a', `ohne JavaScript sichtbar (min opacity ${worst})`)
  const h1 = await p.locator('h1').first().isVisible()
  say(h1, 'ohne JavaScript: H1 sichtbar')
  await ctx.close()
}

await b.close()
console.log(`\nERGEBNIS: ${fails} Fehler`)
process.exit(fails ? 1 : 0)
