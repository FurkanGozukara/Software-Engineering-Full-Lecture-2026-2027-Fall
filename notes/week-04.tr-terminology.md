# Week 04 · Turkish edition: terminology

The Turkish deck (`site/weeks/week-04.tr.html`, `week-04.tr.js`) and its student PDF (`site/pdf/week-04.tr.pdf`) use these terms. Fixture text is translated in `site/assets/fixtures/demo-fixtures.tr.js` (Week 4 section; keys are the exact English fixture strings, and the English values stay the logic, the cue names and the self-checks); the shell's interface strings come from `site/shared/i18n/tr.js`, which already held every string Week 4 uses (Run and Pause included). The terms of `notes/week-03.tr-terminology.md` carry over unchanged (rezervasyon, oda, Onaylandı, İptal edildi, izin verildi / izin verilmedi, vaka, senaryo, ilke, kısaca, devir, Temel / Köprü, Başlangıç / Değişiklik, ...); this file adds the Week 4 flow and decision terms. Reuse both tables for later weeks so the same concept keeps one Turkish name.

## Terminology (English → Turkish)

| English | Turkish | Note |
|---|---|---|
| work card / card | iş kartı / kart | card ids W01–W08 stay; suffixes go on *kart*: "W08 kartının" |
| the eight cards | çakışma kuralı · süre sınırı · iptalde sahiplik · oda kapanışı · erişilebilir geri bildirim · bildirim kurtarma · arama yanıt süresi · destek tanılaması | W01–W08; *oda kapanışı* as Week 3's "oda kapanışları" |
| board / column / station | pano / sütun / istasyon | "Hazır sütununda" |
| round (teaching unit) | tur | "round 3" → 3. tur, "in round 3" → 3. turda, "per round" → turda: "turda 2 kart" |
| Ready / Implementing / Waiting for review / Review / Done | Hazır / Geliştirme / İnceleme bekliyor / İnceleme / Bitti | board heads; *Hazır* and *Bitti* as in the Turkish Scrum Guide glossary |
| idle / this round | boşta / bu turda | station slots |
| started / waiting / done (counts) | başlanan / bekleyen / biten | chart, table, counters; "3 done" → 3 bitti |
| implementation (the stage) / implemented | geliştirme / geliştirilen | Week 3's *gerçekleştirim* named an implementation of the models as a whole; the stage where a card is built is *geliştirme* |
| review (the step a second developer does) / reviewer / review queue | inceleme / inceleyen kişi / inceleme kuyruğu | see Decisions |
| transfer rule / capacity | aktarma kuralı / kapasite | |
| queue | kuyruk | |
| bottleneck | darboğaz | "the bottleneck moved" → darboğaz yer değiştirdi |
| throughput | iş çıkış hızı | terms list: "İş çıkış hızı (throughput)"; see Decisions |
| work in progress (WIP) | devam eden iş (WIP) | |
| WIP limit / limit | devam eden iş sınırı / sınır | "a work-in-progress limit of 2" → 2 kartlık devam eden iş sınırı |
| local activity (a busy stage) | yerel iş yoğunluğu | principle 3; *hareketlilik* would read as mobility |
| which clock runs for the person who asked | işi isteyen kişi için hangi saat işler | scene 4 heading and prompt; lead time is *işi isteyen kişinin saati* |
| admission / demand / arrival | işin başlatılması / talep / geliş | "controls admission, not demand" → talebi değil, işin başlatılmasını denetler (*işe alım* would read as hiring) |
| work item age / item | iş öğesi yaşı / öğe | |
| cycle time | döngü süresi | as the Turkish Kanban Guide for Scrum Teams (2021) |
| lead time | teslim süresi | |
| clock (of a person, of the team) | saat | "the clock of the person who asked" → işi isteyen kişinin saati; "stakeholder clock" → paydaş saati |
| boundary (of a timing measure) | uç nokta; başlangıç ve bitiş noktası | kept apart from *sınır* (limit); "the declared start boundary" → belirlenen başlangıç noktası |
| declared start | belirlenen başlangıç | |
| measure / flow measure | ölçü / akış ölçüsü | "Five measures of one board" → Tek bir panonun beş ölçüsü |
| batch / a single large batch | toplu teslim / tek bir büyük toplu teslim | lane "TOPLU TESLİM"; see Decisions |
| slice | dilim | "slice 1" → 1. dilim; SVG "DİLİM 1" |
| increment | artım | Scrum's Increment: Artım (capitalized, apostrophe before suffixes: Artım'ı); see Decisions |
| iteration / iterative | yineleme / yinelemeli | |
| feedback / feedback loop / feedback point | geri bildirim / geri bildirim döngüsü / geri bildirim noktası | |
| integrate / integration | entegre etmek / entegrasyon | |
| misunderstanding | yanlış anlama | |
| rework | yeniden çalışma | see Decisions |
| reconsider | yeniden ele almak | |
| usable / capability | kullanılabilir / yetenek | "a planned capability" → planlanmış bir yetenek |
| coordinate / coordination | koordine etmek / koordinasyon | |
| plan-driven | plan güdümlü | |
| iterative timeboxes (Scrum) / timebox | yinelemeli zaman kutuları (Scrum) / zaman kutusu | the Turkish Scrum Guide says *zaman sınırı* for time-box; this deck's approach label keeps the widely used *zaman kutusu* |
| flow policies (Kanban) / workflow / policy | akış politikaları (Kanban) / iş akışı / politika | |
| milestone / handoff / pull (an item) | kilometre taşı / devir / (iş) çekmek | |
| practice / ritual / approach | pratik / ritüel / yaklaşım | "coordination practices" → koordinasyon pratikleri |
| Product Owner / Scrum Master / Developers | Ürün Sahibi / Scrum Master / Geliştiriciler | Turkish Scrum Guide 2020 glossary |
| accountability | sorumluluk | "accountabilities, not job titles" → sorumluluklar, iş unvanları değil |
| Sprint / Sprint Goal / Product Backlog | Sprint / Sprint Hedefi / Ürün İş Listesi | |
| Sprint Review / Retrospective | Sprint Değerlendirme / Retrospektif | the glossary's *Sprint Değerlendirme*; in running text "her Sprint Değerlendirme toplantısında" |
| transparency, inspection, adaptation | şeffaflık, denetleme, uyarlama | Scrum's three pillars (*gözlem* would read as observation) |
| inspect | gözden geçirmek | kept apart from *inceleme* (review) |
| Definition of Done / done | Bitti Tanımı / bitti | see Decisions; terms list: "Bitti Tanımı (Definition of Done)" |
| Scrum Guide / Kanban Guide | Scrum Kılavuzu / Kanban Kılavuzu | the source titles S04 and S05 stay English |
| (support) incident | destek talebi | *olay* is Week 3's *event*; "incidents arrive at unknown times" → destek talepleri bilinmeyen zamanlarda geliyor |
| urgent | acil | |
| estimate / range / basis | tahmin / aralık / dayanak | "3 to 4 days" → 3–4 gün |
| effort / elapsed time / commitment | efor / geçen süre / taahhüt | "committing more work" → daha fazla iş taahhüt etmek |
| assumption / dependency / open question / known work | varsayım / bağımlılık / açık soru / bilinen iş | "if the guess is wrong" → varsayım yanlışsa (*tahmin* stays *estimate*) |
| qualify an estimate / revise an estimate | tahmine koşulunu eklemek / tahmini güncellemek | "revise" with a policy or an explanation: gözden geçirmek |
| working day / simulated | iş günü / benzetim (verisi) | "Simulated teaching values." → Benzetimle üretilmiş öğretim değerleri. |
| identity interface / identity service / identity team | kimlik arayüzü / kimlik servisi / kimlik ekibi | *servis* as in Week 3's "Rezervasyon Servisi" |
| agree the identity interface / is agreed | kimlik arayüzünde anlaşmak / kimlik arayüzünde anlaşıldı | |
| criteria / impact / uncertainty / reversibility | ölçütler / etki / belirsizlik / geri alınabilirlik | |
| cost of delay / information gained | gecikme maliyeti / kazanılan bilgi | |
| opportunity cost / exit cost | fırsat maliyeti / çıkış maliyeti | "displaces" → geri plana iter |
| continuing support / elapsed waiting | süren destek / geçen bekleme süresi | |
| low · medium · high · little · large · very low · low if wrong | düşük · orta · yüksek · az · çok · çok düşük · yanlışsa düşük | ordinal words of the scene 6 table |
| investigate / implement / reduce scope / defer | araştır / geliştir / kapsamı daralt / ertele | the four alternatives, as action labels |
| option / alternatives | seçenek / alternatifler | |
| workaround / data migration | geçici çözüm / veri taşıma | |
| completion policy | tamamlanma politikası | |
| acceptance examples | kabul örnekleri | |
| happy path | olağan akış | "Happy path only" → Yalnızca olağan akış |
| coded / ready to rely on / merged | kodlandı / güvenilmeye hazır / birleştirilmek | |
| Intended behavior / Review / Checks / Documentation / Operability | Amaçlanan davranış / İnceleme / Kontroller / Belgeleme / İşletilebilirlik | the five kinds of evidence |
| evidence | kanıt | |
| log / logged / typo / wording correction / internal | günlük / günlüğe kaydedilir / yazım hatası / ifade düzeltmesi / dahili | |
| status message | durum mesajı | |
| observation / proposal (proposed change) / expected effect | gözlem / öneri (önerilen değişiklik) / beklenen etki | the four hypothesis cards; "It is wrong if" → Ne olursa yanlıştır |
| hypothesis / side effect | hipotez / yan etki | |
| blameless / blameless review / psychological safety | suçlamasız / suçlamasız değerlendirme / psikolojik güvenlik | |
| issues found after review / missed issues / reopened | incelemeden sonra bulunan sorunlar / gözden kaçan sorunlar / yeniden açılan | |
| balanced experiment | dengeli deney | |
| teaching units | öğretim birimleri | "rounds are teaching units" → turlar öğretim birimidir |

