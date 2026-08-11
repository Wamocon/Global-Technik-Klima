// BLOCK 4 — chat API failure modes. Technique: decision-table / fault injection on the endpoint,
// with a state-transition check on the (bot,typing,busy) triple.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info, poll } from './lib.mjs'

const state = `(() => {
  const body = document.getElementById('cbody')
  const msgs = [...body.querySelectorAll('.msg')]
  return {
    msgCount: msgs.length,
    typing: body.querySelectorAll('.msg.typing').length,
    bots: msgs.filter(m => m.classList.contains('bot') && !m.classList.contains('typing')).length,
    me: msgs.filter(m => m.classList.contains('me')).length,
    wa: msgs.filter(m => m.classList.contains('wa')).length,
    last: msgs.length ? (msgs[msgs.length-1].textContent||'').trim().slice(0,90) : null,
    inputDisabled: document.getElementById('cin').disabled,
    inputAriaBusy: document.getElementById('cin').getAttribute('aria-busy'),
    submitDisabled: document.querySelector('#cform button[type=submit]').disabled,
    formAriaBusy: document.getElementById('cform').getAttribute('aria-busy'),
  }
})()`

async function openChat(page) {
  await page.click('#chatfab')
  await page.waitForSelector('#chatpanel:not([hidden])')
  await page.waitForSelector('#cbody .msg.bot')
}

async function send(page, text) {
  await page.fill('#cin', text)
  await page.press('#cin', 'Enter')
}

async function runCase(name, handler, { firstMsg = '3 kişilik 40 m2 salon', secondMsg = 'montaj ne kadar sürer', waitMs = 9000 } = {}) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text()) })
  await page.route('**/api/chat', handler)
  await page.goto(BASE, { waitUntil: 'load' })
  await openChat(page)
  const s0 = await page.evaluate(state)

  const t0 = Date.now()
  await send(page, firstMsg)
  // Wait (bounded) for a non-typing bot answer to appear
  const got = await poll(async () => {
    const s = await page.evaluate(state)
    return s.bots >= 2 && s.typing === 0
  }, { timeout: waitMs, interval: 120 })
  const s1 = await page.evaluate(state)
  const t1 = Date.now() - t0

  // Second message: is the chat still alive?
  await send(page, secondMsg)
  const got2 = await poll(async () => {
    const s = await page.evaluate(state)
    return s.me >= 2 && s.bots >= 3 && s.typing === 0
  }, { timeout: 6000, interval: 120 })
  const s2 = await page.evaluate(state)

  console.log(`\n===== ${name} =====`)
  info(`start: ${JSON.stringify(s0)}`)
  info(`msg1 answered=${got.ok} after ${t1}ms -> ${JSON.stringify(s1)}`)
  info(`msg2 answered=${got2.ok} -> ${JSON.stringify(s2)}`)
  info(errs.length ? 'errors: ' + [...new Set(errs)].slice(0, 4).join(' | ') : 'errors: none')
  ok(got.ok, `${name}: user gets an answer for message 1`, `${t1}ms`)
  ok(s1.typing === 0, `${name}: typing bubble removed`, `typing=${s1.typing}`)
  ok(s1.inputDisabled === false, `${name}: input usable`, `disabled=${s1.inputDisabled}`)
  ok(got2.ok, `${name}: a SECOND message still works (busy flag released)`, `me=${s2.me} bots=${s2.bots} typing=${s2.typing}`)
  if (!got.ok || !got2.ok) await page.screenshot({ path: `${DIR}/b4-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png` })
  await b.close()
  return { s0, s1, s2, got, got2, t1, errs }
}

const R = {}

R.abort = await runCase('4a connection refused (abort)', (r) => r.abort('connectionrefused'))
R.e500 = await runCase('4b HTTP 500', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' }))
R.e429 = await runCase('4c HTTP 429 rate limited', (r) => r.fulfill({ status: 429, contentType: 'application/json', body: '{"error":"rate"}' }))
R.html = await runCase('4d 200 with content-type text/html', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><h1>hi</h1>' }))
R.empty = await runCase('4e 200 with empty body', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '' }))
R.nullreply = await runCase('4f 200 with {"reply":null}', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"reply":null}' }))
R.slow30 = await runCase('4g 200 delayed 30s', async (r) => {
  await new Promise((res) => setTimeout(res, 30000)); await r.fulfill({ status: 200, contentType: 'application/json', body: '{"reply":"late answer"}' })
}, { waitMs: 34000 })
R.hung = await runCase('4h request that never resolves', () => { /* never call fulfill/abort/continue */ }, { waitMs: 20000 })
