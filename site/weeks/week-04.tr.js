/* =====================================================================
   Week 04 · Development flow, uncertainty, and engineering decisions
   Central question: Where is work waiting, and what would actually improve the flow?

   Every card, capacity, round, count and example value below is read from the
   fixtures (plan/assets/demo-fixtures.json → assets/fixtures/demo-fixtures.js).
   The board rows are the flow fixture; the work-in-progress limit schedule is
   recomputed here from the same rules and checked against its fixture when the
   deck loads. Scene identifiers come from plan/plan_manifest.json and never change.
   The shell (shared/lecture-controls.js) owns navigation, the control
   contract, modes and print; this file defines content and scenes.
   Layout: the stage is 1264 x 680 design pixels left of the rail; pages
   keep the bottom-right corner (x >= 1664, y >= 696) free where they can.

   Turkish edition (week-04.tr.html): every user-visible string is Turkish.
   Fixture text is shown through trx(), which reads
   assets/fixtures/demo-fixtures.tr.js (window.CAMPUS_ROOMS_FIXTURES_TR);
   comparisons, lookups, cue names and the self-checks keep using the English
   fixture values. Terms: notes/week-04.tr-terminology.md.
   ===================================================================== */
(function () {
  'use strict';
  const F = window.CAMPUS_ROOMS_FIXTURES;
  /** Turkish display text of a fixture string; a string without a translation is recorded in window.__TR_MISSES and shown unchanged. */
  const trx = (str) => { const t = (window.CAMPUS_ROOMS_FIXTURES_TR || {})[str]; if (t === undefined) { (window.__TR_MISSES = window.__TR_MISSES || new Set()).add(str); return str; } return t; };
  const A = F.anchors;
  const { el, s, text, arrow, markX, chip } = window.VC;
  const CASE = F.case;
  const ARI = CASE.users[0];   // U-01 Ari
  const BO = CASE.users[1];    // U-02 Bo
  const BK = CASE.booking;     // B-001, owned by U-01, C101 10:00-11:00, Confirmed
  const FILE = 'week-04.tr.html';
  const FB = A['w04/feedback-batches'];
  const MR = A['w04/methods-not-rituals'];
  const QB = A['w04/queue-and-bottleneck'];
  const WT = A['w04/wip-and-time'];
  const EA = A['w04/estimates-with-assumptions'];
  const RL = A['w04/risk-and-learning'];
  const DD = A['w04/definition-of-done'];
  const RT = A['w04/retrospective-as-test'];
  const SC = F.flow.scenarios;
  const CM = F.cancellation_matrix;
  const TRANSFER = F.transfer_checks.w04;
  const CARDS = QB.cards;                                   // W01..W08 with the plan's eight work-card titles
  const IDS = CARDS.map((c) => c.id);
  const N = IDS.length;
  const TITLE = Object.fromEntries(CARDS.map((c) => [c.id, c.title]));
  const idOf = (title) => { const c = CARDS.find((x) => x.title === title); if (!c) throw new Error(`no work card titled “${title}”`); return c.id; };
  const KEY = idOf(FB.timeline_slices.feedback_card);     // W05 accessible feedback
  const LAST = IDS[N - 1];                                  // W08 support diagnosis
  const B = SC.baseline, FI = SC.faster_implementation, FR = SC.faster_review;

  // ------------------------------------------------------------------ helpers shared by the scenes
  const reveal = (attrs) => Object.assign({ class: 'rv rv--rise' }, attrs);
  // Turkish case mapping: i ↔ İ and ı ↔ I
  const upper1 = (str) => str.charAt(0).toLocaleUpperCase('tr') + str.slice(1);
  const lowerTr = (str) => String(str).toLocaleLowerCase('tr');
  const listAnd = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ve ${items[items.length - 1]}`);
  const listOr = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ya da ${items[items.length - 1]}`);
  /** Display name of a scene role; the role value itself ('anchor', 'bridge') is logic for the shell. */
  const roleTr = (r) => (r === 'anchor' ? 'Temel' : r === 'bridge' ? 'Köprü' : r);
  const cardTitle = (str, extra) => el('div', { class: 'card-title', style: `margin-bottom:6px;${extra || ''}` }, str);
  const small = (str, extra) => el('p', { class: 'muted', style: `font-size:17px;line-height:1.3;${extra || ''}` }, str);
  const showIf = (n, on) => { if (n) n.classList.toggle('is-shown', !!on); };
  const focusIf = (n, on) => { if (n) n.classList.toggle('is-focus', !!on); };
  const one = (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');   // display only: Turkish writes the decimal comma (4,0 · 5,5)
  const started = (row) => N - row.ready;
  const peak = (sc) => Math.max(...sc.rows.map((r) => r.review_waiting));
  const doneRound = (sc) => sc.rows[sc.rows.length - 1].round;
  /** Greedy word wrap for SVG labels. */
  function wrap(str, max) {
    const out = [];
    let line = '';
    String(str).split(' ').forEach((w) => {
      if (!line) line = w;
      else if (`${line} ${w}`.length <= max) line = `${line} ${w}`;
      else { out.push(line); line = w; }
    });
    if (line) out.push(line);
    return out;
  }

  // ------------------------------------------------------------------ the board model
  /** Where every card is at the end of a round of a flow scenario, from the fixture rows; the counts must agree. */
  function boardAt(sc, r) {
    const impl = new Set(), comp = new Set();
    for (let i = 1; i <= r; i += 1) {
      (sc.rows[i].implemented_ids || []).forEach((x) => impl.add(x));
      (sc.rows[i].completed_ids || []).forEach((x) => comp.add(x));
    }
    const row = sc.rows[r];
    const b = {
      r, row,
      ready: IDS.filter((x) => !impl.has(x)), queue: IDS.filter((x) => impl.has(x) && !comp.has(x)), done: IDS.filter((x) => comp.has(x)),
      implemented: r ? (sc.rows[r].implemented_ids || []) : [], reviewed: r ? (sc.rows[r].completed_ids || []) : [],
    };
    if (b.ready.length !== row.ready || b.queue.length !== row.review_waiting || b.done.length !== row.done) throw new Error(`flow rows disagree with their card ids at round ${r}`);
    return b;
  }
  /** The same board with an optional admission limit (plan/tools/models.py queue_cards): per-card start and finish. */
  function scheduleCards(implCap, reviewCap, limit) {
    let ready = IDS.slice(), waiting = [], done = 0, r = 0;
    const st = {}, fin = {};
    while (done < N) {
      r += 1;
      const reviewed = waiting.slice(0, reviewCap);
      waiting = waiting.slice(reviewCap);
      reviewed.forEach((c) => { fin[c] = r; });
      done += reviewed.length;
      const room = limit == null ? implCap : Math.max(0, Math.min(implCap, limit - waiting.length));
      const admitted = ready.slice(0, room);
      ready = ready.slice(room);
      admitted.forEach((c) => { st[c] = r; });
      waiting = waiting.concat(admitted);
      if (r > 1000) throw new Error('flow model did not finish');
    }
    return IDS.map((c) => { const s0 = st[c] - 1, f = fin[c]; return { id: c, start: s0, finish: f, ready_wait: s0, review_wait: f - st[c] - 1, cycle_time: f - s0, lead_time: f }; });
  }
  Object.entries(WT.policies).forEach(([name, pol]) => {
    const got = scheduleCards(B.implementation_capacity, B.review_capacity, pol.wip_limit);
    if (JSON.stringify(got) !== JSON.stringify(pol.cards)) throw new Error(`w04/wip-and-time ${name} does not recompute from the flow rules`);
  });

  /** The work board: three queues where cards wait and two stations with their capacity per round. */
  function boardView(api, prefix, opts = {}) {
    const chipOf = {};
    IDS.forEach((id) => { chipOf[id] = api.cue(el('span', { class: `w4-chip${id === opts.key ? ' is-key' : ''}` }, id), `${prefix}card-${id.toLowerCase()}`); });
    const queue = (key, label) => {
      const n = el('span', { class: 'n' }, '0');
      const chips = el('div', { class: 'w4-chips' });
      const root = el('div', { class: 'w4-col' }, [el('div', { class: 'w4-head' }, [el('span', {}, label), n]), chips]);
      api.cue(root, `${prefix}${key}`);
      return { root, n, chips };
    };
    const station = (key, label) => {
      const cap = el('span', { class: 'w4-cap' });
      const slots = el('div', { class: 'w4-slots' });
      const root = el('div', { class: 'w4-station' }, [el('div', { class: 'w4-head' }, [el('span', {}, label)]), cap, el('span', { class: 'muted', style: 'font-size:14px;line-height:1' }, 'bu turda'), slots]);
      api.cue(root, `${prefix}${key}`);
      return { root, cap, slots };
    };
    const cols = { ready: queue('ready', 'Hazır'), impl: station('implementation', 'Geliştirme'), queue: queue('review-queue', 'İnceleme bekliyor'), review: station('review', 'İnceleme'), done: queue('done', 'Bitti') };
    const root = el('div', { class: `w4-board${opts.compact ? ' w4-compact' : ''}`, style: `grid-template-columns:${opts.columns || '300px 150px 300px 150px 300px'}` }, [cols.ready.root, cols.impl.root, cols.queue.root, cols.review.root, cols.done.root]);
    let last = null;
    const slotRow = (stn, cap, ids, r) => {
      stn.cap.textContent = `turda ${cap}`;
      stn.slots.replaceChildren(...Array.from({ length: cap }, (_, i) => el('span', { class: `w4-slot${ids[i] ? ' is-used' : ''}` }, ids[i] || (r === 0 ? '·' : 'boşta'))));
    };
    function update(sc, b, changed) {
      const place = (col, ids) => { col.n.textContent = String(ids.length); col.chips.replaceChildren(...ids.map((id) => chipOf[id])); };
      place(cols.ready, b.ready); place(cols.queue, b.queue); place(cols.done, b.done);
      IDS.forEach((id) => { chipOf[id].classList.toggle('is-moved', b.implemented.includes(id)); chipOf[id].classList.toggle('is-done', b.done.includes(id)); });
      slotRow(cols.impl, sc.implementation_capacity, b.implemented, b.r);
      slotRow(cols.review, sc.review_capacity, b.reviewed, b.r);
      cols.impl.cap.classList.toggle('is-changed', changed === 'impl');
      cols.review.cap.classList.toggle('is-changed', changed === 'review');
      if (api.motion && last && last.r !== b.r) {
        [...b.implemented, ...b.reviewed].forEach((id) => api.animate(chipOf[id], [{ opacity: 0, transform: 'translateX(-16px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: api.dur(420), easing: 'cubic-bezier(.2,.7,.2,1)' }));
      }
      last = b;
    }
    return { root, cols, chipOf, update };
  }

  // =====================================================================
  // PAGE · opening situation
  // =====================================================================
  const B4 = 4;   // the round the opening shows: every card started, the queue at its peak
  const QUESTIONS = [
    { q: 'Ekip yanlış şeyi yaptığını ne zaman öğrenir?', scenes: '1–2', topic: 'feedback' },
    { q: 'İş nerede ve ne kadar süre bekliyor?', scenes: '3–4', topic: 'flow' },
    { q: '“Üç gün” neyi vaat eder ve önce ne yapılmalı?', scenes: '5–6', topic: 'uncertainty' },
    { q: 'Bir değişiklik ne zaman bitmiş sayılır ve bir süreç değişikliği işe yaradı mı?', scenes: '7–8', topic: 'evidence' },
  ];
  const BUILDS = 'tur tur işletilen, sekiz kartlık tek bir pano ve onun çevresinde verilen kararlar.';
  const opening = {
    kind: 'page', id: 'opening', role: 'page',
    heading: 'Herkes meşgul. Neden yalnızca üç kart bitti?',
    lead: 'Küçük bir ekip Campus Rooms hizmetini geliştiriyor. Sekiz iş kartı, tek bir pano, şimdiye kadar dört tur çalışma. Herhangi bir şeyi değiştirmeden önce işin nerede olduğuna bakın.',
    printRole: 'Açılış senaryosu',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const b = boardAt(B, B4);
      const board = boardView(api, 'board-', { key: KEY });
      board.update(B, b, null);
      const situation = api.cue(el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:10px;padding:12px 14px' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:baseline;gap:16px' }, [cardTitle(`${B4}. turdan sonra pano`, 'margin-bottom:0'),
          el('p', { style: 'font-size:19px;line-height:1.3' }, [el('b', {}, 'Oda personeli soruyor: '), `${KEY} (${trx(TITLE[KEY])}) ne zaman hazır olacak?`])]),
        board.root,
      ]), 'situation');
      const busyBtn = api.cue(el('button', { type: 'button', class: 'ctl-btn ctl-btn--step', style: 'align-self:flex-start;height:56px;font-size:22px;padding:0 20px' }, 'Herkes meşgul mü?'), 'busy');
      const busy = el('div', reveal({ class: 'card rv rv--rise', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:6px' }), [
        cardTitle('Herkes meşgul mü?', 'margin-bottom:2px'),
        el('p', { style: 'font-size:19px;line-height:1.3' }, [`Geliştirme her turda ${B.implementation_capacity} kart aldı; inceleme de alabildiği her turda ${B.review_capacity} kart aldı. `, el('b', {}, `Başlanan: ${N} karttan ${started(b.row)}. Biten: ${b.row.done}.`)]),
      ]);
      api.cue(busy, 'busy-answer');
      const question = el('div', reveal({ class: 'rail-card rail-prompt rv rv--rise', style: 'align-self:start' }), [
        el('div', { class: 'rail-eyebrow' }, 'Bu haftanın sorusu'),
        el('p', { class: 'prompt-q' }, 'İş nerede bekliyor ve akışı gerçekten ne iyileştirir?'),
        el('ul', { class: 'prompt-options' }, ['Geliştirmeyi hızlandırmak: en meşgul görünen o', 'Kartların nerede beklediğini bulup o adımı iyileştirmek', 'Kimse boşta kalmasın diye daha çok karta başlamak'].map((o, i) => el('li', {}, [el('span', { class: 'opt-key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)), el('span', {}, o)]))),
        el('p', { class: 'rail-note', style: 'margin-top:12px' }, 'Cevabınızı aklınızda tutun. 3. sahne onu bu panoda sınıyor.'),
      ]);
      api.cue(question, 'question');
      const waitBtn = api.cue(el('button', reveal({ type: 'button', class: 'ctl-btn ctl-btn--step rv rv--rise', style: 'align-self:flex-start;height:56px;font-size:22px;padding:0 20px' }), 'İş nerede bekliyor?'), 'waiting');
      const rows = QUESTIONS.map((row, i) => api.cue(el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:8px 0;border-top:1px solid var(--line)' }, [
        el('b', { style: 'font-size:19px;line-height:1.28' }, row.q),
        chip(`sahne ${row.scenes}`, 'accent', { style: 'font-size:16px' }),
      ]), `question-${i + 1}`));
      const four = el('div', reveal({ class: 'card rv rv--rise', style: 'padding:12px 18px;display:flex;flex-direction:column' }), [
        el('div', { class: 'callout', style: 'font-size:19px;line-height:1.3;margin-bottom:10px' }, [el('b', {}, `${b.row.review_waiting} kart incelemeyi bekliyor; `), `${KEY} de bunlardan biri.`]),
        cardTitle('Bu dersin yanıtladığı dört soru', 'margin-bottom:4px'), ...rows,
        el('p', { style: 'font-size:17px;line-height:1.32;color:var(--text-muted);padding-top:8px;border-top:1px solid var(--line)' }, [el('b', { style: 'color:var(--text)' }, 'Bu derste kuracaklarımız: '), BUILDS]),
      ]);
      api.cue(four, 'four');
      const lowerLeft = el('div', { style: 'display:grid;grid-template-columns:600px minmax(0,1fr);gap:24px;align-items:start' }, [el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-width:0' }, [busyBtn, busy]), question]);
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:16px;min-width:0' }, [situation, lowerLeft]);
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-width:0' }, [waitBtn, four]);   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:1292px minmax(0,1fr);gap:24px;align-items:start;height:100%' }, [left, right]));
      const apply = () => {
        const st = Number(body.getAttribute('data-state'));
        showIf(busy, st >= 1); showIf(question, st >= 1); showIf(waitBtn, st >= 1); showIf(four, st >= 2);
        focusIf(board.cols.queue.root, st >= 2);
        busyBtn.setAttribute('aria-disabled', st >= 1 ? 'true' : 'false');
        waitBtn.setAttribute('aria-disabled', st === 1 ? 'false' : 'true');
      };
      busyBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '0') { body.setAttribute('data-state', '1'); apply(); } });
      waitBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '1') { body.setAttribute('data-state', '2'); apply(); } });
      body.reset = () => { body.setAttribute('data-state', '0'); apply(); };
      apply();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      const b = boardAt(B, B4);
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('h3', {}, `Senaryo: ${B4}. turdan sonra pano`),
          el('p', {}, `Hazır: ${b.ready.length ? b.ready.join(', ') : 'yok'}. İnceleme bekliyor: ${b.queue.join(', ')}. Bitti: ${b.done.join(', ')}. Geliştirme her turda ${B.implementation_capacity} kart alır, inceleme ${B.review_capacity}.`),
          el('p', {}, `Oda personeli ${KEY} (${trx(TITLE[KEY])}) kartının ne zaman hazır olacağını soruyor. Başlanan: ${N} karttan ${started(b.row)}; biten: ${b.row.done}. ${b.row.review_waiting} kart incelemeyi bekliyor; ${KEY} de bunlardan biri.`),
          el('h3', {}, 'Bu haftanın sorusu'),
          el('p', {}, 'İş nerede bekliyor ve akışı gerçekten ne iyileştirir? (A) Geliştirmeyi hızlandırmak: en meşgul görünen o. (B) Kartların nerede beklediğini bulup o adımı iyileştirmek. (C) Kimse boşta kalmasın diye daha çok karta başlamak.'),
        ]),
        el('div', {}, [
          el('h3', {}, 'Bu dersin yanıtladığı dört soru'),
          el('ul', {}, QUESTIONS.map((row) => el('li', {}, `${row.q} (sahne ${row.scenes})`))),
          el('h3', {}, 'Bu derste kuracaklarımız'), el('p', {}, upper1(BUILDS)),
        ]),
      ]));
    },
  };

  // =====================================================================
  // PAGE · recall and outcomes
  // =====================================================================
  const OUTCOMES = [
    'Yinelemeyi, artımları ve tek bir büyük toplu teslimi ayırt etmek.',
    'Kuyrukları ve tamamlanma kanıtlarını kullanarak bir darboğazı bulmak.',
    'Devam eden işi, iş çıkış hızını, döngü süresini ve teslim süresini ayırt etmek.',
    'Bir tahmini güvence olarak değil, koşullu bir bilgi olarak açıklamak.',
    'Riske, bağımlılığa, geri bildirimin değerine ve kapasiteye bakarak bir sonraki eylemi seçmek.',
  ];
  const W3_HANDOFF = 'Bu modelleri çalışan davranışa kim, hangi sırayla dönüştürür ve bu iş nerede bekler?';   // the Week 3 Turkish handoff question, word for word
  const outcomes = {
    kind: 'page', id: 'outcomes', role: 'page',
    heading: 'Zaten bildikleriniz ve bu dersin hedefi',
    lead: 'İş nerede bekliyor ve akışı gerçekten ne iyileştirir?',
    printRole: 'Hatırlatma ve kazanımlar',
    build(body, api) {
      const recall = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:8px;padding:14px 20px' }, [
        cardTitle('3. haftadan: tek bir rezervasyonun beş modeli', 'margin-bottom:2px'),
        el('p', { style: 'font-size:19px;line-height:1.35' }, `Bir yolculuk, iki durum modeli, bir veri modeli, bir karar tablosu ve sıralama diyagramları; hepsi ${BK.id} için. 3. hafta bir soruyla bitti:`),
        el('p', { style: 'font-size:20px;line-height:1.35' }, el('i', {}, W3_HANDOFF)),
      ]);
      api.cue(recall, 'recall');
      const cards = el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:4px 18px' }, CARDS.map((c) => api.cue(el('div', { style: 'display:flex;gap:10px;align-items:center;font-size:19px' }, [el('span', { class: 'w4-chip', style: 'width:56px;height:32px;font-size:16px;flex:0 0 auto' }, c.id), el('span', {}, trx(c.title))]), `card-${c.id.toLowerCase()}`)));
      const example = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:8px;padding:14px 20px' }, [
        cardTitle('Bu haftanın örneği: sekiz iş kartı', 'margin-bottom:2px'), cards,
      ]);
      api.cue(example, 'example');
      const rules = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:6px;padding:14px 20px' }, [
        cardTitle('Pano nasıl işler', 'margin-bottom:2px'),
        el('p', { style: 'font-size:19px;line-height:1.35' }, `Zaman turlarla ilerler. Geliştirme her turda ${B.implementation_capacity} kart alır, inceleme ${B.review_capacity}; ${trx(QB.transfer_rule)}. Her kart aynı büyüklüktedir ve sekizi de 0. turda istenir.`),
        el('p', { class: 'muted', style: 'font-size:17px;line-height:1.3' }, `Turlar öğretim birimidir; ölçülmüş geliştirici performansı değildir.`),
      ]);
      api.cue(rules, 'rules');
      const list = el('ol', { class: 'outcome-list', 'aria-label': 'Bu dersin sonunda şunları yapabileceksiniz', style: 'gap:10px' }, OUTCOMES.map((o, i) => el('li', { style: 'font-size:22px;padding:10px 14px' }, [el('span', { class: 'n', 'aria-hidden': 'true' }, String(i + 1)), el('span', {}, o)])));
      api.cue(list, 'outcomes');
      const right = el('div', {}, [cardTitle('Bu dersin sonunda şunları yapabileceksiniz'), list]);   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { class: 'page-columns' }, [el('div', { style: 'display:flex;flex-direction:column;gap:14px' }, [recall, example, rules]), right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('h3', {}, '3. haftadan'),
          el('p', {}, `${BK.id} rezervasyonunun beş modeli: bir yolculuk, iki durum modeli, bir veri modeli, bir karar tablosu ve sıralama diyagramları. 3. hafta şu soruyla bitti: ${W3_HANDOFF}`),
          el('h3', {}, 'Bu haftanın örneği: sekiz iş kartı'),
          el('ul', {}, CARDS.map((c) => el('li', {}, `${c.id} ${trx(c.title)}`))),
          el('h3', {}, 'Pano nasıl işler'),
          el('p', {}, `Zaman turlarla ilerler. Geliştirme her turda ${B.implementation_capacity} kart alır, inceleme ${B.review_capacity}; ${trx(QB.transfer_rule)}. Her kart aynı büyüklüktedir ve sekizi de 0. turda istenir. İnceleme yalnızca bir turun başında bekleyen kartları alır ve her sayı bir turun sonundaki durumu gösterir. ${upper1(trx(QB.timing_note))}.`),
        ]),
        el('div', {}, [el('h3', {}, 'Bu dersin sonunda şunları yapabileceksiniz'), el('ol', { class: 'outcome-list' }, OUTCOMES.map((o, i) => el('li', {}, [el('span', { class: 'n' }, String(i + 1)), el('span', {}, o)])))]),
      ]));
    },
  };

  // =====================================================================
  // SCENE 1 · feedback-batches (Anchor)
  // =====================================================================
  const SLICES = FB.timeline_slices.slices;
  const FIRST = FB.timeline_slices;
  const BATCH = FB.timeline_batch;
  const FP = FB.feedback_points;          // rounds 3, 6 (slices) and 9 (the batch)
  const COORD = FB.coordination;
  const TL = { x0: 206, rw: 117 };       // round r occupies [x0 + (r-1)*rw, x0 + r*rw]
  const rx = (r) => TL.x0 + (r - 1) * TL.rw;
  const rEnd = (r) => TL.x0 + r * TL.rw;
  const feedbackBatches = {
    id: 'feedback-batches', role: 'anchor',
    heading: 'Ekip yanlış şeyi yaptığını ne zaman öğrenirdi?',
    lead: 'İki plan aynı sekiz iş kartını teslim ediyor. Biri her şeyi sonda entegre ediyor; diğeri önce küçük, kullanılabilir bir dilimi insanların önüne koyuyor. Aynı ihtiyaç ikisinde de yanlış anlaşılıyor.',
    principle: 'Daha kısa geri bildirim döngüleri yanlış varsayımları daha erken ortaya çıkarabilir; yararlı artımlar yine de bir sistem olarak anlamlı olmalıdır.',
    principleShort: 'Dilimleri erken gösterin; birbirine uymalarını sağlayın.',
    conditions: [
      { id: 'batch-or-slices', baseline: true, label: 'Başlangıç: tek bir toplu teslim ya da küçük dilimler', short: 'İki plan',
        states: [
          { prompt: { question: 'Ekip, iptal mesajlarının insanların ihtiyacını karşılamadığını ne zaman öğrenirdi?', options: ['Son kart bittiğinde', 'İnsanlar çalışan küçük bir parçayı kullanınca', 'Ancak yayından sonra'] }, caption: 'Her planı İleri ile izleyin.' },   // one short line: the prediction state keeps the presenter corner free, as in the English deck
          { caption: `Plan 1 her turda bir kart geliştirir ve her şeyi **${BATCH.integration_round}. turda** entegre eder. O zamana kadar hiçbir şey kullanılamaz.` },
          { caption: `İnsanlar sonucu ilk kez **${BATCH.discovery_round}. turda** kullanır ve yanlış anlama ortaya çıkar. Yeniden çalışma: ${trx(BATCH.rework)}.` },
          { caption: `Plan 2 önce küçük, kullanılabilir bir dilim geliştirir: ${trx(SLICES[0].usable)}.` },
          { caption: `İnsanlar bu dilimi **${FIRST.inspected_round}. turda** dener ve net olmayan mesaj hemen ortaya çıkar. Yalnızca **${trx(FIRST.feedback_card)}** değişir.` },
          { caption: 'Her dilim kullanılabilir bir yetenek ekler: **artım**. Geri bildirimden sonra mesajı değiştirmek anlayışı günceller: **yineleme**.' },
          { caption: `${BATCH.discovery_round}. tur yerine ${FIRST.inspected_round}. turda öğrenildi.`, principle: true },
        ] },
      { id: 'later-feedback', label: 'Değişiklik: geri bildirim noktası sonraya kayıyor', short: 'Geç geri bildirim',
        states: [
          { prompt: { question: 'Yanlış anlama aynı kalsın, ama insanlar işi daha geç görsün. Ne değişir?', options: ['Hiçbir şey: düzeltme aynı', 'Bitmiş işin daha fazlası yeniden ele alınmalı', 'Yanlış anlama kendiliğinden kaybolur'] }, caption: "Aynı dilimler, aynı yanlış anlama. Yalnızca insanların işi ilk kez kullandığı an kayıyor. Kaydırmak için İleri'ye basın." },
          { caption: `**${FP[0].round}. turda** geri bildirim: ${trx(FP[0].note)}. Yeniden ele alınacak: **1 kart**.` },
          { caption: `**${FP[1].round}. turda** geri bildirim: ${trx(FP[1].note)}. Yeniden ele alınacak: **${FP[1].reconsider.length} kart**.` },
          { caption: `Geri bildirim ancak **${FP[2].round}. turda**, toplu teslimdeki gibi: ${trx(FP[2].note)}. **${FP[2].reconsider.length}** kartın hepsi.` },
          { caption: `Yeniden yapılacak kart sayısı: ${FP.map((p) => p.reconsider.length).join(', sonra ')}.`, principle: true },
        ] },
      { id: 'shared-interface', label: 'Değişiklik: dilimler tek bir kimlik arayüzünü paylaşıyor', short: 'Arayüz',
        states: [
          // the Turkish constraint writes the slices as words ("ikinci ve üçüncü dilimlerden"); the caption gives their numbers, as the English deck does
          { prompt: { question: '2. ve 3. dilimler bir üyenin kim olduğunu bilmeli. Her dilim buna tek başına karar verebilir mi?', options: ['Evet: dilimler bağımsızdır', 'Önce arayüzde anlaşın', 'Sonda karar verin'] }, caption: `Kısıt: ${trx(FB.coordination_constraint).replace('ikinci ve üçüncü dilimlerden', '2. ve 3. dilimlerden').replace('slices two and three', 'slices 2 and 3')}.` },
          { caption: `2. ve 3. dilimler, hiçbiri geliştirilmeden önce verilmesi gereken tek bir karara bağlı: **${trx(COORD.task)}**.` },
          { caption: `Bu anlaşma olmadan ${trx(COORD.without_it)}.` },
          { caption: `${COORD.agreed_by_round}. tura kadar arayüzde anlaşın, sonra onun üzerine geliştirin.`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const W = 1264, H = 604;
      const wrapEl = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-rows:60px minmax(0,1fr);gap:16px' });
      h.banner = api.cue(el('div', { class: 'callout callout--bad', style: 'font-size:21px;line-height:1.3;display:flex;align-items:center;gap:12px;padding:10px 18px' }, [
        el('b', {}, 'İki planda da yanlış anlaşılan:'), el('span', {}, trx(FB.misunderstanding)),
        el('span', { class: 'example-tag', style: 'margin-left:auto' }, 'turlar öğretim birimidir'),
      ]), 'misunderstanding');
      const svg = window.VC.svg(W, H, { label: 'Aynı sekiz kartın iki zaman çizelgesi: sonda entegre edilen tek bir toplu teslim ve kullanılabilir üç küçük dilim', uid: (x) => api.uid(x) });
      for (let r = 1; r <= 9; r += 1) svg.appendChild(text(rx(r) + TL.rw / 2, 18, `${r}. tur`, { 'text-anchor': 'middle', style: 'font-size:16px;fill:var(--text-soft)' }));
      const lane = (y, hgt, title, sub) => {
        const g = s('g', { class: 'dm' });
        g.appendChild(s('rect', { x: 1, y, width: W - 2, height: hgt, rx: 16, ry: 16, fill: 'rgba(124,196,255,0.035)', stroke: 'var(--line)', 'stroke-width': 1.5 }));
        g.appendChild(text(18, y + 34, title, { lineHeight: 24, style: 'font-size:17px;font-weight:700;letter-spacing:0.08em;fill:var(--accent-strong)' }));
        g.appendChild(text(18, y + 88, sub, { lineHeight: 20, style: 'font-size:16px;fill:var(--text-muted)' }));
        svg.appendChild(g);
        return g;
      };
      h.laneBatch = lane(30, 222, ['PLAN 1', 'TOPLU TESLİM'], ['sonda', 'entegre et']);
      h.laneSlices = lane(266, 336, ['PLAN 2', 'DİLİMLER'], ['her dilimi', 'erken kullan']);
      api.cue(h.laneBatch, 'lane-batch'); api.cue(h.laneSlices, 'lane-slices');
      // plan 1: one card per round, then integration
      h.batchGroup = s('g', { class: 'rv' });
      h.batchRects = {};
      IDS.forEach((id, i) => {
        const x = rx(i + 1) + 5, y = 46, w = TL.rw - 10, hh = 96;
        const g = s('g', {});
        const rect = s('rect', { x, y, width: w, height: hh, rx: 10, ry: 10, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 });
        g.appendChild(rect);
        g.appendChild(text(x + w / 2, y + 28, id, { 'text-anchor': 'middle', style: 'font-size:18px;font-weight:700' }));
        g.appendChild(text(x + w / 2, y + 54, wrap(trx(TITLE[id]), 13), { 'text-anchor': 'middle', lineHeight: 20, style: 'font-size:15px;fill:var(--text-muted)' }));
        h.batchGroup.appendChild(g); api.cue(g, `batch-${id.toLowerCase()}`);
        h.batchRects[id] = rect;
      });
      const ix = rx(BATCH.integration_round) + 5, iw = TL.rw - 10;
      h.integrate = s('g', {});
      h.integrate.appendChild(s('rect', { x: ix, y: 46, width: iw, height: 96, rx: 10, ry: 10, fill: 'var(--warn-fill)', stroke: 'var(--warn)', 'stroke-width': 2, 'stroke-dasharray': '7 5' }));
      h.integrate.appendChild(text(ix + iw / 2, 88, ['sekizini de', 'entegre et'], { 'text-anchor': 'middle', lineHeight: 22, style: 'font-size:16px;font-weight:700;fill:var(--warn)' }));
      h.batchGroup.appendChild(h.integrate); api.cue(h.integrate, 'integrate');
      h.laneBatch.appendChild(h.batchGroup);
      // plan 2: three usable slices
      h.sliceGroup = s('g', { class: 'rv' });
      h.sliceLines = {};
      h.slices = SLICES.map((sl) => {
        const [a, b] = sl.rounds;
        const x = rx(a) + 5, w = rEnd(b) - rx(a) - 10, y = 282, hh = 178;
        const g = s('g', {});
        const box = s('rect', { x, y, width: w, height: hh, rx: 12, ry: 12, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 });
        g.appendChild(box);
        g.appendChild(text(x + 14, y + 26, `DİLİM ${sl.slice}`, { style: 'font-size:15px;font-weight:700;letter-spacing:0.08em;fill:var(--text-soft)' }));
        g.appendChild(text(x + 14, y + 50, wrap(trx(sl.usable), 40), { lineHeight: 20, style: 'font-size:16px;fill:var(--text-muted)' }));
        sl.cards.forEach((t, i) => {
          const id = idOf(t), ly = y + 88 + i * 28;
          const lg = s('g', {});
          const lr = s('rect', { x: x + 8, y: ly, width: w - 16, height: 26, rx: 6, ry: 6, fill: 'none', stroke: 'none', 'stroke-width': 2 });
          lg.appendChild(lr);
          lg.appendChild(text(x + 16, ly + 19, `${id}  ${trx(t)}`, { style: 'font-size:16px' }));
          g.appendChild(lg); api.cue(lg, `slice-${id.toLowerCase()}`);
          h.sliceLines[id] = lr;
        });
        h.sliceGroup.appendChild(g); api.cue(g, `slice-${sl.slice}`);
        return { g, box, x, w, y, hh };
      });
      h.use = SLICES.map((sl) => {
        const x = rEnd(sl.rounds[1]) - 10;
        const g = s('g', {});
        g.appendChild(s('circle', { cx: x, cy: 482, r: 10, fill: 'var(--accent-fill)', stroke: 'var(--accent)', 'stroke-width': 2.5 }));
        g.appendChild(text(x - 18, 488, 'insanlar kullanır', { 'text-anchor': 'end', style: 'font-size:15px;fill:var(--accent-strong)' }));
        h.sliceGroup.appendChild(g); api.cue(g, `use-${sl.slice}`);
        return g;
      });
      h.laneSlices.appendChild(h.sliceGroup);
      // increment and iteration
      h.terms = s('g', { class: 'rv' });
      h.terms.appendChild(text(18, 412, 'ARTIM', { style: 'font-size:16px;font-weight:700;letter-spacing:0.06em;fill:var(--accent-strong)' }));
      h.terms.appendChild(text(18, 434, ['kullanılabilir', 'yetenek ekler'], { lineHeight: 20, style: 'font-size:16px;fill:var(--text-muted)' }));
      h.terms.appendChild(text(18, 500, 'YİNELEME', { style: 'font-size:16px;font-weight:700;letter-spacing:0.06em;fill:var(--violet)' }));
      h.terms.appendChild(text(18, 522, ['anlayışı', 'günceller'], { lineHeight: 20, style: 'font-size:16px;fill:var(--text-muted)' }));
      svg.appendChild(h.terms); api.cue(h.terms, 'increment-iteration');
      // discovery markers
      const discovery = (x, y1, y2, label, sub, anchor) => {
        const g = s('g', { class: 'rv' });
        g.appendChild(s('line', { x1: x, x2: x, y1, y2, stroke: 'var(--warn)', 'stroke-width': 3, 'stroke-dasharray': '6 5' }));
        g.appendChild(s('circle', { cx: x, cy: y1, r: 7, fill: 'var(--warn)' }));
        const tx0 = anchor === 'end' ? x - 12 : x + 12;
        g.appendChild(text(tx0, y2 - 30, label, { 'text-anchor': anchor || 'start', style: 'font-size:18px;font-weight:700;fill:var(--warn)' }));
        g.appendChild(text(tx0, y2 - 8, sub, { 'text-anchor': anchor || 'start', style: 'font-size:16px;fill:var(--bad)' }));
        svg.appendChild(g);
        return g;
      };
      h.discBatch = discovery(rEnd(BATCH.discovery_round) - 6, 34, 248, `${BATCH.discovery_round}. turda öğrenildi`, trx(BATCH.rework), 'end');
      // the two lower labels share one baseline in the later-feedback end state: the round 3 label must end before the round 6 marker
      h.disc3 = discovery(rEnd(FP[0].round) - 10, 272, 598, `${FP[0].round}. turda öğrenildi`, `yeniden ele al: ${trx(FP[0].reconsider[0])}`, 'start');
      h.disc6 = discovery(rEnd(FP[1].round) - 10, 272, 598, `${FP[1].round}. turda öğrenildi`, `yeniden ele al: ${FP[1].reconsider.length} kart`, 'start');
      api.cue(h.discBatch, 'learned-batch'); api.cue(h.disc3, 'learned-round-3'); api.cue(h.disc6, 'learned-round-6');
      // the coordination constraint
      h.coord = s('g', { class: 'rv' });
      const cx0 = rx(2) + 10, cw = 3 * TL.rw - 20, cy0 = 524;
      h.coord.appendChild(s('rect', { x: cx0, y: cy0, width: cw, height: 50, rx: 12, ry: 12, fill: 'var(--violet-fill)', stroke: 'var(--violet)', 'stroke-width': 2.5 }));
      h.coord.appendChild(text(cx0 + cw / 2, cy0 + 32, trx(COORD.task), { 'text-anchor': 'middle', style: 'font-size:17px;font-weight:700;fill:var(--violet)' }));
      const s2 = h.slices[1], s3 = h.slices[2];
      arrow(h.coord, { from: { x: cx0 + cw - 30, y: cy0 }, to: { x: s2.x + 60, y: s2.y + s2.hh }, kind: 'violet' });
      arrow(h.coord, { from: { x: cx0 + cw, y: cy0 + 25 }, via: [{ x: s3.x + 70, y: cy0 + 25 }], to: { x: s3.x + 70, y: s3.y + s3.hh }, kind: 'violet' });
      svg.appendChild(h.coord); api.cue(h.coord, 'identity-interface');
      const tagOn = (sl, label, kind) => {
        const g = s('g', { class: 'rv' });
        const bw = label.length * 9.6 + 24;
        g.appendChild(s('rect', { x: sl.x + sl.w - bw - 10, y: sl.y + 8, width: bw, height: 28, rx: 14, ry: 14, fill: `var(--${kind}-fill)`, stroke: `var(--${kind})`, 'stroke-width': 1.5 }));
        g.appendChild(text(sl.x + sl.w - bw / 2 - 10, sl.y + 28, label, { 'text-anchor': 'middle', style: `font-size:16px;font-weight:700;fill:var(--${kind})` }));
        svg.appendChild(g);
        return g;
      };
      h.own = [tagOn(s2, 'kendi üye adları', 'bad'), tagOn(s3, 'kendi üye adları', 'bad')];
      h.agreed = [tagOn(s2, 'anlaşılan arayüz', 'ok'), tagOn(s3, 'anlaşılan arayüz', 'ok')];
      api.cue(h.own[0], 'own-names-2'); api.cue(h.own[1], 'own-names-3'); api.cue(h.agreed[0], 'agreed-2'); api.cue(h.agreed[1], 'agreed-3');
      wrapEl.append(h.banner, api.cue(svg, 'timelines'));
      stage.appendChild(wrapEl);
      return h;
    },
    render(h, view) {
      const st = view.state, c = view.conditionId;
      const base = c === 'batch-or-slices', later = c === 'later-feedback', coord = c === 'shared-interface';
      showIf(h.batchGroup, !base || st >= 1);
      showIf(h.sliceGroup, !base || st >= 3);
      h.laneBatch.classList.toggle('is-dim', (base && (st === 3 || st === 4)) || coord || (later && st < 3));
      h.laneSlices.classList.toggle('is-dim', (base && (st === 1 || st === 2)) || (later && st === 3));
      showIf(h.discBatch, (base && st >= 2) || (later && st >= 3));
      showIf(h.disc3, (base && st >= 4) || (later && (st === 1 || st === 4)));
      showIf(h.disc6, later && (st === 2 || st === 4));
      showIf(h.terms, base && st >= 5);
      const batchRework = (base && st >= 2) || (later && st >= 3);
      IDS.forEach((id) => h.batchRects[id].setAttribute('stroke', batchRework ? 'var(--bad)' : 'var(--line-strong)'));
      const redo = new Set();
      if ((base && st >= 4) || (later && st >= 1 && st !== 3)) FP[0].reconsider.forEach((t) => redo.add(idOf(t)));
      if (later && (st === 2 || st === 4)) FP[1].reconsider.forEach((t) => redo.add(idOf(t)));
      Object.entries(h.sliceLines).forEach(([id, r]) => { r.setAttribute('stroke', redo.has(id) ? 'var(--bad)' : 'none'); r.setAttribute('fill', redo.has(id) ? 'var(--bad-fill)' : 'none'); });
      h.slices[0].box.setAttribute('stroke', base && st >= 4 ? 'var(--warn)' : 'var(--line-strong)');
      showIf(h.coord, coord && st >= 1);
      h.own.forEach((g) => showIf(g, coord && st === 2));
      h.agreed.forEach((g) => showIf(g, coord && st === 3));
    },
    print: [
      { title: 'Tek bir toplu teslim ve üç dilim: yanlış anlama ne zaman ortaya çıkıyor ve ne değişmeli', condition: 'batch-or-slices', state: 6, principle: true, note: `Varsayımlar: eşit büyüklükte sekiz kart, tek bir ekip, iki planda da aynı yanlış anlama (${trx(FB.misunderstanding)}); turlar öğretim birimidir. Plan 1 her turda bir kart geliştirir ve ${BATCH.integration_round}. turda entegre eder; yanlış anlama ${BATCH.discovery_round}. turda ortaya çıkar ve yeniden çalışma şudur: ${trx(BATCH.rework)}. Plan 2, insanların 1. dilimi (${listAnd(SLICES[0].cards.map(trx))}) ${FIRST.inspected_round}. turda kullanmasını sağlar; yalnızca ${trx(FIRST.feedback_card)} değişir. Artım kullanılabilir yetenek ekler; yineleme anlayışı günceller.` },
      { title: 'Geri bildirim noktası sonraya kayıyor: neyin yeniden ele alınması gerekiyor', condition: 'later-feedback', state: 4, note: FP.map((p) => `${p.round}. turda geri bildirim: ${trx(p.note)}; yeniden ele alınacak: ${p.reconsider.length === N ? `${N} kartın hepsi` : listAnd(p.reconsider.map(trx))}.`).join(' ') },
      { title: 'Küçük dilimler de üzerinde anlaşılmış bir arayüze ve bir sıraya ihtiyaç duyar', condition: 'shared-interface', state: 3, note: `${upper1(trx(FB.coordination_constraint))}. Bu anlaşma olmadan ${trx(COORD.without_it)}. Arayüzde ${COORD.agreed_by_round}. tura kadar anlaşılırsa 2. ve 3. dilimler tek bir arayüzün üzerine kurulur.` },
    ],
  };

  // =====================================================================
  // SCENE 2 · methods-not-rituals (Bridge)
  // =====================================================================
  const APP = MR.approaches;
  const ROWS2 = [['coordinates', 'Koordinasyon aracı'], ['visible', 'Görünür kıldığı'], ['feedback', 'Geri bildirim zamanı'], ['reversible', 'Değişime açık kalan'], ['strongest', 'En güçlü olduğu yer']];
  const MCC = MR.changed_condition;
  const methodsNotRituals = {
    id: 'methods-not-rituals', role: 'bridge',
    heading: 'Bir toplantı tek başına bir geri bildirim döngüsü oluşturur mu?',
    lead: 'Aynı ekibi koordine etmenin üç yolu. Adlarını değil, her birinin neyi görünür kıldığını ve geri bildirimin ne zaman geldiğini karşılaştırın.',
    principle: 'Koordinasyon pratiklerini etiketlerine göre değil, işin belirsizliğine ve kısıtlarına göre seçin.',
    principleShort: 'Pratikleri adına göre değil, işe göre seçin.',
    conditions: [
      { id: 'planned-capability', baseline: true, label: 'Başlangıç: planlanmış bir yetenek', short: 'Planlı iş',
        states: [
          { prompt: { question: 'Üç ekip aynı yeteneği geliştiriyor. Planının yanlış olduğunu ilk hangisi öğrenir?', options: ['En ayrıntılı plana sahip ekip', 'En çok toplantı yapan ekip', 'Kullanılabilir bir şeyi ilk gözden geçiren ekip'] }, caption: "Tek bir ekibi koordine etmenin üç yolu. Onları satır satır karşılaştırmak için İleri'ye basın." },
          { caption: 'Her birinin koordinasyon aracı: baştan üzerinde anlaşılan bir plan, her zaman kutusu için bir hedef ya da görünür bir akış için açık politikalar.' },
          { caption: `Her birinin görünür kıldığı şeyler. Scrum üç sorumluluk tanımlar: **${listAnd(MR.accountabilities.map((a) => trx(a.name)))}**.` },
          { caption: 'Geri bildirimin geldiği an: planlanmış kilometre taşlarında, her Sprint Değerlendirme toplantısında ya da akıştan sürekli olarak.' },
          { caption: 'Ekip öğrenirken hangi kararların değişime açık kaldığı.' },
          { caption: `Her birinin en güçlü olduğu bir kullanım var. Taahhütten önce öğrenmenin bir başka yolu: ${listAnd(MR.learn_before_commitment.map(trx))}.` },
          { caption: 'Kullanılabilir bir şey olmadan yapılan toplantı bir ritüeldir.', principle: true },
        ] },
      { id: 'incidents', label: 'Değişiklik: destek talepleri bilinmeyen zamanlarda geliyor', short: 'Destek talepleri',
        states: [
          { prompt: { question: 'Artık iş, bilinmeyen zamanlarda gelen destek talepleri. Hangi yaklaşım kazanır?', options: ['Plan güdümlü: onları da planla', "Scrum: bir sonraki Sprint'i bekle", 'Adıyla hiçbiri: her birine bir politika gerekir'] }, caption: `İş değişiyor: **${trx(MCC.incidents)}**.` },
          { caption: `İş artık şu: ${trx(MCC.label)}. Her yaklaşımda hâlâ işe yarayan ne?` },
          { caption: 'Her birinin gözden geçirmesi gereken şey: acil iş için bir politika.' },
          { caption: 'Her yaklaşımın yeni bir politikaya ihtiyacı oldu.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const grid = el('div', { style: 'display:grid;grid-template-columns:158px repeat(3,minmax(0,1fr));gap:8px 10px;align-items:stretch' });
      grid.appendChild(el('div'));
      APP.forEach((a) => grid.appendChild(api.cue(el('div', { class: 'card', style: 'padding:9px 14px;display:flex;flex-direction:column;gap:2px' }, [
        el('span', { style: 'font-size:21px;font-weight:700;line-height:1.2' }, trx(a.name)), el('span', { class: 'muted', style: 'font-size:16px' }, trx(a.short)),
      ]), `head-${a.id}`)));
      h.cells = {};
      ROWS2.forEach(([key, label], i) => {
        grid.appendChild(el('div', { class: 'w4-rowlabel rv', 'data-cond': 'planned-capability', 'data-show-from': String(i + 1) }, label));
        APP.forEach((a) => { h.cells[`${key}-${a.id}`] = api.cue(el('div', { class: 'w4-cell rv', 'data-cond': 'planned-capability', 'data-show-from': String(i + 1) }, upper1(trx(a[key]))), `${key}-${a.id}`); grid.appendChild(h.cells[`${key}-${a.id}`]); });
      });
      [['helps', 'Hâlâ işe yarayan'], ['revise', 'Yeni politika gerekir']].forEach(([key, label], i) => {
        grid.appendChild(el('div', { class: 'w4-rowlabel rv', 'data-cond': 'incidents', 'data-show-from': String(i + 1) }, label));
        APP.forEach((a) => { h.cells[`${key}-${a.id}`] = api.cue(el('div', { class: 'w4-cell rv', 'data-cond': 'incidents', 'data-show-from': String(i + 1) }, upper1(trx(MCC.per_approach[a.id][key]))), `${key}-${a.id}`); grid.appendChild(h.cells[`${key}-${a.id}`]); });
      });
      h.accountable = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'planned-capability', 'data-show-from': '2', style: 'padding:9px 14px;display:flex;flex-direction:column;gap:6px;flex:1 1 0;min-width:0' }), [
        cardTitle('Scrum sorumlulukları', 'margin-bottom:0;font-size:16px'),
        el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' }, MR.accountabilities.map((a) => chip(`${trx(a.name)} · ${trx(a.decisions).split(':')[0]}`, 'accent', { style: 'font-size:16px' }))),
        el('p', { class: 'muted', style: 'font-size:16px;line-height:1.28' }, `${upper1(trx(MR.accountability_note))}: değer, süreç ve işle ilgili kararların görünür olduğu yerler.`),
      ]), 'accountabilities');
      h.learn = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'planned-capability', 'data-show-from': '5', style: 'padding:9px 14px;display:flex;flex-direction:column;gap:6px;flex:0 0 330px' }), [
        cardTitle('Taahhütten önce öğrenin', 'margin-bottom:0;font-size:16px'),
        el('p', { style: 'font-size:17px;line-height:1.3' }, `${upper1(listOr(MR.learn_before_commitment.map(trx)))} deneyin: ikisi de üç yaklaşımın hepsinde işe yarar.`),
      ]), 'learn-first');
      h.ritual = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'planned-capability', 'data-show-from': '6', style: 'padding:9px 14px;display:flex;flex-direction:column;gap:6px;flex:0 0 330px;border-color:var(--warn)' }), [
        cardTitle('Toplantı tek başına geri bildirim değildir', 'margin-bottom:0;font-size:16px;color:var(--warn)'),
        el('p', { style: 'font-size:17px;line-height:1.3' }, `Örneğin ${trx(MR.ritual_without_feedback)}.`),
      ]), 'ritual');
      h.noWinner = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'incidents', 'data-show-from': '3', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:4px;border-color:var(--warn)' }), [
        cardTitle('Evrensel bir kazanan yok', 'margin-bottom:0;font-size:16px;color:var(--warn)'),
        el('p', { style: 'font-size:18px;line-height:1.3' }, `${upper1(trx(MCC.no_winner))}. Asıl soru, işin neye ihtiyaç duyduğu: geri bildirimin ne zaman geldiği ve hangi kararların hâlâ değişebileceği.`),
      ]), 'no-winner');
      const strips = el('div', { style: 'display:flex;gap:10px;align-items:stretch' }, [h.accountable, h.learn, h.ritual]);
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:12px' }, [grid, strips, h.noWinner]));
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'planned-capability';
      APP.forEach((a) => {
        focusIf(h.cells[`feedback-${a.id}`], base && st === 3);
        focusIf(h.cells[`strongest-${a.id}`], base && st === 5);
        focusIf(h.cells[`revise-${a.id}`], !base && st === 2);
      });
    },
    print: [
      { title: 'Tek bir ekibi koordine etmenin üç yolu, satır satır karşılaştırma', condition: 'planned-capability', state: 6, principle: true, note: `Bunlar eksiksiz yöntem tanımları değil, basitleştirilmiş ders örnekleridir: Scrum'ı Scrum Kılavuzu (Kasım 2020), Kanban'ı ise Kanban Kılavuzu (Mayıs 2025) tanımlar. Scrum'ın üç sorumluluğu, yani ${MR.accountabilities.map((a) => `${trx(a.name)} (${trx(a.decisions)})`).join(', ')}, iş unvanı değil sorumluluktur. Scrum ${listAnd(MR.scrum_pillars.map(trx))} üzerine kuruludur; Kanban Kılavuzu'nun pratikleri şunlardır: ${listAnd(MR.kanban_practices.map((p) => lowerTr(trx(p))))}. Taahhütten önce öğrenmenin bir başka yolu: ${listAnd(MR.learn_before_commitment.map(trx))}.` },
      { title: 'İş, bilinmeyen zamanlarda gelen destek taleplerine dönüşüyor', condition: 'incidents', state: 3, note: `${upper1(trx(MCC.incidents))}. ${APP.map((a) => `${trx(a.name)} için hâlâ işe yarayan: ${trx(MCC.per_approach[a.id].helps)}; yeni politika gerekir: ${trx(MCC.per_approach[a.id].revise)}.`).join(' ')} ${upper1(trx(MCC.no_winner))}.` },
    ],
  };

  // =====================================================================
  // SCENE 3 · queue-and-bottleneck (Anchor)
  // =====================================================================
  const SCEN = { baseline: B, 'implementation-4': FI, 'review-2': FR };
  const CAPTXT = (sc) => `Geliştirme turda ${sc.implementation_capacity} kart, İnceleme turda ${sc.review_capacity} kart`;
  const CAPSHORT = (sc) => `turda ${sc.implementation_capacity} geliştirme, ${sc.review_capacity} inceleme`;
  const queueCaptions = {
    // Turkish needs no plural after a number, so "1 kart bekliyor" and "3 kart bekliyor" share one form
    baseline: B.rows.map((row, r) => {
      if (r === 0) return '0. tur: sekiz kart istendi, henüz hiçbirine başlanmadı.';
      if (r === 1) return `1. tur: geliştirme **${row.implemented_ids.join(' ve ')}** kartlarını alır. İnceleme boşta: yalnızca tur başladığında bekleyen kartları alır; bu kartlar bir sonraki tur için onun kuyruğuna katılır.`;
      if (r === 2) return `2. tur: inceleme tek kartını, **${row.completed_ids[0]}** kartını bitirir; geliştirme ${row.implemented_ids.join(' ve ')} kartlarını ekler. İki giriyor, bir çıkıyor: artık **${row.review_waiting}** kart bekliyor.`;
      if (r === 3) return `3. tur: ${row.completed_ids[0]} biter; ${row.implemented_ids.join(' ve ')} kuyruğa katılır. Başlanan **${started(row)}**, biten **${row.done}**; bekleyen **${row.review_waiting}**.`;
      if (r === 4) return `4. tur: sekiz karta da başlandı, ama yalnızca **${row.done}** kart bitti. **${row.review_waiting}** kart incelemeyi bekliyor ve iki istasyon da meşguldü.`;
      if (r === 5) return `5. tur: başlanacak kart kalmadı. İnceleme hâlâ turda bir kart bitiriyor: **${row.review_waiting}** kart bekliyor.`;
      if (r === B.rows.length - 1) return `${r}. tur: **${LAST}** bitti. Geliştirme kendi payını 4. turda bitirmişti, pano ise **${r}. turda** bitti: hızı inceleme belirledi.`;
      return `${r}. tur: inceleme ${row.completed_ids[0]} kartını bitirir. **${row.review_waiting}** kart bekliyor, ${row.done} kart bitti.`;
    }),
    'implementation-4': FI.rows.map((row, r) => {
      if (r === 0) return `Yalnızca geliştirme değişiyor: **turda ${FI.implementation_capacity} kart**. Noktalı çizgiler başlangıç koşulunu gösterir.`;
      if (r === 1) return `1. tur: geliştirme aynı anda ${row.implemented_ids.length} kart alır: ${listAnd(row.implemented_ids)}. İncelemenin alacağı bir kart henüz yok.`;
      if (r === 2) return `2. tur: bütün kartlara başlandı. **${row.review_waiting}** kart incelemeyi bekliyor; biten: **${row.done}**.`;
      if (r === FI.rows.length - 1) return `Tıpkı önceki gibi ${r}. turda bitti.`;
      return `${r}. tur: inceleme ${row.completed_ids[0]} kartını bitirir. **${row.review_waiting}** kart bekliyor, ${row.done} kart bitti.`;
    }),
    'review-2': FR.rows.map((row, r) => {
      if (r === 0) return `Geliştirme yeniden turda ${FR.implementation_capacity} kart; yalnızca inceleme değişiyor: **turda ${FR.review_capacity} kart**.`;
      if (r === 1) return `1. tur: ${row.implemented_ids.join(' ve ')} geliştirildi; inceleme ilk kartlarını bekliyor.`;
      if (r === FR.rows.length - 1) return `${r}. turda bitti; artık geliştirme sınırlıyor.`;
      return `${r}. tur: inceleme ${row.completed_ids.join(' ve ')} kartlarını bitirir. Kuyruk **${row.review_waiting}** kartta sabit kalıyor; ${row.done} kart bitti.`;
    }),
  };
  const queueAndBottleneck = {
    id: 'queue-and-bottleneck', role: 'anchor',
    heading: 'Bir aşamayı hızlandırın: iş daha erken biter mi?',
    lead: "Pano ve aynı turların grafiği. İleri'ye her basış bir turdur: inceleme, tur başladığında bekleyen kartları alır; geliştirilen kartlar bir sonraki tur için onun kuyruğuna katılır.",
    principle: 'Yerel iş yoğunluğu, sistemin iş çıkış hızıyla aynı şey değildir; yalnızca en meşgul görünen aşamayı değil, akışı sınırlayanı iyileştirin.',
    principleShort: 'Akışı sınırlayan adımı hızlandırın.',
    run: { intervalMs: 1500 },
    conditions: [
      { id: 'baseline', baseline: true, label: `Başlangıç: ${CAPSHORT(B)}`, short: `${B.implementation_capacity} ve ${B.review_capacity}`,
        states: queueCaptions.baseline.map((caption, r) => (r === 0
          ? { prompt: { question: `Geliştirme turda ${B.implementation_capacity} kart, inceleme ${B.review_capacity} kart bitiriyor. Bitmemiş bir sonraki kart nerede bekleyecek?`, options: ['Hazır sütununda, kimse ona başlamadan önce', 'İnceleme kuyruğunda', 'Hiçbir yerde: iki istasyon da yetişiyor'] }, caption }
          : { caption })) },
      { id: 'implementation-4', label: `Değişiklik: ${CAPSHORT(FI)}`, short: `Geliştirme ${FI.implementation_capacity}`,
        states: queueCaptions['implementation-4'].map((caption, r) => (r === 0
          ? { prompt: { question: `Geliştirme iki katına çıkıp turda ${FI.implementation_capacity} kart oluyor; inceleme hâlâ ${FI.review_capacity} kart bitiriyor. Son kart ne zaman biter?`, options: ['5. turda: yaklaşık iki kat erken', `${doneRound(B)}. turda, önceki gibi`, '8. turda: biraz daha erken'] }, caption }
          : { caption, principle: r === FI.rows.length - 1 })) },
      { id: 'review-2', label: `Değişiklik: ${CAPSHORT(FR)}`, short: `İnceleme ${FR.review_capacity}`,
        states: queueCaptions['review-2'].map((caption, r) => (r === 0
          ? { prompt: { question: `Geliştirme yeniden turda ${FR.implementation_capacity} kart; inceleme artık turda ${FR.review_capacity} kart bitiriyor. Her şey ne zaman biter?`, options: [`${doneRound(B)}. turda`, `${doneRound(FR)}. turda`, '3. turda'] }, caption }
          : { caption, principle: r === FR.rows.length - 1 })) },
    ],
    setup(stage, api) {
      const h = {};
      h.board = boardView(api, '', { key: null });
      const legend = el('p', { style: 'font-size:16px;line-height:1.35;color:var(--text-muted)' }, [el('b', { style: 'color:var(--text)' }, 'Kartlar: '), CARDS.map((c) => `${c.id} ${trx(c.title)}`).join(' · ')]);
      api.cue(legend, 'card-names');
      // chart
      const CW = 760, CH = 330;
      const svg = window.VC.svg(CW, CH, { label: 'Her turun sonunda başlanan, incelemeyi bekleyen ve biten kartlar', uid: (x) => api.uid(`chart-${x}`) });
      const X0 = 50, X1 = CW - 20, Y0 = 28, Y1 = CH - 50;
      const xr = (r) => X0 + ((X1 - X0) * r) / 9;
      const yc = (n) => Y1 - ((Y1 - Y0) * n) / N;
      for (let n = 0; n <= N; n += 2) {
        svg.appendChild(s('line', { x1: X0, x2: X1, y1: yc(n), y2: yc(n), stroke: 'var(--line)', 'stroke-width': 1 }));
        svg.appendChild(text(X0 - 12, yc(n) + 6, String(n), { 'text-anchor': 'end', style: 'font-size:16px;fill:var(--text-soft)' }));
      }
      for (let r = 0; r <= 9; r += 1) svg.appendChild(text(xr(r), Y1 + 24, String(r), { 'text-anchor': 'middle', style: 'font-size:16px;fill:var(--text-soft)' }));
      svg.appendChild(text((X0 + X1) / 2, CH - 4, 'tur', { 'text-anchor': 'middle', style: 'font-size:15px;fill:var(--text-soft)' }));
      svg.appendChild(text(X0 - 12, 14, 'kart', { 'text-anchor': 'end', style: 'font-size:15px;fill:var(--text-soft)' }));
      const path = (stroke, width, dash, opacity) => { const p = s('path', { fill: 'none', stroke, 'stroke-width': width, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': dash || null, opacity: opacity == null ? null : opacity }); svg.appendChild(p); return p; };
      h.gBaseQ = path('var(--warn)', 2.5, '2 7', 0.8); h.gBaseD = path('var(--ok)', 2.5, '2 7', 0.8);
      h.gStarted = path('var(--accent)', 3, '10 7'); h.gQueue = path('var(--warn)', 4.5); h.gDone = path('var(--ok)', 4.5);
      h.now = s('line', { y1: Y0 - 4, y2: Y1, stroke: 'var(--text-soft)', 'stroke-width': 1.5, 'stroke-dasharray': '4 5' });
      svg.appendChild(h.now);
      const dot = (fill) => { const c = s('circle', { r: 7, fill, stroke: 'var(--bg)', 'stroke-width': 2 }); svg.appendChild(c); return c; };
      h.dS = dot('var(--accent)'); h.dQ = dot('var(--warn)'); h.dD = dot('var(--ok)');
      h.lQ = text(0, 0, '', { style: 'font-size:17px;font-weight:700;fill:var(--warn)' }); h.lD = text(0, 0, '', { style: 'font-size:17px;font-weight:700;fill:var(--ok)' });
      svg.append(h.lQ, h.lD);
      h.xr = xr; h.yc = yc;
      const key = (color, dash, label) => el('span', { style: 'display:inline-flex;align-items:center;gap:8px' }, [el('span', { style: `display:inline-block;width:30px;border-top:4px ${dash} ${color}` }), label]);
      h.baseKey = key('var(--text-soft)', 'dotted', 'başlangıç koşulu');
      const chartCard = api.cue(el('div', { class: 'card', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:6px;min-width:0' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:baseline' }, [cardTitle('Tur tur kuyruk ve tamamlanma', 'margin-bottom:0;font-size:16px'), h.counts = el('span', { style: 'font-size:18px;font-weight:700;font-variant-numeric:tabular-nums' })]),
        svg,
        el('div', { style: 'display:flex;gap:18px;flex-wrap:wrap;font-size:16px;color:var(--text-muted)' }, [key('var(--accent)', 'dashed', 'başlanan'), key('var(--warn)', 'solid', 'incelemeyi bekleyen'), key('var(--ok)', 'solid', 'biten'), h.baseKey]),
      ]), 'chart');
      svg.style.height = `${CH}px`;
      // table
      h.tRows = Array.from({ length: 10 }, (_, i) => api.cue(el('tr', { class: 'rv' }, [el('th', { scope: 'row', class: 'num' }, String(i)), el('td', { class: 'num' }), el('td', { class: 'num' }), el('td', { class: 'num' })]), `row-${i}`));
      const tbl = el('table', { class: 'data-table data-table--compact', style: 'font-size:18px' }, [
        el('caption', { class: 'visually-hidden' }, 'Seçili koşul için tur sonu sayıları'),
        el('thead', {}, el('tr', {}, ['Tur', 'Hazır', 'Bekleyen', 'Biten'].map((t) => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, h.tRows),
      ]);
      tbl.querySelectorAll('td, th').forEach((n) => { n.style.padding = '4px 12px'; n.style.fontSize = '18px'; });
      const tableCard = api.cue(el('div', { class: 'card', style: 'padding:10px 14px;min-width:0' }, [cardTitle('Her turun sonu', 'margin-bottom:4px;font-size:16px'), tbl]), 'table');
      const lower = el('div', { style: 'display:grid;grid-template-columns:780px minmax(0,1fr);gap:16px;min-height:0' }, [chartCard, tableCard]);
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:10px' }, [h.board.root, legend, lower]));
      return h;
    },
    render(h, view) {
      const sc = SCEN[view.conditionId];
      const r = Math.min(view.state, sc.rows.length - 1);
      const b = boardAt(sc, r);
      h.board.update(sc, b, view.conditionId === 'implementation-4' ? 'impl' : view.conditionId === 'review-2' ? 'review' : null);
      focusIf(h.board.cols.queue.root, view.conditionId !== 'review-2' && b.row.review_waiting >= 3);
      const pts = (rows, fn, upto) => rows.slice(0, upto + 1).map((row, i) => `${i ? 'L' : 'M'}${h.xr(row.round).toFixed(1)},${h.yc(fn(row)).toFixed(1)}`).join(' ');
      const base = view.conditionId === 'baseline' ? null : B;
      h.gQueue.setAttribute('d', pts(sc.rows, (x) => x.review_waiting, r));
      h.gDone.setAttribute('d', pts(sc.rows, (x) => x.done, r));
      h.gStarted.setAttribute('d', pts(sc.rows, (x) => started(x), r));
      h.gBaseQ.setAttribute('d', base ? pts(base.rows, (x) => x.review_waiting, base.rows.length - 1) : 'M0,0');
      h.gBaseD.setAttribute('d', base ? pts(base.rows, (x) => x.done, base.rows.length - 1) : 'M0,0');
      h.baseKey.style.visibility = base ? 'visible' : 'hidden';
      const row = sc.rows[r], x = h.xr(r);
      h.now.setAttribute('x1', x); h.now.setAttribute('x2', x);
      [[h.dS, started(row)], [h.dQ, row.review_waiting], [h.dD, row.done]].forEach(([d, v]) => { d.setAttribute('cx', x); d.setAttribute('cy', h.yc(v)); });
      const right = r <= 6, dx = right ? 14 : -14, anchor = right ? 'start' : 'end';
      // value labels beside the current points, inside the plot and at least one line apart
      const top = h.yc(N) + 16, bottom = h.yc(0) - 8;
      let yq = h.yc(row.review_waiting) - 10, yd = h.yc(row.done) - 10;
      if (row.review_waiting < row.done) yq = h.yc(row.review_waiting) + 24; else yd = h.yc(row.done) + 24;
      yq = Math.max(top, Math.min(bottom, yq)); yd = Math.max(top, Math.min(bottom, yd));
      if (Math.abs(yq - yd) < 22) { if (row.review_waiting >= row.done) yq = Math.max(top, yd - 22); else yd = Math.max(top, yq - 22); }
      [[h.lQ, `${row.review_waiting} bekliyor`, yq], [h.lD, `${row.done} bitti`, yd]].forEach(([t, str, y]) => { t.textContent = r === 0 || !right ? '' : str; t.setAttribute('x', x + dx); t.setAttribute('y', y); t.setAttribute('text-anchor', anchor); });
      h.counts.textContent = `Başlanan ${started(row)} · bekleyen ${row.review_waiting} · biten ${row.done}`;
      h.tRows.forEach((tr, i) => {
        const rr = sc.rows[i];
        showIf(tr, !!rr && i <= r);
        tr.style.display = rr ? '' : 'none';
        focusIf(tr, i === r);
        if (rr) { tr.children[1].textContent = String(rr.ready); tr.children[2].textContent = String(rr.review_waiting); tr.children[3].textContent = String(rr.done); }
      });
    },
    print: [
      { title: `Başlangıç koşulunun ${B4}. turu: bütün kartlara başlanmış, inceleme kuyruğu en uzun hâlinde`, condition: 'baseline', state: B4, note: `Kapasiteler: ${CAPTXT(B)}. Aktarma kuralı: ${trx(QB.transfer_rule)}; inceleme yalnızca tur başında bekleyen kartları alır. Sayılar tur sonundaki durumu gösterir. Başlanan ${started(B.rows[B4])}, bekleyen ${B.rows[B4].review_waiting}, biten ${B.rows[B4].done}.` },
      { title: 'Başlangıç koşulu sonuna kadar: hızı inceleme belirliyor', condition: 'baseline', state: B.rows.length - 1, note: `${CAPTXT(B)}. Sekiz kartın hepsi ${doneRound(B)}. turda bitti; en uzun inceleme kuyruğu ${peak(B)} karttı (${B4}. tur). ${upper1(trx(QB.timing_note))}.` },
      { title: 'Geliştirme iki katına çıktı: aynı bitiş, daha uzun bir kuyruk', condition: 'implementation-4', state: FI.rows.length - 1, principle: true, note: `${CAPTXT(FI)}; gelen işler aynı. Başlangıç koşulundaki gibi ${doneRound(FI)}. turda bitti; inceleme kuyruğu ${peak(B)} yerine en fazla ${peak(FI)} karta ulaşıyor. Geliştirmeyi iki katına çıkarmak tamamlanmayı değiştirmedi, çünkü inceleme hâlâ turda ${FI.review_capacity} kart bitiriyor.` },
      { title: `İnceleme iki katına çıktı: ${doneRound(FR)}. turda bitti ve artık geliştirme sınırlıyor`, condition: 'review-2', state: FR.rows.length - 1, principle: true, note: `${CAPTXT(FR)}. ${doneRound(FR)}. turda bitti; kuyrukta hiçbir zaman ${peak(FR)} karttan fazlası olmuyor. İnceleme rahatlayınca hızı turda ${FR.implementation_capacity} kartla geliştirme belirliyor: darboğaz yer değiştirdi.` },
    ],
  };

  // =====================================================================
  // SCENE 4 · wip-and-time (Bridge)
  // =====================================================================
  const NOLIM = WT.policies.no_limit, LIM = WT.policies.limit_2;
  const T_AGE = WT.age_moment.time;
  const cardOf = (pol, id) => pol.cards.find((c) => c.id === id);
  const c8 = cardOf(NOLIM, LAST), l8 = cardOf(LIM, LAST);
  const ageAt = (pol, t) => {
    const inProgress = pol.cards.filter((c) => c.start < t && c.finish > t);
    const oldest = inProgress.reduce((m, c) => (t - c.start > m.age ? { id: c.id, age: t - c.start } : m), { id: null, age: 0 });
    const waiting = pol.cards.filter((c) => c.start >= t).reduce((m, c) => (t > m.age ? { id: c.id, age: t } : m), { id: null, age: 0 });
    return { oldest, waiting };
  };
  const AGE0 = ageAt(NOLIM, T_AGE), AGE1 = ageAt(LIM, T_AGE);
  const G4 = { x0: 262, tw: 78, rowY: 42, rowH: 52 };
  const tx = (t) => G4.x0 + t * G4.tw;
  const wipAndTime = {
    id: 'wip-and-time', role: 'bridge',
    heading: 'İşi isteyen kişi için hangi saat işler?',
    lead: 'Başlangıç panosunun sekiz kartı, her biri bir satırda: ne zaman istendiği, işe ne zaman başlandığı, ne zaman bittiği. Ardından, talep aynı kalırken devam eden işe bir sınır.',
    principle: 'Zaman ölçüleri ancak başlangıç ve bitiş noktaları ile dışarıda bıraktıkları bekleme açıkça belirtildiğinde anlamlıdır.',
    principleShort: 'Her saatin nerede başlayıp nerede durduğunu söyleyin.',
    conditions: [
      { id: 'no-limit', baseline: true, label: 'Başlangıç: devam eden işe sınır yok', short: 'Sınır yok',
        states: [
          { prompt: { question: `Biri ${LAST} kartını (${trx(TITLE[LAST])}) 0. turda istedi. Bu kişi için hangi saat işler?`, options: [`Ekibin ${LAST} kartına başladığı andan itibaren`, 'İstekten bitmiş değişikliğe kadar', `Yalnızca ${LAST} kartının incelemede geçirdiği süre`] }, caption: `Yine başlangıç panosu: sekiz kart 0. turda istendi; ${lowerTr(CAPTXT(B))}. Her kart için bir satır.` },
          { caption: `Her kartta üç işaret: **istendi** (hepsi 0'da), **başladı** ve **bitti**. ${LAST}: başlangıç ${c8.start}, bitiş ${c8.finish}.` },
          { caption: `İstekten bitişe: ${LAST} için **${c8.lead_time} tur**. Bu **teslim süresi**: işi isteyen kişinin saati.` },
          { caption: `Belirlenen başlangıçtan bitişe: **${c8.cycle_time} tur**. Bu **döngü süresi**: ekibin saati.` },
          { caption: `${LAST}, Hazır sütununda ${c8.ready_wait} tur bekledi: teslim süresinin içinde, döngü süresinin dışında. Ortalama döngü süresi ${one(NOLIM.average_cycle_time)}, ortalama teslim süresi ${one(NOLIM.average_lead_time)} tur.` },
        ] },
      { id: 'limit-2', label: `Değişiklik: ${LIM.wip_limit} kartlık devam eden iş sınırı`, short: `Sınır ${LIM.wip_limit}`,
        states: [
          { prompt: { question: `Artık aynı anda en fazla ${LIM.wip_limit} kart başlamış ama bitmemiş olabilir. Aynı sekiz kart, aynı kapasiteler. Ne olur?`, options: ['İki saat de kısalır', 'Döngü süresi kısalır; teslim süresi aynı kalır', 'Hiçbir saat değişmez'] }, caption: `Sınır, işin başlatılmasını denetler: bir kart ancak devam eden kart sayısı ${LIM.wip_limit} sınırının altındayken başlar. Talep aynı kalır.` },
          { caption: `Başlangıçlar zamana yayılıyor: ${LAST} kartının başlangıcı artık ${l8.start}. Aynı anda ${NOLIM.wip_peak} yerine en fazla **${LIM.wip_peak}** kart devam ediyor.` },
          { caption: `${T_AGE}. turun sonunda iş öğesi yaşı: başlamış en eski kart ${AGE0.oldest.age} değil, **${AGE1.oldest.age}** tur yaşında. Ama ${LAST}, Hazır sütununda **${AGE1.waiting.age}** turdur bekliyor.` },
          { caption: `Döngü süresi düşüyor: ${LAST} başlangıçtan bitişe **${l8.cycle_time} tur** sürüyor; ortalama ${one(NOLIM.average_cycle_time)} değerinden ${one(LIM.average_cycle_time)} değerine iniyor.` },
          { caption: 'Her kart yine aynı turda bitiyor.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const W = 1264, H = 540;
      const svg = window.VC.svg(W, H, { label: 'Her kart için bir satır: istendi, başladı ve bitti; başlangıçtan önceki bekleme', uid: (x) => api.uid(x) });
      const yEnd = G4.rowY + N * G4.rowH;
      for (let t = 0; t <= 9; t += 1) {
        svg.appendChild(s('line', { x1: tx(t), x2: tx(t), y1: 30, y2: yEnd, stroke: 'var(--line)', 'stroke-width': 1 }));
        svg.appendChild(text(tx(t), 22, String(t), { 'text-anchor': 'middle', style: 'font-size:16px;fill:var(--text-soft)' }));
      }
      svg.appendChild(text(6, 22, 'KART · TUR →', { style: 'font-size:15px;font-weight:700;letter-spacing:0.06em;fill:var(--text-soft)' }));
      h.hCycle = s('g', { class: 'rv' }); h.hCycle.appendChild(text(1078, 22, 'döngü süresi', { 'text-anchor': 'middle', style: 'font-size:17px;font-weight:700;fill:var(--violet)' })); svg.appendChild(h.hCycle);
      h.hLead = s('g', { class: 'rv' }); h.hLead.appendChild(text(1196, 22, 'teslim süresi', { 'text-anchor': 'middle', style: 'font-size:17px;font-weight:700;fill:var(--accent-strong)' })); svg.appendChild(h.hLead);
      h.marks = s('g', { class: 'rv' });
      h.cycleVals = s('g', { class: 'rv' }); h.leadVals = s('g', { class: 'rv' });
      h.rows = {};
      IDS.forEach((id, i) => {
        const y = G4.rowY + i * G4.rowH, cy = y + G4.rowH / 2;
        const g = s('g', {});
        const bg = s('rect', { x: 0, y: y + 3, width: 1256, height: G4.rowH - 6, rx: 8, ry: 8, fill: i % 2 ? 'none' : 'rgba(124,196,255,0.035)', stroke: 'none', 'stroke-width': 2 });
        g.appendChild(bg);
        g.appendChild(text(6, cy + 6, id, { style: 'font-size:18px;font-weight:700' }));
        g.appendChild(text(54, cy + 6, trx(TITLE[id]), { style: 'font-size:16px;fill:var(--text-muted)' }));
        const wait = s('line', { y1: cy, y2: cy, stroke: 'var(--text-soft)', 'stroke-width': 3, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round' });
        const impl = s('rect', { y: cy - 13, height: 26, rx: 5, ry: 5, fill: 'var(--accent-fill)', stroke: 'var(--accent)', 'stroke-width': 2 });
        const rwait = s('rect', { y: cy - 13, height: 26, fill: `url(#${api.uid('hatch-warn')})`, stroke: 'var(--warn)', 'stroke-width': 1.5 });
        const rev = s('rect', { y: cy - 13, height: 26, rx: 5, ry: 5, fill: 'var(--ok-fill)', stroke: 'var(--ok)', 'stroke-width': 2 });
        g.append(wait, impl, rwait, rev);
        svg.appendChild(g); api.cue(g, `row-${id.toLowerCase()}`);
        const mA = s('circle', { cx: tx(0), cy, r: 7, fill: 'var(--bg)', stroke: 'var(--text)', 'stroke-width': 2.5 });
        const mS = s('rect', { y: cy - 18, width: 5, height: 36, fill: 'var(--accent-strong)' });
        const mF = s('path', { fill: 'var(--ok)', stroke: 'var(--bg)', 'stroke-width': 1.5 });
        h.marks.append(mA, mS, mF);
        const vC = text(1078, cy + 7, '', { 'text-anchor': 'middle', style: 'font-size:19px;font-weight:700;fill:var(--violet)' });
        const vL = text(1196, cy + 7, '', { 'text-anchor': 'middle', style: 'font-size:19px;font-weight:700;fill:var(--accent-strong)' });
        h.cycleVals.appendChild(vC); h.leadVals.appendChild(vL);
        h.rows[id] = { g, bg, zebra: i % 2 ? 'none' : 'rgba(124,196,255,0.035)', wait, impl, rwait, rev, mS, mF, vC, vL, cy };
      });
      svg.append(h.marks, h.cycleVals, h.leadVals);
      api.cue(h.cycleVals, 'cycle-values'); api.cue(h.leadVals, 'lead-values');
      // the two clocks of the last card
      const bracket = (y, kind, cls) => {
        const g = s('g', { class: 'rv' });
        const ln = s('line', { y1: y, y2: y, stroke: `var(--${kind})`, 'stroke-width': 3 });
        const t0 = s('line', { y1: y - 9, y2: y + 9, stroke: `var(--${kind})`, 'stroke-width': 3 });
        const t1 = s('line', { y1: y - 9, y2: y + 9, stroke: `var(--${kind})`, 'stroke-width': 3 });
        const lb = text(0, y + 6, '', { style: `font-size:18px;font-weight:700;fill:var(--${kind})` });
        g.append(ln, t0, t1, lb);
        svg.appendChild(g); api.cue(g, cls);
        return { g, ln, t0, t1, lb };
      };
      h.bLead = bracket(yEnd + 22, 'accent-strong', 'lead-bracket');
      h.bCycle = bracket(yEnd + 54, 'violet', 'cycle-bracket');
      h.age = s('g', { class: 'rv' });
      h.age.appendChild(s('line', { x1: tx(T_AGE), x2: tx(T_AGE), y1: 30, y2: yEnd + 6, stroke: 'var(--warn)', 'stroke-width': 3, 'stroke-dasharray': '6 5' }));
      h.age.appendChild(text(tx(T_AGE) + 8, yEnd + 22, `${T_AGE}. turun sonu`, { style: 'font-size:16px;font-weight:700;fill:var(--warn)' }));
      svg.appendChild(h.age); api.cue(h.age, 'age-line');
      // legend and the clocks
      const GLYPH_TR = { asked: 'istendi', start: 'başladı', finish: 'bitti', ready: 'Hazır sütununda bekliyor', impl: 'geliştiriliyor', rwait: 'incelemeyi bekliyor', review: 'inceleniyor' };   // accessible names of the legend glyphs
      const glyph = (kind) => {
        const g = window.VC.svg(46, 26, { label: GLYPH_TR[kind], uid: (x) => api.uid(`lg-${kind}-${x}`) });
        if (kind === 'asked') g.appendChild(s('circle', { cx: 23, cy: 13, r: 7, fill: 'var(--bg)', stroke: 'var(--text)', 'stroke-width': 2.5 }));
        if (kind === 'start') g.appendChild(s('rect', { x: 20, y: 1, width: 5, height: 24, fill: 'var(--accent-strong)' }));
        if (kind === 'finish') g.appendChild(s('path', { d: 'M23,2 L34,13 L23,24 L12,13 Z', fill: 'var(--ok)' }));
        if (kind === 'ready') g.appendChild(s('line', { x1: 2, x2: 44, y1: 13, y2: 13, stroke: 'var(--text-soft)', 'stroke-width': 3, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round' }));
        if (kind === 'impl') g.appendChild(s('rect', { x: 2, y: 3, width: 42, height: 20, rx: 4, fill: 'var(--accent-fill)', stroke: 'var(--accent)', 'stroke-width': 2 }));
        if (kind === 'rwait') g.appendChild(s('rect', { x: 2, y: 3, width: 42, height: 20, fill: `url(#${api.uid(`lg-${kind}-hatch-warn`)})`, stroke: 'var(--warn)', 'stroke-width': 1.5 }));
        if (kind === 'review') g.appendChild(s('rect', { x: 2, y: 3, width: 42, height: 20, rx: 4, fill: 'var(--ok-fill)', stroke: 'var(--ok)', 'stroke-width': 2 }));
        g.style.width = '46px'; g.style.height = '26px'; g.style.flex = '0 0 auto';
        return g;
      };
      const lg = (kind, label) => el('span', { style: 'display:inline-flex;align-items:center;gap:6px;font-size:16px;color:var(--text-muted)' }, [glyph(kind), label]);
      const legendCard = api.cue(el('div', { class: 'card', style: 'padding:8px 14px;display:flex;flex-wrap:wrap;gap:6px 16px;align-content:center;flex:1 1 0' }, [
        lg('asked', GLYPH_TR.asked), lg('start', GLYPH_TR.start), lg('finish', GLYPH_TR.finish), lg('ready', GLYPH_TR.ready), lg('impl', GLYPH_TR.impl), lg('rwait', GLYPH_TR.rwait), lg('review', GLYPH_TR.review),
      ]), 'legend');
      h.clocks = el('p', { style: 'font-size:18px;line-height:1.35' });
      h.clockCard = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:8px 14px;flex:0 0 470px;display:flex;flex-direction:column;gap:4px' }), [cardTitle('Sekiz kartın ortalamaları', 'margin-bottom:0;font-size:15px'), h.clocks]), 'averages');
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:12px' }, [api.cue(svg, 'timeline'), el('div', { style: 'display:flex;gap:12px;align-items:stretch' }, [legendCard, h.clockCard])]));
      svg.style.height = `${H}px`;
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'no-limit';
      const pol = base || st === 0 ? NOLIM : LIM;   // the prediction state of the limit still shows the schedule before it
      pol.cards.forEach((c) => {
        const row = h.rows[c.id], cy = row.cy;
        row.wait.setAttribute('x1', tx(0)); row.wait.setAttribute('x2', tx(c.start)); row.wait.style.display = c.start > 0 ? '' : 'none';
        row.impl.setAttribute('x', tx(c.start)); row.impl.setAttribute('width', G4.tw);
        row.rwait.setAttribute('x', tx(c.start + 1)); row.rwait.setAttribute('width', Math.max(0, G4.tw * c.review_wait)); row.rwait.style.display = c.review_wait > 0 ? '' : 'none';
        row.rev.setAttribute('x', tx(c.finish - 1)); row.rev.setAttribute('width', G4.tw);
        row.mS.setAttribute('x', tx(c.start) - 2.5);
        const fx = tx(c.finish);
        row.mF.setAttribute('d', `M${fx},${cy - 11} L${fx + 11},${cy} L${fx},${cy + 11} L${fx - 11},${cy} Z`);
        row.vC.textContent = String(c.cycle_time); row.vL.textContent = String(c.lead_time);
      });
      showIf(h.marks, !base || st >= 1);
      showIf(h.hLead, base ? st >= 2 : st >= 4); showIf(h.leadVals, base ? st >= 2 : st >= 4);
      showIf(h.hCycle, st >= 3); showIf(h.cycleVals, st >= 3);
      const c = cardOf(pol, LAST);
      const setB = (b, from, to, label, on) => {
        b.ln.setAttribute('x1', tx(from)); b.ln.setAttribute('x2', tx(to));
        b.t0.setAttribute('x1', tx(from)); b.t0.setAttribute('x2', tx(from)); b.t1.setAttribute('x1', tx(to)); b.t1.setAttribute('x2', tx(to));
        b.lb.setAttribute('x', tx(to) + 14); b.lb.textContent = label;
        showIf(b.g, on);
      };
      setB(h.bLead, 0, c.finish, `${LAST} teslim süresi: ${c.lead_time} tur`, (base && st >= 2) || (!base && st >= 4));
      setB(h.bCycle, c.start, c.finish, `${LAST} döngü süresi: ${c.cycle_time} tur`, st >= 3);
      showIf(h.age, !base && st === 2);
      IDS.forEach((id) => { const on = id === LAST && st >= 1; h.rows[id].bg.setAttribute('fill', on ? 'var(--warn-fill)' : h.rows[id].zebra); h.rows[id].bg.setAttribute('stroke', on ? 'var(--warn)' : 'none'); });
      showIf(h.clockCard, (base && st >= 4) || (!base && st >= 3));
      h.clocks.replaceChildren(
        el('span', {}, [el('b', { style: 'color:var(--violet)' }, `döngü süresi ${one(pol.average_cycle_time)}`), ' · ', el('b', { style: 'color:var(--accent-strong)' }, `teslim süresi ${one(pol.average_lead_time)}`), ' tur']),
        el('br'), el('span', { class: 'muted', style: 'font-size:16px' }, `aynı anda devam eden en çok kart: ${pol.wip_peak}${base ? '' : ` (sınır yokken: ${NOLIM.wip_peak})`}`),
      );
    },
    print: [
      { title: 'Her kartta üç işaret ve iki saat: Hazır sütunundaki bekleme de göz önünde', condition: 'no-limit', state: 4, note: `İşaretler: ${trx(WT.markers.arrival)}; başlangıç: ${trx(WT.markers.start)}; bitiş: ${trx(WT.markers.finish)}. Teslim süresi ${trx(WT.boundaries.lead_time)} sürer; döngü süresi ise ${trx(WT.boundaries.cycle_time)}. ${LAST}: istenme 0, başlangıç ${c8.start}, bitiş ${c8.finish}; teslim süresi ${c8.lead_time}, döngü süresi ${c8.cycle_time} tur; teslim süresinin ${c8.ready_wait} turu Hazır sütununda, ${c8.review_wait} turu incelemeyi bekleyerek geçti. Ortalamalar: döngü ${one(NOLIM.average_cycle_time)}, teslim ${one(NOLIM.average_lead_time)} tur; aynı anda en fazla ${NOLIM.wip_peak} kart devam ediyor.` },
      { title: `${LIM.wip_limit} kartlık devam eden iş sınırı: daha kısa döngü süresi, aynı teslim süresi`, condition: 'limit-2', state: 4, principle: true, note: `Aynı sekiz kart, aynı kapasiteler. Aynı anda en fazla ${LIM.wip_limit} kart devam ederken ${LAST} kartının başlangıcı ${l8.start}: döngü süresi ${l8.cycle_time}, teslim süresi ${l8.lead_time}. Ortalama döngü süresi ${one(NOLIM.average_cycle_time)} → ${one(LIM.average_cycle_time)} tur; ortalama teslim süresi ${one(NOLIM.average_lead_time)} → ${one(LIM.average_lead_time)}. ${T_AGE}. turun sonunda başlamış en eski kart ${AGE1.oldest.age} tur yaşında (sınır yokken: ${AGE0.oldest.age}); ${LAST} ise Hazır sütununda ${AGE1.waiting.age} turdur bekliyor. ${upper1(trx(WT.not_an_improvement))}. ${trx(WT.boundary_source)}.` },
    ],
  };

  // =====================================================================
  // SCENE 5 · estimates-with-assumptions (Bridge)
  // =====================================================================
  const ECH = EA.changed_condition;
  const DAYS = EA.similar_changes_days;
  const estimatesWithAssumptions = {
    id: 'estimates-with-assumptions', role: 'bridge',
    heading: '“Üç gün”: efor mu, geçen süre mi, yoksa bir söz mü?',
    lead: `Tek bir kart: ${EA.change.id} ${trx(EA.change.title)}. Ekip bunun “${trx(EA.stated)}” süreceğini söylüyor. Kimse planını bu sayıya göre yapmadan önce sayının arkasına bakın.`,
    principle: 'Tahmin, varsayımlarının da yanında taşınması gereken koşullu bir ifadedir.',
    principleShort: 'Sayının neyi varsaydığını söyleyin.',
    conditions: [
      { id: 'interface-agreed', baseline: true, label: 'Başlangıç: kimlik arayüzünde anlaşıldı', short: 'Arayüzde anlaşıldı',
        states: [
          { prompt: { question: `Ekip, ${EA.change.id} kartının “${trx(EA.stated)}” süreceğini söylüyor. Bu ne anlama geliyor?`, options: EA.meanings.map((m) => upper1(trx(m.reads_as))) }, caption: `**${EA.change.id} ${trx(EA.change.title)}**: ${trx(EA.change.summary)}. Verilen cevap: **${trx(EA.stated)}**.` },
          { caption: '“Üç gün” **efor**, **geçen süre** ya da bir **taahhüt** anlamına gelebilir: üç farklı sayı.' },
          { caption: 'Sayının arkasında: bilinen iş ve iki bağımlılık: kimlik arayüzü ve turda bir kart bitiren inceleme.' },
          { caption: `Benzer beş değişiklik ${DAYS.join(', ')} gün sürdü. ${upper1(trx(EA.range.basis))}.` },
          { caption: `Dayanağıyla birlikte: kimlik arayüzünde anlaşılmışsa **${EA.range.low}–${EA.range.high} gün geçen süre** ve ${EA.effort_days.low}–${EA.effort_days.high} günlük efor.` },
          { caption: 'Maliyet, tahminin bittiği yerde bitmez.', principle: true },
        ] },
      { id: 'interface-open', label: 'Değişiklik: kimlik arayüzünde anlaşılmadı', short: 'Arayüz açık',
        states: [
          { prompt: { question: 'Kimlik arayüzünde henüz anlaşılmadı. Tahmine ne olmalı?', options: [`“${upper1(trx(EA.stated))}” olarak kalmalı`, 'Genişletilmeli ya da koşulu belirtilmeli', 'Güvenli olsun diye iki katına çıkarılmalı'] }, caption: `Bir varsayım değişiyor: **${trx(ECH.label)}**.` },
          { caption: `Arayüzde anlaşılana kadar değişiklik bitemez: aralık **${ECH.range_if_unresolved.low}–${ECH.range_if_unresolved.high} güne** genişliyor.` },
          { caption: `Ya da tahmine koşulunu ekleyin: **${trx(ECH.qualified)}**. Koşul sayıyla birlikte taşınır.` },
          { caption: `Belirsizliği gidermek aralığı yeniden daraltır: ${trx(ECH.resolve)}.` },
          { caption: 'Bir koşul değiştiğinde tahmini güncelleyin.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      // row 1: the card and its number
      h.meanings = EA.meanings.map((m) => api.cue(el('div', { class: 'w4-cell', style: 'display:flex;flex-direction:column;gap:4px;padding:8px 12px' }, [el('b', { style: 'font-size:19px' }, trx(m.label)), el('span', { class: 'muted', style: 'font-size:16px;line-height:1.28' }, upper1(trx(m.reads_as)))]), `meaning-${m.id}`));
      h.meaningRow = el('div', reveal({ class: 'rv rv--rise', style: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px' }), h.meanings);
      const top = api.cue(el('div', { class: 'card', style: 'padding:12px 16px;display:grid;grid-template-columns:300px 250px minmax(0,1fr);gap:16px;align-items:center' }, [
        el('div', { style: 'display:flex;flex-direction:column;gap:4px' }, [el('span', { style: 'font-size:22px;font-weight:700' }, `${EA.change.id} · ${trx(EA.change.title)}`), small(upper1(trx(EA.change.summary)))]),
        api.cue(el('div', { style: 'font-family:var(--font-display);font-size:38px;font-weight:700;color:var(--warn);text-align:center;line-height:1.1;white-space:nowrap' }, `“${trx(EA.stated)}”`), 'number'),
        h.meaningRow,
      ]), 'estimate');
      // row 2 left: behind the number
      const list = (items, kind) => el('ul', { style: 'font-size:18px;line-height:1.35;display:flex;flex-direction:column;gap:2px;margin:2px 0 6px' }, items.map((t) => el('li', { style: kind ? `color:var(--${kind})` : '' }, upper1(trx(t)))));
      h.behind = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:2px;min-width:0' }), [
        cardTitle('Bilinen iş', 'margin-bottom:0;font-size:15px'), list(EA.known_work),
        cardTitle('Bağımlılıklar', 'margin-bottom:0;font-size:15px'), h.deps = list(EA.dependencies, 'warn'),
        cardTitle('Açık soru', 'margin-bottom:0;font-size:15px'), list(EA.open_questions),
      ]), 'behind');
      // row 2 right: similar changes as dots on a day axis
      const DW = 610, DH = 196, DX0 = 34, DX1 = DW - 24, DMAX = 10;
      const dx = (d) => DX0 + ((DX1 - DX0) * d) / DMAX;
      const svg = window.VC.svg(DW, DH, { label: 'Benzer beş değişikliğin gün ekseni üzerinde geçen gün sayıları; aralık ve tek sayı ile birlikte', uid: (x) => api.uid(`dots-${x}`) });
      for (let d = 0; d <= DMAX; d += 1) {
        svg.appendChild(s('line', { x1: dx(d), x2: dx(d), y1: 150, y2: 158, stroke: 'var(--line-strong)', 'stroke-width': 1.5 }));
        svg.appendChild(text(dx(d), 178, String(d), { 'text-anchor': 'middle', style: 'font-size:16px;fill:var(--text-soft)' }));
      }
      svg.appendChild(s('line', { x1: DX0, x2: DX1, y1: 150, y2: 150, stroke: 'var(--line-strong)', 'stroke-width': 1.5 }));
      svg.appendChild(text(DX1, 196, 'iş günü, başlangıçtan bitişe', { 'text-anchor': 'end', style: 'font-size:15px;fill:var(--text-soft)' }));
      h.band = s('rect', { y: 44, height: 98, rx: 8, ry: 8, fill: 'var(--accent-fill)', stroke: 'var(--accent)', 'stroke-width': 2 });
      h.bandLabel = text(0, 70, '', { style: 'font-size:17px;font-weight:700;fill:var(--accent-strong)' });
      h.bandG = s('g', { class: 'rv' }); h.bandG.append(h.band, h.bandLabel); svg.appendChild(h.bandG);
      h.dots = s('g', { class: 'rv' });
      const seen = {};
      DAYS.forEach((d) => { seen[d] = (seen[d] || 0) + 1; h.dots.appendChild(s('circle', { cx: dx(d), cy: 132 - (seen[d] - 1) * 24, r: 10, fill: 'var(--text)', stroke: 'var(--bg)', 'stroke-width': 2 })); });
      svg.appendChild(h.dots);
      h.single = s('g', {});
      h.single.appendChild(s('line', { x1: dx(3), x2: dx(3), y1: 16, y2: 150, stroke: 'var(--warn)', 'stroke-width': 3, 'stroke-dasharray': '6 5' }));
      h.single.appendChild(text(dx(3) - 10, 30, `“${trx(EA.stated)}”`, { 'text-anchor': 'end', style: 'font-size:17px;font-weight:700;fill:var(--warn)' }));
      svg.appendChild(h.single);
      svg.style.height = `${DH}px`;
      h.similar = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:4px;min-width:0' }), [cardTitle('Benzer beş değişiklik', 'margin-bottom:0;font-size:15px'), svg, small(`${upper1(trx(EA.similar_note))}.`, 'font-size:15px')]), 'similar');
      api.cue(h.dots, 'dots'); api.cue(h.bandG, 'range'); api.cue(h.single, 'single-number');
      // row 3: lifecycle (baseline) or the conditions of the estimate (changed)
      h.life = el('div', reveal({ class: 'rv rv--rise', 'data-cond': 'interface-agreed', style: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px' }), EA.lifecycle.map((x, i) => api.cue(el('div', { class: 'card', style: `padding:10px 14px;display:flex;flex-direction:column;gap:4px;border-color:var(--${['accent', 'warn', 'violet'][i]})` }, [el('b', { style: `font-size:18px;color:var(--${['accent-strong', 'warn', 'violet'][i]})` }, trx(x.label)), el('span', { style: 'font-size:17px;line-height:1.3' }, upper1(trx(x.value)))]), `cost-${x.id}`)));
      h.qualified = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'interface-open', 'data-show-from': '2', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:4px;border-color:var(--accent)' }), [cardTitle('Koşuluyla birlikte tahmin', 'margin-bottom:0;font-size:15px'), el('b', { style: 'font-size:20px;color:var(--accent-strong)' }, upper1(trx(ECH.qualified)))]), 'qualified');
      h.resolve = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'interface-open', 'data-show-from': '3', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:4px;border-color:var(--ok)' }), [cardTitle('Önce yapmaya değer', 'margin-bottom:0;font-size:15px'), el('span', { style: 'font-size:18px;line-height:1.3' }, `${upper1(trx(ECH.resolve))}: ${ECH.range_if_unresolved.low}–${ECH.range_if_unresolved.high} günlük aralığı yeniden ${EA.range.low}–${EA.range.high} güne daraltır.`)]), 'resolve');
      // the Turkish trigger ends with its verb ("… tahmini güncelle"); the card shows only the conditions, as the English card does
      h.trigger = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'interface-open', 'data-show-from': '4', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:4px;border-color:var(--warn)' }), [cardTitle('Ne zaman güncellenir', 'margin-bottom:0;font-size:15px'), el('span', { style: 'font-size:18px;line-height:1.3' }, upper1(trx(ECH.trigger).replace(/,? tahmini güncelle$/, '').replace(/^revise the estimate when /, '')) + '.')]), 'trigger');
      const changedRow = el('div', { 'data-cond': 'interface-open', style: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px' }, [h.qualified, h.resolve, h.trigger]);
      const mid = el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) 640px;gap:14px;min-height:0' }, [h.behind, h.similar]);
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:12px' }, [top, mid, h.life, changedRow]));
      h.dx = dx;
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'interface-agreed';
      showIf(h.meaningRow, !base || st >= 1);
      showIf(h.behind, !base || st >= 2);
      showIf(h.similar, !base || st >= 3);
      showIf(h.dots, !base || st >= 3);
      h.meanings.forEach((m) => focusIf(m, base && st === 1));
      focusIf(h.deps, false);
      const wide = !base && st >= 1;
      const lo = EA.range.low, hi = wide ? ECH.range_if_unresolved.high : EA.range.high;
      h.band.setAttribute('x', h.dx(lo)); h.band.setAttribute('width', h.dx(hi) - h.dx(lo));
      h.band.setAttribute('fill', wide ? 'var(--bad-fill)' : 'var(--accent-fill)'); h.band.setAttribute('stroke', wide ? 'var(--bad)' : 'var(--accent)');
      h.bandLabel.setAttribute('x', wide ? h.dx(lo) + 14 : h.dx(hi) + 12);
      h.bandLabel.setAttribute('fill', wide ? 'var(--bad)' : 'var(--accent-strong)');
      h.bandLabel.textContent = wide ? `arayüzde anlaşılana kadar ${lo}–${hi} gün` : `${lo}–${hi} gün`;
      showIf(h.bandG, (base && st >= 4) || !base);
      showIf(h.life, base && st >= 5);
    },
    print: [
      { title: 'Anlamı, dayanağı ve dışarıda bıraktıklarıyla birlikte tahmin', condition: 'interface-agreed', state: 5, principle: true, note: `“${upper1(trx(EA.stated))}” şu anlamlara gelebilir: ${listOr(EA.meanings.map((m) => `${lowerTr(trx(m.label))} (${trx(m.reads_as)})`))}. Bilinen iş: ${listAnd(EA.known_work.map(trx))}. Bağımlılıklar: ${listAnd(EA.dependencies.map(trx))}. Benzer beş değişiklik ${DAYS.join(', ')} gün sürdü (benzetim verisi); ${trx(EA.range.basis)}. Tahmin: kimlik arayüzünde anlaşıldığı varsayılırsa ${EA.range.low}–${EA.range.high} gün geçen süre, ${EA.effort_days.low}–${EA.effort_days.high} günlük efor. Aralık, örnekleri özetler; istatistiksel bir güven aralığı değildir. Tahminden sonraki maliyet: ${EA.lifecycle.map((x) => `${lowerTr(trx(x.label))}: ${trx(x.value)}`).join('; ')}.` },
      { title: 'Bir varsayım değişiyor: tahmin genişliyor ya da koşulunu yanında taşıyor', condition: 'interface-open', state: 4, principle: true, note: `${upper1(trx(ECH.label))}: aralık ${ECH.range_if_unresolved.low}–${ECH.range_if_unresolved.high} güne genişler ya da tahmin şu koşulla verilir: ${trx(ECH.qualified)}. ${upper1(trx(ECH.resolve))} aralığı yeniden daraltır. ${upper1(trx(ECH.trigger))}.` },
    ],
  };

  // =====================================================================
  // SCENE 6 · risk-and-learning (Anchor)
  // =====================================================================
  const OPT = RL.options;
  const CRIT = [['impact', 'Etki'], ['uncertainty', 'Belirsizlik'], ['reversibility', 'Geri alınabilirlik'], ['cost_of_delay', 'Gecikme maliyeti'], ['information_gained', 'Kazanılan bilgi']];
  const ORD = { low: 1, medium: 2, high: 3, little: 1, large: 3, 'very low': 0 };
  const ordOf = (v) => { const k = Object.keys(ORD).find((w) => String(v).toLowerCase().startsWith(w)); return k == null ? null : ORD[k]; };   // the dots read the English value
  const ordWord = (v) => trx(String(v)).split(':')[0];   // display: the Turkish word before the colon
  const IDENT = OPT[2].option, PROOF = OPT[1].option, VISUAL = OPT[0].option;
  const ALT = RL.curriculum_refinement.alternatives;
  const riskAndLearning = {
    id: 'risk-and-learning', role: 'anchor',
    heading: 'Ekip daha fazla iş taahhüt etmeden önce neyi öğrenmeli?',
    lead: 'Aday üç sonraki adım; uydurulmuş sayılarla değil, sözcüklerle beş ölçüte göre değerlendiriliyor. Her adımın ne öğreteceğine ve başarısızlığın neye mal olacağına bakın.',
    principle: 'Yalnızca çıktıya değil, sonraki işi boşa çıkarabilecek kararlara ve belirsizliklere de öncelik verin.',
    principleShort: 'Sonraki işi boşa çıkarabilecek şeyi önce öğrenin.',
    conditions: [
      { id: 'temporary-interface', baseline: true, label: 'Başlangıç: kimlik seçimi geçici', short: 'Geçici seçim',
        states: [
          { prompt: { question: 'Aday üç sonraki adım var. Ekip daha fazla iş taahhüt etmeden önce neyi öğrenmeli?', options: [`${trx(VISUAL)}: hızlı ve görünür`, trx(PROOF), trx(IDENT)] }, caption: 'Üç aday, beş ölçüt; değerlendirme sözcüklerle.' },
          { caption: `**${trx(VISUAL)}**: düşük etki, düşük belirsizlik, kolayca geri alınır, öğrenilecek pek bir şey yok. Hoş, ama az şey öğretir.` },
          { caption: `**${trx(PROOF)}**: yüksek etki ve yüksek belirsizlik. Sonraki her rezervasyon özelliği R-01'e dayanır; bu yüzden beklemek pahalıdır.` },
          { caption: `**${trx(IDENT)}**: yüksek etki, yüksek belirsizlik ve varsayım yanlışsa geri alması zor. R-03, isteyenin kim olduğuna bağlıdır.` },
          { caption: `Her seçenek daraltılabilir ya da ertelenebilir de: önce sahibin iptalini yayına alarak **kapsamı daralt**; görsel iyileştirmeyi **ertele**.` },
          { caption: `Önce: ${lowerFirst(trx(RL.baseline_decision.first))}. Görsel iyileştirme bekler; kaybedilen onun değeridir: **fırsat maliyeti**.` },
        ] },
      { id: 'data-migration', label: 'Değişiklik: seçim bir veri taşımaya dönüşüyor', short: 'Geri alması zor',
        states: [
          { prompt: { question: 'Kimlik seçimi her rezervasyon kaydında saklanacak: onu sonradan değiştirmek bir veri taşıma işlemi gerektirir. Ne değişir?', options: ['Hiçbir şey: sıra aynı kalsın', 'Üzerine inşa etmeden önce kimlik konusunda kanıt ara', 'Zaman kazanmak için araştırmayı atla'] }, caption: `Bir koşul değişiyor: **${trx(RL.changed_condition.label)}**.` },
          { caption: `Yalnızca kimlik satırında geri alınabilirlik değişiyor: **${ordWord(RL.changed_condition.reversibility)}**. ${upper1(trx(RL.changed_condition.reversibility).split(': ')[1])}.` },
          { caption: `${upper1(trx(RL.changed_decision.evidence))}: araştırma öne alınıyor.` },
          { caption: `En küçük tahmin en ucuzu değildir: ${trx(RL.lifecycle_example.option)} bugün en az, sonra en çok maliyet çıkarır.` },
          { caption: 'Araştırma sonuçlanana kadar hâlâ belirsiz.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const ordCell = (v) => {
        const k = ordOf(v);
        const dots = k == null ? null : el('span', { class: 'w4-ord', 'aria-hidden': 'true' }, [0, 1, 2].map((i) => el('i', { class: i < k ? 'on' : '' })));
        return el('span', {}, [dots, el('span', {}, ordWord(v))]);
      };
      const head = el('tr', {}, [el('th', { scope: 'col', style: 'width:222px' }, 'Seçenek'), ...CRIT.map(([, l]) => el('th', { scope: 'col', style: 'width:120px' }, l)), el('th', { scope: 'col' }, 'Neyi netleştirir'), el('th', { scope: 'col' }, 'Ters giderse')]);
      head.querySelectorAll('th').forEach((n) => { n.style.fontSize = '16px'; n.style.padding = '6px 8px'; n.style.lineHeight = '1.2'; n.style.textTransform = 'none'; n.style.letterSpacing = '0'; n.style.color = 'var(--text)'; });
      h.rows = OPT.map((o, i) => {
        const cells = {};
        const tds = CRIT.map(([k]) => { cells[k] = el('td', { style: 'font-size:17px;padding:8px' }, ordCell(o[k])); return cells[k]; });
        const tr = api.cue(el('tr', { class: 'rv' }, [
          el('th', { scope: 'row', style: 'font-size:18px;padding:8px;line-height:1.25' }, trx(o.option)), ...tds,
          el('td', { style: 'font-size:16px;padding:8px;line-height:1.28;color:var(--text-muted)' }, upper1(trx(RL.notes[o.option].clarifies))),
          el('td', { style: 'font-size:16px;padding:8px;line-height:1.28;color:var(--text-muted)' }, upper1(trx(RL.notes[o.option].failure_cost))),
        ]), `row-${i + 1}`);
        return { tr, cells, o };
      });
      h.revCell = h.rows[2].cells.reversibility;
      api.cue(h.revCell, 'identity-reversibility');
      const tbl = el('table', { class: 'data-table', style: 'table-layout:fixed' }, [el('caption', { class: 'visually-hidden' }, 'Beş ölçüte göre değerlendirilen aday üç sonraki adım'), el('thead', {}, head), el('tbody', {}, h.rows.map((r) => r.tr))]);
      const tableCard = api.cue(el('div', { class: 'card', style: 'padding:6px 10px' }, tbl), 'table');
      h.alts = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:6px;min-width:0' }), [
        cardTitle('Her adım dört biçimde seçilebilir', 'margin-bottom:0;font-size:15px'),
        ...ALT.map((a) => api.cue(el('div', { style: 'display:grid;grid-template-columns:150px minmax(0,1fr);gap:10px;font-size:17px;line-height:1.28' }, [el('b', { style: 'color:var(--accent-strong)' }, trx(a)), el('span', {}, upper1(trx(RL.alternative_notes[a])))]), `alt-${a.replace(/\s+/g, '-')}`)),
      ]), 'alternatives');
      const le = RL.lifecycle_example;
      h.life = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:4px;min-width:0;border-color:var(--warn)' }), [
        cardTitle(`Ömrü boyunca maliyet: ${trx(le.option)}`, 'margin-bottom:0;font-size:15px;color:var(--warn)'),
        ...RL.curriculum_refinement.cost_dimensions.map((d) => el('div', { style: 'display:grid;grid-template-columns:170px minmax(0,1fr);gap:10px;font-size:17px;line-height:1.25' }, [el('b', {}, upper1(trx(d))), el('span', {}, upper1(le[d.replace(/\s+/g, '_')] ? trx(le[d.replace(/\s+/g, '_')]) : ''))])),
      ]), 'lifecycle');
      h.decision = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:6px;min-width:0;border-color:var(--violet)' }), [
        cardTitle('Karar', 'margin-bottom:0;font-size:15px;color:var(--violet)'),
        h.decFirst = el('p', { style: 'font-size:19px;line-height:1.3' }), h.decWhy = el('p', { class: 'muted', style: 'font-size:17px;line-height:1.3' }),
        h.decCost = el('p', { style: 'font-size:17px;line-height:1.3' }),
      ]), 'decision');
      const lower = el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) 560px;gap:14px;min-height:0' }, [el('div', { style: 'display:grid;min-width:0' }, [h.alts, h.life]), h.decision]);
      [h.alts, h.life].forEach((n) => { n.style.gridArea = '1 / 1'; });
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:12px' }, [tableCard, lower]));
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'temporary-interface';
      h.rows.forEach((r, i) => { showIf(r.tr, !base || st >= i + 1); focusIf(r.tr, (base && st === i + 1) || (!base && i === 2 && st >= 1 && st <= 2)); });
      h.revCell.replaceChildren(ordCell4(!base && st >= 1 ? RL.changed_condition.reversibility : OPT[2].reversibility));
      h.revCell.style.color = !base && st >= 1 ? 'var(--bad)' : '';
      h.revCell.style.fontWeight = !base && st >= 1 ? '700' : '';
      showIf(h.alts, (base && st >= 4) || (!base && st <= 2));
      showIf(h.life, !base && st >= 3);
      const changed = !base && st >= 2;
      const d = changed ? RL.changed_decision : RL.baseline_decision;
      showIf(h.decision, (base && st >= 5) || (!base && st >= 2));
      h.decFirst.replaceChildren(el('b', {}, 'Önce: '), `${trx(d.first)}. `, el('b', {}, 'Sonra: '), `${trx(d.then)}. `, el('b', {}, 'Ertelenen: '), `${trx(d.deferred)}.`);
      h.decWhy.textContent = changed ? `${upper1(trx(RL.changed_decision.evidence))}.` : `${upper1(trx(RL.baseline_decision.reason))}.`;
      h.decCost.replaceChildren(...(changed && st >= 4 ? [el('b', { style: 'color:var(--warn)' }, 'Hâlâ belirsiz: '), `${trx(RL.still_uncertain)}.`] : [el('b', {}, 'Fırsat maliyeti: '), `${trx(RL.opportunity_cost)}.`]));
    },
    print: [
      { title: 'Karar tablosu ve fırsat maliyetiyle birlikte başlangıçtaki karar', condition: 'temporary-interface', state: 5, note: `Ölçütler: ${RL.criteria.map(trx).join(', ')}. ${upper1(trx(RL.scale))}. ${OPT.map((o) => `“${trx(o.option)}” adımı şunu netleştirir: ${trx(RL.notes[o.option].clarifies)}; ters giderse: ${trx(RL.notes[o.option].failure_cost)}.`).join(' ')} Alternatifler: ${ALT.map((a) => `${trx(a)} (${trx(RL.alternative_notes[a])})`).join('; ')}. Karar: önce ${lowerFirst(trx(RL.baseline_decision.first))}, sonra ${lowerFirst(trx(RL.baseline_decision.then))}; ${lowerFirst(trx(RL.baseline_decision.deferred))} ertelenir. Gerekçe: ${trx(RL.baseline_decision.reason)}. Fırsat maliyeti: ${trx(RL.opportunity_cost)}.` },
      { title: 'Yalnızca geri alınabilirlik değişiyor: kimlik sorusu öne alınıyor', condition: 'data-migration', state: 4, principle: true, note: `${upper1(trx(RL.changed_condition.label))}: kimlik kararının geri alınabilirliği şu hâle geliyor: ${trx(RL.changed_condition.reversibility)}. ${upper1(trx(RL.changed_decision.evidence))}: önce ${lowerFirst(trx(RL.changed_decision.first))}, sonra ${lowerFirst(trx(RL.changed_decision.then))}. ${upper1(trx(RL.lifecycle_example.option))}: ${RL.curriculum_refinement.cost_dimensions.map((d) => `${trx(d)} ${trx(RL.lifecycle_example[d.replace(/\s+/g, '_')])}`).join(', ')}; ${trx(RL.lifecycle_example.lesson)}. Hâlâ belirsiz: ${trx(RL.still_uncertain)}.` },
    ],
  };
  function lowerFirst(str) { return str.charAt(0).toLocaleLowerCase('tr') + str.slice(1); }
  function ordCell4(v) {
    const k = ordOf(v);
    const dots = k == null ? null : el('span', { class: 'w4-ord', 'aria-hidden': 'true' }, [0, 1, 2].map((i) => el('i', { class: i < k ? 'on' : '' })));
    return el('span', {}, [dots, el('span', {}, ordWord(v))]);
  }

  // =====================================================================
  // SCENE 7 · definition-of-done (Bridge)
  // =====================================================================
  const POL = DD.policy;
  const WORD = DD.wording_change;
  const OWN = CM.find((r) => r.label === 'own-future'), OTHER = CM.find((r) => r.label === 'other-user');
  const STARTED = CM.find((r) => r.label === 'already-started'), UNAUTH = CM.find((r) => r.label === 'unauthenticated');
  const nameOf = (uid) => (CASE.users.find((u) => u.id === uid) || {}).name || 'kimse';
  const definitionOfDone = {
    id: 'definition-of-done', role: 'bridge',
    heading: 'Kod çalışıyor. İptal değişikliği bitti mi?',
    lead: `${DD.change.id} ${trx(DD.change.title)} kodlandı ve olağan akışı çalışıyor. İnsanlar ona güvenmeden önce başka neyin doğru olması gerekir?`,
    principle: 'Ortak bir tamamlanma politikası kalite beklentilerini görünür ve orantılı kılmalıdır.',
    principleShort: 'Riske göre ölçülü bir “bitti” tanımında anlaşın.',
    conditions: [
      { id: 'cancellation-change', baseline: true, label: 'Başlangıç: iptal davranışında bir değişiklik', short: 'İptal',
        states: [
          { prompt: { question: 'İptal işlevi olağan akışta çalışıyor. İptal değişikliği bitti mi?', options: ['Evet: kod çalışıyor', 'Diğer R-03 vakaları istendiği gibi davranmadıkça hayır', 'Evet, birleştirildiği anda'] }, caption: `**${DD.change.id} ${trx(DD.change.title)}** kodlandı. Tek bir vaka çalışıyor: ${trx(DD.change.happy_path)}.` },
          { caption: `Sıradaki vaka: ${trx(DD.missing[0].case)}. **${upper1(trx(DD.missing[0].what))}** eksik.` },
          { caption: `Ayrıca ${trx(DD.missing[1].case)}: kişi işlemin gerçekleşip gerçekleşmediğini anlayamıyor.` },
          { caption: 'Ekibin tamamlanma politikası, bu ekibin riski için “bitti” demenin neyi gerektirdiğini söyler: beş tür kanıt.' },
          { caption: 'Sahiplik kontrolü ve mesaj düzeltilince beşi de sağlanıyor. Değişiklik artık yalnızca kodlanmış değil, güvenilmeye hazır.' },
          { caption: "R-03'ün örnekleri tek bir gereksinimi kabul eder. Tamamlanma politikası ise her değişikliğe uygulanır: Scrum'da buna **Bitti Tanımı** denir." },
        ] },
      { id: 'wording-fix', label: 'Değişiklik: dahili bir ifade düzeltmesi', short: 'İfade düzeltmesi',
        states: [
          { prompt: { question: 'Sırada dahili bir günlük etiketindeki yazım hatasının düzeltilmesi var; davranış değişmiyor. Aynı kanıtlar gerekir mi?', options: ['Evet: tek kontrol listesi, tamamı, her seferinde', 'Aynı politika, yalnızca ilgili kanıtlar', 'Kanıt gerekmez: yalnızca sözcükler'] }, caption: `İkinci bir değişiklik: **${trx(WORD.title)}**. ${upper1(trx(WORD.summary))}.` },
          { caption: `${trx(POL[0].label)}: ${trx(WORD.relevant.behavior)}. ${trx(POL[1].label)}: ${trx(WORD.relevant.review)}. ${trx(POL[2].label)}: ${trx(WORD.relevant.checks)}.` },
          { caption: `${trx(POL[3].label)}: ${trx(WORD.relevant.docs)}. ${trx(POL[4].label)}: ${trx(WORD.relevant.operability)}.` },
          { caption: 'Tek politika; kanıtlar her değişikliğe göre.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const badgeEl = (p, key) => {
        const mk = el('span', { class: 'mk', 'aria-hidden': 'true' }, '·');
        const body = el('span', {}, [el('b', {}, trx(p.label)), el('br'), h[`ev-${key}-${p.id}`] = el('span', { class: 'muted', style: 'font-size:16px' }, '')]);
        const n = api.cue(el('div', { class: 'w4-badge' }, [mk, body]), `${key}-${p.id}`);
        n.mk = mk;
        return n;
      };
      h.badges = POL.map((p) => badgeEl(p, 'badge'));
      h.policy = el('div', reveal({ class: 'rv rv--rise', style: 'display:flex;flex-direction:column;gap:6px' }), [cardTitle('Bu ekibin tamamlanma politikası', 'margin-bottom:0;font-size:15px;color:var(--violet)'), ...h.badges]);
      h.title = el('span', { style: 'font-size:22px;font-weight:700' });
      h.status = el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' });
      const cardEl = api.cue(el('div', { class: 'card', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:10px;min-width:0' }, [h.title, h.status, h.policy]), 'work-card');
      // right: the cases and the screen
      const caseRow = (row, does, name) => {
        const doesCell = el('td', { style: 'font-size:17px;padding:8px 10px' });
        const tr = api.cue(el('tr', { class: 'rv' }, [
          el('th', { scope: 'row', style: 'font-size:17px;padding:8px 10px;line-height:1.25' }, `${row.requester ? `${nameOf(row.requester)} (${row.requester})` : 'Oturum açmamış biri'}: ${row.booking} iptali, saat ${row.now}`),
          el('td', { style: `font-size:17px;padding:8px 10px;color:var(--${row.expected === 'allowed' ? 'ok' : 'bad'});font-weight:600` }, trx(row.expected)),
          doesCell,
        ]), name);
        tr.doesCell = doesCell; tr.does = does;
        return tr;
      };
      h.cases = [caseRow(OWN, 'allowed', 'case-own'), caseRow(OTHER, 'allowed', 'case-other'), caseRow(STARTED, 'denied', 'case-started'), caseRow(UNAUTH, 'denied', 'case-signed-out')];
      const tbl = el('table', { class: 'data-table data-table--compact' }, [el('caption', { class: 'visually-hidden' }, 'R-03 vakaları: kuralın söylediği ve değişikliğin yaptığı'), el('thead', {}, el('tr', {}, ['Vaka', "R-03'e göre", 'Değişikliğin yaptığı'].map((t) => el('th', { scope: 'col', style: 'font-size:15px' }, t)))), el('tbody', {}, h.cases)]);
      h.casesCard = api.cue(el('div', { class: 'card', 'data-cond': 'cancellation-change', style: 'padding:10px 14px;min-width:0' }, [cardTitle('R-03 vakaları', 'margin-bottom:2px;font-size:15px'), tbl]), 'cases');
      h.statusLine = el('div', { class: 'status status--wait', role: 'status', style: 'font-size:19px' }, [el('span', { class: 'ico', 'aria-hidden': 'true' }, '?'), el('span', {}, '(İptal düğmesinden sonra mesaj yok)')]);
      h.screen = api.cue(el('div', reveal({ class: 'rv rv--rise', 'data-cond': 'cancellation-change' }), window.VC.browser({ who: `${ARI.name} · ${ARI.id}`, url: 'campus-rooms.example/my-bookings', body: [
        el('div', { style: 'display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;font-size:19px' }, [el('span', {}, `${BK.id} · ${BK.room_id} · ${BK.start}–${BK.end}`), el('span', { class: 'chip chip--muted', style: 'font-size:16px' }, 'İptal düğmesine basıldı')]),
        h.statusLine,
      ] })), 'screen');
      h.accept = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'cancellation-change', style: 'padding:10px 14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;border-color:var(--violet)' }), [
        el('div', {}, [el('b', { style: 'font-size:17px;color:var(--accent-strong)' }, 'Kabul örnekleri'), el('p', { style: 'font-size:16px;line-height:1.3' }, 'Tek bir gereksinime aittir: yukarıdaki R-03 vakaları.')]),
        el('div', {}, [el('b', { style: 'font-size:17px;color:var(--violet)' }, 'Tamamlanma politikası'), el('p', { style: 'font-size:16px;line-height:1.3' }, 'Ekibin bitti dediği her değişikliğe uygulanır.')]),
      ]), 'acceptance-vs-policy');
      // changed: the two changes side by side
      h.cmpRows = POL.map((p, i) => el('tr', { class: 'rv', 'data-show-from': i <= 2 ? '1' : '2' }, [el('th', { scope: 'row', style: 'font-size:16px;padding:6px 8px' }, trx(p.label)), el('td', { style: 'font-size:15px;padding:6px 8px;line-height:1.25' }, upper1(trx(p.evidence))), el('td', { style: 'font-size:15px;padding:6px 8px;line-height:1.25' }, upper1(trx(WORD.relevant[p.id])))]));
      h.compare = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'wording-fix', 'data-show-from': '1', style: 'padding:10px 12px;min-width:0' }), [cardTitle('İki değişiklik, tek politika', 'margin-bottom:2px;font-size:15px'), el('table', { class: 'data-table data-table--compact' }, [el('caption', { class: 'visually-hidden' }, 'İki değişiklik için ilgili kanıtlar'), el('thead', {}, el('tr', {}, ['Kanıt', `${DD.change.id} iptali`, 'İfade düzeltmesi'].map((t) => el('th', { scope: 'col', style: 'font-size:14px;padding:6px 8px' }, t)))), el('tbody', {}, h.cmpRows)])]), 'compare');
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [h.casesCard, h.screen, h.accept, h.compare]);
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:560px minmax(0,1fr);gap:18px;align-items:start' }, [cardEl, right]));
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'cancellation-change';
      const fixed = base && st >= 4;
      h.title.textContent = base ? `${DD.change.id} · ${trx(DD.change.title)}` : upper1(trx(WORD.title));
      h.status.replaceChildren(...(base
        ? [chip('Kodlandı', 'accent', { style: 'font-size:16px' }), chip(st >= 1 && !fixed ? 'Yalnızca olağan akış' : 'Olağan akış çalışıyor', st >= 1 && !fixed ? 'warn' : 'ok', { style: 'font-size:16px' }), fixed ? chip('Güvenilmeye hazır', 'ok', { style: 'font-size:16px' }) : null]
        : [chip('Davranış değişikliği yok', 'muted', { style: 'font-size:16px' }), st >= 3 ? chip('Kanıtlarıyla birlikte bitti', 'ok', { style: 'font-size:16px' }) : null]).filter(Boolean));
      showIf(h.policy, (base && st >= 3) || !base);
      POL.forEach((p, i) => {
        const b = h.badges[i];
        let cls = '', mark = '·', ev = upper1(trx(p.evidence));
        if (base) {
          if (st >= 4) { cls = 'is-ok'; mark = '✓'; }
          else if (p.id === 'behavior' || p.id === 'docs') { cls = st >= 3 ? 'is-bad' : ''; mark = st >= 3 ? '✕' : '·'; ev = p.id === 'behavior' ? `Eksik: ${trx(DD.missing[0].what)}` : `Eksik: ${trx(DD.missing[1].what)}`; }
        } else {
          const shown = (i <= 2 && st >= 1) || (i >= 3 && st >= 2);
          ev = shown ? upper1(trx(WORD.relevant[p.id])) : '';
          cls = shown ? (p.id === 'behavior' ? 'is-na' : 'is-ok') : '';
          mark = shown ? (p.id === 'behavior' ? '–' : '✓') : '·';
        }
        b.className = `w4-badge ${cls}`.trim();
        b.mk.textContent = mark;
        h[`ev-badge-${p.id}`].textContent = ev;
        focusIf(b, false);
      });
      h.cases.forEach((tr, i) => {
        const shown = i === 0 || (i === 1 && st >= 1) || (i >= 2 && st >= 4);
        showIf(tr, base && shown);
        const does = fixed ? (i === 0 ? 'allowed' : 'denied') : tr.does;
        const right = i === 1 ? fixed : true;
        tr.doesCell.replaceChildren(el('span', { style: `color:var(--${right ? 'ok' : 'bad'});font-weight:700` }, `${trx(does)} ${right ? '✓' : '✕'}`));
        focusIf(tr, base && i === 1 && st === 1);
      });
      showIf(h.screen, base && st >= 2);
      h.statusLine.className = fixed ? 'status status--ok' : 'status status--wait';
      h.statusLine.replaceChildren(el('span', { class: 'ico', 'aria-hidden': 'true' }, fixed ? '✓' : '?'), el('span', {}, fixed ? `${BK.id} iptal edildi. Oda yeniden boş.` : '(İptal düğmesinden sonra mesaj yok)'));
      showIf(h.accept, base && st >= 5);
      focusIf(h.compare, !base && st === 3);
    },
    print: [
      { title: 'İptal değişikliği: kodlanmış olmak henüz bitmiş olmak değil', condition: 'cancellation-change', state: 5, note: `Olağan akış çalışıyor: ${trx(DD.change.happy_path)}. Başta eksik olanlar: ${DD.missing.map((m) => `${trx(m.what)} (${trx(m.case)})`).join('; ')}. Ekibin tamamlanma politikası: ${POL.map((p) => `${trx(p.label)}: ${trx(p.evidence)}`).join('; ')}. ${upper1(trx(DD.acceptance_vs_policy))}. Scrum Kılavuzu (S04) Bitti Tanımı'nı şöyle tanımlar: “${trx(DD.scrum_definition)}”` },
      { title: 'Dahili bir ifade düzeltmesi: aynı politika, ilgili kanıtlar', condition: 'wording-fix', state: 3, principle: true, note: `${upper1(trx(WORD.title))}: ${trx(WORD.summary)}. ${POL.map((p) => `${trx(p.label)}: ${trx(WORD.relevant[p.id])}`).join('; ')}. Kanıtlar değişiklikle orantılıdır; her değişiklikte tekrarlanan aynı tören değildir.` },
    ],
  };

  // =====================================================================
  // SCENE 8 · retrospective-as-test (Bridge)
  // =====================================================================
  const retrospectiveAsTest = {
    id: 'retrospective-as-test', role: 'bridge',
    heading: 'İnceleme kuyruğu büyümeye devam ediyor. Ne değişmeli?',
    lead: 'Ekibin çalışma biçimindeki bir değişikliği diğer her değişiklik gibi ele alın: ne beklediğinizi söyleyin, yanıldığınızı neyin göstereceğine karar verin, sonra yan etkiler de dahil sonuçlara bakın.',
    principle: 'Bir süreci bilinçli olarak değiştirin, sonuçlarını gözlemleyin ve kanıtlar uyuşmadığında açıklamayı gözden geçirin.',
    principleShort: 'Bir değişikliği deneyin, etkilerini izleyin, gözden geçirin.',
    conditions: [
      { id: 'share-review', baseline: true, label: 'Başlangıç: inceleme işini paylaşmak', short: 'İncelemeyi paylaş',
        states: [
          { prompt: { question: 'İnceleme kuyruğu her turda büyüyor. Ekip bundan sonra ne yapmalı?', options: ['İnceleyen kişiye acele etmesini söylemek', 'İnceleme adımında açıkça belirtilmiş bir değişikliği denemek', 'Yeni kartlara başlamayı tamamen bırakmak'] }, caption: `Panodan gelen gözlem: **${trx(RT.observation)}**.` },
          { caption: `“${upper1(trx(RT.blame))}” sözü bir kişiyi suçlar. Sisteme bakan görüş: ${trx(RT.system)}.` },
          { caption: 'Neden **suçlamasız** tutmalı: insanlar gecikmeleri ve hataları ancak bunun güvenli olduğu yerde dürüstçe bildirir.' },
          { caption: `Beklenen bir etkisi olan öneri: ${trx(RT.proposal)}. Beklenen: ${trx(RT.expected)}.` },
          { caption: `Önce, önerinin yanlış olduğunu neyin göstereceğine karar verin: ${trx(RT.contrary)}. Öncesi ve sonrası için üç ölçü.` },
          { caption: `Değişiklikten sonra: **${RT.after_shared.done_round}. turda** bitti, kuyruk en fazla ${RT.after_shared.queue_peak} kart, incelemeden sonra bulunan sorunlar değişmedi. Kanıt beklentiyle uyuşuyor.` },
        ] },
      { id: 'faster-shallower', label: 'Değişiklik: daha hızlı inceleme, daha çok gözden kaçan sorun', short: 'Hızlı ama yüzeysel',
        states: [
          { prompt: { question: `Başka bir ekip incelemeyi daha az dikkatli okuyarak hızlandırıyor. Onların panosu da ${RT.after_rushed.done_round}. turda bitiyor. Daha mı iyi?`, options: ['Evet: aynı hızlanma', 'Karar vermeden önce kaliteye ve yeniden çalışmaya bak', 'Evet, kimse şikâyet etmezse'] }, caption: `Aynı hızlanma; bir yan etki değişiyor: **${trx(RT.side_effect)}** artıyor.` },
          { caption: `Akış aynı görünüyor: ${RT.after_rushed.done_round}. turda bitti, kuyruk en fazla ${RT.after_rushed.queue_peak} kart. Ama incelemeden sonra **${RT.after_rushed.missed_issues}** sorun bulundu.` },
          { caption: `${upper1(trx(RT.after_rushed.rework))}: yeniden çalışma dahil, son kart **${RT.after_rushed.done_round_with_rework}. turda** bitiyor.` },
          { caption: 'Akışı ve kaliteyi birlikte değerlendirin.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      // sparkline of the baseline review queue
      const SW = 250, SH = 92;
      const sp = window.VC.svg(SW, SH, { label: 'Başlangıç koşulunda tur tur inceleme kuyruğu', uid: (x) => api.uid(`spark-${x}`) });
      const px = (r) => 8 + ((SW - 16) * r) / 9, py = (n) => SH - 16 - ((SH - 30) * n) / 7;
      sp.appendChild(s('path', { d: B.rows.map((row, i) => `${i ? 'L' : 'M'}${px(row.round)},${py(row.review_waiting)}`).join(' '), fill: 'none', stroke: 'var(--warn)', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }));
      sp.appendChild(s('circle', { cx: px(B4), cy: py(B.rows[B4].review_waiting), r: 6, fill: 'var(--warn)' }));
      sp.appendChild(text(px(B4) + 12, py(B.rows[B4].review_waiting) - 4, `${B.rows[B4].review_waiting} bekliyor`, { style: 'font-size:15px;font-weight:700;fill:var(--warn)' }));
      sp.appendChild(text(8, SH - 2, '0. tur', { style: 'font-size:13px;fill:var(--text-soft)' }));
      sp.appendChild(text(SW - 8, SH - 2, '9. tur', { 'text-anchor': 'end', style: 'font-size:13px;fill:var(--text-soft)' }));
      sp.style.width = `${SW}px`; sp.style.height = `${SH}px`;
      const hyp = (key, title, body, extra) => api.cue(el('div', Object.assign({ class: 'w4-hyp' }, extra || {}), [el('span', { class: 't' }, title), ...body]), key);
      h.obs = hyp('observation', '1 · Gözlem', [el('p', {}, `${upper1(trx(RT.observation))}.`), sp]);
      h.prop = hyp('proposal', '2 · Önerilen değişiklik', [el('p', {}, `${upper1(trx(RT.proposal))}.`)], reveal({ class: 'w4-hyp rv rv--rise' }));
      h.expect = hyp('expected', '3 · Beklenen etki', [el('p', {}, `${upper1(trx(RT.expected))}.`)], reveal({ class: 'w4-hyp rv rv--rise' }));
      h.contra = hyp('contrary', '4 · Ne olursa yanlıştır', [el('p', {}, `${upper1(trx(RT.contrary))}.`), el('p', { style: 'font-size:16px;color:var(--warn)' }, `İzlenecek yan etki: ${trx(RT.side_effect)}.`)], reveal({ class: 'w4-hyp rv rv--rise' }));
      const top = el('div', { style: 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px' }, [h.obs, h.prop, h.expect, h.contra]);
      h.blame = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:6px' }), [
        cardTitle('Kişiden değil, sistemden söz edin', 'margin-bottom:0;font-size:15px'),
        el('p', { style: 'font-size:18px;line-height:1.3' }, [el('s', { style: 'color:var(--bad)' }, `“${upper1(trx(RT.blame))}.”`)]),
        el('p', { style: 'font-size:18px;line-height:1.3' }, [el('b', { style: 'color:var(--ok)' }, 'Sistem: '), `${upper1(trx(RT.system))}.`]),
      ]), 'blame-or-system');
      h.safe = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:6px;border-color:var(--accent)' }), [
        cardTitle('Neden suçlamasız', 'margin-bottom:0;font-size:15px;color:var(--accent-strong)'),
        el('p', { style: 'font-size:17px;line-height:1.32' }, `${upper1(trx(RT.safety))}.`),
      ]), 'blameless');
      // measures table
      const COLS = [['before', 'Önce'], ['after_shared', 'Sonra: paylaşılan inceleme'], ['after_rushed', 'Sonra: hızlı ama yüzeysel']];
      const vals = [['done_round', RT.measures[0]], ['queue_peak', RT.measures[1]], ['missed_issues', RT.measures[2]]];
      h.cells = {};
      const headRow = el('tr', {}, [el('th', { scope: 'col', style: 'font-size:14px;padding:6px 8px' }, 'Ölçü'), ...COLS.map(([k, l]) => (h.cells[`h-${k}`] = el('th', { scope: 'col', class: 'rv', style: 'font-size:14px;padding:6px 8px;line-height:1.2' }, l)))]);
      const bodyRows = vals.map(([k, label]) => el('tr', {}, [el('th', { scope: 'row', style: 'font-size:16px;padding:7px 8px;line-height:1.25' }, upper1(trx(label))), ...COLS.map(([c]) => (h.cells[`${c}-${k}`] = el('td', { class: 'num rv', style: 'font-size:20px;font-weight:700;padding:7px 8px' }, String(RT[c][k]))))]));
      h.reworkRow = el('tr', { class: 'rv' }, [el('th', { scope: 'row', style: 'font-size:16px;padding:7px 8px;line-height:1.25' }, 'Yeniden çalışma dahil, sekizinin de bittiği tur'), el('td', { class: 'num', style: 'font-size:20px;font-weight:700;padding:7px 8px' }, String(RT.before.done_round)), el('td', { class: 'num', style: 'font-size:20px;font-weight:700;padding:7px 8px' }, String(RT.after_shared.done_round)), el('td', { class: 'num', style: 'font-size:20px;font-weight:700;padding:7px 8px;color:var(--bad)' }, String(RT.after_rushed.done_round_with_rework))]);
      h.missedRushed = h.cells['after_rushed-missed_issues'];
      h.measures = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 12px;min-width:0' }), [cardTitle('Ölçüler: önce ve sonra', 'margin-bottom:2px;font-size:15px'), el('table', { class: 'data-table data-table--compact', style: 'table-layout:fixed' }, [el('caption', { class: 'visually-hidden' }, 'Değişiklikten önce ve sonra akış ve kalite ölçüleri'), el('thead', {}, headRow), el('tbody', {}, [...bodyRows, h.reworkRow])])]), 'measures');
      h.balanced = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;border-color:var(--violet)' }), [cardTitle('Dengeli bir deney', 'margin-bottom:0;font-size:15px;color:var(--violet)'), el('p', { style: 'font-size:18px;line-height:1.3' }, `${upper1(trx(RT.balanced))}. Sonuçlar beklenen etkiyle uyuşmadığında önce açıklamayı, sonra süreci değiştirin.`)]), 'balanced');
      const lowLeft = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [h.blame, h.safe]);
      const lowRight = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [h.measures, h.balanced]);
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:14px' }, [top, el('div', { style: 'display:grid;grid-template-columns:500px minmax(0,1fr);gap:14px;min-height:0' }, [lowLeft, lowRight])]));
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'share-review';
      showIf(h.blame, !base || st >= 1);
      showIf(h.safe, !base || st >= 2);
      showIf(h.prop, !base || st >= 3); showIf(h.expect, !base || st >= 3);
      showIf(h.contra, !base || st >= 4);
      showIf(h.measures, !base || st >= 4);
      ['h-before', 'before-done_round', 'before-queue_peak', 'before-missed_issues'].forEach((k) => showIf(h.cells[k], !base || st >= 4));
      ['h-after_shared', 'after_shared-done_round', 'after_shared-queue_peak', 'after_shared-missed_issues'].forEach((k) => showIf(h.cells[k], !base || st >= 5));
      ['h-after_rushed', 'after_rushed-done_round', 'after_rushed-queue_peak', 'after_rushed-missed_issues'].forEach((k) => showIf(h.cells[k], !base && st >= 1));
      h.missedRushed.style.color = !base && st >= 1 ? 'var(--bad)' : '';
      focusIf(h.missedRushed, !base && st === 1);
      showIf(h.reworkRow, !base && st >= 2);
      showIf(h.balanced, !base && st >= 3);
      focusIf(h.obs, base && st === 0);
      focusIf(h.contra, base && st === 4);
    },
    print: [
      { title: 'Bir süreç hipotezi: gözlem, değişiklik, beklenen etki ve onu neyin çürüteceği', condition: 'share-review', state: 5, note: `Gözlem: ${trx(RT.observation)}. Açıklama “${upper1(trx(RT.blame))}” değil, şu: ${trx(RT.system)}. ${upper1(trx(RT.safety))}. Öneri: ${trx(RT.proposal)}. Beklenen: ${trx(RT.expected)}. Şu olursa öneri yanlıştır: ${trx(RT.contrary)}; izlenecek yan etki: ${trx(RT.side_effect)}. Önce: ${RT.before.done_round}. turda bitti, kuyruk en fazla ${RT.before.queue_peak} kart, incelemeden sonra ${RT.before.missed_issues} sorun bulundu. Sonra: ${RT.after_shared.done_round}. tur, ${RT.after_shared.queue_peak} kart, ${RT.after_shared.missed_issues} sorun. Benzetimle üretilmiş öğretim değerleri.` },
      { title: 'Daha hızlı ama daha yüzeysel: yan etki dahil', condition: 'faster-shallower', state: 3, principle: true, note: `Hızlı ama yüzeysel inceleme: ${RT.after_rushed.done_round}. turda bitti, kuyruk en fazla ${RT.after_rushed.queue_peak} kart, ama incelemeden sonra ${RT.after_rushed.missed_issues} sorun bulundu; ${trx(RT.after_rushed.rework)} var, bu yüzden son kart ${RT.after_rushed.done_round_with_rework}. turda bitiyor. ${upper1(trx(RT.balanced))}.` },
    ],
  };

  // =====================================================================
  // PAGE · four measures and their boundaries
  // =====================================================================
  const MEASURES = [
    { id: 'wip', name: 'Devam eden iş', def: 'Başlamış ama bitmemiş öğeler; belirli bir anda sayılır.', from: 'start', to: 'finish', value: `${B4}. turun sonunda ${B.rows[B4].review_waiting} kart (başlangıç koşulu); sınırla en fazla ${LIM.wip_peak}`, src: 'Kanban Guide' },
    { id: 'throughput', name: 'İş çıkış hızı', def: 'Birim zamanda biten öğeler; bitiş çizgisinde sayılır.', from: 'finish', to: 'finish', value: `inceleme sürekli meşgulken turda ${B.review_capacity} kart (başlangıç koşulu)`, src: 'Kanban Guide' },
    { id: 'age', name: 'İş öğesi yaşı', def: 'Henüz bitmemiş bir öğe için başlangıcından şu ana kadar.', from: 'start', to: 'now', value: `${T_AGE}. turun sonunda ${LAST}: ${T_AGE - c8.start} tur (başlangıç koşulu)`, src: 'Kanban Guide' },
    { id: 'cycle', name: 'Döngü süresi', def: 'Belirlenen başlangıçtan bitişe kadar.', from: 'start', to: 'finish', value: `${LAST}: ${c8.cycle_time} tur (başlangıç koşulu), sınırla ${l8.cycle_time}`, src: 'Kanban Guide' },
    { id: 'lead', name: 'Teslim süresi', def: 'İstekten bitişe kadar: işi isteyen kişinin saati.', from: 'request', to: 'finish', value: `${LAST}: ${c8.lead_time} tur; sınır olsa da olmasa da`, src: 'this lecture' },
  ];
  const SRC_TR = { 'Kanban Guide': 'Kanban Kılavuzu' };   // display name of a measure's source; the src values stay the logic
  const measures = {
    kind: 'page', id: 'measures', role: 'page',
    heading: 'Tek bir panonun beş ölçüsü ve her birinin nerede başlayıp nerede durduğu',
    lead: `Her ölçünün iki uç noktası vardır; bunlar tek bir kartın zaman çizelgesinde gösteriliyor: başlangıç koşulunda ${LAST}; istenme 0, başlangıç ${c8.start}, bitiş ${c8.finish}.`,
    printRole: 'Ölçüler ve uç noktaları',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const W = 1500, H = 170;
      const X0 = 90, TW = 140;
      const x = (t) => X0 + t * TW;
      const svg = window.VC.svg(W, H, { label: `${LAST} kartının zaman çizelgesi: istendi, başladı, bitti`, uid: (u) => `measures-${u}` });
      for (let t = 0; t <= 9; t += 1) { svg.appendChild(s('line', { x1: x(t), x2: x(t), y1: 50, y2: 118, stroke: 'var(--line)', 'stroke-width': 1 })); svg.appendChild(text(x(t), 142, String(t), { 'text-anchor': 'middle', style: 'font-size:17px;fill:var(--text-soft)' })); }
      svg.appendChild(text(x(0) - 20, 142, 'tur', { 'text-anchor': 'end', style: 'font-size:16px;fill:var(--text-soft)' }));
      svg.appendChild(s('line', { x1: x(0), x2: x(c8.start), y1: 84, y2: 84, stroke: 'var(--text-soft)', 'stroke-width': 3.5, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' }));
      svg.appendChild(s('rect', { x: x(c8.start), y: 70, width: TW, height: 28, rx: 5, fill: 'var(--accent-fill)', stroke: 'var(--accent)', 'stroke-width': 2 }));
      svg.appendChild(s('rect', { x: x(c8.start + 1), y: 70, width: TW * c8.review_wait, height: 28, fill: 'url(#measures-hatch-warn)', stroke: 'var(--warn)', 'stroke-width': 1.5 }));
      svg.appendChild(s('rect', { x: x(c8.finish - 1), y: 70, width: TW, height: 28, rx: 5, fill: 'var(--ok-fill)', stroke: 'var(--ok)', 'stroke-width': 2 }));
      const mark = (t, label, color) => { svg.appendChild(s('line', { x1: x(t), x2: x(t), y1: 56, y2: 112, stroke: color, 'stroke-width': 4 })); svg.appendChild(text(x(t), 44, label, { 'text-anchor': 'middle', style: `font-size:17px;font-weight:700;fill:${color}` })); };
      mark(0, 'istendi', 'var(--text)'); mark(c8.start, 'başladı', 'var(--accent-strong)'); mark(c8.finish, 'bitti', 'var(--ok)');
      const span = s('g', { class: 'rv' });
      const spanRect = s('rect', { y: 60, height: 48, rx: 10, ry: 10, fill: 'var(--warn-fill)', stroke: 'var(--warn)', 'stroke-width': 3 });
      const nowLine = s('line', { y1: 50, y2: 118, stroke: 'var(--warn)', 'stroke-width': 3, 'stroke-dasharray': '6 5' });
      const nowText = text(0, 44, '', { 'text-anchor': 'middle', style: 'font-size:16px;font-weight:700;fill:var(--warn)' });
      span.append(spanRect, nowLine, nowText);
      svg.appendChild(span);
      svg.style.width = `${W}px`; svg.style.height = `${H}px`;
      const tl = api.cue(el('div', { class: 'card', style: 'padding:6px 12px;width:1540px' }, svg), 'timeline');
      const btns = MEASURES.map((m, i) => {
        const valueEl = el('span', { class: 'mv', style: 'font-size:16px;line-height:1.28;color:var(--warn);font-weight:600' }, m.value);
        const b = api.cue(el('button', { type: 'button', class: 'w4-measure', 'aria-pressed': 'false' }, [
          el('span', { style: 'font-size:21px;font-weight:700' }, m.name), el('span', { style: 'font-size:17px;line-height:1.3' }, m.def), valueEl,
          el('span', { class: 'muted', style: 'font-size:14px' }, m.src === 'this lecture' ? 'bu dersin paydaş saati' : `bir akış ölçüsü, ${SRC_TR[m.src]} (S05)`),
        ]), `measure-${m.id}`);
        b.addEventListener('click', () => { body.setAttribute('data-state', String(i + 1)); apply(); });
        return b;
      });
      const grid = el('div', { style: 'display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;width:1540px;align-items:stretch' }, btns);   // left of the presenter corner (x < 1664)
      const note = el('p', { class: 'muted', style: 'font-size:17px;line-height:1.3;max-width:1540px' }, `Bir zaman ölçüsü ancak iki uç noktası belirtildiğinde ve dışarıda bıraktığı bekleme adlandırıldığında anlamlıdır. Turlar öğretim birimidir.`);
      body.append(tl, el('div', { style: 'height:14px' }), grid, el('div', { style: 'height:12px' }), note);
      const apply = () => {
        const st = Number(body.getAttribute('data-state'));
        btns.forEach((b, i) => b.setAttribute('aria-pressed', st === i + 1 ? 'true' : 'false'));
        const m = MEASURES[st - 1];
        showIf(span, !!m);
        if (!m) return;
        const at = (k) => (k === 'request' ? 0 : k === 'start' ? c8.start : k === 'finish' ? c8.finish : T_AGE);
        const a = at(m.from), bb = at(m.to);
        if (m.id === 'throughput') { spanRect.setAttribute('x', x(c8.finish) - 18); spanRect.setAttribute('width', 36); }
        else { spanRect.setAttribute('x', x(a) - 6); spanRect.setAttribute('width', x(bb) - x(a) + 12); }
        const showNow = m.id === 'age';
        nowLine.style.display = showNow ? '' : 'none'; nowText.style.display = showNow ? '' : 'none';
        nowLine.setAttribute('x1', x(T_AGE)); nowLine.setAttribute('x2', x(T_AGE)); nowText.setAttribute('x', x(T_AGE)); nowText.textContent = `şimdi: ${T_AGE}. turun sonu`;
      };
      body.reset = () => { body.setAttribute('data-state', '0'); apply(); };
      apply();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.appendChild(el('p', {}, `${LAST}, Hazır sütununda ${c8.ready_wait} tur, incelemeyi ${c8.review_wait} tur bekledi.`));
      body.appendChild(el('table', { class: 'data-table data-table--compact', style: 'font-size:13px' }, [
        el('thead', {}, el('tr', {}, ['Ölçü', 'Uç noktaları', 'Bu panoda', 'Kaynak'].map((t) => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, MEASURES.map((m) => el('tr', {}, [el('td', {}, m.name), el('td', {}, m.def), el('td', {}, m.value), el('td', {}, m.src === 'this lecture' ? 'bu dersin paydaş saati' : `${SRC_TR[m.src]} (S05)`)]))),
      ]));
      body.appendChild(el('p', { style: 'margin-top:8px' }, `Bir zaman ölçüsü ancak iki uç noktası belirtildiğinde ve dışarıda bıraktığı bekleme adlandırıldığında anlamlıdır. ${trx(WT.boundary_source)}. Turlar öğretim birimidir.`));
    },
  };

  // =====================================================================
  // PAGE · principles and checks
  // =====================================================================
  const CHECKS = [   // plan Section 8, questions 1 to 5, and the answered transfer question (fixtures transfer_checks.w04)
    { q: 'İnceleme turda bir öğe işliyor. Geliştirmeyi iki katına çıkarmak tamamlanmayı da mutlaka iki katına çıkarır mı?', a: 'Hayır. Belirtilen modelde sınırlayan aşama inceleme olmaya devam eder.' },
    { q: 'Yineleme ile artım arasındaki fark nedir?', a: 'Yineleme, anlayışı ya da bir çözümü yeniden ele alır veya iyileştirir; artım ise kullanılabilir bir yetenek ekler.' },
    { q: 'Riskli bir varsayım neden kolay ve görünür bir özellikten önce ilgiyi hak edebilir?', a: 'Onu çözmek, sonraki işin yanlış bir öncüle dayanmasını önleyebilir.' },
    { q: 'Bir süreç iyileştirmesi iddiasına ne eşlik etmelidir?', a: 'Bir başlangıç ölçümü, açıkça belirtilmiş bir değişiklik, ilgili bir sonuç ölçüsü ve kaliteye ya da diğer yan etkilere dikkat.' },
    { q: 'En küçük geliştirme tahmini neden yine de daha pahalı seçim olabilir?', a: 'Bekleme, entegrasyon, süren destek, çıkış maliyeti ve geri plana itilen değerli iş, değişikliğin ömrü boyunca yapılan karşılaştırmayı değiştirebilir.' },
    { q: trx(TRANSFER.question), a: trx(TRANSFER.answer) },
  ];
  const SCENES = [feedbackBatches, methodsNotRituals, queueAndBottleneck, wipAndTime, estimatesWithAssumptions, riskAndLearning, definitionOfDone, retrospectiveAsTest];
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
      const qa = el('ol', { class: 'qa-list', style: 'margin-top:6px;grid-template-columns:1fr 1fr 1fr;max-width:1600px' }, CHECKS.map((c, i) => {   // the six checks stay left of the presenter corner (x < 1664)
        const ans = el('p', { class: 'qa-a', id: `qa-a-${i + 1}`, hidden: '', style: 'font-size:16px;line-height:1.28' }, c.a);
        const btn = api.cue(el('button', { type: 'button', class: 'qa-q', 'aria-expanded': 'false', 'aria-controls': `qa-a-${i + 1}`, style: 'font-size:18px' }, [el('span', {}, `${i + 1}. ${c.q}`), el('span', { class: 'tw', 'aria-hidden': 'true' }, '+')]), `question-${i + 1}`);
        btn.addEventListener('click', () => { const isOpen = btn.getAttribute('aria-expanded') === 'true'; btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true'); if (isOpen) ans.setAttribute('hidden', ''); else ans.removeAttribute('hidden'); });
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
      body.appendChild(el('ol', { class: 'print-qa' }, CHECKS.map((c, i) => el('li', {}, [el('span', { class: 'q' }, `${i + 1}. ${c.q}`), el('span', { class: 'a' }, c.a)]))));
    },
  };

  // =====================================================================
  // PAGE · handoff, terminology and sources
  // =====================================================================
  // the English names of the flow measures, which tools show untranslated, appear once in parentheses (as Week 3 did with "Koşul (guard)")
  const TERMS = [
    ['Toplu teslim', 'Tek seferde birlikte teslim edilen iş; geri bildirim, teslimin tamamını bekler.'],
    ['Artım', 'Kullanılabilir bir yetenek ekleyen iş parçası.'],
    ['Yineleme', 'Anlayışı ya da bir çözümü yeniden ele alan veya iyileştiren bir geçiş.'],
    ['Geri bildirim döngüsü', 'Hizmet ettiği kişilerin, bir karar hâlâ değişebilirken gözden geçirdiği kullanılabilir bir şey.'],
    ['Darboğaz', 'Sistemin bütün olarak ne kadar iş bitirdiğini sınırlayan aşama; onu rahatlatınca sınır başka bir aşamaya kayabilir.'],
    ['Devam eden iş (WIP)', 'Başlamış ama bitmemiş öğeler.'],
    ['Devam eden iş sınırı', 'Devam eden öğelere konan açık bir sınır: talebi değil, işin başlatılmasını denetler.'],
    ['İş çıkış hızı (throughput)', 'Birim zamanda biten öğeler.'],
    ['İş öğesi yaşı (work item age)', 'Bitmemiş bir öğe için başlangıcından bu yana geçen süre.'],
    ['Döngü süresi (cycle time)', 'Belirlenen başlangıçtan bitişe kadar geçen süre.'],
    ['Teslim süresi (lead time)', 'İstekten bitişe kadar geçen süre: işi isteyen kişinin saati.'],
    ['Tahmin', 'Koşullu bir ifade: dayanağı, varsayımları ve güncellenme koşuluyla birlikte bir aralık.'],
    ['Gecikme maliyeti', 'Bir adım beklerken kaybedilen değer.'],
    ['Geri alınabilirlik', 'Bir kararı sonradan değiştirmenin ne kadar maliyetli olduğu.'],
    ['Fırsat maliyeti', 'Seçilen bir adımın geri plana ittiği işin değeri.'],
    ['Tamamlanma politikası', 'Bir ekibin “bitti” demek için neyin gerektiği konusunda riskle orantılı olarak anlaştığı şey; Scrum’da Bitti Tanımı (Definition of Done).'],
    ['Suçlamasız değerlendirme', 'Sorunların dürüstçe bildirilebilmesi için bir kişiyi değil, sistemi tartışmak.'],
  ];
  const SOURCES = [
    ['S01', 'IEEE Computer Society, Guide to the Software Engineering Body of Knowledge (SWEBOK V4.0a)', 'https://www.computer.org/education/bodies-of-knowledge/software-engineering'],
    ['S02', 'ACM / IEEE-CS / AAAI, Computer Science Curricula 2023, final report', 'https://csed.acm.org/final-report/'],
    ['S03', 'Manifesto for Agile Software Development, principles', 'https://agilemanifesto.org/principles.html'],
    ['S04', 'Ken Schwaber and Jeff Sutherland, The Scrum Guide (November 2020)', 'https://scrumguides.org/scrum-guide.html'],
    ['S05', 'The Kanban Guide (May 2025 edition)', 'https://kanbanguides.org/the-kanban-guide/2025.5/'],
  ];
  const IN_PRACTICE = 'Panolar ve kuyruklar Jira, GitHub Projects, Linear ya da Trello gibi araçlarda tutulur; bu araçların raporları, bu dersin elle kurduğu devam eden iş, döngü süresi ve iş çıkış hızı ölçülerinin aynısını grafiğe döker.';
  const PRACTICE_YEAR = (String(F.metadata && F.metadata.date).match(/\b(\d{4})\b/) || [])[1];
  if (!PRACTICE_YEAR) throw new Error('fixtures metadata.date carries no year for the dated In practice examples');
  const IN_PRACTICE_TITLE = `Uygulamada · ${PRACTICE_YEAR} yılından örnekler`;
  const HANDOFF_QUESTION = 'Bir gereksinim değiştiğinde hangi parçalar değişmek zorunda kalmalı?';
  const CARRIED = [
    'Önceliklendirilmiş bir değişiklik: bir rezervasyon politikasını, yaygın düzenlemelere yol açmadan değiştirmek.',
    'Pano ve ölçüleri: işin nerede beklediği ve işi isteyen kişi için hangi saatin işlediği.',
    `Açık kararlar: kimlik arayüzü (${lowerTr(trx(IDENT))}) ve hâlâ açık bir ihtiyaç olan oda kapanışları (14. hafta).`,
  ];
  const sources = {
    kind: 'page', id: 'sources', role: 'page',
    heading: 'Neler ileriye taşınıyor ve daha fazlası nerede okunur',
    lead: 'Gelecek hafta, kodun tasarımının tek bir değişikliğin maliyetini ve ne kadar güvenli olduğunu nasıl belirlediğini soruyor.',
    printRole: 'Devir, terimler, kaynaklar',
    build(body, api) {
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-height:0' }, [
        api.cue(el('div', { class: 'handoff', style: 'font-size:27px;padding:18px 24px' }, [el('span', { class: 'muted', style: 'font-size:19px;display:block;margin-bottom:8px;font-family:var(--font-text);font-weight:500' }, '5. hafta bu soruyla başlıyor:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]), 'handoff'),
        api.cue(el('div', { class: 'card', style: 'padding:14px 18px' }, [cardTitle('5. haftaya taşınanlar'), el('ul', { style: 'font-size:18px;line-height:1.38;display:flex;flex-direction:column;gap:6px' }, CARRIED.map((t) => el('li', {}, t)))]), 'carried'),
        api.cue(el('div', { class: 'card', style: 'padding:14px 18px' }, [cardTitle(IN_PRACTICE_TITLE), el('p', { style: 'font-size:18px;line-height:1.38' }, IN_PRACTICE)]), 'in-practice'),
      ]);
      const middle = api.cue(el('div', { class: 'card', style: 'min-height:0;padding:14px 18px;align-self:start' }, [cardTitle('Bu hafta kullanılan terimler'), el('dl', { class: 'term-list', style: 'display:block;column-count:2;column-gap:22px;font-size:15px;line-height:1.24' }, TERMS.map(([t, d]) => el('div', { style: 'break-inside:avoid;margin-bottom:5px' }, [el('dt', {}, t), el('dd', {}, d)])))]), 'terms');
      const right = api.cue(el('div', { class: 'card', style: 'min-height:0;padding:14px 18px;align-self:start' }, [cardTitle('Bu dersin kaynakları'), el('ul', { class: 'source-list', style: 'font-size:17px;gap:8px' }, SOURCES.map(([k, t, u]) => el('li', {}, [el('span', { class: 'key' }, k), el('span', {}, [t, ' ', el(api.record ? 'span' : 'a', api.record ? { class: 'url', style: 'font-size:15px' } : { class: 'url', href: u, style: 'font-size:15px' }, u)])])))]), 'sources');   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:580px minmax(0,1fr) 450px;gap:24px;height:100%;min-height:0' }, [left, middle, right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('div', { class: 'handoff' }, [el('span', { class: 'muted', style: 'display:block;font-size:14px' }, '5. hafta bu soruyla başlıyor:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]),
          el('h3', {}, '5. haftaya taşınanlar'), el('ul', {}, CARRIED.map((t) => el('li', {}, t))),
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
    week: 4, file: FILE,
    shortTitle: 'Hafta 04',
    wordmark: 'Campus Rooms · Yazılım Mühendisliği',
    title: 'Geliştirme akışı, belirsizlik ve mühendislik kararları',
    question: 'İş nerede bekliyor ve akışı gerçekten ne iyileştirir?',
    coverLead: '4. ders için öğrenci notları. Küçük bir ekip, tek bir panodaki sekiz iş kartıyla Campus Rooms hizmetini geliştiriyor. Her sahne bir senaryo gösterir, tahmin etmenizi ister, mekanizmayı ortaya koyar, bir koşulu değiştirir, sonuçları karşılaştırır ve ilkeyi adlandırır: toplu teslim ve geri bildirim, koordinasyon yaklaşımları, bir darboğaz, teslim ve döngü süresi, tahminler, riske dayalı kararlar, bir tamamlanma politikası ve bir hipotez gibi sınanan bir süreç değişikliği.',
    coverNote: 'Campus Rooms kurgusal bir oda rezervasyon hizmetidir; bir kaynak belirtilmedikçe her kart, tur, sayı ve örnek değer bir öğretim örneğidir. Pano, eşit büyüklükte kartlarla bilerek basitleştirilmiş bir kuyruk modelidir: turları öğretim birimidir, kimsenin verimliliğine dair bir öngörü değildir. Yöntem karşılaştırması basitleştirilmiştir; Scrum\'ı Scrum Kılavuzu (S04), Kanban\'ı ise Kanban Kılavuzu (S05) tanımlar.',
    pages: [
      opening,
      outcomes,
      { kind: 'scene', scene: feedbackBatches },
      { kind: 'scene', scene: methodsNotRituals },
      { kind: 'scene', scene: queueAndBottleneck },
      { kind: 'scene', scene: wipAndTime },
      { kind: 'scene', scene: estimatesWithAssumptions },
      { kind: 'scene', scene: riskAndLearning },
      { kind: 'scene', scene: definitionOfDone },
      { kind: 'scene', scene: retrospectiveAsTest },
      measures,
      principles,
      sources,
    ],
  });
})();
