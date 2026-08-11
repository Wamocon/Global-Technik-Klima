import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
const BASE = 'http://localhost:4321'
const browser = await chromium.launch()

// F. request-body size actually sent to /api/chat (chat input has no maxlength)
{
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  const sizes = []
  await page.route('**/api/chat', (route) => {
    sizes.push((route.request().postData() || '').length)
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: 'ok' }) })
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  await page.evaluate(() => { document.getElementById('cin').value = 'x'.repeat(1_000_000) })
  await page.evaluate(() => document.getElementById('cform').requestSubmit())
  await page.waitForFunction(() => !document.querySelector('#cbody .msg.typing'), null, { timeout: 15000 })
  console.log(`F: client POSTed ${sizes[0]} bytes for a 1,000,000-char message (server slices to 800 AFTER receiving it)`)
  await ctx.close()
}

// G. does the lazy map fire without any scroll on a tall viewport / mobile?
for (const vp of [{ width: 1280, height: 800, n: 'desktop-800' },
                  { width: 1280, height: 2400, n: 'tall-2400' },
                  { width: 390, height: 844, n: 'mobile-390x844' }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
  const page = await ctx.newPage()
  const g = []
  page.on('request', (r) => { if (/google|gstatic/.test(r.url())) g.push(r.url()) })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  const noScroll = g.length
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1500)
  console.log(`G ${vp.n}: googleRequests without scrolling = ${noScroll}; after scrolling to the end = ${g.length}`)
  await ctx.close()
}

// H. is the Angebot page's price/offer content reachable and unauth'd? (headers)
{
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  const r = await page.goto(BASE + '/angebot/Global%20Technik%20Klima%20Bestellung.html', { waitUntil: 'domcontentloaded' })
  const meta = await page.evaluate(() => ({
    robots: document.querySelector('meta[name=robots]')?.content,
    title: document.title,
    dollarHits: (document.body.innerText.match(/\$/g) || []).length,
    rowCount: document.querySelectorAll('tr').length,
  }))
  console.log(`H: status=${r.status()} x-robots-tag=${r.headers()['x-robots-tag'] ?? 'ABSENT'} metaRobots=${meta.robots} title=${JSON.stringify(meta.title)} "$"-occurrences=${meta.dollarHits} tableRows=${meta.rowCount}`)
  await ctx.close()
}

await browser.close(); process.exit(0)
