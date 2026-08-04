/**
 * Bewegungssystem — EINE Sprache für die ganze Seite.
 *
 * Der Hero hat die Sprache schon definiert (FrostHero.astro): Inhalt kommt von
 * unten und beruhigt sich, Linien zeichnen sich, Akzente bekommen einen langsamen
 * Glanz. Alles unterhalb des Heros war bisher stumm. Dieses Modul gibt dem Rest
 * der Seite dieselbe Sprache — nicht eine Sammlung von Effekten.
 *
 * Warum das Verbergen aus JavaScript kommt und nicht aus CSS:
 *   Läge `opacity: 0` fest im Stylesheet, wäre ein fehlgeschlagenes Bundle eine
 *   leere Seite. Der Abnahmetest prüft genau diese Sichtbarkeit (#kontakt, footer),
 *   und ein Besucher mit blockiertem JavaScript sähe nichts. Deshalb:
 *
 *   1. Ein Inline-Skript im <head> setzt `html.motion` VOR dem ersten Bild —
 *      kein Aufblitzen von Inhalt, der sich gleich wieder versteckt.
 *   2. Dasselbe Inline-Skript spannt einen Rettungs-Timer. Meldet sich dieses
 *      Modul nicht rechtzeitig, wird alles sichtbar gemacht.
 *   3. Dieses Modul entschärft den Timer erst, wenn GSAP wirklich geladen ist.
 *
 * GSAP wird spät geladen, aus demselben Grund wie three.js in ExplodedUnit.astro:
 * dieser Markt kauft am Telefon, oft im Mobilnetz.
 */

declare global {
  interface Window {
    /** Rettungs-Timer aus dem Inline-Skript in Base.astro. */
    __motionFailsafe?: number
  }
}

const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const root = document.documentElement

/**
 * Bewegungssystem abschalten und jeden Inhalt zeigen. Der sichere Zustand.
 *
 * Räumt auch die Inline-Stile weg, die GSAP gesetzt haben KANN. Der Fall: jemand
 * stellt die Bewegungsvorliebe mitten im Besuch um. Dann hat GSAP schon
 * `scaleX(0)` auf die Trennlinien und `opacity: 0` auf die Sterne geschrieben —
 * `html.motion` zu entfernen holt die nicht zurück, weil sie am Element kleben.
 */
const showAll = () => {
  root.classList.remove('motion')
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => el.classList.add('shown'))
  document.querySelectorAll<HTMLElement>('.sdiv .rule, .sdiv svg, .hero-parallax').forEach((el) => {
    el.style.transform = ''
    el.style.opacity = ''
  })
  // Zähler auf ihren Endwert setzen, nicht auf einen Zwischenstand einfrieren.
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const t = Number(el.dataset.count)
    if (!Number.isFinite(t)) return
    const d = Number(el.dataset.countDecimals) || 0
    const loc = root.lang || 'tr'
    el.textContent =
      (el.dataset.countPrefix || '') + t.toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d })
  })
}

/**
 * Die gemessene Höhe der mitlaufenden Kopfzeile nach `--topbar-h` schreiben.
 * `scroll-margin-top` hing an einer festen Zahl und lag darum falsch, sobald sich
 * die Leiste änderte. Gemessen statt geraten — und bei jeder Größenänderung neu,
 * weil die Leiste am Telefon niedriger ist als am Schreibtisch.
 *
 * Läuft UNABHÄNGIG vom Bewegungssystem: die Sprungziele müssen auch dann richtig
 * sitzen, wenn jemand Bewegung reduziert hat.
 */
const trackTopbar = () => {
  const bar = document.querySelector<HTMLElement>('.topbar')
  if (!bar) return
  const apply = () => root.style.setProperty('--topbar-h', `${Math.round(bar.getBoundingClientRect().height)}px`)
  apply()
  if ('ResizeObserver' in window) new ResizeObserver(apply).observe(bar)
  else addEventListener('resize', apply)
}

/**
 * Weiches Anker-Springen — der Ersatz für das entfernte globale
 * `scroll-behavior: smooth` (siehe global.css). Pro Klick statt global: während
 * des normalen Scrollens konkurriert damit nichts mit scrollgebundener Bewegung.
 */
const wireAnchors = () => {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = (e.target as HTMLElement | null)?.closest?.('a[href*="#"]') as HTMLAnchorElement | null
    if (!a || a.target === '_blank') return

    const url = new URL(a.href, location.href)
    // Nur derselbe Dokumentpfad. `/de/#hizmetler` von der türkischen Wurzel aus
    // ist ein echter Seitenwechsel und muss einer bleiben.
    if (url.pathname !== location.pathname || url.origin !== location.origin || !url.hash) return

    const target = document.querySelector(url.hash)
    if (!target) return

    e.preventDefault()
    // scrollIntoView beachtet `scroll-margin-top` — die Sticky-Kopfzeile
    // verdeckt das Ziel damit nicht.
    target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' })
    if (url.hash !== location.hash) history.pushState(null, '', url.hash)
  })
}

type Gsap = typeof import('gsap')['gsap']
type ST = typeof import('gsap/ScrollTrigger')['ScrollTrigger']

