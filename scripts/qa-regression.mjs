/**
 * Bestätigungsprüfung zum Ultra-QA-Lauf vom 11.08.2026 (docs/08-qa-ultra-bericht.md).
 *
 * Jede Prüfung hier entspricht EINEM bestätigten Befund. Solange der Befund offen ist,
 * meldet sie `OFFEN`. Ist er behoben, meldet sie `BEHOBEN`. Damit ist jede Behebung
 * nachgewiesen statt behauptet — und ein Rückfall fällt beim nächsten Lauf auf.
 *
 * Ablauf:
 *   npm run build                                  (die statischen Prüfungen lesen dist/)
 *   npx astro preview --port 4321                  (in einem zweiten Fenster)
 *   node scripts/qa-regression.mjs
 *
 * Nur die statischen Prüfungen (ohne laufenden Server):
 *   node scripts/qa-regression.mjs --static
 *
 * Eine einzelne Prüfung:
 *   node scripts/qa-regression.mjs H1
 *
 * Ausstiegscode = Anzahl der noch offenen Befunde.
 *
 * ⚠ Die Beweisbilder des Originallaufs lagen in einem Sitzungs-Temp-Ordner und sind weg.
 *   Deshalb prüft dieses Skript jeden Befund neu, statt sich auf sie zu berufen.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.BASE || 'http://localhost:4321'
const args = process.argv.slice(2)
const ONLY = args.filter((a) => !a.startsWith('--'))
const STATIC_ONLY = args.includes('--static')

const read = (p) => readFileSync(resolve(ROOT, p), 'utf8')
const has = (p, needle) => read(p).includes(needle)

// ─────────────────────────────────────────────────────────── Prüfungen
// `open()` liefert einen Grund, wenn der Befund NOCH OFFEN ist, sonst null.
const CHECKS = [
  // ══════════════════════════════════════ blockierend
  {
    id: 'C1', sev: 'KATASTROPHAL', kind: 'static',
    title: 'Rechtstexte versprechen Zustimmung, Karte lädt ohne',
    where: 'src/content/home.ts:885 · src/content/legal.ts (8 Stellen)',
    open() {
      const embed = /mapMode:\s*'embed'/.test(read('src/content/home.ts'))
      const promises = has('src/content/legal.ts', 'wird erst geladen, wenn Sie das ausdrücklich anklicken')
      if (embed && promises) return "mapMode ist 'embed', aber legal.ts verspricht Klick-Zustimmung"
      if (embed) return "mapMode ist 'embed' (Rechtstext wurde offenbar angepasst — bitte alle 4 Sprachen prüfen)"
      return null
    },
  },
  {
    id: 'K1', sev: 'KRITISCH', kind: 'static',
    title: 'Gesperrte (⛔) Zusagen stehen live auf der Seite',
    where: 'src/i18n/ui.ts:90 · src/content/home.ts:409,419,467',
    open() {
      const home = read('src/content/home.ts')
      const hits = []
      if (home.includes('Wir sprechen Deutsch')) hits.push('"Wir sprechen Deutsch" (master.md:165 verbietet genau das)')
      if (home.includes('Garantie auf Deutsch')) hits.push('"Beratung, Montage und Garantie auf Deutsch"')
      return hits.length ? hits.join(' · ') : null
    },
  },

  // ══════════════════════════════════════ hoch
  {
    id: 'H1', sev: 'HOCH', kind: 'live',
    title: 'Türkische GROSSSCHREIBUNG bricht die Absichtserkennung',
    where: 'src/components/Assistant.astro:141',
    async open(page) {
      const caps = await ask(page, '/', 'GARANTI KAC YIL')
      const lower = await ask(page, '/', 'garanti kaç yıl')
      if (caps === lower) return null
      return `"GARANTI KAC YIL" → "${caps.slice(0, 40)}…" · kleingeschrieben → "${lower.slice(0, 40)}…"`
    },
  },
  {
    id: 'H2', sev: 'HOCH', kind: 'live',
    title: 'Erster Chat-Vorschlagsknopf läuft in de/ru/en ins Leere',
    where: 'src/content/kb.ts:193 (PRICE_KW)',
    async open(page) {
      const bad = []
      for (const [loc, path] of [['de', '/de/'], ['ru', '/ru/'], ['en', '/en/']]) {
        const chip = await chipText(page, path, 0)
        const answer = await ask(page, path, chip)
        const expected = await ask(page, path, { de: 'Preis', ru: 'цена', en: 'price' }[loc])
        if (answer !== expected) bad.push(`${loc}: "${chip}" trifft die Preisantwort nicht`)
      }
      return bad.length ? bad.join(' · ') : null
    },
  },
  {
    id: 'H3', sev: 'HOCH', kind: 'live',
    title: 'Hängende /api/chat-Anfrage tötet den Chat dauerhaft (kein Timeout)',
    where: 'src/components/Assistant.astro:191-222',
    async open(page) {
      await page.route('**/api/chat', () => {}) // annehmen, nie beantworten
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      await page.click('#chatfab')
      await page.waitForSelector('#chatpanel:not([hidden])')
      await page.fill('#cin', 'montaj yapıyor musunuz')
      await page.click('#cform button[type=submit]')
      await page.waitForFunction(() => document.querySelectorAll('#chatpanel .msg.typing').length === 1)
      const released = await page
        .waitForFunction(() => document.querySelectorAll('#chatpanel .msg.typing').length === 0, { timeout: 10000 })
        .then(() => true)
        .catch(() => false)
      await page.unroute('**/api/chat')
      return released ? null : 'Tipp-Blase nach 10 s nicht freigegeben, busy bleibt gesetzt'
    },
  },
  {
    id: 'H4', sev: 'HOCH', kind: 'live',
    title: 'Chat liest die erste 2–3-stellige Zahl als Fläche',
    where: 'src/components/Assistant.astro:158',
    async open(page) {
      const a = await ask(page, '/', 'Cumartesi 12:00 uygun, 60 m2 oda için klima istiyorum')
      const ctrl = await ask(page, '/', '60 m2 oda için klima istiyorum')
      if (a === ctrl) return null
      return `mit Uhrzeit → "${a.slice(0, 46)}…" · ohne → "${ctrl.slice(0, 46)}…"`
    },
  },
  {
    id: 'H5', sev: 'HOCH', kind: 'live',
    title: 'Kopfzeile läuft über; Burger außerhalb des Viewports',
    where: 'src/layouts/Base.astro:237,254-262',
    async open(page) {
      const bad = []
      for (const w of [320, 481, 500, 535]) {
        await page.setViewportSize({ width: w, height: 900 })
        await page.goto(BASE + '/', { waitUntil: 'networkidle' })
        const m = await page.evaluate(() => {
          const b = document.getElementById('burger')
          const r = b?.getBoundingClientRect()
          return { sw: document.documentElement.scrollWidth, iw: innerWidth, left: r ? Math.round(r.left) : null }
        })
        if (m.sw > m.iw) bad.push(`${w}px: Überlauf +${m.sw - m.iw}px${m.left >= m.iw ? ' (Burger komplett draußen)' : ''}`)
      }
      await page.setViewportSize({ width: 1440, height: 900 })
      return bad.length ? bad.join(' · ') : null
    },
  },
  {
    id: 'H6', sev: 'HOCH', kind: 'live',
    title: 'Rechner sättigt bei 48.000 und schreibt die Fläche still um',
    where: 'src/components/Home.astro:551-562',
    async open(page) {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      await page.fill('#ca', '500')
      await page.waitForFunction(() => document.getElementById('cbtu').textContent.length > 0)
      const s = await page.evaluate(() => ({
        field: document.getElementById('ca').value,
        cta: decodeURIComponent((document.getElementById('ccta').getAttribute('href') || '').split('text=')[1] || ''),
      }))
      if (s.field !== '500') return null // Clamp wird zurückgeschrieben
      return `Feld zeigt "${s.field}", Nachricht sagt "${(s.cta.match(/\d+ m²/) || ['?'])[0]}"`
    },
  },
  {
    id: 'H7', sev: 'HOCH', kind: 'live',
    title: 'Telefonfeld nimmt jede nicht-leere Zeichenfolge an',
    where: 'src/components/RequestForm.astro:52,163-192',
    async open(page) {
      const opened = await submitForm(page, { name: 'Test Kullanıcı', phone: 'abc' })
      return opened ? 'Absenden mit Telefon "abc" hat die WhatsApp-Übergabe geöffnet' : null
    },
  },
  {
    id: 'H8', sev: 'HOCH', kind: 'live',
    title: 'Chat-Eingabefeld im Querformat nicht erreichbar',
    where: 'src/components/Assistant.astro:52-57,69',
    async open(page) {
      await page.setViewportSize({ width: 844, height: 390 })
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      await page.click('#chatfab')
      await page.waitForSelector('#chatpanel:not([hidden])')
      const m = await page.evaluate(() => {
        const r = document.getElementById('cin').getBoundingClientRect()
        const hit = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2))
        return { top: Math.round(r.top), hit: hit ? hit.id || hit.tagName : 'NULL' }
      })
      await page.setViewportSize({ width: 1440, height: 900 })
      return m.hit === 'cin' ? null : `#cin bei y=${m.top}, Trefferprüfung liefert ${m.hit}`
    },
  },
  {
    id: 'H9', sev: 'HOCH', kind: 'live',
    title: 'Kein <main>, kein Sprunglink, Abschnitte ohne Überschrift',
    where: 'src/layouts/Base.astro:128 · src/components/Home.astro (.eyebrow statt h2)',
    async open(page) {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      const m = await page.evaluate(() => ({
        main: !!document.querySelector('main,[role=main]'),
        h2: document.querySelectorAll('h2').length,
        headless: [...document.querySelectorAll('section[id]')].filter((s) => !s.querySelector('h1,h2,h3,h4')).length,
      }))
      const bad = []
      if (!m.main) bad.push('kein <main>')
      if (m.headless) bad.push(`${m.headless} section[id] ohne Überschrift`)
      if (m.h2 < 6) bad.push(`nur ${m.h2} <h2> auf der Startseite`)
      return bad.length ? bad.join(' · ') : null
    },
  },
  {
    id: 'H10', sev: 'HOCH', kind: 'static',
    title: 'Fokusring des Sonnen-Schalters wird weggeschnitten',
    where: 'src/components/Home.astro:382 (.toggle overflow:hidden) vs global.css:85',
    open() {
      const clipped = /\.toggle\{[^}]*overflow:hidden/.test(read('src/components/Home.astro'))
      const offsetOut = /outline-offset:\s*3px/.test(read('src/styles/global.css'))
      return clipped && offsetOut ? '.toggle hat overflow:hidden, global.css setzt outline-offset:3px' : null
    },
  },
  {
    id: 'H12', sev: 'HOCH', kind: 'live',
    title: 'Chat-Antworten werden nie angekündigt (keine Live-Region)',
    where: 'src/components/Assistant.astro:28',
    async open(page) {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      const m = await page.evaluate(() => {
        const b = document.getElementById('cbody')
        return { live: b.getAttribute('aria-live'), role: b.getAttribute('role') }
      })
      return m.live || m.role ? null : '#cbody hat weder aria-live noch role'
    },
  },
  {
    id: 'H15', sev: 'HOCH', kind: 'live',
    title: 'Blockiertes Popup lässt das Formular lautlos scheitern',
    where: 'src/components/RequestForm.astro:207',
    async open(page) {
      await page.addInitScript(() => { window.open = () => null })
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      await page.locator('#randevu').scrollIntoViewIfNeeded()
      await page.fill('#reqForm [name=name]', 'Test')
      await page.fill('#reqForm [name=phone]', '+90 555 111 22 33')
      await page.check('#reqForm [name=consent]')
      await page.click('#reqForm button[type=submit]')
      const feedback = await page.evaluate(() => {
        const e = document.getElementById('reqErr')
        return { hidden: e.hidden, text: e.textContent.trim() }
      })
      return feedback.hidden && !feedback.text ? 'kein sichtbares Signal, wenn window.open null liefert' : null
    },
  },
  {
    id: 'H16', sev: 'HOCH', kind: 'static',
    title: '/api/chat ohne Origin-/Content-Type-Prüfung (Budget-Missbrauch)',
    where: 'api/chat.js:82-96',
    open() {
      const src = read('api/chat.js')
      const bad = []
      if (!/headers\[.origin.\]|headers\.origin|referer/i.test(src)) bad.push('keine Origin-/Referer-Prüfung')
      if (!/content-type/i.test(src.split('export default')[1] || '')) bad.push('kein Content-Type-Zwang (text/plain umgeht den Preflight)')
      return bad.length ? bad.join(' · ') : null
    },
  },

  // ══════════════════════════════════════ mittel (die objektiv prüfbaren)
  {
    id: 'M1', sev: 'MITTEL', kind: 'live',
    title: 'BTU-Zahl in allen Sprachen tr-TR formatiert',
    where: 'src/components/Home.astro:559,118',
    async open(page) {
      await page.goto(BASE + '/en/', { waitUntil: 'networkidle' })
      await page.fill('#ca', '60')
      await page.waitForFunction(() => document.getElementById('cbtu').textContent !== '12.000')
      const v = await page.textContent('#cbtu')
      return v.includes('.') ? `/en/ zeigt "${v}" (erwartet "36,000")` : null
    },
  },
  {
    id: 'M2', sev: 'MITTEL', kind: 'static',
    title: 'snap() bricht Gleichstände nach unten → Unterdimensionierung',
    where: 'src/components/Home.astro:552 · src/components/Assistant.astro:148',
    open() {
      const STEP = [9000, 12000, 18000, 24000, 36000, 48000]
      const snap = (v) => STEP.reduce((p, s) => (Math.abs(s - v) < Math.abs(p - v) ? s : p))
      const stillStrict = /Math\.abs\(s - v\) < Math\.abs\(p - v\)/.test(read('src/components/Home.astro'))
      return stillStrict && snap(15000) === 12000
        ? 'Last 15.000 (24 m², 5 Pers.) → 12.000 statt 18.000'
        : null
    },
  },
  {
    id: 'M3', sev: 'MITTEL', kind: 'live',
    title: 'Leeres Feld / 0 erfindet ein Ergebnis für 25 m²',
    where: 'src/components/Home.astro:554-555',
    async open(page) {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      await page.fill('#ca', '')
      await page.waitForTimeout(150) // Eingabe-Ereignis abwarten
      const cta = await page.getAttribute('#ccta', 'href')
      const m = decodeURIComponent(cta || '').match(/(\d+) m²/)
      return m && m[1] === '25' ? 'leeres Feld → Nachricht behauptet "25 m²"' : null
    },
  },
  {
    id: 'M4', sev: 'MITTEL', kind: 'live',
    title: 'Zähler starten bei 0 → Bewertung sinkt sichtbar unter 5,0',
    where: 'src/scripts/motion.ts:175-198',
    async open(page) {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      const min = await page.evaluate(async () => {
        const el = document.querySelector('[data-count="5"]')
        if (!el) return null
        let lowest = 99, stop = false
        const tick = () => {
          const n = parseFloat((el.textContent || '').replace(/[^\d.,]/g, '').replace(',', '.'))
          if (!isNaN(n)) lowest = Math.min(lowest, n)
          if (!stop) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        document.querySelector('#hakkimizda').scrollIntoView()
        await new Promise((r) => setTimeout(r, 1800))
        stop = true
        return lowest
      })
      return min !== null && min < 4.9 ? `niedrigster gezeichneter Wert: ★ ${min}` : null
    },
  },
  {
    id: 'M5', sev: 'MITTEL', kind: 'live',
    title: 'Doppeltipp auf Senden erzeugt zwei WhatsApp-Übergaben',
    where: 'src/components/RequestForm.astro:163,207',
    async open(page) {
      await page.addInitScript(() => { window.__o = []; window.open = (u) => { window.__o.push(String(u)); return null } })
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      await page.locator('#randevu').scrollIntoViewIfNeeded()
      await page.fill('#reqForm [name=name]', 'Test')
      await page.fill('#reqForm [name=phone]', '+90 555 111 22 33')
      await page.check('#reqForm [name=consent]')
      await page.locator('#reqForm button[type=submit]').dblclick()
      const n = await page.evaluate(() => window.__o.length)
      return n > 1 ? `${n} × window.open bei einem Doppeltipp` : null
    },
  },
  {
    id: 'M6', sev: 'MITTEL', kind: 'live',
    title: 'Ohne WebGL: unbehandelter Seitenfehler (bricht das "keine JS-Fehler"-Tor)',
    where: 'src/components/ExplodedUnit.astro:92 (boot() ohne .catch)',
    async open(page) {
      const errs = []
      page.on('pageerror', (e) => errs.push(e.message))
      await page.addInitScript(() => {
        const o = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function (t, ...a) {
          return String(t).startsWith('webgl') ? null : o.call(this, t, ...a)
        }
      })
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      await page.locator('#teknik').scrollIntoViewIfNeeded()
      await page.waitForTimeout(2500) // Absicht: dem dynamischen Import Zeit zum Scheitern geben
      return errs.length ? `PAGEERROR: ${errs[0].slice(0, 70)}` : null
    },
  },
  {
    id: 'M10', sev: 'MITTEL', kind: 'live',
    title: 'theme-color wird beim Laden nicht wiederhergestellt',
    where: 'src/layouts/Base.astro:66,73-82 vs :203',
    async open(page) {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      await page.click('#themetog')
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'light')
      await page.reload({ waitUntil: 'networkidle' })
      const m = await page.evaluate(() => ({
        meta: document.getElementById('tcolor')?.getAttribute('content'),
        bg: getComputedStyle(document.body).backgroundColor,
      }))
      return m.meta === '#100D0B' ? `meta=${m.meta} über bodyBg=${m.bg}` : null
    },
  },
  {
    id: 'M11', sev: 'MITTEL', kind: 'live',
    title: 'Rechtsseiten ohne Fußzeile und ohne Kontaktwege',
    where: 'Fußzeile/.mobar/.wafab liegen in Home.astro:276-312 statt im Layout',
    async open(page) {
      await page.goto(BASE + '/de/kvkk', { waitUntil: 'networkidle' })
      const m = await page.evaluate(() => ({
        footer: !!document.querySelector('footer.foot'),
        tel: document.querySelectorAll('a[href^="tel:"]').length,
        wa: document.querySelectorAll('a[href*="wa.me"]').length,
      }))
      return !m.footer ? `keine Fußzeile, ${m.tel} × tel:, ${m.wa} × wa.me` : null
    },
  },
  {
    id: 'M12', sev: 'MITTEL', kind: 'static',
    title: 'Vollständiger Geschäfts-Graph im JSON-LD der Rechtsseiten und der 404',
    where: 'src/layouts/Base.astro:102 rendert <Schema> für jede Seite',
    open() {
      if (!existsSync(resolve(ROOT, 'dist/cerez/index.html'))) return 'dist/ fehlt — bitte erst npm run build'
      return has('dist/cerez/index.html', 'aggregateRating')
        ? '/cerez behauptet aggregateRating, obwohl dort nichts davon sichtbar ist'
        : null
    },
  },
  {
    id: 'M13', sev: 'MITTEL', kind: 'static',
    title: 'Deutscher Platzhalter ⟨vom Betrieb zu ergänzen⟩ sichtbar auf allen KVKK-Seiten',
    where: 'src/content/legal.ts:32',
    open() {
      if (!existsSync(resolve(ROOT, 'dist/ru/kvkk/index.html'))) return 'dist/ fehlt — bitte erst npm run build'
      const n = (read('dist/ru/kvkk/index.html').match(/vom Betrieb zu ergänzen/g) || []).length
      return n ? `${n} × auf /ru/kvkk` : null
    },
  },
  {
    id: 'M14', sev: 'MITTEL', kind: 'static',
    title: 'KVKK-Aufbewahrungsfrist nur auf Türkisch',
    where: 'src/content/legal.ts:75',
    open() {
      const src = read('src/content/legal.ts')
      const tr = src.includes("'Saklama süresi'")
      const others = /Срок хранения|Aufbewahrungsfrist|Retention period/.test(src)
      return tr && !others ? 'nur der türkische Block hat den Abschnitt' : null
    },
  },
  {
    id: 'M15', sev: 'MITTEL', kind: 'static',
    title: 'Beispiel-Abzeichen hartkodiert deutsch (BEISPIEL in ru/en)',
    where: 'src/components/Home.astro:203',
    open() {
      return /<span class="ex">Beispiel<\/span>/.test(read('src/components/Home.astro'))
        ? 'Literal "Beispiel" statt eines Sprachschlüssels'
        : null
    },
  },
  {
    id: 'M16', sev: 'MITTEL', kind: 'static',
    title: 'Platzhalter des Wunschtag-Feldes hartkodiert türkisch',
    where: 'src/components/RequestForm.astro:66',
    open() {
      return has('src/components/RequestForm.astro', 'placeholder="Örn. Cumartesi öğleden sonra"')
        ? 'gilt für alle 4 Sprachen'
        : null
    },
  },
  {
    id: 'M17', sev: 'MITTEL', kind: 'static',
    title: '--warn nie definiert, dreimal benutzt',
    where: 'Assistant.astro:68 · Home.astro:449 · LegalPage.astro:35 · tokens.css',
    open() {
      const defined = /--warn\s*:/.test(read('src/styles/tokens.css'))
      if (defined) return null
      const users = ['src/components/Assistant.astro', 'src/components/Home.astro', 'src/components/LegalPage.astro']
        .filter((f) => has(f, 'var(--warn'))
      return users.length ? `nicht definiert, benutzt in: ${users.length} Dateien` : null
    },
  },
  {
    id: 'M21', sev: 'MITTEL', kind: 'live',
    title: 'Chat verwirft eine zweite Nachricht innerhalb ~300 ms stillschweigend',
    where: 'src/components/Assistant.astro:193',
    async open(page) {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      await page.click('#chatfab')
      await page.waitForSelector('#chatpanel:not([hidden])')
      await page.fill('#cin', 'birinci soru montaj')
      await page.click('#cform button[type=submit]')
      await page.fill('#cin', 'ikinci soru garanti')
      await page.click('#cform button[type=submit]')
      await page.waitForTimeout(1200) // Absicht: beide Runden abwarten
      const m = await page.evaluate(() => ({
        me: document.querySelectorAll('#chatpanel .msg.me').length,
        left: document.getElementById('cin').value,
      }))
      return m.me < 2 ? `nur ${m.me} Nutzerblase, "${m.left}" bleibt unverschickt im Feld` : null
    },
  },
  {
    id: 'M25', sev: 'MITTEL', kind: 'static',
    title: 'Hero-Partikelschleife pausiert nicht außerhalb des Blickfelds',
    where: 'src/components/FrostHero.astro (0 × IntersectionObserver)',
    open() {
      return has('src/components/FrostHero.astro', 'IntersectionObserver')
        ? null
        : 'FrostHero hat keinen IntersectionObserver (ExplodedUnit hat drei)'
    },
  },
  {
    id: 'M26', sev: 'MITTEL', kind: 'static',
    title: 'Chat-Blasen ohne Umbruch; #cin ohne maxlength',
    where: 'src/components/Assistant.astro:37,84-85',
    open() {
      const src = read('src/components/Assistant.astro')
      const bad = []
      if (!/overflow-wrap|word-break/.test(src)) bad.push('kein overflow-wrap auf .msg .b')
      if (!/id="cin"[^>]*maxlength/.test(src)) bad.push('kein maxlength auf #cin')
      return bad.length ? bad.join(' · ') : null
    },
  },
  {
    id: 'M27', sev: 'MITTEL', kind: 'static',
    title: 'String(body.message) steht außerhalb des try → 500 statt Rückfall',
    where: 'api/chat.js:91 vs :97',
    open() {
      const lines = read('api/chat.js').split('\n')
      const coerce = lines.findIndex((l) => l.includes('String(body.message)'))
      const tryAt = lines.findIndex((l, i) => i > coerce && /^\s*try\s*\{/.test(l))
      return coerce >= 0 && tryAt > coerce ? `Zeile ${coerce + 1} liegt vor dem try in Zeile ${tryAt + 1}` : null
    },
  },
  {
    id: 'M28', sev: 'MITTEL', kind: 'static',
    title: 'Kein X-Frame-Options / frame-ancestors (Clickjacking)',
    where: 'vercel.json',
    open() {
      const v = read('vercel.json')
      return /X-Frame-Options|frame-ancestors/.test(v) ? null : 'weder X-Frame-Options noch CSP frame-ancestors'
    },
  },
  {
    id: 'M29', sev: 'MITTEL', kind: 'static',
    title: 'Drei zugängliche Namen in der falschen Sprache',
    where: 'Base.astro:159 · Assistant.astro:20,25 · Projects.astro:53',
    open() {
      const bad = []
      if (has('src/layouts/Base.astro', 'aria-label="Language"')) bad.push('nav.lang="Language"')
      if (has('src/components/Assistant.astro', 'aria-label="Assistant"')) bad.push('#chatpanel="Assistant"')
      if (has('src/components/Assistant.astro', 'aria-label="×"')) bad.push('#cclose="×"')
      if (has('src/components/Projects.astro', 'aria-label="Süreç"')) bad.push('ol.flow="Süreç"')
      return bad.length ? bad.join(' · ') : null
    },
  },
]

