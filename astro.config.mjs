import { defineConfig } from 'astro/config'

// Sprachvertrag, Abschnitt 2:
//   Türkisch ist die Standardsprache und liegt an der Wurzel — die vier Bestandsseiten
//   behalten ihre URLs. Die anderen drei Sprachen bekommen ein Präfix.
//
// Achtung Astro 6 → 7: `redirectToDefaultLocale` steht jetzt auf false und setzt
// `prefixDefaultLocale: true` voraus. Wir brauchen es nicht — hier bewusst nicht gesetzt.
export default defineConfig({
  site: 'https://alanyagreeyetkilibayi.com.tr',
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'de', 'ru', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
})
