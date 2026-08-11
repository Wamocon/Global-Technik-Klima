/** Verification pass for the candidate defects, each reproduced twice. */
import { launch, openPage, revealAll, saveJSON, DIR, contrast, r2 } from './lib.mjs'

const browser = await launch()
const out = {}

// ── 1. what exactly overflows at 320 CSS px? ─────────────────────────────────
out.overflow320 = []
for (const run of [1, 2]) {
  const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: { width: 320, height: 640 } })
  await revealAll(page)
  await page.waitForFunction(() => document.fonts.status === 'loaded')
  const r = await page.evaluate(() => {
    const bad = []
    for (const e of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(e)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      const r = e.getBoundingClientRect()
      if (r.right > innerWidth + 1 && r.height > 1 && r.width > 1) {
        // does it actually contribute to the scroll width? (not inside an overflow:hidden ancestor)
        let clipped = false, n = e.parentElement
        while (n && n !== document.documentElement) { const p = getComputedStyle(n); if (p.overflow !== 'visible' && p.overflowX !== 'visible') { clipped = true; break } n = n.parentElement }
        bad.push({ tag: e.tagName, cls: (typeof e.className === 'string' ? e.className : '').split(/\s+/).filter((c) => c && !c.startsWith('astro-')).slice(0, 3).join('.'), right: Math.round(r.right), w: Math.round(r.width), clippedByAncestor: clipped, pos: cs.position, text: (e.textContent || '').trim().slice(0, 26) })
      }
    }
    return { docScrollW: document.documentElement.scrollWidth, bodyScrollW: document.body.scrollWidth, innerW: innerWidth, canScroll: (() => { scrollTo(200, 0); const x = window.scrollX; scrollTo(0, 0); return x })(), unclipped: bad.filter((b) => !b.clippedByAncestor), total: bad.length }
  })
  out.overflow320.push(r)
  if (run === 1) { await page.evaluate(() => scrollTo(400, 0)); await page.screenshot({ path: `${DIR}/reflow-320-scrolled-right.png` }) }
  await ctx.close()
}

// ── 2. chat panel clipping at 200% zoom / landscape / 400% ───────────────────
out.chatClip = {}
for (const c of [
  { name: '200pct-1280 (640x360)', w: 640, h: 360, dsf: 2 },
  { name: 'landscape-390x844 (844x390)', w: 844, h: 390, dsf: 1 },
  { name: '400pct-1280 (320x180)', w: 320, h: 180, dsf: 4 },
  { name: 'phone-portrait 390x844', w: 390, h: 844, dsf: 1 },
]) {
  const reps = []
  for (const run of [1, 2]) {
    const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: { width: c.w, height: c.h }, deviceScaleFactor: c.dsf })
    await revealAll(page)
    await page.click('#chatfab')
    await page.waitForFunction(() => !document.getElementById('chatpanel').hidden)
    const m = await page.evaluate(() => {
      const p = document.getElementById('chatpanel')
      const pr = p.getBoundingClientRect()
      const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), insidePanel: r.bottom <= pr.bottom + 0.5 && r.top >= pr.top - 0.5, inViewport: r.top >= 0 && r.bottom <= innerHeight } }
      return {
        viewport: { w: innerWidth, h: innerHeight },
        panel: { top: Math.round(pr.top), bottom: Math.round(pr.bottom), h: Math.round(pr.height), maxH: getComputedStyle(p).maxHeight, scrollH: p.scrollHeight, clientH: p.clientHeight, overflow: getComputedStyle(p).overflow },
        header: q('.chead'), disclosure: q('.cdisc'), body: q('#cbody'), chips: q('#cchips'), form: q('.cform'), input: q('#cin'), send: q('.cform button'),
        panelContentClipped: p.scrollHeight > p.clientHeight + 1,
        canFocusInput: (() => { document.getElementById('cin').focus(); return document.activeElement.id === 'cin' })(),
      }
    })
    reps.push(m)
    if (run === 1) await page.screenshot({ path: `${DIR}/chatclip-${c.name.replace(/[^a-z0-9]+/gi, '_')}.png` })
    await ctx.close()
  }
  out.chatClip[c.name] = reps
}

