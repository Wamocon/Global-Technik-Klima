// L6 SECURITY §confirm — re-run each candidate defect twice, and make the proofs concrete.
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import http from 'node:http'
const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L6'
const browser = await chromium.launch()

// ─── A. what Google actually receives (2 runs) ──────────────────────────────
for (const run of [1, 2]) {
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  const hits = []
  page.on('request', (r) => {
    const u = r.url()
    if (/google|gstatic/.test(u)) hits.push({ url: u.slice(0, 90), referer: r.headers().referer || '(none)', type: r.resourceType() })
  })
  await page.goto(BASE + '/de/', { waitUntil: 'networkidle' })
  const beforeCount = hits.length
  await page.locator('#kontakt').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1500) // settle: lazy-iframe load is not covered by a load event
  console.log(`A/run${run}: google contacts before scroll = ${beforeCount}, after scroll = ${hits.length}`)
  console.log(`         first hit: ${JSON.stringify(hits[0], null, 0)}`)
  console.log(`         distinct origins: ${JSON.stringify([...new Set(hits.map((h) => new URL('https://x' + h.url.replace(/^https?:\/\//, '/')).pathname.split('/')[1] || h.url))].slice(0, 1))}`)
  console.log(`         Referer sent to Google: ${JSON.stringify(hits[0]?.referer)}`)
  const cookies = (await ctx.cookies()).map((c) => `${c.domain}${c.name}`)
  console.log(`         cookies after: ${JSON.stringify(cookies)}`)
  await ctx.close()
}

// ─── B. clickjacking: is the framed page actually INTERACTIVE? (2 runs) ─────
const srv = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' })
  res.end(`<!doctype html><title>UI redress PoC</title>
  <style>body{font:16px system-ui;margin:0}#bait{position:absolute;top:120px;left:60px;z-index:5;
    padding:26px 40px;font-size:20px;background:#c00;color:#fff;border:0;cursor:pointer}</style>
  <p style="margin:8px">ATTACKER SITE (localhost:4399) — the dealer's site is framed below at 30% opacity.</p>
  <button id="bait">CLAIM YOUR FREE AC SERVICE</button>
  <iframe src="${BASE}/" width="1200" height="800" style="opacity:.3;border:0"></iframe>`)
})
await new Promise((r) => srv.listen(4399, r))
for (const run of [1, 2]) {
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } })
  const page = await ctx.newPage()
  await page.goto('http://localhost:4399/', { waitUntil: 'networkidle' })
  const fr = page.frames().find((f) => f.url().startsWith(BASE))
  let interactive = null
  if (fr) {
    // drive the victim's UI from inside the frame — this is what a UI-redress overlay does
    await fr.click('#chatfab').catch(() => {})
    interactive = await fr.evaluate(() => ({
      framed: window.top !== window.self,
      chatOpened: !document.getElementById('chatpanel').hasAttribute('hidden'),
      canReadTitle: document.title.slice(0, 30),
      formPresent: !!document.getElementById('reqForm'),
    })).catch((e) => ({ err: e.message }))
  }
  console.log(`B/run${run}: framed=${!!fr} → ${JSON.stringify(interactive)}`)
  if (run === 1) await page.screenshot({ path: `${DIR}/s5b-clickjacking-interactive.png`, fullPage: false })
  await ctx.close()
}
srv.close()

// ─── C. chat XSS re-verified with a CORRECT assertion (2 runs) ──────────────
const CANARY = 'window.__XSS=(window.__XSS||0)+1'
const P = [
  `<img src=x onerror="${CANARY};alert(1)">`,
  `<svg onload="${CANARY}">`,
  `"><script>${CANARY}</script>`,
  `<iframe srcdoc="<script>parent.${CANARY}</script>">`,
  `javascript:${CANARY}`,
  '${' + CANARY + '}',
  '{{7*7}}',
  `<ıMG SRC=x onerror=${CANARY}>`,
]
for (const run of [1, 2]) {
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  const dialogs = []
  page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss() })
  await page.addInitScript(() => { window.__XSS = 0 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  let bad = []
  for (const p of P) {
    await page.fill('#cin', p)
    const n = await page.evaluate(() => document.querySelectorAll('#cbody .msg.me').length)
    await page.press('#cin', 'Enter')
    await page.waitForFunction((k) => document.querySelectorAll('#cbody .msg.me').length > k, n, { timeout: 5000 })
    await page.waitForFunction(() => !document.querySelector('#cbody .msg.typing'), null, { timeout: 5000 })
    const r = await page.evaluate(() => {
      // count element nodes INSIDE message bubbles only — .msg.wa a is a legitimate,
      // code-created CTA and must not be counted as injected markup.
      const inBubbles = document.querySelectorAll('#cbody .msg .b *').length
      const me = [...document.querySelectorAll('#cbody .msg.me .b')].pop()
      return { inBubbles, xss: window.__XSS, meIsTextOnly: me.childNodes.length === 1 && me.childNodes[0].nodeType === 3 }
    })
    if (r.inBubbles !== 0 || r.xss !== 0 || !r.meIsTextOnly) bad.push([p.slice(0, 24), r])
  }
  const total = await page.evaluate(() => window.__XSS)
  console.log(`C/run${run}: elementNodesInsideBubbles=0? ${bad.length === 0} | __XSS=${total} | dialogs=${dialogs.length} | violations=${JSON.stringify(bad)}`)
  await ctx.close()
}

// ─── D. the javascript: sink, re-confirmed twice + what the user sees ───────
for (const run of [1, 2]) {
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  const dialogs = []
  page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss() })
  await page.addInitScript(() => { window.__XSS = 0 })
  await page.route('**/api/chat', (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ reply: 'Bir uzmana aktarıyorum.', wa: 'javascript:window.__XSS=1;alert(document.domain)' }) }))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  await page.fill('#cin', 'insan'); await page.press('#cin', 'Enter')
  await page.waitForSelector('#cbody .msg.wa a')
  const before = await page.evaluate(() => ({
    href: document.querySelector('#cbody .msg.wa a').getAttribute('href'),
    rel: document.querySelector('#cbody .msg.wa a').rel,
    target: document.querySelector('#cbody .msg.wa a').target,
  }))
  await page.click('#cbody .msg.wa a')
  await page.waitForTimeout(500) // settle: a dialog would arrive asynchronously
  const after = await page.evaluate(() => window.__XSS)
  console.log(`D/run${run}: hrefWritten=${JSON.stringify(before.href)} rel=${before.rel} target=${before.target} → executed=${after === 1 || dialogs.length > 0} (dialogs=${dialogs.length})`)
  await ctx.close()
}

// ─── E. legal pages: any third-party contact there? ─────────────────────────
{
  for (const p of ['/kvkk', '/gizlilik', '/cerez', '/de/cerez', '/404-probe']) {
    const ctx = await browser.newContext(); const page = await ctx.newPage()
    const third = new Set()
    page.on('request', (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) third.add(new URL(r.url()).origin) })
    await page.goto(BASE + p, { waitUntil: 'networkidle' })
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(700)
    const st = await page.evaluate(() => ({ ls: Object.entries(localStorage), c: document.cookie }))
    console.log(`E ${p}: thirdParty=${JSON.stringify([...third])} storage=${JSON.stringify(st.ls)} cookie=${JSON.stringify(st.c)}`)
    await ctx.close()
  }
}

await browser.close()
console.log('\n── confirmation pass done ──')
process.exit(0)
