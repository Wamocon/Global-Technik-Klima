/**
 * L1-B11 Technique: use-case testing of the primary conversion path on the
 *        viewport this market actually uses (390x844 touch), plus evidence capture
 *        for the EN rating-notation mismatch.
 * Coverage criterion: randevu happy path end-to-end on mobile × 4 locales.
 */
import { LOCALES, goHome, newPage, browser, ok, eq, summary, DIR } from './lib.mjs'
const WA = '905330461387'
const b = await browser()

for (const loc of LOCALES) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await newPage(ctx)
  await page.addInitScript(() => {
    window.__opened = []
    window.open = (url, target, feat) => { window.__opened.push({ url: String(url), target, feat }); return null }
  })
  await goHome(page, loc)
  const form = page.locator('#reqForm')
  await form.scrollIntoViewIfNeeded()
  ok(`[${loc}] mobile: form visible`, await form.isVisible())
  // no horizontal overflow inside the form
  const ov = await page.evaluate(() => {
    const f = document.getElementById('reqForm')
    return { fw: f.getBoundingClientRect().width, vw: document.documentElement.clientWidth,
             scroll: document.documentElement.scrollWidth }
  })
  ok(`[${loc}] mobile: form fits the viewport`, ov.fw <= ov.vw + 1, JSON.stringify(ov))
  ok(`[${loc}] mobile: page has no horizontal scroll`, ov.scroll <= ov.vw + 1, JSON.stringify(ov))
  // touch targets
  const btnH = await form.locator('button[type=submit]').evaluate((e) => e.getBoundingClientRect().height)
  ok(`[${loc}] mobile: submit button >=44px tall (${Math.round(btnH)}px)`, btnH >= 44, `h=${btnH}`)

  await form.locator('[name=name]').fill('Mobil Test')
  await form.locator('[name=phone]').fill('+90 500 000 00 00')
  await form.locator('select[name=service]').selectOption({ index: 1 })
  await form.locator('[name=consent]').check()
  await form.locator('button[type=submit]').click()
  await page.waitForFunction(() => window.__opened.length > 0, null, { timeout: 5000 }).catch(() => {})
  const opened = await page.evaluate(() => window.__opened)
  ok(`[${loc}] mobile: submit opened the wa.me deeplink`, opened.length === 1 &&
    opened[0].url.startsWith(`https://wa.me/${WA}?text=`), JSON.stringify(opened))
  const txt = decodeURIComponent((opened[0]?.url || '').split('?text=')[1] || '')
  ok(`[${loc}] mobile: payload carries the typed name and phone`,
    txt.includes('Mobil Test') && txt.includes('+90 500 000 00 00'), JSON.stringify(txt))
  ok(`[${loc}] mobile: no console/page errors`, page.__errors.length === 0, page.__errors.join(' | '))
  await ctx.close()
}

// evidence: EN hero "5,0" vs EN about "5.0"
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await newPage(ctx)
  await goHome(page, 'en')
  await page.locator('header.hero a[data-rating]').screenshot({ path: `${DIR}/rating-en-hero.png` })
  await page.locator('#hakkimizda').scrollIntoViewIfNeeded()
  await page.waitForFunction(() => {
    const now = document.querySelector('#hakkimizda .ab-stat b')?.textContent || ''
    if (window.__p === now) window.__q = (window.__q || 0) + 1; else { window.__q = 0; window.__p = now }
    return window.__q >= 25
  }, null, { timeout: 15000, polling: 100 })
  await page.locator('#hakkimizda .ab-r').screenshot({ path: `${DIR}/rating-en-about.png` })
  console.log('hero:', (await page.locator('header.hero .rnum').innerText()).trim(),
    ' about:', (await page.locator('#hakkimizda .ab-stat b').first().innerText()).trim())
  await ctx.close()
}
await b.close()
summary('t11-mobile-form')
