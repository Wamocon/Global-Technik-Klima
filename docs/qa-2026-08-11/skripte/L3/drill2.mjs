// L3 — three drill-downs: (a) exact upper edge of the header-overflow band,
// (b) the 24 px root-font-size overflow inside .calc, (c) the reviews-grid gap.
import { chromium, BASE, DIR } from './pw.mjs'

const browser = await chromium.launch()

// (a) bisect the header overflow band
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  console.log('=== (a) header-overflow band, 2 runs ===')
  for (let run = 1; run <= 2; run++) {
    const bad = []
    for (const w of [300, 310, 320, 330, 340, 347, 348, 349, 350, 360, 480, 481, 500, 520, 530, 534, 535, 536, 537, 540, 560]) {
      await page.setViewportSize({ width: w, height: 900 })
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
      const r = await page.evaluate(() => {
        const b = document.querySelector('#burger').getBoundingClientRect()
        const t = document.querySelector('.tbin').getBoundingClientRect()
        const bs = document.querySelector('.bs')
        return {
          docSW: document.documentElement.scrollWidth, iw: window.innerWidth,
          burgerRight: Math.round(b.right), tbinW: Math.round(t.width),
          bsVisible: bs ? getComputedStyle(bs).display !== 'none' : false,
        }
      })
      if (r.docSW > r.iw) bad.push(w)
      console.log(`  run${run} w=${String(w).padEnd(4)} docSW=${String(r.docSW).padEnd(4)} burger.right=${String(r.burgerRight).padEnd(4)} tagline(.bs) visible=${String(r.bsVisible).padEnd(5)} ${r.docSW > r.iw ? 'OVERFLOW +' + (r.docSW - r.iw) : 'ok'}`)
    }
    console.log(`  run${run} failing widths: ${bad.join(', ')}`)
  }
  // prove the burger is off-screen (not merely clipped) at 500 and reachable only by h-scroll
  await page.setViewportSize({ width: 500, height: 900 })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  const reach = await page.evaluate(() => {
    const b = document.querySelector('#burger').getBoundingClientRect()
    const el = document.elementFromPoint(Math.min(window.innerWidth - 2, Math.round(b.left + b.width / 2)), Math.round(b.top + b.height / 2))
    return { left: Math.round(b.left), right: Math.round(b.right), iw: window.innerWidth, atCentre: el ? el.tagName + '.' + (el.className || '') : null, fullyOffscreen: b.left >= window.innerWidth }
  })
  console.log(`  w=500: burger box left=${reach.left} right=${reach.right} innerWidth=${reach.iw} fullyOffscreen=${reach.fullyOffscreen} elementAtItsCentreColumn=${reach.atCentre}`)
  await page.screenshot({ path: `${DIR}/header-500-clipped.png`, clip: { x: 0, y: 0, width: 500, height: 70 } })
  await page.evaluate(() => window.scrollTo(document.documentElement.scrollWidth, 0))
  await page.screenshot({ path: `${DIR}/header-500-scrolled-right.png`, clip: { x: 0, y: 0, width: 500, height: 70 } })
  await ctx.close()
}

// (b) 24px root font size — where exactly does .calc overflow?
{
  console.log('\n=== (b) root font-size 24px, .calc overflow, 2 runs x width sweep ===')
  for (let run = 1; run <= 2; run++) {
    for (const w of [320, 360, 390, 412, 430, 480, 560, 640, 760, 900, 1280]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 } })
      const page = await ctx.newPage()
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      await page.evaluate(() => { document.documentElement.style.fontSize = '24px' })
      await page.locator('#kesif').scrollIntoViewIfNeeded()
      const r = await page.evaluate(() => {
        const iw = window.innerWidth
        const off = []
        for (const e of document.querySelectorAll('body *')) {
          const b = e.getBoundingClientRect()
          if (b.width && b.height && b.right > iw + 1) {
            off.push({ s: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : ''), w: Math.round(b.width), over: Math.round(b.right - iw) })
          }
        }
        off.sort((a, b) => b.over - a.over)
        const ca = document.querySelector('#ca')
        const cs = ca ? getComputedStyle(ca) : null
        return { docSW: document.documentElement.scrollWidth, iw, off: off.slice(0, 4), caW: ca ? Math.round(ca.getBoundingClientRect().width) : 0, caCssW: cs?.width, calcW: Math.round(document.querySelector('.calc').getBoundingClientRect().width) }
      })
      console.log(`  run${run} w=${String(w).padEnd(4)} docSW=${String(r.docSW).padEnd(5)} ${r.docSW > r.iw ? 'OVERFLOW +' + (r.docSW - r.iw) : 'ok'}  #ca width=${r.caW}px (css ${r.caCssW}) .calc width=${r.calcW}  offenders=${JSON.stringify(r.off)}`)
      if (r.docSW > r.iw && run === 1) await page.screenshot({ path: `${DIR}/rootfont24-${w}.png` })
      await ctx.close()
    }
  }
}

// (c) reviews grid with 2 vs 3 items
{
  console.log('\n=== (c) reviews grid: 3 items (tr) vs 2 items (de/ru/en) at 1440 ===')
  for (const [code, url] of [['tr', '/'], ['en', '/en/']]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(BASE + url, { waitUntil: 'networkidle' })
    await page.locator('.revs').scrollIntoViewIfNeeded()
    const r = await page.evaluate(() => {
      const g = document.querySelector('.revs')
      const gb = g.getBoundingClientRect()
      const kids = [...g.children].map((k) => { const b = k.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width) } })
      return { cols: getComputedStyle(g).gridTemplateColumns, gridRight: Math.round(gb.right), kids, exampleBadges: document.querySelectorAll('.revs .ex').length, sub: document.querySelector('.revs')?.previousElementSibling?.textContent?.trim() }
    })
    const emptyPx = r.gridRight - (r.kids.length ? r.kids[r.kids.length - 1].right : r.gridRight)
    console.log(`  ${code}: items=${r.kids.length} columns="${r.cols}" trailing empty track = ${emptyPx}px  example-badges=${r.exampleBadges}`)
    await page.screenshot({ path: `${DIR}/revs-${code}-1440.png`, clip: await page.locator('.revs').boundingBox() })
    await ctx.close()
  }
}
await browser.close()
