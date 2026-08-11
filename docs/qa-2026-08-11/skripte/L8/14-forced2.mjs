import { launch, openPage, revealAll, DIR, saveJSON, contrast, r2 } from './lib.mjs'
const browser = await launch()
const out = {}
for (const run of [1,2]) {
  const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: 'desktop', extra: { forcedColors: 'active' } })
  await revealAll(page)
  await page.waitForFunction(() => document.fonts.status === 'loaded')
  await page.waitForFunction(() => document.getAnimations().filter(a => a.playState === 'running').length === 0, null, { timeout: 8000 }).catch(()=>{})
  const m = await page.evaluate(() => {
    const c = (s) => { const e = document.querySelector(s); if (!e) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { color: cs.color, bg: cs.backgroundColor, bgImage: cs.backgroundImage.slice(0,44), opacity: cs.opacity, filter: cs.filter, w: Math.round(r.width), h: Math.round(r.height) } }
    return {
      h1: c('h1.build'), h1span: c('.build .ln > span'), claim: c('.claim'), cta: c('.hero .cta .btn-primary'),
      blogo: c('.blogo'), logoDarkRuleApplies: getComputedStyle(document.querySelector('.blogo')).backgroundImage,
      toggleOn: c('.toggle button.on'), toggleOff: c('.toggle button:not(.on)'),
      langOn: c('.lang a[aria-current]'), langOff: c('.lang a:not([aria-current])'),
      forcedMQ: matchMedia('(forced-colors: active)').matches,
      anyForcedColorsMediaQuery: [...document.styleSheets].flatMap(s => { try { return [...s.cssRules] } catch { return [] } }).filter(r => r.conditionText && r.conditionText.includes('forced-colors')).length,
    }
  })
  // measure real pixels of the logo area
  const shot = await page.screenshot({ type:'png', clip: await page.evaluate(() => { const r = document.querySelector('.blogo').getBoundingClientRect(); return { x: Math.round(r.x)-4, y: Math.round(r.y)-4, width: Math.round(r.width)+8, height: Math.round(r.height)+8 } }) })
  const px = await page.evaluate(async (b64) => {
    const i = new Image(); i.src='data:image/png;base64,'+b64; await i.decode()
    const cv=document.createElement('canvas'); cv.width=i.naturalWidth; cv.height=i.naturalHeight
    const x=cv.getContext('2d'); x.drawImage(i,0,0); const d=x.getImageData(0,0,cv.width,cv.height).data
    const hist=new Map(); for(let k=0;k<d.length;k+=4){const key=d[k]*65536+d[k+1]*256+d[k+2];hist.set(key,(hist.get(key)||0)+1)}
    const ent=[...hist.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,n])=>({c:[(k>>16)&255,(k>>8)&255,k&255],n}))
    return ent
  }, shot.toString('base64'))
  out['run'+run] = { ...m, logoAreaTopColours: px }
  if (run===1) { await page.screenshot({ path: `${DIR}/forced-colors-settled.png` }); const fs = await import('node:fs'); fs.writeFileSync(`${DIR}/forced-logo.png`, shot) }
  await ctx.close()
}
await browser.close(); saveJSON('forced2-raw.json', out); console.log(JSON.stringify(out, null, 1))
