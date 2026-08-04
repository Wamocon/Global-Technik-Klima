// Wissensbasis des KI-Assistenten.
//
// Zwei Betriebsarten, dieselbe Wissensbasis:
//  1. PRODUKTION: Wenn ein LLM-Endpunkt gesetzt ist (ANTHROPIC_API_KEY auf dem
//     türkischen Server), beantwortet Claude JEDEN Freitext in der Sprache des
//     Besuchers — SYSTEM_PROMPT unten ist sein Wissen. Siehe api/chat.js.
//  2. DEMO / Fallback: Ohne Schlüssel läuft die clientseitige Absicht-Erkennung
//     unten (INTENTS) — versteht Freitext im Fachgebiet, rechnet BTU, übergibt
//     an WhatsApp. Funktioniert überall, ohne Backend, ohne Datenabfluss.

import type { Locale } from '../i18n/utils'

export const WA = '905330461387' // +90 533 046 13 87

// ── Faktenblock: das Wissen des Assistenten (auch der LLM-Systemprompt) ──
export const SYSTEM_PROMPT = `Du bist der Assistent von "Global Teknik Klima" (Alanya Global Teknik), einem autorisierten Gree-Klimaanlagen-Händler und -Servicepartner in Alanya, Antalya, Türkei.

WICHTIG: Antworte IMMER in der Sprache des Nutzers. Sei knapp, warm, konkret. Erfinde NIE Preise, kein Gründungsjahr, keine Garantiefristen, die du nicht kennst. Wenn du etwas nicht sicher weißt oder es um ein konkretes Angebot, einen Termin oder eine Reklamation geht, biete an, an einen Menschen über WhatsApp zu übergeben (+90 533 046 13 87).

FIRMA
- Autorisierter Gree-Händler UND -Servicepartner (Yetkili Bayi ve Servisi).
- Adresse: Hacet Mah., Alaiye Cad. No: 17/A, Alanya / Antalya.
- Telefon: +90 242 513 86 51 (Festnetz), +90 533 046 13 87 (Mobil/WhatsApp).
- Öffnung: Mo–Sa 08:00–20:00, Sonntag geschlossen. WhatsApp jederzeit.
- 5,0 Sterne aus 65 Google-Bewertungen. Faturalı hizmet (Leistung mit offizieller Rechnung).
- Sprachen: Türkisch, Russisch, Deutsch, Englisch.

LEISTUNGEN
- Montage (Lieferung, Bohrung, Leitungen, Kondensatablauf, Vakuumieren, Probelauf; saubere Arbeit).
- Wartung (Filter/Wärmetauscher reinigen, Kältemittelstand, Leistung messen).
- Reinigung (Innengerät, Filter, Kondensatwanne).
- Kältemittel nachfüllen (erst Leckage suchen, dann füllen; R32).
- Störung & Reparatur (erst Diagnose, dann Kostenvoranschlag, dann Reparatur; Original-Gree-Teile).
- Demontage & Umsetzen beim Umzug.
- Die Vor-Ort-Besichtigung (keşif) ist kostenlos.

GREE-PRODUKTE
- Wandgeräte: Aphro (Einstieg), Pular (WLAN), Fairy (Premium, Luftreinigung), Airy (kompakt). Alle Inverter, Kältemittel R32.
- Salon/Standgeräte: I-Shine, 24.000–48.000 BTU.
- Multisplit: Free Match, bis 5 Innengeräte an einer Außeneinheit.
- Home-Typ: Wohn-Sortiment für Privathaushalte.
- Wärmepumpen: Versati (Heizen, Kühlen, Warmwasser).
- Gewerbe & VRF: Kassette, Kanal, GMV5/GMV6.
- Ersatzteile: original Gree.

BTU-AUSLEGUNG (Alanya, heißes Küstenklima)
- Faustregel: Fläche in m² × 550 + 600 BTU je Person über 2 Personen; Südlage/Dachgeschoss +15 %. Auf die nächste Gerätegröße runden (9.000/12.000/18.000/24.000/36.000/48.000). Immer als Näherung kennzeichnen und kostenlose Besichtigung für die genaue Auslegung anbieten.

PREISE
- Es werden keine festen Servicepreise online genannt. Für Montage/Reparatur: kostenlose Vor-Ort-Besichtigung, dann verbindliches Angebot. Bei Geräten: Ratenzahlung (taksit) möglich. Immer zu WhatsApp für ein konkretes Angebot führen.

GARANTIE
- Gree-Herstellergarantie auf alle Teile. Für Wandgeräte gibt es bei Montage durch den autorisierten Service ein erweitertes Garantieprogramm. Maximale Reparaturdauer 20 Werktage. Genaue Fristen im Gespräch bestätigen.`

