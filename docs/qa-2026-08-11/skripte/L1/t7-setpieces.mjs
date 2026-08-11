/**
 * L1-B7  Technique: use-case testing on the two interactive set pieces, with a
 *        scroll-driven state sweep for the exploded unit (each legend step is a
 *        state; the criterion is that more than one distinct state is reached).
 * Coverage criterion: before/after slider driven by BOTH input modalities
 *        (pointer drag + keyboard, in both directions); exploded unit booted,
 *        sized, and legend progressing over the scroll range.
 */
import { LOCALES, goHome, newPage, browser, ok, eq, summary, DIR } from './lib.mjs'

const pos = (page) => page.locator('#ba').evaluate((e) => parseFloat(e.style.getPropertyValue('--pos')))

const b = await browser()

// ─────────── before / after slider ───────────
for (const loc of LOCALES) {
  console.log(`\n--- before/after slider, ${loc} ---`)
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await newPage(ctx)
  await goHome(page, loc)
  await page.locator('#referanslar').scrollIntoViewIfNeeded()
  await page.waitForSelector('#ba', { state: 'visible' })

  eq(`[${loc}] slider starts at --pos:50%`, await pos(page), 50)
  eq(`[${loc}] range starts at 50`, await page.inputValue('#baRange'), '50')
  ok(`[${loc}] before/after labels present`,
    (await page.locator('#ba .ba-lab-l').innerText()).trim().length > 0 &&
    (await page.locator('#ba .ba-lab-r').innerText()).trim().length > 0)
  ok(`[${loc}] "example" honesty label present`, (await page.locator('#ba .ba-ex').innerText()).trim().length > 0)
  ok(`[${loc}] range has an accessible name`, (await page.getAttribute('#baRange', 'aria-label') || '').length > 3)

  // -- keyboard: right then left, both must move --pos --
  await page.focus('#baRange')
  ok(`[${loc}] #baRange is focusable`, await page.evaluate(() => document.activeElement?.id === 'baRange'))
  const p0 = await pos(page)
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight')
  await page.waitForFunction((p) => parseFloat(document.getElementById('ba').style.getPropertyValue('--pos')) > p,
    p0, { timeout: 3000 })
  const pRight = await pos(page)
  ok(`[${loc}] ArrowRight raises --pos (${p0}% -> ${pRight}%)`, pRight > p0, `p0=${p0} pRight=${pRight}`)
  for (let i = 0; i < 24; i++) await page.keyboard.press('ArrowLeft')
  await page.waitForFunction((p) => parseFloat(document.getElementById('ba').style.getPropertyValue('--pos')) < p,
    pRight, { timeout: 3000 })
  const pLeft = await pos(page)
  ok(`[${loc}] ArrowLeft lowers --pos (${pRight}% -> ${pLeft}%)`, pLeft < pRight, `pRight=${pRight} pLeft=${pLeft}`)
  ok(`[${loc}] keyboard kept --pos in [0,100]`, pLeft >= 0 && pLeft <= 100, `pLeft=${pLeft}`)
  eq(`[${loc}] range value and --pos agree after keyboard`,
    Math.round(parseFloat(await page.inputValue('#baRange'))), Math.round(pLeft))
  // the visible handle must have moved with it
  const handleLeft = await page.locator('#ba .ba-handle').evaluate((e) => e.getBoundingClientRect().left)
  const figBox = await page.locator('#ba').boundingBox()
  const handlePct = ((handleLeft - figBox.x) / figBox.width) * 100
  ok(`[${loc}] handle rendered at --pos (${handlePct.toFixed(1)}% vs ${pLeft}%)`, Math.abs(handlePct - pLeft) < 3,
    `handlePct=${handlePct.toFixed(2)} pos=${pLeft}`)

  // -- pointer drag --
  const box = await page.locator('#ba').boundingBox()
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, { steps: 10 })
  await page.waitForFunction(() => parseFloat(document.getElementById('ba').style.getPropertyValue('--pos')) > 70,
    null, { timeout: 3000 }).catch(() => {})
  const pDragRight = await pos(page)
  await page.mouse.move(box.x + box.width * 0.15, box.y + box.height / 2, { steps: 10 })
  await page.waitForFunction(() => parseFloat(document.getElementById('ba').style.getPropertyValue('--pos')) < 25,
    null, { timeout: 3000 }).catch(() => {})
  const pDragLeft = await pos(page)
  await page.mouse.up()
  ok(`[${loc}] drag right moves --pos toward 80% (got ${pDragRight}%)`, pDragRight > 70 && pDragRight < 90, `pos=${pDragRight}`)
  ok(`[${loc}] drag left moves --pos toward 15% (got ${pDragLeft}%)`, pDragLeft < 25 && pDragLeft >= 0, `pos=${pDragLeft}`)
  // after pointerup, further mouse movement must NOT drag
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2)
  eq(`[${loc}] drag released: --pos frozen`, await pos(page), pDragLeft)
  // clip must actually follow --pos
  const clipW = await page.locator('#ba .ba-clip').evaluate((e) => getComputedStyle(e).clipPath)
  ok(`[${loc}] clip-path reflects --pos`, /inset/.test(clipW), `clip="${clipW}"`)

  ok(`[${loc}] no console/page errors (slider)`, page.__errors.length === 0, page.__errors.join(' | '))
  await ctx.close()
}

