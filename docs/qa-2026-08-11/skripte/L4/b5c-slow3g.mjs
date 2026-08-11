// BLOCK 5c — CDP network throttling. Technique: fault injection (bandwidth), timing measurement.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info, poll } from './lib.mjs'

const PROFILES = {
  'Slow 3G': { latency: 2000, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 },
  'Fast 3G': { latency: 562, downloadThroughput: (1600 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
}

for (const [name, prof] of Object.entries(PROFILES)) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  const errs = [], unhandled = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.addInitScript(() => {
    window.__marks = []; window.__lt = []
    const t0 = performance.now()
    addEventListener('load', () => window.__marks.push(['load', Math.round(performance.now() - t0)]))
    const io = new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (e.duration > 100) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]) }))
    try { io.observe({ entryTypes: ['longtask'] }) } catch {}
    const iv = setInterval(() => {
      if (!document.documentElement.classList.contains('motion') && !window.__nm) { window.__nm = 1; window.__marks.push(['motion-off', Math.round(performance.now() - t0)]) }
    }, 25)
    setTimeout(() => clearInterval(iv), 120000)
  })
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', { offline: false, connectionType: 'cellular3g', ...prof })

  const timing = {}
  page.on('response', (r) => {
    const u = r.url()
    const m = /_astro\/(gsap|ScrollTrigger|three\.module|Base\.astro|Assistant\.astro|ExplodedUnit\.astro)/.exec(u)
    if (m) timing[m[1]] = Math.round(Date.now() - t0)
  })
  const t0 = Date.now()
  await page.goto(BASE, { waitUntil: 'commit' })
  await page.waitForSelector('#hizmetler', { state: 'attached', timeout: 90000 })

  // is the page interactive/usable while assets stream in? try the theme toggle + chat as soon as they exist
  const themeAt = await poll(async () => {
    try { await page.click('#themetog', { timeout: 400 }); return await page.evaluate(() => document.documentElement.dataset.theme === 'light') } catch { return false }
  }, { timeout: 90000, interval: 300 })
  const tThemeWorks = Date.now() - t0
  await page.click('#themetog').catch(() => {}) // back to dark

  // when does content below the fold become readable?
  await page.evaluate(() => document.getElementById('hizmetler').scrollIntoView())
  const readable = await poll(async () => await page.evaluate(() => [...document.querySelectorAll('#hizmetler [data-reveal]')].every((e) => Number(getComputedStyle(e).opacity) > 0.9)), { timeout: 90000, interval: 150 })
  const tReadable = Date.now() - t0

  // scroll to the three.js section and see whether the page stays responsive
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
  const threeLoaded = await poll(async () => await page.evaluate(() => {
    const c = document.getElementById('expCanvas'); return c && c.width > 400
  }), { timeout: 120000, interval: 400 })
  const tThree = Date.now() - t0

  // does the reveal system still fire after all that?
  await page.evaluate(() => document.getElementById('kontakt').scrollIntoView())
  const revealAfter = await poll(async () => await page.evaluate(() => Number(getComputedStyle(document.querySelector('#kontakt [data-reveal]')).opacity) > 0.9), { timeout: 30000, interval: 200 })

  const marks = await page.evaluate(() => ({ marks: window.__marks, lt: window.__lt }))
  console.log(`\n===== 5c ${name} (390x844) =====`)
  info(`asset arrival (ms from nav): ${JSON.stringify(timing)}`)
  info(`page marks: ${JSON.stringify(marks.marks)}`)
  info(`long tasks >100ms: ${JSON.stringify(marks.lt)}`)
  info(`theme toggle first worked at ~${tThemeWorks}ms; #hizmetler readable at ~${tReadable}ms (${readable.ok ? 'ok' : 'TIMEOUT'})`)
  info(`three.js canvas sized at ~${threeLoaded.ok ? tThree : 'TIMEOUT'}ms`)
  ok(readable.ok, `${name}: below-the-fold content eventually readable`, `${tReadable}ms`)
  ok(revealAfter.ok, `${name}: reveal system still fires for #kontakt after the heavy chunk loaded`, `${revealAfter.ms}ms`)
  ok(errs.length === 0, `${name}: no uncaught page error`, errs.join(' | '))
  // the key question: did gsap arrive AFTER the 2500ms failsafe? -> proves DEF flicker happens for real
  const motionOff = (marks.marks.find((m) => m[0] === 'motion-off') || [])[1]
  info(`failsafe fired at ${motionOff ?? 'never'}ms; gsap chunk arrived at ${timing.gsap ?? 'n/a'}ms  => late-gsap regression ${motionOff && timing.gsap && timing.gsap > motionOff ? 'REPRODUCED under real throttling' : 'not reproduced'}`)
  await page.screenshot({ path: `${DIR}/b5c-${name.replace(/\W+/g, '')}.png` })
  await b.close()
}
