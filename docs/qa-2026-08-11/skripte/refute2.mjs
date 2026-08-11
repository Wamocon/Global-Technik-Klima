// ADVERSARIAL VERIFICATION round 2 — job: REFUTE. Default to REFUTED if uncertain.
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')

const BASE = 'http://localhost:4321'
const b = await chromium.launch()
const R = []
const rec = (c, d) => R.push([c, d])

// CLAIM E (L5/D1): Turkish ALL-CAPS with ASCII I breaks intent matching.
// Refutation attempt: run each question in caps AND lowercase; if both give the
// same answer, the claim is refuted.
{
  const qs = ['GARANTI KAC YIL', 'TAKSIT VAR MI', 'HIZMETLERINIZ NELER', 'KLIMA SOGUTMUYOR']
  for (const q of qs) {
    const answers = []
    for (const text of [q, q.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i')]) {
      for (const run of [1, 2]) {
        const page = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
        await page.goto(BASE + '/', { waitUntil: 'networkidle' })
        await page.route('**/api/chat', (r) => r.fulfill({ status: 404, body: '' }))
        await page.click('#chatfab')
        await page.waitForSelector('#chatpanel:not([hidden])')
        await page.fill('#cin', text)
        await page.click('#cform button[type=submit]')
        await page.waitForFunction(() => document.querySelectorAll('#chatpanel .msg.bot:not(.typing)').length >= 2)
        const a = ((await page.locator('#chatpanel .msg.bot .b').last().textContent()) || '').slice(0, 48)
        if (run === 1) answers.push(`${text === q ? 'CAPS' : 'lower'}="${a}…"`)
        await page.close()
      }
    }
    rec(`E · "${q}"`, answers.join('  ||  ') + `  → same answer: ${answers[0].slice(answers[0].indexOf('=')) === answers[1].slice(answers[1].indexOf('='))}`)
  }
}

// CLAIM F (L5/D3): the Google Maps embed pulls fonts.googleapis.com /
// fonts.gstatic.com — i.e. the "no Google Fonts" rule is broken transitively.
// Refutation attempt: check whether the FIRST-PARTY document requests them
// (rule violation) or only the third-party frame does (consequence of the embed).
{
  for (const run of [1, 2]) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' })
    const page = await ctx.newPage()
    const reqs = []
    page.on('request', (r) => {
      const u = new URL(r.url())
      if (u.host !== 'localhost:4321') reqs.push({ host: u.host, frame: r.frame() === page.mainFrame() ? 'MAIN' : 'iframe' })
    })
    await page.goto(BASE + '/de', { waitUntil: 'networkidle' })
    const beforeScroll = reqs.length
    // does the FIRST-PARTY html reference google fonts at all?
    const firstPartyLink = await page.evaluate(() =>
      [...document.querySelectorAll('link[href],script[src]')].map((e) => e.getAttribute('href') || e.getAttribute('src')).filter((h) => h && /google/.test(h))
    )
    await page.evaluate(() => document.querySelector('#kontakt').scrollIntoView())
    await page.waitForFunction(() => {
      const f = document.querySelector('.cmap iframe')
      return f && f.contentWindow !== null
    })
    await page.waitForLoadState('networkidle').catch(() => {})
    const hosts = {}
    for (const r of reqs) hosts[`${r.host} (${r.frame})`] = (hosts[`${r.host} (${r.frame})`] || 0) + 1
    if (run === 1) rec('F · Google hosts after scrolling to #kontakt',
      `3rd-party requests before scroll=${beforeScroll} · first-party <link>/<script> to google=${JSON.stringify(firstPartyLink)} · after scroll: ${JSON.stringify(hosts)}`)
    await ctx.close()
  }
}

// CLAIM G (L5/D9): BTU output is tr-TR formatted on /en/ → "36.000" reads as 36.
{
  for (const [loc, path] of [['tr', '/'], ['en', '/en/'], ['ru', '/ru/'], ['de', '/de/']]) {
    const page = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await page.fill('#ca', '60')
    await page.waitForFunction(() => document.getElementById('cbtu').textContent !== '12.000')
    const s = await page.evaluate(() => ({
      btu: document.getElementById('cbtu').textContent,
      lang: document.documentElement.lang,
      cta: decodeURIComponent((document.getElementById('ccta').getAttribute('href') || '').split('text=')[1] || ''),
      productTag: [...document.querySelectorAll('.prod .pt')].map((e) => e.textContent).find((t) => /\d{2}[.,\s]?\d{3}/.test(t)) || 'n/a',
      heroRating: document.querySelector('[data-rating]')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 40),
    }))
    rec(`G · ${loc} (lang=${s.lang}) BTU at 60 m²`, `#cbtu="${s.btu}" · product tag="${s.productTag}" · rating="${s.heroRating}" · deeplink="${s.cta}"`)
    await page.close()
  }
}

await b.close()
console.log('\n===== ADVERSARIAL VERIFICATION · ROUND 2 =====')
for (const [c, d] of R) console.log(`\n• ${c}\n  ${d}`)
