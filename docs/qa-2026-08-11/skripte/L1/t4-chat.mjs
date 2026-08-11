/**
 * L1-B4  Technique: use-case (scenario) testing end-to-end + intent-coverage
 *        (each documented intent class reached at least once per locale) +
 *        state-transition on the panel (closed -> open -> answered -> closed).
 * Coverage criterion: open/greet/disclosure/3 chips; 3 free-text intent classes
 *        (area->BTU, price, handoff) × 4 locales; close via button and via Escape;
 *        LLM path via route interception.
 */
import { LOCALES, goHome, newPage, browser, ok, eq, summary, DIR, unexpected404s, nbsp } from './lib.mjs'

const WA = '905330461387'

// Locale-specific free text, one per intent class.
const FREETEXT = {
  tr: { area: '25 m2 oda', price: 'montaj fiyatı ne kadar?', human: 'bir insanla görüşmek istiyorum' },
  de: { area: 'Raum 25 qm', price: 'was kostet die Montage?', human: 'ich möchte mit einem Mitarbeiter sprechen' },
  ru: { area: '25 кв м комната', price: 'сколько стоит монтаж?', human: 'хочу поговорить с человеком' },
  en: { area: 'room 25 square metres', price: 'how much does installation cost?', human: 'I want to talk to a human' },
}
// Expected canned answers (first 30 chars is enough to pin the branch).
const PRICE_A = {
  tr: 'Montaj ve servis için sabit fiyat vermiyoruz',
  ru: 'Фиксированную цену на монтаж и сервис не называем',
  de: 'Für Montage und Service nennen wir keinen Festpreis',
  en: 'We don’t quote a fixed price upfront',
}
const HANDOFF_A = {
  tr: 'sizi hemen bir yetkiliye bağlıyorum',
  ru: 'соединяю вас с менеджером',
  de: 'ich verbinde Sie mit einem Mitarbeiter',
  en: 'I’ll connect you to a person',
}
const FALLBACK_A = {
  tr: 'Bunu en iyi bir uzmanımız yanıtlar',
  ru: 'На это лучше ответит наш специалист',
  de: 'Das beantwortet am besten ein Fachmann von uns',
  en: 'A specialist can answer that best',
}
const WA_BTN = { tr: 'WhatsApp’tan yaz', ru: 'Написать в WhatsApp', de: 'Über WhatsApp schreiben', en: 'Message on WhatsApp' }
// Chat computeBtu: area*550, no people, snap. 25 -> 13750 -> nearest of steps = 12000
// Displayed with the PAGE locale's grouping (Assistant.astro computeBtu). NBSP-normalised.
const BTU_FOR_25 = { tr: '12.000', de: '12.000', ru: '12 000', en: '12,000' }

/**
 * The three suggestion chips are the site's OWN canned questions, so each one has a
 * documented intended answer. Chip 1 = price, chip 2 = maintenance, chip 3 = products.
 * A chip that lands on FALLBACK_A is a dead end the operator put there himself.
 */
const CHIP_EXPECT = {
  tr: ['price', 'bakim', 'products'],
  de: ['price', 'bakim', 'products'],
  ru: ['price', 'bakim', 'products'],
  en: ['price', 'bakim', 'products'],
}
const BAKIM_A = {
  tr: 'Bakımda filtre ve eşanjörü temizler',
  ru: 'При обслуживании чистим фильтры и теплообменник',
  de: 'Bei der Wartung reinigen wir Filter und Wärmetauscher',
  en: 'Maintenance: we clean filters and heat exchanger',
}
const PRODUCTS_A = {
  tr: 'Gree programını taşıyoruz',
  ru: 'Мы возим весь ряд Gree',
  de: 'Wir führen das Gree-Programm',
  en: 'We carry the Gree range',
}
const EXPECTED_TEXT = (loc, id) => ({ price: PRICE_A[loc], bakim: BAKIM_A[loc], products: PRODUCTS_A[loc] }[id])

/** send free text, wait for the bot bubble count to grow, return the last bot text */
async function ask(page, text) {
  const before = await page.locator('#cbody .msg.bot:not(.typing)').count()
  await page.fill('#cin', text)
  await page.press('#cin', 'Enter')
  await page.waitForFunction(
    (n) => document.querySelectorAll('#cbody .msg.bot:not(.typing)').length > n,
    before, { timeout: 8000 })
  const bubbles = page.locator('#cbody .msg.bot:not(.typing) .b')
  return (await bubbles.last().innerText()).trim()
}

