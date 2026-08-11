// BLOCK 2d — (i) how long is the page unreadable while the motion bundle is broken,
//            (ii) exact shape of the late-gsap flicker.
// Technique: fault injection + timing measurement.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info } from './lib.mjs'

// (i) blank window: abort the Base chunk entirely, scroll down at t~800ms, screenshot
{
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.route('**/_astro/Base.astro_*.js', (r) => r.abort('failed'))
  const t0 = Date.now()
  await page.goto(BASE, { waitUntil: 'commit' })
  await page.waitForSelector('#hizmetler', { state: 'attached' })
  await page.evaluate(() => document.getElementById('hizmetler').scrollIntoView({ block: 'start' }))
  // Wait until well inside the pre-failsafe window but after CSS applied
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.topbar')).position === 'sticky')
  const at = Date.now() - t0
  const snap = await page.evaluate(() => {
    const sec = document.getElementById('hizmetler')
    const rv = [...sec.querySelectorAll('[data-reveal]')]
    return {
      visibleText: [...sec.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim() && Number(getComputedStyle(e.closest('[data-reveal]') || e).opacity) > 0.5).length,
      reveals: rv.length,
      hiddenReveals: rv.filter((e) => Number(getComputedStyle(e).opacity) < 0.5).length,
    }
  })
  await page.screenshot({ path: `${DIR}/b2d-blank-window-at-${at}ms.png` })
  console.log('\n===== (i) unreadable window, Base chunk aborted =====')
  info(`screenshot taken at t=${at}ms -> ${DIR}/b2d-blank-window-at-${at}ms.png`)
  info(`#hizmetler: ${snap.hiddenReveals}/${snap.reveals} reveal blocks invisible, ${snap.visibleText} leaf text nodes still visible`)
  // now measure exactly when it becomes readable
  const rd = await page.evaluate(() => new Promise((res) => {
    const t = performance.now()
    const iv = setInterval(() => {
      const rv = [...document.querySelectorAll('#hizmetler [data-reveal]')]
      if (rv.every((e) => Number(getComputedStyle(e).opacity) > 0.9)) { clearInterval(iv); res(Math.round(performance.now() - t)) }
      if (performance.now() - t > 8000) { clearInterval(iv); res(-1) }
    }, 40)
  }))
  info(`became readable ${rd}ms after this probe started (i.e. ~${at + rd}ms after navigation start)`)
  await page.screenshot({ path: `${DIR}/b2d-after-failsafe.png` })
  ok(rd > 0, 'failsafe eventually rescues the section', `${rd}ms`)
  await b.close()
}

// (ii) flicker shape when gsap lands after the failsafe, user already reading #kontakt
{
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.route('**/_astro/{gsap,ScrollTrigger}.*.js', async (r) => { await new Promise((s) => setTimeout(s, 6000)); await r.continue() })
  await page.goto(BASE, { waitUntil: 'commit' })
  await page.waitForSelector('#kontakt')
  await page.evaluate(() => document.getElementById('kontakt').scrollIntoView({ block: 'start' }))
  // wait for the failsafe to make it readable
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('#kontakt [data-reveal]')).opacity) > 0.9, null, { timeout: 6000 })
  // high-resolution sampling inside the page (rAF) across the gsap arrival
  const trace = await page.evaluate(() => new Promise((res) => {
    const el = document.querySelector('#kontakt [data-reveal]')
    const out = []
    const t0 = performance.now()
    const tick = () => {
      out.push([Math.round(performance.now() - t0), Number(getComputedStyle(el).opacity)])
      if (performance.now() - t0 < 6000) requestAnimationFrame(tick); else res(out)
    }
    tick()
  }))
  const dips = trace.filter(([, o]) => o < 0.9)
  console.log('\n===== (ii) late-gsap flicker on #kontakt =====')
  if (dips.length) {
    const min = Math.min(...dips.map(([, o]) => o))
    info(`flicker: starts +${dips[0][0]}ms, ends +${dips[dips.length - 1][0]}ms  => duration ${dips[dips.length - 1][0] - dips[0][0]}ms, min opacity ${min}`)
    // screenshot at the darkest point of the next occurrence is impractical; capture opacity trace instead
    info('opacity trace around dip: ' + trace.filter(([t]) => t >= dips[0][0] - 120 && t <= dips[dips.length - 1][0] + 200).filter((_, i) => i % 3 === 0).map(([t, o]) => `${t}:${o.toFixed(2)}`).join(' '))
  } else info('no dip observed')
  ok(dips.length === 0, 'no opacity dip on already-visible content when gsap lands late', dips.length ? `${dips.length} frames below 0.9` : '')
  await b.close()
}
