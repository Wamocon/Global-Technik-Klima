// L6 SECURITY §2b — root-cause the waButton() href sink:
//   is the code safe, or is Chromium's target=_blank rule saving it?
//   and what IS still reachable (cross-origin phishing link)?
// §4 — tabnabbing / noopener, incl. the window.open(url,'_blank','noopener') feature string.
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L6'
let pass = 0, fail = 0
const check = (n, ok, d) => { ok ? pass++ : fail++; console.log(`${ok ? '  ok ' : ' FAIL'} ${n}  ::  ${d}`) }

const browser = await chromium.launch()

// ── §2b-1 CONTROL: is `javascript:` in an <a> executable in this browser at all? ──
{
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  const dialogs = []; page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss() })
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  const res = await page.evaluate(async () => {
    const out = {}
    // (a) no target
    const a1 = document.createElement('a')
    a1.href = 'javascript:window.__A=1'
    a1.textContent = 'x'; document.body.appendChild(a1); a1.click()
    await new Promise((r) => setTimeout(r, 150))
    out.noTarget = window.__A === 1
    // (b) target=_blank rel=noopener — exactly what waButton() builds
    const a2 = document.createElement('a')
    a2.href = 'javascript:window.__B=1'; a2.target = '_blank'; a2.rel = 'noopener'
    a2.textContent = 'x'; document.body.appendChild(a2); a2.click()
    await new Promise((r) => setTimeout(r, 250))
    out.blankNoopener = window.__B === 1
    return out
  })
  check('§2b-1 CONTROL: javascript: <a> WITHOUT target executes in this Chromium',
    res.noTarget === true, `executed=${res.noTarget}`)
  check('§2b-1 CONTROL: same javascript: <a> WITH target=_blank rel=noopener is blocked by the browser',
    res.blankNoopener === false, `executed=${res.blankNoopener}`)
  console.log('   → the code has NO scheme validation; only the browser\'s _blank rule stops it.')
  await ctx.close()
}

// ── §2b-2 what IS reachable: an arbitrary cross-origin link in the WhatsApp CTA ──
{
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  const popups = []
  ctx.on('page', (p) => popups.push(p))
  await ctx.route('**://evil.example/**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/html', body: '<title>ATTACKER PAGE</title><h1>phished</h1>' }))
  await page.route('**/api/chat', (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ reply: 'Sizi WhatsApp’a aktarıyorum.', wa: 'https://evil.example/whatsapp-login?ref=gree' }) }))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  await page.fill('#cin', 'insan'); await page.press('#cin', 'Enter')
  await page.waitForSelector('#cbody .msg.wa a')
  const info = await page.evaluate(() => {
    const el = document.querySelector('#cbody .msg.wa a')
    return { href: el.href, label: el.textContent, rel: el.rel }
  })
  check('§2b-2 arbitrary cross-origin URL is rendered as the trusted "WhatsApp" CTA',
    info.href === 'https://evil.example/whatsapp-login?ref=gree',
    `href=${info.href} visibleLabel=${JSON.stringify(info.label)} (label is hardcoded, so the destination is invisible to the user)`)
  await page.screenshot({ path: `${DIR}/s2b-evil-wa-cta.png`, fullPage: false })
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
    page.click('#cbody .msg.wa a'),
  ])
  let popUrl = 'none', opener = 'n/a'
  if (popup) {
    await popup.waitForLoadState('domcontentloaded').catch(() => {})
    popUrl = popup.url()
    opener = await popup.evaluate(() => String(window.opener)).catch((e) => 'eval-failed:' + e.message)
  }
  check('§2b-2 clicking it really navigates a new tab to the attacker origin',
    popUrl.startsWith('https://evil.example/'), `popupUrl=${popUrl}`)
  check('§2b-2 …and rel=noopener holds (window.opener === null in the new tab)',
    opener === 'null', `window.opener=${opener}`)
  await ctx.close()
}

