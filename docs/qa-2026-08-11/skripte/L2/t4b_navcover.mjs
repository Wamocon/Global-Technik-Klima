// L2 — which mobile-nav link does the open chat panel swallow? (390x844)
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')
const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L2'

const run = async () => {
  const browser = await chromium.launch()
  for (const attempt of [1, 2]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await ctx.newPage()
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.click('#burger'); await page.waitForSelector('#mobnav:not([hidden])')
    await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
    const info = await page.evaluate(() => {
      const links = [...document.querySelectorAll('#mobnav a')]
      return links.map((a) => {
        const b = a.getBoundingClientRect()
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2
        const hit = document.elementFromPoint(cx, cy)
        return {
          text: a.textContent.trim(), href: a.getAttribute('href'),
          top: Math.round(b.top), bottom: Math.round(b.bottom),
          hitTest: hit === a || a.contains(hit) ? 'reachable' : 'BLOCKED by ' + (hit ? (hit.id || hit.className || hit.tagName) : 'nothing'),
        }
      })
    })
    console.log(`\n--- run ${attempt} · #mobnav links with the chat panel open (390x844) ---`)
    info.forEach((i) => console.log(`  ${i.hitTest === 'reachable' ? 'ok  ' : 'DEAD'} y=${i.top}..${i.bottom}  ${JSON.stringify(i.text)} → ${i.href}   [${i.hitTest}]`))
    const dead = info.filter((i) => i.hitTest !== 'reachable')
    console.log(`  => ${dead.length} of ${info.length} navigation links unreachable while the chat is open`)
    // real click proof on the first dead link
    if (dead.length && attempt === 1) {
      const idx = info.findIndex((i) => i.hitTest !== 'reachable')
      let err = ''
      try { await page.locator('#mobnav a').nth(idx).click({ timeout: 2500 }) } catch (e) { err = e.message.split('\n')[0] }
      console.log(`  click proof on ${JSON.stringify(info[idx].text)}: ${err || 'clicked (no interception)'}`)
      await page.screenshot({ path: DIR + '/DEF_nav_blocked_by_chat.png' })
    }
    await ctx.close()
  }
  await browser.close()
}
run().catch((e) => { console.error(e); process.exit(1) })