// ── Clientseitige Absicht-Erkennung (Demo-Fallback) ──
// kw: Auslöser in ALLEN Sprachen (klein). a: Antwort in der Seitensprache.
export interface Intent { id: string; kw: string[]; a: Record<Locale, string> }

export const INTENTS: Intent[] = [
  {
    id: 'greeting',
    kw: ['merhaba', 'selam', 'здравствуйте', 'привет', 'hallo', 'guten tag', 'hi', 'hello'],
    a: {
      tr: 'Merhaba! Klima alımı, montaj, bakım ya da arıza. Hangi konuda yardımcı olayım?',
      ru: 'Здравствуйте! Покупка кондиционера, монтаж, обслуживание или ремонт — чем помочь?',
      de: 'Guten Tag! Kauf, Montage, Wartung oder Störung. Womit kann ich helfen?',
      en: 'Hello! Purchase, installation, maintenance or a fault. How can I help?',
    },
  },
  {
    id: 'services',
    kw: ['hizmet', 'servis', 'ne yapıyorsunuz', 'услуг', 'сервис', 'leistung', 'service', 'was macht ihr', 'what do you'],
    a: {
      tr: 'Montaj, bakım, temizlik, gaz dolumu, arıza onarımı ve sökme-takma yapıyoruz. Hepsi orijinal Gree parçalarıyla. Keşif ücretsiz.',
      ru: 'Монтаж, обслуживание, чистка, заправка фреоном, ремонт и демонтаж-перенос — всё с оригинальными деталями Gree. Замер бесплатный.',
      de: 'Montage, Wartung, Reinigung, Kältemittel nachfüllen, Reparatur und Demontage/Umsetzen. Mit Original-Gree-Teilen. Besichtigung kostenlos.',
      en: 'Installation, maintenance, cleaning, refrigerant top-up, repair and removal/relocation. With genuine Gree parts. Free survey.',
    },
  },
  {
    id: 'montaj',
    kw: ['montaj', 'kurulum', 'monte', 'установ', 'монтаж', 'montage', 'installation', 'install', 'einbau'],
    a: {
      tr: 'Montajda cihazı getirir, deliği açar, boruyu çeker, tahliyeyi bağlar, vakumlar ve devreye alırız. Arkamızda tertemiz bir iş bırakırız. Ücretsiz keşif için WhatsApp’tan yazın.',
      ru: 'При монтаже привозим аппарат, бурим, прокладываем трассу, подключаем дренаж, вакуумируем и запускаем. Оставляем чистую работу. Бесплатный замер — напишите в WhatsApp.',
      de: 'Bei der Montage liefern wir das Gerät, bohren, verlegen die Leitung, schließen den Ablauf an, vakuumieren und nehmen in Betrieb. Wir hinterlassen saubere Arbeit. Kostenlose Besichtigung per WhatsApp.',
      en: 'For installation we deliver, drill, run the lines, connect the drain, vacuum and commission. We leave clean work. Free survey via WhatsApp.',
    },
  },
  {
    id: 'bakim',
    kw: ['bakım', 'temizlik', 'temizle', 'обслуж', 'чистка', 'wartung', 'reinigung', 'maintenance', 'clean', 'service intervall'],
    a: {
      tr: 'Bakımda filtre ve eşanjörü temizler, gaz seviyesini kontrol eder, performansı ölçeriz. Klimanızın uzun ömürlü ve verimli çalışması için düzenli bakım şart. Randevu için WhatsApp.',
      ru: 'При обслуживании чистим фильтры и теплообменник, проверяем уровень фреона, замеряем работу. Регулярное ТО — чтобы кондиционер служил дольше. Запись через WhatsApp.',
      de: 'Bei der Wartung reinigen wir Filter und Wärmetauscher, prüfen den Kältemittelstand und messen die Leistung. Regelmäßige Wartung hält die Anlage effizient. Termin per WhatsApp.',
      en: 'Maintenance: we clean filters and heat exchanger, check refrigerant level and measure performance. Regular servicing keeps it efficient. Book via WhatsApp.',
    },
  },
  {
    id: 'gaz',
    kw: ['gaz', 'gaz dolumu', 'soğutmuyor', 'фреон', 'заправк', 'не холодит', 'kältemittel', 'gas', 'kühlt nicht', 'refrigerant', 'not cooling'],
    a: {
      tr: 'Klima eskisi kadar soğutmuyorsa genelde gaz eksiktir. Önce kaçağı buluruz, sonra doldururuz. Geçici çözüm yapmayız. R32 gaz kullanıyoruz. WhatsApp’tan durumu yazın.',
      ru: 'Если кондиционер холодит хуже, обычно не хватает фреона. Сначала находим утечку, потом заправляем — без временных решений. Используем R32. Опишите проблему в WhatsApp.',
      de: 'Kühlt die Anlage schwächer, fehlt meist Kältemittel. Erst suchen wir die Leckage, dann füllen wir auf. Keine Zwischenlösung. Wir nutzen R32. Schildern Sie es per WhatsApp.',
      en: 'If it cools less than before, refrigerant is usually low. First we find the leak, then refill. No stopgaps. We use R32. Describe it on WhatsApp.',
    },
  },
  {
    id: 'ariza',
    kw: ['arıza', 'tamir', 'onarım', 'bozuk', 'çalışmıyor', 'ремонт', 'поломк', 'не работает', 'reparatur', 'störung', 'defekt', 'repair', 'broken', 'fault', 'error'],
    a: {
      tr: 'Arızada önce tespit, sonra teklif, sonra onarım yaparız. Orijinal Gree parçası kullanırız. Alanya içinde keşif ücretsiz. WhatsApp’tan yazın.',
      ru: 'При поломке: сначала диагностика, потом смета, потом ремонт. Оригинальные детали Gree. Выезд по Алании бесплатный. Напишите в WhatsApp.',
      de: 'Bei einer Störung: erst Diagnose, dann Kostenvoranschlag, dann Reparatur. Original-Gree-Teile. Anfahrt in Alanya kostenlos. Schreiben Sie per WhatsApp.',
      en: 'For a fault: first diagnosis, then quote, then repair. Genuine Gree parts. Call-out within Alanya is free. Write on WhatsApp.',
    },
  },
  {
    id: 'products',
    kw: ['ürün', 'model', 'hangi klima', 'cihaz', 'gree', 'товар', 'модел', 'какой кондиционер', 'produkt', 'gerät', 'welche', 'product', 'which unit', 'aphro', 'pular', 'fairy', 'versati'],
    a: {
      tr: 'Gree programını taşıyoruz: duvar tipi (Aphro, Pular, Fairy, Airy), salon tipi (I-Shine), multi sistem (Free Match), home tipi, ısı pompası (Versati), ticari ve VRF (GMV5/GMV6), yedek parça. Odanıza uygun modeli birlikte seçelim.',
      ru: 'Мы возим весь ряд Gree: настенные (Aphro, Pular, Fairy, Airy), напольные (I-Shine), мульти-сплит (Free Match), «home», тепловые насосы (Versati), коммерческие и VRF (GMV5/GMV6), запчасти. Подберём модель под вашу комнату.',
      de: 'Wir führen das Gree-Programm: Wandgeräte (Aphro, Pular, Fairy, Airy), Standgeräte (I-Shine), Multisplit (Free Match), Home-Typ, Wärmepumpen (Versati), Gewerbe und VRF (GMV5/GMV6), Ersatzteile. Wir wählen das passende Modell gemeinsam.',
      en: 'We carry the Gree range: wall units (Aphro, Pular, Fairy, Airy), floor (I-Shine), multi-split (Free Match), Home type, heat pumps (Versati), commercial and VRF (GMV5/GMV6), spare parts. We pick the right model together.',
    },
  },
  {
    id: 'heatpump',
    kw: ['ısı pompası', 'isi pompasi', 'тепловой насос', 'wärmepumpe', 'waermepumpe', 'heat pump', 'versati', 'heizen', 'ısıtma', 'отопление'],
    a: {
      tr: 'Gree Versati ısı pompası ısıtma, soğutma ve sıcak su sağlar. Kışın da evi ısıtır. Kapasiteyi eviniz için birlikte belirleriz. Detay için WhatsApp.',
      ru: 'Тепловой насос Gree Versati даёт отопление, охлаждение и горячую воду — зимой греет дом. Мощность подберём под ваш дом. Подробности в WhatsApp.',
      de: 'Die Gree-Versati-Wärmepumpe liefert Heizen, Kühlen und Warmwasser. Heizt auch im Winter. Die Leistung legen wir für Ihr Haus aus. Details per WhatsApp.',
      en: 'The Gree Versati heat pump provides heating, cooling and hot water. It heats the home in winter too. We size it for your home. Details on WhatsApp.',
    },
  },
  {
    id: 'warranty',
    kw: ['garanti', 'гарант', 'garantie', 'warranty', 'kaç yıl garanti', 'guarantee'],
    a: {
      tr: 'Gree üretici garantisi tüm parçaları kapsar. Duvar tipi cihazlarda, yetkili servis montajında genişletilmiş garanti programı geçerli. Azami tamir süresi 20 iş günü. Güncel süreleri WhatsApp’ta netleştirelim.',
      ru: 'Заводская гарантия Gree — на все детали. Для настенных блоков при монтаже официальным сервисом действует расширенная программа. Максимальный срок ремонта — 20 рабочих дней. Точные сроки уточним в WhatsApp.',
      de: 'Die Gree-Herstellergarantie umfasst alle Teile. Für Wandgeräte gilt bei Montage durch den Vertragsservice ein erweitertes Programm. Maximale Reparaturdauer 20 Werktage. Genaue Fristen klären wir per WhatsApp.',
      en: 'The Gree manufacturer warranty covers all parts. For wall units, an extended programme applies when installed by the authorized service. Max repair time 20 working days. We confirm exact terms on WhatsApp.',
    },
  },
  {
    id: 'contact',
    kw: ['iletişim', 'telefon', 'adres', 'nerede', 'ara', 'контакт', 'телефон', 'адрес', 'где', 'kontakt', 'adresse', 'wo seid', 'contact', 'phone', 'address', 'where'],
    a: {
      tr: 'Hacet Mah., Alaiye Cad. No: 17/A, Alanya. Telefon +90 242 513 86 51, WhatsApp +90 533 046 13 87. Mo–Cmt 08:00–20:00.',
      ru: 'Hacet Mah., Alaiye Cad. No: 17/A, Алания. Телефон +90 242 513 86 51, WhatsApp +90 533 046 13 87. Пн–Сб 08:00–20:00.',
      de: 'Hacet Mah., Alaiye Cad. No: 17/A, Alanya. Telefon +90 242 513 86 51, WhatsApp +90 533 046 13 87. Mo–Sa 08:00–20:00.',
      en: 'Hacet Mah., Alaiye Cad. No: 17/A, Alanya. Phone +90 242 513 86 51, WhatsApp +90 533 046 13 87. Mon–Sat 08:00–20:00.',
    },
  },
  {
    id: 'hours',
    kw: ['saat', 'açık', 'kaçta', 'ne zaman', 'часы', 'работаете', 'когда открыт', 'öffnungszeit', 'geöffnet', 'wann', 'hours', 'open when'],
    a: {
      tr: 'Pazartesi–Cumartesi 08:00–20:00 açığız, pazar kapalı. WhatsApp’tan her zaman yazabilirsiniz.',
      ru: 'Понедельник–суббота 08:00–20:00, воскресенье выходной. В WhatsApp можно писать в любое время.',
      de: 'Montag–Samstag 08:00–20:00 geöffnet, Sonntag geschlossen. Per WhatsApp erreichen Sie uns jederzeit.',
      en: 'Monday–Saturday 08:00–20:00, Sunday closed. You can message us on WhatsApp anytime.',
    },
  },
  {
    id: 'language',
    kw: ['rusça', 'almanca', 'ingilizce', 'dil', 'русск', 'говорите по', 'deutsch', 'sprechen sie', 'russian', 'english', 'speak'],
    a: {
      tr: 'Türkçe, Rusça, Almanca ve İngilizce hizmet veriyoruz.',
      ru: 'Да, мы говорим по-русски — а также по-турецки, по-немецки и по-английски.',
      de: 'Ja, wir sprechen Deutsch, außerdem Türkisch, Russisch und Englisch.',
      en: 'Yes, we speak English, as well as Turkish, Russian and German.',
    },
  },
  {
    id: 'taksit',
    kw: ['taksit', 'ödeme', 'kredi', 'рассрочк', 'оплат', 'ratenzahlung', 'raten', 'finanzierung', 'instal', 'payment'],
    a: {
      tr: 'Cihaz alımında taksit imkânı var. Koşulları WhatsApp’tan paylaşalım.',
      ru: 'При покупке аппарата возможна рассрочка. Условия пришлём в WhatsApp.',
      de: 'Beim Gerätekauf ist Ratenzahlung möglich. Die Konditionen schicken wir per WhatsApp.',
      en: 'Instalment payment is possible when buying a unit. We share the terms on WhatsApp.',
    },
  },
]

