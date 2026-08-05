// Der Sprachvertrag als Code.
//
// Deutsch ist die Redaktionssprache — hier steht die Quelle. Türkisch ist die
// Standardsprache der Seite. Übersetzt wird EINMAL, nach der Abnahme des Masters.
// Bis dahin trägt jede Sprache die Pseudo-Sprache aus Phase 0.
//
// tier:     chrome | fach | stimme | seo   → entscheidet, WER den Baustein übersetzt
// register: warm | sachlich | dringlich | technisch → entscheidet, WELCHE WIRKUNG nachgebaut wird
// maxLen:   Zeichen, gilt für die längste Sprachfassung
// invariant:true → Wert kommt aus CMS/strukturierten Daten, nie aus der Prosa

export const locales = ['tr', 'de', 'ru', 'en'] as const
export const defaultLocale = 'tr'
export type Locale = (typeof locales)[number]

export type Tier = 'chrome' | 'fach' | 'stimme' | 'seo'
export type Register = 'warm' | 'sachlich' | 'dringlich' | 'technisch'

export interface Entry {
  tier: Tier
  register?: Register
  maxLen?: number
  invariant?: boolean
  /** Anweisung an die Transkreation: welche Wirkung nachzubauen ist, nicht welche Wörter. */
  note?: string
  /** Gesperrt bis zum schriftlichen Beleg durch den Kunden. */
  blocked?: string
  de: string
}

