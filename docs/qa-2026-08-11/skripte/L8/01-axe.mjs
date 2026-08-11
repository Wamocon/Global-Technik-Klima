import { launch, openPage, revealAll, AXE, PAGES, saveJSON, DIR } from './lib.mjs'

const RUNS = []
for (const p of PAGES) {
  for (const theme of ['dark', 'light']) {
    for (const vp of ['desktop', 'mobile']) {
      RUNS.push({ ...p, theme, vp })
    }
  }
}

const browser = await launch()
const out = []
const consoleErrors = {}

for (const run of RUNS) {
  const key = `${run.id}|${run.theme}|${run.vp}`
  const { page, ctx, errors } = await openPage(browser, { url: run.url, theme: run.theme, viewport: run.vp })
  await revealAll(page)
  // Open nothing yet — baseline page state.
  await page.addScriptTag({ content: AXE })
  await page.waitForFunction(() => typeof window.axe !== 'undefined')
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa', 'best-practice'] },
      resultTypes: ['violations', 'incomplete'],
    })
    const pick = (arr) => arr.map((v) => ({
      id: v.id, impact: v.impact, tags: v.tags.filter((t) => t.startsWith('wcag') || t === 'best-practice'),
      help: v.help,
      nodes: v.nodes.slice(0, 6).map((n) => ({ target: n.target.join(' '), html: (n.html || '').slice(0, 180), summary: (n.failureSummary || '').slice(0, 300) })),
      count: v.nodes.length,
    }))
    return { violations: pick(r.violations), incomplete: pick(r.incomplete) }
  })
  out.push({ key, ...run, ...res })
  if (errors.length) consoleErrors[key] = errors
  console.log(`${key}  V=${res.violations.length} (${res.violations.map((v) => v.id + ':' + v.count).join(', ')})  INC=${res.incomplete.map((v) => v.id).join(',')}`)
  await ctx.close()
}

// Also run axe with the chat panel and the mobile menu OPEN — these are the dynamic states.
for (const theme of ['dark', 'light']) {
  const { page, ctx } = await openPage(browser, { url: '/', theme, viewport: 'mobile' })
  await revealAll(page)
  await page.click('#chatfab')
  await page.waitForSelector('#chatpanel:not([hidden])')
  await page.click('#burger')
  await page.waitForSelector('#mobnav:not([hidden])')
  await page.addScriptTag({ content: AXE })
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa', 'best-practice'] },
    })
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, count: v.nodes.length, targets: v.nodes.slice(0, 6).map((n) => n.target.join(' ')) }))
  })
  out.push({ key: `tr-OPEN|${theme}|mobile`, id: 'tr-open', theme, vp: 'mobile', violations: res, incomplete: [] })
  console.log(`tr-OPEN|${theme}|mobile  V=${res.length} (${res.map((v) => v.id + ':' + v.count).join(', ')})`)
  await ctx.close()
}

await browser.close()
saveJSON('axe-raw.json', { out, consoleErrors })

// Dedup summary by rule id
const byRule = {}
for (const r of out) {
  for (const v of r.violations || []) {
    byRule[v.id] ??= { id: v.id, impact: v.impact, tags: v.tags, help: v.help, where: new Set(), targets: new Set() }
    byRule[v.id].where.add(`${r.id}/${r.theme}/${r.vp}`)
    for (const n of v.nodes || []) byRule[v.id].targets.add(n.target)
    for (const t of v.targets || []) byRule[v.id].targets.add(t)
  }
}
console.log('\n===== DEDUPED VIOLATIONS =====')
for (const k of Object.keys(byRule)) {
  const b = byRule[k]
  console.log(`\n[${b.impact}] ${b.id}  (${(b.tags || []).join(',')})`)
  console.log(`  ${b.help}`)
  console.log(`  where: ${[...b.where].join(', ')}`)
  console.log(`  targets: ${[...b.targets].slice(0, 10).join(' | ')}`)
}
console.log('\n===== CONSOLE ERRORS =====')
console.log(JSON.stringify(consoleErrors, null, 1))
