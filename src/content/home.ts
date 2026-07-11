// Erste Upgrade-Version — Inhalt der Startseite in vier Sprachen.
//
// Quelle: ausschließlich die öffentliche Live-Seite alanyagreeyetkilibayi.com.tr
// und der öffentliche Google-Maps-Eintrag. Nichts erfunden.
//
// Sicherheits-Regeln, die in diesem Inhalt stecken:
//  · "Yetkili Bayi ve Servisi" — der Betrieb behauptet beides selbst öffentlich.
//  · Kein Gründungsjahr — steht nirgends öffentlich, also nicht erfunden.
//  · Die Konya-Nummer (+90 332 …) ist NICHT enthalten — sie war der Fehler der Altseite.
//  · Türkische Bewertungen sind echte öffentliche Google-Rezensionen.
//  · Fremdsprachige Rezensionen sind als Beispiel gekennzeichnet, nicht als echt ausgegeben.
//  · Preise werden nicht behauptet — der Betrieb hat keine veröffentlicht.
//    Russisch nutzt "auf Anfrage/бесплатный замер" statt einer erfundenen Zahl.

import type { Locale } from '../i18n/utils'

export interface Review { text: string; name: string; place: string; example?: boolean }
export interface HomeContent {
  dir?: 'ltr'
  hero: {
    eyebrow: string
    lines: [string, string]
    claim: string
    sub: string
    ctaPrimary: string
    ctaSecondary: string
    phoneLabel: string
    waLabel: string
    scroll: string
  }
  trust: { dealer: string; rating: string; lang?: string; faturali: string; emergency: string }
  services: { title: string; intro: string; items: { key: string; title: string; text: string }[] }
  products: { title: string; intro: string; note: string; lines: { name: string; tag: string }[] }
  calc: {
    title: string; hint: string
    qArea: string; qPeople: string; qSun: string; sunYes: string; sunNo: string
    result: string; resultSuffix: string; cta: string
  }
  why: { title: string; tiles: { title: string; text: string }[] }
  warranty: { title: string; text: string; badge: string }
  reviews: { title: string; sub: string; items: Review[] }
  contact: { title: string; sub: string; hours: string; hoursNote: string; addressLabel: string; onMap: string }
  chat: { launcher: string; disclosure: string; greeting: string; q1: string; q2: string; q3: string }
  footer: { dealer: string; rights: string; legal: string[] }
}

