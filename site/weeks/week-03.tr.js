/* =====================================================================
   Week 03 · Modeling behavior, data, and user interaction
   Central question: Which model answers the question we are actually asking?

   Every name, number, state, message and rule below is read from the fixtures
   (plan/assets/demo-fixtures.json → assets/fixtures/demo-fixtures.js).
   Scene identifiers come from plan/plan_manifest.json and never change.
   The shell (shared/lecture-controls.js) owns navigation, the control
   contract, modes and print; this file defines content and scenes.
   Layout: the stage is 1264 x 680 design pixels left of the rail; pages
   keep the bottom-right corner (x >= 1664, y >= 696) free where they can.

   Turkish edition (week-03.tr.html): every user-visible string is Turkish.
   Fixture text is shown through trx(), which reads
   assets/fixtures/demo-fixtures.tr.js (window.CAMPUS_ROOMS_FIXTURES_TR);
   comparisons and logic keep using the English fixture values.
   ===================================================================== */
(function () {
  'use strict';
  const F = window.CAMPUS_ROOMS_FIXTURES;
  /** Turkish display text of a fixture string; a string without a translation is recorded in window.__TR_MISSES and shown unchanged. */
  const trx = (str) => { const t = (window.CAMPUS_ROOMS_FIXTURES_TR || {})[str]; if (t === undefined) { (window.__TR_MISSES = window.__TR_MISSES || new Set()).add(str); return str; } return t; };
  const A = F.anchors;
  const { el, s, text, node, person, boundary, arrow, badge, markX, browser, field, status, chip, table } = window.VC;
  const CASE = F.case;
  const ARI = CASE.users[0];   // U-01 Ari
  const BO = CASE.users[1];    // U-02 Bo
  const ROOM = CASE.rooms[0];  // C101
  const ROOM2 = CASE.rooms[1]; // C202
  const BK = CASE.booking;     // B-001, owned by U-01, C101 10:00-11:00, Confirmed
  const FILE = 'week-03.tr.html';
  const SM = A['w03/state-machine'];
  const ID = A['w03/identity-and-data'];
  const SQ = A['w03/sequence-not-state'];
  const JB = A['w03/journey-before-boxes'];
  const DT = A['w03/decision-table'];
  const IS = A['w03/interface-states'];
  const MC = A['w03/model-consistency'];
  const AZ = A['w03/abstraction-and-zoom'];
  const CANC = F.cancellation_matrix;
  const TRANSFER = F.transfer_checks.w03;
  const nameOf = (uid) => (CASE.users.find((u) => u.id === uid) || {}).name || uid;
  const span = (a, b) => `${a}–${b}`;   // compact time span, 10:00–11:00; prose writes "10:00 ile 11:00 arası"
  const BK_TIME = span(BK.start, BK.end);

  // ------------------------------------------------------------------ helpers shared by the scenes
  const reveal = (attrs) => Object.assign({ class: 'rv rv--rise' }, attrs);
  // Turkish case mapping: i ↔ İ and ı ↔ I
  const lower1 = (str) => (/^[A-Z]+-?\d/.test(str) ? str : str.charAt(0).toLocaleLowerCase('tr') + str.slice(1));   // an identifier (B-001, R-03, C101) keeps its case
  const upper1 = (str) => str.charAt(0).toLocaleUpperCase('tr') + str.slice(1);
  const listAnd = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ve ${items[items.length - 1]}`);
  /** A numbered message with its display text in Turkish; from, to and n stay the fixture values the layout reads. */
  const trMsg = (m) => Object.assign({}, m, { message: trx(m.message) });
  /** Display name of a scene role; the role value itself ('anchor', 'bridge') is logic for the shell. */
  const roleTr = (r) => (r === 'anchor' ? 'Temel' : r === 'bridge' ? 'Köprü' : r);
  /** Accessible names of the small notation glyphs (legend of scene 2, models page). */
  const GLYPH_TR = { state: 'durum', current: 'şu anki durum', start: 'başlangıç', event: 'olay', absent: 'kasıtlı olarak yok', lost: 'kaybolan mesaj', entity: 'varlık', many: 'çoktan bire', journey: 'kullanıcı yolculuğu', data: 'veri modeli', table: 'karar tablosu', sequence: 'sıralama diyagramı' };
  const tone = (kind, str, extra) => el('span', { style: `color:var(--${kind});font-weight:700;${extra || ''}` }, str);
  const tick = (ok) => tone(ok ? 'ok' : 'bad', ok ? '✓' : '✕');
  const cardTitle = (str, extra) => el('div', { class: 'card-title', style: `margin-bottom:6px;${extra || ''}` }, str);
  const small = (str, extra) => el('p', { class: 'muted', style: `font-size:17px;line-height:1.3;${extra || ''}` }, str);
  /** A stored or requested state as a rounded SVG box (the node grammar of the shell, with state corners). */
  const stateNode = (x, y, w, label, extra) => node(Object.assign({ x, y, w, h: 62, label, r: 30 }, extra || {}));
  /** The current-state marker: a warm ring that travels between state boxes. */
  function marker(svgRoot, cls) {
    const r = s('rect', { class: `st-marker ${cls || ''}`.trim(), x: 0, y: 0, width: 10, height: 10, rx: 36, ry: 36, fill: 'none', stroke: 'var(--warn)', 'stroke-width': 5, 'pointer-events': 'none' });
    r.style.transition = 'x 420ms cubic-bezier(.2,.7,.2,1), y 420ms cubic-bezier(.2,.7,.2,1), width 420ms, opacity 300ms';
    svgRoot.appendChild(r);
    return {
      el: r,
      to(box) {
        if (!box) { r.style.opacity = '0'; return; }
        const b = box.box || box;
        r.setAttribute('x', b.x - 9); r.setAttribute('y', b.y - 9); r.setAttribute('width', b.w + 18); r.setAttribute('height', b.h + 18);
        r.style.opacity = '1';
      },
    };
  }
  const showIf = (n, on) => { if (n) n.classList.toggle('is-shown', !!on); };
  const focusIf = (n, on) => { if (n) n.classList.toggle('is-focus', !!on); };

  // =====================================================================
  // PAGE · opening situation
  // =====================================================================
  const UNKNOWN_MSG = JB.outcomes.find((o) => o.id === 'unknown').message;
  const QUESTIONS = [
    { who: ARI.name, q: 'Rezerve et düğmesine yeniden basmalı mıyım?', model: 'kullanıcı yolculuğu', scene: 1 },
    { who: '', q: `${BK.id}'e bundan sonra ne olabilir?`, model: 'durum modeli', scene: 2 },
    { who: 'Oda personeli', q: `${ROOM}'in adı değiştiğine göre ${BK.id} hangi oda için?`, model: 'veri modeli', scene: 3 },
    { who: BO.name, q: `${ARI.name}'nin rezervasyonunu iptal edebilir miyim?`, model: 'karar tablosu', scene: 4 },
    { who: 'Bakımcı', q: 'Zaman aşımından önce ne oldu?', model: 'sıralama diyagramı', scene: 5 },
  ];
  const BUILDS = 'Tek bir rezervasyonun, her biri yanıtladığı soruya göre çizilmiş beş küçük modeli ve bu modellerin hem birbiriyle hem de kurallarla uyuşup uyuşmadığının kontrolü.';
  const opening = {
    kind: 'page', id: 'opening', role: 'page',
    heading: 'Bir rezervasyon, beş soru. Hangi çizim hangisini yanıtlar?',
    lead: '2. hafta bir kural listesiyle bitti. Hiçbir şey çizmeden önce, insanların tek bir rezervasyon hakkında gerçekte neyi bilmesi gerektiğine bakın.',
    printRole: 'Açılış senaryosu',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const screen = browser({ who: `${ARI.name} · ${ARI.id}`, url: 'campus-rooms.example/book', body: [
        el('div', { style: 'display:grid;grid-template-columns:200px minmax(0,1fr);gap:10px' }, [field('Oda', ROOM), field('Saat', BK_TIME)]),
        el('div', { class: 'status status--wait', role: 'status', style: 'font-size:19px;line-height:1.3;align-items:flex-start' }, [el('span', { class: 'ico', 'aria-hidden': 'true' }, '?'), el('span', {}, trx(UNKNOWN_MSG))]),
      ] });
      screen.body.style.gap = '10px'; screen.body.style.padding = '12px 16px 14px';
      const situation = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:10px;padding:14px 18px' }, [
        cardTitle(`Senaryo · ${ARI.name}, Rezerve et düğmesine bastı`, 'margin-bottom:0'), screen,
      ]);
      api.cue(situation, 'situation'); api.cue(screen, 'screen');
      const drawBtn = api.cue(el('button', { type: 'button', class: 'ctl-btn ctl-btn--step', style: 'align-self:flex-start;height:56px;font-size:22px;padding:0 20px' }, 'Tüm sistemi çiz'), 'draw');
      // the component view: every box correct, none of them about what Ari needs to know
      const svg = componentSvg((x) => `opening-${x}`, 564);
      const components = el('div', reveal({ class: 'card rv rv--rise', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:6px' }), [
        cardTitle('Bileşenler olarak çizilmiş tüm sistem', 'margin-bottom:2px'), svg,
        el('p', { style: 'font-size:19px;line-height:1.3' }, [`Her kutu doğru. `, el('b', {}, `Hiçbiri ${ARI.name}'ye tekrar basmalı mı demiyor.`)]),
      ]);
      api.cue(components, 'components'); api.cue(svg, 'component-diagram');
      const question = el('div', reveal({ class: 'rail-card rail-prompt rv rv--rise', style: 'align-self:start' }), [
        el('div', { class: 'rail-eyebrow' }, 'Bu haftanın sorusu'),
        el('p', { class: 'prompt-q' }, 'Gerçekte sorduğumuz soruyu hangi model yanıtlar?'),
        el('ul', { class: 'prompt-options' }, ['Her parçayı gösteren tek bir ayrıntılı diyagram', 'Her soru için seçilmiş bir model', 'Kodun kendisi: en kesin olan odur'].map((o, i) => el('li', {}, [el('span', { class: 'opt-key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)), el('span', {}, o)]))),
        el('p', { class: 'rail-note', style: 'margin-top:12px' }, `Cevabınızı aklınızda tutun. 8. sahne bu soruyu ${BK.id} hakkında iki kez soruyor.`),
      ]);
      api.cue(question, 'question');
      const askBtn = api.cue(el('button', reveal({ type: 'button', class: 'ctl-btn ctl-btn--step rv rv--rise', style: 'align-self:flex-start;height:56px;font-size:22px;padding:0 20px' }), `${BK.id} hakkında beş soru`), 'questions-button');
      const rows = QUESTIONS.map((row, i) => api.cue(el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:7px 0;border-top:1px solid var(--line)' }, [
        el('span', { style: 'font-size:19px;line-height:1.28' }, [row.who ? el('span', { class: 'muted' }, `${row.who}: `) : null, el('b', {}, row.q)]),
        chip(`${row.model} · sahne ${row.scene}`, 'accent', { style: 'font-size:16px' }),
      ]), `question-${i + 1}`));
      const five = el('div', reveal({ class: 'card rv rv--rise', style: 'padding:12px 18px;display:flex;flex-direction:column' }), [
        cardTitle(`${BK.id} hakkında beş soru`, 'margin-bottom:4px'), ...rows,
        el('p', { style: 'font-size:18px;line-height:1.32;color:var(--text-muted);padding-top:8px;border-top:1px solid var(--line)' }, [el('b', { style: 'color:var(--text)' }, 'Bu derste kuracaklarımız: '), lower1(BUILDS)]),
      ]);
      api.cue(five, 'five');   // ends above the presenter corner (y < 696)
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-width:0' }, [situation, drawBtn, components]);
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-width:0' }, [askBtn, five]);
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:600px 520px minmax(0,1fr);gap:32px;align-items:start;height:100%' }, [left, question, right]));
      const apply = () => {
        const st = Number(body.getAttribute('data-state'));
        showIf(components, st >= 1); showIf(question, st >= 1); showIf(askBtn, st >= 1); showIf(five, st >= 2);
        drawBtn.setAttribute('aria-disabled', st >= 1 ? 'true' : 'false');
        askBtn.setAttribute('aria-disabled', st === 1 ? 'false' : 'true');
      };
      drawBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '0') { body.setAttribute('data-state', '1'); apply(); } });
      askBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '1') { body.setAttribute('data-state', '2'); apply(); } });
      body.reset = () => { body.setAttribute('data-state', '0'); apply(); };
      apply();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('h3', {}, 'Senaryo'),
          el('p', {}, `${ARI.name} (${ARI.id}), ${ROOM} ve ${BK_TIME} için Rezerve et düğmesine bastı. Ekranda şu yazıyor: “${trx(UNKNOWN_MSG)}”`),
          el('h3', {}, 'Bileşenler olarak çizilmiş tüm sistem'),
          el('p', {}, `${listAnd(JB.component_view.map(trx))}. Her kutu doğru, ama hiçbiri ${ARI.name}'ye Rezerve et düğmesine yeniden basıp basmaması gerektiğini söylemiyor.`),
          el('h3', {}, 'Bu haftanın sorusu'),
          el('p', {}, 'Gerçekte sorduğumuz soruyu hangi model yanıtlar? (A) Her parçayı gösteren tek bir ayrıntılı diyagram. (B) Her soru için seçilmiş bir model. (C) Kodun kendisi: en kesin olan odur.'),
        ]),
        el('div', {}, [
          el('h3', {}, `${BK.id} hakkında beş soru`),
          el('ul', {}, QUESTIONS.map((row) => el('li', {}, `${row.who ? `${row.who}: ` : ''}${row.q} → ${row.model} (sahne ${row.scene})`))),
          el('h3', {}, 'Bu derste kuracaklarımız'), el('p', {}, BUILDS),
        ]),
      ]));
    },
  };

  // =====================================================================
  // PAGE · recall and outcomes
  // =====================================================================
  const OUTCOMES = [
    'Davranış, yapı ya da etkileşim sorusuna uygun bir model seçmek.',
    'Bir durum geçişini olayı, koşulu ve sonucuyla okumak.',
    'Saklanan bir rezervasyonu geçici bir arayüz ya da istek durumundan ayırt etmek.',
    'Varlık kimliğini ve ilişkileri, paylaşılan olguları çoğaltmadan açıklamak.',
    'Bir gereksinim, bir diyagram ve bir arayüz mesajı arasındaki çelişkiyi bulmak.',
  ];
  const REGISTER = ['R-01 çakışan onay yok', 'R-02 süre 30–120 dakika', 'R-03 kim iptal edebilir', 'R-04 bildirim ayrı bir iştir', 'R-05 klavye ve durum bilgisi', 'Q-01 arama yanıt süresi'];
  const W2_HANDOFF = 'Yazılı bir kural tek başına rezervasyon, iptal ve hata durumlarının sırasını anlaşılır kılar mı?';
  const UI_ONLY = SM.ui_states.filter((x) => !SM.stored_states.includes(x));   // Draft, Submitting, Rejected, Unknown outcome
  const STATE_SPLIT = `Saklanan bir rezervasyon ${SM.stored_states.map(trx).join(' ya da ')} durumundadır. ${listAnd(UI_ONLY.map(trx))} durumları ekrandaki isteğe aittir; reddedilen bir istek asla onaylanmış bir rezervasyon oluşturmaz.`;
  const NOTATION = 'İlk kullanıldıkları yerde tanıtılan hafif UML tarzı çizimler: yuvarlatılmış kutular durumlardır, bir ok bir olayı ve koşulunu taşır, bir yaşam çizgisi numaralı mesajları taşır.';
  const outcomes = {
    kind: 'page', id: 'outcomes', role: 'page',
    heading: 'Zaten bildikleriniz ve bu dersin hedefi',
    lead: 'Gerçekte sorduğumuz soruyu hangi model yanıtlar?',
    printRole: 'Hatırlatma ve kazanımlar',
    build(body, api) {
      const recall = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:10px;padding:14px 20px' }, [
        cardTitle('2. haftadan: yanınızda getirdiğiniz kural listesi', 'margin-bottom:2px'),
        el('div', { style: 'display:flex;flex-wrap:wrap;gap:8px' }, REGISTER.map((t) => chip(t, 'accent', { style: 'font-size:17px' }))),
        el('p', { style: 'font-size:20px;line-height:1.35' }, [el('span', { class: 'muted' }, '2. hafta bir soruyla bitti: '), el('i', {}, W2_HANDOFF)]),
        el('p', { style: 'font-size:20px;line-height:1.35' }, 'Bir kural neyin geçerli olması gerektiğini söyler. Bu hafta tek bir rezervasyonun durumlarının, verisinin ve mesajlarının nasıl ilerlediğini çiziyoruz; böylece her kuralı sınayabileceğiniz bir çizim ortaya çıkar.'),
      ]);
      api.cue(recall, 'recall');
      const example = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:8px;padding:14px 20px' }, [
        cardTitle('Bu haftanın örneği', 'margin-bottom:2px'),
        el('p', { style: 'font-size:20px;line-height:1.35' }, [el('b', {}, `${ARI.name} ${ARI.id}`), ' ve ', el('b', {}, `${BO.name} ${BO.id}`), ` · ${ROOM} ve ${ROOM2} odaları · `, el('b', {}, BK.id), `: ${ARI.name}'nin ${ROOM} rezervasyonu, ${BK_TIME}, ${trx(BK.state)}.`]),
        el('p', { style: 'font-size:19px;line-height:1.35;color:var(--text-muted)' }, STATE_SPLIT),
      ]);
      api.cue(example, 'example');
      const notation = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:6px;padding:14px 20px' }, [
        cardTitle('Çizimler nasıl okunur', 'margin-bottom:2px'),
        el('p', { style: 'font-size:19px;line-height:1.35' }, NOTATION),
      ]);
      api.cue(notation, 'notation');
      const list = el('ol', { class: 'outcome-list', 'aria-label': 'Bu dersin sonunda şunları yapabileceksiniz', style: 'gap:10px' }, OUTCOMES.map((o, i) => el('li', { style: 'font-size:22px;padding:10px 14px' }, [el('span', { class: 'n', 'aria-hidden': 'true' }, String(i + 1)), el('span', {}, o)])));
      api.cue(list, 'outcomes');
      const right = el('div', {}, [cardTitle('Bu dersin sonunda şunları yapabileceksiniz'), list]);   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { class: 'page-columns' }, [el('div', { style: 'display:flex;flex-direction:column;gap:14px' }, [recall, example, notation]), right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [el('h3', {}, '2. haftadan: yanınızda getirdiğiniz kural listesi'), el('p', {}, `${REGISTER.join('; ')}. 2. hafta bir soruyla bitti: ${W2_HANDOFF}`),
          el('h3', {}, 'Bu haftanın örneği'), el('p', {}, `${ARI.name} ${ARI.id} ve ${BO.name} ${BO.id}; ${ROOM} ve ${ROOM2} odaları; ${BK.id}: ${ARI.name}'nin ${ROOM} rezervasyonu, ${BK_TIME}, ${trx(BK.state)}. ${STATE_SPLIT}`),
          el('h3', {}, 'Çizimler nasıl okunur'), el('p', {}, NOTATION)]),
        el('div', {}, [el('h3', {}, 'Bu dersin sonunda şunları yapabileceksiniz'), el('ol', { class: 'outcome-list' }, OUTCOMES.map((o, i) => el('li', {}, [el('span', { class: 'n' }, String(i + 1)), el('span', {}, o)])))]),
      ]));
    },
  };

  // =====================================================================
  // SCENE 1 · journey-before-boxes (Bridge)
  // =====================================================================
  const STEPS = JB.steps;                        // choose, submit, outcome
  const ROW_KEYS = ['goal', 'action', 'message', 'stored', 'uncertain'];
  const OUT = JB.outcomes;                       // confirmed, rejected, unknown
  const MISS = JB.missing_message;
  const SECOND = MISS.second_press;
  const screenLine = (str, kind) => el('span', { style: `display:block;border:1px solid var(--${kind === 'none' ? 'line' : 'line-strong'});border-radius:8px;background:var(--bg-2);padding:3px 9px;font-size:16px;line-height:1.3;${kind === 'none' ? 'color:var(--text-soft);font-style:italic;' : ''}` }, str);
  /** The component view of the case (the same drawing as the opening page), sized for a panel. */
  function componentSvg(uid, W) {
    const H = 190, C = JB.component_view, bw = 150, bh = 50;
    const svg = window.VC.svg(W, H, { label: `Campus Rooms bileşen görünümü: ${listAnd(C.map(trx))}`, uid });
    const k = W / 564;
    const bx = (x) => Math.round(x * k);
    const boxes = {
      [C[0]]: node({ x: bx(6), y: 70, w: bx(126), h: bh, label: trx(C[0]) }),
      [C[1]]: node({ x: bx(206), y: 70, w: bx(136), h: bh, label: trx(C[1]) }),
      [C[2]]: node({ x: bx(408), y: 6, w: bx(bw), h: bh, label: trx(C[2]) }),
      [C[3]]: node({ x: bx(408), y: 70, w: bx(bw), h: bh, label: trx(C[3]) }),
      [C[4]]: node({ x: bx(408), y: 134, w: bx(bw), h: bh, label: trx(C[4]) }),
      [C[5]]: node({ x: bx(206), y: 134, w: bx(136), h: bh, label: trx(C[5]), kind: 'store' }),
    };
    Object.values(boxes).forEach((b) => { svg.appendChild(b); b.querySelectorAll('.n-label').forEach((t) => { t.style.fontSize = W < 500 ? '16px' : '19px'; }); });
    arrow(svg, { fromBox: boxes[C[0]], toBox: boxes[C[1]] });
    arrow(svg, { fromBox: boxes[C[1]], toBox: boxes[C[2]], fromSide: 'right', toSide: 'left' });
    arrow(svg, { fromBox: boxes[C[1]], toBox: boxes[C[3]] });
    arrow(svg, { fromBox: boxes[C[1]], toBox: boxes[C[4]], fromSide: 'right', toSide: 'left' });
    arrow(svg, { fromBox: boxes[C[1]], toBox: boxes[C[5]] });
    return svg;
  }
  const journeyBeforeBoxes = {
    id: 'journey-before-boxes', role: 'bridge',
    heading: `${ARI.name}, Rezerve et düğmesine bastıktan sonra neyi bilmeli?`,
    lead: 'Hiçbir iç kutu çizmeden önce tek bir kişiyi sıradan bir rezervasyon boyunca izleyin: her adımda hedefi, eylemi, ekranda yazanı ve hâlâ belirsiz olanı.',
    principle: 'Bir kullanıcı yolculuğu, iç bileşen diyagramının gözden kaçırabileceği bilgi ihtiyaçlarını ortaya çıkarır.',
    principleShort: 'Önce kişiyi izleyin; kutular onun neye ihtiyaç duyduğunu gösteremez.',
    conditions: [
      { id: 'message-shown', baseline: true, label: `Başlangıç: ekran ${ARI.name}'ye her sonucu söylüyor`, short: 'Ekran söylüyor',
        states: [
          { prompt: { question: `${ARI.name}, Rezerve et düğmesine bastıktan sonra neyi bilmeli?`, options: ['İsteğin gönderildiğini', 'Rezervasyonun onaylanıp onaylanmadığını', 'İsteği hangi sunucunun işlediğini'] }, caption: `Bir kişi, sıradan bir rezervasyon: ${ARI.name}, ${BK.start} ile ${BK.end} arası için ${ROOM}'i istiyor. Yolculuğu izlemek için İleri'ye basın.` },
          { caption: `**${trx(STEPS[0].title)}.** Hedef boş bir oda; ekran da ${ROOM}'in boş olduğunu söylüyor. Hâlâ belirsiz olan: başka biri odayı ondan önce rezerve edebilir.` },
          { caption: `**${trx(STEPS[1].title)}.** ${ARI.name}, Rezerve et düğmesine basıyor ve **${trx(STEPS[1].message)}** mesajını görüyor. Bu **istek gönderildi** demektir; gönderildi demek onaylandı demek değildir.` },
          { caption: `**${trx(STEPS[2].title)}.** Ekran ${BK.id} ile birlikte **rezervasyon onaylandı** diyor; arka planda da ${BK.id}, ${trx(BK.state)} olarak saklanıyor. Oda hakkında açık bir nokta kalmıyor.` },
          { caption: `Son adım üç şekilde bitebilir: **${trx(OUT[0].label)}**, **${trx(OUT[1].label)}** ya da **${trx(OUT[2].label)}**. Her mesaj farklı bir sonraki eyleme götürür.` },
          { caption: `Bileşenler olarak aynı rezervasyon: doğru kutular, doğru oklar; ama ${ARI.name}'ye bundan sonra ne söylenmesi gerektiğine yer yok. Bu ihtiyacı önce yolculuk buldu.` },
          { caption: `Yolculuk, ${ARI.name}'nin her adımda neye ihtiyaç duyduğunu sordu; cevap üç farklı mesaja dönüştü.`, principle: true },
        ] },
      { id: 'message-missing', label: `Değişiklik: ${BK.id} saklandı, hiçbir mesaj gösterilmiyor`, short: 'Mesaj yok',
        states: [
          { caption: `Aynı istek, aynı saklanan sonuç: **${trx(MISS.stored)}**. Tek bir şey değişiyor: ${trx(MISS.screen)}.` },
          { caption: `Sistem şunu biliyor: **${trx(MISS.stored)}**. ${ARI.name} hiçbir mesaj görmüyor ve **${trx(MISS.belief)}** diye düşünüyor. Aynı an, iki farklı resim.` },
          { caption: `Bu yüzden ${ARI.name}, Rezerve et düğmesine yeniden basıyor. Yeni istek ${BK.id} ile çakışıyor ve ${SECOND.rule} onu reddediyor: **${trx(SECOND.message)}**` },
          { caption: `Tekrarlanan tıklama yanıltıcıdır: ${trx(SECOND.consequence)}.` },
          { caption: `Tek bir eksik mesaj, saklanmış bir rezervasyonu ${ARI.name}'nin zihninde kaybedilmiş bir odaya dönüştürdü.`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:16px' });
      // ---- the journey grid: aspects as rows, steps as columns
      const grid = el('div', { style: 'display:grid;grid-template-columns:176px repeat(3,minmax(0,1fr));gap:6px 12px;align-items:stretch' });
      grid.appendChild(el('div'));
      h.heads = STEPS.map((stp, i) => {
        const head = el('div', { class: 'fx', style: 'display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;border:1.5px solid var(--line-strong);background:var(--surface-2);font-size:20px;font-weight:700' }, [
          el('span', { style: 'display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:var(--accent);color:var(--ink-on-light);font-size:17px;font-weight:800' }, String(i + 1)), trx(stp.title),
        ]);
        grid.appendChild(api.cue(head, `step-${i + 1}`));
        return head;
      });
      h.cells = {};
      JB.rows.forEach((label, r) => {
        const key = ROW_KEYS[r];
        grid.appendChild(api.cue(el('div', { style: `display:flex;align-items:center;font-size:17px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--${key === 'stored' ? 'ok' : key === 'message' ? 'accent-strong' : 'text-soft'})` }, trx(label)), `row-${key}`));
        STEPS.forEach((stp, i) => {
          const cell = el('div', { class: 'rv rv--rise', style: `padding:6px 12px;border-radius:10px;background:var(--surface);border:1px solid var(--line);font-size:17px;line-height:1.3;display:flex;align-items:center;${key === 'stored' ? 'border-left:4px solid var(--ok);' : ''}` });
          grid.appendChild(api.cue(cell, `cell-${key}-${i + 1}`));
          h.cells[`${key}-${i + 1}`] = cell;
        });
      });
      wrap.appendChild(grid);
      // ---- bottom: outcomes or the second press (left), components or the two pictures (right)
      const bottom = el('div', { style: 'display:grid;grid-template-columns:744px minmax(0,1fr);gap:20px;min-height:0;align-items:start' });
      const outRows = OUT.map((o) => ({ attrs: { class: `jb-out-${o.id}` }, cells: {
        out: chip(trx(o.label), o.id === 'confirmed' ? 'ok' : o.id === 'rejected' ? 'bad' : 'warn', { style: 'font-size:15px;white-space:normal' }),
        says: el('span', { style: 'font-size:16px;line-height:1.28' }, trx(o.message)), stored: el('span', { style: 'font-size:16px' }, trx(o.stored)), next: el('span', { style: 'font-size:16px' }, trx(o.next)) } }));
      h.outcomes = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'message-shown', style: 'padding:10px 14px' }), [
        cardTitle('Sonuç adımı üç şekilde bitebilir', 'margin-bottom:4px;font-size:18px'),
        table({ captionHidden: `Üç sonuç: ekranda yazan, saklanan ve ${ARI.name}'nin sonraki adımı`, cls: 'data-table--compact', columns: [{ key: 'out', label: 'Sonuç' }, { key: 'says', label: 'Ekranda yazan' }, { key: 'stored', label: 'Saklanan' }, { key: 'next', label: 'Sonraki adım' }], rows: outRows }),
      ]);
      h.outcomes.querySelectorAll('td, th').forEach((c) => { c.style.padding = '5px 8px'; });
      // Turkish runs longer: the screen-message column gets the room (widths of the 716 px table, padding excluded)
      h.outcomes.querySelectorAll('thead th').forEach((c, i) => { c.style.fontSize = '15px'; c.style.width = ['104px', '300px', '118px', '130px'][i]; });
      h.outcomes.querySelectorAll('tbody tr').forEach((tr, i) => api.cue(tr, `outcome-${OUT[i].id}`));
      api.cue(h.outcomes, 'outcomes');
      h.second = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'message-missing', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:8px' }), [
        cardTitle(`${ARI.name}, Rezerve et düğmesine yeniden basıyor`, 'margin-bottom:0;font-size:18px'),
        el('div', { style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'İstek: '), trx(SECOND.request)]),
        el('div', { style: 'font-size:18px;line-height:1.3' }, [el('b', {}, `${SECOND.rule}: `), trx(SECOND.result)]),
        el('div', { class: 'status status--bad', role: 'status', style: 'font-size:18px;min-height:0;padding:8px 12px' }, [el('span', { class: 'ico', 'aria-hidden': 'true' }, '✕'), el('span', {}, trx(SECOND.message))]),
        (h.consequence = el('div', reveal({ class: 'callout callout--bad rv rv--rise', 'data-show-from': '3', style: 'font-size:18px;padding:8px 14px;line-height:1.3' }), [el('b', {}, 'Bunun sonucu: '), trx(SECOND.consequence) + '.'])),
      ]);
      api.cue(h.second, 'second-press'); api.cue(h.consequence, 'consequence');
      const left = el('div', { style: 'display:grid;min-width:0' }, [h.outcomes, h.second]);
      h.outcomes.style.gridArea = '1 / 1'; h.second.style.gridArea = '1 / 1';
      h.components = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'message-shown', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:6px' }), [
        cardTitle('Bileşenler olarak aynı rezervasyon', 'margin-bottom:0;font-size:18px'),
        componentSvg((x) => api.uid(`cmp-${x}`), 470),
        el('p', { style: 'font-size:17px;line-height:1.3' }, [el('b', {}, 'Hiçbir kutu, '), `${ARI.name}'ye bundan sonra ne söylenmesi gerektiğini göstermiyor.`]),
      ]);
      api.cue(h.components, 'components');
      h.pictures = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'message-missing', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:10px' }), [
        cardTitle('Aynı anın iki resmi', 'margin-bottom:0;font-size:18px'),
        el('div', { class: 'callout callout--ok', style: 'font-size:18px;padding:8px 14px' }, [el('b', {}, 'Sistem: '), trx(MISS.stored)]),
        el('div', { class: 'callout', style: 'font-size:18px;padding:8px 14px' }, [el('b', {}, `${ARI.name}: `), `“${upper1(trx(MISS.belief))}?”`]),
      ]);
      api.cue(h.pictures, 'two-pictures');
      const right = el('div', { style: 'display:grid;min-width:0' }, [h.components, h.pictures]);
      h.components.style.gridArea = '1 / 1'; h.pictures.style.gridArea = '1 / 1';
      bottom.append(left, right);
      wrap.appendChild(bottom);
      stage.appendChild(wrap);
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'message-shown';
      STEPS.forEach((stp, i) => {
        ROW_KEYS.forEach((key) => {
          const cell = h.cells[`${key}-${i + 1}`];
          let value = trx(stp[key]);   // display text only
          let kind = null;
          if (!base && i === 2) {
            if (key === 'message') { value = trx(MISS.screen); kind = 'none'; }
            if (key === 'stored') value = trx(MISS.stored);
            if (key === 'uncertain') value = `${ARI.name} bunu bilemez: ${trx(MISS.belief)}`;
          }
          cell.replaceChildren(key === 'message' ? screenLine(value, kind) : el('span', {}, value));
          cell.style.borderColor = (!base && i === 2 && (key === 'message' || key === 'uncertain')) ? 'var(--warn)' : 'var(--line)';
          if (key === 'stored') cell.style.borderLeftColor = 'var(--ok)';
          showIf(cell, base ? st >= i + 1 : true);
        });
        const current = base ? (st >= 1 && st <= 3 ? st - 1 : -1) : (st <= 1 ? 2 : -1);
        focusIf(h.heads[i], current === i);
        h.heads[i].style.borderColor = current === i ? 'var(--warn)' : 'var(--line-strong)';
      });
      showIf(h.outcomes, base && st >= 4); focusIf(h.outcomes, base && st === 4);
      showIf(h.components, base && st >= 5); focusIf(h.components, base && st === 5);
      showIf(h.pictures, !base && st >= 1); focusIf(h.pictures, !base && st === 1);
      showIf(h.second, !base && st >= 2); focusIf(h.second, !base && st >= 2 && st <= 3);
    },
    print: [
      { title: 'Tek bir yolculuk: mesaj ve saklanan durum ayrı satırlarda, üç sonuçla birlikte', condition: 'message-shown', state: 5, note: `Bir oda seç, isteği gönder, sonucu gözlemle. “${trx(STEPS[1].message)}” mesajı isteğin gönderildiği anlamına gelir, rezervasyonun onaylandığı anlamına gelmez. Sonuç adımı şu şekillerde biter: ${OUT.map((o) => `${trx(o.label)} (sonraki adım: ${trx(o.next)})`).join('; ')}. ${listAnd(JB.component_view.map(trx))} bileşenlerinden oluşan bir bileşen görünümü doğrudur, ama yine de ${ARI.name}'ye ne söylenmesi gerektiğine yer vermez.` },
      { title: 'Onay mesajı eksik olduğunda aynı yolculuk', condition: 'message-missing', state: 3, principle: true, note: `${upper1(trx(MISS.label))}. Sistem şunu biliyor: ${trx(MISS.stored)}; ${ARI.name} ise “${trx(MISS.belief)}” diye düşünüyor. Rezerve et düğmesine yeniden basmak aynı isteği gönderir; ${SECOND.rule}, ${BK.id} ile çakıştığı için bu isteği reddeder: “${trx(SECOND.message)}” ${upper1(trx(SECOND.consequence))}.` },
    ],
  };

  // =====================================================================
  // SCENE 2 · state-machine (Anchor)
  // =====================================================================
  const UIS = SM.ui_states;                      // Draft, Submitting, Confirmed, Rejected, Unknown outcome
  const UIT = SM.ui_transitions;                 // Submit; response: accepted / rejected / lost or timeout
  const STT = SM.stored_transitions[0];          // Confirmed --Cancel [R-03 allows]--> Cancelled
  const REF = SM.curriculum_refinement;
  const EXAMPLES = REF.examples;
  const evt = (to) => UIT.find((t) => t.to === to).event;
  const SAFETY = { q: REF.questions[0], name: REF.names[0], example: EXAMPLES['safety invariant'] };
  const PROGRESS = { q: REF.questions[1], name: REF.names[1], example: EXAMPLES['progress property'] };
  const stateMachine = {
    id: 'state-machine', role: 'anchor',
    heading: 'Ekran “Sonuç bilinmiyor” diyor. Rezervasyon da mı bilinmiyor?',
    lead: 'Bilerek ayrı tutulan iki durum modeli: ekranın gördüğü hâliyle istek ve saklandığı hâliyle rezervasyon. Bir işaretçi yalnızca geçerli bir olay geldiğinde hareket eder.',
    principle: 'Durum modelleri, olası değişiklikleri, onları neyin tetiklediğini ve hangi olguların gerçekten bilindiğini netleştirir.',
    principleShort: 'Neyin değişebileceğini, neyin tetiklediğini ve neyin bilindiğini gösterin.',
    conditions: [
      { id: 'from-draft', baseline: true, label: "Başlangıç: Taslak'tan sonuca tek bir istek", short: "Taslak'tan",
        states: [
          { prompt: { question: `${ARI.name} Taslak durumunda ve Gönder'e basıyor. Gönder ne anlama gelir?`, options: ['Rezervasyon artık var', 'Bir istek yolda', `Oda ${ARI.name} için tutuluyor`] }, caption: `Üstte: ${ARI.name}'nin ekranındaki istek. Altta: saklanan rezervasyon. İşaretçi **${trx(UIS[0])}** üzerinde; henüz hiçbir şey saklanmadı.` },
          { caption: `**${trx(UIT[0].event)}** bir olaydır; bu yüzden işaretçi **${trx(UIS[1])}** durumuna geçer: istek yolda ve henüz hiçbir şeye karar verilmedi. Depoda henüz rezervasyon yok.` },
          { caption: `${trx(UIS[1])} durumundan üç olayla çıkılabilir: **${trx(evt('Confirmed'))}**, **${trx(evt('Rejected'))}** ve **${trx(evt('Unknown outcome'))}**. Her biri kendi durumuna götürür.` },
          { caption: `Reddedilirse: işaretçi **Reddedildi** durumuna geçer ve depo boş kalır. Reddedilen bir istek asla onaylanmış bir rezervasyon oluşturmaz.` },
          { caption: `Kabul edilirse: servis karar verir ve **${BK.id}** rezervasyonunu saklar. Rezervasyon ilk saklanan durumunu, yani **Onaylandı** durumunu alır; ekrandaki Onaylandı da bunu bildirir.` },
          { caption: `Şimdi yanıt kayboluyor. Ekran yalnızca **Sonuç bilinmiyor** gösterebilir; oysa saklanan rezervasyon hâlâ **Onaylandı** durumunda. Zaman aşımı eksik bilgidir.` },
          { caption: `Tek bir geçişi okuyun: **olay** ${trx(STT.event)}, **koşul** ${trx(STT.condition)}, **sonuç** ${trx(STT.to)}. Yalnızca saklanan model değişir.` },
          { caption: 'İki model, iki işaretçi; her işaretçi yalnızca geçerli bir olayla hareket eder.', principle: true },
        ] },
      { id: 'already-cancelled', label: `Değişiklik: ${BK.id} İptal edildi; İptal olayı yine geliyor`, short: 'Yeniden iptal',
        states: [
          { prompt: { question: `${BK.id} zaten İptal edildi durumunda ve İptal olayı yeniden geliyor. Ne olmalı?`, options: ['İkinci kez iptal etmek', '“Zaten iptal edildi” yanıtını vermek', 'Onaylandı durumuna geri döndürmek'] }, caption: `Aynı iki model. Saklanan modelin işaretçisi **${trx(SM.repeated_cancel.from)}** üzerinde ve ${BK.id} için ikinci bir ${trx(SM.repeated_cancel.event)} olayı geliyor.` },
          { caption: `Tanımlı yanıt **kararlı bir tekrar yanıtıdır**: zaten iptal edildi, geçiş yok. Kazara olacak olan ise ${lower1(trx(SM.accidental_repeat).split(': ')[0])} olurdu: iki iptal, ikinci bir bildirim.` },
          { caption: `İki ok bilerek eksik: **${trx(SM.absent_transitions[0]).replace('->', '→')}** ve **${trx(SM.absent_transitions[1]).replace('->', '→')}**. Bir modelin dışarıda bıraktığı şey de bir karardır.` },
          { caption: `İki tür soru: **${lower1(trx(SAFETY.q))}** sorusu güvenlikle, **${lower1(trx(PROGRESS.q))}** sorusu ilerlemeyle ilgilidir. Oklar ilk soruyu yalnızca model için yanıtlar.` },
          { caption: 'Tekrarlanan bir olay, iki eksik ok ve iki tür soru; hepsi tek bir küçük modelde okunabiliyor.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:930px minmax(0,1fr);gap:20px' });
      const W = 930, H = 680;
      const svg = window.VC.svg(W, H, { label: 'İki durum modeli: ekranın gördüğü hâliyle istek ve saklanan rezervasyon', uid: (x) => api.uid(x) });
      // lanes
      const lane = (y, hgt, title, color) => {
        const g = s('g', {});
        g.appendChild(s('rect', { x: 1, y, width: W - 2, height: hgt, rx: 18, ry: 18, fill: 'rgba(124,196,255,0.035)', stroke: 'var(--line)', 'stroke-width': 1.5 }));
        g.appendChild(text(22, y + 32, title, { style: `font-size:16px;font-weight:700;letter-spacing:0.08em;fill:var(--${color})` }));
        svg.appendChild(g);
        return g;
      };
      h.topLane = lane(0, 318, `İSTEK · ${ARI.name.toLocaleUpperCase('tr')}'NİN EKRANININ GÖRDÜĞÜ HÂLİYLE`, 'accent-strong');
      h.topLane.classList.add('dm');
      lane(338, 342, 'REZERVASYON · SAKLANDIĞI HÂLİYLE', 'ok');
      // request states
      const box = {};
      box.Draft = stateNode(20, 140, 150, trx(UIS[0]));
      box.Submitting = stateNode(260, 140, 190, trx(UIS[1]));
      box.Rejected = stateNode(640, 40, 240, 'Reddedildi');
      box.Unknown = stateNode(640, 140, 240, 'Sonuç bilinmiyor');
      box.UIConfirmed = stateNode(640, 240, 240, 'Onaylandı');
      // stored states
      h.start = s('circle', { cx: 60, cy: 520, r: 12, fill: 'var(--text)' });
      box.Confirmed = stateNode(200, 489, 200, trx(SM.stored_states[0]));
      box.Cancelled = stateNode(640, 489, 220, trx(SM.stored_states[1]));
      Object.entries(box).forEach(([k, b]) => { svg.appendChild(b); api.cue(b, `state-${k.toLowerCase()}`); });
      svg.appendChild(h.start); api.cue(h.start, 'start');
      [box.Draft, box.Submitting, box.Rejected, box.Unknown, box.UIConfirmed].forEach((b) => h.topLane.appendChild(b));
      // request transitions
      h.aSubmit = arrow(svg, { from: { x: 170, y: 171 }, to: { x: 260, y: 171 }, kind: 'accent', label: trx(UIT[0].event) });
      h.aRejected = arrow(svg, { from: { x: 450, y: 165 }, to: { x: 640, y: 76 }, kind: 'default', label: trx(evt('Rejected')), labelDy: -14, labelDx: -34 });
      h.aUnknown = arrow(svg, { from: { x: 450, y: 171 }, to: { x: 640, y: 171 }, kind: 'default', label: ['yanıt kayboldu', 'ya da zaman aşımı'], labelDy: -12 });
      h.aAccepted = arrow(svg, { from: { x: 450, y: 177 }, to: { x: 640, y: 266 }, kind: 'default', label: trx(evt('Confirmed')), labelDy: 34, labelDx: -34 });
      [h.aSubmit, h.aRejected, h.aUnknown, h.aAccepted].forEach((a) => h.topLane.appendChild(a));
      api.cue(h.aSubmit, 'event-submit'); api.cue(h.aRejected, 'event-rejected'); api.cue(h.aUnknown, 'event-lost'); api.cue(h.aAccepted, 'event-accepted');
      // stored transitions
      h.aStored = arrow(svg, { from: { x: 72, y: 520 }, to: { x: 200, y: 520 }, kind: 'ok', label: ['karar verildi', 've saklandı'], labelDy: -44 });
      h.aCancel = arrow(svg, { from: { x: 400, y: 520 }, to: { x: 640, y: 520 }, kind: 'ok', label: `${trx(STT.event)} [${trx(STT.condition)}]` });
      api.cue(h.aStored, 'event-stored'); api.cue(h.aCancel, 'event-cancel');
      // the screen's Confirmed reports the stored booking
      h.reports = arrow(svg, { from: { x: 690, y: 302 }, to: { x: 340, y: 489 }, kind: 'accent', dashed: true, label: `${BK.id}'i bildirir`, labelDy: -6 });
      api.cue(h.reports, 'reports');
      h.nothing = badge({ x: 136, y: 612, label: 'hiçbir şey saklanmadı', kind: 'warn' });
      h.bid = badge({ x: 300, y: 590, label: BK.id, kind: 'ok' });
      svg.append(h.nothing, h.bid); api.cue(h.nothing, 'nothing-stored'); api.cue(h.bid, 'booking-id');
      // changed condition: the repeated Cancel, the accident, the absent arrows
      h.loop = arrow(svg, { from: { x: 800, y: 489 }, via: [{ x: 800, y: 432 }, { x: 912, y: 432 }, { x: 912, y: 520 }], to: { x: 860, y: 520 }, kind: 'violet', label: 'İptal: zaten iptal edildi', labelDy: -14, labelDx: -96 });
      api.cue(h.loop, 'repeated-cancel');
      h.ghost = s('g', {});
      h.ghost.appendChild(s('rect', { x: 640, y: 604, width: 220, height: 52, rx: 26, ry: 26, fill: 'var(--bad-fill)', stroke: 'var(--bad)', 'stroke-width': 2, 'stroke-dasharray': '8 6' }));
      h.ghost.appendChild(text(750, 637, 'ikinci iptal', { 'text-anchor': 'middle', style: 'font-size:19px;fill:var(--bad)' }));
      const ga = arrow(svg, { from: { x: 750, y: 551 }, to: { x: 750, y: 604 }, kind: 'bad', dashed: true });
      h.ghost.appendChild(ga); h.ghost.appendChild(markX(750, 578, 11));
      svg.appendChild(h.ghost); api.cue(h.ghost, 'accidental-repeat');
      h.absentStored = arrow(svg, { from: { x: 640, y: 540 }, to: { x: 400, y: 540 }, kind: 'bad', dashed: true, bend: -46, label: 'kasıtlı olarak yok', labelDy: 40 });
      h.absentStored.appendChild(markX(520, 563, 12));
      api.cue(h.absentStored, 'absent-cancelled-confirmed');
      h.absentUi = arrow(svg, { from: { x: 880, y: 71 }, via: [{ x: 912, y: 71 }, { x: 912, y: 271 }], to: { x: 880, y: 271 }, kind: 'bad', dashed: true });
      h.absentUi.appendChild(markX(912, 171, 12));
      api.cue(h.absentUi, 'absent-rejected-confirmed');
      h.uiMarker = marker(svg, 'ui-marker'); h.stMarker = marker(svg, 'stored-marker');
      h.box = box;
      // nodes carry a translate; the print view resets transforms on .rv, so the reveal class goes on a wrapper
      h.outWrap = [box.Rejected, box.Unknown, box.UIConfirmed].map((n) => { const w = s('g', { class: 'rv' }); n.parentNode.insertBefore(w, n); w.appendChild(n); return w; });
      [h.aRejected, h.aUnknown, h.aAccepted, h.aStored, h.aCancel, h.reports, h.nothing, h.bid, h.loop, h.ghost, h.absentStored, h.absentUi].forEach((n) => n.classList.add('rv'));
      wrap.appendChild(api.cue(svg, 'models'));
      // ---- notes column: the legend, then one note per moment
      const glyph = (kind) => {
        const g = window.VC.svg(44, 26, { label: GLYPH_TR[kind], uid: (x) => api.uid(`lg-${kind}-${x}`) });
        if (kind === 'state') g.appendChild(s('rect', { x: 2, y: 3, width: 40, height: 20, rx: 10, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 }));
        if (kind === 'current') g.appendChild(s('rect', { x: 2, y: 2, width: 40, height: 22, rx: 11, fill: 'none', stroke: 'var(--warn)', 'stroke-width': 4 }));
        if (kind === 'start') g.appendChild(s('circle', { cx: 22, cy: 13, r: 8, fill: 'var(--text)' }));
        if (kind === 'event') arrow(g, { from: { x: 2, y: 13 }, to: { x: 42, y: 13 }, kind: 'accent' });
        if (kind === 'absent') { arrow(g, { from: { x: 2, y: 13 }, to: { x: 42, y: 13 }, kind: 'bad', dashed: true }); g.appendChild(markX(22, 13, 7)); }
        g.style.width = '44px'; g.style.height = '26px'; g.style.flex = '0 0 auto';
        return g;
      };
      const lg = (kind, label) => el('div', { style: 'display:flex;align-items:center;gap:10px;font-size:17px;line-height:1.25' }, [glyph(kind), el('span', {}, label)]);
      const legendCard = el('div', { class: 'card', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:6px' }, [
        cardTitle('Nasıl okunur', 'margin-bottom:2px;font-size:17px'),
        lg('state', 'bir durum'), lg('event', 'olay [koşul]'), lg('current', 'şu anki durum'), lg('start', 'başlangıç: henüz hiçbir şey yok'), lg('absent', 'kasıtlı olarak yok'),
      ]);
      api.cue(legendCard, 'legend');
      const note = (name, from, until, cond, children, extra) => {
        const n = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': cond, 'data-show-from': String(from), 'data-show-until': String(until), style: `padding:12px 14px;display:flex;flex-direction:column;gap:8px;grid-area:1 / 1;${extra || ''}` }), children);
        return api.cue(n, name);
      };
      h.noteLost = note('note-timeout', 5, 5, 'from-draft', [
        cardTitle('Zaman aşımı eksik bilgidir', 'margin-bottom:0;font-size:17px;color:var(--warn)'),
        el('p', { style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'Ekran: '), 'Sonuç bilinmiyor']),
        el('p', { style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'Depo: '), `${BK.id} Onaylandı`]),
        el('p', { style: 'font-size:17px;line-height:1.3;color:var(--text-muted)' }, `${upper1(trx(SM.note))}.`),
      ], 'border-color:var(--warn)');
      h.noteTransition = note('note-transition', 6, 7, 'from-draft', [
        cardTitle('Bir geçişi sesli okuyalım', 'margin-bottom:0;font-size:17px'),
        el('p', { style: 'font-size:18px;line-height:1.35' }, [el('b', {}, 'Olay: '), trx(STT.event)]),
        el('p', { style: 'font-size:18px;line-height:1.35' }, [el('b', {}, 'Koşul: '), trx(STT.condition)]),
        el('p', { style: 'font-size:18px;line-height:1.35' }, [el('b', {}, 'Sonuç: '), `${trx(STT.from)} → ${trx(STT.to)}`]),
      ]);
      h.noteRepeat = note('note-repeat', 1, 2, 'already-cancelled', [
        cardTitle(`${trx(SM.repeated_cancel.event)}, yeniden`, 'margin-bottom:0;font-size:17px'),
        el('div', { class: 'callout callout--ok', style: 'font-size:17px;padding:6px 12px;line-height:1.3' }, [el('b', {}, 'Tanımlı: '), `“Zaten iptal edildi. Hiçbir şey değişmedi.”`]),
        el('div', { class: 'callout callout--bad', style: 'font-size:17px;padding:6px 12px;line-height:1.3' }, [el('b', {}, 'Kazara: '), trx(SM.accidental_repeat).split(': ')[1] + '.']),
      ]);
      h.noteQuestions = note('note-questions', 3, 4, 'already-cancelled', [
        el('div', { style: 'display:flex;flex-direction:column;gap:4px' }, [
          chip(trx(SAFETY.name), 'ok', { style: 'font-size:15px;align-self:flex-start' }),
          el('p', { style: 'font-size:17px;line-height:1.28' }, [el('b', {}, trx(SAFETY.q)), ` ${trx(SAFETY.example)}.`]),
          el('p', { class: 'muted', style: 'font-size:16px;line-height:1.28' }, 'Modelde geri götüren hiçbir ok yok. Kodun ise ayrı bir kontrolü gerekir.'),
        ]),
        el('div', { style: 'display:flex;flex-direction:column;gap:4px;border-top:1px solid var(--line);padding-top:8px' }, [
          chip(trx(PROGRESS.name), 'violet', { style: 'font-size:15px;align-self:flex-start' }),
          el('p', { style: 'font-size:17px;line-height:1.28' }, [el('b', {}, trx(PROGRESS.q)), ` ${trx(PROGRESS.example)}.`]),
          el('p', { class: 'muted', style: 'font-size:16px;line-height:1.28' }, 'Oklar buna izin verir, ama bunu gerçekleştirmez. Bunun için bir durum kontrolü ve bir kurtarma yolu gerekir.'),
        ]),
      ]);
      const notes = el('div', { style: 'display:grid;align-content:start;min-height:0' }, [h.noteLost, h.noteTransition, h.noteRepeat, h.noteQuestions]);
      wrap.appendChild(el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-width:0;min-height:0' }, [legendCard, notes]));
      stage.appendChild(wrap);
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'from-draft';
      const b = h.box;
      const outcomesShown = !base || st >= 2;
      [...h.outWrap, h.aRejected, h.aUnknown, h.aAccepted].forEach((n) => showIf(n, outcomesShown));
      showIf(h.aStored, !base || st >= 4);
      showIf(h.aCancel, !base || st >= 6);
      showIf(h.reports, base && st === 4);
      showIf(h.nothing, base && st === 3);
      showIf(h.bid, !base || st >= 4);
      showIf(h.loop, !base && st >= 1);
      showIf(h.ghost, !base && st === 1);
      showIf(h.absentStored, !base && st >= 2);
      showIf(h.absentUi, !base && st >= 2);
      h.topLane.classList.toggle('is-dim', (base && st >= 6) || (!base && st !== 2));
      const ui = base ? [b.Draft, b.Submitting, b.Submitting, b.Rejected, b.UIConfirmed, b.Unknown, null, null][st] : null;
      const stored = base ? [null, null, null, null, b.Confirmed, b.Confirmed, b.Cancelled, b.Cancelled][st] : b.Cancelled;
      h.uiMarker.to(ui); h.stMarker.to(stored);
      focusIf(h.aCancel, base && st === 6);
    },
    print: [
      { title: 'İki durum modeli: Gönderiliyor durumundan üç çıkış ve kaybolan bir yanıt', condition: 'from-draft', state: 5, note: `İstek modeli: ${UIT.map((t) => `“${trx(t.event)}” olayıyla ${trx(t.from)} → ${trx(t.to)}`).join('; ')}. Saklanan model: kabul edilen bir istek ${BK.id} rezervasyonunu Onaylandı durumunda oluşturur; reddedilen bir istek hiçbir şey saklamaz. Yanıt kaybolduğunda ekran Sonuç bilinmiyor gösterirken saklanan rezervasyon hâlâ Onaylandı durumundadır. Zaman aşımı eksik bilgidir: ekran bilmese de rezervasyon var olabilir; ayrıca ${trx(SM.note)}.` },
      { title: 'Saklanan modelde tek bir geçiş: olay, koşul, sonuç', condition: 'from-draft', state: 6, note: `Olay: ${trx(STT.event)}; koşul: ${trx(STT.condition)}; sonuç: ${trx(STT.from)} → ${trx(STT.to)}. Yalnızca saklanan model değişir; istek modeli ekrana aittir.` },
      { title: 'Yeniden iptal, bilerek dışarıda bırakılan oklar ve iki tür soru', condition: 'already-cancelled', state: 3, principle: true, note: `İptal edilmiş bir rezervasyon için gelen ikinci bir İptal olayı, hiçbir geçiş olmadan tanımlı yanıtı alır: “Zaten iptal edildi. Hiçbir şey değişmedi.” Kazara olacak olan ise ${trx(SM.accidental_repeat).split(': ')[0]} olurdu: ${trx(SM.accidental_repeat).split(': ')[1]}. Bilerek çizilmeyen oklar: ${SM.absent_transitions.map((x) => trx(x).replace('->', '→')).join(', ')}. ${upper1(trx(SAFETY.name))}: ${trx(SAFETY.q)} (${trx(SAFETY.example)}). ${upper1(trx(PROGRESS.name))}: ${trx(PROGRESS.q)} (${trx(PROGRESS.example)}). Oklar neyin izinli olduğunu gösterir; kodun bu oklara uyup uymadığı ve bekleyen işin tamamlanıp tamamlanmadığı ise ayrı kontroller ve bir kurtarma yolu gerektirir.` },
    ],
  };

  // =====================================================================
  // SCENE 3 · identity-and-data (Anchor)
  // =====================================================================
  const CAP0 = ID.room_before.capacity;                       // 12
  const CAP1 = ID.copied_capacity_defect.room_capacity_changes_to;   // 10
  const RB = ID.bookings;                                     // B-001 (U-01), B-003 (U-02), both C101
  const RN = ID.rename;
  const SNAP = ID.historical_snapshot;
  const IDX = ID.id_examples;                                 // C101, C303, 101-C
  const CHECKQ = ID.check_questions;
  const ENT = ID.entities;                                    // User, Room, Booking with their fields
  const recordLine = (k, v, attrs) => el('div', Object.assign({ style: 'display:grid;grid-template-columns:150px minmax(0,1fr);gap:10px;font-size:18px;line-height:1.3;padding:3px 0' }, attrs || {}), [el('span', { class: 'muted', style: 'font-family:var(--font-mono);font-size:16px' }, k), el('span', { style: 'font-weight:600' }, v)]);
  const identityAndData = {
    id: 'identity-and-data', role: 'anchor',
    heading: 'Bir oda değiştiğinde, olgularının hangi kopyası doğrudur?',
    lead: `${RB[0].id} ve ${RB[1].id}, ${ROOM}'in kapasitesini kendi kayıtlarına kopyaladı. Sonra oda değişiyor. Her kaydın ne söylediğini tahmin edin, sonra odaya tek bir kimlik verin.`,
    principle: 'Bir olgunun nerede saklanacağına karar vermeden önce kimliği ve olgunun anlamını modelleyin.',
    principleShort: 'Önce olgunun ne anlama geldiğine, sonra nerede duracağına karar verin.',
    conditions: [
      { id: 'copied-facts', baseline: true, label: 'Başlangıç: her rezervasyon odanın olgularını kopyalıyor', short: 'Kopyalanan olgular',
        states: [
          { prompt: { question: `${ROOM}'in kapasitesi ${CAP0}'den ${CAP1}'a değişiyor. ${RB[0].id} ve ${RB[1].id} ne diyor?`, options: [`İkisi de ${CAP1} diyor: odayı izliyorlar`, `İkisi de hâlâ ${CAP0} diyor`, `Yalnızca daha yeni olan ${CAP1} diyor`] }, caption: `${ROOM} için iki rezervasyon. Her biri oluşturulurken odanın kapasitesini kendi kaydına kopyaladı: **${CAP0}**.` },
          { caption: `Odanın kapasitesi **${CAP1}** oluyor. İki kopya da hâlâ **${CAP0}** diyor: artık iki kayıt odayla çelişiyor ve hiçbiri hangi değerin doğru olduğunu bilmiyor.` },
          { caption: `Odaya tek bir kimlik verin: **${ROOM}**. Her rezervasyon yalnızca **room_id ${ROOM}** değerini tutar ve kapasiteyi odadan okur. Bir olgu, bir yer: çelişebilecek hiçbir şey kalmaz.` },
          { caption: 'Aynı fikir bir veri modeli olarak: üç varlık, **Kullanıcı**, **Oda** ve **Rezervasyon**. Bir rezervasyon, sahibine ve odasına tanımlayıcıyla referans verir.' },
          { caption: `Çizgileri okuyun: bir rezervasyon **bir** kullanıcıya ve **bir** odaya aittir; bir kullanıcının ya da odanın zamanla **çok** rezervasyonu olabilir. ${ROOM}'in şimdiden iki tane var.` },
          { caption: 'Kapasite oda hakkında güncel bir olgudur; bu yüzden odayla birlikte durur.', principle: true },
        ] },
      { id: 'rename', label: `Değişiklik: ${ROOM}'in adı değişiyor; tanımlayıcısı aynı`, short: 'Ad değişikliği',
        states: [
          { caption: `${ROOM}'in görünen adı **${trx(RN.display_name_before)}** iken **${trx(RN.display_name_after)}** oluyor. Tanımlayıcısı **${ROOM}** olarak kalıyor.` },
          { caption: `Odanın adını saklamış bir rezervasyon artık şunu buluyor: **${trx(ID.name_match.lookup_after_rename)}**. **${ROOM}** değerini saklamış bir rezervasyon ise odasını yeni adıyla hâlâ buluyor.` },
          { caption: `Ama ${SNAP.booking} makbuzu **${trx(SNAP.display_name_at_booking)}** adını bilerek korur: ${ARI.name}'nin gördüğünü göstermelidir. Bu kopya tarihseldir ve tarihsel olarak etiketlenmiştir.` },
          { caption: `**Biçimi doğru** olmak **var** olmak demek değildir: ${IDX[1].ref}'ün biçimi doğru, ama öyle bir oda yok. Referansların hep gerçek bir odayı göstermesine **referans bütünlüğü** denir.` },
          { caption: 'Güncel bir olgu tek bir yerde durur; tarihsel bir olgu ise bilerek kopyalanır.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:600px minmax(0,1fr);gap:20px' });
      // ---------------------------------------------------------------- left: the records
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' });
      h.capValue = el('span', {}, String(CAP0));
      h.nameValue = el('span', {}, trx(RN.display_name_before));
      h.room = el('div', { class: 'card fx', style: 'padding:10px 16px;border-left:5px solid var(--accent)' }, [
        el('div', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:4px' }, [cardTitle(`Oda ${ROOM}`, 'margin:0'), (h.sameId = chip('aynı tanımlayıcı', 'ok', { class: 'rv', style: 'font-size:15px' }))]),
        recordLine('id', ROOM), recordLine('display_name', h.nameValue), recordLine('capacity', h.capValue),
      ]);
      api.cue(h.room, 'room');
      h.records = RB.map((r, i) => {
        const copy = recordLine('capacity (kopya)', el('span', {}, [String(CAP0), ' ', (el('span', { class: 'rv', style: 'color:var(--bad);font-weight:700;margin-left:6px' }, '✕ odayla çelişiyor'))]));
        const derived = recordLine('capacity', el('span', { style: 'color:var(--ok)' }, `${ROOM}'den okunur: ${CAP1}`));
        const card = el('div', { class: 'card fx', 'data-cond': 'copied-facts', style: 'padding:10px 16px' }, [
          el('div', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:4px' }, [cardTitle(`Rezervasyon ${r.id}`, 'margin:0'), chip(trx(r.state), 'ok', { style: 'font-size:15px' })]),
          recordLine('owner_id', `${r.owner_id} (${nameOf(r.owner_id)})`), recordLine('room_id', r.room_id), recordLine('time', span(r.start, r.end)), copy, derived,
        ]);
        card.copy = copy; card.derived = derived; card.flag = copy.querySelector('.rv');
        api.cue(card, `record-${r.id.toLowerCase()}`); api.cue(copy, `copy-${r.id.toLowerCase()}`);
        return card;
      });
      // changed condition: reference by name versus by identifier, the receipt
      const refCard = (title, stored, result, ok) => el('div', { class: 'card', style: `padding:10px 14px;display:flex;flex-direction:column;gap:6px;border-color:var(--${ok ? 'ok' : 'bad'})` }, [
        cardTitle(title, 'margin:0;font-size:16px'),
        el('div', { style: 'font-family:var(--font-mono);font-size:17px' }, stored),
        el('div', { style: `font-size:17px;line-height:1.28;color:var(--${ok ? 'ok' : 'bad'});font-weight:600` }, [ok ? '✓ ' : '✕ ', result]),
      ]);
      h.refs = el('div', reveal({ class: 'rv rv--rise', 'data-cond': 'rename', 'data-show-from': '1', style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px' }), [
        api.cue(refCard('Adla referans', `room = "${trx(ID.name_match.stored_reference)}"`, trx(ID.name_match.lookup_after_rename), false), 'by-name'),
        api.cue(refCard('Tanımlayıcıyla referans', `room_id = ${ROOM}`, `${ROOM} · ${trx(RN.display_name_after)}`, true), 'by-id'),
      ]);
      h.receipt = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'rename', 'data-show-from': '2', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:6px;border-left:5px solid var(--violet)' }), [
        el('div', { style: 'display:flex;align-items:center;gap:10px' }, [cardTitle(`Makbuz · ${SNAP.booking}`, 'margin:0;font-size:17px'), chip('tarihsel anlık görüntü', 'violet', { style: 'font-size:15px' })]),
        el('div', { style: 'font-size:19px;font-weight:600' }, `${trx(SNAP.display_name_at_booking)} · ${ROOM} · ${BK_TIME}`),
        el('div', { class: 'muted', style: 'font-size:16px;line-height:1.3' }, `${upper1(trx(SNAP.reason))}.`),
      ]);
      api.cue(h.receipt, 'receipt');
      left.append(h.room, ...h.records, h.refs, h.receipt);
      wrap.appendChild(left);
      // ---------------------------------------------------------------- right: the data model
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0;min-height:0' });
      const W = 644, H = 432;
      const svg = window.VC.svg(W, H, { label: 'Veri modeli: Kullanıcı, Oda ve Rezervasyon varlıkları; bir rezervasyon bir kullanıcıya ve bir odaya referans verir', uid: (x) => api.uid(x) });
      const entity = (x, y, w, name, fields) => {
        const g = s('g', { class: 'fx' });
        const hh = 40 + fields.length * 28 + 6;
        g.appendChild(s('rect', { x, y, width: w, height: hh, rx: 12, ry: 12, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 }));
        g.appendChild(s('rect', { x, y, width: w, height: 40, rx: 12, ry: 12, fill: 'var(--accent-fill)' }));
        g.appendChild(text(x + 16, y + 28, name, { style: 'font-size:22px;font-weight:700;fill:var(--accent-strong)' }));
        g.rows = {};
        fields.forEach((f, i) => {
          const fy = y + 40 + i * 28;
          const t = text(x + 16, fy + 21, f, { style: `font-size:18px;font-family:var(--font-mono);fill:var(--${f === 'id' ? 'warn' : f.endsWith('_id') ? 'accent-strong' : 'text'})` });
          g.appendChild(t);
          g.rows[f] = { y: fy + 14, t };
        });
        g.box = { x, y, w, h: hh };
        svg.appendChild(g);
        return g;
      };
      h.user = entity(16, 12, 250, 'Kullanıcı', ENT.User);
      h.roomE = entity(378, 12, 250, 'Oda', ENT.Room);
      h.booking = entity(186, 206, 272, 'Rezervasyon', ENT.Booking);
      api.cue(h.user, 'entity-user'); api.cue(h.roomE, 'entity-room'); api.cue(h.booking, 'entity-booking');
      const rel = (fromY, toX, toY, side, cardinality) => {
        const bx = side === 'left' ? 186 : 458;
        const g = s('g', { class: 'rv' });
        g.appendChild(s('path', { d: `M${bx},${fromY} L${toX},${fromY} L${toX},${toY}`, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.6 }));
        g.appendChild(s('circle', { cx: toX, cy: toY + 5, r: 5, fill: 'var(--accent)' }));
        const lab = text(side === 'left' ? toX - 12 : toX + 12, (fromY + toY) / 2 + 8, trx(cardinality), { class: 'rv', 'text-anchor': side === 'left' ? 'end' : 'start', style: 'font-size:18px;font-weight:700;fill:var(--accent-strong)' });
        g.appendChild(lab); g.card = lab;
        g.appendChild(text(side === 'left' ? toX + 5 : toX - 5, fromY - 8, 'çok', { class: 'rv card-n', 'text-anchor': side === 'left' ? 'start' : 'end', style: 'font-size:15px;fill:var(--text-muted)' }));
        g.appendChild(text(side === 'left' ? toX + 8 : toX - 8, toY + 26, 'bir', { class: 'rv card-n', 'text-anchor': side === 'left' ? 'start' : 'end', style: 'font-size:16px;fill:var(--text-muted)' }));
        svg.appendChild(g);
        return g;
      };
      const rUser = ID.relationships.find((r) => r.to === 'User'), rRoom = ID.relationships.find((r) => r.to === 'Room');
      h.relUser = rel(h.booking.rows.owner_id.y, 141, h.user.box.y + h.user.box.h, 'left', rUser.cardinality);
      h.relRoom = rel(h.booking.rows.room_id.y, 503, h.roomE.box.y + h.roomE.box.h, 'right', rRoom.cardinality);
      api.cue(h.relUser, 'relationship-user'); api.cue(h.relRoom, 'relationship-room');
      h.model = el('div', reveal({ class: 'card rv rv--rise', style: 'padding:6px 8px' }), svg);
      api.cue(h.model, 'data-model');
      // bottom right: the instances (baseline) or the four checks (changed)
      h.instances = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'copied-facts', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:4px;grid-area:1 / 1' }), [
        cardTitle('Örnekler', 'margin-bottom:2px;font-size:17px'),
        el('div', { style: 'font-size:18px;line-height:1.35' }, `${ARI.id} ${ARI.name} · ${BO.id} ${BO.name} · ${ROOM} ${trx(RN.display_name_before)}`),
        ...RB.map((r) => el('div', { style: 'font-size:18px;line-height:1.35;font-family:var(--font-mono)' }, `${r.id} → sahip ${r.owner_id}, oda ${r.room_id}`)),
        el('div', { class: 'muted', style: 'font-size:17px;line-height:1.3' }, `Bir oda, iki rezervasyon; her rezervasyonun bir sahibi ve bir odası var.`),
      ]);
      api.cue(h.instances, 'instances');
      const checkRows = Object.entries(CHECKQ).map(([name, q], i) => {
        const ex = i === 0 ? IDX.map((x) => [x.ref, x.well_formed]) : i === 1 ? IDX.filter((x) => x.well_formed).map((x) => [x.ref, x.exists]) : null;
        return el('div', { style: `display:grid;grid-template-columns:200px minmax(0,1fr);gap:10px;align-items:baseline;padding:4px 0;${i ? 'border-top:1px solid var(--line);' : ''}` }, [
          el('span', { style: `font-size:16px;font-weight:700;color:var(--${i === 1 ? 'warn' : 'text'})` }, upper1(trx(name))),
          el('span', { style: 'font-size:16px;line-height:1.28' }, [trx(q), ex ? el('span', { style: 'display:block;font-family:var(--font-mono);font-size:15px;margin-top:2px' }, ex.map(([ref, ok], k) => [k ? ' · ' : '', ref, ' ', tick(ok)]).flat()) : null]),
        ]);
      });
      h.checks = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'rename', 'data-show-from': '3', style: 'padding:8px 14px;display:flex;flex-direction:column;grid-area:1 / 1' }), [
        cardTitle('Dört kontrol, dört soru', 'margin-bottom:2px;font-size:16px'), ...checkRows,
      ]);
      api.cue(h.checks, 'checks');
      right.append(h.model, el('div', { style: 'display:grid;min-height:0' }, [h.instances, h.checks]));
      wrap.appendChild(right);
      stage.appendChild(wrap);
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'copied-facts';
      h.capValue.textContent = String(base && st === 0 ? CAP0 : CAP1);
      h.capValue.style.color = base && st === 1 ? 'var(--warn)' : '';
      h.nameValue.textContent = trx(base ? RN.display_name_before : RN.display_name_after);
      h.nameValue.style.color = !base && st === 0 ? 'var(--warn)' : '';
      showIf(h.sameId, !base);
      focusIf(h.room, (base && (st === 1 || st === 2)) || (!base && st === 0));
      h.records.forEach((card) => {
        card.copy.style.display = base && st <= 1 ? 'grid' : 'none';
        card.derived.style.display = base && st >= 2 ? 'grid' : 'none';
        showIf(card.flag, base && st === 1);
        card.style.borderColor = base && st === 1 ? 'var(--bad)' : '';
      });
      showIf(h.model, !base || st >= 3);
      focusIf(h.booking, base && st === 3);
      [h.relUser, h.relRoom].forEach((g) => {
        showIf(g, !base || st >= 3);
        g.querySelectorAll('.rv').forEach((t) => showIf(t, !base || st >= 4));
      });
      showIf(h.instances, base && st >= 4); focusIf(h.instances, base && st === 4);
    },
    print: [
      { title: 'Kopyalanan kapasite: iki kayıt odayla çelişiyor', condition: 'copied-facts', state: 1, note: `${RB[0].id} ve ${RB[1].id}, ${ROOM}'in kapasitesini (${CAP0}) kendi kayıtlarına kopyaladı. Oda ${CAP1} olarak değiştiğinde iki kopya da hâlâ ${CAP0} diyor: ${trx(ID.copied_capacity_defect.result)}.` },
      { title: 'Oda başına tek kimlik: varlıklar, referanslar ve çoktan bire ilişkiler', condition: 'copied-facts', state: 4, note: `Kullanıcı (${ENT.User.join(', ')}), Oda (${ENT.Room.join(', ')}), Rezervasyon (${ENT.Booking.join(', ')}). Bir rezervasyon sahibine ve odasına tanımlayıcıyla referans verir: ${ID.relationships.map((r) => `${trx(r.from)} → ${trx(r.to)}, ${trx(r.cardinality)}`).join('; ')}. Kapasite odadan okunur; bu yüzden tek bir güncel değer vardır. Bu modeldeki bir varlığın tam olarak tek bir sınıfa ya da tek bir tabloya dönüşmesi gerekmez.` },
      { title: 'Yeni bir ad, aynı tanımlayıcı, bilinçli bir anlık görüntü ve dört farklı kontrol', condition: 'rename', state: 3, principle: true, note: `${ROOM}'in adı ${trx(RN.display_name_before)} iken ${trx(RN.display_name_after)} olarak değiştirildi. Ada göre bir referans şunu bulur: ${trx(ID.name_match.lookup_after_rename)}; ${ROOM} üzerinden bir referans ise odayı hâlâ bulur. ${SNAP.booking} makbuzu “${trx(SNAP.display_name_at_booking)}” adını korur, çünkü ${trx(SNAP.reason)}. Tanımlayıcı biçimi (${trx(ID.identifier_shape)}) ile var olma ayrı kontrollerdir: ${IDX.map((x) => `${x.ref} ${x.well_formed ? 'biçimi doğru' : 'biçimi bozuk'}, ${x.exists ? 'var' : 'böyle bir oda yok'}`).join('; ')}. Rezervasyon kuralları (R-01) ve yetki (R-03) iki ayrı soru daha oluşturur.` },
    ],
  };

  // =====================================================================
  // SCENE 4 · decision-table (Bridge)
  // =====================================================================
  const CROW = DT.row_order.map((label) => CANC.find((r) => r.label === label));   // own-future, other-user, already-started, unauthenticated, already-cancelled
  const GAP = DT.missing_row;
  const STAFF = DT.staff_row;
  /** R-03 recomputed for every displayed row, so the deck never shows a decision the rule does not give. */
  const r03 = (r) => (r.state === 'Cancelled' ? 'repeated-response' : (r.authenticated && r.requester === r.owner && r.state === 'Confirmed' && r.now < r.start ? 'allowed' : 'denied'));
  [...CROW, GAP, STAFF].forEach((r) => { if (r03(r) !== r.expected) throw new Error(`decision table row ${r.label}: R-03 gives ${r03(r)}, fixture says ${r.expected}`); });
  const whoAsks = (r) => (r.requester == null ? 'oturum açan yok' : r.requester.startsWith('U-') ? `${nameOf(r.requester)} · ${r.requester}` : trx(r.requester));
  const decisionChip = (d) => chip(trx(d), d === 'allowed' ? 'ok' : d === 'denied' ? 'bad' : 'violet', { style: 'font-size:16px' });
  const yes = (v) => (v == null ? el('span', { class: 'muted' }, '·') : tick(v));
  const rowCells = (r, i) => ({
    n: el('b', {}, i), who: el('span', { style: 'white-space:nowrap' }, whoAsks(r)), auth: yes(r.authenticated),
    own: yes(r.requester == null ? null : r.requester === r.owner), state: el('span', { style: `color:var(--${r.state === 'Confirmed' ? 'text' : 'violet'});font-weight:600` }, trx(r.state)),
    future: el('span', { style: 'white-space:nowrap' }, [yes(r.now < r.start), el('span', { class: 'muted', style: 'font-size:15px;margin-left:6px' }, `şimdi ${r.now}, başlangıç ${r.start}`)]),
    decision: decisionChip(r.expected), reason: el('span', { class: 'muted', style: 'font-size:16px;line-height:1.25' }, r.reason ? upper1(trx(r.reason).replace('stable explicitly defined response; ', 'stable, defined answer; ')) : 'Tüm koşullar sağlanıyor'),
  });
  const DT_COLUMNS = [{ key: 'n', label: '#' }, { key: 'who', label: 'Kim istiyor' }, { key: 'auth', label: trx(DT.conditions[0].label) }, { key: 'own', label: trx(DT.conditions[1].label) }, { key: 'state', label: trx(DT.conditions[2].label) }, { key: 'future', label: trx(DT.conditions[3].label) }, { key: 'decision', label: 'Karar' }, { key: 'reason', label: 'Neden' }];
  const decisionTable = {
    id: 'decision-table', role: 'bridge',
    heading: 'Oturum açmış her üye, her rezervasyonu iptal edebilir mi?',
    lead: `Önce sözcüklerle ${DT.rule}, sonra satırlar hâlinde: oturum açmış olma, kendi rezervasyonu olma, rezervasyon durumu ve başlangıç saati; her satırda bir kombinasyon. Örnekteki saat ${CROW[0].now}.`,
    principle: 'Karar tablosu, kombinasyonların ve gözden kaçan vakaların incelenmesini kolaylaştırır.',
    principleShort: 'Satırlar her kombinasyonu ve aralarındaki boşlukları gösterir.',
    conditions: [
      { id: 'r03-rows', baseline: true, label: `Başlangıç: satırlar hâlinde ${DT.rule}`, short: `${DT.rule} satırları`,
        states: [
          { prompt: { question: `${ARI.name} ve ${BO.name}, ikisi de oturum açmış. Her biri ${BK.id}'i iptal edebilir mi?`, options: ['İkisi de: oturum açmış her üye', `Yalnızca sahibi olan ${ARI.name}, ${BK.start}'dan önce`, 'Hiçbiri: yalnızca personel iptal eder'] }, caption: `**${BK.id}**: ${ROOM}, ${BK_TIME}, sahibi ${ARI.name}, ${trx(BK.state)}. Örnekteki saat **${CROW[0].now}**.` },
          { caption: `**${DT.rule}**: ${lower1(trx(DT.rule_text))} Bu cümlede dört koşul saklı: oturum açmış olma, kendi rezervasyonu olma, onaylanmış olma ve şimdiden sonra başlama.` },
          { caption: `Birinci satır: ${ARI.name}, oturum açmış, kendi rezervasyonu, ${trx(CROW[0].state)}, saat ${CROW[0].now} ve başlangıç ${CROW[0].start}. Tüm koşullar sağlanıyor: **izin verildi**.` },
          { caption: `İkinci satır tek bir hücreyi değiştiriyor: isteyen ${BO.name}. ${BO.name} oturum açmış, ama rezervasyon ${BO.name}'nun değil: **izin verilmedi**, sahibi değil.` },
          { caption: `Saat tam **${CROW[2].now}** olduğunda başlangıç şimdiden sonra değil: **izin verilmedi**. Oturum açan yokken de: **izin verilmedi**.` },
          { caption: `${BK.id} zaten İptal edildi durumunda: ne izin verildi ne de izin verilmedi; ikinci bir geçiş olmadan 2. sahnedeki **kararlı tekrar yanıtı** verilir.` },
          { caption: `Şimdi kimsenin yazmadığı bir kombinasyonu arayın: ${ARI.name}'nin kendi rezervasyonu, saat **${GAP.now}**, yani bittikten sonra. Boşluk görünüyor; ${DT.rule} onu yanıtlıyor: **izin verilmedi**.` },
          { caption: `${DT.rule} tam olarak tek bir kombinasyona izin verir; diğer her satır nedenini söyler.`, principle: true },
        ] },
      { id: 'only-requester', label: 'Değişiklik: yalnızca isteyen değişiyor, gerisi sabit', short: 'Kim istiyor',
        states: [
          { caption: `Her şeyi sabit tutun: oturum açmış, ${trx(BK.state)}, saat ${CROW[0].now} ve başlangıç ${CROW[0].start}. Yalnızca **isteyen kişiyi** değiştirin.` },
          { caption: `Sahibi olan ${ARI.name}: **izin verildi**. Bunu belirleyen koşul **kendi rezervasyonu** olmasıdır.` },
          { caption: `${BO.name}: **izin verilmedi**. Aynı oturum, aynı rezervasyon, aynı saat; bundan ${DT.rule}'teki **kendi** sözcüğü sorumlu.` },
          { caption: `Oturum açmış oda personeli: ${DT.rule}'e göre **izin verilmedi**. Personel ayrıcalığı, kodda gizlenmiş bir istisna değil, paydaşların karar vereceği yeni bir kural olurdu.` },
          { caption: 'Bir hücre değişti, bir karar değişti; bunu kuralın tek bir ifadesi açıklıyor.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:14px' });
      // the rule, with its four conditions marked (Turkish words of the translated rule; the English words keep the untranslated fallback working)
      // authenticated = Kimliği doğrulanmış · their own = kendi · future = gelecekteki · confirmed = onaylanmış
      const parts = trx(DT.rule_text).split(/(Kimliği doğrulanmış|kendi|gelecekteki|onaylanmış|authenticated|their own|future|confirmed)/);
      h.marks = [];
      const sentence = el('p', { style: 'font-size:26px;font-weight:600;font-family:var(--font-display);line-height:1.3' }, parts.map((p) => {
        if (!/^(Kimliği doğrulanmış|kendi|gelecekteki|onaylanmış|authenticated|their own|future|confirmed)$/.test(p)) return p;
        const m = el('span', { class: 'r03-mark', style: 'border-radius:6px;padding:0 4px;transition:background 300ms,box-shadow 300ms' }, p);
        h.marks.push(m); if (p === 'kendi' || p === 'their own') h.ownMark = m;
        return m;
      }));
      h.rule = el('div', { class: 'card fx', style: 'padding:12px 18px;display:flex;align-items:center;gap:18px' }, [
        chip(`Kural ${DT.rule}`, 'warn', { style: 'font-size:18px;flex:0 0 auto' }), sentence,
      ]);
      api.cue(h.rule, 'rule'); api.cue(sentence, 'rule-text');
      wrap.appendChild(h.rule);
      // baseline table
      const baseRows = CROW.map((r, i) => ({ attrs: { class: 'rv', 'data-show-from': String([2, 3, 4, 4, 5][i]), 'data-focus-at': String([2, 3, 4, 4, 5][i]) }, cells: rowCells(r, i + 1) }));
      baseRows.push({ attrs: { class: 'rv', 'data-show-from': '6', 'data-focus-at': '6', style: 'outline:2px dashed var(--warn);outline-offset:-2px' }, cells: Object.assign(rowCells(GAP, '?'), { reason: el('span', { style: 'font-size:16px;line-height:1.25;color:var(--warn)' }, `Eksik satır: ${trx(GAP.reason)}`) }) });
      h.table = table({ captionHidden: `Karar tablosu olarak ${DT.rule}: her kombinasyon için koşullar, karar ve gerekçe`, cls: 'data-table--compact', columns: DT_COLUMNS, rows: baseRows });
      const tidy = (t) => {
        t.querySelectorAll('td, th').forEach((c) => { c.style.padding = '7px 10px'; c.style.fontSize = '17px'; c.style.verticalAlign = 'middle'; });
        t.querySelectorAll('thead th').forEach((c) => { c.style.fontSize = '15px'; });
      };
      tidy(h.table);
      h.table.querySelectorAll('tbody tr').forEach((tr, i) => api.cue(tr, i < CROW.length ? `row-${CROW[i].label}` : 'row-gap'));
      h.baseWrap = el('div', { 'data-cond': 'r03-rows', style: 'min-height:0' }, h.table);
      api.cue(h.table, 'table');
      // changed condition: one column varies
      const who = [CROW[0], CROW[1], STAFF];
      h.whoTable = table({ captionHidden: 'Yalnızca isteyen değişiyor: her isteyen için karar', cls: 'data-table--compact', columns: DT_COLUMNS, rows: who.map((r, i) => ({ attrs: { class: 'rv', 'data-show-from': String(i + 1), 'data-focus-at': String(i + 1) }, cells: rowCells(r, i + 1) })) });
      tidy(h.whoTable);
      h.whoTable.querySelectorAll('tbody tr').forEach((tr, i) => api.cue(tr, `who-${['owner', 'other-user', 'staff'][i]}`));
      h.fixed = el('div', { class: 'callout callout--accent', style: 'font-size:18px;padding:8px 14px;margin-bottom:8px' }, [el('b', {}, 'Sabit tutulanlar: '), `oturum açmış ✓ · ${trx(BK.state)} · şimdi ${CROW[0].now}, başlangıç ${CROW[0].start} ✓. Yalnızca ikinci sütun değişiyor.`]);
      h.whoWrap = el('div', { 'data-cond': 'only-requester', style: 'min-height:0' }, [h.fixed, h.whoTable]);
      api.cue(h.whoTable, 'who-table'); api.cue(h.fixed, 'held-fixed');
      wrap.append(h.baseWrap, h.whoWrap);
      // the policy boundary (baseline) and the missing override (changed)
      h.boundary = el('div', reveal({ class: 'callout rv rv--rise', 'data-cond': 'r03-rows', 'data-show-from': '7', style: 'font-size:18px;padding:10px 16px;line-height:1.35' }), [el('b', {}, 'Politika sınırı: '), trx(DT.policy_boundary)]);
      h.override = el('div', reveal({ class: 'callout callout--bad rv rv--rise', 'data-cond': 'only-requester', 'data-show-from': '3', style: 'font-size:18px;padding:10px 16px;line-height:1.35' }), [el('b', {}, 'Personel ayrıcalığı yok: '), `${upper1(trx(STAFF.reason))}. Kampüs personelinin her rezervasyonu iptal etmek için yazılı olmayan bir hakkı yoktur.`]);
      api.cue(h.boundary, 'boundary'); api.cue(h.override, 'override');
      wrap.append(h.boundary, h.override);
      stage.appendChild(wrap);
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'r03-rows';
      h.marks.forEach((m) => {
        const on = base ? st >= 1 : false;
        m.style.background = on ? 'var(--warn-fill)' : '';
        m.style.boxShadow = on ? 'inset 0 -3px 0 var(--warn)' : '';
      });
      if (!base) {
        h.ownMark.style.background = st >= 1 ? 'var(--warn-fill)' : '';
        h.ownMark.style.boxShadow = st >= 1 ? 'inset 0 -3px 0 var(--warn)' : '';
      }
      focusIf(h.rule, (base && st === 1) || (!base && st === 2));
    },
    print: [
      { title: `Satırlar hâlinde ${DT.rule}: tüm ana kombinasyonlar ve boşluk`, condition: 'r03-rows', state: 7, principle: true, note: `${DT.rule}: ${trx(DT.rule_text)} Koşullar: ${DT.conditions.map((c) => trx(c.label)).join(', ')}. Satırlar: ${[...CROW, GAP].map((r) => `${whoAsks(r)}, ${trx(r.state)}, şimdi ${r.now}: ${trx(r.expected)}`).join('; ')}. Politika sınırı: ${trx(DT.policy_boundary)}` },
      { title: 'Yalnızca isteyen değişiyor', condition: 'only-requester', state: 3, note: `Oturum açmış, ${trx(BK.state)}, şimdi ${CROW[0].now}, başlangıç ${CROW[0].start}: ${who3Text()}. Kararı ${DT.rule}'teki “kendi” ifadesi belirler; personel ayrıcalığı yoktur.` },
    ],
  };
  function who3Text() { return [CROW[0], CROW[1], STAFF].map((r) => `${whoAsks(r)} → ${trx(r.expected)}`).join(', '); }

  // =====================================================================
  // SCENE 5 · sequence-not-state (Anchor)
  // =====================================================================
  const PART = SQ.participants;                  // Browser, Booking Service, Authoritative Store, Notification Worker
  const SUCC = SQ.success;                       // six numbered messages
  const LOST = SQ.lost_response;
  const REJ = SQ.rejection_before_persistence;   // four numbered messages
  const RECOVER = SQ.recovery;
  const MSG_Y = [112, 172, 244, 306, 370, 436];
  const sequenceNotState = {
    id: 'sequence-not-state', role: 'anchor',
    heading: 'Ekran “Onaylandı” diyebilmeden önce ne olmalı?',
    lead: 'Dört katılımcı ve numaralı mesajlar. Başarılı bir rezervasyonu izleyin, sonra bir mesajı kaybedin ve karşılaştırın. Numaralar sırayı verir; dikey mesafe zaman değildir.',
    principle: 'Bir etkileşim geçmişi, benzer görünen iki kullanıcı belirtisinin neden farklı kurtarma eylemleri gerektirebileceğini açıklar.',
    principleShort: 'Aynı belirti, farklı geçmiş, farklı çözüm.',
    conditions: [
      { id: 'success', baseline: true, label: 'Başlangıç: mesaj mesaj başarılı bir rezervasyon', short: 'Başarı',
        states: [
          { prompt: { question: `${ARI.name}'nin ekranı “Onaylandı” diyebilmeden önce ne olmalı?`, options: ['İstek servise ulaşmalı', 'Rezervasyon karara bağlanıp saklanmalı', 'Onay e-postası gönderilmeli'] }, caption: "Dört katılımcı, her birinin bir yaşam çizgisi var; zaman yukarıdan aşağı akar. Mesajları tek tek göndermek için İleri'ye basın." },
          { caption: `**1 ${trx(SUCC[0].message)}**: tarayıcı ${ARI.name}'nin isteğini Rezervasyon Servisi'ne gönderir. Henüz hiçbir şeye karar verilmedi.` },
          { caption: `**2 ${trx(SUCC[1].message)}**: servis, depoya sormadan önce isteğin kendisini denetler; örneğin R-02 süre kuralını.` },
          { caption: `**3 ${trx(SUCC[2].message)}**: yetkili depo çakışma olup olmadığına karar verir ve rezervasyonu tek adımda saklar.` },
          { caption: `**4 ${trx(SUCC[3].message)}**: depo yanıt verir. Onaylanmış bir rezervasyon ancak şimdi var olur.` },
          { caption: `**5 ${trx(SUCC[4].message)}**: artık ekran “Onaylandı” diyebilir, çünkü üçüncü ve dördüncü mesajlar önce geldi. Soru böylece yanıtlanır.` },
          { caption: '**6 bekleyen bildirimi kaydet**, yanıttan sonra: kendi durumu olan ayrı bir iş (R-04). Onay asla e-postayı beklemez.' },
          { caption: 'Numaralar sırayı verir. Oklar arasındaki mesafe zaman değildir: 6. mesaj çok daha sonra çalışabilir.', principle: true },
        ] },
      { id: 'lost-response', label: `Değişiklik: ${BK.id} saklandı, yanıt kayboldu`, short: 'Kayıp yanıt',
        states: [
          { caption: `**1–${LOST.same_as_success_through}** arası mesajlar aynı: ${BK.id} karara bağlandı ve saklandı. 5. mesajı göndermek için İleri'ye basın.` },
          { caption: `**5. mesaj kayboluyor**. ${ARI.name}'nin ekranı yalnızca **${trx(LOST.browser_state)}** diyebilir; depo ise **${trx(LOST.stored_state)}** diyor. Rezervasyon var; ${ARI.name} bunu bilmiyor.` },
          { prompt: { question: `İki geçmiş de depoda ${BK.id} Onaylandı ile bitiyor. Farkı hangi model gösterir?`, options: ['Saklanan rezervasyonun durum modeli', 'Mesajların numaralı sırası', 'Veri modeli'] }, caption: 'Başarılı akışla karşılaştırın: son saklanan durum aynı, **Onaylandı**. İki geçmişi hangi çizimin ayırt ettiğine karar verin.' },
          { caption: `Sıralama diyagramı ayırt eder: farkın ortaya çıktığı yer 5. mesajdır. Bu yüzden kurtarma, ikinci bir rezervasyon göndermek değil, şudur: **${trx(RECOVER.lost_response)}**.` },
          { caption: 'Aynı saklanan sonuç, farklı geçmiş, farklı kurtarma.', principle: true },
        ] },
      { id: 'rejected-early', label: 'Değişiklik: hiçbir şey saklanmadan reddedildi', short: 'Reddedildi',
        states: [
          { caption: `${BK.id} ile çakışan bir istek. **1** ve **2** numaralı mesajlar öncekiyle aynı: gönderildi ve doğrulandı.` },
          { caption: `**3 ${trx(REJ[2].message)}**: deponun kararı ${BK.id} ile çakışmayı bulur ve hiçbir şey saklanmaz.` },
          { caption: `**4 ${trx(REJ[3].message)}**. Buradaki kurtarma: **${trx(RECOVER.rejected).split(';')[0]}**; kontrol edilecek bir şey yok.` },
          { caption: 'Onay alamayan iki kişi, iki geçmiş, iki farklı sonraki adım.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-rows:504px minmax(0,1fr);gap:12px' });
      const W = 1264, H = 504;
      const svg = window.VC.svg(W, H, { label: 'Tek bir rezervasyonun sıralama diyagramı: tarayıcı, rezervasyon servisi, yetkili depo ve bildirim işleyicisi', uid: (x) => api.uid(x) });
      const LX = [140, 470, 800, 1120];
      PART.forEach((p, i) => {
        const hd = node({ x: LX[i] - 122, y: 6, w: 244, h: 58, label: trx(p), kind: i === 2 ? 'store' : 'box' });
        hd.querySelectorAll('.n-label').forEach((t) => { t.style.fontSize = '20px'; });
        svg.appendChild(s('line', { x1: LX[i], y1: 64, x2: LX[i], y2: 496, stroke: 'var(--line-strong)', 'stroke-width': 2, 'stroke-dasharray': '6 7' }));
        svg.appendChild(hd);
        api.cue(hd, `participant-${i + 1}`);
      });
      const idx = (name) => PART.indexOf(name);
      const msg = (m, y, cond, from, kind, name) => {
        const fi = idx(m.from), ti = idx(m.to);
        let g;
        if (fi === ti) {
          g = arrow(svg, { from: { x: LX[fi], y: y - 18 }, via: [{ x: LX[fi] + 86, y: y - 18 }, { x: LX[fi] + 86, y: y + 18 }], to: { x: LX[fi] + 5, y: y + 18 }, kind, label: `${m.n}  ${m.message}`, labelAnchor: 'start', labelDx: 14, labelDy: 8 });
        } else {
          const dir = ti > fi ? 1 : -1;
          g = arrow(svg, { from: { x: LX[fi] + 4 * dir, y }, to: { x: LX[ti] - 5 * dir, y }, kind, label: `${m.n}  ${m.message}`, labelDy: -12 });
        }
        g.classList.add('rv', 'fx');
        g.setAttribute('data-cond', cond); g.setAttribute('data-show-from', String(from));
        return api.cue(g, name);
      };
      h.msgs = [];
      SUCC.forEach((m, i) => h.msgs.push({ g: msg(trMsg(m), MSG_Y[i], 'success', i + 1, i === 4 ? 'ok' : i === 5 ? 'violet' : 'accent', `success-${m.n}`), cond: 'success', n: m.n }));
      SUCC.slice(0, LOST.same_as_success_through).forEach((m, i) => h.msgs.push({ g: msg(trMsg(m), MSG_Y[i], 'lost-response', 0, 'accent', `lost-${m.n}`), cond: 'lost-response', n: m.n }));
      const lost = msg({ n: 5, from: SUCC[4].from, to: SUCC[4].to, message: `${trx(SUCC[4].message)} · ${trx(LOST.step_5)}` }, MSG_Y[4], 'lost-response', 1, 'bad', 'lost-5');
      lost.querySelector('.a-line').setAttribute('stroke-dasharray', '10 8');
      lost.querySelectorAll('.a-label, .a-label-bg').forEach((n) => n.setAttribute('transform', 'translate(-44 0)'));
      lost.appendChild(markX(LX[1] - 40, MSG_Y[4], 13));
      h.msgs.push({ g: lost, cond: 'lost-response', n: 5 });
      REJ.forEach((m, i) => h.msgs.push({ g: msg(trMsg(m), MSG_Y[i], 'rejected-early', Math.max(0, i - 1), i === 3 ? 'bad' : 'accent', `rejected-${m.n}`), cond: 'rejected-early', n: m.n }));
      // state badges along the lifelines
      h.storeBadge = badge({ x: LX[2] + 14, y: MSG_Y[2] + 30, label: `${BK.id} Onaylandı`, kind: 'ok', anchor: 'start' });
      h.nothingBadge = badge({ x: LX[2] + 14, y: MSG_Y[2] + 30, label: 'hiçbir şey saklanmadı', kind: 'warn', anchor: 'start' });
      h.screenBadge = badge({ x: LX[0], y: MSG_Y[4] + 36, label: 'Sonuç bilinmiyor', kind: 'warn' });
      svg.append(h.storeBadge, h.nothingBadge, h.screenBadge);
      [h.storeBadge, h.nothingBadge, h.screenBadge].forEach((n) => n.classList.add('rv'));
      api.cue(h.storeBadge, 'stored-badge'); api.cue(h.nothingBadge, 'nothing-badge'); api.cue(h.screenBadge, 'screen-badge');
      wrap.appendChild(api.cue(svg, 'sequence'));
      // bottom strip: what the screen says, what is stored, what to do next
      const cell = (title, name) => {
        const v = el('div', { style: 'font-size:21px;font-weight:700;line-height:1.25' });
        const c = el('div', { class: 'card fx', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:4px;min-width:0' }, [cardTitle(title, 'margin:0;font-size:16px'), v]);
        c.v = v;
        return api.cue(c, name);
      };
      h.screen = cell(`${ARI.name}'nin ekranı`, 'screen-state');
      h.stored = cell('Saklanan', 'stored-state');
      h.next = cell('Sonraki adım', 'next-step');
      wrap.appendChild(el('div', { style: 'display:grid;grid-template-columns:300px 300px minmax(0,1fr);gap:16px;align-items:start' }, [h.screen, h.stored, h.next]));
      stage.appendChild(wrap);
      return h;
    },
    render(h, view) {
      const st = view.state, c = view.conditionId;
      h.msgs.forEach((m) => focusIf(m.g, m.cond === c && ((c === 'success' && m.n === st) || (c === 'lost-response' && m.n === 5 && st >= 1) || (c === 'rejected-early' && m.n === st + 2 && st >= 1))));
      const storedNow = c === 'success' ? st >= 4 : c === 'lost-response';
      showIf(h.storeBadge, storedNow);
      showIf(h.nothingBadge, c === 'rejected-early' && st >= 1);
      showIf(h.screenBadge, c === 'lost-response' && st >= 1);
      let screen = 'Gönderiliyor…', stored = 'Henüz hiçbir şey', next = 'Yanıtı bekle', kind = 'text';
      if (c === 'success') {
        if (st >= 4) stored = `${BK.id} Onaylandı`;
        if (st >= 5) { screen = 'Onaylandı'; next = 'Yapılacak bir şey yok: oda tutuldu'; kind = 'ok'; }
        if (st >= 6) next = 'Yapılacak bir şey yok: e-posta ayrı bir iş olarak sonra gelir';
      } else if (c === 'lost-response') {
        stored = `${BK.id} ${trx(LOST.stored_state)}`;
        if (st >= 1) { screen = trx(LOST.browser_state); kind = 'warn'; next = st >= 3 ? upper1(trx(RECOVER.lost_response)) : 'Henüz bilinmiyor'; }
      } else {
        if (st >= 1) stored = 'Hiçbir şey saklanmadı';
        if (st >= 2) { screen = 'Reddedildi'; kind = 'bad'; next = upper1(trx(RECOVER.rejected).split(';')[0]); }
      }
      h.screen.v.textContent = screen; h.screen.v.style.color = kind === 'text' ? '' : `var(--${kind})`;
      h.stored.v.textContent = stored; h.stored.v.style.color = stored.startsWith(BK.id) ? 'var(--ok)' : '';
      h.next.v.textContent = next;
      focusIf(h.next, (c === 'lost-response' && st === 3) || (c === 'rejected-early' && st === 2));
    },
    print: [
      { title: 'Başarılı sıralama: Onaylandı demeden önce karar ver ve sakla; bildirim yanıttan sonra', condition: 'success', state: 6, note: `${SUCC.map((m) => `${m.n} ${trx(m.from)} → ${trx(m.to)}: ${trx(m.message)}`).join('; ')}. Numaralar sırayı verir; dikey mesafe geçen süre değildir.` },
      { title: 'Kayıp yanıt sıralaması: depoda Onaylandı, ekranda Sonuç bilinmiyor', condition: 'lost-response', state: 3, note: `1–${LOST.same_as_success_through} arası mesajlar başarılı akıştaki gibidir; 5. mesaj kaybolur. Tarayıcı ${trx(LOST.browser_state)} gösterirken saklanan rezervasyon ${trx(LOST.stored_state)} durumundadır. Kurtarma: ${trx(RECOVER.lost_response)}.` },
      { title: 'Kalıcı kayıttan önce reddedildi: hiçbir şey saklanmadı, farklı bir kurtarma', condition: 'rejected-early', state: 3, principle: true, note: `${REJ.map((m) => `${m.n} ${trx(m.from)} → ${trx(m.to)}: ${trx(m.message)}`).join('; ')}. Kurtarma: ${trx(RECOVER.rejected)}. İki kişi de onay görmez; ama geçmişler ve dolayısıyla sonraki adımlar farklıdır.` },
    ],
  };

  // =====================================================================
  // SCENE 6 · interface-states (Bridge)
  // =====================================================================
  const IST = IS.states;                         // loading, empty, validation, unavailable, results
  const ist = (id) => IST.find((x) => x.id === id);
  const ICON = { hourglass: '…', circle: '○', exclamation: '!', cross: '✕', check: '✓' };
  const ICON_KIND = { loading: 'text-muted', empty: 'accent-strong', validation: 'warn', unavailable: 'bad', results: 'ok' };
  const EMPTY = ist(IS.comparison.from), FAILED = ist(IS.comparison.to);
  /** The message area of the search screen in one state: a text label, a shaped icon and the words, never color alone. */
  function stateMessage(x, opts = {}) {
    const color = `var(--${ICON_KIND[x.id]})`;
    return el('div', { style: 'display:flex;flex-direction:column;gap:6px' }, [
      el('div', { style: `display:flex;align-items:center;gap:10px;font-size:15px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${color}` }, [
        el('span', { 'aria-hidden': 'true', style: `display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:${x.icon === 'circle' ? '50%' : x.icon === 'exclamation' ? '4px' : '50%'};border:2.5px solid ${color};font-size:18px;line-height:1;${x.icon === 'exclamation' ? 'transform:rotate(45deg);' : ''}` }, el('span', { style: x.icon === 'exclamation' ? 'transform:rotate(-45deg)' : '' }, ICON[x.icon])),
        trx(x.label),
      ]),
      el('p', { style: `font-size:${opts.size || 20}px;line-height:1.3;font-weight:600` }, trx(x.message)),
    ]);
  }
  const interfaceStates = {
    id: 'interface-states', role: 'bridge',
    heading: `Sayfada “${trx(IS.ambiguous_empty)}” yazıyor. Arama bitti mi?`,
    lead: 'Tek bir oda araması, beş durum. Her durum farklı bir vaatte bulunur: neyin bilindiği ve kişinin bundan sonra ne yapabileceği.',
    principle: 'Bir arayüz, neyin bilindiğini ve kullanıcının bundan sonra ne yapabileceğini iletmelidir.',
    principleShort: 'Neyin bilindiğini ve kişinin ne yapabileceğini söyleyin.',
    conditions: [
      { id: 'five-states', baseline: true, label: 'Başlangıç: beş durum, beş farklı mesaj', short: 'Beş durum',
        states: [
          { prompt: { question: `Arama hâlâ sürerken sonuç alanında “${trx(IS.ambiguous_empty)}” yazıyor. Bu ne anlama gelir?`, options: ['Hiçbir oda boş değil', 'Henüz hiçbir şey: yanıt bilinmiyor', 'Servis hata verdi'] }, caption: `Tek bir arama: **${span(IS.search.start, IS.search.end)}** arası boş odalar. Daha hiçbir yanıt gelmeden sonuç alanında **${trx(IS.ambiguous_empty)}** yazıyor.` },
          { caption: `**${trx(IST[0].label)}**: ${trx(IST[0].promise)}. Burada “${trx(IS.ambiguous_empty)}” demek, ekranın bilmediği bir şeyi vaat etmek olurdu.` },
          { caption: `**${trx(IST[1].label)}**: ${trx(IST[1].promise)}. Sonraki adım: ${trx(IST[1].next)}. Odak ${trx(IST[1].focus)}.` },
          { caption: `**${trx(IST[2].label)}**: ${trx(IST[2].promise)}. Bitiş saati başlangıçtan sonra olmalıdır ve odak ${trx(IST[2].focus)}.` },
          { caption: `**${trx(IST[3].label)}**: ${trx(IST[3].promise)}; bu yüzden boş odalar hakkında hiçbir şey bilinmiyor. Sonraki adım: ${trx(IST[3].next)}.` },
          { caption: `**${trx(IST[4].label)}**: ${trx(IST[4].promise)}: ${ROOM} ve ${ROOM2}. Sonraki adım: ${trx(IST[4].next)}.` },
          { caption: 'Beş durum, beş vaat; her biri sonraki adımı adlandırıyor.', principle: true },
        ] },
      { id: 'empty-or-failed', label: 'Değişiklik: boş sonuç ile başarısız istek', short: 'Boş mu, hata mı',
        states: [
          { caption: `Ekranı sabit tutun ve yalnızca olanı değiştirin. Önce: **hiç boş oda** bulamayan geçerli bir arama.` },
          { caption: 'Şimdi **başarısız bir istekten** sonra aynı alan. İkisi de oda göstermiyor, ama sözcükler farklı: aramalardan biri bitti, diğeri bitmedi.' },
          { caption: `Sonraki eylemler de farklı: **${trx(EMPTY.next)}** ile **${trx(FAILED.next)}**. İkisinde de odak mesaja geçer; böylece klavye kullanıcısı önce mesajla karşılaşır.` },
          { caption: 'Rengi kaldırın: iki durum hâlâ **sözcükleri** ve **simge biçimleriyle** ayrışıyor. R-05 kuralının istediği de budur: algılanabilen durum bilgisi.' },
          { caption: 'Aynı boş alan, iki vaat, iki sonraki adım.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      // ---------------------------------------------------------------- baseline: the search screen and the gallery
      const base = el('div', { 'data-cond': 'five-states', style: 'position:absolute;inset:0;display:grid;grid-template-columns:520px minmax(0,1fr);gap:20px' });
      h.start = field('Başlangıç', IS.search.start); h.end = field('Bitiş', IS.search.end);
      h.area = el('div', { style: 'min-height:190px;border:1.5px dashed var(--line-strong);border-radius:12px;padding:12px 16px;display:flex;flex-direction:column;justify-content:center;gap:8px' });
      h.searchBtn = el('div', { class: 'btn-reserve', role: 'presentation', style: 'display:inline-flex;align-items:center;min-height:48px' }, 'Ara');
      const screen = browser({ who: `${ARI.name} · ${ARI.id}`, url: 'campus-rooms.example/search', cls: 'is-search', body: [
        el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px' }, [h.start, h.end]),
        h.searchBtn,
        h.area,
      ] });
      screen.style.alignSelf = 'start';
      api.cue(screen, 'search-screen'); api.cue(h.area, 'results-area'); api.cue(h.end, 'end-field'); api.cue(h.searchBtn, 'search-button');
      base.appendChild(screen);
      const rows = IST.map((x, i) => ({ attrs: { class: 'rv', 'data-show-from': String(i + 1), 'data-focus-at': String(i + 1) }, cells: {
        state: el('span', { style: `font-weight:700;color:var(--${ICON_KIND[x.id]})` }, trx(x.label)),
        promise: el('span', { style: 'font-size:16px;line-height:1.28' }, upper1(trx(x.promise))),
        next: el('span', { style: 'font-size:16px;line-height:1.28' }, upper1(trx(x.next))),
        focus: el('span', { style: 'font-size:16px;line-height:1.28' }, upper1(trx(x.focus))) } }));
      h.gallery = table({ captionHidden: 'Beş arayüz durumu: her birinin vaadi, sonraki eylem ve odağın gittiği yer', cls: 'data-table--compact', columns: [{ key: 'state', label: 'Durum' }, { key: 'promise', label: 'Ne biliniyor' }, { key: 'next', label: 'Sonraki eylem' }, { key: 'focus', label: 'Klavye odağı' }], rows });
      h.gallery.querySelectorAll('td, th').forEach((c) => { c.style.padding = '7px 10px'; c.style.verticalAlign = 'top'; });
      h.gallery.querySelectorAll('thead th').forEach((c) => { c.style.fontSize = '15px'; });
      h.gallery.querySelectorAll('tbody tr').forEach((tr, i) => api.cue(tr, `state-${IST[i].id}`));
      api.cue(h.gallery, 'gallery');
      base.appendChild(el('div', { style: 'min-width:0' }, [cardTitle('Bir ekran, beş vaat', 'font-size:17px'), h.gallery]));
      stage.appendChild(base);
      // ---------------------------------------------------------------- changed: the same area, two causes
      const changed = el('div', { 'data-cond': 'empty-or-failed', style: 'position:absolute;inset:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:16px' });
      const panel = (x, title, action, name) => {
        const p = el('div', { class: 'card fx', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:10px;transition:filter 400ms' }, [
          cardTitle(title, 'margin:0;font-size:16px'),
          el('div', { style: 'border:1.5px dashed var(--line-strong);border-radius:12px;padding:12px 16px;outline:3px solid var(--focus);outline-offset:2px' }, stateMessage(x, { size: 19 })),
          el('div', { class: 'btn-reserve', role: 'presentation', style: 'display:inline-flex;align-items:center;min-height:44px;font-size:19px;background:var(--surface-3);color:var(--text);border:1.5px solid var(--line-strong)' }, action),
        ]);
        return api.cue(p, name);
      };
      h.emptyPanel = panel(EMPTY, `Geçerli arama, ${span(IS.search.start, IS.search.end)}: boş oda yok`, 'Saati değiştir', 'panel-empty');
      h.failedPanel = panel(FAILED, `Aynı arama, istek başarısız`, 'Yeniden dene', 'panel-failed');
      h.failedPanel.classList.add('rv', 'rv--rise'); h.failedPanel.setAttribute('data-show-from', '1');
      changed.appendChild(el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:20px' }, [h.emptyPanel, h.failedPanel]));
      const crow = (aspect, a, b, from, name) => ({ attrs: { class: 'rv', 'data-show-from': String(from), 'data-focus-at': String(from), 'data-name': name }, cells: { aspect: el('b', {}, aspect), a: el('span', { style: 'font-size:17px' }, a), b: el('span', { style: 'font-size:17px' }, b) } });
      h.compare = table({ captionHidden: 'Boş sonuç ile başarısız isteğin karşılaştırması', cls: 'data-table--compact', columns: [{ key: 'aspect', label: 'Karşılaştırma' }, { key: 'a', label: trx(EMPTY.label) }, { key: 'b', label: trx(FAILED.label) }], rows: [
        crow('Ne biliniyor', upper1(trx(EMPTY.promise)), upper1(trx(FAILED.promise)), 1, 'known'),
        crow('Sonraki eylem', upper1(trx(EMPTY.next)), upper1(trx(FAILED.next)), 2, 'next'),
        crow('Klavye odağı', upper1(trx(EMPTY.focus)), upper1(trx(FAILED.focus)), 2, 'focus'),
        crow('Renk olmadan', `Sözcükler ve ${trx(EMPTY.icon)} simgesi`, `Sözcükler ve ${trx(FAILED.icon)} simgesi`, 3, 'no-color'),
      ] });
      h.compare.querySelectorAll('td, th').forEach((c) => { c.style.padding = '7px 12px'; });
      h.compare.querySelectorAll('tbody tr').forEach((tr) => api.cue(tr, `compare-${tr.getAttribute('data-name')}`));
      api.cue(h.compare, 'compare');
      changed.appendChild(el('div', { style: 'min-height:0' }, h.compare));
      stage.appendChild(changed);
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'five-states';
      if (base) {
        const x = st >= 1 ? IST[Math.min(st, 5) - 1] : null;
        h.area.replaceChildren(x ? stateMessage(x) : el('div', { style: 'display:flex;flex-direction:column;gap:6px' }, [
          el('p', { style: 'font-size:26px;font-weight:700' }, trx(IS.ambiguous_empty)),
          el('p', { class: 'muted', style: 'font-size:16px' }, `(${span(IS.search.start, IS.search.end)} araması hâlâ sürüyor)`),
        ]));
        const invalid = x && x.id === 'validation';
        h.start.querySelector('.v').textContent = invalid ? x.input.start : IS.search.start;
        h.end.querySelector('.v').textContent = invalid ? x.input.end : IS.search.end;
        h.end.classList.toggle('is-focus', !!invalid);
        const focusArea = x && x.id !== 'validation' && x.id !== 'loading';
        h.area.style.outline = focusArea ? '3px solid var(--focus)' : '';
        h.area.style.outlineOffset = focusArea ? '2px' : '';
        h.searchBtn.style.outline = x && x.id === 'loading' ? '3px solid var(--focus)' : '';
        h.searchBtn.style.outlineOffset = '3px';
      } else {
        [h.emptyPanel, h.failedPanel].forEach((p) => { p.style.filter = st >= 3 ? 'grayscale(1)' : ''; });
        focusIf(h.emptyPanel, st === 0);
        focusIf(h.failedPanel, st === 1);
      }
    },
    print: [
      { title: 'Beş durumda tek bir arama ekranı: ne bilindiği ve sonra ne yapılacağı', condition: 'five-states', state: 5, note: IST.map((x) => `${trx(x.label)}: “${trx(x.message)}” (${trx(x.promise)}; sonraki adım: ${trx(x.next)}; odak ${trx(x.focus)})`).join(' · ') },
      { title: 'Boş sonuç ile başarısız istek, renkli ve renksiz', condition: 'empty-or-failed', state: 3, principle: true, note: `${trx(EMPTY.label)}: “${trx(EMPTY.message)}” ${trx(FAILED.label)}: “${trx(FAILED.message)}” Sonraki eylemler farklıdır (${trx(EMPTY.next)}; ${trx(FAILED.next)}); durumlar yalnızca renkle değil, sözcüklerle ve simge biçimiyle ayrışır.` },
    ],
  };

  // =====================================================================
  // SCENE 7 · model-consistency (Bridge)
  // =====================================================================
  const MCX = MC.existing, MCC = MC.candidate;
  const FLAW = MC.flawed, FIX = MC.corrected;
  const mins = (hhmm) => { const [a, b] = hhmm.split(':').map(Number); return a * 60 + b; };
  // the candidate is the course interval case the fixture names; recompute the overlap from it
  const IVC = F.interval_cases[MCC.interval_case];
  if (mins(MCC.start) !== IVC.candidate[0] || mins(MCC.end) !== IVC.candidate[1] || mins(MCX.start) !== IVC.existing[0] || !IVC.expected_conflict) throw new Error('model-consistency candidate does not match its interval case');
  const modelConsistency = {
    id: 'model-consistency', role: 'bridge',
    heading: `Derli toplu bir diyagram “Onaylandı” diyor. ${MC.rule} ile çelişki nerede?`,
    lead: 'Uyuşması gereken üç panel: kural, bir sıralama diyagramı ve etkileşimden sonraki takvim. Somut bir isteği üçünden de geçirin.',
    principle: 'Modeller, iddiaları hem birbirine hem de amaçlanan davranışa karşı sınanabildiğinde yararlıdır.',
    principleShort: 'Bir örneği her modelden geçirin; modeller uyuşmalıdır.',
    conditions: [
      { id: 'confirm-first', baseline: true, label: 'Başlangıç: diyagram karar vermeden önce onaylıyor', short: 'Önce onay',
        states: [
          { prompt: { question: `${ARI.name} ${span(MCX.start, MCX.end)} aralığını tutarken ${BO.name}, ${ROOM} için ${span(MCC.start, MCC.end)} istiyor. Diyagram ${MC.rule} ile nerede çelişiyor?`, options: ['Hiçbir yerde: her ok derli toplu', '2. mesaj herhangi bir karardan önce söz veriyor', 'Yalnızca takvimde'] }, caption: `Solda kural, ortada bir sıralama diyagramı, sağda ${ROOM} takvimi. ${BO.name}'nun isteğini üçünden de geçirin.` },
          { caption: `**1 ${trx(FLAW[0].message)}**: ${BO.name}'nun tarayıcısı isteği Rezervasyon Servisi'ne gönderir.` },
          { caption: `**2 ${trx(FLAW[1].message)}** doğrudan ${BO.name}'ya geri gidiyor. Henüz hiçbir karar verilmedi: diyagram bilmeden söz veriyor.` },
          { caption: `Sonra **3 ${trx(FLAW[2].message)}** ve **4 ${trx(FLAW[3].message)}** geliyor, ama çok geç. ${ROOM} için artık **${span(MC.overlap.start, MC.overlap.end)}** arasında çakışan iki onaylanmış rezervasyon var.` },
          { caption: `Çelişki: ${MC.rule} bu çakışmayı yasaklıyor, mesaj sırası ise ona izin verdi. **2. mesaj karardan önce geliyor.** Derli toplu, ama yanlış.` },
          { caption: 'Üç panelden geçirilen tek bir somut istek, asılsız bir vaadi ortaya çıkardı.', principle: true },
        ] },
      { id: 'decide-first', label: 'Değişiklik: Onaylandı, karardan sonraya taşınıyor', short: 'Önce karar',
        states: [
          { caption: 'Aynı kural, aynı iki istek, aynı takvim. Tek bir değişiklik: yanıt, yetkili deponun kararından sonraya taşınıyor.' },
          { caption: `**1 ${trx(FIX[0].message)}**, ardından **2 ${trx(FIX[1].message)}**: kimseye bir şey söylenmeden önce depo karar veriyor.` },
          { caption: `**3 ${trx(FIX[2].message)}**, dolayısıyla **4 ${trx(FIX[3].message)}**. Takvimde tek bir rezervasyon kalıyor; kural, diyagram ve takvim uyuşuyor.` },
          { caption: `İki diyagram da aynı ölçüde derli toplu; ama yalnızca biri ${MC.rule} ile uyuşuyor.`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:290px 584px minmax(0,1fr);gap:16px' });
      // ---------------------------------------------------------------- rule panel
      h.verdict = el('div', { style: 'font-size:19px;font-weight:700;min-height:28px' });
      h.rule = el('div', { class: 'card fx', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:10px;align-self:start' }, [
        chip(`Kural ${MC.rule}`, 'warn', { style: 'font-size:17px;align-self:flex-start' }),
        el('p', { style: 'font-size:20px;line-height:1.32;font-weight:600' }, trx(MC.rule_text)),
        el('div', { style: 'border-top:1px solid var(--line);padding-top:8px;display:flex;flex-direction:column;gap:6px' }, [
          el('div', { class: 'muted', style: 'font-size:15px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase' }, 'İki istek'),
          el('div', { style: 'font-size:17px;line-height:1.3' }, [el('b', {}, `${MCX.booking} · ${nameOf(MCX.owner)}`), ` · ${MCX.room}, ${span(MCX.start, MCX.end)}`]),
          el('div', { style: 'font-size:17px;line-height:1.3' }, [el('b', {}, `${nameOf(MCC.requester)}'nun isteği`), ` · ${MCC.room}, ${span(MCC.start, MCC.end)}`]),
        ]),
        h.verdict,
      ]);
      api.cue(h.rule, 'rule-panel');
      wrap.appendChild(h.rule);
      // ---------------------------------------------------------------- sequence panel
      const W = 584, H = 560;
      const svg = window.VC.svg(W, H, { label: 'İsteğin sıralama diyagramı, hatalı ya da düzeltilmiş', uid: (x) => api.uid(x) });
      const LX = [96, 300, 496];
      MC.participants.forEach((p, i) => {
        const hd = node({ x: LX[i] - 88, y: 6, w: 176, h: 54, label: trx(p), kind: i === 2 ? 'store' : 'box' });
        hd.querySelectorAll('.n-label').forEach((t) => { t.style.fontSize = '17px'; });
        svg.appendChild(s('line', { x1: LX[i], y1: 60, x2: LX[i], y2: 548, stroke: 'var(--line-strong)', 'stroke-width': 2, 'stroke-dasharray': '6 7' }));
        svg.appendChild(hd);
      });
      const idx = (name) => MC.participants.indexOf(name);
      const Y = [120, 206, 292, 378];
      const msg = (m, y, cond, from, kind, name) => {
        const fi = idx(m.from), ti = idx(m.to);
        let g;
        if (fi === ti) {
          g = arrow(svg, { from: { x: LX[fi], y: y - 18 }, via: [{ x: LX[fi] + 80, y: y - 18 }, { x: LX[fi] + 80, y: y + 18 }], to: { x: LX[fi] + 5, y: y + 18 }, kind, label: [`${m.n}  ${m.message.split(' ')[0]}`, m.message.split(' ').slice(1).join(' ')], labelAnchor: 'start', labelDx: 10, labelDy: -4 });
        } else {
          const dir = ti > fi ? 1 : -1;
          g = arrow(svg, { from: { x: LX[fi] + 4 * dir, y }, to: { x: LX[ti] - 5 * dir, y }, kind, label: `${m.n}  ${m.message}`, labelDy: -12 });
        }
        g.classList.add('rv', 'fx');
        g.setAttribute('data-cond', cond); g.setAttribute('data-show-from', String(from));
        return api.cue(g, name);
      };
      h.flaw = FLAW.map((m, i) => msg(trMsg(m), Y[i], 'confirm-first', [1, 2, 3, 3][i], i === 1 ? 'warn' : 'accent', `flawed-${m.n}`));
      h.fix = FIX.map((m, i) => msg(trMsg(m), Y[i], 'decide-first', [1, 1, 2, 2][i], i === 3 ? 'bad' : i === 1 ? 'ok' : 'accent', `corrected-${m.n}`));
      h.bracket = s('g', { class: 'rv', 'data-cond': 'confirm-first', 'data-show-from': '4' });
      h.bracket.appendChild(s('rect', { x: 8, y: Y[1] - 44, width: 568, height: Y[3] - Y[1] + 74, rx: 12, fill: 'none', stroke: 'var(--bad)', 'stroke-width': 3, 'stroke-dasharray': '10 7' }));
      h.bracket.appendChild(text(W / 2, Y[3] + 66, '2. mesaj, 4. mesajdaki karardan önce söz veriyor', { 'text-anchor': 'middle', style: 'font-size:18px;font-weight:700;fill:var(--bad)' }));
      svg.appendChild(h.bracket);
      api.cue(h.bracket, 'contradiction');
      h.seq = el('div', { class: 'card', style: 'padding:4px;min-height:0;align-self:start' }, svg);
      api.cue(h.seq, 'sequence-panel');
      wrap.appendChild(h.seq);
      // ---------------------------------------------------------------- calendar panel
      const CW = 330, CH = 330, t0 = mins(MCX.start), t1 = mins(MCC.end);
      const cx = (hhmm) => 20 + (mins(hhmm) - t0) * (CW - 40) / (t1 - t0);
      const cal = window.VC.svg(CW, CH, { label: `Etkileşimden sonra ${ROOM} takvimi`, uid: (x) => api.uid(`cal-${x}`) });
      const ticks = [];
      for (let m = 0; m <= t1 - t0; m += 30) ticks.push(`${String(Math.floor((t0 + m) / 60)).padStart(2, '0')}:${String((t0 + m) % 60).padStart(2, '0')}`);
      h.overlap = s('rect', { x: cx(MC.overlap.start), y: 44, width: cx(MC.overlap.end) - cx(MC.overlap.start), height: 176, fill: `url(#${api.uid('cal-hatch-bad')})`, class: 'rv' });
      cal.appendChild(h.overlap);
      ticks.forEach((t) => {
        cal.appendChild(s('line', { x1: cx(t), y1: 40, x2: cx(t), y2: 232, stroke: 'var(--line)', 'stroke-width': 1.5 }));
        cal.appendChild(text(cx(t), 258, t, { 'text-anchor': 'middle', style: 'font-size:15px;fill:var(--text-muted)' }));
      });
      cal.appendChild(text(20, 24, ROOM, { style: 'font-size:20px;font-weight:700' }));
      const bar = (b, y, kind) => {
        const g = s('g', {});
        g.appendChild(s('rect', { x: cx(b.start), y, width: cx(b.end) - cx(b.start), height: 64, rx: 10, fill: 'var(--surface-2)', stroke: `var(--${kind})`, 'stroke-width': 2.5 }));
        g.appendChild(s('rect', { x: cx(b.start), y, width: cx(b.end) - cx(b.start), height: 64, rx: 10, fill: `var(--${kind}-fill)` }));
        g.appendChild(text(cx(b.start) + 10, y + 26, `${b.booking} · ${nameOf(b.owner)}`, { style: 'font-size:17px;font-weight:700' }));
        g.appendChild(text(cx(b.start) + 10, y + 50, span(b.start, b.end), { style: 'font-size:15px;fill:var(--text-muted)' }));
        cal.appendChild(g);
        return g;
      };
      h.barA = bar(MC.flawed_calendar[0], 56, 'ok');
      h.barB = bar(MC.flawed_calendar[1], 144, 'bad');
      h.overlapLabel = text(cx(MC.overlap.start) + (cx(MC.overlap.end) - cx(MC.overlap.start)) / 2, 300, `çakışma ${span(MC.overlap.start, MC.overlap.end)}`, { 'text-anchor': 'middle', style: 'font-size:17px;font-weight:700;fill:var(--bad)' });
      h.rejected = text(20, 300, `${nameOf(MCC.requester)}: Reddedildi; kayıt yok`, { style: 'font-size:16px;font-weight:700;fill:var(--text-muted)' });
      cal.append(h.overlapLabel, h.rejected);
      [h.barB, h.overlapLabel, h.rejected].forEach((n) => n.classList.add('rv'));
      cal.appendChild(text(CW - 12, 24, 'ikisi de Onaylandı', { 'text-anchor': 'end', class: 'rv cal-both', style: 'font-size:15px;fill:var(--text-muted)' }));
      h.both = cal.querySelector('.cal-both');
      api.cue(h.barA, 'calendar-existing'); api.cue(h.barB, 'calendar-candidate'); api.cue(h.overlap, 'overlap');
      h.calendar = el('div', { class: 'card fx', style: 'padding:10px 12px;display:flex;flex-direction:column;gap:6px;align-self:start' }, [cardTitle('Etkileşimden sonraki takvim', 'margin:0;font-size:16px'), cal]);
      api.cue(h.calendar, 'calendar-panel');
      // a hatch pattern local to the calendar (the shared one belongs to the scene's other diagram)
      const defs = cal.querySelector('defs');
      const hatch = s('pattern', { id: api.uid('cal-hatch-bad'), width: 10, height: 10, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
      hatch.appendChild(s('rect', { width: 10, height: 10, fill: 'var(--bad-fill)' }));
      hatch.appendChild(s('line', { x1: 0, y1: 0, x2: 0, y2: 10, stroke: 'var(--bad)', 'stroke-width': 3 }));
      defs.appendChild(hatch);
      h.agree = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'decide-first', 'data-show-from': '2', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:6px;border-color:var(--ok)' }), [
        cardTitle('Üçü uyuşuyor mu?', 'margin:0;font-size:16px'),
        el('div', { style: 'font-size:18px' }, [tick(true), ` Kural ${MC.rule}: çakışma yok`]),
        el('div', { style: 'font-size:18px' }, [tick(true), ' Diyagram: önce karar, sonra yanıt']),
        el('div', { style: 'font-size:18px' }, [tick(true), ` Takvim: ${ROOM} için tek rezervasyon`]),
      ]);
      api.cue(h.agree, 'agreement');
      wrap.appendChild(el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-width:0' }, [h.calendar, h.agree]));
      stage.appendChild(wrap);
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'confirm-first';
      const overlapShown = base && st >= 3;
      showIf(h.barB, overlapShown); showIf(h.overlap, overlapShown); showIf(h.overlapLabel, overlapShown); showIf(h.both, overlapShown);
      showIf(h.rejected, !base && st >= 2);
      h.flaw.forEach((g, i) => focusIf(g, base && ((st === 1 && i === 0) || (st === 2 && i === 1) || (st === 3 && i >= 2) || (st === 4 && (i === 1 || i === 3)))));
      h.fix.forEach((g, i) => focusIf(g, !base && ((st === 1 && i <= 1) || (st === 2 && i >= 2))));
      const contradicted = base && st >= 4, holds = !base && st >= 2;
      h.verdict.replaceChildren(contradicted ? tone('bad', '✕ takvimle çelişiyor') : holds ? tone('ok', '✓ üç panelde de geçerli') : el('span', { class: 'muted', style: 'font-weight:500' }, 'Henüz kontrol edilmedi'));
      h.rule.style.borderColor = contradicted ? 'var(--bad)' : holds ? 'var(--ok)' : '';
      focusIf(h.calendar, base && st === 3);
    },
    print: [
      { title: 'Hatalı sıralama: karardan önce Onaylandı ve çakışan takvim', condition: 'confirm-first', state: 4, note: `${MC.rule}: ${trx(MC.rule_text)} ${FLAW.map((m) => `${m.n} ${trx(m.from)} → ${trx(m.to)}: ${trx(m.message)}`).join('; ')}. Sonuç: ${ROOM} için onaylanmış iki rezervasyon ${span(MC.overlap.start, MC.overlap.end)} arasında çakışıyor. Çelişki: ${trx(MC.contradiction)}.` },
      { title: 'Düzeltilmiş sıralama: önce karar ver, sonra yanıtla; üç panel uyuşuyor', condition: 'decide-first', state: 2, principle: true, note: `${FIX.map((m) => `${m.n} ${trx(m.from)} → ${trx(m.to)}: ${trx(m.message)}`).join('; ')}. Takvimde yalnızca ${MCX.booking} kalıyor; kural, diyagram ve takvim uyuşuyor. İki diyagram eşit ölçüde derli toplu; tutarlılıkları ise eşit değil.` },
    ],
  };

  // =====================================================================
  // SCENE 8 · abstraction-and-zoom (Bridge)
  // =====================================================================
  const VIEWS = AZ.views;                        // context, sequence, state, data
  const view = (id) => VIEWS.find((v) => v.id === id);
  const Q1 = AZ.questions[0], Q2 = AZ.questions[1];
  const AUD = AZ.audiences;
  const VIEW_AT = ['', 'context', 'data', '', 'sequence', 'state', 'matrix'];   // the view each baseline state opens
  const STATE_OF = { context: 1, data: 2, sequence: 4, state: 5 };
  const abstractionAndZoom = {
    id: 'abstraction-and-zoom', role: 'bridge',
    heading: `“${trx(Q1.q)}” sorusunu hangi görünüm yanıtlar?`,
    lead: 'Bir rezervasyon, dört görünüm: bağlam, sıralama, durum ve veri. Her biri sorusunun gerektirdiğini tutar, gerisini bilerek dışarıda bırakır.',
    principle: 'Yararlı bir soyutlama, sorusu için önemli olanı korur; dışarıda bıraktıklarını da bilerek bırakır.',
    principleShort: 'Sorunun gerektirdiğini tutun; gerisini bilerek dışarıda bırakın.',
    conditions: [
      { id: 'student', baseline: true, label: 'Başlangıç: bir öğrenci rezervasyonu soruyor', short: 'Öğrenci',
        states: [
          // the Q1/Q2 answers start with the identifier B-001, so they are not lower-cased (the English deck prints "b-001" there)
          { prompt: { question: `“${trx(Q1.q)}” sorusunu hangi görünüm yanıtlar?`, options: ['Bağlam', 'Sıralama', 'Veri'] }, caption: `Aynı rezervasyonun (${BK.id}) dört görünümü. Hangisinin açılacağına soru karar verir.` },
          { caption: `**Bağlam görünümü**, Campus Rooms hizmetini kimin kullandığını ve dışında ne olduğunu gösterir. Sahip alanı olmadığı için soruyu yanıtlayamaz.` },
          { caption: `**Veri görünümü** soruyu yanıtlar: ${BK.id} kaydında **owner_id ${BK.owner_id}** var, yani ${ARI.name}. Olayların sırasını ve ekran mesajlarını dışarıda bırakır ve hiçbir şey kaybetmez.` },
          { prompt: { question: `“${trx(Q2.q)}” sorusunu hangi görünüm yanıtlar?`, options: ['Veri', 'Sıralama', 'Durum'] }, caption: 'Aynı rezervasyon hakkında ikinci bir soru. Sonraki görünüm açılmadan önce karar verin.' },
          { caption: `**Sıralama görünümü**: ${trx(Q2.answer)}. Alan yok, sahip yok: bu sorunun bunlara ihtiyacı yok.` },
          { caption: `**Durum görünümü** üçüncü bir soruyu yanıtlar: ${trx(view('state').answers)} R-03 uyarınca Onaylandı durumundan İptal edildi durumuna geçilebilir.` },
          { caption: 'Her görünüme bir soru; her görünüm neyi dışarıda bıraktığını söyler.', principle: true },
        ] },
      { id: 'maintainer', label: 'Değişiklik: bir bakımcı hatayı inceliyor', short: 'Bakımcı',
        states: [
          { caption: `Aynı rezervasyon, farklı bir kişi: ${lower1(trx(AUD.maintainer.label))}. ${ARI.name}'nin neden “Sonuç bilinmiyor” gördüğünü soruyor.` },
          { caption: `Bakımcının ihtiyacı: **${trx(AUD.maintainer.needs)}**. ${upper1(trx(AUD.maintainer.omits))} dışarıda bırakılabilir.` },
          { caption: `Öğrencinin ihtiyacı: **${trx(AUD.student.needs)}**; ${trx(AUD.student.omits)} dışarıda bırakılabilir. Aynı rezervasyon, farklı yararlı ayrıntı.` },
          { caption: 'Hedef kitleyi değiştirin; yararlı model de onunla birlikte değişir.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-rows:64px minmax(0,1fr);gap:14px' });
      // ---------------------------------------------------------------- the representation selector and the question
      h.tabs = {};
      const tabRow = el('div', { style: 'display:flex;gap:10px;align-items:center' }, [el('span', { class: 'muted', style: 'font-size:17px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-right:4px' }, 'Görünüm')]);
      ['context', 'sequence', 'state', 'data'].forEach((id) => {
        const b = el('button', { type: 'button', class: 'ctl-btn', 'aria-pressed': 'false', style: 'height:52px;font-size:20px;padding:0 18px;min-width:130px' }, trx(view(id).label));
        b.addEventListener('click', () => { if (api.condition === 'student' && api.state !== STATE_OF[id]) api.setState(STATE_OF[id]); });
        h.tabs[id] = api.cue(b, `view-${id}`);
        tabRow.appendChild(b);
      });
      h.question = el('div', { style: 'margin-left:auto;font-size:22px;font-weight:700;color:var(--warn);max-width:520px;text-align:right;line-height:1.2' });
      tabRow.appendChild(api.cue(h.question, 'current-question'));
      wrap.appendChild(tabRow);
      // ---------------------------------------------------------------- the views
      const main = el('div', { style: 'display:grid;grid-template-columns:800px minmax(0,1fr);gap:20px;min-height:0' });
      const W = 800, H = 470;
      const svg = window.VC.svg(W, H, { label: `${BK.id} rezervasyonunun görünümleri`, uid: (x) => api.uid(x) });
      const group = (id) => { const g = s('g', { 'data-view': id, class: 'rv' }); svg.appendChild(g); return g; };
      const put = (g, n) => { g.appendChild(n); return n; };
      // context
      h.vContext = group('context');
      put(h.vContext, boundary({ x: 250, y: 50, w: 300, h: 300, label: 'Campus Rooms' }));
      put(h.vContext, text(400, 200, ['odalar, rezervasyonlar,', 'R-01–R-05 kuralları'], { 'text-anchor': 'middle', class: 'n-sub', lineHeight: 26 }));
      const pA = put(h.vContext, person({ x: 110, y: 130, name: ARI.name, role: 'kampüs üyesi' }));
      const pB = put(h.vContext, person({ x: 110, y: 330, name: BO.name, role: 'kampüs üyesi' }));
      const pS = put(h.vContext, person({ x: 690, y: 130, name: 'Oda personeli', role: 'odaları yönetir' }));
      const mail = put(h.vContext, node({ x: 610, y: 300, w: 170, h: 80, label: trx(AZ.outside_systems[0]), kind: 'ext', kindLabel: 'dış sistem' }));
      put(h.vContext, arrow(svg, { from: { x: 150, y: 120 }, to: { x: 250, y: 150 }, kind: 'accent', label: 'ayırtır' }));
      put(h.vContext, arrow(svg, { from: { x: 150, y: 320 }, to: { x: 250, y: 290 }, kind: 'accent', label: 'ayırtır' }));
      put(h.vContext, arrow(svg, { from: { x: 650, y: 120 }, to: { x: 550, y: 150 }, kind: 'accent', label: 'yönetir' }));
      put(h.vContext, arrow(svg, { from: { x: 550, y: 320 }, to: { x: 610, y: 335 }, kind: 'violet', dashed: true }));
      [pA, pB, pS, mail].forEach((n, i) => api.cue(n, `context-${['ari', 'bo', 'staff', 'mail'][i]}`));
      // data
      h.vData = group('data');
      const rec = (x, y, w, title, lines, hi) => {
        const g = s('g', { class: 'fx' });
        g.appendChild(s('rect', { x, y, width: w, height: 40 + lines.length * 32 + 8, rx: 12, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 }));
        g.appendChild(s('rect', { x, y, width: w, height: 40, rx: 12, fill: 'var(--accent-fill)' }));
        g.appendChild(text(x + 16, y + 28, title, { style: 'font-size:21px;font-weight:700;fill:var(--accent-strong)' }));
        lines.forEach((ln, i) => g.appendChild(text(x + 16, y + 66 + i * 32, ln, { style: `font-size:19px;font-family:var(--font-mono);fill:var(--${i === hi ? 'warn' : 'text'});font-weight:${i === hi ? 700 : 400}` })));
        return put(h.vData, g);
      };
      const bRec = rec(40, 150, 320, `Rezervasyon ${BK.id}`, [`owner_id  ${BK.owner_id}`, `room_id   ${BK.room_id}`, `state     ${trx(BK.state)}`], 0);
      const uRec = rec(480, 40, 280, `Kullanıcı ${ARI.id}`, [`name  ${ARI.name}`], -1);
      const rRec = rec(480, 300, 280, `Oda ${ROOM}`, [`display_name`, `  ${trx(ID.rename.display_name_before)}`], -1);
      put(h.vData, arrow(svg, { from: { x: 360, y: 208 }, to: { x: 480, y: 100 }, kind: 'warn', label: 'owner_id', labelDy: -14 }));
      put(h.vData, arrow(svg, { from: { x: 360, y: 240 }, to: { x: 480, y: 340 }, kind: 'accent', label: 'room_id', labelDy: 30 }));
      api.cue(bRec, 'data-booking'); api.cue(uRec, 'data-user'); api.cue(rRec, 'data-room');
      // sequence
      h.vSeq = group('sequence');
      const SLX = [120, 400, 680];
      PART.slice(0, 3).forEach((p, i) => {
        const hd = node({ x: SLX[i] - 110, y: 10, w: 220, h: 54, label: trx(p), kind: i === 2 ? 'store' : 'box' });
        hd.querySelectorAll('.n-label').forEach((t) => { t.style.fontSize = '19px'; });
        put(h.vSeq, s('line', { x1: SLX[i], y1: 64, x2: SLX[i], y2: 450, stroke: 'var(--line-strong)', 'stroke-width': 2, 'stroke-dasharray': '6 7' }));
        put(h.vSeq, hd);
      });
      const sm = (m, y, kind, extra) => put(h.vSeq, arrow(svg, Object.assign({ from: { x: SLX[PART.indexOf(m.from)] + (PART.indexOf(m.to) > PART.indexOf(m.from) ? 4 : -4), y }, to: { x: SLX[PART.indexOf(m.to)] + (PART.indexOf(m.to) > PART.indexOf(m.from) ? -5 : 5), y }, kind, label: `${m.n}  ${m.message}`, labelDy: -12 }, extra || {})));
      sm(trMsg(SUCC[0]), 110, 'accent');
      put(h.vSeq, arrow(svg, { from: { x: SLX[1], y: 150 }, via: [{ x: SLX[1] + 80, y: 150 }, { x: SLX[1] + 80, y: 186 }], to: { x: SLX[1] + 5, y: 186 }, kind: 'accent', label: `${SUCC[1].n}  ${trx(SUCC[1].message)}`, labelAnchor: 'start', labelDx: 10, labelDy: 8 }));
      sm(trMsg(SUCC[2]), 240, 'accent'); sm(trMsg(SUCC[3]), 304, 'ok');
      const lost5 = sm({ n: 5, from: SUCC[4].from, to: SUCC[4].to, message: `${trx(SUCC[4].message)} · ${trx(LOST.step_5)}` }, 380, 'bad', { labelDy: -20 });   // the longer Turkish label clears the cross
      lost5.querySelector('.a-line').setAttribute('stroke-dasharray', '10 8');
      lost5.appendChild(markX(260, 380, 12));
      api.cue(lost5, 'sequence-lost');
      // state
      h.vState = group('state');
      put(h.vState, s('circle', { cx: 36, cy: 235, r: 12, fill: 'var(--text)' }));
      const sC = put(h.vState, stateNode(150, 204, 200, trx(SM.stored_states[0])));
      const sX = put(h.vState, stateNode(590, 204, 200, trx(SM.stored_states[1])));
      put(h.vState, arrow(svg, { from: { x: 48, y: 235 }, to: { x: 150, y: 235 }, kind: 'ok', label: ['karar verildi', 've saklandı'], labelDy: -44 }));
      put(h.vState, arrow(svg, { from: { x: 350, y: 235 }, to: { x: 590, y: 235 }, kind: 'ok', label: `${trx(STT.event)} [${trx(STT.condition)}]` }));
      put(h.vState, s('rect', { x: 141, y: 195, width: 218, height: 80, rx: 36, fill: 'none', stroke: 'var(--warn)', 'stroke-width': 5 }));
      put(h.vState, text(250, 310, `${BK.id} şu an burada`, { 'text-anchor': 'middle', style: 'font-size:18px;font-weight:700;fill:var(--warn)' }));
      api.cue(sC, 'state-confirmed'); api.cue(sX, 'state-cancelled');
      h.views = { context: h.vContext, data: h.vData, sequence: h.vSeq, state: h.vState };
      h.answer = el('div', { class: 'callout callout--ok', style: 'font-size:19px;padding:8px 14px;line-height:1.3;min-height:44px' });
      h.diagram = el('div', { class: 'card', style: 'padding:6px 8px;display:flex;flex-direction:column;gap:8px' }, [svg, h.answer]);
      api.cue(h.diagram, 'view-diagram'); api.cue(h.answer, 'answer');
      // the question-to-model matrix (last baseline state)
      h.matrix = table({ captionHidden: 'Soru–model matrisi: her görünümün neyi yanıtladığı, neyi tuttuğu ve neyi dışarıda bıraktığı', cls: 'data-table--compact', columns: [{ key: 'v', label: 'Görünüm' }, { key: 'a', label: 'Yanıtladığı' }, { key: 'k', label: 'Tuttuğu' }, { key: 'o', label: 'Dışarıda bıraktığı' }],
        rows: VIEWS.map((v) => ({ cells: { v: el('b', {}, trx(v.label)), a: el('span', { style: 'font-size:17px' }, trx(v.answers)), k: el('span', { style: 'font-size:17px' }, upper1(trx(v.keeps))), o: el('span', { style: 'font-size:17px' }, upper1(trx(v.omits))) } })) });
      h.matrix.querySelectorAll('td, th').forEach((c) => { c.style.padding = '8px 12px'; });
      h.matrix.querySelectorAll('tbody tr').forEach((tr, i) => api.cue(tr, `matrix-${VIEWS[i].id}`));
      h.matrixCard = el('div', reveal({ class: 'card rv rv--rise', style: 'padding:12px 16px;grid-area:1 / 1 / 2 / 3;align-self:start' }), [cardTitle('Her görünüme bir soru', 'font-size:17px'), h.matrix]);
      api.cue(h.matrixCard, 'matrix');
      h.diagram.style.gridArea = '1 / 1';
      // right: keeps and leaves out of the open view (baseline) or the two audiences (changed)
      h.keeps = el('div', { style: 'font-size:19px;line-height:1.32' });
      h.omits = el('div', { style: 'font-size:19px;line-height:1.32' });
      h.info = el('div', { class: 'card', 'data-cond': 'student', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:10px;grid-area:1 / 2;align-self:start' }, [
        (h.infoTitle = cardTitle('Bir görünüm açın', 'margin:0;font-size:17px')),
        el('div', {}, [el('div', { style: 'font-size:15px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--ok)' }, 'Tuttuğu'), h.keeps]),
        el('div', {}, [el('div', { style: 'font-size:15px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-soft)' }, 'Bilerek dışarıda bıraktığı'), h.omits]),
      ]);
      api.cue(h.info, 'keeps-leaves-out');
      const audienceCard = (a, from, name) => api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-show-from': String(from), style: 'padding:12px 16px;display:flex;flex-direction:column;gap:6px' }), [
        cardTitle(trx(a.label), 'margin:0;font-size:16px'),
        el('div', { style: 'font-size:18px;line-height:1.3' }, [el('b', { style: 'color:var(--ok)' }, 'İhtiyacı: '), trx(a.needs)]),
        el('div', { style: 'font-size:18px;line-height:1.3' }, [el('b', { style: 'color:var(--text-soft)' }, 'Dışarıda bıraktığı: '), trx(a.omits)]),
      ]), name);
      h.audiences = el('div', { 'data-cond': 'maintainer', style: 'display:flex;flex-direction:column;gap:12px;grid-area:1 / 2;align-self:start' }, [audienceCard(AUD.maintainer, 1, 'audience-maintainer'), audienceCard(AUD.student, 2, 'audience-student')]);
      main.append(h.diagram, h.info, h.audiences, h.matrixCard);
      wrap.appendChild(main);
      stage.appendChild(wrap);
      return h;
    },
    render(h, view_) {
      const st = view_.state, base = view_.conditionId === 'student';
      const open = base ? VIEW_AT[st] : (st >= 1 ? 'sequence' : '');
      Object.entries(h.views).forEach(([id, g]) => showIf(g, open === id));
      Object.entries(h.tabs).forEach(([id, b]) => {
        b.setAttribute('aria-pressed', open === id ? 'true' : 'false');
        b.style.borderColor = open === id ? 'var(--warn)' : '';
        b.style.background = open === id ? 'var(--warn-fill)' : '';
        b.setAttribute('aria-disabled', base ? 'false' : 'true');
      });
      const matrix = base && open === 'matrix';
      showIf(h.matrixCard, matrix);
      h.diagram.style.visibility = matrix ? 'hidden' : '';
      h.info.style.visibility = matrix ? 'hidden' : '';
      const q = base ? (st <= 2 ? trx(Q1.q) : st <= 4 ? trx(Q2.q) : st === 5 ? trx(view('state').answers) : '') : (st >= 1 ? trx(Q2.q) : '');
      h.question.textContent = q;
      const answers = { data: `Cevap: ${Q1.answer.replace(': ', ', yani ')}.`, sequence: `Cevap: ${upper1(trx(Q2.answer))}.`, context: 'Burada sahip alanı yok: bu görünüm soruyu yanıtlayamaz.', state: `${BK.id} Onaylandı durumunda; ${trx(STT.event)} [${trx(STT.condition)}] onu ${trx(STT.to)} durumuna götürür.` };
      h.answer.textContent = answers[open] || (base ? 'Soru için bir görünüm seçin.' : `Hedef kitle: ${lower1(trx(AUD.maintainer.label))}.`);
      h.answer.className = `callout ${open === 'context' ? 'callout--bad' : open ? 'callout--ok' : 'callout--accent'}`;
      const v = VIEWS.find((x) => x.id === open);
      h.infoTitle.textContent = v ? `${trx(v.label)} görünümü` : 'Bir görünüm açın';
      h.keeps.textContent = v ? upper1(trx(v.keeps)) : '·';
      h.omits.textContent = v ? upper1(trx(v.omits)) : '·';
    },
    print: [
      { title: 'Bir rezervasyonun dört görünümü: soru–model matrisi', condition: 'student', state: 6, principle: true, note: `${VIEWS.map((v) => `${trx(v.label)}: “${trx(v.answers)}” sorusunu yanıtlar; tuttukları: ${trx(v.keeps)}; dışarıda bıraktıkları: ${trx(v.omits)}`).join('. ')}. “${trx(Q1.q)}” → ${Q1.answer.replace(': ', ', yani ')}. “${trx(Q2.q)}” → ${trx(Q2.answer)}.` },
      { title: 'Farklı bir hedef kitle: bakımcının ve öğrencinin ihtiyaçları', condition: 'maintainer', state: 2, note: `${trx(AUD.maintainer.label)}: ihtiyacı ${trx(AUD.maintainer.needs)}; ${trx(AUD.maintainer.omits)} dışarıda bırakılabilir. ${trx(AUD.student.label)}: ihtiyacı ${trx(AUD.student.needs)}; ${trx(AUD.student.omits)} dışarıda bırakılabilir.` },
    ],
  };

  // =====================================================================
  // PAGE · five models of one booking, and the notation
  // =====================================================================
  const MODELS = [
    { name: 'Kullanıcı yolculuğu', scene: 1, glyph: 'journey', shows: 'adımlar, hedefler, ekranda yazan, saklanan ve hâlâ belirsiz olan', answers: 'Kişinin bundan sonra neyi bilmesi gerekiyor?', omits: 'bileşenler, mesajlar ve alan adları' },
    { name: 'Durum modelleri', scene: 2, glyph: 'state', shows: 'istek ve saklanan rezervasyon için durumlar, olaylar ve koşullar', answers: 'Bundan sonra ne olabilir ve hangi olayla?', omits: 'kimin istediği, mesajların sırası, zamanlama' },
    { name: 'Veri modeli', scene: 3, glyph: 'data', shows: 'varlıklar, tanımlayıcılar, referanslar ve her birinden kaç tane olduğu', answers: 'Hangi olgular var ve her biri nerede duruyor?', omits: 'olayların sırası ve ekran mesajları' },
    { name: 'Karar tablosu', scene: 4, glyph: 'table', shows: 'koşulların her kombinasyonu için, kararıyla birlikte bir satır', answers: 'Hangi kombinasyona izin veriliyor ve neden?', omits: 'zaman sırası ve katılımcılar' },
    { name: 'Sıralama diyagramı', scene: 5, glyph: 'sequence', shows: 'yukarıdan aşağıya katılımcılar ve numaralı mesajlar', answers: 'Olaylar hangi sırayla oldu ve nerede durdu?', omits: 'alanlar ve diğer olası geçmişler' },
  ];
  function modelGlyph(kind, uid) {
    const g = window.VC.svg(260, 92, { label: `${GLYPH_TR[kind]} gösterimi`, uid });
    if (kind === 'journey') {
      ['1', '2', '3'].forEach((n, i) => { g.appendChild(s('rect', { x: 4 + i * 88, y: 14, width: 76, height: 30, rx: 8, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 })); g.appendChild(text(42 + i * 88, 35, n, { 'text-anchor': 'middle', style: 'font-size:16px;font-weight:700' })); });
      g.appendChild(s('rect', { x: 4, y: 56, width: 252, height: 22, rx: 6, fill: 'var(--ok-fill)', stroke: 'var(--ok)', 'stroke-width': 1.5 }));
      g.appendChild(text(130, 72, 'arka planda saklanan', { 'text-anchor': 'middle', style: 'font-size:14px;fill:var(--ok)' }));
    } else if (kind === 'state') {
      g.appendChild(s('circle', { cx: 16, cy: 46, r: 8, fill: 'var(--text)' }));
      g.appendChild(s('rect', { x: 50, y: 28, width: 80, height: 36, rx: 18, fill: 'var(--surface-2)', stroke: 'var(--warn)', 'stroke-width': 3 }));
      g.appendChild(s('rect', { x: 178, y: 28, width: 78, height: 36, rx: 18, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 }));
      arrow(g, { from: { x: 24, y: 46 }, to: { x: 50, y: 46 }, kind: 'ok' });
      arrow(g, { from: { x: 130, y: 46 }, to: { x: 178, y: 46 }, kind: 'ok' });
      g.appendChild(text(154, 20, 'olay [koşul]', { 'text-anchor': 'middle', style: 'font-size:13px;fill:var(--text-muted)' }));
    } else if (kind === 'data') {
      g.appendChild(s('rect', { x: 4, y: 20, width: 96, height: 56, rx: 8, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 }));
      g.appendChild(s('rect', { x: 160, y: 20, width: 96, height: 56, rx: 8, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 }));
      g.appendChild(s('line', { x1: 100, y1: 48, x2: 160, y2: 48, stroke: 'var(--accent)', 'stroke-width': 2.5 }));
      g.appendChild(text(106, 40, 'çok', { style: 'font-size:13px;fill:var(--text-muted)' }));
      g.appendChild(text(154, 66, 'bir', { 'text-anchor': 'end', style: 'font-size:13px;fill:var(--text-muted)' }));
      g.appendChild(text(52, 53, 'Rezervasyon', { 'text-anchor': 'middle', style: 'font-size:15px;font-weight:700' }));
      g.appendChild(text(208, 53, 'Oda', { 'text-anchor': 'middle', style: 'font-size:15px;font-weight:700' }));
    } else if (kind === 'table') {
      for (let r = 0; r < 4; r += 1) for (let c = 0; c < 5; c += 1) g.appendChild(s('rect', { x: 4 + c * 51, y: 6 + r * 20, width: 49, height: 18, fill: r === 0 ? 'var(--surface-3)' : c === 4 ? (r === 1 ? 'var(--ok-fill)' : 'var(--bad-fill)') : 'var(--surface-2)', stroke: 'var(--line)', 'stroke-width': 1 }));
    } else {
      [30, 130, 230].forEach((x) => g.appendChild(s('line', { x1: x, y1: 6, x2: x, y2: 88, stroke: 'var(--line-strong)', 'stroke-width': 2, 'stroke-dasharray': '5 5' })));
      arrow(g, { from: { x: 32, y: 30 }, to: { x: 128, y: 30 }, kind: 'accent' });
      arrow(g, { from: { x: 132, y: 52 }, to: { x: 228, y: 52 }, kind: 'accent' });
      arrow(g, { from: { x: 128, y: 74 }, to: { x: 32, y: 74 }, kind: 'bad', dashed: true });
      g.appendChild(markX(80, 74, 7));
    }
    g.style.width = '260px'; g.style.height = '92px';
    return g;
  }
  const LEGEND = [
    ['state', 'durum: yuvarlatılmış kutu'], ['event', 'ok üzerinde olay [koşul]'], ['current', 'şu anki durum'], ['start', 'başlangıç: henüz hiçbir şey saklanmadı'],
    ['absent', 'kasıtlı olarak yok'], ['entity', 'varlık: alanlar, önce id'], ['many', 'çoktan bire'], ['lost', 'kaybolan bir mesaj'],
  ];
  function legendGlyph(kind, uid) {
    const g = window.VC.svg(48, 28, { label: GLYPH_TR[kind], uid });
    if (kind === 'state') g.appendChild(s('rect', { x: 2, y: 4, width: 44, height: 20, rx: 10, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 }));
    if (kind === 'current') g.appendChild(s('rect', { x: 2, y: 3, width: 44, height: 22, rx: 11, fill: 'none', stroke: 'var(--warn)', 'stroke-width': 4 }));
    if (kind === 'start') g.appendChild(s('circle', { cx: 24, cy: 14, r: 8, fill: 'var(--text)' }));
    if (kind === 'event') arrow(g, { from: { x: 2, y: 14 }, to: { x: 46, y: 14 }, kind: 'accent' });
    if (kind === 'absent' || kind === 'lost') { arrow(g, { from: { x: 2, y: 14 }, to: { x: 46, y: 14 }, kind: 'bad', dashed: true }); g.appendChild(markX(24, 14, 7)); }
    if (kind === 'entity') { g.appendChild(s('rect', { x: 4, y: 2, width: 40, height: 24, rx: 4, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 })); g.appendChild(s('rect', { x: 4, y: 2, width: 40, height: 8, fill: 'var(--accent-fill)' })); }
    if (kind === 'many') { g.appendChild(s('line', { x1: 2, y1: 14, x2: 44, y2: 14, stroke: 'var(--accent)', 'stroke-width': 2.5 })); g.appendChild(s('circle', { cx: 42, cy: 14, r: 4, fill: 'var(--accent)' })); }
    g.style.width = '48px'; g.style.height = '28px'; g.style.flex = '0 0 auto';
    return g;
  }
  const models = {
    kind: 'page', id: 'models', role: 'page',
    heading: 'Bir rezervasyonun beş modeli ve her birinin yanıtladığı soru',
    lead: 'Bu dersin gösterimi tek bir yerde: tek ve aynı rezervasyon için her modelin ne gösterdiği, hangi soruyu yanıtladığı ve neyi dışarıda bıraktığı.',
    printRole: 'Modeller ve gösterim',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const qBtn = api.cue(el('button', { type: 'button', class: 'ctl-btn ctl-btn--step', style: 'height:50px;font-size:20px' }, 'Soruları göster'), 'questions');
      const oBtn = api.cue(el('button', { type: 'button', class: 'ctl-btn', style: 'height:50px;font-size:20px', 'aria-disabled': 'true' }, 'Her biri neyi dışarıda bırakıyor?'), 'leaves-out');
      const bar = el('div', { style: 'display:flex;gap:12px;align-items:center;margin-bottom:12px' }, [qBtn, oBtn, el('span', { class: 'muted', style: 'font-size:17px' }, `Tanımlayıcılar değişmez: ${DT.rule} ve ${BK.id} her modelde aynı şeyi ifade eder.`)]);
      const cards = MODELS.map((m, i) => api.cue(el('div', { class: 'card', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:8px;min-width:0' }, [
        el('div', { style: 'display:flex;align-items:baseline;justify-content:space-between;gap:8px' }, [el('span', { style: 'font-size:21px;font-weight:700' }, m.name), el('span', { class: 'muted', style: 'font-size:15px;white-space:nowrap' }, `sahne ${m.scene}`)]),
        modelGlyph(m.glyph, (x) => `models-${i}-${x}`),
        el('p', { style: 'font-size:17px;line-height:1.3' }, [el('b', {}, 'Gösterdiği: '), m.shows]),
        el('p', { class: 'mq', style: 'font-size:17px;line-height:1.3;color:var(--warn)' }, [el('b', {}, 'Yanıtladığı: '), m.answers]),
        el('p', { class: 'mo', style: 'font-size:17px;line-height:1.3;color:var(--text-muted)' }, [el('b', {}, 'Dışarıda bıraktığı: '), m.omits]),
      ]), `model-${i + 1}`));
      const grid = el('div', { style: 'display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;align-items:start' }, cards);   // ends above the presenter corner (y < 696)
      const legendCard = el('div', { class: 'card', style: 'margin-top:14px;padding:10px 16px;max-width:1580px' }, [   // left of the presenter corner (x < 1664)
        cardTitle('Bu hafta kullanılan gösterim', 'margin-bottom:6px;font-size:17px'),
        el('div', { style: 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px 18px' }, LEGEND.map(([k, label], i) => el('div', { style: 'display:flex;align-items:center;gap:10px;font-size:17px' }, [legendGlyph(k, (x) => `legend-${i}-${x}`), label]))),
      ]);
      api.cue(legendCard, 'notation');
      body.append(bar, grid, legendCard);
      const apply = () => {
        const st = Number(body.getAttribute('data-state'));
        body.querySelectorAll('.mq').forEach((n) => { n.style.visibility = st >= 1 ? '' : 'hidden'; });
        body.querySelectorAll('.mo').forEach((n) => { n.style.visibility = st >= 2 ? '' : 'hidden'; });
        qBtn.setAttribute('aria-disabled', st >= 1 ? 'true' : 'false');
        oBtn.setAttribute('aria-disabled', st === 1 ? 'false' : 'true');
      };
      qBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '0') { body.setAttribute('data-state', '1'); apply(); } });
      oBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '1') { body.setAttribute('data-state', '2'); apply(); } });
      body.reset = () => { body.setAttribute('data-state', '0'); apply(); };
      apply();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.appendChild(el('table', { class: 'data-table data-table--compact', style: 'font-size:12.5px' }, [
        el('thead', {}, el('tr', {}, ['Model', 'Sahne', 'Gösterdiği', 'Yanıtladığı', 'Dışarıda bıraktığı'].map((t) => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, MODELS.map((m) => el('tr', {}, [el('td', {}, m.name), el('td', {}, String(m.scene)), el('td', {}, m.shows), el('td', {}, m.answers), el('td', {}, m.omits)]))),
      ]));
      body.appendChild(el('h3', {}, 'Bu hafta kullanılan gösterim'));
      body.appendChild(el('ul', {}, LEGEND.map(([, label]) => el('li', {}, label))));
    },
  };

  // =====================================================================
  // PAGE · principles and checks
  // =====================================================================
  const WEEK = { checks: [
    { q: 'Bir yanıt, kalıcı kayıttan sonra zaman aşımına uğruyor. Rezervasyon mutlaka yok mudur?', a: 'Hayır. Rezervasyon var olsa bile istekte bulunan sonucu bilmiyor olabilir.' },
    { q: 'Odanın güncel adını her yere kopyalamak yerine neden oda tanımlayıcısına referans verilir?', a: 'Görünen ad değiştiğinde kimlik sabit kalır; tarihsel anlık görüntüler ise bilinçli olarak modellenmelidir.' },
    { q: 'Sahiplik ve durum kombinasyonlarını en iyi hangi model ortaya koyar?', a: 'Bir karar tablosu.' },
    { q: 'Bir diyagram, henüz kod yokken nasıl sınanabilir?', a: 'Somut örnekleri diyagramdan geçirin ve sonuçları gereksinimlerle ve tamamlayıcı modellerle karşılaştırın.' },
    { q: 'Geçerli bir durum diyagramı, bekleyen bildirim işinin sonunda tamamlanacağını garanti edebilir mi?', a: 'Hayır. İzin verilen durumlar ve geçişler, ilerleme için gereken zamanlama ve kurtarma varsayımlarını sağlamaz.' },
    // the Turkish text already carries typographic quotes, so the two replacements only act on an untranslated fallback
    { q: trx(TRANSFER.question).replace(/'/g, '’').replace(/’saved on this device’/, '“saved on this device”'), a: trx(TRANSFER.answer) },
  ] };
  const SCENES = [journeyBeforeBoxes, stateMachine, identityAndData, decisionTable, sequenceNotState, interfaceStates, modelConsistency, abstractionAndZoom];
  const principles = {
    kind: 'page', id: 'principles', role: 'page',
    heading: 'Sekiz ilke, altı kontrol',
    lead: 'Her sahne için bir ilke, ardından altı kontrol: her birini açmadan önce cevabınıza karar verin.',
    printRole: 'İlkeler ve kontroller',
    build(body, api) {
      // In record mode a card carries no href (Chrome's link status bubble would print the local deck address on camera); a click
      // or Enter still opens the scene.
      const open = (sc) => () => { location.hash = `#/${sc.id}`; };
      const cardAttrs = (sc) => (api.record
        ? { class: 'principle-card', role: 'link', tabindex: '0', onclick: open(sc), onkeydown: (e) => { if (e.key === 'Enter') open(sc)(); }, style: 'text-decoration:none;color:inherit;padding:10px 16px;cursor:pointer' }
        : { class: 'principle-card', href: `#/${sc.id}`, style: 'text-decoration:none;color:inherit;padding:10px 16px' });
      const cards = el('div', { class: 'principle-grid', style: 'gap:10px' }, SCENES.map((sc, i) => api.cue(el('a', cardAttrs(sc), [
        el('span', { class: 'pc-num' }, `${i + 1} · ${roleTr(sc.role)}`), el('span', { class: 'pc-text' }, sc.principle), el('span', { class: 'pc-short' }, sc.principleShort),
      ]), `card-${i + 1}`)));
      cards.querySelectorAll('.pc-text').forEach((n) => { n.style.fontSize = '18px'; });
      cards.querySelectorAll('.pc-short').forEach((n) => { n.style.fontSize = '16px'; });
      const qa = el('ol', { class: 'qa-list', style: 'margin-top:6px;grid-template-columns:1fr 1fr 1fr;max-width:1600px' }, WEEK.checks.map((c, i) => {   // the six checks stay left of the presenter corner (x < 1664)
        const ans = el('p', { class: 'qa-a', id: `qa-a-${i + 1}`, hidden: '', style: 'font-size:16px;line-height:1.28' }, c.a);
        const btn = api.cue(el('button', { type: 'button', class: 'qa-q', 'aria-expanded': 'false', 'aria-controls': `qa-a-${i + 1}`, style: 'font-size:18px' }, [el('span', {}, `${i + 1}. ${c.q}`), el('span', { class: 'tw', 'aria-hidden': 'true' }, '+')]), `question-${i + 1}`);
        btn.addEventListener('click', () => { const open = btn.getAttribute('aria-expanded') === 'true'; btn.setAttribute('aria-expanded', open ? 'false' : 'true'); if (open) ans.setAttribute('hidden', ''); else ans.removeAttribute('hidden'); });
        return el('li', { class: 'qa-item', style: 'padding:5px 12px' }, [btn, ans]);
      }));
      body.append(cards, qa);
      body.reset = () => body.querySelectorAll('.qa-q').forEach((b) => { b.setAttribute('aria-expanded', 'false'); document.getElementById(b.getAttribute('aria-controls')).setAttribute('hidden', ''); });
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.appendChild(el('h3', {}, 'İlkeler'));
      body.appendChild(el('div', { class: 'principle-grid' }, SCENES.map((sc, i) => el('div', { class: 'principle-card' }, [el('span', { class: 'pc-num' }, `${i + 1} · ${roleTr(sc.role)}`), el('span', { class: 'pc-text' }, sc.principle), el('span', { class: 'pc-short' }, `Kısaca: ${sc.principleShort}`), el('span', { class: 'pc-id' }, `${FILE}#/${sc.id}`)]))));
      body.appendChild(el('h3', {}, 'Kontroller: her sorunun altındaki cevabı okumadan önce kendi cevabınıza karar verin'));
      body.appendChild(el('ol', { class: 'print-qa' }, WEEK.checks.map((c, i) => el('li', {}, [el('span', { class: 'q' }, `${i + 1}. ${c.q}`), el('span', { class: 'a' }, c.a)]))));
    },
  };

  // =====================================================================
  // PAGE · handoff, terminology and sources
  // =====================================================================
  const TERMS = [
    ['Model', 'Bir sistem hakkında tek bir soruyu yanıtlayan ve neyi dışarıda bıraktığını söyleyen, bilerek basitleştirilmiş bir betimleme.'],
    ['Kullanıcı yolculuğu', 'Bir kişinin bir hedefe doğru attığı adımlar; her adımda ne gördüğü ve neyin hâlâ belirsiz olduğuyla birlikte.'],
    ['Durum ve olay', 'Durum, bir şeyin içinde bulunabileceği bir hâldir; olay ise onu başka bir duruma geçirebilen şeydir.'],
    ['Koşul (guard)', 'Bir geçişin gerçekleşmesi için sağlanması gereken şey; örneğin “R-03 izin verir”.'],
    ['Geçiş', 'Bir durumdan diğerine izin verilen değişim: olay, koşul, sonuç.'],
    ['Güvenlik değişmezi', 'İzin verilen her geçişte doğru kalan bir önerme: yasak bir durum asla oluşmaz.'],
    ['İlerleme özelliği', 'Bekleyen işin sonunda çözüleceğine dair bir söz; yalnızca oklar değil, zamanlama ve kurtarma da gerektirir.'],
    ['Varlık ve tanımlayıcı', `Oda gibi kendi kimliği olan ve ${ROOM} gibi değişmeyen bir tanımlayıcıyla bulunan bir şey.`],
    ['İlişki ve kardinalite', 'Varlıkların birbirine nasıl ve kaç tane olarak referans verdiği: bir rezervasyon bir odaya aittir; bir odanın çok sayıda rezervasyonu vardır.'],
    ['Referans bütünlüğü', 'Her referansın var olan bir şeyi göstermesi: biçimi doğru bir tanımlayıcı yetmez.'],
    ['Tarihsel anlık görüntü', 'Belirli bir anda doğru olanın bilinçli bir kopyası; örneğin makbuzdaki oda adı.'],
    ['Karar tablosu', 'Koşulların her kombinasyonu için, kararı ve o kararı veren kuralı içeren bir satır.'],
    ['Sıralama diyagramı', 'Yaşam çizgileri olarak katılımcılar ve sırayla numaralanmış mesajlar; mesafe zaman değildir.'],
    ['Arayüz durumu', 'Bir ekranın şu anda verdiği söz: yükleniyor, boş, hata, hizmet kullanılamıyor ya da sonuçlar; ve bundan sonra ne yapılacağı.'],
  ];
  const SOURCES = [
    ['S01', 'IEEE Computer Society, Guide to the Software Engineering Body of Knowledge (SWEBOK V4.0a)', 'https://www.computer.org/education/bodies-of-knowledge/software-engineering'],
    ['S02', 'ACM / IEEE-CS / AAAI, Computer Science Curricula 2023, final report', 'https://csed.acm.org/final-report/'],
    ['S08', 'Simon Brown, The C4 model for visualising software architecture', 'https://c4model.com/'],
    ['S09', 'IETF, RFC 9110: HTTP Semantics', 'https://www.rfc-editor.org/rfc/rfc9110.html'],
    ['S25', 'W3C, Web Content Accessibility Guidelines 2.2', 'https://www.w3.org/TR/WCAG22/'],
  ];
  const IN_PRACTICE = "Ekipler diyagramları Mermaid ya da PlantUML ile kodun yanında metin olarak tutar, draw.io ile çizer ve arayüz durumlarını Figma'da tasarlar.";
  const PRACTICE_YEAR = (String(F.metadata && F.metadata.date).match(/\b(\d{4})\b/) || [])[1];
  if (!PRACTICE_YEAR) throw new Error('fixtures metadata.date carries no year for the dated In practice examples');
  const IN_PRACTICE_TITLE = `Uygulamada · ${PRACTICE_YEAR} yılından örnekler`;
  const HANDOFF_QUESTION = 'Bu modelleri çalışan davranışa kim, hangi sırayla dönüştürür ve bu iş nerede bekler?';
  const CARRIED = [
    'Gereksinim tanımlayıcıları R-01–R-05 ve Q-01, değişmeden.',
    `${BK.id}'in beş modeli: yolculuk, istek ve saklanan durumlar, veri modeli, ${DT.rule} tablosu ve sıralama diyagramları.`,
    'Açık kararlar: adillik politikası, oda kapanışları (14. hafta) ve bir Sonuç bilinmiyor durumunun nasıl çözüleceği (6. hafta).',
  ];
  const sources = {
    kind: 'page', id: 'sources', role: 'page',
    heading: 'Neler ileriye taşınıyor ve daha fazlası nerede okunur',
    lead: 'Gelecek hafta, bir ekibin bu modelleri güvenilir davranışa dönüştürme işini nasıl düzenlediğini soruyor ve bu işin nerede beklediğini öğreniyor.',
    printRole: 'Devir, terimler, kaynaklar',
    build(body, api) {
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-height:0' }, [
        api.cue(el('div', { class: 'handoff', style: 'font-size:27px;padding:18px 24px' }, [el('span', { class: 'muted', style: 'font-size:19px;display:block;margin-bottom:8px;font-family:var(--font-text);font-weight:500' }, '4. hafta bu soruyla başlıyor:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]), 'handoff'),
        api.cue(el('div', { class: 'card', style: 'padding:14px 18px' }, [cardTitle('4. haftaya taşınanlar'), el('ul', { style: 'font-size:18px;line-height:1.38;display:flex;flex-direction:column;gap:6px' }, CARRIED.map((t) => el('li', {}, t)))]), 'carried'),
        api.cue(el('div', { class: 'card', style: 'padding:14px 18px' }, [cardTitle(IN_PRACTICE_TITLE), el('p', { style: 'font-size:18px;line-height:1.38' }, IN_PRACTICE)]), 'in-practice'),
      ]);
      const middle = api.cue(el('div', { class: 'card', style: 'min-height:0;padding:14px 18px;align-self:start' }, [cardTitle('Bu hafta kullanılan terimler'), el('dl', { class: 'term-list', style: 'display:block;column-count:2;column-gap:22px;font-size:15px;line-height:1.26' }, TERMS.map(([t, d]) => el('div', { style: 'break-inside:avoid;margin-bottom:6px' }, [el('dt', {}, t), el('dd', {}, d)])))]), 'terms');
      const right = api.cue(el('div', { class: 'card', style: 'min-height:0;padding:14px 18px;align-self:start' }, [cardTitle('Bu dersin kaynakları'), el('ul', { class: 'source-list', style: 'font-size:17px;gap:8px' }, SOURCES.map(([k, t, u]) => el('li', {}, [el('span', { class: 'key' }, k), el('span', {}, [t, ' ', el('a', { class: 'url', href: u, style: 'font-size:15px' }, u)])])))]), 'sources');   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:600px minmax(0,1fr) 450px;gap:24px;height:100%;min-height:0' }, [left, middle, right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('div', { class: 'handoff' }, [el('span', { class: 'muted', style: 'display:block;font-size:14px' }, '4. hafta bu soruyla başlıyor:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]),
          el('h3', {}, '4. haftaya taşınanlar'), el('ul', {}, CARRIED.map((t) => el('li', {}, t))),
          el('h3', {}, IN_PRACTICE_TITLE), el('p', {}, IN_PRACTICE),
          el('h3', {}, 'Bu dersin kaynakları'),
          el('ul', { class: 'source-list' }, SOURCES.map(([k, t, u]) => el('li', {}, [el('span', { class: 'key' }, k), el('span', {}, [t, ' ', el('span', { class: 'url' }, u)])]))),
        ]),
        el('div', {}, [el('h3', {}, 'Bu hafta kullanılan terimler'), el('dl', { class: 'term-list', style: 'display:block;column-count:2;column-gap:18px' }, TERMS.map(([t, d]) => el('div', { style: 'break-inside:avoid' }, [el('dt', {}, t), el('dd', {}, d)])))]),
      ]));
    },
  };

  // =====================================================================
  // DECK
  // =====================================================================
  window.lecture.deck({
    week: 3, file: FILE,
    shortTitle: 'Hafta 03',
    wordmark: 'Campus Rooms · Yazılım Mühendisliği',
    title: 'Davranışı, veriyi ve kullanıcı etkileşimini modelleme',
    question: 'Gerçekte sorduğumuz soruyu hangi model yanıtlar?',
    coverLead: `3. ders için öğrenci notları. Tek bir rezervasyon, ${BK.id}, bir kullanıcı yolculuğu, iki durum modeli, bir veri modeli, bir karar tablosu ve sıralama diyagramlarıyla betimleniyor; modeller hem birbirine hem de kurallara karşı kontrol ediliyor. Her sahne bir senaryo gösterir, tahmin etmenizi ister, mekanizmayı ortaya koyar, bir koşulu değiştirir, sonuçları karşılaştırır ve ilkeyi adlandırır.`,
    coverNote: 'Campus Rooms kurgusal bir oda rezervasyon hizmetidir; bir kaynak belirtilmedikçe her ad, tanımlayıcı, saat ve mesaj bir öğretim örneğidir. Çizimler hafif bir UML tarzı kullanır; amaçlanan davranışı her sorunun gerektirdiği düzeyde betimler, bir gerçekleştirimin her ayrıntısını değil.',
    pages: [
      opening,
      outcomes,
      { kind: 'scene', scene: journeyBeforeBoxes },
      { kind: 'scene', scene: stateMachine },
      { kind: 'scene', scene: identityAndData },
      { kind: 'scene', scene: decisionTable },
      { kind: 'scene', scene: sequenceNotState },
      { kind: 'scene', scene: interfaceStates },
      { kind: 'scene', scene: modelConsistency },
      { kind: 'scene', scene: abstractionAndZoom },
      models,
      principles,
      sources,
    ],
  });
})();