// ─────────────────────────────────────────────────────────── Helfer
async function ask(page, path, text) {
  await page.route('**/api/chat', (r) => r.fulfill({ status: 404, body: '' }))
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.click('#chatfab')
  await page.waitForSelector('#chatpanel:not([hidden])')
  await page.fill('#cin', text)
  await page.click('#cform button[type=submit]')
  await page.waitForFunction(() => document.querySelectorAll('#chatpanel .msg.bot:not(.typing)').length >= 2)
  const a = await page.locator('#chatpanel .msg.bot .b').last().textContent()
  await page.unroute('**/api/chat')
  return (a || '').trim()
}

async function chipText(page, path, i) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.click('#chatfab')
  await page.waitForSelector('#chatpanel:not([hidden])')
  return (await page.locator('#cchips button[data-q]').nth(i).getAttribute('data-q')) || ''
}

async function submitForm(page, { name, phone }) {
  await page.addInitScript(() => { window.__o = []; window.open = (u) => { window.__o.push(String(u)); return null } })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.locator('#randevu').scrollIntoViewIfNeeded()
  await page.fill('#reqForm [name=name]', name)
  await page.fill('#reqForm [name=phone]', phone)
  await page.check('#reqForm [name=consent]')
  await page.click('#reqForm button[type=submit]')
  return page.evaluate(() => window.__o.length > 0)
}

