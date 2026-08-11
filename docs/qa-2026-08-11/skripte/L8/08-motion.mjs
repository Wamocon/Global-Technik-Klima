/** WCAG 2.3.1 (flashing) and 2.3.3 (animation from interactions) + reduced motion. */
import { launch, openPage, saveJSON, DIR } from './lib.mjs'

const browser = await launch()
const out = {}

// ── 1. reducedMotion: reduce ─────────────────────────────────────────────────
for (const theme of ['dark', 'light']) {
  const { page, ctx, errors } = await openPage(browser, { url: '/', theme, viewport: 'desktop', reducedMotion: 'reduce' })
  await page.waitForFunction(() => document.fonts.status === 'loaded')
  // Content must be visible WITHOUT any help from the test harness.
  const vis = await page.evaluate(() => {
    const probe = ['#kontakt', 'footer.foot', '#randevu', '#kesif', '#urunler', '#projeler']
    const r = {}
    for (const s of probe) {
      const e = document.querySelector(s)
      if (!e) { r[s] = 'absent'; continue }
      const cs = getComputedStyle(e)
      r[s] = { opacity: cs.opacity, transform: cs.transform, height: Math.round(e.getBoundingClientRect().height) }
    }
    return {
      htmlHasMotionClass: document.documentElement.classList.contains('motion'),
      revealHidden: [...document.querySelectorAll('[data-reveal]')].filter((n) => Number(getComputedStyle(n).opacity) < 0.9).length,
      revealTotal: document.querySelectorAll('[data-reveal]').length,
      probe: r,
      runningAnimations: document.getAnimations().map((a) => ({ name: a.animationName || a.constructor.name, state: a.playState, iterations: a.effect?.getTiming?.().iterations })),
    }
  })
  // counters must NOT animate: read the value immediately and again later
  const counter1 = await page.evaluate(() => {
    const e = document.querySelector('.ab-stat b[data-count]')
    e?.scrollIntoView({ block: 'center', behavior: 'instant' })
    return document.querySelector('.ab-stat b[data-count]')?.textContent
  })
  await page.waitForFunction(() => true)
  const counter2 = await page.evaluate(() => document.querySelector('.ab-stat b[data-count]')?.textContent)
  const counterN = await page.evaluate(() => document.querySelector('.ab-n')?.textContent)
  // 3D unit: must be a single static frame, no rAF loop
  await page.evaluate(() => document.getElementById('expStage')?.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.waitForFunction(() => { const c = document.getElementById('expCanvas'); return c && c.width > 0 }, null, { timeout: 12000 }).catch(() => {})
  const frames = await page.evaluate(() => new Promise((res) => {
    let n = 0
    const t0 = performance.now()
    const tick = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(tick); else res(n) }
    requestAnimationFrame(tick)
  }))
  // Did the 3D canvas content change over 1s? (loop detection by pixel hash)
  const canvasStable = await page.evaluate(async () => {
    const c = document.getElementById('expCanvas')
    if (!c) return 'absent'
    const grab = () => { try { return c.toDataURL().length + ':' + c.toDataURL().slice(-40) } catch { return 'tainted' } }
    const a = grab()
    await new Promise((r) => setTimeout(r, 900))
    const b = grab()
    return { same: a === b, a: a.slice(0, 20), b: b.slice(0, 20) }
  })
  // hero parallax under reduced motion
  const parallax = await page.evaluate(async () => {
    const el = document.querySelector('.hero-parallax')
    if (!el) return 'absent'
    scrollTo(0, 0)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    const t0 = getComputedStyle(el).transform
    scrollTo(0, 500)
    await new Promise((r) => setTimeout(r, 400))
    const t1 = getComputedStyle(el).transform
    scrollTo(0, 0)
    return { atTop: t0, at500: t1, moved: t0 !== t1 }
  })
  await page.screenshot({ path: `${DIR}/reduced-motion-${theme}.png` })
  out[`reduce-${theme}`] = { vis, counter1, counter2, counterN, framesIn1s: frames, canvasStable, parallax, errors }
  await ctx.close()
}

// ── 2. no-preference: flashing analysis of the hero canvas + frost ───────────
{
  const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: 'desktop' })
  await page.waitForFunction(() => { const c = document.getElementById('frost'); return c && c.classList.contains('on') }, null, { timeout: 12000 }).catch(() => {})
  // sample the hero region ~20x over 2s and measure relative-luminance swing
  const shots = []
  for (let i = 0; i < 20; i++) {
    const b = await page.screenshot({ type: 'png', clip: { x: 0, y: 120, width: 600, height: 300 } })
    shots.push(b.toString('base64'))
  }
  const lum = await page.evaluate(async (list) => {
    const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4) }
    const vals = []
    for (const s of list) {
      const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode()
      const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight
      const x = c.getContext('2d'); x.drawImage(i, 0, 0)
      const d = x.getImageData(0, 0, c.width, c.height).data
      let sum = 0, n = 0
      for (let k = 0; k < d.length; k += 16) { sum += 0.2126 * lin(d[k]) + 0.7152 * lin(d[k + 1]) + 0.0722 * lin(d[k + 2]); n++ }
      vals.push(Math.round((sum / n) * 100000) / 100000)
    }
    return vals
  }, shots)
  const min = Math.min(...lum), max = Math.max(...lum)
  out.flash = { luminanceSamples: lum, min, max, swing: Math.round((max - min) * 100000) / 100000, relativeSwingPct: Math.round(((max - min) / Math.max(max, 0.0001)) * 1000) / 10 }
  // count how many times the direction of luminance change reverses (a proxy for flashes/s)
  let rev = 0
  for (let i = 2; i < lum.length; i++) if (Math.sign(lum[i] - lum[i - 1]) !== Math.sign(lum[i - 1] - lum[i - 2])) rev++
  out.flash.directionReversals = rev
  await ctx.close()
}

// ── 3. no-preference: is reveal content reachable without scrolling tricks? ──
{
  const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: 'desktop' })
  await page.waitForFunction(() => document.fonts.status === 'loaded')
  const before = await page.evaluate(() => ({ hidden: [...document.querySelectorAll('[data-reveal]')].filter((n) => Number(getComputedStyle(n).opacity) < 0.9).length, total: document.querySelectorAll('[data-reveal]').length }))
  // scroll to the bottom naturally, then check nothing is left invisible
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) }
  })
  await page.waitForFunction(() => true)
  const after = await page.evaluate(() => ({ hidden: [...document.querySelectorAll('[data-reveal]')].filter((n) => Number(getComputedStyle(n).opacity) < 0.9).length, total: document.querySelectorAll('[data-reveal]').length, list: [...document.querySelectorAll('[data-reveal]')].filter((n) => Number(getComputedStyle(n).opacity) < 0.9).map((n) => n.className.split(' ')[0]) }))
  out.revealNoPref = { before, after }
  await ctx.close()
}
await browser.close()
saveJSON('motion-raw.json', out)
console.log(JSON.stringify(out, null, 1))
