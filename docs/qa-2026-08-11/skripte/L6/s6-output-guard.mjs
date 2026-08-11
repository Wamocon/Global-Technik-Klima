// L6 §2d — is there ANY output-side guard between the LLM reply and the visitor?
// The three hard project rules (no prices, founding year 2021, never the Konya number)
// are enforced at BUILD time on static copy (scripts/guard.mjs). Nothing enforces them
// on the runtime LLM path. Proof: a rule-violating reply renders verbatim.
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L6'
const browser = await chromium.launch()

const VIOLATION = 'Montaj 4.500 TL, bakım 900 TL. Firmamız 1997 yılından beri hizmet veriyor. ' +
  'Bizi arayın: +90 332 325 25 50. Kühlmittel dolumu da yapıyoruz.'

for (const run of [1, 2]) {
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  await page.route('**/api/chat', (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ reply: VIOLATION }) }))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  await page.fill('#cin', 'montaj ne kadar?')
  await page.press('#cin', 'Enter')
  await page.waitForFunction(() => !document.querySelector('#cbody .msg.typing'), null, { timeout: 6000 })
  const rendered = await page.evaluate(() =>
    [...document.querySelectorAll('#cbody .msg.bot .b')].pop().textContent)
  const checks = {
    priceRendered: /4\.500 TL/.test(rendered),
    wrongYearRendered: /1997/.test(rendered),
    konyaNumberRendered: /\+90 332 325 25 50/.test(rendered),
    forbiddenWordRendered: /Kühlmittel/.test(rendered),
    identicalToApiPayload: rendered === VIOLATION,
  }
  console.log(`run${run}: ${JSON.stringify(checks)}`)
  if (run === 1) {
    await page.screenshot({ path: `${DIR}/s2d-no-output-guard.png`, fullPage: false })
    console.log('   rendered verbatim:', JSON.stringify(rendered))
  }
  await ctx.close()
}
await browser.close(); process.exit(0)
