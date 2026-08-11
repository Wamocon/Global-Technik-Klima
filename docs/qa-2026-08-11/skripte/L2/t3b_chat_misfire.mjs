// L2 — NEGATIVE lens · chat: false-positive intent matching + number-grabbing regex + busy deadlock
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')
const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L2'

const run = async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })

  // -------- A) intent misfire on invalid/negative user utterances --------
  const probe = async (locale, list) => {
    const page = await ctx.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push(String(e)))
    await page.goto(BASE + (locale === 'tr' ? '/' : `/${locale}/`), { waitUntil: 'networkidle' })
    await page.click('#chatfab')
    await page.waitForSelector('#chatpanel:not([hidden])')
    const res = []
    for (const [label, msg, wanted] of list) {
      const before = await page.evaluate(() => document.querySelectorAll('#cbody .msg.bot').length)
      await page.fill('#cin', msg)
      await page.press('#cin', 'Enter')
      await page.waitForFunction((n) => document.querySelectorAll('#cbody .msg.bot').length > n, before, { timeout: 15000 })
      await page.waitForFunction(() => document.querySelectorAll('#cbody .typing').length === 0)
      const got = await page.evaluate(() => {
        const b = [...document.querySelectorAll('#cbody .msg.bot .b')].pop().textContent
        const wa = document.querySelectorAll('#cbody .msg.wa').length
        return { b, wa }
      })
      res.push({ locale, label, msg, wanted, answer: got.b, waButtons: got.wa })
    }
    await page.close()
    return { res, errs }
  }

  const trCases = [
    ['negative feedback ("hiç")', 'Hiç memnun kalmadım, çok kötü bir deneyim yaşadım', 'complaint → handoff to a human'],
    ['negative feedback 2', 'Hiçbir şey anlamadım', 'fallback → handoff'],
    ['intermittent fault ("arada")', 'Klimam arada bir kendi kendine duruyor, ne olabilir?', 'fault answer'],
    ['cancel request', 'Randevumu iptal etmek istiyorum', 'handoff to a human'],
    ['complaint about staff', 'Teknisyeniniz gelmedi, şikayet etmek istiyorum', 'handoff to a human'],
    ['phone number + area', '0242 513 86 51 numarasından beni arayın, 80 m2 salon için klima lazım', 'BTU for 80 m² (≈48.000)'],
    ['time + area', 'Cumartesi 12:00 uygun, 60 m2 oda için klima istiyorum', 'BTU for 60 m² (≈36.000)'],
    ['date + area', '15.09.2026 tarihinde 90 m2 salon için keşif', 'BTU for 90 m² (≈48.000)'],
    ['1000 m2', '1000 m2 depo için klima', 'too large → hand to a human, not a household unit'],
  ]
  const enCases = [
    ['price question w/o keyword', 'Which is cheapest?', 'price answer or fallback → handoff'],
    ['negation', 'I do not want installation, only a repair', 'repair answer'],
    ['complaint', 'This is the worst service, I am very unhappy', 'handoff to a human'],
  ]
  const deCases = [
    ['complaint', 'Ich bin sehr unzufrieden mit Ihrem Service', 'handoff to a human'],
    ['negation', 'Ich will keine Montage, nur eine Reparatur', 'repair answer'],
  ]

  for (const attempt of [1, 2]) {
    console.log(`\n########## INTENT MISFIRE PROBE — run ${attempt} ##########`)
    for (const [loc, list] of [['tr', trCases], ['en', enCases], ['de', deCases]]) {
      const { res, errs } = await probe(loc, list)
      for (const r of res) {
        console.log(`[${r.locale}] ${r.label}\n   msg: ${JSON.stringify(r.msg)}\n   want: ${r.wanted}\n   got : ${JSON.stringify(r.answer.slice(0, 130))}  (wa buttons total: ${r.waButtons})`)
      }
      if (errs.length) console.log('  pageerrors: ' + errs.join('; '))
    }
  }

  // -------- B) busy-flag deadlock after a hung request --------
  for (const attempt of [1, 2]) {
    const page = await ctx.newPage()
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.click('#chatfab')
    await page.waitForSelector('#chatpanel:not([hidden])')
    let hang = true
    await page.route('**/api/chat', async (r) => { if (hang) { /* never fulfil */ } else r.fulfill({ status: 404, body: 'x' }) })
    await page.fill('#cin', 'birinci soru montaj')
    await page.press('#cin', 'Enter')
    await page.waitForSelector('#cbody .typing')
    hang = false // endpoint is healthy again
    // now try 3 further, perfectly normal questions
    for (const q of ['garanti kac yil', 'calisma saatleri', 'adresiniz nerede']) {
      await page.fill('#cin', q)
      await page.press('#cin', 'Enter')
    }
    const st = await page.evaluate(() => ({
      me: [...document.querySelectorAll('#cbody .msg.me .b')].map((e) => e.textContent),
      bot: document.querySelectorAll('#cbody .msg.bot').length,
      typing: document.querySelectorAll('#cbody .typing').length,
      input: document.getElementById('cin').value,
    }))
    console.log(`\nBUSY-DEADLOCK run ${attempt}: after one hung request, 3 further questions →`, JSON.stringify(st))
    console.log(`   VERDICT: ${st.me.length === 1 && st.typing === 1 ? 'chat is DEAD — no further message is accepted, "…" stays' : 'recovered'}`)
    if (attempt === 1) {
      await page.locator('#chatpanel').screenshot({ path: DIR + '/DEF_chat_busy_deadlock.png' })
      // does closing + reopening the panel recover it?
      await page.click('#cclose'); await page.click('#chatfab')
      await page.waitForSelector('#chatpanel:not([hidden])')
      await page.fill('#cin', 'garanti kac yil')
      await page.press('#cin', 'Enter')
      const after = await page.evaluate(() => document.querySelectorAll('#cbody .msg.me').length)
      console.log('   after close+reopen, user bubbles =', after, '(1 = still dead, 2 = recovered)')
    }
    await page.close()
  }

  await browser.close()
}
run().catch((e) => { console.error(e); process.exit(1) })
