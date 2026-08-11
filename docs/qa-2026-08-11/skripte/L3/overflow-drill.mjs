// L3 — drill-down on the two widths that overflowed, re-run 3x each (defect discipline).
import { chromium, BASE, DIR } from './pw.mjs'

const WIDTHS = [320, 359, 360, 375, 390, 430, 479, 480, 481, 482, 500, 520, 559]
const RUNS = 3

const detect = () => {
  const iw = window.innerWidth
  const offenders = []
  for (const e of document.querySelectorAll('body *')) {
    const r = e.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (r.right > iw + 1) {
      const cs = getComputedStyle(e)
      offenders.push({
        sel: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : ''),
        right: Math.round(r.right), left: Math.round(r.left), w: Math.round(r.width),
        over: Math.round(r.right - iw), pos: cs.position, display: cs.display,
        styleW: e.getAttribute('style') || '', attrW: e.getAttribute('width') || '',
      })
    }
  }
  offenders.sort((a, b) => b.over - a.over)
  return {
    docSW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, iw,
    bodySW: document.body.scrollWidth,
    offenders: offenders.slice(0, 8),
    // any element WIDER than the viewport regardless of position
    wide: [...document.querySelectorAll('body *')].map((e) => ({ s: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : ''), w: Math.round(e.getBoundingClientRect().width) }))
      .filter((x) => x.w > iw + 1).sort((a, b) => b.w - a.w).slice(0, 6),
  }
}

const browser = await chromium.launch()
for (let run = 1; run <= RUNS; run++) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  console.log(`\n############ RUN ${run} ############`)
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 })
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => requestAnimationFrame(r)) }
      window.scrollTo(0, 0); await new Promise((r) => requestAnimationFrame(r))
    })
    const r = await page.evaluate(detect)
    const ov = r.docSW > r.iw
    console.log(`w=${String(w).padEnd(4)} docSW=${String(r.docSW).padEnd(5)} clientW=${String(r.clientW).padEnd(5)} bodySW=${String(r.bodySW).padEnd(5)} -> ${ov ? 'OVERFLOW +' + (r.docSW - r.iw) : 'ok'}`)
    if (ov) {
      console.log(`   right-edge offenders: ${r.offenders.length ? JSON.stringify(r.offenders.slice(0, 4)) : 'NONE (overflow has no element sticking out to the right)'}`)
      console.log(`   elements wider than viewport: ${JSON.stringify(r.wide)}`)
      await page.screenshot({ path: `${DIR}/ovf-${w}-run${run}.png` })
      await page.screenshot({ path: `${DIR}/ovf-${w}-run${run}-full.png`, fullPage: true })
    }
  }
  await ctx.close()
}
await browser.close()
