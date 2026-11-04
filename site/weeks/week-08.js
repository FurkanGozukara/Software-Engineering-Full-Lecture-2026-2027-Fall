/* Week 08. Original teaching data: plan/assets/demo-fixtures.json, anchors w08/*.
   The frozen shared shell owns navigation, state, recording mode and print.
   Each motion follows an operated step and leaves a readable, deterministic state. */
(function () {
  'use strict';
  const F = window.CAMPUS_ROOMS_FIXTURES;
  const { el, s, text, arrow } = window.VC;
  const A = F.anchors, C = F.case;
  const FE = A['w08/friendly-example'], PT = A['w08/partition-the-inputs'], SC = A['w08/choose-test-scope'];
  const OR = A['w08/oracle-independence'], PR = A['w08/properties-and-counterexamples'], CV = A['w08/coverage-and-mutation'];
  const RO = A['w08/repeatable-observation'], TF = A['w08/testing-as-feedback'], AI13 = A['w13/shared-assumption'];
  const FILE = 'week-08.html', WEEK_Q = 'Which checks would challenge our assumptions rather than merely repeat them?';
  const TRANSFER = F.transfer_checks.w08, ARI = C.users[0], OP = FE.opening;
  const show = (node, on) => node.classList.toggle('is-shown', !!on);
  const focus = (node, on) => node.classList.toggle('is-focus', !!on);
  const title = (str) => el('div', { class: 'w8-title' }, str);
  const card = (children, cls = '') => el('div', { class: `card w8-card ${cls}` }, children);
  const rv = (node) => { node.classList.add('rv', 'rv--rise'); return node; };
  const cue = (api, node, name) => api.cue(node, name);
  const printApi = { cue: (node) => node, motion: false };
  const verdict = (ok) => (ok ? 'Accepted' : 'Rejected');
  const list = (items, attrs = {}) => el('ul', attrs, items.map((t) => el('li', {}, t)));
  const mark = (ok) => el('span', { class: `w8-mark ${ok ? 'is-ok' : 'is-bad'}`, 'aria-hidden': 'true' }, ok ? '✓' : '×');
  const snip = (holder, prefix) => holder.snippets.find((x) => x.name.startsWith(prefix));
  const answer = (snippet, ...args) => snippet.cases.find((c) => JSON.stringify(c.args) === JSON.stringify(args)).expected;
  const clock = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  const interval = (str) => { const m = str.match(/\[(\d\d):(\d\d),(\d\d):(\d\d)\)/); return [Number(m[1]) * 60 + Number(m[2]), Number(m[3]) * 60 + Number(m[4])]; };
  function status(str, kind = 'warn') {
    const node = el('div', { class: `w8-status w8-status--${kind}`, role: 'status' }, [el('span', { class: 'w8-symbol', 'aria-hidden': 'true' }, kind === 'ok' ? '✓' : kind === 'bad' ? '×' : '?'), el('span', {}, str)]);
    // Only the kind changes: reveal classes (rv, is-shown) stay on the node.
    node.set = (txt, k) => { ['ok', 'bad', 'warn'].forEach((x) => node.classList.toggle(`w8-status--${x}`, x === k)); node.children[0].textContent = k === 'ok' ? '✓' : k === 'bad' ? '×' : '?'; node.children[1].textContent = txt; };
    return node;
  }
  const KW = new Set(['def', 'return', 'if', 'and', 'or', 'not', 'True', 'False', 'None', 'in', 'for', 'else', 'from', 'import', 'assert']);
  function colored(src) {
    const hash = src.indexOf('#');
    const [head, tail] = hash >= 0 ? [src.slice(0, hash), src.slice(hash)] : [src, ''];
    const nodes = head.split(/("[^"]*"|\b\d+\b|\b[A-Za-z_][A-Za-z0-9_]*\b|\s+|[^\sA-Za-z0-9_"]+)/).filter(Boolean).map((t) =>
      (t.startsWith('"') ? el('span', { class: 'str' }, t) : /^\d+$/.test(t) ? el('span', { class: 'num' }, t) : KW.has(t) ? el('span', { class: 'kw' }, t) : document.createTextNode(t)));
    if (tail) nodes.push(el('span', { class: 'cm' }, tail));
    return nodes;
  }
  function code(api, src, name, small = false) {
    const root = el('div', { class: `w8-code${small ? ' w8-code--small' : ''}`, role: 'group', 'aria-label': name });
    root.setCode = (source) => {
      root.replaceChildren(...source.split('\n').map((ln, i) => cue(api, el('div', { class: 'w8-line' }, [el('span', { class: 'w8-ln', 'aria-hidden': 'true' }, String(i + 1)), el('span', { class: 'w8-src' }, ln ? colored(ln) : ' ')]), `${name}-line-${i + 1}`)));
    };
    root.setCode(src);
    root.focusLines = (lines) => [...root.children].forEach((row, i) => focus(row, lines.includes(i + 1)));
    root.ranLines = (lines) => [...root.children].forEach((row, i) => row.classList.toggle('is-ran', lines.includes(i + 1)));
    root.badLines = (lines) => [...root.children].forEach((row, i) => row.classList.toggle('is-bad', lines.includes(i + 1)));
    return root;
  }
  function diff(api, before, after, name) {
    return el('div', { class: 'w8-diff', role: 'group', 'aria-label': 'Diff: minus removes a line, plus adds a line' }, [
      cue(api, el('div', { class: 'w8-diff-row w8-diff-row--remove' }, [el('span', { class: 'w8-diff-sign' }, '−'), el('span', { class: 'w8-diff-source' }, before)]), `${name}-removed`),
      cue(api, el('div', { class: 'w8-diff-row w8-diff-row--add' }, [el('span', { class: 'w8-diff-sign' }, '+'), el('span', { class: 'w8-diff-source' }, after)]), `${name}-added`),
    ]);
  }
  function glow(api, node, color = '255,209,102') {
    if (api.motion) api.animate(node, [{ filter: `drop-shadow(0 0 0 rgba(${color},0))` }, { filter: `drop-shadow(0 0 16px rgba(${color},.8))` }, { filter: `drop-shadow(0 0 0 rgba(${color},0))` }], { duration: 900, easing: 'ease-out' });
  }
  const GREEN = '111,220,154', RED = '255,139,123';
  function changePulse(api, node, delay = 0) {
    if (api.motion) api.animate(node, [{ opacity: 0.3, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 460, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
  }
  // Carry a copy of a value from one element to another inside a positioned root. The final state is
  // already rendered, so cancelling the motion or stepping back loses no information.
  function fly(api, root, token, from, to, opts = {}) {
    if (!api.motion) return;
    const r = root.getBoundingClientRect(), k = r.width / (root.offsetWidth || r.width) || 1;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const fx = (a.left - r.left) / k + (opts.fromX || 10), fy = (a.top - r.top) / k + (opts.fromY || 6);
    const tx = (b.left - r.left) / k + (opts.toX || 10), ty = (b.top - r.top) / k + (opts.toY || 6);
    if (opts.label != null) token.textContent = opts.label;
    api.animate(token, [{ transform: `translate(${fx}px,${fy}px)`, opacity: 0 }, { transform: `translate(${fx}px,${fy}px)`, opacity: 1, offset: 0.12 }, { transform: `translate(${tx}px,${ty}px)`, opacity: 1, offset: 0.85 }, { transform: `translate(${tx}px,${ty}px)`, opacity: 0 }], { duration: opts.duration || 950, delay: opts.delay || 0, easing: 'cubic-bezier(.2,.7,.2,1)' });
  }
  // Count a value from one number to another over a short time; the final value is applied at once when motion is off.
  function tween(api, from, to, ms, apply) {
    if (!api.motion || from === to) { apply(to); return; }
    let t0 = null;
    const frame = (t) => { if (t0 == null) t0 = t; const p = Math.min(1, (t - t0) / ms), e = 1 - (1 - p) ** 3; apply(from + (to - from) * e); if (p < 1) api.raf(frame); };
    apply(from); api.raf(frame);
  }
  // A condition change opens the new condition directly at its first state: every motion the switch starts is
  // settled before the next frame, so the new condition's results (a prediction's answer) never show in passing.
  function instantConditionChange(scene) {
    const { setup, render } = scene, last = new WeakMap();
    scene.setup = (stage, api) => { const h = setup(stage, api) || {}; last.set(h, { stage, condition: null }); return h; };
    scene.render = (h, v, api) => {
      const seen = last.get(h), changed = seen.condition !== null && seen.condition !== v.conditionId;
      seen.condition = v.conditionId;
      render(h, v, api);
      if (changed) seen.stage.getAnimations({ subtree: true }).forEach((anim) => anim.cancel());
    };
  }
  const ruleBar = (api, name) => cue(api, el('div', { class: 'w8-rule' }, [el('span', { class: 'w8-rule-id' }, FE.rule.id), el('span', {}, FE.rule.text)]), name);

  // ------------------------------------------------------------------ Opening
  const S1 = { exclusive: snip(FE, 'incorrect'), inclusive: snip(FE, 'correct'), no_limit: snip(FE, 'overcorrected') };
  const required = (n) => answer(S1.inclusive, n);
  const opening = {
    kind: 'page', id: 'opening', heading: `The check is green. Why was ${ARI.name}’s booking refused?`,
    lead: `The rule shipped with a passing check, and every line ran. Then ${ARI.name} asked for the longest booking it allows.`,
    printRole: 'Opening situation',
    build(body, api) {
      const rule = ruleBar(api, 'requirement');
      const check = cue(api, code(api, OP.check_code, 'check-code'), 'shipped-check');
      const bar = el('div', { class: 'w8-runbar' }, el('i'));
      const report = cue(api, status('Not run yet'), 'check-report');
      const lines = cue(api, rv(el('div', { class: 'w8-note w8-note--ok' }, `${OP.lines}. Nothing here looks wrong.`)), 'lines-executed');
      const runBtn = cue(api, el('button', { type: 'button', class: 'btn-reserve w8-action' }, 'Run the check'), 'run-check');
      const tryBtn = cue(api, el('button', { type: 'button', class: 'btn-reserve w8-action', disabled: true }, `${ARI.name} books ${OP.request.minutes} minutes`), 'try-request');
      const answerNote = cue(api, rv(el('div', { class: 'w8-note w8-note--warn' }, `The check told the truth about 60 minutes. Nobody asked it about ${OP.request.minutes}.`)), 'finding');
      const left = el('div', { class: 'w8-stack' }, [rule,
        card([title('The check that shipped'), check, el('div', { style: 'height:10px' }), bar]), report, lines,
        el('div', { style: 'display:flex;gap:14px' }, [runBtn, tryBtn]), answerNote,
        el('p', { class: 'w8-small' }, 'Campus Rooms is fictional. Every result in this lecture comes from a small example you can check yourself.')]);
      const duration = el('div', { class: 'field' }, [el('span', { class: 'k' }, 'Duration'), el('span', { class: 'v' }, `${OP.request.minutes} minutes`)]);
      const message = cue(api, el('div', { class: 'w8-screen-msg' }, [el('small', {}, 'Message'), el('span', {}, OP.message)]), 'screen-message');
      const result = cue(api, status('Not sent yet'), 'screen-result');
      const screen = cue(api, window.VC.browser({ who: `${ARI.name} (${ARI.id})`, url: 'campus-rooms.example/book', cls: 'w8-screen', body: [
        el('div', { class: 'field' }, [el('span', { class: 'k' }, 'Room'), el('span', { class: 'v' }, OP.request.room)]),
        el('div', { class: 'field' }, [el('span', { class: 'k' }, 'Time'), el('span', { class: 'v' }, `${OP.request.start} to ${OP.request.end}`)]),
        duration, message, el('span', { class: 'w8-fake-btn', 'aria-hidden': 'true' }, 'Book'), result] }), 'booking-screen');
      const question = card([title('Decide before the reveal'), el('p', { class: 'w8-big', style: 'font-size:25px' }, `The check is green. Will ${ARI.name}’s ${OP.request.minutes}-minute booking go through?`)]);
      const token = el('div', { class: 'w8-flying', 'aria-hidden': 'true' });
      body.append(el('div', { class: 'w8-grid', style: 'grid-template-columns:minmax(0,1fr) 590px;gap:26px;height:100%' }, [left, el('div', { class: 'w8-stack' }, [question, el('div', { class: 'w8-title', style: 'margin:4px 0 -6px' }, `What ${ARI.name} sees`), screen])]), token);
      const render = (st) => {
        body.dataset.state = String(st);
        bar.classList.toggle('is-on', st >= 1);
        report.set(st >= 1 ? `${OP.report}: duration_ok(60) returned True` : 'Not run yet', st >= 1 ? 'ok' : 'warn');
        show(lines, st >= 1); show(answerNote, st >= 2);
        result.set(st >= 2 ? `${OP.outcome}: ${OP.request.minutes} minutes` : st ? 'Ready to send' : 'Not sent yet', st >= 2 ? 'bad' : 'warn');
        duration.classList.toggle('is-bad', st >= 2);
        runBtn.disabled = st >= 1; tryBtn.disabled = st !== 1;
        if (st === 1) glow(api, report, GREEN);
        if (st === 2) { glow(api, result, RED); fly(api, body, token, duration, result, { label: `${OP.request.minutes}`, fromX: 380, fromY: 4, toX: 60, toY: 8 }); }
      };
      runBtn.addEventListener('click', () => render(1)); tryBtn.addEventListener('click', () => render(2));
      body.reset = () => render(0); body.reset();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.append(el('p', {}, `R-02: ${FE.rule.text} The only check was “${OP.check_code}”.`),
        el('div', { class: 'print-columns', style: 'margin:14px 0' }, [
          el('div', {}, [title('The run'), el('p', {}, `${OP.report}. ${OP.lines}.`)]),
          el('div', {}, [title(`What ${ARI.name} sees`), el('p', {}, `${OP.request.room}, ${OP.request.start} to ${OP.request.end}, ${OP.request.minutes} minutes. The screen says “${OP.message}” and answers ${OP.outcome}.`)])]),
        el('p', {}, `Prediction: the check is green, so will the ${OP.request.minutes}-minute booking go through? It is refused. The check told the truth about 60 minutes and was never asked about ${OP.request.minutes}.`),
        el('div', { class: 'print-note' }, 'The rest of this lecture asks what a check can tell you, and which checks would have challenged this code.'));
    },
  };

  const OUTCOMES = [   // plan Section 2
    'Derive ordinary, boundary, and invalid cases from a stated rule.',
    'Choose a suitable scope for a check and explain what it leaves unexamined.',
    'Distinguish executing code from asserting the intended result.',
    'Explain a property and a small mutation-based challenge to a test suite.',
    'Recognize shared assumptions, uncontrolled inputs, and flaky observations.',
  ];
  const RULES = [['R-01', 'No overlapping confirmed bookings for the same room. [10:00,11:00) and [11:00,12:00) are adjacent, and adjacent is allowed.'], ['R-02', 'A booking lasts 30 through 120 minutes, both included.'], ['R-03', 'You can cancel your own future confirmed booking.'], ['R-04', 'A failed notification leaves a confirmed booking confirmed.']];
  const outcomes = {
    kind: 'page', id: 'outcomes', heading: 'You have the rules. How good is the evidence behind them?',
    lead: 'Week 2 linked requirements to checks. Week 7 reviewed them. Now the checks themselves are under examination.', printRole: 'Recall and outcomes',
    build(body, api) {
      const rows = OUTCOMES.map((t, i) => cue(api, el('li', {}, [el('span', { class: 'n' }, String(i + 1)), el('span', {}, t)]), `outcome-${i + 1}`));
      body.append(el('div', { class: 'w8-grid', style: 'grid-template-columns:680px minmax(0,1fr);gap:26px;height:100%' }, [
        el('ol', { class: 'outcome-list' }, rows), el('div', { class: 'w8-stack' }, [
          cue(api, card([title('The rules you will test'), ...RULES.map(([k, v], i) => cue(api, el('p', { class: 'w8-small', style: 'margin-bottom:7px' }, [el('b', { class: 'w8-mono', style: 'color:var(--accent-strong)' }, `${k}  `), v]), `rule-${i + 1}`))]), 'rules'),
          cue(api, card([title('How to read a check'), code(api, FE.assert_reading.code, 'read-a-check'), el('p', { class: 'w8-small', style: 'margin-top:8px' }, FE.assert_reading.plain)]), 'how-to-read'),
          cue(api, el('div', { class: 'w8-note' }, 'The bracket notation [start,end) means the start is included and the end is not, as in Week 1.'), 'half-open'),
          card([title('The question for this lecture'), el('p', { class: 'w8-big' }, WEEK_Q)]),
        ]),
      ]));
    },
    print(body) { body.append(el('h3', {}, 'What you will be able to explain'), list(OUTCOMES), el('h3', {}, 'The rules under test'), list(RULES.map(([k, v]) => `${k}: ${v}`)), el('h3', {}, 'How to read a check'), el('p', {}, `${FE.assert_reading.code}. ${FE.assert_reading.plain}`)); },
  };

  // ------------------------------------------------------------------ 1. A friendly example and the boundary it hides
  const WALK = FE.walk, upTo = (n) => WALK.slice(0, WALK.indexOf(n) + 1);
  const S1_CFG = {
    exclusive: { under: 'exclusive', other: 'inclusive', otherFrom: 2, seen: [[], [60], [60], upTo(31), upTo(119), upTo(119), upTo(120), upTo(121)] },
    inclusive: { under: 'inclusive', other: 'exclusive', otherFrom: 1, seen: [[], upTo(119), upTo(120), upTo(121)] },
    'no-limit': { under: 'no_limit', other: 'inclusive', otherFrom: 1, seen: [[], upTo(119), upTo(120), upTo(121)] },
  };
  const opParts = (display) => { const m = display.match(/^(30 <= minutes)(?: (<=?) (120))?$/); return [m[1] + (m[2] ? ' ' : ''), m[2] || '', m[3] ? ` ${m[3]}` : '']; };
  const friendly = {
    id: 'friendly-example', role: 'anchor', heading: 'Sixty minutes passes. Is the rule right?',
    lead: 'Send duration cards through the comparison, one at a time, and hold each answer against R-02.',
    principle: 'Test cases should distinguish plausible incorrect behavior from the intended behavior.',
    principleShort: 'Pick the case that can tell right from nearly right.',
    conditions: [
      { id: 'exclusive', baseline: true, label: 'The code as shipped: the upper comparison is <', short: 'As shipped', states: [
        { caption: 'R-02 is the rule, and this comparison is the code under test. Nothing has run yet.', prompt: { question: 'A 60-minute request passes. Is the rule implemented correctly?', options: ['Yes: the check is green', 'Not known yet: one example leaves the other durations open', 'No: 60 should be refused'] } },
        { caption: '**60 minutes is accepted.** R-02 agrees, so the check is green.' },
        { caption: 'Try a second comparison that ends in **<= 120**. It also accepts 60. This one example **cannot tell the two apart**.' },
        { caption: 'Walk the lower edge: **29 is rejected; 30 and 31 are accepted.** Every answer still agrees with R-02.' },
        { caption: '**119 is accepted.** Still no disagreement, and the upper limit is one minute away.' },
        { caption: 'The next card is 120, the last value R-02 allows.', prompt: { question: 'The code under test uses < 120. What does it answer at 120?', options: ['Accepted: R-02 includes 120', 'It depends on the room', 'Rejected: the comparison leaves 120 out'] } },
        { caption: '**120 is rejected, and R-02 says accepted.** One character, **<** instead of **<=**, refuses the longest booking the rule allows.' },
        { caption: '**121 is rejected**, and that part is right. One row disagrees, and only a case at the edge could find it.', principle: true },
      ] },
      { id: 'inclusive', label: 'Only the comparison changes: the upper comparison is <=', short: 'Inclusive fix', states: [
        { caption: 'Change one character and run the same cards.', prompt: { question: 'With <= in place, which two cases show the fix kept the upper limit?', options: ['120 and 121', '60 and 119', '29 and 30'] } },
        { caption: 'Every card below the edge answers as it did before.' },
        { caption: '**120 is accepted now.** The disagreement is gone.' },
        { caption: '**121 is still rejected.** The fix restored the endpoint and kept the limit.', principle: true },
      ] },
      { id: 'no-limit', label: 'A repair that goes too far: the upper comparison is removed', short: 'No upper limit', states: [
        { caption: 'Suppose someone repairs the bug by deleting the upper comparison.', prompt: { question: 'The upper comparison is gone. Will the 120 card catch this?', options: ['Yes: it is the card that failed before', 'No: 120 is accepted either way, so only 121 can catch it', 'Yes: any failing card will catch it'] } },
        { caption: 'Below the edge, nothing changes.' },
        { caption: '**120 is accepted.** Seen alone, this version looks repaired.' },
        { caption: '**121 is accepted, and R-02 says rejected.** 120 and 121 together separate an inclusive limit from no limit at all.', principle: true },
      ] },
    ],
    setup(stage, api) {
      const rule = ruleBar(api, 'requirement');
      const svg = window.VC.svg(1264, 226, { label: 'Duration cards move through a comparison into Accepted or Rejected', uid: api.uid });
      svg.classList.add('w8-belt'); cue(api, svg, 'belt');
      const add = (node, name) => { svg.appendChild(node); if (name) cue(api, node, name); return node; };
      add(text(8, 62, 'DURATIONS TO TRY', { class: 'w8-belt-label' }));
      const tray = (y, label, kind, name) => add(s('g', { class: `w8-tray w8-tray--${kind}` }, [s('rect', { x: 890, y, width: 374, height: 104, rx: 14 }), text(906, y + 24, label)]), name);
      tray(4, 'ACCEPTED', 'ok', 'tray-accepted'); tray(118, 'REJECTED', 'bad', 'tray-rejected');
      const pred = (y, label, name) => {
        const tspans = [s('tspan', {}), s('tspan', { class: 'w8-op' }), s('tspan', {})];
        const g = add(s('g', { class: 'w8-pred' }, [s('rect', { x: 430, y, width: 430, height: 96, rx: 14 }), text(450, y + 26, label, { class: 'w8-pred-k' }), s('text', { x: 450, y: y + 66, class: 'w8-pred-c' }, tspans)]), name);
        g.setDisplay = (display) => opParts(display).forEach((part, i) => { tspans[i].textContent = part; });
        return g;
      };
      const predA = pred(4, 'CODE UNDER TEST', 'comparison-under-test'), predB = pred(118, 'A SECOND COMPARISON', 'second-comparison');
      predB.classList.add('rv');
      const nums = WALK.map((n, i) => {
        const g = s('g', { class: 'w8-num' }, [s('rect', { width: 52, height: 44, rx: 9 }), text(26, 30, String(n))]);
        cue(api, add(g), `card-${n}`);
        return { n, g, home: [8 + i * 58, 80], pos: null };
      });
      const rows = WALK.slice().sort((a, b) => a - b).map((n) => {
        const cells = [el('th', { scope: 'row', class: 'w8-mono' }, String(n)), el('td', {}), el('td', {}), el('td', {}), el('td', {})];
        return { n, cells, tr: cue(api, el('tr', {}, cells), `row-${n}`) };
      });
      const headUnder = el('th', { class: 'w8-mono' }), headOther = el('th', { class: 'w8-mono' });
      const table = el('table', { class: 'w8-table w8-table--tight', 'aria-label': 'Each duration under R-02 and under the two comparisons' }, [el('thead', {}, el('tr', {}, [el('th', {}, 'Minutes'), el('th', {}, 'R-02 requires'), headUnder, headOther, el('th', {}, 'Code under test agrees?')])), el('tbody', {}, rows.map((r) => r.tr))]);
      const tally = cue(api, status('No cards have run.'), 'tally');
      stage.append(el('div', { class: 'w8-stack', style: 'gap:9px' }, [rule, svg, cue(api, card([table], ''), 'boundary-table'), tally]));
      return { predA, predB, nums, rows, headUnder, headOther, tally };
    },
    render(h, v, api) {
      const cfg = S1_CFG[v.conditionId], st = v.state, seen = cfg.seen[st], under = S1[cfg.under], other = S1[cfg.other];
      const prev = st > 0 ? cfg.seen[st - 1] : [], fresh = seen.filter((n) => !prev.includes(n));
      h.predA.setDisplay(FE.display[cfg.under]);
      h.predB.setDisplay(FE.display[cfg.other]);
      const showOther = st >= cfg.otherFrom;
      show(h.predB, showOther);
      const badNow = seen.some((n) => answer(under, n) !== required(n));
      h.predA.classList.toggle('is-bad', badNow); h.predA.classList.toggle('is-ok', v.conditionId === 'inclusive' && st >= 2);
      h.headUnder.textContent = FE.display[cfg.under];
      h.headOther.textContent = showOther ? FE.display[cfg.other] : '';
      let accepted = 0, rejected = 0, stagger = 0;
      const next = v.conditionId === 'exclusive' && st === 5 ? 120 : null;
      h.nums.forEach((card_) => {
        const done = seen.includes(card_.n), res = done ? answer(under, card_.n) : null;
        const pos = !done ? card_.home : res ? [902 + 60 * accepted++, 40] : [902 + 60 * rejected++, 154];
        const wrong = done && res !== required(card_.n);
        const from = card_.pos; card_.pos = pos;
        card_.g.setAttribute('transform', `translate(${pos[0]} ${pos[1]})`);
        card_.g.classList.toggle('is-accepted', done && res); card_.g.classList.toggle('is-rejected', done && !res); card_.g.classList.toggle('is-wrong', wrong); card_.g.classList.toggle('is-next', card_.n === next);
        if (api.motion && from && (from[0] !== pos[0] || from[1] !== pos[1])) {
          const t = (p) => ({ transform: `translate(${p[0]}px,${p[1]}px)` });
          const forward = fresh.includes(card_.n);
          api.animate(card_.g, forward ? [t(from), { ...t([620, 34]), offset: 0.5 }, t(pos)] : [t(from), t(pos)], { duration: forward ? 900 : 520, delay: forward ? stagger++ * 300 : 0, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
        }
      });
      h.rows.forEach((row) => {
        const done = seen.includes(row.n), res = done ? answer(under, row.n) : null, req = required(row.n), agree = res === req;
        row.cells[1].textContent = done ? verdict(req) : '';
        row.cells[2].textContent = done ? verdict(res) : '';
        row.cells[2].className = done ? (res ? 'w8-ok' : 'w8-bad') : '';
        row.cells[3].textContent = done && showOther ? verdict(answer(other, row.n)) : '';
        row.cells[4].replaceChildren(...(done ? [mark(agree), agree ? 'Yes' : 'No'] : []));
        row.tr.classList.toggle('is-bad', done && !agree);
      });
      const wrongCount = seen.filter((n) => answer(under, n) !== required(n)).length;
      h.tally.set(seen.length ? `${seen.length} of ${WALK.length} cards run. Disagreements with R-02: ${wrongCount}` : 'No cards have run.', !seen.length ? 'warn' : wrongCount ? 'bad' : 'ok');
      const hit = h.nums.filter((c) => fresh.includes(c.n) && answer(under, c.n) !== required(c.n));
      if (hit.length) { glow(api, hit[0].g, RED); glow(api, h.predA, RED); }
      if (st === 2 && v.conditionId === 'exclusive') glow(api, h.predB, GREEN);
    },
    print: [
      { title: 'The code as shipped: one row disagrees', condition: 'exclusive', state: 7, principle: true, caption: 'A 60-minute request passes under both comparisons, so that example cannot tell them apart. At 120, the shipped comparison answers Rejected while R-02 says Accepted.', note: 'The rule is 30 through 120 minutes, both included. The shipped predicate is 30 <= minutes < 120; the correct predicate is 30 <= minutes <= 120. The table records the friendly example and the six boundary cases.' },
      { title: 'Changed: the inclusive comparison', condition: 'inclusive', state: 3, note: 'Replaying the same cases, 120 is accepted and 121 is still rejected. The fix restored the endpoint and kept the limit.' },
      { title: 'Changed: a repair that goes too far', condition: 'no-limit', state: 3, note: 'With no upper comparison, 120 is accepted and so is 121. The two cases together distinguish an inclusive 120-minute limit from no upper limit, under otherwise valid conditions.' },
    ],
  };

  // ------------------------------------------------------------------ 2. Groups of inputs and the edges between them
  const P_EXCL = snip(PT, 'the comparison that excludes'), P_MAX = snip(PT, 'R-02 with a named');
  const LX = (m) => 30 + m * (1204 / PT.axis.to);
  const partition = {
    id: 'partition-the-inputs', role: 'bridge', heading: 'Do you have to test every minute?',
    lead: 'Group the inputs that share one expected answer. Then look hardest where one answer becomes another.',
    principle: 'Partitions organize expectations; boundaries expose where one expectation becomes another.',
    principleShort: 'Group the same answers, then test the edges.',
    conditions: [
      { id: 'r02', baseline: true, label: 'R-02 as written: 30 through 120 minutes', short: 'R-02 at 120', states: [
        { caption: 'Every whole minute is one possible check. Decide how you would cut that down.', prompt: { question: `Checking every whole minute from ${PT.every_minute.from} to ${PT.every_minute.to} takes ${PT.every_minute.checks} checks. What could replace most of them?`, options: ['Values chosen at random until one fails', 'The durations people pick most often', 'One value per group of shared answers, plus the edges of each group'] } },
        { caption: '**Three groups, one expected answer each.** Inside a group, the rule treats every value the same way.' },
        { caption: 'One value per group: **10, 60, 150**. All three agree with R-02, and the code that leaves out 120 passes all three.' },
        { caption: '**The decision changes at two edges:** 29 to 30, and 120 to 121. A plausible mistake lives exactly there. Add 31 and 119, just inside, and you have the six cases of the first scene.' },
        { caption: '**Shape and order are separate concerns.** A reversed interval or a value like 45.5 is refused for a different reason, so it needs its own case.' },
        { caption: 'Each group keeps its own expected answer and reason. The edges show where one answer becomes the next.', principle: true },
      ] },
      { id: 'variant-90', label: PT.variant.label, short: 'Trial at 90', states: [
        { caption: 'Only the upper limit changes, and only for this labeled trial.', prompt: { question: 'A trial lowers the upper limit to 90. Which cases keep doing the same job?', options: ['29, 30 and 31, at the lower edge', 'All six, unchanged', 'None: a new rule needs all new cases'] } },
        { caption: 'The allowed group shrinks to **30 through 90**, and the upper edge moves to **90 and 91**.' },
        { caption: 'Read the table. The lower cases stay. **91, 119 and 120 change their answer**, and **89, 90 and 91** become the new edge cases.' },
        { caption: '**The trial ends and 120 returns.** The baseline cases and their answers come back unchanged.', principle: true },
      ] },
    ],
    setup(stage, api) {
      const svg = window.VC.svg(1264, 190, { label: 'A number line of durations in minutes, divided into too short, allowed and too long', uid: api.uid });
      svg.classList.add('w8-line-svg'); cue(api, svg, 'number-line');
      const add = (node, name) => { svg.appendChild(node); if (name) cue(api, node, name); return node; };
      const band = (p, kind) => {
        const r = s('rect', { y: 46, height: 66, rx: 10 }), t = text(0, 74, p.label, { class: 'w8-band-t' }), sub = text(0, 98, p.range, { class: 'w8-band-s' });
        const g = add(s('g', { class: `w8-band w8-band--${kind}` }, [r, t, sub]), `group-${p.id}`);
        g.set = (a, b, range) => { r.setAttribute('x', LX(a)); r.setAttribute('width', LX(b) - LX(a)); t.setAttribute('x', (LX(a) + LX(b)) / 2); sub.setAttribute('x', (LX(a) + LX(b)) / 2); if (range) sub.textContent = range; };
        g.classList.add('rv');
        return g;
      };
      const [short_, valid, long_] = [band(PT.partitions[0], 'bad'), band(PT.partitions[1], 'ok'), band(PT.partitions[2], 'bad')];
      add(s('line', { x1: LX(0), y1: 126, x2: LX(180), y2: 126, class: 'w8-axis' }));
      [0, 30, 60, 90, 120, 150, 180].forEach((m) => { add(s('line', { x1: LX(m), y1: 120, x2: LX(m), y2: 132, class: 'w8-tick' })); add(text(LX(m), 152, String(m), { class: 'w8-tick-t' })); });
      add(text(LX(180), 176, 'minutes', { class: 'w8-tick-t', 'text-anchor': 'end' }));
      const reps = PT.representatives.map((m) => add(s('g', { class: 'w8-rep rv rv--scale' }, [s('circle', { cx: LX(m), cy: 126, r: 11 }), text(LX(m), 176, String(m))]), `value-${m}`));
      const pin = (name) => {
        const ln = s('line', { y1: 26, y2: 126 }), r = s('rect', { y: 2, width: 106, height: 28, rx: 7 }), t = text(0, 22, '');
        const g = add(s('g', { class: 'w8-pin rv' }, [ln, r, t]), name);
        g.set = (a, b) => { const x = LX((a + b) / 2); ln.setAttribute('x1', x); ln.setAttribute('x2', x); r.setAttribute('x', x - 53); t.setAttribute('x', x); t.textContent = `${a} | ${b}`; };
        return g;
      };
      const pinLow = pin('edge-lower'), pinHigh = pin('edge-upper');
      pinLow.set(PT.boundaries[0].below, PT.boundaries[0].above);
      // baseline panels
      const repRows = PT.representatives.map((m) => cue(api, el('tr', {}, [el('th', { scope: 'row', class: 'w8-mono' }, String(m)), el('td', {}, verdict(answer(P_MAX, m, 120))), el('td', {}, verdict(answer(P_EXCL, m)))]), `result-${m}`));
      const repCard = cue(api, rv(card([title('One value from each group'), el('table', { class: 'w8-table w8-table--tight', 'aria-label': 'One value from each group' }, [el('thead', {}, el('tr', {}, [el('th', {}, 'Minutes'), el('th', {}, 'R-02 requires'), el('th', { class: 'w8-mono' }, FE.display.exclusive)])), el('tbody', {}, repRows)])])), 'representatives');
      const edgeRows = PT.boundaries.map((b, i) => cue(api, el('p', { class: 'w8-body', style: 'margin-bottom:6px' }, [el('b', { class: 'w8-mono w8-warn' }, `${b.below} | ${b.above}`), `  ${b.change}`]), `edge-text-${i + 1}`));
      const edgeCard = cue(api, rv(card([title('Where the answer changes'), ...edgeRows, el('p', { class: 'w8-small' }, `Just inside each edge: ${PT.just_inside.join(' and ')}.`)])), 'edges');
      const SH = PT.shapes, spanCell = (shape) => el('td', { colspan: '3' }, [el('b', { class: 'w8-bad' }, shape.answer), `. ${shape.reason}`]);
      const shapeTable = el('table', { class: 'w8-table', 'aria-label': 'Duration groups against the shape and order of the request' }, [
        el('thead', {}, el('tr', {}, [el('th', {}, 'Request'), el('th', {}, `${PT.partitions[0].label} · 29`), el('th', {}, `${PT.partitions[1].label} · 60`), el('th', {}, `${PT.partitions[2].label} · 121`)])),
        el('tbody', {}, [
          cue(api, el('tr', {}, [el('th', { scope: 'row' }, [SH.ordered.label, el('div', { class: 'w8-small w8-mono' }, SH.ordered.example)]), el('td', { class: 'w8-bad' }, SH.ordered.short), el('td', { class: 'w8-ok' }, SH.ordered.valid), el('td', { class: 'w8-bad' }, SH.ordered.long)]), 'shape-ordered'),
          cue(api, el('tr', {}, [el('th', { scope: 'row' }, [SH.reversed.label, el('div', { class: 'w8-small w8-mono' }, SH.reversed.example)]), spanCell(SH.reversed)]), 'shape-reversed'),
          cue(api, el('tr', {}, [el('th', { scope: 'row' }, [SH.malformed.label, el('div', { class: 'w8-small w8-mono' }, SH.malformed.example)]), spanCell(SH.malformed)]), 'shape-malformed'),
        ]),
      ]);
      const shapeCard = cue(api, rv(card([title('Two concerns: how long, and is it a valid request at all'), shapeTable])), 'shapes');
      const basePanel = el('div', { class: 'w8-stack', 'data-cond': 'r02' }, [el('div', { class: 'w8-grid w8-two' }, [repCard, edgeCard]), shapeCard]);
      // variant panel
      const varRows = PT.variant.cases.map((c) => { const a = answer(P_MAX, c.minutes, 120), b = answer(P_MAX, c.minutes, PT.variant.max); return cue(api, el('tr', { class: a !== b ? 'is-focus' : '' }, [el('th', { scope: 'row', class: 'w8-mono' }, String(c.minutes)), el('td', {}, verdict(a)), el('td', { class: b ? 'w8-ok' : 'w8-bad' }, verdict(b)), el('td', {}, c.note)]), `trial-${c.minutes}`); });
      const varTable = el('table', { class: 'w8-table w8-table--tight', 'aria-label': 'Each case under R-02 and under the labeled trial' }, [el('thead', {}, el('tr', {}, [el('th', {}, 'Minutes'), el('th', {}, 'R-02: up to 120'), el('th', {}, `Trial: up to ${PT.variant.max}`), el('th', {}, 'What the case does now')])), el('tbody', {}, varRows)]);
      const varCard = cue(api, rv(card([el('div', { style: 'display:flex;align-items:center;gap:12px;margin-bottom:6px' }, [el('span', { class: 'w8-tag w8-variant' }, 'Temporary trial'), el('span', { class: 'w8-small' }, PT.variant.label)]), varTable])), 'trial-table');
      const restored = cue(api, rv(el('div', { class: 'w8-note w8-note--ok' }, PT.variant.restored)), 'restored');
      const varPanel = el('div', { class: 'w8-stack', 'data-cond': 'variant-90' }, [varCard, restored]);
      stage.append(el('div', { class: 'w8-stack' }, [svg, basePanel, varPanel]));
      return { short_, valid, long_, reps, pinLow, pinHigh, repCard, edgeCard, shapeCard, varCard, restored, max: 120 };
    },
    render(h, v, api) {
      const st = v.state, trial = v.conditionId === 'variant-90';
      const target = trial && st >= 1 && st < 3 ? PT.variant.max : 120;
      const apply = (m) => {
        const label = Math.round(m);
        h.short_.set(0, 30); h.valid.set(30, m, `30 through ${label}`); h.long_.set(m, 180, `above ${label}`);
        h.pinHigh.set(label, label + 1);
      };
      tween(api, h.max, target, 700, apply); h.max = target;
      [h.short_, h.valid, h.long_].forEach((b) => show(b, trial || st >= 1));
      h.reps.forEach((r) => show(r, !trial && st >= 2));
      show(h.pinLow, trial || st >= 3); show(h.pinHigh, trial ? st >= 1 : st >= 3);
      show(h.repCard, st >= 2); show(h.edgeCard, st >= 3); show(h.shapeCard, st >= 4);
      show(h.varCard, trial && st >= 2); show(h.restored, trial && st >= 3);
      if (!trial && st === 2) h.reps.forEach((r) => glow(api, r, '124,196,255'));
      if (!trial && st === 3) { glow(api, h.pinLow); glow(api, h.pinHigh); }
      if (trial && st === 1) glow(api, h.pinHigh);
    },
    print: [
      { title: 'Three groups, two edges and two more concerns', condition: 'r02', state: 5, principle: true, note: 'Too short, allowed and too long each share one expected answer, and the decision changes between 29 and 30 and between 120 and 121. One value per group (10, 60, 150) passes even the code that leaves out 120, so the edge cases are needed as well. Reversed and malformed requests are refused for different reasons.' },
      { title: 'Changed: a labeled 90-minute trial', condition: 'variant-90', state: 2, note: 'Compare each case under the two rules. The lower edge cases keep their job. 91, 119 and 120 change their answer, and 89, 90 and 91 become the new edge cases. The trial is temporary; R-02 returns to 120 inclusive.' },
    ],
  };

  // ------------------------------------------------------------------ 3. Scope: which part of the system can a check observe?
  const D = SC.double, CR = SC.curriculum_refinement, CT = SC.contract;
  const scope = {
    id: 'choose-test-scope', role: 'anchor', heading: 'The overlap function passes. Can two people still get one room?',
    lead: 'Every check observes part of the system. Match what you want to know with where you look.',
    principle: 'The appropriate test scope follows the claim and failure risk, not the prestige of a test label.',
    principleShort: 'Choose the check by what you need to know.',
    conditions: [
      { id: 'real-boundary', baseline: true, label: 'The claims and the real boundaries', short: 'Claims and scope', states: [
        { caption: 'Your green check looks at one function. The dashed window shows what it can see.', prompt: { question: 'The overlap function passes every check. Can two concurrent requests still double-book C101?', options: ['No: the arithmetic is correct', 'No: the function runs on the server', 'Yes: this check never touches storage'] } },
        { caption: `**Unit check.** ${SC.unit_check}. It is fast and exact about the arithmetic, and storage stays outside the window.` },
        { caption: '**Component check.** The handler uses Policy with a real store, one request at a time. It never sees two requests interleave.' },
        { caption: '**Concurrent check at the storage boundary.** Run two requests at once. With the check-then-write from Week 6, **both are confirmed**, while the unit check stays green.' },
        { caption: '**Journey check.** Ari books by keyboard and reads the status. The whole path is observed, slowly, for a few cases.' },
        { caption: 'Each row pairs a claim with the place it can be observed, and names what stays open. Choose from the claim and the risk of being wrong.', principle: true },
      ] },
      { id: 'test-double', label: 'The real notification boundary is replaced by a controlled double', short: 'Test double', states: [
        { caption: 'The notification call now goes to a stand-in.', prompt: { question: 'The check now calls a double, not the real provider. What do you gain?', options: ['Fast, repeatable isolation of booking', 'Evidence that the real provider works', 'Nothing: a double only hides problems'] } },
        { caption: '**The double fails on request.** Now you can test R-04 whenever you like: the booking stays Confirmed and the notification is marked Failed.' },
        { caption: 'That result holds **under the double’s assumption**: a notification failure stays separate from the booking outcome.' },
        { caption: 'The real provider never ran. A double returning the answer you wanted tells you how booking behaves **if the provider behaves as assumed**.', principle: true },
      ] },
      { id: 'contract-mismatch', label: 'The actual provider violates what the consumer expects', short: 'Contract mismatch', states: [
        { caption: 'The double-based check is still green. Look at what the real provider actually does.', prompt: { question: 'The real provider raises its failure into the booking path. Which check can see that?', options: ['The duration check', 'A rerun of the double-based check', 'A contract check against the real provider'] } },
        { caption: `Booking states its expectation in a form the provider can be checked against: a ${CR.consumer_expects}.` },
        { caption: `**${CT.result}.** The actual provider ${CR.provider_variant}. The double never did, so only this check could show it.` },
        { caption: 'Repair the boundary, and keep one journey check for what neither side can observe alone.', principle: true },
      ] },
    ],
    setup(stage, api) {
      const svg = window.VC.svg(1264, 282, { label: 'Browser, handler, policy, storage and notification, with a window showing what the current check observes', uid: api.uid });
      svg.classList.add('w8-scope'); cue(api, svg, 'system');
      const lens = s('rect', { class: 'w8-lens', rx: 16 }); svg.appendChild(lens); cue(api, lens, 'check-window');
      const N = window.VC.node;
      const mk = (o, name) => { const g = N(o); svg.appendChild(g); cue(api, g, name); return g; };
      const browser = mk({ x: 14, y: 96, w: 196, h: 92, kind: 'ext', label: `${ARI.name}’s browser`, sub: 'keyboard' }, 'browser');
      const handler = mk({ x: 296, y: 96, w: 216, h: 92, label: 'Booking handler' }, 'handler');
      const policy = mk({ x: 606, y: 14, w: 250, h: 92, label: 'Policy', sub: 'overlaps(), duration_ok()' }, 'policy');
      const storage = mk({ x: 606, y: 178, w: 250, h: 92, label: 'Storage', sub: 'confirmed bookings' }, 'storage');
      const provider = mk({ x: 964, y: 96, w: 286, h: 92, kind: 'ext', label: 'Notification provider', sub: 'the real one' }, 'provider');
      provider.setAttribute('data-cond', 'real-boundary');
      const doubleNode = mk({ x: 964, y: 14, w: 286, h: 92, label: D.label, sub: D.behavior, cls: 'w8-double' }, 'double');
      doubleNode.setAttribute('data-cond', 'test-double,contract-mismatch');
      const realNode = mk({ x: 964, y: 178, w: 286, h: 92, kind: 'ext', label: 'Notification provider', sub: 'the real one', cls: 'is-unrun' }, 'real-provider');
      realNode.setAttribute('data-cond', 'test-double,contract-mismatch');
      const link = (a, b, name, opts = {}) => { const g = arrow(svg, { fromBox: a, toBox: b, kind: opts.kind || 'accent', dashed: opts.dashed, ...opts }); cue(api, g, name); return g; };
      link(browser, handler, 'link-request');
      link(handler, policy, 'link-policy', { toSide: 'left', fromSide: 'right' });
      link(handler, storage, 'link-storage', { toSide: 'left', fromSide: 'right' });
      link(handler, provider, 'link-provider', { toSide: 'left', fromSide: 'right', via: [{ x: 930, y: 142 }] }).setAttribute('data-cond', 'real-boundary');
      link(handler, doubleNode, 'link-double', { toSide: 'left', fromSide: 'right', via: [{ x: 925, y: 142 }, { x: 925, y: 60 }] }).setAttribute('data-cond', 'test-double,contract-mismatch');
      const realLink = link(handler, realNode, 'link-real', { kind: 'warn', dashed: true, toSide: 'left', fromSide: 'right', via: [{ x: 925, y: 142 }, { x: 925, y: 224 }] });
      realLink.setAttribute('data-cond', 'test-double,contract-mismatch');
      // Two overlapping requests reach storage together in the concurrent check.
      const race = ['A [10:00,11:00)', 'B [10:30,11:30)'].map((str, i) => { const g = s('g', { class: 'w8-race' }, [s('rect', { x: -84, y: -15, width: 168, height: 30, rx: 8 }), text(0, 6, str)]); g.style.opacity = 0; svg.appendChild(g); g.dataset.i = i; return g; });
      const raceNote = text(868, 244, SC.concurrent_result, { class: 'w8-scope-note rv' }); svg.appendChild(raceNote); cue(api, raceNote, 'concurrent-result');
      const result = cue(api, status(''), 'check-result');
      const rows = SC.rows.map((r, i) => cue(api, rv(el('tr', {}, [el('th', { scope: 'row', style: 'font-weight:600' }, r.claim), el('td', {}, r.scope), el('td', { class: 'w8-warn' }, r.limitation)])), `claim-${i + 1}`));
      const matrix = cue(api, card([el('table', { class: 'w8-table w8-table--tight', 'aria-label': 'Claims, the scope that observes them, and what each leaves open' }, [el('thead', {}, el('tr', {}, [el('th', {}, 'What you want to know'), el('th', {}, 'Check scope'), el('th', {}, 'What it leaves open')])), el('tbody', {}, rows)])]), 'claim-matrix');
      matrix.setAttribute('data-cond', 'real-boundary');
      const slots = [0, 1, 2].map((i) => { const t = title(''), b = el('p', { class: 'w8-body', style: 'font-size:22px' }); return { root: cue(api, rv(card([t, b])), `compare-${i + 1}`), t, b }; });
      const compare = el('div', { class: 'w8-grid w8-three', 'data-cond': 'test-double,contract-mismatch' }, slots.map((x) => x.root));
      const journey = cue(api, rv(el('div', { class: 'w8-note', style: 'font-size:21px' }, CT.journey)), 'journey-note');
      journey.setAttribute('data-cond', 'contract-mismatch');
      stage.append(el('div', { class: 'w8-stack', style: 'gap:9px' }, [svg, result, matrix, compare, journey]));
      const around = (...boxes) => {
        const bs = boxes.map((b) => b.box), x0 = Math.min(...bs.map((b) => b.x)) - 8, y0 = Math.min(...bs.map((b) => b.y)) - 8;
        const x1 = Math.max(...bs.map((b) => b.x + b.w)) + 8, y1 = Math.max(...bs.map((b) => b.y + b.h)) + 8;
        return [x0, y0, x1 - x0, y1 - y0];
      };
      return { lens, result, rows, slots, journey, race, raceNote, nodes: { browser, handler, policy, storage, provider, doubleNode, realNode }, around, realNode };
    },
    render(h, v, api) {
      const st = v.state, n = h.nodes, id = v.conditionId;
      let frame, res;
      if (id === 'real-boundary') {
        const S = [[[n.policy], ['One check so far, and it passes', 'ok']],
          [[n.policy], ['Unit check: passes', 'ok']],
          [[n.handler, n.policy, n.storage], ['Component check: passes. A conflicting request is rejected', 'ok']],
          [[n.storage], [`Concurrent check: fails. ${SC.concurrent_result}`, 'bad']],
          [[n.browser, n.handler, n.policy, n.storage], [`Journey check: passes. ${SC.journey_result}`, 'ok']],
          [[n.handler, n.provider], ['Five claims, five places to look. The notification boundary comes next', 'ok']]][st];
        [frame, res] = [h.around(...S[0]), S[1]];
        h.rows.forEach((row, i) => { const at = [1, 2, 3, 4, 5][i]; show(row, st >= at); row.classList.toggle('is-focus', st === at); row.classList.toggle('is-bad', i === 2 && st === 3); });
        show(h.raceNote, st === 3);
      } else if (id === 'test-double') {
        frame = h.around(n.handler, n.policy, n.storage, n.doubleNode);
        res = st === 0 ? ['The real provider is out of the loop', 'warn'] : [`Booking check: passes. Booking Confirmed; notification Failed`, st >= 3 ? 'warn' : 'ok'];
        [[title, D.gain, 'What you gain'], [title, D.assumes, 'What the double assumes'], [title, D.unknown, 'What stays unknown']].forEach(([, body, head], i) => { h.slots[i].t.textContent = head; h.slots[i].b.textContent = body; show(h.slots[i].root, st >= i + 1); h.slots[i].root.classList.toggle('is-focus', st === i + 1); });
      } else {
        frame = st >= 3 ? h.around(n.browser, n.handler, n.storage, n.realNode) : h.around(st >= 1 ? n.realNode : n.doubleNode);
        res = st >= 3 ? ['Repaired: the contract check and the journey check pass', 'ok'] : st >= 2 ? [`${CT.result}: the provider ${CR.provider_variant}`, 'bad'] : ['Double-based check: passes', 'ok'];
        [[`${CT.consumer} expects`, `${CR.consumer_expects.charAt(0).toUpperCase()}${CR.consumer_expects.slice(1)}.`], [`${CT.provider} does`, `It ${CR.provider_variant}.`], ['What this tells you', CR.limit + '. Evidence about it comes from a check at that boundary.']].forEach(([head, body], i) => { h.slots[i].t.textContent = head; h.slots[i].b.textContent = body; show(h.slots[i].root, st >= i + 1); h.slots[i].root.classList.toggle('is-focus', st === i + 1); h.slots[i].root.classList.toggle('is-bad', i === 1 && st === 2); });
        show(h.journey, st >= 3);
      }
      if (id !== 'real-boundary') show(h.raceNote, false);
      const [x, y, w, ht] = frame;
      Object.assign(h.lens.style, { x: `${x}px`, y: `${y}px`, width: `${w}px`, height: `${ht}px` });
      h.result.set(res[0], res[1]);
      n.realNode.classList.toggle('is-unrun', id === 'test-double');
      if (api.motion && id === 'real-boundary' && st === 3) h.race.forEach((g, i) => api.animate(g, [{ transform: `translate(420px,${i ? 170 : 116}px)`, opacity: 0 }, { transform: `translate(440px,${i ? 170 : 116}px)`, opacity: 1, offset: 0.15 }, { transform: `translate(731px,${i ? 240 : 208}px)`, opacity: 1, offset: 0.85 }, { transform: `translate(731px,${i ? 240 : 208}px)`, opacity: 0 }], { duration: 1200, delay: i * 120, easing: 'ease-in-out' }));
      if (st === 3 && id === 'real-boundary') glow(api, h.result, RED);
      if (st === 2 && id === 'contract-mismatch') glow(api, h.slots[1].root, RED);
    },
    print: [
      { title: 'A claim-to-scope matrix with one open limit per row', condition: 'real-boundary', state: 5, principle: true, note: 'A unit check of the interval predicate says nothing about concurrent storage. The concurrent check at the storage boundary is the one that can observe double booking, and it covers the interleavings it tried. The journey is slow and covers few cases.' },
      { title: 'Changed: a controlled double replaces the provider', condition: 'test-double', state: 3, note: 'The double makes the failure repeatable and isolates the booking behavior. It encodes an assumption about the provider, and the real provider did not run. A mock returning the desired value leaves that question open.' },
      { title: 'Changed: the actual provider violates the expectation', condition: 'contract-mismatch', state: 3, note: 'Booking expects a notification failure to remain separate from the booking outcome; the provider raises into the booking path. A contract or integration check at the real boundary shows the mismatch. One journey check stays for the behavior neither side can establish alone.' },
    ],
  };

  // A continuation of scene 3: the same keyboard journey, explored instead of scripted.
  const EX = SC.exploratory_comparison, EXS = SC.exploration_steps;
  const explore = {
    kind: 'page', id: 'explore-the-journey', heading: 'What do you check when you do not know what to check?',
    lead: 'Start from one question about recovery. Let each observation choose the next check.', printRole: 'Exploring the journey',
    build(body, api) {
      const statusField = el('span', { class: 'v' }, 'Draft');
      const fieldNode = cue(api, el('div', { class: 'field' }, [el('span', { class: 'k' }, 'Screen says'), statusField]), 'screen-status');
      const storedField = el('span', { class: 'v' }, 'Not read yet');
      const storedNode = cue(api, el('div', { class: 'field' }, [el('span', { class: 'k' }, 'Stored booking'), storedField]), 'stored-status');
      const screen = cue(api, window.VC.browser({ who: `${ARI.name} (${ARI.id})`, url: 'campus-rooms.example/book', cls: 'w8-screen', body: [
        el('div', { class: 'field' }, [el('span', { class: 'k' }, 'Room'), el('span', { class: 'v' }, `${C.booking.room_id}, ${C.booking.start} to ${C.booking.end}`)]), fieldNode, storedNode] }), 'journey-screen');
      const buttons = EXS.map((step, i) => cue(api, el('button', { type: 'button', class: 'preset-btn w8-action' }, step.button), `step-${i + 1}`));
      const reset = cue(api, el('button', { type: 'button', class: 'preset-btn w8-action' }, 'Start again'), 'start-again');
      const log = EXS.map((step, i) => cue(api, rv(el('div', { class: 'w8-log-row' }, [el('p', {}, step.observed), el('p', { class: 'q' }, step.next)])), `observation-${i + 1}`));
      const finding = cue(api, rv(el('div', { class: 'w8-note w8-note--warn' }, `Found: ${EX.discovery}.`)), 'discovery');
      const regression = cue(api, rv(card([title('The discovery, kept as a repeatable check'), code(api, SC.regression_code, 'regression')])), 'regression-check');
      const compares = [['Scripted check', 'Keeps an expectation you already know.'], ['Exploration', 'Guided investigation with recorded observations. It finds the next expectation.'], ['Usability study', `A separate question: ${EX.usability_question.charAt(0).toLowerCase()}${EX.usability_question.slice(1)}`]].map(([k, val], i) => cue(api, rv(card([title(k), el('p', { class: 'w8-small' }, val)])), `kind-${i + 1}`));
      body.append(el('div', { class: 'w8-stack', style: 'gap:10px' }, [
        el('div', { class: 'w8-grid', style: 'grid-template-columns:600px minmax(0,1fr);gap:20px' }, [
          el('div', { class: 'w8-stack', style: 'gap:10px;height:auto' }, [screen, regression]),
          el('div', { class: 'w8-stack', style: 'gap:8px;height:auto' }, [card([title('The question that guides you'), el('p', { class: 'w8-big' }, EX.question)]), el('div', { class: 'w8-log' }, log)]),
        ]),
        el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, [...buttons, reset]), finding,
        el('div', { class: 'w8-grid w8-three', style: 'max-width:1600px' }, compares),
      ]));
      const render = (st) => {
        body.dataset.state = String(st);
        statusField.textContent = st >= 3 ? EX.interface_after : st >= 1 ? EX.interface_before : 'Draft';
        storedField.textContent = st >= 2 ? upperFirst(EX.stored_booking) : 'Not read yet';
        fieldNode.classList.toggle('is-bad', st === 2); fieldNode.classList.toggle('is-focus', st === 1);
        log.forEach((row, i) => show(row, st > i));
        buttons.forEach((b, i) => { b.disabled = st !== i; });
        show(finding, st >= 2); show(regression, st >= 4); compares.forEach((c) => show(c, st >= 4));
        if (st === 2) glow(api, fieldNode, RED);
        if (st === 3) glow(api, fieldNode, GREEN);
        if (st === 4) glow(api, regression, GREEN);
      };
      buttons.forEach((b, i) => b.addEventListener('click', () => render(i + 1))); reset.addEventListener('click', () => render(0));
      body.reset = () => render(0); body.reset();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.append(el('p', {}, `The question: ${EX.question} This is a simulated example, not a report of a study.`),
        el('h3', {}, 'Each observation chooses the next check'), list(EXS.map((step) => `${step.button}: ${step.observed} ${step.next}`)),
        el('div', { class: 'print-note' }, `Found: ${EX.discovery}. The screen said ${EX.interface_before} while the stored booking was ${EX.stored_booking}; after the correction it says ${EX.interface_after}.`),
        el('h3', {}, 'The resulting regression example'), code(printApi, SC.regression_code, 'regression', true),
        el('p', { style: 'margin-top:10px' }, `Scripted checks keep known expectations. Exploration finds new ones. A usability study asks a separate question: ${EX.usability_question}`));
    },
  };
  const upperFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  // ------------------------------------------------------------------ 4. Where the expected answer comes from
  const O_SELF = snip(OR, 'expected value computed'), O_IND = snip(OR, 'expected values derived');
  const oracle = {
    id: 'oracle-independence', role: 'bridge', heading: 'Who checked the expected answer?',
    lead: 'The check agrees with the code. Follow where each expected result comes from.',
    principle: 'A test oracle—the basis for the expected result—must not simply repeat the defect being examined.',
    principleShort: 'Get the expected answer from the requirement, not from the code.',
    conditions: [
      { id: 'shared-helper', baseline: true, label: 'The code and the expected value read one helper', short: 'Shared helper', states: [
        { caption: 'Read the code and the check, line by line.', prompt: { question: 'The check passes. How much does this agreement tell you?', options: ['A lot: two calculations matched', 'Everything: the check passed', 'Little: both answers share one helper'] } },
        { caption: `Follow the **119**. It comes from one misreading, ${OR.misreading}, and that one number flows into the code **and** into the expected value.` },
        { caption: '**The check passes.** The code refuses 120, and the expected value says it should. They agree because they share a source.' },
        { caption: 'Now derive the expected answer **from R-02 itself**: both ends are included, so 120 must be accepted.' },
        { caption: `Check it by hand. In **${OR.hand_example.interval}**, ${OR.hand_example.working}, so ${OR.hand_example.minutes} minutes. R-02 accepts that. **The independent check fails and exposes the defect.**` },
        { caption: 'The basis for an expected result is called a **test oracle**. For any check, ask where its expected value came from.', principle: true },
      ] },
      { id: 'helper-changes', label: 'The helper changes while the requirement stays fixed', short: 'Helper changes', states: [
        { caption: 'A later cleanup changes the helper. R-02 stays exactly as it was.', prompt: { question: 'The helper now returns 90, and R-02 still says 120. What do the two checks do?', options: ['The self-confirming check passes; the independent check fails', 'Both checks fail', 'Both checks pass'] } },
        { caption: 'Helper at **90**: the self-confirming check **passes**, and the independent check **fails**.' },
        { caption: 'Helper at **150**: the same. The self-confirming check passes again, whatever the number is.' },
        { caption: 'Helper at **120**: now both pass. Only the independent check could tell this value from the others.', principle: true },
      ] },
      { id: 'same-assistant', label: 'One assistant drafted the helper and its tests', short: 'Same assistant', states: [
        { caption: 'One assistant drafted the helper and the tests.', prompt: { question: 'All five generated tests pass. What have they shown?', options: ['R-02 is satisfied, five out of five', 'The code matches one reading of R-02', 'The assistant checked itself, so review can stop'] } },
        { caption: 'Read the row for 120: **the test expects False**. It carries the same misreading as the code, so the two agree.' },
        { caption: `An independent check, **derived from ${AI13.independent_check.derived_from}**, expects 120 to be accepted. Against this candidate it fails. Week 13 returns to this loop.`, principle: true },
      ] },
    ],
    setup(stage, api) {
      const svg = window.VC.svg(560, 342, { label: 'Requirement, helper, implementation and expected result, with arrows showing where each value comes from', uid: api.uid });
      svg.classList.add('w8-tri'); cue(api, svg, 'triangle');
      const box = (x, y, w, h, t, sub, name) => {
        const st = text(w / 2, h / 2 + 22, sub, { class: 'n-sub', 'text-anchor': 'middle', style: 'font-size:16px' });
        const g = s('g', { class: 'n-box fx', transform: `translate(${x} ${y})` }, [s('rect', { width: w, height: h, rx: 12 }), text(w / 2, h / 2 - 6, t, { class: 'n-label', 'text-anchor': 'middle', style: 'font-size:20px' }), st]);
        g.box = { x, y, w, h }; g.setSub = (str) => { st.textContent = str; };
        svg.appendChild(g); cue(api, g, name); return g;
      };
      const req = box(150, 4, 260, 74, 'Requirement', '30 through 120, included', 'requirement');
      const helper = box(170, 128, 220, 74, 'Shared helper', 'longest_allowed() = 119', 'helper');
      const impl = box(6, 258, 224, 80, 'Implementation', 'duration_ok(120)', 'implementation');
      const exp = box(330, 258, 224, 80, 'Expected result', '', 'expected-result');
      const L = (a, b, name, o) => { const g = arrow(svg, { fromBox: a, toBox: b, ...o }); cue(api, g, name); return g; };
      const misread = L(req, helper, 'arrow-misread', { kind: 'warn', dashed: true, fromSide: 'bottom', toSide: 'top', label: 'misread', labelDx: 44, labelDy: 6 });
      misread.setAttribute('data-cond', 'shared-helper,same-assistant');
      const toImpl = L(helper, impl, 'arrow-to-implementation', { kind: 'warn', fromSide: 'left', toSide: 'top' });
      const toExp = L(helper, exp, 'arrow-to-expected', { kind: 'warn', fromSide: 'right', toSide: 'top' });
      const indep = arrow(svg, { from: { x: 410, y: 41 }, to: { x: 516, y: 256 }, kind: 'ok', bend: -40, cls: 'rv rv--draw', label: 'from R-02', labelDx: 8, labelDy: -8 }); cue(api, indep, 'arrow-independent');
      const compare = arrow(svg, { from: { x: 232, y: 298 }, to: { x: 328, y: 298 }, kind: 'accent', both: true, cls: 'rv rv--draw' }); cue(api, compare, 'arrow-compare');
      const cmpText = text(280, 334, '', { 'text-anchor': 'middle', style: 'font-size:16px;font-weight:800' }); svg.appendChild(cmpText);
      const token = s('g', { class: 'w8-token', style: 'opacity:0' }, [s('rect', { x: -30, y: -17, width: 60, height: 34, rx: 8 }), text(0, 7, '119')]); svg.appendChild(token);
      const token2 = token.cloneNode(true); svg.appendChild(token2);
      const codeHelper = code(api, OR.helper_code, 'helper-code');
      const selfCode = code(api, OR.self_check_code, 'self-check');
      const indCode = code(api, OR.independent_code, 'independent-check');
      const selfStatus = status(''), indStatus = status('');
      const helperCard = cue(api, card([title('The helper and the code'), codeHelper]), 'helper-card');
      const selfCard = cue(api, card([title('Self-confirming check'), selfCode, el('div', { style: 'height:7px' }), selfStatus]), 'self-card');
      const indCard = cue(api, rv(card([title('Independent check, derived from R-02'), indCode, el('div', { style: 'height:7px' }), indStatus])), 'independent-card');
      const hand = cue(api, rv(card([title('Checked by hand'), el('p', { class: 'w8-body' }, [el('b', { class: 'w8-mono' }, OR.hand_example.interval), `: ${OR.hand_example.working}.`]), el('p', { class: 'w8-body', style: 'margin-top:6px' }, `${OR.hand_example.minutes} minutes, so R-02 says `), el('p', { class: 'w8-big w8-ok', style: 'margin-top:2px' }, OR.hand_example.expected)])), 'hand-check');
      hand.setAttribute('data-cond', 'shared-helper');
      const vals = OR.helper_values.map((val) => { const a = answer(O_SELF, val), b = answer(O_IND, val); return cue(api, rv(el('tr', {}, [el('th', { scope: 'row', class: 'w8-mono' }, String(val)), el('td', {}, [mark(a), a ? 'Passes' : 'Fails']), el('td', {}, [mark(b), b ? 'Passes' : 'Fails'])])), `helper-${val}`); });
      const valTable = cue(api, card([title('Same requirement, different helper'), el('table', { class: 'w8-table', 'aria-label': 'Both checks for each helper value' }, [el('thead', {}, el('tr', {}, [el('th', {}, 'Helper returns'), el('th', {}, 'Self-confirming'), el('th', {}, 'Independent')])), el('tbody', {}, vals)])]), 'helper-table');
      valTable.setAttribute('data-cond', 'helper-changes');
      const gen = AI13.generated_tests.map((t, i) => cue(api, el('tr', {}, [el('th', { scope: 'row', class: 'w8-mono' }, String(t.minutes)), el('td', { class: 'w8-mono' }, t.expects ? 'True' : 'False'), el('td', {}, [mark(true), 'Passes'])]), `generated-${i + 1}`));
      const genTable = cue(api, card([title('The tests the assistant generated'), el('table', { class: 'w8-table w8-table--tight', 'aria-label': 'Generated tests and their results' }, [el('thead', {}, el('tr', {}, [el('th', {}, 'Minutes'), el('th', {}, 'Test expects'), el('th', {}, 'Result')])), el('tbody', {}, gen)])]), 'generated-tests');
      genTable.setAttribute('data-cond', 'same-assistant');
      stage.append(el('div', { class: 'w8-grid', style: 'grid-template-columns:560px minmax(0,1fr);gap:16px;height:100%' }, [
        el('div', { class: 'w8-stack', style: 'gap:9px' }, [svg, hand, valTable, genTable]),
        el('div', { class: 'w8-stack', style: 'gap:9px' }, [helperCard, selfCard, indCard]),
      ]));
      return { req, helper, impl, exp, misread, toImpl, toExp, indep, compare, cmpText, token, token2, codeHelper, selfStatus, indStatus, selfCode, indCard, hand, vals, gen };
    },
    render(h, v, api) {
      const st = v.state, id = v.conditionId;
      const helperVal = id === 'helper-changes' ? OR.helper_values[Math.min(st, 3)] : 119;
      h.codeHelper.setCode(OR.helper_code.replace('return 119', `return ${helperVal}`));
      h.codeHelper.focusLines(id === 'helper-changes' || st === 1 ? [2] : []);
      h.helper.setSub(id === 'same-assistant' ? 'one reading of R-02' : `longest_allowed() = ${helperVal}`);
      h.helper.querySelector('.n-label').textContent = id === 'same-assistant' ? 'One assistant' : 'Shared helper';
      h.exp.setSub(id === 'same-assistant' ? (st >= 2 ? '120 accepted, from R-02' : '120 refused') : (id === 'shared-helper' && st >= 3) ? '120 accepted, from R-02' : id === 'helper-changes' && st >= 1 ? 'computed from helper' : 'computed from helper');
      const indVisible = id === 'shared-helper' ? st >= 3 : id === 'helper-changes' ? st >= 1 : st >= 2;
      show(h.indep, indVisible); show(h.compare, id === 'shared-helper' ? st >= 2 : st >= 1);
      const disagree = id === 'shared-helper' ? st >= 4 : id === 'same-assistant' ? st >= 2 : false;
      h.cmpText.textContent = (id === 'shared-helper' ? st >= 2 : st >= 1) ? (disagree ? 'disagree' : 'agree') : '';
      h.cmpText.style.fill = disagree ? 'var(--bad)' : 'var(--ok)';
      h.exp.classList.toggle('is-ok', indVisible && id !== 'helper-changes'); h.impl.classList.toggle('is-bad', disagree);
      focus(h.helper, st === 1 && id === 'shared-helper');
      h.selfStatus.set(id === 'helper-changes' ? `With ${helperVal}: passes` : st >= 1 || id === 'same-assistant' ? 'Passes: code and expected value agree' : 'Passes', 'ok');
      show(h.indCard, indVisible);
      const ind = answer(O_IND, helperVal);
      h.indStatus.set(ind ? `With ${helperVal}: passes` : helperVal < 120 ? `With ${helperVal}: fails. duration_ok(120) returned False` : `With ${helperVal}: fails. duration_ok(121) returned True`, ind ? 'ok' : 'bad');
      show(h.hand, id === 'shared-helper' && st >= 4);
      h.vals.forEach((row, i) => { const at = [1, 1, 2, 3][i]; show(row, st >= at); row.classList.toggle('is-focus', i === st && st > 0); });
      h.gen.forEach((row, i) => row.classList.toggle('is-focus', st >= 1 && !!AI13.generated_tests[i].note));
      // The copied assumption travels through two cards.
      if (api.motion && id === 'shared-helper' && st === 1) {
        const at = (x, y, o = 1, offset) => ({ transform: `translate(${x}px,${y}px)`, opacity: o, ...(offset != null ? { offset } : {}) });
        api.animate(h.token, [at(280, 165, 0), at(280, 165, 1, 0.12), at(118, 298, 1, 0.85), at(118, 298, 0)], { duration: 1100, easing: 'cubic-bezier(.2,.7,.2,1)' });
        api.animate(h.token2, [at(280, 165, 0), at(280, 165, 1, 0.12), at(442, 298, 1, 0.85), at(442, 298, 0)], { duration: 1100, delay: 120, easing: 'cubic-bezier(.2,.7,.2,1)' });
        glow(api, h.helper);
      }
      if (st === (id === 'shared-helper' ? 4 : 2) && id !== 'helper-changes') glow(api, h.impl, RED);
    },
    print: [
      { title: 'Where each expected result comes from', condition: 'shared-helper', state: 4, principle: true, note: 'The self-confirming check computes its expected value with the same helper the code uses, so it passes while the code refuses 120. The independent expectation comes from R-02: [10:00,12:00) is 60 minutes and 60 more, 120 in all, and R-02 accepts it. That check fails and exposes the defect.' },
      { title: 'Changed: the helper moves, and the requirement stays', condition: 'helper-changes', state: 3, note: 'For helper values 119, 90 and 150 the self-confirming check passes and the independent check fails. At 120 both pass. A check that passes for every value of the helper tells you little about that value.' },
      { title: 'Changed: one assistant drafted the code and the tests', condition: 'same-assistant', state: 2, note: 'All five generated tests pass, and the 120 test expects False: it shares the misreading. A check derived from R-02 as written fails against this candidate. Week 13 returns to this loop.' },
    ],
  };

  // ------------------------------------------------------------------ 5. Properties on a calendar
  const CAL = { from: 540, to: 900 }, CX = (m) => 104 + (m - CAL.from) * (1140 / (CAL.to - CAL.from));
  const P_SEQ = PR.fixed_sequence, P1 = PR.properties[0], P2 = PR.properties[1];
  const truly = (a, b) => a[0] < b[1] && b[0] < a[1], touching = (a, b) => a[0] <= b[1] && b[0] <= a[1];
  // Runs a candidate list through the touching comparison; the count is checked against the fixture.
  function runTouching(list_) {
    const confirmed = [], out = [];
    list_.forEach((str) => {
      const iv = interval(str), refused = confirmed.some((b) => touching(iv, b));
      if (!refused) confirmed.push(iv);
      out.push({ str, room: 'C101', refused, wrong: refused && !confirmed.some((b) => truly(iv, b)) });
    });
    return out;
  }
  PR.shrink_steps.forEach((step) => { if (runTouching(step.intervals).filter((b) => b.wrong).length !== step.wrongly_rejected) throw new Error('w08/properties-and-counterexamples: a reduction step disagrees with its fixture'); });
  const FZ = PR.fuzz, FZ_BAD = snip(PR, 'empty text'), FZ_OK = snip(PR, 'the corrected');
  const quote = (raw) => `"${raw}"`;
  const properties = {
    id: 'properties-and-counterexamples', role: 'anchor', heading: 'What must stay true after any accepted booking?',
    lead: 'Write the rule as a statement about every sequence of bookings, then feed it candidates.',
    principle: 'Properties expose classes of behavior, but the properties themselves must express the intended rule.',
    principleShort: 'State what must always hold, and check the statement too.',
    conditions: [
      { id: 'strict', baseline: true, label: 'Strict overlap: touching intervals are allowed', short: 'Strict overlap', states: [
        { caption: 'An example checks one case. A property speaks for all of them.', prompt: { question: 'What should remain true after any accepted booking?', options: ['No two confirmed bookings in a room overlap', 'Every request ends up accepted', 'Exactly one booking exists per room'] } },
        { caption: `**${P_SEQ[0].interval}** in ${P_SEQ[0].room} is accepted. **P1** holds: one booking cannot overlap anything.` },
        { caption: `**${P_SEQ[1].interval}** overlaps it and is rejected. **P1** still holds, because the refusal is what protects it.` },
        { caption: `**${P_SEQ[2].interval}** touches the first booking at 11:00. Half-open intervals allow that, so it is accepted, and **P2** holds.` },
        { caption: `**${P_SEQ[3].interval}** in ${P_SEQ[3].room} is accepted: the same time in another room is no conflict.` },
        { caption: 'A property-based tool generates many sequences and tests these same statements. These four are fixed, so you can replay them.', principle: true },
      ] },
      { id: 'touching', label: 'The comparison also rejects adjacent bookings', short: 'Rejects adjacency', states: [
        { caption: `The comparison changes to ${PR.display.touching}.`, prompt: { question: 'It now refuses [11:00,12:00) after [10:00,11:00). Which property notices?', options: ['P1: no overlapping confirmed bookings', 'P2: a valid adjacent booking is accepted', 'Neither: both still hold'] } },
        { caption: '**[10:00,11:00)** is accepted, as before. Replay the next candidate.' },
        { caption: `**[11:00,12:00)** is refused. **${PR.counterexample.wrong_predicate_says === 'overlap' ? 'The comparison calls it an overlap' : ''}; the rule calls it adjacent.** P1 still holds, and **P2 fails**.` },
        { caption: '**A service that refuses everything satisfies P1.** You need P2 as well: the properties have to say the whole rule.', principle: true },
      ] },
      { id: 'reduce', label: 'A generated failure, reduced to its smallest form', short: 'Smallest failure', states: [
        { caption: 'A tool generated these six bookings with the same comparison, and P2 failed.', prompt: { question: 'A generated run of six bookings fails P2. What would help you most?', options: ['The smallest sequence that still fails', 'Rerunning it until it passes', 'A longer sequence with more bookings'] } },
        { caption: `Remove the bookings that touch nothing. **${PR.shrink_steps[1].intervals.length} bookings, and P2 still fails.**` },
        { caption: `Remove another. **${PR.shrink_steps[2].intervals.length} bookings, and P2 still fails.**` },
        { caption: '**Simpler times still fail.** This is the smallest counterexample: [10:00,11:00) then [11:00,12:00). Tools call this reduction shrinking.', principle: true },
      ] },
      { id: 'odd-input', label: 'Malformed text instead of a valid duration', short: 'Odd text', states: [
        { caption: 'A fuzzer feeds the parser generated odd text.', prompt: { question: 'What does a fuzzer need in order to report a failure?', options: ['A fixed expected output for every input', 'A property any input must meet: a clear answer, no crash', 'The source code of the handler'] } },
        { caption: `Three generated inputs. A number and a word get clear answers. **Three spaces crash the parser.**` },
        { caption: 'Reduce the failing input: three spaces, one space, then **empty text**. All three still crash, and empty text is the smallest.' },
        { caption: `**After the correction, nothing crashes.** Blank text gets a clear answer: “${FZ.fixed}”`, principle: true },
      ] },
    ],
    setup(stage, api) {
      const pill = () => el('span', { class: 'w8-pill' }, '');
      const prop = (p, name) => { const t = el('span', { class: 't' }, p.statement.charAt(0).toUpperCase() + p.statement.slice(1)), k = pill(), id = el('b', {}, p.id); const root = cue(api, el('div', { class: 'w8-prop' }, [id, t, k]), name); root.set = (label, kind) => { k.textContent = label; k.className = `w8-pill${kind ? ` is-${kind}` : ''}`; root.classList.toggle('is-ok', kind === 'ok'); root.classList.toggle('is-bad', kind === 'bad'); }; root.setText = (a, b) => { id.textContent = a; t.textContent = b; }; return root; };
      const prop1 = prop(P1, 'property-1'), prop2 = prop(P2, 'property-2');
      const predCode = el('code', { class: 'w8-mono', style: 'font-size:19px;color:var(--accent-strong)' });
      const pred = cue(api, el('div', { class: 'w8-note', style: 'display:flex;gap:12px;align-items:center' }, [el('span', { style: 'font-weight:700' }, 'overlaps(a, b):'), predCode]), 'predicate');
      const svg = window.VC.svg(1264, 212, { label: 'A calendar of two rooms from 09:00 to 15:00, showing confirmed and refused bookings', uid: api.uid });
      svg.classList.add('w8-cal'); cue(api, svg, 'calendar');
      const LANES = { C101: 6, C202: 100 };
      Object.entries(LANES).forEach(([room, y]) => { svg.appendChild(s('rect', { x: CX(CAL.from), y, width: CX(CAL.to) - CX(CAL.from), height: 86, rx: 8, class: 'w8-cal-lane' })); svg.appendChild(text(14, y + 50, room, { class: 'w8-cal-room' })); });
      for (let m = CAL.from; m <= CAL.to; m += 60) { svg.appendChild(s('line', { x1: CX(m), y1: 6, x2: CX(m), y2: 190, class: 'w8-cal-hour' })); svg.appendChild(text(CX(m), 208, clock(m), { class: 'w8-cal-t' })); }
      const bars = [0, 1, 2, 3, 4, 5].map((i) => { const r = s('rect', { height: 36, rx: 6 }), t = text(0, 0, ''); const g = s('g', { class: 'w8-bar' }, [r, t]); svg.appendChild(g); cue(api, g, `booking-${i + 1}`); return { g, r, t }; });
      const calendarWrap = el('div', { 'data-cond': 'strict,touching,reduce' }, svg);
      // the replayable sequence
      const rowsSeq = [0, 1, 2, 3, 4, 5].map((i) => { const cells = [el('td', { class: 'w8-mono' }), el('th', { scope: 'row', class: 'w8-mono' }), el('td', {}), el('td', {})]; return { cells, tr: cue(api, rv(el('tr', {}, cells)), `candidate-${i + 1}`) }; });
      const seqHead = el('tr', {}, [el('th', {}, 'Room'), el('th', {}, 'Candidate'), el('th', {}, 'Result'), el('th', {}, 'Why')]);
      const tableSeq = cue(api, card([el('table', { class: 'w8-table', 'aria-label': 'Candidates and results' }, [el('thead', {}, seqHead), el('tbody', {}, rowsSeq.map((r) => r.tr))])]), 'candidates');
      tableSeq.setAttribute('data-cond', 'strict,touching');
      // reduction steps
      const stepRows = PR.shrink_steps.map((step, i) => cue(api, rv(el('tr', {}, [el('th', { scope: 'row' }, step.label), el('td', { class: 'w8-mono' }, String(step.intervals.length)), el('td', { class: 'w8-mono w8-bad' }, String(step.wrongly_rejected))])), `reduction-${i + 1}`));
      const tableStep = cue(api, card([el('table', { class: 'w8-table', 'aria-label': 'Each reduction step' }, [el('thead', {}, el('tr', {}, [el('th', {}, 'Reduction'), el('th', {}, 'Bookings'), el('th', {}, 'Valid bookings refused')])), el('tbody', {}, stepRows)])]), 'reduction-table');
      tableStep.setAttribute('data-cond', 'reduce');
      // fuzzing: inputs instead of a calendar
      const rows = [...FZ.generated, ...FZ.reduced.slice(1)].map((raw, i) => { const outcome = el('span', { class: 'w8-pill' }); const root = cue(api, rv(el('div', { class: 'w8-input' }, [el('code', { class: 'w8-mono' }, quote(raw)), el('span', { style: 'flex:1' }, { 90: 'a number, written as text', ninety: 'a word', '   ': 'three spaces', ' ': 'one space', '': 'empty text' }[raw]), outcome])), `input-${i + 1}`); root.outcome = outcome; root.raw = raw; return root; });
      const fixedNote = cue(api, rv(el('div', { class: 'w8-note w8-note--ok' }, `Fuzzing keeps feeding generated input. The property stays simple: ${FZ.property.charAt(0).toLowerCase()}${FZ.property.slice(1)}`)), 'fuzz-note');
      const fuzzPanel = el('div', { class: 'w8-stack', 'data-cond': 'odd-input', style: 'gap:9px;height:auto' }, [...rows, fixedNote]);
      stage.append(el('div', { class: 'w8-stack', style: 'gap:9px' }, [el('div', { class: 'w8-grid w8-two' }, [prop1, prop2]), pred, calendarWrap, tableSeq, tableStep, fuzzPanel]));
      return { prop1, prop2, pred, predCode, bars, LANES, rowsSeq, stepRows, rows, fixedNote };
    },
    render(h, v, api) {
      const st = v.state, id = v.conditionId;
      h.pred.style.display = id === 'odd-input' ? 'none' : 'flex';
      h.predCode.textContent = id === 'strict' ? PR.display.strict : PR.display.touching;
      let shown = [];
      if (id === 'strict') {
        shown = P_SEQ.slice(0, st).map((c, i) => ({ str: c.interval, room: c.room, refused: c.expected === 'rejected', wrong: false, i }));
        const why = ['The room is free', 'Overlaps [10:00,11:00)', 'Adjacent: its start meets the earlier end', 'A different room'];
        h.rowsSeq.forEach((r, i) => { const c = P_SEQ[i]; show(r.tr, !!c && st > i); r.tr.classList.toggle('is-focus', st === i + 1); r.tr.style.display = c ? '' : 'none'; if (c) { r.cells[0].textContent = c.room; r.cells[1].textContent = c.interval; r.cells[2].textContent = upperFirst(c.expected); r.cells[2].className = c.expected === 'accepted' ? 'w8-ok' : 'w8-bad'; r.cells[3].textContent = why[i]; } });
        h.prop1.set(st >= 1 ? 'Holds' : 'Not run', st >= 1 ? 'ok' : ''); h.prop2.set(st >= 3 ? 'Holds' : 'Not exercised yet', st >= 3 ? 'ok' : '');
      } else if (id === 'touching') {
        const pair = [PR.counterexample.existing, PR.counterexample.candidate];
        shown = runTouching(pair.slice(0, st >= 2 ? 2 : st));
        const why = ['The room is free', `${upperFirst(PR.counterexample.wrong_predicate_says)}, says the comparison; ${PR.counterexample.rule_says}, says the rule`];
        h.rowsSeq.forEach((r, i) => { const c = shown[i]; r.tr.style.display = i < 2 ? '' : 'none'; show(r.tr, !!c); r.tr.classList.toggle('is-bad', !!c && c.wrong); r.tr.classList.remove('is-focus'); if (i < 2) { r.cells[0].textContent = 'C101'; r.cells[1].textContent = pair[i]; r.cells[2].textContent = c ? (c.refused ? 'Rejected' : 'Accepted') : ''; r.cells[2].className = c && c.refused ? 'w8-bad' : 'w8-ok'; r.cells[3].textContent = c ? why[i] : ''; } });
        h.prop1.set(st >= 1 ? 'Holds' : 'Not run', st >= 1 ? 'ok' : ''); h.prop2.set(st >= 2 ? 'Fails' : 'Not exercised yet', st >= 2 ? 'bad' : '');
      } else if (id === 'reduce') {
        shown = runTouching(PR.shrink_steps[st].intervals);
        h.stepRows.forEach((row, i) => { show(row, st >= i); row.classList.toggle('is-focus', st === i); });
        h.prop1.set('Holds', 'ok'); h.prop2.set('Fails', 'bad');
      } else {
        h.prop1.setText('P', upperFirst(FZ.property)); h.prop1.set(st >= 3 ? 'Holds' : st >= 1 ? 'Fails' : 'Not run', st >= 3 ? 'ok' : st >= 1 ? 'bad' : '');
        const seen = st === 0 ? 0 : st === 1 ? FZ.generated.length : h.rows.length;
        const fix = st >= 3;
        h.rows.forEach((row, i) => { const res = answer(fix ? FZ_OK : FZ_BAD, row.raw); show(row, i < seen); row.outcome.textContent = res === 'crash' ? 'Crash' : 'Clear answer'; row.outcome.className = `w8-pill ${res === 'crash' ? 'is-bad' : 'is-ok'}`; row.classList.toggle('is-bad', res === 'crash' && i < seen); row.classList.toggle('is-ok', res !== 'crash' && fix); });
        show(h.fixedNote, st >= 3);
      }
      if (id !== 'odd-input') h.prop1.setText(P1.id, upperFirst(P1.statement));
      h.prop2.style.display = id === 'odd-input' ? 'none' : ''; h.prop1.style.gridColumn = id === 'odd-input' ? '1 / -1' : '';
      h.bars.forEach((bar, i) => {
        const b = shown[i];
        bar.g.style.display = b ? '' : 'none';
        if (!b) return;
        const [a, z] = interval(b.str), laneY = h.LANES[b.room], y = laneY + (b.refused ? 46 : 5);
        bar.r.setAttribute('x', CX(a)); bar.r.setAttribute('width', CX(z) - CX(a)); bar.r.setAttribute('y', y);
        bar.t.setAttribute('x', (CX(a) + CX(z)) / 2); bar.t.setAttribute('y', y + 24); bar.t.textContent = `${clock(a)}–${clock(z)}`;
        bar.g.classList.toggle('is-refused', b.refused); bar.g.classList.toggle('is-wrong', b.wrong);
        const isNew = id === 'strict' ? i === st - 1 : id === 'touching' ? i === st - 1 : false;
        if (isNew && api.motion) api.animate(bar.g, b.refused ? [{ transform: 'translateX(-14px)', opacity: 0 }, { transform: 'translateX(9px)', opacity: 1, offset: 0.4 }, { transform: 'translateX(-5px)', offset: 0.7 }, { transform: 'translateX(0)', opacity: 1 }] : [{ transform: 'translateY(-22px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.2,.7,.2,1)' });
      });
      if (id === 'touching' && st === 2) glow(api, h.prop2, RED);
      if (id === 'strict' && st === 3) glow(api, h.prop2, GREEN);
      if (id === 'odd-input' && st === 3) glow(api, h.prop1, GREEN);
    },
    print: [
      { title: 'Two properties and a replayable sequence', condition: 'strict', state: 5, principle: true, note: 'P1: no two confirmed bookings for the same room overlap. P2: a valid adjacent booking is accepted. Intervals are half-open, so [10:00,11:00) and [11:00,12:00) are adjacent and allowed. These four candidates are fixed examples; property-based tools generate many more.' },
      { title: 'Changed: the comparison rejects adjacency', condition: 'touching', state: 3, note: 'Smallest displayed counterexample: [10:00,11:00) then [11:00,12:00). The comparison calls it an overlap and the rule calls it adjacent. P1 holds and P2 fails. A service that refuses everything satisfies P1, which is why both properties are needed.' },
      { title: 'A generated failure reduced to its smallest form', condition: 'reduce', state: 3, note: 'Six generated bookings reduce to three, then two, then to simpler times, and P2 fails at every step. Property-based tools report this smaller counterexample so you can see the cause.' },
      { title: 'Optional depth: fuzzing with malformed text', condition: 'odd-input', state: 3, note: 'A fuzzer sends generated input, and the property is that any text gets a clear answer without a crash. The failing input reduces from three spaces to empty text. After the correction, blank text gets a clear answer and nothing crashes.' },
    ],
  };

  // ------------------------------------------------------------------ 6. Executed is not the same as checked
  const CV_S = { good: snip(CV, 'the correct'), mutant: snip(CV, 'the boundary'), equivalent: snip(CV, 'the equivalent') };
  const COV_LINES = `${CV.coverage.executed} of ${CV.coverage.total}`;
  const coverage = {
    id: 'coverage-and-mutation', role: 'bridge', heading: 'The line ran. Did anything check its answer?',
    lead: 'Coverage reports what executed. A mutation asks whether the suite would notice if the behavior changed.',
    principle: 'Coverage and mutation results are diagnostic signals about evidence, not substitutes for requirements.',
    principleShort: 'Use both signals to find weak checks.',
    conditions: [
      { id: 'executed-only', baseline: true, label: 'The shipped code and a suite with no assertions', short: 'Executed only', states: [
        { caption: 'This is the code as shipped, with a suite that calls it twice.', prompt: { question: 'Every line shows as executed, and the run is green. What does that tell you?', options: ['The lines ran; whether any answer was right is still open', 'R-02 is implemented correctly', 'Both boundaries are checked'] } },
        { caption: `**Lines executed: ${COV_LINES}.** Coverage marks each line that ran during the suite.` },
        { caption: 'The suite even calls **duration_ok(120)**. The answer comes back False, and nothing compares it with anything.' },
        { caption: `Add one assertion. **Coverage stays at ${COV_LINES}, and the run now fails.** The same lines ran; the evidence is different.`, principle: true },
      ] },
      { id: 'mutant-survives', label: `Mutation ${CV.mutation.from} to ${CV.mutation.to}; no 120 case`, short: 'Mutant survives', states: [
        { caption: 'The code is correct now. Change **<=** to **<** on purpose: a **mutation**.', prompt: { question: 'The suite has no 120 case. What happens when the mutated code runs?', options: ['The suite fails at once', 'Some lines stop executing', 'Every check passes: nothing notices'] } },
        { caption: 'On the correct code, all four checks pass.' },
        { caption: `Apply the mutation: **${CV.mutation.from} becomes ${CV.mutation.to}**. Execution looks the same: the same lines run.` },
        { caption: '**All four checks still pass. The mutant survived.** This suite has no case where the two versions answer differently.', principle: true },
      ] },
      { id: 'mutant-detected', label: 'The same mutation; the suite now includes 120', short: 'Mutant detected', states: [
        { caption: 'Keep the same mutation and add one case.', prompt: { question: 'You add “120 must be accepted”. What changes?', options: ['Line coverage goes up', 'The mutant is now detected', 'Nothing: the same lines run'] } },
        { caption: `The suite now has five checks, and coverage is still **${COV_LINES}**.` },
        { caption: 'On the mutant, **120 returns False and the check fails. Mutant detected.**' },
        { caption: 'You have learned something limited and useful: this suite notices this boundary change. R-02 still decides what is right.', principle: true },
      ] },
      { id: 'equivalent', label: `A second mutation: ${CV.equivalent.from} to ${CV.equivalent.to}`, short: 'Equivalent change', states: [
        { caption: `A tool also tries **${CV.equivalent.from} becomes ${CV.equivalent.to}**.`, prompt: { question: 'No whole-minute case can tell these two apart. What does its survival call for?', options: ['More test cases until it dies', 'A bug report against the code', 'Your judgment: the two behave the same'] } },
        { caption: 'Every check gives the same answer on both versions. **It survives**, and no new whole-minute case could change that.' },
        { caption: `Two mutants tried, one detected: **${CV.score.formula} = ${CV.score.detected} / ${CV.score.valid} = ${CV.score.percent}%**. The score points at places to look. One of these two needs no new test.`, principle: true },
      ] },
    ],
    setup(stage, api) {
      const metric = (k, name) => { const b = el('span', {}); const root = cue(api, el('div', { class: 'w8-metric' }, [el('b', {}, k), b])); root.set = (val, kind) => { b.textContent = val; root.classList.toggle('is-ok', kind === 'ok'); root.classList.toggle('is-bad', kind === 'bad'); root.classList.toggle('is-warn', kind === 'warn'); }; api.cue(root, name); return root; };
      const mLines = metric('Lines executed', 'metric-lines'), mAssert = metric('Answers compared', 'metric-assertions'), mVerdict = metric('Verdict', 'metric-verdict');
      const bar = el('div', { class: 'w8-runbar', style: 'margin-top:8px' }, el('i')); mLines.appendChild(bar);
      const srcCode = code(api, CV.source_code, 'code-under-test'); srcCode.classList.add('w8-code--big');
      const srcTitle = title('Code under test');
      const srcCard = cue(api, card([srcTitle, srcCode]), 'source');
      const mutDiff = cue(api, rv(el('div', {}, [title('The mutation'), el('div', { 'data-mut': '' })])), 'mutation');
      const ranBar = () => el('div', { class: 'w8-runbar is-on' }, el('i'));
      const execRow = cue(api, rv(el('div', { class: 'w8-exec' }, [el('b', {}, 'Correct code'), ranBar(), el('span', {}, `${COV_LINES} lines ran`), el('b', {}, 'Mutant'), ranBar(), el('span', {}, `${COV_LINES} lines ran`)])), 'execution-compare');
      const rows = [0, 1, 2, 3, 4].map((i) => { const cells = [el('th', { scope: 'row', class: 'w8-mono', style: 'white-space:nowrap' }), el('td', {}), el('td', {})]; return { cells, tr: cue(api, el('tr', {}, cells), `suite-row-${i + 1}`) }; });
      const h1 = el('th', {}, 'The suite'), h2 = el('th', {}), h3 = el('th', {});
      const suite = cue(api, card([el('table', { class: 'w8-table w8-table--big', 'aria-label': 'The suite on the code and on the mutant' }, [el('thead', {}, el('tr', {}, [h1, h2, h3])), el('tbody', {}, rows.map((r) => r.tr))])]), 'suite');
      const note = cue(api, rv(el('div', { class: 'w8-note' })), 'conclusion');
      stage.append(el('div', { class: 'w8-stack' }, [
        el('div', { class: 'w8-grid w8-three' }, [mLines, mAssert, mVerdict]),
        el('div', { class: 'w8-grid', style: 'grid-template-columns:minmax(0,.86fr) minmax(0,1.14fr);gap:16px' }, [el('div', { class: 'w8-stack', style: 'height:auto' }, [srcCard, mutDiff, execRow]), suite]),
        note]));
      return { mLines, mAssert, mVerdict, bar, srcCode, srcTitle, mutDiff, execRow, rows, h2, h3, note };
    },
    render(h, v, api) {
      const st = v.state, id = v.conditionId;
      const setRows = (data) => h.rows.forEach((r, i) => { const d = data[i]; r.tr.style.display = d ? '' : 'none'; if (!d) return; r.cells[0].textContent = d[0]; r.cells[1].replaceChildren(...[].concat(d[1])); r.cells[2].replaceChildren(...[].concat(d[2])); r.tr.classList.toggle('is-bad', !!d[3]); r.tr.classList.toggle('is-focus', !!d[4]); });
      const passFail = (ok) => [mark(ok), ok ? 'Passes' : 'Fails'];
      const check = (n, snippet) => answer(snippet, n) === required(n);
      if (id === 'executed-only') {
        h.srcCode.setCode(CV.shipped_code); h.srcTitle.textContent = 'Code under test · as shipped';
        h.srcCode.ranLines(st >= 1 ? [1, 2] : []); h.srcCode.focusLines([]); h.srcCode.badLines([]);
        h.h2.textContent = 'What came back'; h.h3.textContent = 'Compared with R-02?';
        const data = CV.no_assert_suite.map((call, i) => { const n = i ? 120 : 60; return [call, st >= 1 ? answer(S1.exclusive, n) ? 'True' : 'False' : '', st >= 2 ? 'No: nothing looks at it' : '', false, st === 2 && n === 120]; });
        if (st >= 3) data.push([CV.added_assertion, 'False', passFail(false), true, true]);
        setRows(data);
        h.bar.classList.toggle('is-on', st >= 1);
        h.mLines.set(st >= 1 ? COV_LINES : 'Not run', st >= 1 ? 'ok' : '');
        h.mAssert.set(st >= 3 ? '1' : st >= 1 ? '0' : 'Not run', st >= 3 ? 'ok' : st >= 1 ? 'warn' : '');
        h.mVerdict.set(st >= 3 ? 'Run fails' : st >= 1 ? 'Run is green' : 'Not run', st >= 3 ? 'bad' : st >= 1 ? 'ok' : '');
        show(h.mutDiff, false); show(h.execRow, false);
        show(h.note, st >= 3); h.note.textContent = `Same ${COV_LINES} lines. Now an answer is compared with R-02, and the defect shows.`;
      } else {
        const equiv = id === 'equivalent', suiteCases = id === 'mutant-survives' ? CV.suite_without_120 : CV.suite_with_120;
        const mutated = equiv ? st >= 1 : st >= 2;
        const snippet = equiv ? CV_S.equivalent : CV_S.mutant, fromTo = equiv ? CV.equivalent : CV.mutation;
        h.srcCode.setCode(mutated ? CV.source_code.replace(fromTo.from, fromTo.to) : CV.source_code); h.srcTitle.textContent = mutated ? 'Code under test · mutated' : 'Code under test · correct';
        h.srcCode.ranLines(st >= 1 ? [1] : []); h.srcCode.focusLines(mutated ? [2] : []); h.srcCode.badLines([]);
        if (!mutated && st >= 1) h.srcCode.ranLines([1, 2]);
        h.h2.textContent = 'On the correct code'; h.h3.textContent = mutated ? 'On the mutant' : '';
        const showCases = id === 'mutant-detected' && st === 0 ? CV.suite_without_120 : suiteCases;
        const reveal = mutated && (id !== 'mutant-survives' || st >= 3);
        setRows(showCases.map((n) => { const a = check(n, CV_S.good), b = check(n, snippet); return [`duration_ok(${n}) == ${required(n) ? 'True' : 'False'}`, st >= 1 || equiv ? passFail(a) : '', reveal ? passFail(b) : '', reveal && !b, id === 'mutant-detected' && n === 120 && st >= 1]; }));
        const box = h.mutDiff.querySelector('[data-mut]');
        box.replaceChildren(diff(api, `    return 30 <= minutes ${fromTo.from}`, `    return 30 <= minutes ${fromTo.to}`, `mutation-${id}`));
        show(h.mutDiff, mutated); show(h.execRow, mutated);
        const ran = id === 'mutant-detected' || equiv || st >= 1;
        h.bar.classList.toggle('is-on', ran);
        h.mLines.set(ran ? COV_LINES : 'Not run', ran ? 'ok' : '');
        h.mAssert.set(ran ? String(showCases.length) : 'Not run', ran ? 'ok' : '');
        const finished = mutated && (equiv ? st >= 1 : st >= 2 && (id === 'mutant-survives' ? st >= 3 : true));
        const detected = showCases.some((n) => !check(n, snippet));
        h.mVerdict.set(equiv ? (st >= 2 ? `Score ${CV.score.percent}%` : st >= 1 ? 'Survived' : 'Not run') : finished ? (detected ? 'Detected' : 'Survived') : mutated ? 'Running' : 'Not run', equiv ? 'warn' : finished ? (detected ? 'ok' : 'bad') : '');
        const notes = { 'mutant-survives': 'A surviving mutant points at a missing case. This suite never asks about 120.', 'mutant-detected': 'With the 120 case, the suite notices this change. That is exactly what this result tells you.', equivalent: `${CV.equivalent.from} and ${CV.equivalent.to} give the same answer for every whole minute. Mutation tools let you mark such a change, and from then on it stops counting against the score.` };
        show(h.note, equiv ? st >= 2 : st >= (id === 'mutant-detected' ? 2 : 3)); h.note.textContent = notes[id];
      }
      if (st === 3 && id === 'executed-only') glow(api, h.mVerdict, RED);
      if (st === 2 && id === 'mutant-detected') glow(api, h.mVerdict, GREEN);
      if (st === 3 && id === 'mutant-survives') glow(api, h.mVerdict, RED);
      if (id !== 'executed-only' && ((id === 'equivalent' && st === 1) || (id !== 'equivalent' && st === 2))) changePulse(api, h.srcCode);
    },
    print: [
      { title: 'The line ran, and the answer went unread', condition: 'executed-only', state: 3, note: `The suite called duration_ok(120) and never looked at the answer. Lines executed: ${COV_LINES}. One added assertion leaves coverage the same and makes the run fail, because the shipped comparison refuses 120.`, principle: true },
      { title: 'The mutation survives while the 120 case is missing', condition: 'mutant-survives', state: 3, note: 'The mutation changes <= 120 to < 120. The suite of 29, 30, 60 and 121 passes on both versions, so the mutant survives. The missing case is 120.' },
      { title: 'One added assertion detects it', condition: 'mutant-detected', state: 3, note: 'Added assertion: duration_ok(120) == True. The suite now fails on the mutant. The limited conclusion: this suite notices this boundary change. R-02 still decides what is right.' },
      { title: 'Equivalent changes need judgment', condition: 'equivalent', state: 2, note: 'For whole minutes, <= 120 and < 121 always agree, so this mutant survives whatever you add. The score, before anything is marked, is detected / valid = 1 / 2 = 50%. Read it as a signal about where to look.' },
    ],
  };

  // ------------------------------------------------------------------ 7. Repeatable observations
  const RO_C = snip(RO, 'may Ari'), RO_W = snip(RO, 'a check that waits'), RO_F = snip(RO, 'booking and notification');
  const WALLX = (m) => 632 + (m - 600) * 130, FIXX = (m) => 632 + (m - 600) * 4.2;
  const minutesOf = (c) => { const [h_, m] = c.split(':').map(Number); return h_ * 60 + m; };
  const repeatable = {
    id: 'repeatable-observation', role: 'bridge', heading: 'Same code, same check. Why does it pass and then fail?',
    lead: 'A check also reads things you did not list: the clock, a delay, a neighbor. Bring them into the check.',
    principle: 'Control irrelevant variation so a failing check tells us something about the behavior being examined.',
    principleShort: 'Fix what should not matter, so a failure means something.',
    conditions: [
      { id: 'wall-clock', baseline: true, label: 'The check reads the wall clock', short: 'Wall clock', states: [
        { caption: `The check says ${RO.booking.owner} can cancel ${RO.booking.id}, which starts at ${RO.booking.start}. It reads the time from the wall clock.`, prompt: { question: 'The same check passes in one run and fails in a later one. The code did not change. What did?', options: ['The rule changed overnight', 'The wall clock crossed the booking’s start', 'Nothing: rerun it until it passes'] } },
        { caption: 'Run 1 at **09:58**: cancelling is allowed. The check passes.' },
        { caption: 'Run 2 at **09:59**: it passes again.' },
        { caption: 'Run 3 at **10:00**: cancelling is denied, because the booking has started. **The check fails, with no code changed.**' },
        { caption: 'Run 4 at **10:01**: it fails again. **R-03 was right in all four runs.** The clock is an input this check never controlled.', principle: true },
      ] },
      { id: 'teaching-clock', label: 'The check sets its own clock', short: 'Fixed clock', states: [
        { caption: 'Pass the clock into the check, and fix it at 09:00.', prompt: { question: 'The clock is fixed at 09:00. What happens across five runs?', options: ['Five identical passes, whenever you run them', 'Passes before 10:00 and failures after', 'Random results, as before'] } },
        { caption: '**09:00, five runs, five passes.** The time of day when you run the check no longer matters.' },
        { caption: '**10:00, the exact start, is now a case of its own.** Five runs, Denied every time, as R-03 says. A boundary you could only hit by luck is now a line in the check.', principle: true },
      ] },
      { id: 'injected-failure', label: 'The clock stays fixed; one notification failure is injected', short: 'Injected failure', states: [
        { caption: 'Two ways to check that a notification is handled.', prompt: { question: 'The notification check fails now and then. Which version tells you something about the behavior?', options: ['Wait longer, and rerun it until it is green', 'Inject one failure from a controlled provider and check R-04', 'Remove the check'] } },
        { caption: '**The waiting check.** It sleeps two seconds and hopes. The result follows the delay of each run and says nothing about R-04.' },
        { caption: `**The injected failure.** A controlled provider fails on request. Five runs, the same failure every time: **${RO.defect_message}**. That message points at a defect.` },
        { caption: `Repair the handler. **Five runs, five passes:** booking ${RO.repaired_state.booking}; notification ${RO.repaired_state.notification}.`, principle: true },
      ] },
    ],
    setup(stage, api) {
      const ruleId = el('span', { class: 'w8-rule-id' }), ruleText = el('span', {});
      const rule = cue(api, el('div', { class: 'w8-rule', style: 'font-size:20px;font-weight:550' }, [ruleId, ruleText]), 'rule');
      const svg = window.VC.svg(1264, 158, { label: 'A time line around the start of the booking, with a marker for the clock reading of the current run', uid: api.uid });
      svg.classList.add('w8-clock'); cue(api, svg, 'timeline');
      svg.appendChild(s('rect', { x: 24, y: 52, width: 608, height: 58, class: 'w8-zone--ok', rx: 8 }));
      svg.appendChild(s('rect', { x: 632, y: 52, width: 608, height: 58, class: 'w8-zone--bad', rx: 8 }));
      svg.appendChild(text(188, 87, 'Start is later than now: allowed', { class: 'w8-zone-t', style: 'fill:var(--ok)' }));
      svg.appendChild(text(1100, 87, 'Started: denied', { class: 'w8-zone-t', style: 'fill:var(--bad)' }));
      svg.appendChild(s('line', { x1: 632, y1: 40, x2: 632, y2: 118, class: 'w8-start' }));
      const startT = text(632, 142, `${RO.booking.id} starts at ${RO.booking.start}`, { class: 'w8-start-t' }); svg.appendChild(startT);
      const handT = text(0, 22, '');
      const hand = s('g', { class: 'w8-hand' }, [handT, s('line', { x1: 0, y1: 30, x2: 0, y2: 116 }), s('path', { d: 'M-11,28 L11,28 L0,44 Z' })]);
      svg.appendChild(hand); cue(api, hand, 'clock-marker');
      const clockWrap = el('div', { 'data-cond': 'wall-clock,teaching-clock' }, svg);
      const leftTitle = title(''), leftCode = code(api, RO.wall_code, 'check-code');
      const leftCard = cue(api, card([leftTitle, leftCode]), 'check-card');
      const strip = el('div', { class: 'w8-strip', style: 'grid-template-columns:repeat(4,minmax(0,1fr))' });
      const runs = [0, 1, 2, 3, 4].map((i) => { const b = el('b', {}), v2 = el('span', { class: 'v' }), r = el('span', { class: 'r' }); const root = cue(api, rv(el('div', { class: 'w8-run' }, [b, v2, r])), `run-${i + 1}`); root.set = (head, val, res, ok) => { b.textContent = head; v2.textContent = val; r.textContent = res; root.classList.toggle('is-ok', ok); root.classList.toggle('is-bad', !ok); }; strip.append(root); return root; });
      const stripTitle = title('');
      const runCard = cue(api, card([stripTitle, strip]), 'run-card');
      const atStart = cue(api, rv(card([title('The exact start is now its own case'), el('div', { class: 'w8-strip', style: 'grid-template-columns:repeat(5,minmax(0,1fr))' }, [0, 1, 2, 3, 4].map((i) => el('div', { class: 'w8-run is-ok' }, [el('b', {}, `Run ${i + 1}`), el('span', { class: 'v' }, RO.fixed_clocks[1].clock), el('span', { class: 'r' }, RO.fixed_clocks[1].expected)])))])), 'at-start-runs');
      atStart.setAttribute('data-cond', 'teaching-clock');
      const finding = cue(api, rv(el('div', { class: 'w8-note' })), 'finding');
      const clockPanel = el('div', { class: 'w8-stack', 'data-cond': 'wall-clock,teaching-clock', style: 'height:auto' }, [el('div', { class: 'w8-grid', style: 'grid-template-columns:590px minmax(0,1fr);gap:14px' }, [leftCard, runCard]), atStart]);
      // injected failure: two lanes
      const lane = (head, src, name, count) => {
        const st = el('div', { class: 'w8-strip', style: `grid-template-columns:repeat(${count},minmax(0,1fr))` });
        const items = Array.from({ length: count }, (_, i) => { const b = el('b', {}), v2 = el('span', { class: 'v' }), r = el('span', { class: 'r' }); const root = cue(api, rv(el('div', { class: 'w8-run' }, [b, v2, r])), `${name}-run-${i + 1}`); root.set = (hd, val, res, ok) => { b.textContent = hd; v2.textContent = val; r.textContent = res; root.classList.toggle('is-ok', ok); root.classList.toggle('is-bad', !ok); }; st.append(root); return root; });
        const message = rv(el('div', { class: 'w8-note' })); cue(api, message, `${name}-message`);
        return { items, message, root: cue(api, card([title(head), code(api, src, `${name}-code`), el('div', { style: 'height:9px' }), st, el('div', { style: 'height:9px' }), message]), name) };
      };
      const wait = lane('The check that waits', RO.wait_code, 'waiting', RO.wait_runs.length), fake = lane('The injected failure', RO.fake_code, 'injected', RO.fixed_runs);
      const injected = el('div', { class: 'w8-grid w8-two', 'data-cond': 'injected-failure' }, [wait.root, fake.root]);
      stage.append(el('div', { class: 'w8-stack' }, [rule, clockWrap, clockPanel, injected, finding]));
      return { ruleId, ruleText, hand, handT, startT, leftTitle, leftCode, runs, stripTitle, strip, atStart, finding, wait, fake };
    },
    render(h, v, api) {
      const st = v.state, id = v.conditionId;
      h.ruleId.textContent = id === 'injected-failure' ? RULES[3][0] : 'R-03';
      h.ruleText.textContent = id === 'injected-failure' ? RULES[3][1] : upperFirst(RO.rule.replace('R-03: ', ''));
      const place = (x, label) => { h.hand.style.transform = `translateX(${x}px)`; h.hand.setAttribute('transform', `translate(${x} 0)`); h.handT.textContent = label; };
      if (id === 'wall-clock') {
        h.leftTitle.textContent = 'The check'; h.leftCode.setCode(RO.wall_code); h.leftCode.focusLines([1]);
        h.stripTitle.textContent = 'Four runs of the same code'; h.strip.style.gridTemplateColumns = 'repeat(4,minmax(0,1fr))';
        const now = st >= 1 ? RO.wall_runs[st - 1].clock : RO.wall_runs[0].clock;
        place(WALLX(minutesOf(now)), st >= 1 ? now : '');
        h.hand.style.opacity = st >= 1 ? 1 : 0;
        h.runs.forEach((run, i) => { const r = RO.wall_runs[i]; run.style.display = r ? '' : 'none'; if (!r) return; const allowed = answer(RO_C, minutesOf(r.clock), 600); run.set(`Run ${r.run}`, r.clock, allowed ? 'Passes' : 'Fails', allowed); show(run, st > i); });
        show(h.finding, st >= 4); h.finding.textContent = 'The rule was right every time. A red run here is about the time of day, and it teaches people to ignore red runs.';
      } else if (id === 'teaching-clock') {
        h.leftTitle.textContent = 'The same check, with its clock passed in'; h.leftCode.setCode(RO.fixed_code); h.leftCode.focusLines(st >= 2 ? [4, 5] : st >= 1 ? [1, 2] : []);
        h.stripTitle.textContent = `Five runs at ${RO.fixed_clocks[0].clock}`; h.strip.style.gridTemplateColumns = 'repeat(5,minmax(0,1fr))';
        const at = st >= 2 ? RO.fixed_clocks[1].clock : RO.fixed_clocks[0].clock;
        place(FIXX(minutesOf(at)), at); h.hand.style.opacity = 1;
        h.runs.forEach((run, i) => { run.style.display = ''; run.set(`Run ${i + 1}`, RO.fixed_clocks[0].clock, 'Passes', true); show(run, st >= 1); });
        show(h.atStart, st >= 2);
        show(h.finding, st >= 2); h.finding.textContent = `At ${RO.fixed_clocks[1].clock}: ${RO.fixed_clocks[1].expected}, because the ${RO.fixed_clocks[1].reason}. A red run now means the behavior changed.`;
      } else {
        RO.wait_runs.forEach((r, i) => { const ok = answer(RO_W, r.delay_ms); h.wait.items[i].set(`Run ${r.run}`, `${(r.delay_ms / 1000).toFixed(1)} s`, ok ? 'Passes' : 'Fails', ok); show(h.wait.items[i], st >= 1); });
        const repaired = st >= 3, [book] = answer(RO_F, !repaired);
        h.fake.items.forEach((item, i) => { item.set(`Run ${i + 1}`, book, repaired ? 'Passes' : 'Fails', repaired); item.querySelector('.v').style.fontSize = '16px'; show(item, st >= 2); });
        show(h.wait.message, st >= 1); h.wait.message.textContent = 'Same code, different delays. This red run says the message was late, and nothing about the rule.';
        show(h.fake.message, st >= 2); h.fake.message.textContent = repaired ? `Booking ${RO.repaired_state.booking}. Notification ${RO.repaired_state.notification}.` : RO.defect_message;
        h.fake.message.className = `w8-note ${repaired ? 'w8-note--ok' : 'w8-note--bad'} rv rv--rise${st >= 2 ? ' is-shown' : ''}`;
        show(h.finding, false);
      }
      if (id === 'wall-clock' && st === 3) glow(api, h.runs[2], RED);
      if (id === 'injected-failure' && st === 2) glow(api, h.fake.message, RED);
      if (id === 'injected-failure' && st === 3) glow(api, h.fake.message, GREEN);
    },
    print: [
      { title: 'Uncontrolled input: the wall clock', condition: 'wall-clock', state: 4, principle: true, note: 'The same check runs at 09:58, 09:59, 10:00 and 10:01. R-03 is right in all four runs; the clock crossed the booking’s 10:00 start. These clock readings are simulated.' },
      { title: 'Controlled fixture: a clock the check sets', condition: 'teaching-clock', state: 2, note: 'Fixed clock 09:00: allowed, every run. Fixed clock 10:00, the exact start: denied, every run, because the start is not later than now.' },
      { title: 'Changed: one injected notification failure', condition: 'injected-failure', state: 3, note: 'The waiting check passes or fails with a simulated delay. The controlled failure repeats until the handler is repaired, and its message names R-04. After the repair: booking Confirmed; notification Failed, visible, and ready to retry.' },
    ],
  };

  // ------------------------------------------------------------------ 8. Checks as feedback
  const TF_S = snip(TF, 'the corrected predicate');
  const feedback = {
    id: 'testing-as-feedback', role: 'bridge', heading: 'What should happen before you fix the bug?',
    lead: 'Back to Ari’s refused booking. Find the cause in four small moves, then let one check guide the change.',
    principle: 'Tests are feedback instruments whose value depends on the claims, observations, and assumptions they preserve.',
    principleShort: 'A check is only as good as what it holds on to.',
    conditions: [
      { id: 'debug-first', baseline: true, label: 'Debug in four moves, then correct under a failing check', short: 'Debug first', states: [
        { caption: 'Ari’s 120-minute booking is refused, and you have a suspicion about the code.', prompt: { question: 'What comes first?', options: ['Rewrite the validation function', 'Add a retry around the request', 'Reproduce the failure with the 120-minute case'] } },
        { caption: `**Reproduce.** ${TF.moves[0].detail} Now you have something you can run.` },
        { caption: `**Shrink.** ${TF.moves[1].detail}` },
        { caption: `**One hypothesis.** ${TF.moves[2].detail} One idea at a time, so the next result can settle it.` },
        { caption: `**Confirm.** ${TF.moves[3].detail}` },
        { caption: `Turn the smallest failure into a focused check: **${TF.failing_check}**. It fails, for the reason you expect.` },
        { caption: 'Make the smallest change: one character.' },
        { caption: '**Rerun.** All six boundary cases pass, and this check stays to guard the meaning of the rule.', principle: true },
      ] },
      { id: 'check-first', label: 'The check is written before the code', short: 'Check first', states: [
        { caption: 'Same rule, a different order: write the check first.', prompt: { question: 'You write the check before the code. What does that give you?', options: ['The expected behavior is explicit before the change', 'A correct requirement, automatically', 'No further need for review'] } },
        { caption: 'The check states the expected behavior, and it **fails** because the behavior does not exist yet.' },
        { caption: 'Write just enough code to make it **pass**. This order is called **test-first development**.' },
        { caption: `The check is as right as the requirement it came from. ${TF.wrong_requirement}`, principle: true },
      ] },
      { id: 'refactor', label: 'Refactor the corrected predicate; its contract stays the same', short: 'Refactor', states: [
        { caption: 'The fix is in. Now restructure the code with named limits.', prompt: { question: 'What should the checks tell you after this refactoring?', options: ['New answers, because the code changed', 'The same answers on every case', 'Nothing: refactoring needs no checks'] } },
        { caption: 'The structure changes: the limits now have names. The decision is meant to stay the same.' },
        { caption: '**All six cases give the same answers.** The checks held the meaning still while the code moved.' },
        { caption: 'Say what this leaves open as well: the conditions below were never exercised here. Higher-level checks still have their own job.', principle: true },
      ] },
    ],
    setup(stage, api) {
      const moves = TF.moves.map((m, i) => cue(api, el('div', { class: 'w8-move' }, [el('span', { class: 'n' }, String(i + 1)), el('span', { class: 'h' }, ''), rv(el('p', {}, m.detail))]), `move-${m.id}`));
      const movesRow = el('div', { class: 'w8-grid', style: 'grid-template-columns:repeat(4,minmax(0,1fr));gap:10px', 'data-cond': 'debug-first' }, moves);
      const svg = window.VC.svg(1264, 120, { label: 'A loop from requirement to failing check to smallest change to recheck', uid: api.uid });
      svg.classList.add('w8-loop'); cue(api, svg, 'loop');
      const boxes = TF.loop.map((label, i) => { const g = window.VC.node({ x: 18 + i * 312, y: 6, w: 260, h: 62, label }); svg.appendChild(g); cue(api, g, `loop-${i + 1}`); return g; });
      boxes.slice(1).forEach((b, i) => arrow(svg, { fromBox: boxes[i], toBox: b, kind: 'accent', fromSide: 'right', toSide: 'left' }));
      const back = arrow(svg, { from: { x: 1090, y: 68 }, to: { x: 148, y: 70 }, kind: 'ok', via: [{ x: 1090, y: 104 }, { x: 148, y: 104 }], cls: 'rv rv--draw', label: 'guards the meaning from now on', labelDy: -8 });
      cue(api, back, 'loop-back');
      const srcCode = code(api, CV.shipped_code, 'code');
      const srcTitle = title('The code');
      const srcCard = cue(api, card([srcTitle, srcCode]), 'code-card');
      const checkCode = code(api, TF.failing_check, 'focused-check');
      const checkCard = cue(api, rv(card([title('The focused check'), checkCode])), 'focused-check-card');
      const diffBox = cue(api, rv(el('div', {}, diff(api, TF.before, TF.after, 'fix'))), 'smallest-change');
      const rows = TF.check_cases.map((n) => { const cells = [el('th', { scope: 'row', class: 'w8-mono' }, String(n)), el('td', {}, verdict(required(n))), el('td', {})]; return { n, cells, tr: cue(api, el('tr', {}, cells), `case-${n}`) }; });
      const resultTable = cue(api, card([el('table', { class: 'w8-table', 'aria-label': 'The six boundary cases' }, [el('thead', {}, el('tr', {}, [el('th', {}, 'Minutes'), el('th', {}, 'R-02 requires'), el('th', {}, 'Code answers')])), el('tbody', {}, rows.map((r) => r.tr))])]), 'results');
      const open = cue(api, rv(card([title('Not exercised by these checks'), el('ul', { class: 'w8-small', style: 'display:flex;flex-direction:column;gap:4px' }, TF.untested.map((t) => el('li', {}, t)))])), 'untested');
      open.setAttribute('data-cond', 'refactor');
      stage.append(el('div', { class: 'w8-stack', style: 'gap:9px' }, [movesRow, svg,
        el('div', { class: 'w8-grid', style: 'grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px' }, [el('div', { class: 'w8-stack', style: 'gap:9px;height:auto' }, [srcCard, checkCard, diffBox]), el('div', { class: 'w8-stack', style: 'gap:9px;height:auto' }, [resultTable, open])])]));
      return { moves, boxes, back, srcCode, srcTitle, checkCard, checkCode, diffBox, rows, open };
    },
    render(h, v, api) {
      const st = v.state, id = v.conditionId;
      const setLoop = (now, done) => h.boxes.forEach((b, i) => { b.classList.toggle('is-now', i === now); b.classList.toggle('is-done', i < done); });
      let results;   // 'shipped' | 'fixed' | null
      if (id === 'debug-first') {
        h.moves.forEach((m, i) => { const at = i + 1; m.classList.toggle('is-now', st === at); m.classList.toggle('is-done', st > at); m.querySelector('.h').textContent = st >= at ? TF.moves[i].label : 'Move'; show(m.querySelector('p'), st >= at); });
        setLoop(st >= 7 ? 3 : st === 6 ? 2 : st === 5 ? 1 : st >= 1 ? 0 : -1, st >= 7 ? 3 : st === 6 ? 2 : st === 5 ? 1 : 0);
        show(h.back, st >= 7);
        h.srcCode.setCode(st >= 6 ? CV.source_code : CV.shipped_code); h.srcCode.focusLines(st === 3 || st === 4 || st === 6 ? [2] : []);
        show(h.checkCard, st >= 5); show(h.diffBox, st >= 6);
        results = st >= 7 ? 'fixed' : st === 4 ? 'probe' : st >= 5 ? 'one' : null;
      } else if (id === 'check-first') {
        setLoop(st >= 2 ? 2 : st === 1 ? 1 : 0, st >= 2 ? 2 : st === 1 ? 1 : 0);
        show(h.back, st >= 3);
        h.srcCode.setCode(st >= 2 ? CV.source_code : CV.shipped_code); h.srcCode.focusLines(st === 2 ? [2] : []);
        show(h.checkCard, st >= 1); show(h.diffBox, st >= 2);
        results = st >= 2 ? 'fixed' : st === 1 ? 'one' : null;
      } else {
        setLoop(st >= 2 ? 3 : st === 1 ? 2 : -1, 3);
        show(h.back, st >= 2);
        h.srcCode.setCode(st >= 1 ? TF.refactored : CV.source_code); h.srcCode.focusLines(st >= 1 ? [1, 2, 5] : []);
        show(h.checkCard, false); show(h.diffBox, false);
        results = st >= 2 ? 'refactored' : 'fixed';
        show(h.open, st >= 3);
      }
      h.srcTitle.textContent = id === 'refactor' ? (st >= 1 ? 'The code, restructured' : 'The corrected code') : 'The code';
      h.rows.forEach((row) => {
        const res = results === 'fixed' ? answer(S1.inclusive, row.n) : results === 'refactored' ? answer(TF_S, row.n) : results === 'one' && row.n === 120 ? answer(S1.exclusive, 120) : results === 'probe' && (row.n === 119 || row.n === 120) ? answer(S1.exclusive, row.n) : null;
        const agree = res === required(row.n);
        row.cells[2].replaceChildren(...(res === null ? [] : [mark(agree), verdict(res)]));
        row.tr.classList.toggle('is-bad', res !== null && !agree);
      });
      if (id === 'debug-first' && st >= 1 && st <= 4) changePulse(api, h.moves[st - 1].querySelector('p'));
      if (id === 'debug-first' && st === 7) glow(api, h.back, GREEN);
      if (id === 'refactor' && st === 2) glow(api, h.boxes[3], GREEN);
    },
    print: [
      { title: 'Four debugging moves and the feedback loop', condition: 'debug-first', state: 7, principle: true, note: 'Reproduce with the 120-minute case, shrink to duration_ok(120), state one hypothesis about the comparison, and confirm with one targeted observation. Then a focused failing check, the smallest change, and a rerun of all six cases.' },
      { title: 'Changed: the check comes first', condition: 'check-first', state: 3, note: 'Test-first development makes the expected behavior explicit before the change. A check written from a wrong requirement carries that mistake faithfully, so the requirement still has to be right.' },
      { title: 'Changed: refactor under the checks', condition: 'refactor', state: 3, note: 'Named limits leave every answer unchanged. The list shows conditions these checks never exercised; higher-level checks have their own job.' },
    ],
  };

  // ------------------------------------------------------------------ Verification before and during execution; what each piece of evidence lets you claim
  const BR = TF.before_running, KINDS = ['review', 'static', 'dynamic'];
  const evidence = {
    kind: 'page', id: 'evidence-and-limits', heading: 'What does each kind of evidence let you claim?',
    lead: 'Reading, analyzing and running answer different questions. Keep each claim with its evidence.', printRole: 'Claims and evidence',
    build(body, api) {
      const kinds = KINDS.map((k) => cue(api, rv(el('div', { class: 'w8-kind' }, [el('span', { class: 'when' }, BR[k].when), el('span', { class: 'h' }, BR[k].label), el('p', {}, BR[k].does), el('p', { class: 'found' }, BR[k].finds)])), `kind-${k}`));
      const clauses = TF.contract.map((c, i) => cue(api, el('div', { class: 'w8-clause' }, [el('b', {}, c.kind), el('p', {}, c.text), el('small', {}, `Justified by ${c.from}`)]), `clause-${i + 1}`));
      const contractBox = cue(api, rv(el('div', { class: 'w8-contract' }, clauses)), 'contract');
      const rows = TF.claims.map((c, i) => cue(api, rv(el('tr', {}, [el('th', { scope: 'row', style: 'font-weight:600' }, c.claim), el('td', {}, c.evidence), el('td', { class: 'w8-warn' }, c.remaining)])), `claim-${i + 1}`));
      const table = cue(api, card([el('table', { class: 'w8-table', 'aria-label': 'Claim, evidence and what stays open' }, [el('thead', {}, el('tr', {}, [el('th', {}, 'Claim'), el('th', {}, 'Evidence'), el('th', {}, 'What stays open')])), el('tbody', {}, rows)])]), 'claims-table');
      const LABELS = ['Read the code', 'Analyze without running', 'Run it', 'State the contract', 'Line up the evidence'];
      const buttons = LABELS.map((label, i) => cue(api, el('button', { type: 'button', class: 'preset-btn w8-action' }, label), `show-${i + 1}`));
      const reset = cue(api, el('button', { type: 'button', class: 'preset-btn w8-action' }, 'Start again'), 'start-again');
      body.append(el('div', { class: 'w8-stack', style: 'gap:10px' }, [el('div', { class: 'w8-grid w8-three' }, kinds), contractBox, el('div', { style: 'display:flex;gap:9px;flex-wrap:wrap' }, [...buttons, reset]), table]));
      const render = (st) => {
        body.dataset.state = String(st);
        kinds.forEach((k, i) => { show(k, st > i); });
        show(contractBox, st >= 4); rows.forEach((row) => show(row, st >= 5));
        buttons.forEach((b, i) => { b.disabled = st !== i; });
        if (st >= 1 && st <= 3) glow(api, kinds[st - 1]);
        if (st === 4) glow(api, contractBox, '199,166,255');
        if (st === 5 && api.motion) rows.forEach((row, i) => changePulse(api, row, i * 120));
      };
      buttons.forEach((b, i) => b.addEventListener('click', () => render(i + 1))); reset.addEventListener('click', () => render(0));
      body.reset = () => render(0); body.reset();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.append(el('h3', {}, 'Before and during execution'), el('div', { class: 'print-columns', style: 'grid-template-columns:1fr 1fr 1fr' }, KINDS.map((k) => el('div', {}, [el('b', {}, `${BR[k].label} · ${BR[k].when}`), el('p', {}, `${BR[k].does} ${BR[k].finds}`)]))),
        el('h3', {}, 'A contract still answers to the requirement'), list(TF.contract.map((c) => `${c.kind}: ${c.text}. Justified by ${c.from}.`)),
        el('h3', {}, 'Claim, evidence, remaining uncertainty'), el('table', { class: 'w8-table w8-table--tight' }, [el('thead', {}, el('tr', {}, [el('th', {}, 'Claim'), el('th', {}, 'Evidence'), el('th', {}, 'What stays open')])), el('tbody', {}, TF.claims.map((c) => el('tr', {}, [el('th', { scope: 'row' }, c.claim), el('td', {}, c.evidence), el('td', {}, c.remaining)])))]));
    },
  };

  const SCENES = [friendly, partition, scope, oracle, properties, coverage, repeatable, feedback];
  SCENES.forEach(instantConditionChange);
  const CHECKS = [   // plan Section 8, questions 1 to 5, and the answered transfer question (fixtures transfer_checks.w08)
    { q: 'Which two cases distinguish an inclusive 120-minute limit from no upper limit?', a: '120 must be accepted and 121 rejected, under otherwise valid conditions.' },
    { q: 'Do adjacent intervals overlap under the course rule?', a: 'No. The end of one may equal the start of the next because the intervals are half-open.' },
    { q: 'Why test the storage boundary as well as the overlap function?', a: 'Correct local arithmetic alone does not protect the invariant against concurrent operations.' },
    { q: 'Why can implementation and test agree while both are wrong?', a: 'They may share the same mistaken assumption or calculate the expected result using the defective logic.' },
    { q: 'Does a controlled test double establish that the real provider honors its contract?', a: 'No. It isolates a claim; evidence at the real boundary is still needed.' },
    { q: TRANSFER.question, a: TRANSFER.answer },
  ];
  const principles = {
    kind: 'page', id: 'principles', heading: 'Eight principles, six checks',
    lead: 'Decide your answer, then open each check. The final question applies the same reasoning outside room booking.', printRole: 'Principles and checks',
    build(body, api) {
      const attrs = (sc) => (api.record ? { class: 'principle-card', role: 'link', tabindex: '0', onclick: () => { location.hash = `#/${sc.id}`; }, onkeydown: (e) => { if (e.key === 'Enter') location.hash = `#/${sc.id}`; }, style: 'text-decoration:none;color:inherit;padding:9px 15px;cursor:pointer' }
        : { class: 'principle-card', href: `#/${sc.id}`, style: 'text-decoration:none;color:inherit;padding:9px 15px' });
      const cards = el('div', { class: 'principle-grid', style: 'gap:9px' }, SCENES.map((sc, i) => cue(api, el('a', attrs(sc), [el('span', { class: 'pc-num' }, `${i + 1} · ${sc.role}`), el('span', { class: 'pc-text', style: 'font-size:17.5px' }, sc.principle), el('span', { class: 'pc-short', style: 'font-size:15.5px' }, sc.principleShort)]), `principle-${i + 1}`)));
      const qa = el('ol', { class: 'qa-list', style: 'margin-top:8px;grid-template-columns:1fr 1fr 1fr;max-width:1650px' }, CHECKS.map((item, i) => {
        const answerNode = el('p', { class: 'qa-a', id: `w8-answer-${i + 1}`, hidden: '', style: 'font-size:15.5px;line-height:1.26' }, item.a);
        const button = cue(api, el('button', { type: 'button', class: 'qa-q', 'aria-expanded': 'false', 'aria-controls': answerNode.id, style: 'font-size:17.5px' }, [el('span', {}, `${i + 1}. ${item.q}`), el('span', { class: 'tw', 'aria-hidden': 'true' }, '+')]), `question-${i + 1}`);
        button.addEventListener('click', () => { const open = button.getAttribute('aria-expanded') === 'true'; button.setAttribute('aria-expanded', String(!open)); answerNode.hidden = open; });
        return el('li', { class: 'qa-item', style: 'padding:5px 12px' }, [button, answerNode]);
      }));
      body.append(cards, qa);
      body.reset = () => body.querySelectorAll('.qa-q').forEach((button) => { button.setAttribute('aria-expanded', 'false'); document.getElementById(button.getAttribute('aria-controls')).hidden = true; });
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.append(el('h3', {}, 'Principles'), el('div', { class: 'principle-grid' }, SCENES.map((sc, i) => el('div', { class: 'principle-card' }, [el('span', { class: 'pc-num' }, String(i + 1)), el('span', { class: 'pc-text' }, sc.principle), el('span', { class: 'pc-short' }, `In short: ${sc.principleShort}`), el('span', { class: 'pc-id' }, `${FILE}#/${sc.id}`)]))),
        el('h3', {}, 'Checks: decide before reading the answer'), el('ol', { class: 'print-qa' }, CHECKS.map((item, i) => el('li', {}, [el('span', { class: 'q' }, `${i + 1}. ${item.q}`), el('span', { class: 'a' }, item.a)]))));
    },
  };
  const TERMS = [
    ['Test case', 'One input with one expected result.'],
    ['Boundary case', 'A value at the edge where the expected answer changes.'],
    ['Partition', 'A group of inputs that share one expected answer.'],
    ['Assertion', 'A statement a check compares with the actual result.'],
    ['Unit check', 'A check of one small piece, such as a pure function.'],
    ['Integration check', 'A check of real parts working together.'],
    ['End-to-end check', 'A check of a complete user journey.'],
    ['Test double', 'A controlled stand-in for a real dependency.'],
    ['Contract check', 'A check of one side against what the other side expects.'],
    ['Exploratory testing', 'Choosing the next check from what you just observed.'],
    ['Regression check', 'A check that keeps a fixed defect from coming back.'],
    ['Test oracle', 'The basis for an expected result.'],
    ['Property', 'A statement that should hold for many inputs.'],
    ['Counterexample', 'An input that shows a property failing.'],
    ['Shrinking', 'Reducing a failing input to a smaller one that still fails.'],
    ['Fuzzing', 'Feeding generated input to find crashes and odd behavior.'],
    ['Coverage', 'A measure of which code ran during the checks.'],
    ['Mutation', 'A deliberate change to see whether the checks notice.'],
    ['Flaky check', 'A check whose result changes with no change in the code.'],
    ['Test-first', 'Writing the check before the code it checks.'],
  ];
  const SOURCES = [
    ['S01', 'IEEE Computer Society · SWEBOK', 'https://www.computer.org/education/bodies-of-knowledge/software-engineering'],
    ['S02', 'ACM / IEEE-CS / AAAI · CS2023 final report', 'https://csed.acm.org/final-report/'],
    ['S11', 'Hypothesis · property-based testing', 'https://hypothesis.readthedocs.io/en/latest/'],
    ['S12', 'Stryker · mutant states and metrics', 'https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/'],
    ['S40', 'Software Engineering at Google · testing overview', 'https://abseil.io/resources/swe-book/html/ch11.html'],
    ['S60', 'ISTQB Foundation syllabus · exploratory testing', 'https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf'],
    ['S64', 'Pact · contract testing', 'https://docs.pact.io/'],
  ];
  const PRACTICE = 'pytest and JUnit run example checks. Hypothesis generates property-based cases. Stryker and mutmut run mutation analysis. coverage.py measures executed lines. Playwright drives complete browser journeys. Pact checks a consumer’s expectations against a provider.';
  const CARRIED = ['Expected results derived from the requirement, independent of the code.', 'Explicit invariants such as R-01, written as properties you can check.', 'Controlled clocks and doubles, so a red check means something.'];
  const sources = {
    kind: 'page', id: 'sources', heading: 'The checks challenge the behavior. What if the input cannot be trusted?',
    lead: 'Week 9 asks what is permitted, which data may cross a boundary, and what happens when a dependency fails.', printRole: 'Handoff, terminology, sources',
    build(body, api) {
      const left = el('div', { class: 'w8-stack' }, [
        cue(api, el('div', { class: 'handoff', style: 'font-size:25px;padding:15px 20px' }, [el('span', { class: 'muted', style: 'font-size:17px;display:block;margin-bottom:8px' }, 'Week 9 starts from this question:'), TF.handoff]), 'handoff'),
        cue(api, card([title('What carries forward'), list(CARRIED, { class: 'w8-small', style: 'display:flex;flex-direction:column;gap:7px' })]), 'carried-forward'),
        cue(api, card([title('In practice · examples from 2026'), el('p', { class: 'w8-small' }, PRACTICE)]), 'in-practice'),
      ]);
      const middle = cue(api, card([title('Terms used this week'), el('dl', { class: 'term-list', style: 'display:block;column-count:2;column-gap:18px;font-size:14.5px;line-height:1.22' }, TERMS.map(([term, meaning]) => el('div', { style: 'break-inside:avoid;margin-bottom:6px' }, [el('dt', {}, term), el('dd', {}, meaning)])))]), 'terms');
      middle.style.alignSelf = 'start';
      const right = cue(api, card([title('Sources for this lecture'), el('ul', { class: 'source-list', style: 'font-size:15px;gap:9px' }, SOURCES.map(([key, name, url]) => el('li', {}, [el('span', { class: 'key' }, key), el('span', {}, [name, ' ', el(api.record ? 'span' : 'a', api.record ? { class: 'url', style: 'font-size:12.5px' } : { class: 'url', href: url, style: 'font-size:12.5px' }, url)])])))]), 'sources');
      right.style.alignSelf = 'start';
      body.append(el('div', { class: 'w8-grid', style: 'grid-template-columns:490px minmax(0,1fr) 450px;gap:20px;height:100%' }, [left, middle, right]));
    },
    print(body) {
      body.append(el('div', { class: 'print-columns' }, [
        el('div', {}, [el('h3', {}, 'Week 9 starts here'), el('p', { class: 'handoff', style: 'font-size:20px' }, TF.handoff), el('h3', {}, 'What carries forward'), list(CARRIED), el('h3', {}, 'In practice · examples from 2026'), el('p', {}, PRACTICE), el('h3', {}, 'Sources'), el('ul', { class: 'source-list', style: 'font-size:12px;gap:5px' }, SOURCES.map(([key, name, url]) => el('li', {}, [el('span', { class: 'key' }, key), el('span', {}, [name, ' ', el('span', { class: 'url', style: 'font-size:10.5px' }, url)])])))]),
        el('div', {}, [el('h3', {}, 'Terms used this week'), el('dl', { class: 'term-list', style: 'display:block;column-count:2;column-gap:16px' }, TERMS.map(([term, meaning]) => el('div', { style: 'break-inside:avoid;margin-bottom:7px' }, [el('dt', {}, term), el('dd', {}, meaning)])))]),
      ]));
    },
  };
  window.lecture.deck({
    week: 8, file: FILE, title: 'Testing behavior and building credible evidence', question: WEEK_Q,
    coverLead: 'Student notes for lecture 8. Find the boundary a friendly example hides, group inputs and test their edges, match each check to what it can observe, explore a journey, derive expected results independently, state properties and reduce a counterexample, compare executed code with checked code, control the clock, and let a check guide a change.',
    coverNote: 'Campus Rooms is a fictional teaching example, and its clock readings, delays and test runs are simulated. The 90-minute trial is temporary; the canonical 30-to-120-minute inclusive range stays in force. Code is Python-like pseudocode.',
    pages: [opening, outcomes, { kind: 'scene', scene: friendly }, { kind: 'scene', scene: partition }, { kind: 'scene', scene: scope }, explore,
      { kind: 'scene', scene: oracle }, { kind: 'scene', scene: properties }, { kind: 'scene', scene: coverage }, { kind: 'scene', scene: repeatable }, { kind: 'scene', scene: feedback }, evidence,
      principles, sources],
  });
})();
