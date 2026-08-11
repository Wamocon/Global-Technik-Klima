/**
 * Root-cause probe for the chip-1 dead end: is the miss caused by a MISSING keyword
 * or by an INFLECTED form that substring matching cannot reach?
 */
import { browser, newPage, goHome, DIR } from './lib.mjs'
const PROBES = {
  de: ['Ich möchte ein Angebot', 'Angebot', 'Preis', 'was kostet das', 'Kosten'],
  ru: ['Хочу расчёт стоимости', 'стоимости', 'стоимость', 'цена', 'сколько стоит'],
  en: ['I want a quote', 'quote', 'price', 'how much', 'cost'],
  tr: ['Fiyat teklifi istiyorum', 'teklif', 'fiyat'],
}
const FB = { de: 'Das beantwortet am besten', ru: 'На это лучше ответит', en: 'A specialist can answer that best', tr: 'Bunu en iyi bir uzman' }
const b = await browser()
for (const loc of Object.keys(PROBES)) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await newPage(ctx)
  console.log(`\n[${loc}]`)
  for (const q of PROBES[loc]) {
    await goHome(page, loc)
    await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
    const before = await page.locator('#cbody .msg.bot:not(.typing)').count()
    await page.fill('#cin', q); await page.press('#cin', 'Enter')
    await page.waitForFunction((n) => document.querySelectorAll('#cbody .msg.bot:not(.typing)').length > n, before, { timeout: 8000 })
    const a = (await page.locator('#cbody .msg.bot:not(.typing) .b').last().innerText()).trim()
    const verdict = a.includes(FB[loc]) ? 'FALLBACK  ' : 'matched   '
    console.log(`  ${verdict} "${q}"  ->  ${a.slice(0, 62)}...`)
  }
  await ctx.close()
}
// screenshot the dead end for the report
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await newPage(ctx)
  await goHome(page, 'en')
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  const before = await page.locator('#cbody .msg.bot:not(.typing)').count()
  await page.locator('#cchips button[data-q]').first().click()
  await page.waitForFunction((n) => document.querySelectorAll('#cbody .msg.bot:not(.typing)').length > n, before, { timeout: 8000 })
  await page.locator('#chatpanel').screenshot({ path: `${DIR}/chat-chip1-fallback-en.png` })
  await goHome(page, 'ru')
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  const b2 = await page.locator('#cbody .msg.bot:not(.typing)').count()
  await page.locator('#cchips button[data-q]').first().click()
  await page.waitForFunction((n) => document.querySelectorAll('#cbody .msg.bot:not(.typing)').length > n, b2, { timeout: 8000 })
  await page.locator('#chatpanel').screenshot({ path: `${DIR}/chat-chip1-fallback-ru.png` })
  await ctx.close()
}
await b.close()
