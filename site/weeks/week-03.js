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
   ===================================================================== */
(function () {
  'use strict';
  const F = window.CAMPUS_ROOMS_FIXTURES;
  const A = F.anchors;
  const { el, s, text, node, person, boundary, arrow, badge, markX, browser, field, status, chip, table } = window.VC;
  const CASE = F.case;
  const ARI = CASE.users[0];   // U-01 Ari
  const BO = CASE.users[1];    // U-02 Bo
  const ROOM = CASE.rooms[0];  // C101
  const ROOM2 = CASE.rooms[1]; // C202
  const BK = CASE.booking;     // B-001, owned by U-01, C101 10:00-11:00, Confirmed
  const FILE = 'week-03.html';
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
  const span = (a, b) => `${a} to ${b}`;
  const BK_TIME = span(BK.start, BK.end);

  // ------------------------------------------------------------------ helpers shared by the scenes
  const reveal = (attrs) => Object.assign({ class: 'rv rv--rise' }, attrs);
  const lower1 = (str) => (/^[A-Z]+-?\d/.test(str) ? str : str.charAt(0).toLowerCase() + str.slice(1));   // an identifier (B-001, R-03, C101) keeps its case
  const upper1 = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  const listAnd = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
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
    { who: ARI.name, q: 'Should I press Reserve again?', model: 'user journey', scene: 1 },
    { who: '', q: `What can happen to ${BK.id} next?`, model: 'state model', scene: 2 },
    { who: 'Room staff', q: `Which room is ${BK.id} for, now that ${ROOM} has a new name?`, model: 'data model', scene: 3 },
    { who: BO.name, q: `May I cancel ${ARI.name}'s booking?`, model: 'decision table', scene: 4 },
    { who: 'Maintainer', q: 'What happened before the timeout?', model: 'sequence diagram', scene: 5 },
  ];
  const BUILDS = 'Five small models of one booking, each drawn for the question it answers, and a check that the models agree with each other and with the rules.';
  const opening = {
    kind: 'page', id: 'opening', role: 'page',
    heading: 'One booking, five questions. Which picture answers which?',
    lead: 'Week 2 ended with a register of rules. Before drawing anything, look at what people actually need to know about one booking.',
    printRole: 'Opening situation',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const screen = browser({ who: `${ARI.name} · ${ARI.id}`, url: 'campus-rooms.example/book', body: [
        el('div', { style: 'display:grid;grid-template-columns:200px minmax(0,1fr);gap:10px' }, [field('Room', ROOM), field('Time', BK_TIME)]),
        el('div', { class: 'status status--wait', role: 'status', style: 'font-size:19px;line-height:1.3;align-items:flex-start' }, [el('span', { class: 'ico', 'aria-hidden': 'true' }, '?'), el('span', {}, UNKNOWN_MSG)]),
      ] });
      screen.body.style.gap = '10px'; screen.body.style.padding = '12px 16px 14px';
      const situation = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:10px;padding:14px 18px' }, [
        cardTitle(`The situation · ${ARI.name} pressed Reserve`, 'margin-bottom:0'), screen,
      ]);
      api.cue(situation, 'situation'); api.cue(screen, 'screen');
      const drawBtn = api.cue(el('button', { type: 'button', class: 'ctl-btn ctl-btn--step', style: 'align-self:flex-start;height:56px;font-size:22px;padding:0 20px' }, 'Draw the whole system'), 'draw');
      // the component view: every box correct, none of them about what Ari needs to know
      const svg = componentSvg((x) => `opening-${x}`, 564);
      const components = el('div', reveal({ class: 'card rv rv--rise', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:6px' }), [
        cardTitle('The whole system, drawn as components', 'margin-bottom:2px'), svg,
        el('p', { style: 'font-size:19px;line-height:1.3' }, [`Every box is right. `, el('b', {}, `None tells ${ARI.name} whether to press Reserve again.`)]),
      ]);
      api.cue(components, 'components'); api.cue(svg, 'component-diagram');
      const question = el('div', reveal({ class: 'rail-card rail-prompt rv rv--rise', style: 'align-self:start' }), [
        el('div', { class: 'rail-eyebrow' }, 'The question of this week'),
        el('p', { class: 'prompt-q' }, 'Which model answers the question we are actually asking?'),
        el('ul', { class: 'prompt-options' }, ['One detailed diagram of every part', 'A model chosen for each question', 'The code: it is the most precise'].map((o, i) => el('li', {}, [el('span', { class: 'opt-key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)), el('span', {}, o)]))),
        el('p', { class: 'rail-note', style: 'margin-top:12px' }, `Keep your answer. Scene 8 asks it twice about ${BK.id}.`),
      ]);
      api.cue(question, 'question');
      const askBtn = api.cue(el('button', reveal({ type: 'button', class: 'ctl-btn ctl-btn--step rv rv--rise', style: 'align-self:flex-start;height:56px;font-size:22px;padding:0 20px' }), `Five questions about ${BK.id}`), 'questions-button');
      const rows = QUESTIONS.map((row, i) => api.cue(el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:7px 0;border-top:1px solid var(--line)' }, [
        el('span', { style: 'font-size:19px;line-height:1.28' }, [row.who ? el('span', { class: 'muted' }, `${row.who}: `) : null, el('b', {}, row.q)]),
        chip(`${row.model} · scene ${row.scene}`, 'accent', { style: 'font-size:16px' }),
      ]), `question-${i + 1}`));
      const five = el('div', reveal({ class: 'card rv rv--rise', style: 'padding:12px 18px;display:flex;flex-direction:column' }), [
        cardTitle(`Five questions about ${BK.id}`, 'margin-bottom:4px'), ...rows,
        el('p', { style: 'font-size:18px;line-height:1.32;color:var(--text-muted);padding-top:8px;border-top:1px solid var(--line)' }, [el('b', { style: 'color:var(--text)' }, 'This lecture builds: '), lower1(BUILDS)]),
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
          el('h3', {}, 'The situation'),
          el('p', {}, `${ARI.name} (${ARI.id}) pressed Reserve for ${ROOM}, ${BK_TIME}. The screen says: “${UNKNOWN_MSG}”`),
          el('h3', {}, 'The whole system, drawn as components'),
          el('p', {}, `${listAnd(JB.component_view)}. Every box is right, and not one of them tells ${ARI.name} whether to press Reserve again.`),
          el('h3', {}, 'The question of this week'),
          el('p', {}, 'Which model answers the question we are actually asking? (A) One detailed diagram of every part. (B) A model chosen for each question. (C) The code: it is the most precise.'),
        ]),
        el('div', {}, [
          el('h3', {}, `Five questions about ${BK.id}`),
          el('ul', {}, QUESTIONS.map((row) => el('li', {}, `${row.who ? `${row.who}: ` : ''}${row.q} → ${row.model} (scene ${row.scene})`))),
          el('h3', {}, 'What this lecture builds'), el('p', {}, BUILDS),
        ]),
      ]));
    },
  };

  // =====================================================================
  // PAGE · recall and outcomes
  // =====================================================================
  const OUTCOMES = [
    'Choose a model suited to a behavior, structure, or interaction question.',
    'Read a state transition with an event, condition, and outcome.',
    'Distinguish a stored booking from a transient interface or request state.',
    'Explain entity identity and relationships without duplicating shared facts.',
    'Locate a contradiction between a requirement, a diagram, and an interface message.',
  ];
  const REGISTER = ['R-01 no overlapping confirmations', 'R-02 duration 30 to 120 minutes', 'R-03 who may cancel', 'R-04 notification is separate', 'R-05 keyboard and status', 'Q-01 search response time'];
  const W2_HANDOFF = 'Does a written rule alone make the sequence of booking, cancellation and failure states understandable?';
  const UI_ONLY = SM.ui_states.filter((x) => !SM.stored_states.includes(x));   // Draft, Submitting, Rejected, Unknown outcome
  const STATE_SPLIT = `A stored booking is ${SM.stored_states.join(' or ')}. ${listAnd(UI_ONLY)} belong to the request on the screen, and a rejected request never creates a confirmed booking.`;
  const NOTATION = 'Light UML-style drawings, introduced where they are first used: rounded boxes are states, an arrow carries an event and its condition, a lifeline carries numbered messages.';
  const outcomes = {
    kind: 'page', id: 'outcomes', role: 'page',
    heading: 'What you already know, and where this lecture goes',
    lead: 'Which model answers the question we are actually asking?',
    printRole: 'Recall and outcomes',
    build(body, api) {
      const recall = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:10px;padding:14px 20px' }, [
        cardTitle('From Week 2: the register you bring in', 'margin-bottom:2px'),
        el('div', { style: 'display:flex;flex-wrap:wrap;gap:8px' }, REGISTER.map((t) => chip(t, 'accent', { style: 'font-size:17px' }))),
        el('p', { style: 'font-size:20px;line-height:1.35' }, [el('span', { class: 'muted' }, 'Week 2 ended on a question: '), el('i', {}, W2_HANDOFF)]),
        el('p', { style: 'font-size:20px;line-height:1.35' }, 'A rule says what must hold. This week draws how the states, the data and the messages of one booking move, so each rule has a picture you can check it against.'),
      ]);
      api.cue(recall, 'recall');
      const example = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:8px;padding:14px 20px' }, [
        cardTitle('The example this week', 'margin-bottom:2px'),
        el('p', { style: 'font-size:20px;line-height:1.35' }, [el('b', {}, `${ARI.name} ${ARI.id}`), ' and ', el('b', {}, `${BO.name} ${BO.id}`), ` · rooms ${ROOM} and ${ROOM2} · `, el('b', {}, BK.id), `: ${ARI.name}'s booking of ${ROOM}, ${BK_TIME}, ${BK.state}.`]),
        el('p', { style: 'font-size:19px;line-height:1.35;color:var(--text-muted)' }, STATE_SPLIT),
      ]);
      api.cue(example, 'example');
      const notation = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:6px;padding:14px 20px' }, [
        cardTitle('How the drawings work', 'margin-bottom:2px'),
        el('p', { style: 'font-size:19px;line-height:1.35' }, NOTATION),
      ]);
      api.cue(notation, 'notation');
      const list = el('ol', { class: 'outcome-list', 'aria-label': 'By the end of this lecture you can', style: 'gap:10px' }, OUTCOMES.map((o, i) => el('li', { style: 'font-size:22px;padding:10px 14px' }, [el('span', { class: 'n', 'aria-hidden': 'true' }, String(i + 1)), el('span', {}, o)])));
      api.cue(list, 'outcomes');
      const right = el('div', {}, [cardTitle('By the end of this lecture you can'), list]);   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { class: 'page-columns' }, [el('div', { style: 'display:flex;flex-direction:column;gap:14px' }, [recall, example, notation]), right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [el('h3', {}, 'From Week 2: the register you bring in'), el('p', {}, `${REGISTER.join('; ')}. Week 2 ended on a question: ${W2_HANDOFF}`),
          el('h3', {}, 'The example this week'), el('p', {}, `${ARI.name} ${ARI.id} and ${BO.name} ${BO.id}; rooms ${ROOM} and ${ROOM2}; ${BK.id}: ${ARI.name}'s booking of ${ROOM}, ${BK_TIME}, ${BK.state}. ${STATE_SPLIT}`),
          el('h3', {}, 'How the drawings work'), el('p', {}, NOTATION)]),
        el('div', {}, [el('h3', {}, 'By the end of this lecture you can'), el('ol', { class: 'outcome-list' }, OUTCOMES.map((o, i) => el('li', {}, [el('span', { class: 'n' }, String(i + 1)), el('span', {}, o)])))]),
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
    const svg = window.VC.svg(W, H, { label: `Component view of Campus Rooms: ${listAnd(C)}`, uid });
    const k = W / 564;
    const bx = (x) => Math.round(x * k);
    const boxes = {
      [C[0]]: node({ x: bx(6), y: 70, w: bx(126), h: bh, label: C[0] }),
      [C[1]]: node({ x: bx(206), y: 70, w: bx(136), h: bh, label: C[1] }),
      [C[2]]: node({ x: bx(408), y: 6, w: bx(bw), h: bh, label: C[2] }),
      [C[3]]: node({ x: bx(408), y: 70, w: bx(bw), h: bh, label: C[3] }),
      [C[4]]: node({ x: bx(408), y: 134, w: bx(bw), h: bh, label: C[4] }),
      [C[5]]: node({ x: bx(206), y: 134, w: bx(136), h: bh, label: C[5], kind: 'store' }),
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
    heading: `What does ${ARI.name} need to know after pressing Reserve?`,
    lead: 'Follow one person through one ordinary booking before drawing any internal box: the goal, the action, what the screen says and what is still uncertain at each step.',
    principle: 'A user journey exposes information needs that an internal component diagram can miss.',
    principleShort: 'Follow the person first; boxes cannot show what they need.',
    conditions: [
      { id: 'message-shown', baseline: true, label: `Baseline: the screen tells ${ARI.name} each outcome`, short: 'Screen tells',
        states: [
          { prompt: { question: `After pressing Reserve, what does ${ARI.name} need to know?`, options: ['That the request was sent', 'Whether the booking is confirmed', 'Which server handled it'] }, caption: `One person, one ordinary booking: ${ARI.name} wants ${ROOM} from ${BK_TIME}. Step to follow the journey.` },
          { caption: `**${STEPS[0].title}.** The goal is a free room, and the screen says ${ROOM} is free. Still uncertain: someone else can book it first.` },
          { caption: `**${STEPS[1].title}.** ${ARI.name} presses Reserve and sees **${STEPS[1].message}** That means **request sent**, and sent is not confirmed.` },
          { caption: `**${STEPS[2].title}.** The screen says **booking confirmed** with ${BK.id}, and underneath ${BK.id} is stored as ${BK.state}. Nothing about the room is left open.` },
          { caption: `The last step can end three ways: **${OUT[0].label}**, **${OUT[1].label}** or **${OUT[2].label}**. Each message leads to a different next action.` },
          { caption: `The same booking as components: correct boxes, correct arrows, and no place for what ${ARI.name} must be told next. The journey found that need first.` },
          { caption: `The journey asked what ${ARI.name} needs at each step, and the answer became three different messages.`, principle: true },
        ] },
      { id: 'message-missing', label: `Changed: ${BK.id} is stored, no message is shown`, short: 'No message',
        states: [
          { caption: `Same request, same stored result: **${MISS.stored}**. One thing changes: ${MISS.screen}.` },
          { caption: `The system knows **${MISS.stored}**. ${ARI.name} sees no message and thinks **${MISS.belief}**. Same moment, two different pictures.` },
          { caption: `So ${ARI.name} presses Reserve again. The new request overlaps ${BK.id}, and ${SECOND.rule} rejects it: **${SECOND.message}**` },
          { caption: `The duplicate click misleads: ${SECOND.consequence}.` },
          { caption: `One missing message turned a stored booking into a lost room in ${ARI.name}'s mind.`, principle: true },
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
          el('span', { style: 'display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:var(--accent);color:var(--ink-on-light);font-size:17px;font-weight:800' }, String(i + 1)), stp.title,
        ]);
        grid.appendChild(api.cue(head, `step-${i + 1}`));
        return head;
      });
      h.cells = {};
      JB.rows.forEach((label, r) => {
        const key = ROW_KEYS[r];
        grid.appendChild(api.cue(el('div', { style: `display:flex;align-items:center;font-size:17px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--${key === 'stored' ? 'ok' : key === 'message' ? 'accent-strong' : 'text-soft'})` }, label), `row-${key}`));
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
        out: chip(o.label, o.id === 'confirmed' ? 'ok' : o.id === 'rejected' ? 'bad' : 'warn', { style: 'font-size:15px;white-space:normal' }),
        says: el('span', { style: 'font-size:16px;line-height:1.28' }, o.message), stored: el('span', { style: 'font-size:16px' }, o.stored), next: el('span', { style: 'font-size:16px' }, o.next) } }));
      h.outcomes = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'message-shown', style: 'padding:10px 14px' }), [
        cardTitle('The outcome step can end three ways', 'margin-bottom:4px;font-size:18px'),
        table({ captionHidden: `Three outcomes: what the screen says, what is stored, what ${ARI.name} does next`, cls: 'data-table--compact', columns: [{ key: 'out', label: 'Outcome' }, { key: 'says', label: 'The screen says' }, { key: 'stored', label: 'Stored' }, { key: 'next', label: `Next for ${ARI.name}` }], rows: outRows }),
      ]);
      h.outcomes.querySelectorAll('td, th').forEach((c) => { c.style.padding = '5px 8px'; });
      h.outcomes.querySelectorAll('thead th').forEach((c) => { c.style.fontSize = '15px'; });
      h.outcomes.querySelectorAll('tbody tr').forEach((tr, i) => api.cue(tr, `outcome-${OUT[i].id}`));
      api.cue(h.outcomes, 'outcomes');
      h.second = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'message-missing', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:8px' }), [
        cardTitle(`${ARI.name} presses Reserve again`, 'margin-bottom:0;font-size:18px'),
        el('div', { style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'Request: '), SECOND.request]),
        el('div', { style: 'font-size:18px;line-height:1.3' }, [el('b', {}, `${SECOND.rule}: `), SECOND.result]),
        el('div', { class: 'status status--bad', role: 'status', style: 'font-size:18px;min-height:0;padding:8px 12px' }, [el('span', { class: 'ico', 'aria-hidden': 'true' }, '✕'), el('span', {}, SECOND.message)]),
        (h.consequence = el('div', reveal({ class: 'callout callout--bad rv rv--rise', 'data-show-from': '3', style: 'font-size:18px;padding:8px 14px;line-height:1.3' }), [el('b', {}, 'The consequence: '), SECOND.consequence + '.'])),
      ]);
      api.cue(h.second, 'second-press'); api.cue(h.consequence, 'consequence');
      const left = el('div', { style: 'display:grid;min-width:0' }, [h.outcomes, h.second]);
      h.outcomes.style.gridArea = '1 / 1'; h.second.style.gridArea = '1 / 1';
      h.components = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'message-shown', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:6px' }), [
        cardTitle('The same booking as components', 'margin-bottom:0;font-size:18px'),
        componentSvg((x) => api.uid(`cmp-${x}`), 470),
        el('p', { style: 'font-size:17px;line-height:1.3' }, [el('b', {}, 'No box says '), `what ${ARI.name} must be told next.`]),
      ]);
      api.cue(h.components, 'components');
      h.pictures = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'message-missing', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:10px' }), [
        cardTitle('Two pictures of the same moment', 'margin-bottom:0;font-size:18px'),
        el('div', { class: 'callout callout--ok', style: 'font-size:18px;padding:8px 14px' }, [el('b', {}, 'The system: '), MISS.stored]),
        el('div', { class: 'callout', style: 'font-size:18px;padding:8px 14px' }, [el('b', {}, `${ARI.name}: `), `“${upper1(MISS.belief)}?”`]),
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
          let value = stp[key];
          let kind = null;
          if (!base && i === 2) {
            if (key === 'message') { value = MISS.screen; kind = 'none'; }
            if (key === 'stored') value = MISS.stored;
            if (key === 'uncertain') value = `${ARI.name} cannot tell: ${MISS.belief}`;
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
      { title: 'One journey: the message and the stored state on separate rows, and the three outcomes', condition: 'message-shown', state: 5, note: `Choose a room, submit the request, observe the outcome. “${STEPS[1].message}” means the request was sent, not that the booking is confirmed. The outcome step ends as ${OUT.map((o) => `${o.label} (next: ${o.next})`).join('; ')}. A component view of ${listAnd(JB.component_view)} is correct and still has no place for what ${ARI.name} must be told.` },
      { title: 'The same journey when the confirmation message is missing', condition: 'message-missing', state: 3, principle: true, note: `${upper1(MISS.label)}. The system knows ${MISS.stored}; ${ARI.name} thinks “${MISS.belief}”. Pressing Reserve again sends the same request, which ${SECOND.rule} rejects because it overlaps ${BK.id}: “${SECOND.message}” ${upper1(SECOND.consequence)}.` },
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
    heading: 'The screen says Unknown. Is the booking unknown too?',
    lead: 'Two state models, kept apart on purpose: the request as the screen sees it, and the booking as it is stored. A marker moves only when a valid event arrives.',
    principle: 'State models clarify which changes are possible, what triggers them, and which facts are actually known.',
    principleShort: 'Show what can change, what triggers it, and what is known.',
    conditions: [
      { id: 'from-draft', baseline: true, label: 'Baseline: one request from Draft to its outcome', short: 'From Draft',
        states: [
          { prompt: { question: `${ARI.name} is in Draft and presses Submit. What does Submit mean?`, options: ['The booking now exists', 'A request is on its way', `The room is held for ${ARI.name}`] }, caption: `Top: the request as ${ARI.name}'s screen sees it. Bottom: the booking as it is stored. The marker sits on **${UIS[0]}**; nothing is stored yet.` },
          { caption: `**${UIT[0].event}** is an event, so the marker moves to **${UIS[1]}**: the request is on its way and nothing is decided. The store has no booking yet.` },
          { caption: `Three events can leave ${UIS[1]}: **${evt('Confirmed')}**, **${evt('Rejected')}** and **${evt('Unknown outcome')}**. Each one leads to its own state.` },
          { caption: `Rejected: the marker moves to **Rejected**, and the store stays empty. A rejected request never creates a confirmed booking.` },
          { caption: `Accepted: the service decided and stored **${BK.id}**. The booking gets its first stored state, **Confirmed**, and the screen's Confirmed reports it.` },
          { caption: `Now the response is lost. The screen can only show **Unknown outcome**, while the stored booking is still **Confirmed**. A timeout is missing information.` },
          { caption: `Read one transition: the **event** is ${STT.event}, the **condition** is ${STT.condition}, the **outcome** is ${STT.to}. Only the stored model changes.` },
          { caption: 'Two models, two markers, and each marker moves only on a valid event.', principle: true },
        ] },
      { id: 'already-cancelled', label: `Changed: ${BK.id} is Cancelled; Cancel arrives again`, short: 'Cancel again',
        states: [
          { prompt: { question: `${BK.id} is already Cancelled, and Cancel arrives again. What should happen?`, options: ['Cancel it a second time', 'Answer: already cancelled', 'Restore it to Confirmed'] }, caption: `Same two models. The stored marker sits on **${SM.repeated_cancel.from}**, and a second ${SM.repeated_cancel.event} arrives for ${BK.id}.` },
          { caption: `The defined answer is a **stable repeated response**: already cancelled, no transition. The accident would be ${lower1(SM.accidental_repeat.split(': ')[0])}: two cancellations, a second notice.` },
          { caption: `Two arrows are missing on purpose: **${SM.absent_transitions[0].replace('->', '→')}** and **${SM.absent_transitions[1].replace('->', '→')}**. What a model leaves out is a decision too.` },
          { caption: `Two kinds of question: **${lower1(SAFETY.q)}** is about safety, **${lower1(PROGRESS.q)}** is about progress. The arrows answer the first for the model only.` },
          { caption: 'A repeated event, two missing arrows and two kinds of question, all readable in one small model.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:930px minmax(0,1fr);gap:20px' });
      const W = 930, H = 680;
      const svg = window.VC.svg(W, H, { label: 'Two state models: the request as the screen sees it, and the stored booking', uid: (x) => api.uid(x) });
      // lanes
      const lane = (y, hgt, title, color) => {
        const g = s('g', {});
        g.appendChild(s('rect', { x: 1, y, width: W - 2, height: hgt, rx: 18, ry: 18, fill: 'rgba(124,196,255,0.035)', stroke: 'var(--line)', 'stroke-width': 1.5 }));
        g.appendChild(text(22, y + 32, title, { style: `font-size:16px;font-weight:700;letter-spacing:0.08em;fill:var(--${color})` }));
        svg.appendChild(g);
        return g;
      };
      h.topLane = lane(0, 318, `REQUEST · AS ${ARI.name.toUpperCase()}'S SCREEN SEES IT`, 'accent-strong');
      h.topLane.classList.add('dm');
      lane(338, 342, 'BOOKING · AS IT IS STORED', 'ok');
      // request states
      const box = {};
      box.Draft = stateNode(20, 140, 150, UIS[0]);
      box.Submitting = stateNode(260, 140, 190, UIS[1]);
      box.Rejected = stateNode(640, 40, 240, 'Rejected');
      box.Unknown = stateNode(640, 140, 240, 'Unknown outcome');
      box.UIConfirmed = stateNode(640, 240, 240, 'Confirmed');
      // stored states
      h.start = s('circle', { cx: 60, cy: 520, r: 12, fill: 'var(--text)' });
      box.Confirmed = stateNode(200, 489, 200, SM.stored_states[0]);
      box.Cancelled = stateNode(640, 489, 220, SM.stored_states[1]);
      Object.entries(box).forEach(([k, b]) => { svg.appendChild(b); api.cue(b, `state-${k.toLowerCase()}`); });
      svg.appendChild(h.start); api.cue(h.start, 'start');
      [box.Draft, box.Submitting, box.Rejected, box.Unknown, box.UIConfirmed].forEach((b) => h.topLane.appendChild(b));
      // request transitions
      h.aSubmit = arrow(svg, { from: { x: 170, y: 171 }, to: { x: 260, y: 171 }, kind: 'accent', label: UIT[0].event });
      h.aRejected = arrow(svg, { from: { x: 450, y: 165 }, to: { x: 640, y: 76 }, kind: 'default', label: evt('Rejected'), labelDy: -14, labelDx: -34 });
      h.aUnknown = arrow(svg, { from: { x: 450, y: 171 }, to: { x: 640, y: 171 }, kind: 'default', label: ['response lost', 'or timeout'], labelDy: -12 });
      h.aAccepted = arrow(svg, { from: { x: 450, y: 177 }, to: { x: 640, y: 266 }, kind: 'default', label: evt('Confirmed'), labelDy: 34, labelDx: -34 });
      [h.aSubmit, h.aRejected, h.aUnknown, h.aAccepted].forEach((a) => h.topLane.appendChild(a));
      api.cue(h.aSubmit, 'event-submit'); api.cue(h.aRejected, 'event-rejected'); api.cue(h.aUnknown, 'event-lost'); api.cue(h.aAccepted, 'event-accepted');
      // stored transitions
      h.aStored = arrow(svg, { from: { x: 72, y: 520 }, to: { x: 200, y: 520 }, kind: 'ok', label: ['decided', 'and stored'], labelDy: -44 });
      h.aCancel = arrow(svg, { from: { x: 400, y: 520 }, to: { x: 640, y: 520 }, kind: 'ok', label: `${STT.event} [${STT.condition}]` });
      api.cue(h.aStored, 'event-stored'); api.cue(h.aCancel, 'event-cancel');
      // the screen's Confirmed reports the stored booking
      h.reports = arrow(svg, { from: { x: 690, y: 302 }, to: { x: 340, y: 489 }, kind: 'accent', dashed: true, label: `reports ${BK.id}`, labelDy: -6 });
      api.cue(h.reports, 'reports');
      h.nothing = badge({ x: 136, y: 612, label: 'nothing stored', kind: 'warn' });
      h.bid = badge({ x: 300, y: 590, label: BK.id, kind: 'ok' });
      svg.append(h.nothing, h.bid); api.cue(h.nothing, 'nothing-stored'); api.cue(h.bid, 'booking-id');
      // changed condition: the repeated Cancel, the accident, the absent arrows
      h.loop = arrow(svg, { from: { x: 800, y: 489 }, via: [{ x: 800, y: 432 }, { x: 912, y: 432 }, { x: 912, y: 520 }], to: { x: 860, y: 520 }, kind: 'violet', label: 'Cancel: already cancelled', labelDy: -14, labelDx: -96 });
      api.cue(h.loop, 'repeated-cancel');
      h.ghost = s('g', {});
      h.ghost.appendChild(s('rect', { x: 640, y: 604, width: 220, height: 52, rx: 26, ry: 26, fill: 'var(--bad-fill)', stroke: 'var(--bad)', 'stroke-width': 2, 'stroke-dasharray': '8 6' }));
      h.ghost.appendChild(text(750, 637, 'second cancellation', { 'text-anchor': 'middle', style: 'font-size:19px;fill:var(--bad)' }));
      const ga = arrow(svg, { from: { x: 750, y: 551 }, to: { x: 750, y: 604 }, kind: 'bad', dashed: true });
      h.ghost.appendChild(ga); h.ghost.appendChild(markX(750, 578, 11));
      svg.appendChild(h.ghost); api.cue(h.ghost, 'accidental-repeat');
      h.absentStored = arrow(svg, { from: { x: 640, y: 540 }, to: { x: 400, y: 540 }, kind: 'bad', dashed: true, bend: -46, label: 'absent on purpose', labelDy: 40 });
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
        const g = window.VC.svg(44, 26, { label: kind, uid: (x) => api.uid(`lg-${kind}-${x}`) });
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
        cardTitle('How to read it', 'margin-bottom:2px;font-size:17px'),
        lg('state', 'a state'), lg('event', 'event [condition]'), lg('current', 'current state'), lg('start', 'start: nothing yet'), lg('absent', 'absent on purpose'),
      ]);
      api.cue(legendCard, 'legend');
      const note = (name, from, until, cond, children, extra) => {
        const n = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': cond, 'data-show-from': String(from), 'data-show-until': String(until), style: `padding:12px 14px;display:flex;flex-direction:column;gap:8px;grid-area:1 / 1;${extra || ''}` }), children);
        return api.cue(n, name);
      };
      h.noteLost = note('note-timeout', 5, 5, 'from-draft', [
        cardTitle('A timeout is missing information', 'margin-bottom:0;font-size:17px;color:var(--warn)'),
        el('p', { style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'Screen: '), 'Unknown outcome']),
        el('p', { style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'Store: '), `${BK.id} Confirmed`]),
        el('p', { style: 'font-size:17px;line-height:1.3;color:var(--text-muted)' }, `${upper1(SM.note)}.`),
      ], 'border-color:var(--warn)');
      h.noteTransition = note('note-transition', 6, 7, 'from-draft', [
        cardTitle('One transition, read aloud', 'margin-bottom:0;font-size:17px'),
        el('p', { style: 'font-size:18px;line-height:1.35' }, [el('b', {}, 'Event: '), STT.event]),
        el('p', { style: 'font-size:18px;line-height:1.35' }, [el('b', {}, 'Condition: '), STT.condition]),
        el('p', { style: 'font-size:18px;line-height:1.35' }, [el('b', {}, 'Outcome: '), `${STT.from} → ${STT.to}`]),
      ]);
      h.noteRepeat = note('note-repeat', 1, 2, 'already-cancelled', [
        cardTitle(`${SM.repeated_cancel.event}, again`, 'margin-bottom:0;font-size:17px'),
        el('div', { class: 'callout callout--ok', style: 'font-size:17px;padding:6px 12px;line-height:1.3' }, [el('b', {}, 'Defined: '), `“Already cancelled. Nothing changed.”`]),
        el('div', { class: 'callout callout--bad', style: 'font-size:17px;padding:6px 12px;line-height:1.3' }, [el('b', {}, 'Accident: '), SM.accidental_repeat.split(': ')[1] + '.']),
      ]);
      h.noteQuestions = note('note-questions', 3, 4, 'already-cancelled', [
        el('div', { style: 'display:flex;flex-direction:column;gap:4px' }, [
          chip(SAFETY.name, 'ok', { style: 'font-size:15px;align-self:flex-start' }),
          el('p', { style: 'font-size:17px;line-height:1.28' }, [el('b', {}, SAFETY.q), ` ${SAFETY.example}.`]),
          el('p', { class: 'muted', style: 'font-size:16px;line-height:1.28' }, 'The model: no arrow leads back. The code needs its own check.'),
        ]),
        el('div', { style: 'display:flex;flex-direction:column;gap:4px;border-top:1px solid var(--line);padding-top:8px' }, [
          chip(PROGRESS.name, 'violet', { style: 'font-size:15px;align-self:flex-start' }),
          el('p', { style: 'font-size:17px;line-height:1.28' }, [el('b', {}, PROGRESS.q), ` ${PROGRESS.example}.`]),
          el('p', { class: 'muted', style: 'font-size:16px;line-height:1.28' }, 'The arrows allow it; they do not make it happen. It needs a status check and a recovery path.'),
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
      { title: 'Two state models: the three ways out of Submitting, and a lost response', condition: 'from-draft', state: 5, note: `The request model: ${UIT.map((t) => `${t.from} → ${t.to} on “${t.event}”`).join('; ')}. The stored model: an accepted request creates ${BK.id} Confirmed; a rejected request stores nothing. When the response is lost, the screen shows Unknown outcome while the stored booking is still Confirmed. A timeout is missing information: the booking can exist while the screen does not know it, and ${SM.note}.` },
      { title: 'One stored transition: event, condition, outcome', condition: 'from-draft', state: 6, note: `Event ${STT.event}, condition ${STT.condition}, outcome ${STT.from} → ${STT.to}. Only the stored model changes; the request model belongs to the screen.` },
      { title: 'Cancel again, the arrows left out on purpose, and two kinds of question', condition: 'already-cancelled', state: 3, principle: true, note: `A second Cancel for a cancelled booking gets the defined answer “Already cancelled. Nothing changed.”, with no transition. The accident would be ${SM.accidental_repeat}. Absent on purpose: ${SM.absent_transitions.map((x) => x.replace('->', '→')).join(', ')}. ${upper1(SAFETY.name)}: ${SAFETY.q} (${SAFETY.example}). ${upper1(PROGRESS.name)}: ${PROGRESS.q} (${PROGRESS.example}). Arrows show what is allowed; whether the code keeps to them, and whether pending work finishes, needs checks and a recovery path of their own.` },
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
    heading: 'When a room changes, which copy of its facts is right?',
    lead: `${RB[0].id} and ${RB[1].id} each copied the capacity of ${ROOM}. Then the room changes. Predict what each record says, then give the room one identity.`,
    principle: 'Model identity and the meaning of a fact before deciding where to store it.',
    principleShort: 'Decide what a fact means before deciding where it lives.',
    conditions: [
      { id: 'copied-facts', baseline: true, label: "Baseline: each booking copies the room's facts", short: 'Copied facts',
        states: [
          { prompt: { question: `${ROOM}'s capacity changes from ${CAP0} to ${CAP1}. What do ${RB[0].id} and ${RB[1].id} say?`, options: [`Both say ${CAP1}: they follow the room`, `Both still say ${CAP0}`, `Only the newer one says ${CAP1}`] }, caption: `Two bookings for ${ROOM}. When each was made, it copied the room's capacity into its own record: **${CAP0}**.` },
          { caption: `The room changes to **${CAP1}**. Both copies still say **${CAP0}**: two records now disagree with the room, and neither knows which value is right.` },
          { caption: `Give the room one identity, **${ROOM}**. Each booking keeps only **room_id ${ROOM}** and reads the capacity from the room. One fact, one place: nothing can disagree.` },
          { caption: 'The same idea as a data model: three entities, **User**, **Room** and **Booking**. A booking refers to its owner and to its room by identifier.' },
          { caption: `Read the lines: a booking belongs to **one** user and **one** room; a user or a room can have **many** bookings over time. ${ROOM} already has two.` },
          { caption: 'The capacity is a current fact about the room, so it lives with the room.', principle: true },
        ] },
      { id: 'rename', label: `Changed: ${ROOM} gets a new name; its ID stays`, short: 'Rename',
        states: [
          { caption: `${ROOM}'s display name changes from **${RN.display_name_before}** to **${RN.display_name_after}**. Its identifier stays **${ROOM}**.` },
          { caption: `A booking that stored the room's name now finds **${ID.name_match.lookup_after_rename}**. A booking that stored **${ROOM}** still finds its room, under the new name.` },
          { caption: `But the receipt of ${SNAP.booking} keeps **${SNAP.display_name_at_booking}** on purpose: it must show what ${ARI.name} saw. That copy is history, labeled as history.` },
          { caption: `**Well-formed** is not **exists**: ${IDX[1].ref} has the right shape and names no room. References that always point at a real room are **referential integrity**.` },
          { caption: 'A current fact lives in one place; a historical fact is copied on purpose.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:600px minmax(0,1fr);gap:20px' });
      // ---------------------------------------------------------------- left: the records
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' });
      h.capValue = el('span', {}, String(CAP0));
      h.nameValue = el('span', {}, RN.display_name_before);
      h.room = el('div', { class: 'card fx', style: 'padding:10px 16px;border-left:5px solid var(--accent)' }, [
        el('div', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:4px' }, [cardTitle(`Room ${ROOM}`, 'margin:0'), (h.sameId = chip('same identifier', 'ok', { class: 'rv', style: 'font-size:15px' }))]),
        recordLine('id', ROOM), recordLine('display_name', h.nameValue), recordLine('capacity', h.capValue),
      ]);
      api.cue(h.room, 'room');
      h.records = RB.map((r, i) => {
        const copy = recordLine('capacity (copy)', el('span', {}, [String(CAP0), ' ', (el('span', { class: 'rv', style: 'color:var(--bad);font-weight:700;margin-left:6px' }, '✕ disagrees with the room'))]));
        const derived = recordLine('capacity', el('span', { style: 'color:var(--ok)' }, `read from ${ROOM}: ${CAP1}`));
        const card = el('div', { class: 'card fx', 'data-cond': 'copied-facts', style: 'padding:10px 16px' }, [
          el('div', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:4px' }, [cardTitle(`Booking ${r.id}`, 'margin:0'), chip(r.state, 'ok', { style: 'font-size:15px' })]),
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
        api.cue(refCard('Refers by name', `room = "${ID.name_match.stored_reference}"`, ID.name_match.lookup_after_rename, false), 'by-name'),
        api.cue(refCard('Refers by identifier', `room_id = ${ROOM}`, `${ROOM} · ${RN.display_name_after}`, true), 'by-id'),
      ]);
      h.receipt = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'rename', 'data-show-from': '2', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:6px;border-left:5px solid var(--violet)' }), [
        el('div', { style: 'display:flex;align-items:center;gap:10px' }, [cardTitle(`Receipt · ${SNAP.booking}`, 'margin:0;font-size:17px'), chip('historical snapshot', 'violet', { style: 'font-size:15px' })]),
        el('div', { style: 'font-size:19px;font-weight:600' }, `${SNAP.display_name_at_booking} · ${ROOM} · ${BK_TIME}`),
        el('div', { class: 'muted', style: 'font-size:16px;line-height:1.3' }, `${upper1(SNAP.reason)}.`),
      ]);
      api.cue(h.receipt, 'receipt');
      left.append(h.room, ...h.records, h.refs, h.receipt);
      wrap.appendChild(left);
      // ---------------------------------------------------------------- right: the data model
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0;min-height:0' });
      const W = 644, H = 432;
      const svg = window.VC.svg(W, H, { label: 'Data model: User, Room and Booking entities; a booking refers to one user and one room', uid: (x) => api.uid(x) });
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
      h.user = entity(16, 12, 250, 'User', ENT.User);
      h.roomE = entity(378, 12, 250, 'Room', ENT.Room);
      h.booking = entity(186, 206, 272, 'Booking', ENT.Booking);
      api.cue(h.user, 'entity-user'); api.cue(h.roomE, 'entity-room'); api.cue(h.booking, 'entity-booking');
      const rel = (fromY, toX, toY, side, cardinality) => {
        const bx = side === 'left' ? 186 : 458;
        const g = s('g', { class: 'rv' });
        g.appendChild(s('path', { d: `M${bx},${fromY} L${toX},${fromY} L${toX},${toY}`, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.6 }));
        g.appendChild(s('circle', { cx: toX, cy: toY + 5, r: 5, fill: 'var(--accent)' }));
        const lab = text(side === 'left' ? toX - 12 : toX + 12, (fromY + toY) / 2 + 8, cardinality, { class: 'rv', 'text-anchor': side === 'left' ? 'end' : 'start', style: 'font-size:18px;font-weight:700;fill:var(--accent-strong)' });
        g.appendChild(lab); g.card = lab;
        g.appendChild(text(side === 'left' ? toX + 5 : toX - 5, fromY - 8, 'many', { class: 'rv card-n', 'text-anchor': side === 'left' ? 'start' : 'end', style: 'font-size:15px;fill:var(--text-muted)' }));
        g.appendChild(text(side === 'left' ? toX + 8 : toX - 8, toY + 26, 'one', { class: 'rv card-n', 'text-anchor': side === 'left' ? 'start' : 'end', style: 'font-size:16px;fill:var(--text-muted)' }));
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
        cardTitle('The instances', 'margin-bottom:2px;font-size:17px'),
        el('div', { style: 'font-size:18px;line-height:1.35' }, `${ARI.id} ${ARI.name} · ${BO.id} ${BO.name} · ${ROOM} ${RN.display_name_before}`),
        ...RB.map((r) => el('div', { style: 'font-size:18px;line-height:1.35;font-family:var(--font-mono)' }, `${r.id} → owner ${r.owner_id}, room ${r.room_id}`)),
        el('div', { class: 'muted', style: 'font-size:17px;line-height:1.3' }, `One room, two bookings; each booking has one owner and one room.`),
      ]);
      api.cue(h.instances, 'instances');
      const checkRows = Object.entries(CHECKQ).map(([name, q], i) => {
        const ex = i === 0 ? IDX.map((x) => [x.ref, x.well_formed]) : i === 1 ? IDX.filter((x) => x.well_formed).map((x) => [x.ref, x.exists]) : null;
        return el('div', { style: `display:grid;grid-template-columns:200px minmax(0,1fr);gap:10px;align-items:baseline;padding:4px 0;${i ? 'border-top:1px solid var(--line);' : ''}` }, [
          el('span', { style: `font-size:16px;font-weight:700;color:var(--${i === 1 ? 'warn' : 'text'})` }, upper1(name)),
          el('span', { style: 'font-size:16px;line-height:1.28' }, [q, ex ? el('span', { style: 'display:block;font-family:var(--font-mono);font-size:15px;margin-top:2px' }, ex.map(([ref, ok], k) => [k ? ' · ' : '', ref, ' ', tick(ok)]).flat()) : null]),
        ]);
      });
      h.checks = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'rename', 'data-show-from': '3', style: 'padding:8px 14px;display:flex;flex-direction:column;grid-area:1 / 1' }), [
        cardTitle('Four checks, four questions', 'margin-bottom:2px;font-size:16px'), ...checkRows,
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
      h.nameValue.textContent = base ? RN.display_name_before : RN.display_name_after;
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
      { title: 'Copied capacity: two records disagree with the room', condition: 'copied-facts', state: 1, note: `${RB[0].id} and ${RB[1].id} each copied the capacity of ${ROOM} (${CAP0}). When the room changes to ${CAP1}, both copies still say ${CAP0}: the ${ID.copied_capacity_defect.result}.` },
      { title: 'One identity per room: entities, references and many-to-one relationships', condition: 'copied-facts', state: 4, note: `User (${ENT.User.join(', ')}), Room (${ENT.Room.join(', ')}), Booking (${ENT.Booking.join(', ')}). A booking refers to its owner and room by identifier: ${ID.relationships.map((r) => `${r.from} to ${r.to}, ${r.cardinality}`).join('; ')}. The capacity is read from the room, so there is one current value. An entity in this model does not have to become exactly one class or one table.` },
      { title: 'A new name, the same identifier, a deliberate snapshot and four different checks', condition: 'rename', state: 3, principle: true, note: `${ROOM} is renamed from ${RN.display_name_before} to ${RN.display_name_after}. A reference by name finds ${ID.name_match.lookup_after_rename}; a reference by ${ROOM} still finds the room. The receipt of ${SNAP.booking} keeps “${SNAP.display_name_at_booking}” because ${SNAP.reason}. Identifier shape (${ID.identifier_shape}) and existence are different checks: ${IDX.map((x) => `${x.ref} ${x.well_formed ? 'well-formed' : 'malformed'}, ${x.exists ? 'exists' : 'no such room'}`).join('; ')}. The booking rules (R-01) and the permission (R-03) are two more separate questions.` },
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
  const whoAsks = (r) => (r.requester == null ? 'nobody signed in' : r.requester.startsWith('U-') ? `${nameOf(r.requester)} · ${r.requester}` : r.requester);
  const decisionChip = (d) => chip(d === 'repeated-response' ? 'repeated response' : d, d === 'allowed' ? 'ok' : d === 'denied' ? 'bad' : 'violet', { style: 'font-size:16px' });
  const yes = (v) => (v == null ? el('span', { class: 'muted' }, '·') : tick(v));
  const rowCells = (r, i) => ({
    n: el('b', {}, i), who: el('span', { style: 'white-space:nowrap' }, whoAsks(r)), auth: yes(r.authenticated),
    own: yes(r.requester == null ? null : r.requester === r.owner), state: el('span', { style: `color:var(--${r.state === 'Confirmed' ? 'text' : 'violet'});font-weight:600` }, r.state),
    future: el('span', { style: 'white-space:nowrap' }, [yes(r.now < r.start), el('span', { class: 'muted', style: 'font-size:15px;margin-left:6px' }, `now ${r.now}, start ${r.start}`)]),
    decision: decisionChip(r.expected), reason: el('span', { class: 'muted', style: 'font-size:16px;line-height:1.25' }, r.reason ? upper1(r.reason.replace('stable explicitly defined response; ', 'stable, defined answer; ')) : 'Every condition holds'),
  });
  const DT_COLUMNS = [{ key: 'n', label: '#' }, { key: 'who', label: 'Who asks' }, { key: 'auth', label: DT.conditions[0].label }, { key: 'own', label: DT.conditions[1].label }, { key: 'state', label: DT.conditions[2].label }, { key: 'future', label: DT.conditions[3].label }, { key: 'decision', label: 'Decision' }, { key: 'reason', label: 'Why' }];
  const decisionTable = {
    id: 'decision-table', role: 'bridge',
    heading: 'May any signed-in member cancel any booking?',
    lead: `${DT.rule} in words, then as rows: signed in, own booking, booking state and start time, one combination per row. The teaching clock says ${CROW[0].now}.`,
    principle: 'A decision table makes combinations and missing cases easier to inspect.',
    principleShort: 'Rows show every combination, and the gaps between them.',
    conditions: [
      { id: 'r03-rows', baseline: true, label: `Baseline: ${DT.rule} written as rows`, short: `${DT.rule} rows`,
        states: [
          { prompt: { question: `${ARI.name} and ${BO.name} are both signed in. May each of them cancel ${BK.id}?`, options: ['Both: any signed-in member', `Only ${ARI.name}, the owner, before ${BK.start}`, 'Neither: only staff cancel'] }, caption: `**${BK.id}**: ${ROOM}, ${BK_TIME}, owned by ${ARI.name}, ${BK.state}. The teaching clock says **${CROW[0].now}**.` },
          { caption: `**${DT.rule}**: ${lower1(DT.rule_text)} Four conditions hide in that sentence: signed in, own, confirmed and starting after now.` },
          { caption: `Row one: ${ARI.name}, signed in, own booking, ${CROW[0].state}, ${CROW[0].now} before ${CROW[0].start}. Every condition holds: **allowed**.` },
          { caption: `Row two changes one cell: ${BO.name} asks. ${BO.name} is signed in, but it is not ${BO.name}'s booking: **denied**, not the owner.` },
          { caption: `At exactly **${CROW[2].now}** the start is not later than now: **denied**. With nobody signed in: **denied** as well.` },
          { caption: `${BK.id} already Cancelled: neither allowed nor denied, but the **stable repeated response** from scene 2, with no second transition.` },
          { caption: `Now look for a combination nobody wrote: ${ARI.name}'s own booking at **${GAP.now}**, after it ended. The gap is visible; ${DT.rule} answers it: **denied**.` },
          { caption: `${DT.rule} allows exactly one combination; every other row says why not.`, principle: true },
        ] },
      { id: 'only-requester', label: 'Changed: only who asks changes; all else fixed', short: 'Who asks',
        states: [
          { caption: `Hold everything fixed: signed in, ${BK.state}, ${CROW[0].now} before a ${CROW[0].start} start. Change only **who asks**.` },
          { caption: `${ARI.name}, the owner: **allowed**. The condition that decides it is **own booking**.` },
          { caption: `${BO.name}: **denied**. Same sign-in, same booking, same time; the words **their own** in ${DT.rule} are responsible.` },
          { caption: `Room staff, signed in: **denied** under ${DT.rule}. A staff override would be a new rule for the stakeholders to decide, not an exception hidden in code.` },
          { caption: 'One cell changed, one decision changed, and one phrase of the rule explains it.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:14px' });
      // the rule, with its four conditions marked
      const parts = DT.rule_text.split(/(authenticated|their own|future|confirmed)/);
      h.marks = [];
      const sentence = el('p', { style: 'font-size:26px;font-weight:600;font-family:var(--font-display);line-height:1.3' }, parts.map((p) => {
        if (!/^(authenticated|their own|future|confirmed)$/.test(p)) return p;
        const m = el('span', { class: 'r03-mark', style: 'border-radius:6px;padding:0 4px;transition:background 300ms,box-shadow 300ms' }, p);
        h.marks.push(m); if (p === 'their own') h.ownMark = m;
        return m;
      }));
      h.rule = el('div', { class: 'card fx', style: 'padding:12px 18px;display:flex;align-items:center;gap:18px' }, [
        chip(`Rule ${DT.rule}`, 'warn', { style: 'font-size:18px;flex:0 0 auto' }), sentence,
      ]);
      api.cue(h.rule, 'rule'); api.cue(sentence, 'rule-text');
      wrap.appendChild(h.rule);
      // baseline table
      const baseRows = CROW.map((r, i) => ({ attrs: { class: 'rv', 'data-show-from': String([2, 3, 4, 4, 5][i]), 'data-focus-at': String([2, 3, 4, 4, 5][i]) }, cells: rowCells(r, i + 1) }));
      baseRows.push({ attrs: { class: 'rv', 'data-show-from': '6', 'data-focus-at': '6', style: 'outline:2px dashed var(--warn);outline-offset:-2px' }, cells: Object.assign(rowCells(GAP, '?'), { reason: el('span', { style: 'font-size:16px;line-height:1.25;color:var(--warn)' }, `Missing row: ${GAP.reason}`) }) });
      h.table = table({ captionHidden: `${DT.rule} as a decision table: conditions, decision and reason for each combination`, cls: 'data-table--compact', columns: DT_COLUMNS, rows: baseRows });
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
      h.whoTable = table({ captionHidden: 'Only the requester changes: the decision for each requester', cls: 'data-table--compact', columns: DT_COLUMNS, rows: who.map((r, i) => ({ attrs: { class: 'rv', 'data-show-from': String(i + 1), 'data-focus-at': String(i + 1) }, cells: rowCells(r, i + 1) })) });
      tidy(h.whoTable);
      h.whoTable.querySelectorAll('tbody tr').forEach((tr, i) => api.cue(tr, `who-${['owner', 'other-user', 'staff'][i]}`));
      h.fixed = el('div', { class: 'callout callout--accent', style: 'font-size:18px;padding:8px 14px;margin-bottom:8px' }, [el('b', {}, 'Held fixed: '), `signed in ✓ · ${BK.state} · now ${CROW[0].now}, start ${CROW[0].start} ✓. Only the second column changes.`]);
      h.whoWrap = el('div', { 'data-cond': 'only-requester', style: 'min-height:0' }, [h.fixed, h.whoTable]);
      api.cue(h.whoTable, 'who-table'); api.cue(h.fixed, 'held-fixed');
      wrap.append(h.baseWrap, h.whoWrap);
      // the policy boundary (baseline) and the missing override (changed)
      h.boundary = el('div', reveal({ class: 'callout rv rv--rise', 'data-cond': 'r03-rows', 'data-show-from': '7', style: 'font-size:18px;padding:10px 16px;line-height:1.35' }), [el('b', {}, 'Policy boundary: '), DT.policy_boundary]);
      h.override = el('div', reveal({ class: 'callout callout--bad rv rv--rise', 'data-cond': 'only-requester', 'data-show-from': '3', style: 'font-size:18px;padding:10px 16px;line-height:1.35' }), [el('b', {}, 'No staff override: '), `${upper1(STAFF.reason)}. Campus staff have no unstated right to cancel every booking.`]);
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
      { title: `${DT.rule} as rows: every core combination, and the gap`, condition: 'r03-rows', state: 7, principle: true, note: `${DT.rule}: ${DT.rule_text} Conditions: ${DT.conditions.map((c) => c.label).join(', ')}. Rows: ${[...CROW, GAP].map((r) => `${whoAsks(r)}, ${r.state}, now ${r.now}: ${r.expected.replace('-', ' ')}`).join('; ')}. Policy boundary: ${DT.policy_boundary}` },
      { title: 'Only the requester changes', condition: 'only-requester', state: 3, note: `Signed in, ${BK.state}, now ${CROW[0].now} before start ${CROW[0].start}: ${who3Text()}. The phrase “their own” in ${DT.rule} decides it; there is no staff override.` },
    ],
  };
  function who3Text() { return [CROW[0], CROW[1], STAFF].map((r) => `${whoAsks(r)} ${r.expected}`).join(', '); }

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
    heading: 'What must happen before the screen may say Confirmed?',
    lead: 'Four participants and numbered messages. Follow one successful booking, then lose one message and compare. The numbers give the order; the vertical distance is not time.',
    principle: 'An interaction history explains why two apparently similar user symptoms can require different recovery actions.',
    principleShort: 'Same symptom, different history, different fix.',
    conditions: [
      { id: 'success', baseline: true, label: 'Baseline: one booking succeeds, message by message', short: 'Success',
        states: [
          { prompt: { question: `What must happen before ${ARI.name}'s screen may say Confirmed?`, options: ['The request reaches the service', 'The booking is decided and stored', 'The confirmation email is sent'] }, caption: 'Four participants, one lifeline each; time runs down the page. Step to send the messages one at a time.' },
          { caption: `**1 ${SUCC[0].message}**: the browser sends ${ARI.name}'s request to the Booking Service. Nothing is decided yet.` },
          { caption: `**2 ${SUCC[1].message}**: the service checks the request itself, such as the duration rule R-02, before it asks the store.` },
          { caption: `**3 ${SUCC[2].message}**: the authoritative store makes the no-overlap decision and stores the booking in one step.` },
          { caption: `**4 ${SUCC[3].message}**: the store answers. Only now does a confirmed booking exist.` },
          { caption: `**5 ${SUCC[4].message}**: now the screen may say Confirmed, because messages three and four came first. That answers the question.` },
          { caption: '**6 record pending notification**, after the response: separate work with its own state (R-04). The confirmation never waits for the email.' },
          { caption: 'The numbers give the order. The distance between arrows is not time: message 6 may run much later.', principle: true },
        ] },
      { id: 'lost-response', label: `Changed: ${BK.id} is stored, the response is lost`, short: 'Lost response',
        states: [
          { caption: `Same messages **1 to ${LOST.same_as_success_through}**: ${BK.id} is decided and stored. Step to send message 5.` },
          { caption: `Message **5 is lost**. ${ARI.name}'s screen can only say **${LOST.browser_state}**, while the store says **${LOST.stored_state}**. The booking exists; ${ARI.name} does not know it.` },
          { prompt: { question: `Both histories end with ${BK.id} Confirmed in the store. Which model shows the difference?`, options: ["The stored booking's state model", 'The numbered sequence of messages', 'The data model'] }, caption: 'Compare with the success: the same final stored state, **Confirmed**. Decide which picture tells the two histories apart.' },
          { caption: `The sequence does: message 5 is where they differ. So the recovery is to **${RECOVER.lost_response}**, not to send a second booking.` },
          { caption: 'Same stored result, different history, different recovery.', principle: true },
        ] },
      { id: 'rejected-early', label: 'Changed: rejected before anything is stored', short: 'Rejected',
        states: [
          { caption: `A request that conflicts with ${BK.id}. Messages **1** and **2** as before: submitted and validated.` },
          { caption: `**3 ${REJ[2].message}**: the store's decision finds the overlap with ${BK.id}, and nothing is stored.` },
          { caption: `**4 ${REJ[3].message}**. The recovery here is to **${RECOVER.rejected.split(';')[0]}**; there is nothing to check.` },
          { caption: 'Two people without a confirmation, two histories, two different next steps.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-rows:504px minmax(0,1fr);gap:12px' });
      const W = 1264, H = 504;
      const svg = window.VC.svg(W, H, { label: 'Sequence diagram of one booking: browser, booking service, authoritative store and notification worker', uid: (x) => api.uid(x) });
      const LX = [140, 470, 800, 1120];
      PART.forEach((p, i) => {
        const hd = node({ x: LX[i] - 122, y: 6, w: 244, h: 58, label: p, kind: i === 2 ? 'store' : 'box' });
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
      SUCC.forEach((m, i) => h.msgs.push({ g: msg(m, MSG_Y[i], 'success', i + 1, i === 4 ? 'ok' : i === 5 ? 'violet' : 'accent', `success-${m.n}`), cond: 'success', n: m.n }));
      SUCC.slice(0, LOST.same_as_success_through).forEach((m, i) => h.msgs.push({ g: msg(m, MSG_Y[i], 'lost-response', 0, 'accent', `lost-${m.n}`), cond: 'lost-response', n: m.n }));
      const lost = msg({ n: 5, from: SUCC[4].from, to: SUCC[4].to, message: `${SUCC[4].message} · ${LOST.step_5}` }, MSG_Y[4], 'lost-response', 1, 'bad', 'lost-5');
      lost.querySelector('.a-line').setAttribute('stroke-dasharray', '10 8');
      lost.querySelectorAll('.a-label, .a-label-bg').forEach((n) => n.setAttribute('transform', 'translate(-44 0)'));
      lost.appendChild(markX(LX[1] - 40, MSG_Y[4], 13));
      h.msgs.push({ g: lost, cond: 'lost-response', n: 5 });
      REJ.forEach((m, i) => h.msgs.push({ g: msg(m, MSG_Y[i], 'rejected-early', Math.max(0, i - 1), i === 3 ? 'bad' : 'accent', `rejected-${m.n}`), cond: 'rejected-early', n: m.n }));
      // state badges along the lifelines
      h.storeBadge = badge({ x: LX[2] + 14, y: MSG_Y[2] + 30, label: `${BK.id} Confirmed`, kind: 'ok', anchor: 'start' });
      h.nothingBadge = badge({ x: LX[2] + 14, y: MSG_Y[2] + 30, label: 'nothing stored', kind: 'warn', anchor: 'start' });
      h.screenBadge = badge({ x: LX[0], y: MSG_Y[4] + 36, label: 'Unknown outcome', kind: 'warn' });
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
      h.screen = cell(`${ARI.name}'s screen`, 'screen-state');
      h.stored = cell('Stored', 'stored-state');
      h.next = cell('Next step', 'next-step');
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
      let screen = 'Submitting…', stored = 'Nothing yet', next = 'Wait for the answer', kind = 'text';
      if (c === 'success') {
        if (st >= 4) stored = `${BK.id} Confirmed`;
        if (st >= 5) { screen = 'Confirmed'; next = 'Nothing: the room is held'; kind = 'ok'; }
        if (st >= 6) next = 'Nothing: the email follows as separate work';
      } else if (c === 'lost-response') {
        stored = `${BK.id} ${LOST.stored_state}`;
        if (st >= 1) { screen = LOST.browser_state; kind = 'warn'; next = st >= 3 ? upper1(RECOVER.lost_response) : 'Not known yet'; }
      } else {
        if (st >= 1) stored = 'Nothing stored';
        if (st >= 2) { screen = 'Rejected'; kind = 'bad'; next = upper1(RECOVER.rejected.split(';')[0]); }
      }
      h.screen.v.textContent = screen; h.screen.v.style.color = kind === 'text' ? '' : `var(--${kind})`;
      h.stored.v.textContent = stored; h.stored.v.style.color = stored.startsWith(BK.id) ? 'var(--ok)' : '';
      h.next.v.textContent = next;
      focusIf(h.next, (c === 'lost-response' && st === 3) || (c === 'rejected-early' && st === 2));
    },
    print: [
      { title: 'The successful sequence: decide and store before Confirmed; notification after the response', condition: 'success', state: 6, note: `${SUCC.map((m) => `${m.n} ${m.from} → ${m.to}: ${m.message}`).join('; ')}. The numbers give the order; vertical distance is not elapsed time.` },
      { title: 'The lost-response sequence: stored Confirmed, screen Unknown outcome', condition: 'lost-response', state: 3, note: `Messages 1 to ${LOST.same_as_success_through} as in the success; message 5 is lost. The browser shows ${LOST.browser_state} while the stored booking is ${LOST.stored_state}. Recovery: ${RECOVER.lost_response}.` },
      { title: 'Rejected before persistence: nothing stored, a different recovery', condition: 'rejected-early', state: 3, principle: true, note: `${REJ.map((m) => `${m.n} ${m.from} → ${m.to}: ${m.message}`).join('; ')}. Recovery: ${RECOVER.rejected}. Both people see no confirmation; the histories, and so the next steps, differ.` },
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
        x.label,
      ]),
      el('p', { style: `font-size:${opts.size || 20}px;line-height:1.3;font-weight:600` }, x.message),
    ]);
  }
  const interfaceStates = {
    id: 'interface-states', role: 'bridge',
    heading: `The page says “${IS.ambiguous_empty}”. Is the search finished?`,
    lead: 'One room search, five states. Each state makes a different promise: what is known, and what the person can do next.',
    principle: 'An interface should communicate what is known and what the user can do next.',
    principleShort: 'Say what is known and what the person can do.',
    conditions: [
      { id: 'five-states', baseline: true, label: 'Baseline: five states, five different messages', short: 'Five states',
        states: [
          { prompt: { question: `The results say “${IS.ambiguous_empty}” while the search is still running. What does it mean?`, options: ['No room is free', 'Nothing yet: the answer is not known', 'The service failed'] }, caption: `One search: rooms free from **${span(IS.search.start, IS.search.end)}**. The results area already says **${IS.ambiguous_empty}**, before any answer has arrived.` },
          { caption: `**${IST[0].label}**: ${IST[0].promise}. Saying “${IS.ambiguous_empty}” here would promise something the screen does not know.` },
          { caption: `**${IST[1].label}**: ${IST[1].promise}. Next: ${IST[1].next}. Focus ${IST[1].focus}.` },
          { caption: `**${IST[2].label}**: ${IST[2].promise}. The end time must be later than the start, and focus ${IST[2].focus}.` },
          { caption: `**${IST[3].label}**: ${IST[3].promise}, so nothing is known about free rooms. Next: ${IST[3].next}.` },
          { caption: `**${IST[4].label}**: ${IST[4].promise}: ${ROOM} and ${ROOM2}. Next: ${IST[4].next}.` },
          { caption: 'Five states, five promises, and each one names the next step.', principle: true },
        ] },
      { id: 'empty-or-failed', label: 'Changed: empty result versus failed request', short: 'Empty or failed',
        states: [
          { caption: `Hold the screen fixed and change only what happened. First: a valid search that found **no free room**.` },
          { caption: 'Now the same area after a **failed request**. Neither shows a room, but the words differ: one search finished, the other did not.' },
          { caption: `The next actions differ too: **${EMPTY.next}** versus **${FAILED.next}**. In both, focus moves to the message, so a keyboard user meets it first.` },
          { caption: 'Take the color away: the two states still differ by their **words** and their **icon shape**. That is what rule R-05 needs: status you can perceive.' },
          { caption: 'Same empty area, two promises, two next steps.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      // ---------------------------------------------------------------- baseline: the search screen and the gallery
      const base = el('div', { 'data-cond': 'five-states', style: 'position:absolute;inset:0;display:grid;grid-template-columns:520px minmax(0,1fr);gap:20px' });
      h.start = field('Start', IS.search.start); h.end = field('End', IS.search.end);
      h.area = el('div', { style: 'min-height:190px;border:1.5px dashed var(--line-strong);border-radius:12px;padding:12px 16px;display:flex;flex-direction:column;justify-content:center;gap:8px' });
      h.searchBtn = el('div', { class: 'btn-reserve', role: 'presentation', style: 'display:inline-flex;align-items:center;min-height:48px' }, 'Search');
      const screen = browser({ who: `${ARI.name} · ${ARI.id}`, url: 'campus-rooms.example/search', cls: 'is-search', body: [
        el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px' }, [h.start, h.end]),
        h.searchBtn,
        h.area,
      ] });
      screen.style.alignSelf = 'start';
      api.cue(screen, 'search-screen'); api.cue(h.area, 'results-area'); api.cue(h.end, 'end-field'); api.cue(h.searchBtn, 'search-button');
      base.appendChild(screen);
      const rows = IST.map((x, i) => ({ attrs: { class: 'rv', 'data-show-from': String(i + 1), 'data-focus-at': String(i + 1) }, cells: {
        state: el('span', { style: `font-weight:700;color:var(--${ICON_KIND[x.id]})` }, x.label),
        promise: el('span', { style: 'font-size:16px;line-height:1.28' }, upper1(x.promise)),
        next: el('span', { style: 'font-size:16px;line-height:1.28' }, upper1(x.next)),
        focus: el('span', { style: 'font-size:16px;line-height:1.28' }, upper1(x.focus)) } }));
      h.gallery = table({ captionHidden: 'Five interface states: the promise of each, the next action and where focus goes', cls: 'data-table--compact', columns: [{ key: 'state', label: 'State' }, { key: 'promise', label: 'What is known' }, { key: 'next', label: 'Next action' }, { key: 'focus', label: 'Keyboard focus' }], rows });
      h.gallery.querySelectorAll('td, th').forEach((c) => { c.style.padding = '7px 10px'; c.style.verticalAlign = 'top'; });
      h.gallery.querySelectorAll('thead th').forEach((c) => { c.style.fontSize = '15px'; });
      h.gallery.querySelectorAll('tbody tr').forEach((tr, i) => api.cue(tr, `state-${IST[i].id}`));
      api.cue(h.gallery, 'gallery');
      base.appendChild(el('div', { style: 'min-width:0' }, [cardTitle('One screen, five promises', 'font-size:17px'), h.gallery]));
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
      h.emptyPanel = panel(EMPTY, `Valid search, ${span(IS.search.start, IS.search.end)}: no free room`, 'Change the time', 'panel-empty');
      h.failedPanel = panel(FAILED, `Same search, request failed`, 'Try again', 'panel-failed');
      h.failedPanel.classList.add('rv', 'rv--rise'); h.failedPanel.setAttribute('data-show-from', '1');
      changed.appendChild(el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:20px' }, [h.emptyPanel, h.failedPanel]));
      const crow = (aspect, a, b, from, name) => ({ attrs: { class: 'rv', 'data-show-from': String(from), 'data-focus-at': String(from), 'data-name': name }, cells: { aspect: el('b', {}, aspect), a: el('span', { style: 'font-size:17px' }, a), b: el('span', { style: 'font-size:17px' }, b) } });
      h.compare = table({ captionHidden: 'Empty result compared with a failed request', cls: 'data-table--compact', columns: [{ key: 'aspect', label: 'Compare' }, { key: 'a', label: EMPTY.label }, { key: 'b', label: FAILED.label }], rows: [
        crow('What is known', upper1(EMPTY.promise), upper1(FAILED.promise), 1, 'known'),
        crow('Next action', upper1(EMPTY.next), upper1(FAILED.next), 2, 'next'),
        crow('Keyboard focus', upper1(EMPTY.focus), upper1(FAILED.focus), 2, 'focus'),
        crow('Without color', `The words and the ${EMPTY.icon} icon`, `The words and the ${FAILED.icon} icon`, 3, 'no-color'),
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
          el('p', { style: 'font-size:26px;font-weight:700' }, IS.ambiguous_empty),
          el('p', { class: 'muted', style: 'font-size:16px' }, `(the search for ${span(IS.search.start, IS.search.end)} is still running)`),
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
      { title: 'One search screen in five states: what is known and what to do next', condition: 'five-states', state: 5, note: IST.map((x) => `${x.label}: “${x.message}” (${x.promise}; next: ${x.next}; focus ${x.focus})`).join(' · ') },
      { title: 'Empty result versus failed request, with and without color', condition: 'empty-or-failed', state: 3, principle: true, note: `${EMPTY.label}: “${EMPTY.message}” ${FAILED.label}: “${FAILED.message}” The next actions differ (${EMPTY.next}; ${FAILED.next}); the states differ by words and icon shape, not by color alone.` },
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
    heading: `A neat diagram sends Confirmed. Where does it contradict ${MC.rule}?`,
    lead: 'Three panels that must agree: the rule, a sequence diagram, and the calendar after the interaction. Walk one concrete request through all three.',
    principle: 'Models are useful when their claims can be checked against one another and against intended behavior.',
    principleShort: 'Walk one example through every model; they must agree.',
    conditions: [
      { id: 'confirm-first', baseline: true, label: 'Baseline: the diagram confirms before deciding', short: 'Confirm first',
        states: [
          { prompt: { question: `${BO.name} asks for ${ROOM}, ${span(MCC.start, MCC.end)}, while ${ARI.name} holds ${span(MCX.start, MCX.end)}. Where does the diagram contradict ${MC.rule}?`, options: ['Nowhere: every arrow is neat', 'Message 2 promises before any decision', 'Only in the calendar'] }, caption: `The rule on the left, a sequence diagram in the middle, the calendar of ${ROOM} on the right. Walk ${BO.name}'s request through all three.` },
          { caption: `**1 ${FLAW[0].message}**: ${BO.name}'s browser sends the request to the Booking Service.` },
          { caption: `**2 ${FLAW[1].message}** goes straight back to ${BO.name}. No decision has been made yet: the diagram promises before it knows.` },
          { caption: `Then **3 ${FLAW[2].message}** and **4 ${FLAW[3].message}**, too late. ${ROOM} now has two confirmed bookings that overlap from **${span(MC.overlap.start, MC.overlap.end)}**.` },
          { caption: `The contradiction: ${MC.rule} forbids that overlap, and the message order allowed it. **Message 2 comes before the decision.** Neat, and wrong.` },
          { caption: 'One concrete request, walked through three panels, exposed a false promise.', principle: true },
        ] },
      { id: 'decide-first', label: 'Changed: Confirmed moves after the decision', short: 'Decide first',
        states: [
          { caption: 'Same rule, same two requests, same calendar. One change: the answer moves after the authoritative decision.' },
          { caption: `**1 ${FIX[0].message}**, then **2 ${FIX[1].message}**: the store decides before anyone is told anything.` },
          { caption: `**3 ${FIX[2].message}**, so **4 ${FIX[3].message}**. The calendar keeps one booking; the rule, the diagram and the calendar agree.` },
          { caption: `Both diagrams are equally neat; only one agrees with ${MC.rule}.`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:290px 584px minmax(0,1fr);gap:16px' });
      // ---------------------------------------------------------------- rule panel
      h.verdict = el('div', { style: 'font-size:19px;font-weight:700;min-height:28px' });
      h.rule = el('div', { class: 'card fx', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:10px;align-self:start' }, [
        chip(`Rule ${MC.rule}`, 'warn', { style: 'font-size:17px;align-self:flex-start' }),
        el('p', { style: 'font-size:20px;line-height:1.32;font-weight:600' }, MC.rule_text),
        el('div', { style: 'border-top:1px solid var(--line);padding-top:8px;display:flex;flex-direction:column;gap:6px' }, [
          el('div', { class: 'muted', style: 'font-size:15px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase' }, 'The two requests'),
          el('div', { style: 'font-size:17px;line-height:1.3' }, [el('b', {}, `${MCX.booking} · ${nameOf(MCX.owner)}`), ` · ${MCX.room}, ${span(MCX.start, MCX.end)}`]),
          el('div', { style: 'font-size:17px;line-height:1.3' }, [el('b', {}, `${nameOf(MCC.requester)}'s request`), ` · ${MCC.room}, ${span(MCC.start, MCC.end)}`]),
        ]),
        h.verdict,
      ]);
      api.cue(h.rule, 'rule-panel');
      wrap.appendChild(h.rule);
      // ---------------------------------------------------------------- sequence panel
      const W = 584, H = 560;
      const svg = window.VC.svg(W, H, { label: 'Sequence diagram of the request, flawed or corrected', uid: (x) => api.uid(x) });
      const LX = [96, 300, 496];
      MC.participants.forEach((p, i) => {
        const hd = node({ x: LX[i] - 88, y: 6, w: 176, h: 54, label: p, kind: i === 2 ? 'store' : 'box' });
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
      h.flaw = FLAW.map((m, i) => msg(m, Y[i], 'confirm-first', [1, 2, 3, 3][i], i === 1 ? 'warn' : 'accent', `flawed-${m.n}`));
      h.fix = FIX.map((m, i) => msg(m, Y[i], 'decide-first', [1, 1, 2, 2][i], i === 3 ? 'bad' : i === 1 ? 'ok' : 'accent', `corrected-${m.n}`));
      h.bracket = s('g', { class: 'rv', 'data-cond': 'confirm-first', 'data-show-from': '4' });
      h.bracket.appendChild(s('rect', { x: 8, y: Y[1] - 44, width: 568, height: Y[3] - Y[1] + 74, rx: 12, fill: 'none', stroke: 'var(--bad)', 'stroke-width': 3, 'stroke-dasharray': '10 7' }));
      h.bracket.appendChild(text(W / 2, Y[3] + 66, 'Message 2 promises before the decision in message 4', { 'text-anchor': 'middle', style: 'font-size:18px;font-weight:700;fill:var(--bad)' }));
      svg.appendChild(h.bracket);
      api.cue(h.bracket, 'contradiction');
      h.seq = el('div', { class: 'card', style: 'padding:4px;min-height:0;align-self:start' }, svg);
      api.cue(h.seq, 'sequence-panel');
      wrap.appendChild(h.seq);
      // ---------------------------------------------------------------- calendar panel
      const CW = 330, CH = 330, t0 = mins(MCX.start), t1 = mins(MCC.end);
      const cx = (hhmm) => 20 + (mins(hhmm) - t0) * (CW - 40) / (t1 - t0);
      const cal = window.VC.svg(CW, CH, { label: `Calendar of ${ROOM} after the interaction`, uid: (x) => api.uid(`cal-${x}`) });
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
      h.overlapLabel = text(cx(MC.overlap.start) + (cx(MC.overlap.end) - cx(MC.overlap.start)) / 2, 300, `overlap ${span(MC.overlap.start, MC.overlap.end)}`, { 'text-anchor': 'middle', style: 'font-size:17px;font-weight:700;fill:var(--bad)' });
      h.rejected = text(20, 300, `${nameOf(MCC.requester)}: Rejected; nothing stored`, { style: 'font-size:16px;font-weight:700;fill:var(--text-muted)' });
      cal.append(h.overlapLabel, h.rejected);
      [h.barB, h.overlapLabel, h.rejected].forEach((n) => n.classList.add('rv'));
      cal.appendChild(text(CW - 12, 24, 'both Confirmed', { 'text-anchor': 'end', class: 'rv cal-both', style: 'font-size:15px;fill:var(--text-muted)' }));
      h.both = cal.querySelector('.cal-both');
      api.cue(h.barA, 'calendar-existing'); api.cue(h.barB, 'calendar-candidate'); api.cue(h.overlap, 'overlap');
      h.calendar = el('div', { class: 'card fx', style: 'padding:10px 12px;display:flex;flex-direction:column;gap:6px;align-self:start' }, [cardTitle('The calendar after the interaction', 'margin:0;font-size:16px'), cal]);
      api.cue(h.calendar, 'calendar-panel');
      // a hatch pattern local to the calendar (the shared one belongs to the scene's other diagram)
      const defs = cal.querySelector('defs');
      const hatch = s('pattern', { id: api.uid('cal-hatch-bad'), width: 10, height: 10, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
      hatch.appendChild(s('rect', { width: 10, height: 10, fill: 'var(--bad-fill)' }));
      hatch.appendChild(s('line', { x1: 0, y1: 0, x2: 0, y2: 10, stroke: 'var(--bad)', 'stroke-width': 3 }));
      defs.appendChild(hatch);
      h.agree = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'decide-first', 'data-show-from': '2', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:6px;border-color:var(--ok)' }), [
        cardTitle('Do the three agree?', 'margin:0;font-size:16px'),
        el('div', { style: 'font-size:18px' }, [tick(true), ` Rule ${MC.rule}: no overlap`]),
        el('div', { style: 'font-size:18px' }, [tick(true), ' Diagram: decide, then answer']),
        el('div', { style: 'font-size:18px' }, [tick(true), ` Calendar: one booking of ${ROOM}`]),
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
      h.verdict.replaceChildren(contradicted ? tone('bad', '✕ contradicted by the calendar') : holds ? tone('ok', '✓ holds in all three panels') : el('span', { class: 'muted', style: 'font-weight:500' }, 'Not checked yet'));
      h.rule.style.borderColor = contradicted ? 'var(--bad)' : holds ? 'var(--ok)' : '';
      focusIf(h.calendar, base && st === 3);
    },
    print: [
      { title: 'The flawed sequence: Confirmed before the decision, and the overlapping calendar', condition: 'confirm-first', state: 4, note: `${MC.rule}: ${MC.rule_text} ${FLAW.map((m) => `${m.n} ${m.from} → ${m.to}: ${m.message}`).join('; ')}. Result: two confirmed bookings of ${ROOM} overlap from ${span(MC.overlap.start, MC.overlap.end)}. The contradiction: ${MC.contradiction}.` },
      { title: 'The corrected sequence: decide, then answer; the three panels agree', condition: 'decide-first', state: 2, principle: true, note: `${FIX.map((m) => `${m.n} ${m.from} → ${m.to}: ${m.message}`).join('; ')}. The calendar keeps only ${MCX.booking}; rule, diagram and calendar agree. Neatness is equal in both diagrams; consistency is not.` },
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
    heading: `Which view answers “${Q1.q}”`,
    lead: 'One booking, four views: context, sequence, state and data. Each keeps what its question needs and leaves the rest out on purpose.',
    principle: 'A useful abstraction preserves what matters for its question and makes its omissions intentional.',
    principleShort: 'Keep what the question needs; leave the rest out on purpose.',
    conditions: [
      { id: 'student', baseline: true, label: 'Baseline: a student asks about the booking', short: 'Student',
        states: [
          { prompt: { question: `Which view answers “${Q1.q}”`, options: ['Context', 'Sequence', 'Data'] }, caption: `Four views of the same booking, ${BK.id}. The question decides which one to open.` },
          { caption: `The **context view** shows who uses Campus Rooms and what lies outside it. It has no owner field, so it cannot answer the question.` },
          { caption: `The **data view** answers it: ${BK.id} has **owner_id ${BK.owner_id}**, which is ${ARI.name}. It leaves out the order of events and the screen messages, and loses nothing.` },
          { prompt: { question: `Which view answers “${Q2.q}”`, options: ['Data', 'Sequence', 'State'] }, caption: 'A second question about the same booking. Decide before the next view opens.' },
          { caption: `The **sequence view**: ${lower1(Q2.answer)}. No fields and no owner: this question does not need them.` },
          { caption: `The **state view** answers a third question: ${lower1(view('state').answers)} Confirmed can become Cancelled, under R-03.` },
          { caption: 'One question per view, and each view says what it leaves out.', principle: true },
        ] },
      { id: 'maintainer', label: 'Changed: a maintainer investigates the failure', short: 'Maintainer',
        states: [
          { caption: `Same booking, a different person: ${lower1(AUD.maintainer.label)}, asking why ${ARI.name} saw Unknown outcome.` },
          { caption: `The maintainer needs **${AUD.maintainer.needs}**. ${upper1(AUD.maintainer.omits)} can be left out.` },
          { caption: `The student needs **${AUD.student.needs}**, and can leave out ${AUD.student.omits}. Same booking, different useful detail.` },
          { caption: 'Change the audience and the useful model changes with it.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-rows:64px minmax(0,1fr);gap:14px' });
      // ---------------------------------------------------------------- the representation selector and the question
      h.tabs = {};
      const tabRow = el('div', { style: 'display:flex;gap:10px;align-items:center' }, [el('span', { class: 'muted', style: 'font-size:17px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-right:4px' }, 'View')]);
      ['context', 'sequence', 'state', 'data'].forEach((id) => {
        const b = el('button', { type: 'button', class: 'ctl-btn', 'aria-pressed': 'false', style: 'height:52px;font-size:20px;padding:0 18px;min-width:130px' }, view(id).label);
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
      const svg = window.VC.svg(W, H, { label: `Views of booking ${BK.id}`, uid: (x) => api.uid(x) });
      const group = (id) => { const g = s('g', { 'data-view': id, class: 'rv' }); svg.appendChild(g); return g; };
      const put = (g, n) => { g.appendChild(n); return n; };
      // context
      h.vContext = group('context');
      put(h.vContext, boundary({ x: 250, y: 50, w: 300, h: 300, label: 'Campus Rooms' }));
      put(h.vContext, text(400, 200, ['rooms, bookings,', 'rules R-01 to R-05'], { 'text-anchor': 'middle', class: 'n-sub', lineHeight: 26 }));
      const pA = put(h.vContext, person({ x: 110, y: 130, name: ARI.name, role: 'campus member' }));
      const pB = put(h.vContext, person({ x: 110, y: 330, name: BO.name, role: 'campus member' }));
      const pS = put(h.vContext, person({ x: 690, y: 130, name: 'Room staff', role: 'run the rooms' }));
      const mail = put(h.vContext, node({ x: 610, y: 300, w: 170, h: 80, label: AZ.outside_systems[0], kind: 'ext', kindLabel: 'outside' }));
      put(h.vContext, arrow(svg, { from: { x: 150, y: 120 }, to: { x: 250, y: 150 }, kind: 'accent', label: 'books' }));
      put(h.vContext, arrow(svg, { from: { x: 150, y: 320 }, to: { x: 250, y: 290 }, kind: 'accent', label: 'books' }));
      put(h.vContext, arrow(svg, { from: { x: 650, y: 120 }, to: { x: 550, y: 150 }, kind: 'accent', label: 'runs' }));
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
      const bRec = rec(40, 150, 320, `Booking ${BK.id}`, [`owner_id  ${BK.owner_id}`, `room_id   ${BK.room_id}`, `state     ${BK.state}`], 0);
      const uRec = rec(480, 40, 280, `User ${ARI.id}`, [`name  ${ARI.name}`], -1);
      const rRec = rec(480, 300, 280, `Room ${ROOM}`, [`display_name`, `  ${ID.rename.display_name_before}`], -1);
      put(h.vData, arrow(svg, { from: { x: 360, y: 208 }, to: { x: 480, y: 100 }, kind: 'warn', label: 'owner_id', labelDy: -14 }));
      put(h.vData, arrow(svg, { from: { x: 360, y: 240 }, to: { x: 480, y: 340 }, kind: 'accent', label: 'room_id', labelDy: 30 }));
      api.cue(bRec, 'data-booking'); api.cue(uRec, 'data-user'); api.cue(rRec, 'data-room');
      // sequence
      h.vSeq = group('sequence');
      const SLX = [120, 400, 680];
      PART.slice(0, 3).forEach((p, i) => {
        const hd = node({ x: SLX[i] - 110, y: 10, w: 220, h: 54, label: p, kind: i === 2 ? 'store' : 'box' });
        hd.querySelectorAll('.n-label').forEach((t) => { t.style.fontSize = '19px'; });
        put(h.vSeq, s('line', { x1: SLX[i], y1: 64, x2: SLX[i], y2: 450, stroke: 'var(--line-strong)', 'stroke-width': 2, 'stroke-dasharray': '6 7' }));
        put(h.vSeq, hd);
      });
      const sm = (m, y, kind, extra) => put(h.vSeq, arrow(svg, Object.assign({ from: { x: SLX[PART.indexOf(m.from)] + (PART.indexOf(m.to) > PART.indexOf(m.from) ? 4 : -4), y }, to: { x: SLX[PART.indexOf(m.to)] + (PART.indexOf(m.to) > PART.indexOf(m.from) ? -5 : 5), y }, kind, label: `${m.n}  ${m.message}`, labelDy: -12 }, extra || {})));
      sm(SUCC[0], 110, 'accent');
      put(h.vSeq, arrow(svg, { from: { x: SLX[1], y: 150 }, via: [{ x: SLX[1] + 80, y: 150 }, { x: SLX[1] + 80, y: 186 }], to: { x: SLX[1] + 5, y: 186 }, kind: 'accent', label: `${SUCC[1].n}  ${SUCC[1].message}`, labelAnchor: 'start', labelDx: 10, labelDy: 8 }));
      sm(SUCC[2], 240, 'accent'); sm(SUCC[3], 304, 'ok');
      const lost5 = sm({ n: 5, from: SUCC[4].from, to: SUCC[4].to, message: `${SUCC[4].message} · ${LOST.step_5}` }, 380, 'bad');
      lost5.querySelector('.a-line').setAttribute('stroke-dasharray', '10 8');
      lost5.appendChild(markX(260, 380, 12));
      api.cue(lost5, 'sequence-lost');
      // state
      h.vState = group('state');
      put(h.vState, s('circle', { cx: 36, cy: 235, r: 12, fill: 'var(--text)' }));
      const sC = put(h.vState, stateNode(150, 204, 200, SM.stored_states[0]));
      const sX = put(h.vState, stateNode(590, 204, 200, SM.stored_states[1]));
      put(h.vState, arrow(svg, { from: { x: 48, y: 235 }, to: { x: 150, y: 235 }, kind: 'ok', label: ['decided', 'and stored'], labelDy: -44 }));
      put(h.vState, arrow(svg, { from: { x: 350, y: 235 }, to: { x: 590, y: 235 }, kind: 'ok', label: `${STT.event} [${STT.condition}]` }));
      put(h.vState, s('rect', { x: 141, y: 195, width: 218, height: 80, rx: 36, fill: 'none', stroke: 'var(--warn)', 'stroke-width': 5 }));
      put(h.vState, text(250, 310, `${BK.id} is here now`, { 'text-anchor': 'middle', style: 'font-size:18px;font-weight:700;fill:var(--warn)' }));
      api.cue(sC, 'state-confirmed'); api.cue(sX, 'state-cancelled');
      h.views = { context: h.vContext, data: h.vData, sequence: h.vSeq, state: h.vState };
      h.answer = el('div', { class: 'callout callout--ok', style: 'font-size:19px;padding:8px 14px;line-height:1.3;min-height:44px' });
      h.diagram = el('div', { class: 'card', style: 'padding:6px 8px;display:flex;flex-direction:column;gap:8px' }, [svg, h.answer]);
      api.cue(h.diagram, 'view-diagram'); api.cue(h.answer, 'answer');
      // the question-to-model matrix (last baseline state)
      h.matrix = table({ captionHidden: 'Question-to-model matrix: what each view answers, keeps and leaves out', cls: 'data-table--compact', columns: [{ key: 'v', label: 'View' }, { key: 'a', label: 'Answers' }, { key: 'k', label: 'Keeps' }, { key: 'o', label: 'Leaves out' }],
        rows: VIEWS.map((v) => ({ cells: { v: el('b', {}, v.label), a: el('span', { style: 'font-size:17px' }, v.answers), k: el('span', { style: 'font-size:17px' }, upper1(v.keeps)), o: el('span', { style: 'font-size:17px' }, upper1(v.omits)) } })) });
      h.matrix.querySelectorAll('td, th').forEach((c) => { c.style.padding = '8px 12px'; });
      h.matrix.querySelectorAll('tbody tr').forEach((tr, i) => api.cue(tr, `matrix-${VIEWS[i].id}`));
      h.matrixCard = el('div', reveal({ class: 'card rv rv--rise', style: 'padding:12px 16px;grid-area:1 / 1 / 2 / 3;align-self:start' }), [cardTitle('One question per view', 'font-size:17px'), h.matrix]);
      api.cue(h.matrixCard, 'matrix');
      h.diagram.style.gridArea = '1 / 1';
      // right: keeps and leaves out of the open view (baseline) or the two audiences (changed)
      h.keeps = el('div', { style: 'font-size:19px;line-height:1.32' });
      h.omits = el('div', { style: 'font-size:19px;line-height:1.32' });
      h.info = el('div', { class: 'card', 'data-cond': 'student', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:10px;grid-area:1 / 2;align-self:start' }, [
        (h.infoTitle = cardTitle('Open a view', 'margin:0;font-size:17px')),
        el('div', {}, [el('div', { style: 'font-size:15px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--ok)' }, 'Keeps'), h.keeps]),
        el('div', {}, [el('div', { style: 'font-size:15px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-soft)' }, 'Leaves out, on purpose'), h.omits]),
      ]);
      api.cue(h.info, 'keeps-leaves-out');
      const audienceCard = (a, from, name) => api.cue(el('div', reveal({ class: 'card rv rv--rise', 'data-show-from': String(from), style: 'padding:12px 16px;display:flex;flex-direction:column;gap:6px' }), [
        cardTitle(a.label, 'margin:0;font-size:16px'),
        el('div', { style: 'font-size:18px;line-height:1.3' }, [el('b', { style: 'color:var(--ok)' }, 'Needs: '), a.needs]),
        el('div', { style: 'font-size:18px;line-height:1.3' }, [el('b', { style: 'color:var(--text-soft)' }, 'Leaves out: '), a.omits]),
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
      const q = base ? (st <= 2 ? Q1.q : st <= 4 ? Q2.q : st === 5 ? view('state').answers : '') : (st >= 1 ? Q2.q : '');
      h.question.textContent = q;
      const answers = { data: `Answer: ${Q1.answer.replace(': ', ', which is ')}.`, sequence: `Answer: ${upper1(Q2.answer)}.`, context: 'No owner field here: this view cannot answer it.', state: `${BK.id} is Confirmed; ${STT.event} [${STT.condition}] leads to ${STT.to}.` };
      h.answer.textContent = answers[open] || (base ? 'Choose a view for the question.' : `Audience: ${lower1(AUD.maintainer.label)}.`);
      h.answer.className = `callout ${open === 'context' ? 'callout--bad' : open ? 'callout--ok' : 'callout--accent'}`;
      const v = VIEWS.find((x) => x.id === open);
      h.infoTitle.textContent = v ? `${v.label} view` : 'Open a view';
      h.keeps.textContent = v ? upper1(v.keeps) : '·';
      h.omits.textContent = v ? upper1(v.omits) : '·';
    },
    print: [
      { title: 'Four views of one booking: the question-to-model matrix', condition: 'student', state: 6, principle: true, note: `${VIEWS.map((v) => `${v.label}: answers “${v.answers}”; keeps ${v.keeps}; leaves out ${v.omits}`).join('. ')}. “${Q1.q}” → ${Q1.answer.replace(': ', ', which is ')}. “${Q2.q}” → ${Q2.answer}.` },
      { title: 'A different audience: what the maintainer and the student each need', condition: 'maintainer', state: 2, note: `${AUD.maintainer.label} needs ${AUD.maintainer.needs} and can leave out ${AUD.maintainer.omits}. ${AUD.student.label} needs ${AUD.student.needs} and can leave out ${AUD.student.omits}.` },
    ],
  };

  // =====================================================================
  // PAGE · five models of one booking, and the notation
  // =====================================================================
  const MODELS = [
    { name: 'User journey', scene: 1, glyph: 'journey', shows: 'steps, goals, what the screen says, what is stored and what is still uncertain', answers: 'What does the person need to know next?', omits: 'components, messages and field names' },
    { name: 'State models', scene: 2, glyph: 'state', shows: 'states, events and conditions, for the request and for the stored booking', answers: 'What can happen next, and on which event?', omits: 'who asked, the order of messages, timing' },
    { name: 'Data model', scene: 3, glyph: 'data', shows: 'entities, identifiers, references and how many of each', answers: 'Which facts exist, and where does each one live?', omits: 'the order of events and the screen messages' },
    { name: 'Decision table', scene: 4, glyph: 'table', shows: 'one row per combination of conditions, with its decision', answers: 'Which combination is allowed, and why?', omits: 'time order and participants' },
    { name: 'Sequence diagram', scene: 5, glyph: 'sequence', shows: 'participants and numbered messages, top to bottom', answers: 'In what order did it happen, and where did it stop?', omits: 'fields and the other possible histories' },
  ];
  function modelGlyph(kind, uid) {
    const g = window.VC.svg(260, 92, { label: `${kind} notation`, uid });
    if (kind === 'journey') {
      ['1', '2', '3'].forEach((n, i) => { g.appendChild(s('rect', { x: 4 + i * 88, y: 14, width: 76, height: 30, rx: 8, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 })); g.appendChild(text(42 + i * 88, 35, n, { 'text-anchor': 'middle', style: 'font-size:16px;font-weight:700' })); });
      g.appendChild(s('rect', { x: 4, y: 56, width: 252, height: 22, rx: 6, fill: 'var(--ok-fill)', stroke: 'var(--ok)', 'stroke-width': 1.5 }));
      g.appendChild(text(130, 72, 'stored underneath', { 'text-anchor': 'middle', style: 'font-size:14px;fill:var(--ok)' }));
    } else if (kind === 'state') {
      g.appendChild(s('circle', { cx: 16, cy: 46, r: 8, fill: 'var(--text)' }));
      g.appendChild(s('rect', { x: 50, y: 28, width: 80, height: 36, rx: 18, fill: 'var(--surface-2)', stroke: 'var(--warn)', 'stroke-width': 3 }));
      g.appendChild(s('rect', { x: 178, y: 28, width: 78, height: 36, rx: 18, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 }));
      arrow(g, { from: { x: 24, y: 46 }, to: { x: 50, y: 46 }, kind: 'ok' });
      arrow(g, { from: { x: 130, y: 46 }, to: { x: 178, y: 46 }, kind: 'ok' });
      g.appendChild(text(154, 20, 'event [condition]', { 'text-anchor': 'middle', style: 'font-size:13px;fill:var(--text-muted)' }));
    } else if (kind === 'data') {
      g.appendChild(s('rect', { x: 4, y: 20, width: 96, height: 56, rx: 8, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 }));
      g.appendChild(s('rect', { x: 160, y: 20, width: 96, height: 56, rx: 8, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 }));
      g.appendChild(s('line', { x1: 100, y1: 48, x2: 160, y2: 48, stroke: 'var(--accent)', 'stroke-width': 2.5 }));
      g.appendChild(text(106, 40, 'many', { style: 'font-size:13px;fill:var(--text-muted)' }));
      g.appendChild(text(154, 66, 'one', { 'text-anchor': 'end', style: 'font-size:13px;fill:var(--text-muted)' }));
      g.appendChild(text(52, 53, 'Booking', { 'text-anchor': 'middle', style: 'font-size:15px;font-weight:700' }));
      g.appendChild(text(208, 53, 'Room', { 'text-anchor': 'middle', style: 'font-size:15px;font-weight:700' }));
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
    ['state', 'a state: rounded box'], ['event', 'event [condition] on an arrow'], ['current', 'the current state'], ['start', 'start: nothing stored yet'],
    ['absent', 'absent on purpose'], ['entity', 'entity: fields, id first'], ['many', 'many to one'], ['lost', 'a lost message'],
  ];
  function legendGlyph(kind, uid) {
    const g = window.VC.svg(48, 28, { label: kind, uid });
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
    heading: 'Five models of one booking, and the question each answers',
    lead: 'The notation of this lecture in one place: what each model shows, the question it answers and what it leaves out, for one and the same booking.',
    printRole: 'Models and notation',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const qBtn = api.cue(el('button', { type: 'button', class: 'ctl-btn ctl-btn--step', style: 'height:50px;font-size:20px' }, 'Show the questions'), 'questions');
      const oBtn = api.cue(el('button', { type: 'button', class: 'ctl-btn', style: 'height:50px;font-size:20px', 'aria-disabled': 'true' }, 'What does each leave out?'), 'leaves-out');
      const bar = el('div', { style: 'display:flex;gap:12px;align-items:center;margin-bottom:12px' }, [qBtn, oBtn, el('span', { class: 'muted', style: 'font-size:17px' }, `Identifiers stay stable: ${DT.rule} and ${BK.id} mean the same thing in every model.`)]);
      const cards = MODELS.map((m, i) => api.cue(el('div', { class: 'card', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:8px;min-width:0' }, [
        el('div', { style: 'display:flex;align-items:baseline;justify-content:space-between;gap:8px' }, [el('span', { style: 'font-size:21px;font-weight:700' }, m.name), el('span', { class: 'muted', style: 'font-size:15px;white-space:nowrap' }, `scene ${m.scene}`)]),
        modelGlyph(m.glyph, (x) => `models-${i}-${x}`),
        el('p', { style: 'font-size:17px;line-height:1.3' }, [el('b', {}, 'Shows: '), m.shows]),
        el('p', { class: 'mq', style: 'font-size:17px;line-height:1.3;color:var(--warn)' }, [el('b', {}, 'Answers: '), m.answers]),
        el('p', { class: 'mo', style: 'font-size:17px;line-height:1.3;color:var(--text-muted)' }, [el('b', {}, 'Leaves out: '), m.omits]),
      ]), `model-${i + 1}`));
      const grid = el('div', { style: 'display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;align-items:start' }, cards);   // ends above the presenter corner (y < 696)
      const legendCard = el('div', { class: 'card', style: 'margin-top:14px;padding:10px 16px;max-width:1580px' }, [   // left of the presenter corner (x < 1664)
        cardTitle('Notation used this week', 'margin-bottom:6px;font-size:17px'),
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
        el('thead', {}, el('tr', {}, ['Model', 'Scene', 'Shows', 'Answers', 'Leaves out'].map((t) => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, MODELS.map((m) => el('tr', {}, [el('td', {}, m.name), el('td', {}, String(m.scene)), el('td', {}, m.shows), el('td', {}, m.answers), el('td', {}, m.omits)]))),
      ]));
      body.appendChild(el('h3', {}, 'Notation used this week'));
      body.appendChild(el('ul', {}, LEGEND.map(([, label]) => el('li', {}, label))));
    },
  };

  // =====================================================================
  // PAGE · principles and checks
  // =====================================================================
  const WEEK = { checks: [
    { q: 'A response times out after persistence. Is the booking necessarily absent?', a: 'No. The requester may not know the result even though the booking exists.' },
    { q: 'Why reference a room ID instead of copying its current name everywhere?', a: 'Identity remains stable when the displayed name changes; historical snapshots should be modeled deliberately.' },
    { q: 'Which model best exposes combinations of ownership and status?', a: 'A decision table.' },
    { q: 'How can a diagram be tested before code exists?', a: 'Walk concrete examples through it and compare outcomes with requirements and complementary models.' },
    { q: 'Can a valid state diagram establish that pending notification work will eventually complete?', a: 'No. Permitted states and transitions do not establish the scheduling and recovery assumptions needed for progress.' },
    { q: TRANSFER.question.replace(/'/g, '’').replace(/’saved on this device’/, '“saved on this device”'), a: TRANSFER.answer },
  ] };
  const SCENES = [journeyBeforeBoxes, stateMachine, identityAndData, decisionTable, sequenceNotState, interfaceStates, modelConsistency, abstractionAndZoom];
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
      body.appendChild(el('h3', {}, 'Principles'));
      body.appendChild(el('div', { class: 'principle-grid' }, SCENES.map((sc, i) => el('div', { class: 'principle-card' }, [el('span', { class: 'pc-num' }, `${i + 1} · ${sc.role}`), el('span', { class: 'pc-text' }, sc.principle), el('span', { class: 'pc-short' }, `In short: ${sc.principleShort}`), el('span', { class: 'pc-id' }, `${FILE}#/${sc.id}`)]))));
      body.appendChild(el('h3', {}, 'Checks: decide your answer before reading the one below each question'));
      body.appendChild(el('ol', { class: 'print-qa' }, WEEK.checks.map((c, i) => el('li', {}, [el('span', { class: 'q' }, `${i + 1}. ${c.q}`), el('span', { class: 'a' }, c.a)]))));
    },
  };

  // =====================================================================
  // PAGE · handoff, terminology and sources
  // =====================================================================
  const TERMS = [
    ['Model', 'A deliberately simplified description that answers one question about a system, and says what it leaves out.'],
    ['User journey', 'The steps a person takes toward a goal, with what they see and what is still uncertain at each step.'],
    ['State and event', 'A state is a condition something can be in; an event is what can move it to another state.'],
    ['Condition (guard)', 'What must hold for a transition to happen, such as R-03 allows.'],
    ['Transition', 'A permitted change from one state to another: event, condition, outcome.'],
    ['Safety invariant', 'A statement that stays true across every permitted transition: a forbidden state never occurs.'],
    ['Progress property', 'A promise that pending work is eventually resolved; it needs scheduling and recovery, not only arrows.'],
    ['Entity and identifier', `A thing with its own identity, such as a room, found by a stable identifier like ${ROOM}.`],
    ['Relationship and cardinality', 'How entities refer to each other, and how many: a booking belongs to one room; a room has many bookings.'],
    ['Referential integrity', 'Every reference points at something that exists: a well-formed ID is not enough.'],
    ['Historical snapshot', 'A deliberate copy of what was true at a moment, such as the room name on a receipt.'],
    ['Decision table', 'One row per combination of conditions, with the decision and the rule that gives it.'],
    ['Sequence diagram', 'Participants as lifelines and numbered messages in order; distance is not time.'],
    ['Interface state', 'What a screen promises right now: loading, empty, an error, unavailable or results, and what to do next.'],
  ];
  const SOURCES = [
    ['S01', 'IEEE Computer Society, Guide to the Software Engineering Body of Knowledge (SWEBOK V4.0a)', 'https://www.computer.org/education/bodies-of-knowledge/software-engineering'],
    ['S02', 'ACM / IEEE-CS / AAAI, Computer Science Curricula 2023, final report', 'https://csed.acm.org/final-report/'],
    ['S08', 'Simon Brown, The C4 model for visualising software architecture', 'https://c4model.com/'],
    ['S09', 'IETF, RFC 9110: HTTP Semantics', 'https://www.rfc-editor.org/rfc/rfc9110.html'],
    ['S25', 'W3C, Web Content Accessibility Guidelines 2.2', 'https://www.w3.org/TR/WCAG22/'],
  ];
  const IN_PRACTICE = 'Teams keep diagrams as text next to the code in Mermaid or PlantUML, draw them in draw.io, and design interface states in Figma.';
  const PRACTICE_YEAR = (String(F.metadata && F.metadata.date).match(/\b(\d{4})\b/) || [])[1];
  if (!PRACTICE_YEAR) throw new Error('fixtures metadata.date carries no year for the dated In practice examples');
  const IN_PRACTICE_TITLE = `In practice · examples from ${PRACTICE_YEAR}`;
  const HANDOFF_QUESTION = 'Who turns these models into working behavior, in what order, and where does that work wait?';
  const CARRIED = [
    'The requirement identifiers R-01 to R-05 and Q-01, unchanged.',
    `Five models of ${BK.id}: the journey, the request and stored states, the data model, the ${DT.rule} table and the sequences.`,
    'Open decisions: the fairness policy, room closures (Week 14), and how an Unknown outcome is resolved (Week 6).',
  ];
  const sources = {
    kind: 'page', id: 'sources', role: 'page',
    heading: 'What carries forward, and where to read more',
    lead: 'Next week asks how a team organizes the work of turning these models into dependable behavior, and learns where it waits.',
    printRole: 'Handoff, terminology, sources',
    build(body, api) {
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-height:0' }, [
        api.cue(el('div', { class: 'handoff', style: 'font-size:27px;padding:18px 24px' }, [el('span', { class: 'muted', style: 'font-size:19px;display:block;margin-bottom:8px;font-family:var(--font-text);font-weight:500' }, 'Week 4 starts from this question:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]), 'handoff'),
        api.cue(el('div', { class: 'card', style: 'padding:14px 18px' }, [cardTitle('Carried forward to Week 4'), el('ul', { style: 'font-size:18px;line-height:1.38;display:flex;flex-direction:column;gap:6px' }, CARRIED.map((t) => el('li', {}, t)))]), 'carried'),
        api.cue(el('div', { class: 'card', style: 'padding:14px 18px' }, [cardTitle(IN_PRACTICE_TITLE), el('p', { style: 'font-size:18px;line-height:1.38' }, IN_PRACTICE)]), 'in-practice'),
      ]);
      const middle = api.cue(el('div', { class: 'card', style: 'min-height:0;padding:14px 18px;align-self:start' }, [cardTitle('Terms used this week'), el('dl', { class: 'term-list', style: 'display:block;column-count:2;column-gap:22px;font-size:15px;line-height:1.26' }, TERMS.map(([t, d]) => el('div', { style: 'break-inside:avoid;margin-bottom:6px' }, [el('dt', {}, t), el('dd', {}, d)])))]), 'terms');
      const right = api.cue(el('div', { class: 'card', style: 'min-height:0;padding:14px 18px;align-self:start' }, [cardTitle('Sources for this lecture'), el('ul', { class: 'source-list', style: 'font-size:17px;gap:8px' }, SOURCES.map(([k, t, u]) => el('li', {}, [el('span', { class: 'key' }, k), el('span', {}, [t, ' ', el('a', { class: 'url', href: u, style: 'font-size:15px' }, u)])])))]), 'sources');   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:600px minmax(0,1fr) 450px;gap:24px;height:100%;min-height:0' }, [left, middle, right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('div', { class: 'handoff' }, [el('span', { class: 'muted', style: 'display:block;font-size:14px' }, 'Week 4 starts from this question:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]),
          el('h3', {}, 'Carried forward to Week 4'), el('ul', {}, CARRIED.map((t) => el('li', {}, t))),
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
    week: 3, file: FILE,
    title: 'Modeling behavior, data, and user interaction',
    question: 'Which model answers the question we are actually asking?',
    coverLead: `Student notes for lecture 3. One booking, ${BK.id}, is described as a user journey, two state models, a data model, a decision table and sequence diagrams, and the models are checked against each other and against the rules. Every scene shows a situation, asks you to predict, reveals the mechanism, changes one condition, compares the outcomes and names the principle.`,
    coverNote: 'Campus Rooms is a fictional room-booking service; every name, identifier, time and message is a teaching example unless a source is named. The drawings use a light UML style; they describe the intended behavior at the level of each question, not every detail of an implementation.',
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
