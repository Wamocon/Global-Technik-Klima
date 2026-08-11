/**
 * L1-B9  Technique: exhaustive enumeration of the 12 legal routes (4 locales × 3
 *        documents), each checked as a complete use case: reachable, titled,
 *        navigable back, and switchable between languages without losing the doc.
 * Coverage criterion: 12/12 routes; header affordances on each; plus an inventory
 *        of which home-page affordances exist / do not exist on a legal page.
 */
import { LOCALES, BASE, newPage, browser, ok, eq, summary } from './lib.mjs'

const SLUGS = ['kvkk', 'gizlilik', 'cerez']
const TITLES = {
  tr: { kvkk: 'KVKK Aydınlatma Metni', gizlilik: 'Gizlilik Politikası', cerez: 'Çerez Politikası' },
  ru: { kvkk: 'Уведомление по закону KVKK', gizlilik: 'Политика конфиденциальности', cerez: 'Политика cookie' },
  de: { kvkk: 'Datenschutzhinweis (KVKK)', gizlilik: 'Datenschutzerklärung', cerez: 'Cookie-Richtlinie' },
  en: { kvkk: 'KVKK Privacy Notice', gizlilik: 'Privacy Policy', cerez: 'Cookie Policy' },
}
const NAV_FIRST = { tr: 'Hizmetler', ru: 'Услуги', de: 'Leistungen', en: 'Services' }
const pathOf = (loc, slug) => (loc === 'tr' ? '' : `/${loc}`) + `/${slug}`

const b = await browser()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const page = await newPage(ctx)

