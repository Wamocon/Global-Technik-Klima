import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

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
  integrations: [
    // Die Sitemap bekommt dieselbe Sprachgruppe wie die hreflang-Angaben — aus EINER
    // Quelle, damit sich beide nicht widersprechen können.
    sitemap({
      i18n: {
        defaultLocale: 'tr',
        locales: { tr: 'tr-TR', de: 'de-DE', ru: 'ru-RU', en: 'en-US' },
      },
      filter: (page) => !page.includes('/404'), // die 404 gehört in keine Sitemap
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
})
