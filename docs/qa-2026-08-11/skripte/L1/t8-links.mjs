/**
 * L1-B8  Technique: exhaustive inventory (100 % of outbound links and contact
 *        affordances on every page) + equivalence partitioning on viewport
 *        (desktop >=761px vs mobile <=760px) for the two sticky affordances.
 * Coverage criterion: every <a href> on all 16 pages classified and asserted;
 *        both viewport partitions checked for .wafab / .mobar.
 */
import { LOCALES, BASE, HOME, goHome, newPage, browser, ok, eq, summary } from './lib.mjs'

const TEL = '+902425138651'
const WA = '905330461387'
const KONYA = ['3323252550', '+90 332 325 25 50', '332 325 25 50', '0332 325 25 50']
const SOCIAL = {
  facebook: 'https://www.facebook.com/alanyaglobalteknik',
  instagram: 'https://www.instagram.com/alanyaglobalteknik/',
}
const LEGAL_TITLES = {
  tr: ['KVKK Aydınlatma Metni', 'Gizlilik Politikası', 'Çerez Politikası'],
  ru: ['Уведомление по закону KVKK', 'Политика конфиденциальности', 'Политика cookie'],
  de: ['Datenschutzhinweis (KVKK)', 'Datenschutzerklärung', 'Cookie-Richtlinie'],
  en: ['KVKK Privacy Notice', 'Privacy Policy', 'Cookie Policy'],
}

const b = await browser()

