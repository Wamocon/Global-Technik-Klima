// L3 — pin the .calc min-width culprit at 24px root, verify the example badge text
// per locale, and capture RTL rendering evidence.
import { chromium, BASE, DIR } from './pw.mjs'
const browser = await chromium.launch()

// 1. which child sets .calc's min width?
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  const r = await page.evaluate(() => {
    const measure = () => {
      const calc = document.querySelector('.calc')
      const probe = (el) => {
        const c = el.cloneNode(true)
        c.style.cssText += ';position:absolute;left:-99999px;top:0;width:min-content;'
        document.body.appendChild(c)
        const w = Math.round(c.getBoundingClientRect().width)
        c.remove(); return w
      }
      return {
        calcW: Math.round(calc.getBoundingClientRect().width),
        children: [...calc.children].map((k) => ({
          sel: k.tagName.toLowerCase() + (k.id ? '#' + k.id : '') + (typeof k.className === 'string' && k.className ? '.' + k.className.trim().split(/\s+/).join('.') : ''),
          rendered: Math.round(k.getBoundingClientRect().width),
          minContent: probe(k),
          declaredWidth: getComputedStyle(k).width,
          text: (k.textContent || '').trim().slice(0, 42),
        })),
      }
    }
    const at16 = measure()
    document.documentElement.style.fontSize = '24px'
    const at24 = measure()
    return { at16, at24 }
  })
  console.log('=== .calc children: min-content width at root 16px vs 24px (viewport 390) ===')
  console.log(`  .calc rendered width: 16px root = ${r.at16.calcW}px , 24px root = ${r.at24.calcW}px`)
  console.log('  child'.padEnd(28) + ' | 16px min-content | 24px min-content | declared width | text')
  r.at16.children.forEach((c, i) => {
    const d = r.at24.children[i]
    console.log(`  ${c.sel.padEnd(26)} | ${String(c.minContent).padStart(16)} | ${String(d.minContent).padStart(16)} | ${d.declaredWidth.padStart(14)} | ${d.text}`)
  })
  await ctx.close()
}

// 2. the example-review badge text in every locale
{
  console.log('\n=== example-review badge (.revs .ex) text per locale ===')
  for (const [code, url] of [['tr', '/'], ['de', '/de/'], ['ru', '/ru/'], ['en', '/en/']]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(BASE + url, { waitUntil: 'networkidle' })
    const r = await page.evaluate(() => ({
      badges: [...document.querySelectorAll('.revs .ex')].map((e) => e.textContent.trim()),
      reviewCount: document.querySelectorAll('.revs .rev').length,
      lang: document.documentElement.lang,
      exampleImgBadge: [...document.querySelectorAll('.prod .ex, .ex')].map((e) => e.textContent.trim()).slice(0, 6),
    }))
    console.log(`  ${code} (lang=${r.lang}): reviews=${r.reviewCount} review-badges=${JSON.stringify(r.badges)} all-.ex-badges-on-page=${JSON.stringify(r.exampleImgBadge)}`)
    await ctx.close()
  }
}

// 3. RTL evidence — chat bubble and form field with Arabic/Hebrew
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.locator('#chatfab').click()
  await page.waitForSelector('#chatpanel:not([hidden])')
  const send = async (t) => {
    const n = await page.evaluate(() => document.querySelectorAll('#cbody .msg').length)
    await page.locator('#cin').fill(t)
    await page.locator('#cform button[type="submit"]').click()
    await page.waitForFunction((k) => document.querySelectorAll('#cbody .msg').length >= k + 2 && !document.querySelector('#cbody .msg.typing'), n, { timeout: 5000 }).catch(() => {})
  }
  await send('مرحبا، أريد تكييف هواء لغرفة نومي؟')
  await send('שלום, אני צריך מזגן?')
  const box = await page.locator('#chatpanel').boundingBox()
  await page.screenshot({ path: `${DIR}/rtl-chat.png`, clip: box })
  const dirInfo = await page.evaluate(() => {
    const b = [...document.querySelectorAll('#cbody .msg.me .b')].slice(-2)
    return b.map((e) => ({ text: e.textContent.slice(0, 40), dir: getComputedStyle(e).direction, dirAttr: e.getAttribute('dir'), align: getComputedStyle(e).textAlign }))
  })
  console.log('\n=== RTL in chat bubbles ===')
  console.log(JSON.stringify(dirInfo, null, 1))
  // form
  await page.locator('#cclose').click()
  await page.locator('#reqForm [name="place"]').fill('حي محمود، ألانيا')
  await page.locator('#reqForm [name="note"]').fill('أحتاج تكييف لغرفتين، هل يمكنكم الحضور السبت؟')
  await page.locator('#randevu').scrollIntoViewIfNeeded()
  const fbox = await page.locator('#reqForm').boundingBox()
  await page.screenshot({ path: `${DIR}/rtl-form.png`, clip: fbox })
  const fdir = await page.evaluate(() => ['place', 'note'].map((n) => {
    const e = document.querySelector(`#reqForm [name="${n}"]`)
    return { n, dir: getComputedStyle(e).direction, dirAttr: e.getAttribute('dir'), align: getComputedStyle(e).textAlign }
  }))
  console.log('=== RTL in form fields ===')
  console.log(JSON.stringify(fdir))
  const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }))
  console.log(`  overflow with RTL content: ${ov.sw}/${ov.iw} -> ${ov.sw > ov.iw ? 'OVERFLOW' : 'none'}`)
  await ctx.close()
}
await browser.close()
