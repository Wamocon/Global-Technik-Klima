import { chromium, BASE } from './pw.mjs'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 900 } })
const p = await ctx.newPage()
await p.goto(BASE + '/', { waitUntil: 'networkidle' })
const r = await p.evaluate(() => {
  document.documentElement.style.fontSize = '24px'
  const calc = document.querySelector('.calc')
  const wrap = calc.closest('.wrap'); const grid = calc.closest('.calc-grid')
  const out = { wrapW: Math.round(wrap.getBoundingClientRect().width), wrapPad: getComputedStyle(wrap).paddingLeft, gridW: Math.round(grid.getBoundingClientRect().width), calcW: Math.round(calc.getBoundingClientRect().width) }
  // force the container narrow and see who refuses to shrink
  calc.style.width = '290px'
  out.afterForce = [...calc.querySelectorAll('*')].map((e) => ({ s: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '.' + (typeof e.className === 'string' ? e.className.split(' ')[0] : '')), w: Math.round(e.getBoundingClientRect().width), over: Math.round(e.getBoundingClientRect().right - calc.getBoundingClientRect().right) })).filter((x) => x.over > 1).sort((a, z) => z.over - a.over).slice(0, 6)
  calc.style.width = ''
  return out
})
console.log(JSON.stringify(r, null, 1))
await b.close()