for (const loc of LOCALES) {
  for (const slug of SLUGS) {
    const url = BASE + pathOf(loc, slug)
    const res = await page.goto(url, { waitUntil: 'domcontentloaded' })
    eq(`${pathOf(loc, slug)} -> 200`, res.status(), 200)
    eq(`${pathOf(loc, slug)} <html lang>`, await page.getAttribute('html', 'lang'), loc)
    eq(`${pathOf(loc, slug)} exactly one h1`, await page.locator('h1').count(), 1)
    eq(`${pathOf(loc, slug)} h1 text`, (await page.locator('h1').innerText()).trim(), TITLES[loc][slug])
    ok(`${pathOf(loc, slug)} canonical is self`,
      (await page.getAttribute('link[rel=canonical]', 'href') || '').endsWith(pathOf(loc, slug)),
      await page.getAttribute('link[rel=canonical]', 'href'))
    ok(`${pathOf(loc, slug)} hreflang set has 5 entries (4 locales + x-default)`,
      (await page.locator('link[rel=alternate]').count()) === 5,
      String(await page.locator('link[rel=alternate]').count()))
    ok(`${pathOf(loc, slug)} hreflang targets keep the document`,
      (await page.locator('link[rel=alternate]').evaluateAll((ls) => ls.map((l) => l.getAttribute('href'))))
        .every((h) => h.endsWith(`/${slug}`)),
      JSON.stringify(await page.locator('link[rel=alternate]').evaluateAll((ls) => ls.map((l) => l.href))))
    const body = (await page.locator('article.legal').innerText()).replace(/\s+/g, ' ').trim()
    ok(`${pathOf(loc, slug)} body >=400 chars`, body.length >= 400, `len=${body.length}`)
    ok(`${pathOf(loc, slug)} has >=2 h2 sections`, (await page.locator('article.legal h2').count()) >= 2,
      String(await page.locator('article.legal h2').count()))
    ok(`${pathOf(loc, slug)} shows the visible draft notice`,
      (await page.locator('.draft').innerText()).trim().length > 20)

    // -- header works --
    ok(`${pathOf(loc, slug)} header present`, await page.locator('header.topbar').isVisible())
    ok(`${pathOf(loc, slug)} brand link -> locale home`,
      (await page.locator('a.brand').getAttribute('href')) === (loc === 'tr' ? '/' : `/${loc}`),
      await page.locator('a.brand').getAttribute('href'))
    eq(`${pathOf(loc, slug)} mainnav has 7 links`, await page.locator('.mainnav a').count(), 7)
    eq(`${pathOf(loc, slug)} mainnav first label localized`,
      (await page.locator('.mainnav a').first().innerText()).trim(), NAV_FIRST[loc])
    ok(`${pathOf(loc, slug)} mainnav links point back to the locale home + anchor`,
      (await page.locator('.mainnav a').evaluateAll((as) => as.map((a) => a.getAttribute('href'))))
        .every((h) => h.startsWith(loc === 'tr' ? '/#' : `/${loc}#`)))
    ok(`${pathOf(loc, slug)} theme toggle present`, await page.locator('#themetog').isVisible())
    eq(`${pathOf(loc, slug)} lang switch marks the current locale`,
      await page.locator(`nav.lang a[aria-current=page]`).getAttribute('hreflang'), loc)
    ok(`${pathOf(loc, slug)} back-home link present`,
      (await page.locator('a.back').count()) === 1 &&
      (await page.locator('a.back').getAttribute('href')) === (loc === 'tr' ? '/' : `/${loc}`))

    // -- mainnav actually navigates back to the home page + anchor --
    await page.locator('.mainnav a').nth(4).click() // #kesif
    await page.waitForLoadState('domcontentloaded')
    eq(`${pathOf(loc, slug)} nav -> home#kesif lands on the home document`,
      new URL(page.url()).pathname.replace(/\/$/, '') || '/', loc === 'tr' ? '/' : `/${loc}`)
    eq(`${pathOf(loc, slug)} nav -> #kesif keeps the hash`, new URL(page.url()).hash, '#kesif')
    ok(`${pathOf(loc, slug)} the BTU calculator is really there after the jump`,
      await page.locator('#kesif #cbtu').count() === 1)
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    // -- inventory: which home affordances exist here --
    const inv = await page.evaluate(() => ({
      footer: !!document.querySelector('footer.foot'),
      mobar: !!document.querySelector('.mobar'),
      wafab: !!document.querySelector('.wafab'),
      chatfab: !!document.querySelector('#chatfab'),
      siblingLegalLinks: document.querySelectorAll('article.legal a[href*="kvkk"], article.legal a[href*="gizlilik"], article.legal a[href*="cerez"]').length,
    }))
    if (loc === 'tr' && slug === 'kvkk') console.log('      legal-page affordance inventory:', JSON.stringify(inv))
    ok(`${pathOf(loc, slug)} has a footer`, inv.footer, `inventory=${JSON.stringify(inv)}`)
    ok(`${pathOf(loc, slug)} has a WhatsApp affordance (wafab or mobar)`, inv.wafab || inv.mobar,
      `inventory=${JSON.stringify(inv)}`)
  }
}
ok('no console/page errors across all 12 legal pages', page.__errors.length === 0, page.__errors.join(' | '))

// -- language switching between legal docs keeps the document (all 12 combinations) --
for (const slug of SLUGS) {
  for (const from of LOCALES) {
    await page.goto(BASE + pathOf(from, slug), { waitUntil: 'domcontentloaded' })
    for (const to of LOCALES) {
      if (to === from) continue
      await page.goto(BASE + pathOf(from, slug), { waitUntil: 'domcontentloaded' })
      await page.locator(`nav.lang a[hreflang="${to}"]`).click()
      await page.waitForLoadState('domcontentloaded')
      eq(`${pathOf(from, slug)} --[${to}]--> ${pathOf(to, slug)}`,
        new URL(page.url()).pathname.replace(/\/$/, ''), pathOf(to, slug))
      eq(`  ...h1 is the ${to} title of ${slug}`, (await page.locator('h1').innerText()).trim(), TITLES[to][slug])
    }
  }
}
await ctx.close()

// -- unknown path returns the 404 page --
{
  const c2 = await b.newContext()
  const p2 = await newPage(c2)
  const res = await p2.goto(BASE + '/de/this-does-not-exist', { waitUntil: 'domcontentloaded' })
  eq('unknown path status', res.status(), 404)
  ok('404 page has readable content', (await p2.locator('body').innerText()).trim().length > 20)
  await c2.close()
}
await b.close()
summary('t9-legal')
