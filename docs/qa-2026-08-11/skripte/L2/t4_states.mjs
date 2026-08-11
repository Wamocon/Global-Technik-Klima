// L2 — ILLEGAL STATE TRANSITIONS / wrong-order interactions
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')
const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L2'
const out = []
const rec = (id, steps, expected, actual, pass) => {
  out.push({ id, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${id}\n      steps:    ${steps}\n      expected: ${expected}\n      actual:   ${actual}`)
}
const box = (a, b) => {
  // intersection area of two DOMRect-ish objects
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  return Math.round(x * y)
}

const run = async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: false })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })

  const st = () => page.evaluate(() => ({
    navHidden: document.getElementById('mobnav').hidden,
    navAria: document.getElementById('burger').getAttribute('aria-expanded'),
    burgerOn: document.getElementById('burger').classList.contains('on'),
    chatHidden: document.getElementById('chatpanel').hidden,
    chatAria: document.getElementById('chatfab').getAttribute('aria-expanded'),
    focus: document.activeElement ? (document.activeElement.id || document.activeElement.tagName) : 'none',
    theme: document.documentElement.dataset.theme || 'dark',
  }))

  // ---- 1) chat + mobile menu open at the same time ----
  await page.click('#burger')
  await page.waitForSelector('#mobnav:not([hidden])')
  await page.click('#chatfab')
  await page.waitForSelector('#chatpanel:not([hidden])')
  const both = await st()
  const geo = await page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, w: b.width, h: b.height } }
    return { nav: r('#mobnav'), chat: r('#chatpanel'), fab: r('#chatfab'), mobar: r('.mobar'), header: r('.hd') || r('header') }
  })
  rec('BOTH-OPEN chat + mobile menu (390x844)',
    '1) tap burger 2) tap chat FAB',
    'both may coexist but must not overlap each other, and neither may trap the other',
    `nav=${JSON.stringify(geo.nav)} chat=${JSON.stringify(geo.chat)} overlapPx²=${geo.nav && geo.chat ? box(geo.nav, geo.chat) : 'n/a'} · state=${JSON.stringify(both)}`,
    both.navHidden === false && both.chatHidden === false && geo.nav && geo.chat && box(geo.nav, geo.chat) === 0)
  await page.screenshot({ path: DIR + '/state_both_open.png' })

  // ---- 2) single Escape with both open ----
  for (const attempt of [1, 2]) {
    await page.evaluate(() => { document.getElementById('mobnav').hidden = true; document.getElementById('chatpanel').hidden = true })
    await page.click('#burger'); await page.waitForSelector('#mobnav:not([hidden])')
    await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
    await page.keyboard.press('Escape')
    const s = await st()
    rec(`ESC with both layers open (run ${attempt})`,
      'burger, chat FAB, then ONE Escape',
      'one Escape closes only the topmost layer (the chat); the menu stays open',
      JSON.stringify(s),
      s.chatHidden === true && s.navHidden === false)
  }

  // ---- 3) aria/class consistency after the double close ----
  const after = await st()
  rec('ARIA consistency after Escape',
    'state read after the Escape above',
    'aria-expanded matches [hidden] for BOTH controls',
    JSON.stringify(after),
    String(!after.navHidden) === after.navAria && String(!after.chatHidden) === after.chatAria && after.burgerOn === !after.navHidden)

  // ---- 4) menu open → resize to desktop → back to mobile ----
  for (const attempt of [1, 2]) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(() => { document.getElementById('mobnav').hidden = true })
    await page.click('#burger'); await page.waitForSelector('#mobnav:not([hidden])')
    await page.setViewportSize({ width: 1280, height: 900 })
    const desk = await st()
    await page.setViewportSize({ width: 390, height: 844 })
    const back = await st()
    const vis = await page.evaluate(() => {
      const n = document.getElementById('mobnav')
      const b = n.getBoundingClientRect()
      return { hidden: n.hidden, display: getComputedStyle(n).display, h: Math.round(b.height) }
    })
    rec(`RESIZE menu open → 1280 → 390 (run ${attempt})`,
      'open burger at 390, resize to 1280, resize back to 390',
      'menu closed and consistent, not stuck open or half-open',
      `at desktop=${JSON.stringify(desk)} · back at mobile=${JSON.stringify(back)} · computed=${JSON.stringify(vis)}`,
      desk.navHidden === true && back.navHidden === true && back.burgerOn === false && back.navAria === 'false')
  }

  // ---- 5) menu open at 999px (breakpoint edge) → 1000px ----
  await page.setViewportSize({ width: 999, height: 844 })
  await page.evaluate(() => { document.getElementById('mobnav').hidden = true })
  await page.click('#burger'); await page.waitForSelector('#mobnav:not([hidden])')
  await page.setViewportSize({ width: 1000, height: 844 })
  const edge = await st()
  rec('RESIZE breakpoint edge 999→1000 with menu open',
    'open burger at 999px, resize to exactly 1000px',
    'the (min-width:1000px) listener closes the menu',
    JSON.stringify(edge), edge.navHidden === true && edge.navAria === 'false')

  // ---- 6) theme toggle while the chat is open ----
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload({ waitUntil: 'networkidle' })
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  await page.fill('#cin', 'garanti kac yil')
  await page.press('#cin', 'Enter')
  await page.waitForFunction(() => document.querySelectorAll('#cbody .msg.bot').length > 1)
  await page.waitForFunction(() => document.querySelectorAll('#cbody .typing').length === 0)
  const beforeT = await page.evaluate(() => ({ msgs: document.querySelectorAll('#cbody .msg').length }))
  await page.click('#themetog')
  const afterT = await page.evaluate(() => ({
    msgs: document.querySelectorAll('#cbody .msg').length,
    theme: document.documentElement.dataset.theme || 'dark',
    chatHidden: document.getElementById('chatpanel').hidden,
    ls: localStorage.getItem('theme'),
  }))
  rec('THEME toggle while chat is open + has history',
    'open chat, ask a question, toggle theme',
    'theme flips, chat stays open, message history intact',
    `before=${JSON.stringify(beforeT)} after=${JSON.stringify(afterT)}`,
    afterT.theme === 'light' && afterT.chatHidden === false && afterT.msgs === beforeT.msgs)
  await page.screenshot({ path: DIR + '/state_theme_chat.png' })
  await page.click('#themetog') // back to dark

  // ---- 7) sticky furniture vs the form's submit + consent at 390x844 ----
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('#reqForm button[type="submit"]').scrollIntoViewIfNeeded()
  await page.waitForFunction(() => {
    const b = document.querySelector('#reqForm button[type="submit"]').getBoundingClientRect()
    return b.height > 0
  })
  const ov = await page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, w: Math.round(b.width), h: Math.round(b.height) } }
    return { submit: r('#reqForm button[type="submit"]'), consent: r('.rf-consent'), mobar: r('.mobar'), fab: r('#chatfab'), vh: window.innerHeight }
  })
  const ovSubmitMobar = box(ov.submit, ov.mobar)
  const ovSubmitFab = box(ov.submit, ov.fab)
  const ovConsentMobar = box(ov.consent, ov.mobar)
  const ovConsentFab = box(ov.consent, ov.fab)
  rec('STICKY vs submit/consent at 390x844 (scrollIntoView)',
    'scroll the submit button into view on mobile, measure bounding-box intersections',
    'no sticky element covers the submit button or the consent row',
    `submit=${JSON.stringify(ov.submit)} mobar=${JSON.stringify(ov.mobar)} fab=${JSON.stringify(ov.fab)} · overlap submit∩mobar=${ovSubmitMobar}px² submit∩fab=${ovSubmitFab}px² consent∩mobar=${ovConsentMobar}px² consent∩fab=${ovConsentFab}px²`,
    ovSubmitMobar === 0 && ovSubmitFab === 0 && ovConsentMobar === 0 && ovConsentFab === 0)
  await page.screenshot({ path: DIR + '/state_form_mobile_sticky.png' })

  // worst case: anchor-jump to #randevu (what the mobile bar / nav link actually does)
  await page.goto(BASE + '/#randevu', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.querySelector('#reqForm') !== null)
  const ov2 = await page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, w: Math.round(b.width), h: Math.round(b.height) } }
    return { submit: r('#reqForm button[type="submit"]'), consent: r('.rf-consent'), mobar: r('.mobar'), fab: r('#chatfab') }
  })
  rec('STICKY vs submit/consent after #randevu anchor jump (390x844)',
    'navigate to /#randevu on mobile, measure intersections',
    'no sticky element covers the submit button or the consent row',
    `submit=${JSON.stringify(ov2.submit)} · overlap submit∩mobar=${box(ov2.submit, ov2.mobar)}px² submit∩fab=${box(ov2.submit, ov2.fab)}px² consent∩mobar=${box(ov2.consent, ov2.mobar)}px²`,
    box(ov2.submit, ov2.mobar) === 0 && box(ov2.submit, ov2.fab) === 0 && box(ov2.consent, ov2.mobar) === 0)

  // ---- 8) submit the form while the chat panel is open (mobile) ----
  await page.goto(BASE + '/#randevu', { waitUntil: 'networkidle' })
  await page.addInitScript(() => { })
  await page.evaluate(() => { window.__opened = []; window.open = (...a) => { window.__opened.push(a); return null } })
  await page.fill('#reqForm [name="name"]', 'Ayşe')
  await page.fill('#reqForm [name="phone"]', '0533 046 13 87')
  await page.check('#reqForm [name="consent"]')
  await page.click('#chatfab')
  await page.waitForSelector('#chatpanel:not([hidden])')
  const cover = await page.evaluate(() => {
    const s = document.querySelector('#reqForm button[type="submit"]').getBoundingClientRect()
    const p = document.getElementById('chatpanel').getBoundingClientRect()
    const cx = s.left + s.width / 2, cy = s.top + s.height / 2
    const hit = document.elementFromPoint(cx, cy)
    return {
      submit: { l: Math.round(s.left), t: Math.round(s.top), r: Math.round(s.right), b: Math.round(s.bottom) },
      panel: { l: Math.round(p.left), t: Math.round(p.top), r: Math.round(p.right), b: Math.round(p.bottom) },
      elementAtSubmitCentre: hit ? (hit.id || hit.className || hit.tagName) : 'none',
    }
  })
  let clickErr = ''
  try { await page.click('#reqForm button[type="submit"]', { timeout: 3000 }) } catch (e) { clickErr = e.message.split('\n')[0] }
  const opened = await page.evaluate(() => window.__opened.length)
  rec('FORM submit while chat panel is open (390x844)',
    'fill the form, open the chat, then try to press "WhatsApp’tan gönder"',
    'the visitor can either still reach the submit button or is clearly blocked; no dead zone',
    `${JSON.stringify(cover)} · click error=${JSON.stringify(clickErr)} · window.open calls=${opened}`,
    opened === 1 || clickErr !== '')
  await page.screenshot({ path: DIR + '/state_chat_over_form.png' })

  // ---- 9) rapid double toggle of the chat FAB (state thrash) ----
  await page.reload({ waitUntil: 'networkidle' })
  await page.evaluate(() => {
    const f = document.getElementById('chatfab')
    f.click(); f.click(); f.click()
  })
  const thrash = await st()
  rec('CHAT FAB triple click in one tick',
    'chatfab.click() x3 synchronously',
    'panel state and aria-expanded agree',
    JSON.stringify(thrash),
    String(!thrash.chatHidden) === thrash.chatAria)

  // ---- 10) Escape while focus is inside the form (no dialog open) ----
  await page.reload({ waitUntil: 'networkidle' })
  await page.fill('#reqForm [name="name"]', 'Ayşe')
  await page.press('#reqForm [name="name"]', 'Escape')
  const esc = await page.evaluate(() => ({
    val: document.querySelector('#reqForm [name="name"]').value,
    focus: document.activeElement.getAttribute('name') || document.activeElement.tagName,
  }))
  rec('ESC inside a form field with no layer open',
    'type into name, press Escape',
    'nothing happens; the typed value survives and focus stays',
    JSON.stringify(esc), esc.val === 'Ayşe' && esc.focus === 'name')

  console.log('\nconsole errors: ' + (errs.length ? errs.join('\n') : '(none)'))
  const f = out.filter((o) => !o.pass)
  console.log(`\n=== ${out.length} cases · ${out.length - f.length} pass · ${f.length} fail ===`)
  f.forEach((x) => console.log('  FAIL ' + x.id))
  await browser.close()
}
run().catch((e) => { console.error(e); process.exit(1) })
