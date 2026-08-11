/** Can a POINTER user reach the chat input when the panel overflows? */
import { launch, openPage, revealAll, saveJSON, DIR } from './lib.mjs'

const browser = await launch()
const out = {}
for (const c of [
  { name: '200pct-zoom-640x360', w: 640, h: 360, dsf: 2 },
  { name: 'landscape-844x390', w: 844, h: 390, dsf: 1 },
  { name: 'portrait-390x844', w: 390, h: 844, dsf: 1 },
]) {
  const reps = []
  for (const run of [1, 2]) {
    const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: { width: c.w, height: c.h }, deviceScaleFactor: c.dsf })
    await revealAll(page)
    await page.click('#chatfab')
    await page.waitForFunction(() => !document.getElementById('chatpanel').hidden)
    const pre = await page.evaluate(() => {
      const p = document.getElementById('chatpanel'), i = document.getElementById('cin')
      const pr = p.getBoundingClientRect(), ir = i.getBoundingClientRect()
      return { panelScrollTop: p.scrollTop, panelScrollH: p.scrollHeight, panelClientH: p.clientHeight, overflowStyle: getComputedStyle(p).overflow, inputTop: Math.round(ir.top), inputBottom: Math.round(ir.bottom), panelBottom: Math.round(pr.bottom), inputHitTestable: (() => { const h = document.elementFromPoint(ir.left + ir.width / 2, ir.top + ir.height / 2); return h ? h.id || h.tagName : null })() }
    })
    // 1) mouse wheel over the middle of the panel
    await page.mouse.move(c.w / 2, Math.min(c.h - 5, 200))
    await page.mouse.wheel(0, 300)
    const afterWheel = await page.evaluate(() => ({ panelScrollTop: document.getElementById('chatpanel').scrollTop, bodyScrollTop: document.getElementById('cbody').scrollTop, windowScrollY: window.scrollY, inputTop: Math.round(document.getElementById('cin').getBoundingClientRect().top) }))
    // 2) touch drag over the panel
    await page.evaluate(() => { const p = document.getElementById('chatpanel'); p.dispatchEvent(new WheelEvent('wheel', { deltaY: 300, bubbles: true })) })
    const afterTouch = await page.evaluate(() => ({ panelScrollTop: document.getElementById('chatpanel').scrollTop, inputTop: Math.round(document.getElementById('cin').getBoundingClientRect().top) }))
    // 3) keyboard: Tab into the input from the close button
    await page.evaluate(() => document.getElementById('cclose').focus())
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab')
    const afterTab = await page.evaluate(() => ({ active: document.activeElement?.id, panelScrollTop: document.getElementById('chatpanel').scrollTop, inputTop: Math.round(document.getElementById('cin').getBoundingClientRect().top), inputVisible: (() => { const r = document.getElementById('cin').getBoundingClientRect(); const p = document.getElementById('chatpanel').getBoundingClientRect(); return r.top >= p.top - 1 && r.bottom <= p.bottom + 1 })(), headerStillVisible: (() => { const r = document.querySelector('.chead').getBoundingClientRect(); const p = document.getElementById('chatpanel').getBoundingClientRect(); return r.bottom > p.top })() }))
    reps.push({ pre, afterWheel, afterTouch, afterTab })
    if (run === 1) { await page.screenshot({ path: `${DIR}/chatreach-${c.name}-afterTab.png` }) }
    await ctx.close()
  }
  out[c.name] = reps
}
await browser.close()
saveJSON('chatreach-raw.json', out)
console.log(JSON.stringify(out, null, 1))
