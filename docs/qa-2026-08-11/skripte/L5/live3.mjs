// L5 — does the Google map really load without consent? Scroll, no click.
// Plus: storage after the theme toggle (the only functional write).
import { chromium } from 'file:///D:/01%20Antigrafity%20Projekte/25%20Global-Technik-Klima/node_modules/playwright/index.mjs'

const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L5'
const PATHS = { tr: '/', ru: '/ru', de: '/de', en: '/en' }

const browser = await chromium.launch()
for (const pass of [1, 2]) {
  console.log(`\n########## PASS ${pass} ##########`)
  for (const [loc, p] of Object.entries(PATHS)) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    const hosts = []
    page.on('request', (r) => {
      const h = new URL(r.url()).host
      if (!/^localhost/.test(h)) hosts.push(h)
    })
    await page.goto(BASE + p, { waitUntil: 'networkidle' })
    const beforeScroll = [...new Set(hosts)]
    // pure scroll, no click anywhere — this is a visitor reading the page
    await page.locator('#kontakt').scrollIntoViewIfNeeded()
    await page.waitForFunction(
      () => performance.getEntriesByType('resource').some((r) => r.name.includes('google.com')) ||
            [...document.querySelectorAll('iframe')].some((f) => f.contentWindow && f.getAttribute('src')),
      null, { timeout: 8000 }
    ).catch(() => {})
    await page.waitForLoadState('networkidle')
    const afterScroll = [...new Set(hosts)]
    const cookiesAll = await ctx.cookies()
    const gCookies = await ctx.cookies(['https://www.google.com', 'https://google.com'])
    const ls = await page.evaluate(() => Object.keys(localStorage))

    console.log(`  /${loc}`)
    console.log(`     hosts before scroll : ${beforeScroll.join(', ') || '(none)'}`)
    console.log(`     hosts after  scroll : ${afterScroll.join(', ') || '(none)'}`)
    console.log(`     google requests     : ${hosts.filter((h) => /google/.test(h)).length}`)
    console.log(`     cookies (all)       : ${cookiesAll.map((c) => c.name + '@' + c.domain).join(', ') || '(none)'}`)
    console.log(`     cookies (google)    : ${gCookies.map((c) => c.name + '@' + c.domain).join(', ') || '(none)'}`)
    console.log(`     localStorage        : ${JSON.stringify(ls)}`)

    if (pass === 1 && loc === 'de') {
      await page.screenshot({ path: `${DIR}/map-loads-without-consent-de.png` })
      // now the theme toggle — the only functional storage write
      await page.locator('#themetog').scrollIntoViewIfNeeded()
      await page.click('#themetog')
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'light', null, { timeout: 3000 })
      const ls2 = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)))
      const ck2 = await ctx.cookies()
      console.log(`     after theme click → localStorage=${ls2}  cookies=${ck2.length}`)
    }
    await ctx.close()
  }
}
await browser.close()
