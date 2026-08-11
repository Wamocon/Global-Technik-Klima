// BLOCK 8 — concurrency / resource cleanup. Technique: stress + leak-signal measurement,
// rAF accounting for the animation loops.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info } from './lib.mjs'

const b = await chromium.launch({ args: ['--enable-precise-memory-info'] })

// ---------------- 8a stress: chat 30x, theme 30x, resize 20x ----------------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text()) })
  await page.addInitScript(() => {
    window.__listeners = 0
    const add = EventTarget.prototype.addEventListener
    const rem = EventTarget.prototype.removeEventListener
    EventTarget.prototype.addEventListener = function (...a) { window.__listeners++; return add.apply(this, a) }
    EventTarget.prototype.removeEventListener = function (...a) { window.__listeners--; return rem.apply(this, a) }
  })
  await page.goto(BASE, { waitUntil: 'load' })
  const snap = () => page.evaluate(() => ({
    listeners: window.__listeners,
    msgs: document.querySelectorAll('#chatpanel .msg').length,
    heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024) : null,
    nodes: document.getElementsByTagName('*').length,
    canvases: document.querySelectorAll('canvas').length,
  }))
  const s0 = await snap()

  // chat open/close x30
  for (let i = 0; i < 30; i++) {
    await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
    await page.click('#cclose'); await page.waitForSelector('#chatpanel[hidden]', { state: 'attached' })
  }
  const s1 = await snap()

  // theme toggle x30
  for (let i = 0; i < 30; i++) await page.click('#themetog')
  await page.waitForTimeout(200)
  const s2 = await snap()
  const themeState = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme || 'dark', ls: localStorage.getItem('theme') }))

  // resize mobile<->desktop x20
  for (let i = 0; i < 20; i++) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.setViewportSize({ width: 1440, height: 900 })
  }
  await page.waitForTimeout
  await page.waitForTimeout(400)
  const s3 = await snap()

  // one click -> exactly one bubble pair?
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  const before = await page.evaluate(() => document.querySelectorAll('#chatpanel .msg').length)
  await page.fill('#cin', 'montaj ne kadar surer'); await page.press('#cin', 'Enter')
  await page.waitForFunction(() => document.querySelectorAll('#chatpanel .msg.typing').length === 0 && document.querySelectorAll('#chatpanel .msg').length > 1, null, { timeout: 6000 })
  await page.waitForTimeout(400)
  const after = await page.evaluate(() => ({
    total: document.querySelectorAll('#chatpanel .msg').length,
    me: document.querySelectorAll('#chatpanel .msg.me').length,
    bots: document.querySelectorAll('#chatpanel .msg.bot:not(.typing)').length,
  }))
  // second identical send
  await page.fill('#cin', 'montaj ne kadar surer'); await page.press('#cin', 'Enter')
  await page.waitForFunction((n) => document.querySelectorAll('#chatpanel .msg.me').length === n, after.me + 1, { timeout: 6000 }).catch(() => {})
  await page.waitForTimeout(500)
  const after2 = await page.evaluate(() => ({ me: document.querySelectorAll('#chatpanel .msg.me').length, bots: document.querySelectorAll('#chatpanel .msg.bot:not(.typing)').length }))

  // force GC-ish: measure heap after idle
  await page.waitForTimeout(1500)
  const s4 = await snap()

  console.log('\n===== 8a stress (chat 30x, theme 30x, resize 20x) =====')
  info(`baseline     : ${JSON.stringify(s0)}`)
  info(`after chat30 : ${JSON.stringify(s1)}`)
  info(`after theme30: ${JSON.stringify(s2)}  themeState=${JSON.stringify(themeState)}`)
  info(`after resize : ${JSON.stringify(s3)}`)
  info(`after msgs   : ${JSON.stringify(s4)}`)
  ok(s1.msgs === s0.msgs, '8a: opening/closing the chat 30x does not accumulate message nodes', `${s0.msgs} -> ${s1.msgs}`)
  ok(s1.listeners - s0.listeners <= 2, '8a: chat open/close 30x adds no listeners', `delta=${s1.listeners - s0.listeners}`)
  ok(s2.listeners - s1.listeners <= 2, '8a: theme toggle 30x adds no listeners', `delta=${s2.listeners - s1.listeners}`)
  ok(themeState.theme === 'dark' && themeState.ls === 'dark', '8a: 30 toggles (even count) end back on dark and storage agrees', JSON.stringify(themeState))
  ok(s3.listeners - s2.listeners <= 4, '8a: 20 mobile<->desktop resizes add no listeners', `delta=${s3.listeners - s2.listeners}`)
  ok(s3.canvases === s0.canvases, '8a: no extra canvas elements created by resizing', `${s0.canvases} -> ${s3.canvases}`)
  ok(after.me === 1 && after.bots >= 2, '8a: one send produces exactly ONE user bubble (no duplicated handler)', JSON.stringify(after))
  ok(after2.me === 2, '8a: the second send produces exactly one more user bubble', JSON.stringify(after2))
  const growthPct = s0.heap ? Math.round(((s4.heap - s0.heap) / s0.heap) * 100) : null
  info(`heap: ${s0.heap} KB -> ${s4.heap} KB (${growthPct}%)`)
  ok(growthPct === null || growthPct < 60, '8a: JS heap growth after the whole stress run stays under 60%', `${growthPct}%`)
  ok(errs.length === 0, '8a: no console errors during the stress run', [...new Set(errs)].join(' | '))
  await page.screenshot({ path: `${DIR}/b8a-after-stress.png` })
  await ctx.close()
}