Kept in English on purpose: page and scene ids in deep links and footers (`#/feedback-batches`, ...), file names, the card ids W01–W08 and the ids B-001, C101, U-01, R-01, R-03, R-05, S01–S05, the names Ari and Bo, Campus Rooms, Scrum, Kanban, Sprint and Scrum Master (the Turkish Scrum Guide keeps them), the tool names of the In practice card (Jira, GitHub Projects, Linear, Trello), the URL `campus-rooms.example/my-bookings`, the source titles S01–S05 (bibliographic titles), the self-check error messages (developer-facing, thrown only when the fixtures break), and, once each in the terms list, the English names of the flow measures that tools show untranslated: throughput, work item age, cycle time, lead time, and Definition of Done.

## Decisions

- **Definition of Done → Bitti Tanımı.** The official Turkish translation of the Scrum Guide 2020 (scrumguides.org, `2020-Scrum-Guide-Turkish.pdf`, glossary and the section "Taahhüt: Bitti Tanımı") writes *Bitti Tanımı*, not *Tamamlanma Tanımı*; the board's Done column is therefore *Bitti*, and "done" in running text *bitti* ("Bir değişiklik ne zaman bitmiş sayılır?"). The deck's own term *completion policy* stays *tamamlanma politikası*. The Scrum Guide sentence quoted in the scene 7 PDF note is translated from S04 in the wording of the Turkish Scrum Guide, with *Artım* for Increment.
- **Increment → Artım.** The Turkish Scrum Guide lists *Ürün Parçası* in its glossary but keeps "Increment" in its text; the deck uses one name, *Artım*, for the general concept (scene 1) and for Scrum's artifact (scene 2), in line with *artımlı* (incremental) in the same glossary.
- **Review → inceleme.** The code review step is *inceleme* (as in *kod incelemesi*), not *gözden geçirme*: the board's station head "İNCELEME" fits its 150 px column where "GÖZDEN GEÇİRME" would not, and "issues missed in review" reads *incelemede gözden kaçan sorunlar* instead of repeating *gözden*. Scrum's Sprint Review keeps its glossary name *Sprint Değerlendirme*, a review meeting is *değerlendirme toplantısı*, and *gözden geçirmek* is kept for inspect and revise.
- **Throughput → iş çıkış hızı.** It names what is counted, items leaving the flow per unit of time; *verim* reads as efficiency or productivity, which the deck says rounds do not measure. (The Turkish Kanban Guide for Scrum Teams writes *iş çıktısı sayısı*.)
- **Rework → yeniden çalışma**, not *yeniden iş*: *yeniden işe* would read as "back to the job" ("kaliteye ve yeniden çalışmaya bakın").
- **Implementation → geliştirme**, matching the Geliştirme station; *uygulama* would also read as "application".
- **Batch → toplu teslim** throughout, "a single large batch" → *tek bir büyük toplu teslim*; *parti* was not used, so one concept keeps one name.
- **Boundary → uç nokta** and **limit → sınır**, so that "the limit moved waiting from inside the cycle-time boundary" does not read *sınır … sınır* (→ "sınır, beklemeyi döngü süresinin kapsadığı aralıktan Hazır kuyruğuna taşıdı").
- **Incident → destek talebi**, because *olay* is already Week 3's *event*.

