// BLOCK 4b — the hung /api/chat request: how dead is the chat, and does anything recover it?
// Technique: state-transition testing (busy flag as state), negative-path exploration.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info } from './lib.mjs'

const state = `(() => {
  const body = document.getElementById('cbody')
  const msgs = [...body.querySelectorAll('.msg')]
  return {
    msgs: msgs.length,
    me: msgs.filter(m=>m.classList.contains('me')).length,
    bots: msgs.filter(m=>m.classList.contains('bot') && !m.classList.contains('typing')).length,
    typing: msgs.filter(m=>m.classList.contains('typing')).length,
    texts: msgs.map(m=>(m.textContent||'').trim().slice(0,40)),
    inputVal: document.getElementById('cin').value,
    inputDisabled: document.getElementById('cin').disabled,
    panelHidden: document.getElementById('chatpanel').hidden,
    chipsDisplay: getComputedStyle(document.getElementById('cchips')).display,
  }
})()`

async function run(label) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  let hits = 0
  await page.route('**/api/chat', () => { hits++ /* never resolve */ })
  await page.goto(BASE, { waitUntil: 'load' })
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  await page.waitForSelector('#cbody .msg.bot')

  console.log(`\n===== 4h deep — ${label} =====`)
  await page.fill('#cin', 'merhaba 40 m2 salon'); await page.press('#cin', 'Enter')
  await page.waitForSelector('#cbody .msg.typing')
  info(`msg1 sent; typing bubble present; api hits=${hits}`)

  // 2nd message
  await page.fill('#cin', 'ikinci mesaj'); await page.press('#cin', 'Enter')
  await page.waitForTimeout(1200)
  const s2 = await page.evaluate(state)
  info(`after msg2: ${JSON.stringify(s2)}`)
  ok(s2.me === 1, 'msg2 is SILENTLY DROPPED — no user bubble, no error, no feedback', `me bubbles=${s2.me}, input still holds "${s2.inputVal}"`)
  ok(s2.inputVal === 'ikinci mesaj', 'the text stays in the input (only visible sign anything happened)', `"${s2.inputVal}"`)
  info(`api hits after msg2 = ${hits} (a 2nd request was ${hits > 1 ? 'sent' : 'NOT sent'})`)

  // Try the quick-reply chips
  const chipCount = await page.evaluate(() => document.querySelectorAll('#cchips [data-q]').length)
  info(`chips hidden by first send: display=${s2.chipsDisplay} (chips in DOM: ${chipCount})`)

  // Recovery attempt A: close + reopen the panel
  await page.click('#cclose'); await page.waitForSelector('#chatpanel[hidden]', { state: 'attached' })
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  await page.fill('#cin', 'ucuncu mesaj'); await page.press('#cin', 'Enter')
  await page.waitForTimeout(1200)
  const s3 = await page.evaluate(state)
  ok(s3.me >= 2, 'RECOVERY A: closing and reopening the chat revives it', `me=${s3.me} typing=${s3.typing} texts=${JSON.stringify(s3.texts)}`)

  // Recovery attempt B: press Escape (closes) then reopen — same path, verify still dead
  // Recovery attempt C: how long does it stay dead? sample to 45 s
  const t0 = Date.now()
  let recoveredAt = null
  while (Date.now() - t0 < 45000) {
    const s = await page.evaluate(state)
    if (s.typing === 0) { recoveredAt = Date.now() - t0; break }
    await page.waitForTimeout(1000)
  }
  ok(recoveredAt !== null, 'RECOVERY C: chat recovers on its own within 45 s', recoveredAt === null ? 'still stuck at 45 s (no fetch timeout, no AbortController)' : `${recoveredAt}ms`)
  await page.screenshot({ path: `${DIR}/b4b-hung-chat-${label.replace(/\W+/g, '')}.png` })

  // Recovery attempt D: full reload
  await page.unroute('**/api/chat')
  await page.route('**/api/chat', (r) => r.abort('failed'))
  await page.reload({ waitUntil: 'load' })
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  await page.fill('#cin', 'reload sonrasi'); await page.press('#cin', 'Enter')
  const okAfter = await page.waitForSelector('#cbody .msg.bot:not(.typing) >> nth=1', { timeout: 5000 }).then(() => true).catch(() => false)
  ok(okAfter, 'RECOVERY D: a full page reload revives the chat', '')
  info(errs.length ? 'pageerrors: ' + errs.join(' | ') : 'pageerrors: none')
  await b.close()
}

await run('run 1')
await run('run 2')
