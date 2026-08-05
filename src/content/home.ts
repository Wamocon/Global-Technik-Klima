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
  // `taksit` — Kundenwunsch aus dem Fragebogen, Frage 3: "kredi kartına taksit
  // imkânı". Stand bisher nur im Wissensspeicher des Chat-Assistenten (kb.ts) und
  // war auf der Seite selbst nirgends zu sehen. Das Glossar (Abschnitt 4) führt
  // `taksit` als starkes Kaufsignal — es gehört in den Vertrauensblock.
  trust: { dealer: string; rating: string; lang?: string; faturali: string; emergency: string; taksit: string }
  services: { title: string; intro: string; items: { key: string; title: string; text: string }[] }
  products: { title: string; intro: string; note: string; lines: { name: string; tag: string; img: string }[] }
  calc: {
    title: string; hint: string
    qArea: string; qPeople: string; qSun: string; sunYes: string; sunNo: string
    result: string; resultSuffix: string; cta: string
  }
  why: { title: string; tiles: { title: string; text: string }[] }
  // Garanti — jetzt gestaffelt, mit den echten, vom Kunden bestätigten Fristen
  // (Antwort Frage 5, 05.08.2026). Der 6-Jahre-Satz läuft am 31.12.2026 aus; das
  // Datum steht sichtbar dabei, damit niemand eine abgelaufene Frist bewirbt.
  warranty: { title: string; badge: string; intro: string; tiers: { years: string; who: string }[]; note: string }
  // Kampagne — taksit und Altgeräte-Rücknahme (eski klima geri alım). Beides sind
  // echte, bestätigte Verkaufshebel (Antwort Frage 11). Kein erfundener Preis.
  campaign: { eyebrow: string; taksitTitle: string; taksitText: string; tradeTitle: string; tradeText: string; cta: string }
  // Proje/B2B — Oteller, siteler, işletmeler (Antwort Frage 2). Die größte Lücke
  // zwischen dem, was der Betrieb kann, und dem, was die alte Seite zeigte.
  projects: {
    eyebrow: string; title: string; intro: string
    segments: { name: string }[]
    systems: { name: string; text: string }[]
    steps: { title: string; text: string }[]
    cta: string; ctaSub: string
  }
  // Randevu-/Keşif-Formular — genau der Ablauf, den der Kunde beschrieben hat
  // (Antwort Frage 9): der Besucher wählt Wunschtag und -zeit, die Nachricht geht
  // per WhatsApp raus, der Betrieb bestätigt selbst. Kein Server nötig.
  request: {
    eyebrow: string; title: string; intro: string
    fName: string; fPhone: string; fPlace: string; fPlacePh: string
    fService: string; services: string[]
    fWhen: string; fNote: string; fNotePh: string
    consent: string; submit: string; hint: string
  }
  reviews: { title: string; sub: string; items: Review[] }
  contact: { title: string; sub: string; hours: string; hoursNote: string; addressLabel: string; onMap: string }
  chat: { launcher: string; disclosure: string; greeting: string; q1: string; q2: string; q3: string }
  footer: { dealer: string; rights: string; legal: string[] }
}

