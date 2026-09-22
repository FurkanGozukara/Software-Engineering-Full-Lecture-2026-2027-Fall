/* =====================================================================
   Week 02 · From ambiguous requests to verifiable requirements
   Central question: How would we know that a requirement has been satisfied?

   Every name, number, state and rule below is read from the fixtures
   (plan/assets/demo-fixtures.json → assets/fixtures/demo-fixtures.js).
   Scene identifiers come from plan/plan_manifest.json and never change.
   The shell (shared/lecture-controls.js) owns navigation, the control
   contract, modes and print; this file defines content and scenes.
   ===================================================================== */
(function () {
  'use strict';
  const F = window.CAMPUS_ROOMS_FIXTURES;
  const A = F.anchors;
  const { el, s, text, node, person, boundary, arrow, badge, markX, browser, field, status, chip, table, legend, histogram } = window.VC;
  const CASE = F.case;
  const ARI = CASE.users[0];   // U-01 Ari
  const BO = CASE.users[1];    // U-02 Bo
  const ROOM = CASE.rooms[0];  // C101
  const DUR = CASE.duration_minutes;   // 30..120 inclusive
  const FILE = 'week-02.html';
  const AR = A['w02/ambiguous-request'];
  const SENTENCE = AR.sentence;   // "Make room booking fair and easy."

  // ------------------------------------------------------------------ helpers shared by the scenes
  const reveal = (attrs) => Object.assign({ class: 'rv rv--rise' }, attrs);
  const lower1 = (str) => str.charAt(0).toLowerCase() + str.slice(1);
  const upper1 = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const inWords = (n) => NUMBER_WORDS[n] || String(n);
  const listAnd = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
  /** A rule of the fictional case, labeled where the lecture first states it. */
  const ruleIntro = (id) => `[[Rule ${id}|example assumption]]`;
  function kbd(k) { return el('kbd', { class: 'kbd' }, k); }
  function wrapText(str, width) {
    const words = str.split(' '); const lines = [''];
    words.forEach((w) => { if ((lines[lines.length - 1] + ' ' + w).trim().length > width) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim(); });
    return lines;
  }
  /** Python-like snippet with light keyword coloring (the code is read from the fixtures, never typed here). */
  function codeBlock(src, attrs) {
    const pre = el('pre', Object.assign({ class: 'code', style: 'margin:0' }, attrs || {}));
    src.replace(/\n$/, '').split('\n').forEach((line, i) => {
      if (i) pre.appendChild(document.createTextNode('\n'));
      line.split(/(\bdef\b|\breturn\b|"""[^"]*"""|\b\d+\b)/).forEach((part) => {
        if (!part) return;
        if (part === 'def' || part === 'return') pre.appendChild(el('span', { class: 'kw' }, part));
        else if (part.startsWith('"""')) pre.appendChild(el('span', { class: 'cm' }, part));
        else if (/^\d+$/.test(part)) pre.appendChild(el('span', { class: 'num' }, part));
        else pre.appendChild(document.createTextNode(part));
      });
    });
    return pre;
  }
  const okMark = (ok) => el('span', { class: ok ? 'ok' : 'bad' }, ok ? '✓ ' : '✕ ');
  const verdict = (ok, yes, no) => el('span', { class: ok ? 'ok' : 'bad' }, `${ok ? '✓' : '✕'} ${ok ? (yes || 'accepted') : (no || 'rejected')}`);

  // =====================================================================
  // PAGE · opening situation
  // =====================================================================
  const REGISTER_PREVIEW = ['R-01 no overlapping confirmations', 'R-02 duration 30 to 120 minutes', 'R-03 who may cancel', 'R-04 notification is separate', 'R-05 keyboard completion', 'Q-01 search response time'];
  const THREAD = 'A precise requirement is also what makes an automated assistant\'s draft judgeable: scene 3 hands the same request to an assistant twice, once vague and once as R-02, and checks both drafts against one example.';
  const WHERE_IT_APPLIES = 'Every request you ever receive in words has this shape: a wish, a few missing decisions and an assumption or two. The care you take with it grows with how many people will live with the result.';
  const opening = {
    kind: 'page', id: 'opening', role: 'page',
    heading: 'One sentence arrived. What would you build from it?',
    lead: 'Week 1 ended with a request from the people who run the rooms. Before any code, decide what it asks for.',
    printRole: 'Opening situation',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const request = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:12px;align-self:start' }, [
        el('div', { class: 'card-title' }, 'Request · from the room staff · received at the end of Week 1'),
        el('p', { class: 'handoff', style: 'font-size:38px;padding:20px 24px' }, el('span', { class: 'quote' }, `“${SENTENCE}”`)),
        el('p', { class: 'muted', style: 'font-size:20px;line-height:1.35' }, 'No examples, no numbers, no names. Six words that a whole service will be built on.'),
      ]);
      api.cue(request, 'request');
      const readBtn = api.cue(el('button', { type: 'button', class: 'ctl-btn ctl-btn--step', style: 'align-self:flex-start;height:56px;font-size:22px;padding:0 20px' }, 'Read it as a developer'), 'read');
      const reading = el('div', reveal({ class: 'card rv rv--rise', style: 'align-self:stretch' }), [
        el('div', { class: 'card-title' }, 'A first reading, written confidently'),
        el('ul', { style: 'font-size:21px;line-height:1.4;display:flex;flex-direction:column;gap:6px;color:var(--text)' }, [
          el('li', {}, [el('b', {}, 'fair'), ' → whoever asks first gets the room']),
          el('li', {}, [el('b', {}, 'easy'), ' → fewer clicks on the booking screen']),
        ]),
        el('p', { class: 'rail-note', style: 'margin-top:8px' }, 'Nothing here is wrong yet. Nothing here is decided either.'),
      ]);
      api.cue(reading, 'reading');
      const q = el('div', reveal({ class: 'rail-card rail-prompt rv rv--rise', style: 'align-self:start' }), [
        el('div', { class: 'rail-eyebrow' }, 'The question of this week'),
        el('p', { class: 'prompt-q' }, 'How would we know that a requirement has been satisfied?'),
        el('ul', { class: 'prompt-options' }, ['When the person who asked says it is done', 'When a concrete example behaves the way the requirement says', 'When the code runs without errors'].map((o, i) => el('li', {}, [el('span', { class: 'opt-key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)), el('span', {}, o)]))),
        el('p', { class: 'rail-note', style: 'margin-top:12px' }, 'Keep your answer. Scene 3 tests it with four numbers.'),
      ]);
      api.cue(q, 'question');
      const threadBtn = api.cue(el('button', reveal({ type: 'button', class: 'ctl-btn ctl-btn--step rv rv--rise', style: 'align-self:flex-start;height:56px;font-size:22px;padding:0 20px' }), 'What does this lecture build?'), 'thread');
      const thread = el('div', reveal({ class: 'rail-card rv rv--rise' }), [
        el('div', { class: 'rail-eyebrow' }, 'What this lecture builds'),
        el('p', { style: 'font-size:20px;line-height:1.35' }, 'A small connected set of requirements for Campus Rooms, each with an example you can check, and the links from each one to a design decision and an independent check.'),
        el('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 6px' }, REGISTER_PREVIEW.map((t) => chip(t, 'accent', { style: 'font-size:17px' }))),
        el('p', { style: 'font-size:19px;line-height:1.35;margin-top:8px;color:var(--text-muted)' }, WHERE_IT_APPLIES),
        el('p', { style: 'font-size:19px;line-height:1.35;margin-top:8px;color:var(--text-muted)' }, THREAD),
      ]);
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:16px;min-width:0' }, [request, readBtn, reading]);
      const side = el('div', { style: 'display:flex;flex-direction:column;gap:16px;align-items:stretch;min-width:0' }, [threadBtn, thread]);
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:560px 540px minmax(0,1fr);gap:36px;align-items:start;height:100%' }, [left, q, side]));
      const apply = () => {
        const st = Number(body.getAttribute('data-state'));
        reading.classList.toggle('is-shown', st >= 1); q.classList.toggle('is-shown', st >= 1);
        threadBtn.classList.toggle('is-shown', st >= 1); thread.classList.toggle('is-shown', st >= 2);
        readBtn.setAttribute('aria-disabled', st >= 1 ? 'true' : 'false');
        threadBtn.setAttribute('aria-disabled', st === 1 ? 'false' : 'true');
      };
      readBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '0') { body.setAttribute('data-state', '1'); apply(); } });
      threadBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '1') { body.setAttribute('data-state', '2'); apply(); } });
      body.reset = () => { body.setAttribute('data-state', '0'); apply(); };
      apply();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('h3', {}, 'The situation'),
          el('p', {}, `The room staff sent one sentence at the end of Week 1: “${SENTENCE}” No examples, no numbers, no names. A first reading, written confidently: fair means whoever asks first gets the room; easy means fewer clicks. Nothing in it is wrong yet, and nothing in it is decided.`),
          el('h3', {}, 'The question of this week'),
          el('p', {}, 'How would we know that a requirement has been satisfied? (A) When the person who asked says it is done. (B) When a concrete example behaves the way the requirement says. (C) When the code runs without errors.'),
        ]),
        el('div', {}, [
          el('h3', {}, 'What this lecture builds'),
          el('p', {}, `A small connected set of requirements for Campus Rooms: ${listAnd(REGISTER_PREVIEW)}. Each has an example you can check, and each links to a design decision and an independent check.`),
          el('h3', {}, 'Where this applies'), el('p', {}, WHERE_IT_APPLIES),
          el('h3', {}, 'The thread'), el('p', {}, THREAD),
        ]),
      ]));
    },
  };

  // =====================================================================
  // PAGE · recall and outcomes
  // =====================================================================
  const OUTCOMES = [
    'Identify ambiguity, missing stakeholders, and hidden assumptions in a request.',
    'Turn a request into observable behavior with boundary and failure cases.',
    'Distinguish a requirement from a solution decision and a supporting assumption.',
    'Connect a requirement to a design decision and an independent verification check.',
    'Explain how a changed requirement affects linked evidence.',
  ];
  const KINDS_INTRO = 'Four kinds of statement will come apart this week: what the service must do (a behavior), how well it must do it (a quality target), a rule the organization sets (a business rule), and a way of building it (an implementation decision). Only the first three are requirements.';
  const outcomes = {
    kind: 'page', id: 'outcomes', role: 'page',
    heading: 'What you already know, and where this lecture goes',
    lead: 'How would we know that a requirement has been satisfied?',
    printRole: 'Recall and outcomes',
    build(body) {
      const recall = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:12px' }, [
        el('div', { class: 'card-title' }, 'Start from a request you received in words'),
        el('p', { style: 'font-size:24px;line-height:1.35' }, 'Think of the last time someone asked you for something in one sentence: make it faster, make it simple, make it fair.'),
        el('ul', { style: 'font-size:22px;line-height:1.4;display:flex;flex-direction:column;gap:8px;color:var(--text-muted)' }, [
          el('li', {}, 'What did you build first, and how did you decide?'),
          el('li', {}, 'Which words did you fill in for them without asking: a limit, a default, a who?'),
          el('li', {}, 'How did you know, at the end, whether they got what they needed?'),
        ]),
        el('p', { class: 'rail-note' }, window.VC.rich(`Week 1 left three things on the table: the context map, the no-overlap concern ${ruleIntro('R-01')}, and the open assumptions about closures, delayed messages and simultaneous requests.`)),
      ]);
      const kinds = el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:10px' }, [
        el('div', { class: 'card-title' }, 'Four kinds of statement, and which ones are requirements'),
        el('p', { style: 'font-size:21px;line-height:1.4' }, KINDS_INTRO),
        el('p', { style: 'font-size:19px;line-height:1.4;color:var(--text-muted)' }, THREAD),
      ]);
      const list = el('ol', { class: 'outcome-list', 'aria-label': 'By the end of this lecture you can' }, OUTCOMES.map((o, i) => el('li', {}, [el('span', { class: 'n', 'aria-hidden': 'true' }, String(i + 1)), el('span', {}, o)])));
      const order = el('div', { class: 'card', style: 'margin-top:16px;padding:14px 20px;max-width:660px' }, [   // left of the presenter corner (x < 1664)
        el('div', { class: 'card-title', style: 'margin-bottom:6px' }, 'Where the register goes next'),
        el('p', { style: 'font-size:20px;line-height:1.4' }, 'The requirements written this week return in Week 3 as models, in Week 8 as checks and in Week 12 when they change. Requirements are revisited, not finished once.'),
      ]);
      const right = el('div', {}, [el('div', { class: 'card-title' }, 'By the end of this lecture you can'), list, order]);
      body.appendChild(el('div', { class: 'page-columns' }, [el('div', { style: 'display:flex;flex-direction:column;gap:16px' }, [recall, kinds]), right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [el('h3', {}, 'Start from a request you received in words'), el('p', {}, 'Think of the last time someone asked you for something in one sentence: make it faster, make it simple, make it fair. What did you build first? Which words did you fill in without asking? How did you know whether they got what they needed?'),
          el('h3', {}, 'Four kinds of statement'), el('p', {}, KINDS_INTRO), el('h3', {}, 'The thread'), el('p', {}, THREAD),
          el('h3', {}, 'Where the register goes next'), el('p', {}, 'The requirements written this week return in Week 3 as models, in Week 8 as checks and in Week 12 when they change.')]),
        el('div', {}, [el('h3', {}, 'By the end of this lecture you can'), el('ol', { class: 'outcome-list' }, OUTCOMES.map((o, i) => el('li', {}, [el('span', { class: 'n' }, String(i + 1)), el('span', {}, o)])))]),
      ]));
    },
  };

  // =====================================================================
  // SCENE 1 · ambiguous-request (Anchor)
  // =====================================================================
  const EX = AR.example;
  const INTERP = AR.interpretations;   // Student, Department coordinator, Room staff
  const SAYS = AR.stakeholder_examples;
  const REQS = EX.requests;
  const outcomeOf = (rule) => EX.outcomes[rule];
  const ambiguousRequest = {
    id: 'ambiguous-request', role: 'anchor',
    heading: 'One sentence, three systems',
    lead: `${SENTENCE} Three people read the same six words and each describes a different booking service.`,
    principle: 'Ambiguity is resolved through examples and stakeholder decisions, not through more confident wording.',
    principleShort: 'Confident wording settles nothing; examples and decisions do.',
    conditions: [
      { id: 'developer-reads', baseline: true, label: 'Baseline: the developer reads the sentence alone and builds it', short: 'Developer decides',
        states: [
          { prompt: { question: 'What does fair mean in this sentence?', options: [INTERP[0].rule, `A ${lower1(INTERP[1].rule)}`, 'Staff requests come first'] }, caption: `The request as it arrived, and three requests for ${ROOM} at ${EX.slot} that will test every reading of it. Step to see what one confident reading builds.` },
          { caption: `The developer reads **fair** as ${lower1(INTERP[0].rule)} and rewrites the sentence with more confidence: **“${AR.developer_rewrite}”** More confident, and no more decided than before.` },
          { caption: `Built from the rewrite. ${outcomeOf(INTERP[0].rule).winner} asked first, so ${outcomeOf(INTERP[0].rule).winner} is confirmed; ${REQS[1].who} and the room staff see **not available**. The screen works exactly as written.` },
          { caption: `The department coordinator sees the result: “${SAYS[1].says}” Their reading of fair is **${lower1(INTERP[1].rule)}**: ${REQS[0].who} is at the limit of ${EX.weekly_limit}, so under their rule **${outcomeOf(INTERP[1].rule).winner}** gets the room.` },
          { caption: `The room staff see it too: “${SAYS[2].says}” Their reading is **${lower1(INTERP[2].rule)}**: under their rule the **${outcomeOf(INTERP[2].rule).winner.toLowerCase()} request** wins and both students are turned away.` },
          { caption: `Three rules, three different winners, one sentence, and all three could be defended from the same six words. The questions that were never asked: **${AR.open_questions.join('** **')}**` },
          { caption: `The rewrite decided nothing; it only sounded decided. And **easy** is a second ambiguity: ${lower1(AR.easy_question.label)} It goes to scene 4 and ${ruleIntro('R-05')} as an open quality question.`, principle: true },
        ] },
      { id: 'ask-stakeholders', label: 'Changed condition: each stakeholder is asked before anything is built', short: 'Ask first',
        states: [
          { caption: 'Same sentence, same three requests, no code yet. Each stakeholder is asked for an example of a fair outcome. Step to hear them one at a time.' },
          { caption: `**Student:** “${SAYS[0].says}” Rule: ${lower1(INTERP[0].rule)}. Example: ${outcomeOf(INTERP[0].rule).winner} is confirmed because ${outcomeOf(INTERP[0].rule).reason}.` },
          { caption: `**Department coordinator:** “${SAYS[1].says}” Rule: ${lower1(INTERP[1].rule)}. Example: ${outcomeOf(INTERP[1].rule).winner} is confirmed because ${outcomeOf(INTERP[1].rule).reason}.` },
          { caption: `**Room staff:** “${SAYS[2].says}” Rule: ${lower1(INTERP[2].rule)}. Example: the ${outcomeOf(INTERP[2].rule).winner.toLowerCase()} request is confirmed because ${outcomeOf(INTERP[2].rule).reason}.` },
          { caption: `Three winners from one sentence, on the table **before** any code. The conflict is not hidden inside a build; it is a decision that belongs to these people: ${AR.open_questions.join(' ')}` },
          { caption: `Settled for this lecture: **${AR.settled_scope.split(';')[0]}**. Left open, on purpose: the fairness policy, recorded as a decision the stakeholders still owe. And **${lower1(AR.easy_question.label)}** goes to scene 4 and ${ruleIntro('R-05')}.` },
          { caption: 'Same sentence, same people, a different service: the reading that reaches the screen is the one the stakeholders chose, with their examples written next to it.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const grid = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:560px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto;gap:16px 24px;align-content:start' });
      stage.appendChild(grid);
      // row 1: the sentence, and the rewrite (baseline) or the scope card (changed)
      const sentence = el('div', { class: 'card', style: 'grid-column:1;grid-row:1;padding:12px 18px' }, [
        el('div', { class: 'card-title', style: 'margin-bottom:4px' }, 'The request'),
        el('p', { style: 'font-size:30px;font-weight:600;font-family:var(--font-display);line-height:1.2' }, `“${SENTENCE}”`),
        el('p', { class: 'muted', style: 'font-size:17px;margin-top:6px' }, `Three requests for ${ROOM}, ${EX.slot}: ${REQS.map((r) => `${r.who} at ${r.asked_at}`).join(' · ')}`),
      ]);
      api.cue(sentence, 'sentence');
      h.rewrite = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'developer-reads', 'data-show-from': '1', style: 'grid-column:2;grid-row:1;padding:12px 18px;border-color:var(--warn)' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:4px;display:flex;gap:10px;align-items:center' }, ['The developer\'s rewrite', chip('more confident wording', 'warn', { style: 'font-size:15px' })]),
        el('p', { style: 'font-size:26px;font-weight:600;font-family:var(--font-display);line-height:1.2' }, `“${AR.developer_rewrite}”`),
        el('p', reveal({ class: 'rv muted', 'data-show-from': '6', style: 'font-size:18px;margin-top:6px' }), 'Decided nothing: it chose one reading and hid the other two.'),
      ]);
      api.cue(h.rewrite, 'rewrite');
      h.scope = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'ask-stakeholders', 'data-show-from': '5', style: 'grid-column:2;grid-row:1;padding:12px 18px;border-color:var(--ok)' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:4px' }, 'Settled and open, written down'),
        el('div', { style: 'display:flex;flex-direction:column;gap:6px;font-size:19px;line-height:1.3' }, [
          el('div', {}, [chip('settled', 'ok', { style: 'font-size:15px;margin-right:8px' }), upper1(AR.settled_scope.split(';')[0])]),
          el('div', {}, [chip('open decision', 'warn', { style: 'font-size:15px;margin-right:8px' }), 'Fairness policy: the stakeholders decide, with their examples']),
          el('div', {}, [chip('open quality question', 'violet', { style: 'font-size:15px;margin-right:8px' }), `${AR.easy_question.label} → ${AR.easy_question.routed_to}`]),
        ]),
      ]);
      api.cue(h.scope, 'scope');
      grid.append(sentence, h.rewrite, h.scope);
      // row 2: three cards, each a stakeholder's rule and the outcome of the three requests under it
      const row = el('div', { style: 'grid-column:1 / -1;grid-row:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;min-height:0;align-items:start' });
      const outcomeRows = (rule) => {
        const o = outcomeOf(rule);
        return REQS.map((r) => {
          const wins = r.who === o.winner;
          return el('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 10px;border-radius:8px;background:var(--bg-2);font-size:18px' }, [
            el('span', {}, [el('b', {}, r.who), el('span', { class: 'muted' }, ` · ${r.asked_at}${r.bookings_this_week != null ? ` · ${r.bookings_this_week} this week` : ''}`)]),
            el('span', { class: wins ? 'ok' : 'bad', style: 'font-weight:700;white-space:nowrap' }, wins ? '✓ Confirmed' : '✕ not available'),
          ]);
        });
      };
      const stakeholderCard = (i, header, extraClass) => {
        const rule = INTERP[i].rule;
        const c = el('div', { class: `card rv rv--rise fx ${extraClass || ''}`, style: 'padding:12px 16px;display:flex;flex-direction:column;gap:8px;min-height:0' }, [
          el('div', { class: 'card-title', style: 'margin-bottom:0' }, `${INTERP[i].stakeholder} · ${header}`),
          el('p', { style: 'font-size:19px;line-height:1.3;font-style:italic;color:var(--text-muted)' }, `“${SAYS[i].says}”`),
          el('div', {}, chip(rule, 'accent', { style: 'font-size:17px;white-space:normal' })),
          el('div', { style: 'display:flex;flex-direction:column;gap:4px' }, outcomeRows(rule)),
          el('p', { class: 'muted', style: 'font-size:16px' }, `Winner: ${outcomeOf(rule).winner}, ${outcomeOf(rule).reason}.`),
        ]);
        return c;
      };
      h.built = el('div', { class: 'card rv rv--rise fx', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:8px;min-height:0;border-color:var(--warn)' }, [
        el('div', { class: 'card-title', style: 'margin-bottom:0' }, 'Built from the rewrite'),
        el('p', { style: 'font-size:19px;line-height:1.3;color:var(--text-muted)' }, 'The screen confirms the earliest request and turns the others away.'),
        el('div', {}, chip(INTERP[0].rule, 'warn', { style: 'font-size:17px;white-space:normal' })),
        el('div', { style: 'display:flex;flex-direction:column;gap:4px' }, outcomeRows(INTERP[0].rule)),
        el('p', { class: 'muted', style: 'font-size:16px' }, 'Works exactly as written. Nobody else was asked.'),
      ]);
      h.student = stakeholderCard(0, 'asked before building');
      h.coordinator = stakeholderCard(1, 'reads the same sentence');
      h.staff = stakeholderCard(2, 'read the same sentence');
      api.cue(h.built, 'built'); api.cue(h.student, 'student'); api.cue(h.coordinator, 'coordinator'); api.cue(h.staff, 'staff');
      const col1 = el('div', { style: 'display:grid;min-height:0' }, [h.built, h.student]);
      h.built.style.gridArea = '1 / 1'; h.student.style.gridArea = '1 / 1';
      row.append(col1, h.coordinator, h.staff);
      grid.appendChild(row);
      // row 3: the questions nobody asked, the three winners, the easy question
      h.strip = el('div', { class: 'rv rv--rise', style: 'grid-column:1 / -1;grid-row:3;display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:10px 16px;border-radius:12px;border:1px solid var(--line);background:var(--surface)' }, [
        el('span', { class: 'card-title', style: 'margin:0' }, 'Never asked:'),
        ...AR.open_questions.map((q) => chip(q, 'warn', { style: 'font-size:18px' })),
        (h.winners = el('span', { class: 'muted', style: 'font-size:18px;margin-left:8px' }, `Three winners from one sentence: ${INTERP.map((x) => outcomeOf(x.rule).winner).join(', ')}.`)),
        (h.easy = el('span', { class: 'rv', style: 'margin-left:auto;display:inline-flex;align-items:center;gap:8px;font-size:18px' }, [chip(`${AR.easy_question.label} `, 'violet', { style: 'font-size:17px' }), el('span', { class: 'muted' }, `${listAnd(AR.easy_question.candidates)} → ${AR.easy_question.routed_to}`)])),
      ]);
      api.cue(h.strip, 'questions'); api.cue(h.easy, 'easy');
      grid.appendChild(h.strip);
      return h;
    },
    render(h, view) {
      const st = view.state, dev = view.conditionId === 'developer-reads';
      const show = (n, on) => n.classList.toggle('is-shown', !!on);
      show(h.built, dev && st >= 2); show(h.student, !dev && st >= 1);
      show(h.coordinator, dev ? st >= 3 : st >= 2); show(h.staff, dev ? st >= 4 : st >= 3);
      show(h.strip, dev ? st >= 5 : st >= 4); show(h.easy, dev ? st >= 6 : st >= 5);
      h.winners.style.display = (dev ? st >= 5 : st >= 4) ? '' : 'none';
      const focus = dev ? { 2: h.built, 3: h.coordinator, 4: h.staff }[st] : { 1: h.student, 2: h.coordinator, 3: h.staff }[st];
      [h.built, h.student, h.coordinator, h.staff].forEach((c) => { c.classList.toggle('is-focus', c === focus); c.style.borderColor = c === focus ? 'var(--warn)' : ''; });
      h.coordinator.querySelector('.card-title').textContent = `${INTERP[1].stakeholder} · ${dev ? 'objects after the build' : 'asked before building'}`;
      h.staff.querySelector('.card-title').textContent = `${INTERP[2].stakeholder} · ${dev ? 'object after the build' : 'asked before building'}`;
    },
    print: [
      { title: 'One confident reading, built, and the two objections it met', condition: 'developer-reads', state: 5, note: `The rewrite “${AR.developer_rewrite}” chose one reading of fair. Three requests for ${ROOM} at ${EX.slot}: under first come, first served ${outcomeOf(INTERP[0].rule).winner} wins; under a weekly limit of ${EX.weekly_limit} ${outcomeOf(INTERP[1].rule).winner} wins; under staff priority the staff request wins. The questions never asked: ${AR.open_questions.join(' ')}` },
      { title: 'The same sentence read with each stakeholder first: settled scope and open decisions', condition: 'ask-stakeholders', state: 5, principle: true, note: `Settled for this lecture: ${AR.settled_scope}. Easy is a separate ambiguity (${lower1(AR.easy_question.label)} ${listAnd(AR.easy_question.candidates)}), routed to ${AR.easy_question.routed_to}. The requests, counts and limit are simulated example values.` },
    ],
  };

  // =====================================================================
  // SCENE 2 · elicitation-and-scope (Bridge)
  // =====================================================================
  const ES = A['w02/elicitation-and-scope'];
  const BQ = ES.boundary_questions;     // identity, cancellation, accessibility, closures
  const REG = ES.register;              // F1, A1, F2, A2
  const KIND_STYLE = { fact: ['ok', 'Fact · stated'], assumption: ['warn', 'Assumption · inferred'], question: ['violet', 'Open question'], deferred: ['accent', 'Deferred · decided'], omitted: ['bad', 'Omitted · nothing written'] };
  const elicitationAndScope = {
    id: 'elicitation-and-scope', role: 'bridge',
    heading: 'The user asked for an email. Is that the requirement?',
    lead: `${ARI.name} asks for another confirmation email. Before building it, find out what happened, and write down what is known, assumed and still open.`,
    principle: 'An explicit boundary and an open-question register make uncertainty discussable.',
    principleShort: 'Write down what you know, what you assume, and what is open.',
    conditions: [
      { id: 'email-request', baseline: true, label: 'Baseline: a campus member asks for a second confirmation email', short: 'Email request',
        states: [
          { prompt: { question: `${ARI.name} asks for ${ES.requested_solution}. What do you build?`, options: ['A second email, as requested', 'Ask what happened last time', 'Nothing: one email is enough'] }, caption: `The dashed line is the scope of this release: ${lower1(ES.scope_boundary.split(': ')[1])}. Step to answer the request with a question.` },
          { caption: `Instead of a second email, one question: **“${ES.elicitation_question}”** A request names a solution; the question looks for the situation behind it.` },
          { caption: `The answer [[simulated observation]]: **“${ES.observation}”** That is a fact ${ARI.name} stated, so it goes into the register as a fact, with who said it.` },
          { caption: `Requested: **${ES.requested_solution}**. Needed: **to ${ES.underlying_need}**. That a second email would tell ${ARI.name} the outcome is an assumption the developer inferred; it goes into the register as one.` },
          { caption: `A small prototype separates three outcomes on the screen itself: **${ES.prototype_states.join('**, **')}**. ${ES.comparison}` },
          { caption: `Now widen the question to a guest at the boundary. Before accepting any request from a guest: **${BQ[0].question}** **${BQ[1].question}** Two open questions, marked on the line.` },
          { caption: `**${BQ[2].question}** That one is already a stated rule, ${ruleIntro('R-05')}. **${BQ[3].question}** Open until Week 14. Two more register rows separate what the coordinator stated from what the developer inferred.` },
          { caption: 'Facts have a speaker, assumptions have an author, questions have a place on the line. The register makes each of them something the team can talk about.', principle: true },
        ] },
      { id: 'external-visitor', label: 'Changed condition: an external visitor appears; the boundary stays', short: 'A visitor appears',
        states: [
          { caption: `A new stakeholder: an ${lower1(ES.visitor.label)}, outside the campus and outside the dashed line. The line does not move. What is written about the visitor decides what happens next.` },
          { caption: `**Deferred, explicitly:** “${ES.visitor.deferred.text}.” ${upper1(ES.visitor.deferred.record)}.` },
          { caption: `**Omitted, accidentally:** ${ES.visitor.omitted.text}. ${upper1(ES.visitor.omitted.record)}.` },
          { caption: 'Same boundary, same visitor. A deferred behavior is a decision with a date and an owner; an omitted one is a surprise waiting at the door.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:600px minmax(0,1fr);gap:24px;' });
      // ---- left: the scope map
      const W = 600, H = 680;
      const svg = window.VC.svg(W, H, { label: 'Scope map of this release with questions at its boundary', uid: (x) => api.uid(x) });
      const bx = 40, by = 100, bw = 520, bh = 360;
      svg.appendChild(boundary({ x: bx, y: by, w: bw, h: bh, label: 'This release' }));
      svg.appendChild(text(bx + 20, by + 56, 'campus members book rooms', { class: 'n-sub', style: 'font-size:17px' }));
      const booking = node({ x: bx + 160, y: by + 100, w: 200, h: 76, label: ['Booking screen', 'and decision'] });
      svg.appendChild(booking); api.cue(booking, 'booking');
      const ari = person({ x: bx + 80, y: by + 250, name: `${ARI.name} · ${ARI.id}`, role: 'campus member' });
      const staff = person({ x: bx + 440, y: by + 250, name: 'Room staff', role: 'run the rooms' });
      svg.append(ari, staff); api.cue(ari, 'ari'); api.cue(staff, 'room-staff');
      svg.appendChild(arrow(svg, { from: { x: bx + 110, y: by + 240 }, to: { x: bx + 160, y: by + 160 }, kind: 'accent', label: 'books', labelDx: -30 }));
      const guest = person({ x: 150, y: 580, name: 'Guest', role: 'not a member', cls: 'dm' });
      svg.appendChild(guest); api.cue(guest, 'guest');
      svg.appendChild(arrow(svg, { from: { x: 150, y: 520 }, to: { x: 150, y: by + bh }, kind: 'warn', dashed: true, label: 'asks to book', labelDx: -64 }));
      h.visitor = s('g', { class: 'rv rv--rise', 'data-cond': 'external-visitor', 'data-show-from': '0' });
      h.visitor.appendChild(person({ x: 450, y: 580, name: ES.visitor.label, role: 'outside the campus' }));
      h.visitor.appendChild(arrow(svg, { from: { x: 450, y: 520 }, to: { x: 450, y: by + bh }, kind: 'violet', dashed: true }));
      svg.appendChild(h.visitor); api.cue(h.visitor, 'visitor');
      // question badges on the boundary line
      const spots = { identity: { x: bx + bw / 2, y: by, kind: 'violet', anchor: 'middle' }, cancellation: { x: bx + bw - 6, y: by + 50, kind: 'violet', anchor: 'end' }, accessibility: { x: bx + 6, y: by + 80, kind: 'ok', anchor: 'start' }, closures: { x: bx + 400, y: by + bh, kind: 'violet', anchor: 'middle' } };
      const labels = { identity: '? identity', cancellation: '? cancellation rights', accessibility: 'rule R-05: keyboard completion', closures: '? room closures (Week 14)' };
      h.badges = {};
      BQ.forEach((q, i) => {
        const sp = spots[q.id];
        const b = badge({ x: sp.x, y: sp.y, label: labels[q.id], kind: sp.kind, anchor: sp.anchor, cls: 'rv rv--rise' });
        b.setAttribute('data-cond', 'email-request'); b.setAttribute('data-show-from', String(i < 2 ? 5 : 6));
        svg.appendChild(b); api.cue(b, `question-${q.id}`); h.badges[q.id] = b;
      });
      // deferred / omitted marks (changed condition)
      h.deferredMark = badge({ x: W - 8, y: 36, label: 'deferred: told at the screen', kind: 'accent', anchor: 'end', cls: 'rv rv--rise' });
      h.deferredMark.setAttribute('data-cond', 'external-visitor'); h.deferredMark.setAttribute('data-show-from', '1');
      h.omittedMark = badge({ x: W - 8, y: 72, label: 'omitted: finds out at the door', kind: 'bad', anchor: 'end', cls: 'rv rv--rise' });
      h.omittedMark.setAttribute('data-cond', 'external-visitor'); h.omittedMark.setAttribute('data-show-from', '2');
      svg.append(h.deferredMark, h.omittedMark);
      wrap.appendChild(svg); api.cue(svg, 'map');
      // ---- right: conversation, need, prototype, register
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0;min-height:0' });
      const bubble = (who, textStr, attrs) => el('div', Object.assign({ style: 'display:grid;grid-template-columns:52px 1fr;gap:10px;align-items:start;font-size:18px;line-height:1.28' }, attrs || {}), [el('span', { class: 'muted', style: 'font-weight:700' }, who), el('span', {}, textStr)]);
      h.conversation = el('div', { class: 'card', 'data-cond': 'email-request', style: 'padding:8px 14px;display:flex;flex-direction:column;gap:4px' }, [
        el('div', { class: 'card-title', style: 'margin-bottom:2px' }, 'The conversation'),
        bubble(ARI.name, `“Please send me ${ES.requested_solution}.”`),
        bubble('You', `“${ES.elicitation_question}”`, reveal({ class: 'rv', 'data-show-from': '1' })),
        bubble(ARI.name, [`“${ES.observation}”`, ' ', el('span', { class: 'example-tag' }, 'simulated observation')], reveal({ class: 'rv', 'data-show-from': '2' })),
      ]);
      api.cue(h.conversation, 'conversation');
      h.need = el('div', reveal({ class: 'rv rv--rise', 'data-cond': 'email-request', 'data-show-from': '3', style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px' }), [
        el('div', { class: 'callout callout--bad', style: 'font-size:18px;padding:6px 12px' }, [el('b', {}, 'Requested: '), ES.requested_solution]),
        el('div', { class: 'callout callout--ok', style: 'font-size:18px;padding:6px 12px' }, [el('b', {}, 'Needed: '), `to ${ES.underlying_need}`]),
      ]);
      api.cue(h.need, 'need');
      const mini = (label, kind) => el('div', { style: `flex:1;border:1.5px solid var(--${kind === 'wait' ? 'line-strong' : kind});border-radius:10px;padding:8px 10px;background:var(--bg-2);font-size:18px;font-weight:600;color:var(--${kind === 'wait' ? 'text-muted' : kind});display:flex;align-items:center;gap:8px` }, [el('span', { 'aria-hidden': 'true' }, kind === 'ok' ? '✓' : kind === 'bad' ? '?' : '…'), label]);
      h.proto = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'email-request', 'data-show-from': '4', style: 'padding:8px 14px' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:6px;font-size:17px' }, 'Prototype: three outcomes the screen tells apart'),
        el('div', { style: 'display:flex;gap:10px' }, [mini(ES.prototype_states[0], 'wait'), mini(ES.prototype_states[1], 'ok'), mini(ES.prototype_states[2], 'bad')]),
      ]);
      api.cue(h.proto, 'prototype');
      h.visitorCard = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'external-visitor', 'data-show-from': '1', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:8px' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:2px' }, `${ES.visitor.label}: two ways to leave it out`),
        el('div', { class: 'callout callout--accent', style: 'font-size:18px;padding:8px 14px' }, [el('b', {}, 'Deferred: '), `${ES.visitor.deferred.text}. ${upper1(ES.visitor.deferred.record)}.`]),
        el('div', reveal({ class: 'rv callout callout--bad', 'data-show-from': '2', style: 'font-size:18px;padding:8px 14px' }), [el('b', {}, 'Omitted: '), `${ES.visitor.omitted.text}. ${upper1(ES.visitor.omitted.record)}.`]),
      ]);
      api.cue(h.visitorCard, 'visitor-card');
      const kindCell = (kind) => chip(KIND_STYLE[kind][1], KIND_STYLE[kind][0], { style: 'font-size:14px;white-space:normal' });
      const rows = [
        { attrs: { class: 'rv', 'data-cond': 'email-request', 'data-show-from': '2', 'data-focus-at': '2' }, cells: { kind: kindCell('fact'), text: REG[0].text, who: REG[0].who } },
        { attrs: { class: 'rv', 'data-cond': 'email-request', 'data-show-from': '3', 'data-focus-at': '3' }, cells: { kind: kindCell('assumption'), text: REG[1].text, who: REG[1].who } },
        { attrs: { class: 'rv', 'data-show-from': '0', 'data-cond': 'external-visitor' }, cells: { kind: kindCell('fact'), text: REG[2].text, who: REG[2].who } },
        { attrs: { class: 'rv', 'data-show-from': '0', 'data-cond': 'external-visitor' }, cells: { kind: kindCell('assumption'), text: REG[3].text, who: REG[3].who } },
        { attrs: { class: 'rv', 'data-cond': 'email-request', 'data-show-from': '6', 'data-focus-at': '6' }, cells: { kind: kindCell('fact'), text: REG[2].text, who: REG[2].who } },
        { attrs: { class: 'rv', 'data-cond': 'email-request', 'data-show-from': '6', 'data-focus-at': '6' }, cells: { kind: kindCell('assumption'), text: REG[3].text, who: REG[3].who } },
        { attrs: { class: 'rv', 'data-cond': 'external-visitor', 'data-show-from': '1', 'data-focus-at': '1' }, cells: { kind: kindCell('deferred'), text: ES.visitor.deferred.text, who: 'dated, with an owner' } },
        { attrs: { class: 'rv', 'data-cond': 'external-visitor', 'data-show-from': '2', 'data-focus-at': '2', style: 'opacity:0.75' }, cells: { kind: kindCell('omitted'), text: ES.visitor.omitted.text, who: 'nobody; nothing to point at' } },
      ];
      h.register = table({ captionHidden: 'The register: what is known, assumed and open', cls: 'data-table--compact', columns: [{ key: 'kind', label: 'Kind', cls: 'col-kind' }, { key: 'text', label: 'Statement' }, { key: 'who', label: 'Who' }], rows });
      h.register.querySelectorAll('td, th').forEach((c) => { c.style.padding = '5px 9px'; c.style.fontSize = '17px'; c.style.lineHeight = '1.25'; });
      h.register.querySelectorAll('th.col-kind').forEach((th) => { th.style.width = '150px'; });
      api.cue(h.register, 'register');
      right.append(h.conversation, h.need, h.proto, h.visitorCard, el('div', { style: 'min-height:0;overflow:hidden' }, h.register));
      wrap.appendChild(right);
      stage.appendChild(wrap);
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'email-request';
      Object.entries(h.badges).forEach(([id, b], i) => b.classList.toggle('is-focus', base && ((i < 2 && st === 5) || (i >= 2 && st === 6))));
    },
    print: [
      { title: 'From a requested email to the need behind it', condition: 'email-request', state: 4, note: `${ARI.name} asked for ${ES.requested_solution}; the question “${ES.elicitation_question}” produced a simulated observation: ${lower1(ES.observation)} The need is to ${ES.underlying_need}. The prototype tells ${ES.prototype_states.join(', ')} apart; ${lower1(ES.comparison)}` },
      { title: 'Questions at the boundary and the register of facts, assumptions and open questions', condition: 'email-request', state: 7, principle: true, note: `Before accepting a guest's request: ${BQ.map((q) => q.question).join(' ')} Facts carry a speaker, assumptions an author, questions a place on the line.` },
      { title: 'A visitor appears: deferred explicitly, or omitted by accident', condition: 'external-visitor', state: 3, note: `Deferred: ${ES.visitor.deferred.text}, ${ES.visitor.deferred.record}. Omitted: ${ES.visitor.omitted.text}, ${ES.visitor.omitted.record}.` },
    ],
  };

  // =====================================================================
  // SCENE 3 · observable-behavior (Anchor)
  // =====================================================================
  const OB = A['w02/observable-behavior'];
  const CASES = F.duration_cases;                 // 29 F, 30 T, 31 T, 119 T, 120 T, 121 F
  const SHOWN = [29, 30, 120, 121];
  const V90 = OB.variant_90;
  const AI = OB.ai_beat;
  const W13 = A['w13/plausible-candidate'];
  const EXCLUSIVE = W13.snippets[0];              // the fluent candidate with the exclusive bound
  const durValid = (m, hi) => m >= DUR.min && m <= hi;
  const observableBehavior = {
    id: 'observable-behavior', role: 'anchor',
    heading: 'Turn “short booking” into a rule you can examine',
    lead: 'Four requests: 29, 30, 120 and 121 minutes. Which should be accepted? Decide, then reveal the rule and its examples.',
    principle: 'A useful requirement makes meaningful differences between acceptable and unacceptable outcomes visible.',
    principleShort: 'A good rule shows exactly where accepted turns into rejected.',
    conditions: [
      { id: 'rule-120', baseline: true, label: `Baseline: rule R-02, ${DUR.min} through ${DUR.max} minutes inclusive`, short: 'Rule 30–120',
        states: [
          { prompt: { question: 'Which of 29, 30, 120 and 121 minutes should be accepted?', options: ['Only 30', '30 and 120', '30, 120 and 121'] }, caption: 'Four requests on a ruler of minutes. “Keep bookings short” draws no line. Step to reveal the rule.' },
          { caption: `${ruleIntro('R-02')}: a booking lasts **at least ${DUR.min} and at most ${DUR.max} minutes, inclusive**. The band on the ruler is the rule; both ends belong to it.` },
          { caption: `The four examples, one row each: **29 rejected, 30 accepted, 120 accepted, 121 rejected**. Two of them sit one minute outside the band, two sit exactly on its ends. That is where a rule shows what it means.` },
          { caption: `The rule written out in four parts: **who** (${OB.rule_parts.actor}), **under what condition** (${OB.rule_parts.condition}), **expected behavior** (${OB.rule_parts.expected}), **rejection behavior** (${OB.rule_parts.rejection}).` },
          { caption: `A proposed screen: **${OB.widget.proposal}**. That is a solution, not the requirement: ${OB.widget.note}. The rule and the examples stay the same whichever screen is built.` },
          { caption: `One more request: start ${OB.invalid_shape.start}, end ${OB.invalid_shape.end}. It is **${OB.invalid_shape.outcome}**. One boundary rule does not describe every validity condition; the register needs the shape rule too.` },
          { caption: 'Two accepted, two rejected, one minute apart at each end. The difference between acceptable and unacceptable is visible in the examples; that is what makes the rule useful.', principle: true },
        ] },
      { id: 'variant-90', label: `Temporary variant: upper limit ${V90.cases[1].minutes} minutes, a comparison only`, short: 'Variant 30–90',
        states: [
          { caption: `Only the upper limit changes, from ${DUR.max} to ${V90.cases[1].minutes} minutes, and the card says so: temporary variant. The band on the ruler ends earlier. Which examples change?` },
          { caption: `New rows at the new edge: **${V90.cases[0].minutes} accepted, ${V90.cases[1].minutes} accepted, ${V90.cases[2].minutes} rejected**. And one old row flips: **${DUR.max} minutes is now rejected**.` },
          { caption: `The rows at the lower end, 29 and 30, are unchanged: the lower limit was not touched. Then the canonical rule is restored: **${V90.restore}**.` },
          { caption: 'Change one number in the rule and exactly the examples at that edge change. Examples are how you see what a change means before anything is built.', principle: true },
        ] },
      { id: 'assistant-drafts', label: 'Changed condition: two drafting requests to an assistant, one vague and one with R-02', short: 'Assistant',
        states: [
          { caption: `Two prepared requests to an automated assistant. Request A says only **“${AI.request_a}”**. Request B carries **${AI.request_b}**. The candidates below are authored fixtures for this comparison.` },
          { caption: `Candidate A ${AI.candidate_a}: the code says ${AI.invented_limit_minutes}. Nobody asked for ${AI.invented_limit_minutes}; the request had no number, so the candidate supplied one. There is nothing to judge it against.` },
          { caption: `Candidate B ${AI.candidate_b}: \`${DUR.min} <= duration <= ${DUR.max}\`. The precise request made the candidate easy to compare with the rule, line by line.` },
          { caption: `A precise request still does not settle it. Another candidate for the same R-02, from Week 13: a fluent explanation, “${W13.explanation_claims}”, and the code \`30 <= duration < 120\`. The explanation says inclusive; the code is not.` },
          { caption: `The independent example decides: **${W13.counterexample_minutes} minutes must be accepted**. Candidate B accepts it; the fluent candidate rejects it. Candidate B is the one that matches R-02.` },
          { caption: `A precise requirement makes a draft checkable; the check still has to be made. The rule made an independent judgment possible, and the ${W13.counterexample_minutes}-minute example made it.`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-rows:170px minmax(0,1fr);gap:16px;' });
      // ---- ruler
      const W = 1264, H = 170, x0 = 70, x1 = 1200, maxMin = 150;
      const mx = (m) => x0 + (x1 - x0) * m / maxMin;
      const svg = window.VC.svg(W, H, { label: 'Ruler of booking durations in minutes with the accepted band and the example requests', uid: (x) => api.uid(x) });
      const ly = 112;
      svg.appendChild(text(x0, 24, 'Duration of the request, in minutes', { class: 'n-kind' }));
      h.band120 = s('rect', { class: 'rv', 'data-cond': 'rule-120,assistant-drafts', 'data-show-from': '1', x: mx(DUR.min), y: ly - 26, width: mx(DUR.max) - mx(DUR.min), height: 52, rx: 8, fill: 'var(--ok-fill)', stroke: 'var(--ok)', 'stroke-width': 2.5 });
      h.band90 = s('rect', { class: 'rv', 'data-cond': 'variant-90', 'data-show-from': '0', x: mx(DUR.min), y: ly - 26, width: mx(V90.cases[1].minutes) - mx(DUR.min), height: 52, rx: 8, fill: 'var(--warn-fill)', stroke: 'var(--warn)', 'stroke-width': 2.5, 'stroke-dasharray': '10 7' });
      svg.append(h.band120, h.band90);
      svg.appendChild(s('line', { x1: x0, y1: ly, x2: x1, y2: ly, stroke: 'var(--line-strong)', 'stroke-width': 3 }));
      for (let m = 0; m <= maxMin; m += 30) {
        svg.appendChild(s('line', { x1: mx(m), y1: ly - 8, x2: mx(m), y2: ly + 8, stroke: 'var(--line-strong)', 'stroke-width': 2 }));
        svg.appendChild(text(mx(m), ly + 34, String(m), { class: 'n-sub', 'text-anchor': 'middle', style: 'font-size:18px' }));
      }
      const bandLabel = (cond, hi, kind, from) => { const t = text((mx(DUR.min) + mx(hi)) / 2, ly + 6, `accepted: ${DUR.min} to ${hi}`, { class: 'rv n-label', 'data-cond': cond, 'data-show-from': String(from), 'text-anchor': 'middle', style: `font-size:19px;fill:var(--${kind})` }); svg.appendChild(t); return t; };
      bandLabel('rule-120,assistant-drafts', DUR.max, 'ok', 1); bandLabel('variant-90', V90.cases[1].minutes, 'warn', 0);
      /** A request pin: a marker on the ruler with its minutes above; colored once its verdict is revealed. */
      h.pins = {};
      const pin = (m, cond, from, verdictFrom, valid, dy) => {
        const g = s('g', { class: 'rv rv--rise', 'data-cond': cond, 'data-show-from': String(from) });
        const py = ly - 30 - (dy || 0);
        g.appendChild(s('path', { d: `M${mx(m)},${ly - 6} l-9,-16 h18 z`, fill: 'var(--text)', class: 'pin-head' }));
        g.appendChild(s('line', { x1: mx(m), y1: py + 8, x2: mx(m), y2: ly - 22, stroke: 'var(--text)', 'stroke-width': 2, class: 'pin-line' }));
        g.appendChild(text(mx(m), py, String(m), { class: 'n-label pin-text', 'text-anchor': 'middle', style: 'font-size:22px' }));
        svg.appendChild(g);
        h.pins[`${cond}:${m}`] = { g, verdictFrom, valid };
        api.cue(g, `pin-${cond.split(',')[0]}-${m}`);
        return g;
      };
      pin(29, 'rule-120', 0, 2, false, 0); pin(30, 'rule-120', 0, 2, true, 28); pin(120, 'rule-120', 0, 2, true, 0); pin(121, 'rule-120', 0, 2, false, 28);
      pin(89, 'variant-90', 1, 1, true, 0); pin(90, 'variant-90', 1, 1, true, 28); pin(91, 'variant-90', 1, 1, false, 56); pin(120, 'variant-90', 1, 1, false, 0);
      pin(29, 'variant-90', 2, 2, false, 0); pin(30, 'variant-90', 2, 2, true, 28);
      pin(AI.invented_limit_minutes, 'assistant-drafts', 1, 99, false, 0); pin(120, 'assistant-drafts', 4, 4, true, 0);
      h.invented = badge({ x: mx(AI.invented_limit_minutes) + 30, y: 52, label: `${AI.invented_limit_minutes}: invented by candidate A`, kind: 'bad', anchor: 'start', cls: 'rv rv--rise' });
      h.invented.setAttribute('data-cond', 'assistant-drafts'); h.invented.setAttribute('data-show-from', '1');
      svg.appendChild(h.invented);
      h.restored = badge({ x: mx(DUR.max) + 30, y: 52, label: `restored: ${V90.restore}`, kind: 'ok', anchor: 'start', cls: 'rv rv--rise' });
      h.restored.setAttribute('data-cond', 'variant-90'); h.restored.setAttribute('data-show-from', '2');
      svg.appendChild(h.restored);
      wrap.appendChild(svg); api.cue(svg, 'ruler');
      // ---- lower area, baseline and variant: rule card + widget on the left, examples on the right
      const lower = el('div', { 'data-cond': 'rule-120,variant-90', style: 'display:grid;grid-template-columns:600px minmax(0,1fr);gap:24px;min-height:0;align-items:start' });
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' });
      h.ruleCard = el('div', reveal({ class: 'card rv rv--rise', 'data-show-from': '1', style: 'padding:12px 18px;display:flex;flex-direction:column;gap:8px' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:0;display:flex;gap:10px;align-items:center' }, [(h.ruleTitle = el('span', {}, 'Rule R-02')), (h.ruleTag = el('span', { class: 'example-tag' }, 'example assumption'))]),
        (h.ruleText = el('p', { style: 'font-size:22px;font-weight:600;font-family:var(--font-display);line-height:1.25' }, '')),
        el('dl', reveal({ class: 'rv', 'data-cond': 'rule-120', 'data-show-from': '3', style: 'display:grid;grid-template-columns:max-content 1fr;gap:3px 14px;margin:2px 0 0;font-size:17px;line-height:1.28' }), [
          el('dt', { class: 'muted', style: 'margin:0' }, 'Who'), el('dd', { style: 'margin:0' }, OB.rule_parts.actor),
          el('dt', { class: 'muted', style: 'margin:0' }, 'Condition'), el('dd', { style: 'margin:0' }, OB.rule_parts.condition),
          el('dt', { class: 'muted', style: 'margin:0' }, 'Expected'), el('dd', { style: 'margin:0' }, OB.rule_parts.expected),
          el('dt', { class: 'muted', style: 'margin:0' }, 'Rejection'), el('dd', { style: 'margin:0' }, OB.rule_parts.rejection),
        ]),
      ]);
      api.cue(h.ruleCard, 'rule');
      const slider = el('div', { style: 'position:relative;height:34px;margin:4px 0 0' }, [
        el('div', { style: 'position:absolute;left:0;right:0;top:16px;height:6px;border-radius:3px;background:var(--line-strong)' }),
        el('div', { style: 'position:absolute;left:20%;width:60%;top:16px;height:6px;border-radius:3px;background:var(--accent)' }),
        el('div', { style: 'position:absolute;left:20%;top:8px;width:22px;height:22px;border-radius:50%;background:var(--accent-strong);margin-left:-11px' }),
        el('div', { style: 'position:absolute;left:80%;top:8px;width:22px;height:22px;border-radius:50%;background:var(--accent-strong);margin-left:-11px' }),
        el('span', { class: 'muted', style: 'position:absolute;left:20%;top:-4px;transform:translateX(-50%);font-size:15px' }, String(DUR.min)),
        el('span', { class: 'muted', style: 'position:absolute;left:80%;top:-4px;transform:translateX(-50%);font-size:15px' }, String(DUR.max)),
      ]);
      h.widget = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'rule-120', 'data-show-from': '4', style: 'padding:8px 16px 8px' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:0;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:17px' }, [`A proposed screen: ${OB.widget.proposal}`, chip('a solution, not the requirement', 'violet', { style: 'font-size:14px' })]),
        slider,
        el('p', { class: 'muted', style: 'font-size:16px;line-height:1.3' }, upper1(OB.widget.note) + '.'),
      ]);
      api.cue(h.widget, 'widget');
      left.append(h.ruleCard, h.widget);
      const exRow = (m, cond, from, hi, focusAt, note) => ({ attrs: { class: 'rv', 'data-cond': cond, 'data-show-from': String(from), 'data-focus-at': focusAt || '' }, cells: { req: `${m} minutes`, rule: (durValid(m, hi) ? `inside ${DUR.min} to ${hi}` : (m < DUR.min ? `below ${DUR.min}` : `above ${hi}`)) + (note ? ` (${note})` : ''), out: verdict(durValid(m, hi)) } });
      const rows = [
        ...SHOWN.map((m) => exRow(m, 'rule-120', 2, DUR.max, '2')),
        { attrs: { class: 'rv', 'data-cond': 'rule-120', 'data-show-from': '5', 'data-focus-at': '5' }, cells: { req: `start ${OB.invalid_shape.start}, end ${OB.invalid_shape.end}`, rule: 'end is not later than start: a shape rule, not a duration decision', out: verdict(false, '', 'rejected: malformed interval') } },
        ...V90.cases.map((c) => exRow(c.minutes, 'variant-90', 1, V90.cases[1].minutes, '1')),
        exRow(120, 'variant-90', 1, V90.cases[1].minutes, '1', `was accepted under ${DUR.max}`),
        exRow(29, 'variant-90', 2, V90.cases[1].minutes, '2', 'unchanged'), exRow(30, 'variant-90', 2, V90.cases[1].minutes, '2', 'unchanged'),
      ];
      h.examples = table({ caption: 'Examples: request, what the rule says, what the screen shows', cls: 'data-table--compact', columns: [{ key: 'req', label: 'Request', cls: 'col-req' }, { key: 'rule', label: 'The rule says' }, { key: 'out', label: 'The screen shows', cls: 'col-out' }], rows });
      h.examples.querySelectorAll('th.col-req').forEach((th) => { th.style.width = '150px'; });
      h.examples.querySelectorAll('th.col-out').forEach((th) => { th.style.width = '210px'; });
      api.cue(h.examples, 'examples');
      lower.append(left, el('div', { style: 'min-width:0' }, h.examples));
      wrap.appendChild(lower);
      // ---- lower area, AI beat: two requests, three candidates, one deciding example
      const ai = el('div', { 'data-cond': 'assistant-drafts', style: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:auto auto;gap:10px 18px;min-height:0;align-content:start' });
      const reqCard = (title, body, kind) => el('div', { class: `callout callout--${kind}`, style: 'font-size:18px;padding:6px 12px;line-height:1.3' }, [el('b', {}, `${title}: `), body]);
      const candCard = (title, code, from, tagText, tagKind) => el('div', reveal({ class: 'card rv rv--rise', 'data-show-from': String(from), style: 'padding:10px 14px;display:flex;flex-direction:column;gap:8px;min-width:0' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:0;display:flex;gap:8px;align-items:center;flex-wrap:wrap' }, [title, chip(tagText, tagKind, { style: 'font-size:14px' })]),
        codeBlock(code, { style: 'margin:0;font-size:15px;line-height:1.3;padding:6px 10px;white-space:pre-wrap;word-break:break-word' }),
      ]);
      h.candA = candCard('Candidate A', AI.candidate_a_code, 1, `${AI.candidate_a}`, 'bad');
      h.candB = candCard('Candidate B', AI.candidate_b_code, 2, AI.candidate_b, 'ok');
      h.candX = candCard('Another candidate for R-02 (Week 13)', EXCLUSIVE.code, 3, `says “${W13.explanation_claims}”; code is exclusive`, 'warn');
      api.cue(h.candA, 'candidate-a'); api.cue(h.candB, 'candidate-b'); api.cue(h.candX, 'candidate-exclusive');
      const colA = el('div', { style: 'display:flex;flex-direction:column;gap:10px;min-width:0' }, [reqCard('Request A', `“${AI.request_a}”`, 'bad'), h.candA]);
      const colB = el('div', { style: 'display:flex;flex-direction:column;gap:10px;min-width:0' }, [reqCard('Request B', `${AI.request_b}: ${DUR.min} through ${DUR.max} minutes inclusive`, 'ok'), h.candB]);
      const colX = el('div', { style: 'display:flex;flex-direction:column;gap:10px;min-width:0' }, [el('div', reveal({ class: 'rv callout callout--accent', 'data-show-from': '3', style: 'font-size:18px;padding:6px 12px;line-height:1.3' }), [el('b', {}, 'Same request B, '), 'a different draft']), h.candX]);
      api.cue(colA, 'request-a'); api.cue(colB, 'request-b');
      const judged = table({ captionHidden: 'The deciding examples for R-02', cls: 'data-table--compact', columns: [{ key: 'm', label: 'Request' }, { key: 'exp', label: 'R-02 expects' }, { key: 'b', label: 'Candidate B' }, { key: 'x', label: 'Fluent candidate' }],
        rows: AI.judged_cases.map((c) => ({ attrs: { class: 'rv', 'data-show-from': '4', 'data-focus-at': c.minutes === W13.counterexample_minutes ? '4-5' : '' }, cells: { m: `${c.minutes} minutes`, exp: verdict(c.expected), b: [okMark(c.candidate_b === c.expected), c.candidate_b ? 'accepts' : 'rejects'], x: [okMark(c.exclusive_candidate === c.expected), c.exclusive_candidate ? 'accepts' : 'rejects'] } })) });
      api.cue(judged, 'judged');
      const judgedWrap = el('div', reveal({ class: 'rv rv--rise', 'data-show-from': '4', style: 'grid-column:1 / -1' }), judged);
      ai.append(colA, colB, colX, judgedWrap);
      wrap.appendChild(ai);
      stage.appendChild(wrap);
      return h;
    },
    render(h, view) {
      const st = view.state, c = view.conditionId;
      const hi = c === 'variant-90' ? V90.cases[1].minutes : DUR.max;
      h.ruleTitle.textContent = c === 'variant-90' ? 'Rule R-02 · temporary variant' : 'Rule R-02';
      h.ruleTag.textContent = c === 'variant-90' ? 'comparison only' : 'example assumption';
      h.ruleText.textContent = `A booking lasts at least ${DUR.min} and at most ${hi} minutes, inclusive.`;
      h.ruleCard.style.borderColor = c === 'variant-90' ? 'var(--warn)' : '';
      if (c === 'variant-90') h.ruleCard.classList.add('is-shown');
      Object.entries(h.pins).forEach(([key, p]) => {
        const [cond] = key.split(':');
        const decided = cond === c && st >= p.verdictFrom;
        const color = decided ? `var(--${p.valid ? 'ok' : 'bad'})` : 'var(--text)';
        p.g.querySelector('.pin-head').setAttribute('fill', color);
        p.g.querySelector('.pin-line').setAttribute('stroke', color);
        p.g.querySelector('.pin-text').style.fill = color;
      });
    },
    print: [
      { title: 'The rule, its four parts and the examples at both ends', condition: 'rule-120', state: 5, note: `R-02 in four parts: who (${OB.rule_parts.actor}); condition (${OB.rule_parts.condition}); expected (${OB.rule_parts.expected}); rejection (${OB.rule_parts.rejection}). The examples: ${SHOWN.map((m) => `${m} ${durValid(m, DUR.max) ? 'accepted' : 'rejected'}`).join(', ')}; start ${OB.invalid_shape.start} end ${OB.invalid_shape.end} ${OB.invalid_shape.outcome}. The slider is a solution, not the requirement.` },
      { title: `The temporary ${V90.cases[1].minutes}-minute variant, a comparison only`, condition: 'variant-90', state: 2, note: `Only the upper limit changes: ${V90.cases.map((x) => `${x.minutes} ${x.valid ? 'accepted' : 'rejected'}`).join(', ')}; ${DUR.max} flips to rejected; 29 and 30 are unchanged. Afterwards the canonical rule is restored: ${V90.restore}.` },
      { title: 'Two requests to an assistant, three candidates, one deciding example', condition: 'assistant-drafts', state: 5, principle: true, note: `Request A (“${AI.request_a}”) produced a candidate that ${AI.candidate_a}; request B (${AI.request_b}) produced one that ${AI.candidate_b}; a third candidate for the same request explains “${W13.explanation_claims}” but codes an exclusive bound. The ${W13.counterexample_minutes}-minute example settles it. The candidates are authored fixtures, not the output of a live assistant.` },
    ],
  };

  // =====================================================================
  // SCENE 4 · quality-with-conditions (Bridge)
  // =====================================================================
  const QC = A['w02/quality-with-conditions'];
  const LAT = F.latency;
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const nearestRank = (values, p) => { const o = values.slice().sort((a, b) => a - b); return o[Math.ceil(p * o.length) - 1]; };
  const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
  const NLAT = LAT.A.length;
  const P95 = { A: nearestRank(LAT.A, 0.95), B: nearestRank(LAT.B, 0.95) };
  const MEAN = { A: mean(LAT.A), B: mean(LAT.B) };
  const KP = QC.keyboard_path;
  const qualityWithConditions = {
    id: 'quality-with-conditions', role: 'bridge',
    heading: '“Fast” needs a workload and a measurement boundary',
    lead: `One search answered in ${fmt(LAT.A[0])} milliseconds. Does that prove the service is fast? A quality requirement needs three more things before the number means anything.`,
    principle: 'A quality requirement needs observable acceptance, a boundary, and stated conditions.',
    principleShort: 'Fast means nothing without a workload, a boundary and a threshold.',
    conditions: [
      { id: 'one-user', baseline: true, label: `Baseline: ${QC.workloads[0].label} (illustrative samples)`, short: 'One user',
        states: [
          { prompt: { question: `One search took ${fmt(LAT.A[0])} ms. Is the service fast?`, options: ['Yes: a fifth of a second is fast', 'Only that one search was', 'Only under stated conditions'] }, caption: 'A single number, no conditions. Step to see what it was measured on.' },
          { caption: `The sample behind the number: ${NLAT} searches by one person, every one answered in ${fmt(LAT.A[0])} ms. Mean ${fmt(MEAN.A)} ms. Nothing about other people, other data or a busy hour.` },
          { caption: `The requirement, ${ruleIntro('Q-01')}: under the teaching fixture, the **95th percentile** of search response time is at most **${QC.p95_ms_max} ms** under **${QC.concurrent_users} concurrent users**, measured at the **${QC.boundary}**. An authored target, not a universal standard.` },
          { caption: `Compare what was measured with what was claimed. The measurement: one user. The target: ${QC.concurrent_users}. So far the sample says nothing about Q-01; it is evidence for a different question.` },
          { caption: `The boundary: the measured span is the search API and its storage. The browser and the network are outside it. A viewer's whole experience is longer than the number, and the requirement says which span it means.` },
          { caption: `The names other engineers use: ${QC.vocabulary.standard} calls response time **${QC.vocabulary.rows[0].characteristic}** and keyboard-accessible completion **${QC.vocabulary.rows[1].characteristic}**. Same ideas, shared words.` },
          { caption: `Threshold, percentile, workload, boundary. Remove any one of them and “fast” is a feeling again.`, principle: true },
        ] },
      { id: 'fifty-users', label: `Changed condition: ${QC.workloads[1].label}; same target, same code (illustrative samples)`, short: 'Fifty users',
        states: [
          { caption: `Only the workload changes: ${QC.concurrent_users} concurrent users. Same code, same target. ${NLAT} sampled responses: ${LAT.B.filter((v) => v === 100).length} at ${fmt(100)} ms and ${LAT.B.filter((v) => v === 1100).length} at ${fmt(1100)} ms.` },
          { caption: `The mean is still ${fmt(MEAN.B)} ms, exactly as before. The nearest-rank p95, the ${Math.ceil(0.95 * NLAT)}th sorted value, is **${fmt(P95.B)} ms**: above ${QC.p95_ms_max}. Under the stated workload, Q-01 is **not met**.` },
          { caption: 'The average hid the two slow responses; the percentile with its conditions did not. Stating the workload is what made the difference visible.', principle: true },
        ] },
      { id: 'keyboard-path', label: 'Changed condition: a different quality, rule R-05: complete the booking with the keyboard alone', short: 'Keyboard path',
        states: [
          { caption: 'Not every quality is a number. R-05 asks whether the core task can be completed by keyboard, with status the person can perceive. Step through the path.' },
          { caption: `**${KP.steps[0].key}** → the focus ring lands on ${KP.steps[0].lands}. Reachable.` },
          { caption: `**${KP.steps[1].key}** → ${KP.steps[1].lands}. Reachable.` },
          { caption: `**${KP.steps[2].key}** → ${KP.steps[2].lands}. Reachable: it is a real button.` },
          { caption: `**${KP.steps[3].key}** → ${KP.steps[3].lands}. Understandable: the outcome is perceived without looking at a color.` },
          { caption: `Acceptance here is categorical: **${KP.acceptance.reachable ? 'reachable' : 'not reachable'} and ${KP.acceptance.understandable ? 'understandable' : 'not understandable'}**, yes or no. Q-01 accepts by a number; R-05 accepts by an outcome. Both are observable.`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:600px minmax(0,1fr);gap:24px;align-items:start' });
      const left = el('div', { style: 'display:grid;min-height:0' });
      const edges = Array.from({ length: 13 }, (_, i) => i * 100);
      h.chartA = histogram({ values: LAT.A, unit: LAT.unit, binEdges: edges, title: `${upper1(QC.workloads[0].label.split(';')[0])} · n = ${NLAT}`, width: 560, height: 300, color: '--accent', maxY: 22, stepSize: 200 });
      h.chartB = histogram({ values: LAT.B, unit: LAT.unit, binEdges: edges, title: `${upper1(QC.workloads[1].label.split(';')[0])} · n = ${NLAT}`, width: 560, height: 300, color: '--violet', maxY: 22, stepSize: 200 });
      const chartBox = (hist, key, cond, from) => {
        const c = el('div', reveal({ class: 'card rv rv--scale', 'data-cond': cond, 'data-show-from': String(from), style: 'grid-area:1 / 1;padding:10px 12px;display:flex;flex-direction:column;gap:6px;align-items:center;align-self:start' }), [
          hist.canvas,
          el('div', { class: 'small muted', style: 'align-self:stretch;display:flex;justify-content:space-between;gap:12px' }, [el('span', {}, `mean ${fmt(MEAN[key])} ms`), (h[`stat${key}`] = el('span', {}, ''))]),
          el('p', { class: 'muted', style: 'font-size:15px;line-height:1.3;align-self:stretch' }, [el('span', { class: 'example-tag' }, 'illustrative'), ` ${QC.samples_note}. p95 by nearest rank: sorted[ceil(0.95 × n) − 1].`]),
          el('div', { style: 'align-self:stretch' }, hist.table),
        ]);
        api.cue(c, `chart-${key.toLowerCase()}`);
        return c;
      };
      h.boxA = chartBox(h.chartA, 'A', 'one-user', 1);
      h.boxB = chartBox(h.chartB, 'B', 'fifty-users', 0);
      // keyboard path: a booking screen with a focus ring and the keys pressed
      const room = field('Room list', ROOM, { 'data-focus-at': '1' });
      const time = field('Time fields', `${CASE.booking.start}–${CASE.booking.end}`, { 'data-focus-at': '2' });
      const reserve = el('button', { type: 'button', class: 'btn-reserve', tabindex: '-1', 'aria-disabled': 'true', 'data-focus-at': '3-4' }, 'Reserve');
      const done = status('ok', `Confirmed: ${ROOM}, ${CASE.booking.start}–${CASE.booking.end}`, 'Status message is announced (live region).', reveal({ class: 'rv status status--ok', 'data-show-from': '4' }));
      h.keys = el('div', { class: 'keys', style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-height:40px;font-size:19px;color:var(--text-muted)' }, [el('span', {}, 'Keys pressed:')]);
      const screen = browser({ who: `${ARI.name} · keyboard only`, label: 'Booking screen operated by keyboard', body: [room, time, reserve, done, h.keys] });
      screen.setAttribute('data-cond', 'keyboard-path'); screen.style.cssText = 'grid-area:1 / 1;align-self:start;width:560px';
      api.cue(screen, 'screen');
      left.append(h.boxA, h.boxB, screen);
      // right column
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' });
      const q01 = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'one-user', 'data-show-from': '2', style: 'padding:12px 16px' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:6px;display:flex;gap:10px;align-items:center' }, ['Requirement Q-01', el('span', { class: 'example-tag' }, 'example assumption')]),
        el('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px' }, [chip(`threshold: p95 ≤ ${QC.p95_ms_max} ms`, 'warn'), chip(`workload: ${QC.concurrent_users} concurrent users`, 'warn'), chip(`boundary: ${QC.boundary}`, 'warn')]),
        el('p', { class: 'muted', style: 'font-size:17px;line-height:1.3' }, 'An authored target for this course, not a universal service standard.'),
      ]);
      api.cue(q01, 'q01');
      const q01Other = q01.cloneNode(true); q01Other.setAttribute('data-cond', 'fifty-users,keyboard-path'); q01Other.setAttribute('data-show-from', '0'); q01Other.removeAttribute('data-cue-target');
      api.cue(q01Other, 'q01-again');
      h.measured = el('div', reveal({ class: 'rv rv--rise callout', 'data-cond': 'one-user', 'data-show-from': '3', style: 'font-size:19px;padding:8px 14px;line-height:1.3' }), [el('b', {}, 'Measured: '), 'one user. ', el('b', {}, 'Claimed: '), `${QC.concurrent_users} users. `, chip('not evidence for Q-01 yet', 'bad', { style: 'font-size:15px' })]);
      api.cue(h.measured, 'measured');
      h.verdict = el('div', reveal({ class: 'rv rv--rise callout callout--bad', 'data-cond': 'fifty-users', 'data-show-from': '1', style: 'font-size:19px;padding:8px 14px;line-height:1.3' }), [el('b', {}, `p95 = ${fmt(P95.B)} ms `), `under ${QC.concurrent_users} users: above ${QC.p95_ms_max} ms. `, chip('Q-01 not met', 'bad', { style: 'font-size:15px' }), el('span', { class: 'muted' }, ` Mean still ${fmt(MEAN.B)} ms.`)]);
      api.cue(h.verdict, 'verdict');
      // boundary span
      const SPAN = QC.boundary_span;
      const sw = 640, sh = 120;
      const span = window.VC.svg(sw, sh, { label: 'Where the response time is measured: the search API and storage, not the browser or the network', uid: (x) => api.uid(`span-${x}`) });
      const bxw = 140, gap = 20, sx0 = 10;
      SPAN.forEach((p, i) => {
        const x = sx0 + i * (bxw + gap);
        const n = node({ x, y: 34, w: bxw, h: 56, label: p.label, cls: p.measured ? 'is-focus' : '' });
        if (!p.measured) n.classList.add('dm', 'is-dim');
        span.appendChild(n);
        if (i) span.appendChild(arrow(span, { from: { x: x - gap + 2, y: 62 }, to: { x: x - 2, y: 62 }, kind: p.measured ? 'warn' : 'default' }));
      });
      const mx0 = sx0 + 2 * (bxw + gap), mx1 = sx0 + 4 * (bxw + gap) - gap;
      span.appendChild(s('line', { x1: mx0, y1: 108, x2: mx1, y2: 108, stroke: 'var(--warn)', 'stroke-width': 3 }));
      span.appendChild(text((mx0 + mx1) / 2, 22, 'measured span: service boundary', { class: 'n-sub', 'text-anchor': 'middle', style: 'fill:var(--warn);font-weight:700;font-size:16px' }));
      span.appendChild(text(sx0 + bxw + gap / 2, 112, 'the viewer\'s whole experience is longer', { class: 'n-sub', 'text-anchor': 'middle', style: 'font-size:15px' }));
      h.spanCard = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'one-user,fifty-users', 'data-show-from': '4', style: 'padding:8px 12px' }), span);
      api.cue(h.spanCard, 'boundary');
      const vocab = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'one-user', 'data-show-from': '5', style: 'padding:10px 16px' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:4px' }, `The standard vocabulary · ${QC.vocabulary.standard}`),
        el('dl', { style: 'display:grid;grid-template-columns:max-content 1fr;gap:2px 14px;margin:0;font-size:18px;line-height:1.3' }, QC.vocabulary.rows.flatMap((r) => [el('dt', { class: 'muted', style: 'margin:0' }, r.quality), el('dd', { style: 'margin:0;font-weight:600' }, r.characteristic)])),
        el('p', { class: 'muted', style: 'font-size:15px;margin-top:6px' }, `Reference: ${QC.vocabulary.source}, ${QC.vocabulary.standard}.`),
      ]);
      api.cue(vocab, 'vocabulary');
      const kbCard = el('div', { class: 'card', 'data-cond': 'keyboard-path', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:6px' }, [
        el('div', { class: 'card-title', style: 'margin-bottom:2px' }, `The keyboard path, ${KP.rule}`),
        ...KP.steps.map((st, i) => el('div', reveal({ class: 'rv', 'data-show-from': String(i + 1), 'data-focus-at': String(i + 1), style: 'display:flex;gap:10px;align-items:center;font-size:19px;padding:4px 8px;border-radius:8px' }), [kbd(st.key), el('span', {}, `→ ${st.lands}`)])),
      ]);
      api.cue(kbCard, 'keyboard-steps');
      const acceptance = table({ caption: 'Two requirements, two kinds of acceptance', cls: 'data-table--compact', columns: [{ key: 'r', label: 'Requirement' }, { key: 'a', label: 'Accepted when' }, { key: 'k', label: 'Kind' }], rows: [
        { cells: { r: 'Q-01 search response', a: `p95 ≤ ${QC.p95_ms_max} ms under ${QC.concurrent_users} users at the service boundary`, k: chip('numerical', 'accent', { style: 'font-size:15px' }) } },
        { cells: { r: 'R-05 keyboard completion', a: `${QC.qualitative_acceptance.acceptance}`, k: chip('categorical', 'violet', { style: 'font-size:15px' }) } },
      ] });
      h.acceptCard = el('div', reveal({ class: 'rv rv--rise', 'data-cond': 'keyboard-path', 'data-show-from': '5' }), acceptance);
      api.cue(h.acceptCard, 'acceptance');
      right.append(q01, q01Other, h.measured, h.verdict, h.spanCard, vocab, kbCard, h.acceptCard);
      wrap.append(left, right);
      stage.appendChild(wrap);
      h.room = room; h.time = time; h.reserve = reserve;
      h.ready = new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return h;
    },
    render(h, view) {
      const c = view.conditionId, st = view.state;
      const markersA = st >= 1 && c === 'one-user' ? [{ x: MEAN.A, label: `mean ${fmt(MEAN.A)} ms`, color: '--warn', dash: [6, 4], dy: 4 }] : [];
      const markersB = [];
      if (c === 'fifty-users') {
        markersB.push({ x: MEAN.B, label: `mean ${fmt(MEAN.B)} ms`, color: '--warn', dash: [6, 4], dy: 4 });
        if (st >= 1) markersB.push({ x: P95.B, label: `p95 ${fmt(P95.B)} ms`, color: '--bad', dy: 30, align: 'right' });
      }
      h.chartA.update(markersA); h.chartB.update(markersB);
      h.statA.textContent = c === 'one-user' && st >= 1 ? `p95 ${fmt(P95.A)} ms` : '';
      h.statB.textContent = c === 'fifty-users' && st >= 1 ? `p95 ${fmt(P95.B)} ms` : '';
      h.statB.className = c === 'fifty-users' && st >= 1 ? 'bad' : 'small muted';
      if (c === 'keyboard-path') {
        const keys = KP.steps.slice(0, Math.min(KP.steps.length, st)).map((x) => x.key);
        h.keys.replaceChildren(el('span', {}, 'Keys pressed:'), ...(keys.length ? keys.map((k) => kbd(k)) : [el('span', { class: 'muted' }, 'none yet')]));
        h.reserve.classList.toggle('is-focus', st === 3 || st === 4);
      }
    },
    print: [
      { title: 'One number, then the requirement with its threshold, workload and boundary', condition: 'one-user', state: 5, note: `Q-01: p95 ≤ ${QC.p95_ms_max} ms under ${QC.concurrent_users} concurrent users at the ${QC.boundary}; an authored target. The sample of ${NLAT} responses under one user (all ${fmt(LAT.A[0])} ms) is illustrative and says nothing about Q-01. Vocabulary: ${QC.vocabulary.rows.map((r) => `${r.quality} is ${r.characteristic}`).join('; ')} (${QC.vocabulary.standard}).` },
      { title: 'The same target under fifty users: the mean hides the tail, the percentile shows it', condition: 'fifty-users', state: 2, note: `${LAT.B.filter((v) => v === 100).length} responses at 100 ms and ${LAT.B.filter((v) => v === 1100).length} at ${fmt(1100)} ms: mean ${fmt(MEAN.B)} ms, nearest-rank p95 ${fmt(P95.B)} ms, above the ${QC.p95_ms_max} ms threshold. Illustrative samples from the latency fixture, not a load test.` },
      { title: 'A categorical quality: the keyboard path of R-05', condition: 'keyboard-path', state: 5, principle: true, note: `${KP.steps.map((x) => `${x.key}: ${x.lands}`).join('; ')}. Accepted when the outcome is reachable and understandable, yes or no.` },
    ],
  };

  // =====================================================================
  // SCENE 5 · acceptance-and-validation (Bridge)
  // =====================================================================
  const AV = A['w02/acceptance-and-validation'];
  const acceptanceAndValidation = {
    id: 'acceptance-and-validation', role: 'bridge',
    heading: 'A precise requirement can still describe the wrong thing',
    lead: `A system enforces a ${AV.verification_cases[0].minutes}-minute maximum perfectly, because someone wrote ${AV.verification_cases[0].minutes} where ${AV.need.minutes} was meant. Which check would catch that?`,
    principle: 'We must question both whether the system matches its description and whether the description matches the need.',
    principleShort: 'Check the system against the words, and the words against the need.',
    conditions: [
      { id: 'verify-against-statement', baseline: true, label: 'Baseline: the system is checked against its written statement', short: 'Check the words',
        states: [
          { prompt: { question: 'Would checking the system against its written statement catch the transcription mistake?', options: ['Yes: checks compare behavior to words', 'No: the system matches the words', 'Only if someone rereads the statement'] }, caption: `Need, statement, behavior. The need is still hidden. Step to run the checks.` },
          { caption: `Verification: every check compares behavior with the statement. **${AV.verification_cases.map((c) => `${c.minutes} ${c.system_does}`).join(', ')}**: all three match. The system is exactly what the statement says.` },
          { caption: `Now the need: ${ARI.name} asked for **${AV.need.example}**, ${AV.need.minutes} minutes. The intended statement was “${AV.intended_statement}” ${upper1(AV.transcription)}. The mismatch sits between the need and the words, where no check looked.` },
          { caption: `A feature can be delivered exactly and still miss the outcome: ${AV.observed_behavior}. Shortening every reservation satisfies the written limit and makes a useful session impossible.` },
          { caption: `Before accepting a specification, compare the proposed behavior with one concrete stakeholder example. Here that example is ${AV.need.minutes} minutes, and it would have failed on the first read.` },
          { caption: `${AV.fairness} The scene changes nothing else on purpose: one transcription error is enough.` },
          { caption: `Two questions, not one. Verification: ${lower1(AV.questions.verification)} Validation: ${lower1(AV.questions.validation)} Practice mixes them, and both are needed.`, principle: true },
        ] },
      { id: 'correct-the-requirement', label: 'Changed condition: the implementation stays; the intended requirement is corrected', short: 'Correct the words',
        states: [
          { caption: `The statement is corrected: **“${AV.corrected_statement}”** The implementation is untouched and still rejects everything over ${AV.verification_cases[0].minutes} minutes.` },
          { caption: `Run the same checks again: **${AV.after_correction.map((c) => `${c.minutes} minutes: statement says ${c.statement_says}, system ${c.system_does}`).join('; ')}**. Now verification fails, visibly, and the fix has a place to go.` },
          { caption: 'Correcting the words moved the mismatch to where checks can see it. Validation fixed the description; verification will now drive the implementation.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:18px;' });
      const strip = el('div', { style: 'display:grid;grid-template-columns:1fr 40px 1fr 40px 1fr;gap:8px;align-items:stretch' });
      const part = (title, kind, body, attrs) => el('div', Object.assign({ class: 'card', style: `padding:12px 16px;display:flex;flex-direction:column;gap:6px;border-color:var(--${kind})` }, attrs || {}), [el('div', { class: 'card-title', style: `margin-bottom:0;color:var(--${kind})` }, title), ...body]);
      const arrowEl = () => el('div', { 'aria-hidden': 'true', style: 'display:flex;align-items:center;justify-content:center;font-size:34px;color:var(--text-soft)' }, '→');
      h.needHidden = el('div', { class: 'card', 'data-cond': 'verify-against-statement', 'data-show-until': '1', style: 'padding:12px 16px;display:flex;flex-direction:column;gap:6px;border-style:dashed' }, [el('div', { class: 'card-title', style: 'margin-bottom:0' }, 'The need'), el('p', { class: 'muted', style: 'font-size:24px' }, '? not looked at yet')]);
      h.needHidden.classList.add('rv');
      h.needCard = part('The need', 'ok', [el('p', { style: 'font-size:21px;line-height:1.3' }, `${ARI.name} (${ARI.id}): ${AV.need.example}.`), el('p', { style: 'font-size:19px;color:var(--ok);font-weight:600;display:flex;gap:10px;align-items:center;flex-wrap:wrap' }, [`${AV.need.minutes} minutes must be accepted`, badgeHtml('mismatch with the statement', 'bad')])], reveal({ class: 'card rv rv--rise', 'data-show-from': '2' }));
      h.needCard.style.borderColor = 'var(--ok)';
      const needCell = el('div', { style: 'display:grid' }, [h.needHidden, h.needCard]);
      h.needHidden.style.gridArea = '1 / 1'; h.needCard.style.gridArea = '1 / 1';
      api.cue(needCell, 'need');
      h.statement = part('The written statement', 'warn', [(h.statementText = el('p', { style: 'font-size:23px;font-weight:600;font-family:var(--font-display);line-height:1.25' }, AV.written_statement)), (h.statementNote = el('p', { class: 'muted', style: 'font-size:17px' }, ''))]);
      api.cue(h.statement, 'statement');
      h.behavior = part('The observed behavior', 'accent', [el('p', { style: 'font-size:21px;line-height:1.3' }, upper1(AV.observed_behavior) + '.')]);
      api.cue(h.behavior, 'behavior');
      h.mismatch = el('div', reveal({ class: 'rv', 'data-cond': 'verify-against-statement', 'data-show-from': '2', style: 'grid-area:1 / 1;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:900;color:var(--bad)' }), '✕');
      const midArrow = arrowEl(); midArrow.style.gridArea = '1 / 1'; h.midArrow = midArrow;
      strip.append(needCell, el('div', { style: 'display:grid' }, [midArrow, h.mismatch]), h.statement, arrowEl(), h.behavior);
      wrap.appendChild(strip);
      // lower: checks table left, the two questions right
      const lower = el('div', { style: 'display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:24px;min-height:0;align-items:start' });
      const rowOf = (c, cond, from, focus, against) => ({ attrs: { class: 'rv', 'data-cond': cond, 'data-show-from': String(from), 'data-focus-at': focus || '' }, cells: { m: `${c.minutes} minutes`, says: `${against}: ${c.statement_says || c.need_says}`, does: `system: ${c.system_does}`, match: c.match ? el('span', { class: 'ok' }, '✓ match') : el('span', { class: 'bad' }, '✕ mismatch') } });
      const rows = [
        ...AV.verification_cases.map((c) => rowOf(c, 'verify-against-statement', 1, '1', 'statement')),
        rowOf(AV.validation_case, 'verify-against-statement', 2, '2-4', 'the need'),
        ...AV.after_correction.map((c) => rowOf(c, 'correct-the-requirement', 1, '1', 'corrected statement')),
      ];
      h.checks = table({ caption: 'Checks: what the words say against what the system does', cls: 'data-table--compact', columns: [{ key: 'm', label: 'Request' }, { key: 'says', label: 'The words say' }, { key: 'does', label: 'The system does' }, { key: 'match', label: 'Result' }], rows });
      api.cue(h.checks, 'checks');
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' });
      h.feature = el('div', reveal({ class: 'rv rv--rise callout callout--bad', 'data-cond': 'verify-against-statement', 'data-show-from': '3', style: 'font-size:19px;padding:10px 14px;line-height:1.3' }), [el('b', {}, 'Feature delivered, outcome missed: '), 'every reservation is short, and the two-hour session is impossible.']);
      h.example = el('div', reveal({ class: 'rv rv--rise callout callout--ok', 'data-cond': 'verify-against-statement', 'data-show-from': '4', style: 'font-size:19px;padding:10px 14px;line-height:1.3' }), [el('b', {}, 'Before accepting a specification: '), `compare the proposed behavior with one concrete stakeholder example. Here: ${AV.need.minutes} minutes.`]);
      h.fair = el('div', reveal({ class: 'rv rv--rise rail-note', 'data-cond': 'verify-against-statement', 'data-show-from': '5', style: 'padding:0 4px' }), AV.fairness);
      const qCard = (title, q, kind, from, cond) => el('div', reveal({ class: 'card rv rv--rise', 'data-cond': cond, 'data-show-from': String(from), style: `padding:10px 16px;border-color:var(--${kind})` }), [el('div', { class: 'card-title', style: `margin-bottom:2px;color:var(--${kind})` }, title), el('p', { style: 'font-size:21px;line-height:1.3' }, q)]);
      h.qVerify = qCard('Verification', AV.questions.verification, 'accent', 6, 'verify-against-statement');
      h.qValidate = qCard('Validation', AV.questions.validation, 'ok', 6, 'verify-against-statement');
      h.qVerify2 = qCard('Verification · now fails, so it can drive the fix', AV.questions.verification, 'accent', 2, 'correct-the-requirement');
      h.qValidate2 = qCard('Validation · fixed the description', AV.questions.validation, 'ok', 0, 'correct-the-requirement');
      api.cue(h.feature, 'feature'); api.cue(h.example, 'example'); api.cue(h.qVerify, 'verification'); api.cue(h.qValidate, 'validation'); api.cue(h.qVerify2, 'verification-again'); api.cue(h.qValidate2, 'validation-again');
      right.append(h.feature, h.example, h.fair, h.qValidate2, h.qVerify, h.qValidate, h.qVerify2);
      lower.append(el('div', { style: 'min-width:0' }, h.checks), right);
      wrap.appendChild(lower);
      stage.appendChild(wrap);
      return h;
    },
    render(h, view) {
      const corrected = view.conditionId === 'correct-the-requirement';
      h.statementText.textContent = corrected ? AV.corrected_statement : AV.written_statement;
      h.statementNote.textContent = corrected ? 'corrected to the intended rule; the implementation is unchanged' : (view.state >= 2 ? AV.transcription : '');
      h.statement.style.borderColor = corrected ? 'var(--ok)' : 'var(--warn)';
      if (corrected) h.needCard.classList.add('is-shown');
      h.midArrow.style.visibility = !corrected && view.state >= 2 ? 'hidden' : '';
      h.behavior.style.borderColor = corrected && view.state >= 1 ? 'var(--bad)' : 'var(--accent)';
    },
    print: [
      { title: 'The system matches its statement; the statement does not match the need', condition: 'verify-against-statement', state: 4, note: `Verification: ${AV.verification_cases.map((c) => `${c.minutes} minutes ${c.system_does} as the statement says`).join('; ')}. Validation: ${ARI.name}'s ${AV.need.example} needs ${AV.need.minutes} minutes and is rejected. ${upper1(AV.transcription)}.` },
      { title: 'Two questions, and the corrected statement that makes verification fail visibly', condition: 'correct-the-requirement', state: 2, principle: true, note: `${AV.questions.verification} ${AV.questions.validation} After the correction, ${AV.after_correction.map((c) => `${c.minutes} minutes should be ${c.statement_says} and the system ${c.system_does}`).join('; ')}: the mismatch is now where checks can see it. ${AV.fairness}` },
    ],
  };
  /** A small HTML badge (the SVG badge has no HTML twin). */
  function badgeHtml(label, kind) { return chip(label, kind, { style: 'font-size:16px' }); }

  // =====================================================================
  // SCENE 6 · traceability-matrix (Anchor)
  // =====================================================================
  const TM = A['w02/traceability-matrix'];
  const TROW = Object.fromEntries(TM.rows.map((r) => [r.requirement, r]));
  const VAR = TM.variant;
  const TM_ORDER = ['R-01', 'R-03', 'R-02'];
  const TM_SHOW = { 'R-01': { row: 0, decision: 1, examples: 2, checks: 3 }, 'R-03': { row: 4, decision: 4, examples: 4, checks: 4 }, 'R-02': { row: 5, decision: 5, examples: 5, checks: 5 } };
  const traceabilityMatrix = {
    id: 'traceability-matrix', role: 'anchor',
    heading: 'A requirement should lead somewhere',
    lead: 'Start from R-01 and an empty matrix. What evidence connects “no overlapping confirmations” to an implementation, and how do you see what a rule change touches?',
    principle: 'Traceability makes relationships inspectable; a link is useful only when its meaning and evidence are current.',
    principleShort: 'A link is only worth what its evidence is today.',
    conditions: [
      { id: 'grow-matrix', baseline: true, label: 'Baseline: the matrix grows one requirement at a time', short: 'Grow the matrix',
        states: [
          { prompt: { question: 'What connects R-01, no overlapping confirmations, to an implementation?', options: ['The code that checks overlaps', 'A decision, examples and a check', 'A test that passes'] }, caption: `One row, R-01, three empty cells. Step to fill the row.` },
          { caption: `The design decision: **${TROW['R-01'].decision}**. The decision is where the rule is enforced, and there is one such place, which Week 1 showed matters.` },
          { caption: `The examples: **${TROW['R-01'].examples.join('; ')}**. Three boundary cases from the interval fixture, adjacent included.` },
          { caption: `The checks: **${TROW['R-01'].checks.join('** and **')}**. The second one is the check the single example of Week 1 could not stand in for.` },
          { caption: `A second row, R-03, cancellation authorization: decision **${TROW['R-03'].decision}**; examples ${TROW['R-03'].examples.join('; ')}; check **${TROW['R-03'].checks[0]}**.` },
          { caption: `A third row, R-02 from scene 3: **${TROW['R-02'].decision}**, the four boundary examples, one **${TROW['R-02'].checks[0]}**. Click any cell to light up its row: that is the chain the cell belongs to.` },
          { caption: `Why a matrix and not a pipeline diagram: coverage is a question about rows and blanks, and a blank cell is visible here. Its limit: **${TM.blank_row.note}**.` },
          { caption: 'Each cell answers one question: where is this enforced, which cases define it, what would show it broke. The row is the reasoning; the links are only as good as those answers.', principle: true },
        ] },
      { id: 'delegated-cancellation', label: `Variant: ${VAR.label} (requires a stakeholder decision)`, short: 'Variant: delegated cancel',
        states: [
          { caption: `A proposed change to R-03: **${VAR.label}**. Nothing is decided yet; the matrix is used to see what the change would touch.` },
          { caption: `Genuinely dependent on R-03: **${VAR.affected.join('**, **')}**. Those cells are marked for review with a symbol and a word, not only a color.` },
          { caption: `Unaffected: **${VAR.unaffected.join('** and **')}**. The duration row and the interval check do not depend on who may cancel; they stay as they are.` },
          { caption: `The variant is marked as **${VAR.requires}**: the matrix shows what a decision would cost, and the decision belongs to the stakeholders.`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:14px;' });
      const ORDER = TM_ORDER, SHOW = TM_SHOW;
      const AFFECTED = { 'R-03:decision': 'R-03 decision', 'R-03:examples': 'cancellation decision table', 'R-03:checks': 'authorization matrix check' };
      const UNAFFECTED = { 'R-02:checks': 'duration checks', 'R-01:checks': 'interval checks' };
      h.cells = {};
      const cell = (rid, col, content) => {
        const inner = el('div', reveal({ class: 'rv', 'data-cond': 'grow-matrix', 'data-show-from': String(SHOW[rid][col]) }), content);
        const always = el('div', { 'data-cond': 'delegated-cancellation' }, content.map((n) => (typeof n === 'string' ? n : n.cloneNode(true))));
        const mark = el('div', { class: 'rv', style: 'margin-top:6px' });
        if (AFFECTED[`${rid}:${col}`]) { mark.appendChild(chip(`⟳ needs review: ${AFFECTED[`${rid}:${col}`]}`, 'warn', { style: 'font-size:15px;white-space:normal' })); mark.setAttribute('data-cond', 'delegated-cancellation'); mark.setAttribute('data-show-from', '1'); }
        else if (UNAFFECTED[`${rid}:${col}`]) { mark.appendChild(chip(`✓ unchanged: ${UNAFFECTED[`${rid}:${col}`]}`, 'ok', { style: 'font-size:15px;white-space:normal' })); mark.setAttribute('data-cond', 'delegated-cancellation'); mark.setAttribute('data-show-from', '2'); }
        else mark.style.display = 'none';
        const box = el('div', { class: 'tm-cell', style: 'min-height:44px;cursor:pointer;border-radius:8px;padding:2px 4px' }, [inner, always, mark]);
        api.cue(box, `cell-${rid}-${col}`);
        box.addEventListener('click', () => h.select(rid));
        h.cells[`${rid}:${col}`] = box;
        return box;
      };
      const list = (items) => el('ul', { style: 'margin:0;padding-left:1.1em;font-size:17px;line-height:1.28' }, items.map((t) => el('li', {}, t)));
      const rows = ORDER.map((rid) => {
        const r = TROW[rid];
        const reqCell = el('div', { style: 'display:flex;flex-direction:column;gap:4px' }, [el('b', { style: 'font-size:22px' }, rid), el('span', { class: 'muted', style: 'font-size:16px' }, TM.row_kinds[rid])]);
        api.cue(reqCell, `req-${rid}`);
        reqCell.style.cursor = 'pointer'; reqCell.addEventListener('click', () => h.select(rid));
        return { attrs: { class: 'rv tm-row', 'data-row': rid, 'data-show-from': String(SHOW[rid].row), 'data-cond-any': 'x' }, cells: { req: reqCell, decision: cell(rid, 'decision', [r.decision]), examples: cell(rid, 'examples', [list(r.examples)]), checks: cell(rid, 'checks', [list(r.checks)]) } };
      });
      rows.push({ attrs: { class: 'rv tm-row', 'data-cond': 'grow-matrix', 'data-show-from': '6', style: 'opacity:0.7' }, cells: { req: el('b', { style: 'font-size:22px;color:var(--text-soft)' }, TM.blank_row.label), decision: el('span', { class: 'muted' }, '— no row —'), examples: el('span', { class: 'muted' }, TM.blank_row.note), checks: el('span', { class: 'muted' }, '—') } });
      h.table = table({ caption: 'Traceability matrix: requirement · design decision · examples · checks', cls: 'data-table--compact', columns: [{ key: 'req', label: 'Requirement', cls: 'col-req' }, { key: 'decision', label: 'Design decision' }, { key: 'examples', label: 'Examples' }, { key: 'checks', label: 'Checks' }], rows });
      h.table.querySelectorAll('th.col-req').forEach((th) => { th.style.width = '170px'; });
      h.table.querySelectorAll('tbody tr').forEach((tr) => { tr.classList.remove('rv'); tr.classList.add('rv'); });
      api.cue(h.table, 'matrix');
      wrap.appendChild(el('div', { style: 'min-width:0' }, h.table));
      // lower: legend, the selected chain, the variant card
      const lower = el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) 440px;gap:20px;min-height:0;align-items:start' });
      h.chain = el('div', { class: 'card', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:6px' }, [
        el('div', { class: 'card-title', style: 'margin-bottom:2px' }, 'The chain of the selected row'),
        (h.chainText = el('p', { style: 'font-size:19px;line-height:1.35', class: 'muted' }, 'Click a requirement or a cell to light up its chain.')),
      ]);
      api.cue(h.chain, 'chain');
      const lg = legend([{ kind: 'edit', label: 'needs review after the change' }, { kind: 'ok', label: 'unchanged' }, { kind: 'unaffected', label: 'no row: nothing to trace' }]);
      lg.style.marginTop = '8px';
      h.chain.appendChild(lg);
      h.variantCard = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'delegated-cancellation', 'data-show-from': '0', style: 'padding:10px 16px;border-color:var(--warn);display:flex;flex-direction:column;gap:6px' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:2px;display:flex;gap:10px;align-items:center;flex-wrap:wrap' }, ['Proposed variant of R-03', chip(`requires a ${VAR.requires}`, 'warn', { style: 'font-size:15px' })]),
        el('p', { style: 'font-size:19px;line-height:1.3' }, upper1(VAR.label) + '.'),
        el('p', reveal({ class: 'rv muted', 'data-show-from': '1', style: 'font-size:16px;line-height:1.3' }), `⟳ ${VAR.affected.join(', ')}`),
        el('p', reveal({ class: 'rv muted', 'data-show-from': '2', style: 'font-size:16px;line-height:1.3' }), `✓ ${VAR.unaffected.join(', ')}`),
      ]);
      api.cue(h.variantCard, 'variant');
      h.why = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'grow-matrix', 'data-show-from': '6', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:4px' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:2px' }, 'Why a matrix'),
        el('p', { style: 'font-size:18px;line-height:1.3' }, 'Coverage is a question about rows and blanks. A pipeline diagram shows movement; a matrix shows what is missing.'),
        el('p', { class: 'muted', style: 'font-size:17px;line-height:1.3' }, upper1(TM.blank_row.note) + '.'),
      ]);
      api.cue(h.why, 'why');
      lower.append(h.chain, el('div', { style: 'display:grid;min-height:0' }, [h.why, h.variantCard]));
      h.why.style.gridArea = '1 / 1'; h.variantCard.style.gridArea = '1 / 1';
      wrap.appendChild(lower);
      stage.appendChild(wrap);
      h.selected = null;
      h.select = (rid) => {
        h.selected = h.selected === rid ? null : rid;
        h.table.querySelectorAll('tbody tr[data-row]').forEach((tr) => tr.classList.toggle('is-focus', tr.getAttribute('data-row') === h.selected));
        if (!h.selected) { h.chainText.textContent = 'Click a requirement or a cell to light up its chain.'; h.chainText.className = 'muted'; return; }
        const r = TROW[h.selected];
        h.chainText.className = '';
        h.chainText.replaceChildren(el('b', {}, `${h.selected}`), ` → decision: ${r.decision} → ${r.examples.length} examples → ${r.checks.length} check${r.checks.length > 1 ? 's' : ''}: ${r.checks.join(', ')}.`);
      };
      return h;
    },
    render(h, view) {
      const c = view.conditionId, st = view.state;
      if (c === 'delegated-cancellation') h.table.querySelectorAll('tbody tr[data-row]').forEach((tr) => tr.classList.add('is-shown'));
      const focusRow = c === 'grow-matrix' ? ({ 1: 'R-01', 2: 'R-01', 3: 'R-01', 4: 'R-03', 5: 'R-02' })[st] : (st >= 1 && st <= 2 ? 'R-03' : null);
      if (h.selected == null) h.table.querySelectorAll('tbody tr[data-row]').forEach((tr) => tr.classList.toggle('is-focus', tr.getAttribute('data-row') === focusRow));
      Object.entries(h.cells).forEach(([key, box]) => {
        const [rid, col] = key.split(':');
        const hot = c === 'grow-matrix' && rid === focusRow && ((rid === 'R-01' && TM_SHOW[rid][col] === st) || (rid !== 'R-01'));
        box.style.boxShadow = hot ? '0 0 0 3px var(--warn) inset' : '';
      });
    },
    print: [
      { title: 'The matrix with three rows and the chain of each', condition: 'grow-matrix', state: 6, note: TM.rows.map((r) => `${r.requirement}: ${r.decision}; examples ${r.examples.join('; ')}; checks ${r.checks.join(', ')}.`).join(' ') + ` ${upper1(TM.blank_row.note)}.` },
      { title: `The variant highlights only what depends on R-03`, condition: 'delegated-cancellation', state: 3, principle: true, note: `${upper1(VAR.label)}: needs review ${VAR.affected.join(', ')} (marked ⟳); unchanged ${VAR.unaffected.join(', ')} (marked ✓). The variant requires a ${VAR.requires}.` },
    ],
  };

  // =====================================================================
  // SCENE 7 · priority-and-risk (Bridge, wide)
  // =====================================================================
  const PR = A['w02/priority-and-risk'];
  const PREQ = Object.fromEntries(PR.requests.map((r) => [r.id, r]));
  const priorityAndRisk = {
    id: 'priority-and-risk', role: 'bridge', layout: 'wide',
    heading: 'The loudest request is not automatically the next one',
    lead: `Three requests wait: ${PR.requests.map((r) => lower1(r.title)).join('; ')}. Which comes next, and what do you need to know before you can say?`,
    principle: 'Priority is a reasoned choice under constraints, not a permanent property of a feature.',
    principleShort: 'Order is a decision with reasons, not a label on a feature.',
    conditions: [
      { id: 'no-closure', baseline: true, label: 'Baseline: an ordinary week, no closure planned', short: 'Ordinary week',
        states: [
          { prompt: { question: 'Three requests are waiting. Which should come next?', options: PR.requests.map((r) => r.title) }, caption: 'Three titles and nothing else. Step to see what you need to know before choosing.' },
          { caption: `Five columns of information, none of them a score: **${PR.columns.join('**, **')}**. Each is a fact or a judgment you can read and argue with.` },
          { caption: `**${PREQ.P1.title}.** Benefit: ${PREQ.P1.benefit}. Dependency: ${PREQ.P1.dependency}. Uncertainty ${PREQ.P1.uncertainty}. Waiting costs ${PREQ.P1.consequence}. Effort ${PREQ.P1.effort}.` },
          { caption: `**${PREQ.P2.title}.** Benefit: ${PREQ.P2.benefit}. Dependency: ${PREQ.P2.dependency}. Uncertainty ${PREQ.P2.uncertainty}. Consequence of waiting: ${PREQ.P2.consequence}. Effort ${PREQ.P2.effort}.` },
          { caption: `**${PREQ.P3.title}.** Benefit: ${PREQ.P3.benefit}. Dependency: ${PREQ.P3.dependency}. Uncertainty ${PREQ.P3.uncertainty}. Waiting: ${PREQ.P3.consequence}. Effort ${PREQ.P3.effort}.` },
          { caption: `The order: **${PR.baseline_order.join(' → ')}**. ${PR.baseline_rationale} No number produced this; the reasons did, and they are on the table.` },
          { caption: 'The table did not rank features; it laid out consequences and dependencies so that a choice could be explained. The choice is the team\'s, and it can be revisited.', principle: true },
        ] },
      { id: 'closure-tomorrow', label: `Changed condition: ${lower1(PR.changed_condition.label)}`, short: 'Closure tomorrow',
        states: [
          { caption: `One condition changes: **${PR.changed_condition.label}**. A new column appears: urgency. The five other columns keep every word.` },
          { caption: `Urgency: P1 ${PR.changed_condition.urgency.P1}; P2 ${PR.changed_condition.urgency.P2}; P3 **${PR.changed_condition.urgency.P3}**.` },
          { caption: `New order: **${PR.changed_condition.order.join(' → ')}**. ${PR.changed_condition.rationale}`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-rows:minmax(0,1fr) auto;gap:12px;' });
      const revealCell = (txt, from, rid) => el('span', reveal({ class: 'rv', 'data-cond': 'no-closure', 'data-show-from': String(from) }), txt);
      const alwaysCell = (txt) => el('span', { 'data-cond': 'closure-tomorrow' }, txt);
      const both = (txt, from) => el('span', {}, [revealCell(txt, from), alwaysCell(txt)]);
      const showAt = { P1: 2, P2: 3, P3: 4 };
      const rows = PR.requests.map((r) => ({
        attrs: { 'data-row': r.id, 'data-focus-at': String(showAt[r.id]) },
        cells: {
          req: el('span', { style: 'font-weight:600;font-size:20px' }, [chip(r.id, 'accent', { style: 'font-size:15px;margin-right:8px' }), r.title]),
          benefit: both(r.benefit, showAt[r.id]), dependency: both(r.dependency, showAt[r.id]), uncertainty: both(r.uncertainty, showAt[r.id]),
          consequence: both(r.consequence, showAt[r.id]), effort: both(upper1(r.effort), showAt[r.id]),
          urgency: el('span', reveal({ class: 'rv', 'data-cond': 'closure-tomorrow', 'data-show-from': '1', style: r.id === 'P3' ? 'color:var(--warn);font-weight:700' : '' }), upper1(PR.changed_condition.urgency[r.id])),
        },
      }));
      const cols = [{ key: 'req', label: 'Request' }, ...['benefit', 'dependency', 'uncertainty', 'consequence', 'effort'].map((k, i) => ({ key: k, label: PR.columns[i], cls: 'col-info' })), { key: 'urgency', label: 'Urgency', cls: 'col-urgency' }];
      h.table = table({ caption: 'Decision table (qualitative; no score)', cls: 'data-table--compact', columns: cols, rows });
      h.table.querySelectorAll('.col-urgency').forEach((n) => n.setAttribute('data-cond', 'closure-tomorrow'));
      h.table.querySelectorAll('thead th.col-info').forEach((th) => { th.classList.add('rv'); th.setAttribute('data-show-from', '1'); th.setAttribute('data-cond', 'no-closure'); th.setAttribute('data-focus-at', '1'); });
      h.headAlways = Array.from(h.table.querySelectorAll('thead th.col-info')).map((th) => { const t = th.cloneNode(true); t.removeAttribute('data-cond'); t.classList.remove('rv'); t.removeAttribute('data-show-from'); t.removeAttribute('data-focus-at'); t.setAttribute('data-cond', 'closure-tomorrow'); th.after(t); return t; });
      h.table.querySelectorAll('tbody tr').forEach((tr) => api.cue(tr, `row-${tr.getAttribute('data-row')}`));
      api.cue(h.table, 'table');
      wrap.appendChild(el('div', { style: 'min-width:0;min-height:0;overflow:hidden' }, h.table));
      const strip = (order, rationale, cond, from, kind) => {
        const st = el('div', reveal({ class: 'rv rv--rise', 'data-cond': cond, 'data-show-from': String(from), style: `display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:10px 16px;border-radius:12px;border:1.5px solid var(--${kind});background:var(--surface)` }), [
          el('span', { class: 'card-title', style: 'margin:0' }, 'Order:'),
          ...order.flatMap((id, i) => [chip(`${i + 1}. ${PREQ[id].title}`, kind, { style: 'font-size:18px' }), i < order.length - 1 ? el('span', { 'aria-hidden': 'true', style: 'font-size:22px;color:var(--text-soft)' }, '→') : null]),
          el('span', { class: 'muted', style: 'font-size:17px;flex:1 1 380px;line-height:1.3' }, rationale),
        ]);
        return st;
      };
      h.order = strip(PR.baseline_order, PR.baseline_rationale, 'no-closure', 5, 'ok');
      h.order2 = strip(PR.changed_condition.order, PR.changed_condition.rationale, 'closure-tomorrow', 2, 'warn');
      api.cue(h.order, 'order'); api.cue(h.order2, 'order-closure');
      const strips = el('div', { style: 'display:grid' }, [h.order, h.order2]);
      h.order.style.gridArea = '1 / 1'; h.order2.style.gridArea = '1 / 1';
      wrap.appendChild(strips);
      stage.appendChild(wrap);
      return h;
    },
    render(h, view) {
      const closure = view.conditionId === 'closure-tomorrow';
      h.table.querySelectorAll('tbody tr').forEach((tr) => { if (closure) tr.classList.toggle('is-focus', view.state === 1 && tr.getAttribute('data-row') === 'P3'); });
    },
    print: [
      { title: 'The decision table and the order it explains', condition: 'no-closure', state: 5, note: `Columns: ${PR.columns.join(', ')}. Order ${PR.baseline_order.join(' → ')}: ${PR.baseline_rationale}` },
      { title: 'A closure tomorrow changes the urgency, not the value', condition: 'closure-tomorrow', state: 2, principle: true, note: `${PR.changed_condition.label}. Urgency: ${Object.entries(PR.changed_condition.urgency).map(([k, v]) => `${k} ${v}`).join('; ')}. Order ${PR.changed_condition.order.join(' → ')}: ${PR.changed_condition.rationale}` },
    ],
  };

  // =====================================================================
  // SCENE 8 · requirements-under-change (Bridge)
  // =====================================================================
  const RC = A['w02/requirements-under-change'];
  const EV = RC.linked_evidence;
  const requirementsUnderChange = {
    id: 'requirements-under-change', role: 'bridge',
    heading: 'When the rule changes, what happens to its evidence?',
    lead: `${RC.requirement} has four examples and two checks linked to it. Then the rule changes, and old evidence must not pretend to be current.`,
    principle: 'Manage the meaning of a change, its rationale, and its evidence together.',
    principleShort: 'Change the rule, its reason and its evidence in one move.',
    conditions: [
      { id: 'rule-changes', baseline: true, label: `Baseline: ${lower1(RC.rule_change.label)} (a scenario; the canonical R-02 stays ${DUR.min} to ${DUR.max})`, short: 'The rule changes',
        states: [
          { prompt: { question: 'The rule changes after the checks were written. What happens to them?', options: ['Delete them and start over', 'Nothing: they passed', 'Revise the ones whose meaning changed'] }, caption: `${RC.requirement} ${RC.version_1.version} with six pieces of linked evidence, all current. Step to change the rule.` },
          { caption: `The changed statement, ${RC.rule_change.version}: **“${RC.rule_change.text}”** Rationale: ${RC.rule_change.rationale}. Decided ${RC.rule_change.decided}. ${upper1(RC.rule_change.history)}.` },
          { caption: `The linked examples: **${EV.filter((e) => e.kind === 'example').map((e) => `${e.id} ${RC.rule_change.evidence[e.id].split(':')[0]}`).join(', ')}**. Only the example at the old edge is stale: ${RC.rule_change.evidence.E3}.` },
          { caption: `The linked checks: **C1 ${RC.rule_change.evidence.C1}**; **C2 ${RC.rule_change.evidence.C2}**, because interval overlap never depended on the maximum duration.` },
          { caption: `What travels together: the new wording, its rationale, the dated decision, its owner, the two stale items marked for revision, and the old wording kept as history. Nothing pretends to be current.` },
          { caption: 'A change is not a new sentence; it is a new sentence, the reason for it, and the evidence that must move with it.', principle: true },
        ] },
      { id: 'wording-correction', label: `Changed condition: ${lower1(RC.wording_correction.label)}`, short: 'Wording only',
        states: [
          { caption: `A different request: **“${RC.wording_correction.text}”** Rationale: ${RC.wording_correction.rationale}. Same behavior, clearer sentence.` },
          { caption: `Check the meaning before reacting: every linked example gives the same outcome under the new sentence, so **all six items stay current**. ${upper1(RC.wording_correction.history)}.` },
          { caption: 'A semantic change and an editorial change look alike in a diff and mean different things. Judge the meaning, then decide what to revise.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:560px minmax(0,1fr);gap:24px;align-items:start' });
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' });
      const versionCard = (v, kind, attrs, extra) => el('div', Object.assign({ class: 'card', style: `padding:12px 16px;display:flex;flex-direction:column;gap:6px;border-color:var(--${kind})` }, attrs || {}), [
        el('div', { class: 'card-title', style: `margin-bottom:0;color:var(--${kind});display:flex;gap:10px;align-items:center;flex-wrap:wrap` }, [`${RC.requirement} · ${v.version}`, ...(extra || [])]),
        el('p', { class: 'req-text', style: 'font-size:23px;font-weight:600;font-family:var(--font-display);line-height:1.25' }, `“${v.text}”`),
        el('p', { class: 'muted', style: 'font-size:17px;line-height:1.3' }, `Decided ${v.decided} · owner: ${v.owner}`),
        v.rationale ? el('p', { style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'Rationale: '), v.rationale]) : null,
      ]);
      h.v1 = versionCard(RC.version_1, 'accent', {}, [chip('current', 'ok', { style: 'font-size:14px' })]);
      api.cue(h.v1, 'version-1');
      h.v2 = versionCard(RC.rule_change, 'warn', reveal({ class: 'card rv rv--rise', 'data-cond': 'rule-changes', 'data-show-from': '1' }), [chip('rule change', 'warn', { style: 'font-size:14px' }), chip('scenario', 'muted', { style: 'font-size:14px' })]);
      h.v1a = versionCard(RC.wording_correction, 'ok', reveal({ class: 'card rv rv--rise', 'data-cond': 'wording-correction', 'data-show-from': '0' }), [chip('wording correction', 'ok', { style: 'font-size:14px' })]);
      api.cue(h.v2, 'version-2'); api.cue(h.v1a, 'wording');
      h.history = el('p', reveal({ class: 'rv rail-note', 'data-cond': 'rule-changes', 'data-show-from': '1', style: 'padding:0 4px' }), upper1(RC.rule_change.history) + '.');
      h.history2 = el('p', reveal({ class: 'rv rail-note', 'data-cond': 'wording-correction', 'data-show-from': '1', style: 'padding:0 4px' }), upper1(RC.wording_correction.history) + '.');
      left.append(h.v1, h.v2, h.v1a, h.history, h.history2);
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' });
      h.badges = {};
      const evRow = (e) => {
        const b = chip('current', 'ok', { style: 'font-size:15px;white-space:normal' });
        h.badges[e.id] = b;
        const row = el('div', { class: 'ev-row', style: 'display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;padding:7px 12px;border-bottom:1px solid var(--line);font-size:19px' }, [
          el('code', { style: 'color:var(--accent-strong)' }, e.id), el('span', {}, [el('span', { class: 'muted', style: 'font-size:15px;text-transform:uppercase;letter-spacing:.06em;margin-right:8px' }, e.kind), e.text]), b,
        ]);
        api.cue(row, `evidence-${e.id}`);
        return row;
      };
      h.evidence = el('div', { class: 'card', style: 'padding:10px 14px' }, [el('div', { class: 'card-title' }, 'Linked evidence and its status'), ...EV.map(evRow)]);
      api.cue(h.evidence, 'evidence');
      const item = (txt, ok) => el('li', { style: 'display:flex;gap:10px;align-items:flex-start' }, [el('span', { class: ok ? 'ok' : 'muted', 'aria-hidden': 'true' }, ok ? '✓' : '·'), el('span', {}, txt)]);
      h.travel = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'rule-changes', 'data-show-from': '4', style: 'padding:10px 16px' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:6px' }, 'What travels together'),
        el('ul', { style: 'list-style:none;padding:0;margin:0;font-size:18px;line-height:1.35;display:flex;flex-direction:column;gap:4px' }, [
          item('the new wording, in place', true), item('its rationale, written next to it', true), item('a dated decision with an owner', true),
          item(`E3 revised: ${RC.rule_change.evidence.E3.split(': ')[1]}`, true), item(`C1 rewritten: ${RC.rule_change.evidence.C1.split(': ')[1]}`, true), item('the old wording kept as history', true),
        ]),
      ]);
      h.travel2 = el('div', reveal({ class: 'card rv rv--rise', 'data-cond': 'wording-correction', 'data-show-from': '1', style: 'padding:10px 16px' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:6px' }, 'What travels together'),
        el('ul', { style: 'list-style:none;padding:0;margin:0;font-size:18px;line-height:1.35;display:flex;flex-direction:column;gap:4px' }, [
          item('the clearer wording, in place', true), item('its rationale, written next to it', true), item('a dated decision with an owner', true),
          item('examples: unchanged, every outcome the same', false), item('checks: unchanged, nothing to rewrite', false), item('the old wording kept in the history note', true),
        ]),
      ]);
      api.cue(h.travel, 'travels'); api.cue(h.travel2, 'travels-wording');
      right.append(h.evidence, h.travel, h.travel2);
      wrap.append(left, right);
      stage.appendChild(wrap);
      return h;
    },
    render(h, view) {
      const c = view.conditionId, st = view.state;
      const src = c === 'rule-changes' ? RC.rule_change.evidence : RC.wording_correction.evidence;
      EV.forEach((e) => {
        const b = h.badges[e.id];
        const decided = c === 'rule-changes' ? (e.kind === 'example' ? st >= 2 : st >= 3) : st >= 1;
        const status = decided ? src[e.id] : 'current';
        const stale = status.startsWith('stale');
        b.textContent = decided ? (stale ? `stale · ${status.split(': ')[1]}` : 'current') : 'current';
        b.className = `chip chip--${stale ? 'bad' : 'ok'}`;
        b.style.cssText = 'font-size:15px;white-space:normal';
        b.closest('.ev-row').style.background = decided && stale ? 'var(--bad-fill)' : '';
      });
      h.v1.style.opacity = c === 'rule-changes' && st >= 1 ? '0.55' : '';
      h.v1.querySelector('.chip').textContent = c === 'rule-changes' && st >= 1 ? 'history' : 'current';
      h.v1.querySelector('.chip').className = `chip chip--${c === 'rule-changes' && st >= 1 ? 'muted' : 'ok'}`;
    },
    print: [
      { title: 'The rule changes: new wording, rationale, dated decision, and the evidence that goes stale', condition: 'rule-changes', state: 4, note: `${RC.rule_change.label}: “${RC.rule_change.text}” Rationale: ${RC.rule_change.rationale}. Evidence: ${EV.map((e) => `${e.id} ${RC.rule_change.evidence[e.id]}`).join('; ')}. ${upper1(RC.rule_change.history)}. This is a change-management scenario with fictional dates; the course's canonical R-02 stays ${DUR.min} through ${DUR.max} minutes.` },
      { title: 'A wording correction: the same behavior, every item stays current', condition: 'wording-correction', state: 2, principle: true, note: `“${RC.wording_correction.text}” Rationale: ${RC.wording_correction.rationale}. All six items stay current; ${RC.wording_correction.history}.` },
    ],
  };

  // =====================================================================
  // PAGE · the requirement register of this lecture
  // =====================================================================
  const IC = F.interval_cases[0];
  const CANC = F.cancellation_matrix;
  const REGISTER = [
    { id: 'R-01', kind: 'behavior', text: 'No overlapping confirmed bookings for the same room; intervals are half-open, so adjacent bookings do not overlap.', example: TROW['R-01'].examples[0], status: 'stated, example-backed, traced' },
    { id: 'R-02', kind: 'behavior', text: `Booking duration is ${DUR.min} through ${DUR.max} minutes inclusive, whole minutes, end later than start.`, example: `${CASES.map((c) => `${c.minutes} ${c.expected_valid_duration ? 'accepted' : 'rejected'}`).join(', ')}`, status: 'stated, example-backed, traced' },
    { id: 'R-03', kind: 'business rule', text: 'An authenticated requester may cancel their own future confirmed booking; started and other-owner cases are denied.', example: `${CANC[0].requester} cancels own ${CANC[0].booking} at ${CANC[0].now} for ${CANC[0].start}: ${CANC[0].expected}; ${CANC[1].requester}: ${CANC[1].expected}`, status: 'stated, example-backed, traced; delegated cancellation is an open variant' },
    { id: 'R-04', kind: 'behavior', text: 'Notification failure does not undo a confirmed booking; pending or failed messages stay visible and recoverable.', example: 'provider unavailable: booking stays confirmed, screen says the message is delayed (Week 1)', status: 'stated, example-backed' },
    { id: 'R-05', kind: 'quality (accessibility)', text: 'The core task can be completed with the keyboard, with status and error information the person can perceive.', example: `${KP.steps.map((s0) => s0.key).join(', ')}: booking completed, status announced`, status: 'stated, example-backed; acceptance is categorical' },
    { id: 'Q-01', kind: 'quality target', text: `p95 of search response time at most ${QC.p95_ms_max} ms under ${QC.concurrent_users} concurrent users, at the ${QC.boundary} (teaching fixture).`, example: `${NLAT} samples under fifty users: p95 ${fmt(P95.B)} ms, not met (illustrative)`, status: 'stated; threshold, workload, boundary named; not yet checked under its conditions' },
  ];
  const OPEN = [
    { id: 'open', kind: 'open decision', text: 'The fairness policy: first come first served, a per-user limit or staff priority.', example: 'scene 1', status: 'open; the stakeholders decide' },
    { id: 'open', kind: 'open quality question', text: `Easy for whom: ${listAnd(AR.easy_question.candidates)}.`, example: 'scene 1 → scene 4, R-05', status: 'open' },
    { id: 'deferred', kind: 'deferred', text: ES.visitor.deferred.text + '.', example: 'scene 2', status: 'decided, dated, owned' },
    { id: 'open', kind: 'open question', text: 'Who may record a room closure, and what happens to affected bookings.', example: 'scenes 2 and 7', status: 'open until Week 14' },
  ];
  const NOT_REQUIREMENTS = [
    { text: '“Use Framework X to make booking fast.”', why: 'a solution choice mixed with a vague quality objective; name the outcome and its conditions separately', kind: 'solution + vague quality' },
    { text: '“Use a relational database.”', why: 'an implementation decision; it belongs in the design record next to the requirement it serves', kind: 'implementation decision' },
    { text: `“${upper1(OB.widget.proposal)}.”`, why: 'a screen design; the requirement behind it is R-02', kind: 'solution' },
  ];
  const KIND_COLOR = { behavior: 'accent', 'business rule': 'warn', 'quality (accessibility)': 'violet', 'quality target': 'violet', 'open decision': 'warn', 'open quality question': 'violet', deferred: 'accent', 'open question': 'warn' };
  const register = {
    kind: 'page', id: 'register', role: 'page',
    heading: 'The requirement register of this lecture',
    lead: 'Six statements with identifiers that reappear in later weeks, four open items kept visible, and three sentences that are not requirements at all.',
    printRole: 'Requirement register',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const kindChip = (k) => chip(k, KIND_COLOR[k] || 'muted', { style: 'font-size:14px;white-space:normal' });
      const rows = [...REGISTER, ...OPEN].map((r) => ({
        attrs: { class: r.id.startsWith('R') || r.id.startsWith('Q') ? '' : 'reg-open', style: r.id.startsWith('R') || r.id.startsWith('Q') ? '' : 'background:var(--surface-2)' },
        cells: { id: el('b', { style: 'font-size:19px' }, r.id.startsWith('R') || r.id.startsWith('Q') ? r.id : '·'), kind: el('span', { class: 'reg-kind' }, kindChip(r.kind)), text: r.text, example: el('span', { class: 'muted' }, r.example), status: r.status },
      }));
      NOT_REQUIREMENTS.forEach((n) => rows.push({ attrs: { class: 'reg-not', style: 'background:var(--bad-fill)' }, cells: { id: el('span', { class: 'bad', style: 'font-weight:700' }, '✕'), kind: el('span', { class: 'reg-kind' }, chip(n.kind, 'bad', { style: 'font-size:15px;white-space:normal' })), text: n.text, example: el('span', { class: 'muted' }, n.why), status: 'not a requirement' } }));
      const tbl = table({ captionHidden: 'Register: behaviors, business rules, quality targets, open items', cls: 'data-table--compact', columns: [{ key: 'id', label: 'ID' }, { key: 'kind', label: 'Kind', cls: 'col-kind' }, { key: 'text', label: 'Statement' }, { key: 'example', label: 'Acceptance example' }, { key: 'status', label: 'Status' }], rows });
      tbl.style.fontSize = '16px';
      tbl.querySelectorAll('td, th').forEach((c) => { c.style.padding = '4px 8px'; c.style.fontSize = '16px'; c.style.lineHeight = '1.25'; });
      tbl.querySelectorAll('tbody th, tbody td:first-child').forEach((c) => { c.style.whiteSpace = 'nowrap'; });
      api.cue(tbl, 'table');
      const kindsBtn = api.cue(el('button', { type: 'button', class: 'ctl-btn ctl-btn--step', style: 'height:50px;font-size:20px' }, 'Reveal the kinds'), 'kinds');
      const notBtn = api.cue(el('button', { type: 'button', class: 'ctl-btn', style: 'height:50px;font-size:20px', 'aria-disabled': 'true' }, 'What is not a requirement?'), 'not-requirements');
      const bar = el('div', { style: 'display:flex;gap:12px;align-items:center;margin-bottom:10px' }, [kindsBtn, notBtn, el('span', { class: 'muted', style: 'font-size:17px' }, 'Identifiers stay stable: R-01 in Week 3 is the R-01 of this table.')]);
      const notRows = Array.from(tbl.querySelectorAll('tr.reg-not'));
      notRows.forEach((tr) => tr.remove());
      const notCard = el('div', { class: 'card reg-not', style: 'padding:6px 14px;display:flex;flex-direction:column;gap:3px;border-color:var(--bad)' }, [   // ends above the presenter corner (y < 696)
        el('div', { class: 'card-title', style: 'margin-bottom:2px;color:var(--bad)' }, 'Not requirements'),
        ...NOT_REQUIREMENTS.map((nr) => el('div', { style: 'font-size:15px;line-height:1.22;padding:3px 0;border-top:1px solid var(--line)' }, [el('b', {}, nr.text), ' ', chip(nr.kind, 'bad', { style: 'font-size:13px;white-space:normal' }), el('span', { class: 'muted', style: 'display:block;font-size:15px' }, upper1(nr.why) + '.')])),
      ]);
      api.cue(notCard, 'not-card');
      const kindsCard = el('div', { class: 'card reg-kind', style: 'padding:8px 14px;display:flex;flex-direction:column;gap:4px' }, [
        el('div', { class: 'card-title', style: 'margin-bottom:2px' }, 'Four kinds'),
        el('p', { style: 'font-size:16px;line-height:1.3' }, [kindChip('behavior'), ' what the service does']),
        el('p', { style: 'font-size:16px;line-height:1.3' }, [kindChip('quality target'), ' how well, observably']),
        el('p', { style: 'font-size:16px;line-height:1.3' }, [kindChip('business rule'), ' who may do what']),
        el('p', { style: 'font-size:16px;line-height:1.3' }, [chip('implementation decision', 'bad', { style: 'font-size:14px' }), ' how to build it; not a requirement']),
      ]);
      api.cue(kindsCard, 'kinds-card');
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [kindsCard, notCard]);
      body.append(el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:24px;height:100%;min-height:0;align-items:start' }, [el('div', { style: 'min-width:0' }, [bar, tbl]), right]));
      const apply = () => {
        const st = Number(body.getAttribute('data-state'));
        body.querySelectorAll('.reg-kind').forEach((n) => { n.style.visibility = st >= 1 ? '' : 'hidden'; });
        notCard.style.visibility = st >= 2 ? '' : 'hidden';
        kindsBtn.setAttribute('aria-disabled', st >= 1 ? 'true' : 'false');
        notBtn.setAttribute('aria-disabled', st === 1 ? 'false' : 'true');
      };
      kindsBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '0') { body.setAttribute('data-state', '1'); apply(); } });
      notBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '1') { body.setAttribute('data-state', '2'); apply(); } });
      body.reset = () => { body.setAttribute('data-state', '0'); apply(); };
      apply();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.appendChild(el('table', { class: 'data-table data-table--compact', style: 'font-size:12.5px' }, [
        el('thead', {}, el('tr', {}, ['ID', 'Kind', 'Statement', 'Acceptance example', 'Status'].map((t) => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, [...REGISTER, ...OPEN].map((r) => el('tr', {}, [el('td', { style: 'white-space:nowrap' }, r.id.startsWith('R') || r.id.startsWith('Q') ? r.id : '·'), el('td', {}, r.kind), el('td', {}, r.text), el('td', {}, r.example), el('td', {}, r.status)]))),
      ]));
      body.appendChild(el('h3', {}, 'Not requirements'));
      body.appendChild(el('ul', {}, NOT_REQUIREMENTS.map((n) => el('li', {}, `${n.text} ${upper1(n.why)}. (${n.kind})`))));
    },
  };

  // =====================================================================
  // PAGE · principles and checks
  // =====================================================================
  const CHECKS = [
    { q: 'Is “Use Framework X to make booking fast” a clear behavior requirement?', a: 'It mixes a solution choice with an underspecified quality objective; define the needed outcome and conditions separately.' },
    { q: 'Should a 120-minute booking satisfy R-02?', a: 'Yes. The upper limit is inclusive; other validity and availability checks still apply.' },
    { q: 'What is missing from “Search must finish in 500 milliseconds”?', a: 'At least the measurement boundary, workload, proportion or percentile, and conditions.' },
    { q: 'What does selecting R-03 in the matrix tell us?', a: 'Which decisions and checks are linked to cancellation authorization; those links need review when the rule changes.' },
    { q: 'Does supplying R-02 to an assistant guarantee that its candidate is correct?', a: 'No. The explicit rule makes an independent judgment possible; the inclusive boundary still needs to be checked.' },
    { q: 'A desktop editor request says “save my work safely.” What must be clarified before choosing autosave?', a: 'Clarify what counts as saved, acceptable loss after interruption, recovery feedback and overwrite behavior. Choose an observable recovery example with the user; autosave is a possible design, not the requirement itself.' },
  ];
  const SCENES = [ambiguousRequest, elicitationAndScope, observableBehavior, qualityWithConditions, acceptanceAndValidation, traceabilityMatrix, priorityAndRisk, requirementsUnderChange];
  const principles = {
    kind: 'page', id: 'principles', role: 'page',
    heading: 'Eight principles, six checks',
    lead: 'One principle per scene, then six checks: decide your answer before you open each one.',   // one line: the six checks and their answers fit above the page footer
    printRole: 'Principles and checks',
    build(body, api) {
      const cards = el('div', { class: 'principle-grid', style: 'gap:10px' }, SCENES.map((sc, i) => api.cue(el('a', { class: 'principle-card', href: `#/${sc.id}`, style: 'text-decoration:none;color:inherit;padding:10px 16px' }, [
        el('span', { class: 'pc-num' }, `${i + 1} · ${sc.role}`), el('span', { class: 'pc-text' }, sc.principle), el('span', { class: 'pc-short' }, sc.principleShort),
      ]), `card-${i + 1}`)));
      cards.querySelectorAll('.pc-text').forEach((n) => { n.style.fontSize = '18px'; });
      cards.querySelectorAll('.pc-short').forEach((n) => { n.style.fontSize = '16px'; });
      const qa = el('ol', { class: 'qa-list', style: 'margin-top:6px;grid-template-columns:1fr 1fr 1fr;max-width:1600px' }, CHECKS.map((c, i) => {   // the six checks stay left of the presenter corner (x < 1664)
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
      body.appendChild(el('ol', { class: 'print-qa' }, CHECKS.map((c, i) => el('li', {}, [el('span', { class: 'q' }, `${i + 1}. ${c.q}`), el('span', { class: 'a' }, c.a)]))));
    },
  };

  // =====================================================================
  // PAGE · handoff, terminology and sources
  // =====================================================================
  const TERMS = [
    ['Requirement', 'A statement of what the service must do or keep true, written so that an example can show whether it holds. R-01 to R-05 and Q-01 are the ones of this course.'],
    ['Behavior (functional requirement)', 'What the service does under a condition: accept a 30-minute booking, reject a 121-minute one, keep a booking confirmed when the message fails.'],
    ['Quality requirement', 'How well it does it, with observable acceptance: a threshold with workload and boundary (Q-01), or a categorical outcome such as keyboard completion (R-05).'],
    ['Business rule', 'A rule the organization sets about who may do what: an authenticated requester cancels only their own future booking (R-03).'],
    ['Implementation decision', 'A way of building it, such as a slider or a relational database. Recorded in the design, next to the requirement it serves; not a requirement.'],
    ['Elicitation', 'Finding out the situation behind a request: asking what happened, watching a walk-through, separating what was stated from what was inferred.'],
    ['Scope', 'The boundary of a release: who and what is inside. What is outside is deferred with a decision, or omitted by accident.'],
    ['Assumption', 'Something inferred rather than stated, with an author. It stays in the register until a stakeholder turns it into a fact or a decision.'],
    ['Acceptance example', 'A concrete case with its expected outcome, such as 120 minutes accepted; it is how a requirement is checked and how a change is seen.'],
    ['Traceability', 'The links from a requirement to its design decision, its examples and its checks, kept inspectable and current.'],
    ['Verification', 'Whether the system matches its written description.'],
    ['Validation', 'Whether the description matches the need.'],
    ['Priority', 'A reasoned order under current constraints, explained through benefit, dependency, uncertainty, consequence and effort; it changes when the constraints do.'],
  ];
  const SOURCES = [
    ['S01', 'IEEE Computer Society, Guide to the Software Engineering Body of Knowledge (SWEBOK V4.0a)', 'https://www.computer.org/education/bodies-of-knowledge/software-engineering'],
    ['S02', 'ACM / IEEE-CS / AAAI, Computer Science Curricula 2023, final report', 'https://csed.acm.org/final-report/'],
    ['S25', 'W3C, Web Content Accessibility Guidelines 2.2', 'https://www.w3.org/TR/WCAG22/'],
    ['S46', 'ISO/IEC 25010:2023, SQuaRE product quality model', 'https://www.iso.org/standard/78176.html'],
  ];
  const IN_PRACTICE = 'Requirements live as issues or user stories in GitHub Issues, Jira or Azure Boards, and acceptance examples are often written as Given/When/Then scenarios that tools such as Cucumber or pytest-bdd run as checks.';
  const PRACTICE_YEAR = (String(F.metadata && F.metadata.date).match(/\b(\d{4})\b/) || [])[1];
  if (!PRACTICE_YEAR) throw new Error('fixtures metadata.date carries no year for the dated In practice examples');
  const IN_PRACTICE_TITLE = `In practice · examples from ${PRACTICE_YEAR}`;
  const HANDOFF_QUESTION = 'Does a written rule alone make the sequence of booking, cancellation and failure states understandable?';
  const CARRIED = [
    'The requirement register: R-01 to R-05 and Q-01, each with an acceptance example and a stable identifier.',
    'The traceability matrix: R-01, R-02 and R-03 linked to a design decision, examples and checks.',
    'The open items, kept visible: the fairness policy, easy for whom, visitors deferred, and room closures until Week 14.',
  ];
  const sources = {
    kind: 'page', id: 'sources', role: 'page',
    heading: 'What carries forward, and where to read more',
    lead: 'Next week turns the register into models: which picture answers which question about a booking.',
    printRole: 'Handoff, terminology, sources',
    build(body, api) {
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:16px;min-height:0' }, [
        api.cue(el('div', { class: 'handoff', style: 'font-size:28px' }, [el('span', { class: 'muted', style: 'font-size:19px;display:block;margin-bottom:8px;font-family:var(--font-text);font-weight:500' }, 'Week 3 starts from this question:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]), 'handoff'),
        el('div', { class: 'card' }, [el('div', { class: 'card-title' }, 'Carried forward to Week 3'), el('ul', { style: 'font-size:19px;line-height:1.4;display:flex;flex-direction:column;gap:8px' }, CARRIED.map((t) => el('li', {}, t)))]),
        el('div', { class: 'card' }, [el('div', { class: 'card-title' }, IN_PRACTICE_TITLE), el('p', { style: 'font-size:19px;line-height:1.4' }, IN_PRACTICE)]),
      ]);
      const middle = el('div', { class: 'card', style: 'min-height:0' }, [el('div', { class: 'card-title' }, 'Terms used this week'), el('dl', { class: 'term-list', style: 'display:block;column-count:2;column-gap:22px;font-size:15.5px;line-height:1.28' }, TERMS.map(([t, d]) => el('div', { style: 'break-inside:avoid;margin-bottom:6px' }, [el('dt', {}, t), el('dd', {}, d)])))]);
      const right = el('div', { class: 'card', style: 'min-height:0' }, [el('div', { class: 'card-title' }, 'Sources for this lecture'), el('ul', { class: 'source-list', style: 'font-size:18px;gap:9px' }, SOURCES.map(([k, t, u]) => el('li', {}, [el('span', { class: 'key' }, k), el('span', {}, [t, ' ', el('a', { class: 'url', href: u, style: 'font-size:15.5px' }, u)])])))]);   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:600px minmax(0,1fr) 470px;gap:26px;height:100%;min-height:0' }, [left, middle, right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('div', { class: 'handoff' }, [el('span', { class: 'muted', style: 'display:block;font-size:14px' }, 'Week 3 starts from this question:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]),
          el('h3', {}, 'Carried forward to Week 3'), el('ul', {}, CARRIED.map((t) => el('li', {}, t))),
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
    week: 2, file: FILE,
    title: 'From ambiguous requests to verifiable requirements',
    question: 'How would we know that a requirement has been satisfied?',
    coverLead: 'Student notes for lecture 2. Every scene shows a situation, asks you to predict, reveals the mechanism, changes one condition, compares the outcomes and names the principle. The pages that follow keep the selected states of each scene with their captions, and the register page collects the requirements written this week.',
    coverNote: 'Campus Rooms is a fictional room-booking service; every name, number, request and date is a teaching example unless a source is named. Rules and values marked example assumption belong to that example. Temporary variants are comparisons only: the canonical rules stay as the register states them.',
    pages: [
      opening,
      outcomes,
      { kind: 'scene', scene: ambiguousRequest },
      { kind: 'scene', scene: elicitationAndScope },
      { kind: 'scene', scene: observableBehavior },
      { kind: 'scene', scene: qualityWithConditions },
      { kind: 'scene', scene: acceptanceAndValidation },
      { kind: 'scene', scene: traceabilityMatrix },
      { kind: 'scene', scene: priorityAndRisk },
      { kind: 'scene', scene: requirementsUnderChange },
      register,
      principles,
      sources,
    ],
  });
})();
