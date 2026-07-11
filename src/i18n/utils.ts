import { source, locales, defaultLocale, invariants, type Key, type Locale } from './ui'
import xx from './xx.json'

/**
 * Phase 0 — Nullsprache.
 * Solange keine Übersetzung existiert, liefert jede Sprache die Pseudo-Sprache.
 * Das prüft Layout, Schriften und hartkodierte Texte, BEVOR ein Wort bezahlt wird.
 * Deutsch zeigt immer die Quelle: es ist die Redaktionssprache.
 */
const PSEUDO = import.meta.env.PUBLIC_PSEUDO !== '0'

const catalogs: Partial<Record<Locale, Record<string, string>>> = {
  // tr, ru, en: bewusst leer. Kein Fallback auf Deutsch — sonst merkt niemand,
  // dass eine Übersetzung fehlt.
}

export function localeFromUrl(url: URL): Locale {
  const seg = url.pathname.split('/').filter(Boolean)[0]
  return (locales as readonly string[]).includes(seg) ? (seg as Locale) : defaultLocale
}

export function t(locale: Locale, key: Key, vars: Record<string, string | number> = {}): string {
  const entry = source[key]
  let raw: string

  if (locale === 'de') {
    raw = entry.de
  } else {
    const translated = catalogs[locale]?.[key]
    raw = translated ?? (PSEUDO ? (xx as Record<string, string>)[key] : `‹${key}›`)
  }

  return raw.replace(/\{(\w+)\}/g, (m, name) => String(vars[name] ?? m))
}

/** Metadaten eines Bausteins — für das Phase-0-Prüfraster. */
export function meta(key: Key) {
  return source[key]
}

export const allKeys = Object.keys(source) as Key[]

/**
 * Pfad einer Seite in einer bestimmten Sprache.
 * Türkisch liegt an der Wurzel (prefixDefaultLocale: false).
 */
export function pathFor(locale: Locale, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '')
  const base = locale === defaultLocale ? '' : `/${locale}`
  return `${base}/${clean}`.replace(/\/+$/, '') || '/'
}

/**
 * hreflang-Gruppe. Google: „If two pages don't both point to each other,
 * the tags will be ignored." Deshalb wird die Liste generiert, nicht getippt —
 * Gegenseitigkeit gilt dann per Konstruktion.
 * x-default zeigt auf die türkische Wurzel.
 */
export function hreflangs(site: URL | undefined, path = ''): { hreflang: string; href: string }[] {
  const origin = site?.origin ?? 'https://alanyagreeyetkilibayi.com.tr'
  const list = locales.map((l) => ({ hreflang: l, href: origin + pathFor(l, path) }))
  list.push({ hreflang: 'x-default', href: origin + pathFor(defaultLocale, path) })
  return list
}

/**
 * Türkisch kennt zwei i. `'ISI'.toLowerCase()` ergibt nicht `'ısı'`.
 * Deshalb: Großschreibung ausschließlich über CSS `text-transform` bei gesetztem `lang`.
 * Muss doch einmal in JS transformiert werden, dann nur hierüber.
 */
export function upper(s: string, locale: Locale): string {
  return s.toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : locale)
}

export function collator(locale: Locale): Intl.Collator {
  return new Intl.Collator(locale === 'tr' ? 'tr-TR' : locale)
}

export { locales, defaultLocale, invariants }
export type { Locale, Key }
