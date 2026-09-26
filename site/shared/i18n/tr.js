/* =====================================================================
   Lecture shell · Turkish interface strings (tr)
   A deck in Turkish loads this file before shared/visual-components.js;
   VC.t() in visual-components.js and T() in lecture-controls.js look up
   the exact English string here and fill {name} placeholders. Without
   this file every interface string stays English. The list below maps
   each string to its line and each placeholder to its expression.

   ---------------------------------------------------------------------
   lecture-controls.js (line: key; placeholders ← expression)
   ---------------------------------------------------------------------
   219  "Back one step" (aria-label) · "Back" (button text)
   220  "Step forward" (aria-label) · "Step" (button text)
   221  "Replay this condition from its first step" (aria-label) · "Replay"
   222  "Reset to the baseline condition and first step" (aria-label) · "Reset"
   227  "Run or pause the model" (aria-label) · "Run" (button text)
   231  "Condition presets" (aria-label of the preset group)
   234  "Condition: {label}" (aria-label of a preset button)   {label} ← c.label
   240  "Scene controls for {heading}" (aria-label)            {heading} ← d.heading
   251  "Condition" (rail eyebrow)
   254  "Decide before the reveal" (rail eyebrow)
   257  "What is happening" (rail eyebrow)
   259  "In short" (label before principleShort)
   260  "Principle" (rail eyebrow)
   312  "Pause" / "Run" (run button text while running / paused)
   323  "{n} of {count}" (caption counter)                     {n} ← this.state + 1, {count} ← this.count
   324  "State {n} of {count}" (visually hidden progress)      {n} ← this.state + 1, {count} ← this.count
   371  "Page {n} of {total}" (header position)                {n} ← i + 1, {total} ← deck.pages.length
   373  "Anchor" / "Bridge" (header role chip; CSS upper-cases it)
   393  "Close" (aria-label of the dialog close button; its text "×" stays)
   402  "anchor" / "bridge": the raw role value p.def.scene.role, printed as `${T(role)} · ${p.id}`
        (overview dialog)
   407  "Pages in this lecture" (overview dialog title)
   411  "Next page / previous page" · "Right arrow or Page Down · Left arrow or Page Up (also the ▶ and ◀ buttons)"
   412  "First page / last page" · "Home · End"
   413  "Step forward / back one step in the scene" · "Down arrow · Up arrow (also the Step and Back buttons)"
   414  "Replay the selected condition" · "r  (letter shortcut)"
   415  "Reset to the baseline condition" · "Shift + R  (letter shortcut)"
   416  "Page overview / this help" · "o · ?  (letter shortcuts)"
   417  "Close a dialog" · "Escape"
   423  "Keyboard" (help dialog title)
   424  "Letter shortcuts on (r, Shift+R, o, ?). Arrow keys keep working inside text fields and sliders; letter keys are ignored there too."
   425  "Deep links: {file}#/<scene-id> opens a scene at its baseline, paused. Query modes: ?motion=off instant states, ?print=1 print view."
                                                              {file} ← deck.def.file
   459  "Week {week}" (print header and footer)                {week} ← String(d.week).padStart(2, '0')
   465  "page {pageNo}" (print footer, right)                  {pageNo} ← pageNo
   475  "Scene (student heading)" · "Role" · "Deep link" (print cover table; "#" stays)
   477  "Anchor" / "Bridge" (print cover table)
   482  "Student notes" (cover heading) · "Cover" (cover role)
   485  "Scenes in this lecture" (cover)
   488  "cover" (footer reference text of the cover sheet) · "Cover" (footer role)
   495  "Final state" (default panel title when a scene defines no print panels)
   511  "Anchor scene" / "Bridge scene" (print panel head)
   512  "Panel {n} of {total} · {title}"                       {n} ← k + 1, {total} ← panels.length, {title} ← pn.title
   513  "{n} of {count}" (print state counter)                 {n} ← stateIdx + 1, {count} ← cond.states.length
   515  "Decide first: " (print prompt label; keep the trailing space)
   513  "Condition: " · "State: " (print meta labels, drawn by print.css from data-label)
   520  "Principle · " · "In short · " (print principle labels, drawn by print.css from data-label)
   523  "Anchor" / "Bridge" (print footer role)
   534  "Page" (print footer role of non-scene pages)
   566  "Week {week}" (default def.shortTitle)                 {week} ← String(def.week).padStart(2, '0')
        (week-03.tr.js passes shortTitle: 'Hafta 03' itself)
   578  "Lecture pages" (aria-label of the header nav) · "Previous page" · "Next page" · "Page overview" · "Keyboard help"
   585  "Skip to the current page" (skip link)
   603  "Campus Rooms · Software Engineering" (default page wordmark; week-03.tr.js passes wordmark itself)
   Not translated: SVG icon paths (48-52), key names in the keydown switch (439-451), the letter
   shortcuts r / R / o / ? themselves (451), "×" (392), "#" (474).

   ---------------------------------------------------------------------
   visual-components.js (line: key; placeholders ← expression)
   ---------------------------------------------------------------------
   76   "Diagram" (default aria-label of an SVG diagram)
   231  default URL "campus-rooms.example/book" stays (a URL, not a label)
   235  "Browser window of {who}" / "Browser window" (aria-label)   {who} ← opts.who
   278  "Legend" (aria-label)
   290  "{title}: {n} values in {unit}; {bins}" (histogram aria-label)
                                                              {title} ← title, {n} ← values.length, {unit} ← unit,
                                                              {bins} ← the joined "{count} in {label}" parts
        "{count} in {label}" (one part of {bins})              {count} ← counts[i], {label} ← l
   292  "{title}: see the data table." (canvas fallback text)  {title} ← title
   296  "{title}: values ({unit}), n = {n}" (table caption)    {title} ← title, {unit} ← unit, {n} ← values.length
   297  "Value ({unit})" · "Count" (table headers)             {unit} ← unit
   330  "Response time ({unit})" (x-axis title)                {unit} ← unit
   331  "Number of responses" (y-axis title)
   ===================================================================== */
