// ADVERSARIAL VERIFICATION round 5 — job: REFUTE. Default to REFUTED if uncertain.
// CLAIM M (L8/D2, rated Critical): at 200% zoom the chat's message input is laid
// out below the panel, is not hit-testable, and the panel cannot be scrolled.
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')

const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad'
const b = await chromium.launch()
const R = []

// 200% zoom on a 1280x800 window == 640x400 layout viewport at dsf 2 (WCAG method).
// 400% == 320x200. Landscape phone == 844x390. Portrait control == 390x844.
const cases = [
  ['portrait 390x844 (control)', 390, 844, 1],
  ['200% zoom (640x400 @dsf2)', 640, 400, 2],
  ['400% zoom (320x200 @dsf2)', 320, 200, 2],
  ['phone landscape 844x390', 844, 390, 1],
]

for (const [label, w, h, dsf] of cases) {
  for (const run of [1, 2]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, colorScheme: 'dark' })
    const page = await ctx.newPage()
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.click('#chatfab')
    await page.waitForSelector('#chatpanel:not([hidden])')
    const m = await page.evaluate(() => {
      const p = document.getElementById('chatpanel')
      const cin = document.getElementById('cin')
      const pr = p.getBoundingClientRect()
      const ir = cin.getBoundingClientRect()
      const cx = Math.round(ir.left + ir.width / 2)
      const cy = Math.round(ir.top + ir.height / 2)
      const hit = document.elementFromPoint(cx, cy)
      return {
        panel: `${Math.round(pr.top)}..${Math.round(pr.bottom)}`,
        panelScroll: `${p.scrollHeight}/${p.clientHeight}`,
        overflowY: getComputedStyle(p).overflowY,
        input: `${Math.round(ir.top)}..${Math.round(ir.bottom)}`,
        inputBelowPanel: ir.top >= pr.bottom,
        inputBelowViewport: ir.top >= window.innerHeight,
        hitAtInputCentre: hit ? (hit.id || hit.tagName + '.' + hit.className) : 'NULL',
        cbodyMinHeight: getComputedStyle(document.getElementById('cbody')).minHeight,
      }
    })
    // can the user scroll the panel with the wheel?
    await page.mouse.move(Math.round(w / 2), Math.round(h / 2))
    await page.mouse.wheel(0, 300)
    const scrolled = await page.evaluate(() => document.getElementById('chatpanel').scrollTop)
    if (run === 1) {
      R.push([`M · ${label}`, `panel y ${m.panel} (scroll ${m.panelScroll}, overflow-y:${m.overflowY}) · #cin y ${m.input} · below panel=${m.inputBelowPanel} · below viewport=${m.inputBelowViewport} · elementFromPoint(#cin centre)=${m.hitAtInputCentre} · wheel→scrollTop=${scrolled} · .cbody min-height=${m.cbodyMinHeight}`])
      if (m.inputBelowPanel) await page.screenshot({ path: `${DIR}/verify-chat-${w}x${h}.png` })
    }
    await ctx.close()
  }
}

await b.close()
console.log('\n===== ADVERSARIAL VERIFICATION · ROUND 5 =====')
for (const [c, d] of R) console.log(`\n• ${c}\n  ${d}`)