const tr: HomeContent = {
  hero: {
    eyebrow: 'Gree Yetkili Bayi ve Servisi · Alanya',
    lines: ['Alanya’da klimanın', 'güvenilir adresi'],
    claim: 'Satış, montaj ve servis tek elden. Faturalı, garantili, zamanında.',
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
    taksit: 'Kredi kartına taksit',
  },
  services: {
    title: 'Hizmetlerimiz',
    intro: 'Montajdan bakıma, gaz dolumundan arıza onarımına. Hepsi orijinal Gree parçalarıyla.',
    items: [
      // War eine Monteur-Checkliste ("delme, boru, tahliye, vakum, devreye alma").
      // Der Kunde will kein Arbeitsverzeichnis, er will ein Versprechen. Der Text
      // steht als bessere Fassung längst in ui.ts `service.montage.text` und war
      // nie in die Seite gewandert.
      { key: 'montaj', title: 'Montaj', text: 'Duvarı delmeden önce tesisatı arar, çevreyi örteriz. Fayans, boru ya da sıva zarar görürse masrafı bizden. Biz giderken klima çalışır, ortalık tertemiz.' },
      { key: 'bakim', title: 'Bakım', text: 'Klimanızın uzun ömürlü ve verimli çalışması için düzenli bakım şart.' },
      { key: 'temizlik', title: 'Temizlik', text: 'İç üniteyi, filtreleri ve su tahliyesini temizleriz. En doğru zaman: kıştan sonra, sezon başlamadan.' },
      { key: 'gaz', title: 'Gaz dolumu', text: 'Önce kaçağı buluruz, sonra doldururuz. Geçici çözüm yok.' },
      // Glossar 3: `tamir` ist das Kundenwort, `onarım` das Fachwort. Auf einer
      // Kundenkarte gehört das Kundenwort hin. Und "sürpriz fatura yok" ist in
      // diesem Markt ein echtes Vertrauenssignal — der Ablauf allein war nur ein
      // Verfahren, kein Versprechen.
      { key: 'ariza', title: 'Arıza & tamir', text: 'Önce arızayı buluruz, sonra fiyatını söyleriz, sonra tamir ederiz. Sürpriz fatura yok. Her zaman orijinal Gree parçası.' },
      { key: 'tasima', title: 'Sökme & takma', text: 'Taşınıyor musunuz? Klimanızı söker, yeni evinizde kurarız.' },
    ],
  },
  products: {
    title: 'Gree ürün ailesi',
    intro: 'Odanıza hangi cihazın uyduğunu, almadan önce net söyleriz.',
    // War: "inverter ve R32 soğutucu akışkanlıdır" — ein Datenblattsatz, und
    // "soğutucu akışkan" steht im Glossar auf der Verbotsliste. Ein Wohnungsbesitzer
    // liest daraus nichts. Jetzt steht da, was die Technik für ihn TUT.
    note: 'Tüm duvar tipi modellerde inverter var. Sessiz çalışır, daha az elektrik harcar. Klima gazı olarak yeni nesil R32 kullanılıyor.',
    lines: [
      { name: 'Duvar tipi', tag: 'Aphro · Pular · Fairy · Airy', img: '/images/p-duvar.webp' },
      { name: 'Salon tipi', tag: 'I-Shine · 24.000–48.000 BTU', img: '/images/p-salon.webp' },
      { name: 'Multi sistem', tag: 'Free Match · 5 iç üniteye kadar', img: '/images/p-multi.webp' },
      { name: 'Home tipi', tag: 'Ev tipi konfor serisi', img: '/images/p-home.webp' },
      { name: 'Isı pompası', tag: 'Versati · ısıtma + soğutma + sıcak su', img: '/images/p-isipompasi.webp' },
      { name: 'Ticari & VRF', tag: 'Kaset · kanal · GMV5 / GMV6', img: '/images/p-ticari.webp' },
      { name: 'Yedek parça', tag: 'Orijinal Gree', img: '/images/p-yedek.webp' },
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
    badge: '6 yıla varan üretici garantisi',
    intro: 'TLC Klima yetkili servis montajıyla, cihaz tipine göre garanti süresi:',
    tiers: [
      { years: '6 yıl', who: 'Duvar tipi split, multi split ve I-Shine — 31 Aralık 2026’ya kadar geçerli kampanya' },
      { years: '3 yıl', who: 'Ticari tip ve diğer salon tipi cihazlar' },
      { years: '2 yıl', who: 'Karavan ve Home serisi ürünler' },
    ],
    note: 'Tüm montaj ve işçiliğimiz yetkili servis standartlarına göre yapılır. Azami tamir süresi 20 iş günü.',
  },
  campaign: {
    eyebrow: 'Kampanya',
    taksitTitle: 'Kredi kartına taksit',
    taksitText: 'Yeni klimanızı bütçenizi zorlamadan alın. Uygun taksit seçeneklerini keşifte netleştiririz.',
    tradeTitle: 'Eski klimanızı getirin',
    tradeText: 'Eski klimanızı değerlendirip yeni cihazınızdan düşüyoruz. Şartları WhatsApp’tan öğrenin.',
    cta: 'Kampanyayı WhatsApp’tan sorun',
  },
  projects: {
    eyebrow: 'Projeler ve İşletmeler',
    title: 'Otel, site ve işletmeler için tek çözüm ortağı',
    intro: 'Bireysel dairelerden büyük projelere. Keşiften devreye almaya, tek elden ve sözleşmeli.',
    segments: [
      { name: 'Oteller' }, { name: 'Apart oteller' }, { name: 'Siteler' },
      { name: 'Restoranlar' }, { name: 'Ofisler' }, { name: 'Villalar' },
    ],
    systems: [
      { name: 'VRF sistemler', text: 'Çok sayıda iç üniteyi tek dış üniteyle yöneten, büyük binalar için verimli çözüm.' },
      { name: 'Multi split', text: 'Bir dış üniteye 5 iç üniteye kadar — daire ve küçük işletmeler için ideal.' },
      { name: 'Isı pompası', text: 'Isıtma, soğutma ve sıcak su bir arada. Versati serisiyle kışın da konfor.' },
      { name: 'Merkezi sistemler', text: 'Kaset ve kanal tipi cihazlarla toplu alanlarda dengeli iklimlendirme.' },
    ],
    steps: [
      { title: 'Ücretsiz keşif', text: 'Yerinde geliyor, ihtiyacı ve alanı ölçüyoruz.' },
      { title: 'Projelendirme', text: 'Sisteme ve bütçeye uygun çözümü planlıyoruz.' },
      { title: 'Satış', text: 'Faturalı, garantili, net teklifle.' },
      { title: 'Montaj', text: 'Uzman ekiple temiz ve zamanında kurulum.' },
      { title: 'Servis', text: 'Devreye alma sonrası bakım ve teknik destek.' },
    ],
    cta: 'Proje teklifi alın',
    ctaSub: 'Keşif ücretsiz — WhatsApp’tan yazın ya da formu doldurun.',
  },
  request: {
    eyebrow: 'Randevu / Ücretsiz Keşif',
    title: 'Size uygun günü yazın, gerisini biz halledelim',
    intro: 'Tercih ettiğiniz gün ve saati bırakın. Kesin randevuyu telefon ya da WhatsApp’tan biz onaylayalım.',
    fName: 'Adınız',
    fPhone: 'Telefon',
    fPlace: 'Semt / Mahalle',
    fPlacePh: 'Örn. Mahmutlar, Oba, Kestel…',
    fService: 'Konu',
    services: ['Klima alımı', 'Montaj', 'Bakım / Temizlik', 'Arıza / Servis', 'Proje / VRF', 'Diğer'],
    fWhen: 'Tercih ettiğiniz gün / saat',
    fNote: 'Kısa not (isteğe bağlı)',
    fNotePh: 'Oda sayısı, cihaz markası, kısa bilgi…',
    consent: 'İletişim bilgilerimin talebimi yanıtlamak için kullanılmasını kabul ediyorum.',
    submit: 'WhatsApp’tan gönder',
    hint: 'Form bilgilerinizi hazır bir WhatsApp mesajına dönüştürür — göndermeden önce görürsünüz.',
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
    dealer: 'Global Teknik Klima · Alanya Gree Klima Yetkili Bayi ve Servisi',
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
    taksit: 'Рассрочка по карте',
  },
  services: {
    title: 'Услуги',
    intro: 'От монтажа до обслуживания, от дозаправки фреоном до ремонта — только оригинальные детали Gree.',
    items: [
      { key: 'montaj', title: 'Монтаж «под ключ»', text: 'Перед сверлением находим скрытые трубы и всё укрываем. Повредим плитку, трубу или штукатурку — исправим за свой счёт. Уходим тогда, когда кондиционер работает, а в квартире чисто.' },
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
    // `фреон` ist das Kundenwort, `хладагент` das Datenblattwort (Glossar 1).
    note: 'Все настенные модели инверторные — работают тихо и экономят электричество. Фреон R32: современное поколение, более безопасное для природы.',
    lines: [
      { name: 'Настенные', tag: 'Aphro · Pular · Fairy · Airy', img: '/images/p-duvar.webp' },
      { name: 'Напольные', tag: 'I-Shine · 24 000–48 000 BTU', img: '/images/p-salon.webp' },
      { name: 'Мульти-сплит', tag: 'Free Match · до 5 блоков', img: '/images/p-multi.webp' },
      { name: 'Home-серия', tag: 'Комфорт для дома', img: '/images/p-home.webp' },
      { name: 'Тепловые насосы', tag: 'Versati · тепло + холод + ГВС', img: '/images/p-isipompasi.webp' },
      { name: 'Коммерч. и VRF', tag: 'Кассетные · канальные · GMV5 / GMV6', img: '/images/p-ticari.webp' },
      { name: 'Запчасти', tag: 'Оригинал Gree', img: '/images/p-yedek.webp' },
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
    badge: 'до 6 лет гарантии производителя',
    intro: 'При монтаже авторизованным сервисом TLC Klima срок гарантии зависит от типа устройства:',
    tiers: [
      { years: '6 лет', who: 'Настенные сплит, мульти-сплит и I-Shine — акция действует до 31 декабря 2026' },
      { years: '3 года', who: 'Коммерческие и прочие напольные модели' },
      { years: '2 года', who: 'Серии для караванов и Home' },
    ],
    note: 'Весь монтаж выполняется по стандартам авторизованного сервиса. Максимальный срок ремонта — 20 рабочих дней.',
  },
  campaign: {
    eyebrow: 'Акция',
    taksitTitle: 'Рассрочка по карте',
    taksitText: 'Новый кондиционер без удара по бюджету. Удобные варианты рассрочки обсудим на замере.',
    tradeTitle: 'Сдайте старый кондиционер',
    tradeText: 'Оценим ваш старый кондиционер и вычтем из стоимости нового. Условия — в WhatsApp.',
    cta: 'Спросить об акции в WhatsApp',
  },
  projects: {
    eyebrow: 'Проекты и бизнес',
    title: 'Один партнёр для отелей, комплексов и бизнеса',
    intro: 'От отдельной квартиры до крупного проекта. От замера до запуска — под ключ, по договору.',
    segments: [
      { name: 'Отели' }, { name: 'Апарт-отели' }, { name: 'ЖК и комплексы' },
      { name: 'Рестораны' }, { name: 'Офисы' }, { name: 'Виллы' },
    ],
    systems: [
      { name: 'Системы VRF', text: 'Один внешний блок управляет множеством внутренних — эффективно для больших зданий.' },
      { name: 'Мульти-сплит', text: 'До 5 внутренних блоков на один внешний — идеально для квартир и небольшого бизнеса.' },
      { name: 'Тепловые насосы', text: 'Отопление, охлаждение и горячая вода вместе. С серией Versati комфортно и зимой.' },
      { name: 'Центральные системы', text: 'Кассетные и канальные блоки для равномерного климата в больших помещениях.' },
    ],
    steps: [
      { title: 'Бесплатный замер', text: 'Выезжаем на место, оцениваем задачу и площадь.' },
      { title: 'Проектирование', text: 'Подбираем решение под систему и бюджет.' },
      { title: 'Продажа', text: 'С договором, гарантией и чётким предложением.' },
      { title: 'Монтаж', text: 'Опытная бригада, чисто и в срок.' },
      { title: 'Сервис', text: 'Обслуживание и техподдержка после запуска.' },
    ],
    cta: 'Запросить смету проекта',
    ctaSub: 'Замер бесплатный — напишите в WhatsApp или заполните форму.',
  },
  request: {
    eyebrow: 'Запись / Бесплатный замер',
    title: 'Напишите удобный день — остальное сделаем мы',
    intro: 'Оставьте предпочтительный день и время. Точную запись подтвердим по телефону или в WhatsApp.',
    fName: 'Ваше имя',
    fPhone: 'Телефон',
    fPlace: 'Район',
    fPlacePh: 'Напр. Махмутлар, Оба, Кестель…',
    fService: 'Тема',
    services: ['Покупка кондиционера', 'Монтаж', 'Обслуживание / Чистка', 'Ремонт / Сервис', 'Проект / VRF', 'Другое'],
    fWhen: 'Предпочтительный день / время',
    fNote: 'Короткое примечание (по желанию)',
    fNotePh: 'Число комнат, марка устройства, детали…',
    consent: 'Согласен на использование моих контактов для ответа на заявку.',
    submit: 'Отправить в WhatsApp',
    hint: 'Форма превратит данные в готовое сообщение WhatsApp — вы увидите его перед отправкой.',
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
    claim: 'Verkauf, Montage und Service aus einer Hand. Mit Rechnung und Garantie.',
    sub: 'Wir sprechen Deutsch. Montage und Wartung Ihrer Gree-Anlage. Die Besichtigung ist kostenlos.',
    ctaPrimary: 'Über WhatsApp schreiben',
    ctaSecondary: 'Kostenlose Besichtigung',
    phoneLabel: 'Anrufen',
    waLabel: 'WhatsApp',
    scroll: 'Scrollen',
  },
  trust: {
    dealer: 'Gree Vertragshändler und Servicepartner',
    rating: '5,0 von 5 · 65 Google-Bewertungen',
    lang: 'Wir sprechen Deutsch',
    faturali: 'Rechnung und Garantiepapiere',
    emergency: '7/24 technischer Dienst',
    taksit: 'Ratenzahlung per Karte',
  },
  services: {
    title: 'Leistungen',
    intro: 'Von der Montage bis zur Wartung, vom Kältemittel bis zur Reparatur. Mit Original-Gree-Teilen.',
    items: [
      { key: 'montaj', title: 'Montage', text: 'Vor dem Bohren suchen wir nach Leitungen und decken ab. Geht dabei eine Fliese, ein Rohr oder der Putz kaputt, bringen wir das auf unsere Kosten in Ordnung. Wenn wir gehen, läuft die Anlage, und die Wohnung ist sauber.' },
      { key: 'bakim', title: 'Wartung', text: 'Regelmäßige Wartung hält die Anlage effizient und langlebig.' },
      { key: 'temizlik', title: 'Reinigung', text: 'Innengerät, Filter, Kondensatwanne. Nach dem Winter, vor der Saison.' },
      { key: 'gaz', title: 'Kältemittel nachfüllen', text: 'Erst suchen wir die Leckage, dann füllen wir auf. Keine Zwischenlösung.' },
      { key: 'ariza', title: 'Störung & Reparatur', text: 'Erst die Diagnose, dann der Kostenvoranschlag, dann die Reparatur. Original-Gree-Teile.' },
      { key: 'tasima', title: 'Demontage & Umsetzen', text: 'Sie ziehen um? Wir bauen ab und in der neuen Wohnung wieder auf.' },
    ],
  },
  products: {
    title: 'Gree-Programm',
    intro: 'Welches Gerät zu Ihrem Raum passt, sagen wir klar vor dem Kauf. Keine Überraschung hinterher.',
    note: 'Alle Wandgeräte arbeiten mit Inverter. Sie laufen leise und sparen Strom. Als Kältemittel dient R32, die aktuelle und umweltschonendere Generation.',
    lines: [
      { name: 'Wandgeräte', tag: 'Aphro · Pular · Fairy · Airy', img: '/images/p-duvar.webp' },
      { name: 'Standgeräte', tag: 'I-Shine · 24.000–48.000 BTU', img: '/images/p-salon.webp' },
      { name: 'Multisplit', tag: 'Free Match · bis 5 Innengeräte', img: '/images/p-multi.webp' },
      { name: 'Home-Typ', tag: 'Komfortserie für Wohnräume', img: '/images/p-home.webp' },
      { name: 'Wärmepumpen', tag: 'Versati · Heizen + Kühlen + Warmwasser', img: '/images/p-isipompasi.webp' },
      { name: 'Gewerbe & VRF', tag: 'Kassette · Kanal · GMV5 / GMV6', img: '/images/p-ticari.webp' },
      { name: 'Ersatzteile', tag: 'Original Gree', img: '/images/p-yedek.webp' },
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
    badge: 'bis zu 6 Jahre Herstellergarantie',
    intro: 'Bei Montage durch den TLC-Vertragsservice richtet sich die Garantie nach dem Gerätetyp:',
    tiers: [
      { years: '6 Jahre', who: 'Wandgeräte Split, Multisplit und I-Shine — Aktion gültig bis 31. Dezember 2026' },
      { years: '3 Jahre', who: 'Gewerbegeräte und übrige Standgeräte' },
      { years: '2 Jahre', who: 'Wohnmobil- und Home-Serie' },
    ],
    note: 'Alle Montage- und Handwerksarbeiten erfolgen nach Vertragsservice-Standard. Maximale Reparaturdauer 20 Werktage.',
  },
  campaign: {
    eyebrow: 'Aktion',
    taksitTitle: 'Ratenzahlung per Karte',
    taksitText: 'Ihre neue Klimaanlage, ohne das Budget zu sprengen. Passende Raten klären wir bei der Besichtigung.',
    tradeTitle: 'Altgerät in Zahlung geben',
    tradeText: 'Wir bewerten Ihr altes Gerät und ziehen es vom neuen ab. Konditionen per WhatsApp.',
    cta: 'Aktion per WhatsApp erfragen',
  },
  projects: {
    eyebrow: 'Projekte und Gewerbe',
    title: 'Ein Partner für Hotels, Anlagen und Gewerbe',
    intro: 'Von der einzelnen Wohnung bis zum großen Projekt. Von der Besichtigung bis zur Inbetriebnahme — aus einer Hand, mit Vertrag.',
    segments: [
      { name: 'Hotels' }, { name: 'Aparthotels' }, { name: 'Wohnanlagen' },
      { name: 'Restaurants' }, { name: 'Büros' }, { name: 'Villen' },
    ],
    systems: [
      { name: 'VRF-Systeme', text: 'Ein Außengerät steuert viele Innengeräte — effizient für große Gebäude.' },
      { name: 'Multisplit', text: 'Bis zu 5 Innengeräte an einem Außengerät — ideal für Wohnungen und kleines Gewerbe.' },
      { name: 'Wärmepumpen', text: 'Heizen, Kühlen und Warmwasser in einem. Mit der Versati-Serie auch im Winter komfortabel.' },
      { name: 'Zentrale Systeme', text: 'Kassetten- und Kanalgeräte für ausgeglichenes Klima in großen Flächen.' },
    ],
    steps: [
      { title: 'Kostenlose Besichtigung', text: 'Wir kommen vor Ort, messen Bedarf und Fläche.' },
      { title: 'Planung', text: 'Wir planen die Lösung passend zu System und Budget.' },
      { title: 'Verkauf', text: 'Mit Rechnung, Garantie und klarem Angebot.' },
      { title: 'Montage', text: 'Erfahrenes Team, sauber und pünktlich.' },
      { title: 'Service', text: 'Wartung und technischer Support nach der Inbetriebnahme.' },
    ],
    cta: 'Projektangebot anfordern',
    ctaSub: 'Die Besichtigung ist kostenlos — per WhatsApp schreiben oder Formular ausfüllen.',
  },
  request: {
    eyebrow: 'Termin / Kostenlose Besichtigung',
    title: 'Nennen Sie Ihren Wunschtag — den Rest übernehmen wir',
    intro: 'Hinterlassen Sie Wunschtag und -zeit. Den festen Termin bestätigen wir per Telefon oder WhatsApp.',
    fName: 'Ihr Name',
    fPhone: 'Telefon',
    fPlace: 'Stadtteil',
    fPlacePh: 'z. B. Mahmutlar, Oba, Kestel…',
    fService: 'Anliegen',
    services: ['Klimakauf', 'Montage', 'Wartung / Reinigung', 'Störung / Service', 'Projekt / VRF', 'Sonstiges'],
    fWhen: 'Wunschtag / -zeit',
    fNote: 'Kurze Notiz (optional)',
    fNotePh: 'Anzahl Räume, Gerätemarke, kurze Info…',
    consent: 'Ich bin einverstanden, dass meine Kontaktdaten zur Beantwortung meiner Anfrage genutzt werden.',
    submit: 'Per WhatsApp senden',
    hint: 'Das Formular macht aus Ihren Angaben eine fertige WhatsApp-Nachricht — Sie sehen sie vor dem Senden.',
  },
  reviews: {
    title: 'Was unsere Kunden sagen',
    sub: '5,0 von 5 · 65 Google-Bewertungen.',
    items: [
      { text: 'Drei Gree-Geräte gekauft. Sie laufen so leise, dass ich manchmal denke, ich hätte sie gar nicht eingeschaltet.', name: 'Adem T.', place: 'Google' },
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
    dealer: 'Global Teknik Klima · Gree Vertragshändler und Servicepartner Alanya',
    rights: 'Alle Rechte vorbehalten.',
    legal: ['Datenschutzhinweis', 'Datenschutzerklärung', 'Cookie-Richtlinie'],
  },
}

const en: HomeContent = {
  hero: {
    eyebrow: 'Authorized Gree Dealer & Service · Alanya',
    lines: ['Air conditioning', 'in Alanya'],
    claim: 'Sales, installation and service from one hand. With invoice and warranty.',
    sub: 'We speak English. Installation and maintenance of your Gree system. The site survey is free.',
    ctaPrimary: 'Message on WhatsApp',
    ctaSecondary: 'Free site survey',
    phoneLabel: 'Call',
    waLabel: 'WhatsApp',
    scroll: 'Scroll',
  },
  trust: {
    dealer: 'Authorized Gree dealer & service',
    rating: '5.0 out of 5 · 65 Google reviews',
    lang: 'We speak English',
    faturali: 'Invoice & warranty papers',
    emergency: '7/24 technical support',
    taksit: 'Card instalments',
  },
  services: {
    title: 'Services',
    intro: 'From installation to maintenance, from refrigerant to repair. With genuine Gree parts.',
    items: [
      { key: 'montaj', title: 'Installation', text: 'Before drilling we trace what runs behind the wall and cover everything up. If a tile, a pipe or the plaster takes damage, we put it right at our own cost. We leave when the unit runs and your home is clean.' },
      { key: 'bakim', title: 'Maintenance', text: 'Regular servicing keeps the unit efficient and long-lasting.' },
      { key: 'temizlik', title: 'Cleaning', text: 'Indoor unit, filters, drain pan. After winter, before the season.' },
      { key: 'gaz', title: 'Refrigerant top-up', text: 'First we find the leak, then we refill. No stopgaps.' },
      { key: 'ariza', title: 'Fault & repair', text: 'First diagnosis, then quote, then repair. Genuine Gree parts.' },
      { key: 'tasima', title: 'Removal & relocation', text: 'Moving house? We uninstall and set it up at your new place.' },
    ],
  },
  products: {
    title: 'The Gree range',
    intro: 'Which unit fits your room. We tell you clearly, before you buy.',
    note: 'All wall units run on inverter technology: quiet, and easier on the electricity bill. The refrigerant is R32, the current and more environmentally friendly generation.',
    lines: [
      { name: 'Wall-mounted', tag: 'Aphro · Pular · Fairy · Airy', img: '/images/p-duvar.webp' },
      { name: 'Floor standing', tag: 'I-Shine · 24,000–48,000 BTU', img: '/images/p-salon.webp' },
      { name: 'Multi-split', tag: 'Free Match · up to 5 units', img: '/images/p-multi.webp' },
      { name: 'Home type', tag: 'Home comfort range', img: '/images/p-home.webp' },
      { name: 'Heat pumps', tag: 'Versati · heating + cooling + hot water', img: '/images/p-isipompasi.webp' },
      { name: 'Commercial & VRF', tag: 'Cassette · ducted · GMV5 / GMV6', img: '/images/p-ticari.webp' },
      { name: 'Spare parts', tag: 'Genuine Gree', img: '/images/p-yedek.webp' },
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
    badge: 'up to 6-year manufacturer warranty',
    intro: 'Installed by the TLC authorized service, the warranty depends on the unit type:',
    tiers: [
      { years: '6 years', who: 'Wall split, multi-split and I-Shine — campaign valid until 31 December 2026' },
      { years: '3 years', who: 'Commercial and other floor-standing units' },
      { years: '2 years', who: 'Caravan and Home series' },
    ],
    note: 'All installation and workmanship follows authorized-service standards. Maximum repair time 20 working days.',
  },
  campaign: {
    eyebrow: 'Offer',
    taksitTitle: 'Card instalments',
    taksitText: 'Your new air conditioner without straining the budget. We settle the instalment options at the survey.',
    tradeTitle: 'Trade in your old unit',
    tradeText: 'We value your old air conditioner and take it off the new one. Terms on WhatsApp.',
    cta: 'Ask about the offer on WhatsApp',
  },
  projects: {
    eyebrow: 'Projects & Business',
    title: 'One partner for hotels, complexes and business',
    intro: 'From a single flat to a large project. From survey to commissioning — turnkey, under contract.',
    segments: [
      { name: 'Hotels' }, { name: 'Apart-hotels' }, { name: 'Residences' },
      { name: 'Restaurants' }, { name: 'Offices' }, { name: 'Villas' },
    ],
    systems: [
      { name: 'VRF systems', text: 'One outdoor unit drives many indoor units — efficient for large buildings.' },
      { name: 'Multi-split', text: 'Up to 5 indoor units on one outdoor unit — ideal for flats and small business.' },
      { name: 'Heat pumps', text: 'Heating, cooling and hot water in one. The Versati range keeps you comfortable in winter too.' },
      { name: 'Central systems', text: 'Cassette and ducted units for balanced climate across large spaces.' },
    ],
    steps: [
      { title: 'Free survey', text: 'We come on site and measure the need and the space.' },
      { title: 'Design', text: 'We plan the solution to fit the system and the budget.' },
      { title: 'Sale', text: 'With invoice, warranty and a clear quote.' },
      { title: 'Installation', text: 'Experienced team, clean and on time.' },
      { title: 'Service', text: 'Maintenance and technical support after commissioning.' },
    ],
    cta: 'Request a project quote',
    ctaSub: 'The survey is free — message on WhatsApp or fill in the form.',
  },
  request: {
    eyebrow: 'Appointment / Free Survey',
    title: 'Tell us your preferred day — we handle the rest',
    intro: 'Leave your preferred day and time. We confirm the firm appointment by phone or WhatsApp.',
    fName: 'Your name',
    fPhone: 'Phone',
    fPlace: 'District',
    fPlacePh: 'e.g. Mahmutlar, Oba, Kestel…',
    fService: 'Topic',
    services: ['Buying a unit', 'Installation', 'Maintenance / Cleaning', 'Fault / Service', 'Project / VRF', 'Other'],
    fWhen: 'Preferred day / time',
    fNote: 'Short note (optional)',
    fNotePh: 'Number of rooms, unit brand, brief info…',
    consent: 'I agree that my contact details may be used to answer my request.',
    submit: 'Send on WhatsApp',
    hint: 'The form turns your details into a ready WhatsApp message — you see it before sending.',
  },
  reviews: {
    title: 'What our customers say',
    sub: '5.0 out of 5 · 65 Google reviews.',
    items: [
      { text: 'Bought three Gree units. They run so quietly I sometimes wonder if I even switched them on.', name: 'Adem T.', place: 'Google' },
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
    dealer: 'Global Teknik Klima · Authorized Gree Dealer & Service, Alanya',
    rights: 'All rights reserved.',
    legal: ['KVKK notice', 'Privacy policy', 'Cookie policy'],
  },
}

export const content: Record<Locale, HomeContent> = { tr, ru, de, en }

// Navigation (Anker) — die Original-Seite hatte ein Menü; hier als Ein-Seiten-Anker.
export const nav: Record<Locale, { services: string; products: string; projects: string; tech: string; calc: string; request: string; contact: string }> = {
  tr: { services: 'Hizmetler', products: 'Ürünler', projects: 'Projeler', tech: 'Teknik', calc: 'BTU Hesapla', request: 'Randevu', contact: 'İletişim' },
  ru: { services: 'Услуги', products: 'Товары', projects: 'Проекты', tech: 'Техника', calc: 'Расчёт BTU', request: 'Запись', contact: 'Контакты' },
  de: { services: 'Leistungen', products: 'Produkte', projects: 'Projekte', tech: 'Technik', calc: 'BTU-Rechner', request: 'Termin', contact: 'Kontakt' },
  en: { services: 'Services', products: 'Products', projects: 'Projects', tech: 'Technology', calc: 'BTU', request: 'Appointment', contact: 'Contact' },
}

// Mission / Hakkımızda — Inhalt der Original-Über-uns-Seite, lokalisiert.
// Die Fehlversion der Altseite sagte "Konya'da" — hier korrekt "Alanya".
export const mission: Record<Locale, { title: string; text: string }> = {
  tr: {
    title: 'Hakkımızda',
    text: 'Alanya Gree Klima Yetkili Bayi ve Servisi olarak müşterilerimize kaliteli, güvenilir ve hızlı hizmet sunuyoruz. Gree teknolojisini en verimli şekilde kullanarak iklimlendirme çözümlerinde maksimum memnuniyet sağlamayı ve Alanya’da sektörün lider firmalarından biri olmayı hedefliyoruz.',
  },
  ru: {
    title: 'О нас',
    text: 'Как официальный дилер и сервис Gree в Алании, мы предлагаем качественный, надёжный и быстрый сервис. Максимально эффективно используя технологии Gree, стремимся к полному удовлетворению клиентов и к тому, чтобы быть одной из ведущих фирм отрасли в Алании.',
  },
  de: {
    title: 'Über uns',
    text: 'Als autorisierter Gree-Händler und Servicepartner in Alanya bieten wir hochwertigen, zuverlässigen und schnellen Service. Wir nutzen die Gree-Technologie bestmöglich, um maximale Zufriedenheit zu erreichen, und zu den führenden Klimatechnik-Betrieben in Alanya zu gehören.',
  },
  en: {
    title: 'About us',
    text: 'As an authorized Gree dealer and service partner in Alanya, we deliver quality, reliable and fast service. Using Gree technology to its fullest, we aim for maximum customer satisfaction, and to be one of the leading climate-technology firms in Alanya.',
  },
}

// ── Phase A: Explosionszeichnung ──────────────────────────────────────────────
// Eine SCHEMATISCHE Darstellung (kein Produktfoto). Sie zeigt, was in einem
// Wandgerät steckt — und dass wir es warten können. Ehrlich: Illustration, keine
// Behauptung über ein konkretes Modell.
export interface Exploded {
  title: string
  intro: string
  hint: string
  parts: { name: string; text: string }[]
}
export const exploded: Record<Locale, Exploded> = {
  tr: {
    title: 'Klimanızın içinde ne var?',
    intro: 'Kaydırın. Duvar tipi bir klima parçalarına ayrılsın. Baktığımız, temizlediğimiz ve gerektiğinde değiştirdiğimiz parçalar bunlar.',
    hint: 'Şematik gösterimdir.',
    parts: [
      { name: 'Ön panel', text: 'Açılır kapak. Filtrelere buradan ulaşılır.' },
      { name: 'Filtre', text: 'Toz ve poleni tutar. Bakımda temizlediğimiz ilk parça.' },
      // "Eşanjör" und "çapraz akışlı" sind Werkstattwörter. Das Kapitel erklärt dem
      // Wohnungsbesitzer sein Gerät — also benennen wir die Teile so, wie er sie
      // benennen würde, und sagen, was sie tun.
      { name: 'Soğutma peteği', text: 'Havayı soğutan bakır borular ve ince alüminyum kanatlar. Tozlanınca verim düşer.' },
      { name: 'Fan', text: 'Bir silindir gibi döner, soğuyan havayı odaya üfler. Sessiz çalışmanın sırrı burada.' },
      { name: 'Gövde ve montaj plakası', text: 'Duvara sabitlenen taşıyıcı. Doğru montajın temeli.' },
    ],
  },
  ru: {
    title: 'Что внутри кондиционера?',
    intro: 'Листайте — настенный блок разбирается на части. Именно их мы обслуживаем, чистим и при необходимости меняем.',
    hint: 'Схематичное изображение.',
    parts: [
      { name: 'Передняя панель', text: 'Откидная крышка. Через неё добираются до фильтров.' },
      { name: 'Фильтр', text: 'Задерживает пыль и пыльцу. Первое, что мы чистим при ТО.' },
      { name: 'Теплообменник', text: 'Медные трубки с тонкими алюминиевыми рёбрами — здесь воздух охлаждается. Забьётся пылью — упадёт мощность.' },
      { name: 'Вентилятор', text: 'Вращается как валик и подаёт охлаждённый воздух в комнату. Отсюда и тихая работа.' },
      { name: 'Корпус и монтажная плита', text: 'Несущая пластина на стене. Основа правильного монтажа.' },
    ],
  },
  de: {
    title: 'Was steckt in Ihrer Klimaanlage?',
    intro: 'Scrollen Sie. Ein Wandgerät zerlegt sich in seine Teile. Genau diese warten, reinigen und tauschen wir.',
    hint: 'Schematische Darstellung.',
    parts: [
      { name: 'Frontblende', text: 'Aufklappbare Abdeckung. Der Weg zu den Filtern.' },
      { name: 'Filter', text: 'Hält Staub und Pollen zurück. Das Erste, was wir bei der Wartung reinigen.' },
      { name: 'Wärmetauscher', text: 'Kupferrohre mit feinen Aluminiumlamellen. Hier wird die Luft gekühlt. Verstauben sie, sinkt die Leistung.' },
      { name: 'Lüfter', text: 'Eine Walze, die sich dreht und die gekühlte Luft in den Raum bläst. Hier entsteht der leise Lauf.' },
      { name: 'Gehäuse und Montageplatte', text: 'Der Träger an der Wand. Die Grundlage jeder sauberen Montage.' },
    ],
  },
  en: {
    title: 'What is inside your air conditioner?',
    intro: 'Scroll. A wall unit takes itself apart. These are exactly the parts we service, clean and replace.',
    hint: 'Schematic illustration.',
    parts: [
      { name: 'Front panel', text: 'The hinged cover. The way to the filters.' },
      { name: 'Filter', text: 'Catches dust and pollen. The first thing we clean at a service.' },
      { name: 'Heat exchanger', text: 'Copper tubes with fine aluminium fins. This is where the air gets cold. Let them clog with dust and the performance drops.' },
      { name: 'Fan', text: 'A roller that spins and pushes the cooled air into the room. This is where the quiet running comes from.' },
      { name: 'Housing and mounting plate', text: 'The carrier on the wall. The basis of every clean installation.' },
    ],
  },
}

// ── Phase A: Vorher-Nachher-Regler ────────────────────────────────────────────
// ⛔ Der Betrieb hat KEINE öffentlichen Montagefotos. Bis echte Referenzbilder
//    vorliegen, zeigt der Regler eine als solche gekennzeichnete Illustration der
//    Wirkung (Hitze → Kühle) — keine Behauptung über eine konkrete Montage.
//    Sobald echte Vorher/Nachher-Montagefotos da sind: Bilder tauschen, Label weg.
export interface BeforeAfter {
  title: string
  intro: string
  before: string
  after: string
  example: string
  drag: string
}
export const beforeAfter: Record<Locale, BeforeAfter> = {
  tr: {
    title: 'Sıcaktan serinliğe',
    intro: 'Kolu sürükleyin. Alanya sıcağı ile serinletilmiş bir oda arasındaki farkı görün.',
    before: 'Öncesi · 34°C',
    after: 'Sonrası · 22°C',
    example: 'Örnek görsel',
    drag: 'Sürükleyin',
  },
  ru: {
    title: 'От жары к прохладе',
    intro: 'Потяните ползунок. Разница между жарой Алании и охлаждённой комнатой.',
    before: 'До · 34°C',
    after: 'После · 22°C',
    example: 'Иллюстрация',
    drag: 'Потяните',
  },
  de: {
    title: 'Von der Hitze zur Kühle',
    intro: 'Ziehen Sie den Regler. Der Unterschied zwischen Alanyas Hitze und einem gekühlten Raum.',
    before: 'Vorher · 34 °C',
    after: 'Nachher · 22 °C',
    example: 'Beispielbild',
    drag: 'Ziehen',
  },
  en: {
    title: 'From heat to cool',
    intro: 'Drag the handle. The difference between Alanya’s heat and a cooled room.',
    before: 'Before · 34°C',
    after: 'After · 22°C',
    example: 'Illustration',
    drag: 'Drag',
  },
}

// Öffentliche, invariante Daten — von der Live-Startseite. Die Konya-Nummer fehlt bewusst.
export const biz = {
  // Gründungsjahr — vom Kunden bestätigt (Antwort Frage 1, 05.08.2026): „2021
  // yılından beri". Vorher bewusst leer, weil unbelegt; jetzt belegt und im Schema.
  founded: 2021,
  phone: '+90 242 513 86 51',
  whatsapp: '+90 533 046 13 87',
  address: 'Hacet Mah., Alaiye Cad. No: 17/A, Alanya / Antalya',
  geo: [36.5509274, 32.0081833] as const,
  ratingValue: '5,0',
  ratingCount: 65,
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=36.5509274,32.0081833',
  /**
   * 'embed'   — die Karte lädt sofort. Für die DEMO: der Interessent hat ausdrücklich
   *             verlangt, dass die Karte zu sehen ist, und es werden keine echten
   *             Kundendaten verarbeitet.
   * 'consent' — die Karte lädt erst auf Klick. Das ist der Stand für den LIVEGANG:
   *             ein Google-iframe verbindet den Browser des Besuchers mit Google und
   *             ist damit eine Übermittlung ins Ausland (KVKK Art. 9). Ein Wort hier
   *             umstellen, und der Rechtstext stimmt wieder — er sagt bereits, dass
   *             die Karte erst nach Zustimmung lädt.
   */
  mapMode: 'embed' as 'embed' | 'consent',
  // Exakte Karten-Einbettung von der Original-Seite (sein echter Google-Place-Eintrag).
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3205.132111032381!2d32.0081833!3d36.5509274!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14dc99ada3ddac53%3A0xa9a1e8359935df5a!2sAlanya%20Global%20Teknik%20-%20Gree%20klima%20alanya!5e0!3m2!1str!2str!4v1751437954026!5m2!1str!2str',
  // Echte Profile (die Altseite hatte tote Links auf die Plattform-Startseiten).
  facebook: 'https://www.facebook.com/alanyaglobalteknik',
  instagram: 'https://www.instagram.com/alanyaglobalteknik/',
} as const
