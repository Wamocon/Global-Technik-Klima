// BLOCK 7 — storage failure + garbage values. Technique: fault injection on a browser API,
// plus equivalence partitioning over the stored value.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info } from './lib.mjs'

const read = (page) => page.evaluate(() => ({
  theme: document.documentElement.dataset.theme || '(none=dark)',
  meta: document.getElementById('tcolor')?.getAttribute('content'),
  bodyBg: getComputedStyle(document.body).backgroundColor,
  sunVisible: getComputedStyle(document.querySelector('.themetog .ic-sun')).display,
  moonVisible: getComputedStyle(document.querySelector('.themetog .ic-moon')).display,
}))

const b = await chromium.launch()

// ---------- 7a localStorage throws on BOTH get and set (private mode / storage blocked) ----------
for (const run of [1, 2]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => {
    const boom = () => { throw new DOMException('The operation is insecure.', 'SecurityError') }
    try {
      Object.defineProperty(Storage.prototype, 'setItem', { value: boom, configurable: true })
      Object.defineProperty(Storage.prototype, 'getItem', { value: boom, configurable: true })
      Object.defineProperty(Storage.prototype, 'removeItem', { value: boom, configurable: true })
    } catch {}
  })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text()) })
  await page.goto(BASE, { waitUntil: 'load' })
  const before = await read(page)
  await page.click('#themetog')
  const ok1 = await page.waitForFunction(() => document.documentElement.dataset.theme === 'light', null, { timeout: 3000 }).then(() => true).catch(() => false)
  const after = await read(page)
  await page.click('#themetog')
  const ok2 = await page.waitForFunction(() => !document.documentElement.dataset.theme, null, { timeout: 3000 }).then(() => true).catch(() => false)
  const back = await read(page)
  if (run === 1) {
    console.log('\n===== 7a localStorage throws (get + set) =====')
    info(`load: ${JSON.stringify(before)}`)
    info(`after 1st click: ${JSON.stringify(after)}`)
    info(`after 2nd click: ${JSON.stringify(back)}`)
    await page.screenshot({ path: `${DIR}/b7a-storage-blocked-light.png` })
  }
  ok(before.theme === '(none=dark)', `7a run${run}: falls back to the dark default when storage cannot be read`, before.theme)
  ok(ok1 && after.theme === 'light' && after.meta === '#f6f3ee', `7a run${run}: theme toggle still works for this session`, JSON.stringify(after))
  ok(ok2 && back.theme === '(none=dark)', `7a run${run}: toggling back also works`, JSON.stringify(back))
  ok(errs.filter((e) => /pageerror/.test(e)).length === 0, `7a run${run}: nothing throws to the console`, errs.join(' | '))
  // and: chat + form must not be collateral damage
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  await page.fill('#cin', '40 m2 salon'); await page.press('#cin', 'Enter')
  const chatOk = await page.waitForFunction(() => document.querySelectorAll('#cbody .msg.bot:not(.typing)').length >= 2, null, { timeout: 5000 }).then(() => true).catch(() => false)
  ok(chatOk, `7a run${run}: chat unaffected by broken storage`, '')
  await ctx.close()
}

// ---------- 7b garbage values in localStorage.theme ----------
const GARBAGE = [
  ['"blue"', 'blue'],
  ['"null" string', 'null'],
  ['"undefined" string', 'undefined'],
  ['empty string', ''],
  ['JSON object', '{"theme":"light"}'],
  ['"LIGHT" wrong case', 'LIGHT'],
  ['" light " padded', ' light '],
  ['1 MB string', 'x'.repeat(1024 * 1024)],
  ['newline injection', 'light\ndark'],
  ['proto pollution attempt', '__proto__'],
]
console.log('\n===== 7b garbage localStorage.theme =====')
for (const [label, value] of GARBAGE) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(`try { localStorage.setItem('theme', ${JSON.stringify(value)}) } catch(e) {}`)
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(BASE, { waitUntil: 'load' })
  const r = await read(page)
  const lsLen = await page.evaluate(() => (localStorage.getItem('theme') || '').length)
  const isDark = r.theme === '(none=dark)' && r.bodyBg !== 'rgb(246, 243, 238)'
  ok(isDark && errs.length === 0, `7b ${label} (len=${lsLen}): falls back to dark, no error`, `theme=${r.theme} bodyBg=${r.bodyBg} meta=${r.meta} errs=${errs.join('|')}`)
  // and the toggle must still work from that broken state
  await page.click('#themetog')
  const toggled = await page.waitForFunction(() => document.documentElement.dataset.theme === 'light', null, { timeout: 3000 }).then(() => true).catch(() => false)
  ok(toggled, `7b ${label}: toggle recovers from the bad value`, '')
  await ctx.close()
}

// ---------- 7c storage quota exceeded on setItem only (read works) ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => {
    const orig = Storage.prototype.setItem
    Object.defineProperty(Storage.prototype, 'setItem', {
      value: function () { throw new DOMException('QuotaExceededError', 'QuotaExceededError') }, configurable: true,
    })
    window.__orig = orig
  })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(BASE, { waitUntil: 'load' })
  await page.click('#themetog')
  const worked = await page.waitForFunction(() => document.documentElement.dataset.theme === 'light', null, { timeout: 3000 }).then(() => true).catch(() => false)
  await page.reload({ waitUntil: 'load' })
  const afterReload = await read(page)
  console.log('\n===== 7c quota exceeded on write =====')
  info(`toggle worked=${worked}; after reload: ${JSON.stringify(afterReload)}; errors=${JSON.stringify(errs)}`)
  ok(worked && errs.length === 0, '7c: toggle works for the session when the write fails', '')
  ok(afterReload.theme === '(none=dark)', '7c: an unpersistable choice honestly reverts to dark on reload (no phantom state)', afterReload.theme)
  await ctx.close()
}

await b.close()