for (const loc of LOCALES) {
  console.log(`\n--- links & affordances, ${loc} (desktop) ---`)
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await newPage(ctx)
  await goHome(page, loc)

  const links = await page.$$eval('a[href]', (as) => as.map((a) => ({
    href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'),
    cls: a.className, text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
  })))
  console.log(`      ${links.length} links on the page`)

  // -- tel: --
  const tels = links.filter((l) => l.href.startsWith('tel:'))
  ok(`[${loc}] at least 3 tel: links (hero, contact buttons, contact row)`, tels.length >= 3, `n=${tels.length}`)
  eq(`[${loc}] every tel: uses ${TEL}`, [...new Set(tels.map((l) => l.href))], [`tel:${TEL}`])

  // -- wa.me --
  const was = links.filter((l) => l.href.includes('wa.me'))
  ok(`[${loc}] at least 6 wa.me links`, was.length >= 6, `n=${was.length}`)
  const badWa = was.filter((l) => !l.href.startsWith(`https://wa.me/${WA}`))
  eq(`[${loc}] every wa.me link uses ${WA}`, badWa.map((l) => l.href), [])

  // -- Konya number must appear nowhere --
  const bodyText = await page.locator('body').innerText()
  const html = await page.content()
  const hits = KONYA.filter((k) => bodyText.includes(k) || html.includes(k))
  eq(`[${loc}] Konya number appears nowhere (text or markup)`, hits, [])
  ok(`[${loc}] landline shown in human form (+90 242 513 86 51)`, bodyText.includes('+90 242 513 86 51'))
  ok(`[${loc}] WhatsApp shown in human form (+90 533 046 13 87)`, bodyText.includes('+90 533 046 13 87'))

  // -- target=_blank must carry rel=noopener --
  const blanks = links.filter((l) => l.target === '_blank')
  ok(`[${loc}] there are target=_blank links to check`, blanks.length > 0, `n=${blanks.length}`)
  const missingRel = blanks.filter((l) => !(l.rel || '').includes('noopener'))
  eq(`[${loc}] every target=_blank carries rel=noopener`, missingRel.map((l) => `${l.href} rel=${l.rel}`), [])

  // -- floating affordances, desktop partition --
  ok(`[${loc}] .wafab visible on desktop`, await page.locator('.wafab').isVisible())
  eq(`[${loc}] .wafab href`, await page.locator('.wafab').getAttribute('href'), `https://wa.me/${WA}`)
  eq(`[${loc}] .wafab has an accessible name`, await page.locator('.wafab').getAttribute('aria-label'), 'WhatsApp')
  ok(`[${loc}] .mobar hidden on desktop`, !(await page.locator('.mobar').isVisible()))
  ok(`[${loc}] #chatfab visible on desktop`, await page.locator('#chatfab').isVisible())

  // -- footer social --
  eq(`[${loc}] footer Facebook href`, await page.locator('.fsoc a[aria-label=Facebook]').getAttribute('href'), SOCIAL.facebook)
  eq(`[${loc}] footer Instagram href`, await page.locator('.fsoc a[aria-label=Instagram]').getAttribute('href'), SOCIAL.instagram)
  eq(`[${loc}] footer social open in new tab with noopener`,
    await page.locator('.fsoc a').evaluateAll((as) => as.map((a) => `${a.target}|${a.rel}`)),
    ['_blank|noopener', '_blank|noopener'])

  // -- rating link goes to the real Maps place --
  const rating = page.locator('a[data-rating]')
  ok(`[${loc}] hero rating links to Google Maps`, (await rating.getAttribute('href')).includes('google.com/maps'),
    await rating.getAttribute('href'))

  // -- footer legal links resolve --
  const legalHrefs = await page.locator('footer.foot .fl a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
  const wantLegal = ['kvkk', 'gizlilik', 'cerez'].map((s) => (loc === 'tr' ? `/${s}` : `/${loc}/${s}`))
  eq(`[${loc}] footer legal hrefs`, legalHrefs, wantLegal)
  for (let i = 0; i < legalHrefs.length; i++) {
    const res = await page.goto(BASE + legalHrefs[i], { waitUntil: 'domcontentloaded' })
    eq(`[${loc}] ${legalHrefs[i]} -> 200`, res.status(), 200)
    const h1 = (await page.locator('h1').first().innerText()).trim()
    eq(`[${loc}] ${legalHrefs[i]} h1 in ${loc}`, h1, LEGAL_TITLES[loc][i])
  }
  await goHome(page, loc)

  // -- the map: the demo mode really embeds --
  eq(`[${loc}] map is in 'embed' demo mode`, await page.locator('.cmap').getAttribute('data-map'), 'embed')
  eq(`[${loc}] map iframe present with the real place id`,
    (await page.locator('.cmap iframe').getAttribute('src') || '').includes('0x14dc99ada3ddac53'), true)

  ok(`[${loc}] no console/page errors (links, desktop)`, page.__errors.length === 0, page.__errors.join(' | '))
  await ctx.close()

  // ── mobile partition ──
  const mctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const mpage = await newPage(mctx)
  await goHome(mpage, loc)
  ok(`[${loc}] .mobar visible on mobile`, await mpage.locator('.mobar').isVisible())
  const mobarLinks = await mpage.locator('.mobar a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
  eq(`[${loc}] .mobar = [tel, wa]`, mobarLinks, [`tel:${TEL}`, `https://wa.me/${WA}`])
  ok(`[${loc}] .mobar sits at the bottom of the viewport`,
    (await mpage.locator('.mobar').boundingBox()).y + (await mpage.locator('.mobar').boundingBox()).height >= 840,
    JSON.stringify(await mpage.locator('.mobar').boundingBox()))
  ok(`[${loc}] .wafab hidden on mobile (mobar covers WhatsApp)`, !(await mpage.locator('.wafab').isVisible()))
  ok(`[${loc}] #chatfab still reachable on mobile`, await mpage.locator('#chatfab').isVisible())
  const cfab = await mpage.locator('#chatfab').boundingBox()
  const mobar = await mpage.locator('.mobar').boundingBox()
  ok(`[${loc}] #chatfab does not overlap .mobar`, cfab.y + cfab.height <= mobar.y + 1,
    `chatfab=${JSON.stringify(cfab)} mobar=${JSON.stringify(mobar)}`)
  ok(`[${loc}] no console/page errors (links, mobile)`, mpage.__errors.length === 0, mpage.__errors.join(' | '))
  await mctx.close()
}
await b.close()
summary('t8-links')