// ─────────── exploded 3D unit ───────────
for (const loc of LOCALES) {
  console.log(`\n--- exploded unit, ${loc} ---`)
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await newPage(ctx)
  await goHome(page, loc)

  await page.locator('#teknik').scrollIntoViewIfNeeded()
  // Boot condition: `renderer.setSize(r.width, r.height, false)` has resized the
  // backing store away from the 300x150 default to the stage size × devicePixelRatio.
  // NOTE: never call canvas.getContext('2d') here — it permanently claims the canvas
  // and Three.js can then never get a WebGL context (that was a test bug, not a site bug).
  await page.waitForFunction(() => {
    const c = document.getElementById('expCanvas')
    return c && c.clientWidth > 200 && c.width >= c.clientWidth && !(c.width === 300 && c.height === 150)
  }, null, { timeout: 25000 })
  const canvas = await page.locator('#expCanvas').evaluate((c) => ({
    w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight, dpr: devicePixelRatio,
  }))
  ok(`[${loc}] #expCanvas has non-zero backing store (${canvas.w}x${canvas.h})`, canvas.w > 0 && canvas.h > 0, JSON.stringify(canvas))
  ok(`[${loc}] #expCanvas has non-zero layout size (${canvas.cw}x${canvas.ch})`, canvas.cw > 200 && canvas.ch > 150, JSON.stringify(canvas))
  ok(`[${loc}] backing store == layout size × dpr (proves renderer.setSize ran)`,
    Math.abs(canvas.w - canvas.cw * canvas.dpr) <= 2 && Math.abs(canvas.h - canvas.ch * canvas.dpr) <= 2,
    JSON.stringify(canvas))

  // sweep the scroll range through the section and record the legend state
  const stageBox = await page.locator('#expStage').boundingBox()
  const startY = await page.evaluate(() => window.scrollY)
  const counts = new Set()
  const seq = []
  const total = Math.round(stageBox.height + 900)
  for (let step = 0; step <= 12; step++) {
    const y = Math.round(startY - 700 + (total * step) / 12)
    await page.evaluate((yy) => window.scrollTo(0, Math.max(0, yy)), y)
    // wait for the smoothed progress to stop changing the legend
    await page.waitForFunction(() => {
      const n = document.querySelectorAll('#expLegend li.on').length
      if (window.__lastOn === n) { window.__stableOn = (window.__stableOn || 0) + 1 }
      else { window.__stableOn = 0; window.__lastOn = n }
      return window.__stableOn >= 6
    }, null, { timeout: 6000, polling: 80 }).catch(() => {})
    const n = await page.locator('#expLegend li.on').count()
    counts.add(n); seq.push(n)
    await page.evaluate(() => { delete window.__lastOn; delete window.__stableOn })
  }
  console.log(`      legend .on sequence over the scroll range: [${seq.join(', ')}]`)
  ok(`[${loc}] legend lights up progressively (>1 distinct state)`, counts.size > 1,
    `distinct=${[...counts].join(',')} seq=${seq.join(',')}`)
  ok(`[${loc}] legend reaches all 5 parts at full explosion`, Math.max(...seq) === 5, `max=${Math.max(...seq)}`)
  ok(`[${loc}] legend reaches the unlit/assembled state (0) above the section`, seq.includes(0), `seq=${seq.join(',')}`)
  // Sample 0 is taken above the section, where the rAF loop is intentionally paused
  // (IntersectionObserver) so the smoothed progress freezes mid-decay. The meaningful
  // window is the in-view sweep, samples 1..N.
  const inView = seq.slice(1)
  ok(`[${loc}] in-view sweep is monotonic non-decreasing`,
    inView.every((v, i, a) => i === 0 || v >= a[i - 1]), `inView=${inView.join(',')}`)
  ok(`[${loc}] in-view sweep passes through >=4 distinct states`, new Set(inView).size >= 4,
    `distinct=${[...new Set(inView)].join(',')}`)
  if (counts.size <= 1) await page.screenshot({ path: `${DIR}/exploded-static-${loc}.png` })

  ok(`[${loc}] no console/page errors (exploded)`, page.__errors.length === 0, page.__errors.join(' | '))
  await ctx.close()
}
await b.close()
summary('t7-setpieces')
