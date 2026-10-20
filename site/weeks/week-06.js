/* =====================================================================
   Week 06 · Architecture, interactions, and distributed failure
   Central question: What changes when a dependency becomes slow, unavailable, or uncertain?

   Every component name, rule, request, stored value, operation key, contract field and judgment
   below is read from the fixtures (plan/assets/demo-fixtures.json → assets/fixtures/demo-fixtures.js,
   keys w06/*). The interleavings of scene 4 and the key handler of scene 5 are executable fixture
   snippets recomputed by plan/tools/check_plan.py; the deck shows their code and their recorded results.
   Scene identifiers come from plan/plan_manifest.json and never change.
   The shell (shared/lecture-controls.js) owns navigation, the control contract, modes and print;
   this file defines content and scenes.
   Layout: the stage is 1264 x 680 design pixels left of the rail; pages keep the bottom-right
   corner (x >= 1664, y >= 696) free where they can.
   ===================================================================== */
(function () {
  'use strict';
  const F = window.CAMPUS_ROOMS_FIXTURES;
  const A = F.anchors;
  const { el, s, text, arrow, chip } = window.VC;
  const CASE = F.case;
  const ARI = CASE.users[0];   // U-01 Ari
  const BO = CASE.users[1];    // U-02 Bo
  const BK = CASE.booking;     // B-001, owned by U-01, C101 10:00-11:00, Confirmed
  const FILE = 'week-06.html';
  const AZ = A['w06/architecture-zoom'];
  const RJ = A['w06/request-journey'];
  const MS = A['w06/monolith-and-services'];
  const CB = A['w06/concurrent-booking'];
  const RI = A['w06/retry-and-idempotency'];
  const AS = A['w06/async-and-consistency'];
  const CE = A['w06/contracts-and-evolution'];
  const AD = A['w06/architecture-decision'];
  const TRANSFER = F.transfer_checks.w06;
  const DUR = CASE.duration_minutes;
  const LEVELS = AZ.levels;
  const LV = Object.fromEntries(LEVELS.map((l) => [l.id, l]));
  const WORKER = AZ.separate_worker;
  const RQ = CB.requests;
  const OPEN = RI.opening;
  const ANS = RI.answers_page;
  const REC = AD.record;
  const N1 = RJ.pending_notification;   // N-001 for B-001
  const KEY = RI.operation_key;         // K1 and its scope
  const OPREC = RI.operation_record;

  // ------------------------------------------------------------------ helpers shared by the pages
  const reveal = (attrs) => Object.assign({ class: 'rv rv--rise' }, attrs);
  const upper1 = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  const KEEP_CASE = new Set(['Ari', 'Bo', 'Booking', 'Policy', 'Room', 'Notification', 'Storage', 'Identity', 'Mail', 'Campus', 'OpenAPI', 'PostgreSQL', 'HTTP', 'RabbitMQ', 'Kafka', 'Docker', 'C4']);
  /** Lowercase the first letter for use inside a sentence, unless the first word is a name or an identifier. */
  const lower1 = (str) => {
    const first = String(str).split(/[\s,.:;·]/)[0];
    if (KEEP_CASE.has(first) || /\d/.test(first) || (first.length > 1 && first === first.toUpperCase())) return str;
    return str.charAt(0).toLowerCase() + str.slice(1);
  };
  const listAnd = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
  const cardTitle = (str, extra) => el('div', { class: 'card-title', style: `margin-bottom:6px;${extra || ''}` }, str);
  const showIf = (n, on) => { if (n) n.classList.toggle('is-shown', !!on); };
  const focusIf = (n, on) => { if (n) n.classList.toggle('is-focus', !!on); };
  const dimIf = (n, on) => { if (n) n.classList.toggle('is-dim', !!on); };
  const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const toMin = (str) => { const [h, m] = str.split(':').map(Number); return h * 60 + m; };
  const span = (a, b) => `${a} to ${b}`;
  const mark = (ok) => el('span', { class: `w6-mark ${ok === true ? 'is-ok' : ok === false ? 'is-bad' : 'is-diff'}`, 'aria-hidden': 'true' }, ok === true ? '✓' : ok === false ? '✕' : '~');
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
  /** One line of Python-like pseudocode with light coloring: keywords, strings, numbers, comments. */
  const KW = new Set(['def', 'return', 'if', 'not', 'and', 'or', 'for', 'in', 'class', 'else', 'elif', 'is', 'None', 'True', 'False', 'with']);
  function codeLine(src) {
    const frag = [];
    const comment = src.trimStart().startsWith('#') ? src.indexOf('#') : src.indexOf('  #');
    const body = comment >= 0 ? src.slice(0, comment) : src;
    body.split(/("[^"]*"|\b\d+\b|\b[A-Za-z_][A-Za-z0-9_]*\b|\s+|[^\sA-Za-z0-9_"]+)/).forEach((part) => {
      if (!part) return;
      if (part.startsWith('"')) frag.push(el('span', { class: 'str' }, part));
      else if (/^\d+$/.test(part)) frag.push(el('span', { class: 'num' }, part));
      else if (KW.has(part)) frag.push(el('span', { class: 'kw' }, part));
      else frag.push(document.createTextNode(part));
    });
    if (comment >= 0) frag.push(el('span', { class: 'cm' }, src.slice(comment)));
    return frag;
  }
  /** A code card whose lines can be focused one by one. */
  function codeCard(api, src, opts = {}) {
    const lines = src.replace(/\n$/, '').split('\n');
    const rows = lines.map((ln, i) => el('div', { class: 'w6-line', 'data-line': String(i + 1) }, [
      el('span', { class: 'w6-ln', 'aria-hidden': 'true' }, String(i + 1)), el('span', { class: 'w6-src' }, ln ? codeLine(ln) : ' '),
    ]));
    const root = el('div', { class: `w6-code${opts.cls ? ` ${opts.cls}` : ''}`, role: 'group', 'aria-label': opts.label || 'Pseudocode' }, rows);
    if (opts.cue) api.cue(root, opts.cue);
    if (opts.lineCues) rows.forEach((r, i) => api.cue(r, `${opts.lineCues}-${i + 1}`));
    root.rows = rows;
    root.focusLines = (ns, cls = 'is-focus') => rows.forEach((r, i) => r.classList.toggle(cls, ns.includes(i + 1)));
    return root;
  }
  /** The last function of a fixture snippet (the helper it calls, such as overlaps, is named in the caption). */
  function snippetMain(entry, fn) {
    const sn = entry.snippets.find((x) => x.function === fn);
    if (!sn) throw new Error(`fixture snippet ${fn} is missing`);
    const parts = sn.code.split(/\n(?=def )/);
    return { code: parts[parts.length - 1], snippet: sn };
  }
  /** A small database cylinder in SVG (x, y top-left). */
  function cylinder(g, x, y, w, h, cls) {
    const e = h * 0.18;
    g.appendChild(s('path', { class: cls || '', d: `M${x},${y + e} A${w / 2},${e} 0 0 1 ${x + w},${y + e} V${y + h - e} A${w / 2},${e} 0 0 1 ${x},${y + h - e} Z` }));
    g.appendChild(s('path', { class: cls || '', d: `M${x},${y + e} A${w / 2},${e} 0 0 0 ${x + w},${y + e}`, fill: 'none' }));
  }
  /** A labeled box group for the architecture drawings: kind store | box | ext | person-like chip. Returns <g> with .box. */
  function archBox(o) {
    const g = s('g', { class: `w6-ab w6-ab--${o.kind || 'box'} fx dm${o.cls ? ` ${o.cls}` : ''}`, transform: `translate(${o.x} ${o.y})` });
    if (o.kind === 'store') cylinder(g, 0, 0, o.w, o.h, 'w6-ab-shape');
    else g.appendChild(s('rect', { class: 'w6-ab-shape', width: o.w, height: o.h, rx: o.r == null ? 12 : o.r, ry: o.r == null ? 12 : o.r }));
    const lines = Array.isArray(o.label) ? o.label : [o.label];
    const kindH = o.kindLabel ? 18 : 0, subH = o.sub ? 20 : 0;
    const lh = o.lh || 22;
    const total = kindH + lines.length * lh + subH;
    let y = o.h / 2 - total / 2 + (o.kind === 'store' ? 6 : 0);
    if (o.kindLabel) { g.appendChild(text(o.w / 2, y + 13, o.kindLabel, { class: 'w6-ab-kind', 'text-anchor': 'middle' })); y += kindH; }
    lines.forEach((ln, i) => g.appendChild(text(o.w / 2, y + lh * (i + 1) - 5, ln, { class: 'w6-ab-label', 'text-anchor': 'middle' })));
    y += lines.length * lh;
    if (o.sub) { g.sub = text(o.w / 2, y + 15, o.sub, { class: 'w6-ab-sub', 'text-anchor': 'middle' }); g.appendChild(g.sub); }
    g.box = { x: o.x, y: o.y, w: o.w, h: o.h, cx: o.x + o.w / 2, cy: o.y + o.h / 2 };
    return g;
  }
  /** A pulse of light on an element (registered work; nothing in record mode moves on its own afterwards). */
  const glow = (api, node, rgb, times) => (api.motion ? api.animate(node, [{ filter: `drop-shadow(0 0 0 rgba(${rgb},0))` }, { filter: `drop-shadow(0 0 20px rgba(${rgb},0.95))` }, { filter: `drop-shadow(0 0 0 rgba(${rgb},0))` }], { duration: 1000, iterations: times || 1, easing: 'ease-out' }) : null);
  const GOLD = '255,209,102', GREEN = '111,220,154', RED = '255,139,123', BLUE = '124,196,255';
  /** Every box and person of a drawing gets its own pointer target, `<prefix>-<label>` (unique within the deck). */
  function cueDrawing(api, root, prefix) {
    const used = new Set();
    root.querySelectorAll('.w6-ab, .n-person').forEach((g) => {
      const lbl = [...g.querySelectorAll('.w6-ab-label, .n-label')].map((n) => n.textContent).join(' ');
      let name = `${prefix}-${slug(lbl)}`;
      for (let k = 2; used.has(name); k += 1) name = `${prefix}-${slug(lbl)}-${k}`;
      used.add(name);
      api.cue(g, name);
    });
  }

  /** The booking screen of a person, with a status line that render() changes. */
  function bookingScreen(api, opts) {
    const st = el('div', { class: 'w6-status w6-status--idle', role: 'status' }, [el('span', { class: 'w6-status-ico', 'aria-hidden': 'true' }, '·'), el('span', { class: 'w6-status-t' }, opts.idle || 'Ready'), el('span', { class: 'w6-status-sub' }, '')]);
    const fields = el('div', { style: 'display:flex;gap:10px' }, [window.VC.field('Room', opts.room, { style: 'flex:1' }), window.VC.field('Time', span(opts.start, opts.end), { style: 'flex:1.7' })]);
    const b = window.VC.browser({ url: opts.url || 'campus-rooms.example/book', who: opts.who, cls: `w6-screen${opts.cls ? ` ${opts.cls}` : ''}`, label: opts.label || `Booking screen of ${opts.who}`, body: [fields, opts.extra || null, st].filter(Boolean) });
    if (opts.cue) api.cue(b, opts.cue);
    b.statusEl = st;
    b.setStatus = (kind, t, sub) => {
      st.className = `w6-status w6-status--${kind}`;
      st.firstChild.textContent = kind === 'ok' ? '✓' : kind === 'bad' ? '✕' : kind === 'unknown' ? '?' : kind === 'wait' ? '…' : '·';
      st.children[1].textContent = t;
      st.children[2].textContent = sub || '';
    };
    return b;
  }

  // =====================================================================
  // PAGE · opening situation: a booking with no answer
  // =====================================================================
  const QUESTIONS = [
    { q: 'What does a box on an architecture diagram stand for?', scenes: '1' },
    { q: 'Which dependency does a request wait for, and which failures reach the user?', scenes: '2–3' },
    { q: 'How can two sensible requests break one shared rule?', scenes: '4' },
    { q: 'What do you know after a timeout, and how do you retry safely?', scenes: '5–6' },
    { q: 'How do contracts and decisions keep these promises over time?', scenes: '7–8' },
  ];
  const WEEK_Q = 'What changes when a dependency becomes slow, unavailable, or uncertain?';
  const OREQ = OPEN.request;
  const opening = {
    kind: 'page', id: 'opening', role: 'page',
    heading: `${ARI.name} presses Book. No answer comes back. Is the room booked?`,
    lead: `${ARI.name} (${ARI.id}) books room ${OREQ.room} from ${OREQ.start} to ${OREQ.end} in Campus Rooms. Watch what reaches the screen, then look at what happened inside.`,
    printRole: 'Opening situation',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const bookBtn = api.cue(el('button', { type: 'button', class: 'btn-reserve w6-book' }, `Book ${OREQ.room}`), 'book');
      const screen = bookingScreen(api, { who: `${ARI.name} (${ARI.id})`, room: OREQ.room, start: OREQ.start, end: OREQ.end, extra: bookBtn, cue: 'screen', idle: 'Not sent yet' });
      // the path of the request: browser → Campus Rooms → database, and the response back
      const W = 1150, H = 236;
      const svg = window.VC.svg(W, H, { label: 'The request path: Ari\'s browser, Campus Rooms and its booking database', uid: (x) => `open-${x}` });
      const bBox = archBox({ x: 10, y: 60, w: 220, h: 92, label: 'Ari\'s browser', sub: 'campus-rooms.example', kindLabel: 'What Ari sees' });
      const cBox = archBox({ x: 470, y: 60, w: 230, h: 92, label: 'Campus Rooms', sub: 'Booking component', kindLabel: 'The service' });
      const dBox = archBox({ x: 900, y: 50, w: 230, h: 112, label: 'Booking database', sub: 'bookings', kind: 'store' });
      [bBox, cBox, dBox].forEach((g) => svg.appendChild(g));
      const reqA = arrow(svg, { from: { x: 230, y: 86 }, to: { x: 470, y: 86 }, label: 'request', kind: 'accent', labelDy: -12, cls: 'rv rv--draw' });
      const writeA = arrow(svg, { from: { x: 700, y: 106 }, to: { x: 900, y: 106 }, label: `write ${BK.id}`, kind: 'ok', labelDy: -12, cls: 'rv rv--draw' });
      const respA = arrow(svg, { from: { x: 470, y: 128 }, to: { x: 230, y: 128 }, label: 'response', kind: 'bad', dashed: true, labelDy: 30, cls: 'rv rv--draw' });
      const lostX = s('g', { class: 'rv rv--scale' }, [window.VC.markX(276, 128, 14)]);
      svg.appendChild(lostX);
      // a cover over the inside until Ari's view is replaced by the inside view
      const cover = s('g', { class: 'w6-cover-g' });
      cover.appendChild(s('rect', { x: 444, y: 14, width: 704, height: 214, rx: 18, class: 'w6-cover-rect' }));
      cover.appendChild(text(796, 112, 'Inside Campus Rooms', { class: 'w6-cover-t', 'text-anchor': 'middle' }));
      cover.appendChild(text(796, 146, `${ARI.name} cannot see in here`, { class: 'w6-cover-s', 'text-anchor': 'middle' }));
      svg.appendChild(cover);
      const wait = s('g', { class: 'rv rv--rise' }, [text(350, 196, 'no answer in time', { class: 'w6-svg-note w6-svg-note--warn', 'text-anchor': 'middle' })]);
      svg.appendChild(wait);
      const marks = OPEN.inside.map((t, i) => {
        const g = s('g', { class: 'rv rv--rise' });
        const x = [585, 1015, 350][i], y = [196, 196, 226][i];
        g.appendChild(text(x, y, `${i < 2 ? '✓' : '✕'} ${t}`, { class: `w6-svg-note ${i < 2 ? 'w6-svg-note--ok' : 'w6-svg-note--bad'}`, 'text-anchor': 'middle' }));
        svg.appendChild(g);
        return g;
      });
      cueDrawing(api, svg, 'path');
      marks.forEach((m, i) => api.cue(m, `inside-${i + 1}`));
      api.cue(lostX, 'lost');
      const pathCard = api.cue(el('div', { class: 'card', style: 'padding:6px 10px 2px' }, [svg]), 'path');
      svg.style.height = `${H}px`;
      const lookBtn = api.cue(el('button', reveal({ type: 'button', class: 'ctl-btn ctl-btn--step w6-big-btn rv rv--rise' }), 'Look inside Campus Rooms'), 'look-inside');
      const stored = api.cue(el('div', reveal({ class: 'card w6-stored rv rv--rise' }), [
        el('span', { class: 'w6-db-ico', 'aria-hidden': 'true' }), el('div', {}, [cardTitle('Booking database', 'margin-bottom:0;font-size:15px'),
          el('p', { class: 'w6-stored-row' }, [el('b', {}, BK.id), ` · ${ARI.name} (${BK.owner_id}) · ${BK.room_id} · ${span(BK.start, BK.end)} · `, el('b', { class: 'ok' }, BK.state)])]),
      ]), 'stored');
      const summary = api.cue(el('div', reveal({ class: 'callout callout--bad rv rv--rise', style: 'font-size:20px;line-height:1.32;padding:10px 16px' }), [
        el('b', {}, 'The write happened. The answer was lost. '), 'The timeout told Ari only one thing: waiting stopped.',
      ]), 'summary');
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [
        el('div', { style: 'display:grid;grid-template-columns:560px minmax(0,1fr);gap:16px;align-items:start' }, [screen, el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [lookBtn, stored])]),
        pathCard, summary,
      ]);
      const predict = api.cue(el('div', reveal({ class: 'rail-card rail-prompt rv rv--rise', style: 'padding:14px 18px' }), [
        el('div', { class: 'rail-eyebrow' }, 'Decide before you look inside'),
        el('p', { class: 'prompt-q', style: 'font-size:23px' }, `${ARI.name} sees no answer. Is ${OREQ.room} booked for ${ARI.name}?`),
        el('ul', { class: 'prompt-options', style: 'margin-top:8px;gap:6px' }, ['No: an error means nothing was saved', 'Yes: Campus Rooms always saves first', `${ARI.name} cannot tell from this screen`].map((o, i) => api.cue(el('li', { style: 'font-size:19px;padding:6px 10px' }, [el('span', { class: 'opt-key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)), el('span', {}, o)]), `option-${i + 1}`))),
      ]), 'predict');
      const question = api.cue(el('div', reveal({ class: 'rail-card rv rv--rise', style: 'padding:14px 18px;border-color:var(--accent)' }), [
        el('div', { class: 'rail-eyebrow' }, 'The question of this week'),
        el('p', { class: 'prompt-q', style: 'font-size:23px;font-weight:600;line-height:1.3' }, WEEK_Q),
      ]), 'question');
      const qrows = QUESTIONS.map((row, i) => api.cue(el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:4px 0;border-top:1px solid var(--line)' }, [
        el('b', { style: 'font-size:16.5px;line-height:1.25' }, row.q), chip(`scene${row.scenes.length > 1 ? 's' : ''} ${row.scenes}`, 'accent', { style: 'font-size:14.5px;padding:2px 10px' }),
      ]), `question-${i + 1}`));
      const five = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px 8px;display:flex;flex-direction:column' }), [cardTitle('Five questions this lecture answers', 'margin-bottom:2px;font-size:16px'), ...qrows]), 'five');
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0;position:relative' }, [predict, question, five]);   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:1150px minmax(0,1fr);gap:26px;align-items:start;height:100%' }, [left, right]));
      const apply = () => {
        const st = Number(body.getAttribute('data-state'));
        if (st === 0) screen.setStatus('idle', 'Not sent yet', '');
        else if (st === 1) screen.setStatus('unknown', 'No answer: the request timed out', `${ARI.name} does not know whether ${OREQ.room} is booked`);
        else screen.setStatus('unknown', 'No answer: the request timed out', 'The screen has not changed. Only the inside view has.');
        showIf(reqA, st >= 1); showIf(wait, st === 1); showIf(respA, st >= 2); showIf(lostX, st >= 2); showIf(writeA, st >= 2);
        marks.forEach((m) => showIf(m, st >= 2));
        cover.style.display = st >= 2 ? 'none' : '';
        showIf(lookBtn, st >= 1); showIf(stored, st >= 2); showIf(summary, st >= 2);
        showIf(predict, st === 1);
        predict.style.display = st === 1 ? '' : 'none';
        showIf(question, st >= 2); showIf(five, st >= 2);
        question.style.display = st >= 2 ? '' : 'none';
        five.style.display = st >= 2 ? '' : 'none';
        bookBtn.setAttribute('aria-disabled', st >= 1 ? 'true' : 'false');
        lookBtn.setAttribute('aria-disabled', st === 1 ? 'false' : 'true');
        if (st === 2) glow(api, stored, GREEN, 1);
      };
      bookBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '0') { body.setAttribute('data-state', '1'); apply(); } });
      lookBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '1') { body.setAttribute('data-state', '2'); apply(); } });
      body.reset = () => { body.setAttribute('data-state', '0'); apply(); };
      apply();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('h3', {}, 'What Ari sees'),
          el('p', {}, `${ARI.name} (${ARI.id}) books ${OREQ.room} from ${OREQ.start} to ${OREQ.end}. ${upper1(OPEN.screen)}.`),
          el('h3', {}, 'Decide first'),
          el('p', {}, `Is ${OREQ.room} booked for ${ARI.name}? (A) No: an error means nothing was saved. (B) Yes: Campus Rooms always saves first. (C) ${ARI.name} cannot tell from this screen.`),
          el('h3', {}, 'What happened inside'),
          el('ul', {}, OPEN.inside.map((t) => el('li', {}, `${upper1(t)}.`))),
          el('p', {}, `The booking database holds ${BK.id}: ${ARI.name} (${BK.owner_id}), ${BK.room_id}, ${span(BK.start, BK.end)}, ${BK.state}. The write happened; the answer was lost. The timeout told ${ARI.name} only that waiting stopped.`),
        ]),
        el('div', {}, [
          el('h3', {}, 'The question of this week'), el('p', {}, WEEK_Q),
          el('h3', {}, 'Five questions this lecture answers'),
          el('ul', {}, QUESTIONS.map((row) => el('li', {}, `${row.q} (scene${row.scenes.length > 1 ? 's' : ''} ${row.scenes})`))),
        ]),
      ]));
    },
  };

  // =====================================================================
  // PAGE · recall and outcomes
  // =====================================================================
  const OUTCOMES = [
    'Distinguish a module boundary from a process or deployment boundary.',
    'Read context, component, and runtime views at an appropriate level.',
    'Explain how a concurrent check-then-write can violate a shared invariant.',
    'Distinguish timeout, failure, and unknown outcome.',
    'Compare synchronous and asynchronous interactions, including their costs.',
  ];
  const W5_CARRIED = 'Modules with one responsibility each, contracts that include failure behavior, and a decision record with revisit triggers.';
  const COMPONENTS = LV.components.elements.map((c) => [c.name, c.role]);
  const OUTSIDE = LV.context.elements.filter((e) => e.kind === 'external').map((e) => [e.name, e.role]);
  const RULES = [
    ['R-01', 'No overlapping confirmed bookings for the same room; 10:00 to 11:00 and 11:00 to 12:00 only touch.'],
    ['R-02', `A booking lasts ${DUR.min} to ${DUR.max} minutes, both included.`],
    ['R-04', 'A failed notification never undoes a confirmed booking; pending email stays visible and recoverable.'],
  ];
  const outcomes = {
    kind: 'page', id: 'outcomes', role: 'page',
    heading: 'What you already know, and where this lecture goes',
    lead: WEEK_Q,
    printRole: 'Recall and outcomes',
    build(body, api) {
      const recall = api.cue(el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:6px;padding:12px 18px' }, [
        cardTitle('From Week 5: carried forward', 'margin-bottom:0'),
        el('p', { style: 'font-size:20px;line-height:1.35' }, el('i', {}, W5_CARRIED)),
        el('p', { class: 'muted', style: 'font-size:17px;line-height:1.3' }, 'Week 5 drew boundaries inside the code. This week those parts run, wait for each other and fail separately.'),
      ]), 'recall');
      const cast = api.cue(el('div', { class: 'card', style: 'padding:12px 18px;display:flex;flex-direction:column;gap:4px' }, [
        cardTitle('Campus Rooms: its components and two outside systems', 'margin-bottom:2px'),
        ...COMPONENTS.map(([n, r]) => api.cue(el('div', { class: 'w6-castrow' }, [el('span', { class: 'w6-comp' }, n), el('span', {}, r)]), `component-${slug(n)}`)),
        ...OUTSIDE.map(([n, r]) => api.cue(el('div', { class: 'w6-castrow' }, [el('span', { class: 'w6-comp w6-comp--ext' }, n), el('span', {}, r)]), `outside-${slug(n)}`)),
      ]), 'components');
      const rules = api.cue(el('div', { class: 'card', style: 'padding:12px 18px;display:flex;flex-direction:column;gap:4px' }, [
        cardTitle('Rules this lecture uses', 'margin-bottom:2px'),
        ...RULES.map(([k, t]) => api.cue(el('div', { style: 'display:grid;grid-template-columns:62px minmax(0,1fr);gap:10px;align-items:baseline;font-size:18px;line-height:1.3' }, [el('b', { style: 'color:var(--violet)' }, k), el('span', {}, t)]), `rule-${k.toLowerCase()}`)),
      ]), 'rules');
      const list = el('ol', { class: 'outcome-list', 'aria-label': 'By the end of this lecture you can', style: 'gap:10px' }, OUTCOMES.map((o, i) => el('li', { style: 'font-size:22px;padding:9px 14px' }, [el('span', { class: 'n', 'aria-hidden': 'true' }, String(i + 1)), el('span', {}, o)])));
      api.cue(list, 'outcomes');
      const right = el('div', {}, [cardTitle('By the end of this lecture you can'), list]);   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { class: 'page-columns', style: 'grid-template-columns:minmax(0,1fr) 800px' }, [el('div', { style: 'display:flex;flex-direction:column;gap:12px' }, [recall, cast, rules]), right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('h3', {}, 'From Week 5'), el('p', {}, `Carried forward: ${W5_CARRIED}`),
          el('h3', {}, 'Campus Rooms: its components and two outside systems'), el('ul', {}, [...COMPONENTS, ...OUTSIDE].map(([n, r]) => el('li', {}, `${n}: ${r}.`))),
          el('h3', {}, 'Rules this lecture uses'), el('ul', {}, RULES.map(([k, t]) => el('li', {}, `${k}: ${t}`))),
        ]),
        el('div', {}, [el('h3', {}, 'By the end of this lecture you can'), el('ol', { class: 'outcome-list' }, OUTCOMES.map((o, i) => el('li', {}, [el('span', { class: 'n' }, String(i + 1)), el('span', {}, o)])))]),
      ]));
    },
  };

  // =====================================================================
  // SCENE 1 · architecture-zoom (Bridge)
  // =====================================================================
  const TRACE = AZ.request_trace;
  const NET = (h) => h.crossing === 'network';
  const shortRole = (r) => r.split(' and ')[0];
  /** Move a token along SVG paths one after another; onHop(i) runs when hop i arrives. Registered work. */
  function travelPaths(api, token, hops, onHop, per = 420) {
    if (!hops.length) return;
    if (!api.motion) { token.style.display = 'none'; hops.forEach((hp, i) => onHop && onHop(i)); return; }
    let i = 0;
    const run = () => {
      if (i >= hops.length) { token.style.display = 'none'; return; }
      const { path, reverse } = hops[i];
      const L = path.getTotalLength();
      let t0 = null;
      token.style.display = '';
      const frame = (t) => {
        if (t0 == null) t0 = t;
        const p = Math.min(1, (t - t0) / per);
        const e = p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2;
        const pt = path.getPointAtLength(reverse ? L * (1 - e) : L * e);
        token.setAttribute('cx', pt.x); token.setAttribute('cy', pt.y);
        if (p < 1) api.raf(frame);
        else { if (onHop) onHop(i); i += 1; api.timeout(run, 90); }
      };
      api.raf(frame);
    };
    run();
  }
  const architectureZoom = {
    id: 'architecture-zoom', role: 'bridge',
    heading: 'What does a box labeled “Booking” stand for?',
    lead: 'Three views of Campus Rooms, one level at a time: who uses it, what runs, and what each running part contains.',
    principle: 'Architecture views should state their level; logical separation does not automatically imply network separation.',
    principleShort: 'Say which level a box lives on.',
    conditions: [
      { id: 'one-application', baseline: true, label: 'Baseline: one application, one database', short: 'One application',
        states: [
          { prompt: { question: `A diagram shows one box labeled ${AZ.question_box}. What does it stand for?`, options: ['It depends on the view: each view must say its level', 'A module of code', 'A server'] }, caption: 'One box, one word. Before you answer, picture what you would point at.' },
          { caption: `**Level 1 · ${LV.context.name.toLowerCase()}.** Booking is ${LV.context.booking_means}: who uses it and what it depends on.` },
          { caption: `**Level 2 · ${LV.containers.name.toLowerCase()}.** Inside Campus Rooms: a browser app, one server application and one database. Booking is ${LV.containers.booking_means}.` },
          { caption: `**Level 3 · ${LV.components.name.toLowerCase()}.** Inside the application: Booking is ${LV.components.booking_means}.` },
          { caption: `${ARI.name}'s request: **${TRACE.hops.filter((x) => !NET(x)).length} function calls** inside one process, **${new Set(TRACE.hops.filter(NET).map((x) => (x.from === 'Browser app' ? 'Browser app' : x.to))).size} network connections** to the outside.` },
          { caption: 'Five components, one process. Five logical parts are not five servers.', principle: true },
        ] },
      { id: 'separate-worker', label: 'Changed: Notification runs in its own worker', short: 'Separate worker',
        states: [
          { prompt: { question: 'Notification moves into its own worker process. What changes for Booking and Policy?', options: ['Each now needs its own server', 'Their logic stays the same; only where Notification runs changes', 'Every booking now waits for the worker'] }, caption: 'Today all five components run inside one application.' },
          { caption: `**Containers:** a second process appears, the **${WORKER.new_container.name}**. ${upper1(WORKER.handoff)}.` },
          { caption: '**Components:** the same five responsibilities. Only Notification left the application.' },
          { caption: 'What changed is how it runs: one more process, one handoff, one new way to fail.' },
          { caption: 'Operations changed. The logic did not.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const W = 1264, H = 420;
      const svg = window.VC.svg(W, H, { label: 'Campus Rooms at three levels of detail', uid: (x) => api.uid(x), class: 'w6-zoom' });
      api.cue(svg, 'views');
      svg.style.height = '444px';
      h.svg = svg;
      h.tabs = LEVELS.map((l) => api.cue(el('div', { class: 'w6-tab', role: 'listitem' }, [el('span', { class: 'w6-tab-n' }, String(l.level)), el('span', {}, l.name)]), `level-${l.level}`));
      const tabs = el('div', { class: 'w6-tabs', role: 'list', 'aria-label': 'Levels of the views' }, h.tabs);
      const view = (key) => { const g = s('g', { class: 'w6-view', 'data-view': key }); g.uid = svg.uid; svg.appendChild(g); return g; };
      const arw = (g, from, to, o = {}) => arrow(g, Object.assign({ from, to, kind: 'default' }, o));
      h.views = {};
      // ---- state 0: one lonely box
      const gq = view('q');
      const qb = archBox({ x: 482, y: 140, w: 300, h: 130, label: AZ.question_box, sub: 'a box on a diagram', cls: 'w6-ab--q' });
      gq.appendChild(qb);
      gq.appendChild(s('circle', { cx: 782, cy: 140, r: 24, class: 'w6-qmark' }));
      gq.appendChild(text(782, 149, '?', { class: 'w6-qmark-t', 'text-anchor': 'middle' }));
      h.views.q = gq;
      cueDrawing(api, gq, 'q');
      // ---- level 1: system context
      const gc = view('ctx');
      const people = LV.context.elements.filter((e) => e.kind === 'person');
      const sysEl = LV.context.elements.find((e) => e.kind === 'system');
      const extEls = LV.context.elements.filter((e) => e.kind === 'external');
      const pp = people.map((p, i) => { const g = window.VC.person({ x: 120, y: 118 + i * 172, name: `${p.name} (${p.id})`, role: p.role }); gc.appendChild(g); return g; });
      const sys = archBox({ x: 450, y: 140, w: 340, h: 140, kindLabel: 'Software system', label: sysEl.name, sub: sysEl.role, cls: 'w6-ab--system' });
      gc.appendChild(sys);
      const exts = extEls.map((e, i) => { const g = archBox({ x: 970, y: 60 + i * 190, w: 270, h: 110, kind: 'ext', kindLabel: 'Outside system', label: e.name, sub: shortRole(e.role) }); gc.appendChild(g); return g; });
      arw(gc, { x: 154, y: 104 }, { x: 450, y: 186 });
      arw(gc, { x: 154, y: 274 }, { x: 450, y: 236 });
      arw(gc, { x: 790, y: 180 }, { x: 970, y: 120 }, { label: 'who is asking?', labelDy: -14 });
      arw(gc, { x: 790, y: 242 }, { x: 970, y: 300 }, { label: 'send email', labelDy: 30 });
      h.views.ctx = gc;
      cueDrawing(api, gc, 'ctx');
      h.sys = sys;
      // ---- level 2: containers (with and without the worker)
      const containersView = (key, worker) => {
        const g = view(key);
        const cEls = LV.containers.elements;
        g.appendChild(window.VC.boundary({ x: 300, y: 16, w: 660, h: 392, label: sysEl.name }));
        const pq = people.map((p, i) => { const pg = window.VC.person({ x: 112, y: 130 + i * 168, name: `${p.name} (${p.id})` }); g.appendChild(pg); return pg; });
        const br = archBox({ x: 330, y: 70, w: 230, h: 110, kindLabel: 'Container', label: cEls[0].name, sub: cEls[0].tech });
        const app = archBox({ x: 640, y: 70, w: 290, h: 110, kindLabel: 'Container', label: ['Campus Rooms', 'application'], sub: cEls[1].tech, lh: 25 });
        const db = archBox({ x: 430, y: 250, w: 220, h: 128, kind: 'store', label: cEls[2].name, sub: worker ? 'bookings, pending email' : 'bookings' });
        [br, app, db].forEach((b) => g.appendChild(b));
        const id = archBox({ x: 1000, y: 40, w: 240, h: 100, kind: 'ext', kindLabel: 'Outside system', label: extEls[0].name, sub: shortRole(extEls[0].role) });
        const mail = archBox({ x: 1000, y: 280, w: 240, h: 100, kind: 'ext', kindLabel: 'Outside system', label: extEls[1].name, sub: shortRole(extEls[1].role) });
        g.append(id, mail);
        arw(g, { x: 144, y: 116 }, { x: 330, y: 112 });
        arw(g, { x: 144, y: 284 }, { x: 330, y: 160 });
        arw(g, { x: 560, y: 125 }, { x: 640, y: 125 });
        arw(g, { x: 700, y: 180 }, { x: 590, y: 262 }, { label: worker ? 'writes both' : 'reads and writes', labelDy: 6, labelDx: 92 });
        arw(g, { x: 930, y: 98 }, { x: 1000, y: 92 });
        let wk = null;
        if (worker) {
          wk = archBox({ x: 730, y: 256, w: 210, h: 116, kindLabel: 'Container', label: ['Notification', 'worker'], sub: WORKER.new_container.tech.replace(/^a /, ''), cls: 'w6-ab--new', lh: 25 });
          g.appendChild(wk);
          arw(g, { x: 730, y: 314 }, { x: 650, y: 314 }, { kind: 'accent' });
          arw(g, { x: 940, y: 322 }, { x: 1000, y: 328 });
        } else arrow(g, { from: { x: 905, y: 180 }, via: [{ x: 905, y: 330 }], to: { x: 1000, y: 330 } });
        g.app = app; g.worker = wk; g.db = db;
        h.views[key] = g;
        cueDrawing(api, g, key);
        return g;
      };
      containersView('con', false);
      containersView('conW', true);
      // ---- level 3: components (with and without the worker)
      const COMP = LV.components.elements.map((c) => c.name);   // Booking, Policy, Room Catalog, Notification, Storage
      const componentsView = (key, worker) => {
        const g = view(key);
        g.appendChild(window.VC.boundary({ x: 262, y: 12, w: 548, h: worker ? 300 : 400, label: 'Campus Rooms application' }));
        if (worker) {
          const wb = window.VC.boundary({ x: 262, y: 322, w: 548, h: 90, label: WORKER.new_container.name });
          wb.classList.add('w6-boundary--new');
          g.appendChild(wb);
        }
        const id = archBox({ x: 20, y: 26, w: 200, h: 92, kind: 'ext', kindLabel: 'Outside system', label: extEls[0].name });
        const br = archBox({ x: 20, y: 150, w: 200, h: 92, kindLabel: 'Container', label: LV.containers.elements[0].name });
        const bk = archBox({ x: 300, y: 150, w: 190, h: 92, label: COMP[0], cls: 'w6-ab--hub' });
        const col = {};
        const ys = { Policy: 48, 'Room Catalog': 122, Storage: 196, Notification: worker ? 340 : 270 };
        const cyOf = (n) => ys[n] + 30;
        ['Policy', 'Room Catalog', 'Storage', 'Notification'].forEach((n) => { col[n] = archBox({ x: 560, y: ys[n], w: 230, h: 60, label: n }); });
        const db = archBox({ x: 900, y: 150, w: 220, h: 110, kind: 'store', label: LV.containers.elements[2].name, sub: worker ? 'with pending email' : '' });
        const mail = archBox({ x: 900, y: 318, w: 240, h: 88, kind: 'ext', kindLabel: 'Outside system', label: extEls[1].name });
        [id, br, bk, ...Object.values(col), db, mail].forEach((b) => g.appendChild(b));
        const ny = cyOf('Notification');
        const hops = {
          1: arw(g, { x: 220, y: 196 }, { x: 300, y: 196 }),
          2: arrow(g, { from: { x: 395, y: 150 }, via: [{ x: 395, y: 72 }], to: { x: 220, y: 72 } }),
          3: arw(g, { x: 490, y: 168 }, { x: 560, y: cyOf('Policy') }),
          4: arw(g, { x: 490, y: 212 }, { x: 560, y: cyOf('Storage') }),
          5: arw(g, { x: 790, y: cyOf('Storage') }, { x: 900, y: 205 }),
        };
        arw(g, { x: 490, y: 186 }, { x: 560, y: cyOf('Room Catalog') }, { cls: 'w6-faint' });   // Room Catalog: not on this request's path
        if (worker) hops[6] = arw(g, { x: 1000, y: 262 }, { x: 790, y: ny - 14 }, { label: 'reads pending email', labelAt: 0, labelDx: 104, labelDy: 32 });
        else hops[6] = arw(g, { x: 490, y: 230 }, { x: 560, y: ny });
        hops[7] = arw(g, { x: 790, y: ny + 8 }, { x: 900, y: 362 });
        // number badges on each hop of the trace, on the hop's line
        const mid = (a, t = 0.5) => [a.from.x + (a.to.x - a.from.x) * t, a.from.y + (a.to.y - a.from.y) * t];
        const at = { 1: mid(hops[1]), 2: [307, 72], 3: mid(hops[3]), 4: mid(hops[4]), 5: mid(hops[5]), 6: mid(hops[6], worker ? 0.72 : 0.5), 7: mid(hops[7]) };
        g.badges = {};
        TRACE.hops.forEach((hp) => {
          const net = worker && hp.n === 6 ? true : NET(hp);
          const b = s('g', { class: `w6-hopbadge ${net ? 'is-net' : 'is-call'} rv rv--scale` });
          b.appendChild(s('circle', { cx: at[hp.n][0], cy: at[hp.n][1], r: 15 }));
          b.appendChild(text(at[hp.n][0], at[hp.n][1] + 6, String(hp.n), { 'text-anchor': 'middle' }));
          g.appendChild(b);
          api.cue(b, `${key}-hop-${hp.n}`);
          g.badges[hp.n] = b;
          hops[hp.n].net = net;
        });
        g.hops = hops;
        g.col = col; g.bk = bk;
        h.views[key] = g;
        cueDrawing(api, g, key);
        return g;
      };
      componentsView('cmp', false);
      componentsView('cmpW', true);
      h.token = s('circle', { r: 10, class: 'w6-token', cx: 0, cy: 0 });
      h.token.style.display = 'none';
      svg.appendChild(h.token);
      // ---- bottom: what the word means here, the legend, and the comparison of the changed condition
      h.meansT = el('p', { class: 'w6-means' });
      h.boundT = el('p', { class: 'w6-bound' });
      h.c4 = el('p', { class: 'w6-c4 rv rv--rise' }, [el('b', {}, 'C4 container: '), lower1(LV.containers.note)]);
      h.means = api.cue(el('div', { class: 'card w6-means-card' }, [cardTitle(`What “${AZ.question_box}” means in this view`, 'margin-bottom:2px;font-size:16px'), h.meansT, h.boundT, h.c4]), 'means');
      h.legend = api.cue(el('div', { class: 'card w6-legend-card' }, [
        cardTitle('How to read the views', 'margin-bottom:4px;font-size:16px'),
        el('div', { class: 'w6-lg' }, [el('span', { class: 'w6-lg-line w6-lg-line--call' }), 'a function call inside one process']),
        el('div', { class: 'w6-lg' }, [el('span', { class: 'w6-lg-line w6-lg-line--net' }), 'a connection over the network']),
        el('div', { class: 'w6-lg' }, [el('span', { class: 'w6-lg-box' }), 'dashed outline: the part this view zooms into']),
      ]), 'legend');
      const lst = (title, items, kind) => el('div', { class: `w6-cmp-col w6-cmp-col--${kind}` }, [el('div', { class: 'w6-cmp-h' }, title), el('ul', {}, items.map((t) => el('li', {}, t)))]);
      h.compare = api.cue(el('div', { class: 'card w6-compare rv rv--rise', 'data-cond': 'separate-worker' }, [
        lst('Changed: how it runs', WORKER.changed_operationally, 'warn'), lst('The same: what it does', WORKER.same_logically, 'ok'),
      ]), 'compare');
      h.bottom = el('div', { class: 'w6-zoom-bottom' }, [h.means, h.legend]);
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:8px' }, [tabs, svg, el('div', { style: 'position:relative;flex:1;min-height:0' }, [h.bottom, h.compare])]));
      return h;
    },
    render(h, view, api) {
      const st = view.state, base = view.conditionId === 'one-application';
      const v = base ? ['q', 'ctx', 'con', 'cmp', 'cmp', 'cmp'][st] : ['cmp', 'conW', 'cmpW', 'cmpW', 'cmpW'][st];
      Object.entries(h.views).forEach(([k, g]) => { g.style.display = k === v ? '' : 'none'; });
      const lvl = { q: 0, ctx: 1, con: 2, conW: 2, cmp: 3, cmpW: 3 }[v];
      h.tabs.forEach((t, i) => { t.classList.toggle('is-now', i + 1 === lvl); t.classList.toggle('is-done', i + 1 < lvl); });
      const lv = LEVELS[lvl - 1];
      h.meansT.textContent = lv ? upper1(lv.booking_means) : 'A box, a word, and no level written next to it.';
      h.boundT.textContent = lv ? `Boundary of this view: ${lv.boundary}.` : '';
      showIf(h.c4, lvl === 2);
      const showCompare = !base && st >= 3;
      showIf(h.compare, showCompare);
      h.bottom.style.visibility = showCompare ? 'hidden' : '';
      // the trace of one request, in the components view
      ['cmp', 'cmpW'].forEach((k) => {
        const g = h.views[k];
        Object.values(g.hops).forEach((a) => { a.classList.remove('w6-hop--net', 'w6-hop--call'); a.path.setAttribute('marker-end', `url(#${h.svg.uid('arrow-default')})`); });
        Object.values(g.badges).forEach((b) => showIf(b, false));
        Object.values(g.col).concat([g.bk]).forEach((b) => b.classList.remove('is-focus'));
      });
      const g = h.views[v];
      const tracing = (base && st >= 4) || (!base && st >= 2 && v === 'cmpW');
      if (tracing) {
        const order = TRACE.hops.map((hp) => hp.n);
        const light = (n) => {
          const a = g.hops[n];
          a.classList.add(a.net ? 'w6-hop--net' : 'w6-hop--call');
          a.path.setAttribute('marker-end', `url(#${h.svg.uid(a.net ? 'arrow-accent' : 'arrow-ok')})`);
          showIf(g.badges[n], true);
        };
        const animateNow = api.motion && ((base && st === 4) || (!base && st === 2));
        if (animateNow) travelPaths(api, h.token, order.map((n) => ({ path: g.hops[n].path, reverse: false })), (i) => light(order[i]), 380);
        else order.forEach(light);
      }
      if (!base && st === 1) glow(api, h.views.conW.worker, GOLD, 2);
      if (!base && st === 0) focusIf(h.views.cmp.col.Notification, true);
      // a controlled zoom: the next view grows out of the box it details
      const ZOOM = { ctx: { from: 'q', origin: [632, 212], start: 'translate(0px,0px) scale(0.55)' },
        con: { from: 'ctx', origin: [630, 212], start: 'translate(-10px,-2px) scale(0.5)' },
        cmp: { from: 'con', origin: [536, 212], start: 'translate(249px,-87px) scale(0.42)' } };
      const z = ZOOM[v];
      if (api.motion && z && h.prev === z.from && base) {
        g.style.transformOrigin = `${z.origin[0]}px ${z.origin[1]}px`;
        api.animate(g, [{ transform: z.start, opacity: 0.15 }, { transform: 'translate(0px,0px) scale(1)', opacity: 1 }], { duration: 760, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
      }
      h.prev = v;
    },
    print: [
      { title: 'Level 1 · system context: the whole system, seen from outside', condition: 'one-application', state: 1, note: `Booking here means ${LV.context.booking_means}. People: ${listAnd(people6(LV))}. Outside systems: ${listAnd(LV.context.elements.filter((e) => e.kind === 'external').map((e) => `${e.name} (${e.role})`))}.` },
      { title: 'Level 2 · containers: what runs and what stores data', condition: 'one-application', state: 2, note: `Booking here means ${LV.containers.booking_means}. ${LV.containers.elements.map((e) => `${e.name}: ${e.role}, ${e.tech}`).join('; ')}. ${LV.containers.note}` },
      { title: 'Level 3 · components: one request traced inside the application', condition: 'one-application', state: 5, principle: true, note: `Booking here means ${LV.components.booking_means}. The numbered hops of ${ARI.name}'s request: ${TRACE.hops.map((x) => `${x.n} ${x.from} to ${x.to}, ${x.crossing}`).join('; ')}. In short: ${TRACE.summary}. Solid arrows are function calls inside one process; dashed arrows cross the network.` },
      { title: `Changed: the ${WORKER.new_container.name.toLowerCase()} as a second process`, condition: 'separate-worker', state: 3, note: `${upper1(WORKER.change)}. ${upper1(WORKER.handoff)}. Changed in how it runs: ${WORKER.changed_operationally.map(lower1).join('; ')}. The same in what it does: ${WORKER.same_logically.map(lower1).join('; ')}.` },
    ],
  };
  function people6(lv) { return lv.context.elements.filter((e) => e.kind === 'person').map((p) => `${p.name} (${p.id}), who ${p.role}`); }

  // =====================================================================
  // SCENE 2 · request-journey (Anchor)
  // =====================================================================
  const STEPS = RJ.steps;
  const SEQ_PARTS = [];
  STEPS.forEach((st) => [st.from, st.to].forEach((p) => { if (!SEQ_PARTS.includes(p)) SEQ_PARTS.push(p); }));
  const MS_OF = (n) => STEPS.find((x) => x.n === n).illustrative_ms;
  const WAIT_STEPS = RJ.user_waits_for_steps;
  const WAIT_TOTAL = WAIT_STEPS.reduce((t, n) => t + (MS_OF(n) || 0), 0);
  const OUT = RJ.outage;
  const stepLabel = (n) => { const st = STEPS.find((x) => x.n === n); return `${n} · ${st.label}`; };
  /** A sequence diagram: one lifeline per part, messages added by the scene. */
  function seqDiagram(api, prefix, label, opts = {}) {
    const W = opts.W || 820, H = opts.H || 680, PARTS = opts.parts || SEQ_PARTS, M = opts.margin || 60, HW = opts.headW || 112;
    const svg = window.VC.svg(W, H, { label, uid: (x) => api.uid(`${prefix}${x}`), class: 'w6-seq' });
    const gap = (W - 2 * M) / (PARTS.length - 1);
    const X = {}; PARTS.forEach((p, i) => { X[p] = M + i * gap; });
    const head = {};
    PARTS.forEach((p) => svg.appendChild(s('line', { x1: X[p], y1: 62, x2: X[p], y2: H - 6, class: 'w6-life' })));
    const bars = s('g', {}); svg.appendChild(bars);
    const layer = s('g', {}); layer.uid = svg.uid; svg.appendChild(layer);
    PARTS.forEach((p) => {
      const g = s('g', { class: 'w6-seq-head fx' });
      g.appendChild(s('rect', { x: X[p] - HW / 2, y: 6, width: HW, height: 56, rx: 10 }));
      const lines = opts.oneLine ? [p] : p.includes(' ') ? p.split(' ') : [p];
      lines.forEach((ln, i) => g.appendChild(text(X[p], lines.length > 1 ? 30 + i * 19 : 40, ln, { class: 'w6-seq-hl', 'text-anchor': 'middle' })));
      svg.appendChild(g);
      head[p] = g;
      api.cue(g, `${prefix}part-${slug(p)}`);
    });
    const d = { svg, X, head, layer, bars, items: [], W, H };
    /** One message; shown from state `from` on. */
    d.msg = (from, to, y, lbl, o = {}) => {
      const x1 = X[from], x2 = X[to], right = x2 > x1;
      const a = arrow(layer, { from: { x: x1 + (right ? 7 : -7), y }, to: { x: x2 + (right ? -7 : 7), y }, label: lbl, kind: o.kind || 'default', dashed: o.dashed,
        labelAt: right ? 0 : 1, labelDx: 10, labelDy: -15, labelAnchor: 'start', cls: `rv rv--draw ${o.cls || ''}` });
      d.items.push({ node: a, from: o.at, until: o.until });
      if (o.cue) api.cue(a, `${prefix}${o.cue}`);
      return a;
    };
    d.bar = (part, y1, y2, cls, at, until) => {
      const r = s('rect', { x: X[part] - 7, y: y1, width: 14, height: y2 - y1, rx: 4, class: `w6-act ${cls || ''} rv` });
      bars.appendChild(r);
      d.items.push({ node: r, from: at, until });
      return r;
    };
    d.note = (x, y, str, cls, at, until, anchor, cue) => {
      const t = s('g', { class: 'rv rv--rise' }, [text(x, y, str, { class: `w6-svg-note ${cls || ''}`, 'text-anchor': anchor || 'middle' })]);
      layer.appendChild(t);
      if (cue) api.cue(t, `${prefix}${cue}`);
      d.items.push({ node: t, from: at, until });
      return t;
    };
    d.x = (x, y, at) => { const m = s('g', { class: 'rv rv--scale' }, [window.VC.markX(x, y, 11)]); layer.appendChild(m); d.items.push({ node: m, from: at }); return m; };
    d.apply = (st) => d.items.forEach((it) => showIf(it.node, st >= it.from && (it.until == null || st <= it.until)));
    return d;
  }
  const requestJourney = {
    id: 'request-journey', role: 'anchor',
    heading: 'Follow one request across real boundaries',
    lead: `${ARI.name} (${ARI.id}) books ${RJ.request.room} from ${RJ.request.start} to ${RJ.request.end}. Request ${RJ.request_id} visits seven named parts. At each step: what is ${ARI.name} waiting for?`,
    principle: 'Interaction structure determines which failures affect which user promises.',
    principleShort: 'What you wait for decides which failures reach you.',
    conditions: [
      { id: 'normal-day', baseline: true, label: 'Baseline: every part answers', short: 'Normal day',
        states: [
          { prompt: { question: `${ARI.name} presses Book. Which steps must finish before ${ARI.name} sees Confirmed?`, options: ['Only Storage: it keeps the booking', 'Every step, including the email', 'Identity, Policy and Storage, then the answer'] }, caption: `One request, ${RJ.request_id}. Solid arrows hold up the answer; dashed arrows do not.` },
          { caption: `**1 · submit.** ${ARI.name}'s browser sends ${RJ.request_id} to Booking. From here on ${ARI.name} waits.` },
          { caption: `**2 · Identity** checks who is asking: ${MS_OF(2)} ms in this illustration. ${ARI.name} is still waiting.` },
          { caption: `**3 · Policy** checks the duration and the interval: ${MS_OF(3)} ms.` },
          { caption: `**4 · Storage** makes the authoritative decision: no overlap, so **${BK.id}** is stored as Confirmed. ${MS_OF(4)} ms.` },
          { caption: `**5 · Confirmed** reaches ${ARI.name}: ${WAIT_TOTAL} ms in total, all illustrative. ${ARI.name} waited for steps 1 to 5.` },
          { caption: `**6 ·** after the answer, Booking records **${N1.id}** as pending. ${ARI.name} is not waiting for it.` },
          { caption: `**7 ·** Notification hands ${N1.id} to the mail provider: delivered later.` },
          { caption: 'Steps 1 to 5 hold up the answer. Steps 6 and 7 continue after it.' },
        ] },
      { id: 'wait-for-email', label: 'Changed: mail down, the email comes first', short: 'Mail down · email first',
        states: [
          { prompt: { question: `The mail provider is down. This design sends the email before answering. What does ${ARI.name} see?`, options: ['No answer: an unknown outcome', 'Confirmed, a little later', 'A clear Rejected'] }, caption: 'Same request. One change: the email now comes before the answer.' },
          { caption: `Steps 1 to 4 succeed: **${OUT.wait_for_email.storage}** is stored.` },
          { caption: 'Booking now waits for the email, and the mail provider never answers.' },
          { caption: `${ARI.name}'s browser stops waiting: **${OUT.wait_for_email.user_sees}**. Storage still says Confirmed.` },
          { caption: `An email outage reached the booking answer: ${OUT.wait_for_email.consequence}.`, principle: true },
        ] },
      { id: 'record-separately', label: 'Changed: mail down, the email is pending work', short: 'Mail down · pending',
        states: [
          { prompt: { question: `Same outage. Booking answers first and records the email as pending work. What does ${ARI.name} see?`, options: ['No answer: an unknown outcome', 'Confirmed, with the email still pending', 'Rejected until the mail provider returns'] }, caption: 'Same outage. Steps 1 to 7 as on a normal day.' },
          { caption: `Steps 1 to 5 as usual: **${OUT.record_separately.user_sees}**.` },
          { caption: `**6 ·** ${N1.id} is recorded as pending, after the answer.` },
          { caption: `**7 ·** delivery fails: the mail provider is unavailable. ${N1.id} stays pending, with its failed attempt.` },
          { caption: `The extra responsibility: ${OUT.record_separately.extra_responsibility}.` },
          { caption: 'Same failure, two designs: one breaks the booking promise, one only delays the email.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const Y = { s1: 104, s2: 150, r2: 176, s3: 214, r3: 238, s4: 282, r4: 306, s5: 352, div: 384, s6: 432, s7: 492, note: 540 };
      const unavailable = (d) => {
        const hd = d.head['Mail provider'];
        const b = window.VC.badge({ x: d.X['Mail provider'], y: 76, label: 'unavailable', kind: 'bad' });
        b.classList.add('w6-badge-small');
        hd.appendChild(b);
      };
      const base = (d, at, opts = {}) => {   // steps 1 to 4 with their returns
        d.msg('Browser', 'Booking', Y.s1, stepLabel(1), { at: at[1], cue: 'step-1' });
        d.msg('Booking', 'Identity', Y.s2, stepLabel(2), { at: at[2], cue: 'step-2' });
        d.msg('Identity', 'Booking', Y.r2, '', { at: at[2], dashed: true, cls: 'w6-ret' });
        d.msg('Booking', 'Policy', Y.s3, stepLabel(3), { at: at[3], cue: 'step-3' });
        d.msg('Policy', 'Booking', Y.r3, '', { at: at[3], dashed: true, cls: 'w6-ret' });
        d.msg('Booking', 'Storage', Y.s4, stepLabel(4), { at: at[4], cue: 'step-4' });
        d.msg('Storage', 'Booking', Y.r4, `${BK.id} stored`, { at: at[4], dashed: true, kind: 'ok', cls: 'w6-ret' });
        if (opts.answer !== false) {
          d.msg('Booking', 'Browser', Y.s5, stepLabel(5), { at: at[5], kind: 'ok', cue: 'step-5' });
          const line = s('g', { class: 'rv' }, [s('line', { x1: 20, y1: Y.div, x2: d.W - 20, y2: Y.div, class: 'w6-div' }), text(d.W - 24, Y.div - 8, `${ARI.name} has the answer`, { class: 'w6-div-t', 'text-anchor': 'end' })]);
          d.layer.appendChild(line); d.items.push({ node: line, from: at[5] });
        }
      };
      // baseline: a normal day
      const dN = seqDiagram(api, 'n-', `Sequence of request ${RJ.request_id} on a normal day`);
      dN.bar('Browser', Y.s1, Y.s5, 'w6-act--wait', 1, 4);
      dN.bar('Browser', Y.s1, Y.s5, 'w6-act--done', 5);
      dN.bar('Booking', Y.s1, Y.s5, '', 1);
      base(dN, { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 });
      dN.msg('Booking', 'Notification', Y.s6, stepLabel(6), { at: 6, dashed: true, kind: 'accent', cue: 'step-6' });
      dN.msg('Notification', 'Mail provider', Y.s7, stepLabel(7), { at: 7, dashed: true, kind: 'accent', cue: 'step-7' });
      dN.note(dN.X['Mail provider'] - 6, Y.s7 + 34, `${N1.id} delivered`, 'w6-svg-note--ok', 7, null, 'end', 'delivered');
      dN.svg.setAttribute('data-cond', 'normal-day');
      // changed: the email before the answer
      const dW = seqDiagram(api, 'w-', `Sequence of request ${RJ.request_id} when the email comes before the answer and the mail provider is down`);
      unavailable(dW);
      dW.bar('Browser', Y.s1, 440, 'w6-act--wait', 1, 2);
      dW.bar('Browser', Y.s1, 460, 'w6-act--lost', 3);
      dW.bar('Booking', Y.s1, 470, '', 1);
      base(dW, { 1: 1, 2: 1, 3: 1, 4: 1 }, { answer: false });
      dW.msg('Booking', 'Notification', Y.s5, '5 · send the email first', { at: 2, cue: 'email-first' });
      dW.msg('Notification', 'Mail provider', 400, '6 · deliver now', { at: 2, kind: 'bad', dashed: true, cue: 'deliver-now' });
      dW.x(dW.X['Mail provider'] - 18, 400, 2);
      dW.note(dW.X.Browser + 14, 488, `timeout: ${OUT.wait_for_email.user_sees}`, 'w6-svg-note--bad', 3, null, 'start', 'timeout');
      dW.note(dW.X.Booking + 14, 520, `${BK.id} is stored, but no answer was sent`, 'w6-svg-note--warn', 4, null, 'start', 'no-answer');
      dW.svg.setAttribute('data-cond', 'wait-for-email');
      // changed: record the email as pending work
      const dR = seqDiagram(api, 'r-', `Sequence of request ${RJ.request_id} when the email is pending work and the mail provider is down`);
      unavailable(dR);
      dR.bar('Browser', Y.s1, Y.s5, 'w6-act--done', 1);
      dR.bar('Booking', Y.s1, Y.s5, '', 1);
      base(dR, { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 });
      dR.msg('Booking', 'Notification', Y.s6, stepLabel(6), { at: 2, dashed: true, kind: 'accent', cue: 'pending' });
      dR.msg('Notification', 'Mail provider', Y.s7, stepLabel(7), { at: 3, dashed: true, kind: 'bad', cue: 'deliver-fails' });
      dR.x(dR.X['Mail provider'] - 18, Y.s7, 3);
      dR.note(dR.X.Notification + 8, Y.note, `${N1.id} stays Pending: retry scheduled`, 'w6-svg-note--warn', 3, null, 'end', 'pending-note');
      dR.svg.setAttribute('data-cond', 'record-separately');
      h.diagrams = { 'normal-day': dN, 'wait-for-email': dW, 'record-separately': dR };
      const left = el('div', { style: 'position:relative;min-width:0' }, [dN.svg, dW.svg, dR.svg]);
      // right column: the request, what Ari waits for, the screen, the stored booking, the pending email
      h.barFill = WAIT_STEPS.filter((n) => MS_OF(n)).map((n) => {
        const seg = el('span', { class: `w6-seg w6-seg--${n}`, style: `flex:0 0 ${(MS_OF(n) / WAIT_TOTAL) * 62}%` });
        seg.n = n; return seg;
      });
      h.barWait = el('span', { class: 'w6-seg w6-seg--hang', style: 'flex:1 1 auto' });
      const bar = el('div', { class: 'w6-bar', role: 'img', 'aria-label': `What ${ARI.name} waits for, illustrative milliseconds` }, [...h.barFill, h.barWait]);
      h.waitRows = WAIT_STEPS.filter((n) => MS_OF(n)).map((n) => {
        const st = STEPS.find((x) => x.n === n);
        const who = n === 5 ? 'the answer travels back' : st.to;
        const r = el('div', { class: 'w6-wrow rv' }, [el('span', { class: `w6-wkey w6-seg--${n}` }), el('span', {}, `${n} · ${who}`), el('b', {}, `${MS_OF(n)} ms`)]);
        r.n = n; return r;
      });
      h.waitTotal = el('div', { class: 'w6-wtotal' });
      h.hangRow = el('div', { class: 'w6-wrow w6-wrow--hang rv' }, [el('span', { class: 'w6-wkey w6-seg--hang' }), el('span', {}, 'waiting for the mail provider'), el('b', {}, 'no answer')]);
      const waitCard = api.cue(el('div', { class: 'card w6-waitcard' }, [
        el('div', { style: 'display:flex;gap:10px;align-items:center;margin-bottom:2px' }, [api.cue(chip(RJ.request_id, 'accent', { style: 'font-size:17px;padding:1px 12px' }), 'request'), cardTitle(`What ${ARI.name} waits for`, 'margin-bottom:0;font-size:15px'), el('span', { class: 'example-tag', style: 'margin-left:auto' }, 'illustrative ms')]),
        bar, ...h.waitRows, h.hangRow, h.waitTotal,
      ]), 'waits');
      h.screen = bookingScreen(api, { who: `${ARI.name} (${ARI.id})`, room: RJ.request.room, start: RJ.request.start, end: RJ.request.end, cue: 'screen', cls: 'w6-screen--small' });
      h.dbRow = el('p', { class: 'w6-stored-row' });
      h.db = api.cue(el('div', { class: 'card w6-stored w6-stored--small' }, [el('span', { class: 'w6-db-ico', 'aria-hidden': 'true' }), el('div', {}, [cardTitle('Booking database', 'margin-bottom:0;font-size:14px'), h.dbRow])]), 'stored');
      h.nRow = el('p', { class: 'w6-stored-row' });
      h.nSupport = el('p', { class: 'w6-support rv rv--rise' }, [chip('visible to support', 'warn', { style: 'font-size:14px;padding:1px 10px' }), ` ${OUT.record_separately.support_sees}`]);
      h.notif = api.cue(el('div', { class: 'card w6-notif' }, [cardTitle('Pending notifications', 'margin-bottom:0;font-size:14px'), h.nRow, h.nSupport]), 'notifications');
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:10px;min-width:0' }, [waitCard, h.screen, h.db, h.notif]);
      right.style.cssText += ';min-height:0;overflow:hidden';
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:820px minmax(0,1fr);grid-template-rows:minmax(0,1fr);gap:16px' }, [left, right]));
      return h;
    },
    render(h, view, api) {
      const st = view.state, c = view.conditionId;
      const d = h.diagrams[c];
      d.apply(st);
      // how far the request has come, per condition
      let reached;   // highest step number done
      if (c === 'normal-day') reached = st;
      else if (c === 'wait-for-email') reached = st >= 1 ? 4 : 0;
      else reached = st >= 1 ? 5 + Math.max(0, st - 1) : 0;
      h.barFill.forEach((seg) => seg.classList.toggle('is-on', seg.n <= reached));
      h.waitRows.forEach((r) => { showIf(r, r.n <= reached); focusIf(r, c === 'normal-day' && r.n === st); });
      const hang = c === 'wait-for-email' && st >= 2;
      h.barWait.classList.toggle('is-on', hang);
      showIf(h.hangRow, hang);
      const sofar = WAIT_STEPS.filter((n) => n <= Math.min(reached, 5)).reduce((t, n) => t + (MS_OF(n) || 0), 0);
      h.waitTotal.textContent = hang ? `${sofar} ms, then waiting until the timeout` : reached >= 5 ? `${ARI.name} waited ${WAIT_TOTAL} ms in total` : reached >= 1 ? `${sofar} ms so far` : 'not sent yet';
      // the screen
      if (reached === 0) h.screen.setStatus('idle', 'Ready to book', '');
      else if (c === 'wait-for-email') {
        if (st >= 3) h.screen.setStatus('unknown', OUT.wait_for_email.user_sees, 'No answer arrived before the timeout');
        else h.screen.setStatus('wait', 'Submitting…', st >= 2 ? 'still waiting' : '');
      } else if (reached >= 5) h.screen.setStatus('ok', `Confirmed · ${BK.id}`, `${BK.room_id}, ${span(BK.start, BK.end)}`);
      else h.screen.setStatus('wait', 'Submitting…', '');
      // stored booking and pending email
      const stored = reached >= 4;
      h.dbRow.replaceChildren(...(stored ? [el('b', {}, BK.id), ` · ${BK.room_id} · ${span(BK.start, BK.end)} · `, el('b', { class: 'ok' }, BK.state)] : [el('span', { class: 'muted' }, 'nothing stored for this request yet')]));
      let nState = null;
      if (c === 'normal-day') nState = st >= 7 ? 'Delivered' : st >= 6 ? 'Pending' : null;
      else if (c === 'record-separately') nState = st >= 3 ? 'Pending · attempt 1 failed · retry scheduled' : st >= 2 ? 'Pending' : null;
      else nState = st >= 2 ? 'not recorded: the email is part of the request' : null;
      h.nRow.replaceChildren(...(nState ? [el('b', {}, N1.id), ` for ${N1.for} · `, el('b', { class: nState === 'Delivered' ? 'ok' : nState.startsWith('not') ? 'bad' : 'warn' }, nState)] : [el('span', { class: 'muted' }, 'none yet')]));
      showIf(h.nSupport, c === 'record-separately' && st >= 4);
      focusIf(h.notif, c === 'record-separately' && st >= 3 && st <= 4);
      focusIf(h.db, (c === 'normal-day' && st === 4) || (c === 'wait-for-email' && st === 3));
      if (c === 'normal-day' && st >= 1 && st <= 7) {
        const part = { 1: 'Booking', 2: 'Identity', 3: 'Policy', 4: 'Storage', 5: 'Browser', 6: 'Notification', 7: 'Mail provider' }[st];
        Object.entries(d.head).forEach(([p, g]) => g.classList.toggle('is-focus', p === part));
      } else Object.values(d.head).forEach((g) => g.classList.remove('is-focus'));
      if (c === 'wait-for-email' && st === 3) glow(api, h.screen, RED, 1);
      if ((c === 'normal-day' && st === 5) || (c === 'record-separately' && st === 1)) glow(api, h.screen, GREEN, 1);
    },
    print: [
      { title: `A normal day: steps 1 to 5 hold up the answer, 6 and 7 follow it`, condition: 'normal-day', state: 8, note: `${STEPS.map((x) => `${x.n}. ${x.from} to ${x.to}: ${x.label}${x.blocking ? `, ${ARI.name} waits` : ', after the answer'}${x.illustrative_ms != null ? ` (${x.illustrative_ms} ms)` : ''}`).join('; ')}. ${upper1(RJ.note)}.` },
      { title: 'The mail provider is down, and the email comes before the answer', condition: 'wait-for-email', state: 4, principle: true, note: `${upper1(RJ.changed_condition.design_wait_for_email)}. Storage holds ${OUT.wait_for_email.storage}; ${OUT.wait_for_email.consequence}.` },
      { title: 'The mail provider is down, and the email is pending work', condition: 'record-separately', state: 5, principle: true, note: `${upper1(RJ.changed_condition.design_record_separately)}. ${upper1(OUT.record_separately.notification)}. Support sees ${OUT.record_separately.support_sees}.` },
    ],
  };

  // =====================================================================
  // SCENE 3 · monolith-and-services (Bridge)
  // =====================================================================
  const ALT = MS.alternatives;
  const CC3 = MS.changed_condition;
  /** One architecture drawing: 'modular' | 'services' | 'targeted'. */
  function altDrawing(api, kind, cue) {
    const W = 616, H = 252;
    const svg = window.VC.svg(W, H, { label: `${ALT[kind].name}: drawing`, uid: (x) => api.uid(`${kind}-${x}`), class: 'w6-alt' });
    const lay = s('g', {}); lay.uid = svg.uid; svg.appendChild(lay);
    const h = { svg, nodes: {} };
    const mod = (name, x, y, w, hgt, extra) => { const g = archBox({ x, y, w, h: hgt, label: name.includes(' ') && w < 120 ? name.split(' ') : name, lh: 19, cls: `w6-mod${extra ? ` ${extra}` : ''}` }); lay.appendChild(g); h.nodes[name] = g; return g; };
    if (kind === 'modular' || kind === 'targeted') {
      const names = kind === 'modular' ? ALT.modular.parts : ALT.targeted.parts;
      const appW = kind === 'modular' ? 596 : 436;
      const box = s('g', { class: 'w6-deploy' }, [s('rect', { x: 10, y: 22, width: appW, height: 148, rx: 16 }), text(26, 46, kind === 'modular' ? 'Application · 1 deployable' : 'Application', { class: 'w6-deploy-t' })]);
      lay.appendChild(box);
      const mw = kind === 'modular' ? 104 : 96, step = kind === 'modular' ? 116 : 104;
      names.forEach((n, i) => mod(n, 24 + i * step, 72, mw, 70));
      lay.appendChild(text(10 + appW / 2, 162, 'function calls inside one process', { class: 'w6-svg-note', 'text-anchor': 'middle' }));
      const dbx = kind === 'modular' ? 208 : 120;
      const db = archBox({ x: dbx, y: 186, w: 200, h: 62, kind: 'store', label: 'Booking database' });
      lay.appendChild(db); h.nodes.db = db;
      arrow(lay, { from: { x: dbx + 100, y: 170 }, to: { x: dbx + 100, y: 190 } });
      if (kind === 'targeted') {
        const wk = s('g', { class: 'w6-deploy w6-deploy--new' }, [s('rect', { x: 462, y: 22, width: 144, height: 148, rx: 16 }), text(476, 46, 'Worker', { class: 'w6-deploy-t' })]);
        lay.appendChild(wk);
        mod('Notification', 474, 72, 120, 70, 'w6-mod--hot');
        arrow(lay, { from: { x: 534, y: 170 }, via: [{ x: 534, y: 218 }], to: { x: dbx + 200, y: 218 }, dashed: true, kind: 'accent' });
        lay.appendChild(text(442, 208, 'reads pending email', { class: 'w6-svg-note', 'text-anchor': 'middle' }));
        h.worker = wk;
      }
    } else {
      // every component a service: Booking in the middle-left, three services to the right, each its own deployable
      const svc = (name, x, y) => {
        const g = archBox({ x, y, w: 190, h: 64, kindLabel: 'Service', label: name.replace(' service', ''), cls: 'w6-svc' });
        lay.appendChild(g); h.nodes[name] = g; return g;
      };
      const parts = ALT.services.parts;   // Booking, Policy, Room Catalog, Notification services
      svc(parts[0], 10, 94);
      svc(parts[1], 296, 8); svc(parts[2], 296, 94); svc(parts[3], 296, 180);
      const d1 = archBox({ x: 20, y: 188, w: 170, h: 60, kind: 'store', label: 'Booking data', cls: 'w6-mod' });
      const d2 = archBox({ x: 506, y: 94, w: 106, h: 64, kind: 'store', label: ['Catalog', 'data'], lh: 17, cls: 'w6-mod' });
      lay.append(d1, d2);
      arrow(lay, { from: { x: 105, y: 158 }, to: { x: 105, y: 190 } });
      arrow(lay, { from: { x: 486, y: 126 }, to: { x: 512, y: 126 } });
      [[40, parts[1]], [126, parts[2]], [212, parts[3]]].forEach(([y, n], i) => arrow(lay, { from: { x: 200, y: 112 + (i - 1) * 14 + 14 }, to: { x: 296, y }, dashed: true, kind: 'accent', label: i === 0 ? 'network' : null, labelAt: 0.5, labelDy: -12 }));
      h.nodes.d1 = d1; h.nodes.d2 = d2;
    }
    if (cue) api.cue(svg, cue);
    cueDrawing(api, svg, kind);
    svg.style.height = `${H}px`;
    return h;
  }
  const monolithAndServices = {
    id: 'monolith-and-services', role: 'bridge',
    heading: 'What would separate services buy a small team?',
    lead: `${upper1(MS.team)}. The same components can run as one modular application or as separate services. Compare what each buys and what each costs.`,
    principle: 'Choose deployment boundaries for demonstrated needs; modularity and distribution are different decisions.',
    principleShort: 'Split a process only when a real need asks.',
    conditions: [
      { id: 'steady-load', baseline: true, label: 'Baseline: one small team, steady load', short: 'Steady load',
        states: [
          { prompt: { question: 'One small team, steady load. What would separate services buy them?', options: ['Loose coupling, for free', 'Independent release and scaling, paid for with network and coordination work', 'Less to deploy and watch'] }, caption: 'The same five components, run two ways. The modular application keeps its modules: it is not one undivided blob.' },
          ...MS.rows.map((r) => ({ caption: `**${r.aspect}.** ${upper1(r.modular)}; with services, ${r.services}.` })),
          { caption: `${MS.steady_judgment}` },
        ] },
      { id: 'notifications-grow', label: 'Changed: notifications grow, booking writes do not', short: 'Notifications grow',
        states: [
          { prompt: { question: 'Notification volume grows; booking writes do not. Which split targets that need?', options: ['Split every component into a service', 'Split Policy out', 'Move only Notification into its own worker'] }, caption: `One condition changes: ${lower1(CC3.change)}.` },
          ...CC3.rows.map((r) => ({ caption: `**${r.aspect}.** Worker: ${r.targeted}. Services: ${r.services}.` })),
          { caption: `${CC3.judgment}`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      h.dMod = altDrawing(api, 'modular', 'drawing-modular');
      h.dTar = altDrawing(api, 'targeted', 'drawing-worker');
      h.dSvc = altDrawing(api, 'services', 'drawing-services');
      h.dMod.svg.setAttribute('data-cond', 'steady-load');
      h.dTar.svg.setAttribute('data-cond', 'notifications-grow');
      const title = (txt, cls) => el('div', { class: `w6-alt-title ${cls || ''}` }, txt);
      h.leftTitle = title(ALT.modular.name);
      const left = api.cue(el('div', { class: 'card w6-alt-card' }, [h.leftTitle, h.dMod.svg, h.dTar.svg]), 'left');
      const right = api.cue(el('div', { class: 'card w6-alt-card' }, [title(ALT.services.name), h.dSvc.svg]), 'right');
      // the comparison table; rows of the baseline and of the changed condition
      const row = (r, a, b, key) => {
        const tr = el('tr', { class: 'rv' }, [el('th', { scope: 'row' }, r.aspect), el('td', {}, upper1(a)), el('td', {}, upper1(b))]);
        api.cue(tr, `row-${key}`);
        return tr;
      };
      h.baseRows = MS.rows.map((r) => row(r, r.modular, r.services, r.id));
      h.cRows = CC3.rows.map((r) => row(r, r.targeted, r.services, r.id));
      h.thLeft = el('th', { scope: 'col' }, ALT.modular.name);
      const table = el('table', { class: 'data-table data-table--compact w6-cmp-table' }, [
        el('thead', {}, el('tr', {}, [el('th', { scope: 'col' }, 'Compare'), h.thLeft, el('th', { scope: 'col' }, ALT.services.name)])),
        el('tbody', {}, [...h.baseRows, ...h.cRows]),
      ]);
      h.table = api.cue(el('div', { class: 'card', style: 'padding:6px 12px 4px;min-height:0' }, table), 'table');
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:10px' }, [
        el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:14px' }, [left, right]), h.table,
      ]));
      return h;
    },
    render(h, view, api) {
      const st = view.state, base = view.conditionId === 'steady-load';
      h.leftTitle.textContent = base ? ALT.modular.name : ALT.targeted.name;
      h.thLeft.textContent = base ? ALT.modular.name : ALT.targeted.name;
      h.baseRows.forEach((tr, i) => { tr.style.display = base ? '' : 'none'; showIf(tr, base && st >= i + 1); focusIf(tr, base && st === i + 1); });
      h.cRows.forEach((tr, i) => { tr.style.display = base ? 'none' : ''; showIf(tr, !base && st >= i + 1); focusIf(tr, !base && st === i + 1); });
      const hot = !base;
      ['Notification service'].forEach((n) => h.dSvc.nodes[n].classList.toggle('is-focus', hot));
      if (h.dTar.nodes.Notification) h.dTar.nodes.Notification.classList.toggle('is-focus', hot);
      if (!base && st === 0 && h.dTar.worker) glow(api, h.dTar.worker, GOLD, 1);
    },
    print: [
      { title: 'One small team, steady load: both alternatives, no winner label', condition: 'steady-load', state: 7, note: `${ALT.modular.name}: ${ALT.modular.deployables} deployable (${listAnd(ALT.modular.parts)}), ${ALT.modular.data}. ${ALT.services.name}: ${ALT.services.deployables} deployables, ${lower1(ALT.services.data)}. ${MS.steady_judgment}` },
      { title: `Changed: ${lower1(CC3.change)}`, condition: 'notifications-grow', state: 4, principle: true, note: `${ALT.targeted.name}: ${ALT.targeted.deployables} deployables, ${ALT.targeted.data}. ${CC3.judgment}` },
    ],
  };

  // =====================================================================
  // SCENE 4 · concurrent-booking (Anchor)
  // =====================================================================
  const RA = RQ.A, RB = RQ.B;
  const CAL = CB.calendar;
  const DC = CB.display_code;
  const NAIVE = CB.naive_interleaving, FIXED = CB.corrected_interleaving;
  const SIM = Object.fromEntries(CB.snippets.map((sn) => [sn.function, sn.cases[0].expected]));   // recorded results of the executable fixtures
  if (SIM.check_then_write !== 2 || SIM.unique_start !== 2 || SIM.atomic_decide_and_write !== 1) throw new Error('w06/concurrent-booking snippets disagree with the scene');
  const reqLabel = (r) => `${r.user} · ${r.room} · ${span(r.start, r.end)}`;
  // what each event cell says, per condition: [lane, action, result, kind]
  const EVENTS = {
    'check-then-write': NAIVE.map((e) => [e.lane, e.action, e.result, e.action.startsWith('write') ? 'ok' : 'accent']),
    'in-a-transaction': [['A', 'begin · read availability', 'available', 'accent'], ['B', 'begin · read availability', 'available', 'accent'], ['A', 'write Confirmed · commit', 'stored', 'ok'], ['B', 'write Confirmed · commit', 'stored: two confirmations', 'ok']],
    'unique-start': [['A', 'read availability', 'available', 'accent'], ['B', 'read availability', 'available', 'accent'], ['A', `write key ${CB.unique_key.keys[0]}`, 'accepted', 'ok'], ['B', `write key ${CB.unique_key.keys[1]}`, 'accepted: a different key', 'ok']],
    'atomic-decision': FIXED.map((e) => [e.lane, e.action, e.result, e.result.startsWith('Confirmed') ? 'ok' : 'bad']),
  };
  const concurrentBooking = {
    id: 'concurrent-booking', role: 'anchor',
    heading: 'Two sensible requests, one broken rule',
    lead: `${RA.user} and ${RB.user} book ${RA.room} at almost the same moment: ${span(RA.start, RA.end)} and ${span(RB.start, RB.end)}. The times overlap, so ${CB.invariant} allows only one.`,
    principle: 'An invariant shared by concurrent operations needs enforcement that survives their interleavings.',
    principleShort: 'A shared rule needs one guard that races cannot slip past.',
    conditions: [
      { id: 'check-then-write', baseline: true, label: 'Baseline: each request reads, decides, then writes', short: 'Check, then write',
        states: [
          { caption: `Two requests run the same code: read the bookings of ${RA.room}, decide, write. Watch the order of events.` },
          { caption: `**1 · ${RA.user}'s request reads:** nothing overlaps ${span(RA.start, RA.end)}. Available.` },
          { prompt: { question: 'Both reads said available. What will each request decide?', options: ['Both confirm', `${RA.user} confirms, ${RB.user} is rejected`, 'Both are rejected'] }, caption: `**2 · ${RB.user}'s request reads** before ${RA.user}'s write lands: also available.` },
          { caption: `**3 · ${RA.user}'s request writes** Confirmed: ${RA.booking}.` },
          { caption: `**4 · ${RB.user}'s request writes** Confirmed: ${RB.booking}. ${CAL.overlap} is booked twice. **${CB.invariant} is broken.**` },
          { caption: 'Each decision was sensible for what it read. The order of clicks does not matter: the rule broke between the read and the write.' },
        ] },
      { id: 'in-a-transaction', label: 'Changed: inside a transaction, read committed', short: 'In a transaction',
        states: [
          { prompt: { question: 'Each request now runs inside a transaction at read committed. Does that stop the overlap?', options: ['Yes: a transaction prevents double booking', 'No: both still read “available” first', 'Only if one request is slower'] }, caption: 'The same code inside a transaction, at PostgreSQL’s default level.' },
          { caption: `**1 ·** ${RA.user}'s transaction begins and reads: available.` },
          { caption: `**2 ·** ${RB.user}'s transaction begins and reads: available. Nothing is locked: there is no row yet to lock.` },
          { caption: `**3 ·** ${RA.user}'s transaction writes and commits: ${RA.booking}.` },
          { caption: `**4 ·** ${RB.user}'s transaction writes and commits: ${RB.booking}. Two confirmations again.` },
          { caption: `A transaction label is not a rule. ${upper1(CB.transaction.serializable)}.` },
        ] },
      { id: 'unique-start', label: 'Changed: a unique key on room and start', short: 'Unique room + start',
        states: [
          { prompt: { question: 'Storage now refuses a second booking with the same room and start time. Does that stop this overlap?', options: ['Yes: the second booking is refused', 'Yes, as long as both start on the hour', `No: ${RA.start} and ${RB.start} are different keys`] }, caption: 'A uniqueness rule in storage: one booking per room and start time.' },
          { caption: `**1 ·** ${RA.user}'s request reads: available.` },
          { caption: `**2 ·** ${RB.user}'s request reads: available.` },
          { caption: `**3 ·** ${RA.user}'s write uses the key **${CB.unique_key.keys[0]}**: accepted.` },
          { caption: `**4 ·** ${RB.user}'s write uses the key **${CB.unique_key.keys[1]}**: a different key, accepted. The times still overlap.` },
          { caption: `The key protects “same room, same start”, a smaller rule than ${CB.invariant}.` },
        ] },
      { id: 'atomic-decision', label: 'Changed: one atomic decision per room', short: 'One atomic decision',
        states: [
          { prompt: { question: 'Now the check and the write happen as one step per room. What happens to the same two requests?', options: ['One confirms, the other gets a conflict', 'Both confirm', 'Both get a conflict'] }, caption: 'Nothing can happen between the check and the write.' },
          { caption: `**1 · ${RA.user}'s request** checks and writes in one step: ${RA.booking} Confirmed.` },
          { caption: `**2 · ${RB.user}'s request** checks and finds ${RA.booking}: a conflict, so it writes nothing.` },
          { caption: `${RB.user} sees: ${CB.atomic.bo_sees}. ${RB.user} can choose another time. **${CB.invariant} holds.**` },
          { caption: 'The rule must be enforced where the competing requests meet. Here are three ways to do that.' },
          { caption: 'Same two requests, same timing: now the rule survives.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      // ---- the calendar of C101
      const CW = 1232, CH = 104;
      const x0 = 74, x1 = CW - 28, t0 = toMin(CAL.from), t1 = toMin(CAL.to);
      const X = (min) => x0 + ((min - t0) / (t1 - t0)) * (x1 - x0);
      const cal = window.VC.svg(CW, CH, { label: `Calendar of ${CAL.room} from ${CAL.from} to ${CAL.to}`, uid: (x) => api.uid(`cal-${x}`), class: 'w6-cal' });
      for (let m = t0; m <= t1; m += 30) {
        const full = m % 60 === 0;
        cal.appendChild(s('line', { x1: X(m), y1: 6, x2: X(m), y2: full ? 84 : 78, class: full ? 'w6-cal-tick' : 'w6-cal-tick w6-cal-tick--half' }));
        if (full) cal.appendChild(text(X(m), 100, hhmm(m), { class: 'w6-cal-t', 'text-anchor': 'middle' }));
      }
      const rowY = { A: 8, B: 44 };
      const ov = [Math.max(RA.interval[0], RB.interval[0]), Math.min(RA.interval[1], RB.interval[1])];
      h.overlap = s('g', { class: 'rv' }, [s('rect', { x: X(ov[0]), y: 4, width: X(ov[1]) - X(ov[0]), height: 74, rx: 6, fill: `url(#${cal.uid('hatch-bad')})`, class: 'w6-overlap' })]);
      cal.appendChild(h.overlap);   // under the bars, so their labels stay readable
      api.cue(h.overlap, 'overlap');
      const lane = (key, r) => {
        const g = s('g', { class: 'w6-cal-req' });
        const [a, b] = r.interval;
        const rect = s('rect', { x: X(a), y: rowY[key], width: X(b) - X(a), height: 30, rx: 8 });
        // Ari's label sits at the start of the bar, Bo's at its end: both stay clear of the shared half hour
        const atEnd = key === 'B';
        const lbl = text(atEnd ? X(b) - 12 : X(a) + 12, rowY[key] + 21, r.user, { class: 'w6-cal-l', 'text-anchor': atEnd ? 'end' : 'start' });
        g.append(rect, lbl);
        g.rect = rect; g.lbl = lbl;
        cal.appendChild(g);
        cal.appendChild(text(x0 - 10, rowY[key] + 21, r.user, { class: 'w6-cal-who', 'text-anchor': 'end' }));
        return g;
      };
      h.calA = lane('A', RA); h.calB = lane('B', RB);
      cal.style.height = `${CH}px`;
      h.inv = api.cue(chip('', 'ok', { style: 'font-size:16px;padding:2px 12px' }), 'invariant');
      const calCard = api.cue(el('div', { class: 'card w6-calcard' }, [
        el('div', { style: 'display:flex;align-items:center;gap:12px;margin-bottom:2px' }, [cardTitle(`Room ${CAL.room} · ${span(CAL.from, CAL.to)}`, 'margin-bottom:0;font-size:15px'),
          el('span', { class: 'w6-inv' }, [el('b', {}, `${CB.invariant} · `), 'no overlapping confirmed bookings in one room']), h.inv]),
        cal,
      ]), 'calendar');
      api.cue(h.calA, 'request-a'); api.cue(h.calB, 'request-b');
      // ---- the interleaving: two lanes, four moments in time
      h.cells = { A: [], B: [] };
      const head = el('div', { class: 'w6-il-row w6-il-head' }, [el('span', { class: 'w6-il-axis' }, 'time →'), ...[1, 2, 3, 4].map((n) => el('span', { class: 'w6-il-n' }, String(n)))]);
      const laneRow = (key, r) => {
        const cells = [1, 2, 3, 4].map((n) => {
          const c = api.cue(el('div', { class: 'w6-cell rv rv--rise' }, [el('span', { class: 'w6-cell-n' }, String(n)), el('span', { class: 'w6-cell-a' }), el('span', { class: 'w6-cell-r' })]), `cell-${key.toLowerCase()}-${n}`);
          c.n = n; return c;
        });
        h.cells[key] = cells;
        return el('div', { class: 'w6-il-row' }, [el('div', { class: `w6-il-lane w6-il-lane--${key.toLowerCase()}` }, [el('b', {}, `${key} · ${r.user} (${r.user_id})`), el('span', {}, `${r.room} · ${span(r.start, r.end)}`)]), ...cells.map((c) => el('div', { class: 'w6-il-slot' }, c))]);
      };
      h.ways = api.cue(el('div', { class: 'card w6-ways rv rv--rise', 'data-cond': 'atomic-decision' }, [cardTitle('Ways to make it one decision', 'margin-bottom:4px;font-size:15px'), el('ul', {}, CB.atomic.ways.map((w) => el('li', {}, upper1(w))))]), 'ways');
      const il = api.cue(el('div', { class: 'card w6-il' }, [head, laneRow('A', RA), laneRow('B', RB), h.ways]), 'interleaving');
      // ---- the code and the stored bookings
      h.codes = {};
      const codeOf = { 'check-then-write': DC.check_then_write, 'in-a-transaction': DC.transaction, 'unique-start': DC.unique_key, 'atomic-decision': DC.atomic };
      Object.entries(codeOf).forEach(([cond, src]) => {
        const c = codeCard(api, src, { label: `Pseudocode: ${cond}`, cls: 'w6-code--small', lineCues: `code-${cond}` });
        c.setAttribute('data-cond', cond);
        h.codes[cond] = c;
      });
      const codeBox = api.cue(el('div', { class: 'w6-codebox' }, [el('div', { class: 'w6-codebox-t' }, 'The code each request runs · overlaps() is the R-01 interval check'), ...Object.values(h.codes)]), 'code');
      h.rowsEl = el('div', { class: 'w6-dbrows' });
      h.sees = el('div', { class: 'w6-sees' });
      const db = api.cue(el('div', { class: 'card w6-dbcard' }, [cardTitle('Booking database', 'margin-bottom:4px;font-size:15px'), h.rowsEl, h.sees]), 'stored');
      h.db = db;
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:10px' }, [
        calCard, il, el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) 430px;gap:14px;min-height:0;flex:1' }, [codeBox, db]),
      ]));
      return h;
    },
    render(h, view, api) {
      const st = view.state, c = view.conditionId;
      const ev = EVENTS[c];
      const atomic = c === 'atomic-decision';
      // which events have happened: one event per state from state 1 on
      const done = Math.max(0, Math.min(ev.length, st));
      ['A', 'B'].forEach((k) => h.cells[k].forEach((cell) => { showIf(cell, false); cell.classList.remove('is-now'); cell.className = cell.className.replace(/ w6-cell--\w+/g, ''); }));
      ev.forEach(([laneKey, action, result, kind], i) => {
        const cell = h.cells[laneKey][i];
        cell.children[1].textContent = upper1(action);
        cell.children[2].textContent = result;
        cell.classList.add(`w6-cell--${kind}`);
        showIf(cell, i < done);
        cell.classList.toggle('is-now', i === done - 1 && st <= ev.length);
      });
      // stored bookings after the events so far
      const writes = ev.slice(0, done).filter(([, action, result]) => /write/.test(action) && !/conflict/.test(result));
      const storedKeys = writes.map(([k]) => k);
      const both = storedKeys.includes('A') && storedKeys.includes('B');
      const rows = storedKeys.map((k) => { const r = RQ[k]; return el('div', { class: `w6-dbrow${both ? ' is-bad' : ''}` }, [el('b', {}, r.booking), ` · ${r.user} · ${r.room} · ${span(r.start, r.end)} · `, el('b', { class: 'ok' }, 'Confirmed')]); });
      h.rowsEl.replaceChildren(...(rows.length ? rows : [el('div', { class: 'w6-dbrow muted' }, 'no booking in C101 between 09:00 and 12:00')]));
      // calendar: requests outlined, stored ones solid, the overlap hatched
      [['A', h.calA], ['B', h.calB]].forEach(([k, g]) => {
        const storedNow = storedKeys.includes(k);
        const rejected = atomic && k === 'B' && done >= 2;
        g.setAttribute('class', `w6-cal-req${storedNow ? ' is-stored' : ''}${rejected ? ' is-rejected' : ''}`);
        g.lbl.textContent = `${RQ[k].start}–${RQ[k].end}${storedNow ? ` · ${RQ[k].booking}` : rejected ? ' · conflict' : ''}`;
      });
      showIf(h.overlap, both);
      h.inv.textContent = both ? 'broken' : storedKeys.length ? 'holds' : 'not yet tested';
      h.inv.className = `chip chip--${both ? 'bad' : storedKeys.length ? 'ok' : 'muted'}`;
      // what each person is told
      const told = (k) => {
        if (!ev.slice(0, done).some(([lk, action]) => lk === k && /write|decide/.test(action))) return 'waiting';
        if (storedKeys.includes(k)) return `Confirmed · ${RQ[k].booking}`;
        return 'Rejected: booking conflict';
      };
      h.sees.replaceChildren(el('span', {}, [el('b', {}, `${RA.user} is told: `), told('A')]), el('span', {}, [el('b', {}, `${RB.user} is told: `), told('B')]));
      h.db.classList.toggle('is-bad', both);
      // the code lines that run in the current event
      const code = h.codes[c];
      const L = {
        'check-then-write': { read: [2], write: [3, 5] },
        'in-a-transaction': { read: [2, 3], write: [4, 6] },
        'unique-start': { read: [3], write: [1, 6] },
        'atomic-decision': { A: [2, 3, 4, 6], B: [2, 3, 4, 5] },
      }[c];
      const cur = ev[done - 1];
      if (!cur || st > ev.length) code.focusLines([]);
      else if (atomic) code.focusLines(L[cur[0]]);
      else code.focusLines(/write/.test(cur[1]) ? L.write : L.read);
      showIf(h.ways, atomic && st >= 4);
      if (both && st === 4 && api.motion) { glow(api, h.overlap, RED, 2); glow(api, h.db, RED, 1); }
      if (atomic && st === 2) glow(api, h.cells.B[1], RED, 1);
    },
    print: [
      { title: `Check, then write: both reads see the same earlier state`, condition: 'check-then-write', state: 5, note: `Order of events: ${NAIVE.map((e) => `${e.n}. ${e.lane === 'A' ? RA.user : RB.user}'s request: ${e.action}, ${e.result}`).join('; ')}. ${CB.invariant}: no overlapping confirmed bookings for one room. ${CAL.overlap} is booked twice.` },
      { title: 'Inside a transaction at read committed', condition: 'in-a-transaction', state: 5, note: `${upper1(CB.transaction.result)}. ${upper1(CB.transaction.serializable)}.` },
      { title: 'A unique key on room and start time', condition: 'unique-start', state: 5, note: `Keys ${listAnd(CB.unique_key.keys)}: ${CB.unique_key.result}.` },
      { title: 'One atomic decision per room', condition: 'atomic-decision', state: 5, principle: true, note: `${FIXED.map((e) => `${e.n}. ${e.lane === 'A' ? RA.user : RB.user}'s request: ${e.action}, ${e.result}`).join('; ')}. ${RB.user} sees: ${CB.atomic.bo_sees}. Ways to enforce it: ${CB.atomic.ways.join('; ')}. ${upper1(CB.guardrail)}.` },
    ],
  };

  // =====================================================================
  // SCENE 5 · retry-and-idempotency (Anchor)
  // =====================================================================
  const TL = RI.timeline;   // t0 .. t4
  const PR = RI.plain_retry;
  const HANDLE = snippetMain(RI, 'handle');
  const P1 = RI.payload, P2 = RI.changed_payload;
  const pretty = (p) => p.replace(/(\d\d:\d\d)-(\d\d:\d\d)/, '$1 to $2');
  const SEQ5 = ['Ari\'s browser', 'Booking', 'Booking database'];
  const ROOM2 = CASE.rooms[1];   // the second room, C202
  if (!PR.then.includes(ROOM2)) throw new Error('w06/retry-and-idempotency plain_retry names another room');
  const retryAndIdempotency = {
    id: 'retry-and-idempotency', role: 'anchor',
    heading: 'A timeout does not tell you whether the write happened',
    lead: `${ARI.name} books ${pretty(P1)}. The booking is stored, and the answer is lost on its way back. What should happen next?`,
    principle: 'Retries need defined semantics for identity, repeated effects, and uncertain outcomes.',
    principleShort: 'Give each operation an identity, so a retry cannot double it.',
    conditions: [
      { id: 'plain-retry', baseline: true, label: 'Baseline: the browser retries with no operation key', short: 'Retry, no key',
        states: [
          { caption: `${ARI.name}'s request carries only the booking: ${pretty(P1)}.` },
          { caption: `Booking stores **${BK.id}** as Confirmed.` },
          { prompt: { question: `${ARI.name}'s screen says Unknown outcome. Should the browser simply send the booking again?`, options: ['Yes: an error means nothing was saved', 'Not blindly: the write may have happened', `No: tell ${ARI.name} it failed`] }, caption: 'The answer is lost on the way back.' },
          { caption: `The browser sends the same booking again. Booking sees ${PR.server_sees}.` },
          { caption: `R-01 finds the overlap with ${BK.id}: **${PR.result}**. ${ARI.name} is told the room is taken, by ${ARI.name}'s own booking.` },
          { caption: `${upper1(PR.then)}.` },
          { caption: `${upper1(PR.duplicate)}. Booking could not tell a retry from a new request.` },
        ] },
      { id: 'same-key', label: `Changed: key ${KEY.id}, repeated on the retry`, short: `Key ${KEY.id}, same request`,
        states: [
          { prompt: { question: `The browser sends key ${KEY.id} with the first request and repeats it on the retry. What should the retry return?`, options: ['A second booking', `A conflict with ${BK.id}`, `The original result: ${BK.id} Confirmed`] }, caption: `Same booking, plus an operation key: ${KEY.id}, for ${ARI.name} and this one booking.` },
          { caption: `Booking stores ${BK.id}, and in the same commit records **${KEY.id} → ${OPREC.result}**.` },
          { caption: `The answer is lost again. ${ARI.name} sees **Unknown outcome**.` },
          { caption: `The retry carries ${KEY.id} and the same request. Booking finds ${KEY.id} and returns **the original result**: ${OPREC.result}. No second booking.` },
          { caption: `${upper1(RI.http_note.text)}.` },
        ] },
      { id: 'changed-payload', label: `Changed: ${KEY.id} reused for ${pretty(P2).replace('C101 ', '')}`, short: 'Same key, new request',
        states: [
          { prompt: { question: `The retry reuses ${KEY.id} but asks for ${pretty(P2).replace('C101 ', '')}. What should happen?`, options: [`An explicit conflict: ${KEY.id} belongs to another request`, `Move ${BK.id} to ${P2.split(' ')[1].split('-')[0]}`, `A new booking for ${P2.split(' ')[1].split('-')[0]}`] }, caption: `${KEY.id} already holds a result: ${OPREC.result}, for ${pretty(P1)}.` },
          { caption: `**${upper1(HANDLE.snippet.cases[1].expected)}.** Nothing is stored, and nothing is moved.` },
          { caption: `The key belongs to a requester and one intended action. The same ${KEY.id} from ${BO.name} (${BO.id}) is a different operation.` },
          { caption: 'One identity per intended action: repeat it, and the result repeats; change the action, and the key refuses.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const Y = { e0: 112, e1: 168, e1r: 196, e2: 250, e2n: 292, e3: 352, e3a: 402, e3b: 430, e3c: 482, e4: 556, e4b: 606, e4n: 650 };
      const mk = (cond) => {
        const d = seqDiagram(api, `${cond}-`, `Messages of ${ARI.name}'s booking: ${cond}`, { parts: SEQ5, W: 600, H: 680, margin: 90, headW: 164, oneLine: true });
        d.svg.setAttribute('data-cond', cond);
        return d;
      };
      const keyed = (cond) => cond !== 'plain-retry';
      const lost = (d, at) => {
        d.msg('Booking', 'Ari\'s browser', Y.e2, `Confirmed · ${BK.id}`, { at, kind: 'bad', dashed: true, cue: 'lost' });
        d.x(d.X.Booking - 46, Y.e2, at);
        d.note(d.X['Ari\'s browser'] + 14, Y.e2n, 'lost on the way: Unknown outcome', 'w6-svg-note--bad', at, null, 'start');
      };
      h.d = {};
      ['plain-retry', 'same-key', 'changed-payload'].forEach((cond) => {
        const d = mk(cond);
        const at = cond === 'plain-retry' ? [0, 1, 2] : cond === 'same-key' ? [0, 1, 2] : [0, 0, 0];
        d.msg('Ari\'s browser', 'Booking', Y.e0, keyed(cond) ? `key ${KEY.id} · ${pretty(P1)}` : `request · ${pretty(P1)}`, { at: at[0], cue: 'first' });
        d.msg('Booking', 'Booking database', Y.e1, keyed(cond) ? `store ${BK.id} and ${KEY.id}'s result` : `store ${BK.id} Confirmed`, { at: at[1], kind: 'ok', cue: 'store' });
        d.msg('Booking database', 'Booking', Y.e1r, 'stored', { at: at[1], dashed: true, kind: 'ok', cls: 'w6-ret' });
        lost(d, at[2]);
        h.d[cond] = d;
      });
      // plain retry: a new request, a rejection, a second booking
      const dp = h.d['plain-retry'];
      dp.msg('Ari\'s browser', 'Booking', Y.e3, `the same booking again · no key`, { at: 3, cue: 'retry' });
      dp.msg('Booking', 'Booking database', Y.e3a, `check R-01 for ${pretty(P1)}`, { at: 4 });
      dp.msg('Booking database', 'Booking', Y.e3b, `overlaps ${BK.id}`, { at: 4, dashed: true, kind: 'warn', cls: 'w6-ret' });
      dp.msg('Booking', 'Ari\'s browser', Y.e3c, `Rejected · booking conflict`, { at: 4, kind: 'warn', cue: 'rejected' });
      dp.msg('Ari\'s browser', 'Booking', Y.e4, `book ${ROOM2}, ${span(BK.start, BK.end)}, instead`, { at: 5, cue: 'instead' });
      dp.msg('Booking', 'Booking database', Y.e4b, 'store a second booking', { at: 5, kind: 'warn' });
      dp.note(dp.X.Booking, Y.e4n, 'two bookings for one meeting', 'w6-svg-note--bad', 6, null, null, 'two-bookings');
      // same key: the original result comes back
      const ds = h.d['same-key'];
      ds.msg('Ari\'s browser', 'Booking', Y.e3, `retry · key ${KEY.id} · same request`, { at: 3, cue: 'retry' });
      ds.msg('Booking', 'Booking database', Y.e3a, `look up ${KEY.id}`, { at: 3 });
      ds.msg('Booking database', 'Booking', Y.e3b, `${KEY.id} → ${OPREC.result}`, { at: 3, dashed: true, kind: 'ok', cls: 'w6-ret' });
      ds.msg('Booking', 'Ari\'s browser', Y.e3c, `${OPREC.result} · the original result`, { at: 3, kind: 'ok', cue: 'original' });
      // changed payload: an explicit conflict
      const dc = h.d['changed-payload'];
      dc.msg('Ari\'s browser', 'Booking', Y.e3, `retry · key ${KEY.id} · ${pretty(P2)}`, { at: 1, cue: 'retry' });
      dc.msg('Booking', 'Booking database', Y.e3a, `look up ${KEY.id}`, { at: 1 });
      dc.msg('Booking database', 'Booking', Y.e3b, `${KEY.id} was for ${pretty(P1)}`, { at: 1, dashed: true, kind: 'warn', cls: 'w6-ret' });
      dc.msg('Booking', 'Ari\'s browser', Y.e3c, 'conflict: key reused', { at: 1, kind: 'bad', cue: 'conflict' });
      const left = el('div', { style: 'position:relative;min-width:0' }, Object.values(h.d).map((d) => d.svg));
      // right column
      h.screen = bookingScreen(api, { who: `${ARI.name} (${ARI.id})`, room: RI.opening.request.room, start: RI.opening.request.start, end: RI.opening.request.end, cue: 'screen', cls: 'w6-screen--small' });
      h.dbRows = el('div', { class: 'w6-dbrows' });
      h.db = api.cue(el('div', { class: 'card w6-dbcard' }, [cardTitle('Booking database · bookings', 'margin-bottom:4px;font-size:14px'), h.dbRows]), 'stored');
      h.keyRow = el('tr', { class: 'rv' }, [el('td', {}, el('b', {}, OPREC.key)), el('td', {}, OPREC.requester), el('td', {}, pretty(OPREC.payload)), el('td', {}, el('b', { class: 'ok' }, OPREC.result))]);
      h.keys = api.cue(el('div', { class: 'card w6-keys', 'data-cond': 'same-key,changed-payload' }, [
        cardTitle('Booking database · operation keys', 'margin-bottom:2px;font-size:14px'),
        el('table', { class: 'data-table data-table--compact w6-keytable' }, [el('thead', {}, el('tr', {}, ['Key', 'Requester', 'Request', 'Result'].map((t) => el('th', { scope: 'col' }, t)))), el('tbody', {}, h.keyRow)]),
      ]), 'keys');
      h.code = codeCard(api, HANDLE.code, { label: 'Pseudocode: answer a request that carries an operation key', cls: 'w6-code--small', lineCues: 'handle' });
      h.codeBox = api.cue(el('div', { class: 'w6-codebox', 'data-cond': 'same-key,changed-payload' }, [el('div', { class: 'w6-codebox-t' }, 'How Booking answers a keyed request'), h.code]), 'code');
      const caseRows = HANDLE.snippet.cases.map((cs, i) => {
        const [seen, who, key, payload] = cs.args;
        return api.cue(el('tr', { class: 'rv' }, [el('td', {}, seen.length ? `${seen[0][1]} → ${seen[0][3]}` : 'nothing yet'), el('td', {}, `${who} · ${key}`), el('td', {}, pretty(payload)), el('td', {}, el('b', { class: /conflict/.test(cs.expected) ? 'bad' : /Confirmed/.test(cs.expected) ? 'ok' : '' }, cs.expected))]), `case-${i + 1}`);
      });
      h.caseRows = caseRows;
      h.cases = api.cue(el('div', { class: 'card w6-cases rv rv--rise', 'data-cond': 'changed-payload' }, [
        cardTitle('The same handler, four requests (checked results)', 'margin-bottom:2px;font-size:14px'),
        el('table', { class: 'data-table data-table--compact w6-casetable' }, [el('thead', {}, el('tr', {}, ['Stored key', 'From · key', 'Request', 'Answer'].map((t) => el('th', { scope: 'col' }, t)))), el('tbody', {}, caseRows)]),
      ]), 'cases');
      h.saw = api.cue(el('div', { class: 'callout callout--bad rv rv--rise', 'data-cond': 'plain-retry', style: 'font-size:18px;line-height:1.3;padding:8px 14px' }, [el('b', {}, 'One intention, two bookings. '), `${upper1(PR.duplicate)}.`]), 'duplicate');
      h.http = api.cue(el('div', { class: 'callout callout--accent rv rv--rise', 'data-cond': 'same-key', style: 'font-size:17px;line-height:1.3;padding:8px 14px' }, [el('b', {}, 'HTTP and retries. '), `${upper1(RI.http_note.text)}. Nothing makes “exactly once” appear by itself.`]), 'http');
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:10px;min-width:0;position:relative' }, [h.screen, h.db, h.keys, h.codeBox, h.cases, h.saw, h.http]);
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:600px minmax(0,1fr);gap:16px' }, [left, right]));
      return h;
    },
    render(h, view, api) {
      const st = view.state, c = view.conditionId;
      h.d[c].apply(st);
      const plain = c === 'plain-retry', same = c === 'same-key', diff = c === 'changed-payload';
      // the screen
      if (plain) {
        if (st <= 1) h.screen.setStatus('wait', 'Submitting…', '');
        else if (st <= 3) h.screen.setStatus('unknown', 'Unknown outcome', st === 3 ? 'retrying…' : 'the answer never arrived');
        else if (st === 4) h.screen.setStatus('bad', PR.user_sees, `${ARI.name} thinks the room is lost`);
        else h.screen.setStatus('ok', `Confirmed · ${ROOM2}`, `${ARI.name} booked another room`);
      } else if (same) {
        if (st <= 1) h.screen.setStatus('wait', 'Submitting…', `key ${KEY.id}`);
        else if (st === 2) h.screen.setStatus('unknown', 'Unknown outcome', `the browser keeps ${KEY.id} for the retry`);
        else h.screen.setStatus('ok', `Confirmed · ${BK.id}`, `the original result, through ${KEY.id}`);
      } else if (st === 0) h.screen.setStatus('ok', `Confirmed · ${BK.id}`, `${KEY.id} answered earlier`);
      else h.screen.setStatus('bad', 'Conflict: key reused with a different request', 'nothing changed');
      // stored bookings
      const rows = [];
      const b1 = plain ? st >= 1 : same ? st >= 1 : true;
      if (b1) rows.push(el('div', { class: 'w6-dbrow' }, [el('b', {}, BK.id), ` · ${ARI.name} · ${BK.room_id} · ${span(BK.start, BK.end)} · `, el('b', { class: 'ok' }, BK.state)]));
      if (plain && st >= 5) rows.push(el('div', { class: 'w6-dbrow is-bad' }, [el('b', {}, 'second booking'), ` · ${ARI.name} · ${ROOM2} · ${span(BK.start, BK.end)} · `, el('b', { class: 'ok' }, 'Confirmed')]));
      h.dbRows.replaceChildren(...(rows.length ? rows : [el('div', { class: 'w6-dbrow muted' }, 'nothing stored yet')]));
      showIf(h.keyRow, (same && st >= 1) || diff);
      // the handler: which lines answer
      if (same && st >= 3) h.code.focusLines([3, 4, 5, 6]);
      else if (diff && st === 1) h.code.focusLines([3, 4, 7]);
      else if (diff && st >= 2) h.code.focusLines([4]);
      else if (same && st >= 1) h.code.focusLines([8]);
      else h.code.focusLines([]);
      showIf(h.cases, diff && st >= 2);
      h.codeBox.style.display = diff && st >= 2 ? 'none' : '';
      h.caseRows.forEach((r) => showIf(r, diff && st >= 2));
      focusIf(h.caseRows[1], diff && st === 2); focusIf(h.caseRows[2], diff && st >= 2);
      showIf(h.saw, plain && st >= 6);
      showIf(h.http, same && st >= 4);
      h.db.style.display = diff && st >= 2 ? 'none' : '';
      if (plain && st === 5) glow(api, h.db, RED, 1);
      if (same && st === 3) glow(api, h.screen, GREEN, 1);
      if (diff && st === 1) glow(api, h.screen, RED, 1);
    },
    print: [
      { title: 'A lost response, then a retry with no key', condition: 'plain-retry', state: 6, note: `${ARI.name}'s request carries only the booking, ${pretty(P1)}. Booking stores ${BK.id} Confirmed; the response is lost, and the browser shows Unknown outcome. The retry carries no identity: Booking sees ${PR.server_sees}; ${PR.result}; ${ARI.name} sees “${PR.user_sees}”. ${upper1(PR.then)}: ${PR.duplicate}.` },
      { title: `The same key, ${KEY.id}, with the same request`, condition: 'same-key', state: 4, note: `Key scope: ${listAnd(KEY.scope)}. ${upper1(OPREC.stored_with)}. t${TL[3].t}: ${TL[3].event}: ${TL[3].result}. ${upper1(RI.http_note.text)}.` },
      { title: `${KEY.id} reused with a different request`, condition: 'changed-payload', state: 3, principle: true, note: `t${TL[4].t}: ${TL[4].event}: ${TL[4].result}. The handler's checked answers: ${HANDLE.snippet.cases.map((cs) => `${cs.args[1]} with ${cs.args[2]} and ${pretty(cs.args[3])}${cs.args[0].length ? '' : ' (nothing stored yet)'}: ${cs.expected}`).join('; ')}.` },
    ],
  };

  // =====================================================================
  // PAGE · what each answer tells you about the write (after scene 5)
  // =====================================================================
  const ANSWER_STYLE = { conflict: 'warn', unavailable: 'accent', 'server-error': 'bad', timeout: 'bad' };
  const answers = {
    kind: 'page', id: 'answers', role: 'page',
    heading: 'Four answers Ari can get. What does each one say about the write?',
    lead: `${ARI.name} asked for ${pretty(P1)}. Some answers come from Booking, one only from ${ARI.name}'s own clock. Decide for each before you open it.`,
    printRole: 'What an answer tells you',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const rows = ANS.answers.map((a) => {
        const more = el('div', { class: 'w6-arow-more rv rv--rise' }, [
          el('p', {}, [el('b', {}, 'Was it stored? '), a.write]),
          el('p', { class: 'muted' }, [el('b', {}, 'Next: '), a.next]),
        ]);
        const btn = api.cue(el('button', { type: 'button', class: 'ctl-btn w6-ask' }, 'What do we know?'), `ask-${a.id}`);
        const row = api.cue(el('div', { class: `w6-arow w6-arow--${ANSWER_STYLE[a.id]}` }, [
          el('div', { class: 'w6-arow-obs' }, [chip(a.observed, ANSWER_STYLE[a.id], { style: 'font-size:18px;white-space:normal' }), el('span', { class: 'w6-arow-from' }, upper1(a.from))]),
          btn, more,
        ]), `answer-${a.id}`);
        row.btn = btn; row.more = more; row.def = a;
        return row;
      });
      const list = api.cue(el('div', { class: 'card', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:6px' }, [cardTitle(`${ARI.name}'s request: ${pretty(P1)}`, 'margin-bottom:2px;font-size:16px'), ...rows]), 'answers');
      const termBtn = api.cue(el('button', reveal({ type: 'button', class: 'ctl-btn ctl-btn--step w6-big-btn rv rv--rise' }), 'Name the three observations'), 'name-them');
      const terms = ANS.terms.map((t) => api.cue(el('div', { class: 'card w6-term rv rv--rise' }, [el('b', {}, t.term), el('span', {}, upper1(t.means))]), `term-${slug(t.term)}`));
      const wrapUp = api.cue(el('div', { class: 'callout callout--accent rv rv--rise', style: 'font-size:18px;line-height:1.32;padding:10px 14px' }, [el('b', {}, 'An error message is not always a no. '), 'Two of the four leave the write unknown; the same operation key turns them into a safe question.']), 'wrap-up');
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:10px;min-width:0' }, [termBtn, ...terms, wrapUp]);   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:1180px minmax(0,1fr);gap:26px;align-items:start;height:100%' }, [list, right]));
      const apply = () => {
        const st = Number(body.getAttribute('data-state'));
        rows.forEach((r, i) => { showIf(r.more, st >= i + 1); r.btn.setAttribute('aria-disabled', st >= i + 1 ? 'true' : 'false'); focusIf(r, st === i + 1); });
        const n = rows.length;
        showIf(termBtn, st >= n); termBtn.setAttribute('aria-disabled', st === n ? 'false' : 'true');
        terms.forEach((t) => showIf(t, st >= n + 1));
        showIf(wrapUp, st >= n + 1);
      };
      rows.forEach((r, i) => r.btn.addEventListener('click', () => { if (Number(body.getAttribute('data-state')) === i) { body.setAttribute('data-state', String(i + 1)); apply(); } }));
      termBtn.addEventListener('click', () => { if (Number(body.getAttribute('data-state')) === rows.length) { body.setAttribute('data-state', String(rows.length + 1)); apply(); } });
      body.reset = () => { body.setAttribute('data-state', '0'); apply(); };
      apply();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('h3', {}, `${ARI.name}'s request: ${pretty(P1)}`),
          el('ul', {}, ANS.answers.map((a) => el('li', {}, `${a.observed} (${a.from}). Stored? ${a.write}. Next: ${lower1(a.next)}.`))),
        ]),
        el('div', {}, [
          el('h3', {}, 'Three observations, three names'),
          el('ul', {}, ANS.terms.map((t) => el('li', {}, `${t.term}: ${t.means}.`))),
          el('p', {}, 'An error message is not always a no. Two of the four answers leave the write unknown; the same operation key turns them into a safe question.'),
        ]),
      ]));
    },
  };

  // =====================================================================
  // SCENE 6 · async-and-consistency (Bridge)
  // =====================================================================
  const NT = AS.notification, BT = AS.booking;
  const DUP = AS.duplicate_attempt;
  const CRASH = AS.crash_points;
  const CR = AS.curriculum_refinement;
  const COMBO_KIND = { Pending: 'warn', 'Failed delivery': 'bad', Delivered: 'ok', none: 'muted' };
  const asyncAndConsistency = {
    id: 'async-and-consistency', role: 'bridge',
    heading: 'A confirmed booking and a pending email can both be true',
    lead: `${BT.id} and its confirmation email ${NT.id} are two separate facts, with two separate timelines. R-04: a failed email never undoes a confirmed booking.`,
    principle: 'Asynchronous work changes the timing and failure contract; it does not remove responsibility for completion.',
    principleShort: 'Later work is still your work: track it until done.',
    conditions: [
      { id: 'two-timelines', baseline: true, label: `Baseline: ${BT.id} and ${NT.id} on two timelines`, short: 'Two timelines',
        states: [
          { prompt: { question: `${ARI.name}'s booking is confirmed, and still no email has arrived. Did the booking fail?`, options: ['Yes: no email means no booking', 'No: the booking and the email are separate facts', 'Only if the email bounces'] }, caption: `${BT.id} is Confirmed. ${NT.id} has not been delivered yet.` },
          { caption: `Two timelines. ${BT.id}: **Confirmed**. ${NT.id}: **Pending**. ${ARI.name} can rely on the booking now.` },
          { caption: `**${upper1(NT.timeline[1])}.** ${BT.id} does not change. Support can see the failure.` },
          { caption: `**${upper1(NT.timeline[2])}.** Both facts are now complete.` },
          { caption: 'What each combination means to the person who booked, and to support.' },
          { caption: 'Confirmation depends on the booking decision. The email may finish later, and it stays visible until it does.' },
        ] },
      { id: 'duplicate-attempt', label: `Changed: ${NT.id} is attempted twice`, short: 'Duplicate attempt',
        states: [
          { prompt: { question: `${NT.id} is attempted a second time. What should that second attempt do?`, options: ['Send again: duplicates are harmless', 'Cancel the booking', `Nothing new: ${NT.id} is already delivered`] }, caption: 'Two handlers. Same booking, same email, the same repeated attempt.' },
          { caption: `Attempt 1: both handlers deliver ${NT.id}. One email each.` },
          { caption: `Attempt 2 arrives. The first handler ${DUP.tolerant.does}; the second ${DUP.naive.does}.` },
          { caption: `${upper1(DUP.booking)}. Only the handler decides whether repeat work is harmless.` },
        ] },
      { id: 'outbox', label: 'Changed: crashes at three moments', short: 'Crashes and the outbox',
        states: [
          { prompt: { question: `Booking writes ${BT.id}, then writes the pending email separately. The process crashes in between. What survives?`, options: [`${BT.id} only: the email is silently lost`, 'Both', 'Neither'] }, caption: 'Two ways to record the email. Watch a crash at three moments.' },
          { caption: `**Two separate writes, crash between them:** ${CRASH[0].survives}. ${upper1(CRASH[0].meaning)}.` },
          { caption: `**The ${CR.pattern}:** ${listAnd(CR.atomic_commit.map((x) => (x === 'booking' ? `the booking ${BT.id}` : `the pending notification ${NT.id}`)))} commit together. A worker delivers later.` },
          { caption: `**Crash after the commit:** ${CRASH[1].survives}. ${upper1(CRASH[1].meaning)}.` },
          { caption: `**Crash after sending, before marking it delivered:** ${CRASH[2].meaning}. ${CR.guarantee_limit}.` },
          { caption: 'The outbox keeps the work discoverable. The handler still has to tolerate a repeat.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      // ---------------- baseline: the two timelines
      const W = 1264, H = 236;
      const tl = window.VC.svg(W, H, { label: `Timelines of ${BT.id} and ${NT.id}`, uid: (x) => api.uid(`tl-${x}`), class: 'w6-tl' });
      const yB = 74, yN = 178, x0 = 230, x1 = W - 20;
      const T = { submit: 250, confirm: 400, att1: 700, att2: 1010 };
      const rowLabel = (y, a, b) => { tl.appendChild(text(20, y - 6, a, { class: 'w6-tl-k' })); tl.appendChild(text(20, y + 20, b, { class: 'w6-tl-id' })); };
      rowLabel(yB, 'Booking', BT.id); rowLabel(yN, 'Notification', NT.id);
      [yB, yN].forEach((y) => tl.appendChild(s('line', { x1: x0, y1: y, x2: x1, y2: y, class: 'w6-tl-axis' })));
      const band = (x, y, w, cls) => s('rect', { x, y: y - 9, width: w, height: 18, rx: 9, class: `w6-band ${cls}` });
      const dot = (x, y, cls) => s('circle', { cx: x, cy: y, r: 11, class: `w6-dot ${cls}` });
      const lab = (x, y, str, cls, anchor) => text(x, y, str, { class: `w6-tl-l ${cls || ''}`, 'text-anchor': anchor || 'middle' });
      const grp = (kids) => { const g = s('g', { class: 'rv' }, kids); tl.appendChild(g); return g; };
      h.tl = {
        bSubmit: grp([dot(T.submit, yB, 'is-muted'), lab(T.submit, yB - 22, BT.timeline[0])]),
        bConfirm: grp([band(T.confirm, yB, x1 - T.confirm, 'is-ok'), dot(T.confirm, yB, 'is-ok'), lab(T.confirm, yB - 22, BT.timeline[1], 'ok')]),
        nPending: grp([band(T.confirm, yN, T.att1 - T.confirm, 'is-warn'), dot(T.confirm, yN, 'is-warn'), lab(T.confirm, yN - 22, NT.timeline[0], 'warn')]),
        nAtt1: grp([band(T.att1, yN, T.att2 - T.att1, 'is-warn'), dot(T.att1, yN, 'is-bad'), lab(T.att1, yN - 22, upper1(NT.timeline[1]), 'bad')]),
        nAtt2: grp([band(T.att2, yN, x1 - T.att2, 'is-ok'), dot(T.att2, yN, 'is-ok'), lab(T.att2, yN - 22, upper1(NT.timeline[2]), 'ok')]),
      };
      Object.entries({ bSubmit: 'tl-submitted', bConfirm: 'tl-confirmed', nPending: 'tl-pending', nAtt1: 'tl-attempt-1', nAtt2: 'tl-attempt-2' }).forEach(([k, n]) => api.cue(h.tl[k], n));
      h.now = s('g', { class: 'w6-now' }, [s('line', { x1: 0, y1: 26, x2: 0, y2: H - 10 }), text(0, 18, 'now', { 'text-anchor': 'middle' })]);
      api.cue(h.now, 'now');
      tl.appendChild(h.now);
      tl.style.height = `${H}px`;
      h.tlCard = api.cue(el('div', { class: 'card', style: 'padding:4px 10px', 'data-cond': 'two-timelines' }, tl), 'timelines');
      h.T = T;
      h.ariSees = el('p', { class: 'w6-sees-t' });
      h.inbox = el('p', { class: 'w6-inbox' });
      h.supSees = el('p', { class: 'w6-sees-t' });
      const ari = api.cue(el('div', { class: 'card w6-seecard' }, [cardTitle(`${ARI.name} sees`, 'margin-bottom:2px;font-size:15px'), h.ariSees, h.inbox]), 'ari-sees');
      const sup = api.cue(el('div', { class: 'card w6-seecard' }, [cardTitle('Support sees', 'margin-bottom:2px;font-size:15px'), h.supSees]), 'support-sees');
      h.comboRows = AS.combinations.map((cmb, i) => api.cue(el('tr', { class: 'rv' }, [
        el('td', {}, chip(cmb.booking, cmb.booking === 'Confirmed' ? 'ok' : 'bad', { style: 'font-size:16px;padding:1px 10px' })),
        el('td', {}, chip(cmb.notification === 'none' ? 'none' : cmb.notification, COMBO_KIND[cmb.notification], { style: 'font-size:16px;padding:1px 10px' })),
        el('td', {}, cmb.user), el('td', {}, upper1(cmb.support)),
      ]), `combination-${i + 1}`));
      h.combos = api.cue(el('div', { class: 'card rv rv--rise', 'data-cond': 'two-timelines', style: 'padding:6px 12px' }, el('table', { class: 'data-table data-table--compact w6-combos' }, [
        el('thead', {}, el('tr', {}, ['Booking', 'Email', `${ARI.name} is told`, 'Support sees'].map((t) => el('th', { scope: 'col' }, t)))), el('tbody', {}, h.comboRows),
      ])), 'combinations');
      const basePanel = el('div', { 'data-cond': 'two-timelines', style: 'display:flex;flex-direction:column;gap:10px' }, [h.tlCard, el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:14px' }, [ari, sup]), h.combos]);
      // ---------------- duplicate attempt: two handlers
      const handler = (k, def) => {
        const att1 = el('div', { class: 'w6-att rv rv--rise' }, [el('b', {}, 'Attempt 1'), el('span', {}, `send ${NT.id}`), chip('delivered', 'ok', { style: 'font-size:15px;padding:1px 10px' })]);
        const att2 = el('div', { class: 'w6-att rv rv--rise' }, [el('b', {}, 'Attempt 2'), el('span', {}, def.does), chip(k === 'tolerant' ? 'nothing new' : 'sent again', k === 'tolerant' ? 'ok' : 'bad', { style: 'font-size:15px;padding:1px 10px' })]);
        const inbox = el('div', { class: 'w6-mails' });
        const effect = el('p', { class: `w6-effect rv rv--rise ${k === 'tolerant' ? 'ok' : 'bad'}` }, upper1(def.effect));
        const card = api.cue(el('div', { class: `card w6-handler w6-handler--${k}` }, [cardTitle(def.name, 'margin-bottom:4px;font-size:16px'), att1, att2, el('div', { class: 'w6-inboxrow' }, [el('span', { class: 'muted' }, `${ARI.name}'s inbox`), inbox]), effect]), `handler-${k}`);
        card.att1 = att1; card.att2 = att2; card.inbox = inbox; card.effect = effect;
        api.cue(att1, `handler-${k}-attempt-1`); api.cue(att2, `handler-${k}-attempt-2`); api.cue(effect, `handler-${k}-effect`);
        api.cue(inbox.parentElement, `handler-${k}-inbox`);
        return card;
      };
      h.hT = handler('tolerant', DUP.tolerant); h.hN = handler('naive', DUP.naive);
      h.bk6 = api.cue(el('div', { class: 'card w6-bkfixed' }, [el('span', { class: 'w6-db-ico', 'aria-hidden': 'true' }), el('span', {}, [el('b', {}, BT.id), ` · ${BK.room_id} · ${span(BK.start, BK.end)} · `, el('b', { class: 'ok' }, 'Confirmed'), ' · unchanged by any attempt'])]), 'booking');
      const dupPanel = el('div', { 'data-cond': 'duplicate-attempt', style: 'display:flex;flex-direction:column;gap:12px' }, [h.bk6, el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:16px' }, [h.hT, h.hN])]);
      // ---------------- the outbox and three crash points
      const flow = (title, kind, steps) => {
        const rows = steps.map((stp) => {
          const r = el('div', { class: `w6-fstep${stp.crash ? ' w6-fstep--crash' : ''} rv rv--rise` }, [el('span', { class: 'w6-fstep-i', 'aria-hidden': 'true' }, stp.crash ? '⚡' : stp.n), el('span', {}, stp.t)]);
          r.def = stp; return r;
        });
        rows.forEach((r, i) => api.cue(r, `design-${kind}-step-${i + 1}`));
        const card = api.cue(el('div', { class: `card w6-flow w6-flow--${kind}${kind === 'outbox' ? ' rv rv--rise' : ''}` }, [cardTitle(title, 'margin-bottom:6px;font-size:16px'), ...rows]), `design-${kind}`);
        card.rows = rows;
        return card;
      };
      h.fSep = flow('Two separate writes', 'separate', [
        { n: '1', t: `write ${BT.id} Confirmed · commit`, at: 0 },
        { crash: true, t: 'the process crashes here', at: 0 },
        { n: '2', t: `write ${NT.id} Pending`, at: 0, lost: true },
      ]);
      h.fOut = flow(`The ${CR.pattern}`, 'outbox', [
        { n: '1', t: `one commit: ${BT.id} Confirmed and ${NT.id} Pending`, at: 2 },
        { crash: true, t: 'crash after the commit, before delivery', at: 3 },
        { n: '2', t: `a worker reads ${NT.id} and sends it`, at: 3 },
        { crash: true, t: `crash after sending, before ${NT.id} is marked delivered`, at: 4 },
        { n: '3', t: `the worker restarts and sends ${NT.id} again`, at: 4 },
      ]);
      h.results = CRASH.map((cp, i) => api.cue(el('div', { class: `card w6-crash w6-crash--${i === 0 ? 'bad' : i === 1 ? 'ok' : 'warn'} rv rv--rise` }, [
        el('div', { class: 'w6-crash-h' }, [el('span', { 'aria-hidden': 'true' }, '⚡'), el('b', {}, upper1(cp.where))]),
        el('p', {}, [el('b', {}, 'Survives: '), cp.survives]), el('p', { class: 'muted' }, upper1(cp.meaning)),
      ]), `crash-${cp.id}`));
      h.practice = api.cue(el('div', { class: 'callout callout--accent rv rv--rise', style: 'font-size:17px;line-height:1.3;padding:8px 14px' }, [el('b', {}, 'In practice: '), 'queued work commonly runs on RabbitMQ or Kafka. The queue moves the work; it does not decide what a repeat should do.']), 'in-practice');
      const outPanel = el('div', { 'data-cond': 'outbox', style: 'display:grid;grid-template-columns:1fr 1fr;gap:14px;align-content:start' }, [
        h.fSep, h.fOut, h.results[0], el('div', { style: 'display:flex;flex-direction:column;gap:10px' }, [h.results[1], h.results[2]]), el('div', { style: 'grid-column:1 / -1' }, h.practice),
      ]);
      stage.appendChild(el('div', { style: 'position:absolute;inset:0' }, [basePanel, dupPanel, outPanel]));
      return h;
    },
    render(h, view, api) {
      const st = view.state, c = view.conditionId;
      if (c === 'two-timelines') {
        showIf(h.tl.bSubmit, true); showIf(h.tl.bConfirm, true); showIf(h.tl.nPending, true);
        showIf(h.tl.nAtt1, st >= 2); showIf(h.tl.nAtt2, st >= 3);
        const nowX = st >= 3 ? 1150 : st >= 2 ? 840 : 560;
        h.now.setAttribute('transform', `translate(${nowX} 0)`);
        const combo = st >= 3 ? AS.combinations[2] : st >= 2 ? AS.combinations[1] : AS.combinations[0];
        h.ariSees.replaceChildren(el('b', {}, combo.user));
        h.inbox.textContent = st >= 3 ? `Inbox: “Your booking ${BT.id} is confirmed: ${BK.room_id}, ${span(BK.start, BK.end)}”` : 'Inbox: no confirmation email yet';
        h.supSees.replaceChildren(chip(combo.notification, COMBO_KIND[combo.notification], { style: 'font-size:16px;padding:1px 10px;margin-right:8px' }), upper1(combo.support));
        h.comboRows.forEach((r, i) => { showIf(r, st >= 4); focusIf(r, st === 4 && i === (st >= 3 ? 2 : 0)); });
        showIf(h.combos, st >= 4);
        if (st === 2) glow(api, h.tl.nAtt1, RED, 1);
        if (st === 3) glow(api, h.tl.nAtt2, GREEN, 1);
      } else if (c === 'duplicate-attempt') {
        [h.hT, h.hN].forEach((card, i) => {
          showIf(card.att1, st >= 1); showIf(card.att2, st >= 2); showIf(card.effect, st >= 2);
          const n = st >= 2 && i === 1 ? 2 : st >= 1 ? 1 : 0;
          card.inbox.replaceChildren(...Array.from({ length: n }, () => el('span', { class: 'w6-mail', 'aria-hidden': 'true' }, '✉')), el('span', { class: 'w6-mail-n' }, n === 1 ? '1 email' : `${n} emails`));
          card.classList.toggle('is-bad', i === 1 && st >= 2);
        });
        focusIf(h.bk6, st === 3);
        if (st === 2) glow(api, h.hN.inbox, RED, 2);
      } else {
        h.fSep.rows.forEach((r) => {
          showIf(r, st >= r.def.at);
          r.classList.toggle('is-lost', !!r.def.lost && st >= 1);
          if (r.def.lost) r.lastChild.textContent = st >= 1 ? `${r.def.t} · never happens` : r.def.t;
        });
        h.fOut.rows.forEach((r) => showIf(r, st >= r.def.at));
        showIf(h.fOut, st >= 2);
        showIf(h.results[0], st >= 1); showIf(h.results[1], st >= 3); showIf(h.results[2], st >= 4);
        focusIf(h.results[0], st === 1); focusIf(h.results[1], st === 3); focusIf(h.results[2], st === 4);
        showIf(h.practice, st >= 5);
        h.fSep.classList.toggle('is-dim', st >= 2);
        if (st === 2) glow(api, h.fOut, GREEN, 1);
      }
    },
    print: [
      { title: `${BT.id} and ${NT.id}: two timelines and what each combination means`, condition: 'two-timelines', state: 4, note: `${BT.id}: ${BT.timeline.join(' → ')}. ${NT.id}: ${NT.timeline.join(' → ')}. ${AS.combinations.map((cmb) => `${cmb.booking} with ${cmb.notification === 'none' ? 'no email' : cmb.notification.toLowerCase()}: “${cmb.user}”; support sees ${cmb.support}`).join('. ')}.` },
      { title: `A duplicate delivery attempt of ${NT.id}`, condition: 'duplicate-attempt', state: 3, note: `${DUP.tolerant.name}: ${DUP.tolerant.does}, ${DUP.tolerant.effect}. ${DUP.naive.name}: ${DUP.naive.does}, ${DUP.naive.effect}. ${upper1(DUP.booking)}.` },
      { title: `Crash points with two separate writes and with a ${CR.pattern}`, condition: 'outbox', state: 5, principle: true, note: `${CRASH.map((cp) => `${upper1(cp.design)}, ${cp.where}: ${cp.survives}; ${cp.meaning}`).join('. ')}. ${CR.guarantee_limit}.` },
    ],
  };

  // =====================================================================
  // SCENE 7 · contracts-and-evolution (Bridge)
  // =====================================================================
  const CT = CE.contract;
  const CONS = CE.consumers;
  const CHG = Object.fromEntries(CE.changes.map((x) => [x.id, x]));
  const OAPI = CE.openapi;
  const RES_KIND = { works: 'ok', fails: 'bad', 'silently wrong': 'warn' };
  const respLines = (cond, st) => {   // the response body the producer sends in this state
    const id = CT.response[0], out = CT.response[1];
    const L = [{ k: id.field, v: id.example }, { k: out.field, v: out.example }];
    if (cond === 'add-field' && st >= 1) L.push({ k: CHG['add-field'].field, v: CHG['add-field'].example, cls: 'is-new' });
    if (cond === 'new-meaning' && st >= 1) L[1].cls = 'is-slip';
    if (cond === 'new-status') {
      if (st === 1) { L[1].v = CHG['new-status-abrupt'].to; L[1].cls = 'is-slip'; }
      if (st >= 3) L.push({ k: CHG['new-status-transition'].new_field, v: CHG['new-status-transition'].value, cls: 'is-new' });
      if (st >= 5) { L.splice(1, 1); }
    }
    return L;
  };
  const contractsAndEvolution = {
    id: 'contracts-and-evolution', role: 'bridge',
    heading: 'An added field and a changed meaning are not equivalent',
    lead: `The booking contract: what a caller sends, what comes back, which errors exist and how to retry. Three consumers read its answers.`,
    principle: 'Compatibility is a relationship between actual producers and consumers, not a label on a release.',
    principleShort: 'Ask who reads a field before you change it.',
    conditions: [
      { id: 'the-contract', baseline: true, label: 'Baseline: the booking contract today', short: 'The contract',
        states: [
          { caption: 'One contract between Booking and everything that calls it. Make it concrete, one part at a time.' },
          { caption: `**The request:** ${listAnd(CT.request.map((f) => f.field))}. The operation key is the retry identity of scene 5.` },
          { caption: `**Identity is not a field.** ${upper1(CT.identity)}.` },
          { caption: `**The response:** ${listAnd(CT.response.map((f) => f.field))}.` },
          { caption: `**Four error meanings,** each with a defined “when”. Service unavailable is ${CT.errors[3].when}.` },
          { caption: `**The retry rule.** ${CT.retry_rule}` },
          { caption: `An **OpenAPI** description captures ${OAPI.describes}. It does not establish ${listAnd(OAPI.does_not_establish)}.` },
          { caption: 'Three consumers read today’s answers, each in its own way. All three work.' },
        ] },
      { id: 'add-field', label: `Changed: ${lower1(CHG['add-field'].label)}`, short: 'Add a field',
        states: [
          { prompt: { question: `The response gains a field, ${CHG['add-field'].field}. Which consumers keep working?`, options: ['All three: adding is always safe', 'The web app and the door display; the strict export rejects it', 'None of them'] }, caption: `One change: a new field in the response.` },
          { caption: `The producer adds **${CHG['add-field'].field}**. Nothing else changes.` },
          { caption: `**${CONS[0].name}:** ${CHG['add-field'].results.web[1]}.` },
          { caption: `**${CONS[1].name}:** ${CHG['add-field'].results.display[1]}.` },
          { caption: `**${CONS[2].name}:** ${CHG['add-field'].results.export[1]}.` },
          { caption: 'Adding a field is safe only for consumers that ignore what they do not know.' },
        ] },
      { id: 'new-meaning', label: 'Changed: same field, new meaning', short: 'Same field, new meaning',
        states: [
          { prompt: { question: 'Same field, same value: “Confirmed” is now sent as soon as a request arrives, before R-01 is checked. What breaks?', options: ['Nothing: the response looks the same', 'Only the export', 'Every consumer, and no check fails'] }, caption: 'The bytes stay the same. Only what they mean changes.' },
          { caption: `The response looks exactly as before: ${CT.response[1].field} “${CT.response[1].example}”. It now arrives before the decision.` },
          { caption: `Every consumer still parses it, and every one is wrong: ${CONS.map((cn) => `the ${cn.name.toLowerCase()} ${CHG['new-meaning'].results[cn.id][1]}`).join('; ')}.` },
          { caption: 'A changed meaning passes every shape check, an OpenAPI description included.' },
        ] },
      { id: 'new-status', label: 'Changed: new status values', short: 'New status values',
        states: [
          { prompt: { question: `${CT.response[1].field} changes from “${CHG['new-status-abrupt'].from}” to “${CHG['new-status-abrupt'].to}” in one release. What does the door display do?`, options: ['Shows the room as free, silently', 'Fails loudly', 'Keeps working'] }, caption: 'The same booking, a new spelling of its status.' },
          { caption: `**Abrupt change:** the web app works, the door display ${CHG['new-status-abrupt'].results.display[1]}, the export ${CHG['new-status-abrupt'].results.export[1]}.` },
          { caption: `**A transition, step 1:** ${lower1(CHG['new-status-transition'].steps[0])}.` },
          { caption: `**Step 2:** ${lower1(CHG['new-status-transition'].steps[1])}. Old readers still find ${CT.response[1].field}.` },
          { caption: `**Step 3:** ${lower1(CHG['new-status-transition'].steps[2])}.` },
          { caption: `**Step 4:** ${lower1(CHG['new-status-transition'].steps[3])}. No consumer broke along the way.` },
          { caption: 'The whole picture: each change, each consumer, and the assumption behind each cell.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      // ---- the contract card (left)
      const sec = (key, title, body) => api.cue(el('div', { class: 'w6-csec rv rv--rise' }, [el('div', { class: 'w6-csec-t' }, title), el('div', { class: 'w6-csec-b' }, body)]), `contract-${key}`);
      const fld = (f) => el('span', { class: 'w6-fld' }, [el('code', {}, f.field), el('span', {}, f.example)]);
      h.secs = {
        request: sec('request', 'Request', el('div', { class: 'w6-flds' }, CT.request.map(fld))),
        identity: sec('identity', 'Identity', upper1(CT.identity)),
        response: sec('response', 'Response', el('div', { class: 'w6-flds' }, CT.response.map(fld))),
        errors: sec('errors', 'Errors', el('ul', { class: 'w6-errs' }, CT.errors.map((e) => el('li', {}, [el('b', {}, e.meaning), ` · ${e.when}`])))),
        retry: sec('retry', 'Retry rule', CT.retry_rule),
      };
      const head = el('div', { class: 'w6-chead' }, [el('code', {}, CT.operation), el('span', { class: 'muted' }, 'Booking contract')]);
      h.contract = api.cue(el('div', { class: 'card w6-contract' }, [head, ...Object.values(h.secs)]), 'contract');
      h.contract.querySelectorAll('.w6-fld').forEach((f) => api.cue(f, `field-${slug(f.firstChild.textContent)}`));
      h.secs.errors.querySelectorAll('li').forEach((li, i) => api.cue(li, `error-${i + 1}`));
      h.oapi = api.cue(el('div', { class: 'card w6-oapi rv rv--rise' }, [
        el('div', { class: 'w6-oapi-col' }, [el('b', { class: 'ok' }, 'An OpenAPI description captures'), el('p', {}, upper1(OAPI.describes))]),
        el('div', { class: 'w6-oapi-col' }, [el('b', { class: 'bad' }, 'It does not establish'), el('ul', {}, OAPI.does_not_establish.map((x) => el('li', {}, x)))]),
      ]), 'openapi');
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:10px;min-width:0' }, [h.contract, h.oapi]);
      // ---- the response the producer sends (right, top)
      h.respLines = el('div', { class: 'w6-json' });
      h.respNote = el('p', { class: 'w6-resp-note' });
      const resp = api.cue(el('div', { class: 'card w6-resp' }, [cardTitle('Response that Booking sends', 'margin-bottom:4px;font-size:14px'), h.respLines, h.respNote]), 'response');
      // ---- the consumers
      h.cons = CONS.map((cn) => {
        const res = el('div', { class: 'w6-cres' });
        const card = api.cue(el('div', { class: 'card w6-cons' }, [el('div', { class: 'w6-cons-n' }, cn.name), el('p', { class: 'w6-cons-r' }, [el('b', {}, 'Reads '), cn.reads]), el('p', { class: 'w6-cons-s' }, upper1(cn.style)), res]), `consumer-${cn.id}`);
        card.res = res; card.def = cn;
        return card;
      });
      const consRow = el('div', { class: 'w6-consrow' }, h.cons);
      h.consRow = consRow;
      // ---- the transition steps and the compatibility matrix
      h.steps = CHG['new-status-transition'].steps.map((t, i) => api.cue(el('li', { class: 'rv rv--rise' }, t), `transition-${i + 1}`));
      h.stepsCard = api.cue(el('div', { class: 'card w6-steps', 'data-cond': 'new-status' }, [cardTitle('A transition instead of a switch', 'margin-bottom:2px;font-size:14px'), el('ol', {}, h.steps)]), 'transition');
      const cell = (r) => el('td', {}, [chip(r[0], RES_KIND[r[0]], { style: 'font-size:14px;padding:0 9px' }), el('span', { class: 'w6-mx-why' }, r[1])]);
      const SHORT = {
        'add-field': `Add ${CHG['add-field'].field}`,
        'new-meaning': 'Same field, new meaning',
        'new-status-abrupt': `“${CHG['new-status-abrupt'].from}” to “${CHG['new-status-abrupt'].to}” in one release`,
        'new-status-transition': `A transition through ${CHG['new-status-transition'].new_field}`,
      };
      const mxRows = CE.changes.map((ch) => api.cue(el('tr', {}, [el('th', { scope: 'row' }, SHORT[ch.id]), ...CONS.map((cn) => cell(ch.results[cn.id]))]), `matrix-${ch.id}`));
      h.matrix = api.cue(el('div', { class: 'card w6-matrix rv rv--rise', 'data-cond': 'new-status' }, el('table', { class: 'data-table data-table--compact' }, [
        el('thead', {}, el('tr', {}, [el('th', { scope: 'col' }, 'Change'), ...CONS.map((cn) => el('th', { scope: 'col' }, [cn.name, el('span', { class: 'w6-mx-ass' }, cn.style.split(';')[0])]))])),
        el('tbody', {}, mxRows),
      ])), 'matrix');
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:10px;min-width:0;position:relative' }, [resp, consRow, h.stepsCard, h.matrix]);
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:560px minmax(0,1fr);gap:16px' }, [left, right]));
      return h;
    },
    render(h, view, api) {
      const st = view.state, c = view.conditionId;
      const base = c === 'the-contract';
      // contract sections
      const order = ['request', 'identity', 'response', 'errors', 'retry'];
      order.forEach((k, i) => { showIf(h.secs[k], base ? st >= i + 1 : true); focusIf(h.secs[k], base && st === i + 1); });
      showIf(h.oapi, base ? st >= 6 : c === 'new-meaning' && st >= 3);
      // response body
      const L = respLines(c, st);
      h.respLines.replaceChildren(el('span', { class: 'w6-json-b' }, '{'), ...L.map((x, i) => el('div', { class: `w6-json-l ${x.cls || ''}` }, [el('span', { class: 'w6-json-k' }, `"${x.k}"`), ': ', el('span', { class: 'w6-json-v' }, `"${x.v}"`), i < L.length - 1 ? ',' : ''])), el('span', { class: 'w6-json-b' }, '}'));
      h.respNote.textContent = c === 'new-meaning' && st >= 1 ? 'Same bytes; now sent before R-01 is checked' : c === 'new-status' && st === 1 ? 'Released in one step' : c === 'new-status' && st >= 3 && st < 5 ? 'Both fields, during the transition' : '';
      // consumers: what happens to each under the current change
      let key = null, upTo = 0;
      if (c === 'add-field' && st >= 2) { key = 'add-field'; upTo = st - 1; }
      else if (c === 'new-meaning' && st >= 2) { key = 'new-meaning'; upTo = 3; }
      else if (c === 'new-status' && st === 1) { key = 'new-status-abrupt'; upTo = 3; }
      else if (c === 'new-status' && st >= 2) { key = 'new-status-transition'; upTo = 3; }
      h.cons.forEach((card, i) => {
        let r = null;
        if (base && st >= 7) r = ['works', 'reads today’s answers'];
        else if (key && i < upTo) r = CHG[key].results[card.def.id];
        card.res.replaceChildren(...(r ? [chip(r[0], RES_KIND[r[0]], { style: 'font-size:15px;padding:1px 10px' }), el('span', {}, r[1])] : []));
        card.classList.toggle('is-bad', !!r && r[0] === 'fails');
        card.classList.toggle('is-warn', !!r && r[0] === 'silently wrong');
        card.classList.toggle('is-ok', !!r && r[0] === 'works');
        focusIf(card, c === 'add-field' && st === i + 2);
      });
      h.steps.forEach((li, i) => { showIf(li, c === 'new-status' && st >= i + 2); li.classList.toggle('is-now', c === 'new-status' && st === i + 2); });
      showIf(h.matrix, c === 'new-status' && st >= 6);
      const whole = c === 'new-status' && st >= 6;   // the matrix takes the place of the cards it summarizes
      h.stepsCard.style.display = whole ? 'none' : '';
      h.consRow.style.display = whole ? 'none' : '';
      if (c === 'new-status' && st === 1) glow(api, h.cons[1], GOLD, 1);
      if (c === 'add-field' && st === 4) glow(api, h.cons[2], RED, 1);
    },
    print: [
      { title: `The booking contract, ${CT.operation}`, condition: 'the-contract', state: 7, note: `Request: ${CT.request.map((f) => `${f.field} (${f.example})`).join(', ')}. Identity: ${CT.identity}. Response: ${CT.response.map((f) => `${f.field} (${f.example})`).join(', ')}. Errors: ${CT.errors.map((e) => `${e.meaning}, ${e.when}`).join('; ')}. ${CT.retry_rule} An OpenAPI description captures ${OAPI.describes}; it does not establish ${listAnd(OAPI.does_not_establish)}.` },
      { title: `Added field: ${CHG['add-field'].field}`, condition: 'add-field', state: 5, note: CONS.map((cn) => `${cn.name} (${cn.style}): ${CHG['add-field'].results[cn.id].join(', ')}`).join('. ') + '.' },
      { title: 'Same field, new meaning', condition: 'new-meaning', state: 3, note: `${upper1(CHG['new-meaning'].label)}. ${CONS.map((cn) => `${cn.name}: ${CHG['new-meaning'].results[cn.id].join(', ')}`).join('. ')}.` },
      { title: 'Producer and consumer compatibility matrix', condition: 'new-status', state: 6, principle: true, note: `Transition steps: ${CHG['new-status-transition'].steps.map(lower1).join('; ')}. Each cell's assumption is the consumer's reading style: ${CONS.map((cn) => `${cn.name}, ${cn.style}`).join('; ')}.` },
    ],
  };

  // =====================================================================
  // SCENE 8 · architecture-decision (Bridge)
  // =====================================================================
  const CS8 = AD.changed_scope;
  const SECTIONS = [
    { key: 'context', title: 'Context', body: () => REC.context },
    { key: 'decision', title: 'Decision', body: () => REC.decision },
    { key: 'scenarios', title: 'Quality scenarios', body: () => el('div', { class: 'w6-qs' }, REC.scenarios.map((q) => el('div', { class: 'w6-qsrow' }, [el('b', {}, q.id), el('span', {}, [q.situation, el('span', { class: 'w6-qs-arrow' }, ' → '), el('i', {}, q.expected)]), el('span', { class: 'w6-qs-by' }, q.protected_by)]))) },
    { key: 'tradeoffs', title: 'Trade-offs', body: () => el('ul', {}, REC.tradeoffs.map((t) => el('li', {}, t))) },
    { key: 'ownership', title: 'Ownership', body: () => REC.ownership },
    { key: 'failures', title: 'When parts fail', body: () => el('ul', {}, REC.failures.map((t) => el('li', {}, t))) },
    { key: 'revisit', title: 'Revisit when', body: () => el('ul', {}, REC.revisit_when.map((t) => el('li', { 'data-trigger': t }, t))) },
  ];
  const architectureDecision = {
    id: 'architecture-decision', role: 'bridge',
    heading: 'Which structure protects the promises?',
    lead: `${REC.id} records why Campus Rooms has its default architecture. Read it section by section, then change one condition.`,
    principle: 'Architecture decisions should explain which requirements they protect and which assumptions would change the choice.',
    principleShort: 'Write down what a choice protects and what would change it.',
    conditions: [
      { id: 'one-campus', baseline: true, label: `Baseline: ${lower1(REC.context.split('.')[0])}`, short: 'One campus',
        states: [
          { prompt: { question: 'Which evidence supports this architecture for Campus Rooms?', options: ['It is the most modern style', 'It has the fewest boxes', 'The requirements it protects, written as testable scenarios'] }, caption: `A diagram shows what was chosen. ${REC.id} says why.` },
          { caption: '**Context:** one campus, one team, and three promises the structure must keep.' },
          { caption: '**Decision:** one modular application, one atomic interval rule, notifications committed beside bookings, operation keys.' },
          { caption: '**Quality scenarios** turn each promise into a situation you can test: a race, an outage, a lost response.' },
          { caption: '**Trade-offs and ownership:** what the choice costs, and who answers for which part.' },
          { caption: '**When parts fail:** the behavior is decided in advance, not discovered in production.' },
          { caption: `**Revisit when** names the changes that would reopen the decision. ${REC.baseline_note}.` },
        ] },
      { id: 'several-campuses', label: 'Changed: several independently operated campuses', short: 'Several campuses',
        states: [
          { prompt: { question: `Campus Rooms now serves ${CS8.change.split(',')[0]}. What should happen to ${REC.id}?`, options: ['Keep it: it has worked so far', 'Reopen it: one of its revisit triggers fired', 'Replace it with services everywhere'] }, caption: `The situation changes: ${CS8.change}.` },
          { caption: `The trigger “${CS8.trigger}” fires. ${REC.id} is due for revisiting.` },
          { caption: 'What must be reconsidered: ownership, the authoritative decision, partitions and contracts.' },
          { caption: `${CS8.not_solved}`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      // ---- the chosen structure, drawn small inside the record
      const W = 600, H = 216;
      const svg = window.VC.svg(W, H, { label: `The architecture ${REC.id} chooses`, uid: (x) => api.uid(`ad-${x}`), class: 'w6-adsvg' });
      const lay = s('g', {}); lay.uid = svg.uid; svg.appendChild(lay);
      lay.appendChild(s('rect', { x: 8, y: 12, width: 404, height: 120, rx: 14, class: 'w6-deploy-r' }));
      lay.appendChild(text(22, 34, 'Application', { class: 'w6-deploy-t' }));
      ['Booking', 'Policy', 'Room Catalog', 'Storage'].forEach((n, i) => lay.appendChild(archBox({ x: 20 + i * 98, y: 44, w: 88, h: 58, label: n.includes(' ') ? n.split(' ') : n, lh: 17, cls: 'w6-mod w6-mod--tiny' })));
      lay.appendChild(text(210, 122, 'one atomic interval rule per room', { class: 'w6-svg-note', 'text-anchor': 'middle' }));
      const db = archBox({ x: 96, y: 150, w: 250, h: 62, kind: 'store', label: 'Booking database', sub: 'bookings · pending email · keys' });
      lay.appendChild(db);
      const wk = archBox({ x: 440, y: 36, w: 150, h: 72, label: ['Notification', 'worker'], lh: 18, cls: 'w6-mod w6-mod--tiny w6-mod--hot' });
      lay.appendChild(wk);
      arrow(lay, { from: { x: 221, y: 132 }, to: { x: 221, y: 152 } });
      arrow(lay, { from: { x: 515, y: 108 }, via: [{ x: 515, y: 182 }], to: { x: 346, y: 182 }, dashed: true, kind: 'accent' });
      svg.style.height = `${H}px`;
      cueDrawing(api, svg, 'chosen');
      h.diagram = api.cue(el('div', { class: 'w6-rslot', 'data-cond': 'one-campus' }, [el('div', { class: 'w6-rsec-t' }, `What ${REC.id} chooses`), svg]), 'diagram');
      h.situation = api.cue(el('div', { class: 'card rv rv--rise w6-situation', 'data-cond': 'several-campuses' }, [el('div', { class: 'w6-rsec-t' }, 'The new situation'), el('p', {}, `${upper1(CS8.change)}.`)]), 'situation');
      h.reconsider = api.cue(el('div', { class: 'card rv rv--rise w6-reconsider', 'data-cond': 'several-campuses' }, [el('div', { class: 'w6-rsec-t' }, 'Reconsider'), el('ul', {}, CS8.reconsider.map((q) => el('li', {}, q)))]), 'reconsider');
      // ---- the record: two columns of sections
      h.secs = SECTIONS.map((sc) => api.cue(el('div', { class: 'w6-rsec rv rv--rise' }, [el('div', { class: 'w6-rsec-t' }, sc.title), el('div', { class: 'w6-rsec-b' }, sc.body())]), `record-${sc.key}`));
      const sec = (k) => h.secs[SECTIONS.findIndex((x) => x.key === k)];
      sec('scenarios').querySelectorAll('.w6-qsrow').forEach((r, i) => api.cue(r, `qs-${i + 1}`));
      ['tradeoffs', 'failures', 'revisit'].forEach((k) => sec(k).querySelectorAll('li').forEach((li, i) => api.cue(li, `${k}-${i + 1}`)));
      h.status = chip(REC.status, 'ok', { style: 'font-size:15px;padding:2px 10px;margin-left:auto' });
      api.cue(h.status, 'record-status');
      h.reqs = el('div', { class: 'w6-rreqs' }, [el('span', { class: 'w6-rreqs-k' }, 'Protects'), ...REC.requirements.map((r) => chip(r, 'violet', { style: 'font-size:15px;padding:1px 10px' })), el('span', { class: 'muted', style: 'font-size:15px' }, 'and safe retries after a lost response')]);
      const colL = el('div', { class: 'w6-rcol' }, [sec('context'), sec('decision'), sec('ownership'), h.diagram, h.situation, h.reconsider]);
      const colR = el('div', { class: 'w6-rcol' }, [sec('scenarios'), sec('tradeoffs'), sec('failures'), sec('revisit')]);
      const record = api.cue(el('div', { class: 'card w6-record' }, [
        el('div', { class: 'w6-rhead' }, [el('span', { class: 'w6-rid' }, REC.id), el('span', { class: 'w6-rtitle' }, REC.title), h.status]),
        h.reqs, el('div', { class: 'w6-rbody' }, [colL, colR]),
      ]), 'record');
      stage.appendChild(el('div', { style: 'position:absolute;inset:0' }, [record]));
      h.trigger = record.querySelector(`[data-trigger="${CS8.trigger}"]`);
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'one-campus';
      const at = { context: 1, decision: 2, scenarios: 3, tradeoffs: 4, ownership: 4, failures: 5, revisit: 6 };
      h.secs.forEach((n, i) => { const k = SECTIONS[i].key; showIf(n, base ? st >= at[k] : true); focusIf(n, base ? st === at[k] : false); });
      if (h.trigger) h.trigger.classList.toggle('w6-fired', !base && st >= 1);
      const due = !base && st >= 1;
      h.status.textContent = due ? 'Revisit due' : REC.status;
      h.status.className = `chip chip--${due ? 'warn' : 'ok'}`;
      focusIf(h.secs[SECTIONS.findIndex((x) => x.key === 'revisit')], !base && st === 1);
      showIf(h.situation, !base);
      showIf(h.reconsider, !base && st >= 2);
    },
    print: [
      { title: `${REC.id}: ${REC.title}`, condition: 'one-campus', state: 6, principle: true, note: `Status: ${REC.status}. Protects ${listAnd(REC.requirements)} and safe retries. Context: ${REC.context} Decision: ${REC.decision} Revisit when: ${REC.revisit_when.map(lower1).join('; ')}. ${REC.baseline_note}.` },
      { title: `Changed: ${CS8.change}`, condition: 'several-campuses', state: 3, note: `The trigger “${CS8.trigger}” fires. Reconsider: ${CS8.reconsider.map(lower1).join('; ')}. ${CS8.not_solved}` },
    ],
  };

  // =====================================================================
  // PAGE · principles and checks
  // =====================================================================
  const CHECKS = [   // plan Section 8, questions 1 to 5, and the answered transfer question (fixtures transfer_checks.w06)
    { q: 'Why can two availability checks both return true?', a: 'They can observe the same earlier state before either write has been enforced.' },
    { q: 'Why not block confirmation on every notification attempt?', a: 'It couples the booking promise to an external dependency unnecessarily under R-04; separate work still needs reliable tracking.' },
    { q: 'What should happen when an operation key is reused with a different payload?', a: 'A defined conflict or rejection, not silently treating the altered request as the original operation.' },
    { q: 'Is a C4 container always a Docker container?', a: 'No. It denotes an application or data-store boundary in that model, not a specific packaging technology.' },
    { q: 'What survives a crash after an atomic booking-and-pending-notification commit?', a: 'The booking and the pending work remain recorded; delivery still needs recovery, and a later retry can repeat a delivery attempt.' },
    { q: TRANSFER.question, a: TRANSFER.answer },
  ];
  const SCENES = [architectureZoom, requestJourney, monolithAndServices, concurrentBooking, retryAndIdempotency, asyncAndConsistency, contractsAndEvolution, architectureDecision];
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
    ['Architecture view', 'A drawing of a system at one stated level of detail.'],
    ['System context', 'The whole system, its users and the outside systems it depends on.'],
    ['Container (C4)', 'A separately running application or data store; not necessarily a Docker container.'],
    ['Component', 'A part with one responsibility inside one running application.'],
    ['Deployment boundary', 'Where one separately released and run piece ends and another begins.'],
    ['Synchronous call', 'The caller waits for the answer before it continues.'],
    ['Asynchronous work', 'Work recorded now and completed later, while the caller moves on.'],
    ['Timeout', 'The waiting side stops waiting; it says nothing about the other side.'],
    ['Unknown outcome', 'The requester cannot tell whether the operation took effect.'],
    ['Invariant', 'A rule that must hold in every state, such as R-01.'],
    ['Interleaving', 'The order in which the steps of concurrent operations actually run.'],
    ['Atomic', 'Done as one indivisible step: nothing happens in between.'],
    ['Isolation level', 'How much a database transaction can see of others that run at the same time.'],
    ['Idempotent', 'Repeating the operation has the same effect as doing it once.'],
    ['Operation key', 'An identity for one intended action, so a retry can be recognized.'],
    ['Transactional outbox', 'Pending work committed together with the change that caused it.'],
    ['Compatibility', 'Whether a producer and its actual consumers still work together after a change.'],
  ];
  const SOURCES = [
    ['S01', 'IEEE Computer Society, Guide to the Software Engineering Body of Knowledge (SWEBOK V4.0a)', 'https://www.computer.org/education/bodies-of-knowledge/software-engineering'],
    ['S02', 'ACM / IEEE-CS / AAAI, Computer Science Curricula 2023, final report', 'https://csed.acm.org/final-report/'],
    ['S08', 'Simon Brown, the C4 model', 'https://c4model.com/'],
    ['S09', 'IETF, RFC 9110: HTTP Semantics', 'https://www.rfc-editor.org/rfc/rfc9110.html'],
    ['S10', 'PostgreSQL documentation, Transaction Isolation', 'https://www.postgresql.org/docs/current/transaction-iso.html'],
    ['S52', 'OpenAPI Initiative, OpenAPI Specification 3.2.1', 'https://spec.openapis.org/oas/v3.2.1.html'],
  ];
  const IN_PRACTICE = 'HTTP contracts are often described in OpenAPI; PostgreSQL can enforce a no-overlap rule for time ranges with an exclusion constraint; queued work commonly runs on RabbitMQ or Kafka; and services ship as Docker images, which are a packaging format, not the containers of the C4 model.';
  const PRACTICE_YEAR = (String(AD.reviewed).match(/\b(\d{4})\b/) || [])[1];
  if (!PRACTICE_YEAR) throw new Error('fixture w06/architecture-decision carries no year for the dated In practice examples');
  const IN_PRACTICE_TITLE = `In practice · examples from ${PRACTICE_YEAR}`;
  const HANDOFF_QUESTION = 'How can several people change one system without losing intent or trust?';
  const CARRIED = [
    `The booking contract: request, response, error meanings and the operation-key retry rule.`,
    `${REC.id}, ${lower1(REC.title)}, with its revisit triggers.`,
    `One atomic decision per room protects ${CB.invariant} when requests race.`,
  ];
  const sources = {
    kind: 'page', id: 'sources', role: 'page',
    heading: 'What carries forward, and where to read more',
    lead: 'Next week, several people change this system together. The contracts and the decision record travel with them.',
    printRole: 'Handoff, terminology, sources',
    build(body, api) {
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-height:0' }, [
        api.cue(el('div', { class: 'handoff', style: 'font-size:26px;padding:16px 22px' }, [el('span', { class: 'muted', style: 'font-size:19px;display:block;margin-bottom:8px;font-family:var(--font-text);font-weight:500' }, 'Week 7 starts from this question:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]), 'handoff'),
        api.cue(el('div', { class: 'card', style: 'padding:12px 18px' }, [cardTitle('Carried forward to Week 7'), el('ul', { style: 'font-size:18px;line-height:1.36;display:flex;flex-direction:column;gap:6px' }, CARRIED.map((t) => el('li', {}, t)))]), 'carried'),
        api.cue(el('div', { class: 'card', style: 'padding:12px 18px' }, [cardTitle(IN_PRACTICE_TITLE), el('p', { style: 'font-size:17px;line-height:1.36' }, IN_PRACTICE)]), 'in-practice'),
      ]);
      const middle = api.cue(el('div', { class: 'card', style: 'min-height:0;padding:12px 18px;align-self:start' }, [cardTitle('Terms used this week'), el('dl', { class: 'term-list', style: 'display:block;column-count:2;column-gap:22px;font-size:14.5px;line-height:1.22' }, TERMS.map(([t, d]) => el('div', { style: 'break-inside:avoid;margin-bottom:5px' }, [el('dt', {}, t), el('dd', {}, d)])))]), 'terms');
      const right = api.cue(el('div', { class: 'card', style: 'min-height:0;padding:12px 18px;align-self:start' }, [cardTitle('Sources for this lecture'), el('ul', { class: 'source-list', style: 'font-size:16px;gap:7px' }, SOURCES.map(([k, t, u]) => el('li', {}, [el('span', { class: 'key' }, k), el('span', {}, [t, ' ', el(api.record ? 'span' : 'a', api.record ? { class: 'url', style: 'font-size:14px' } : { class: 'url', href: u, style: 'font-size:14px' }, u)])])))]), 'sources');   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:540px minmax(0,1fr) 450px;gap:22px;height:100%;min-height:0' }, [left, middle, right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('div', { class: 'handoff' }, [el('span', { class: 'muted', style: 'display:block;font-size:14px' }, 'Week 7 starts from this question:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]),
          el('h3', {}, 'Carried forward to Week 7'), el('ul', {}, CARRIED.map((t) => el('li', {}, t))),
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
    week: 6, file: FILE,
    title: 'Architecture, interactions, and distributed failure',
    question: WEEK_Q,
    coverLead: `Student notes for lecture 6. Campus Rooms leaves a single box: its parts run, wait for each other and fail separately. Each scene shows a situation, asks you to predict, reveals the mechanism, changes one condition, compares the outcomes and names the principle: three levels of architecture views, one request across real boundaries, a modular application against separate services, two racing bookings, a lost response and safe retries, a confirmed booking with a pending email, a contract and its consumers, and a decision record.`,
    coverNote: 'Campus Rooms is a fictional room-booking service; every value is a teaching example, and every millisecond value is an illustrative label. The code is Python-like pseudocode.',
    pages: [opening, outcomes, { kind: 'scene', scene: architectureZoom }, { kind: 'scene', scene: requestJourney }, { kind: 'scene', scene: monolithAndServices },
      { kind: 'scene', scene: concurrentBooking }, { kind: 'scene', scene: retryAndIdempotency }, answers, { kind: 'scene', scene: asyncAndConsistency },
      { kind: 'scene', scene: contractsAndEvolution }, { kind: 'scene', scene: architectureDecision }, principles, sources],
  });
})();
