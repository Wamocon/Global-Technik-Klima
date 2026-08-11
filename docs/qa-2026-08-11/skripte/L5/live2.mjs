// L5 — live: (a) caps in de/ru/en, (b) keyword substring collisions,
// (c) Google network + storage before any consent, (d) visible-content parity.
import { chromium } from 'file:///D:/01%20Antigrafity%20Projekte/25%20Global-Technik-Klima/node_modules/playwright/index.mjs'

const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L5'
const PATHS = { tr: '/', ru: '/ru', de: '/de', en: '/en' }

async function ask(page, text) {
  const before = await page.locator('#cbody .msg.bot:not(.typing)').count()
  await page.fill('#cin', text)
  await page.press('#cin', 'Enter')
  await page.waitForFunction((n) => document.querySelectorAll('#cbody .msg.bot:not(.typing)').length > n, before, { timeout: 8000 })
  const b = page.locator('#cbody .msg.bot:not(.typing) .b')
  return (await b.nth((await b.count()) - 1).innerText()).trim()
}

const CAPS_OTHER = {
  de: [['WARTUNG', 'Bei der Wartung reinigen'], ['GARANTIE', 'Gree-Herstellergarantie'], ['WÄRMEPUMPE', 'Versati-Wärmepumpe'], ['WAS KOSTET DIE MONTAGE', 'keinen Festpreis']],
  ru: [['ОБСЛУЖИВАНИЕ', 'При обслуживании чистим'], ['ГАРАНТИЯ', 'Заводская гарантия Gree'], ['ФРЕОН', 'не хватает фреона'], ['СКОЛЬКО СТОИТ МОНТАЖ', 'Фиксированную цену']],
  en: [['MAINTENANCE', 'Maintenance: we clean'], ['WARRANTY', 'manufacturer warranty covers'], ['HEAT PUMP', 'Versati heat pump'], ['HOW MUCH IS INSTALLATION', 'don’t quote a fixed price']],
}
// keyword-substring collisions, all lowercase (so the casing trap is NOT the cause)
const COLLIDE = [
  ['garantı süresi', 'dotless-i spelling of garanti'],
  ['karavan garantisi kaç yıl', 'caravan warranty'],
  ['para üstü var mı', 'contains "ara" and "para"'],
  ['aralık ayında geliyor musunuz', 'contains "ara"'],
]

const results = { caps: [], collide: [], net: [], content: [] }
const browser = await chromium.launch()

// ---- (a) caps in de/ru/en
for (const [loc, probes] of Object.entries(CAPS_OTHER)) {
  const page = await browser.newPage()
  await page.goto(BASE + PATHS[loc], { waitUntil: 'networkidle' })
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  for (const [q, want] of probes) {
    const a = await ask(page, q)
    results.caps.push({ loc, q, ok: a.includes(want), got: a.slice(0, 70) })
  }
  await page.close()
}

// ---- (b) collisions on tr
{
  const page = await browser.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  for (const [q, why] of COLLIDE) {
    const a = await ask(page, q)
    results.collide.push({ q, why, got: a.slice(0, 100) })
  }
  await page.close()
}

// ---- (c) Google network + storage BEFORE any interaction, all 4 locales, fresh context each
for (const [loc, p] of Object.entries(PATHS)) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const third = []
  page.on('request', (r) => {
    const h = new URL(r.url()).host
    if (!/^localhost/.test(h)) third.push(h + ' :: ' + r.resourceType())
  })
  await page.goto(BASE + p, { waitUntil: 'networkidle' })
  // no click, no scroll, no consent
  const cookies = await ctx.cookies()
  const ls = await page.evaluate(() => { try { return Object.keys(localStorage) } catch { return ['<blocked>'] } })
  const ss = await page.evaluate(() => { try { return Object.keys(sessionStorage) } catch { return ['<blocked>'] } })
  const mapMode = await page.getAttribute('.cmap', 'data-map')
  const iframes = await page.$$eval('iframe', (n) => n.map((x) => x.getAttribute('src')?.slice(0, 60)))
  results.net.push({ loc, mapMode, iframes, thirdParty: [...new Set(third)], cookies: cookies.map((c) => `${c.name}@${c.domain}`), ls, ss })
  await ctx.close()
}

