import type { Locale } from '../i18n/utils'

/**
 * Die drei Rechtstexte. Bis jetzt standen sie nur als WÖRTER in der Fußzeile —
 * ohne Seiten dahinter. Das ist die Lücke L7 aus docs/04-anforderungen.md.
 *
 * ⛔ ENTWURF. Diese Texte sind fachlich aus docs/03-recht.md abgeleitet, aber
 *    NICHT juristisch geprüft. Vor einem echten Livegang:
 *      1. die ⟨Platzhalter⟩ füllen (Ticaret unvanı, Mersis, Adres, E-Posta),
 *      2. von einem türkischen Anwalt prüfen lassen,
 *      3. den Entwurfs-Hinweis (`draft`) entfernen.
 *    Der Hinweis steht bewusst SICHTBAR auf der Demo-Seite. Er entwertet sie
 *    nicht — er ist Teil desselben Versprechens wie überall sonst: wir behaupten
 *    nichts, was nicht belegt ist.
 *
 * Grundlage: KVKK Nr. 6698 (Art. 5 Rechtsgrundlagen, Art. 9 Auslandsübermittlung
 * i. d. F. des Gesetzes 7499, Art. 11 Betroffenenrechte, Art. 12 Sicherheit) und
 * das Tebliğ über die Antragstellung beim Verantwortlichen.
 */

export const LEGAL_SLUGS = ['kvkk', 'gizlilik', 'cerez'] as const
export type LegalSlug = (typeof LEGAL_SLUGS)[number]

export interface LegalDoc {
  title: string
  updated: string
  draft: string
  blocks: { h: string; p: string[] }[]
}

/** Was der Betrieb vor dem Livegang eintragen muss. */
export const LEGAL_PLACEHOLDER = '⟨vom Betrieb zu ergänzen⟩'

const P = LEGAL_PLACEHOLDER

// ---------------------------------------------------------------- Türkisch

