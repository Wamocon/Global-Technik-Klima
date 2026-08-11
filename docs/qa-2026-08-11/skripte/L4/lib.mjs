// Shared helpers for L4 (failure / degradation / recovery)
export const BASE = 'http://localhost:4321'
export const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L4'
export const LOCALES = [
  { code: 'tr', url: `${BASE}/` },
  { code: 'de', url: `${BASE}/de/` },
  { code: 'ru', url: `${BASE}/ru/` },
  { code: 'en', url: `${BASE}/en/` },
]

export function collect(page, tag = '') {
  const errs = []
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errs.push(`[${tag}][console.${m.type()}] ${m.text()}`)
  })
  page.on('pageerror', (e) => errs.push(`[${tag}][pageerror] ${e.message}`))
  page.on('requestfailed', (r) => {
    const f = r.failure()?.errorText || ''
    // intentional aborts are noise; caller filters
    errs.push(`[${tag}][requestfailed] ${r.url()} :: ${f}`)
  })
  return errs
}

export const ok = (c, msg, extra = '') =>
  console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}${extra ? '  ::  ' + extra : ''}`)

export const info = (msg) => console.log(`      ${msg}`)

export async function poll(fn, { timeout = 8000, interval = 100 } = {}) {
  const t0 = Date.now()
  for (;;) {
    let v
    try { v = await fn() } catch { v = false }
    if (v) return { ok: true, ms: Date.now() - t0 }
    if (Date.now() - t0 > timeout) return { ok: false, ms: Date.now() - t0 }
    await new Promise((r) => setTimeout(r, interval))
  }
}
