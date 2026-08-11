// L2 — NEGATIVE / INVALID INPUT lens · BTU calculator #ca #cp
// Equivalence partitioning of the INVALID classes for type=number + clamp-without-writeback.
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')

const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L2'
const rows = []

const run = async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.locator('#kesif').scrollIntoViewIfNeeded()
  await page.waitForSelector('#cbtu')

  const read = () => page.evaluate(() => {
    const a = document.getElementById('ca'), p = document.getElementById('cp')
    const cta = document.getElementById('ccta')
    const href = cta.getAttribute('href')
    const txt = decodeURIComponent((href.split('text=')[1] || ''))
    return {
      // .value = sanitized IDL value; what the USER SEES is the raw text the field holds
      caValue: a.value, cpValue: p.value,
      caBadInput: a.validity.badInput, cpBadInput: p.validity.badInput,
      caRangeOver: a.validity.rangeOverflow, caRangeUnder: a.validity.rangeUnderflow,
      btu: document.getElementById('cbtu').textContent,
      ctaMsg: txt,
    }
  })

  // What the user visually sees inside the number field (raw editing buffer)
  const seen = async () => page.evaluate(() => {
    const a = document.getElementById('ca')
    // for type=number Chromium exposes the raw text only via the a11y/rendered value;
    // validity.badInput===true means the visible text is NOT a valid number and .value is ''
    return { badInput: a.validity.badInput, idl: a.value }
  })

  async function typeArea(raw, label) {
    await page.locator('#ca').click()
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Delete')
    if (raw !== '') await page.keyboard.type(raw)
    await page.waitForTimeout(0)
    const s = await read()
    const vis = await seen()
    rows.push({ case: label, typed: JSON.stringify(raw), ...s, visibleIsInvalid: vis.badInput })
    return s
  }

  const cases = ['abc', '1e5', '--5', '1.5.2', ' ', '', '0', '-5', '500', '1000000', '6', '200', '201',
    '0.5', '5', '25abc', '+-', 'ı', '٥٠', '1,5', '1.5', 'Infinity', 'NaN', '  12  ', '1e-5', '2e3']
  for (const c of cases) await typeArea(c, 'AREA type ' + JSON.stringify(c))

  // paste (clipboard) path — bypasses keystroke filtering
  await page.locator('#ca').click()
  await page.keyboard.press('Control+a')
  const pasted = await page.evaluate(async () => {
    const a = document.getElementById('ca')
    const dt = new DataTransfer()
    dt.setData('text/plain', '9999')
    a.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }))
    // native paste is not scriptable in a sandbox; emulate the end state a real paste produces
    a.value = '9999'
    a.dispatchEvent(new Event('input', { bubbles: true }))
    return a.value
  })
  rows.push({ case: 'AREA paste 9999 (programmatic)', typed: '"9999"', ...(await read()), visibleIsInvalid: false, note: 'value after paste=' + pasted })

  // people field invalid classes
  async function typePpl(raw, label) {
    await page.locator('#ca').click(); await page.keyboard.press('Control+a'); await page.keyboard.type('25')
    await page.locator('#cp').click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete')
    if (raw !== '') await page.keyboard.type(raw)
    const s = await read()
    rows.push({ case: label, typed: JSON.stringify(raw), ...s, visibleIsInvalid: s.cpBadInput })
  }
  for (const c of ['abc', '0', '-3', '999', '1e3', '2.7', '']) await typePpl(c, 'PEOPLE type ' + JSON.stringify(c))

  console.log('case | typed | #ca .value | badInput | #cbtu | cta msg')
  for (const r of rows) {
    console.log(`${r.case} | typed=${r.typed} | ca.value=${JSON.stringify(r.caValue)} cp.value=${JSON.stringify(r.cpValue)} | badInput(ca)=${r.caBadInput} badInput(cp)=${r.cpBadInput} | #cbtu=${r.btu} | msg=${JSON.stringify(r.ctaMsg)}${r.note ? ' | ' + r.note : ''}`)
  }

  // ---- targeted defect proof: 500 typed, 200 used, no write-back ----
  await page.locator('#ca').click(); await page.keyboard.press('Control+a'); await page.keyboard.type('500')
  await page.locator('#cp').click(); await page.keyboard.press('Control+a'); await page.keyboard.type('9')
  const proof = await read()
  console.log('\nPROOF clamp-no-writeback:', JSON.stringify(proof, null, 1))
  await page.locator('#kesif .calc').screenshot({ path: DIR + '/DEF_btu_clamp_500.png' })

  await page.locator('#ca').click(); await page.keyboard.press('Control+a'); await page.keyboard.type('abc')
  const proof2 = await read()
  console.log('\nPROOF badInput fallback to 25:', JSON.stringify(proof2, null, 1))
  await page.locator('#kesif .calc').screenshot({ path: DIR + '/DEF_btu_abc.png' })

  await page.locator('#ca').click(); await page.keyboard.press('Control+a'); await page.keyboard.type('-5')
  const proof3 = await read()
  console.log('\nPROOF negative:', JSON.stringify(proof3, null, 1))
  await page.locator('#kesif .calc').screenshot({ path: DIR + '/DEF_btu_negative.png' })

  console.log('\nconsole errors: ' + (errs.length ? errs.join('\n') : '(none)'))
  await browser.close()
}
run().catch((e) => { console.error(e); process.exit(1) })
