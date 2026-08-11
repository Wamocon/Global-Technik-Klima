// L3 — chat input edges, busy-aware (Assistant.astro:191 `busy` guard silently drops
// a message sent while the bot is answering, so each send must wait for the reply).
// Techniques: character-class partitioning (Unicode), 3-value BVA on the chat's own
// numeric area parser, and a cross-implementation boundary comparison against #ca.
import { chromium, BASE, DIR } from './pw.mjs'

const STR = {
  turkish: 'İ ı Ş ş Ğ ğ Ç ç Ö ö Ü ü İstanbul ISI ısı KLIMA',
  cyrillic: 'Пример Жёлтый Щенок Ъ Ы Э Ю Я',
  german: 'Größe Straße ÄÖÜäöüß',
  emoji: 'Klima 😀🥶❄️ ok',
  zwjFamily: 'Aile 👨‍👩‍👧‍👦 evi',
  combining: 'Alanya i̇şı́ oğlü',
  arabic: 'مرحبا، أريد تكييف هواء لغرفة نومي؟',
  hebrew: 'שלום, אני צריך מזגן לחדר השינה',
  mixedRtl: 'Gree GWH09 مكيف 24000 BTU',
  zeroWidthOnly: '​‌‍⁠',
  whitespacePad: '   Ali Veli   ',
  longWord: 'K'.repeat(200),
  longUrlWord: 'https://example.com/' + 'a'.repeat(180),
}
const AREA_CASES = ['5 m2 oda', '6 m2 oda', '9 m2 oda', '10 m2 oda', '17 m2 oda', '18 m2 oda',
  '199 m2 oda', '200 m2 oda', '201 m2 oda', '250 m2 oda', '300 m2 oda', '301 m2 oda', '1000 m2 oda']

const browser = await chromium.launch()

const send = async (page, text, viaDom = false) => {
  const before = await page.evaluate(() => document.querySelectorAll('#cbody .msg').length)
  if (viaDom) await page.evaluate((v) => { document.getElementById('cin').value = v }, text)
  else await page.locator('#cin').fill(text)
  await page.locator('#cform button[type="submit"]').click()
  // deterministic: the bot's answer bubble replaces the typing bubble -> msg count grows by 2
  // and no `.typing` bubble remains. If nothing was accepted at all, this times out.
  const ok = await page.waitForFunction(
    (n) => document.querySelectorAll('#cbody .msg').length >= n + 2 && !document.querySelector('#cbody .msg.typing'),
    before, { timeout: 5000 },
  ).then(() => true).catch(() => false)
  return { accepted: ok, before }
}

// ── 1. Unicode round trip + overflow, in Turkish ────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.locator('#chatfab').click()
  await page.waitForSelector('#chatpanel:not([hidden])')
  console.log('=== CHAT: Unicode round-trip / layout ===')
  console.log('case            | accepted | bubble===input | doc overflow | cbody h-scroll | bubble w vs panel w | computed dir/unicode-bidi')
  for (const [k, s] of Object.entries(STR)) {
    const r = await send(page, s)
    const m = await page.evaluate(() => {
      const ms = document.querySelectorAll('#cbody .msg.me')
      const last = ms[ms.length - 1]; const b = last?.querySelector('.b')
      const body = document.getElementById('cbody'); const panel = document.getElementById('chatpanel')
      const cs = b ? getComputedStyle(b) : null
      return {
        text: b?.textContent ?? null,
        bubbleW: b ? Math.round(b.getBoundingClientRect().width) : 0,
        bubbleRight: b ? Math.round(b.getBoundingClientRect().right) : 0,
        panelRight: Math.round(panel.getBoundingClientRect().right),
        panelW: Math.round(panel.getBoundingClientRect().width),
        bodySW: body.scrollWidth, bodyCW: body.clientWidth,
        docSW: document.documentElement.scrollWidth, iw: window.innerWidth,
        dir: cs?.direction, wrap: cs?.overflowWrap, wb: cs?.wordBreak, dirAttr: b?.getAttribute('dir'),
      }
    })
    const same = m.text === s
    console.log(`${k.padEnd(15)} | ${String(r.accepted).padEnd(8)} | ${String(same).padEnd(14)} | ${String(m.docSW > m.iw ? 'OVERFLOW' : 'none').padEnd(12)} | ${String(m.bodySW > m.bodyCW ? 'YES ' + m.bodySW + '>' + m.bodyCW : 'no').padEnd(14)} | ${String(m.bubbleW + ' / ' + m.panelW + (m.bubbleRight > m.panelRight ? ' SPILLS' : '')).padEnd(19)} | dir=${m.dir} attr=${m.dirAttr} overflow-wrap=${m.wrap} word-break=${m.wb}`)
    if (!same) console.log(`      input =${JSON.stringify(s).slice(0, 120)}\n      bubble=${JSON.stringify(m.text).slice(0, 120)}`)
  }
  // screenshots of the two visual defects
  await page.locator('#cin').fill('')
  await page.screenshot({ path: `${DIR}/chat-edges-1280.png`, clip: await page.locator('#chatpanel').boundingBox() })
  console.log(`errors: ${errs.length ? errs.join('|') : '(none)'}`)
  await ctx.close()
}

