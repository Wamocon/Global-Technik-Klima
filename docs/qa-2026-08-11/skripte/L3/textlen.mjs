// L3 — text-length boundaries on #reqForm.
// Technique: 3-value BVA on each maxlength (max-1, max, max+1) through two paths:
//  (A) fill()            — respects maxlength  (what a human can do)
//  (B) direct .value set — ignores maxlength   (what a script/paste-API/bot can do)
// Oracle: the generated wa.me deeplink must carry exactly what the field holds.
import { chromium, BASE, DIR } from './pw.mjs'

const FIELDS = [
  { name: 'name', max: 80, required: true },
  { name: 'phone', max: 30, required: true },
  { name: 'place', max: 60 },
  { name: 'when', max: 60 },
  { name: 'note', max: 400 },
]
const rep = (n, ch = 'A') => ch.repeat(n)

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await page.goto(BASE + '/', { waitUntil: 'networkidle' })

// stub window.open so nothing actually navigates and we can read the deeplink
await page.addInitScript(() => { })
await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null } })

const declared = await page.evaluate(() =>
  [...document.querySelectorAll('#reqForm [name]')].map((e) => ({ name: e.name, maxlength: e.getAttribute('maxlength'), tag: e.tagName })))
console.log('--- declared maxlength attributes in the DOM ---')
console.log(JSON.stringify(declared))

const setVia = async (name, value, mode) => {
  if (mode === 'fill') await page.locator(`#reqForm [name="${name}"]`).fill(value)
  else await page.evaluate(([n, v]) => { const el = document.querySelector(`#reqForm [name="${n}"]`); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })) }, [name, value])
  return page.evaluate((n) => document.querySelector(`#reqForm [name="${n}"]`).value.length, name)
}
const reset = async () => {
  await page.evaluate(() => {
    document.querySelector('#reqForm').reset()
    window.__opened = []
    document.querySelector('#reqErr').hidden = true
  })
}

console.log('\n--- (A) 3-value BVA via fill() — maxlength must truncate ---')
console.log('field      | max | tried | resulting value.length | verdict')
for (const f of FIELDS) {
  for (const n of [f.max - 1, f.max, f.max + 1]) {
    await reset()
    const len = await setVia(f.name, rep(n), 'fill')
    const expect = Math.min(n, f.max)
    console.log(`${f.name.padEnd(10)} | ${String(f.max).padEnd(3)} | ${String(n).padEnd(5)} | ${String(len).padEnd(22)} | ${len === expect ? 'PASS' : 'FAIL (expected ' + expect + ')'}`)
  }
}

console.log('\n--- (B) same boundaries via direct .value assignment — maxlength is NOT enforced ---')
console.log('field      | max | tried | resulting value.length | length that reached the wa.me link')
for (const f of FIELDS) {
  const n = f.max + 1
  await reset()
  await setVia('name', 'Test Ad', 'fill')
  await setVia('phone', '+90 533 000 00 00', 'fill')
  await page.locator('#reqForm [name="consent"]').check()
  const len = await setVia(f.name, rep(n, 'B'), 'dom')
  await page.locator('#reqForm button[type="submit"]').click()
  await page.waitForFunction(() => window.__opened.length > 0, null, { timeout: 4000 }).catch(() => {})
  const url = await page.evaluate(() => window.__opened[0] || '')
  const text = decodeURIComponent((url.split('?text=')[1] || ''))
  const m = text.match(/B+/)
  console.log(`${f.name.padEnd(10)} | ${String(f.max).padEnd(3)} | ${String(n).padEnd(5)} | ${String(len).padEnd(22)} | ${m ? m[0].length : (f.name === 'name' || f.name === 'phone' ? 'n/a (overwritten)' : 0)}`)
}

console.log('\n--- (C) total wa.me URL length at maximum field lengths ---')
const scenarios = [
  { label: 'ASCII max (A-fill)', vals: { name: rep(80), phone: rep(30, '1'), place: rep(60), when: rep(60), note: rep(400) } },
  { label: 'Turkish max (ğ)', vals: { name: rep(80, 'ğ'), phone: rep(30, '1'), place: rep(60, 'ğ'), when: rep(60, 'ğ'), note: rep(400, 'ğ') } },
  { label: 'Cyrillic max (Ж)', vals: { name: rep(80, 'Ж'), phone: rep(30, '1'), place: rep(60, 'Ж'), when: rep(60, 'Ж'), note: rep(400, 'Ж') } },
  { label: 'Emoji max (😀 = 2 UTF-16 units)', vals: { name: '😀'.repeat(40), phone: rep(30, '1'), place: '😀'.repeat(30), when: '😀'.repeat(30), note: '😀'.repeat(200) } },
]
for (const s of scenarios) {
  await reset()
  for (const [k, v] of Object.entries(s.vals)) await setVia(k, v, 'fill')
  await page.locator('#reqForm [name="consent"]').check()
  await page.locator('#reqForm button[type="submit"]').click()
  await page.waitForFunction(() => window.__opened.length > 0, null, { timeout: 4000 }).catch(() => {})
  const url = await page.evaluate(() => window.__opened[0] || '')
  const raw = decodeURIComponent(url.split('?text=')[1] || '')
  console.log(`  ${s.label.padEnd(34)} encoded URL length = ${String(url.length).padStart(5)}  (decoded message ${raw.length} chars, ${new TextEncoder().encode(raw).length} UTF-8 bytes)  ${url.length > 2000 ? '>>> EXCEEDS the 2000-char practical URL limit' : 'within 2000'}`)
}

console.log('\n--- (D) layout with maximum-length values (overflow + screenshots) ---')
for (const w of [390, 1440]) {
  await page.setViewportSize({ width: w, height: 900 })
  await reset()
  await setVia('name', rep(80, 'M'), 'fill')
  await setVia('phone', rep(30, '9'), 'fill')
  await setVia('place', rep(60, 'M'), 'fill')
  await setVia('when', rep(60, 'M'), 'fill')
  await setVia('note', rep(400, 'M'), 'fill')
  await page.locator('#randevu').scrollIntoViewIfNeeded()
  const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }))
  console.log(`  w=${w}: scrollWidth=${ov.sw} innerWidth=${ov.iw} -> ${ov.sw > ov.iw ? 'HORIZONTAL OVERFLOW' : 'no overflow'}`)
  await page.screenshot({ path: `${DIR}/form-maxlen-${w}.png` })
  // now the error message at max width: submit with nothing but a huge note
  await reset()
  await setVia('note', rep(400, 'M'), 'fill')
  await page.locator('#reqForm button[type="submit"]').click()
  await page.waitForSelector('#reqErr:not([hidden])')
  const ov2 = await page.evaluate(() => {
    const e = document.querySelector('#reqErr')
    return { sw: document.documentElement.scrollWidth, iw: window.innerWidth, errText: e.textContent, errW: e.getBoundingClientRect().width, formW: document.querySelector('#reqForm').getBoundingClientRect().width }
  })
  console.log(`  w=${w}: error shown "${ov2.errText}" errWidth=${ov2.errW.toFixed(0)} formWidth=${ov2.formW.toFixed(0)} overflow=${ov2.sw > ov2.iw}`)
  await page.screenshot({ path: `${DIR}/form-err-${w}.png` })
}

console.log('\n--- errors ---')
console.log(errs.length ? errs.join('\n') : '(none)')
await browser.close()
