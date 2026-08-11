// Evidence: on ONE English page, the calculator and the chat disagree on number format.
import { browser, newPage, goHome, DIR, ok, eq, summary } from './lib.mjs'
const b = await browser()
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await newPage(ctx)
await goHome(page, 'en')
await page.locator('#kesif').scrollIntoViewIfNeeded()
await page.locator('#ca').fill('60'); await page.locator('#cp').fill('2')
await page.waitForFunction(() => document.getElementById('cbtu').textContent.replace(/\D/g, '') === '36000', null, { timeout: 3000 })
const calc = (await page.locator('#kesif .result .rv').innerText()).trim()

await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
const before = await page.locator('#cbody .msg.bot:not(.typing)').count()
await page.fill('#cin', 'room 60 square metres'); await page.press('#cin', 'Enter')
await page.waitForFunction((n) => document.querySelectorAll('#cbody .msg.bot:not(.typing)').length > n, before, { timeout: 8000 })
const chat = (await page.locator('#cbody .msg.bot:not(.typing) .b').last().innerText()).trim()

console.log('  calculator says :', calc)
console.log('  chat says       :', chat.slice(0, 60))
const calcNum = calc.match(/[\d.,]+/)[0]
const chatNum = chat.match(/[\d.,]+/)[0]
eq('same numeric value from both engines', [calcNum.replace(/\D/g, ''), chatNum.replace(/\D/g, '')], ['36000', '33000'])
ok('calculator and chat use the SAME thousands separator on one page',
  (calcNum.includes(',') === chatNum.includes(',')) && (calcNum.includes('.') === chatNum.includes('.')),
  `calculator="${calcNum}"  chat="${chatNum}"`)
await page.screenshot({ path: `${DIR}/btu-contradiction-en.png`, fullPage: false })
await ctx.close(); await b.close()
summary('probe-btu-contradiction')
