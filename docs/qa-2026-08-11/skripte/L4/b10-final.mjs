// BLOCK 10 — closing checks:
//  (a) legend legibility when three.js never boots (contrast under failure)
//  (b) no-JS: which visible controls are inert?
//  (c) the late-gsap flicker under REAL Fast-3G throttling, with a screenshot at the dip
//  (d) the 2.5 s unreadable window is the same in all 4 locales and on mobile
import { chromium } from './pw.mjs'
import { BASE, DIR, LOCALES, ok, info, poll } from './lib.mjs'

const b = await chromium.launch()

// ---------- (a) legend contrast when three.js fails vs when it works ----------
{
  const lum = (r, g, bl) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl) }
  const ratio = (a, c) => { const L1 = Math.max(lum(...a), lum(...c)), L2 = Math.min(lum(...a), lum(...c)); return (L1 + 0.05) / (L2 + 0.05) }
  const measure = async (block) => {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    if (block) await page.route('**/_astro/three.module.*.js', (r) => r.abort('failed'))
    await page.goto(BASE, { waitUntil: 'load' })
    await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
    await page.waitForTimeout(3000)
    const r = await page.evaluate(() => {
      const li = document.querySelectorAll('#expLegend li')[3]
      const span = li.querySelector('.txt span')
      const sec = document.querySelector('.exp')
      return {
        liOpacity: getComputedStyle(li).opacity,
        color: getComputedStyle(span).color,
        secBg: getComputedStyle(sec).backgroundColor,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        onCount: document.querySelectorAll('#expLegend li.on').length,
        text: span.textContent.trim().slice(0, 50),
      }
    })
    if (block) await page.screenshot({ path: `${DIR}/b10a-legend-three-dead.png`, clip: await page.evaluate(() => { const r2 = document.getElementById('expLegend').getBoundingClientRect(); return { x: Math.round(r2.x), y: Math.max(0, Math.round(r2.y)), width: Math.round(r2.width), height: Math.min(700, Math.round(r2.height)) } }) })
    await ctx.close()
    return r
  }
  const parse = (s) => s.match(/\d+/g).slice(0, 3).map(Number)
  const okState = await measure(false)
  const dead = await measure(true)
  console.log('\n===== 10a exploded-unit legend legibility under three.js failure =====')
  info(`three.js OK  : ${JSON.stringify(okState)}`)
  info(`three.js DEAD: ${JSON.stringify(dead)}`)
  // the section paints over --bg / --bg-2 gradients; use body bg as the practical backdrop
  const bg = parse(dead.bodyBg)
  const fg = parse(dead.color)
  const op = Number(dead.liOpacity)
  const eff = fg.map((c, i) => Math.round(c * op + bg[i] * (1 - op)))
  const cr = ratio(eff, bg)
  info(`effective colour at ${op} opacity over ${dead.bodyBg} = rgb(${eff.join(',')})  ->  contrast ${cr.toFixed(2)}:1`)
  ok(dead.onCount > 0, '10a: at least one legend item is highlighted (opacity 1) when three.js never boots', `on=${dead.onCount}/5`)
  ok(cr >= 4.5, '10a: legend body text meets WCAG AA (4.5:1) when three.js never boots', `${cr.toFixed(2)}:1 at opacity ${op}`)
}