const setupReveals = (gsap: Gsap, ScrollTrigger: ST) => {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
  if (!els.length) return

  // Nach Gruppe bündeln: Elemente mit gleichem `data-reveal-group` laufen als
  // Staffel, nicht einzeln. Ein Kartenraster, das sechsmal unabhängig einfliegt,
  // sieht unruhig aus; als eine Bewegung mit Versatz sieht es teuer aus.
  const groups = new Map<string, HTMLElement[]>()
  const singles: HTMLElement[] = []
  for (const el of els) {
    const g = el.dataset.revealGroup
    if (g) {
      const list = groups.get(g)
      list ? list.push(el) : groups.set(g, [el])
    } else singles.push(el)
  }

  // Dieselbe Ruhe wie im Hero: von unten herein, dann stehenbleiben. Nur
  // `transform` und `opacity` — beides läuft auf der GPU, ohne Layout.
  const settle = (targets: HTMLElement[], stagger: number) =>
    gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration: 0.82, // --dur-reveal; scrollgebunden, daher über der 300-ms-Grenze
      ease: 'expo.out', // entspricht --ease cubic-bezier(.19,1,.22,1)
      stagger,
      overwrite: 'auto',
      onStart: () => targets.forEach((t) => t.classList.add('shown')),
      // `will-change` wieder abräumen — sonst hält der Browser für jedes
      // Element dauerhaft eine eigene Ebene vor.
      onComplete: () => targets.forEach((t) => (t.style.willChange = 'auto')),
    })

  const trigger = (targets: HTMLElement[], stagger = 0) => {
    gsap.set(targets, { opacity: 0, y: 18 })
    ScrollTrigger.create({
      trigger: targets[0],
      start: 'top 86%',
      once: true,
      onEnter: () => settle(targets, stagger),
    })
  }

  singles.forEach((el) => trigger([el]))
  groups.forEach((list) => trigger(list, 0.075))

  // ── "Draw" — Linien zeichnen sich, wie die Hero-Linie ──────────────────────
  // Zweite Vokabel derselben Sprache. Der Achtstern-Trenner war bisher statisch;
  // jetzt zieht sich seine Linie auf, wenn er ins Bild kommt.
  document.querySelectorAll<HTMLElement>('.sdiv').forEach((div) => {
    const rules = div.querySelectorAll<HTMLElement>('.rule')
    const star = div.querySelector('svg')
    gsap.set(rules, { scaleX: 0 })
    gsap.set(star, { opacity: 0, rotate: -45, transformOrigin: '50% 50%' })
    ScrollTrigger.create({
      trigger: div,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        gsap.to(rules, { scaleX: 1, duration: 0.9, ease: 'expo.out' })
        gsap.to(star, { opacity: 0.55, rotate: 0, duration: 1.1, ease: 'expo.out' }, )
      },
    })
  })

  // ── Zahlen, die hochlaufen ─────────────────────────────────────────────────
  // Nur bei ECHTEN Zahlen. "Gree" und "7/24" sind keine — die bleiben, wie sie sind.
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count)
    if (!Number.isFinite(target)) return
    const decimals = (el.dataset.countDecimals && Number(el.dataset.countDecimals)) || 0
    const prefix = el.dataset.countPrefix || ''
    // Türkisch und Russisch schreiben 5,0 — nicht 5.0. Die Sprache der Seite entscheidet.
    const loc = document.documentElement.lang || 'tr'
    const box = { v: 0 }
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () =>
        gsap.to(box, {
          v: target,
          duration: 1.1,
          ease: 'expo.out',
          onUpdate: () => {
            el.textContent =
              prefix + box.v.toLocaleString(loc, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
          },
        }),
    })
  })

  // ── Parallaxe-Tiefe auf dem Hero-Foto ──────────────────────────────────────
  // Sanft: 8 % Versatz über die ganze Hero-Höhe. Mehr wirkt wie ein Effekt,
  // weniger merkt niemand. `scrub` bindet es an die Scrollposition — deshalb
  // gilt die 300-ms-Grenze hier nicht.
  // Zielt auf die TRÄGEREBENE, nicht auf das Foto: das Foto gehört seiner
  // Einblende-Animation, und eine CSS-Animation mit `forwards` schlägt in der
  // Kaskade jeden Inline-Stil. Auf `.hero-photo` blieb die Parallaxe darum bei 0.
  const layer = document.querySelector<HTMLElement>('.hero-parallax')
  const hero = document.querySelector<HTMLElement>('.hero')
  if (layer && hero) {
    gsap.to(layer, {
      yPercent: 6,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    })
  }

  // Bilder und Schriften verschieben die Seitenhöhe, nachdem die Auslöser
  // vermessen wurden. Ohne das Nachmessen feuern Sektionen am falschen Punkt.
  addEventListener('load', () => ScrollTrigger.refresh())
}

const boot = async () => {
  try {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ])
    gsap.registerPlugin(ScrollTrigger)

    // Erst JETZT ist das Verbergen verantwortbar.
    if (window.__motionFailsafe) {
      clearTimeout(window.__motionFailsafe)
      window.__motionFailsafe = undefined
    }
    setupReveals(gsap, ScrollTrigger)
  } catch {
    // Kein GSAP, kein Drama — die Seite steht einfach still da.
    showAll()
  }
}

trackTopbar()
wireAnchors()

if (reduce.matches) {
  showAll()
} else {
  'requestIdleCallback' in window
    ? requestIdleCallback(() => boot(), { timeout: 1200 })
    : setTimeout(boot, 300)
}

// Schaltet der Nutzer die Bewegungsvorliebe mitten im Besuch um, gilt sie sofort.
reduce.addEventListener('change', () => {
  if (reduce.matches) showAll()
})
