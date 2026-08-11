// Objective RTL oracle: compare the visual x-order of first vs last character of an
// RTL string inside the shipped chat bubble (dir=ltr) against a dir=auto control.
import { chromium, BASE } from './pw.mjs'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
const p = await ctx.newPage()
await p.goto(BASE + '/', { waitUntil: 'networkidle' })
const out = await p.evaluate(() => {
  const texts = { arabic: 'مرحبا، أريد تكييف هواء لغرفة نومي؟', hebrew: 'שלום, אני צריך מזגן?', mixed: 'Gree GWH09 مكيف 24000 BTU' }
  const res = {}
  for (const [k, t] of Object.entries(texts)) {
    res[k] = {}
    for (const d of ['ltr', 'auto', 'rtl']) {
      const s = document.createElement('span')
      s.style.cssText = 'position:absolute;left:0;top:0;font-size:16px;white-space:nowrap'
      s.setAttribute('dir', d); s.textContent = t
      document.body.appendChild(s)
      const node = s.firstChild
      const rectAt = (i) => { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1); const b = r.getBoundingClientRect(); return Math.round(b.left) }
      res[k][d] = { firstCharX: rectAt(0), lastCharX: rectAt(t.length - 1), width: Math.round(s.getBoundingClientRect().width), firstIsRightOfLast: rectAt(0) > rectAt(t.length - 1) }
      s.remove()
    }
    res[k].ltrMatchesAuto = res[k].ltr.firstCharX === res[k].auto.firstCharX && res[k].ltr.lastCharX === res[k].auto.lastCharX
  }
  return res
})
console.log(JSON.stringify(out, null, 1))
await b.close()
