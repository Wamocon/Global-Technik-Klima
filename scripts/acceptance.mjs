import { chromium } from 'playwright'

// Standard ist der Astro-Standardport. Überschreibbar, damit der Abnahmetest gegen
// die GEBAUTE Fassung laufen kann, während auf 4321 der Entwicklungsserver steht:
//   BASE=http://localhost:4322 npm run abnahme
// Wichtig, weil `astro dev` keine sitemap-index.xml erzeugt — die entsteht erst
// beim Bauen. Gegen den Entwicklungsserver schlägt die Sitemap-Prüfung also zu
// Recht fehl und sagt nichts über die Auslieferung.
const BASE = process.env.BASE || 'http://localhost:4321'
const locales = [['tr', '/'], ['de', '/de/'], ['ru', '/ru/'], ['en', '/en/']]
const views = [['desktop', 1440, 900], ['mobil', 390, 844]]
const b = await chromium.launch()
const report = []
let fails = 0
const fail = (ctx, msg) => { report.push(`  ✗ [${ctx}] ${msg}`); fails++ }
const ok = (ctx, msg) => report.push(`  ✓ [${ctx}] ${msg}`)

for (const [loc, path] of locales) {
  for (const [vn, w, h] of views) {
    const ctx = `${loc}/${vn}`
    const page = await b.newPage({ viewport: { width: w, height: h }, colorScheme: 'dark', deviceScaleFactor: 1 })
    const errs = []
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
    page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message))
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1600)

    // A) Konsolen-/Seitenfehler
    if (errs.length) fail(ctx, `JS-Fehler: ${errs.slice(0, 2).join(' | ')}`)
    else ok(ctx, 'keine JS-Fehler')

    // B) Kein horizontaler Überlauf (dynamische Seite)
    const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }))
    if (overflow.sw > overflow.iw + 1) fail(ctx, `horizontaler Überlauf: ${overflow.sw}px > ${overflow.iw}px`)
    else ok(ctx, 'kein horizontaler Überlauf')

    // C) Kernelemente sichtbar
    for (const [sel, name] of [['h1', 'H1'], ['.hero', 'Hero'], ['#kontakt', 'Kontakt'], ['footer', 'Footer'], ['#chatfab', 'Chat-Starter']]) {
      if (!(await page.locator(sel).first().isVisible().catch(() => false))) fail(ctx, `${name} nicht sichtbar`)
    }

    // D) WhatsApp-Erreichbarkeit je Viewport
    if (vn === 'desktop') {
      if (!(await page.locator('.wafab').isVisible().catch(() => false))) fail(ctx, 'WhatsApp-Float fehlt (Desktop)')
    } else {
      if (!(await page.locator('.mobar').isVisible().catch(() => false))) fail(ctx, 'Sticky-Mobil-Leiste fehlt (Mobil)')
    }

    // E) Sternebewertung sichtbar + prominent
    const rating = page.locator('[data-rating]').first()
    if (await rating.count()) {
      const box = await rating.boundingBox()
      if (!box || box.height < 24) fail(ctx, `Sternebewertung zu klein (${box ? Math.round(box.height) : 0}px)`)
      else ok(ctx, `Sternebewertung ${Math.round(box.height)}px`)
    } else fail(ctx, 'Sternebewertung (data-rating) nicht gefunden')

    // ---------------- L1: Navigation je Viewport ----------------
    if (vn === 'mobil') {
      const burger = page.locator('#burger')
      if (!(await burger.isVisible().catch(() => false))) fail(ctx, 'L1: Burger-Knopf fehlt am Handy')
      else {
        if (await page.locator('#mobnav').isVisible()) fail(ctx, 'L1: Mobil-Menü ist beim Laden offen')
        await burger.click(); await page.waitForTimeout(250)
        const links = await page.locator('#mobnav a').count()
        if (!(await page.locator('#mobnav').isVisible())) fail(ctx, 'L1: Mobil-Menü öffnet nicht')
        else if (links < 6) fail(ctx, `L1: Mobil-Menü hat nur ${links} Sprungziele`)
        else ok(ctx, `L1: Mobil-Menü öffnet, ${links} Sprungziele`)
        // Escape schließt
        await page.keyboard.press('Escape'); await page.waitForTimeout(250)
        if (await page.locator('#mobnav').isVisible()) fail(ctx, 'L1: Mobil-Menü schließt nicht mit Escape')
        // Sprungziel schließt das Menü und springt
        await burger.click(); await page.waitForTimeout(200)
        await page.locator('#mobnav a').nth(4).click(); await page.waitForTimeout(500)
        if (await page.locator('#mobnav').isVisible()) fail(ctx, 'L1: Mobil-Menü bleibt nach Klick offen')
        else ok(ctx, 'L1: Sprungziel schließt das Menü')
      }
    } else {
      if (!(await page.locator('.mainnav').isVisible().catch(() => false))) fail(ctx, 'Hauptnavigation fehlt (Desktop)')
      if (await page.locator('#burger').isVisible().catch(() => false)) fail(ctx, 'Burger sollte am Desktop unsichtbar sein')
    }

    // ---------------- L2: strukturierte Daten ----------------
    const ld = await page.evaluate(() => {
      const el = document.querySelector('script[type="application/ld+json"]')
      if (!el) return null
      try { return JSON.parse(el.textContent || '') } catch { return 'PARSE_ERROR' }
    })
    if (!ld) fail(ctx, 'L2: kein JSON-LD')
    else if (ld === 'PARSE_ERROR') fail(ctx, 'L2: JSON-LD ist kein gültiges JSON')
    else {
      const biz = (ld['@graph'] || []).find((n) => String(n['@type']).includes('HVACBusiness'))
      if (!biz) fail(ctx, 'L2: kein LocalBusiness/HVACBusiness im Graph')
      else if (!biz.aggregateRating || biz.aggregateRating.ratingValue !== 5) fail(ctx, 'L2: aggregateRating fehlt/falsch')
      else if (!biz.geo || !biz.openingHoursSpecification) fail(ctx, 'L2: geo oder Öffnungszeiten fehlen')
      else if (!biz.hasOfferCatalog || biz.hasOfferCatalog.itemListElement.length !== 6) fail(ctx, 'L2: die 6 Leistungen fehlen im Katalog')
      // Gründungsjahr ist seit 05.08.2026 belegt (2021) und MUSS jetzt stimmen;
      // priceRange bleibt verboten (kein Festpreis).
      else if (biz.foundingDate !== '2021') fail(ctx, `L2: foundingDate ist ${biz.foundingDate}, erwartet 2021`)
      else if (biz.priceRange) fail(ctx, 'L2: priceRange im Schema — es wird kein Festpreis genannt!')
      else ok(ctx, `L2: LocalBusiness ${biz.aggregateRating.ratingValue}★/${biz.aggregateRating.reviewCount}, seit ${biz.foundingDate}, 6 Leistungen`)
    }

    // ---------------- L3: og:image ----------------
    const og = await page.evaluate(() => ({
      img: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      w: document.querySelector('meta[property="og:image:width"]')?.getAttribute('content'),
      url: document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
      canon: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      icon: document.querySelector('link[rel="icon"]')?.getAttribute('href'),
    }))
    if (!og.img || !og.w || !og.url || !og.canon) fail(ctx, 'L3: og:image / og:url / canonical unvollständig')
    else {
      const r = await page.request.get(BASE + '/og.jpg')
      if (!r.ok()) fail(ctx, 'L3: /og.jpg nicht erreichbar')
      else ok(ctx, `L3: og:image ${og.w}px, ${Math.round((await r.body()).length / 1024)} KB`)
    }
    if (!og.icon) fail(ctx, 'L5: kein Favicon')

    // F) Chat (nur Desktop)
    if (vn === 'desktop') {
      await page.click('#chatfab'); await page.waitForTimeout(300)
      if (!(await page.locator('#chatpanel').isVisible())) fail(ctx, 'Chat öffnet nicht')
      else {
        await page.fill('#cin', loc === 'ru' ? 'кондиционер на 25 квадратов' : '25 m2 oda için klima')
        await page.click('#cform button[type=submit]'); await page.waitForTimeout(600)
        const bot = await page.locator('#chatpanel .msg.bot').count()
        if (bot < 2) fail(ctx, 'Chat antwortet nicht auf Freitext')
        else ok(ctx, 'Chat versteht Freitext')
        await page.click('#cclose'); await page.waitForTimeout(250)
        if (await page.locator('#chatpanel').isVisible()) fail(ctx, 'Chat schließt nicht')
      }
    }

    // G) Karte
    await page.locator('#kontakt').scrollIntoViewIfNeeded().catch(() => {})
    await page.waitForTimeout(300)
    if (!(await page.locator('.cmap iframe').count()) && (await page.locator('.cmap-load').count())) {
      await page.click('.cmap-load').catch(() => {}); await page.waitForTimeout(1500)
    }
    if (!(await page.locator('.cmap iframe').count())) fail(ctx, 'Karte lädt nicht')
    else {
      const mb = await page.locator('.cmap iframe').boundingBox()
      if (!mb || mb.height < 200) fail(ctx, `Karte zu niedrig (${mb ? Math.round(mb.height) : 0}px)`)
      else ok(ctx, `Karte ${Math.round(mb.height)}px`)
    }

    // H) Explosionszeichnung
    const exp = page.locator('#teknik')
    if (!(await exp.count())) fail(ctx, 'Technik-Kapitel fehlt')
    else {
      await exp.scrollIntoViewIfNeeded(); await page.waitForTimeout(2600)
      const canvasOk = await page.evaluate(() => {
        const c = document.getElementById('expCanvas')
        return !!c && c.width > 0 && c.height > 0
      })
      if (!canvasOk) fail(ctx, 'Explosionszeichnung rendert nicht')
      else ok(ctx, 'Explosionszeichnung rendert')
      if ((await page.locator('#expLegend li.on').count()) === 0) fail(ctx, 'Explosions-Legende hebt nichts hervor')
    }

    // I) Vorher-Nachher-Regler
    const ba = page.locator('#referanslar')
    if (!(await ba.count())) fail(ctx, 'Referenzen-Kapitel fehlt')
    else {
      await ba.scrollIntoViewIfNeeded(); await page.waitForTimeout(500)
      const before = await page.evaluate(() => document.getElementById('ba')?.style.getPropertyValue('--pos'))
      await page.locator('#baRange').evaluate((el) => {
        el.value = '20'
        el.dispatchEvent(new Event('input', { bubbles: true }))
      })
      await page.waitForTimeout(250)
      const after = await page.evaluate(() => document.getElementById('ba')?.style.getPropertyValue('--pos'))
      if (before === after) fail(ctx, 'Vorher-Nachher-Regler reagiert nicht')
      else ok(ctx, `Regler ${before} → ${after}`)
    }

    // L9) Achtstern-Trenner
    const stars = await page.locator('.sdiv').count()
    if (stars < 3) fail(ctx, `L9: nur ${stars} Achtstern-Trenner`)

    // ---------------- L7: Rechtstexte sind echte Seiten ----------------
    if (vn === 'desktop') {
      const flinks = await page.locator('footer .fl a').all()
      if (flinks.length !== 3) fail(ctx, `L7: ${flinks.length} statt 3 Fußzeilen-Rechtslinks`)
      else {
        for (const a of flinks) {
          const href = await a.getAttribute('href')
          const r = await page.request.get(BASE + href)
          if (!r.ok()) { fail(ctx, `L7: ${href} → ${r.status()}`); continue }
          const body = await r.text()
          if (!body.includes('<h1')) fail(ctx, `L7: ${href} hat keine Überschrift`)
        }
        // Erwartet: Präfix der Sprache steckt im Pfad (außer Türkisch an der Wurzel)
        const first = await flinks[0].getAttribute('href')
        const want = loc === 'tr' ? '/kvkk' : `/${loc}/kvkk`
        if (first !== want) fail(ctx, `L7: erster Link ist ${first}, erwartet ${want}`)
        else ok(ctx, 'L7: 3 Rechtstexte erreichbar, Sprache korrekt')
      }
    }

    await page.close()
  }
}