// ── §4-1 static target=_blank audit over every built page ──
{
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  const pages = ['/', '/de/', '/ru/', '/en/', '/kvkk', '/gizlilik', '/cerez',
    '/de/kvkk', '/de/gizlilik', '/de/cerez', '/ru/kvkk', '/ru/gizlilik', '/ru/cerez',
    '/en/kvkk', '/en/gizlilik', '/en/cerez', '/nonexistent-404-probe',
    '/angebot/Global%20Technik%20Klima%20Bestellung.html']
  let bad = [], total = 0
  for (const p of pages) {
    await page.goto(BASE + p, { waitUntil: 'domcontentloaded' })
    const r = await page.evaluate(() => {
      const out = []
      for (const a of document.querySelectorAll('a[target="_blank"]')) {
        out.push({ href: a.getAttribute('href'), rel: a.getAttribute('rel'), txt: (a.textContent || '').trim().slice(0, 20) })
      }
      // also: any cross-origin link at all without noopener
      const xo = []
      for (const a of document.querySelectorAll('a[href^="http"]')) {
        try {
          if (new URL(a.href).origin !== location.origin && !(a.getAttribute('rel') || '').includes('noopener')) {
            xo.push({ href: a.href.slice(0, 60), target: a.getAttribute('target'), rel: a.getAttribute('rel') })
          }
        } catch {}
      }
      return { blanks: out, crossOriginNoNoopener: xo }
    })
    total += r.blanks.length
    for (const b of r.blanks) if (!(b.rel || '').includes('noopener')) bad.push({ page: p, ...b })
    if (r.crossOriginNoNoopener.length) {
      console.log(`   ${p}: cross-origin links without rel=noopener (no target → not a tabnabbing risk):`,
        JSON.stringify(r.crossOriginNoNoopener.map((x) => x.href)))
    }
  }
  check(`§4-1 every target="_blank" carries rel*=noopener (${total} links across ${pages.length} pages)`,
    bad.length === 0, bad.length ? JSON.stringify(bad) : 'none missing')
  await ctx.close()
}

// ── §4-2 RequestForm: does window.open(url,'_blank','noopener') really apply noopener? ──
{
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  await ctx.route('**://wa.me/**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/html', body: '<title>wa-stub</title>ok' }))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.fill('#reqForm [name=name]', 'Test Kullanıcı')
  await page.fill('#reqForm [name=phone]', '+90 555 000 00 00')
  await page.check('#reqForm [name=consent]')
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 8000 }).catch(() => null),
    page.click('#reqForm button[type=submit]'),
  ])
  let opener = 'no-popup', url = 'n/a'
  if (popup) {
    await popup.waitForLoadState('domcontentloaded').catch(() => {})
    url = popup.url()
    opener = await popup.evaluate(() => String(window.opener)).catch((e) => 'eval-failed:' + e.message)
  }
  check('§4-2 window.open(url,"_blank","noopener") DOES sever window.opener in Chromium',
    opener === 'null', `window.opener=${opener} popupUrl=${url.slice(0, 60)}`)
  await ctx.close()
}

// ── §4-3 map iframe attributes ──
{
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  const f = await page.evaluate(() => {
    const el = document.querySelector('.cmap iframe')
    if (!el) return null
    const o = {}
    for (const a of el.attributes) o[a.name] = a.value
    return o
  })
  console.log('   map iframe attributes:', JSON.stringify(f, null, 0))
  check('§4-3 map iframe has a sandbox attribute', !!f && 'sandbox' in f, `sandbox=${f?.sandbox ?? 'ABSENT'}`)
  check('§4-3 map iframe has an allow (Permissions-Policy) attribute', !!f && 'allow' in f, `allow=${f?.allow ?? 'ABSENT'}`)
  check('§4-3 map iframe referrerpolicy leaks no full URL cross-origin',
    f?.referrerpolicy === 'no-referrer' || f?.referrerpolicy === 'origin',
    `referrerpolicy=${f?.referrerpolicy} (no-referrer-when-downgrade sends the FULL URL to google.com over https)`)
  check('§4-3 allowfullscreen not granted to the third-party frame', !(f && 'allowfullscreen' in f),
    `allowfullscreen=${f && 'allowfullscreen' in f ? 'GRANTED' : 'absent'}`)
  await ctx.close()
}

await browser.close()
console.log(`\n════ §2b/§4 SUMMARY: ${pass} pass / ${fail} fail ════`)