// ─────────────────────────────────────────────────────────── Lauf
const selected = CHECKS.filter((c) => (!ONLY.length || ONLY.includes(c.id)) && (!STATIC_ONLY || c.kind === 'static'))
const results = []
let browser = null

if (selected.some((c) => c.kind === 'live')) {
  const { chromium } = await import('playwright')
  browser = await chromium.launch()
  const probe = await fetch(BASE + '/').catch(() => null)
  if (!probe?.ok) {
    console.error(`\n✗ Kein Server auf ${BASE}. Erst \`npx astro preview --port 4321\` starten,\n  oder nur die statischen Prüfungen laufen lassen: node scripts/qa-regression.mjs --static\n`)
    await browser.close()
    process.exit(1)
  }
}

for (const c of selected) {
  let reason, error
  try {
    if (c.kind === 'static') reason = c.open()
    else {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
      const page = await ctx.newPage()
      reason = await c.open(page)
      await ctx.close()
    }
  } catch (e) {
    error = e.message.split('\n')[0]
  }
  results.push({ ...c, reason, error })
}

if (browser) await browser.close()

console.log('\n===== BESTÄTIGUNGSPRÜFUNG · docs/08-qa-ultra-bericht.md =====\n')
let open = 0, fixed = 0, broken = 0
for (const r of results) {
  if (r.error) { broken++; console.log(`  ⚠ ${r.id} [${r.sev}] Prüfung selbst fehlgeschlagen: ${r.error}`); continue }
  if (r.reason) { open++; console.log(`  ✗ OFFEN   ${r.id} [${r.sev}] ${r.title}\n              ${r.reason}\n              → ${r.where}`) }
  else { fixed++; console.log(`  ✓ BEHOBEN ${r.id} [${r.sev}] ${r.title}`) }
}
console.log(`\nERGEBNIS: ${open} offen · ${fixed} behoben · ${broken} Prüfung defekt (von ${results.length})`)
if (broken) console.log('Eine defekte Prüfung ist KEIN Beweis für eine Behebung — bitte nachsehen.')
process.exit(open)