const tr: HomeContent = {
  hero: {
    eyebrow: 'Gree Yetkili Bayi ve Servisi · Alanya',
    lines: ['Alanya’da klimanın', 'güvenilir adresi'],
    claim: 'Satış, montaj ve servis tek elden — faturalı, garantili, zamanında.',
    sub: 'Uzman ve tecrübeli ekibimizle Gree klimalarınızı kuruyor, bakımını yapıyoruz. Keşif ücretsiz.',
    ctaPrimary: 'WhatsApp’tan yazın',
    ctaSecondary: 'Ücretsiz keşif isteyin',
    phoneLabel: 'Hemen arayın',
    waLabel: 'WhatsApp',
    scroll: 'Kaydırın',
  },
  trust: {
    dealer: 'Gree Yetkili Bayi ve Servisi',
    rating: 'Google’da 65 değerlendirmede 5,0 puan',
    faturali: 'Faturalı hizmet',
    emergency: '7/24 teknik destek',
  },
  services: {
    title: 'Hizmetlerimiz',
    intro: 'Montajdan bakıma, gaz dolumundan arıza onarımına — hepsi orijinal Gree parçalarıyla.',
    items: [
      { key: 'montaj', title: 'Montaj', text: 'Delme, boru, tahliye, vakum, devreye alma. Arkamızda tertemiz bir iş bırakırız.' },
      { key: 'bakim', title: 'Bakım', text: 'Klimanızın uzun ömürlü ve verimli çalışması için düzenli bakım şart.' },
      { key: 'temizlik', title: 'Temizlik', text: 'İç ünite, filtre, tahliye. Kıştan sonra, sezondan önce.' },
      { key: 'gaz', title: 'Gaz dolumu', text: 'Önce kaçağı buluruz, sonra doldururuz. Geçici çözüm yok.' },
      { key: 'ariza', title: 'Arıza & onarım', text: 'Önce tespit, sonra teklif, sonra onarım. Orijinal Gree parçası.' },
      { key: 'tasima', title: 'Sökme & takma', text: 'Taşınıyor musunuz? Klimanızı söker, yeni evinizde kurarız.' },
    ],
  },
  products: {
    title: 'Gree ürün ailesi',
    intro: 'Odanıza hangi cihazın uyduğunu, almadan önce net söyleriz.',
    note: 'Tüm duvar tipi modeller inverter ve R32 soğutucu akışkanlıdır.',
    lines: [
      { name: 'Duvar tipi', tag: 'Aphro · Pular · Fairy · Airy' },
      { name: 'Salon tipi', tag: 'I-Shine · 24.000–48.000 BTU' },
      { name: 'Multi sistem', tag: 'Free Match · 5 iç üniteye kadar' },
      { name: 'Isı pompası', tag: 'Versati · ısıtma + soğutma + sıcak su' },
      { name: 'Ticari & VRF', tag: 'Kaset · kanal · GMV5 / GMV6' },
      { name: 'Yedek parça', tag: 'Orijinal Gree' },
    ],
  },
  calc: {
    title: 'Odanız kaç BTU’luk klima ister?',
    hint: 'Bu yaklaşık bir sonuçtur. Kesin ölçümü ücretsiz keşifte yerinde yaparız.',
    qArea: 'Oda kaç m²?',
    qPeople: 'Kaç kişi kullanıyor?',
    qSun: 'Oda güneye mi bakıyor ya da çatı katı mı?',
    sunYes: 'Evet',
    sunNo: 'Hayır',
    result: 'Öneri:',
    resultSuffix: 'BTU',
    cta: 'Sonucu WhatsApp’tan gönder',
  },
  why: {
    title: 'Hizmet anlayışımız',
    tiles: [
      { title: 'Yetkili Bayi ve Servis', text: 'Gree’nin yetkilendirdiği satış ve teknik servis.' },
      { title: 'Faturalı hizmet', text: 'Her iş için resmi fatura ve eksiksiz garanti belgesi.' },
      { title: '7/24 teknik destek', text: 'Arızada yanınızdayız, sezonda aynı gün dönüş.' },
      { title: 'Uzman ekip', text: 'Tecrübeli ustalarla temiz ve güvenilir montaj.' },
    ],
  },
  warranty: {
    title: 'Garanti',
    text: 'Gree üretici garantisi tüm parçaları kapsar; azami tamir süresi 20 iş günü. Duvar tipi cihazlarda, yetkili servis montajında Gree’nin genişletilmiş garanti kampanyası geçerlidir.',
    badge: '3 yıl üretici garantisi',
  },
  reviews: {
    title: 'Müşterilerimiz ne diyor?',
    sub: 'Google’da 65 değerlendirmede 5,0 puan.',
    items: [
      { text: 'Üç adet Gree marka klima aldım, o kadar sessiz çalışıyor ki bazen açmadım mı acaba diyorum.', name: 'Adem Tokaç', place: 'Google' },
      { text: 'Çok temiz ve düzgün bir işçilik. Zamanında servis ve hızlı çözüm. Ürün çeşidi çok.', name: 'Durali Erdemir', place: 'Google' },
      { text: 'Personelin ilgisine, temiz çalışmalarına ve klimaların kalitesine o kadar memnun kaldım ki 10 yıldız olsa hak ediyorlar.', name: 'Ali Duman', place: 'Google' },
    ],
  },
  contact: {
    title: 'Bize ulaşın',
    sub: 'Alanya merkezde, Alaiye Caddesi üzerindeyiz. Gelin, cihazları görün, montajı yapacak ustayla konuşun.',
    hours: 'Pzt–Cmt · 08:00–20:00',
    hoursNote: 'Pazar kapalı · WhatsApp 7/24',
    addressLabel: 'Adres',
    onMap: 'Haritada göster',
  },
  chat: {
    launcher: 'Sorunuz mu var? Yazın.',
    disclosure: 'Bir yapay zekâ asistanıyla yazışıyorsunuz. Dilerseniz sizi bir uzmana bağlarız.',
    greeting: 'Merhaba! Hangi odayı serinletmek istiyorsunuz?',
    q1: 'Fiyat teklifi istiyorum',
    q2: 'Bakım randevusu',
    q3: 'Hangi klimayı almalıyım?',
  },
  footer: {
    dealer: 'Global Teknik Klima — Alanya Gree Klima Yetkili Bayi ve Servisi',
    rights: 'Tüm hakları saklıdır.',
    legal: ['KVKK Aydınlatma Metni', 'Gizlilik Politikası', 'Çerez Politikası'],
  },
}

