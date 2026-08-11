import { launch, openPage, revealAll, DIR } from './lib.mjs'
import fs from 'node:fs'

const browser = await launch()
const { page, ctx } = await openPage(browser, { url: '/', theme: 'light', viewport: 'mobile' })
await revealAll(page)
await page.waitForFunction(() => document.fonts.status === 'loaded')

await page.evaluate(() => document.getElementById('ccta').scrollIntoView({ block: 'center', behavior: 'instant' }))
await page.waitForFunction(() => { const r = document.getElementById('ccta').getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight })

const info = await page.evaluate(() => {
  const el = document.getElementById('ccta')
  const cs = getComputedStyle(el)
  const t = [...el.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim())
  const rng = document.createRange(); rng.selectNodeContents(t)
  return {
    scrollY, innerHeight, innerWidth,
    elRect: el.getBoundingClientRect().toJSON(),
    textRects: [...rng.getClientRects()].map((r) => r.toJSON()),
    bg: cs.backgroundColor, bgImage: cs.backgroundImage.slice(0, 60), color: cs.color,
    accent: getComputedStyle(document.documentElement).getPropertyValue('--accent'),
  }
})
console.log(JSON.stringify(info, null, 1))

const buf = await page.screenshot({ type: 'png' })
fs.writeFileSync(DIR + '/dbg-shotA.png', buf)
const b64 = buf.toString('base64')
const probe = await page.evaluate(async ({ b64, r }) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
  const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight
  const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0)
  const d = cx.getImageData(0, 0, cv.width, cv.height).data
  const at = (x, y) => { const i = (y * cv.width + x) * 4; return [d[i], d[i + 1], d[i + 2]] }
  return {
    imgSize: [cv.width, cv.height],
    centreOfElement: at(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)),
    justInsideTopLeft: at(Math.round(r.x + 3), Math.round(r.y + 3)),
    row: [0, 0.25, 0.5, 0.75, 1].map((f) => at(Math.round(r.x + 2 + f * (r.width - 5)), Math.round(r.y + r.height / 2))),
  }
}, { b64, r: info.elRect })
console.log(JSON.stringify(probe, null, 1))

await ctx.close(); await browser.close()
