import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L2'
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage()
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' })
await p.locator('#kesif').scrollIntoViewIfNeeded()
for (const [v, name] of [['--5', 'minusminus5'], ['500', 'clamp500'], ['-5', 'neg5'], ['0', 'zero']]) {
  await p.locator('#ca').click(); await p.keyboard.press('Control+a'); await p.keyboard.press('Delete'); await p.keyboard.type(v)
  const s = await p.evaluate(() => ({ idl: document.getElementById('ca').value, bad: document.getElementById('ca').validity.badInput, over: document.getElementById('ca').validity.rangeOverflow, under: document.getElementById('ca').validity.rangeUnderflow, btu: document.getElementById('cbtu').textContent, cta: decodeURIComponent(document.getElementById('ccta').getAttribute('href').split('text=')[1] || '') }))
  console.log(`typed ${JSON.stringify(v)} → ${JSON.stringify(s)}`)
  await p.locator('#kesif .calc').screenshot({ path: `${DIR}/DEF_btu_${name}.png` })
}
await b.close()