const tr: Record<LegalSlug, LegalDoc> = {
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    updated: 'Son güncelleme: Temmuz 2026',
    draft: 'Bu metin bir taslaktır. Yayına alınmadan önce hukuki incelemeden geçirilecektir.',
    blocks: [
      {
        h: 'Veri sorumlusu',
        p: [
          `6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca veri sorumlusu: Alanya Global Teknik (ticaret unvanı: ${P}, Mersis: ${P}).`,
          'Adres: Hacet Mah., Alaiye Cad. No: 17/A, Alanya / Antalya. Telefon: +90 242 513 86 51.',
        ],
      },
      {
        h: 'Hangi verileri işliyoruz',
        p: [
          'Bize telefon veya WhatsApp ile ulaştığınızda: adınız, telefon numaranız ve bize ilettiğiniz talebin içeriği.',
          'Sitemizi ziyaret ettiğinizde: sunucu kayıtları kapsamında IP adresiniz, tarih ve saat, çağrılan sayfa. IP adresi kişisel veridir.',
          'Site üzerindeki asistanla yazıştığınızda: yazdığınız mesajın metni. Asistan sizden kimlik bilgisi istemez ve fiyat taahhüdünde bulunmaz.',
          'Bu sitede Google Analytics, Facebook pikseli veya benzeri bir izleme aracı bulunmamaktadır. Yazı tipleri kendi sunucumuzdadır.',
        ],
      },
      {
        h: 'İşleme amacı ve hukuki sebep',
        p: [
          'Talebinizi yanıtlamak, keşif ve montaj randevusu oluşturmak, servis ve garanti süreçlerini yürütmek (KVKK m. 5/2-c ve 5/2-f).',
          'Sunucu kayıtları güvenlik ve hukuki yükümlülükler için tutulur (KVKK m. 5/2-ç).',
        ],
      },
      {
        h: 'Yurt dışına aktarım',
        p: [
          `Hedefimiz, verilerin Türkiye'de kalmasıdır: site ve asistan Türkiye'de barındırılacaktır. Bu durumda KVKK m. 9 kapsamında bir yurt dışı aktarımı söz konusu olmaz.`,
          'Sitedeki Google harita gösterimi, siz tıklayarak onaylamadıkça yüklenmez. Yüklemeyi seçerseniz, tarayıcınız doğrudan Google ile bağlantı kurar.',
        ],
      },
      {
        h: 'Saklama süresi',
        p: [
          `Talebinize ilişkin veriler, ilgili iş ilişkisi ve yasal saklama süreleri boyunca saklanır; sonrasında silinir veya anonim hâle getirilir. Sunucu kayıtları en fazla ${P} süreyle tutulur.`,
        ],
      },
      {
        h: 'Haklarınız (KVKK m. 11)',
        p: [
          'Kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, işlenme amacını öğrenme, düzeltilmesini, silinmesini veya yok edilmesini isteme, işlemenin sınırlandırılmasını isteme ve zararınızın giderilmesini talep etme hakkına sahipsiniz.',
          `Başvurularınızı, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun olarak yazılı biçimde veya ${P} adresine iletebilirsiniz. Başvurunuz en geç 30 gün içinde sonuçlandırılır.`,
        ],
      },
    ],
  },

  gizlilik: {
    title: 'Gizlilik Politikası',
    updated: 'Son güncelleme: Temmuz 2026',
    draft: 'Bu metin bir taslaktır. Yayına alınmadan önce hukuki incelemeden geçirilecektir.',
    blocks: [
      {
        h: 'İlkemiz',
        p: [
          'Sizden yalnızca talebinizi yerine getirmek için gereken bilgiyi isteriz. Fazlasını istemeyiz, fazlasını saklamayız.',
          'Kişisel verilerinizi satmayız, pazarlama amacıyla üçüncü kişilerle paylaşmayız.',
        ],
      },
      {
        h: 'Site üzerindeki asistan',
        p: [
          'Sitedeki asistan bir yapay zekâ uygulamasıdır; bu, sohbet penceresinin üstünde açıkça belirtilir.',
          'Asistan fiyat taahhüdünde bulunmaz ve randevu kesinleştirmez. Bir insanla görüşmek istediğinizde sizi WhatsApp üzerinden yetkili bir kişiye yönlendirir.',
          'Yazdığınız mesajlar yalnızca yanıtın oluşturulması için işlenir.',
        ],
      },
      {
        h: 'WhatsApp ve telefon',
        p: [
          'WhatsApp butonuna bastığınızda görüşme WhatsApp üzerinden yürür ve WhatsApp kendi koşullarına tabidir. Bize ilettiğiniz bilgiler, talebinizin görüşülmesi için kullanılır.',
        ],
      },
      {
        h: 'Güvenlik',
        p: [
          'Bağlantı şifrelidir (HTTPS). Erişim yetkileri sınırlıdır. Teknik ve idari tedbirler KVKK m. 12 kapsamında alınır.',
        ],
      },
    ],
  },

  cerez: {
    title: 'Çerez Politikası',
    updated: 'Son güncelleme: Temmuz 2026',
    draft: 'Bu metin bir taslaktır. Yayına alınmadan önce hukuki incelemeden geçirilecektir.',
    blocks: [
      {
        h: 'Kısa cevap',
        p: [
          'Bu site kendi çerezini kullanmaz. Sizi tanımak, takip etmek veya profillemek için çerez yerleştirmiyoruz.',
          'Reklam çerezi, izleme pikseli veya analitik aracı bulunmamaktadır.',
        ],
      },
      {
        h: 'Harita',
        p: [
          'Google harita gösterimi, siz onaylayana kadar yüklenmez. Onayladığınızda Google çerez yerleştirebilir; bu, Google tarafından yapılır ve Google’ın koşullarına tabidir.',
          'Haritayı yüklemeden de adresimize ulaşabilirsiniz; adres ve telefon numarası sayfada açıkça yazılıdır.',
        ],
      },
      {
        h: 'Yazı tipleri',
        p: [
          'Yazı tipleri kendi sunucumuzdan gelir; Google Fonts kullanılmaz. Böylece tarayıcınız yazı tipi için yurt dışındaki bir sunucuya bağlanmak zorunda kalmaz.',
        ],
      },
    ],
  },
}

// ---------------------------------------------------------------- Russisch

