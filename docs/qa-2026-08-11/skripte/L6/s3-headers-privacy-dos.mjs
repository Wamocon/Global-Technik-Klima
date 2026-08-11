// L6 SECURITY §5 headers+clickjacking · §6 privacy/third-party · §7 client DoS
// · §2c cross-origin denial-of-wallet against the REAL api/chat.js handler.
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import http from 'node:http'
import { pathToFileURL } from 'node:url'

const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L6'
let pass = 0, fail = 0
const check = (n, ok, d) => { ok ? pass++ : fail++; console.log(`${ok ? '  ok ' : ' FAIL'} ${n}  ::  ${d}`) }

const browser = await chromium.launch()

// ══════════════════════════════ §5 headers as actually served ══════════════
{
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  const resp = await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  const h = resp.headers()
  console.log('   served headers:', JSON.stringify(h, null, 0))
  for (const [name, key] of [
    ['Content-Security-Policy', 'content-security-policy'],
    ['X-Frame-Options', 'x-frame-options'],
    ['X-Content-Type-Options', 'x-content-type-options'],
    ['Referrer-Policy', 'referrer-policy'],
    ['Permissions-Policy', 'permissions-policy'],
    ['Strict-Transport-Security', 'strict-transport-security'],
  ]) check(`§5 header present: ${name}`, key in h, `${key}=${h[key] ?? 'ABSENT'}`)
  await ctx.close()
}

// ══════════════════════════════ §5b clickjacking: frame it cross-origin ════
const attacker = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' })
  res.end(`<!doctype html><title>clickjack</title>
    <h1>attacker page on :4399</h1>
    <iframe id="v" src="${BASE}/" width="1100" height="700" style="opacity:.35"></iframe>
    <button id="overlay" style="position:absolute;top:300px;left:300px;z-index:9;padding:30px">FREE GIFT</button>`)
})
await new Promise((r) => attacker.listen(4399, r))
{
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  const blocked = []
  page.on('console', (m) => { if (/refused to (display|frame)|X-Frame-Options|frame-ancestors/i.test(m.text())) blocked.push(m.text()) })
  await page.goto('http://localhost:4399/', { waitUntil: 'networkidle' })
  const framed = await page.evaluate(async () => {
    const f = document.getElementById('v')
    // Same-origin? no. So we can only observe whether it rendered at all.
    return { w: f.clientWidth, h: f.clientHeight }
  })
  // Read the framed document via Playwright's frame API (works even cross-origin)
  const frames = page.frames().filter((f) => f.url().startsWith(BASE))
  let inner = null
  if (frames.length) {
    inner = await frames[0].evaluate(() => ({
      title: document.title.slice(0, 40),
      hasChatFab: !!document.getElementById('chatfab'),
      hasForm: !!document.getElementById('reqForm'),
      topIsSelf: window.top === window.self,
    })).catch((e) => ({ err: e.message }))
  }
  check('§5b site CANNOT be framed by a foreign origin (clickjacking defence)',
    frames.length === 0 || !!blocked.length,
    `framesLoaded=${frames.length} innerDoc=${JSON.stringify(inner)} browserBlockMsgs=${blocked.length}`)
  await page.screenshot({ path: `${DIR}/s5b-clickjacking.png`, fullPage: false })
  await ctx.close()
}

