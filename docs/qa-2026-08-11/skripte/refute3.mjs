// ADVERSARIAL VERIFICATION round 3 — job: REFUTE. Default to REFUTED if uncertain.
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')

const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad'
const b = await chromium.launch()
const R = []
const rec = (c, d) => R.push([c, d])

// CLAIM H (L3/D5): the header row overflows at <=347px and 481-535px, and in the
// 481-535 band the burger is entirely outside the viewport while .mainnav is
// still hidden — i.e. no navigation control is reachable without h-scrolling.
// Refutation attempt: measure documentElement.scrollWidth and the burger's box
// at each width, twice.
{
  const widths = [320, 347, 348, 390, 480, 481, 500, 535, 536, 560, 1000]
  const results = {}
  for (const w of widths) {
    for (const run of [1, 2]) {
      const page = await b.newPage({ viewport: { width: w, height: 900 }, colorScheme: 'dark' })
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      const m = await page.evaluate(() => {
        const bu = document.getElementById('burger')
        const nav = document.querySelector('.mainnav')
        const r = bu ? bu.getBoundingClientRect() : null
        return {
          sw: document.documentElement.scrollWidth,
          iw: window.innerWidth,
          burgerVisible: bu ? getComputedStyle(bu).display !== 'none' : false,
          burgerRight: r ? Math.round(r.right) : null,
          burgerLeft: r ? Math.round(r.left) : null,
          navVisible: nav ? getComputedStyle(nav).display !== 'none' : false,
          bsVisible: document.querySelector('.bs') ? getComputedStyle(document.querySelector('.bs')).display !== 'none' : false,
        }
      })
      if (run === 1) results[w] = m
      else if (JSON.stringify(results[w]) !== JSON.stringify(m)) results[w].UNSTABLE = true
      if (run === 1 && (w === 481 || w === 500)) await page.screenshot({ path: `${DIR}/verify-header-${w}.png` })
      await page.close()
    }
  }
  for (const [w, m] of Object.entries(results)) {
    const ovf = m.sw - m.iw
    const burgerOffscreen = m.burgerVisible && m.burgerLeft !== null && m.burgerLeft >= m.iw
    rec(`H · width ${w}px`, `overflow=${ovf > 1 ? '+' + ovf + 'px' : 'none'} · burger ${m.burgerVisible ? `visible box ${m.burgerLeft}..${m.burgerRight}` : 'hidden'}${burgerOffscreen ? ' ← FULLY OFF-SCREEN' : ''} · mainnav=${m.navVisible} · tagline=${m.bsVisible}${m.UNSTABLE ? ' · UNSTABLE' : ''}`)
  }
}

// CLAIM I (L3/D8): the counters animate from 0, so the rating briefly paints a
// value LOWER than the truth (~0,7) and the review count paints ~9.
// Refutation attempt: sample every animation frame; if the minimum painted
// value never drops below the target, the claim is refuted.
{
  for (const [loc, path] of [['tr', '/'], ['en', '/en/']]) {
    for (const run of [1, 2]) {
      const page = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
      await page.goto(BASE + path, { waitUntil: 'networkidle' })
      const samples = await page.evaluate(async () => {
        const rating = document.querySelector('[data-count="5"]')
        const count = document.querySelector('.ab-n')
        if (!rating || !count) return null
        const seen = []
        let stop = false
        const tick = () => {
          seen.push([rating.textContent.trim(), count.textContent.trim()])
          if (!stop) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        document.querySelector('#hakkimizda').scrollIntoView()
        await new Promise((r) => setTimeout(r, 2000))
        stop = true
        return seen
      })
      if (!samples) { rec(`I · ${loc}`, 'counter elements not found'); await page.close(); continue }
      const nums = samples.map(([r, c]) => [parseFloat(r.replace(/[^\d.,]/g, '').replace(',', '.')), parseInt(c, 10)])
        .filter(([r, c]) => !isNaN(r) && !isNaN(c))
      const minR = Math.min(...nums.map((n) => n[0]))
      const minC = Math.min(...nums.map((n) => n[1]))
      const last = samples.at(-1)
      if (run === 1) rec(`I · ${loc} counter frames (${samples.length} frames)`,
        `min rating painted=${minR} · min count painted=${minC} · settles at "${last[0]}" / "${last[1]}" · distinct rating values=${new Set(nums.map(n => n[0])).size}`)
      await page.close()
    }
  }
}

// CLAIM J (L3/D1): the calculator pins to 48.000 for large areas AND the field
// keeps the typed over-range value. Already partly seen; confirm the saturation
// point live at 77 vs 76 and at 200/12/sun.
{
  const page = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  for (const [a, p, sun] of [[76, 2, 0], [77, 2, 0], [200, 12, 1], [500, 12, 1]]) {
    await page.fill('#ca', String(a))
    await page.fill('#cp', String(p))
    await page.click(`[data-sun="${sun}"]`)
    await page.waitForFunction(() => document.getElementById('cbtu').textContent.length > 0)
    const s = await page.evaluate(() => ({
      shows: document.getElementById('cbtu').textContent,
      field: document.getElementById('ca').value,
      cta: decodeURIComponent((document.getElementById('ccta').getAttribute('href') || '').split('text=')[1] || ''),
    }))
    rec(`J · ${a} m², ${p} ppl, sun=${sun}`, `#cbtu=${s.shows} · field still reads "${s.field}" · deeplink="${s.cta}"`)
  }
  await page.close()
}

await b.close()
console.log('\n===== ADVERSARIAL VERIFICATION · ROUND 3 =====')
for (const [c, d] of R) console.log(`\n• ${c}\n  ${d}`)
