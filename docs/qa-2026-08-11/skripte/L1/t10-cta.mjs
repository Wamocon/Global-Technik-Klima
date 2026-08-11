/**
 * L1-B10 Technique: exhaustive inventory + use-case verification of the primary
 *        conversion CTAs (what a click actually does), plus fact-safety of the
 *        animated counters at rest.
 * Coverage criterion: every wa.me anchor on the home page classified by target;
 *        hero primary/secondary CTA behaviour asserted; counters asserted per locale.
 */
import { LOCALES, goHome, newPage, browser, ok, eq, summary, nbsp } from './lib.mjs'

const b = await browser()
for (const loc of LOCALES) {
  console.log(`\n--- CTAs & counters, ${loc} ---`)
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await newPage(ctx)
  await goHome(page, loc)

  // inventory of wa.me anchors by target
  const waLinks = await page.$$eval('a[href*="wa.me"]', (as) => as.map((a) => ({
    cls: a.className.split(' ').filter((c) => !c.startsWith('astro-')).join('.') || '(none)',
    target: a.getAttribute('target') || '(same tab)',
    text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 34),
  })))
  const sameTab = waLinks.filter((l) => l.target === '(same tab)')
  console.log(`      ${waLinks.length} wa.me anchors, ${sameTab.length} open in the SAME tab:`)
  sameTab.forEach((l) => console.log(`        · .${l.cls}  "${l.text}"`))
  ok(`[${loc}] every wa.me anchor opens in a new tab`, sameTab.length === 0,
    `same-tab: ${JSON.stringify(sameTab)}`)

  // hero primary CTA: what does a click do?
  const heroPrimary = page.locator('header.hero .cta a.btn-primary')
  eq(`[${loc}] hero primary CTA points at wa.me`,
    (await heroPrimary.getAttribute('href')).startsWith('https://wa.me/905330461387'), true)
  await page.route('https://wa.me/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<h1>WA STUB</h1>' }))
  const urlBefore = page.url()
  await heroPrimary.click()
  await page.waitForLoadState('domcontentloaded')
  const left = page.url() !== urlBefore
  ok(`[${loc}] hero primary CTA keeps the visitor on the site (new tab)`, !left,
    `navigated away in the same tab: ${urlBefore} -> ${page.url()}`)
  await page.unroute('https://wa.me/**')
  await goHome(page, loc)

  // hero secondary CTA scrolls to the calculator
  await page.locator('header.hero .cta a.btn:not(.btn-primary)').click()
  await page.waitForFunction(() => location.hash === '#kesif', null, { timeout: 3000 }).catch(() => {})
  eq(`[${loc}] hero secondary CTA jumps to #kesif`, await page.evaluate(() => location.hash), '#kesif')
  await page.waitForFunction(() => {
    const r = document.getElementById('kesif').getBoundingClientRect()
    return r.top > -5 && r.top < 200
  }, null, { timeout: 6000 }).catch(() => {})
  const t = await page.locator('#kesif').evaluate((e) => Math.round(e.getBoundingClientRect().top))
  ok(`[${loc}] ...and the calculator is on screen (top=${t}px)`, t >= 0 && t < 200, `top=${t}`)

  // counters must settle on the real, documented facts.
  // The counters ANIMATE, so wait for the text to be unchanged for 30 consecutive
  // polls (~3 s of quiet) before reading. Sampling mid-tick reads e.g. "64".
  await page.locator('#hakkimizda').scrollIntoViewIfNeeded()
  const wantRating = (5).toLocaleString(loc === 'tr' ? 'tr-TR' : loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  await page.waitForFunction(() => {
    const now = (document.querySelector('#hakkimizda .ab-n')?.textContent || '') + '|' +
                (document.querySelector('#hakkimizda .ab-stat b')?.textContent || '')
    if (window.__cPrev === now) window.__cQ = (window.__cQ || 0) + 1
    else { window.__cQ = 0; window.__cPrev = now }
    return window.__cQ >= 30
  }, null, { timeout: 20000, polling: 100 })
  const ratingTxt = (await page.locator('#hakkimizda .ab-stat b').first().innerText()).trim()
  const countTxt = nbsp((await page.locator('#hakkimizda .ab-n').innerText()).trim())
  // hero (static string from biz.ratingValue) vs about (locale-formatted counter)
  const heroRating = (await page.locator('header.hero .rnum').innerText()).trim()
  const aboutRating = ratingTxt.replace(/[^\d.,]/g, '')
  ok(`[${loc}] hero and about show the SAME rating notation ("${heroRating}" vs "${aboutRating}")`,
    heroRating === aboutRating, `hero="${heroRating}" about="${aboutRating}"`)
  ok(`[${loc}] rating counter settles on ${wantRating} (one decimal, no invented value)`,
    ratingTxt.includes(wantRating), `got="${ratingTxt}" want~"${wantRating}"`)
  eq(`[${loc}] review-count counter settles on 65`, countTxt, '65')
  ok(`[${loc}] "since 2021" line present and says 2021`,
    (await page.locator('#hakkimizda .ab-since').innerText()).includes('2021'),
    await page.locator('#hakkimizda .ab-since').innerText())
  const bodyTxt = await page.locator('body').innerText()
  ok(`[${loc}] no "1997" anywhere`, !bodyTxt.includes('1997'))
  ok(`[${loc}] no price/currency claims in body copy`,
    !/\b\d{2,}\s*(TL|₺)\b/.test(bodyTxt) && !/₺/.test(bodyTxt), 'currency found')

  ok(`[${loc}] no console/page errors (CTAs)`, page.__errors.length === 0, page.__errors.join(' | '))
  await ctx.close()
}
await b.close()
summary('t10-cta')
