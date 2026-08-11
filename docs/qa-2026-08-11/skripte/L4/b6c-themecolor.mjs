// BLOCK 6c — theme-color meta vs the restored light theme.
// Technique: state-transition testing across page loads (fresh entry / refresh / nav / Back).
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info } from './lib.mjs'

const read = (page) => page.evaluate(() => ({
  theme: document.documentElement.dataset.theme || 'dark',
  ls: localStorage.getItem('theme'),
  meta: document.getElementById('tcolor')?.getAttribute('content'),
  bodyBg: getComputedStyle(document.body).backgroundColor,
}))

const b = await chromium.launch()
console.log('\n===== 6c theme-color meta after the light theme is restored =====')

// 1) toggle -> refresh
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  const d0 = await read(page)
  await page.click('#themetog')
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light')
  const afterClick = await read(page)
  await page.reload({ waitUntil: 'load' })
  const afterReload = await read(page)
  info(`fresh dark:   ${JSON.stringify(d0)}`)
  info(`after click:  ${JSON.stringify(afterClick)}`)
  info(`after F5:     ${JSON.stringify(afterReload)}`)
  ok(afterClick.meta === '#f6f3ee', 'clicking the toggle updates theme-color', `meta=${afterClick.meta}`)
  ok(afterReload.meta === '#f6f3ee', 'AFTER REFRESH theme-color still matches the light page', `theme=${afterReload.theme} bodyBg=${afterReload.bodyBg} meta=${afterReload.meta}`)
  await page.screenshot({ path: `${DIR}/b6c-light-after-refresh-mobile.png` })
  await ctx.close()
}

// 2) pre-seeded storage = a returning visitor, every locale + a legal page
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light') } catch {} })
  const page = await ctx.newPage()
  for (const url of [`${BASE}/`, `${BASE}/de/`, `${BASE}/ru/`, `${BASE}/en/`, `${BASE}/kvkk`, `${BASE}/de/gizlilik`]) {
    await page.goto(url, { waitUntil: 'load' })
    const r = await read(page)
    ok(r.theme === 'light' && r.meta === '#f6f3ee', `returning light-theme visitor at ${url.replace(BASE, '') || '/'}: theme AND browser-bar colour agree`, `theme=${r.theme} meta=${r.meta} bodyBg=${r.bodyBg}`)
  }
  await ctx.close()
}

// 3) does a second toggle round-trip leave meta consistent?
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  await page.click('#themetog'); await page.waitForFunction(() => document.documentElement.dataset.theme === 'light')
  await page.click('#themetog'); await page.waitForFunction(() => !document.documentElement.dataset.theme)
  const r = await read(page)
  ok(r.meta === '#100D0B' && r.theme === 'dark' && r.ls === 'dark', 'toggle light->dark leaves meta, dataset and storage consistent', JSON.stringify(r))
  await ctx.close()
}

await b.close()
