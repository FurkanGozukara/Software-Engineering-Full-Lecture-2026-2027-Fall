# Week 03 · Turkish edition: terminology

The Turkish deck (`site/weeks/week-03.tr.html`, `week-03.tr.js`) and its student PDF (`site/pdf/week-03.tr.pdf`) use these terms. Fixture text is translated in `site/assets/fixtures/demo-fixtures.tr.js` (keys are the exact English fixture strings; the English values stay the logic), and the shell's interface strings in `site/shared/i18n/tr.js` (keys are the exact English strings of `lecture-controls.js` and `visual-components.js`). Reuse this table for later weeks so the same concept keeps one Turkish name.

## Terminology (English → Turkish)

| English | Turkish | Note |
|---|---|---|
| user journey | kullanıcı yolculuğu | steps: Bir oda seç · İsteği gönder · Sonucu gözlemle |
| goal / action | hedef / eylem | journey rows |
| the screen says | ekranda yazan | journey row, table header |
| stored underneath | arka planda saklanan | journey row |
| still uncertain | hâlâ belirsiz | journey row |
| state model / state machine | durum modeli / durum makinesi | |
| state | durum | state names are followed by *durumu/durumuna/durumundan* instead of taking suffixes |
| transition | geçiş | |
| event | olay | |
| condition (guard) | koşul | terms list: "Koşul (guard)" |
| condition preset (shell) | koşul | "Condition presets" → Koşul seçenekleri |
| baseline (condition) | Başlangıç | condition label prefix "Başlangıç: …"; shell "başlangıç koşulu" (see §5) |
| changed (condition) | Değişiklik | condition label prefix "Değişiklik: …" |
| marker | işaretçi | |
| current state | şu anki durum | |
| absent on purpose | kasıtlı olarak yok | arrow label and legend |
| data model | veri modeli | |
| entity | varlık | entity boxes: User/Room/Booking → Kullanıcı/Oda/Rezervasyon |
| identity | kimlik | |
| identifier, ID | tanımlayıcı | "its ID stays" → tanımlayıcısı aynı |
| relationship | ilişki | |
| cardinality | kardinalite | |
| many to one / many / one | çoktan bire / çok / bir | |
| reference / refers to | referans / referans verir | |
| referential integrity | referans bütünlüğü | |
| well-formed / malformed / exists | biçimi doğru / biçimi bozuk / var | "Well-formed is not exists" → **Biçimi doğru** olmak **var** olmak demek değildir |
| historical snapshot | tarihsel anlık görüntü | |
| fact / current fact / historical fact | olgu / güncel olgu / tarihsel olgu | |
| capacity / display name / receipt | kapasite / görünen ad / makbuz | |
| Seminar Room 1 / Seminar Room A | Seminer Odası 1 / Seminer Odası A | as instructed |
| identifier shape | tanımlayıcı biçimi | |
| domain rule / data constraint | alan kuralı / veri kısıtı | |
| permission | yetki | "requester is permitted" → istekte bulunan yetkili |
| decision table | karar tablosu | |
| rule | kural | chip "Rule R-03" → Kural R-03 |
| row / cell / column | satır / hücre / sütun | |
| combination | kombinasyon | |
| missing case | gözden kaçan vaka | *durum* avoided (it means state) |
| signed in | oturum açmış | nobody signed in → oturum açan yok |
| authenticated | kimliği doğrulanmış | inside the R-03 rule text |
| own booking | kendi rezervasyonu | |
| starts after now | şimdiden sonra başlıyor | literal on purpose, see §5 |
| who asks | kim istiyor / isteyen | |
| requester | istekte bulunan | |
| owner | sahip | |
| allowed / denied | izin verildi / izin verilmedi | *denied* is kept apart from *Rejected = Reddedildi* |
| repeated response / stable repeated response | tekrar yanıtı / kararlı tekrar yanıtı | |
| staff override | personel ayrıcalığı | |
| policy boundary | politika sınırı | |
| stakeholders | paydaşlar | |
| teaching clock | örnekteki saat | |
| sequence diagram | sıralama diyagramı | view name: Sıralama |
| participant / lifeline / message | katılımcı / yaşam çizgisi / mesaj | ordinal "message 5" → 5. mesaj |
| Browser | Tarayıcı | participant and component |
| Booking Service | Rezervasyon Servisi | |
| Authoritative Store | Yetkili Depo | "authoritative decision" → yetkili deponun kararı |
| Notification Worker | Bildirim İşleyicisi | |
| store (noun) / stored / nothing stored | depo / saklanan, saklandı / hiçbir şey saklanmadı | |
| persist, persistence / atomically | kalıcı olarak saklamak, kalıcı kayıt / atomik olarak | "decide and persist atomically" → atomik olarak karar ver ve sakla |
| decided and stored | karar verildi ve saklandı | arrow label |
| recovery / recovery path | kurtarma / kurtarma yolu | |
| pending | bekleyen | |
| notification | bildirim | |
| interface states | arayüz durumları | |
| Loading / Empty result / Validation error / Service unavailable / Results | Yükleniyor / Boş sonuç / Doğrulama hatası / Hizmet kullanılamıyor / Sonuçlar | |
| promise (noun) / to promise | vaat / söz vermek | "false promise" → asılsız vaat |
| keyboard focus | klavye odağı | "focus moves to …" → odak …'e geçer |
| next action / next step | sonraki eylem / sonraki adım | |
| model consistency | model tutarlılığı | |
| neat (diagram) | derli toplu | |
| calendar / overlap / conflict | takvim / çakışma, çakışmak / çakışma | "conflict: overlaps B-001" → çakışma: B-001 ile örtüşüyor |
| interval / half-open | aralık / yarı açık | |
| abstraction | soyutlama | |
| view (Context, Sequence, State, Data) | görünüm (Bağlam, Sıralama, Durum, Veri) | |
| keeps / leaves out | tuttuğu / dışarıda bıraktığı | |
| audience | hedef kitle | |
| maintainer | bakımcı | |
| staff / room staff / campus member | personel / oda personeli / kampüs üyesi | |
| Mail provider / outside | E-posta hizmeti / dış sistem | |
| safety invariant | güvenlik değişmezi | |
| progress property | ilerleme özelliği | |
| booking / to book | rezervasyon / rezerve etmek | SVG arrow label "books" → ayırtır (space) |
| room | oda | |
| request / response | istek / yanıt | |
| answer (to a question) | cevap; verb: yanıtlamak | "Answer:" callout in scene 8 → "Cevap:" so it does not clash with *yanıt* (response) in the same line |
| submit C101, 10:30 to 11:30 (message) | gönder (C101, 10:30–11:30) | parentheses instead of a colon, which would double with the caption's own colon |
| timeout | zaman aşımı | "A timeout is missing information" → Zaman aşımı eksik bilgidir |
| retry / duplicate booking | yeniden deneme / mükerrer rezervasyon | not in this deck's text |
| duplicate click | tekrarlanan tıklama | |
| to hold (a room) | tutmak | "the room is held" → oda tutuldu |
| Draft / Submitting / Confirmed / Rejected / Unknown outcome / Cancelled | Taslak / Gönderiliyor / Onaylandı / Reddedildi / Sonuç bilinmiyor / İptal edildi | |
| Submit (event, button) / Cancel (event) | Gönder / İptal | see §5 |
| Reserve (button) / My bookings | Rezerve et / Rezervasyonlarım | prose: *Rezerve et düğmesine*; compact cells: *Rezerve et'e*, *Rezervasyonlarım'a* |
| Search / Try again / Change the time | Ara / Yeniden dene / Saati değiştir | |
| Start / End / Room / Time (fields) | Başlangıç / Bitiş / Oda / Saat | |
| situation | senaryo | *durum* kept for state |
| picture (drawing) / picture (in the mind) | çizim / resim | |
| notation | gösterim | |
| register (of rules) | kural listesi | |
| principle / in short / check | ilke / kısaca / kontrol | |
| recall / learning outcomes | hatırlatma / kazanımlar | |
| handoff / carried forward / in practice | devir / taşınanlar / uygulamada | |
| implementation | gerçekleştirim | |
| scene / page / lecture / week 3 | sahne / sayfa / ders / 3. hafta, Hafta 03 | |
| Anchor / Bridge | Temel / Köprü | Anchor scene → Temel sahne |
| deep link / print view | derin bağlantı / baskı görünümü | shell |

