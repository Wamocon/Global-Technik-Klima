// Measure inside the REAL chat bubble: shipped bubble (no dir attr) vs the same node
// with dir="auto". 2 runs.
import { chromium, BASE } from './pw.mjs'
const b = await chromium.launch()
for (let run = 1; run <= 2; run++) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
  const p = await ctx.newPage()
  await p.goto(BASE + '/', { waitUntil: 'networkidle' })
  await p.locator('#chatfab').click()
  await p.waitForSelector('#chatpanel:not([hidden])')
  const send = async (t) => {
    const n = await p.evaluate(() => document.querySelectorAll('#cbody .msg').length)
    await p.locator('#cin').fill(t)
    await p.locator('#cform button[type="submit"]').click()
    await p.waitForFunction((k) => document.querySelectorAll('#cbody .msg').length >= k + 2 && !document.querySelector('#cbody .msg.typing'), n, { timeout: 5000 }).catch(() => {})
  }
  await send('שלום, אני צריך מזגן?')
  const r = await p.evaluate(() => {
    const bs = [...document.querySelectorAll('#cbody .msg.me .b')]
    const el = bs[bs.length - 1]
    const t = el.textContent
    const measure = () => {
      const node = el.firstChild
      const at = (i) => { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1); return Math.round(r.getBoundingClientRect().left) }
      return { first: at(0), last: at(t.length - 1), boxLeft: Math.round(el.getBoundingClientRect().left), boxRight: Math.round(el.getBoundingClientRect().right) }
    }
    const shipped = { dirAttr: el.getAttribute('dir'), computed: getComputedStyle(el).direction, ...measure() }
    el.setAttribute('dir', 'auto')
    const withAuto = { dirAttr: 'auto', computed: getComputedStyle(el).direction, ...measure() }
    el.removeAttribute('dir')
    return { text: t, shipped, withAuto }
  })
  const finalPunctSideShipped = r.shipped.last > r.shipped.first ? 'RIGHT of sentence start' : 'LEFT of sentence start'
  const finalPunctSideAuto = r.withAuto.last > r.withAuto.first ? 'RIGHT of sentence start' : 'LEFT of sentence start'
  console.log(`run${run}: text=${JSON.stringify(r.text)}`)
  console.log(`  shipped (no dir, computed=${r.shipped.computed}): first-char x=${r.shipped.first} last-char("?") x=${r.shipped.last} -> "?" sits ${finalPunctSideShipped}`)
  console.log(`  with dir="auto" (computed=${r.withAuto.computed}): first-char x=${r.withAuto.first} last-char("?") x=${r.withAuto.last} -> "?" sits ${finalPunctSideAuto}`)
  console.log(`  differ? ${r.shipped.last !== r.withAuto.last ? 'YES — bidi ordering changes' : 'no'}`)
  await ctx.close()
}
await b.close()
