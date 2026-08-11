// BLOCK 13b — WebGL context loss, measured VISUALLY (the pixel probe in b13 was invalid:
// a WebGL canvas without preserveDrawingBuffer cannot be read back outside a frame).
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info } from './lib.mjs'
import { createHash } from 'node:crypto'

const b = await chromium.launch()
for (const run of [1, 2]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const gl = []
  page.on('console', (m) => { const t = m.text(); if (/WebGL|GL_INVALID|context/i.test(t)) gl.push(`${m.type()}: ${t.slice(0, 110)}`) })
  await page.goto(BASE, { waitUntil: 'load' })
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
  await page.waitForFunction(() => { const c = document.getElementById('expCanvas'); return c && c.width > 200 }, null, { timeout: 20000 })
  await page.waitForTimeout1500 || await page.waitForTimeout(1500)
  const clip = await page.evaluate(() => { const r = document.getElementById('expStage').getBoundingClientRect(); return { x: Math.round(r.x), y: Math.max(0, Math.round(r.y)), width: Math.round(r.width), height: Math.round(Math.min(r.height, 600)) } })
  const shot = async (tag) => { const buf = await page.screenshot({ clip, path: `${DIR}/b13b-${tag}-run${run}.png` }); return { hash: createHash('md5').update(buf).digest('hex').slice(0, 12), bytes: buf.length } }
  const s1 = await shot('1-drawn')
  await page.evaluate(() => { const c = document.getElementById('expCanvas'); const g = c.getContext('webgl2') || c.getContext('webgl'); g.getExtension('WEBGL_lose_context').loseContext() })
  await page.waitForTimeout(2500)
  const s2 = await shot('2-context-lost')
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(700)
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView()); await page.waitForTimeout(2000)
  const s3 = await shot('3-after-scroll-back')
  await page.reload({ waitUntil: 'load' })
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
  await page.waitForFunction(() => { const c = document.getElementById('expCanvas'); return c && c.width > 200 }, null, { timeout: 20000 })
  await page.waitForTimeout(1800)
  const s4 = await shot('4-after-reload')
  const state = await page.evaluate(() => ({ legendOn: document.querySelectorAll('#expLegend li.on').length, stageH: Math.round(document.getElementById('expStage').getBoundingClientRect().height) }))
  if (run === 1) {
    console.log('\n===== 13b WebGL context loss, visual =====')
    info(`drawn            ${JSON.stringify(s1)}`)
    info(`context lost     ${JSON.stringify(s2)}`)
    info(`scrolled back    ${JSON.stringify(s3)}`)
    info(`after reload     ${JSON.stringify(s4)}`)
    info(`GL console noise (${gl.length} lines): ${JSON.stringify([...new Set(gl)].slice(0, 3))}`)
    info(`state after reload: ${JSON.stringify(state)}`)
  }
  ok(s2.hash !== s1.hash, `13b run${run}: the canvas visibly changes when the context is lost (i.e. the drawing is gone)`, `${s1.hash} -> ${s2.hash} (bytes ${s1.bytes} -> ${s2.bytes})`)
  ok(s3.hash !== s2.hash, `13b run${run}: scrolling away and back RESTORES the drawing without a reload`, `lost=${s2.hash} afterScroll=${s3.hash}`)
  ok(s4.bytes > s2.bytes * 1.05, `13b run${run}: a reload restores the drawing`, `lostBytes=${s2.bytes} reloadBytes=${s4.bytes}`)
  ok(gl.filter((x) => /INVALID|error/i.test(x)).length === 0, `13b run${run}: the render loop does not spam GL errors on a dead context`, `${gl.filter((x) => /INVALID|error/i.test(x)).length} lines`)
  await ctx.close()
}
await b.close()