// ── 2. BVA on the chat's own area parser vs the calculator's clamp ───────────
{
  const STEP = [9000, 12000, 18000, 24000, 36000, 48000]
  const snap = (v) => STEP.reduce((p, s) => (Math.abs(s - v) < Math.abs(p - v) ? s : p))
  const calcClamp = (a) => Math.max(6, Math.min(200, a))
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.locator('#chatfab').click()
  await page.waitForSelector('#chatpanel:not([hidden])')
  console.log('\n=== CHAT: 3-value BVA on the free-text area parser (Assistant.astro:158-165) ===')
  console.log('input          | sized? | bot answer (first 90 chars)                                                                | wa deeplink text | calculator would say')
  for (const q of AREA_CASES) {
    await send(page, q)
    const r = await page.evaluate(() => {
      const bots = document.querySelectorAll('#cbody .msg.bot')
      const wa = document.querySelectorAll('#cbody .msg.wa a')
      return { answer: bots[bots.length - 1]?.textContent || '', wa: wa.length ? wa[wa.length - 1].getAttribute('href') : '' }
    })
    const n = parseInt(q, 10)
    const waText = r.wa ? decodeURIComponent(r.wa.split('?text=')[1] || '') : ''
    const sized = /BTU/i.test(waText)
    console.log(`${q.padEnd(14)} | ${String(sized).padEnd(6)} | ${r.answer.slice(0, 90).replace(/\n/g, ' ').padEnd(90)} | ${waText.padEnd(22)} | ${snap(calcClamp(n) * 550)} for ${calcClamp(n)} m²`)
  }
  await ctx.close()
}

// ── 3. locale formatting of the chat's own BTU number (vs the calculator) ───
{
  console.log('\n=== CHAT vs CALCULATOR: number formatting of the same value, per locale ===')
  for (const [code, url] of [['tr', '/'], ['de', '/de/'], ['ru', '/ru/'], ['en', '/en/']]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(BASE + url, { waitUntil: 'networkidle' })
    await page.locator('#chatfab').click()
    await page.waitForSelector('#chatpanel:not([hidden])')
    await send(page, '60 m2')
    const chatAns = await page.evaluate(() => {
      const b = document.querySelectorAll('#cbody .msg.bot')
      return b[b.length - 1]?.textContent || ''
    })
    await page.locator('#ca').fill('60')
    await page.locator('#cp').fill('2')
    await page.waitForFunction(() => (document.querySelector('#ccta')?.getAttribute('href') || '').includes('60%20m'))
    const calcOut = await page.evaluate(() => document.querySelector('#cbtu').textContent)
    const chatNum = (chatAns.match(/[\d.,\s  ]{4,}/) || [''])[0].trim()
    console.log(`  ${code}: chat says "${chatNum}"  |  calculator #cbtu says "${calcOut}"  |  same value 36000 rendered differently? ${chatNum !== calcOut ? 'YES — INCONSISTENT' : 'no'}`)
    await ctx.close()
  }
}
await browser.close()