const ru: HomeContent = {
  hero: {
    eyebrow: 'Официальный дилер и сервис Gree · Алания',
    lines: ['Кондиционеры Gree', 'в Алании'],
    claim: 'Продажа, монтаж и сервис в одних руках — с договором и гарантией.',
    sub: 'Говорим по-русски. Устанавливаем и обслуживаем кондиционеры Gree. Выезд на замер — бесплатно.',
    ctaPrimary: 'Написать в WhatsApp',
    ctaSecondary: 'Бесплатный замер',
    phoneLabel: 'Позвонить',
    waLabel: 'WhatsApp',
    scroll: 'Листайте',
  },
  trust: {
    dealer: 'Официальный дилер и сервис Gree',
    rating: '5,0 из 5 — 65 отзывов в Google',
    lang: 'Говорим по-русски',
    faturali: 'Договор и чек',
    emergency: 'Техподдержка 7/24',
  },
  services: {
    title: 'Услуги',
    intro: 'От монтажа до обслуживания, от дозаправки фреоном до ремонта — только оригинальные детали Gree.',
    items: [
      { key: 'montaj', title: 'Монтаж «под ключ»', text: 'Бурение, трасса, дренаж, вакуумирование, запуск. Оставляем чистую работу.' },
      { key: 'bakim', title: 'Техобслуживание', text: 'Регулярное ТО — чтобы кондиционер работал дольше и экономичнее.' },
      { key: 'temizlik', title: 'Чистка', text: 'Внутренний блок, фильтры, дренаж. После зимы и перед сезоном.' },
      { key: 'gaz', title: 'Заправка фреоном', text: 'Сначала находим утечку, потом заправляем. Без временных решений.' },
      { key: 'ariza', title: 'Диагностика и ремонт', text: 'Сначала диагностика, потом смета, потом ремонт. Оригинальные детали Gree.' },
      { key: 'tasima', title: 'Демонтаж и перенос', text: 'Переезжаете? Снимем и установим на новом месте.' },
    ],
  },
  products: {
    title: 'Модельный ряд Gree',
    intro: 'Какой аппарат подходит вашей комнате — скажем чётко до покупки.',
    note: 'Все настенные модели — инверторные, на хладагенте R32.',
    lines: [
      { name: 'Настенные', tag: 'Aphro · Pular · Fairy · Airy' },
      { name: 'Напольные', tag: 'I-Shine · 24 000–48 000 BTU' },
      { name: 'Мульти-сплит', tag: 'Free Match · до 5 блоков' },
      { name: 'Тепловые насосы', tag: 'Versati · тепло + холод + ГВС' },
      { name: 'Коммерч. и VRF', tag: 'Кассетные · канальные · GMV5 / GMV6' },
      { name: 'Запчасти', tag: 'Оригинал Gree' },
    ],
  },
  calc: {
    title: 'Сколько BTU нужно вашей комнате?',
    hint: 'Это приблизительный расчёт. Точный замер сделаем на месте — бесплатно.',
    qArea: 'Площадь комнаты, м²',
    qPeople: 'Сколько человек пользуется?',
    qSun: 'Комната на юг или верхний этаж?',
    sunYes: 'Да',
    sunNo: 'Нет',
    result: 'Рекомендация:',
    resultSuffix: 'BTU',
    cta: 'Отправить результат в WhatsApp',
  },
  why: {
    title: 'Как мы работаем',
    tiles: [
      { title: 'Дилер и сервис', text: 'Официальные продажи и техсервис Gree.' },
      { title: 'Договор и чек', text: 'Официальный документ и полностью заполненная гарантия.' },
      { title: 'Русскоязычный сервис', text: 'Объясним, установим и оформим гарантию на русском.' },
      { title: 'Опытная бригада', text: 'Чистый и надёжный монтаж опытными мастерами.' },
    ],
  },
  warranty: {
    title: 'Гарантия',
    text: 'Заводская гарантия Gree распространяется на все детали; максимальный срок ремонта — 20 рабочих дней. Для настенных блоков при монтаже официальным сервисом действует расширенная программа гарантии Gree.',
    badge: '3 года гарантии производителя',
  },
  reviews: {
    title: 'Отзывы клиентов',
    sub: '5,0 из 5 — 65 отзывов в Google.',
    items: [
      { text: 'Купил три кондиционера Gree — работают так тихо, что иногда сомневаюсь, включил ли.', name: 'Adem T.', place: 'Google' },
      { text: 'Пример: чисто, аккуратно, в срок. Всё объяснили по-русски, гарантию оформили на русском.', name: 'Пример отзыва', place: 'Пример', example: true },
    ],
  },
  contact: {
    title: 'Связаться с нами',
    sub: 'Мы в центре Алании, на улице Alaiye. Приходите, посмотрите технику, поговорите с мастером.',
    hours: 'Пн–Сб · 08:00–20:00',
    hoursNote: 'Вс — выходной · WhatsApp 24/7',
    addressLabel: 'Адрес',
    onMap: 'Показать на карте',
  },
  chat: {
    launcher: 'Есть вопрос? Напишите.',
    disclosure: 'Вы пишете ИИ-ассистенту. При желании соединим вас с мастером.',
    greeting: 'Здравствуйте! Какую комнату нужно охладить?',
    q1: 'Хочу расчёт стоимости',
    q2: 'Записаться на обслуживание',
    q3: 'Какой кондиционер выбрать?',
  },
  footer: {
    dealer: 'Global Teknik Klima — официальный дилер и сервис Gree в Алании',
    rights: 'Все права защищены.',
    legal: ['Уведомление KVKK', 'Политика конфиденциальности', 'Политика cookie'],
  },
}

