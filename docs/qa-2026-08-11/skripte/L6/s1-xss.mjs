// L6 SECURITY §1 — XSS payload matrix: chat input, Randevu fields, URL query+hash.
// §2 — the one URL sink: waButton() a.href = j.wa (upstream-controlled).
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'

const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L6'
let pass = 0, fail = 0
const log = []
const check = (n, ok, d) => { ok ? pass++ : fail++; log.push([ok ? 'PASS' : 'FAIL', n, d]); console.log(`${ok ? '  ok ' : ' FAIL'} ${n}  ::  ${d}`) }

// Every payload sets window.__XSS if it executes; several also alert().
const CANARY = 'window.__XSS=(window.__XSS||0)+1'
const PAYLOADS = [
  ['img-onerror',      `<img src=x onerror="${CANARY};alert('XSS')">`],
  ['svg-onload',       `<svg onload="${CANARY};alert(1)">`],
  ['script-tag',       `<script>${CANARY};alert(1)</script>`],
  ['attr-break',       `"><script>${CANARY}</script>`],
  ['attr-break-img',   `'"><img src=x onerror=${CANARY}>`],
  ['broken-tag',       `<img src=x onerror=${CANARY} //`],
  ['iframe-srcdoc',    `<iframe srcdoc="<script>parent.${CANARY}</script>">`],
  ['body-onload',      `<body onload=${CANARY}>`],
  ['details-ontoggle', `<details open ontoggle=${CANARY}>`],
  ['js-url',           `javascript:${CANARY}`],
  ['data-url',         `data:text/html,<script>${CANARY}</script>`],
  ['tmpl-literal',     '${' + CANARY + '}'],
  ['handlebars',       '{{constructor.constructor("' + CANARY + '")()}}'],
  ['angular',          '{{7*7}}'],
  ['entity-esc',       '&lt;img src=x onerror=alert(1)&gt;'],
  ['unicode-esc',      '\\u003cimg src=x onerror=alert(1)\\u003e'],
  ['uri-esc',          '%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E'],
  ['onfocus-autofocus', `<input autofocus onfocus=${CANARY}>`],
  ['style-import',     `<style>@import'javascript:${CANARY}';</style>`],
  ['mixed-case',       `<IMG SRC=x OnErRoR=${CANARY}>`],
  ['null-byte',        `<img src=x on\u0000error=${CANARY}>`],
  ['newline-attr',     `<img src=x\nonerror=${CANARY}>`],
  ['tr-dotless',       `<ıMG SRC=x onerror=${CANARY}>`],   // Turkish casing trap
  ['a-href-js',        `<a href="javascript:${CANARY}">click</a>`],
]

const browser = await chromium.launch()

