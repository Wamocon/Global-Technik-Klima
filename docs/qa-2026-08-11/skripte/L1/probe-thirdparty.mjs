// Root-cause probe: which frame requests third-party hosts?
import { browser, newPage, goHome, LOCALES } from './lib.mjs'
const b = await browser()
for (const loc of LOCALES) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const third = []
  page.on('request', (r) => {
    const u = new URL(r.url())
    if (u.hostname !== 'localhost') third.push({ host: u.hostname, frame: r.frame() === page.mainFrame() ? 'MAIN' : 'iframe:' + (r.frame().url().slice(0, 60)) })
  })
  await goHome(page, loc)
  await page.locator('#kontakt').scrollIntoViewIfNeeded()
  await page.waitForLoadState('networkidle').catch(() => {})
  const byHost = {}
  for (const t of third) { const k = t.host + ' <- ' + t.frame; byHost[k] = (byHost[k] || 0) + 1 }
  console.log(`[${loc}]`, JSON.stringify(byHost, null, 1))
  await ctx.close()
}
await b.close()