// ── 3. text-only 200% clipping in the hero ───────────────────────────────────
out.textZoom = []
for (const run of [1, 2]) {
  const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: { width: 1280, height: 800 } })
  await revealAll(page)
  await page.waitForFunction(() => document.fonts.status === 'loaded')
  await page.addStyleTag({ content: 'html{font-size:34px !important}' })
  await page.waitForFunction(() => parseFloat(getComputedStyle(document.documentElement).fontSize) > 30)
  await revealAll(page)
  await page.waitForFunction(() => document.getAnimations().filter((a) => a.playState === 'running').length === 0, null, { timeout: 6000 }).catch(() => {})
  const m = await page.evaluate(() => {
    const hero = document.querySelector('.hero')
    const inn = document.querySelector('.hero-in')
    const h1 = document.querySelector('h1.build')
    const lastVisible = document.querySelector('.trustchips')
    const hr = hero.getBoundingClientRect(), ir = inn.getBoundingClientRect(), lr = lastVisible.getBoundingClientRect()
    return {
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      hero: { h: Math.round(hr.height), scrollH: hero.scrollHeight, clientH: hero.clientHeight, overflow: getComputedStyle(hero).overflow },
      heroInner: { top: Math.round(ir.top), bottom: Math.round(ir.bottom), h: Math.round(ir.height) },
      contentBelowHeroBottom: Math.round(ir.bottom - hr.bottom),
      trustchipsVisible: lr.bottom <= hr.bottom + 1,
      trustchipsOverflowPx: Math.round(lr.bottom - hr.bottom),
      h1LineClip: [...document.querySelectorAll('.build .ln')].map((l) => ({ clientH: l.clientHeight, scrollH: l.scrollHeight, clipped: l.scrollHeight > l.clientHeight + 1, text: l.textContent.trim().slice(0, 24) })),
      hScroll: document.documentElement.scrollWidth > innerWidth + 1,
      docScrollW: document.documentElement.scrollWidth, innerW: innerWidth,
      widest: [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && getComputedStyle(e).position !== 'fixed' }).slice(0, 6).map((e) => ({ cls: (typeof e.className === 'string' ? e.className : '').split(/\s+/).filter((c) => c && !c.startsWith('astro-'))[0], right: Math.round(e.getBoundingClientRect().right) })),
    }
  })
  out.textZoom.push(m)
  if (run === 1) await page.screenshot({ path: `${DIR}/textzoom200-hero.png` })
  await ctx.close()
}

// ── 4. 2.4.11 Focus Not Obscured: footer link focused while chat is open ─────
out.focusObscured = []
for (const run of [1, 2]) {
  const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: 'mobile' })
  await revealAll(page)
  await page.click('#chatfab')
  await page.waitForFunction(() => !document.getElementById('chatpanel').hidden)
  const m = await page.evaluate(() => {
    const res = []
    for (const sel of ['.foot .fl a', '.fsoc a', '#reqForm .rf-submit', '.rf-consent input']) {
      const e = document.querySelector(sel)
      if (!e) continue
      e.focus()
      e.scrollIntoView({ block: 'center', behavior: 'instant' })
      const r = e.getBoundingClientRect()
      // is the element's centre point actually hit-testable, or does an overlay win?
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const hit = document.elementFromPoint(cx, cy)
      const corners = [[r.left + 1, r.top + 1], [r.right - 1, r.top + 1], [r.left + 1, r.bottom - 1], [r.right - 1, r.bottom - 1]]
      const covered = corners.filter(([x, y]) => { const h = document.elementFromPoint(x, y); return h && !e.contains(h) && h !== e }).length
      res.push({
        sel, text: (e.textContent || '').trim().slice(0, 24), focused: document.activeElement === e,
        rect: { top: Math.round(r.top), bottom: Math.round(r.bottom) },
        centreHit: hit ? hit.tagName + '.' + (typeof hit.className === 'string' ? hit.className.split(/\s+/)[0] : '') : null,
        centreCoveredByOverlay: !!(hit && !e.contains(hit) && hit !== e),
        cornersCoveredOf4: covered,
        entirelyHidden: covered === 4,
      })
    }
    return res
  })
  out.focusObscured.push(m)
  if (run === 1) {
    await page.evaluate(() => { const a = document.querySelector('.foot .fl a'); a.focus(); a.scrollIntoView({ block: 'center', behavior: 'instant' }) })
    await page.screenshot({ path: `${DIR}/obscured-footer-link-chatopen.png` })
  }
  await ctx.close()
}

