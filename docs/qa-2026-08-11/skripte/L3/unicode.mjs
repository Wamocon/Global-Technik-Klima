// L3 — Unicode / script edge cases in every text input.
// Techniques: input-domain character-class partitioning + negative-edge probing
// (lone surrogate from maxlength truncation), with a round-trip oracle:
//   decodeURIComponent(wa.me text) must contain exactly what the field held (trimmed).
import { chromium, BASE, DIR } from './pw.mjs'

const STR = {
  turkish: 'İ ı Ş ş Ğ ğ Ç ç Ö ö Ü ü İstanbul ISI ısı KLIMA',
  cyrillic: 'Пример Жёлтый Щенок Ъ Ы Э Ю Я',
  german: 'Größe Straße Kühlmittel-Test ÄÖÜäöüß',
  emoji: 'Klima 😀🥶❄️ ok',
  zwjFamily: 'Aile 👨‍👩‍👧‍👦 evi',
  combining: 'Alanya i̇şı́ oğlü',           // combining dot above / cedilla / acute / breve / diaeresis
  arabic: 'مرحبا، أريد تكييف هواء لغرفة نومي؟',
  hebrew: 'שלום, אני צריך מזגן לחדר השינה',
  mixedRtl: 'Gree GWH09 مكيف 24000 BTU',
  zeroWidthOnly: '​‌‍⁠',
  whitespacePad: '   Ali Veli   ',
  newlines: 'satir1\nsatir2\n\nsatir4',
  longWord: 'K'.repeat(200),
  longUrlWord: 'https://example.com/' + 'a'.repeat(180),
  loneSurrogateBySplit: 'X' + '😀'.repeat(40),   // 81 UTF-16 units -> maxlength 80 may split the last pair
  loneSurrogateDirect: 'X\uD83D',                // an actual lone high surrogate
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()) })
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null } })

const reset = async () => page.evaluate(() => { document.querySelector('#reqForm').reset(); window.__opened = []; document.querySelector('#reqErr').hidden = true })

// ─────────────────────────── A. FORM FIELDS ────────────────────────────────
console.log('=== A. FORM: per-field round-trip into the wa.me deeplink ===')
console.log('case                  | field | typed len | value len | in link? | round-trip exact? | notes')
const formCases = [
  ['turkish', 'name'], ['cyrillic', 'name'], ['german', 'name'], ['emoji', 'name'],
  ['zwjFamily', 'name'], ['combining', 'name'], ['arabic', 'place'], ['hebrew', 'place'],
  ['mixedRtl', 'when'], ['zeroWidthOnly', 'name'], ['whitespacePad', 'name'],
  ['newlines', 'note'], ['longWord', 'note'], ['longUrlWord', 'note'],
  ['loneSurrogateBySplit', 'name'], ['loneSurrogateDirect', 'name'],
]
for (const [key, field] of formCases) {
  await reset()
  const s = STR[key]
  // required fields always filled so submit can proceed
  await page.locator('#reqForm [name="name"]').fill('Test Ad')
  await page.locator('#reqForm [name="phone"]').fill('+90 533 000 00 00')
  await page.locator('#reqForm [name="consent"]').check()
  let valLen = -1, threw = ''
  try {
    if (key === 'loneSurrogateDirect') {
      await page.evaluate(([n, v]) => { const e = document.querySelector(`#reqForm [name="${n}"]`); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })) }, [field, s])
    } else {
      await page.locator(`#reqForm [name="${field}"]`).fill(s)
    }
    valLen = await page.evaluate((n) => document.querySelector(`#reqForm [name="${n}"]`).value.length, field)
  } catch (e) { threw = 'FILL THREW: ' + e.message.split('\n')[0] }
  const before = errs.length
  await page.locator('#reqForm button[type="submit"]').click()
  await page.waitForFunction(() => window.__opened.length > 0, null, { timeout: 2500 }).catch(() => {})
  const url = await page.evaluate(() => window.__opened[0] || '')
  const actualVal = await page.evaluate((n) => document.querySelector(`#reqForm [name="${n}"]`).value, field)
  let decoded = ''
  try { decoded = decodeURIComponent(url.split('?text=')[1] || '') } catch (e) { decoded = '<<undecodable: ' + e.message + '>>' }
  const expected = actualVal.trim()
  const inLink = expected ? decoded.includes(expected) : '(empty after trim)'
  const newErr = errs.slice(before)
  console.log(`${key.padEnd(21)} | ${field.padEnd(5)} | ${String(s.length).padEnd(9)} | ${String(valLen).padEnd(9)} | ${String(url ? 'yes' : 'NO LINK OPENED').padEnd(8)} | ${String(inLink).padEnd(17)} | ${threw}${newErr.length ? ' ' + newErr.join(' ; ') : ''}`)
  if (!url) console.log(`    >>> SUBMIT PRODUCED NO DEEPLINK. field value (JSON) = ${JSON.stringify(actualVal).slice(0, 120)}`)
}