// ─────────────────────────────────────────── §1a chat input
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const dialogs = []; const errors = []
  page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss() })
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  await page.addInitScript(() => { window.__XSS = 0 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.click('#chatfab')
  await page.waitForSelector('#chatpanel:not([hidden])')

  for (const [name, p] of PAYLOADS) {
    await page.fill('#cin', p)
    const before = await page.evaluate(() => document.querySelectorAll('#cbody .msg.me').length)
    await page.press('#cin', 'Enter')
    await page.waitForFunction(
      (n) => document.querySelectorAll('#cbody .msg.me').length > n, before, { timeout: 5000 })
    // wait for the bot turn to land too (typing bubble replaced)
    await page.waitForFunction(() => !document.querySelector('#cbody .msg.typing'), null, { timeout: 5000 })
    const r = await page.evaluate(() => {
      const me = [...document.querySelectorAll('#cbody .msg.me .b')].pop()
      const bots = [...document.querySelectorAll('#cbody .msg.bot .b')]
      const bot = bots[bots.length - 1]
      return {
        meText: me?.textContent, meElems: me?.childElementCount, meHtmlLen: me?.innerHTML.length,
        botElems: bot?.childElementCount,
        xss: window.__XSS,
        scriptsInBody: document.querySelectorAll('#cbody script,#cbody img,#cbody svg,#cbody iframe,#cbody a').length,
      }
    })
    check(`§1a chat "${name}"`,
      r.xss === 0 && r.meElems === 0 && r.botElems === 0 && r.meText === p && r.scriptsInBody === 0,
      `__XSS=${r.xss} meChildElems=${r.meElems} botChildElems=${r.botElems} textRoundtrip=${r.meText === p} injectedNodes=${r.scriptsInBody}`)
  }
  const xssTotal = await page.evaluate(() => window.__XSS)
  check('§1a chat: zero dialogs / zero canary over full matrix',
    dialogs.length === 0 && xssTotal === 0, `dialogs=${JSON.stringify(dialogs)} __XSS=${xssTotal} pageErrors=${JSON.stringify(errors.slice(0, 3))}`)
  await page.screenshot({ path: `${DIR}/s1a-chat-xss-matrix.png` })
  await ctx.close()
}

// ─────────────────────────────────────────── §1b URL query + hash
{
  const urls = [
    `${BASE}/?q=${encodeURIComponent(`<img src=x onerror="${CANARY};alert(1)">`)}`,
    `${BASE}/?q=<img src=x onerror=alert(1)>`,
    `${BASE}/#<img src=x onerror=alert(1)>`,
    `${BASE}/#"><script>${CANARY}</script>`,
    `${BASE}/#javascript:alert(1)`,
    `${BASE}/de/?utm_source=<svg onload=alert(1)>#<svg onload=alert(1)>`,
  ]
  for (const u of urls) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    const dialogs = []; const errors = []
    page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss() })
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.addInitScript(() => { window.__XSS = 0 })
    await page.goto(u, { waitUntil: 'networkidle' })
    const r = await page.evaluate(() => ({
      xss: window.__XSS,
      // does anything from the URL end up in the DOM at all?
      inHtml: document.documentElement.innerHTML.includes('onerror=') || document.documentElement.innerHTML.includes('onload=alert'),
    }))
    check(`§1b URL ${u.slice(BASE.length).slice(0, 46)}`,
      dialogs.length === 0 && r.xss === 0 && !r.inHtml,
      `dialogs=${dialogs.length} __XSS=${r.xss} reflectedIntoDOM=${r.inHtml} pageErrors=${errors.length}`)
    await ctx.close()
  }
}

// ─────────────────────────────────────────── §1c Randevu form fields → wa.me URL
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const dialogs = []
  page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss() })
  await page.addInitScript(() => {
    window.__XSS = 0; window.__OPENED = []
    const orig = window.open
    window.open = (...a) => { window.__OPENED.push(a); return null }
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })

  const nasty = `<img src=x onerror=alert(1)>"'\`\n\r\t&%3C${'${'}7*7}\u0000javascript:alert(1)`
  await page.fill('#reqForm [name=name]', nasty)
  await page.fill('#reqForm [name=phone]', `+90 ${nasty}`)
  await page.fill('#reqForm [name=place]', nasty)
  await page.fill('#reqForm [name=when]', nasty)
  await page.fill('#reqForm [name=note]', nasty)
  await page.check('#reqForm [name=consent]')
  await page.click('#reqForm button[type=submit]')
  await page.waitForFunction(() => window.__OPENED.length > 0, null, { timeout: 5000 })
  const opened = await page.evaluate(() => window.__OPENED)
  const url = opened[0][0]
  let parsed = null, throwMsg = ''
  try { parsed = new URL(url) } catch (e) { throwMsg = String(e) }
  check('§1c Randevu: built URL is https://wa.me only (no scheme injection)',
    !!parsed && parsed.protocol === 'https:' && parsed.host === 'wa.me',
    `protocol=${parsed?.protocol} host=${parsed?.host} ${throwMsg}`)
  check('§1c Randevu: payload fully percent-encoded in the query (no raw < > " \' or newline)',
    !/[<>"'\n\r\t\u0000]/.test(url.slice(url.indexOf('?text=') + 6)),
    `rawQuery=${JSON.stringify(url.slice(url.indexOf('?text=') + 6, url.indexOf('?text=') + 120))}`)
  check('§1c Randevu: window.open called with target=_blank and "noopener" feature string',
    opened[0][1] === '_blank' && String(opened[0][2]).includes('noopener'),
    JSON.stringify(opened[0].slice(1)))
  check('§1c Randevu: no dialog fired from field payloads', dialogs.length === 0, `dialogs=${dialogs.length}`)
  console.log('   full URL built:', url.slice(0, 300))
  await ctx.close()
}