// ---------------- 8b rAF accounting: does each loop pause when it should? ----------------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.addInitScript(() => {
    window.__raf = 0
    const orig = window.requestAnimationFrame
    window.requestAnimationFrame = function (cb) { window.__raf++; return orig.call(window, cb) }
  })
  await page.goto(BASE, { waitUntil: 'load' })
  const rate = async (label, ms = 1200) => {
    const a = await page.evaluate(() => window.__raf)
    await page.waitForTimeout(ms)
    const b2 = await page.evaluate(() => window.__raf)
    const r = Math.round(((b2 - a) / ms) * 1000)
    info(`rAF/s  ${label.padEnd(46)} ${r}`)
    return r
  }
  console.log('\n===== 8b rAF accounting =====')
  const rTop = await rate('at top: hero canvas visible, three not booted')
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
  await page.waitForFunction(() => { const c = document.getElementById('expCanvas'); return c && c.width > 200 }, null, { timeout: 15000 })
  const rTeknik = await rate('at #teknik: hero OFF-screen + three.js running')
  await page.evaluate(() => document.getElementById('kontakt').scrollIntoView())
  await page.waitForTimeout(800)
  const rBelow = await rate('at #kontakt: hero AND three both off-screen')
  // hide the tab
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Emulation.setPageVisibilityOverride', { hidden: true })
  await page.waitForTimeout(400)
  const rHidden = await rate('tab hidden (Emulation.setPageVisibilityOverride)')
  await cdp.send('Emulation.setPageVisibilityOverride', { hidden: false })
  await page.waitForTimeout(500)
  const rShown = await rate('tab visible again, still at #kontakt')
  // back into view of three
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
  await page.waitForTimeout(700)
  const rTeknik2 = await rate('back at #teknik after hide/show (double-loop check)')
  // scroll the whole page up/down 5x
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(150)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(150)
  }
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
  await page.waitForTimeout(800)
  const rAfterScrolling = await rate('at #teknik after 5 full up/down sweeps')
  const canv = await page.evaluate(() => document.querySelectorAll('canvas').length)

  ok(rBelow < rTop * 0.6, '8b: rAF work drops when BOTH animated canvases are out of view', `${rTop}/s at top vs ${rBelow}/s when both off-screen`)
  ok(rHidden < 5, '8b: rAF stops while the tab is hidden', `${rHidden}/s`)
  ok(Math.abs(rTeknik2 - rTeknik) < rTeknik * 0.35, '8b: no duplicated rAF loop after hide/show', `${rTeknik}/s before vs ${rTeknik2}/s after`)
  ok(Math.abs(rAfterScrolling - rTeknik) < rTeknik * 0.35, '8b: no duplicated rAF loop after 5 full-page scroll sweeps', `${rTeknik}/s vs ${rAfterScrolling}/s`)
  ok(canv === 2, '8b: still exactly 2 canvases', `${canv}`)
  await ctx.close()
}

await b.close()
