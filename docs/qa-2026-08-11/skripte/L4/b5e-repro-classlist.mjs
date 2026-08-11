// BLOCK 5e — replicate the EXACT b5c sequence (theme-toggle poll loop during a Slow 3G load)
// to decide: real defect or flake? 3 runs.
import { chromium } from './pw.mjs'
import { BASE, ok, info, poll } from './lib.mjs'

const prof = { offline: false, connectionType: 'cellular3g', latency: 2000, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 }

for (const run of [1, 2, 3]) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push({ m: e.message, s: (e.stack || '').split('\n').slice(0, 5).join(' >> ') }))
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', prof)
  const t0 = Date.now()
  await page.goto(BASE, { waitUntil: 'commit' })
  await page.waitForSelector('#hizmetler', { state: 'attached', timeout: 90000 })
  // the exact poll: hammer the theme toggle every 300ms until it takes effect
  let clicks = 0
  const themeAt = await poll(async () => {
    try { await page.click('#themetog', { timeout: 400 }); clicks++; return await page.evaluate(() => document.documentElement.dataset.theme === 'light') } catch { return false }
  }, { timeout: 90000, interval: 300 })
  await page.click('#themetog').catch(() => {})
  await page.evaluate(() => document.getElementById('hizmetler').scrollIntoView())
  await poll(async () => await page.evaluate(() => [...document.querySelectorAll('#hizmetler [data-reveal]')].every((e) => Number(getComputedStyle(e).opacity) > 0.9)), { timeout: 60000, interval: 150 })
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
  await page.waitForTimeout(8000)
  await page.evaluate(() => document.getElementById('kontakt').scrollIntoView())
  await page.waitForTimeout(3000)
  console.log(`\n===== 5e run ${run} (theme clicks during load: ${clicks}, theme took at ${themeAt.ms}ms) =====`)
  info(`pageerrors: ${JSON.stringify(errs)}`)
  ok(errs.filter((e) => !/three\.module/.test(e.m)).length === 0, `run ${run}: no JS error (excluding known three.js reject)`, JSON.stringify(errs).slice(0, 400))
  await b.close()
}
