// BLOCK 11 — (a) WebGL unavailable (old device / GPU blocklist)
//            (b) rigorous timeline of the Fast-3G reveal dip
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info, poll } from './lib.mjs'

const b = await chromium.launch()

// ---------- (a) WebGL unavailable ----------
for (const run of [1, 2]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.addInitScript(() => {
    window.__rej = []
    addEventListener('unhandledrejection', (e) => window.__rej.push(String((e.reason && e.reason.message) || e.reason)))
    const orig = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (t, ...rest) {
      if (typeof t === 'string' && /webgl/i.test(t)) return null
      return orig.call(this, t, ...rest)
    }
  })
  await page.goto(BASE, { waitUntil: 'load' })
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
  await page.waitForTimeout(4000)
  const r = await page.evaluate(() => ({
    rej: window.__rej,
    stageH: Math.round(document.getElementById('expStage').getBoundingClientRect().height),
    legendOn: document.querySelectorAll('#expLegend li.on').length,
    legendOpacity: getComputedStyle(document.querySelector('#expLegend li')).opacity,
    heroFrostOn: document.getElementById('frost')?.classList.contains('on'),
    scrollW: document.documentElement.scrollWidth, innerW: innerWidth,
    revealsHidden: [...document.querySelectorAll('[data-reveal]')].filter((e) => Number(getComputedStyle(e).opacity) < 0.9).length,
  }))
  if (run === 1) {
    console.log('\n===== 11a WebGL unavailable (getContext("webgl*") -> null) =====')
    info(JSON.stringify(r))
    info(`pageerror: ${JSON.stringify(errs)}`)
    await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
    await page.screenshot({ path: `${DIR}/b11a-no-webgl.png` })
  }
  ok(r.rej.length === 0 && errs.length === 0, `11a run${run}: no unhandled rejection when WebGL is unavailable`, `${JSON.stringify([...r.rej, ...errs]).slice(0, 200)}`)
  if (run === 1) {
    ok(r.stageH > 200, '11a: exploded stage keeps its height', `${r.stageH}px`)
    ok(r.scrollW <= r.innerW + 1, '11a: no horizontal overflow')
    ok(Number(r.legendOpacity) === 1 || r.legendOn > 0, '11a: legend text is legible (not stuck at 0.45 opacity)', `on=${r.legendOn}/5 opacity=${r.legendOpacity}`)
    ok(r.heroFrostOn === true, '11a: hero frost canvas (2d) unaffected by missing WebGL', `frost.on=${r.heroFrostOn}`)
  }
  await b.close && 0
  await ctx.close()
}

// ---------- (b) rigorous Fast-3G reveal timeline ----------
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', { offline: false, connectionType: 'cellular3g', latency: 562, downloadThroughput: (1600 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
  const marks = []
  const t0 = Date.now()
  page.on('response', (r) => { const m = /_astro\/(gsap|ScrollTrigger)\./.exec(r.url()); if (m) marks.push([m[1], Date.now() - t0]) })
  await page.goto(BASE, { waitUntil: 'commit' })
  // phase 1: wait until html.motion is set AND #hizmetler reveals are hidden by CSS
  const p1 = await poll(async () => await page.evaluate(() => document.documentElement.classList.contains('motion') && [...document.querySelectorAll('#hizmetler [data-reveal]')].some((e) => Number(getComputedStyle(e).opacity) < 0.5)), { timeout: 40000, interval: 40 })
  const tHidden = Date.now() - t0
  await page.evaluate(() => document.getElementById('hizmetler')?.scrollIntoView())
  await page.screenshot({ path: `${DIR}/b11b-fast3g-1-blank.png` })
  // phase 2: failsafe fires
  const p2 = await poll(async () => await page.evaluate(() => !document.documentElement.classList.contains('motion') && [...document.querySelectorAll('#hizmetler [data-reveal]')].every((e) => Number(getComputedStyle(e).opacity) > 0.9)), { timeout: 30000, interval: 40 })
  const tRevealed = Date.now() - t0
  await page.screenshot({ path: `${DIR}/b11b-fast3g-2-revealed.png` })
  // phase 3: dip when gsap lands
  let shot = false, minOp = 1
  const p3 = await poll(async () => {
    const v = await page.evaluate(() => Math.min(...[...document.querySelectorAll('#hizmetler [data-reveal]')].map((e) => Number(getComputedStyle(e).opacity))))
    minOp = Math.min(minOp, v)
    if (v < 0.5 && !shot) { shot = true; await page.screenshot({ path: `${DIR}/b11b-fast3g-3-dip.png` }) }
    return v < 0.5
  }, { timeout: 25000, interval: 40 })
  const tDip = Date.now() - t0
  const p4 = p3.ok ? await poll(async () => await page.evaluate(() => [...document.querySelectorAll('#hizmetler [data-reveal]')].every((e) => Number(getComputedStyle(e).opacity) > 0.9)), { timeout: 15000, interval: 40 }) : { ok: false, ms: 0 }
  console.log('\n===== 11b Fast-3G reveal timeline (390x844) =====')
  info(`chunk arrivals: ${JSON.stringify(marks)}`)
  info(`t=${tHidden}ms  html.motion set, #hizmetler hidden by CSS   -> b11b-fast3g-1-blank.png`)
  info(`t=${tRevealed}ms  2500 ms failsafe fired, section readable    -> b11b-fast3g-2-revealed.png`)
  info(p3.ok ? `t=${tDip}ms  gsap landed, section faded back out (min opacity ${minOp})  -> b11b-fast3g-3-dip.png` : 'no dip observed')
  info(p3.ok ? `recovered ${p4.ms}ms later (total visible glitch ~${p4.ms}ms)` : '')
  ok(!p3.ok, '11b: no fade-out of already-revealed content on real Fast 3G', p3.ok ? `dip at t=${tDip}ms, min opacity ${minOp}, recovered after ${p4.ms}ms` : '')
  await ctx.close()
}

await b.close()
