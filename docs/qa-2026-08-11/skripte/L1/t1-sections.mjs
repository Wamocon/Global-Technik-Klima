/**
 * L1-B1  Technique: use-case / scenario-based testing + equivalence partitioning
 *        over the locale dimension.
 * Coverage criterion: every documented landmark section × every locale (4) is
 * present, has non-empty visible text, has the documented item count, and shows
 * no pseudo-locale / missing-key leak.
 */
import { LOCALES, goHome, newPage, browser, ok, eq, summary, pseudoLeak } from './lib.mjs'

// Documented counts from src/content/home.ts
const COUNTS = {
  services: 6, products: 7, warrantyTiers: 3,
  segments: 6, systems: 4, steps: 5,
  explodedParts: 5, footerLegal: 3, formServices: 6,
  reviews: { tr: 3, de: 2, ru: 2, en: 2 },
}

const SECTIONS = [
  ['#hizmetler', 'services'],
  ['#urunler', 'products'],
  ['#projeler', 'B2B projects'],
  ['#teknik', 'exploded tech'],
  ['#referanslar', 'before/after'],
  ['#kesif', 'BTU calc'],
  ['section.camp', 'campaign'],
  ['#neden', 'why + warranty'],
  ['#yorumlar', 'reviews'],
  ['#randevu', 'randevu form'],
  ['#hakkimizda', 'about'],
  ['#kontakt', 'contact + map'],
  ['footer.foot', 'footer'],
]

const b = await browser()
for (const loc of LOCALES) {
  console.log(`\n--- locale ${loc} ---`)
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await newPage(ctx)
  const res = await goHome(page, loc)
  ok(`[${loc}] home 200`, res.status() === 200, `status=${res.status()}`)
  eq(`[${loc}] <html lang>`, await page.getAttribute('html', 'lang'), loc)

  // hero — exactly one h1, two headline lines, claim, both CTAs, scroll cue
  const h1 = page.locator('h1')
  eq(`[${loc}] exactly one h1 on home`, await h1.count(), 1)
  ok(`[${loc}] hero h1 non-empty`, (await h1.first().innerText()).trim().length > 5,
    `h1="${(await h1.first().innerText()).slice(0, 80)}"`)
  const heroSec = page.locator('header.hero')
  const heroTxt = (await heroSec.innerText()).replace(/\s+/g, ' ').trim()
  ok(`[${loc}] hero text >=60 chars`, heroTxt.length >= 60, `len=${heroTxt.length}`)
  eq(`[${loc}] hero has 2 CTA buttons`, await heroSec.locator('.cta a.btn').count(), 2)
  eq(`[${loc}] hero headline has 2 lines`, await heroSec.locator('h1 .ln').count(), 2)
  ok(`[${loc}] hero kicker+claim+sub non-empty`,
    (await heroSec.locator('.hero-kicker').innerText()).trim().length > 5 &&
    (await heroSec.locator('.claim').innerText()).trim().length > 15 &&
    (await heroSec.locator('.sub').innerText()).trim().length > 15)
  eq(`[${loc}] hero shows rating 5,0 / 65`,
    [(await heroSec.locator('.rnum').innerText()).trim(), (await heroSec.locator('.rcount').innerText()).includes('65')],
    ['5,0', true])
  eq(`[${loc}] hero trust chips = 4`, await heroSec.locator('.trustchips span:not(.hl)').count(), 4)

  for (const [sel, label] of SECTIONS) {
    const n = page.locator(sel)
    const cnt = await n.count()
    if (!ok(`[${loc}] ${label} (${sel}) exists`, cnt === 1, `count=${cnt}`)) continue
    // scroll into view so reveal animations settle, then read text
    await n.scrollIntoViewIfNeeded()
    await page.waitForFunction((s) => {
      const el = document.querySelector(s)
      return el && (el.innerText || '').trim().length > 0
    }, sel, { timeout: 5000 }).catch(() => {})
    const txt = (await n.innerText()).replace(/\s+/g, ' ').trim()
    ok(`[${loc}] ${label} has text (>=25 chars)`, txt.length >= 25, `len=${txt.length} txt="${txt.slice(0, 60)}"`)
  }

  // ---- documented item counts ----
  eq(`[${loc}] services cards = 6`, await page.locator('#hizmetler .card').count(), COUNTS.services)
  eq(`[${loc}] product tiles = 7`, await page.locator('#urunler .prod').count(), COUNTS.products)
  eq(`[${loc}] B2B segments = 6`, await page.locator('#projeler .segs .seg').count(), COUNTS.segments)
  eq(`[${loc}] B2B systems = 4`, await page.locator('#projeler .systems .sys').count(), COUNTS.systems)
  eq(`[${loc}] B2B process steps = 5`, await page.locator('#projeler ol.flow li.step').count(), COUNTS.steps)
  eq(`[${loc}] exploded legend items = 5`, await page.locator('#expLegend li').count(), COUNTS.explodedParts)
  eq(`[${loc}] warranty tiers = 3`, await page.locator('#neden .wtiers li').count(), COUNTS.warrantyTiers)
  eq(`[${loc}] why tiles = 4`, await page.locator('#neden .tiles .tile').count(), 4)
  eq(`[${loc}] reviews = ${COUNTS.reviews[loc]}`, await page.locator('#yorumlar .rev').count(), COUNTS.reviews[loc])
  eq(`[${loc}] campaign cards = 2 + 1 cta`, [await page.locator('.camp .camp-card').count(), await page.locator('.camp .camp-cta').count()], [2, 1])
  eq(`[${loc}] form service options = 6`, await page.locator('#reqForm select[name=service] option').count(), COUNTS.formServices)
  eq(`[${loc}] footer legal links = 3`, await page.locator('footer.foot .fl a').count(), COUNTS.footerLegal)

  // warranty tier years must be non-empty
  const years = await page.locator('#neden .wtiers .wy').allInnerTexts()
  ok(`[${loc}] warranty tier years all non-empty`, years.length === 3 && years.every((y) => y.trim().length > 0), JSON.stringify(years))

  // ---- pseudo-locale / missing key leak on the whole document ----
  const body = await page.locator('body').innerText()
  const leak = pseudoLeak(body)
  ok(`[${loc}] no pseudo-locale / ‹key› leak`, leak === null, `found="${leak}" near="${leak ? body.slice(Math.max(0, body.indexOf(leak) - 40), body.indexOf(leak) + 40) : ''}"`)

  // no empty section headers
  const emptyEyebrows = await page.locator('.eyebrow, .kicker').evaluateAll((els) => els.filter((e) => !(e.textContent || '').trim()).length)
  ok(`[${loc}] no empty .eyebrow/.kicker`, emptyEyebrows === 0, `empty=${emptyEyebrows}`)

  ok(`[${loc}] no console/page errors`, page.__errors.length === 0, page.__errors.join(' | '))
  await ctx.close()
}
await b.close()
summary('t1-sections')
