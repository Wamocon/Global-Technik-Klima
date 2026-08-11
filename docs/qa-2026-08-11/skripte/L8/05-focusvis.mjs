/** Visual proof for the focus-indicator cases that measured inconsistently. */
import { launch, openPage, revealAll, DIR, contrast, r2 } from './lib.mjs'
import fs from 'node:fs'

const CASES = [
  ['hero-btn-primary', '.hero .cta .btn-primary'],
  ['hero-btn-ghost', '.hero .cta .btn:not(.btn-primary)'],
  ['ratingbig', '.ratingbig'],
  ['toggle-sun-yes', '.toggle button[data-sun="1"]'],
  ['toggle-sun-no', '.toggle button[data-sun="0"]'],
  ['form-name', '#reqForm input[name=name]'],
  ['form-textarea', '#reqForm textarea'],
  ['chat-input', '#cin'],
  ['chat-send', '#cform button[type=submit]'],
  ['chip', '#cchips button'],
  ['map-iframe', '.cmap iframe'],
]

const browser = await launch()
for (const theme of ['dark', 'light']) {
  const { page, ctx } = await openPage(browser, { url: '/', theme, viewport: 'desktop' })
  await revealAll(page)
  await page.waitForFunction(() => document.fonts.status === 'loaded')
  // freeze the hero canvas so it cannot add noise between the two shots
  await page.evaluate(() => { const c = document.getElementById('frost'); if (c) c.style.visibility = 'hidden' })
  await page.click('#chatfab')
  await page.waitForFunction(() => !document.getElementById('chatpanel').hidden)

  for (const [name, sel] of CASES) {
    const el = await page.$(sel)
    if (!el) { console.log(`${theme} ${name}: absent`); continue }
    await page.evaluate((s) => {
      const e = document.querySelector(s)
      if (getComputedStyle(e).position !== 'fixed' && !e.closest('.mobar,#chatpanel,.topbar')) e.scrollIntoView({ block: 'center', behavior: 'instant' })
    }, sel)
    await revealAll(page)
    await page.waitForFunction(() => document.getAnimations().filter((a) => a.playState === 'running').length === 0, null, { timeout: 4000 }).catch(() => {})
    const box = await page.evaluate((s) => {
      const r = document.querySelector(s).getBoundingClientRect()
      const p = 14
      return { x: Math.max(0, Math.floor(r.left - p)), y: Math.max(0, Math.floor(r.top - p)), width: Math.min(innerWidth, Math.ceil(r.width + 2 * p)), height: Math.min(innerHeight, Math.ceil(r.height + 2 * p)) }
    }, sel)
    // unfocused first
    await page.evaluate(() => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur() })
    const before = await page.screenshot({ type: 'png', clip: box })
    await page.keyboard.press('Tab')
    await page.evaluate((s) => document.querySelector(s).focus(), sel)
    await page.waitForFunction((s) => document.activeElement === document.querySelector(s), sel).catch(() => {})
    const after = await page.screenshot({ type: 'png', clip: box })
    const st = await page.evaluate((s) => {
      const e = document.querySelector(s), c = getComputedStyle(e)
      const parentsClip = []
      let n = e.parentElement
      while (n && n !== document.body) { const pc = getComputedStyle(n); if (pc.overflow !== 'visible' || pc.clipPath !== 'none') parentsClip.push(`${n.tagName}.${(n.className || '').toString().split(' ')[0]}:overflow=${pc.overflow}${pc.clipPath !== 'none' ? ',clip-path=' + pc.clipPath : ''}`); n = n.parentElement }
      return { fv: e.matches(':focus-visible'), outline: `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor} off:${c.outlineOffset}`, parentsClip }
    }, sel)
    const diff = await page.evaluate(async ({ a, b }) => {
      const dec = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, c.width, c.height).data }
      const A = await dec(a), B = await dec(b)
      let changed = 0, best = 0, pa = null, pb = null
      for (let i = 0; i < A.length; i += 4) {
        const d = Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2])
        if (d > 24) { changed++; if (d > best) { best = d; pa = [A[i], A[i + 1], A[i + 2]]; pb = [B[i], B[i + 1], B[i + 2]] } }
      }
      return { changed, unfocusedPixel: pa, focusedPixel: pb }
    }, { a: before.toString('base64'), b: after.toString('base64') })
    const c = diff.focusedPixel && diff.unfocusedPixel ? r2(contrast(diff.focusedPixel, diff.unfocusedPixel)) : null
    console.log(`${theme.padEnd(5)} ${name.padEnd(18)} changed=${String(diff.changed).padStart(5)}px  indicator rgb(${diff.focusedPixel}) over rgb(${diff.unfocusedPixel}) = ${c}:1  fv=${st.fv} outline=[${st.outline}]`)
    if (st.parentsClip.length) console.log(`        clipping ancestors: ${st.parentsClip.slice(0, 3).join(' | ')}`)
    fs.writeFileSync(`${DIR}/focus-${theme}-${name}-unfocused.png`, before)
    fs.writeFileSync(`${DIR}/focus-${theme}-${name}-focused.png`, after)
  }
  await ctx.close()
}
await browser.close()