// Absicht-Erkennung: Preis, BTU und Mensch-Übergabe werden gesondert behandelt (engine).
export const PRICE_KW = ['fiyat', 'ne kadar', 'kaç para', 'ücret', 'цена', 'сколько стоит', 'стоимость', 'preis', 'kosten', 'was kostet', 'price', 'cost', 'how much']
export const HANDOFF_KW = ['insan', 'yetkili', 'müşteri temsilci', 'gerçek kişi', 'человек', 'оператор', 'менеджер', 'mensch', 'mitarbeiter', 'person', 'human', 'agent', 'someone']
export const AREA_WORDS = ['m2', 'm²', 'metre', 'metrekare', 'oda', 'salon', 'кв', 'м2', 'м²', 'метр', 'комнат', 'зал', 'qm', 'quadrat', 'raum', 'zimmer', 'room', 'square']

export const PRICE_A: Record<Locale, string> = {
  tr: 'Montaj ve servis için sabit fiyat vermiyoruz; önce ücretsiz keşfe geliriz, sonra net teklif sunarız. Sürprizle karşılaşmazsınız. Cihaz alımında taksit de var. Keşif için WhatsApp’tan yazın.',
  ru: 'Фиксированную цену на монтаж и сервис не называем: сначала приезжаем на бесплатный замер, потом даём точную смету — без сюрпризов. При покупке аппарата есть рассрочка. Напишите в WhatsApp.',
  de: 'Für Montage und Service nennen wir keinen Festpreis am Telefon; zuerst die kostenlose Besichtigung, dann ein klares Angebot. Ohne Überraschungen. Beim Gerätekauf gibt es Ratenzahlung. Schreiben Sie per WhatsApp.',
  en: 'We don’t quote a fixed price upfront; first the free site survey, then a clear quote. No surprises. Instalments available on units. Message us on WhatsApp.',
}

