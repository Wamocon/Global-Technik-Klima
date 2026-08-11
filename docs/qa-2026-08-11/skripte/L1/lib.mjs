// Shared harness for L1 (functional-positive / happy path) lens.
// Scripts live outside the project tree, so resolve playwright by absolute file URL.
const pw = await import('file:///D:/01%20Antigrafity%20Projekte/25%20Global-Technik-Klima/node_modules/playwright/index.js')
const chromium = pw.chromium ?? pw.default.chromium

export const BASE = 'http://localhost:4321'
export const LOCALES = ['tr', 'de', 'ru', 'en']
export const HOME = { tr: '/', de: '/de/', ru: '/ru/', en: '/en/' }
export const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L1'

let PASS = 0
let FAIL = 0
const FAILS = []

export function ok(name, cond, detail = '') {
  if (cond) { PASS++; console.log(`  PASS  ${name}`) }
  else { FAIL++; FAILS.push({ name, detail }); console.log(`  FAIL  ${name}${detail ? '  ::  ' + detail : ''}`) }
  return !!cond
}
export function eq(name, actual, expected) {
  const same = JSON.stringify(actual) === JSON.stringify(expected)
  return ok(name, same, same ? '' : `expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`)
}
export function summary(label) {
  console.log(`\n===== ${label}: ${PASS} pass / ${FAIL} fail =====`)
  if (FAILS.length) { console.log('FAILURES:'); FAILS.forEach((f, i) => console.log(`  ${i + 1}. ${f.name} :: ${f.detail}`)) }
  return { PASS, FAIL, FAILS }
}

export async function browser(opts = {}) {
  return chromium.launch({ ...opts })
}

/** New page with console/pageerror collection attached. */
export async function newPage(ctx) {
  const page = await ctx.newPage()
  page.__errors = []
  page.__http404 = []
  // `POST /api/chat` 404 is the documented production state under `astro preview`
  // (Vercel function not served). Chromium logs it as a generic console error with
  // no URL, so we account for it by counting the real 404 responses instead.
  page.on('response', (r) => { if (r.status() === 404) page.__http404.push(`${r.request().method()} ${r.url()}`) })
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const t = m.text()
    if (/Failed to load resource: the server responded with a status of 404/.test(t)) {
      page.__expected404++ // counted, decided later
      return
    }
    page.__errors.push(`console.error: ${t}`)
  })
  page.__expected404 = 0
  page.on('pageerror', (e) => page.__errors.push(`pageerror: ${e.message}`))
  page.__thirdParty = []
  page.__aborted = []
  page.on('requestfailed', (r) => {
    const u = r.url()
    if (u.includes('/api/chat')) return
    // Requests made by the Google Maps <iframe> are that iframe's business and are
    // explicitly out of scope for this lens (recorded, not failed).
    if (r.frame() !== page.mainFrame()) { page.__thirdParty.push(u); return }
    // ERR_ABORTED on a lazily imported chunk means the harness navigated away while
    // the idle-time import was in flight. Recorded, not counted as a product error.
    if ((r.failure()?.errorText || '').includes('ERR_ABORTED')) { page.__aborted.push(u); return }
    page.__errors.push(`requestfailed: ${u} ${r.failure()?.errorText}`)
  })
  page.on('request', (r) => {
    const h = new URL(r.url()).hostname
    if (h !== 'localhost' && r.frame() === page.mainFrame()) page.__thirdParty.push(r.url())
  })
  return page
}

/** Any 404 that is NOT the documented /api/chat one is a genuine error. */
export function unexpected404s(page) {
  return page.__http404.filter((u) => !u.includes('/api/chat'))
}
/** normalise NBSP / narrow-NBSP so locale grouping comparisons are meaningful */
export const nbsp = (s) => (s || '').replace(/[   ]/g, ' ')

export async function goHome(page, locale) {
  const res = await page.goto(BASE + HOME[locale], { waitUntil: 'networkidle' })
  return res
}

/** Pseudo-locale / missing-key leak detector.
 *  Char set derived from src/i18n/xx.json MINUS anything legitimately used by
 *  tr/de/ru/en (ı İ ş ğ ç ö ü ä ß Ü Ç · — Cyrillic). What is left cannot appear
 *  in real copy, so a single occurrence is proof of a pseudo-string leak. */
export const PSEUDO_RE = /‹[a-zA-Z.]+›|[ĶŀīḿǻńǧḗǺÿṼřŭƒḾǿŧẆǦĦḓħṽŘŃḒƁƑƥƀẇẑĴŦẋƤǾḖŬĿ]/
export function pseudoLeak(text) {
  const m = text.match(PSEUDO_RE)
  return m ? m[0] : null
}
