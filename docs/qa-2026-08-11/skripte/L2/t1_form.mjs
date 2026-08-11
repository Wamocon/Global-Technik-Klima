// L2 — NEGATIVE / INVALID INPUT lens · Randevu form #reqForm
// Decision-table coverage over the custom submit handler + invalid equivalence classes.
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')

const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L2'
const results = []
const log = (...a) => console.log(...a)
function rec(id, input, expected, actual, pass) {
  results.push({ id, input, expected, actual, pass })
  log(`${pass ? 'PASS' : 'FAIL'} | ${id}\n      input:    ${input}\n      expected: ${expected}\n      actual:   ${actual}`)
}

const INIT = () => {
  window.__opened = []
  window.__openReturnsNull = false
  const nat = window.open
  window.open = function (...a) { window.__opened.push(a); return window.__openReturnsNull ? null : null }
  window.__nativeOpen = nat
}

async function reset(page) {
  await page.evaluate(() => {
    const f = document.getElementById('reqForm')
    f.reset()
    const e = document.getElementById('reqErr')
    e.hidden = true; e.textContent = ''
    window.__opened.length = 0
    document.activeElement && document.activeElement.blur && document.activeElement.blur()
  })
}

async function state(page) {
  return page.evaluate(() => {
    const e = document.getElementById('reqErr')
    const ae = document.activeElement
    return {
      opened: window.__opened.map((a) => String(a[0])),
      errHidden: e.hidden,
      errText: e.textContent,
      errRole: e.getAttribute('role'),
      focus: ae ? (ae.getAttribute('name') || ae.tagName + (ae.id ? '#' + ae.id : '')) : 'none',
    }
  })
}