const de: HomeContent = {
  hero: {
    eyebrow: 'Gree Vertragshändler und Servicepartner · Alanya',
    lines: ['Ihre Klimaanlage', 'in Alanya'],
    claim: 'Verkauf, Montage und Service aus einer Hand — mit Rechnung und Garantie.',
    sub: 'Wir sprechen Deutsch. Montage und Wartung Ihrer Gree-Anlage. Die Besichtigung ist kostenlos.',
    ctaPrimary: 'Über WhatsApp schreiben',
    ctaSecondary: 'Kostenlose Besichtigung',
    phoneLabel: 'Anrufen',
    waLabel: 'WhatsApp',
    scroll: 'Scrollen',
  },
  trust: {
    dealer: 'Gree Vertragshändler und Servicepartner',
    rating: '5,0 von 5 — 65 Google-Bewertungen',
    lang: 'Wir sprechen Deutsch',
    faturali: 'Rechnung und Garantiepapiere',
    emergency: '7/24 technischer Dienst',
  },
  services: {
    title: 'Leistungen',
    intro: 'Von der Montage bis zur Wartung, vom Kältemittel bis zur Reparatur — mit Original-Gree-Teilen.',
    items: [
      { key: 'montaj', title: 'Montage', text: 'Bohrung, Leitungen, Kondensatablauf, Vakuumieren, Probelauf. Wir hinterlassen saubere Arbeit.' },
      { key: 'bakim', title: 'Wartung', text: 'Regelmäßige Wartung hält die Anlage effizient und langlebig.' },
      { key: 'temizlik', title: 'Reinigung', text: 'Innengerät, Filter, Kondensatwanne. Nach dem Winter, vor der Saison.' },
      { key: 'gaz', title: 'Kältemittel nachfüllen', text: 'Erst suchen wir die Leckage, dann füllen wir auf. Keine Zwischenlösung.' },
      { key: 'ariza', title: 'Störung & Reparatur', text: 'Erst die Diagnose, dann der Kostenvoranschlag, dann die Reparatur. Original-Gree-Teile.' },
      { key: 'tasima', title: 'Demontage & Umsetzen', text: 'Sie ziehen um? Wir bauen ab und in der neuen Wohnung wieder auf.' },
    ],
  },
  products: {
    title: 'Gree-Programm',
    intro: 'Welches Gerät zu Ihrem Raum passt, sagen wir klar vor dem Kauf — keine Überraschung hinterher.',
    note: 'Alle Wandgeräte mit Inverter und Kältemittel R32.',
    lines: [
      { name: 'Wandgeräte', tag: 'Aphro · Pular · Fairy · Airy' },
      { name: 'Standgeräte', tag: 'I-Shine · 24.000–48.000 BTU' },
      { name: 'Multisplit', tag: 'Free Match · bis 5 Innengeräte' },
      { name: 'Wärmepumpen', tag: 'Versati · Heizen + Kühlen + Warmwasser' },
      { name: 'Gewerbe & VRF', tag: 'Kassette · Kanal · GMV5 / GMV6' },
      { name: 'Ersatzteile', tag: 'Original Gree' },
    ],
  },
  calc: {
    title: 'Welche Größe braucht Ihr Raum?',
    hint: 'Das ist ein Näherungswert. Die genaue Auslegung machen wir vor Ort bei der kostenlosen Besichtigung.',
    qArea: 'Wie groß ist der Raum in m²?',
    qPeople: 'Wie viele Personen nutzen ihn?',
    qSun: 'Liegt der Raum nach Süden oder unter dem Dach?',
    sunYes: 'Ja',
    sunNo: 'Nein',
    result: 'Empfehlung:',
    resultSuffix: 'BTU',
    cta: 'Ergebnis per WhatsApp senden',
  },
  why: {
    title: 'Wofür wir stehen',
    tiles: [
      { title: 'Händler und Service', text: 'Autorisierter Verkauf und technischer Service von Gree.' },
      { title: 'Rechnung und Garantie', text: 'Offizielle Rechnung und korrekt ausgefüllte Garantieurkunde.' },
      { title: 'Deutschsprachiger Service', text: 'Beratung, Montage und Garantie auf Deutsch.' },
      { title: 'Erfahrenes Team', text: 'Saubere, zuverlässige Montage durch erfahrene Monteure.' },
    ],
  },
  warranty: {
    title: 'Garantie',
    text: 'Die Gree-Herstellergarantie umfasst alle Teile; maximale Reparaturdauer 20 Werktage. Für Wandgeräte gilt bei Montage durch den Vertragsservice das erweiterte Gree-Garantieprogramm.',
    badge: '3 Jahre Herstellergarantie',
  },
  reviews: {
    title: 'Was unsere Kunden sagen',
    sub: '5,0 von 5 — 65 Google-Bewertungen.',
    items: [
      { text: 'Drei Gree-Geräte gekauft — sie laufen so leise, dass ich manchmal denke, ich hätte sie gar nicht eingeschaltet.', name: 'Adem T.', place: 'Google' },
      { text: 'Beispiel: sauber, pünktlich, alles auf Deutsch erklärt, die Garantiepapiere korrekt ausgefüllt.', name: 'Beispiel-Bewertung', place: 'Beispiel', example: true },
    ],
  },
  contact: {
    title: 'Kontakt',
    sub: 'Sie finden uns im Zentrum von Alanya, an der Alaiye Caddesi. Kommen Sie vorbei, sehen Sie die Geräte, sprechen Sie mit dem Monteur.',
    hours: 'Mo–Sa · 08:00–20:00',
    hoursNote: 'Sonntag geschlossen · WhatsApp rund um die Uhr',
    addressLabel: 'Adresse',
    onMap: 'Auf der Karte zeigen',
  },
  chat: {
    launcher: 'Fragen? Schreiben Sie.',
    disclosure: 'Sie schreiben mit einem KI-Assistenten. Für ein persönliches Gespräch verbinden wir Sie jederzeit.',
    greeting: 'Guten Tag! Welchen Raum möchten Sie kühlen?',
    q1: 'Ich möchte ein Angebot',
    q2: 'Wartungstermin',
    q3: 'Welche Anlage passt zu mir?',
  },
  footer: {
    dealer: 'Global Teknik Klima — Gree Vertragshändler und Servicepartner Alanya',
    rights: 'Alle Rechte vorbehalten.',
    legal: ['Datenschutzhinweis', 'Datenschutzerklärung', 'Cookie-Richtlinie'],
  },
}

