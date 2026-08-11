// ADVERSARIAL VERIFICATION round 4 — job: REFUTE. Default to REFUTED if uncertain.
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')

const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad'
const b = await chromium.launch()
const R = []
const rec = (c, d) => R.push([c, d])

// CLAIM K (L4/DEF-04): a double-tap on the Randevu submit opens TWO identical
// wa.me deeplinks → duplicate lead. Refutation attempt: maybe a guard exists.
{
  for (const mode of ['dblclick', 'two-clicks']) {
    for (const run of [1, 2]) {
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
      const page = await ctx.newPage()
      const opened = []
      await page.addInitScript(() => {
        window.__opened = []
        const orig = window.open
        window.open = (u, ...rest) => { window.__opened.push(String(u)); return null }
      })
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      await page.locator('#randevu').scrollIntoViewIfNeeded()
      await page.fill('#reqForm [name=name]', 'Ayşe Yılmaz')
      await page.fill('#reqForm [name=phone]', '+90 555 111 22 33')
      await page.check('#reqForm [name=consent]')
      const btn = page.locator('#reqForm button[type=submit]')
      if (mode === 'dblclick') await btn.dblclick()
      else { await btn.click(); await btn.click() }
      await page.waitForFunction(() => window.__opened.length >= 1)
      const o = await page.evaluate(() => ({ n: window.__opened.length, urls: [...new Set(window.__opened)], disabled: document.querySelector('#reqForm button[type=submit]').disabled }))
      if (run === 1) rec(`K · ${mode}`, `window.open calls=${o.n} · distinct URLs=${o.urls.length} · button disabled after=${o.disabled}`)
      await ctx.close()
    }
  }
}

// CLAIM L (L4/DEF-06): with no WebGL the exploded unit throws an UNCAUGHT error
// (breaking the project's own "no JS errors" gate) and the legend text stays at
// 0.45 opacity → ~2.36:1 contrast.
{
  for (const run of [1, 2]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
    const page = await ctx.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message))
    page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()) })
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (t, ...a) {
        if (String(t).startsWith('webgl')) return null
        return orig.call(this, t, ...a)
      }
    })
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.locator('#teknik').scrollIntoViewIfNeeded()
    await page.waitForFunction(() => {
      const li = document.querySelectorAll('#expLegend li')
      return li.length > 0
    })
    // settle: give the dynamic import + boot() its chance to fail
    await page.waitForTimeout(3000) // deliberate settle after a fault, not a stabilisation wait
    const m = await page.evaluate(() => {
      const li = document.querySelector('#expLegend li')
      const cs = getComputedStyle(li)
      const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number)
      // resolve the effective colour of the dimmed legend text over the section bg
      const fg = parse(cs.color), op = parseFloat(cs.opacity)
      let el = li, bg = null
      while (el && !bg) { const c = parse(getComputedStyle(el).backgroundColor); if (c[3] === undefined || c[3] > 0) bg = c; el = el.parentElement }
      const eff = fg.slice(0, 3).map((c, i) => c * op + bg[i] * (1 - op))
      const lum = (rgb) => { const a = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2] }
      const l1 = lum(eff), l2 = lum(bg.slice(0, 3))
      return {
        legendOn: document.querySelectorAll('#expLegend li.on').length,
        legendTotal: document.querySelectorAll('#expLegend li').length,
        opacity: cs.opacity,
        effective: eff.map(Math.round),
        bg: bg.slice(0, 3),
        contrast: +(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05))).toFixed(2),
      }
    })
    if (run === 1) {
      await page.screenshot({ path: `${DIR}/verify-nowebgl.png` })
      rec('L · no WebGL', `pageerrors=${JSON.stringify(errs.slice(0, 2))} · legend .on=${m.legendOn}/${m.legendTotal} · opacity=${m.opacity} · effective rgb(${m.effective}) on rgb(${m.bg}) → contrast ${m.contrast}:1 (AA needs 4.5)`)
    }
    await ctx.close()
  }
}

await b.close()
console.log('\n===== ADVERSARIAL VERIFICATION · ROUND 4 =====')
for (const [c, d] of R) console.log(`\n• ${c}\n  ${d}`)
