/**
 * L1-B5  Technique: use-case testing + state transition (mobile menu) +
 *        pairwise-ish traversal of {locale × nav entry} and {locale × document}
 *        for the language switcher.
 * Coverage criterion: every desktop nav link (7) × 4 locales must resolve to an
 *        existing anchor AND actually land on it under the sticky header; the same
 *        7 links on mobile plus the close-on-select transition; the language
 *        switcher must preserve the current document for home + all 3 legal docs.
 */
import { LOCALES, HOME, BASE, goHome, newPage, browser, ok, eq, summary, DIR } from './lib.mjs'

const NAV_LABELS = {
  tr: ['Hizmetler', 'Ürünler', 'Projeler', 'Teknik', 'BTU Hesapla', 'Randevu', 'İletişim'],
  ru: ['Услуги', 'Товары', 'Проекты', 'Техника', 'Расчёт BTU', 'Запись', 'Контакты'],
  de: ['Leistungen', 'Produkte', 'Projekte', 'Technik', 'BTU-Rechner', 'Termin', 'Kontakt'],
  en: ['Services', 'Products', 'Projects', 'Technology', 'BTU', 'Appointment', 'Contact'],
}
const EXPECTED_HASHES = ['#hizmetler', '#urunler', '#projeler', '#teknik', '#kesif', '#randevu', '#kontakt']

/** wait until scrolling has come to rest (condition-based, no fixed sleep) */
async function scrollSettled(page) {
  await page.waitForFunction(() => {
    const w = window
    if (w.__lastY === undefined) { w.__lastY = -1; w.__stable = 0 }
    if (Math.abs(w.scrollY - w.__lastY) < 0.6) w.__stable++
    else w.__stable = 0
    w.__lastY = w.scrollY
    return w.__stable >= 4
  }, null, { timeout: 8000, polling: 60 })
  await page.evaluate(() => { delete window.__lastY; delete window.__stable })
}

const b = await browser()

// ─────────────── desktop nav ───────────────
for (const loc of LOCALES) {
  console.log(`\n--- desktop nav, ${loc} ---`)
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await newPage(ctx)
  await goHome(page, loc)

  const nav = page.locator('.mainnav')
  ok(`[${loc}] .mainnav visible at 1440px`, await nav.isVisible())
  const labels = (await nav.locator('a').allInnerTexts()).map((s) => s.trim())
  eq(`[${loc}] nav labels localized & in order`, labels, NAV_LABELS[loc])

  const hrefs = await nav.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
  eq(`[${loc}] nav hrefs point at the 7 documented anchors`,
    hrefs.map((h) => '#' + h.split('#')[1]), EXPECTED_HASHES)
  eq(`[${loc}] nav hrefs carry the locale base`,
    hrefs.every((h) => h.startsWith(loc === 'tr' ? '/#' : `/${loc}#`)), true)

  const barH = await page.locator('.topbar').evaluate((e) => Math.round(e.getBoundingClientRect().height))
  for (let i = 0; i < hrefs.length; i++) {
    const hash = EXPECTED_HASHES[i]
    const target = page.locator(hash)
    if (!ok(`[${loc}] target ${hash} exists`, (await target.count()) === 1)) continue
    await page.evaluate(() => window.scrollTo(0, 0))
    await nav.locator('a').nth(i).click()
    await scrollSettled(page)
    const top = await target.evaluate((e) => Math.round(e.getBoundingClientRect().top))
    // scroll-margin-top = topbar height + 10 → target top should sit just below the bar
    ok(`[${loc}] click ${hash} lands on it (top=${top}px, bar=${barH}px)`,
      top >= 0 && top <= barH + 40, `top=${top} barH=${barH}`)
    eq(`[${loc}] location.hash after ${hash}`, await page.evaluate(() => location.hash), hash)
  }
  ok(`[${loc}] no console/page errors (desktop nav)`, page.__errors.length === 0, page.__errors.join(' | '))
  await ctx.close()
}