window.LECTURE_STRINGS = {
  // ---------------------------------------------------------------- lecture-controls.js · scene controls and rail
  "Back": "Geri",
  "Back one step": "Bir adım geri",
  "Step": "İleri",
  "Step forward": "Bir adım ileri",
  "Replay": "Yeniden oynat",
  "Replay this condition from its first step": "Bu koşulu ilk adımından yeniden oynat",
  "Reset": "Sıfırla",
  "Reset to the baseline condition and first step": "Başlangıç koşuluna ve ilk adıma sıfırla",
  "Run": "Çalıştır",
  "Pause": "Duraklat",
  "Run or pause the model": "Modeli çalıştır ya da duraklat",
  "Condition presets": "Koşul seçenekleri",
  "Condition: {label}": "Koşul: {label}",
  "Scene controls for {heading}": "Sahne denetimleri: {heading}",
  "Condition": "Koşul",
  "Decide before the reveal": "Cevabı görmeden karar ver",
  "What is happening": "Ne oluyor?",
  "In short": "Kısaca",
  "Principle": "İlke",
  "{n} of {count}": "{n} / {count}",
  "State {n} of {count}": "Durum {n} / {count}",

  // ---------------------------------------------------------------- lecture-controls.js · header, navigation, roles
  "Page {n} of {total}": "Sayfa {n} / {total}",
  "Anchor": "Temel",
  "Bridge": "Köprü",
  "anchor": "temel",
  "bridge": "köprü",
  "Lecture pages": "Ders sayfaları",
  "Previous page": "Önceki sayfa",
  "Next page": "Sonraki sayfa",
  "Page overview": "Sayfa genel görünümü",
  "Keyboard help": "Klavye yardımı",
  "Skip to the current page": "Geçerli sayfaya atla",
  "Week {week}": "Hafta {week}",
  "Campus Rooms · Software Engineering": "Campus Rooms · Yazılım Mühendisliği",

  // ---------------------------------------------------------------- lecture-controls.js · dialogs
  "Close": "Kapat",
  "Pages in this lecture": "Bu dersteki sayfalar",
  "Keyboard": "Klavye",
  "Next page / previous page": "Sonraki sayfa / önceki sayfa",
  "Right arrow or Page Down · Left arrow or Page Up (also the ▶ and ◀ buttons)": "Sağ ok ya da Page Down · Sol ok ya da Page Up (▶ ve ◀ düğmeleri de)",
  "First page / last page": "İlk sayfa / son sayfa",
  "Home · End": "Home · End",
  "Step forward / back one step in the scene": "Sahnede bir adım ileri / bir adım geri",
  "Down arrow · Up arrow (also the Step and Back buttons)": "Aşağı ok · Yukarı ok (İleri ve Geri düğmeleri de)",
  "Replay the selected condition": "Seçili koşulu yeniden oynat",
  "r  (letter shortcut)": "r  (harf kısayolu)",
  "Reset to the baseline condition": "Başlangıç koşuluna sıfırla",
  "Shift + R  (letter shortcut)": "Shift + R  (harf kısayolu)",
  "Page overview / this help": "Sayfa genel görünümü / bu yardım",
  "o · ?  (letter shortcuts)": "o · ?  (harf kısayolları)",
  "Close a dialog": "İletişim kutusunu kapat",
  "Escape": "Esc",
  "Letter shortcuts on (r, Shift+R, o, ?). Arrow keys keep working inside text fields and sliders; letter keys are ignored there too.": "Harf kısayolları açık (r, Shift+R, o, ?). Ok tuşları metin alanlarında ve kaydırıcılarda kendi işlevini sürdürür; harf tuşları da oralarda kısayol olarak yok sayılır.",
  "Deep links: {file}#/<scene-id> opens a scene at its baseline, paused. Query modes: ?motion=off instant states, ?print=1 print view.": "Derin bağlantılar: {file}#/<sahne-id> bir sahneyi başlangıç koşulunda, duraklatılmış olarak açar. Sorgu kipleri: ?motion=off anında durum geçişleri, ?print=1 baskı görünümü.",

  // ---------------------------------------------------------------- lecture-controls.js · print view
  "page {pageNo}": "sayfa {pageNo}",
  "Scene (student heading)": "Sahne (öğrenci başlığı)",
  "Role": "Rol",
  "Deep link": "Derin bağlantı",
  "Student notes": "Öğrenci notları",
  "Cover": "Kapak",
  "cover": "kapak",
  "Scenes in this lecture": "Bu dersteki sahneler",
  "Final state": "Son durum",
  "Anchor scene": "Temel sahne",
  "Bridge scene": "Köprü sahne",
  "Panel {n} of {total} · {title}": "Panel {n} / {total} · {title}",
  "Decide first: ": "Önce karar ver: ",
  "Condition: ": "Koşul: ",
  "State: ": "Durum: ",
  "Principle · ": "İlke · ",
  "In short · ": "Kısaca · ",
  "Page": "Sayfa",

  // ---------------------------------------------------------------- visual-components.js
  "Diagram": "Diyagram",
  "Browser window": "Tarayıcı penceresi",
  "Browser window of {who}": "{who} tarayıcı penceresi",
  "Legend": "Gösterge",
  "{title}: {n} values in {unit}; {bins}": "{title}: {unit} cinsinden {n} değer; {bins}",
  "{count} in {label}": "{label} aralığında {count}",
  "{title}: see the data table.": "{title}: veri tablosuna bakın.",
  "{title}: values ({unit}), n = {n}": "{title}: değerler ({unit}), n = {n}",
  "Value ({unit})": "Değer ({unit})",
  "Count": "Sayı",
  "Response time ({unit})": "Yanıt süresi ({unit})",
  "Number of responses": "Yanıt sayısı",
};
