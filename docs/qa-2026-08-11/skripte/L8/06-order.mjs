/**
 * Complete tab traversal. Elements are stamped with data-l8 on first visit so a
 * revisit (wrap-around or trap) is detected by node identity, not by a text
 * signature — two unlabelled inputs share a signature and falsely looked like a wrap.
 */
import { launch, openPage, revealAll, saveJSON, DIR } from './lib.mjs'

const browser = await launch()
const out = {}

async function axOf(cdp, expr) {
  const { result } = await cdp.send('Runtime.evaluate', { expression: expr })
  if (!result.objectId) return {}
  try {
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false })
    const n = nodes[nodes.length - 1]
    return { role: n?.role?.value ?? null, name: n?.name?.value ?? null, nameFrom: n?.name?.sources?.find((s) => s.value)?.type ?? null }
  } catch { return {} }
}

for (const vp of ['desktop', 'mobile']) {
  const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: vp })
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Accessibility.enable')
  await revealAll(page)
  await page.waitForFunction(() => document.fonts.status === 'loaded')
  await page.evaluate(() => { scrollTo(0, 0); if (document.activeElement?.blur) document.activeElement.blur() })

  const stops = []
  let verdict = 'completed'
  for (let i = 0; i < 200; i++) {
    await page.keyboard.press('Tab')
    const r = await page.evaluate((idx) => {
      const a = document.activeElement
      if (!a || a === document.body || a === document.documentElement) return { body: true }
      const revisit = a.dataset.l8 !== undefined ? Number(a.dataset.l8) : null
      if (revisit === null) a.dataset.l8 = String(idx)
      const rc = a.getBoundingClientRect()
      const bar = document.querySelector('.topbar')?.getBoundingClientRect()
      const mo = document.querySelector('.mobar')
      const moR = mo && getComputedStyle(mo).display !== 'none' ? mo.getBoundingClientRect() : null
      // DOM order index among all focusable, for "logical order" comparison
      const all = [...document.querySelectorAll('a[href],button,input,select,textarea,iframe,[tabindex]:not([tabindex="-1"])')].filter((e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed')
      return {
        revisit, tag: a.tagName, id: a.id || null,
        cls: typeof a.className === 'string' ? a.className.split(/\s+/).filter((c) => c && !c.startsWith('astro-') && c !== 'shown').join('.') : null,
        text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
        rect: { x: Math.round(rc.x), y: Math.round(rc.y), w: Math.round(rc.width), h: Math.round(rc.height) },
        docY: Math.round(rc.y + scrollY), scrollY: Math.round(scrollY),
        domIndex: all.indexOf(a),
        obscuredTopbar: !!(bar && !a.closest('.topbar') && rc.top < bar.bottom && rc.bottom > bar.top),
        coveredPct: bar && !a.closest('.topbar') ? Math.round((Math.max(0, Math.min(rc.bottom, bar.bottom) - Math.max(rc.top, bar.top)) / Math.max(1, rc.height)) * 100) : 0,
        obscuredMobar: !!(moR && !a.closest('.mobar') && rc.bottom > moR.top && rc.top < moR.bottom),
        coveredMobarPct: moR && !a.closest('.mobar') ? Math.round((Math.max(0, Math.min(rc.bottom, moR.bottom) - Math.max(rc.top, moR.top)) / Math.max(1, rc.height)) * 100) : 0,
        inIframe: a.tagName === 'IFRAME',
      }
    }, i)
    if (r.body) { stops.push({ i, body: true }); verdict = 'focus left document (browser chrome) — no trap'; break }
    if (r.revisit !== null) { stops.push({ i, ...r, wrapTo: r.revisit }); verdict = r.revisit === 0 ? 'wrapped to first stop — complete, no trap' : `revisited stop ${r.revisit} — possible trap`; break }
    const ax = await axOf(cdp, 'document.activeElement')
    stops.push({ i, ...r, ...ax })
  }
  // reverse traversal from the last real stop
  await page.evaluate(() => { scrollTo(0, 0); if (document.activeElement?.blur) document.activeElement.blur() })
  const rev = []
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Shift+Tab')
    const r = await page.evaluate(() => {
      const a = document.activeElement
      if (!a || a === document.body) return { body: true }
      return { tag: a.tagName, id: a.id || null, text: (a.textContent || '').trim().slice(0, 30), cls: typeof a.className === 'string' ? a.className.split(/\s+/).filter((c) => c && !c.startsWith('astro-')).join('.') : null }
    })
    rev.push(r)
    if (r.body) break
  }
  out[vp] = { stops, verdict, reverse: rev }
  // Screenshot the sticky-header-obscured case, if any
  const obs = stops.find((s) => s.obscuredTopbar && s.coveredPct > 20)
  if (obs) {
    await page.evaluate(() => { scrollTo(0, 0); if (document.activeElement?.blur) document.activeElement.blur() })
    for (let k = 0; k <= obs.i; k++) await page.keyboard.press('Tab')
    await page.screenshot({ path: `${DIR}/focus-obscured-topbar-${vp}.png` })
  }
  const obs2 = stops.find((s) => s.obscuredMobar && s.coveredMobarPct > 20)
  if (obs2) {
    await page.evaluate(() => { scrollTo(0, 0); if (document.activeElement?.blur) document.activeElement.blur() })
    for (let k = 0; k <= obs2.i; k++) await page.keyboard.press('Tab')
    await page.screenshot({ path: `${DIR}/focus-obscured-mobar-${vp}.png` })
  }
  await ctx.close()
}
await browser.close()
saveJSON('order-raw.json', out)

for (const vp of Object.keys(out)) {
  const o = out[vp]
  console.log(`\n===== TAB ORDER ${vp} — ${o.stops.length} presses — ${o.verdict} =====`)
  let prevDocY = -1e9, inversions = 0
  o.stops.forEach((s) => {
    if (s.body) return console.log(`  ${String(s.i).padStart(3)}  <left document>`)
    const flags = []
    if (s.obscuredTopbar && s.coveredPct > 5) flags.push(`OBSCURED by sticky header ${s.coveredPct}%`)
    if (s.obscuredMobar && s.coveredMobarPct > 5) flags.push(`OBSCURED by .mobar ${s.coveredMobarPct}%`)
    if (s.inIframe) flags.push('IFRAME (Google Maps — contains its own tab stops)')
    if (s.wrapTo !== undefined) flags.push(`wrap -> stop ${s.wrapTo}`)
    if (s.docY < prevDocY - 40) { inversions++; flags.push(`ORDER INVERSION (jumps up ${prevDocY - s.docY}px)`) }
    prevDocY = s.docY
    console.log(`  ${String(s.i).padStart(3)}  ${(s.role || s.tag).padEnd(11)} "${(s.name || s.text || '').slice(0, 44).padEnd(44)}" ${s.id ? '#' + s.id : ''} ${(s.cls || '').split('.').slice(0, 2).join('.')} y=${s.docY} ${s.rect.w}x${s.rect.h}  ${flags.join(' | ')}`)
  })
  console.log(`  order inversions: ${inversions}`)
  console.log(`  reverse (Shift+Tab from top): ${o.reverse.map((r) => r.body ? '<doc>' : (r.id || r.cls || r.tag) + ':' + JSON.stringify(r.text.slice(0, 14))).join(' -> ')}`)
}