export const source = {
  'meta.title': {
    tier: 'seo',
    de: 'Klimaanlagen in Alanya — Verkauf, Montage & Wartung | Autorisierter Gree-Händler',
    note: 'NICHT ÜBERSETZEN. Pro Sprache nativ recherchieren.',
  },

  'hero.eyebrow': {
    tier: 'chrome',
    register: 'sachlich',
    maxLen: 42,
    de: 'Autorisierter Gree-Händler · Alanya',
    // Freigegeben 05.08.2026: Der Kunde hat schriftlich bestätigt, GREE/TLC
    // Yetkili Bayi UND Yetkili Servis zu sein, und kann das Zertifikat vorlegen
    // (Antwort Frage 6). "seit 1998" war nie im Einsatz; Gründungsjahr ist jetzt
    // belegt 2021. Damit fällt die Sperre.
  },
  'hero.claim': {
    tier: 'stimme',
    register: 'sachlich',
    // Budget auf 90 gehoben statt den Satz zu kürzen: "mit Rechnung" ist das
    // Gegen-Schwarzarbeit-Signal und trägt den Satz. Der Hero muss zwei Zeilen können.
    maxLen: 90,
    de: 'Ihre Klimaanlage in Alanya — Verkauf, Montage und Service aus einer Hand, mit Rechnung.',
  },
  'hero.claim.sub': {
    tier: 'stimme',
    register: 'warm',
    maxLen: 48,
    de: 'Kühle, nur eine Nachricht entfernt.',
    note: 'tr: "Serinlik bir mesaj uzağınızda." ru: «Прохлада — в одном сообщении.»',
  },
  'hero.sub': {
    tier: 'stimme',
    register: 'sachlich',
    maxLen: 150,
    de: 'Die Besichtigung ist kostenlos. Den Festpreis bekommen Sie schwarz auf weiß, bevor wir die erste Bohrung setzen.',
    note: 'tr: kein Preishinweis, stattdessen ücretsiz keşif + faturalı hizmet. ru: hier gehört eine Zahl hin.',
  },
  'hero.cta.primary': {
    tier: 'chrome',
    register: 'dringlich',
    maxLen: 26,
    de: 'Über WhatsApp schreiben',
    note: 'tr: Reihenfolge dreht sich. Primär "Ücretsiz keşif iste", Telefon gleichrangig.',
  },
  'hero.cta.secondary': {
    tier: 'chrome',
    register: 'dringlich',
    maxLen: 32,
    de: 'Kostenlose Besichtigung sichern',
  },
  'hero.phone.label': { tier: 'chrome', maxLen: 12, de: 'Anruf' },
  'hero.whatsapp.label': { tier: 'chrome', maxLen: 12, de: 'WhatsApp' },
  'hero.temp': { tier: 'chrome', invariant: true, maxLen: 30, de: 'Gerade in Alanya: {temperatur} °C' },

  'trust.dealer': { tier: 'fach', register: 'sachlich', maxLen: 40, de: 'Autorisierter Gree-Fachhändler' },
  'trust.faturali': { tier: 'stimme', register: 'sachlich', maxLen: 26, de: 'Leistung mit Rechnung' },
  'trust.rating': { tier: 'fach', invariant: true, maxLen: 48, de: '5,0 von 5 Sternen aus {count} Google-Bewertungen' },
  'trust.language': {
    tier: 'stimme',
    register: 'warm',
    maxLen: 130,
    de: 'Deutsch spricht bei uns ein Mensch, kein Übersetzer im Handy.',
    blocked: 'Wer genau spricht Deutsch? Betrieb oder Agentur?',
  },
  'trust.emergency': { tier: 'chrome', maxLen: 60, de: 'Jeden Tag erreichbar — in der Saison Rückruf am selben Tag.' },

  'garantie.arbeit': {
    tier: 'stimme',
    register: 'sachlich',
    de: 'Garantie auf unsere Montage: 1 Jahr. Tropft nach unserer Installation etwas oder löst sich eine Halterung, kommen wir und machen es kostenlos neu.',
    blocked: 'Arbeitsgarantie mit dem Betrieb bestätigen.',
  },
  'garantie.geraet': {
    tier: 'fach',
    invariant: true,
    de: 'Auf die Gree-Technik: 3 Jahre Herstellergarantie auf alle Teile. Maximale Reparaturdauer 20 Werktage.',
  },

  'service.montage.titel': { tier: 'fach', maxLen: 20, de: 'Montage' },
  'service.montage.text': {
    tier: 'fach',
    register: 'sachlich',
    de: 'Wir liefern, montieren und nehmen Ihre Anlage in Betrieb: Bohrung, Leitungen, Kondensatablauf, Vakuumieren, Probelauf. Vor dem Bohren suchen wir nach Leitungen und decken ab. Beschädigen wir dabei Fliese, Rohr oder Putz, bringen wir es auf unsere Kosten in Ordnung.',
  },
  'service.wartung.titel': { tier: 'fach', maxLen: 20, de: 'Wartung' },
  'service.wartung.text': {
    tier: 'fach',
    register: 'sachlich',
    de: 'Regelmäßige Wartung hält die Anlage effizient und langlebig. Wir reinigen Filter und Wärmetauscher, prüfen den Kältemittelstand und messen die Leistung.',
    note: 'tr: KEIN "kann sinnvoll sein". Türkisch verlangt şart — notwendig.',
  },
  'service.kaeltemittel.titel': { tier: 'fach', maxLen: 26, de: 'Kältemittel nachfüllen' },
  'service.kaeltemittel.text': {
    tier: 'fach',
    de: 'Kühlt die Anlage schwächer als früher, fehlt meist Kältemittel. Wir suchen zuerst die Leckage, dann füllen wir auf.',
    note: 'tr-Titel: Gaz Dolumu. ru-Titel: «Заправка фреоном». Fachwort nur im Datenblatt.',
  },

  'rechner.titel': { tier: 'stimme', register: 'warm', maxLen: 40, de: 'Welche Größe braucht Ihr Raum?' },
  'rechner.hinweis': {
    tier: 'fach',
    de: 'Das ist ein Näherungswert. Die genaue Auslegung machen wir vor Ort bei der kostenlosen Besichtigung.',
  },
  'rechner.frage.flaeche': { tier: 'chrome', maxLen: 34, de: 'Wie groß ist der Raum?' },
  'rechner.frage.personen': { tier: 'chrome', maxLen: 44, de: 'Wie viele Personen halten sich dort auf?' },
  'rechner.ergebnis': { tier: 'fach', invariant: true, de: 'Empfehlung: {btu} BTU.' },
  'rechner.cta': { tier: 'chrome', register: 'dringlich', maxLen: 30, de: 'Ergebnis per WhatsApp senden' },

  'notdienst.leiste': { tier: 'chrome', register: 'dringlich', maxLen: 44, de: 'Anlage defekt? Sofort anrufen' },

  'chat.launcher': { tier: 'chrome', maxLen: 24, de: 'Fragen? Schreiben Sie.' },
  'chat.disclosure': {
    tier: 'chrome',
    register: 'sachlich',
    de: 'Sie schreiben mit einem KI-Assistenten. Für Angebot, Termin oder eine Garantiefrage verbinde ich Sie mit einem Menschen.',
    note: 'Freiwillig. EU AI Act Art. 50 ist hier NICHT anwendbar — siehe docs/03-recht.md.',
  },

  'legal.kvkk': { tier: 'chrome', maxLen: 30, de: 'Datenschutzhinweis' },
  'legal.privacy': { tier: 'chrome', maxLen: 30, de: 'Datenschutzerklärung' },
  'legal.cookies': { tier: 'chrome', maxLen: 30, de: 'Cookie-Richtlinie' },
} satisfies Record<string, Entry>

export type Key = keyof typeof source

/** Invariante Werte. Kommen später aus dem CMS, nie aus der Prosa. */
export const invariants = {
  phone: '+90 242 513 86 51',
  whatsapp: '+90 533 046 13 87',
  // ⛔ Die reale Adresse ist ein Gmail-Konto. Nach Kurul-Beschluss 2019/157 ist die Nutzung
  //    von Gmail selbst eine Auslandsübermittlung nach KVKK Art. 9. Sie kann nicht auf die
  //    Seite, solange der Datenpfad in der Türkei bleiben soll.
  email: null as string | null,
  address: 'Hacet Mah., Alaiye Cad. No: 17/A, Alanya / Antalya',
  geo: [36.5509274, 32.0081833] as const,
  ratingCount: 65,
  ratingValue: 5.0,
} as const