## Conventions

- **Case suffixes**: the templates of `week-04.tr.js` attach no suffix to a fixture value; an id is followed by a noun that takes it ("W08 kartının", "B-001 rezervasyonunun", "W03 iptali", "başlangıç 3, bitiş 9"), rounds are written "N. tur/turda/turun", times "saat 09:00". Literal suffixes: R-01'e, R-03'e, R-03'ün, "hepsi 0'da" in the deck text, and B-001'i, R-01'in, 09:00'da in the fixture translations (fixed text; recheck them if those fixture values change).
- **Numbers**: ranges with an en dash ("3–4 gün", "3–9 güne"); averages with the Turkish decimal comma ("4,0", "5,5", "2,9": `one()` formats them for display only); no plural after a number ("5 kart bekliyor"), so the English "card waits / cards wait" branch has one Turkish form.
- **Time spans**: `10:00–11:00`, as in Week 3.
- **Upper case**: CSS upper-casing follows `lang="tr"` (i → İ); SVG labels without CSS are written in capitals (PLAN 1, TOPLU TESLİM, DİLİMLER, DİLİM 1, ARTIM, YİNELEME, KART · TUR →); `upper1`, `lowerFirst` and `lowerTr` use the Turkish locale.
- **Scrum terms** are capitalized and take an apostrophe before a suffix, as the Turkish Scrum Guide writes them (Artım'ı, Ürün İş Listesi'nin, Ürün Sahibi'nin, Scrum'ın).
- **Action labels** use the bare imperative (araştır, ertele, kapsamı daralt, "Eş zamanlı rezervasyonların çakışamayacağını göster", "inceleme işini paylaş"), as Week 3's next-step strings; when the PDF note names such an option it is quoted: “Görsel iyileştirme” adımı şunu netleştirir: …
- **Separators** the deck splits on are kept in the Turkish fixture text (listed in the header of `demo-fixtures.tr.js`): the `:` after an accountability's short word, the `:` after an ordinal word ("çok düşük: …"), the phrase "ikinci ve üçüncü dilimlerden" that the scene 1 caption writes as "2. ve 3. dilimlerden", and the ending " tahmini güncelle" that the scene 5 trigger card cuts.
- **Quotes** “…”; the Step button is named as in Week 3 ("İleri'ye basın", "İleri ile"), an on-screen button with *düğme* ("İptal düğmesine basıldıktan sonra").