Kept in English on purpose: field identifiers shown in monospace (`id`, `name`, `display_name`, `capacity`, `owner_id`, `room_id`, `start`, `end`, `state`, and the record key `time`; the annotation of `capacity (kopya)` is Turkish), the product name Campus Rooms, URLs, the source titles S01–S25 (bibliographic titles), the self-check error messages (developer-facing, thrown only when the fixtures break), the entity-glyph field order "önce id", and the letter shortcuts r / Shift+R / o / ? (keys live in the shell).

## Conventions

- **Case suffixes** follow the spoken form: B-001'in/'i/'e, B-004'ü, C101'in/'i/'den, C303'ün, R-03'e/'teki/'te, Ari'nin/'ye, Bo'nun/'ya, 10:00'dan, 12'den 10'a. In templates they are written after `${…}` and therefore assume the current fixture values: `ARI.name` ('nin, 'ye), `BO.name` and `nameOf(MCC.requester)` ('nun, 'ya), `BK.id` ('e, 'i, 'in), `ROOM` ('in, 'i, 'den), `IDX[1].ref` ('ün), `DT.rule` ('e, 'teki), `BK.start` ('dan), `CAP0` ('den), `CAP1` ('a). If a fixture id, name, time or number changes, these suffixes must be rechecked. Where possible the text avoids suffixes (e.g. "B-001 makbuzu", "X iken Y oluyor", "1–4 arası", "C101 için").
- **Time spans**: `span()` returns `10:00–11:00`; prose uses "10:00 ile 11:00 arası" (scene 1 opening caption) or "10:00–11:00 arası".
- **Upper case**: labels upper-cased by CSS are written in normal case. The two SVG lane titles of scene 2 have no CSS transform, so they are written in capitals, and the name uses `toLocaleUpperCase('tr')` (ARİ). `lower1`/`upper1` use the Turkish locale (i ↔ İ, ı ↔ I); the English `toUpperCase()` would print "ARI" and "Işe".
- **Quotes** “…”; state and button names in running text are bold or quoted, never suffixed directly (e.g. "**Gönderiliyor** durumuna", "Rezerve et düğmesine").
- **Journey and next-step fixture strings** use the bare imperative (saati değiştir, yeniden dene, bir oda seç) so they read as action labels in tables, captions and print notes alike; goals use the infinitive (…bulmak, odayı istemek, …bilmek).