// lone-surrogate detail probe
console.log('\n=== A2. lone-surrogate detail ===')
await reset()
await page.locator('#reqForm [name="name"]').fill(STR.loneSurrogateBySplit)
const probe = await page.evaluate(() => {
  const v = document.querySelector('#reqForm [name="name"]').value
  const codes = [...v].length
  const last = v.charCodeAt(v.length - 1)
  let enc = 'ok'
  try { encodeURIComponent(v) } catch (e) { enc = 'THROWS: ' + e.message }
  return { len: v.length, codePoints: codes, lastUnit: last.toString(16), lone: last >= 0xd800 && last <= 0xdbff, enc }
})
console.log(`  filled 'X'+40x😀 (81 UTF-16 units) -> value.length=${probe.len} codePoints=${probe.codePoints} lastUnit=U+${probe.lastUnit.toUpperCase()} isLoneHighSurrogate=${probe.lone} encodeURIComponent=${probe.enc}`)
const probe2 = await page.evaluate(() => {
  const e = document.querySelector('#reqForm [name="name"]'); e.value = 'X\uD83D'
  let enc = 'ok'; try { encodeURIComponent(e.value) } catch (err) { enc = 'THROWS: ' + err.message }
  return { len: e.value.length, enc }
})
console.log(`  direct .value='X\\uD83D' -> value.length=${probe2.len} encodeURIComponent=${probe2.enc}`)

// ─────────────────────────── B. CHAT INPUT ─────────────────────────────────
console.log('\n=== B. CHAT: bubble round-trip + overflow ===')
await page.locator('#chatfab').click()
await page.waitForSelector('#chatpanel:not([hidden])')
const chatCases = ['turkish', 'cyrillic', 'german', 'emoji', 'zwjFamily', 'combining', 'arabic', 'hebrew', 'mixedRtl', 'zeroWidthOnly', 'whitespacePad', 'longWord', 'longUrlWord', 'loneSurrogateDirect']
console.log('case                  | bubble text === input? | doc overflow | cbody h-scroll | bubble w / panel w')
for (const key of chatCases) {
  const s = STR[key]
  const beforeN = await page.evaluate(() => document.querySelectorAll('#cbody .msg.me').length)
  if (key === 'loneSurrogateDirect') {
    await page.evaluate((v) => { const e = document.getElementById('cin'); e.value = v }, s)
  } else {
    await page.locator('#cin').fill(s)
  }
  await page.locator('#cform button[type="submit"]').click()
  await page.waitForFunction((n) => document.querySelectorAll('#cbody .msg.me').length > n, beforeN, { timeout: 3000 }).catch(() => {})
  const r = await page.evaluate(() => {
    const ms = document.querySelectorAll('#cbody .msg.me')
    const last = ms[ms.length - 1]
    const b = last?.querySelector('.b')
    const body = document.getElementById('cbody')
    const panel = document.getElementById('chatpanel')
    return {
      text: b?.textContent ?? null,
      bubbleW: b ? Math.round(b.getBoundingClientRect().width) : 0,
      bubbleRight: b ? Math.round(b.getBoundingClientRect().right) : 0,
      panelRight: Math.round(panel.getBoundingClientRect().right),
      panelW: Math.round(panel.getBoundingClientRect().width),
      bodyScrollW: body.scrollWidth, bodyClientW: body.clientWidth,
      docSW: document.documentElement.scrollWidth, iw: window.innerWidth,
    }
  })
  const same = r.text === s
  console.log(`${key.padEnd(21)} | ${String(same).padEnd(22)} | ${String(r.docSW > r.iw ? 'OVERFLOW ' + r.docSW + '>' + r.iw : 'none').padEnd(12)} | ${String(r.bodyScrollW > r.bodyClientW ? 'YES ' + r.bodyScrollW + '>' + r.bodyClientW : 'no').padEnd(14)} | ${r.bubbleW} / ${r.panelW}${r.bubbleRight > r.panelRight ? '  <<< BUBBLE SPILLS PAST PANEL EDGE' : ''}`)
  if (!same) console.log(`    input   = ${JSON.stringify(s).slice(0, 160)}\n    bubble  = ${JSON.stringify(r.text).slice(0, 160)}`)
}
await page.screenshot({ path: `${DIR}/chat-unicode-1280.png` })

// mobile check of the same content
await page.setViewportSize({ width: 390, height: 844 })
await page.locator('#cin').fill(STR.longWord)
await page.locator('#cform button[type="submit"]').click()
await page.waitForFunction(() => true)
const mob = await page.evaluate(() => {
  const body = document.getElementById('cbody')
  return { docSW: document.documentElement.scrollWidth, iw: window.innerWidth, bodyScrollW: body.scrollWidth, bodyClientW: body.clientWidth }
})
console.log(`\n  mobile 390px with a 200-char unbroken word: doc ${mob.docSW}/${mob.iw} ${mob.docSW > mob.iw ? 'OVERFLOW' : 'ok'} ; cbody ${mob.bodyScrollW}/${mob.bodyClientW} ${mob.bodyScrollW > mob.bodyClientW ? 'H-SCROLL INSIDE CHAT' : 'ok'}`)
await page.screenshot({ path: `${DIR}/chat-longword-390.png` })

console.log('\n=== collected page/console errors ===')
console.log(errs.length ? errs.join('\n') : '(none)')
await browser.close()