// ── 5. usability: blocked popup on submit + confirmation + error recovery ────
out.usability = {}
for (const run of [1, 2]) {
  const { page, ctx, errors } = await openPage(browser, { url: '/', theme: 'dark', viewport: 'mobile' })
  await revealAll(page)
  // simulate a popup blocker: window.open returns null (what Safari/Firefox do
  // when the call is judged not user-initiated, and what content blockers do)
  await page.evaluate(() => { window.__openCalls = []; window.open = (u) => { window.__openCalls.push(u); return null } })
  await page.evaluate(() => document.getElementById('reqForm').scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.fill('#reqForm input[name=name]', 'Ayşe Yılmaz')
  await page.fill('#reqForm input[name=phone]', '05001234567')
  await page.check('.rf-consent input')
  const beforeHTML = await page.evaluate(() => ({
    errHidden: document.getElementById('reqErr').hidden,
    values: [...document.getElementById('reqForm').elements].filter((e) => e.name).map((e) => e.name + '=' + (e.type === 'checkbox' ? e.checked : e.value)),
  }))
  await page.click('#reqForm .rf-submit')
  await page.waitForFunction(() => window.__openCalls.length > 0, null, { timeout: 5000 })
  const afterSubmit = await page.evaluate(() => ({
    openCalls: window.__openCalls,
    errHidden: document.getElementById('reqErr').hidden,
    errText: document.getElementById('reqErr').textContent,
    anyNewVisibleFeedback: (() => {
      // look for any element mentioning success in the 4 locales
      const words = ['gönderildi', 'teşekkür', 'başarı', 'gesendet', 'danke', 'отправлен', 'спасибо', 'sent', 'thank']
      return [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && words.some((w) => (e.textContent || '').toLowerCase().includes(w))).map((e) => e.textContent.trim().slice(0, 60))
    })(),
    formStillFilled: [...document.getElementById('reqForm').elements].filter((e) => e.name).map((e) => e.name + '=' + (e.type === 'checkbox' ? e.checked : e.value)),
    focus: document.activeElement?.tagName + (document.activeElement?.className ? '.' + document.activeElement.className.split(' ')[0] : ''),
    ariaLiveRegions: [...document.querySelectorAll('[aria-live],[role=alert],[role=status]')].map((e) => ({ id: e.id, role: e.getAttribute('role'), live: e.getAttribute('aria-live'), hidden: e.hidden, text: (e.textContent || '').trim().slice(0, 40) })),
  }))
  out.usability[`submitBlockedPopup-run${run}`] = { beforeHTML, afterSubmit, consoleErrors: errors }
  if (run === 1) await page.screenshot({ path: `${DIR}/usability-after-blocked-popup.png` })
  await ctx.close()
}
// error recovery: fix the error and resubmit; does the alert clear?
{
  const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: 'mobile' })
  await revealAll(page)
  await page.evaluate(() => { window.__openCalls = []; window.open = (u) => { window.__openCalls.push(u); return { focus() {} } } })
  await page.evaluate(() => document.getElementById('reqForm').scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.click('#reqForm .rf-submit')
  await page.waitForFunction(() => !document.getElementById('reqErr').hidden)
  const err1 = await page.evaluate(() => ({ text: document.getElementById('reqErr').textContent, focus: document.activeElement?.getAttribute('name'), errInViewport: (() => { const r = document.getElementById('reqErr').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight })(), focusInViewport: (() => { const r = document.activeElement.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight })() }))
  // submit again unchanged: does role=alert re-announce? (identical text = no DOM change)
  const beforeSecond = await page.evaluate(() => document.getElementById('reqErr').textContent)
  await page.click('#reqForm .rf-submit')
  const second = await page.evaluate(() => ({ sameText: document.getElementById('reqErr').textContent === document.getElementById('reqErr').textContent, text: document.getElementById('reqErr').textContent, hidden: document.getElementById('reqErr').hidden }))
  // fill name only -> error should now name only the phone
  await page.fill('#reqForm input[name=name]', 'Ali')
  await page.click('#reqForm .rf-submit')
  const err2 = await page.evaluate(() => ({ text: document.getElementById('reqErr').textContent, focus: document.activeElement?.getAttribute('name') }))
  await page.fill('#reqForm input[name=phone]', '0500')
  await page.click('#reqForm .rf-submit')
  const err3 = await page.evaluate(() => ({ text: document.getElementById('reqErr').textContent, hidden: document.getElementById('reqErr').hidden, focus: document.activeElement?.getAttribute('name') || document.activeElement?.tagName }))
  await page.check('.rf-consent input')
  await page.click('#reqForm .rf-submit')
  await page.waitForFunction(() => window.__openCalls.length > 0)
  const ok = await page.evaluate(() => ({ opened: window.__openCalls, errHidden: document.getElementById('reqErr').hidden }))
  out.usability.errorRecovery = { err1, beforeSecond, second, err2, err3, ok }
  await ctx.close()
}

