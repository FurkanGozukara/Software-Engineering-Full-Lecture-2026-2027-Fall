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
   ===================================================================== */
(function () {
  'use strict';
  const F = window.CAMPUS_ROOMS_FIXTURES;
  const A = F.anchors;
  const { el, s, text, arrow, markX, chip } = window.VC;
  const CASE = F.case;
  const ARI = CASE.users[0];   // U-01 Ari
  const BO = CASE.users[1];    // U-02 Bo
  const BK = CASE.booking;     // B-001, owned by U-01, C101 10:00-11:00, Confirmed
  const FILE = 'week-04.html';
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
  const upper1 = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  const listAnd = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
  const cardTitle = (str, extra) => el('div', { class: 'card-title', style: `margin-bottom:6px;${extra || ''}` }, str);
  const small = (str, extra) => el('p', { class: 'muted', style: `font-size:17px;line-height:1.3;${extra || ''}` }, str);
  const showIf = (n, on) => { if (n) n.classList.toggle('is-shown', !!on); };
  const focusIf = (n, on) => { if (n) n.classList.toggle('is-focus', !!on); };
  const one = (x) => (Math.round(x * 10) / 10).toFixed(1);
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
      const root = el('div', { class: 'w4-station' }, [el('div', { class: 'w4-head' }, [el('span', {}, label)]), cap, el('span', { class: 'muted', style: 'font-size:14px;line-height:1' }, 'this round'), slots]);
      api.cue(root, `${prefix}${key}`);
      return { root, cap, slots };
    };
    const cols = { ready: queue('ready', 'Ready'), impl: station('implementation', 'Implementing'), queue: queue('review-queue', 'Waiting for review'), review: station('review', 'Review'), done: queue('done', 'Done') };
    const root = el('div', { class: `w4-board${opts.compact ? ' w4-compact' : ''}`, style: `grid-template-columns:${opts.columns || '300px 150px 300px 150px 300px'}` }, [cols.ready.root, cols.impl.root, cols.queue.root, cols.review.root, cols.done.root]);
    let last = null;
    const slotRow = (stn, cap, ids, r) => {
      stn.cap.textContent = `${cap} per round`;
      stn.slots.replaceChildren(...Array.from({ length: cap }, (_, i) => el('span', { class: `w4-slot${ids[i] ? ' is-used' : ''}` }, ids[i] || (r === 0 ? '·' : 'idle'))));
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
    { q: 'When does the team learn it built the wrong thing?', scenes: '1–2', topic: 'feedback' },
    { q: 'Where is the work waiting, and for how long?', scenes: '3–4', topic: 'flow' },
    { q: 'What does “three days” promise, and what should come first?', scenes: '5–6', topic: 'uncertainty' },
    { q: 'When is a change done, and did a process change help?', scenes: '7–8', topic: 'evidence' },
  ];
  const BUILDS = 'one board of eight cards, run round by round, and the decisions made around it.';
  const opening = {
    kind: 'page', id: 'opening', role: 'page',
    heading: 'Everyone is busy. Why are only three cards done?',
    lead: 'A small team is improving Campus Rooms. Eight work cards, one board, four rounds of work so far. Before changing anything, look at where the work is.',
    printRole: 'Opening situation',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const b = boardAt(B, B4);
      const board = boardView(api, 'board-', { key: KEY });
      board.update(B, b, null);
      const situation = api.cue(el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:10px;padding:12px 14px' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:baseline;gap:16px' }, [cardTitle(`The board after round ${B4}`, 'margin-bottom:0'),
          el('p', { style: 'font-size:19px;line-height:1.3' }, [el('b', {}, 'Room staff ask: '), `when will ${KEY}, ${TITLE[KEY]}, be ready?`])]),
        board.root,
      ]), 'situation');
      const busyBtn = api.cue(el('button', { type: 'button', class: 'ctl-btn ctl-btn--step', style: 'align-self:flex-start;height:56px;font-size:22px;padding:0 20px' }, 'Is everyone busy?'), 'busy');
      const busy = el('div', reveal({ class: 'card rv rv--rise', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:6px' }), [
        cardTitle('Is everyone busy?', 'margin-bottom:2px'),
        el('p', { style: 'font-size:19px;line-height:1.3' }, [`Implementation took ${B.implementation_capacity} cards in every round; review took ${B.review_capacity} in every round it could. `, el('b', {}, `Started: ${started(b.row)} of ${N}. Done: ${b.row.done}.`)]),
      ]);
      api.cue(busy, 'busy-answer');
      const question = el('div', reveal({ class: 'rail-card rail-prompt rv rv--rise', style: 'align-self:start' }), [
        el('div', { class: 'rail-eyebrow' }, 'The question of this week'),
        el('p', { class: 'prompt-q' }, 'Where is work waiting, and what would actually improve the flow?'),
        el('ul', { class: 'prompt-options' }, ['Make implementation faster: it looks busiest', 'Find where the cards wait, and improve that step', 'Start more cards, so nobody is idle'].map((o, i) => el('li', {}, [el('span', { class: 'opt-key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)), el('span', {}, o)]))),
        el('p', { class: 'rail-note', style: 'margin-top:12px' }, 'Keep your answer. Scene 3 tests it on this board.'),
      ]);
      api.cue(question, 'question');
      const waitBtn = api.cue(el('button', reveal({ type: 'button', class: 'ctl-btn ctl-btn--step rv rv--rise', style: 'align-self:flex-start;height:56px;font-size:22px;padding:0 20px' }), 'Where is the work waiting?'), 'waiting');
      const rows = QUESTIONS.map((row, i) => api.cue(el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:8px 0;border-top:1px solid var(--line)' }, [
        el('b', { style: 'font-size:19px;line-height:1.28' }, row.q),
        chip(`scenes ${row.scenes}`, 'accent', { style: 'font-size:16px' }),
      ]), `question-${i + 1}`));
      const four = el('div', reveal({ class: 'card rv rv--rise', style: 'padding:12px 18px;display:flex;flex-direction:column' }), [
        el('div', { class: 'callout', style: 'font-size:19px;line-height:1.3;margin-bottom:10px' }, [el('b', {}, `${b.row.review_waiting} cards wait for review, `), `${KEY} among them.`]),
        cardTitle('Four questions this lecture answers', 'margin-bottom:4px'), ...rows,
        el('p', { style: 'font-size:17px;line-height:1.32;color:var(--text-muted);padding-top:8px;border-top:1px solid var(--line)' }, [el('b', { style: 'color:var(--text)' }, 'This lecture builds '), BUILDS]),
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
          el('h3', {}, `The situation: the board after round ${B4}`),
          el('p', {}, `Ready: ${b.ready.length ? b.ready.join(', ') : 'none'}. Waiting for review: ${b.queue.join(', ')}. Done: ${b.done.join(', ')}. Implementation takes ${B.implementation_capacity} cards per round, review ${B.review_capacity}.`),
          el('p', {}, `Room staff ask when ${KEY}, ${TITLE[KEY]}, will be ready. Started: ${started(b.row)} of ${N}; done: ${b.row.done}. ${b.row.review_waiting} cards wait for review, ${KEY} among them.`),
          el('h3', {}, 'The question of this week'),
          el('p', {}, 'Where is work waiting, and what would actually improve the flow? (A) Make implementation faster: it looks busiest. (B) Find where the cards wait, and improve that step. (C) Start more cards, so nobody is idle.'),
        ]),
        el('div', {}, [
          el('h3', {}, 'Four questions this lecture answers'),
          el('ul', {}, QUESTIONS.map((row) => el('li', {}, `${row.q} (scenes ${row.scenes})`))),
          el('h3', {}, 'What this lecture builds'), el('p', {}, upper1(BUILDS)),
        ]),
      ]));
    },
  };

  // =====================================================================
  // PAGE · recall and outcomes
  // =====================================================================
  const OUTCOMES = [
    'Distinguish iteration, increments, and a single large batch of delivery.',
    'Locate a bottleneck using queues and completion evidence.',
    'Distinguish work-in-progress, throughput, cycle time, and lead time.',
    'Explain an estimate as conditional information rather than a guarantee.',
    'Choose a next action using risk, dependency, feedback value, and capacity.',
  ];
  const W3_HANDOFF = 'Who turns these models into working behavior, in what order, and where does that work wait?';
  const outcomes = {
    kind: 'page', id: 'outcomes', role: 'page',
    heading: 'What you already know, and where this lecture goes',
    lead: 'Where is work waiting, and what would actually improve the flow?',
    printRole: 'Recall and outcomes',
    build(body, api) {
      const recall = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:8px;padding:14px 20px' }, [
        cardTitle('From Week 3: five models of one booking', 'margin-bottom:2px'),
        el('p', { style: 'font-size:19px;line-height:1.35' }, `A journey, two state models, a data model, a decision table and sequence diagrams, all of ${BK.id}. Week 3 ended on a question:`),
        el('p', { style: 'font-size:20px;line-height:1.35' }, el('i', {}, W3_HANDOFF)),
      ]);
      api.cue(recall, 'recall');
      const cards = el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:4px 18px' }, CARDS.map((c) => api.cue(el('div', { style: 'display:flex;gap:10px;align-items:center;font-size:19px' }, [el('span', { class: 'w4-chip', style: 'width:56px;height:32px;font-size:16px;flex:0 0 auto' }, c.id), el('span', {}, c.title)]), `card-${c.id.toLowerCase()}`)));
      const example = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:8px;padding:14px 20px' }, [
        cardTitle('The example this week: eight work cards', 'margin-bottom:2px'), cards,
      ]);
      api.cue(example, 'example');
      const rules = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:6px;padding:14px 20px' }, [
        cardTitle('How the board works', 'margin-bottom:2px'),
        el('p', { style: 'font-size:19px;line-height:1.35' }, `Time moves in rounds. Implementation takes ${B.implementation_capacity} cards per round, review ${B.review_capacity}; ${QB.transfer_rule}. Every card is the same size and all eight are requested at round 0.`),
        el('p', { class: 'muted', style: 'font-size:17px;line-height:1.3' }, `Rounds are teaching units, not measured developer performance.`),
      ]);
      api.cue(rules, 'rules');
      const list = el('ol', { class: 'outcome-list', 'aria-label': 'By the end of this lecture you can', style: 'gap:10px' }, OUTCOMES.map((o, i) => el('li', { style: 'font-size:22px;padding:10px 14px' }, [el('span', { class: 'n', 'aria-hidden': 'true' }, String(i + 1)), el('span', {}, o)])));
      api.cue(list, 'outcomes');
      const right = el('div', {}, [cardTitle('By the end of this lecture you can'), list]);   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { class: 'page-columns' }, [el('div', { style: 'display:flex;flex-direction:column;gap:14px' }, [recall, example, rules]), right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('h3', {}, 'From Week 3'),
          el('p', {}, `Five models of ${BK.id}: a journey, two state models, a data model, a decision table and sequence diagrams. Week 3 ended on the question: ${W3_HANDOFF}`),
          el('h3', {}, 'The example this week: eight work cards'),
          el('ul', {}, CARDS.map((c) => el('li', {}, `${c.id} ${c.title}`))),
          el('h3', {}, 'How the board works'),
          el('p', {}, `Time moves in rounds. Implementation takes ${B.implementation_capacity} cards per round, review ${B.review_capacity}; ${QB.transfer_rule}. Every card is the same size and all eight are requested at round 0. ${F.flow.assumptions} Rounds are teaching units, not measured developer performance.`),
        ]),
        el('div', {}, [el('h3', {}, 'By the end of this lecture you can'), el('ol', { class: 'outcome-list' }, OUTCOMES.map((o, i) => el('li', {}, [el('span', { class: 'n' }, String(i + 1)), el('span', {}, o)])))]),
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
    heading: 'When would the team learn it built the wrong thing?',
    lead: 'Two plans deliver the same eight work cards. One integrates everything at the end; the other puts a small usable slice in front of people first. The same need is misunderstood in both.',
    principle: 'Shorter feedback loops can expose wrong assumptions earlier; useful increments must still make sense as a system.',
    principleShort: 'Show slices early; make them fit.',
    conditions: [
      { id: 'batch-or-slices', baseline: true, label: 'Baseline: one batch, or small slices', short: 'Two plans',
        states: [
          { prompt: { question: 'When would the team learn that its cancellation messages miss what people need?', options: ['When the last card is finished', 'When people use a small working part', 'Only after the release'] }, caption: 'Same eight cards, same team, two plans. Step to follow each plan.' },
          { caption: `Plan 1 builds one card per round and integrates everything in **round ${BATCH.integration_round}**. Until then, nothing can be used.` },
          { caption: `People first use the result in **round ${BATCH.discovery_round}**, and the misunderstanding shows. The rework: ${BATCH.rework}.` },
          { caption: `Plan 2 builds a small usable slice first: ${SLICES[0].usable}.` },
          { caption: `People try that slice in **round ${FIRST.inspected_round}**, and the unclear message shows at once. Only **${FIRST.feedback_card}** changes.` },
          { caption: 'Each slice adds usable capability: an **increment**. Changing the message after feedback revises understanding: an **iteration**.' },
          { caption: `Learned in round ${FIRST.inspected_round} instead of round ${BATCH.discovery_round}.`, principle: true },
        ] },
      { id: 'later-feedback', label: 'Changed: the feedback point moves later', short: 'Later feedback',
        states: [
          { prompt: { question: 'Keep the misunderstanding, but let people see the work later. What changes?', options: ['Nothing: the fix is the same', 'More finished work must be reconsidered', 'The misunderstanding goes away'] }, caption: 'Same slices, same misunderstanding. Only the moment people first use the work moves. Step to move it.' },
          { caption: `Feedback in **round ${FP[0].round}**: ${FP[0].note}. **1 card** to reconsider.` },
          { caption: `Feedback in **round ${FP[1].round}**: ${FP[1].note}. **${FP[1].reconsider.length} cards** to reconsider.` },
          { caption: `Feedback only in **round ${FP[2].round}**, as in the batch: ${FP[2].note}. All **${FP[2].reconsider.length}**.` },
          { caption: `${FP.map((p) => p.reconsider.length).join(', then ')} cards to redo.`, principle: true },
        ] },
      { id: 'shared-interface', label: 'Changed: slices share one identity interface', short: 'Interface',
        states: [
          { prompt: { question: 'Slices 2 and 3 both need to know who a member is. Can each slice decide that alone?', options: ['Yes: slices are independent', 'Agree the interface first', 'Decide it at the end'] }, caption: `The constraint: ${FB.coordination_constraint.replace('slices two and three', 'slices 2 and 3')}.` },
          { caption: `Slices 2 and 3 depend on one decision: **${COORD.task}**, before either is built.` },
          { caption: `Without that agreement, ${COORD.without_it}.` },
          { caption: `Agree it by round ${COORD.agreed_by_round}, then build on it.`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const W = 1264, H = 604;
      const wrapEl = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-rows:60px minmax(0,1fr);gap:16px' });
      h.banner = api.cue(el('div', { class: 'callout callout--bad', style: 'font-size:21px;line-height:1.3;display:flex;align-items:center;gap:12px;padding:10px 18px' }, [
        el('b', {}, 'Misunderstood in both plans:'), el('span', {}, FB.misunderstanding),
        el('span', { class: 'example-tag', style: 'margin-left:auto' }, 'rounds are teaching units'),
      ]), 'misunderstanding');
      const svg = window.VC.svg(W, H, { label: 'Two timelines of the same eight cards: one batch integrated at the end, and three small usable slices', uid: (x) => api.uid(x) });
      for (let r = 1; r <= 9; r += 1) svg.appendChild(text(rx(r) + TL.rw / 2, 18, `round ${r}`, { 'text-anchor': 'middle', style: 'font-size:16px;fill:var(--text-soft)' }));
      const lane = (y, hgt, title, sub) => {
        const g = s('g', { class: 'dm' });
        g.appendChild(s('rect', { x: 1, y, width: W - 2, height: hgt, rx: 16, ry: 16, fill: 'rgba(124,196,255,0.035)', stroke: 'var(--line)', 'stroke-width': 1.5 }));
        g.appendChild(text(18, y + 34, title, { lineHeight: 24, style: 'font-size:17px;font-weight:700;letter-spacing:0.08em;fill:var(--accent-strong)' }));
        g.appendChild(text(18, y + 88, sub, { lineHeight: 20, style: 'font-size:16px;fill:var(--text-muted)' }));
        svg.appendChild(g);
        return g;
      };
      h.laneBatch = lane(30, 222, ['PLAN 1', 'ONE BATCH'], ['integrate', 'at the end']);
      h.laneSlices = lane(266, 336, ['PLAN 2', 'SLICES'], ['use each', 'slice early']);
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
        g.appendChild(text(x + w / 2, y + 54, wrap(TITLE[id], 13), { 'text-anchor': 'middle', lineHeight: 20, style: 'font-size:15px;fill:var(--text-muted)' }));
        h.batchGroup.appendChild(g); api.cue(g, `batch-${id.toLowerCase()}`);
        h.batchRects[id] = rect;
      });
      const ix = rx(BATCH.integration_round) + 5, iw = TL.rw - 10;
      h.integrate = s('g', {});
      h.integrate.appendChild(s('rect', { x: ix, y: 46, width: iw, height: 96, rx: 10, ry: 10, fill: 'var(--warn-fill)', stroke: 'var(--warn)', 'stroke-width': 2, 'stroke-dasharray': '7 5' }));
      h.integrate.appendChild(text(ix + iw / 2, 88, ['integrate', 'all eight'], { 'text-anchor': 'middle', lineHeight: 22, style: 'font-size:16px;font-weight:700;fill:var(--warn)' }));
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
        g.appendChild(text(x + 14, y + 26, `SLICE ${sl.slice}`, { style: 'font-size:15px;font-weight:700;letter-spacing:0.08em;fill:var(--text-soft)' }));
        g.appendChild(text(x + 14, y + 50, wrap(sl.usable, 40), { lineHeight: 20, style: 'font-size:16px;fill:var(--text-muted)' }));
        sl.cards.forEach((t, i) => {
          const id = idOf(t), ly = y + 88 + i * 28;
          const lg = s('g', {});
          const lr = s('rect', { x: x + 8, y: ly, width: w - 16, height: 26, rx: 6, ry: 6, fill: 'none', stroke: 'none', 'stroke-width': 2 });
          lg.appendChild(lr);
          lg.appendChild(text(x + 16, ly + 19, `${id}  ${t}`, { style: 'font-size:16px' }));
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
        g.appendChild(text(x - 18, 488, 'people use it', { 'text-anchor': 'end', style: 'font-size:15px;fill:var(--accent-strong)' }));
        h.sliceGroup.appendChild(g); api.cue(g, `use-${sl.slice}`);
        return g;
      });
      h.laneSlices.appendChild(h.sliceGroup);
      // increment and iteration
      h.terms = s('g', { class: 'rv' });
      h.terms.appendChild(text(18, 412, 'INCREMENT', { style: 'font-size:16px;font-weight:700;letter-spacing:0.06em;fill:var(--accent-strong)' }));
      h.terms.appendChild(text(18, 434, ['adds usable', 'capability'], { lineHeight: 20, style: 'font-size:16px;fill:var(--text-muted)' }));
      h.terms.appendChild(text(18, 500, 'ITERATION', { style: 'font-size:16px;font-weight:700;letter-spacing:0.06em;fill:var(--violet)' }));
      h.terms.appendChild(text(18, 522, ['revises', 'understanding'], { lineHeight: 20, style: 'font-size:16px;fill:var(--text-muted)' }));
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
      h.discBatch = discovery(rEnd(BATCH.discovery_round) - 6, 34, 248, `learned in round ${BATCH.discovery_round}`, BATCH.rework, 'end');
      h.disc3 = discovery(rEnd(FP[0].round) - 10, 272, 598, `learned in round ${FP[0].round}`, `reconsider 1 card: ${FP[0].reconsider[0]}`, 'start');
      h.disc6 = discovery(rEnd(FP[1].round) - 10, 272, 598, `learned in round ${FP[1].round}`, `reconsider ${FP[1].reconsider.length} cards`, 'start');
      api.cue(h.discBatch, 'learned-batch'); api.cue(h.disc3, 'learned-round-3'); api.cue(h.disc6, 'learned-round-6');
      // the coordination constraint
      h.coord = s('g', { class: 'rv' });
      const cx0 = rx(2) + 10, cw = 3 * TL.rw - 20, cy0 = 524;
      h.coord.appendChild(s('rect', { x: cx0, y: cy0, width: cw, height: 50, rx: 12, ry: 12, fill: 'var(--violet-fill)', stroke: 'var(--violet)', 'stroke-width': 2.5 }));
      h.coord.appendChild(text(cx0 + cw / 2, cy0 + 32, COORD.task, { 'text-anchor': 'middle', style: 'font-size:17px;font-weight:700;fill:var(--violet)' }));
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
      h.own = [tagOn(s2, 'its own member names', 'bad'), tagOn(s3, 'its own member names', 'bad')];
      h.agreed = [tagOn(s2, 'agreed interface', 'ok'), tagOn(s3, 'agreed interface', 'ok')];
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
      { title: 'One batch and three slices: when the misunderstanding shows, and what must change', condition: 'batch-or-slices', state: 6, principle: true, note: `Assumptions: eight equal-sized cards, one team, the same misunderstanding in both plans (${FB.misunderstanding}); rounds are teaching units. Plan 1 builds one card per round and integrates in round ${BATCH.integration_round}; the misunderstanding shows in round ${BATCH.discovery_round}, and the rework is ${BATCH.rework}. Plan 2 lets people use slice 1 (${listAnd(SLICES[0].cards)}) in round ${FIRST.inspected_round}; only ${FIRST.feedback_card} changes. An increment adds usable capability; an iteration revises understanding.` },
      { title: 'The feedback point moves later: what must be reconsidered', condition: 'later-feedback', state: 4, note: FP.map((p) => `Feedback in round ${p.round}: ${p.note}; reconsider ${p.reconsider.length === N ? `all ${N} cards` : listAnd(p.reconsider)}.`).join(' ') },
      { title: 'Small slices still need an agreed interface and an order', condition: 'shared-interface', state: 3, note: `${upper1(FB.coordination_constraint)}. Without that agreement, ${COORD.without_it}. With it agreed by round ${COORD.agreed_by_round}, slices 2 and 3 are built on one interface.` },
    ],
  };

  // =====================================================================
  // SCENE 2 · methods-not-rituals (Bridge)
  // =====================================================================
  const APP = MR.approaches;
  const ROWS2 = [['coordinates', 'Coordinates through'], ['visible', 'Makes visible'], ['feedback', 'Feedback arrives'], ['reversible', 'Stays open to change'], ['strongest', 'Strongest when']];
  const MCC = MR.changed_condition;
  const methodsNotRituals = {
    id: 'methods-not-rituals', role: 'bridge',
    heading: 'Does a meeting create a feedback loop by itself?',
    lead: 'Three ways to coordinate the same team. Compare what each one makes visible and when feedback arrives, rather than the names.',
    principle: 'Choose coordination practices for the uncertainty and constraints of the work, not for their labels.',
    principleShort: 'Pick practices for the work, not the name.',
    conditions: [
      { id: 'planned-capability', baseline: true, label: 'Baseline: a planned capability', short: 'Planned work',
        states: [
          { prompt: { question: 'Three teams build the same capability. Which one learns first that its plan is wrong?', options: ['The team with the most detailed plan', 'The team with the most meetings', 'The team that inspects something usable first'] }, caption: 'Three ways to coordinate one team. Step to compare them one row at a time.' },
          { caption: 'How each one coordinates: a plan agreed up front, a goal for each timebox, or explicit policies for a visible flow.' },
          { caption: `What each one makes visible. Scrum names three accountabilities: **${listAnd(MR.accountabilities.map((a) => a.name))}**.` },
          { caption: 'When feedback arrives: at planned milestones, at each Sprint Review, or continuously from the flow.' },
          { caption: 'Which decisions stay open to change while the team learns.' },
          { caption: `Each one has a strongest use. Another way to learn before committing: ${listAnd(MR.learn_before_commitment)}.` },
          { caption: 'A meeting without something usable is ritual.', principle: true },
        ] },
      { id: 'incidents', label: 'Changed: incidents arrive at unknown times', short: 'Incidents',
        states: [
          { prompt: { question: 'Now the work is support incidents that arrive at unknown times. Which approach wins?', options: ['Plan-driven: plan for them', 'Scrum: wait for the next Sprint', 'None by name: each needs a policy'] }, caption: `The work changes: **${MCC.incidents}**.` },
          { caption: `The work is now ${MCC.label}. What still helps in each approach?` },
          { caption: 'What each one must revise: a policy for urgent work.' },
          { caption: 'Every approach needed a new policy.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const grid = el('div', { style: 'display:grid;grid-template-columns:158px repeat(3,minmax(0,1fr));gap:8px 10px;align-items:stretch' });
      grid.appendChild(el('div'));
      APP.forEach((a) => grid.appendChild(api.cue(el('div', { class: 'card', style: 'padding:9px 14px;display:flex;flex-direction:column;gap:2px' }, [
        el('span', { style: 'font-size:21px;font-weight:700;line-height:1.2' }, a.name), el('span', { class: 'muted', style: 'font-size:16px' }, a.short),
      ]), `head-${a.id}`)));
      h.cells = {};
      ROWS2.forEach(([key, label], i) => {
        grid.appendChild(el('div', { class: 'w4-rowlabel rv', 'data-cond': 'planned-capability', 'data-show-from': String(i + 1) }, label));
        APP.forEach((a) => { h.cells[`${key}-${a.id}`] = api.cue(el('div', { class: 'w4-cell rv', 'data-cond': 'planned-capability', 'data-show-from': String(i + 1) }, upper1(a[key])), `${key}-${a.id}`); grid.appendChild(h.cells[`${key}-${a.id}`]); });
      });
      [['helps', 'Still helps'], ['revise', 'Needs a new policy']].forEach(([key, label], i) => {
        grid.appendChild(el('div', { class: 'w4-rowlabel rv', 'data-cond': 'incidents', 'data-show-from': String(i + 1) }, label));
        APP.forEach((a) => { h.cells[`${key}-${a.id}`] = api.cue(el('div', { class: 'w4-cell rv', 'data-cond': 'incidents', 'data-show-from': String(i + 1) }, upper1(MCC.per_approach[a.id][key])), `${key}-${a.id}`); grid.appendChild(h.cells[`${key}-${a.id}`]); });
      });
      h.accountable = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'planned-capability', 'data-show-from': '2', style: 'padding:9px 14px;display:flex;flex-direction:column;gap:6px;flex:1 1 0;min-width:0' }), [
        cardTitle('Scrum accountabilities', 'margin-bottom:0;font-size:16px'),
        el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' }, MR.accountabilities.map((a) => chip(`${a.name} · ${a.decisions.split(':')[0]}`, 'accent', { style: 'font-size:16px' }))),
        el('p', { class: 'muted', style: 'font-size:16px;line-height:1.28' }, `${upper1(MR.accountability_note)}: where decisions about value, process and the work become visible.`),
      ]), 'accountabilities');
      h.learn = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'planned-capability', 'data-show-from': '5', style: 'padding:9px 14px;display:flex;flex-direction:column;gap:6px;flex:0 0 330px' }), [
        cardTitle('Learn before committing', 'margin-bottom:0;font-size:16px'),
        el('p', { style: 'font-size:17px;line-height:1.3' }, `Try ${MR.learn_before_commitment.join(', or ')}: both work in any of the three.`),
      ]), 'learn-first');
      h.ritual = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'planned-capability', 'data-show-from': '6', style: 'padding:9px 14px;display:flex;flex-direction:column;gap:6px;flex:0 0 330px;border-color:var(--warn)' }), [
        cardTitle('A meeting alone is not feedback', 'margin-bottom:0;font-size:16px;color:var(--warn)'),
        el('p', { style: 'font-size:17px;line-height:1.3' }, `For example ${MR.ritual_without_feedback}.`),
      ]), 'ritual');
      h.noWinner = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'incidents', 'data-show-from': '3', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:4px;border-color:var(--warn)' }), [
        cardTitle('No universal winner', 'margin-bottom:0;font-size:16px;color:var(--warn)'),
        el('p', { style: 'font-size:18px;line-height:1.3' }, `${upper1(MCC.no_winner)}. The question is what the work needs: when feedback arrives, and which decisions can still change.`),
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
      { title: 'Three ways to coordinate one team, compared row by row', condition: 'planned-capability', state: 6, principle: true, note: `These are simplified lecture examples, not complete method definitions: the Scrum Guide (November 2020) and the Kanban Guide (May 2025) define each method. Scrum's three accountabilities, ${MR.accountabilities.map((a) => `${a.name} (${a.decisions})`).join(', ')}, are accountabilities, not job titles. Scrum rests on ${listAnd(MR.scrum_pillars)}; the Kanban Guide's practices are ${listAnd(MR.kanban_practices.map((p) => p.toLowerCase()))}. Another way to learn before committing: ${listAnd(MR.learn_before_commitment)}.` },
      { title: 'The work changes to incidents that arrive at unknown times', condition: 'incidents', state: 3, note: `${upper1(MCC.incidents)}. ${APP.map((a) => `${a.name}: still helps with ${MCC.per_approach[a.id].helps}; needs ${MCC.per_approach[a.id].revise}.`).join(' ')} ${upper1(MCC.no_winner)}.` },
    ],
  };

  // =====================================================================
  // SCENE 3 · queue-and-bottleneck (Anchor)
  // =====================================================================
  const SCEN = { baseline: B, 'implementation-4': FI, 'review-2': FR };
  const CAPTXT = (sc) => `Implementation ${sc.implementation_capacity} per round, Review ${sc.review_capacity} per round`;
  const CAPSHORT = (sc) => `implementation ${sc.implementation_capacity}, review ${sc.review_capacity} per round`;
  const queueCaptions = {
    baseline: B.rows.map((row, r) => {
      if (r === 0) return 'Round 0: eight cards requested, none started yet.';
      if (r === 1) return `Round 1: implementation takes **${row.implemented_ids.join(' and ')}**. Review is idle: it only takes cards that were waiting when the round began; these join its queue for the next round.`;
      if (r === 2) return `Round 2: review finishes **${row.completed_ids[0]}**, its one card; implementation adds ${row.implemented_ids.join(' and ')}. Two in, one out: **${row.review_waiting}** now wait.`;
      if (r === 3) return `Round 3: ${row.completed_ids[0]} is done and ${row.implemented_ids.join(' and ')} join the queue. Started **${started(row)}**, done **${row.done}**; **${row.review_waiting}** wait.`;
      if (r === 4) return `Round 4: all eight cards are started and only **${row.done}** are done. **${row.review_waiting}** cards wait for review, and both stations were busy.`;
      if (r === 5) return `Round 5: nothing is left to start. Review still finishes one card per round: **${row.review_waiting}** wait.`;
      if (r === B.rows.length - 1) return `Round ${r}: **${LAST}** is done. Implementation finished its part in round 4, the board in **round ${r}**: review set the pace.`;
      return `Round ${r}: review finishes ${row.completed_ids[0]}. **${row.review_waiting}** ${row.review_waiting === 1 ? 'card waits' : 'cards wait'}, ${row.done} done.`;
    }),
    'implementation-4': FI.rows.map((row, r) => {
      if (r === 0) return `Only implementation changes, to **${FI.implementation_capacity} per round**. Dotted lines: the baseline.`;
      if (r === 1) return `Round 1: implementation takes ${row.implemented_ids.length} cards at once, ${listAnd(row.implemented_ids)}. Review has nothing to take yet.`;
      if (r === 2) return `Round 2: every card is started. **${row.review_waiting}** wait for review; done: **${row.done}**.`;
      if (r === FI.rows.length - 1) return `Done in round ${r}, as before.`;
      return `Round ${r}: review finishes ${row.completed_ids[0]}. **${row.review_waiting}** wait, ${row.done} done.`;
    }),
    'review-2': FR.rows.map((row, r) => {
      if (r === 0) return `Implementation back to ${FR.implementation_capacity}; only review changes, to **${FR.review_capacity} per round**.`;
      if (r === 1) return `Round 1: ${row.implemented_ids.join(' and ')} implemented; review waits for its first cards.`;
      if (r === FR.rows.length - 1) return `Done in round ${r}; implementation limits.`;
      return `Round ${r}: review finishes ${row.completed_ids.join(' and ')}. The queue holds at **${row.review_waiting}**; ${row.done} done.`;
    }),
  };
  const queueAndBottleneck = {
    id: 'queue-and-bottleneck', role: 'anchor',
    heading: 'Make one stage faster: does the work finish sooner?',
    lead: 'The board and a chart of the same rounds. Each Step is one round: review takes the cards that were waiting when the round began, and implemented cards join its queue for the next round.',
    principle: 'Local activity is not the same as system throughput; improve the limiting flow, not merely the busiest-looking stage.',
    principleShort: 'Speed up the step that limits flow.',
    run: { intervalMs: 1500 },
    conditions: [
      { id: 'baseline', baseline: true, label: `Baseline: ${CAPSHORT(B)}`, short: `${B.implementation_capacity} and ${B.review_capacity}`,
        states: queueCaptions.baseline.map((caption, r) => (r === 0
          ? { prompt: { question: `Implementation finishes ${B.implementation_capacity} cards per round and review ${B.review_capacity}. Where will the next unfinished card wait?`, options: ['In Ready, before anyone starts it', 'In the review queue', 'Nowhere: both stations keep up'] }, caption }
          : { caption })) },
      { id: 'implementation-4', label: `Changed: ${CAPSHORT(FI)}`, short: `Implementation ${FI.implementation_capacity}`,
        states: queueCaptions['implementation-4'].map((caption, r) => (r === 0
          ? { prompt: { question: `Implementation doubles to ${FI.implementation_capacity} cards per round; review still finishes ${FI.review_capacity}. When is the last card done?`, options: ['Round 5: about twice as soon', `Round ${doneRound(B)}, as before`, 'Round 8: a little sooner'] }, caption }
          : { caption, principle: r === FI.rows.length - 1 })) },
      { id: 'review-2', label: `Changed: ${CAPSHORT(FR)}`, short: `Review ${FR.review_capacity}`,
        states: queueCaptions['review-2'].map((caption, r) => (r === 0
          ? { prompt: { question: `Implementation back to ${FR.implementation_capacity}; review now finishes ${FR.review_capacity} per round. When is everything done?`, options: [`Round ${doneRound(B)}`, `Round ${doneRound(FR)}`, 'Round 3'] }, caption }
          : { caption, principle: r === FR.rows.length - 1 })) },
    ],
    setup(stage, api) {
      const h = {};
      h.board = boardView(api, '', { key: null });
      const legend = el('p', { style: 'font-size:16px;line-height:1.35;color:var(--text-muted)' }, [el('b', { style: 'color:var(--text)' }, 'The cards: '), CARDS.map((c) => `${c.id} ${c.title}`).join(' · ')]);
      api.cue(legend, 'card-names');
      // chart
      const CW = 760, CH = 330;
      const svg = window.VC.svg(CW, CH, { label: 'Cards started, waiting for review and done at the end of each round', uid: (x) => api.uid(`chart-${x}`) });
      const X0 = 50, X1 = CW - 20, Y0 = 28, Y1 = CH - 50;
      const xr = (r) => X0 + ((X1 - X0) * r) / 9;
      const yc = (n) => Y1 - ((Y1 - Y0) * n) / N;
      for (let n = 0; n <= N; n += 2) {
        svg.appendChild(s('line', { x1: X0, x2: X1, y1: yc(n), y2: yc(n), stroke: 'var(--line)', 'stroke-width': 1 }));
        svg.appendChild(text(X0 - 12, yc(n) + 6, String(n), { 'text-anchor': 'end', style: 'font-size:16px;fill:var(--text-soft)' }));
      }
      for (let r = 0; r <= 9; r += 1) svg.appendChild(text(xr(r), Y1 + 24, String(r), { 'text-anchor': 'middle', style: 'font-size:16px;fill:var(--text-soft)' }));
      svg.appendChild(text((X0 + X1) / 2, CH - 4, 'round', { 'text-anchor': 'middle', style: 'font-size:15px;fill:var(--text-soft)' }));
      svg.appendChild(text(X0 - 12, 14, 'cards', { 'text-anchor': 'end', style: 'font-size:15px;fill:var(--text-soft)' }));
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
      h.baseKey = key('var(--text-soft)', 'dotted', 'baseline');
      const chartCard = api.cue(el('div', { class: 'card', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:6px;min-width:0' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:baseline' }, [cardTitle('Queue and completion by round', 'margin-bottom:0;font-size:16px'), h.counts = el('span', { style: 'font-size:18px;font-weight:700;font-variant-numeric:tabular-nums' })]),
        svg,
        el('div', { style: 'display:flex;gap:18px;flex-wrap:wrap;font-size:16px;color:var(--text-muted)' }, [key('var(--accent)', 'dashed', 'started'), key('var(--warn)', 'solid', 'waiting for review'), key('var(--ok)', 'solid', 'done'), h.baseKey]),
      ]), 'chart');
      svg.style.height = `${CH}px`;
      // table
      h.tRows = Array.from({ length: 10 }, (_, i) => api.cue(el('tr', { class: 'rv' }, [el('th', { scope: 'row', class: 'num' }, String(i)), el('td', { class: 'num' }), el('td', { class: 'num' }), el('td', { class: 'num' })]), `row-${i}`));
      const tbl = el('table', { class: 'data-table data-table--compact', style: 'font-size:18px' }, [
        el('caption', { class: 'visually-hidden' }, 'End-of-round counts for the selected condition'),
        el('thead', {}, el('tr', {}, ['Round', 'Ready', 'Waiting', 'Done'].map((t) => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, h.tRows),
      ]);
      tbl.querySelectorAll('td, th').forEach((n) => { n.style.padding = '4px 12px'; n.style.fontSize = '18px'; });
      const tableCard = api.cue(el('div', { class: 'card', style: 'padding:10px 14px;min-width:0' }, [cardTitle('End of each round', 'margin-bottom:4px;font-size:16px'), tbl]), 'table');
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
      [[h.lQ, `${row.review_waiting} waiting`, yq], [h.lD, `${row.done} done`, yd]].forEach(([t, str, y]) => { t.textContent = r === 0 || !right ? '' : str; t.setAttribute('x', x + dx); t.setAttribute('y', y); t.setAttribute('text-anchor', anchor); });
      h.counts.textContent = `Started ${started(row)} · waiting ${row.review_waiting} · done ${row.done}`;
      h.tRows.forEach((tr, i) => {
        const rr = sc.rows[i];
        showIf(tr, !!rr && i <= r);
        tr.style.display = rr ? '' : 'none';
        focusIf(tr, i === r);
        if (rr) { tr.children[1].textContent = String(rr.ready); tr.children[2].textContent = String(rr.review_waiting); tr.children[3].textContent = String(rr.done); }
      });
    },
    print: [
      { title: `Round ${B4} of the baseline: every card started, the review queue at its peak`, condition: 'baseline', state: B4, note: `Capacities: ${CAPTXT(B)}. Transfer rule: ${QB.transfer_rule}; review takes only cards waiting at the start of a round. Counts are end-of-round. Started ${started(B.rows[B4])}, waiting ${B.rows[B4].review_waiting}, done ${B.rows[B4].done}.` },
      { title: 'The baseline to the end: review sets the pace', condition: 'baseline', state: B.rows.length - 1, note: `${CAPTXT(B)}. All eight cards done in round ${doneRound(B)}; the longest review queue was ${peak(B)} cards (round ${B4}). ${QB.timing_note}.` },
      { title: 'Implementation doubled: the same finish, a longer queue', condition: 'implementation-4', state: FI.rows.length - 1, principle: true, note: `${CAPTXT(FI)}, the same arrivals. Done in round ${doneRound(FI)}, as in the baseline; the review queue peaks at ${peak(FI)} instead of ${peak(B)}. Doubling implementation did not change completion, because review still finishes ${FI.review_capacity} card per round.` },
      { title: `Review doubled: done in round ${doneRound(FR)}, and implementation now limits`, condition: 'review-2', state: FR.rows.length - 1, principle: true, note: `${CAPTXT(FR)}. Done in round ${doneRound(FR)}; the queue never holds more than ${peak(FR)}. With review relieved, implementation at ${FR.implementation_capacity} per round sets the pace: the bottleneck moved.` },
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
    heading: 'Which clock does the person who asked experience?',
    lead: 'The eight cards of the baseline board, one row each: when it was asked for, when work started, when it finished. Then a limit on work in progress, with the same demand.',
    principle: 'Timing metrics are meaningful only when their boundaries and excluded waiting are explicit.',
    principleShort: 'Say where each clock starts and stops.',
    conditions: [
      { id: 'no-limit', baseline: true, label: 'Baseline: no limit on work in progress', short: 'No limit',
        states: [
          { prompt: { question: `Someone asked for ${LAST}, ${TITLE[LAST]}, at round 0. Which clock do they experience?`, options: [`From when the team starts ${LAST}`, 'From the request to the finished change', `Only the time ${LAST} spends in review`] }, caption: `The baseline board again: eight cards asked for at round 0, ${CAPTXT(B).toLowerCase()}. One row per card.` },
          { caption: `Three markers per card: **asked for** (all at 0), **started** and **finished**. ${LAST} starts at ${c8.start} and finishes at ${c8.finish}.` },
          { caption: `From the request to the finish: **${c8.lead_time} rounds** for ${LAST}. This is the **lead time**, the clock of the person who asked.` },
          { caption: `From the declared start to the finish: **${c8.cycle_time} rounds**. This is the **cycle time**, the team's clock.` },
          { caption: `${LAST} waited ${c8.ready_wait} rounds in Ready: inside its lead time, outside its cycle time. On average, cycle time is ${one(NOLIM.average_cycle_time)} and lead time ${one(NOLIM.average_lead_time)} rounds.` },
        ] },
      { id: 'limit-2', label: `Changed: work-in-progress limit of ${LIM.wip_limit}`, short: `Limit ${LIM.wip_limit}`,
        states: [
          { prompt: { question: `Now at most ${LIM.wip_limit} cards may be started and not finished. Same eight cards, same capacities. What happens?`, options: ['Both clocks get shorter', 'Cycle time shrinks; lead time stays the same', 'Neither clock changes'] }, caption: `The limit controls admission: a card starts only while fewer than ${LIM.wip_limit} are in progress. Demand stays the same.` },
          { caption: `Starts spread out: ${LAST} now starts at ${l8.start}. At most **${LIM.wip_peak}** cards are in progress at once, instead of ${NOLIM.wip_peak}.` },
          { caption: `Work item age at the end of round ${T_AGE}: the oldest started card is **${AGE1.oldest.age}** rounds old, not ${AGE0.oldest.age}. But ${LAST} has waited **${AGE1.waiting.age}** rounds in Ready.` },
          { caption: `Cycle time falls: ${LAST} takes **${l8.cycle_time} rounds** from start to finish, and the average drops from ${one(NOLIM.average_cycle_time)} to ${one(LIM.average_cycle_time)}.` },
          { caption: 'Every card still finishes in the same round.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const W = 1264, H = 540;
      const svg = window.VC.svg(W, H, { label: 'One row per card: asked for, started and finished, and the waiting before the start', uid: (x) => api.uid(x) });
      const yEnd = G4.rowY + N * G4.rowH;
      for (let t = 0; t <= 9; t += 1) {
        svg.appendChild(s('line', { x1: tx(t), x2: tx(t), y1: 30, y2: yEnd, stroke: 'var(--line)', 'stroke-width': 1 }));
        svg.appendChild(text(tx(t), 22, String(t), { 'text-anchor': 'middle', style: 'font-size:16px;fill:var(--text-soft)' }));
      }
      svg.appendChild(text(6, 22, 'CARD · ROUND →', { style: 'font-size:15px;font-weight:700;letter-spacing:0.06em;fill:var(--text-soft)' }));
      h.hCycle = s('g', { class: 'rv' }); h.hCycle.appendChild(text(1078, 22, 'cycle time', { 'text-anchor': 'middle', style: 'font-size:17px;font-weight:700;fill:var(--violet)' })); svg.appendChild(h.hCycle);
      h.hLead = s('g', { class: 'rv' }); h.hLead.appendChild(text(1196, 22, 'lead time', { 'text-anchor': 'middle', style: 'font-size:17px;font-weight:700;fill:var(--accent-strong)' })); svg.appendChild(h.hLead);
      h.marks = s('g', { class: 'rv' });
      h.cycleVals = s('g', { class: 'rv' }); h.leadVals = s('g', { class: 'rv' });
      h.rows = {};
      IDS.forEach((id, i) => {
        const y = G4.rowY + i * G4.rowH, cy = y + G4.rowH / 2;
        const g = s('g', {});
        const bg = s('rect', { x: 0, y: y + 3, width: 1256, height: G4.rowH - 6, rx: 8, ry: 8, fill: i % 2 ? 'none' : 'rgba(124,196,255,0.035)', stroke: 'none', 'stroke-width': 2 });
        g.appendChild(bg);
        g.appendChild(text(6, cy + 6, id, { style: 'font-size:18px;font-weight:700' }));
        g.appendChild(text(54, cy + 6, TITLE[id], { style: 'font-size:16px;fill:var(--text-muted)' }));
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
      h.age.appendChild(text(tx(T_AGE) + 8, yEnd + 22, `end of round ${T_AGE}`, { style: 'font-size:16px;font-weight:700;fill:var(--warn)' }));
      svg.appendChild(h.age); api.cue(h.age, 'age-line');
      // legend and the clocks
      const glyph = (kind) => {
        const g = window.VC.svg(46, 26, { label: kind, uid: (x) => api.uid(`lg-${kind}-${x}`) });
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
        lg('asked', 'asked for'), lg('start', 'started'), lg('finish', 'finished'), lg('ready', 'waiting in Ready'), lg('impl', 'implementing'), lg('rwait', 'waiting for review'), lg('review', 'review'),
      ]), 'legend');
      h.clocks = el('p', { style: 'font-size:18px;line-height:1.35' });
      h.clockCard = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:8px 14px;flex:0 0 470px;display:flex;flex-direction:column;gap:4px' }), [cardTitle('Averages of the eight cards', 'margin-bottom:0;font-size:15px'), h.clocks]), 'averages');
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
      setB(h.bLead, 0, c.finish, `${LAST} lead time: ${c.lead_time} rounds`, (base && st >= 2) || (!base && st >= 4));
      setB(h.bCycle, c.start, c.finish, `${LAST} cycle time: ${c.cycle_time} rounds`, st >= 3);
      showIf(h.age, !base && st === 2);
      IDS.forEach((id) => { const on = id === LAST && st >= 1; h.rows[id].bg.setAttribute('fill', on ? 'var(--warn-fill)' : h.rows[id].zebra); h.rows[id].bg.setAttribute('stroke', on ? 'var(--warn)' : 'none'); });
      showIf(h.clockCard, (base && st >= 4) || (!base && st >= 3));
      h.clocks.replaceChildren(
        el('span', {}, [el('b', { style: 'color:var(--violet)' }, `cycle time ${one(pol.average_cycle_time)}`), ' · ', el('b', { style: 'color:var(--accent-strong)' }, `lead time ${one(pol.average_lead_time)}`), ' rounds']),
        el('br'), el('span', { class: 'muted', style: 'font-size:16px' }, `most cards in progress at once: ${pol.wip_peak}${base ? '' : ` (no limit: ${NOLIM.wip_peak})`}`),
      );
    },
    print: [
      { title: 'Three markers per card, and both clocks with the waiting in Ready kept in view', condition: 'no-limit', state: 4, note: `Markers: ${WT.markers.arrival}; start is ${WT.markers.start}; finish is ${WT.markers.finish}. Lead time runs ${WT.boundaries.lead_time}; cycle time ${WT.boundaries.cycle_time}. ${LAST}: requested at 0, started at ${c8.start}, finished at ${c8.finish}: lead time ${c8.lead_time}, cycle time ${c8.cycle_time}, ${c8.ready_wait} rounds in Ready and ${c8.review_wait} waiting for review. Averages: cycle ${one(NOLIM.average_cycle_time)}, lead ${one(NOLIM.average_lead_time)} rounds; at most ${NOLIM.wip_peak} cards in progress.` },
      { title: `A work-in-progress limit of ${LIM.wip_limit}: shorter cycle time, the same lead time`, condition: 'limit-2', state: 4, principle: true, note: `Same eight cards, same capacities. With at most ${LIM.wip_limit} cards in progress, ${LAST} starts at ${l8.start}: cycle time ${l8.cycle_time}, lead time ${l8.lead_time}. Average cycle time ${one(NOLIM.average_cycle_time)} → ${one(LIM.average_cycle_time)} rounds; average lead time ${one(NOLIM.average_lead_time)} → ${one(LIM.average_lead_time)}. At the end of round ${T_AGE} the oldest started card is ${AGE1.oldest.age} rounds old (no limit: ${AGE0.oldest.age}), while ${LAST} has waited ${AGE1.waiting.age} rounds in Ready. ${upper1(WT.not_an_improvement)}. ${WT.boundary_source}.` },
    ],
  };

  // =====================================================================
  // SCENE 5 · estimates-with-assumptions (Bridge)
  // =====================================================================
  const ECH = EA.changed_condition;
  const DAYS = EA.similar_changes_days;
  const estimatesWithAssumptions = {
    id: 'estimates-with-assumptions', role: 'bridge',
    heading: '“Three days”: effort, elapsed time or a promise?',
    lead: `One card, ${EA.change.id} ${EA.change.title}. The team says it will take “${EA.stated}”. Look behind the number before anyone plans around it.`,
    principle: 'An estimate is a conditional statement whose assumptions should travel with it.',
    principleShort: 'State what the number assumes.',
    conditions: [
      { id: 'interface-agreed', baseline: true, label: 'Baseline: the identity interface is agreed', short: 'Interface agreed',
        states: [
          { prompt: { question: `The team says ${EA.change.id} will take “${EA.stated}”. What does that mean?`, options: EA.meanings.map((m) => upper1(m.reads_as)) }, caption: `**${EA.change.id} ${EA.change.title}**: ${EA.change.summary}. The answer given: **${EA.stated}**.` },
          { caption: '“Three days” can mean **effort**, **elapsed time** or a **commitment**: three different numbers.' },
          { caption: 'Behind the number: the known work, and two dependencies: the identity interface, and review at one card per round.' },
          { caption: `Five similar changes took ${DAYS.join(', ')} days. ${upper1(EA.range.basis)}.` },
          { caption: `With its basis: **${EA.range.low} to ${EA.range.high} days elapsed**, ${EA.effort_days.low} to ${EA.effort_days.high} days of effort, if the identity interface is agreed.` },
          { caption: 'The cost continues after the estimate ends.', principle: true },
        ] },
      { id: 'interface-open', label: 'Changed: the identity interface is not agreed', short: 'Interface open',
        states: [
          { prompt: { question: 'The identity interface is not yet agreed. What should happen to the estimate?', options: [`Keep “${EA.stated}”`, 'Widen it, or state its condition', 'Double it to be safe'] }, caption: `One assumption changes: **${ECH.label}**.` },
          { caption: `Until it is agreed, the change cannot finish: the range widens to **${ECH.range_if_unresolved.low} to ${ECH.range_if_unresolved.high} days**.` },
          { caption: `Or qualify it: **${ECH.qualified}**. The condition travels with the number.` },
          { caption: `Resolving the uncertainty narrows it again: ${ECH.resolve}.` },
          { caption: 'Revise it when a condition changes.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      // row 1: the card and its number
      h.meanings = EA.meanings.map((m) => api.cue(el('div', { class: 'w4-cell', style: 'display:flex;flex-direction:column;gap:4px;padding:8px 12px' }, [el('b', { style: 'font-size:19px' }, m.label), el('span', { class: 'muted', style: 'font-size:16px;line-height:1.28' }, upper1(m.reads_as))]), `meaning-${m.id}`));
      h.meaningRow = el('div', reveal({ class: 'rv rv--rise', style: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px' }), h.meanings);
      const top = api.cue(el('div', { class: 'card', style: 'padding:12px 16px;display:grid;grid-template-columns:300px 250px minmax(0,1fr);gap:16px;align-items:center' }, [
        el('div', { style: 'display:flex;flex-direction:column;gap:4px' }, [el('span', { style: 'font-size:22px;font-weight:700' }, `${EA.change.id} · ${EA.change.title}`), small(upper1(EA.change.summary))]),
        api.cue(el('div', { style: 'font-family:var(--font-display);font-size:38px;font-weight:700;color:var(--warn);text-align:center;line-height:1.1;white-space:nowrap' }, `“${EA.stated}”`), 'number'),
        h.meaningRow,
      ]), 'estimate');
      // row 2 left: behind the number
      const list = (items, kind) => el('ul', { style: 'font-size:18px;line-height:1.35;display:flex;flex-direction:column;gap:2px;margin:2px 0 6px' }, items.map((t) => el('li', { style: kind ? `color:var(--${kind})` : '' }, upper1(t))));
      h.behind = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:2px;min-width:0' }), [
        cardTitle('Known work', 'margin-bottom:0;font-size:15px'), list(EA.known_work),
        cardTitle('Dependencies', 'margin-bottom:0;font-size:15px'), h.deps = list(EA.dependencies, 'warn'),
        cardTitle('Open question', 'margin-bottom:0;font-size:15px'), list(EA.open_questions),
      ]), 'behind');
      // row 2 right: similar changes as dots on a day axis
      const DW = 610, DH = 196, DX0 = 34, DX1 = DW - 24, DMAX = 10;
      const dx = (d) => DX0 + ((DX1 - DX0) * d) / DMAX;
      const svg = window.VC.svg(DW, DH, { label: 'Elapsed days of five similar changes on a day axis, with the range and the single number', uid: (x) => api.uid(`dots-${x}`) });
      for (let d = 0; d <= DMAX; d += 1) {
        svg.appendChild(s('line', { x1: dx(d), x2: dx(d), y1: 150, y2: 158, stroke: 'var(--line-strong)', 'stroke-width': 1.5 }));
        svg.appendChild(text(dx(d), 178, String(d), { 'text-anchor': 'middle', style: 'font-size:16px;fill:var(--text-soft)' }));
      }
      svg.appendChild(s('line', { x1: DX0, x2: DX1, y1: 150, y2: 150, stroke: 'var(--line-strong)', 'stroke-width': 1.5 }));
      svg.appendChild(text(DX1, 196, 'working days, start to done', { 'text-anchor': 'end', style: 'font-size:15px;fill:var(--text-soft)' }));
      h.band = s('rect', { y: 44, height: 98, rx: 8, ry: 8, fill: 'var(--accent-fill)', stroke: 'var(--accent)', 'stroke-width': 2 });
      h.bandLabel = text(0, 70, '', { style: 'font-size:17px;font-weight:700;fill:var(--accent-strong)' });
      h.bandG = s('g', { class: 'rv' }); h.bandG.append(h.band, h.bandLabel); svg.appendChild(h.bandG);
      h.dots = s('g', { class: 'rv' });
      const seen = {};
      DAYS.forEach((d) => { seen[d] = (seen[d] || 0) + 1; h.dots.appendChild(s('circle', { cx: dx(d), cy: 132 - (seen[d] - 1) * 24, r: 10, fill: 'var(--text)', stroke: 'var(--bg)', 'stroke-width': 2 })); });
      svg.appendChild(h.dots);
      h.single = s('g', {});
      h.single.appendChild(s('line', { x1: dx(3), x2: dx(3), y1: 16, y2: 150, stroke: 'var(--warn)', 'stroke-width': 3, 'stroke-dasharray': '6 5' }));
      h.single.appendChild(text(dx(3) - 10, 30, `“${EA.stated}”`, { 'text-anchor': 'end', style: 'font-size:17px;font-weight:700;fill:var(--warn)' }));
      svg.appendChild(h.single);
      svg.style.height = `${DH}px`;
      h.similar = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:4px;min-width:0' }), [cardTitle('Five similar changes', 'margin-bottom:0;font-size:15px'), svg, small(`${upper1(EA.similar_note)}.`, 'font-size:15px')]), 'similar');
      api.cue(h.dots, 'dots'); api.cue(h.bandG, 'range'); api.cue(h.single, 'single-number');
      // row 3: lifecycle (baseline) or the conditions of the estimate (changed)
      h.life = el('div', reveal({ class: 'rv rv--rise', 'data-cond': 'interface-agreed', style: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px' }), EA.lifecycle.map((x, i) => api.cue(el('div', { class: 'card', style: `padding:10px 14px;display:flex;flex-direction:column;gap:4px;border-color:var(--${['accent', 'warn', 'violet'][i]})` }, [el('b', { style: `font-size:18px;color:var(--${['accent-strong', 'warn', 'violet'][i]})` }, x.label), el('span', { style: 'font-size:17px;line-height:1.3' }, upper1(x.value))]), `cost-${x.id}`)));
      h.qualified = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'interface-open', 'data-show-from': '2', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:4px;border-color:var(--accent)' }), [cardTitle('The estimate, with its condition', 'margin-bottom:0;font-size:15px'), el('b', { style: 'font-size:20px;color:var(--accent-strong)' }, upper1(ECH.qualified))]), 'qualified');
      h.resolve = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'interface-open', 'data-show-from': '3', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:4px;border-color:var(--ok)' }), [cardTitle('Worth doing first', 'margin-bottom:0;font-size:15px'), el('span', { style: 'font-size:18px;line-height:1.3' }, `${upper1(ECH.resolve)}: it narrows ${ECH.range_if_unresolved.low} to ${ECH.range_if_unresolved.high} days back to ${EA.range.low} to ${EA.range.high}.`)]), 'resolve');
      h.trigger = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'interface-open', 'data-show-from': '4', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:4px;border-color:var(--warn)' }), [cardTitle('Revise it when', 'margin-bottom:0;font-size:15px'), el('span', { style: 'font-size:18px;line-height:1.3' }, upper1(ECH.trigger.replace(/^revise the estimate when /, '')) + '.')]), 'trigger');
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
      h.bandLabel.textContent = wide ? `${lo} to ${hi} days until the interface is agreed` : `${lo} to ${hi} days`;
      showIf(h.bandG, (base && st >= 4) || !base);
      showIf(h.life, base && st >= 5);
    },
    print: [
      { title: 'The estimate with its meaning, its basis and what it leaves out', condition: 'interface-agreed', state: 5, principle: true, note: `“${upper1(EA.stated)}” can mean ${listAnd(EA.meanings.map((m) => `${m.label.toLowerCase()} (${m.reads_as})`))}. Known work: ${listAnd(EA.known_work)}. Dependencies: ${listAnd(EA.dependencies)}. Five similar changes took ${DAYS.join(', ')} days (simulated); ${EA.range.basis}. Estimate: ${EA.range.low} to ${EA.range.high} days elapsed, ${EA.effort_days.low} to ${EA.effort_days.high} days of effort, assuming the identity interface is agreed. The range summarizes the examples; it is not a statistical confidence interval. Cost after the estimate: ${EA.lifecycle.map((x) => `${x.label.toLowerCase()}: ${x.value}`).join('; ')}.` },
      { title: 'One assumption changes: the estimate widens, or carries its condition', condition: 'interface-open', state: 4, principle: true, note: `${upper1(ECH.label)}: the range widens to ${ECH.range_if_unresolved.low} to ${ECH.range_if_unresolved.high} days, or the estimate is qualified as ${ECH.qualified}. ${upper1(ECH.resolve)} narrows it back. ${upper1(ECH.trigger)}.` },
    ],
  };

  // =====================================================================
  // SCENE 6 · risk-and-learning (Anchor)
  // =====================================================================
  const OPT = RL.options;
  const CRIT = [['impact', 'Impact'], ['uncertainty', 'Uncertainty'], ['reversibility', 'Reversibility'], ['cost_of_delay', 'Cost of delay'], ['information_gained', 'Information gained']];
  const ORD = { low: 1, medium: 2, high: 3, little: 1, large: 3, 'very low': 0 };
  const ordOf = (v) => { const k = Object.keys(ORD).find((w) => String(v).toLowerCase().startsWith(w)); return k == null ? null : ORD[k]; };
  const ordWord = (v) => String(v).split(':')[0];
  const IDENT = OPT[2].option, PROOF = OPT[1].option, VISUAL = OPT[0].option;
  const ALT = RL.curriculum_refinement.alternatives;
  const riskAndLearning = {
    id: 'risk-and-learning', role: 'anchor',
    heading: 'What should the team learn before committing more work?',
    lead: 'Three candidate next steps, judged on five criteria in words, not invented numbers. Look at what each step would teach and what failure would cost.',
    principle: 'Prioritize not only output, but also the decisions and uncertainties that could make later work wasteful.',
    principleShort: 'Learn what could waste later work.',
    conditions: [
      { id: 'temporary-interface', baseline: true, label: 'Baseline: the identity choice is temporary', short: 'Temporary choice',
        states: [
          { prompt: { question: 'Three candidate next steps. What should the team learn before it commits more work?', options: [`${VISUAL}: quick and visible`, PROOF, IDENT] }, caption: 'Three candidates, five criteria, judged in words.' },
          { caption: `**${VISUAL}**: low impact, low uncertainty, easy to undo, little to learn. Pleasant, but it teaches little.` },
          { caption: `**${PROOF}**: high impact and high uncertainty. Every later booking feature relies on R-01, so waiting is costly.` },
          { caption: `**${IDENT}**: high impact, high uncertainty, and hard to undo if the guess is wrong. R-03 depends on who is asking.` },
          { caption: `Every option can also be reduced or deferred: **reduce scope** by shipping owner cancellation first; **defer** the visual refinement.` },
          { caption: `First: ${lowerFirst(RL.baseline_decision.first)}. The visual refinement waits: its value is the **opportunity cost**.` },
        ] },
      { id: 'data-migration', label: 'Changed: the choice becomes a data migration', short: 'Hard to reverse',
        states: [
          { prompt: { question: 'The identity choice will be stored in every booking record: changing it later means a data migration. What changes?', options: ['Nothing: keep the order', 'Seek evidence on identity before building on it', 'Skip the investigation to save time'] }, caption: `One condition changes: **${RL.changed_condition.label}**.` },
          { caption: `Only reversibility changes, for the identity row: **${ordWord(RL.changed_condition.reversibility)}**. ${upper1(RL.changed_condition.reversibility.split(': ')[1])}.` },
          { caption: `${upper1(RL.changed_decision.evidence)}: the investigation moves first.` },
          { caption: `The smallest estimate is not the cheapest: ${RL.lifecycle_example.option} costs least now and most later.` },
          { caption: 'Still uncertain until it reports.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const ordCell = (v) => {
        const k = ordOf(v);
        const dots = k == null ? null : el('span', { class: 'w4-ord', 'aria-hidden': 'true' }, [0, 1, 2].map((i) => el('i', { class: i < k ? 'on' : '' })));
        return el('span', {}, [dots, el('span', {}, ordWord(v))]);
      };
      const head = el('tr', {}, [el('th', { scope: 'col', style: 'width:222px' }, 'Option'), ...CRIT.map(([, l]) => el('th', { scope: 'col', style: 'width:120px' }, l)), el('th', { scope: 'col' }, 'What it clarifies'), el('th', { scope: 'col' }, 'If it goes wrong')]);
      head.querySelectorAll('th').forEach((n) => { n.style.fontSize = '16px'; n.style.padding = '6px 8px'; n.style.lineHeight = '1.2'; n.style.textTransform = 'none'; n.style.letterSpacing = '0'; n.style.color = 'var(--text)'; });
      h.rows = OPT.map((o, i) => {
        const cells = {};
        const tds = CRIT.map(([k]) => { cells[k] = el('td', { style: 'font-size:17px;padding:8px' }, ordCell(o[k])); return cells[k]; });
        const tr = api.cue(el('tr', { class: 'rv' }, [
          el('th', { scope: 'row', style: 'font-size:18px;padding:8px;line-height:1.25' }, o.option), ...tds,
          el('td', { style: 'font-size:16px;padding:8px;line-height:1.28;color:var(--text-muted)' }, upper1(RL.notes[o.option].clarifies)),
          el('td', { style: 'font-size:16px;padding:8px;line-height:1.28;color:var(--text-muted)' }, upper1(RL.notes[o.option].failure_cost)),
        ]), `row-${i + 1}`);
        return { tr, cells, o };
      });
      h.revCell = h.rows[2].cells.reversibility;
      api.cue(h.revCell, 'identity-reversibility');
      const tbl = el('table', { class: 'data-table', style: 'table-layout:fixed' }, [el('caption', { class: 'visually-hidden' }, 'Three candidate next steps judged on five criteria'), el('thead', {}, head), el('tbody', {}, h.rows.map((r) => r.tr))]);
      const tableCard = api.cue(el('div', { class: 'card', style: 'padding:6px 10px' }, tbl), 'table');
      h.alts = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:6px;min-width:0' }), [
        cardTitle('Every step can be chosen four ways', 'margin-bottom:0;font-size:15px'),
        ...ALT.map((a) => api.cue(el('div', { style: 'display:grid;grid-template-columns:150px minmax(0,1fr);gap:10px;font-size:17px;line-height:1.28' }, [el('b', { style: 'color:var(--accent-strong)' }, a), el('span', {}, upper1(RL.alternative_notes[a]))]), `alt-${a.replace(/\s+/g, '-')}`)),
      ]), 'alternatives');
      const le = RL.lifecycle_example;
      h.life = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:4px;min-width:0;border-color:var(--warn)' }), [
        cardTitle(`The cost over its life: ${le.option}`, 'margin-bottom:0;font-size:15px;color:var(--warn)'),
        ...RL.curriculum_refinement.cost_dimensions.map((d) => el('div', { style: 'display:grid;grid-template-columns:170px minmax(0,1fr);gap:10px;font-size:17px;line-height:1.25' }, [el('b', {}, upper1(d)), el('span', {}, upper1(le[d.replace(/\s+/g, '_')] || ''))])),
      ]), 'lifecycle');
      h.decision = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:6px;min-width:0;border-color:var(--violet)' }), [
        cardTitle('The decision', 'margin-bottom:0;font-size:15px;color:var(--violet)'),
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
      h.decFirst.replaceChildren(el('b', {}, 'First: '), `${d.first}. `, el('b', {}, 'Then: '), `${d.then}. `, el('b', {}, 'Deferred: '), `${d.deferred}.`);
      h.decWhy.textContent = changed ? `${upper1(RL.changed_decision.evidence)}.` : `${upper1(RL.baseline_decision.reason)}.`;
      h.decCost.replaceChildren(...(changed && st >= 4 ? [el('b', { style: 'color:var(--warn)' }, 'Still uncertain: '), `${RL.still_uncertain}.`] : [el('b', {}, 'Opportunity cost: '), `${RL.opportunity_cost}.`]));
    },
    print: [
      { title: 'The decision table and the baseline decision, with its opportunity cost', condition: 'temporary-interface', state: 5, note: `Criteria: ${RL.criteria.join(', ')}. ${upper1(RL.scale)}. ${OPT.map((o) => `${o.option}: clarifies ${RL.notes[o.option].clarifies}; if it goes wrong, ${RL.notes[o.option].failure_cost}.`).join(' ')} Alternatives: ${ALT.map((a) => `${a} (${RL.alternative_notes[a]})`).join('; ')}. Decision: first ${lowerFirst(RL.baseline_decision.first)}, then ${lowerFirst(RL.baseline_decision.then)}; ${lowerFirst(RL.baseline_decision.deferred)} deferred, because of ${RL.baseline_decision.reason}. Opportunity cost: ${RL.opportunity_cost}.` },
      { title: 'Only reversibility changes: the identity question moves first', condition: 'data-migration', state: 4, principle: true, note: `${upper1(RL.changed_condition.label)}: the reversibility of the identity decision becomes ${RL.changed_condition.reversibility}. ${upper1(RL.changed_decision.evidence)}: first ${lowerFirst(RL.changed_decision.first)}, then ${lowerFirst(RL.changed_decision.then)}. ${upper1(RL.lifecycle_example.option)}: ${RL.curriculum_refinement.cost_dimensions.map((d) => `${d} ${RL.lifecycle_example[d.replace(/\s+/g, '_')]}`).join(', ')}; ${RL.lifecycle_example.lesson}. Still uncertain: ${RL.still_uncertain}.` },
    ],
  };
  function lowerFirst(str) { return str.charAt(0).toLowerCase() + str.slice(1); }
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
  const nameOf = (uid) => (CASE.users.find((u) => u.id === uid) || {}).name || 'nobody';
  const definitionOfDone = {
    id: 'definition-of-done', role: 'bridge',
    heading: 'The code runs. Is the cancellation change done?',
    lead: `${DD.change.id} ${DD.change.title} is coded, and its happy path works. What else should be true before people rely on it?`,
    principle: 'A shared completion policy should make quality expectations visible and proportionate.',
    principleShort: 'Agree what done means, sized to the risk.',
    conditions: [
      { id: 'cancellation-change', baseline: true, label: 'Baseline: a change to cancellation behavior', short: 'Cancellation',
        states: [
          { prompt: { question: 'The happy-path cancel function runs. Is the cancellation change done?', options: ['Yes: the code runs', 'Not until the other R-03 cases behave as required', 'Yes, once it is merged'] }, caption: `**${DD.change.id} ${DD.change.title}** is coded. One case runs: ${DD.change.happy_path}.` },
          { caption: `Next case: ${DD.missing[0].case}. The **${DD.missing[0].what}** is missing.` },
          { caption: `And ${DD.missing[1].case}: the person cannot tell it worked.` },
          { caption: 'The team\'s completion policy says what “done” needs for this team\'s risk: five kinds of evidence.' },
          { caption: 'With the ownership check and the message fixed, all five hold. Now the change is ready to rely on, not only coded.' },
          { caption: 'R-03\'s examples accept one requirement. The completion policy applies to every change: in Scrum, the **Definition of Done**.' },
        ] },
      { id: 'wording-fix', label: 'Changed: an internal wording correction', short: 'Wording fix',
        states: [
          { prompt: { question: 'Next: a typo fixed in an internal log label, no behavior change. Does it need the same evidence?', options: ['Yes: one checklist, all of it, every time', 'The same policy, only the relevant evidence', 'No evidence: it is only words'] }, caption: `A second change: **${WORD.title}**. ${upper1(WORD.summary)}.` },
          { caption: `${POL[0].label}: ${WORD.relevant.behavior}. ${POL[1].label}: ${WORD.relevant.review}. ${POL[2].label}: ${WORD.relevant.checks}.` },
          { caption: `${POL[3].label}: ${WORD.relevant.docs}. ${POL[4].label}: ${WORD.relevant.operability}.` },
          { caption: 'One policy; the evidence fits each change.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const badgeEl = (p, key) => {
        const mk = el('span', { class: 'mk', 'aria-hidden': 'true' }, '·');
        const body = el('span', {}, [el('b', {}, p.label), el('br'), h[`ev-${key}-${p.id}`] = el('span', { class: 'muted', style: 'font-size:16px' }, '')]);
        const n = api.cue(el('div', { class: 'w4-badge' }, [mk, body]), `${key}-${p.id}`);
        n.mk = mk;
        return n;
      };
      h.badges = POL.map((p) => badgeEl(p, 'badge'));
      h.policy = el('div', reveal({ class: 'rv rv--rise', style: 'display:flex;flex-direction:column;gap:6px' }), [cardTitle('Completion policy of this team', 'margin-bottom:0;font-size:15px;color:var(--violet)'), ...h.badges]);
      h.title = el('span', { style: 'font-size:22px;font-weight:700' });
      h.status = el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' });
      const cardEl = api.cue(el('div', { class: 'card', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:10px;min-width:0' }, [h.title, h.status, h.policy]), 'work-card');
      // right: the cases and the screen
      const caseRow = (row, does, name) => {
        const doesCell = el('td', { style: 'font-size:17px;padding:8px 10px' });
        const tr = api.cue(el('tr', { class: 'rv' }, [
          el('th', { scope: 'row', style: 'font-size:17px;padding:8px 10px;line-height:1.25' }, `${row.requester ? `${nameOf(row.requester)} (${row.requester})` : 'Not signed in'} cancels ${row.booking} at ${row.now}`),
          el('td', { style: `font-size:17px;padding:8px 10px;color:var(--${row.expected === 'allowed' ? 'ok' : 'bad'});font-weight:600` }, row.expected),
          doesCell,
        ]), name);
        tr.doesCell = doesCell; tr.does = does;
        return tr;
      };
      h.cases = [caseRow(OWN, 'allowed', 'case-own'), caseRow(OTHER, 'allowed', 'case-other'), caseRow(STARTED, 'denied', 'case-started'), caseRow(UNAUTH, 'denied', 'case-signed-out')];
      const tbl = el('table', { class: 'data-table data-table--compact' }, [el('caption', { class: 'visually-hidden' }, 'R-03 cases: what the rule says and what the change does'), el('thead', {}, el('tr', {}, ['Case', 'R-03 says', 'The change does'].map((t) => el('th', { scope: 'col', style: 'font-size:15px' }, t)))), el('tbody', {}, h.cases)]);
      h.casesCard = api.cue(el('div', { class: 'card', 'data-cond': 'cancellation-change', style: 'padding:10px 14px;min-width:0' }, [cardTitle('R-03 cases', 'margin-bottom:2px;font-size:15px'), tbl]), 'cases');
      h.statusLine = el('div', { class: 'status status--wait', role: 'status', style: 'font-size:19px' }, [el('span', { class: 'ico', 'aria-hidden': 'true' }, '?'), el('span', {}, '(no message after Cancel)')]);
      h.screen = api.cue(el('div', reveal({ class: 'rv rv--rise', 'data-cond': 'cancellation-change' }), window.VC.browser({ who: `${ARI.name} · ${ARI.id}`, url: 'campus-rooms.example/my-bookings', body: [
        el('div', { style: 'display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;font-size:19px' }, [el('span', {}, `${BK.id} · ${BK.room_id} · ${BK.start} to ${BK.end}`), el('span', { class: 'chip chip--muted', style: 'font-size:16px' }, 'Cancel pressed')]),
        h.statusLine,
      ] })), 'screen');
      h.accept = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'cancellation-change', style: 'padding:10px 14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;border-color:var(--violet)' }), [
        el('div', {}, [el('b', { style: 'font-size:17px;color:var(--accent-strong)' }, 'Acceptance examples'), el('p', { style: 'font-size:16px;line-height:1.3' }, 'Belong to one requirement: the R-03 cases above.')]),
        el('div', {}, [el('b', { style: 'font-size:17px;color:var(--violet)' }, 'Completion policy'), el('p', { style: 'font-size:16px;line-height:1.3' }, 'Applies to every change the team calls done.')]),
      ]), 'acceptance-vs-policy');
      // changed: the two changes side by side
      h.cmpRows = POL.map((p, i) => el('tr', { class: 'rv', 'data-show-from': i <= 2 ? '1' : '2' }, [el('th', { scope: 'row', style: 'font-size:16px;padding:6px 8px' }, p.label), el('td', { style: 'font-size:15px;padding:6px 8px;line-height:1.25' }, upper1(p.evidence)), el('td', { style: 'font-size:15px;padding:6px 8px;line-height:1.25' }, upper1(WORD.relevant[p.id]))]));
      h.compare = api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'wording-fix', 'data-show-from': '1', style: 'padding:10px 12px;min-width:0' }), [cardTitle('Two changes, one policy', 'margin-bottom:2px;font-size:15px'), el('table', { class: 'data-table data-table--compact' }, [el('caption', { class: 'visually-hidden' }, 'Relevant evidence for the two changes'), el('thead', {}, el('tr', {}, ['Evidence', `${DD.change.id} cancellation`, 'Wording correction'].map((t) => el('th', { scope: 'col', style: 'font-size:14px;padding:6px 8px' }, t)))), el('tbody', {}, h.cmpRows)])]), 'compare');
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [h.casesCard, h.screen, h.accept, h.compare]);
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:560px minmax(0,1fr);gap:18px;align-items:start' }, [cardEl, right]));
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'cancellation-change';
      const fixed = base && st >= 4;
      h.title.textContent = base ? `${DD.change.id} · ${DD.change.title}` : upper1(WORD.title);
      h.status.replaceChildren(...(base
        ? [chip('Coded', 'accent', { style: 'font-size:16px' }), chip(st >= 1 && !fixed ? 'Happy path only' : 'Happy path runs', st >= 1 && !fixed ? 'warn' : 'ok', { style: 'font-size:16px' }), fixed ? chip('Ready to rely on', 'ok', { style: 'font-size:16px' }) : null]
        : [chip('No behavior change', 'muted', { style: 'font-size:16px' }), st >= 3 ? chip('Done, with its evidence', 'ok', { style: 'font-size:16px' }) : null]).filter(Boolean));
      showIf(h.policy, (base && st >= 3) || !base);
      POL.forEach((p, i) => {
        const b = h.badges[i];
        let cls = '', mark = '·', ev = upper1(p.evidence);
        if (base) {
          if (st >= 4) { cls = 'is-ok'; mark = '✓'; }
          else if (p.id === 'behavior' || p.id === 'docs') { cls = st >= 3 ? 'is-bad' : ''; mark = st >= 3 ? '✕' : '·'; ev = p.id === 'behavior' ? `Missing: ${DD.missing[0].what}` : `Missing: ${DD.missing[1].what}`; }
        } else {
          const shown = (i <= 2 && st >= 1) || (i >= 3 && st >= 2);
          ev = shown ? upper1(WORD.relevant[p.id]) : '';
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
        tr.doesCell.replaceChildren(el('span', { style: `color:var(--${right ? 'ok' : 'bad'});font-weight:700` }, `${does} ${right ? '✓' : '✕'}`));
        focusIf(tr, base && i === 1 && st === 1);
      });
      showIf(h.screen, base && st >= 2);
      h.statusLine.className = fixed ? 'status status--ok' : 'status status--wait';
      h.statusLine.replaceChildren(el('span', { class: 'ico', 'aria-hidden': 'true' }, fixed ? '✓' : '?'), el('span', {}, fixed ? `${BK.id} is cancelled. The room is free again.` : '(no message after Cancel)'));
      showIf(h.accept, base && st >= 5);
      focusIf(h.compare, !base && st === 3);
    },
    print: [
      { title: 'The cancellation change: coded is not yet done', condition: 'cancellation-change', state: 5, note: `The happy path runs: ${DD.change.happy_path}. Missing at first: ${DD.missing.map((m) => `${m.what} (${m.case})`).join('; ')}. The team's completion policy: ${POL.map((p) => `${p.label}: ${p.evidence}`).join('; ')}. ${upper1(DD.acceptance_vs_policy)}. The Scrum Guide (S04) defines the Definition of Done as “${DD.scrum_definition}”` },
      { title: 'An internal wording correction: the same policy, the relevant evidence', condition: 'wording-fix', state: 3, principle: true, note: `${upper1(WORD.title)}: ${WORD.summary}. ${POL.map((p) => `${p.label}: ${WORD.relevant[p.id]}`).join('; ')}. The evidence is proportionate to the change, not an identical ceremony for every change.` },
    ],
  };

  // =====================================================================
  // SCENE 8 · retrospective-as-test (Bridge)
  // =====================================================================
  const retrospectiveAsTest = {
    id: 'retrospective-as-test', role: 'bridge',
    heading: 'The review queue keeps growing. What should change?',
    lead: 'Treat a change to how the team works like any other change: state what you expect, decide what would show you are wrong, then look at the results, side effects included.',
    principle: 'Change a process deliberately, observe its consequences, and revise the explanation when the evidence disagrees.',
    principleShort: 'Try a change, watch its effects, revise.',
    conditions: [
      { id: 'share-review', baseline: true, label: 'Baseline: share the review work', short: 'Share review',
        states: [
          { prompt: { question: 'The review queue grows every round. What should the team do next?', options: ['Tell the reviewer to hurry', 'Try a stated change to the review step', 'Stop starting new cards for good'] }, caption: `The observation, from the board: **${RT.observation}**.` },
          { caption: `“${upper1(RT.blame)}” blames a person. The system view: ${RT.system}.` },
          { caption: 'Why keep it **blameless**: people report delays and mistakes honestly only where that is safe.' },
          { caption: `A proposal with an expected effect: ${RT.proposal}. Expected: ${RT.expected}.` },
          { caption: `Decide first what would show it is wrong: ${RT.contrary}. Three measures, before and after.` },
          { caption: `After the change: done in **round ${RT.after_shared.done_round}**, queue at most ${RT.after_shared.queue_peak}, issues found after review unchanged. The evidence agrees.` },
        ] },
      { id: 'faster-shallower', label: 'Changed: faster review, more missed issues', short: 'Faster, shallower',
        states: [
          { prompt: { question: `Another team speeds review up by reading less carefully. Their board is also done in round ${RT.after_rushed.done_round}. Better?`, options: ['Yes: the same speed-up', 'Look at quality and rework before deciding', 'Yes, if nobody complains'] }, caption: `Same speed-up; one side effect changes: **${RT.side_effect}** go up.` },
          { caption: `Flow looks the same: done in round ${RT.after_rushed.done_round}, queue at most ${RT.after_rushed.queue_peak}. But **${RT.after_rushed.missed_issues}** issues were found after review.` },
          { caption: `${upper1(RT.after_rushed.rework)}: counting the rework, the last card is done in **round ${RT.after_rushed.done_round_with_rework}**.` },
          { caption: 'Judge flow and quality together.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      // sparkline of the baseline review queue
      const SW = 250, SH = 92;
      const sp = window.VC.svg(SW, SH, { label: 'Review queue by round in the baseline', uid: (x) => api.uid(`spark-${x}`) });
      const px = (r) => 8 + ((SW - 16) * r) / 9, py = (n) => SH - 16 - ((SH - 30) * n) / 7;
      sp.appendChild(s('path', { d: B.rows.map((row, i) => `${i ? 'L' : 'M'}${px(row.round)},${py(row.review_waiting)}`).join(' '), fill: 'none', stroke: 'var(--warn)', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }));
      sp.appendChild(s('circle', { cx: px(B4), cy: py(B.rows[B4].review_waiting), r: 6, fill: 'var(--warn)' }));
      sp.appendChild(text(px(B4) + 12, py(B.rows[B4].review_waiting) - 4, `${B.rows[B4].review_waiting} waiting`, { style: 'font-size:15px;font-weight:700;fill:var(--warn)' }));
      sp.appendChild(text(8, SH - 2, 'round 0', { style: 'font-size:13px;fill:var(--text-soft)' }));
      sp.appendChild(text(SW - 8, SH - 2, 'round 9', { 'text-anchor': 'end', style: 'font-size:13px;fill:var(--text-soft)' }));
      sp.style.width = `${SW}px`; sp.style.height = `${SH}px`;
      const hyp = (key, title, body, extra) => api.cue(el('div', Object.assign({ class: 'w4-hyp' }, extra || {}), [el('span', { class: 't' }, title), ...body]), key);
      h.obs = hyp('observation', '1 · Observation', [el('p', {}, `${upper1(RT.observation)}.`), sp]);
      h.prop = hyp('proposal', '2 · Proposed change', [el('p', {}, `${upper1(RT.proposal)}.`)], reveal({ class: 'w4-hyp rv rv--rise' }));
      h.expect = hyp('expected', '3 · Expected effect', [el('p', {}, `${upper1(RT.expected)}.`)], reveal({ class: 'w4-hyp rv rv--rise' }));
      h.contra = hyp('contrary', '4 · It is wrong if', [el('p', {}, `${upper1(RT.contrary)}.`), el('p', { style: 'font-size:16px;color:var(--warn)' }, `Side effect to watch: ${RT.side_effect}.`)], reveal({ class: 'w4-hyp rv rv--rise' }));
      const top = el('div', { style: 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px' }, [h.obs, h.prop, h.expect, h.contra]);
      h.blame = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:6px' }), [
        cardTitle('Talk about the system, not a person', 'margin-bottom:0;font-size:15px'),
        el('p', { style: 'font-size:18px;line-height:1.3' }, [el('s', { style: 'color:var(--bad)' }, `“${upper1(RT.blame)}.”`)]),
        el('p', { style: 'font-size:18px;line-height:1.3' }, [el('b', { style: 'color:var(--ok)' }, 'System: '), `${upper1(RT.system)}.`]),
      ]), 'blame-or-system');
      h.safe = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:6px;border-color:var(--accent)' }), [
        cardTitle('Why blameless', 'margin-bottom:0;font-size:15px;color:var(--accent-strong)'),
        el('p', { style: 'font-size:17px;line-height:1.32' }, `${upper1(RT.safety)}.`),
      ]), 'blameless');
      // measures table
      const COLS = [['before', 'Before'], ['after_shared', 'After: shared review'], ['after_rushed', 'After: faster, shallower']];
      const vals = [['done_round', RT.measures[0]], ['queue_peak', RT.measures[1]], ['missed_issues', RT.measures[2]]];
      h.cells = {};
      const headRow = el('tr', {}, [el('th', { scope: 'col', style: 'font-size:14px;padding:6px 8px' }, 'Measure'), ...COLS.map(([k, l]) => (h.cells[`h-${k}`] = el('th', { scope: 'col', class: 'rv', style: 'font-size:14px;padding:6px 8px;line-height:1.2' }, l)))]);
      const bodyRows = vals.map(([k, label]) => el('tr', {}, [el('th', { scope: 'row', style: 'font-size:16px;padding:7px 8px;line-height:1.25' }, upper1(label)), ...COLS.map(([c]) => (h.cells[`${c}-${k}`] = el('td', { class: 'num rv', style: 'font-size:20px;font-weight:700;padding:7px 8px' }, String(RT[c][k]))))]));
      h.reworkRow = el('tr', { class: 'rv' }, [el('th', { scope: 'row', style: 'font-size:16px;padding:7px 8px;line-height:1.25' }, 'All eight done, counting rework'), el('td', { class: 'num', style: 'font-size:20px;font-weight:700;padding:7px 8px' }, String(RT.before.done_round)), el('td', { class: 'num', style: 'font-size:20px;font-weight:700;padding:7px 8px' }, String(RT.after_shared.done_round)), el('td', { class: 'num', style: 'font-size:20px;font-weight:700;padding:7px 8px;color:var(--bad)' }, String(RT.after_rushed.done_round_with_rework))]);
      h.missedRushed = h.cells['after_rushed-missed_issues'];
      h.measures = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 12px;min-width:0' }), [cardTitle('Measures, before and after', 'margin-bottom:2px;font-size:15px'), el('table', { class: 'data-table data-table--compact', style: 'table-layout:fixed' }, [el('caption', { class: 'visually-hidden' }, 'Flow and quality measures before and after the change'), el('thead', {}, headRow), el('tbody', {}, [...bodyRows, h.reworkRow])])]), 'measures');
      h.balanced = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px;border-color:var(--violet)' }), [cardTitle('A balanced experiment', 'margin-bottom:0;font-size:15px;color:var(--violet)'), el('p', { style: 'font-size:18px;line-height:1.3' }, `${upper1(RT.balanced)}. When the results disagree with the expected effect, change the explanation, then the process.`)]), 'balanced');
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
      { title: 'A process hypothesis: observation, change, expected effect and what would contradict it', condition: 'share-review', state: 5, note: `Observation: ${RT.observation}. Not “${RT.blame}”, but: ${RT.system}. ${upper1(RT.safety)}. Proposal: ${RT.proposal}. Expected: ${RT.expected}. It is wrong if ${RT.contrary}; side effect to watch: ${RT.side_effect}. Before: done in round ${RT.before.done_round}, queue at most ${RT.before.queue_peak}, ${RT.before.missed_issues} issue found after review. After: round ${RT.after_shared.done_round}, ${RT.after_shared.queue_peak}, ${RT.after_shared.missed_issues}. Simulated teaching values.` },
      { title: 'Faster but shallower: the side effect included', condition: 'faster-shallower', state: 3, principle: true, note: `Faster, shallower review: done in round ${RT.after_rushed.done_round}, queue at most ${RT.after_rushed.queue_peak}, but ${RT.after_rushed.missed_issues} issues found after review; ${RT.after_rushed.rework}, so the last card is done in round ${RT.after_rushed.done_round_with_rework}. ${upper1(RT.balanced)}.` },
    ],
  };

  // =====================================================================
  // PAGE · four measures and their boundaries
  // =====================================================================
  const MEASURES = [
    { id: 'wip', name: 'Work in progress', def: 'Items started but not finished, counted at a moment.', from: 'start', to: 'finish', value: `${B.rows[B4].review_waiting} at the end of round ${B4} (baseline); at most ${LIM.wip_peak} with the limit`, src: 'Kanban Guide' },
    { id: 'throughput', name: 'Throughput', def: 'Items finished per unit of time, counted at the finish line.', from: 'finish', to: 'finish', value: `${B.review_capacity} card per round once review is busy (baseline)`, src: 'Kanban Guide' },
    { id: 'age', name: 'Work item age', def: 'For an item not yet finished: from its start to now.', from: 'start', to: 'now', value: `${LAST} at the end of round ${T_AGE}: ${T_AGE - c8.start} rounds (baseline)`, src: 'Kanban Guide' },
    { id: 'cycle', name: 'Cycle time', def: 'From the declared start to the finish.', from: 'start', to: 'finish', value: `${LAST}: ${c8.cycle_time} rounds (baseline), ${l8.cycle_time} with the limit`, src: 'Kanban Guide' },
    { id: 'lead', name: 'Lead time', def: 'From the request to the finish: the clock of the person who asked.', from: 'request', to: 'finish', value: `${LAST}: ${c8.lead_time} rounds, with or without the limit`, src: 'this lecture' },
  ];
  const measures = {
    kind: 'page', id: 'measures', role: 'page',
    heading: 'Five measures of one board, and where each starts and stops',
    lead: `Each measure has two boundaries, shown on one card's timeline: ${LAST} in the baseline, asked for at 0, started at ${c8.start}, finished at ${c8.finish}.`,
    printRole: 'Measures and their boundaries',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const W = 1500, H = 170;
      const X0 = 90, TW = 140;
      const x = (t) => X0 + t * TW;
      const svg = window.VC.svg(W, H, { label: `The timeline of ${LAST}: asked for, started, finished`, uid: (u) => `measures-${u}` });
      for (let t = 0; t <= 9; t += 1) { svg.appendChild(s('line', { x1: x(t), x2: x(t), y1: 50, y2: 118, stroke: 'var(--line)', 'stroke-width': 1 })); svg.appendChild(text(x(t), 142, String(t), { 'text-anchor': 'middle', style: 'font-size:17px;fill:var(--text-soft)' })); }
      svg.appendChild(text(x(0) - 20, 142, 'round', { 'text-anchor': 'end', style: 'font-size:16px;fill:var(--text-soft)' }));
      svg.appendChild(s('line', { x1: x(0), x2: x(c8.start), y1: 84, y2: 84, stroke: 'var(--text-soft)', 'stroke-width': 3.5, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' }));
      svg.appendChild(s('rect', { x: x(c8.start), y: 70, width: TW, height: 28, rx: 5, fill: 'var(--accent-fill)', stroke: 'var(--accent)', 'stroke-width': 2 }));
      svg.appendChild(s('rect', { x: x(c8.start + 1), y: 70, width: TW * c8.review_wait, height: 28, fill: 'url(#measures-hatch-warn)', stroke: 'var(--warn)', 'stroke-width': 1.5 }));
      svg.appendChild(s('rect', { x: x(c8.finish - 1), y: 70, width: TW, height: 28, rx: 5, fill: 'var(--ok-fill)', stroke: 'var(--ok)', 'stroke-width': 2 }));
      const mark = (t, label, color) => { svg.appendChild(s('line', { x1: x(t), x2: x(t), y1: 56, y2: 112, stroke: color, 'stroke-width': 4 })); svg.appendChild(text(x(t), 44, label, { 'text-anchor': 'middle', style: `font-size:17px;font-weight:700;fill:${color}` })); };
      mark(0, 'asked for', 'var(--text)'); mark(c8.start, 'started', 'var(--accent-strong)'); mark(c8.finish, 'finished', 'var(--ok)');
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
          el('span', { class: 'muted', style: 'font-size:14px' }, m.src === 'this lecture' ? 'the stakeholder clock of this lecture' : `a flow measure of the ${m.src} (S05)`),
        ]), `measure-${m.id}`);
        b.addEventListener('click', () => { body.setAttribute('data-state', String(i + 1)); apply(); });
        return b;
      });
      const grid = el('div', { style: 'display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;width:1540px;align-items:stretch' }, btns);   // left of the presenter corner (x < 1664)
      const note = el('p', { class: 'muted', style: 'font-size:17px;line-height:1.3;max-width:1540px' }, `A timing measure is only meaningful with its two boundaries, and with the waiting it leaves out named. Rounds are teaching units.`);
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
        nowLine.setAttribute('x1', x(T_AGE)); nowLine.setAttribute('x2', x(T_AGE)); nowText.setAttribute('x', x(T_AGE)); nowText.textContent = `now: end of round ${T_AGE}`;
      };
      body.reset = () => { body.setAttribute('data-state', '0'); apply(); };
      apply();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.appendChild(el('p', {}, `${LAST} waited ${c8.ready_wait} rounds in Ready and ${c8.review_wait} rounds for review.`));
      body.appendChild(el('table', { class: 'data-table data-table--compact', style: 'font-size:13px' }, [
        el('thead', {}, el('tr', {}, ['Measure', 'Boundaries', 'On this board', 'Source'].map((t) => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, MEASURES.map((m) => el('tr', {}, [el('td', {}, m.name), el('td', {}, m.def), el('td', {}, m.value), el('td', {}, m.src === 'this lecture' ? 'the stakeholder clock of this lecture' : `${m.src} (S05)`)]))),
      ]));
      body.appendChild(el('p', { style: 'margin-top:8px' }, `A timing measure is only meaningful with its two boundaries, and with the waiting it leaves out named. ${WT.boundary_source}. Rounds are teaching units.`));
    },
  };

  // =====================================================================
  // PAGE · principles and checks
  // =====================================================================
  const CHECKS = [   // plan Section 8, questions 1 to 5, and the answered transfer question (fixtures transfer_checks.w04)
    { q: 'Review processes one item per round. Will doubling implementation necessarily double completion?', a: 'No. Review remains the limiting stage in the stated model.' },
    { q: 'What is the difference between iteration and increment?', a: 'Iteration revisits or refines understanding or a solution; an increment adds usable capability.' },
    { q: 'Why might a risky assumption deserve attention before an easy visible feature?', a: 'Resolving it can prevent later work from relying on a false premise.' },
    { q: 'What should accompany a process improvement claim?', a: 'A baseline, a stated change, a relevant outcome measure, and attention to quality or other side effects.' },
    { q: 'Why can the smallest implementation estimate still be the more expensive choice?', a: 'Waiting, integration, continuing support, exit cost and displaced valuable work can change the lifecycle comparison.' },
    { q: TRANSFER.question, a: TRANSFER.answer },
  ];
  const SCENES = [feedbackBatches, methodsNotRituals, queueAndBottleneck, wipAndTime, estimatesWithAssumptions, riskAndLearning, definitionOfDone, retrospectiveAsTest];
  const principles = {
    kind: 'page', id: 'principles', role: 'page',
    heading: 'Eight principles, six checks',
    lead: 'One principle per scene, then six checks: decide your answer before you open each one.',
    printRole: 'Principles and checks',
    build(body, api) {
      // In record mode a card carries no href (Chrome's link status bubble would print the local deck address on camera); a click
      // or Enter still opens the scene.
      const open = (sc) => () => { location.hash = `#/${sc.id}`; };
      const cardAttrs = (sc) => (api.record
        ? { class: 'principle-card', role: 'link', tabindex: '0', onclick: open(sc), onkeydown: (e) => { if (e.key === 'Enter') open(sc)(); }, style: 'text-decoration:none;color:inherit;padding:10px 16px;cursor:pointer' }
        : { class: 'principle-card', href: `#/${sc.id}`, style: 'text-decoration:none;color:inherit;padding:10px 16px' });
      const cards = el('div', { class: 'principle-grid', style: 'gap:10px' }, SCENES.map((sc, i) => api.cue(el('a', cardAttrs(sc), [
        el('span', { class: 'pc-num' }, `${i + 1} · ${sc.role}`), el('span', { class: 'pc-text' }, sc.principle), el('span', { class: 'pc-short' }, sc.principleShort),
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
      body.appendChild(el('h3', {}, 'Principles'));
      body.appendChild(el('div', { class: 'principle-grid' }, SCENES.map((sc, i) => el('div', { class: 'principle-card' }, [el('span', { class: 'pc-num' }, `${i + 1} · ${sc.role}`), el('span', { class: 'pc-text' }, sc.principle), el('span', { class: 'pc-short' }, `In short: ${sc.principleShort}`), el('span', { class: 'pc-id' }, `${FILE}#/${sc.id}`)]))));
      body.appendChild(el('h3', {}, 'Checks: decide your answer before reading the one below each question'));
      body.appendChild(el('ol', { class: 'print-qa' }, CHECKS.map((c, i) => el('li', {}, [el('span', { class: 'q' }, `${i + 1}. ${c.q}`), el('span', { class: 'a' }, c.a)]))));
    },
  };

  // =====================================================================
  // PAGE · handoff, terminology and sources
  // =====================================================================
  const TERMS = [
    ['Batch', 'Work delivered together at one time; feedback waits for the whole batch.'],
    ['Increment', 'A piece of work that adds usable capability.'],
    ['Iteration', 'A pass that revisits or refines understanding or a solution.'],
    ['Feedback loop', 'Something usable inspected by the people it serves, while a decision can still change.'],
    ['Bottleneck', 'The stage that limits how much the whole system finishes; relieve it and the limit can move.'],
    ['Work in progress (WIP)', 'Items started but not finished.'],
    ['WIP limit', 'An explicit limit on items in progress: it controls admission, not demand.'],
    ['Throughput', 'Items finished per unit of time.'],
    ['Work item age', 'For an unfinished item, the time since it started.'],
    ['Cycle time', 'From the declared start to the finish.'],
    ['Lead time', 'From the request to the finish: the clock of the person who asked.'],
    ['Estimate', 'A conditional statement: a range with its basis, assumptions and the condition for revising it.'],
    ['Cost of delay', 'What is lost while a step waits.'],
    ['Reversibility', 'How costly a decision is to change later.'],
    ['Opportunity cost', 'The value of the work a chosen step displaces.'],
    ['Completion policy', 'What a team agrees “done” needs, in proportion to the risk; in Scrum, the Definition of Done.'],
    ['Blameless review', 'Discussing the system rather than a person, so problems are reported honestly.'],
  ];
  const SOURCES = [
    ['S01', 'IEEE Computer Society, Guide to the Software Engineering Body of Knowledge (SWEBOK V4.0a)', 'https://www.computer.org/education/bodies-of-knowledge/software-engineering'],
    ['S02', 'ACM / IEEE-CS / AAAI, Computer Science Curricula 2023, final report', 'https://csed.acm.org/final-report/'],
    ['S03', 'Manifesto for Agile Software Development, principles', 'https://agilemanifesto.org/principles.html'],
    ['S04', 'Ken Schwaber and Jeff Sutherland, The Scrum Guide (November 2020)', 'https://scrumguides.org/scrum-guide.html'],
    ['S05', 'The Kanban Guide (May 2025 edition)', 'https://kanbanguides.org/the-kanban-guide/2025.5/'],
  ];
  const IN_PRACTICE = 'Boards and queues live in tools such as Jira, GitHub Projects, Linear or Trello, whose reports chart the same work-in-progress, cycle-time and throughput measures this lecture builds by hand.';
  const PRACTICE_YEAR = (String(F.metadata && F.metadata.date).match(/\b(\d{4})\b/) || [])[1];
  if (!PRACTICE_YEAR) throw new Error('fixtures metadata.date carries no year for the dated In practice examples');
  const IN_PRACTICE_TITLE = `In practice · examples from ${PRACTICE_YEAR}`;
  const HANDOFF_QUESTION = 'When one requirement changes, which parts should need to change?';
  const CARRIED = [
    'One prioritized change: changing a booking policy without causing widespread edits.',
    'The board and its measures: where work waits, and which clock a person experiences.',
    `Open decisions: the identity interface (${IDENT.toLowerCase()}), and room closures, still an open need (Week 14).`,
  ];
  const sources = {
    kind: 'page', id: 'sources', role: 'page',
    heading: 'What carries forward, and where to read more',
    lead: 'Next week asks how the design of the code decides what one change costs, and how safe it is.',
    printRole: 'Handoff, terminology, sources',
    build(body, api) {
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-height:0' }, [
        api.cue(el('div', { class: 'handoff', style: 'font-size:27px;padding:18px 24px' }, [el('span', { class: 'muted', style: 'font-size:19px;display:block;margin-bottom:8px;font-family:var(--font-text);font-weight:500' }, 'Week 5 starts from this question:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]), 'handoff'),
        api.cue(el('div', { class: 'card', style: 'padding:14px 18px' }, [cardTitle('Carried forward to Week 5'), el('ul', { style: 'font-size:18px;line-height:1.38;display:flex;flex-direction:column;gap:6px' }, CARRIED.map((t) => el('li', {}, t)))]), 'carried'),
        api.cue(el('div', { class: 'card', style: 'padding:14px 18px' }, [cardTitle(IN_PRACTICE_TITLE), el('p', { style: 'font-size:18px;line-height:1.38' }, IN_PRACTICE)]), 'in-practice'),
      ]);
      const middle = api.cue(el('div', { class: 'card', style: 'min-height:0;padding:14px 18px;align-self:start' }, [cardTitle('Terms used this week'), el('dl', { class: 'term-list', style: 'display:block;column-count:2;column-gap:22px;font-size:15px;line-height:1.24' }, TERMS.map(([t, d]) => el('div', { style: 'break-inside:avoid;margin-bottom:5px' }, [el('dt', {}, t), el('dd', {}, d)])))]), 'terms');
      const right = api.cue(el('div', { class: 'card', style: 'min-height:0;padding:14px 18px;align-self:start' }, [cardTitle('Sources for this lecture'), el('ul', { class: 'source-list', style: 'font-size:17px;gap:8px' }, SOURCES.map(([k, t, u]) => el('li', {}, [el('span', { class: 'key' }, k), el('span', {}, [t, ' ', el(api.record ? 'span' : 'a', api.record ? { class: 'url', style: 'font-size:15px' } : { class: 'url', href: u, style: 'font-size:15px' }, u)])])))]), 'sources');   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:580px minmax(0,1fr) 450px;gap:24px;height:100%;min-height:0' }, [left, middle, right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('div', { class: 'handoff' }, [el('span', { class: 'muted', style: 'display:block;font-size:14px' }, 'Week 5 starts from this question:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]),
          el('h3', {}, 'Carried forward to Week 5'), el('ul', {}, CARRIED.map((t) => el('li', {}, t))),
          el('h3', {}, IN_PRACTICE_TITLE), el('p', {}, IN_PRACTICE),
          el('h3', {}, 'Sources for this lecture'),
          el('ul', { class: 'source-list' }, SOURCES.map(([k, t, u]) => el('li', {}, [el('span', { class: 'key' }, k), el('span', {}, [t, ' ', el('span', { class: 'url' }, u)])]))),
        ]),
        el('div', {}, [el('h3', {}, 'Terms used this week'), el('dl', { class: 'term-list', style: 'display:block;column-count:2;column-gap:18px' }, TERMS.map(([t, d]) => el('div', { style: 'break-inside:avoid' }, [el('dt', {}, t), el('dd', {}, d)])))]),
      ]));
    },
  };

  // =====================================================================
  // DECK
  // =====================================================================
  window.lecture.deck({
    week: 4, file: FILE,
    title: 'Development flow, uncertainty, and engineering decisions',
    question: 'Where is work waiting, and what would actually improve the flow?',
    coverLead: 'Student notes for lecture 4. One small team improves Campus Rooms with eight work cards on one board. Each scene shows a situation, asks you to predict, reveals the mechanism, changes one condition, compares the outcomes and names the principle: feedback batches, coordination approaches, a bottleneck, lead and cycle time, estimates, risk-driven decisions, a completion policy and a process change tested like a hypothesis.',
    coverNote: 'Campus Rooms is a fictional room-booking service; every card, round, count and example value is a teaching example unless a source is named. The board is a deliberately simplified queue model with equal-sized cards: its rounds are teaching units, not a forecast of anyone\'s productivity. The method comparison is simplified; the Scrum Guide (S04) and the Kanban Guide (S05) define each method.',
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