const b = await browser()
for (const loc of LOCALES) {
  console.log(`\n--- chat, locale ${loc} ---`)
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await newPage(ctx)
  await goHome(page, loc)

  // --- open ---
  ok(`[${loc}] panel hidden before open`, await page.locator('#chatpanel').isHidden())
  eq(`[${loc}] fab aria-expanded=false`, await page.getAttribute('#chatfab', 'aria-expanded'), 'false')
  await page.click('#chatfab')
  await page.waitForSelector('#chatpanel:not([hidden])', { timeout: 3000 })
  ok(`[${loc}] panel visible after fab click`, await page.locator('#chatpanel').isVisible())
  eq(`[${loc}] fab aria-expanded=true`, await page.getAttribute('#chatfab', 'aria-expanded'), 'true')
  await page.waitForFunction(() => document.activeElement?.id === 'cin', null, { timeout: 3000 }).catch(() => {})
  ok(`[${loc}] input focused on open`, await page.evaluate(() => document.activeElement?.id === 'cin'))

  const greeting = (await page.locator('#cbody .msg.bot .b').first().innerText()).trim()
  ok(`[${loc}] greeting non-empty`, greeting.length > 10, `greeting="${greeting}"`)
  const disc = (await page.locator('.cdisc').innerText()).trim()
  ok(`[${loc}] AI disclosure present`, disc.length > 20, `disc="${disc}"`)
  ok(`[${loc}] AI disclosure mentions AI`, /yapay zek|искусственн|ИИ|KI-|künstlich|AI |AI assistant|AI-/i.test(disc), `disc="${disc}"`)
  const chips = await page.locator('#cchips button[data-q]').allInnerTexts()
  eq(`[${loc}] 3 suggestion chips`, chips.length, 3)
  ok(`[${loc}] chips all non-empty`, chips.every((c) => c.trim().length > 3), JSON.stringify(chips))

  // --- each chip must produce a specific (non-fallback) answer ---
  for (let i = 0; i < 3; i++) {
    // reload to reset chips (they hide after first answer)
    if (i > 0) { await goHome(page, loc); await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])') }
    const chipBtns = page.locator('#cchips button[data-q]')
    const q = (await chipBtns.nth(i).getAttribute('data-q')) || ''
    const before = await page.locator('#cbody .msg.bot:not(.typing)').count()
    await chipBtns.nth(i).click()
    await page.waitForFunction((n) => document.querySelectorAll('#cbody .msg.bot:not(.typing)').length > n, before, { timeout: 8000 })
    const answer = (await page.locator('#cbody .msg.bot:not(.typing) .b').last().innerText()).trim()
    ok(`[${loc}] chip ${i + 1} ("${q.slice(0, 28)}") echoed as user msg`,
      (await page.locator('#cbody .msg.me .b').last().innerText()).trim() === q.trim())
    ok(`[${loc}] chip ${i + 1} produced an answer`, answer.length > 15, `answer="${answer}"`)
    const isFallback = answer.includes(FALLBACK_A[loc])
    const wantId = CHIP_EXPECT[loc][i]
    const want = EXPECTED_TEXT(loc, wantId)
    ok(`[${loc}] chip ${i + 1} matched a specific intent (not generic fallback)`, !isFallback, `answer="${answer}"`)
    ok(`[${loc}] chip ${i + 1} answered with the '${wantId}' intent`, answer.includes(want),
      `chip="${q}" want~"${want}" got="${answer}"`)
    ok(`[${loc}] chips hidden after answering`, await page.locator('#cchips').evaluate((e) => getComputedStyle(e).display === 'none'))
    if (isFallback) await page.screenshot({ path: `${DIR}/chat-chip${i + 1}-fallback-${loc}.png` })
  }

  // --- free text: area question -> BTU + WhatsApp handoff ---
  await goHome(page, loc)
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  let a = await ask(page, FREETEXT[loc].area)
  console.log(`      area q "${FREETEXT[loc].area}" -> "${a}"`)
  ok(`[${loc}] area question returns a BTU number`, /\d[\d.,\s]*\s*BTU/.test(a), `answer="${a}"`)
  eq(`[${loc}] area question BTU value = ${BTU_FOR_25[loc]} (locale grouping)`, nbsp(a).includes(BTU_FOR_25[loc]), true)
  const waBtn = page.locator('#cbody .msg.wa a').last()
  ok(`[${loc}] area answer offers WhatsApp handoff button`, await waBtn.count() > 0)
  const href = await waBtn.getAttribute('href')
  ok(`[${loc}] handoff href uses wa.me/${WA}`, (href || '').startsWith(`https://wa.me/${WA}`), `href=${href}`)
  ok(`[${loc}] handoff payload carries area + BTU`, decodeURIComponent(href).includes('25 m²') && /BTU/.test(decodeURIComponent(href)), `payload=${decodeURIComponent(href)}`)
  eq(`[${loc}] handoff button label localized`, (await waBtn.innerText()).trim(), WA_BTN[loc])
  eq(`[${loc}] handoff link rel/target`, [await waBtn.getAttribute('target'), await waBtn.getAttribute('rel')], ['_blank', 'noopener'])

  // --- free text: price -> canned price answer + WhatsApp ---
  a = await ask(page, FREETEXT[loc].price)
  console.log(`      price q -> "${a}"`)
  ok(`[${loc}] price question returns the canned no-price answer`, a.includes(PRICE_A[loc]), `answer="${a}"`)
  ok(`[${loc}] price answer contains no numeric price`, !/\d+\s*(TL|₺|EUR|€|\$)/i.test(a), `answer="${a}"`)
  ok(`[${loc}] price answer offers WhatsApp button`, (await page.locator('#cbody .msg.wa a').count()) >= 2)

  // --- free text: human handoff ---
  a = await ask(page, FREETEXT[loc].human)
  console.log(`      human q -> "${a}"`)
  ok(`[${loc}] handoff question returns the handoff answer`, a.includes(HANDOFF_A[loc]), `answer="${a}"`)
  ok(`[${loc}] handoff answer offers WhatsApp button`, (await page.locator('#cbody .msg.wa a').count()) >= 3)

  // --- close via #cclose ---
  await page.click('#cclose')
  await page.waitForFunction(() => document.getElementById('chatpanel').hidden, null, { timeout: 3000 })
  ok(`[${loc}] closes via #cclose`, await page.locator('#chatpanel').isHidden())
  eq(`[${loc}] aria-expanded=false after close`, await page.getAttribute('#chatfab', 'aria-expanded'), 'false')

  // --- close via Escape ---
  await page.click('#chatfab')
  await page.waitForSelector('#chatpanel:not([hidden])', { timeout: 3000 })
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.getElementById('chatpanel').hidden, null, { timeout: 3000 }).catch(() => {})
  ok(`[${loc}] closes via Escape`, await page.locator('#chatpanel').isHidden())

  ok(`[${loc}] no console/page errors during chat flow`, page.__errors.length === 0, page.__errors.join(' | '))
  ok(`[${loc}] no unexpected 404s (only /api/chat allowed)`, unexpected404s(page).length === 0, unexpected404s(page).join(' | '))
  ok(`[${loc}] /api/chat 404 fallback engaged (documented state)`, page.__http404.some((u) => u.includes('/api/chat')), `404s=${JSON.stringify(page.__http404)}`)
  await ctx.close()
}