// ── 6. .rf-err and .rev .ex measured on /de/ in both themes ─────────────────
out.deTargets = {}
for (const theme of ['dark', 'light']) {
  const { page, ctx } = await openPage(browser, { url: '/de/', theme, viewport: 'desktop' })
  await revealAll(page)
  await page.waitForFunction(() => document.fonts.status === 'loaded')
  const measure = async (sel) => {
    await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center', behavior: 'instant' }), sel)
    await revealAll(page)
    const a = (await page.screenshot({ type: 'png' })).toString('base64')
    await page.addStyleTag({ content: '#h{}\n*,*::before,*::after{color:transparent !important;-webkit-text-fill-color:transparent !important;text-shadow:none !important}' })
    await page.waitForFunction(() => getComputedStyle(document.body).color === 'rgba(0, 0, 0, 0)')
    const b = (await page.screenshot({ type: 'png' })).toString('base64')
    await page.evaluate(() => [...document.querySelectorAll('style')].filter((s) => s.textContent.includes('-webkit-text-fill-color:transparent')).forEach((s) => s.remove()))
    await page.waitForFunction(() => getComputedStyle(document.body).color !== 'rgba(0, 0, 0, 0)')
    return page.evaluate(async ({ a, b, sel }) => {
      const load = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(i, 0, 0); return { d: x.getImageData(0, 0, c.width, c.height).data, w: c.width } }
      const A = await load(a), B = await load(b)
      const e = document.querySelector(sel); if (!e) return null
      const cs = getComputedStyle(e)
      const rects = []
      const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let t
      while ((t = w.nextNode())) if (t.nodeValue.trim()) { const rg = document.createRange(); rg.selectNodeContents(t); rects.push(...[...rg.getClientRects()]) }
      const hist = new Map(); const gl = []
      const at = (I, x, y) => { const i = (y * I.w + x) * 4; return [I.d[i], I.d[i + 1], I.d[i + 2]] }
      for (const r of rects) for (let y = Math.max(0, Math.round(r.top)); y < Math.round(r.bottom); y++) for (let x = Math.max(0, Math.round(r.left)); x < Math.round(r.right); x++) {
        const pb = at(B, x, y), pa = at(A, x, y)
        const k = pb[0] * 65536 + pb[1] * 256 + pb[2]; hist.set(k, (hist.get(k) || 0) + 1)
        if (Math.abs(pa[0] - pb[0]) + Math.abs(pa[1] - pb[1]) + Math.abs(pa[2] - pb[2]) > 12) gl.push(pa)
      }
      if (!hist.size) return { empty: true }
      const ent = [...hist.entries()].sort((x, y) => y[1] - x[1])
      const bg = [(ent[0][0] >> 16) & 255, (ent[0][0] >> 8) & 255, ent[0][0] & 255]
      const dist = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2])
      const s = gl.map((p) => ({ p, d: dist(p, bg) })).sort((x, y) => x.d - y.d)
      return { fg: s.length ? s[Math.floor(s.length * 0.9)].p : null, bg, color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight, text: e.textContent.trim().slice(0, 40), bgColor: cs.backgroundColor }
    }, { a, b, sel })
  }
  const ex = await measure('.rev .ex')
  await page.evaluate(() => document.getElementById('reqForm').scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.click('#reqForm .rf-submit')
  await page.waitForFunction(() => !document.getElementById('reqErr').hidden)
  const rf = await measure('#reqErr')
  out.deTargets[theme] = {
    revEx: ex && ex.fg ? { ...ex, ratio: r2(contrast(ex.fg, ex.bg)) } : ex,
    rfErr: rf && rf.fg ? { ...rf, ratio: r2(contrast(rf.fg, rf.bg)) } : rf,
  }
  await page.screenshot({ path: `${DIR}/de-formerror-${theme}.png` })
  await ctx.close()
}
await browser.close()
saveJSON('verify-raw.json', out)
console.log(JSON.stringify(out, null, 1))