// ══════════════════════════════ §2c cross-origin abuse of api/chat.js ══════
{
  process.env.ANTHROPIC_API_KEY = 'sk-ant-FAKE'
  let upstreamCalls = 0
  const realFetch = globalThis.fetch.bind(globalThis)
  globalThis.fetch = async () => { upstreamCalls++; return { ok: true, json: async () => ({ content: [{ text: 'ok' }] }) } }
  const { default: handler } = await import(pathToFileURL('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/api/chat.js').href)
  const api = http.createServer(async (req, res) => {
    let raw = ''
    for await (const c of req) raw += c
    // emulate Vercel's body parsing: JSON for application/json, string otherwise
    const ct = req.headers['content-type'] || ''
    req.body = ct.includes('application/json') ? (() => { try { return JSON.parse(raw) } catch { return {} } })() : raw
    const shim = {
      status(c) { res.statusCode = c; return shim },
      setHeader(k, v) { res.setHeader(k, v); return shim },
      json(o) { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(o)); return shim },
    }
    try { await handler(req, shim) } catch (e) {
      res.statusCode = 500; res.setHeader('content-type', 'text/html')
      res.end(`<pre>UNHANDLED: ${e && e.stack ? String(e.stack) : String(e)}</pre>`)
    }
  })
  await new Promise((r) => api.listen(4400, r))

  const evil = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(`<!doctype html><title>evil</title><script>
      window.__done = 0; window.__err = [];
      (async () => {
        for (let i = 0; i < 20; i++) {
          try {
            // text/plain is CORS-safelisted → NO preflight. Handler JSON.parses strings.
            await fetch('http://localhost:4400/api/chat', {
              method: 'POST', mode: 'no-cors',
              headers: { 'content-type': 'text/plain' },
              body: JSON.stringify({ message: 'burn budget ' + i, locale: 'tr' }),
            })
          } catch (e) { window.__err.push(String(e)) }
          window.__done++
        }
      })()
    </script>`)
  })
  await new Promise((r) => evil.listen(4401, r))

  const ctx = await browser.newContext(); const page = await ctx.newPage()
  const seen = []
  page.on('request', (r) => { if (r.url().includes('4400')) seen.push(r.method()) })
  upstreamCalls = 0
  await page.goto('http://localhost:4401/', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__done >= 20, null, { timeout: 20000 })
  const errs = await page.evaluate(() => window.__err)
  console.log(`   methods the browser sent to the API: ${JSON.stringify([...new Set(seen)])} (count=${seen.length})`)
  check('§2c cross-site page can invoke the paid endpoint with NO preflight and NO origin check',
    upstreamCalls >= 8 && !seen.includes('OPTIONS'),
    `upstreamLLMCalls=${upstreamCalls}/20 (limiter capped at 8/min for one IP) preflightSent=${seen.includes('OPTIONS')} fetchErrors=${errs.length}`)

  // and the unhandled-exception 500 with a stack trace, over real HTTP
  const r500 = await realFetch('http://localhost:4400/api/chat', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '77.77.77.77' },
    body: '{"message":{"toString":1},"locale":"tr"}',
  })
  const body500 = await r500.text()
  check('§2c POST {"message":{"toString":1}} → unhandled TypeError (500), not the graceful fallback',
    r500.status === 500 && /Cannot convert object to primitive/.test(body500),
    `status=${r500.status} body=${body500.slice(0, 150).replace(/\n/g, ' ')}`)
  await ctx.close(); api.close(); evil.close()
}

// ══════════════════════════════ §6 privacy: third-party origins ════════════
for (const loc of ['/', '/de/', '/ru/', '/en/']) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const reqs = []
  page.on('request', (r) => reqs.push(r.url()))
  await page.goto(BASE + loc, { waitUntil: 'networkidle' })
  const third = (list) => [...new Set(list.filter((u) => !u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:') && !u.startsWith('about:'))
    .map((u) => { try { return new URL(u).origin } catch { return u.slice(0, 30) } }))]
  const beforeAny = third(reqs)
  const cookiesBefore = await ctx.cookies()
  const storeBefore = await page.evaluate(() => ({
    ls: Object.entries(localStorage), ss: Object.entries(sessionStorage), cookie: document.cookie,
  }))
  check(`§6 ${loc} NO third-party request before interaction`,
    beforeAny.length === 0, `origins=${JSON.stringify(beforeAny)}`)
  check(`§6 ${loc} no cookies / no storage writes before consent`,
    cookiesBefore.length === 0 && storeBefore.ls.length === 0 && storeBefore.ss.length === 0 && storeBefore.cookie === '',
    `cookies=${JSON.stringify(cookiesBefore.map((c) => c.name))} localStorage=${JSON.stringify(storeBefore.ls)} sessionStorage=${JSON.stringify(storeBefore.ss)}`)

  // now scroll the contact section into view — the lazy map lives there
  reqs.length = 0
  await page.locator('#kontakt').scrollIntoViewIfNeeded()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(600) // settle: lazy iframe fetch is not part of load events
  const afterScroll = third(reqs)
  check(`§6 ${loc} map does NOT contact Google without a click (site's own privacy text promises this)`,
    !afterScroll.some((o) => /google/.test(o)), `thirdPartyOriginsAfterScroll=${JSON.stringify(afterScroll)}`)
  const cookiesAfter = await ctx.cookies()
  console.log(`      cookies after map load: ${JSON.stringify(cookiesAfter.map((c) => c.domain + c.name))}`)
  if (loc === '/') await page.screenshot({ path: `${DIR}/s6-map-loaded.png`, fullPage: false })
  await ctx.close()
}
// theme toggle → is the localStorage write consent-free? (functional cookie, KVKK-ok, but enumerate it)
{
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.click('#themetog')
  await page.waitForFunction(() => localStorage.getItem('theme') !== null, null, { timeout: 3000 })
  const s = await page.evaluate(() => ({ ls: Object.entries(localStorage), cookie: document.cookie }))
  console.log('   after theme toggle:', JSON.stringify(s))
  check('§6 only a strictly-functional storage key is ever written (no id/tracking value)',
    s.ls.length === 1 && s.ls[0][0] === 'theme' && ['dark', 'light'].includes(s.ls[0][1]) && s.cookie === '',
    JSON.stringify(s.ls))
  await ctx.close()
}