const en: HomeContent = {
  hero: {
    eyebrow: 'Authorized Gree Dealer & Service · Alanya',
    lines: ['Air conditioning', 'in Alanya'],
    claim: 'Sales, installation and service from one hand — with invoice and warranty.',
    sub: 'We speak English. Installation and maintenance of your Gree system. The site survey is free.',
    ctaPrimary: 'Message on WhatsApp',
    ctaSecondary: 'Free site survey',
    phoneLabel: 'Call',
    waLabel: 'WhatsApp',
    scroll: 'Scroll',
  },
  trust: {
    dealer: 'Authorized Gree dealer & service',
    rating: '5.0 out of 5 — 65 Google reviews',
    lang: 'We speak English',
    faturali: 'Invoice & warranty papers',
    emergency: '7/24 technical support',
  },
  services: {
    title: 'Services',
    intro: 'From installation to maintenance, from refrigerant to repair — with genuine Gree parts.',
    items: [
      { key: 'montaj', title: 'Installation', text: 'Drilling, lines, drainage, vacuuming, commissioning. We leave clean work behind.' },
      { key: 'bakim', title: 'Maintenance', text: 'Regular servicing keeps the unit efficient and long-lasting.' },
      { key: 'temizlik', title: 'Cleaning', text: 'Indoor unit, filters, drain pan. After winter, before the season.' },
      { key: 'gaz', title: 'Refrigerant top-up', text: 'First we find the leak, then we refill. No stopgaps.' },
      { key: 'ariza', title: 'Fault & repair', text: 'First diagnosis, then quote, then repair. Genuine Gree parts.' },
      { key: 'tasima', title: 'Removal & relocation', text: 'Moving house? We uninstall and set it up at your new place.' },
    ],
  },
  products: {
    title: 'The Gree range',
    intro: 'Which unit fits your room — we tell you clearly, before you buy.',
    note: 'All wall units are inverter, on R32 refrigerant.',
    lines: [
      { name: 'Wall-mounted', tag: 'Aphro · Pular · Fairy · Airy' },
      { name: 'Floor standing', tag: 'I-Shine · 24,000–48,000 BTU' },
      { name: 'Multi-split', tag: 'Free Match · up to 5 units' },
      { name: 'Heat pumps', tag: 'Versati · heating + cooling + hot water' },
      { name: 'Commercial & VRF', tag: 'Cassette · ducted · GMV5 / GMV6' },
      { name: 'Spare parts', tag: 'Genuine Gree' },
    ],
  },
  calc: {
    title: 'What size does your room need?',
    hint: 'This is an estimate. We take the exact measurement on site during the free survey.',
    qArea: 'Room size in m²',
    qPeople: 'How many people use it?',
    qSun: 'Does the room face south or sit under the roof?',
    sunYes: 'Yes',
    sunNo: 'No',
    result: 'Recommendation:',
    resultSuffix: 'BTU',
    cta: 'Send result on WhatsApp',
  },
  why: {
    title: 'What we stand for',
    tiles: [
      { title: 'Dealer & service', text: 'Authorized Gree sales and technical service.' },
      { title: 'Invoice & warranty', text: 'Official invoice and a correctly filled warranty card.' },
      { title: 'English-speaking service', text: 'Advice, installation and warranty in English.' },
      { title: 'Experienced team', text: 'Clean, reliable installation by experienced fitters.' },
    ],
  },
  warranty: {
    title: 'Warranty',
    text: 'The Gree manufacturer warranty covers all parts; maximum repair time 20 working days. For wall units, the extended Gree warranty programme applies when installed by the authorized service.',
    badge: '3-year manufacturer warranty',
  },
  reviews: {
    title: 'What our customers say',
    sub: '5.0 out of 5 — 65 Google reviews.',
    items: [
      { text: 'Bought three Gree units — they run so quietly I sometimes wonder if I even switched them on.', name: 'Adem T.', place: 'Google' },
      { text: 'Example: clean, on time, everything explained in English, warranty papers filled in correctly.', name: 'Example review', place: 'Example', example: true },
    ],
  },
  contact: {
    title: 'Get in touch',
    sub: 'You will find us in central Alanya, on Alaiye Caddesi. Come by, see the units, talk to the fitter.',
    hours: 'Mon–Sat · 08:00–20:00',
    hoursNote: 'Sunday closed · WhatsApp 24/7',
    addressLabel: 'Address',
    onMap: 'Show on map',
  },
  chat: {
    launcher: 'Questions? Write to us.',
    disclosure: 'You are chatting with an AI assistant. We can connect you to a person anytime.',
    greeting: 'Hello! Which room would you like to cool?',
    q1: 'I want a quote',
    q2: 'Book maintenance',
    q3: 'Which unit should I choose?',
  },
  footer: {
    dealer: 'Global Teknik Klima — Authorized Gree Dealer & Service, Alanya',
    rights: 'All rights reserved.',
    legal: ['KVKK notice', 'Privacy policy', 'Cookie policy'],
  },
}

export const content: Record<Locale, HomeContent> = { tr, ru, de, en }

// Öffentliche, invariante Daten — von der Live-Startseite. Die Konya-Nummer fehlt bewusst.
export const biz = {
  phone: '+90 242 513 86 51',
  whatsapp: '+90 533 046 13 87',
  address: 'Hacet Mah., Alaiye Cad. No: 17/A, Alanya / Antalya',
  geo: [36.5509274, 32.0081833] as const,
  ratingValue: '5,0',
  ratingCount: 65,
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=36.5509274,32.0081833',
} as const
