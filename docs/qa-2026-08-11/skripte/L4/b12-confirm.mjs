// BLOCK 12 — final confirmation pass over every reported defect (3rd independent run each)
// plus a fair no-JS screenshot taken after the CSS hero animations have settled.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info, poll } from './lib.mjs'

const b = await chromium.launch()
const results = []
const T = (id, pass, detail) => { results.push({ id, pass, detail }); ok(pass, id, detail) }

// D1 hung chat
{
  const ctx = await b.newContext(); const page = await ctx.newPage()
  await page.route('**/api/chat', () => {})
  await page.goto(BASE, { waitUntil: 'load' })
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  await page.fill('#cin', 'soru bir'); await page.press('#cin', 'Enter')
  await page.waitForSelector('#cbody .msg.typing')
  await page.fill('#cin', 'soru iki'); await page.press('#cin', 'Enter')
  await page.waitForTimeout(2500)
  const s = await page.evaluate(() => ({ me: document.querySelectorAll('#cbody .msg.me').length, typing: document.querySelectorAll('#cbody .msg.typing').length, val: document.getElementById('cin').value, disabled: document.getElementById('cin').disabled }))
  T('D1 hung /api/chat: chat permanently dead, 2nd message silently dropped', s.me === 1 && s.typing === 1 && s.val === 'soru iki' && s.disabled === false, JSON.stringify(s))
  await ctx.close()
}

// D2 late gsap re-hides revealed content
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage()
  await page.route('**/_astro/{gsap,ScrollTrigger}.*.js', async (r) => { await new Promise((s) => setTimeout(s, 5000)); await r.continue() })
  await page.goto(BASE, { waitUntil: 'commit' })
  await page.waitForSelector('#hizmetler', { state: 'attached' })
  await page.evaluate(() => document.getElementById('hizmetler').scrollIntoView())
  await page.waitForFunction(() => [...document.querySelectorAll('#hizmetler [data-reveal]')].every((e) => Number(getComputedStyle(e).opacity) > 0.9), null, { timeout: 8000 })
  const dip = await poll(async () => await page.evaluate(() => Math.min(...[...document.querySelectorAll('#hizmetler [data-reveal]')].map((e) => Number(getComputedStyle(e).opacity))) < 0.5), { timeout: 12000, interval: 50 })
  T('D2 late gsap fades already-revealed content back out', dip.ok, `dip observed=${dip.ok} after ${dip.ms}ms`)
  await ctx.close()
}

// D3 2.5 s blank window
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage()
  await page.route('**/_astro/Base.astro_*.js', (r) => r.abort('failed'))
  const t0 = Date.now()
  await page.goto(BASE, { waitUntil: 'commit' })
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.topbar')).position === 'sticky')
  const r = await poll(async () => await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].every((e) => Number(getComputedStyle(e).opacity) > 0.9)), { timeout: 8000, interval: 40 })
  T('D3 motion bundle dead => ~2.5 s of blank sections', Date.now() - t0 > 2300 && Date.now() - t0 < 3000, `${Date.now() - t0}ms`)
  await ctx.close()
}

// D4 double submit
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage()
  const urls = []; ctx.on('page', async (p) => { urls.push(p.url()); await p.close().catch(() => {}) })
  await page.goto(BASE, { waitUntil: 'load' })
  await page.evaluate(() => document.getElementById('randevu').scrollIntoView())
  await page.fill('#reqForm [name=name]', 'Test'); await page.fill('#reqForm [name=phone]', '0500'); await page.check('#reqForm [name=consent]')
  await page.dblclick('#reqForm button[type=submit]')
  await page.waitForTimeout(1500)
  T('D4 double-click submit opens two identical WhatsApp deeplinks', urls.length === 2, `${urls.length} popups`)
  await ctx.close()
}

// D5 theme-color meta wrong on reload with light theme
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light') } catch {} })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  const r = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, meta: document.getElementById('tcolor').content, bg: getComputedStyle(document.body).backgroundColor }))
  T('D5 light theme restored but theme-color stays dark', r.theme === 'light' && r.meta === '#100D0B', JSON.stringify(r))
  await ctx.close()
}

// D6 three.js / WebGL failure -> unhandled rejection + 2.36:1 legend
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage()
  const errs = []; page.on('pageerror', (e) => errs.push(e.message))
  await page.addInitScript(() => { const o = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...r) { return /webgl/i.test(String(t)) ? null : o.call(this, t, ...r) } })
  await page.goto(BASE, { waitUntil: 'load' })
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
  await page.waitForTimeout(3500)
  const leg = await page.evaluate(() => ({ on: document.querySelectorAll('#expLegend li.on').length, op: getComputedStyle(document.querySelector('#expLegend li')).opacity }))
  T('D6 WebGL unavailable => uncaught THREE error + legend stuck at 0.45 opacity', errs.length > 0 && leg.on === 0 && leg.op === '0.45', `errs=${JSON.stringify(errs)} legend=${JSON.stringify(leg)}`)
  await ctx.close()
}

// D7 hero frost rAF never pauses out of view
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage()
  await page.addInitScript(() => { window.__n = 0; const o = window.requestAnimationFrame; window.requestAnimationFrame = function (cb) { try { if (!/\_astro\//.test(new Error().stack || '')) window.__n++ } catch {} ; return o.call(window, cb) }; window.__r = () => { window.__n = 0 } })
  await page.goto(BASE, { waitUntil: 'load' })
  await page.waitForTimeout(2500)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1200)
  await page.evaluate(() => window.__r())
  await page.waitForTimeout(1500)
  const n = await page.evaluate(() => window.__n)
  const heroOff = await page.evaluate(() => Math.round(document.querySelector('.hero').getBoundingClientRect().bottom))
  T('D7 hero frost rAF keeps running with the hero far off-screen', n > 40, `${Math.round((n / 1500) * 1000)} rAF/s with hero bottom at ${heroOff}px`)
  await ctx.close()
}

// D8 no-JS visible-but-inert controls
{
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } }); const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  await page.waitForTimeout(3500) // let the CSS hero animations settle (fair screenshot)
  const r = await page.evaluate(() => {
    const v = (s) => { const e = document.querySelector(s); if (!e) return false; const cs = getComputedStyle(e); return cs.display !== 'none' && e.getBoundingClientRect().width > 0 }
    return { fab: v('#chatfab'), burger: v('#burger'), themetog: v('#themetog'), heroCtaOpacity: getComputedStyle(document.querySelector('.cta')).opacity }
  })
  T('D8 no-JS: chat launcher / burger / theme toggle rendered but inert', r.fab && r.burger && r.themetog, JSON.stringify(r))
  await page.screenshot({ path: `${DIR}/b12-nojs-settled-mobile.png` })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${DIR}/b12-nojs-settled-desktop.png` })
  await ctx.close()
}

console.log('\n===== confirmation summary =====')
info(`${results.filter((r) => r.pass).length}/${results.length} defects reproduced on this independent 3rd run`)
results.forEach((r) => info(`${r.pass ? 'REPRODUCED ' : 'NOT REPRO  '} ${r.id}`))
await b.close()