// ---------------- L4/L10: Sitemap, robots, 404 (einmal) ----------------
{
  const page = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
  const ctx = 'global'

  const rob = await page.request.get(BASE + '/robots.txt')
  if (!rob.ok() || !(await rob.text()).includes('Sitemap:')) fail(ctx, 'L4: robots.txt fehlt oder ohne Sitemap-Verweis')
  else ok(ctx, 'L4: robots.txt verweist auf die Sitemap')

  const sm = await page.request.get(BASE + '/sitemap-index.xml')
  if (!sm.ok()) fail(ctx, 'L4: sitemap-index.xml fehlt')
  else {
    const inner = await page.request.get(BASE + '/sitemap-0.xml')
    const xml = inner.ok() ? await inner.text() : ''
    const urls = (xml.match(/<loc>/g) || []).length
    const has404 = xml.includes('/404')
    if (urls < 16) fail(ctx, `L4: Sitemap hat nur ${urls} URLs (erwartet ≥16)`)
    else if (has404) fail(ctx, 'L4: die 404 steht in der Sitemap')
    else ok(ctx, `L4: Sitemap mit ${urls} URLs, ohne 404`)
  }

  const nf = await page.goto(BASE + '/gibt-es-nicht', { waitUntil: 'domcontentloaded' })
  const body = await page.content()
  if (!body.includes('404')) fail(ctx, 'L10: keine 404-Seite')
  else {
    const ways = await page.locator('.ways li').count()
    if (ways !== 4) fail(ctx, `L10: 404 bietet ${ways} statt 4 Sprachwege`)
    else ok(ctx, `L10: 404-Seite mit 4 Sprachwegen (HTTP ${nf?.status()})`)
  }
  await page.close()
}

await b.close()
console.log('\n===== ABNAHMETEST =====')
report.forEach((l) => console.log(l))
console.log(`\nERGEBNIS: ${fails} Fehler`)
process.exit(fails ? 1 : 0)