const ru: Record<LegalSlug, LegalDoc> = {
  kvkk: {
    title: 'Уведомление по закону KVKK',
    updated: 'Обновлено: июль 2026',
    draft: 'Это черновик. Перед публикацией текст пройдёт юридическую проверку.',
    blocks: [
      {
        h: 'Оператор данных',
        p: [
          `Согласно закону Турции № 6698 (KVKK) оператором данных является Alanya Global Teknik (юр. наименование: ${P}, Mersis: ${P}).`,
          'Адрес: Hacet Mah., Alaiye Cad. No: 17/A, Аланья / Анталья. Телефон: +90 242 513 86 51.',
        ],
      },
      {
        h: 'Какие данные мы обрабатываем',
        p: [
          'Если вы пишете или звоните: имя, номер телефона и содержание вашего запроса.',
          'При посещении сайта: IP-адрес, дата и время, запрошенная страница — в серверных журналах. IP-адрес считается персональными данными.',
          'При обращении к ассистенту на сайте: текст вашего сообщения. Ассистент не запрашивает документы и не называет цен.',
          'На сайте нет Google Analytics, пикселя Facebook и других систем слежения. Шрифты размещены на нашем сервере.',
        ],
      },
      {
        h: 'Цель и правовое основание',
        p: [
          'Ответ на ваш запрос, запись на бесплатный замер и монтаж, гарантийное обслуживание (ст. 5/2-c и 5/2-f KVKK).',
          'Серверные журналы ведутся для безопасности и выполнения правовых обязанностей (ст. 5/2-ç KVKK).',
        ],
      },
      {
        h: 'Передача за рубеж',
        p: [
          'Наша цель — чтобы данные оставались в Турции: сайт и ассистент будут размещены на турецком хостинге. Тогда вопрос о трансграничной передаче (ст. 9 KVKK) не возникает.',
          'Карта Google не загружается, пока вы сами её не включите.',
        ],
      },
      {
        h: 'Ваши права (ст. 11 KVKK)',
        p: [
          'Вы вправе узнать, обрабатываются ли ваши данные, получить информацию, потребовать исправления, удаления или уничтожения данных, ограничить обработку и потребовать возмещения ущерба.',
          `Обращение подаётся письменно или на адрес ${P}. Ответ даётся не позднее 30 дней.`,
        ],
      },
    ],
  },
  gizlilik: {
    title: 'Политика конфиденциальности',
    updated: 'Обновлено: июль 2026',
    draft: 'Это черновик. Перед публикацией текст пройдёт юридическую проверку.',
    blocks: [
      {
        h: 'Наш принцип',
        p: [
          'Мы просим только то, что нужно для выполнения вашего запроса. Ничего сверх этого.',
          'Мы не продаём ваши данные и не передаём их третьим лицам в рекламных целях.',
        ],
      },
      {
        h: 'Ассистент на сайте',
        p: [
          'Ассистент — это искусственный интеллект. Это прямо указано над окном чата.',
          'Ассистент не называет цен и не подтверждает записи. Если вы хотите говорить с человеком, он переводит вас в WhatsApp.',
          'Ваши сообщения обрабатываются только для формирования ответа.',
        ],
      },
      {
        h: 'WhatsApp и телефон',
        p: [
          'При нажатии на кнопку WhatsApp разговор идёт через WhatsApp и подчиняется его условиям.',
        ],
      },
      {
        h: 'Безопасность',
        p: ['Соединение зашифровано (HTTPS). Доступ ограничен. Меры принимаются согласно ст. 12 KVKK.'],
      },
    ],
  },
  cerez: {
    title: 'Политика cookie',
    updated: 'Обновлено: июль 2026',
    draft: 'Это черновик. Перед публикацией текст пройдёт юридическую проверку.',
    blocks: [
      {
        h: 'Коротко',
        p: [
          'Сайт не использует собственных cookie. Мы не отслеживаем вас и не строим профилей.',
          'Рекламных cookie, пикселей и аналитики здесь нет.',
        ],
      },
      {
        h: 'Карта',
        p: [
          'Карта Google загружается только после вашего согласия. После этого Google может установить cookie — это делает Google, по своим условиям.',
          'Адрес и телефон указаны на странице открыто, карту загружать не обязательно.',
        ],
      },
      {
        h: 'Шрифты',
        p: ['Шрифты загружаются с нашего сервера, а не из Google Fonts.'],
      },
    ],
  },
}

// ---------------------------------------------------------------- Deutsch