export const HANDOFF_A: Record<Locale, string> = {
  tr: 'Tabii, sizi hemen bir yetkiliye bağlıyorum. WhatsApp’tan yazın, dakikalar içinde dönüş yaparız.',
  ru: 'Конечно, соединяю вас с менеджером — напишите в WhatsApp, ответим за пару минут.',
  de: 'Natürlich, ich verbinde Sie mit einem Mitarbeiter. Schreiben Sie per WhatsApp, wir antworten in Minuten.',
  en: 'Of course, I’ll connect you to a person. Message us on WhatsApp and we reply within minutes.',
}

export const FALLBACK_A: Record<Locale, string> = {
  tr: 'Bunu en iyi bir uzmanımız yanıtlar. WhatsApp’tan yazın, hemen yardımcı olalım, ya da yukarıdan arayın.',
  ru: 'На это лучше ответит наш специалист. Напишите в WhatsApp — поможем сразу, или позвоните по номеру выше.',
  de: 'Das beantwortet am besten ein Fachmann von uns. Schreiben Sie per WhatsApp. Wir helfen sofort, oder rufen Sie oben an.',
  en: 'A specialist can answer that best. Message us on WhatsApp. We’ll help right away, or call the number above.',
}

export const BTU_A: Record<Locale, (btu: string) => string> = {
  tr: (b) => `Yaklaşık ${b} BTU’luk bir cihaz uygun görünüyor. Alanya sıcağı için bir üst kademeyi öneririm. Kesin ölçümü ücretsiz keşifte yaparız. Sonucu WhatsApp’tan gönderelim mi?`,
  ru: (b) => `Похоже, подойдёт аппарат примерно на ${b} BTU — для жары Алании беру на класс выше. Точный замер сделаем бесплатно на месте. Отправить результат в WhatsApp?`,
  de: (b) => `Passend wäre ein Gerät mit etwa ${b} BTU. Für die Hitze in Alanya eine Klasse höher. Die genaue Auslegung machen wir kostenlos vor Ort. Ergebnis per WhatsApp senden?`,
  en: (b) => `A unit around ${b} BTU looks right. For Alanya’s heat I’d go one class higher. We do the exact sizing free on site. Send the result to WhatsApp?`,
}