// ══════════════════════════════ §7 client-side DoS ═════════════════════════
{
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  const maxlen = await page.evaluate(() => document.getElementById('cin').getAttribute('maxlength'))
  check('§7 chat input has a maxlength cap', maxlen !== null, `maxlength=${maxlen ?? 'ABSENT'}`)

  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  for (const [label, payload] of [
    ['1 MB of digits (ReDoS probe on the /(\\d{2,3})\\s*(m2|…)?/ matcher + m² word)', '9'.repeat(1_000_000) + ' m2'],
    ['1 MB of "a" + area word', 'a'.repeat(1_000_000) + ' oda'],
    ['1 MB alternating (worst case for includes())', 'ab'.repeat(500_000)],
    ['200k of "m2 " (many area-word hits)', 'm2 '.repeat(70_000)],
  ]) {
    await page.evaluate((v) => { document.getElementById('cin').value = v }, payload)
    const t0 = Date.now()
    await page.evaluate(() => document.getElementById('cform').requestSubmit())
    let ok = true
    try {
      await page.waitForFunction(() => !document.querySelector('#cbody .msg.typing'), null, { timeout: 15000 })
    } catch { ok = false }
    const ms = Date.now() - t0
    // is the page still responsive?
    const alive = await page.evaluate(() => { document.title = document.title; return 1 }).catch(() => 0)
    check(`§7 chat ${label}`, ok && ms < 5000 && alive === 1,
      `answeredIn=${ms}ms (260ms of that is the deliberate typing delay) stillResponsive=${alive === 1}`)
  }

  // 1 MB in a form field → URL length
  await page.evaluate(() => {
    window.__OPENED = []; window.open = (...a) => { window.__OPENED.push(a); return null }
  })
  await page.fill('#reqForm [name=name]', 'X')
  await page.fill('#reqForm [name=phone]', '1')
  await page.evaluate(() => { document.querySelector('#reqForm [name=note]').value = 'Ö'.repeat(1_000_000) })
  await page.check('#reqForm [name=consent]')
  const t0 = Date.now()
  await page.click('#reqForm button[type=submit]')
  await page.waitForFunction(() => window.__OPENED.length > 0, null, { timeout: 15000 })
  const ms = Date.now() - t0
  const len = await page.evaluate(() => window.__OPENED[0][0].length)
  check('§7 1 MB note field: no hang; but note the resulting URL length',
    ms < 5000, `builtIn=${ms}ms urlLength=${len} chars (maxlength=400 is bypassed by scripted value set; a human is capped)`)
  check('§7 no page errors during DoS probes', errs.length === 0, JSON.stringify(errs.slice(0, 2)))
  await ctx.close()
}

await browser.close(); attacker.close()
console.log(`\n════ §5/§6/§7/§2c SUMMARY: ${pass} pass / ${fail} fail ════`)
process.exit(0)