// --- LLM-backed path: intercept /api/chat and assert the server reply wins ---
console.log('\n--- LLM path (route-intercepted /api/chat) ---')
for (const loc of ['tr', 'en']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await newPage(ctx)
  let seenBody = null
  await page.route('**/api/chat', async (route) => {
    seenBody = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ reply: `SERVER-REPLY-${loc.toUpperCase()} 42`, wa: `https://wa.me/${WA}?text=from-server` }) })
  })
  await goHome(page, loc)
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  const a = await ask(page, FREETEXT[loc].area)
  ok(`[${loc}] LLM reply rendered instead of the local answer`, a === `SERVER-REPLY-${loc.toUpperCase()} 42`, `answer="${a}"`)
  eq(`[${loc}] request body sent to /api/chat`, seenBody, { message: FREETEXT[loc].area, locale: loc })
  const href = await page.locator('#cbody .msg.wa a').last().getAttribute('href')
  ok(`[${loc}] server-supplied wa link used`, href === `https://wa.me/${WA}?text=from-server`, `href=${href}`)
  ok(`[${loc}] no console/page errors on LLM path`, page.__errors.length === 0, page.__errors.join(' | '))
  ok(`[${loc}] no 404 at all when /api/chat is served`, page.__http404.length === 0, page.__http404.join(' | '))
  await ctx.close()
}
await b.close()
summary('t4-chat')