const run = async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const consoleErrs = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()) })
  page.on('pageerror', (e) => consoleErrs.push('PAGEERROR ' + e.message))
  await page.addInitScript(INIT)
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForSelector('#reqForm')
  // handler attached? prove with a control case first (valid submit must open)
  const nameI = page.locator('#reqForm [name="name"]')
  const phoneI = page.locator('#reqForm [name="phone"]')
  const consentI = page.locator('#reqForm [name="consent"]')
  const hpI = page.locator('#reqForm [name="website"]')
  const submitB = page.locator('#reqForm button[type="submit"]')

  // ---------- A) DECISION TABLE: 8 combinations ----------
  const rows = [
    { n: '', p: '', c: false },
    { n: 'Ayşe Yılmaz', p: '', c: false },
    { n: '', p: '0533 046 13 87', c: false },
    { n: 'Ayşe Yılmaz', p: '0533 046 13 87', c: false },
    { n: '', p: '', c: true },
    { n: 'Ayşe Yılmaz', p: '', c: true },
    { n: '', p: '0533 046 13 87', c: true },
    { n: 'Ayşe Yılmaz', p: '0533 046 13 87', c: true },
  ]
  for (const [i, r] of rows.entries()) {
    await reset(page)
    if (r.n) await nameI.fill(r.n)
    if (r.p) await phoneI.fill(r.p)
    if (r.c) await consentI.check()
    await submitB.click()
    const s = await state(page)
    const shouldOpen = !!(r.n && r.p && r.c)
    const okOpen = shouldOpen ? s.opened.length === 1 : s.opened.length === 0
    const okErr = shouldOpen ? s.errHidden === true : s.errHidden === false && s.errText.length > 0
    // which fields must be named in the error
    const need = []
    if (!r.n) need.push('Adınız')
    if (!r.p) need.push('Telefon')
    if (!r.c) need.push('İletişim')
    const namesAll = need.every((w) => s.errText.includes(w))
    const expFocus = shouldOpen ? '(unchanged)' : (!r.n ? 'name' : (!r.p ? 'phone' : 'consent'))
    const okFocus = shouldOpen ? true : s.focus === expFocus
    rec(
      `DT-${i + 1} name=${r.n ? 'X' : '-'} phone=${r.p ? 'X' : '-'} consent=${r.c ? 'X' : '-'}`,
      JSON.stringify(r),
      `open=${shouldOpen ? 1 : 0}, err${shouldOpen ? ' hidden' : ' shows [' + need.join('+') + ']'}, focus=${expFocus}`,
      `open=${s.opened.length}, errHidden=${s.errHidden}, errText="${s.errText}", focus=${s.focus}`,
      okOpen && okErr && namesAll && okFocus
    )
  }

  // ---------- B) WHITESPACE-ONLY (invalid equivalence class, looks filled) ----------
  for (const ws of ['   ', '\t\t', '\u00a0\u00a0']) {
    await reset(page)
    await nameI.fill(ws)
    await phoneI.fill(ws)
    await consentI.check()
    await submitB.click()
    const s = await state(page)
    rec(
      `WS name/phone=${JSON.stringify(ws)}`,
      `name=${JSON.stringify(ws)} phone=${JSON.stringify(ws)} consent=on`,
      'open=0, error names Adınız + Telefon',
      `open=${s.opened.length}, errHidden=${s.errHidden}, errText="${s.errText}", focus=${s.focus}`,
      s.opened.length === 0 && s.errHidden === false
    )
  }

  // ---------- C) PHONE FORMAT — invalid classes that are NOT empty ----------
  const badPhones = ['1', 'abc', '++++', 'a@b.com', '0', '-', 'DROP TABLE', '!!!', '00000000000000000000000000000',
    'çğüöşı', '💩💩', '<script>x</script>']
  for (const bp of badPhones) {
    await reset(page)
    await nameI.fill('Ayşe Yılmaz')
    await phoneI.fill(bp)
    await consentI.check()
    await submitB.click()
    const s = await state(page)
    const sent = s.opened.length === 1 ? decodeURIComponent(s.opened[0].split('text=')[1] || '') : ''
    rec(
      `PHONE-INVALID ${JSON.stringify(bp)}`,
      `name="Ayşe Yılmaz" phone=${JSON.stringify(bp)} consent=on`,
      'ideal: rejected or flagged as not a reachable callback number',
      `open=${s.opened.length}, errHidden=${s.errHidden}, waText=${JSON.stringify(sent.replace(/\n/g, ' | '))}`,
      s.opened.length === 0 // pass = rejected
    )
  }

  // ---------- D) CONSENT UNTICKED with everything else valid (KVKK) ----------
  for (const attempt of [1, 2]) {
    await reset(page)
    await nameI.fill('Ayşe Yılmaz')
    await phoneI.fill('+90 533 046 13 87')
    await page.locator('#reqForm [name="place"]').fill('Mahmutlar')
    await page.locator('#reqForm [name="note"]').fill('iki oda')
    await submitB.click()
    const s = await state(page)
    rec(
      `KVKK consent-off (run ${attempt})`,
      'name+phone+place+note filled, consent UNCHECKED',
      'open=0, error names the consent text, focus on consent checkbox',
      `open=${s.opened.length}, errHidden=${s.errHidden}, errText="${s.errText}", focus=${s.focus}`,
      s.opened.length === 0 && s.errHidden === false && s.focus === 'consent' && s.errText.includes('İletişim')
    )
  }

  // ---------- E) ERROR CLEARS ON SUCCESSFUL RETRY ----------
  await reset(page)
  await submitB.click()
  const e1 = await state(page)
  await nameI.fill('Ayşe Yılmaz'); await phoneI.fill('0533 046 13 87'); await consentI.check()
  await submitB.click()
  const e2 = await state(page)
  rec('ERR-CLEARS on successful retry',
    'submit empty (err shown) → fill all → submit',
    'err hidden again, open=1',
    `first: errHidden=${e1.errHidden} "${e1.errText}" → second: errHidden=${e2.errHidden}, open=${e2.opened.length}`,
    e1.errHidden === false && e2.errHidden === true && e2.opened.length === 1)

  // ---------- F) ERROR MESSAGE QUALITY ----------
  await reset(page)
  await submitB.click()
  const q = await state(page)
  const hasVerb = /(eksik|zorunlu|gerekli|lütfen|doldur)/i.test(q.errText)
  rec('ERR-QUALITY wording',
    'submit fully empty form',
    'error text states WHAT is wrong in words (e.g. "… zorunlu/eksik"), not only symbols + field names',
    `errText=${JSON.stringify(q.errText)} · role=${q.errRole} · contains an explanatory word: ${hasVerb}`,
    hasVerb)

  // ---------- G) HONEYPOT ----------
  // G1 silent no-op with otherwise valid data
  for (const attempt of [1, 2]) {
    await reset(page)
    await nameI.fill('Ayşe Yılmaz'); await phoneI.fill('0533 046 13 87'); await consentI.check()
    await hpI.evaluate((el) => { el.value = 'https://example.com' })
    await submitB.click()
    const s = await state(page)
    rec(`HONEYPOT filled + valid data (run ${attempt})`,
      'website="https://example.com", name/phone/consent valid',
      'documented: nothing sent (silent). Question: any feedback at all?',
      `open=${s.opened.length}, errHidden=${s.errHidden}, errText=${JSON.stringify(s.errText)}, focus=${s.focus}`,
      s.opened.length === 0)
  }
  // G2 honeypot path ERASES a previously shown validation error
  await reset(page)
  await submitB.click()
  const h1 = await state(page)
  await nameI.fill('Ayşe Yılmaz'); await phoneI.fill('0533 046 13 87'); await consentI.check()
  await hpI.evaluate((el) => { el.value = 'bot' })
  await submitB.click()
  const h2 = await state(page)
  rec('HONEYPOT erases prior error → looks like success',
    'empty submit (error visible) → fill everything → honeypot filled → submit',
    'ideally: state unchanged / still an error, never "clean form, nothing happened"',
    `before: errHidden=${h1.errHidden} "${h1.errText}" → after: errHidden=${h2.errHidden} "${h2.errText}", open=${h2.opened.length}`,
    !(h1.errHidden === false && h2.errHidden === true && h2.opened.length === 0))
  // G3 whitespace-only honeypot must NOT trip the trap
  await reset(page)
  await nameI.fill('Ayşe Yılmaz'); await phoneI.fill('0533 046 13 87'); await consentI.check()
  await hpI.evaluate((el) => { el.value = '   ' })
  await submitB.click()
  const g3 = await state(page)
  rec('HONEYPOT whitespace-only value',
    'website="   " (3 spaces), rest valid',
    'trimmed → not a bot → must still send',
    `open=${g3.opened.length}`,
    g3.opened.length === 1)
  // G4 reachability of the honeypot
  const reach = await page.evaluate(() => {
    const hp = document.querySelector('#reqForm [name="website"]')
    const wrap = hp.closest('.rf-hp')
    const r = hp.getBoundingClientRect()
    // tab order probe: collect all tabbable in form order
    const tabbables = [...document.querySelectorAll('#reqForm input,#reqForm select,#reqForm textarea,#reqForm button')]
      .filter((el) => el.tabIndex >= 0 && !el.disabled)
      .map((el) => el.getAttribute('name') || el.type)
    return {
      tabIndex: hp.tabIndex, autocomplete: hp.getAttribute('autocomplete'),
      ariaHiddenAncestor: !!wrap && wrap.getAttribute('aria-hidden'),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      inTabOrder: tabbables.includes('website'), tabbables,
      name: hp.name, type: hp.type,
    }
  })
  rec('HONEYPOT reachability (keyboard / AT)',
    'static + runtime probe of #reqForm [name="website"]',
    'not in tab order, removed from a11y tree → unreachable for keyboard & screen-reader users',
    JSON.stringify(reach),
    reach.inTabOrder === false && reach.tabIndex === -1 && reach.ariaHiddenAncestor === 'true')

  // ---------- H) ENTER KEY submit path ----------
  for (const field of ['name', 'phone', 'when']) {
    await reset(page)
    await page.locator(`#reqForm [name="${field}"]`).click()
    await page.keyboard.press('Enter')
    const s = await state(page)
    rec(`ENTER-KEY from [name=${field}] on empty form`,
      `focus ${field}, press Enter`,
      'same validation path as clicking submit: open=0, error visible',
      `open=${s.opened.length}, errHidden=${s.errHidden}, errText=${JSON.stringify(s.errText)}, focus=${s.focus}`,
      s.opened.length === 0 && s.errHidden === false)
  }
  // Enter with valid data
  await reset(page)
  await nameI.fill('Ayşe Yılmaz'); await phoneI.fill('0533 046 13 87'); await consentI.check()
  await phoneI.click(); await page.keyboard.press('Enter')
  const en = await state(page)
  rec('ENTER-KEY valid data', 'all required filled, Enter in phone', 'open=1', `open=${en.opened.length}`, en.opened.length === 1)
  // Enter inside the textarea must NOT submit (newline instead)
  await reset(page)
  await nameI.fill('Ayşe Yılmaz'); await phoneI.fill('0533 046 13 87'); await consentI.check()
  await page.locator('#reqForm [name="note"]').click(); await page.keyboard.press('Enter')
  const ta = await state(page)
  rec('ENTER-KEY inside textarea', 'Enter in note textarea', 'no submit (newline)', `open=${ta.opened.length}`, ta.opened.length === 0)

  // ---------- I) window.open BLOCKED (popup blocker / in-app webview) ----------
  await reset(page)
  await page.evaluate(() => {
    window.__opened.length = 0
    window.open = function (...a) { window.__opened.push(a); return null } // blocked popup returns null
  })
  await nameI.fill('Ayşe Yılmaz'); await phoneI.fill('0533 046 13 87'); await consentI.check()
  await submitB.click()
  const bl = await state(page)
  rec('POPUP-BLOCKED window.open()→null',
    'valid data, window.open returns null (popup blocked)',
    'user must learn the message was not handed over (fallback link / error)',
    `open attempted=${bl.opened.length}, errHidden=${bl.errHidden}, errText=${JSON.stringify(bl.errText)}`,
    bl.errHidden === false)

  // ---------- J) maxlength overflow via paste-like fill ----------
  await page.reload({ waitUntil: 'networkidle' })
  await reset(page)
  const long = 'A'.repeat(500)
  await nameI.fill(long)
  await phoneI.fill('9'.repeat(200))
  await consentI.check()
  await submitB.click()
  const mx = await page.evaluate(() => ({
    nameLen: document.querySelector('#reqForm [name="name"]').value.length,
    phoneLen: document.querySelector('#reqForm [name="phone"]').value.length,
    opened: window.__opened.length,
    url: String(window.__opened[0] || ''),
  }))
  rec('MAXLENGTH overflow name=500 phone=200 chars',
    'fill() 500 "A" into name (maxlength 80), 200 digits into phone (maxlength 30)',
    'clipped to 80 / 30',
    JSON.stringify({ nameLen: mx.nameLen, phoneLen: mx.phoneLen, opened: mx.opened, urlLen: mx.url.length }),
    mx.nameLen <= 80 && mx.phoneLen <= 30)

  // ---------- K) de locale error text ----------
  const p2 = await ctx.newPage()
  await p2.addInitScript(INIT)
  await p2.goto(BASE + '/de/', { waitUntil: 'networkidle' })
  await p2.locator('#reqForm button[type="submit"]').click()
  const de = await p2.evaluate(() => ({ t: document.getElementById('reqErr').textContent, h: document.getElementById('reqErr').hidden }))
  rec('ERR-QUALITY /de/', 'empty submit on /de/', 'German error naming the missing fields in words',
    JSON.stringify(de), /(fehlt|erforderlich|bitte|pflicht)/i.test(de.t))
  await p2.close()

  // ---------- L) illegal select value (state restore / extension) ----------
  await page.reload({ waitUntil: 'networkidle' })
  await reset(page)
  await nameI.fill('Ayşe Yılmaz'); await phoneI.fill('0533 046 13 87'); await consentI.check()
  const selInfo = await page.evaluate(() => {
    const s = document.querySelector('#reqForm [name="service"]')
    s.value = 'NOT-AN-OPTION'
    return { after: s.value, selIdx: s.selectedIndex }
  })
  await submitB.click()
  const sel = await page.evaluate(() => ({ opened: window.__opened.length, url: decodeURIComponent(String((window.__opened[0] || [''])[0])) }))
  rec('SELECT illegal value',
    'select[name=service].value = "NOT-AN-OPTION" then submit',
    'either coerced back to a real option or blocked; never an empty "Konu:" line',
    `select.value after assignment=${JSON.stringify(selInfo.after)} selectedIndex=${selInfo.selIdx} · opened=${sel.opened} · msg=${JSON.stringify((sel.url.split('text=')[1] || '').replace(/\n/g, ' | '))}`,
    !/Konu:\s*(\||$)/.test(sel.url))

  // ---------- SCREENSHOT: error state ----------
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('#randevu').scrollIntoViewIfNeeded()
  await page.locator('#reqForm button[type="submit"]').click()
  await page.waitForSelector('#reqErr:not([hidden])')
  await page.locator('#reqForm').screenshot({ path: DIR + '/DEF_err_wording.png' })

  // ---------- SCREENSHOT: honeypot erases the error ----------
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('#randevu').scrollIntoViewIfNeeded()
  await page.locator('#reqForm button[type="submit"]').click()
  await page.waitForSelector('#reqErr:not([hidden])')
  await nameI.fill('Ayşe Yılmaz'); await phoneI.fill('0533 046 13 87'); await consentI.check()
  await hpI.evaluate((el) => { el.value = 'autofilled-by-password-manager' })
  await submitB.click()
  await page.waitForFunction(() => document.getElementById('reqErr').hidden === true)
  await page.locator('#reqForm').screenshot({ path: DIR + '/DEF_honeypot_silent.png' })

  await page.screenshot({ path: DIR + '/t1_form_final.png' })

  log('\n--- console errors ---')
  log(consoleErrs.length ? consoleErrs.join('\n') : '(none)')
  const fails = results.filter((r) => !r.pass)
  log(`\n=== ${results.length} cases · ${results.length - fails.length} pass · ${fails.length} fail ===`)
  fails.forEach((f) => log('  FAIL ' + f.id))
  await browser.close()
}
run().catch((e) => { console.error(e); process.exit(1) })
