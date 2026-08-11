// Evidence probe: what a mobile visitor loses when leaving the home page.
import { browser, newPage, BASE, DIR } from './lib.mjs'
const b = await browser()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await newPage(ctx)
for (const [label, url] of [['home', BASE + '/de/'], ['legal', BASE + '/de/kvkk']]) {
  await page.goto(url, { waitUntil: 'networkidle' })
  const inv = await page.evaluate(() => ({
    mobar: !!document.querySelector('.mobar'),
    chatfab: !!document.querySelector('#chatfab'),
    footer: !!document.querySelector('footer.foot'),
    telLinks: document.querySelectorAll('a[href^="tel:"]').length,
    waLinks: document.querySelectorAll('a[href*="wa.me"]').length,
    legalLinks: document.querySelectorAll('a[href*="cerez"], a[href*="gizlilik"], a[href*="kvkk"]').length,
  }))
  console.log(label.padEnd(6), JSON.stringify(inv))
  await page.screenshot({ path: `${DIR}/mobile-${label}-de.png`, fullPage: false })
}
await ctx.close(); await b.close()
