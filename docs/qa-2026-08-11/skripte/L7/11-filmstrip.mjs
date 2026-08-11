/** L7-11 — filmstrip evidence: mobile 390x844 DPR2, Fast 3G, CPU 4x. */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const DIR = path.dirname(fileURLToPath(import.meta.url))
const FAST3G = { offline: false, latency: 562.5, downloadThroughput: 184320, uploadThroughput: 84375 }
const SLOW3G = { offline: false, latency: 2000, downloadThroughput: 51200, uploadThroughput: 51200 }
const browser = await chromium.launch()

for (const [tag, net, offs] of [
  ['fast3g', FAST3G, [1000, 1900, 2400, 3000, 4400, 5500]],
  ['slow3g', SLOW3G, [3000, 5400, 8000, 12000, 17000, 21000]],
]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.clearBrowserCache')
  await cdp.send('Network.emulateNetworkConditions', net)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const nav = page.goto('http://localhost:4321/', { waitUntil: 'load', timeout: 240000 })
  const t0 = Date.now()
  for (const at of offs) {
    const w = at - (Date.now() - t0)
    if (w > 0) await new Promise((r) => setTimeout(r, w))
    const p = path.join(DIR, `film-${tag}-${at}ms.png`)
    try { await page.screenshot({ path: p }); console.log('wrote', p) } catch (e) { console.log('FAILED', p, String(e).slice(0, 120)) }
  }
  await nav
  await ctx.close()
}
// one shot of the 3D section at rest for evidence
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto('http://localhost:4321/', { waitUntil: 'load' })
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView({ block: 'center' }))
  await page.waitForFunction(() => { const c = document.getElementById('expCanvas'); return c && c.width > 0 }, null, { timeout: 30000 })
  await page.waitForFunction(() => document.querySelectorAll('#expLegend li.on').length > 0, null, { timeout: 20000 }).catch(() => {})
  const p = path.join(DIR, 'teknik-3d.png')
  await page.screenshot({ path: p })
  console.log('wrote', p)
  await ctx.close()
}
await browser.close()
