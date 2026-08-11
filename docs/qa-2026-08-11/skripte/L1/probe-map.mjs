import { browser, goHome } from './lib.mjs'
const b = await browser()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const third = []
page.on('request', (r) => { const h = new URL(r.url()).hostname; if (h !== 'localhost') third.push([h, r.frame() === page.mainFrame() ? 'MAIN' : 'IFRAME']) })
await goHome(page, 'tr')
console.log('iframes in DOM:', await page.locator('.cmap iframe').count())
console.log('iframe src:', (await page.locator('.cmap iframe').getAttribute('src') || '').slice(0, 70))
await page.locator('.cmap').scrollIntoViewIfNeeded()
await page.waitForTimeout(6000) // deliberate settle: give the lazy iframe a real chance to start
console.log('frames:', page.frames().length, page.frames().map(f => f.url().slice(0, 60)))
const agg = {}
for (const [h, f] of third) agg[h + '|' + f] = (agg[h + '|' + f] || 0) + 1
console.log('third-party:', JSON.stringify(agg, null, 1))
await ctx.close(); await b.close()