// ─────────────── mobile burger nav ───────────────
for (const loc of LOCALES) {
  console.log(`\n--- mobile nav 390x844, ${loc} ---`)
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await newPage(ctx)
  await goHome(page, loc)

  ok(`[${loc}] .mainnav hidden at 390px`, !(await page.locator('.mainnav').isVisible()))
  ok(`[${loc}] burger visible at 390px`, await page.locator('#burger').isVisible())
  ok(`[${loc}] #mobnav hidden initially`, await page.locator('#mobnav').isHidden())
  eq(`[${loc}] burger aria-expanded=false`, await page.getAttribute('#burger', 'aria-expanded'), 'false')

  await page.click('#burger')
  await page.waitForSelector('#mobnav:not([hidden])', { timeout: 3000 })
  ok(`[${loc}] #mobnav opens on burger tap`, await page.locator('#mobnav').isVisible())
  eq(`[${loc}] burger aria-expanded=true`, await page.getAttribute('#burger', 'aria-expanded'), 'true')
  const mlabels = (await page.locator('#mobnav a').allInnerTexts()).map((s) => s.trim())
  eq(`[${loc}] mobnav labels = desktop labels`, mlabels, NAV_LABELS[loc])

  const barH = await page.locator('.topbar').evaluate((e) => Math.round(e.getBoundingClientRect().height))
  for (let i = 0; i < EXPECTED_HASHES.length; i++) {
    const hash = EXPECTED_HASHES[i]
    if ((await page.locator('#mobnav').isHidden())) {
      await page.click('#burger'); await page.waitForSelector('#mobnav:not([hidden])')
    }
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.locator('#mobnav a').nth(i).click()
    await page.waitForFunction(() => document.getElementById('mobnav').hidden, null, { timeout: 3000 }).catch(() => {})
    ok(`[${loc}] mobnav closes after selecting ${hash}`, await page.locator('#mobnav').isHidden())
    await scrollSettled(page)
    const top = await page.locator(hash).evaluate((e) => Math.round(e.getBoundingClientRect().top))
    ok(`[${loc}] mobile click ${hash} lands on it (top=${top}px, bar=${barH}px)`,
      top >= 0 && top <= barH + 40, `top=${top} barH=${barH}`)
  }
  // Escape must also close
  await page.click('#burger'); await page.waitForSelector('#mobnav:not([hidden])')
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.getElementById('mobnav').hidden, null, { timeout: 3000 }).catch(() => {})
  ok(`[${loc}] mobnav closes on Escape`, await page.locator('#mobnav').isHidden())

  ok(`[${loc}] no console/page errors (mobile nav)`, page.__errors.length === 0, page.__errors.join(' | '))
  await ctx.close()
}

// ─────────────── language switcher preserves the document ───────────────
console.log('\n--- language switcher document preservation ---')
const DOCS = ['', 'kvkk', 'gizlilik', 'cerez']
const pathOf = (loc, doc) => (loc === 'tr' ? '' : `/${loc}`) + (doc ? `/${doc}` : '/')
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await newPage(ctx)
  for (const doc of DOCS) {
    for (const from of LOCALES) {
      const startPath = doc ? pathOf(from, doc) : HOME[from]
      await page.goto(BASE + startPath, { waitUntil: 'domcontentloaded' })
      const langHrefs = await page.locator('nav.lang a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
      const wanted = LOCALES.map((l) => (doc ? pathOf(l, doc) : (l === 'tr' ? '/' : `/${l}`)))
      // pathFor strips the trailing slash for the home route
      eq(`lang hrefs on ${startPath || '/'} `, langHrefs, wanted)

      for (const to of LOCALES) {
        if (to === from) continue
        await page.goto(BASE + startPath, { waitUntil: 'domcontentloaded' })
        await page.locator(`nav.lang a[hreflang="${to}"]`).click()
        await page.waitForLoadState('domcontentloaded')
        const got = new URL(page.url()).pathname.replace(/\/$/, '') || '/'
        const want = (doc ? pathOf(to, doc) : (to === 'tr' ? '/' : `/${to}`)).replace(/\/$/, '') || '/'
        eq(`${startPath || '/'} --[${to}]--> keeps the document`, got, want)
        if (doc) {
          const h1 = (await page.locator('h1').first().innerText()).trim()
          ok(`  ...and shows an h1 in ${to} ("${h1.slice(0, 34)}")`, h1.length > 3)
          eq(`  ...and <html lang>=${to}`, await page.getAttribute('html', 'lang'), to)
        }
      }
    }
  }
  ok('no console/page errors (language switcher)', page.__errors.length === 0, page.__errors.join(' | '))
  await ctx.close()
}
await b.close()
summary('t5-nav')