// ---- (d) visible-content parity
for (const [loc, p] of Object.entries(PATHS)) {
  const page = await browser.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
  await page.goto(BASE + p, { waitUntil: 'networkidle' })

  const exBadges = await page.$$eval('.rev .ex', (n) => n.map((x) => x.textContent.trim()))
  const exComputed = await page.$$eval('.rev .ex', (n) => n.map((x) => getComputedStyle(x).textTransform))
  const whenPh = await page.getAttribute('input[name="when"]', 'placeholder')
  const heroRating = await page.textContent('.ratingbig .rnum')
  const heroCount = await page.textContent('.ratingbig .rcount')
  const revSub = (await page.textContent('#yorumlar .lede')).trim()
  // BTU: default, then a value that exercises the thousands separator
  const btuDefault = await page.textContent('#cbtu')
  await page.fill('#ca', '60')
  await page.waitForFunction(() => document.getElementById('cbtu').textContent !== '', null, { timeout: 3000 })
  const btu60 = await page.textContent('#cbtu')
  const ctaHref = await page.getAttribute('#ccta', 'href')
  // ab-stat rating after the counter has settled
  await page.locator('#hakkimizda').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1600) // settle: counter is animation-bound (GSAP), asserted after
  const abStat = await page.textContent('#hakkimizda .ab-stat b')
  const prodTag = await page.$$eval('.prod .pt', (n) => n.map((x) => x.textContent.trim()).filter((t) => /BTU/.test(t)))
  const flowLabel = await page.getAttribute('ol.flow', 'aria-label')
  const panelLabel = await page.getAttribute('#chatpanel', 'aria-label')
  const langNav = await page.getAttribute('nav.lang', 'aria-label')
  const reviewCaps = await page.$$eval('.rev figcaption', (n) => n.map((x) => x.innerText.trim()))

  results.content.push({ loc, exBadges, exComputed, whenPh, heroRating: heroRating.trim(), heroCount: heroCount.trim(),
    revSub, btuDefault, btu60, ctaText: decodeURIComponent((ctaHref.split('text=')[1] || '')), abStat: abStat.trim(),
    prodTag, flowLabel, panelLabel, langNav, reviewCaps, errs: errs.filter((e) => !/404/.test(e)) })

  if (loc !== 'tr') {
    await page.locator('#yorumlar').scrollIntoViewIfNeeded()
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${DIR}/beispiel-badge-${loc}.png` })
  }
  if (loc === 'en') {
    await page.locator('#kesif').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}/en-btu-tr-format.png` })
    await page.locator('.ratingbig').scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${DIR}/en-hero-rating-comma.png` })
    await page.locator('#randevu').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}/en-form-turkish-placeholder.png` })
  }
  await page.close()
}
await browser.close()

console.log('=== (a) ALL-CAPS in de / ru / en ===')
for (const r of results.caps) console.log(`  ${r.ok ? 'OK  ' : 'FAIL'} [${r.loc}] "${r.q}" → ${r.got}`)
console.log(`  failures: ${results.caps.filter((r) => !r.ok).length}/${results.caps.length}`)

console.log('\n=== (b) keyword substring collisions (lowercase tr) ===')
for (const r of results.collide) console.log(`  "${r.q}" (${r.why})\n     → ${r.got}`)

console.log('\n=== (c) first load, zero interaction ===')
for (const r of results.net) {
  console.log(`  /${r.loc}  mapMode=${r.mapMode}`)
  console.log(`     iframes: ${JSON.stringify(r.iframes)}`)
  console.log(`     third-party requests: ${r.thirdParty.length ? r.thirdParty.join(' | ') : '(none)'}`)
  console.log(`     cookies: ${r.cookies.length ? r.cookies.join(', ') : '(none)'}`)
  console.log(`     localStorage: ${JSON.stringify(r.ls)}  sessionStorage: ${JSON.stringify(r.ss)}`)
}

console.log('\n=== (d) visible-content parity ===')
for (const r of results.content) {
  console.log(`  --- /${r.loc}`)
  console.log(`     review "example" badge text : ${JSON.stringify(r.exBadges)}  text-transform=${JSON.stringify(r.exComputed)}`)
  console.log(`     review captions            : ${JSON.stringify(r.reviewCaps)}`)
  console.log(`     form "when" placeholder    : "${r.whenPh}"`)
  console.log(`     hero rating                : "${r.heroRating}"  count "${r.heroCount}"`)
  console.log(`     reviews subtitle           : "${r.revSub}"`)
  console.log(`     ab-stat (after counter)    : "${r.abStat}"`)
  console.log(`     BTU default / at 60 m²     : "${r.btuDefault}" / "${r.btu60}"`)
  console.log(`     product BTU tags           : ${JSON.stringify(r.prodTag)}`)
  console.log(`     WhatsApp deeplink text     : "${r.ctaText}"`)
  console.log(`     ol.flow aria-label         : "${r.flowLabel}"   #chatpanel aria-label: "${r.panelLabel}"   nav.lang: "${r.langNav}"`)
  console.log(`     non-404 console errors     : ${r.errs.length ? JSON.stringify(r.errs) : '(none)'}`)
}
