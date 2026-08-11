// BLOCK 9 — prefers-reduced-motion: reduce. Both an accessibility contract and a failure mode
// (the reveal system must not be load-bearing). Technique: contract testing + CLS measurement.
import { chromium } from './pw.mjs'
import { BASE, DIR, LOCALES, ok, info } from './lib.mjs'

const b = await chromium.launch()

for (const L of LOCALES) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text()) })
  await page.addInitScript(() => {
    window.__cls = 0; window.__shifts = []
    window.__buckets = {}
    const orig = window.requestAnimationFrame
    window.requestAnimationFrame = function (cb) {
      let k = 'inline(FrostHero)'
      try { const st = new Error().stack || ''; const m = st.match(/_astro\/([A-Za-z0-9._-]+)\.js/g); if (m) k = [...new Set(m.map((x) => x.replace('_astro/', '').replace(/\.[A-Za-z0-9_-]{8}\.js$/, '')))].join('+') } catch {}
      window.__buckets[k] = (window.__buckets[k] || 0) + 1
      return orig.call(window, cb)
    }
    window.__reset = () => { window.__buckets = {} }
    try {
      new PerformanceObserver((l) => l.getEntries().forEach((e) => {
        if (!e.hadRecentInput) { window.__cls += e.value; if (e.value > 0.001) window.__shifts.push(Number(e.value.toFixed(4))) }
      })).observe({ type: 'layout-shift', buffered: true })
    } catch {}
  })
  await page.goto(BASE.replace(/\/$/, '') + (L.code === 'tr' ? '/' : `/${L.code}/`), { waitUntil: 'commit' })
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.topbar')).position === 'sticky')

  // 1) content visible IMMEDIATELY, sampled continuously for 3.5 s
  const trace = await page.evaluate(() => new Promise((res) => {
    const out = []; const t0 = performance.now()
    const tick = () => {
      const rv = [...document.querySelectorAll('[data-reveal]')]
      out.push([Math.round(performance.now() - t0), rv.filter((e) => Number(getComputedStyle(e).opacity) < 0.9).length, rv.length, document.documentElement.classList.contains('motion') ? 1 : 0])
      if (performance.now() - t0 < 3500) setTimeout(tick, 100); else res(out)
    }
    tick()
  }))
  const everHidden = trace.filter((r) => r[1] > 0)
  const everMotion = trace.filter((r) => r[3] === 1)

  console.log(`\n===== 9 reduced-motion ${L.code.toUpperCase()} =====`)
  ok(everHidden.length === 0, `9 ${L.code}: no [data-reveal] element is EVER hidden`, everHidden.length ? `first at t=${everHidden[0][0]}ms (${everHidden[0][1]}/${everHidden[0][2]})` : `${trace[0][2]} elements, all visible from t=${trace[0][0]}ms`)
  ok(everMotion.length === 0, `9 ${L.code}: html.motion is never set`, everMotion.length ? `set at t=${everMotion[0][0]}ms` : '')

  // 2) counters resolved to their final value, not frozen mid-count
  const counters = await page.evaluate(() => [...document.querySelectorAll('[data-count]')].map((e) => ({ target: e.dataset.count, shown: e.textContent.trim(), dec: e.dataset.countDecimals || '0' })))
  const badCounters = counters.filter((c) => {
    const n = Number(String(c.shown).replace(/[^\d.,]/g, '').replace(',', '.'))
    return !Number.isFinite(n) || Math.abs(n - Number(c.target)) > 0.051
  })
  ok(badCounters.length === 0, `9 ${L.code}: every data-count shows its final value`, JSON.stringify(counters))

  if (L.code === 'tr') {
    // 3) exploded unit: static frame, no loop
    await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
    await page.waitForFunction(() => { const c = document.getElementById('expCanvas'); return c && c.width > 200 }, null, { timeout: 20000 })
    await page.waitForTimeout(500)
    await page.evaluate(() => window.__reset())
    await page.waitForTimeout(2000)
    const bk = await page.evaluate(() => window.__buckets)
    const three = Object.entries(bk).find(([k]) => /ExplodedUnit/.test(k))
    const frost = Object.entries(bk).find(([k]) => /inline/.test(k))
    info(`rAF/2s while at #teknik with reduced motion: ${JSON.stringify(bk)}`)
    ok(!three || three[1] <= 2, `9: exploded unit renders a STATIC frame (no rAF loop)`, `${three ? three[0] + '=' + three[1] : 'no rAF at all'}`)
    ok(!frost || frost[1] <= 2, `9: hero frost canvas renders a STATIC frame (no rAF loop)`, `${frost ? frost[0] + '=' + frost[1] : 'no rAF at all'}`)
    const legend = await page.evaluate(() => ({
      on: document.querySelectorAll('#expLegend li.on').length,
      total: document.querySelectorAll('#expLegend li').length,
      op: getComputedStyle(document.querySelector('#expLegend li')).opacity,
      canvasPainted: (() => { const c = document.getElementById('expCanvas'); const g = c.getContext('webgl2') || c.getContext('webgl'); return !!g })(),
    }))
    ok(Number(legend.op) === 1, `9: legend items are fully opaque with reduced motion (CSS override)`, JSON.stringify(legend))
    await page.screenshot({ path: `${DIR}/b9-reduced-teknik.png` })

    // 4) hero: CSS animations off, content present
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(600)
    const hero = await page.evaluate(() => {
      const q = (s) => { const e = document.querySelector(s); return e ? { op: getComputedStyle(e).opacity, anim: getComputedStyle(e).animationName, tr: getComputedStyle(e).transform } : null }
      return { ln: q('.build .ln>span'), cta: q('.cta'), phones: q('.phones'), rule: q('.hrule'), frostOp: q('#frost')?.op, photo: q('.hero-photo') }
    })
    info(`hero with reduced motion: ${JSON.stringify(hero)}`)
    ok(Number(hero.ln.op) === 1 && Number(hero.cta.op) === 1 && Number(hero.phones.op) === 1, `9: hero headline / CTA / phone numbers visible with no animation`, JSON.stringify(hero))
    await page.screenshot({ path: `${DIR}/b9-reduced-hero.png` })

    // 5) CLS after a full page sweep
    for (let i = 0; i < 3; i++) { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(500); await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500) }
    const cls = await page.evaluate(() => ({ cls: Number(window.__cls.toFixed(4)), shifts: window.__shifts.slice(0, 12) }))
    info(`layout shift after 3 full sweeps: ${JSON.stringify(cls)}`)
    ok(cls.cls < 0.1, `9: cumulative layout shift stays under 0.1 with reduced motion`, `CLS=${cls.cls} shifts=${JSON.stringify(cls.shifts)}`)

    // 6) mid-session switch: reduce -> no-preference (does content stay visible?)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.waitForTimeout(1200)
    const afterSwitch = await page.evaluate(() => {
      const rv = [...document.querySelectorAll('[data-reveal]')]
      return { hidden: rv.filter((e) => Number(getComputedStyle(e).opacity) < 0.9).length, total: rv.length, motion: document.documentElement.classList.contains('motion') }
    })
    ok(afterSwitch.hidden === 0, `9: switching reduced-motion OFF mid-visit does not hide content`, JSON.stringify(afterSwitch))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForTimeout(800)
    const backAgain = await page.evaluate(() => {
      const rv = [...document.querySelectorAll('[data-reveal]')]
      return { hidden: rv.filter((e) => Number(getComputedStyle(e).opacity) < 0.9).length, total: rv.length, inlineOp0: rv.filter((e) => e.style.opacity === '0').length }
    })
    ok(backAgain.hidden === 0, `9: switching reduced-motion back ON re-shows everything (showAll clears GSAP inline styles)`, JSON.stringify(backAgain))
  }
  ok(errs.filter((e) => !/api\/chat|404/.test(e)).length === 0, `9 ${L.code}: no JS errors with reduced motion`, [...new Set(errs)].join(' | '))
  await ctx.close()
}

// ---- listener-leak scaling check (is the delta=13 seen in 8a proportional to iterations?) ----
{
  for (const n of [10, 60]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.addInitScript(() => {
      window.__l = 0
      const a = EventTarget.prototype.addEventListener, r = EventTarget.prototype.removeEventListener
      EventTarget.prototype.addEventListener = function (...x) { window.__l++; return a.apply(this, x) }
      EventTarget.prototype.removeEventListener = function (...x) { window.__l--; return r.apply(this, x) }
    })
    await page.goto(BASE, { waitUntil: 'load' })
    await page.waitForTimeout(2500) // let gsap/frost finish attaching
    const before = await page.evaluate(() => window.__l)
    for (let i = 0; i < n; i++) {
      await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
      await page.click('#cclose'); await page.waitForSelector('#chatpanel[hidden]', { state: 'attached' })
    }
    const after = await page.evaluate(() => window.__l)
    console.log(`\n===== listener scaling: ${n} chat open/close cycles =====`)
    info(`listeners ${before} -> ${after} (delta ${after - before})`)
    ok(after - before <= 2, `${n} cycles add no listeners (leak would scale with n)`, `delta=${after - before}`)
    await ctx.close()
  }
}

await b.close()
