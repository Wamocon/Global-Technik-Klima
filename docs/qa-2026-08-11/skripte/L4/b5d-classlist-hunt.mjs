// BLOCK 5d — hunt the "Cannot read properties of null (reading 'classList')" seen under Slow 3G.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info } from './lib.mjs'

const prof = { offline: false, connectionType: 'cellular3g', latency: 2000, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 }

for (const run of [1, 2, 3]) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  const caught = []
  page.on('pageerror', (e) => caught.push({ msg: e.message, stack: (e.stack || '').split('\n').slice(0, 6).join(' >> ') }))
  await page.addInitScript(() => {
    window.__err = []
    addEventListener('error', (e) => window.__err.push({ m: String(e.message), src: e.filename, l: e.lineno, c: e.colno, stack: e.error && e.error.stack ? String(e.error.stack).split('\n').slice(0, 5).join(' >> ') : '' }), true)
    addEventListener('unhandledrejection', (e) => window.__err.push({ m: 'REJECT ' + String(e.reason && e.reason.message || e.reason), stack: e.reason && e.reason.stack ? String(e.reason.stack).split('\n').slice(0, 5).join(' >> ') : '' }))
  })
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', prof)
  await page.goto(BASE, { waitUntil: 'commit' })
  await page.waitForSelector('#teknik', { state: 'attached', timeout: 120000 })
  // exercise the things that run late: scroll, resize, theme
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
  await page.setViewportSize({ width: 900, height: 800 })
  await page.waitForTimeout(2000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => document.getElementById('kontakt').scrollIntoView())
  await page.waitForTimeout(4000)
  const inPage = await page.evaluate(() => window.__err)
  console.log(`\n===== 5d Slow 3G run ${run} =====`)
  info(`pageerror: ${JSON.stringify(caught)}`)
  info(`in-page listeners: ${JSON.stringify(inPage)}`)
  ok(caught.length === 0 && inPage.filter((e) => !/three\.module/.test(e.m)).length === 0, `run ${run}: no JS error under Slow 3G (excluding the known three.js reject)`, JSON.stringify([...caught, ...inPage]).slice(0, 400))
  await b.close()
}