// ─────────────────────────────────────────── §2 the waButton() href sink
{
  const SINKS = [
    ['javascript:', 'javascript:window.__XSS=1;alert("SINK:"+document.domain)'],
    ['data:text/html', 'data:text/html,<script>alert("SINK-data")</script>'],
    ['protocol-relative', '//evil.example/pwn?c=' + 'x'],
    ['vbscript:', 'vbscript:msgbox(1)'],
    ['js-uppercase-tab', 'JaVaScRiPt:\talert(1)'],
    ['file:', 'file:///C:/Windows/win.ini'],
  ]
  for (const [name, wa] of SINKS) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    const dialogs = []
    page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss() })
    await page.addInitScript(() => { window.__XSS = 0 })
    // The ONE untrusted input: the /api/chat response.
    await page.route('**/api/chat', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ reply: 'Merhaba, buyurun.', wa }) }))
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.click('#chatfab')
    await page.waitForSelector('#chatpanel:not([hidden])')
    await page.fill('#cin', 'merhaba')
    await page.press('#cin', 'Enter')
    await page.waitForSelector('#cbody .msg.wa a', { timeout: 5000 })
    const a = await page.evaluate(() => {
      const el = document.querySelector('#cbody .msg.wa a')
      return { attr: el.getAttribute('href'), prop: el.href, rel: el.rel, target: el.target, text: el.textContent }
    })
    // Click it and see whether the scheme actually runs.
    let navTo = null
    page.on('framenavigated', (f) => { if (f === page.mainFrame()) navTo = f.url() })
    await page.click('#cbody .msg.wa a', { timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(400)          // settle: dialog/navigation is async after click
    const xss = await page.evaluate(() => window.__XSS)
    const executed = dialogs.length > 0 || xss === 1
    check(`§2 sink wa="${name}" → EXECUTED? ${executed ? 'YES (VULN)' : 'no'}`,
      true, `hrefAttr=${JSON.stringify(a.attr)} resolved=${JSON.stringify(a.prop.slice(0, 60))} rel=${JSON.stringify(a.rel)} target=${a.target} dialogs=${JSON.stringify(dialogs)} __XSS=${xss} navigatedTo=${navTo}`)
    if (name === 'javascript:') {
      check('§2 CONFIRMED: javascript: URL from /api/chat becomes a live clickable link',
        executed, `dialogs=${JSON.stringify(dialogs)} __XSS=${xss}`)
      await page.screenshot({ path: `${DIR}/s2-js-url-sink.png` })
    }
    await ctx.close()
  }
  // and prove the reply text itself cannot inject markup
  {
    const ctx = await browser.newContext(); const page = await ctx.newPage()
    const dialogs = []; page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss() })
    await page.addInitScript(() => { window.__XSS = 0 })
    await page.route('**/api/chat', (r) => r.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ reply: `<img src=x onerror="${CANARY};alert(1)"><script>alert(2)</script>` }) }))
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
    await page.fill('#cin', 'merhaba'); await page.press('#cin', 'Enter')
    await page.waitForFunction(() => document.querySelectorAll('#cbody .msg.bot').length >= 2, null, { timeout: 5000 })
    await page.waitForFunction(() => !document.querySelector('#cbody .msg.typing'), null, { timeout: 5000 })
    const r = await page.evaluate(() => {
      const b = [...document.querySelectorAll('#cbody .msg.bot .b')].pop()
      return { elems: b.childElementCount, xss: window.__XSS, txt: b.textContent.slice(0, 40) }
    })
    check('§2 reply text is textContent-escaped (no markup injection from API)',
      r.elems === 0 && r.xss === 0 && dialogs.length === 0,
      `childElems=${r.elems} __XSS=${r.xss} dialogs=${dialogs.length} rendered=${JSON.stringify(r.txt)}`)
    await ctx.close()
  }
}

await browser.close()
console.log(`\n════ §1/§2 SUMMARY: ${pass} pass / ${fail} fail ════`)
for (const [s, n, d] of log) if (s === 'FAIL') console.log(` FAIL ${n} :: ${d}`)
