// L3 — viewport / layout boundary sweep.
// Technique: 3-value BVA on every CSS breakpoint found in the source
// (480, 560, 640, 720, 760, 820, 900, 960, 1000) plus device extremes.
// Oracles per width: (1) no horizontal document overflow,
// (2) mutually exclusive breakpoint pairs are in exactly one state,
// (3) at least one WhatsApp affordance is reachable.
import { chromium, BASE, DIR } from './pw.mjs'

const WIDTHS = [320, 359, 360, 361, 479, 480, 481, 559, 560, 561, 639, 640, 719, 720,
  759, 760, 761, 819, 820, 899, 900, 959, 960, 999, 1000, 1001, 1280, 1440, 1920, 2560]

const probe = () => {
  const vis = (sel) => {
    const e = document.querySelector(sel)
    if (!e) return { exists: false, visible: false }
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect()
    return {
      exists: true,
      visible: cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0 && r.width > 0 && r.height > 0,
      display: cs.display, w: Math.round(r.width), h: Math.round(r.height),
      inViewportX: r.left >= -1 && r.right <= window.innerWidth + 1,
    }
  }
  const cols = (sel) => {
    const e = document.querySelector(sel)
    if (!e) return 'missing'
    const t = getComputedStyle(e).gridTemplateColumns
    return t === 'none' ? 'none' : t.split(' ').length
  }
  // widest element that sticks out of the viewport, if any
  let widest = null
  if (document.documentElement.scrollWidth > window.innerWidth) {
    for (const e of document.querySelectorAll('body *')) {
      const r = e.getBoundingClientRect()
      if (r.right > window.innerWidth + 1 || r.left < -1) {
        const over = Math.max(r.right - window.innerWidth, -r.left)
        if (!widest || over > widest.over) widest = { over: Math.round(over), sel: e.tagName + '.' + (e.className || '').toString().split(' ')[0], w: Math.round(r.width) }
      }
    }
  }
  return {
    docSW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    innerW: window.innerWidth,
    widest,
    mainnav: vis('.mainnav'), burger: vis('#burger'),
    wafab: vis('.wafab'), mobar: vis('.mobar'),
    calcViz: vis('.calc-viz'), chatfab: vis('#chatfab'),
    cards: cols('.cards'), prods: cols('.prods'), tiles: cols('.tiles'),
    camp: cols('.camp-grid'), revs: cols('.revs'), rfGrid: cols('.rf-grid'),
    calcGrid: cols('.calc-grid'), reqGrid: cols('.req-grid'), about: cols('.about'),
    contact: cols('.contact'), systems: cols('.systems'), flow: cols('.flow'), expGrid: cols('.exp-grid'),
  }
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()) })

const rows = []
for (const w of WIDTHS) {
  await page.setViewportSize({ width: w, height: 900 })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  // scroll the whole page so every lazy/reveal element is laid out, then return
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => requestAnimationFrame(r)) }
    window.scrollTo(0, 0); await new Promise((r) => requestAnimationFrame(r))
  })
  await page.waitForFunction(() => document.querySelectorAll('[data-reveal]:not(.shown)').length === 0 || true)
  const r = await page.evaluate(probe)
  rows.push({ w, ...r })
}

const fails = []
console.log('w    | docSW/innerW | overflow | mainnav | burger | wafab | mobar | calcViz | WA reachable | cards prods tiles camp revs rf calcG reqG about contact systems flow expG')
for (const r of rows) {
  const ov = r.docSW > r.innerW
  const navXor = r.mainnav.visible !== r.burger.visible
  const waXor = r.wafab.visible !== r.mobar.visible
  const waReach = r.wafab.visible || r.mobar.visible
  const calcVizExpected = r.w >= 900
  const calcVizOk = r.calcViz.visible === calcVizExpected
  if (ov) fails.push({ w: r.w, why: `horizontal overflow docSW=${r.docSW} innerW=${r.innerW} worst=${JSON.stringify(r.widest)}` })
  if (!navXor) fails.push({ w: r.w, why: `mainnav/#burger not mutually exclusive: mainnav.visible=${r.mainnav.visible} burger.visible=${r.burger.visible}` })
  if (!waXor) fails.push({ w: r.w, why: `.wafab/.mobar not mutually exclusive: wafab=${r.wafab.visible} mobar=${r.mobar.visible}` })
  if (!waReach) fails.push({ w: r.w, why: 'NO WhatsApp affordance reachable' })
  if (!calcVizOk) fails.push({ w: r.w, why: `.calc-viz visible=${r.calcViz.visible} but expected ${calcVizExpected} (rule: hidden <=899px)` })
  console.log(
    `${String(r.w).padEnd(4)} | ${String(r.docSW + '/' + r.innerW).padEnd(12)} | ${String(ov ? 'YES ' + (r.docSW - r.innerW) + 'px' : 'no').padEnd(8)} | ` +
    `${String(r.mainnav.visible).padEnd(7)} | ${String(r.burger.visible).padEnd(6)} | ${String(r.wafab.visible).padEnd(5)} | ${String(r.mobar.visible).padEnd(5)} | ` +
    `${String(r.calcViz.visible).padEnd(7)} | ${String(waReach).padEnd(12)} | ${r.cards} ${r.prods} ${r.tiles} ${r.camp} ${r.revs} ${r.rfGrid} ${r.calcGrid} ${r.reqGrid} ${r.about} ${r.contact} ${r.systems} ${r.flow} ${r.expGrid}`)
}

console.log('\n=== FAILURES ===')
if (!fails.length) console.log('(none)')
for (const f of fails) console.log(`  w=${f.w}: ${f.why}`)

// screenshot every failing width
const uniqW = [...new Set(fails.map((f) => f.w))]
for (const w of uniqW) {
  await page.setViewportSize({ width: w, height: 900 })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${DIR}/vp-fail-${w}.png` })
}
console.log(`\nscreenshots written for widths: ${uniqW.join(', ') || '(none)'}`)
console.log(`\nerrors: ${errs.length ? [...new Set(errs)].join('\n') : '(none)'}`)
await browser.close()