// ---------- (b) no-JS: inert but visible controls ----------
{
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  const inert = await page.evaluate(() => {
    const vis = (s) => { const e = document.querySelector(s); if (!e) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 }
    return {
      chatFab: vis('#chatfab'), burger: vis('#burger'), themeTog: vis('#themetog'),
      calcInputs: vis('#ca'), sunButtons: vis('[data-sun]'), baSlider: vis('#ba'),
      chatFabLabel: document.querySelector('#chatfab .ct')?.textContent?.trim(),
      calcOut: document.getElementById('cbtu')?.textContent?.trim(),
      calcCta: document.getElementById('ccta')?.getAttribute('href'),
      noscriptCount: document.querySelectorAll('noscript').length,
      mobarPresent: vis('.mobar'),
    }
  })
  console.log('\n===== 10b no-JS: visible controls that cannot work =====')
  info(JSON.stringify(inert, null, 0))
  ok(inert.noscriptCount >= 2, '10b: a <noscript> explanation exists for each JS-only widget', `${inert.noscriptCount} noscript blocks`)
  ok(inert.chatFab === false, '10b: the chat launcher is hidden when JS is off (it cannot work)', `visible=${inert.chatFab}, label="${inert.chatFabLabel}"`)
  ok(inert.burger === false, '10b: the burger is hidden when JS is off (it cannot open the menu)', `visible=${inert.burger}`)
  ok(inert.themeTog === false, '10b: the theme toggle is hidden when JS is off', `visible=${inert.themeTog}`)
  ok(inert.calcCta && inert.calcCta !== '#', '10b: the BTU calculator CTA still points somewhere useful without JS', `href=${inert.calcCta}`)
  await page.screenshot({ path: `${DIR}/b10b-nojs-inert-controls.png` })
  await ctx.close()
}

// ---------- (c) real Fast-3G: the flicker, with a screenshot at the dip ----------
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', { offline: false, connectionType: 'cellular3g', latency: 562, downloadThroughput: (1600 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
  let gsapAt = null
  const t0 = Date.now()
  page.on('response', (r) => { if (/_astro\/gsap\./.test(r.url())) gsapAt = Date.now() - t0 })
  await page.goto(BASE, { waitUntil: 'commit' })
  await page.waitForSelector('#hizmetler', { state: 'attached', timeout: 60000 })
  await page.evaluate(() => document.getElementById('hizmetler').scrollIntoView())
  // wait for the failsafe to reveal it
  await page.waitForFunction(() => [...document.querySelectorAll('#hizmetler [data-reveal]')].every((e) => Number(getComputedStyle(e).opacity) > 0.9), null, { timeout: 30000 })
  const readableAt = Date.now() - t0
  // now watch for the dip
  let dipShot = false
  const dip = await poll(async () => {
    const v = await page.evaluate(() => Math.min(...[...document.querySelectorAll('#hizmetler [data-reveal]')].map((e) => Number(getComputedStyle(e).opacity))))
    if (v < 0.6 && !dipShot) { dipShot = true; await page.screenshot({ path: `${DIR}/b10c-fast3g-dip.png` }) }
    return v < 0.6
  }, { timeout: 20000, interval: 60 })
  console.log('\n===== 10c real Fast-3G: failsafe reveal then gsap dip =====')
  info(`#hizmetler readable at ${readableAt}ms (failsafe); gsap chunk arrived at ${gsapAt}ms`)
  info(dip.ok ? `content dipped below 0.6 opacity again ${dip.ms}ms after becoming readable -> screenshot b10c-fast3g-dip.png` : 'no dip observed')
  ok(!dip.ok, '10c: content that the failsafe revealed does not dip again when gsap finally lands (REAL Fast 3G)', dip.ok ? `dip after ${dip.ms}ms` : '')
  await ctx.close()
}

// ---------- (d) the unreadable window, all locales + mobile ----------
{
  console.log('\n===== 10d unreadable window with the motion bundle dead (all locales) =====')
  for (const L of [...LOCALES, { code: 'tr-mobile', url: BASE + '/' }]) {
    const ctx = await b.newContext({ viewport: L.code === 'tr-mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.route('**/_astro/Base.astro_*.js', (r) => r.abort('failed'))
    const t0 = Date.now()
    await page.goto(L.url, { waitUntil: 'commit' })
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.topbar')).position === 'sticky')
    await page.evaluate(() => document.getElementById('hizmetler').scrollIntoView())
    const hiddenNow = await page.evaluate(() => [...document.querySelectorAll('#hizmetler [data-reveal]')].filter((e) => Number(getComputedStyle(e).opacity) < 0.5).length)
    const r = await poll(async () => await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].every((e) => Number(getComputedStyle(e).opacity) > 0.9)), { timeout: 8000, interval: 50 })
    const readableAt = Date.now() - t0
    ok(readableAt < 1000, `10d ${L.code}: content readable within 1 s of navigation`, `blank for ${readableAt}ms (${hiddenNow} blocks hidden right after CSS applied)`)
    await ctx.close()
  }
}

await b.close()
