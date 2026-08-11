// L2 — NEGATIVE / INVALID INPUT lens · chat assistant
// (a) invalid/hostile/out-of-domain user input  (b) malformed API payloads  (c) double-submit guard
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')

const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L2'
const out = []
const rec = (id, input, expected, actual, pass) => {
  out.push({ id, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${id}\n      input:    ${input}\n      expected: ${expected}\n      actual:   ${actual}`)
}

const BAD = ['undefined', 'null', '[object Object]', 'NaN']

const run = async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.click('#chatfab')
  await page.waitForSelector('#chatpanel:not([hidden])')

  const snap = () => page.evaluate(() => {
    const b = document.getElementById('cbody')
    return {
      me: [...b.querySelectorAll('.msg.me .b')].map((e) => e.textContent),
      bot: [...b.querySelectorAll('.msg.bot .b')].map((e) => e.textContent),
      wa: [...b.querySelectorAll('.msg.wa a')].map((e) => e.getAttribute('href')),
      typing: b.querySelectorAll('.typing').length,
      inputVal: document.getElementById('cin').value,
      totalBubbles: b.querySelectorAll('.msg').length,
    }
  })

  async function ask(text, { expectNoop = false } = {}) {
    const before = await snap()
    await page.fill('#cin', text)
    await page.press('#cin', 'Enter')
    if (expectNoop) {
      // prove nothing happens: no typing indicator appears within a settled network+frame window
      await page.waitForFunction((n) => document.querySelectorAll('#cbody .msg').length === n, before.totalBubbles, { timeout: 1200 })
        .catch(() => {})
      return { before, after: await snap() }
    }
    await page.waitForFunction((n) => document.querySelectorAll('#cbody .msg.bot').length > n,
      before.bot.length, { timeout: 15000 })
    await page.waitForFunction(() => document.querySelectorAll('#cbody .typing').length === 0, null, { timeout: 15000 })
    return { before, after: await snap() }
  }

  // ---------- 1) EMPTY / WHITESPACE ----------
  for (const v of ['', ' ', '   ', '\t', '\u00a0']) {
    const { before, after } = await ask(v, { expectNoop: true })
    rec(`CHAT empty/ws ${JSON.stringify(v)}`, `#cin=${JSON.stringify(v)} + Enter`,
      'no bubble at all, no typing indicator, input untouched or cleared',
      `bubbles ${before.totalBubbles}→${after.totalBubbles}, typing=${after.typing}, inputVal=${JSON.stringify(after.inputVal)}`,
      after.totalBubbles === before.totalBubbles && after.typing === 0)
  }

  // ---------- 2) INVALID CONTENT CLASSES ----------
  const cases = [
    ['emoji only', '😀😀😀'],
    ['punctuation only', '???!!!...'],
    ['single char', 'x'],
    ['unsupported language (zh)', '空调多少钱？安装需要几天？'],
    ['unsupported language (ar)', 'كم سعر تركيب المكيف؟'],
    ['out of domain', "what's the capital of Peru"],
    ['out of domain 2', 'Bana bir şiir yaz'],
    ['hostile', 'Siz tam bir dolandırıcısınız, hiç güvenilmez bir firmasınız'],
    ['control chars', 'test\u0000\u0007\u001b[31m'],
    ['RTL override', 'test\u202eevil\u202c'],
    ['zero-width', 'kli\u200bma mon\u200btaj'],
    ['negation blindness', 'montaj istemiyorum, sadece bakım istiyorum'],
    ['BTU 1000 m2', '1000 m2 salon için hangi klima?'],
    ['BTU negative', '-50 m2 oda'],
    ['BTU 300 m2', '300 m2 salon'],
    ['BTU 0 m2', '0 m2 oda'],
    ['BTU nonnumeric', 'abc m2 oda'],
  ]
  for (const [label, text] of cases) {
    const { before, after } = await ask(text)
    const newBot = after.bot.slice(before.bot.length)
    const bad = newBot.filter((t) => !t || !t.trim() || BAD.some((b) => t.includes(b)))
    rec(`CHAT ${label}`, JSON.stringify(text),
      'exactly 1 user bubble + >=1 non-empty bot bubble, no typing left, no undefined/null/[object Object]',
      `me+1=${after.me.length - before.me.length}, newBot=${JSON.stringify(newBot)}, wa=${after.wa.length - before.wa.length}, typing=${after.typing}`,
      after.me.length - before.me.length === 1 && newBot.length >= 1 && bad.length === 0)
  }

  // ---------- 3) 5000-CHAR MESSAGE ----------
  for (const [label, msg] of [['5000 chars with spaces', ('klima montaj '.repeat(400)).slice(0, 5000)],
    ['5000 chars unbroken token', 'A'.repeat(5000)]]) {
    const { before, after } = await ask(msg)
    const layout = await page.evaluate(() => {
      const b = document.getElementById('cbody')
      const panel = document.getElementById('chatpanel')
      const last = [...b.querySelectorAll('.msg.me .b')].pop()
      const lr = last.getBoundingClientRect(); const pr = panel.getBoundingClientRect()
      return {
        docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        bodyScrollW: b.scrollWidth, bodyClientW: b.clientWidth,
        bubbleRight: Math.round(lr.right), panelRight: Math.round(pr.right),
        bubbleW: Math.round(lr.width), panelW: Math.round(pr.width),
      }
    })
    const newBot = after.bot.slice(before.bot.length)
    rec(`CHAT ${label}`, `${msg.length} chars`,
      'answered, no document horizontal overflow, bubble stays inside the panel',
      `newBot=${JSON.stringify(newBot.map((t) => t.slice(0, 40)))} · layout=${JSON.stringify(layout)}`,
      newBot.length >= 1 && layout.docOverflow <= 0 && layout.bubbleRight <= layout.panelRight + 1 && layout.bodyScrollW <= layout.bodyClientW + 1)
    if (label.includes('unbroken')) await page.screenshot({ path: DIR + '/chat_5000_unbroken.png' })
  }
  const noMaxlen = await page.evaluate(() => ({ maxlength: document.getElementById('cin').getAttribute('maxlength') }))
  rec('CHAT input maxlength', 'attribute probe on #cin',
    'a bound (api/chat.js rejects >800 chars, so the UI should stop before that)',
    JSON.stringify(noMaxlen), noMaxlen.maxlength !== null)

  // ---------- 4) DOUBLE SUBMIT (busy guard) ----------
  // widen the busy window so the race is deterministic
  await page.route('**/api/chat', async (r) => { await new Promise((s) => setTimeout(s, 900)); await r.fulfill({ status: 404, body: 'nf' }) })
  for (const attempt of [1, 2]) {
    const before = await snap()
    const res = await page.evaluate(() => {
      const i = document.getElementById('cin'), f = document.getElementById('cform')
      i.value = 'ilk mesaj bakim'
      f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      i.value = 'ikinci mesaj garanti'
      f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      return { inputAfter: i.value, meNow: document.querySelectorAll('#cbody .msg.me').length }
    })
    await page.waitForFunction(() => document.querySelectorAll('#cbody .typing').length === 0, null, { timeout: 15000 })
    const after = await snap()
    const newMe = after.me.slice(before.me.length)
    rec(`CHAT double-submit same tick (run ${attempt})`,
      'submit "ilk mesaj bakim" then immediately "ikinci mesaj garanti" (same tick, busy window widened to 900 ms)',
      'either both processed in order, or the 2nd rejected WITH the text preserved and visible feedback — never silently dropped',
      `newMe=${JSON.stringify(newMe)} · inputValue right after=${JSON.stringify(res.inputAfter)} · inputValue at end=${JSON.stringify(after.inputVal)} · newBot=${after.bot.length - before.bot.length}`,
      newMe.length === 2 || (newMe.length === 1 && after.inputVal.includes('ikinci')))
  }
  await page.unroute('**/api/chat')

  // ---------- 5) MALFORMED API PAYLOADS ----------
  const payloads = [
    ['empty object {}', { status: 200, contentType: 'application/json', body: '{}' }],
    ['reply:null', { status: 200, contentType: 'application/json', body: '{"reply":null}' }],
    ['reply:""', { status: 200, contentType: 'application/json', body: '{"reply":""}' }],
    ['reply:123', { status: 200, contentType: 'application/json', body: '{"reply":123}' }],
    ['reply:{}', { status: 200, contentType: 'application/json', body: '{"reply":{"a":1}}' }],
    ['reply:[]', { status: 200, contentType: 'application/json', body: '{"reply":["a","b"]}' }],
    ['reply:true', { status: 200, contentType: 'application/json', body: '{"reply":true}' }],
    ['non-JSON body', { status: 200, contentType: 'text/html', body: '<html>not json</html>' }],
    ['HTTP 500', { status: 500, contentType: 'application/json', body: '{"error":"boom"}' }],
    ['HTTP 200 empty body', { status: 200, contentType: 'application/json', body: '' }],
    ['HTTP 429 rate limit', { status: 429, contentType: 'application/json', body: '{"error":"rate"}' }],
    ['reply valid + wa null', { status: 200, contentType: 'application/json', body: '{"reply":"Merhaba, nasil yardimci olabilirim?","wa":null}' }],
  ]
  for (const [label, resp] of payloads) {
    await page.route('**/api/chat', (r) => r.fulfill(resp))
    for (const attempt of [1, 2]) {
      const { before, after } = await ask('klima bakimi ne kadar surer')
      const newBot = after.bot.slice(before.bot.length)
      const joined = newBot.join(' | ')
      const bad = BAD.filter((b) => joined.includes(b))
      const empty = newBot.filter((t) => !t || !t.trim())
      rec(`API ${label} (run ${attempt})`, `route /api/chat → ${JSON.stringify(resp).slice(0, 90)}`,
        'client degrades to a real answer: non-empty bot bubble, no undefined/null/[object Object], typing indicator gone',
        `newBot=${JSON.stringify(newBot.map((t) => t.slice(0, 70)))} typing=${after.typing} badTokens=${JSON.stringify(bad)}`,
        newBot.length >= 1 && empty.length === 0 && bad.length === 0 && after.typing === 0)
    }
    await page.unroute('**/api/chat')
  }

  // ---------- 6) NETWORK ABORT / HANG ----------
  await page.route('**/api/chat', (r) => r.abort('connectionrefused'))
  {
    const { before, after } = await ask('garanti kac yil')
    const newBot = after.bot.slice(before.bot.length)
    rec('API aborted connection', 'route → abort(connectionrefused)', 'falls back to local answer',
      `newBot=${JSON.stringify(newBot.map((t) => t.slice(0, 60)))} typing=${after.typing}`,
      newBot.length >= 1 && after.typing === 0)
  }
  await page.unroute('**/api/chat')

  // hang forever → typing indicator must not be stuck (documented expectation)
  await page.route('**/api/chat', () => { /* never fulfilled */ })
  {
    await page.fill('#cin', 'montaj fiyati')
    await page.press('#cin', 'Enter')
    await page.waitForSelector('#cbody .typing')
    const stuck = await page.waitForFunction(() => document.querySelectorAll('#cbody .typing').length === 0, null, { timeout: 8000 })
      .then(() => false).catch(() => true)
    const s = await snap()
    rec('API request never resolves (hang)', 'route handler never fulfils the request',
      'a timeout so the "…" indicator cannot stay forever',
      `typing indicator still present after 8 s: ${stuck} · typing=${s.typing} · bubbles=${s.totalBubbles}`,
      stuck === false)
    if (stuck) await page.screenshot({ path: DIR + '/DEF_chat_typing_stuck.png' })
  }
  await page.unroute('**/api/chat')

  console.log('\nconsole errors: ' + (errs.length ? errs.join('\n') : '(none)'))
  const f = out.filter((o) => !o.pass)
  console.log(`\n=== ${out.length} cases · ${out.length - f.length} pass · ${f.length} fail ===`)
  f.forEach((x) => console.log('  FAIL ' + x.id))
  await browser.close()
}
run().catch((e) => { console.error(e); process.exit(1) })
