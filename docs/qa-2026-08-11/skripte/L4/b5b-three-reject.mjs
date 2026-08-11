// BLOCK 5b — (i) unhandled rejection when the three.js chunk cannot be fetched
//            (ii) re-test the "offline exactly during the chat fetch" case correctly
// Technique: fault injection on a lazily-imported chunk; negative-path.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info, poll } from './lib.mjs'

// ---------- (i) three.js chunk unreachable ----------
for (const [mode, handler] of [['abort', (r) => r.abort('failed')], ['404', (r) => r.fulfill({ status: 404, body: 'nope' })], ['500', (r) => r.fulfill({ status: 500, body: 'err' })]]) {
  for (const run of [1, 2]) {
    const b = await chromium.launch()
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const pageErrs = [], unhandled = []
    page.on('pageerror', (e) => pageErrs.push(e.message))
    await page.addInitScript(() => {
      window.__unhandled = []
      addEventListener('unhandledrejection', (e) => window.__unhandled.push(String(e.reason && e.reason.message || e.reason)))
    })
    await page.route('**/_astro/three.module.*.js', handler)
    await page.goto(BASE, { waitUntil: 'load' })
    await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
    await poll(async () => (await page.evaluate(() => window.__unhandled.length)) > 0, { timeout: 6000 })
    const u = await page.evaluate(() => window.__unhandled)
    const geo = await page.evaluate(() => {
      const st = document.getElementById('expStage').getBoundingClientRect()
      const cv = document.getElementById('expCanvas')
      return {
        stageH: Math.round(st.height), stageW: Math.round(st.width),
        canvasW: cv.width, canvasH: cv.height,
        hintVisible: getComputedStyle(document.querySelector('.exp-hint')).opacity,
        legendOn: document.querySelectorAll('#expLegend li.on').length,
        legendTotal: document.querySelectorAll('#expLegend li').length,
        legendOpacity: getComputedStyle(document.querySelector('#expLegend li')).opacity,
        scrollW: document.documentElement.scrollWidth, innerW: innerWidth,
      }
    })
    if (run === 1) {
      console.log(`\n===== (i) three.js chunk = ${mode} =====`)
      info(`unhandledrejection: ${JSON.stringify(u)}`)
      info(`pageerror: ${JSON.stringify(pageErrs)}`)
      info(`geometry: ${JSON.stringify(geo)}`)
      await page.screenshot({ path: `${DIR}/b5b-three-${mode}.png` })
    }
    ok(u.length === 0 && pageErrs.length === 0, `three.js ${mode} (run ${run}): no unhandled rejection / page error`, `unhandled=${u.length} pageerror=${pageErrs.length} :: ${(u[0] || pageErrs[0] || '').slice(0, 90)}`)
    if (run === 1) {
      ok(geo.stageH > 200, `three.js ${mode}: stage keeps its height (no collapse)`, `${geo.stageW}x${geo.stageH}`)
      ok(geo.legendTotal === 5 && Number(geo.legendOpacity) > 0, `three.js ${mode}: legend text still readable`, `total=${geo.legendTotal} on=${geo.legendOn} opacity=${geo.legendOpacity}`)
      ok(geo.scrollW <= geo.innerW + 1, `three.js ${mode}: no horizontal overflow`)
    }
    await b.close()
  }
}

// ---------- (ii) offline exactly during the chat fetch ----------
for (const run of [1, 2]) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  const before = await page.evaluate(() => document.querySelectorAll('#cbody .msg.me').length)
  await ctx.setOffline(true)
  await page.fill('#cin', 'baglanti kopukken gonderildi'); await page.press('#cin', 'Enter')
  await ctx.setOffline(false)
  const r = await poll(async () => await page.evaluate((n) => document.querySelectorAll('#cbody .msg.typing').length === 0 && document.querySelectorAll('#cbody .msg.me').length === n + 1 && document.querySelectorAll('#cbody .msg.bot:not(.typing)').length >= 2, before), { timeout: 8000 })
  const s = await page.evaluate(() => ({ me: document.querySelectorAll('#cbody .msg.me').length, bots: document.querySelectorAll('#cbody .msg.bot:not(.typing)').length, typing: document.querySelectorAll('#cbody .msg.typing').length }))
  ok(r.ok, `(ii) run ${run}: message sent during a connection drop is answered`, `${r.ms}ms ${JSON.stringify(s)}`)
  await b.close()
}