const de: Record<LegalSlug, LegalDoc> = {
  kvkk: {
    title: 'Datenschutzhinweis (KVKK)',
    updated: 'Stand: Juli 2026',
    draft: 'Dies ist ein Entwurf. Vor der Veröffentlichung wird der Text juristisch geprüft.',
    blocks: [
      {
        h: 'Verantwortlicher',
        p: [
          `Der Betrieb sitzt in der Türkei. Es gilt das türkische Datenschutzgesetz KVKK Nr. 6698 — nicht die DSGVO. Verantwortlicher: Alanya Global Teknik (Firmierung: ${P}, Mersis: ${P}).`,
          'Anschrift: Hacet Mah., Alaiye Cad. No: 17/A, Alanya / Antalya. Telefon: +90 242 513 86 51.',
        ],
      },
      {
        h: 'Welche Daten wir verarbeiten',
        p: [
          'Wenn Sie uns anrufen oder über WhatsApp schreiben: Name, Telefonnummer und der Inhalt Ihrer Anfrage.',
          'Beim Besuch der Website: IP-Adresse, Datum, Uhrzeit und aufgerufene Seite in den Serverprotokollen. Die IP-Adresse ist ein personenbezogenes Datum.',
          'Bei Nutzung des Assistenten: der Text Ihrer Nachricht. Der Assistent fragt keine Ausweisdaten ab und nennt keine Preise.',
          'Es gibt kein Google Analytics, kein Facebook-Pixel, kein Tracking. Die Schriften liegen auf unserem eigenen Server.',
        ],
      },
      {
        h: 'Zweck und Rechtsgrundlage',
        p: [
          'Beantwortung Ihrer Anfrage, Terminvereinbarung für die kostenlose Besichtigung und die Montage, Abwicklung von Service und Garantie (KVKK Art. 5/2-c und 5/2-f).',
          'Serverprotokolle zur Sicherheit und zur Erfüllung gesetzlicher Pflichten (KVKK Art. 5/2-ç).',
        ],
      },
      {
        h: 'Übermittlung ins Ausland',
        p: [
          'Unser Ziel ist, dass die Daten in der Türkei bleiben: Website und Assistent werden in der Türkei gehostet. Dann stellt sich die Frage der Auslandsübermittlung nach KVKK Art. 9 gar nicht erst.',
          'Die Google-Karte wird erst geladen, wenn Sie das ausdrücklich anklicken. Erst dann verbindet sich Ihr Browser mit Google.',
        ],
      },
      {
        h: 'Ihre Rechte (KVKK Art. 11)',
        p: [
          'Sie haben das Recht zu erfahren, ob Daten über Sie verarbeitet werden, Auskunft zu verlangen, Berichtigung, Löschung oder Vernichtung zu verlangen, die Verarbeitung einschränken zu lassen und Ersatz eines entstandenen Schadens zu fordern.',
          `Ihr Antrag ist schriftlich oder an ${P} zu richten und wird innerhalb von 30 Tagen beantwortet.`,
        ],
      },
    ],
  },
  gizlilik: {
    title: 'Datenschutzerklärung',
    updated: 'Stand: Juli 2026',
    draft: 'Dies ist ein Entwurf. Vor der Veröffentlichung wird der Text juristisch geprüft.',
    blocks: [
      {
        h: 'Unser Grundsatz',
        p: [
          'Wir fragen nur, was wir brauchen, um Ihre Anfrage zu beantworten. Nichts darüber hinaus.',
          'Wir verkaufen keine Daten und geben sie nicht zu Werbezwecken an Dritte.',
        ],
      },
      {
        h: 'Der Assistent auf dieser Seite',
        p: [
          'Der Assistent ist eine künstliche Intelligenz. Das steht offen über dem Chatfenster.',
          'Er nennt keine Preise und sagt keine Termine verbindlich zu. Möchten Sie mit einem Menschen sprechen, übergibt er an WhatsApp.',
          'Ihre Nachrichten werden nur zur Erzeugung der Antwort verarbeitet.',
        ],
      },
      {
        h: 'WhatsApp und Telefon',
        p: [
          'Wenn Sie den WhatsApp-Knopf drücken, läuft das Gespräch über WhatsApp und unterliegt dessen Bedingungen.',
        ],
      },
      {
        h: 'Sicherheit',
        p: ['Die Verbindung ist verschlüsselt (HTTPS). Zugriffe sind beschränkt. Maßnahmen nach KVKK Art. 12.'],
      },
    ],
  },
  cerez: {
    title: 'Cookie-Richtlinie',
    updated: 'Stand: Juli 2026',
    draft: 'Dies ist ein Entwurf. Vor der Veröffentlichung wird der Text juristisch geprüft.',
    blocks: [
      {
        h: 'Die kurze Antwort',
        p: [
          'Diese Seite setzt keine eigenen Cookies. Wir erkennen Sie nicht wieder, verfolgen Sie nicht und legen kein Profil an.',
          'Es gibt keine Werbe-Cookies, keine Zählpixel, keine Analyse-Werkzeuge.',
        ],
      },
      {
        h: 'Die Karte',
        p: [
          'Die Google-Karte lädt erst, wenn Sie zustimmen. Danach kann Google Cookies setzen — das tut Google, nach seinen Bedingungen.',
          'Sie finden uns auch ohne Karte: Adresse und Telefonnummer stehen offen auf der Seite.',
        ],
      },
      {
        h: 'Schriften',
        p: ['Die Schriften kommen von unserem eigenen Server, nicht von Google Fonts.'],
      },
    ],
  },
}

// ---------------------------------------------------------------- Englisch

const en: Record<LegalSlug, LegalDoc> = {
  kvkk: {
    title: 'KVKK Privacy Notice',
    updated: 'Last updated: July 2026',
    draft: 'This is a draft. It will be reviewed by a lawyer before going live.',
    blocks: [
      {
        h: 'Data controller',
        p: [
          `The business is located in Türkiye. Turkish data protection law KVKK No. 6698 applies — not the GDPR. Controller: Alanya Global Teknik (registered name: ${P}, Mersis: ${P}).`,
          'Address: Hacet Mah., Alaiye Cad. No: 17/A, Alanya / Antalya. Phone: +90 242 513 86 51.',
        ],
      },
      {
        h: 'What we process',
        p: [
          'When you call or message us: your name, phone number and the content of your request.',
          'When you visit the site: IP address, date, time and page requested, in server logs. An IP address is personal data.',
          'When you use the assistant: the text of your message. The assistant asks for no identity documents and quotes no prices.',
          'There is no Google Analytics, no Facebook pixel, no tracking. Fonts are served from our own server.',
        ],
      },
      {
        h: 'Purpose and legal basis',
        p: [
          'Answering your request, arranging the free survey and the installation, handling service and warranty (KVKK Art. 5/2-c and 5/2-f).',
          'Server logs for security and legal obligations (KVKK Art. 5/2-ç).',
        ],
      },
      {
        h: 'Transfer abroad',
        p: [
          'Our aim is that data stays in Türkiye: the site and the assistant will be hosted in Türkiye. Then the question of cross-border transfer under KVKK Art. 9 does not arise at all.',
          'The Google map does not load until you explicitly click to load it.',
        ],
      },
      {
        h: 'Your rights (KVKK Art. 11)',
        p: [
          'You may ask whether your data is processed, request information, request correction, deletion or destruction, request restriction, and claim compensation for damage.',
          `Requests go in writing or to ${P} and are answered within 30 days.`,
        ],
      },
    ],
  },
  gizlilik: {
    title: 'Privacy Policy',
    updated: 'Last updated: July 2026',
    draft: 'This is a draft. It will be reviewed by a lawyer before going live.',
    blocks: [
      {
        h: 'Our principle',
        p: [
          'We ask only for what we need to answer your request. Nothing beyond that.',
          'We do not sell your data and do not pass it to third parties for advertising.',
        ],
      },
      {
        h: 'The assistant on this site',
        p: [
          'The assistant is an artificial intelligence. This is stated openly above the chat window.',
          'It quotes no prices and confirms no appointments. If you want a human, it hands over to WhatsApp.',
          'Your messages are processed only to produce the answer.',
        ],
      },
      {
        h: 'WhatsApp and phone',
        p: ['When you press the WhatsApp button, the conversation runs through WhatsApp under its own terms.'],
      },
      {
        h: 'Security',
        p: ['The connection is encrypted (HTTPS). Access is restricted. Measures per KVKK Art. 12.'],
      },
    ],
  },
  cerez: {
    title: 'Cookie Policy',
    updated: 'Last updated: July 2026',
    draft: 'This is a draft. It will be reviewed by a lawyer before going live.',
    blocks: [
      {
        h: 'The short answer',
        p: [
          'This site sets no cookies of its own. We do not recognise you, track you or build a profile.',
          'There are no advertising cookies, no counting pixels, no analytics tools.',
        ],
      },
      {
        h: 'The map',
        p: [
          'The Google map loads only after you agree. Google may then set cookies — that is Google, under its own terms.',
          'You can find us without the map: the address and phone number are stated openly on the page.',
        ],
      },
      {
        h: 'Fonts',
        p: ['Fonts come from our own server, not from Google Fonts.'],
      },
    ],
  },
}

export const legal: Record<Locale, Record<LegalSlug, LegalDoc>> = { tr, ru, de, en }

/** „Zurück zur Startseite" je Sprache. */
export const backHome: Record<Locale, string> = {
  tr: 'Ana sayfaya dön',
  ru: 'На главную',
  de: 'Zurück zur Startseite',
  en: 'Back to the homepage',
}
