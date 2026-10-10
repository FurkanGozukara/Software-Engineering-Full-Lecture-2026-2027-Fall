/* =====================================================================
   Week 05 · Modularity, interfaces, and the cost of change
   Central question: When one requirement changes, which parts should need to change?

   Every component name, rule, code line, example value and judgment below is read
   from the fixtures (plan/assets/demo-fixtures.json → assets/fixtures/demo-fixtures.js,
   keys w05/*). The refactoring table is recomputed here from the fixture snippets'
   expected cases, and the deck refuses to load when they disagree. Scene identifiers
   come from plan/plan_manifest.json and never change.
   The shell (shared/lecture-controls.js) owns navigation, the control contract, modes
   and print; this file defines content and scenes.
   Layout: the stage is 1264 x 680 design pixels left of the rail; pages keep the
   bottom-right corner (x >= 1664, y >= 696) free where they can.
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
  const FILE = 'week-05.html';
  const SB = A['w05/same-behavior-different-design'];
  const DE = A['w05/dependency-example'];
  const CR = A['w05/cohesion-and-responsibility'];
  const IC = A['w05/interface-contract'];
  const DD = A['w05/dependency-direction'];
  const RC = A['w05/refactoring-under-checks'];
  const AC = A['w05/abstraction-cost'];
  const DR = A['w05/design-rationale'];
  const TRANSFER = F.transfer_checks.w05;
  const FROM = DE.change.from_minutes, TO = DE.change.to_minutes;
  const DUR = CASE.duration_minutes;           // 30..120 inclusive
  const SEARCH = SB.opening_search;
  const NC = DE.notifier_change;
  const RP = IC.result_page;

  // ------------------------------------------------------------------ helpers shared by the pages
  const reveal = (attrs) => Object.assign({ class: 'rv rv--rise' }, attrs);
  const upper1 = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  const lower1 = (str) => str.charAt(0).toLowerCase() + str.slice(1);
  const listAnd = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
  const cardTitle = (str, extra) => el('div', { class: 'card-title', style: `margin-bottom:6px;${extra || ''}` }, str);
  const showIf = (n, on) => { if (n) n.classList.toggle('is-shown', !!on); };
  const focusIf = (n, on) => { if (n) n.classList.toggle('is-focus', !!on); };
  const dimIf = (n, on) => { if (n) n.classList.toggle('is-dim', !!on); };
  const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const mark = (ok) => el('span', { class: `w5-mark ${ok === true ? 'is-ok' : ok === false ? 'is-bad' : 'is-diff'}`, 'aria-hidden': 'true' }, ok === true ? '✓' : ok === false ? '✕' : '~');
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
  /** One line of Python-like pseudocode with light coloring: keywords, strings, numbers, comments, calls. */
  const KW = new Set(['def', 'return', 'if', 'not', 'and', 'or', 'for', 'in', 'class', 'else', 'elif', 'is', 'None', 'True', 'False']);
  function codeLine(src) {
    const frag = [];
    const comment = src.indexOf('  #');
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
  /** A code card whose lines can be focused one by one: [{line node, n}] by 1-based line number. */
  function codeCard(api, src, opts = {}) {
    const lines = src.replace(/\n$/, '').split('\n');
    const rows = lines.map((ln, i) => el('div', { class: 'w5-line', 'data-line': String(i + 1) }, [
      el('span', { class: 'w5-ln', 'aria-hidden': 'true' }, String(i + 1)), el('span', { class: 'w5-src' }, ln ? codeLine(ln) : ' '),
    ]));
    const root = el('div', { class: `w5-code${opts.cls ? ` ${opts.cls}` : ''}`, role: 'group', 'aria-label': opts.label || 'Pseudocode' }, rows);
    if (opts.cue) api.cue(root, opts.cue);
    if (opts.lineCues) rows.forEach((r, i) => api.cue(r, `${opts.lineCues}-${i + 1}`));
    root.rows = rows;
    root.focusLines = (ns, cls = 'is-focus') => rows.forEach((r, i) => r.classList.toggle(cls, ns.includes(i + 1)));
    return root;
  }

  // ------------------------------------------------------------------ the dependency graph shared by scenes 1 and 2
  // A hub layout: Policy sits between the Browser UI and the Reminder (the three components that ask it), the Booking
  // Handler in the middle, and the three components it depends on to the right. No arrow crosses another or a box.
  const GRAPH = {
    big: { W: 820, H: 680, nw: 214, nh: 78, sh: 104, cls: '',
      P: { 'Browser UI': [24, 52], 'Policy': [24, 300], 'Reminder': [24, 560], 'Booking Handler': [300, 300],
           'Room Catalog': [586, 96], 'Notification': [586, 300], 'Storage': [586, 500] } },
    small: { W: 612, H: 412, nw: 160, nh: 60, sh: 80, cls: 'w5-graph--small',
      P: { 'Browser UI': [10, 18], 'Policy': [10, 176], 'Reminder': [10, 334], 'Booking Handler': [222, 176],
           'Room Catalog': [442, 52], 'Notification': [442, 176], 'Storage': [442, 300] } },
  };
  const SIDES = {
    'Browser UI>Booking Handler': ['right', 'top'], 'Browser UI>Policy': ['bottom', 'top'], 'Booking Handler>Policy': ['left', 'right'],
    'Reminder>Policy': ['top', 'bottom'], 'Reminder>Storage': ['right', 'left'], 'Booking Handler>Room Catalog': ['right', 'left'],
    'Booking Handler>Notification': ['right', 'left'], 'Booking Handler>Storage': ['right', 'top'],
  };
  /**
   * A Campus Rooms dependency graph: arrows point from a component to the one it depends on. Each box carries a second
   * line for what it knows about the rule (setStatus) and a corner pill for checks that run again (setPill).
   * opts.size big|small; opts.policy show the Policy box; opts.edges the [from, to] list; opts.prefix for cue names.
   */
  function depGraph(api, opts) {
    const G = GRAPH[opts.size || 'big'];
    const small = G === GRAPH.small;
    const svg = window.VC.svg(G.W, G.H, { label: opts.label || 'Dependency graph of the Campus Rooms components', uid: (x) => api.uid(`${opts.prefix || 'g'}${x}`), class: G.cls });
    const pre = opts.prefix || '';
    const h = { svg, nodes: {}, edges: {}, status: {}, pill: {}, G };
    const box = (name) => ({ x: G.P[name][0], y: G.P[name][1], w: G.nw, h: name === 'Storage' ? G.sh : G.nh });
    h.box = box;
    const names = Object.keys(G.P).filter((n) => n !== 'Policy' || opts.policy);
    const edgeLayer = s('g', {}); edgeLayer.uid = svg.uid; svg.appendChild(edgeLayer);
    (opts.edges || []).forEach(([from, to]) => {
      if (!names.includes(from) || !names.includes(to)) return;
      const [fs, ts] = SIDES[`${from}>${to}`] || ['auto', 'auto'];
      h.edges[`${from}>${to}`] = arrow(edgeLayer, { fromBox: { box: box(from) }, toBox: { box: box(to) }, fromSide: fs, toSide: ts, kind: 'default', cls: 'w5-edge dm' });
    });
    names.forEach((name) => {
      const b = box(name);
      const store = name === 'Storage';
      const g = s('g', { class: `${store ? 'n-store' : 'n-box'} fx dm w5-node`, transform: `translate(${b.x} ${b.y})` });
      if (store) {
        const e = b.h * 0.16;
        g.appendChild(s('path', { d: `M0,${e} A${b.w / 2},${e} 0 0 1 ${b.w},${e} V${b.h - e} A${b.w / 2},${e} 0 0 1 0,${b.h - e} Z` }));
        g.appendChild(s('path', { d: `M0,${e} A${b.w / 2},${e} 0 0 0 ${b.w},${e}`, fill: 'none' }));
      } else g.appendChild(s('rect', { width: b.w, height: b.h, rx: 12, ry: 12 }));
      const midY = store ? b.h / 2 + 4 : b.h / 2;
      const label = text(b.w / 2, midY + (small ? 6 : 8), name, { class: 'n-label', 'text-anchor': 'middle' });
      const st = text(b.w / 2, midY + (small ? 24 : 30), '', { class: 'w5-status', 'text-anchor': 'middle' });
      g.append(label, st);
      g.labelEl = label; g.statusEl = st; g.midY = midY;
      svg.appendChild(g);
      api.cue(g, `${pre}node-${slug(name)}`);
      h.nodes[name] = g;
      // the corner pill: checks that run again
      const pw = small ? 92 : 112, ph = small ? 24 : 28;
      const pill = s('g', { class: 'w5-pill', transform: `translate(${b.w - pw + 8} ${-ph / 2 - 2})` });   // inside the box's group: it belongs to that box
      pill.appendChild(s('rect', { width: pw, height: ph, rx: ph / 2, ry: ph / 2 }));
      pill.appendChild(text(pw / 2, ph / 2 + (small ? 5 : 6), 'check again', { 'text-anchor': 'middle' }));
      pill.style.display = 'none';
      g.appendChild(pill);
      h.pill[name] = pill;
    });
    /** Second line of a box: what it knows about the rule. kind: violet | warn | bad | muted | ok */
    h.setStatus = (name, str, kind) => {
      const g = h.nodes[name]; if (!g) return;
      g.statusEl.textContent = str || '';
      g.statusEl.setAttribute('class', `w5-status${kind ? ` w5-status--${kind}` : ''}`);
      g.labelEl.setAttribute('y', str ? g.midY + (small ? -2 : -4) : g.midY + (small ? 6 : 8));
    };
    h.setPill = (name, on) => { if (h.pill[name]) h.pill[name].style.display = on ? '' : 'none'; };
    h.clear = () => {
      Object.keys(h.nodes).forEach((n) => { h.setStatus(n, ''); h.setPill(n, false); });
      h.setMarks({}); h.edgeMode(() => null);
      h.token.style.display = 'none';
    };
    h.setMarks = (marks) => {   // {name: 'edit'|'recheck'|'unaffected'|'path'|'dim'}
      Object.entries(h.nodes).forEach(([name, n]) => {
        n.classList.remove('state-edit', 'state-recheck', 'state-unaffected', 'w5-on-path');
        const m = marks[name];
        if (m === 'edit') n.classList.add('state-edit');
        else if (m === 'recheck') n.classList.add('state-recheck');
        else if (m === 'unaffected') n.classList.add('state-unaffected');
        else if (m === 'path') n.classList.add('w5-on-path');
        n.classList.toggle('w5-faded', m === 'unaffected' || m === 'dim');
      });
    };
    h.edgeMode = (fn) => Object.entries(h.edges).forEach(([key, a]) => {
      const m = fn(key);
      a.classList.toggle('w5-edge--hot', m === 'hot'); a.classList.toggle('w5-faded', m === 'dim');
      a.path.setAttribute('marker-end', `url(#${svg.uid(`arrow-${m === 'hot' ? 'warn' : 'default'}`)})`);   // the head takes the line's color
    });
    // a token that travels along the drawn arrows (the runtime path of one request)
    h.token = s('circle', { r: small ? 8 : 10, class: 'w5-token', cx: 0, cy: 0 });
    h.token.style.display = 'none';
    svg.appendChild(h.token);
    return h;
  }
  /** Move a graph's token along the arrows of [from, to] hops (a hop against an arrow runs it backwards); registered work. */
  function travel(api, h, hops, onHop) {
    const tk = h.token;
    if (!hops.length) return;
    if (!api.motion) { tk.style.display = 'none'; hops.forEach((hp, i) => onHop && onHop(i, hp)); return; }
    const per = 480;
    let i = 0;
    const runHop = () => {
      if (i >= hops.length) { tk.style.display = 'none'; return; }
      const [a, b] = hops[i];
      const fwd = h.edges[`${a}>${b}`], rev = h.edges[`${b}>${a}`];
      const edge = fwd || rev;
      if (!edge) throw new Error(`no arrow between ${a} and ${b}`);
      const path = edge.path, L = path.getTotalLength();
      let t0 = null;
      tk.style.display = '';
      const frame = (t) => {
        if (t0 == null) t0 = t;
        const p = Math.min(1, (t - t0) / per);
        const e = p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2;
        const pt = path.getPointAtLength(fwd ? L * e : L * (1 - e));
        tk.setAttribute('cx', pt.x); tk.setAttribute('cy', pt.y);
        if (p < 1) api.raf(frame);
        else { if (onHop) onHop(i, hops[i]); i += 1; api.timeout(runHop, 60); }
      };
      api.raf(frame);
    };
    runHop();
  }

  // =====================================================================
  // PAGE · opening situation: search the code for 120
  // =====================================================================
  const QUESTIONS = [
    { q: 'Can two identical screens hide different costs of change?', scenes: '1–2' },
    { q: 'What belongs together in one module?', scenes: '3' },
    { q: 'What must a replacement keep, besides its name?', scenes: '4–5' },
    { q: 'How do you restructure safely, and how much is enough?', scenes: '6–8' },
  ];
  const BUILDS = `one rule change, R-02 from ${FROM} to ${TO} minutes, followed through the code of Campus Rooms, and the design decisions around it.`;
  const opening = {
    kind: 'page', id: 'opening', role: 'page',
    heading: `Exam weeks need shorter bookings. How many places must change?`,
    lead: `Room staff ask for one temporary change to Campus Rooms: the longest booking drops from ${FROM} to ${TO} minutes. Before editing anything, find where that rule lives in the code.`,
    printRole: 'Opening situation',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const change = api.cue(el('div', { class: 'card w5-change', style: 'padding:12px 18px;display:flex;align-items:center;gap:18px' }, [
        el('div', { style: 'display:flex;flex-direction:column;gap:2px;min-width:0' }, [
          cardTitle(`The change · ${DE.change.rule} · ${DE.change.label}`, 'margin-bottom:0'),
          el('p', { style: 'font-size:27px;font-weight:700;line-height:1.2' }, [`Longest booking: `, el('span', { class: 'w5-old' }, `${FROM} minutes`), ' → ', el('span', { class: 'w5-new' }, `${TO} minutes`)]),
        ]),
        el('p', { class: 'muted', style: 'font-size:18px;line-height:1.3;margin-left:auto;max-width:440px' }, `Shortest booking stays ${DUR.min} minutes. After the exam weeks the limit returns to ${FROM}.`),
      ]), 'change');
      const rows = SEARCH.lines.map((ln) => {
        const tag = el('span', { class: 'w5-tag' });
        const row = api.cue(el('div', { class: 'w5-srow' }, [
          el('span', { class: 'w5-comp' }, ln.component),
          el('code', { class: 'w5-scode' }, codeLine(ln.code)),
          tag,
        ]), `line-${slug(ln.component)}`);
        row.tag = tag; row.def = ln;
        return row;
      });
      const codeCardEl = api.cue(el('div', { class: 'card', style: 'padding:12px 16px 14px;display:flex;flex-direction:column;gap:6px' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:baseline' }, [cardTitle('Campus Rooms today · one line from each component', 'margin-bottom:2px'), el('span', { class: 'muted', style: 'font-size:16px' }, 'pseudocode')]),
        ...rows,
      ]), 'code');
      const searchBtn = api.cue(el('button', { type: 'button', class: 'ctl-btn ctl-btn--step w5-big-btn' }, `Search the code for ${SEARCH.query}`), 'search');
      const ruleBtn = api.cue(el('button', reveal({ type: 'button', class: 'ctl-btn ctl-btn--step w5-big-btn rv rv--rise' }), 'Which lines hold the rule?'), 'rule-check');
      const searchNote = el('p', reveal({ class: 'rv rv--rise', style: 'font-size:20px;line-height:1.3;align-self:center' }), [el('b', {}, `${SEARCH.summary.hits} lines match “${SEARCH.query}”.`), ' Are they the rule?']);
      api.cue(searchNote, 'search-result');
      const S = SEARCH.summary;
      const summary = api.cue(el('div', reveal({ class: 'callout callout--bad rv rv--rise', style: 'font-size:20px;line-height:1.32;padding:10px 16px' }), [
        el('b', {}, `${S.rule_copies} copies of one rule. `),
        `The search found ${S.copies_found_by_search}, missed ${S.copies_missed_by_search} written as 2 * 60, and flagged ${S.false_hits} line that is a different ${SEARCH.query}.`,
      ]), 'summary');
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [
        change, codeCardEl,
        el('div', { style: 'display:flex;gap:16px;align-items:center' }, [searchBtn, ruleBtn, searchNote]),
        summary,
      ]);
      const question = api.cue(el('div', reveal({ class: 'rail-card rail-prompt rv rv--rise', style: 'padding:14px 18px' }), [
        el('div', { class: 'rail-eyebrow' }, 'The question of this week'),
        el('p', { class: 'prompt-q', style: 'font-size:22px' }, 'When one requirement changes, which parts should need to change?'),
        el('ul', { class: 'prompt-options', style: 'margin-top:6px;gap:5px' }, ['Every component that mentions it', 'Whatever a search finds', 'Only the part that owns the decision'].map((o, i) => api.cue(el('li', { style: 'font-size:18px;padding:4px 10px' }, [el('span', { class: 'opt-key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)), el('span', {}, o)]), `option-${i + 1}`))),
        el('p', { class: 'rail-note', style: 'margin-top:6px;font-size:17px' }, 'Keep your answer: scenes 1 and 2 test it.'),
      ]), 'question');
      const qrows = QUESTIONS.map((row, i) => api.cue(el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:5px 0;border-top:1px solid var(--line)' }, [
        el('b', { style: 'font-size:17px;line-height:1.25' }, row.q), chip(`scene${row.scenes.length > 1 ? 's' : ''} ${row.scenes}`, 'accent', { style: 'font-size:15px;padding:2px 10px' }),
      ]), `question-${i + 1}`));
      const four = api.cue(el('div', reveal({ class: 'card rv rv--rise', style: 'padding:10px 16px 8px;display:flex;flex-direction:column' }), [cardTitle('Four questions this lecture answers', 'margin-bottom:2px;font-size:17px'), ...qrows]), 'four');
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [question, four]);   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:1150px minmax(0,1fr);gap:26px;align-items:start;height:100%' }, [left, right]));
      const apply = () => {
        const st = Number(body.getAttribute('data-state'));
        rows.forEach((row) => {
          const ln = row.def;
          row.classList.toggle('is-hit', st >= 1 && ln.match);
          row.classList.toggle('is-rule', st >= 2 && ln.rule_copy);
          row.classList.toggle('is-false', st >= 2 && ln.match && !ln.rule_copy);
          row.classList.toggle('is-missed', st >= 2 && !ln.match && ln.rule_copy);
          let label = '';
          if (st >= 2 && ln.rule_copy) label = ln.match ? 'rule copy · found' : `rule copy · missed: ${ln.note.replace('the same rule, ', '')}`;
          else if (st >= 2 && ln.match) label = `not the rule: ${ln.note.replace('a different 120: ', '')}`;
          else if (st >= 1 && ln.match) label = 'match';
          row.tag.textContent = label;
          row.tag.className = `w5-tag${label ? ' is-shown' : ''}${st >= 2 && ln.rule_copy && !ln.match ? ' is-bad' : st >= 2 && ln.rule_copy ? ' is-ok' : st >= 2 && ln.match ? ' is-muted' : ''}`;
        });
        showIf(ruleBtn, st >= 1); showIf(searchNote, st === 1); showIf(summary, st >= 2);
        showIf(question, st >= 2); showIf(four, st >= 2);
        searchBtn.setAttribute('aria-disabled', st >= 1 ? 'true' : 'false');
        ruleBtn.setAttribute('aria-disabled', st === 1 ? 'false' : 'true');
      };
      searchBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '0') { body.setAttribute('data-state', '1'); apply(); } });
      ruleBtn.addEventListener('click', () => { if (body.getAttribute('data-state') === '1') { body.setAttribute('data-state', '2'); apply(); } });
      body.reset = () => { body.setAttribute('data-state', '0'); apply(); };
      apply();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      const S = SEARCH.summary;
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('h3', {}, `The change: ${DE.change.rule}, ${DE.change.label}`),
          el('p', {}, `The longest booking drops from ${FROM} to ${TO} minutes; the shortest stays ${DUR.min}.`),
          el('h3', {}, `Campus Rooms today, and a search for “${SEARCH.query}”`),
          el('table', { class: 'data-table data-table--compact', style: 'font-size:12px' }, [
            el('thead', {}, el('tr', {}, ['Component', 'Line', 'Search', 'The rule?'].map((t) => el('th', { scope: 'col' }, t)))),
            el('tbody', {}, SEARCH.lines.map((ln) => el('tr', {}, [el('td', {}, ln.component), el('td', {}, el('code', {}, ln.code)), el('td', {}, ln.match ? 'match' : '–'), el('td', {}, ln.rule_copy ? (ln.match ? 'rule copy' : `rule copy, missed (${ln.note})`) : (ln.match ? `no: ${ln.note}` : '–'))]))),
          ]),
          el('p', { style: 'margin-top:6px' }, `${S.rule_copies} copies of one rule: the search found ${S.copies_found_by_search}, missed ${S.copies_missed_by_search}, and flagged ${S.false_hits} line that is a different ${SEARCH.query}.`),
        ]),
        el('div', {}, [
          el('h3', {}, 'The question of this week'),
          el('p', {}, 'When one requirement changes, which parts should need to change? (A) Every component that mentions it. (B) Whatever a search finds. (C) Only the part that owns the decision.'),
          el('h3', {}, 'Four questions this lecture answers'),
          el('ul', {}, QUESTIONS.map((row) => el('li', {}, `${row.q} (scene${row.scenes.length > 1 ? 's' : ''} ${row.scenes})`))),
          el('h3', {}, 'What this lecture builds'), el('p', {}, upper1(BUILDS)),
        ]),
      ]));
    },
  };

  // =====================================================================
  // PAGE · recall and outcomes
  // =====================================================================
  const OUTCOMES = [
    'Trace the effect of a requirement change through dependent components.',
    'Distinguish cohesive responsibility from unrelated work gathered in one module.',
    'Explain how an interface can hide changeable implementation details.',
    'Recognize why fewer lines or more abstractions do not automatically mean better design.',
    'Explain refactoring as structural change with preserved intended behavior.',
  ];
  const W4_CARRIED = 'One prioritized change: changing a booking policy without causing widespread edits.';
  const ROLES = [
    ['Browser UI', 'the booking screens people use'],
    ['Booking Handler', 'receives a booking request and answers it'],
    ['Reminder', 'reminds people before a booking starts'],
    ['Policy', 'owns the booking rules, in one of the two designs'],
    ['Room Catalog', `knows the rooms: ${listAnd(CASE.rooms)}`],
    ['Notification', 'sends confirmations and other messages'],
    ['Storage', 'keeps the bookings'],
  ];
  const RULES = [
    ['R-01', 'No overlapping confirmed bookings for the same room; 10:00 to 11:00 and 11:00 to 12:00 only touch.'],
    ['R-02', `A booking lasts ${DUR.min} to ${DUR.max} minutes, both included.`],
    ['R-03', 'You may cancel your own booking before it starts.'],
    ['R-04', 'A failed notification never undoes a confirmed booking.'],
  ];
  const outcomes = {
    kind: 'page', id: 'outcomes', role: 'page',
    heading: 'What you already know, and where this lecture goes',
    lead: 'When one requirement changes, which parts should need to change?',
    printRole: 'Recall and outcomes',
    build(body, api) {
      const recall = api.cue(el('div', { class: 'card', style: 'display:flex;flex-direction:column;gap:6px;padding:12px 18px' }, [
        cardTitle('From Week 4: carried forward', 'margin-bottom:0'),
        el('p', { style: 'font-size:20px;line-height:1.35' }, el('i', {}, W4_CARRIED)),
        el('p', { class: 'muted', style: 'font-size:17px;line-height:1.3' }, 'Week 4 asked where work waits. This week asks what one change costs, and where it lands in the code.'),
      ]), 'recall');
      const cast = api.cue(el('div', { class: 'card', style: 'padding:12px 18px;display:flex;flex-direction:column;gap:4px' }, [
        cardTitle('The components of Campus Rooms', 'margin-bottom:2px'),
        ...ROLES.map(([n, r]) => api.cue(el('div', { style: 'display:grid;grid-template-columns:190px minmax(0,1fr);gap:12px;align-items:baseline;font-size:19px;line-height:1.3' }, [el('span', { class: 'w5-comp' }, n), el('span', {}, r)]), `component-${slug(n)}`)),
      ]), 'components');
      const rules = api.cue(el('div', { class: 'card', style: 'padding:12px 18px;display:flex;flex-direction:column;gap:4px' }, [
        cardTitle('Rules this lecture uses', 'margin-bottom:2px'),
        ...RULES.map(([k, t]) => api.cue(el('div', { style: 'display:grid;grid-template-columns:62px minmax(0,1fr);gap:10px;align-items:baseline;font-size:18px;line-height:1.3' }, [el('b', { style: 'color:var(--violet)' }, k), el('span', {}, t)]), `rule-${k.toLowerCase()}`)),
      ]), 'rules');
      const list = el('ol', { class: 'outcome-list', 'aria-label': 'By the end of this lecture you can', style: 'gap:10px' }, OUTCOMES.map((o, i) => el('li', { style: 'font-size:22px;padding:9px 14px' }, [el('span', { class: 'n', 'aria-hidden': 'true' }, String(i + 1)), el('span', {}, o)])));
      api.cue(list, 'outcomes');
      const right = el('div', {}, [cardTitle('By the end of this lecture you can'), list]);   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { class: 'page-columns', style: 'grid-template-columns:minmax(0,1fr) 860px' }, [el('div', { style: 'display:flex;flex-direction:column;gap:12px' }, [recall, cast, rules]), right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('h3', {}, 'From Week 4'), el('p', {}, `Carried forward: ${W4_CARRIED}`),
          el('h3', {}, 'The components of Campus Rooms'), el('ul', {}, ROLES.map(([n, r]) => el('li', {}, `${n}: ${r}.`))),
          el('h3', {}, 'Rules this lecture uses'), el('ul', {}, RULES.map(([k, t]) => el('li', {}, `${k}: ${t}`))),
        ]),
        el('div', {}, [el('h3', {}, 'By the end of this lecture you can'), el('ol', { class: 'outcome-list' }, OUTCOMES.map((o, i) => el('li', {}, [el('span', { class: 'n' }, String(i + 1)), el('span', {}, o)])))]),
      ]));
    },
  };

  // =====================================================================
  // SCENE 1 · same-behavior-different-design (Bridge)
  // =====================================================================
  const SCR = SB.screen;
  const PATH_A = [['Browser UI', 'Booking Handler'], ['Booking Handler', 'Room Catalog'], ['Room Catalog', 'Booking Handler'],
    ['Booking Handler', 'Storage'], ['Storage', 'Booking Handler'], ['Booking Handler', 'Notification']];
  const PATH_B = [['Browser UI', 'Policy'], ['Policy', 'Browser UI'], ['Browser UI', 'Booking Handler'], ['Booking Handler', 'Policy'],
    ['Policy', 'Booking Handler'], ['Booking Handler', 'Room Catalog'], ['Room Catalog', 'Booking Handler'], ['Booking Handler', 'Storage'],
    ['Storage', 'Booking Handler'], ['Booking Handler', 'Notification']];
  const edgeKey = (a, b, edges) => (edges.some(([f, t]) => f === a && t === b) ? `${a}>${b}` : `${b}>${a}`);
  const holdersA = SB.rule_holders.design_A, holdersB = SB.rule_holders.design_B;
  const sameBehaviorDifferentDesign = {
    id: 'same-behavior-different-design', role: 'bridge',
    heading: 'Two identical screens. Which design is easier to change?',
    lead: `Two versions of Campus Rooms. In both, ${SCR.user} books ${SCR.room} from ${SCR.start} to ${SCR.end} and gets the same answer.`,
    principle: 'Design quality becomes visible through the changes and failures a structure must accommodate.',
    principleShort: 'Structure shows itself when something changes.',
    conditions: [
      { id: 'same-screens', baseline: true, label: `Baseline: the same booking, ${SCR.room} ${SCR.start} to ${SCR.end}, in two designs`, short: 'Same screens',
        states: [
          { prompt: { question: 'Both screens confirm the same booking. Can you tell which design is easier to change?', options: ['No: a screen shows behavior, not structure', 'Yes: the cleaner-looking screen', 'Yes: whichever one answered first'] }, caption: 'The screens match. The structure behind them is hidden.' },
          { caption: `Behind the screens: Design A checks the duration in **${holdersA.length} components**; Design B keeps the rule in **one Policy component**.` },
          { caption: 'One request through Design A: the Browser UI checks the duration, the Booking Handler checks it again, then Room Catalog, Storage and Notification.' },
          { caption: 'The same request through Design B: the Browser UI and the Booking Handler both ask **Policy**. Same steps, same answer.' },
          { caption: '**Same behavior, different structure.** Nothing on the screen tells them apart.', principle: true },
        ] },
      { id: 'limit-90', label: `Changed: the longest booking drops from ${FROM} to ${TO} minutes; the screens and the goal stay the same`, short: `Limit ${TO}`,
        states: [
          { prompt: { question: `The limit drops to ${TO} minutes. Which boxes would you edit in each design?`, options: ['One box in each design', 'Every box in both designs', 'Design A: three, Design B: one'] }, caption: 'Same screens, same goal. Decide before anything is marked.' },
          { caption: `The boxes that decide the duration: **${holdersA.length}** in Design A, **${holdersB.length}** in Design B. Scene 2 follows the change into each one.` },
          { caption: 'The screens still look the same. The cost of the change does not.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const screen = (design) => {
        h[`status${design}`] = window.VC.status('ok', `${SCR.result} · ${SCR.booking}`, `${SCR.minutes} minutes`);
        const b = window.VC.browser({ url: 'campus-rooms.example/book', who: `${SCR.user} (${SCR.user_id})`, cls: 'w5-screen', label: `Design ${design}: the booking screen`,
          body: [
            el('div', { style: 'display:flex;gap:10px' }, [window.VC.field('Room', SCR.room, { style: 'flex:1' }), window.VC.field('Time', `${SCR.start} to ${SCR.end}`, { style: 'flex:1.6' })]),
            h[`status${design}`],
          ] });
        return api.cue(b, `screen-${design.toLowerCase()}`);
      };
      h.screenA = screen('A'); h.screenB = screen('B');
      h.ribbon = ['A', 'B'].map((d) => api.cue(el('div', reveal({ class: 'w5-ribbon rv rv--rise' }), [`Limit ${FROM} → ${TO} minutes`]), `limit-${d.toLowerCase()}`));
      const col = (design, scr, ribbon) => el('div', { style: 'display:flex;flex-direction:column;gap:6px;min-width:0' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;min-height:30px' }, [el('span', { class: 'w5-design-label' }, `Design ${design}`), ribbon]),
        scr,
      ]);
      const top = el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:24px' }, [col('A', h.screenA, h.ribbon[0]), col('B', h.screenB, h.ribbon[1])]);
      h.gA = depGraph(api, { size: 'small', policy: false, edges: DE.design_A.edges, prefix: 'a-', label: 'Inside Design A: dependency graph' });
      h.gB = depGraph(api, { size: 'small', policy: true, edges: DE.design_B.edges, prefix: 'b-', label: 'Inside Design B: dependency graph' });
      const panel = (design, g) => {
        const cover = el('div', { class: 'w5-cover' }, [el('span', { class: 'w5-cover-icon', 'aria-hidden': 'true' }, '?'), el('span', {}, 'The structure behind the screen')]);
        const p = api.cue(el('div', { class: 'card w5-map', style: 'position:relative;padding:8px 10px 4px' }, [
          el('div', { class: 'card-title', style: 'margin-bottom:0;font-size:16px;display:flex;justify-content:space-between' }, [el('span', {}, `Inside Design ${design}`), el('span', { class: 'muted', style: 'text-transform:none;letter-spacing:0;font-weight:500' }, 'arrow: depends on')]),
          g.svg, cover,
        ]), `map-${design.toLowerCase()}`);
        g.svg.style.height = '412px';
        p.cover = cover;
        return p;
      };
      h.mapA = panel('A', h.gA); h.mapB = panel('B', h.gB);
      const bottom = el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:24px;min-height:0' }, [h.mapA, h.mapB]);
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:12px' }, [top, bottom]));
      return h;
    },
    render(h, view, api) {
      const st = view.state, base = view.conditionId === 'same-screens';
      const hidden = base && st === 0;
      [[h.mapA, h.gA], [h.mapB, h.gB]].forEach(([m, g]) => { m.cover.classList.toggle('is-gone', !hidden); g.svg.classList.toggle('w5-hidden', hidden); g.clear(); });
      h.ribbon.forEach((r) => showIf(r, !base));
      const holderStatus = (label, kind) => {
        holdersA.forEach((n) => h.gA.setStatus(n, label, kind));
        holdersB.forEach((n) => h.gB.setStatus(n, label, kind));
        h.gB.setStatus('Browser UI', 'reads the limits', 'muted');
      };
      const tracePath = (g, path, edges, animate, status) => {
        const nodes = new Set(path.flat());
        const hot = new Set(path.map(([a, b]) => edgeKey(a, b, edges)));
        if (!animate) {
          g.setMarks(Object.fromEntries([...nodes].map((n) => [n, 'path'])));
          g.edgeMode((k) => (hot.has(k) ? 'hot' : null));
          return;
        }
        const seen = new Set([path[0][0]]), seenE = new Set();
        g.setMarks(Object.fromEntries([...seen].map((n) => [n, 'path'])));
        travel(api, g, path, (i, [a, b]) => {
          seen.add(b); seenE.add(edgeKey(a, b, edges));
          g.setMarks(Object.fromEntries([...seen].map((n) => [n, 'path'])));
          g.edgeMode((k) => (seenE.has(k) ? 'hot' : null));
          if (i === path.length - 1 && api.motion) api.animate(status, [{ boxShadow: '0 0 0 0 rgba(111,220,154,0)' }, { boxShadow: '0 0 0 6px rgba(111,220,154,0.45)' }, { boxShadow: '0 0 0 0 rgba(111,220,154,0)' }], { duration: 900, easing: 'ease-out' });
        });
      };
      if (base) {
        if (st >= 1) holderStatus(`duration rule · ${FROM}`, 'violet');
        if (st === 2) tracePath(h.gA, PATH_A, DE.design_A.edges, true, h.statusA);
        if (st >= 3) tracePath(h.gA, PATH_A, DE.design_A.edges, false);
        if (st === 3) tracePath(h.gB, PATH_B, DE.design_B.edges, true, h.statusB);
        if (st >= 4) tracePath(h.gB, PATH_B, DE.design_B.edges, false);
      } else if (st >= 1) {
        holderStatus('holds the rule', 'warn');
        h.gA.setMarks(Object.fromEntries(holdersA.map((n) => [n, 'path'])));
        h.gB.setMarks(Object.fromEntries(holdersB.map((n) => [n, 'path'])));
      }
    },
    print: [
      { title: 'Two designs behind the same screen: one request through each', condition: 'same-screens', state: 4, principle: true, note: `Both screens show the same behavior: ${SCR.user} (${SCR.user_id}) books ${SCR.room} from ${SCR.start} to ${SCR.end} and receives ${SCR.result} ${SCR.booking}. Design A: ${SB.request_path.design_A.map((p) => `${p.component} ${p.does}`).join('; ')}; later ${SB.later_step.design_A}. Design B: ${SB.request_path.design_B.map((p) => `${p.component} ${p.does}`).join('; ')}; later ${SB.later_step.design_B}. Arrows point from a component to the one it depends on.` },
      { title: `The limit drops to ${TO} minutes: where the rule lives`, condition: 'limit-90', state: 2, note: `The screen and the user's goal stay the same. The duration rule lives in ${listAnd(holdersA)} in Design A, and only in ${holdersB[0]} in Design B; the Browser UI of Design B reads the limits from Policy for early feedback. Scene 2 follows the change into each component.` },
    ],
  };

  // =====================================================================
  // SCENE 2 · dependency-example (Anchor)
  // =====================================================================
  const MISSED = DE.design_A.missed_copy;
  const dependencyExample = {
    id: 'dependency-example', role: 'anchor',
    heading: 'Watch a single policy change spread',
    lead: `The longest booking drops from ${FROM} to ${TO} minutes (${DE.change.rule}, a ${DE.change.label}). Which components must change, which must be checked again, and which stay untouched?`,
    principle: 'Useful boundaries localize decisions while keeping their dependents and evidence visible.',
    principleShort: 'Keep each decision in one place, and its users visible.',
    conditions: [
      { id: 'design-a', baseline: true, label: `Baseline: Design A, the duration rule is copied into ${DE.design_A.rule_holders.length} components`, short: 'Design A',
        states: [
          { prompt: { question: `The limit drops from ${FROM} to ${TO} minutes. Which components hold that rule, and which only use its result?`, options: ['Only the Booking Handler', 'Every component that checks a duration itself', 'Storage, because it keeps the bookings'] }, caption: 'Seven components. An arrow points from a component to the one it depends on.' },
          { caption: `In Design A the rule is written three times: **${DE.design_A.rule_holders.join('**, **')}** each check the duration themselves.` },
          { caption: `Apply the change: every copy is edited. **${DE.design_A.must_edit.length} edit locations** for one rule.` },
          { caption: `Each edited component has its own checks, and each set runs again: ${DE.design_A.must_recheck.join(', ')}.` },
          { caption: `Untouched: **${DE.design_A.unaffected.join('**, **')}**. They never held the rule.` },
          { caption: `One copy is missed. The **${MISSED.component}** still says ${FROM}, so it accepts a ${MISSED.accepts_minutes}-minute booking that the Booking Handler now rejects.` },
          { caption: 'One copied decision ties three components together: that is **coupling**. Now switch to Design B.' },
        ] },
      { id: 'design-b', label: 'Changed: Design B, where one Policy component owns the rule', short: 'Design B',
        states: [
          { prompt: { question: 'The same change in Design B. Which components must change now?', options: ['Only Policy', 'Policy, and every component that uses it', 'All seven, as in Design A'] }, caption: 'Same components, same change, plus one: **Policy**.' },
          { caption: `The rule lives once, in **Policy**. The Booking Handler and the Reminder ask it; the Browser UI only ${DE.design_B.non_authoritative_mirror.replace('Browser UI ', '')}.` },
          { caption: `Apply the change: **one edit location**, ${DE.design_B.must_edit.join(', ')}.` },
          { caption: `The checks do not vanish: ${DE.design_B.must_recheck.join(', ')}. One module does not mean one file of evidence.` },
          { caption: `Untouched: **${DE.design_B.unaffected.join('**, **')}**. The Reminder asks Policy, so its own code does not change.` },
          { caption: `Compare: ${DE.design_A.must_edit.length} edits against ${DE.design_B.must_edit.length}; ${DE.design_A.must_recheck.length} rechecks of different kinds; a missed copy in A, none in B.` },
          { caption: 'Policy keeps the decision in one place, and its arrows show you what to check again.', principle: true },
        ] },
      { id: 'notifier-swap', label: `Changed: a different change on the same designs: ${NC.change}`, short: 'Email provider',
        states: [
          { prompt: { question: 'Now replace the email provider instead. Which design keeps this change smaller?', options: ['Design B: it has Policy', 'Design A: it has fewer components', 'Neither: only Notification changes in both'] }, caption: 'Design B on screen; Design A has the same Notification and the same caller.' },
          { caption: `Must edit: **${NC.must_edit.join(', ')}**, and nothing else.` },
          { caption: `Check again: ${NC.must_recheck.join(' and ')}.` },
          { caption: `Untouched: **${NC.unaffected.design_B.join('**, **')}**. Policy does nothing for this change.` },
          { caption: 'Each boundary localizes the decisions it was drawn around.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrapEl = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:770px minmax(0,1fr);gap:20px' });
      h.gA = depGraph(api, { size: 'big', policy: false, edges: DE.design_A.edges, prefix: 'a-', label: 'Design A: dependency graph of the Campus Rooms components' });
      h.gB = depGraph(api, { size: 'big', policy: true, edges: DE.design_B.edges, prefix: 'b-', label: 'Design B: dependency graph of the Campus Rooms components' });
      h.gA.svg.setAttribute('data-cond', 'design-a');
      h.gB.svg.setAttribute('data-cond', 'design-b,notifier-swap');
      api.cue(h.gA.svg, 'graph-a'); api.cue(h.gB.svg, 'graph-b');
      // the missed copy in action: the handler and the reminder judge the same 100-minute booking
      h.missed = s('g', { class: 'rv rv--rise', 'data-cond': 'design-a' });
      const hb = h.gA.box('Booking Handler'), rb = h.gA.box('Reminder');
      h.missed.appendChild(window.VC.badge({ x: hb.x + hb.w / 2, y: hb.y + hb.h + 34, label: `now ${TO}: rejects ${MISSED.accepts_minutes} min`, kind: 'ok' }));
      h.missed.appendChild(window.VC.badge({ x: rb.x + rb.w + 18, y: rb.y - 34, label: `still ${FROM}: accepts ${MISSED.accepts_minutes} min`, kind: 'bad', anchor: 'start' }));
      h.gA.svg.appendChild(h.missed);
      api.cue(h.missed, 'missed-copy');
      const left = el('div', { style: 'position:relative;min-width:0' }, [h.gA.svg, h.gB.svg]);
      // right column: the change, the impact table, the missed copy / comparison, the legend
      h.changeTitle = cardTitle('', 'margin-bottom:4px');
      h.changeText = el('p', { style: 'font-size:22px;font-weight:600;line-height:1.25' });
      const changeCard = api.cue(el('div', { class: 'card', style: 'padding:12px 16px' }, [h.changeTitle, h.changeText]), 'change');
      const row = (key, chipEl) => {
        const v = el('span');
        const tr = el('tr', { class: 'rv', 'data-row': key }, [el('th', { scope: 'row' }, chipEl), el('td', {}, v)]);
        tr.v = v; return tr;
      };
      h.rows = { edit: row('edit', chip('must edit', 'warn')), recheck: row('recheck', chip('check again', 'accent')), unaffected: row('unaffected', chip('untouched', 'muted')) };
      const impact = el('table', { class: 'data-table data-table--compact w5-impact' }, [el('caption', {}, 'Impact of the change'), el('tbody', {}, Object.values(h.rows))]);
      const impactCard = api.cue(el('div', { class: 'card', style: 'padding:10px 14px' }, impact), 'impact');
      h.impactCard = impactCard;
      Object.entries(h.rows).forEach(([k, tr]) => api.cue(tr, `impact-${k}`));
      h.missedCallout = api.cue(el('div', { class: 'callout callout--bad rv rv--rise', 'data-cond': 'design-a', style: 'font-size:19px;line-height:1.3' }, [el('b', {}, 'Inconsistent decisions: '), `the ${MISSED.component} accepts ${MISSED.accepts_minutes} minutes while the Booking Handler ${MISSED.while_handler}. One service, two answers.`]), 'missed-callout');
      const cmp = window.VC.table({ caption: 'Design A against Design B', cls: 'data-table--compact', columns: [{ key: 'k', label: '' }, { key: 'a', label: 'Design A' }, { key: 'b', label: 'Design B' }], rows: [
        { attrs: { 'data-cue': 'edits' }, cells: { k: 'Edit locations', a: String(DE.design_A.must_edit.length), b: String(DE.design_B.must_edit.length) } },
        { attrs: { 'data-cue': 'rechecks' }, cells: { k: 'Check again', a: `${DE.design_A.must_recheck.length}, one per copy`, b: `${DE.design_B.must_recheck.length}: rule, use, display` } },
        { attrs: { 'data-cue': 'risk' }, cells: { k: 'Inconsistency', a: el('span', { class: 'bad' }, 'a missed copy'), b: el('span', { class: 'ok' }, 'none') } },
      ] });
      cmp.querySelectorAll('tbody tr').forEach((tr) => api.cue(tr, `compare-${tr.getAttribute('data-cue')}`));
      h.cmpCard = api.cue(el('div', { class: 'card rv rv--rise', 'data-cond': 'design-b', style: 'padding:10px 14px' }, cmp), 'compare');
      h.sameNote = api.cue(el('div', { class: 'callout callout--accent rv rv--rise', 'data-cond': 'notifier-swap', style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'Same in both designs. '), `${upper1(NC.note)}.`]), 'same-note');
      const lg = window.VC.legend([{ kind: 'edit', label: 'must edit' }, { kind: 'recheck', label: 'check again' }, { kind: 'unaffected', label: 'untouched' }]);
      api.cue(lg, 'legend');
      wrapEl.append(left, el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [changeCard, lg, impactCard, h.missedCallout, h.cmpCard, h.sameNote]));
      stage.appendChild(wrapEl);
      return h;
    },
    render(h, view, api) {
      const st = view.state, c = view.conditionId;
      const swap = c === 'notifier-swap';
      const g = c === 'design-a' ? h.gA : h.gB;
      g.clear();
      h.changeTitle.textContent = swap ? 'Change · a second, independent change' : `Change · ${DE.change.rule} (${DE.change.label})`;
      h.changeText.textContent = swap ? upper1(NC.change) : `Longest booking: ${FROM} → ${TO} minutes`;
      let edit = [], recheckNodes = [], recheckText = [], unaffected = [], holders = [];
      if (swap) {
        edit = NC.must_edit; recheckNodes = ['Notification', 'Booking Handler']; recheckText = NC.must_recheck; unaffected = NC.unaffected.design_B;
      } else {
        const d = c === 'design-a' ? DE.design_A : DE.design_B;
        edit = d.must_edit; holders = d.rule_holders; recheckText = d.must_recheck;
        recheckNodes = d.must_recheck.map((r) => r.replace(/ checks$| integration check$| limit display$/, ''));
        unaffected = d.unaffected.map((u) => u.replace(/ logic$/, ''));
      }
      const showRule = !swap && st >= 1, showEdit = st >= (swap ? 1 : 2), showRecheck = st >= (swap ? 2 : 3), showUnaffected = st >= (swap ? 3 : 4);
      const marks = {};
      Object.keys(g.nodes).forEach((name) => {
        if (showEdit && edit.includes(name)) marks[name] = 'edit';
        else if (showRecheck && recheckNodes.includes(name)) marks[name] = 'recheck';
        else if (showUnaffected && unaffected.includes(name)) marks[name] = 'unaffected';
      });
      g.setMarks(marks);
      const missedNow = c === 'design-a' && st >= 5;
      if (showRule) {
        holders.forEach((name) => {
          const missed = missedNow && name === MISSED.component;
          g.setStatus(name, missed ? `still at most ${FROM} min` : showEdit ? `rule: at most ${TO} min` : `rule: at most ${FROM} min`, missed ? 'bad' : showEdit ? 'warn' : 'violet');
        });
        if (c === 'design-b') {
          g.setStatus('Browser UI', 'reads the limits', 'muted');
          g.setStatus('Booking Handler', 'asks Policy', 'muted');
          g.setStatus('Reminder', 'asks Policy', 'muted');
          g.edgeMode((k) => (k.endsWith('>Policy') ? 'hot' : null));
        }
      }
      if (swap && showEdit) g.setStatus('Notification', 'new email provider', 'warn');
      Object.keys(g.nodes).forEach((name) => g.setPill(name, showRecheck && recheckNodes.includes(name)));
      showIf(h.missed, missedNow);
      h.rows.edit.v.textContent = edit.join(', ');
      h.rows.recheck.v.textContent = recheckText.join(', ');
      h.rows.unaffected.v.textContent = (swap ? NC.unaffected.design_B : (c === 'design-a' ? DE.design_A : DE.design_B).unaffected).join(', ');
      showIf(h.rows.edit, showEdit); showIf(h.rows.recheck, showRecheck); showIf(h.rows.unaffected, showUnaffected);
      focusIf(h.rows.edit, st === (swap ? 1 : 2)); focusIf(h.rows.recheck, st === (swap ? 2 : 3)); focusIf(h.rows.unaffected, st === (swap ? 3 : 4));
      showIf(h.missedCallout, missedNow);
      showIf(h.cmpCard, c === 'design-b' && st >= 5);
      h.impactCard.style.display = c === 'design-b' && st >= 5 ? 'none' : '';   // the comparison takes its place
      showIf(h.sameNote, swap && st >= 3);
      const glow = (name, rgb, times) => api.animate(g.nodes[name], [{ filter: `drop-shadow(0 0 0 rgba(${rgb},0))` }, { filter: `drop-shadow(0 0 22px rgba(${rgb},0.95))` }, { filter: `drop-shadow(0 0 0 rgba(${rgb},0))` }], { duration: 1100, iterations: times || 1, easing: 'ease-out' });
      if (api.motion && showEdit && st === (swap ? 1 : 2)) edit.forEach((name) => glow(name, '255,209,102'));
      if (api.motion && showRecheck && st === (swap ? 2 : 3)) recheckNodes.forEach((name) => api.animate(g.pill[name], [{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' }));
      if (api.motion && missedNow && st === 5) glow(MISSED.component, '255,139,123', 2);
    },
    print: [
      { title: `Design A after the change: ${DE.design_A.must_edit.length} edits, ${DE.design_A.must_recheck.length} rechecks, one missed copy`, condition: 'design-a', state: 5, note: `Legend: thick yellow border = must edit; dashed blue border with a pill = check again; faded = untouched. The ${MISSED.component} still carries the old limit and accepts a ${MISSED.accepts_minutes}-minute booking that the Booking Handler ${MISSED.while_handler}: ${MISSED.result}.` },
      { title: `Design B after the same change: ${DE.design_B.must_edit.length} edit, visible rechecks`, condition: 'design-b', state: 6, principle: true, note: `Must edit: ${DE.design_B.must_edit.join(', ')}. Check again: ${DE.design_B.must_recheck.join(', ')}. Untouched: ${DE.design_B.unaffected.join(', ')}. One module does not mean only one file ever changes.` },
      { title: 'A second, independent change: the email provider', condition: 'notifier-swap', state: 4, note: `${upper1(NC.change)}. Must edit: ${NC.must_edit.join(', ')}. Check again: ${NC.must_recheck.join(', ')}. Untouched in Design B: ${NC.unaffected.design_B.join(', ')}; Design A gives the same picture. ${upper1(NC.note)}.` },
    ],
  };

  // =====================================================================
  // SCENE 3 · cohesion-and-responsibility (Bridge)
  // =====================================================================
  const TASKS = CR.tasks;
  const GROUPS = CR.groups;
  const PIPE = CR.pipeline;
  const NF = CR.new_format;
  const CW = 220, CH = 168;                          // a task card
  const UNGROUPED = TASKS.map((t, i) => [36 + i * (CW + 24), 58]);
  const GROUP_X = { 'Policy': 0, 'Messages': 492, 'Display': 744, 'Storage access': 996 };
  const GROUP_W = { 'Policy': 480, 'Messages': 244, 'Display': 244, 'Storage access': 244 };
  const GROUPED = (() => {
    const seen = {};
    return TASKS.map((t) => { const k = seen[t.group] = (seen[t.group] || 0) + 1; return [GROUP_X[t.group] + 12 + (k - 1) * (CW + 16), 58]; });
  })();
  const cohesionAndResponsibility = {
    id: 'cohesion-and-responsibility', role: 'bridge',
    heading: 'A module called Utilities. Do its contents belong together?',
    lead: `Five tasks live in one file, ${CR.module}, and every component imports it. Group them by the reason each one would change.`,
    principle: 'Cohesion concerns meaningful related responsibility, not simply making modules small.',
    principleShort: 'Group what changes together; small alone is not the goal.',
    conditions: [
      { id: 'utilities', baseline: true, label: `Baseline: one module, ${CR.module}, holds five unrelated tasks`, short: 'Utilities',
        states: [
          { prompt: { question: 'Which of these five tasks change for the same reason?', options: ['All five: they share one module', 'None: smaller modules are always better', 'The two booking checks; the others each have their own reason'] }, caption: `One file, five tasks, imported by ${CR.importers.length} components.` },
          { caption: 'Each task gets its **reason to change**: what in the world would make you edit it.' },
          { caption: `Regrouped by reason: **${GROUPS.map((g) => g.id).join('**, **')}**. The two booking rules stay together.` },
          { caption: `Inside one request: **${PIPE.stages[0].stage}** first. ${upper1(PIPE.stages[0].meaning)}.` },
          { caption: `Then **${PIPE.stages[1].stage}**: ${PIPE.stages[1].meaning}.` },
          { caption: `Finally **${PIPE.stages[2].stage}**. Storage, the clock and the email stay at the edges.` },
          { caption: 'The decision is small, pure and easy to find: that is the point of the grouping.', principle: true },
        ] },
      { id: 'new-format', label: `Changed: ${NF.change}; the booking rules stay the same`, short: 'New format',
        states: [
          { prompt: { question: 'A text-message format is added for confirmations. Where does the edit land, and what comes into question?', options: ['Messages, and the Notification that uses it', 'Every group: they were one module', 'Policy too: it is about bookings'] }, caption: 'The same five tasks. One new way to send a confirmation.' },
          { caption: `Before the regrouping the edit lands in **${NF.before.edit}**, and every importer comes into question.` },
          { caption: `After it, the edit lands in **${NF.after.edit}**. Only **${NF.after.in_question.join(', ')}** uses it; ${listAnd(NF.after.untouched)} are untouched.` },
          { caption: `Splitting too far costs too: ${CR.over_split.example}.` },
          { caption: 'Draw boundaries around what changes together.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const area = el('div', { class: 'w5-coh-area' });
      h.module = api.cue(el('div', { class: 'w5-module' }, [
        el('div', { class: 'w5-module-head' }, [el('span', { class: 'w5-file' }, CR.module), el('span', { class: 'muted' }, `imported by ${listAnd(CR.importers)}`)]),
      ]), 'module');
      area.appendChild(h.module);
      h.groups = {};
      GROUPS.forEach((g) => {
        const box = api.cue(el('div', { class: 'w5-group rv', style: `left:${GROUP_X[g.id]}px;width:${GROUP_W[g.id]}px` }, [
          el('div', { class: 'w5-group-head' }, g.id),
        ]), `group-${slug(g.id)}`);
        area.appendChild(box); h.groups[g.id] = box;
      });
      // splitting too far: the Policy group drawn as two modules with two owners
      const P0 = GROUP_X.Policy, PW = GROUP_W.Policy;
      h.splitBoxes = ['duration_rules.py', 'overlap_rules.py'].map((f, i) => {
        const b = api.cue(el('div', { class: 'w5-splitbox rv', style: `left:${P0 + i * (PW / 2 + 4)}px;width:${PW / 2 - 4}px` }, [el('span', { class: 'w5-file w5-file--bad' }, f), el('span', { class: 'w5-owner' }, `owner ${i + 1}`)]), `split-${i + 1}`);
        area.appendChild(b); return b;
      });
      h.splitLink = api.cue(el('div', { class: 'w5-splitlink rv', style: `left:${P0 + PW / 2 - 21}px` }, '⇄'), 'split-link');
      area.appendChild(h.splitLink);
      h.cards = TASKS.map((t, i) => {
        const reason = el('div', { class: 'w5-reason rv' }, [el('span', { class: 'muted' }, 'changes when '), t.reason]);
        const card = api.cue(el('div', { class: 'w5-task', style: `left:${UNGROUPED[i][0]}px;top:${UNGROUPED[i][1]}px;width:${CW}px;height:${CH}px` }, [
          el('div', { class: 'w5-task-text' }, upper1(t.task)), reason,
        ]), `task-${t.id}`);
        card.reason = reason; area.appendChild(card);
        return card;
      });
      // construction: the request pipeline with its stages and its effects
      h.code = codeCard(api, PIPE.code, { cue: 'pipeline', lineCues: 'pipeline-line', label: 'The booking request, as pseudocode' });
      h.code.style.fontSize = '18px';
      const stageChip = (i, st) => api.cue(el('div', { class: 'w5-stage' }, [el('span', { class: 'w5-stage-n' }, String(i + 1)), el('div', {}, [el('b', {}, upper1(st.stage)), el('span', { class: 'muted' }, ` · line${st.lines.length > 1 ? 's' : ''} ${st.lines.join(', ')}`)])]), `stage-${i + 1}`);
      h.stages = PIPE.stages.map((st, i) => stageChip(i, st));
      h.effects = api.cue(el('div', { class: 'w5-effects rv rv--rise' }, [
        el('div', { class: 'w5-effects-head' }, 'At the edges'),
        ...PIPE.effects.map((e) => el('div', { class: 'w5-effect' }, [el('b', {}, upper1(e.effect)), el('span', {}, ` · line${e.lines.length > 1 ? 's' : ''} ${e.lines.join(', ')}: ${e.meaning}`)])),
      ]), 'effects');
      h.example = api.cue(el('div', { class: 'w5-example' }, [el('span', { class: 'muted' }, 'Example request '), el('b', {}, PIPE.example.request), el('span', { class: 'w5-arrow-r', 'aria-hidden': 'true' }, '→'), chip(PIPE.example.outcome, 'ok', { style: 'font-size:17px' })]), 'example');
      h.build = el('div', { class: 'w5-build rv rv--rise', 'data-cond': 'utilities' }, [
        h.code,
        el('div', { style: 'display:flex;flex-direction:column;gap:8px;min-width:0' }, [h.example, ...h.stages, h.effects]),
      ]);
      // the changed condition: before and after the regrouping
      const impactCard = (key, title, edit, list, extra) => api.cue(el('div', { class: 'card w5-impact-card rv rv--rise' }, [
        cardTitle(title, 'margin-bottom:4px;font-size:16px'),
        el('p', { style: 'font-size:19px;line-height:1.3' }, [el('b', {}, 'Edit: '), edit]),
        el('p', { style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'In question: '), listAnd(list)]),
        extra || null,
      ]), key);
      h.before = impactCard('before', 'Before: one Utilities module', NF.before.edit, NF.before.in_question, el('p', { class: 'muted', style: 'font-size:16px;line-height:1.3' }, upper1(NF.before.why)));
      h.after = impactCard('after', 'After: grouped by reason to change', NF.after.edit, NF.after.in_question, el('p', { style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'Untouched: '), listAnd(NF.after.untouched)]));
      h.cost = api.cue(el('div', { class: 'callout rv rv--rise', style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'Too far apart: '), `${upper1(CR.over_split.cost)}.`]), 'split-cost');
      h.compare = el('div', { class: 'w5-coh-compare', 'data-cond': 'new-format' }, [h.before, h.after, h.cost]);
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:14px' }, [area, h.build, h.compare]));
      return h;
    },
    render(h, view, api) {
      const st = view.state, base = view.conditionId === 'utilities';
      const grouped = base ? st >= 2 : (st === 0 || st >= 2);
      h.module.classList.toggle('is-gone', grouped);
      Object.values(h.groups).forEach((g) => showIf(g, grouped));
      h.cards.forEach((c, i) => {
        const [x, y] = grouped ? GROUPED[i] : UNGROUPED[i];
        c.style.left = `${x}px`; c.style.top = `${y}px`;
        showIf(c.reason, base ? st >= 1 : true);
      });
      // the changed condition marks
      const nf = !base;
      h.module.classList.toggle('is-edit', nf && st === 1);
      const split = nf && st >= 3;
      Object.entries(h.groups).forEach(([id, g]) => {
        g.classList.toggle('is-edit', nf && st === 2 && id === NF.after.edit);
        g.classList.toggle('is-dim', nf && st === 2 && NF.after.untouched.includes(id));
        if (id === 'Policy') showIf(g, grouped && !split);
      });
      h.cards.forEach((c, i) => {
        const t = TASKS[i];
        c.classList.toggle('is-edit', nf && ((st === 1) || (st === 2 && t.group === NF.after.edit)));
        c.classList.toggle('is-dim', nf && ((st === 2 && t.group !== NF.after.edit) || (split && t.group !== 'Policy')));
        c.classList.toggle('is-split', split && t.group === 'Policy');
      });
      Object.entries(h.groups).forEach(([id, g]) => { if (id !== 'Policy') g.classList.toggle('is-dim', (nf && st === 2 && NF.after.untouched.includes(id)) || split); });
      h.splitBoxes.forEach((b) => showIf(b, split));
      showIf(h.splitLink, split);
      // construction (baseline)
      showIf(h.build, base && st >= 3);
      h.code.focusLines(base && st === 3 ? PIPE.stages[0].lines : base && st === 4 ? PIPE.stages[1].lines : base && st >= 5 ? PIPE.stages[2].lines : []);
      const eff = base && st >= 5 ? [...new Set(PIPE.effects.flatMap((e) => e.lines))] : [];
      h.code.focusLines(eff, 'is-effect');
      h.stages.forEach((c, i) => { focusIf(c, base && st === 3 + i); c.classList.toggle('is-done', base && st > 3 + i); });
      showIf(h.effects, base && st >= 5);
      showIf(h.before, nf && st >= 1); showIf(h.after, nf && st >= 2); showIf(h.cost, nf && st >= 3);
      focusIf(h.before, nf && st === 1); focusIf(h.after, nf && st === 2);
    },
    print: [
      { title: 'Five tasks regrouped by reason to change, and one request built from them', condition: 'utilities', state: 6, principle: true, maxHeight: 520, note: `${TASKS.map((t) => `${upper1(t.task)}: changes when ${t.reason} (${t.group})`).join('. ')}. In the request, ${PIPE.stages.map((st) => `${st.stage} (line${st.lines.length > 1 ? 's' : ''} ${st.lines.join(', ')}): ${st.meaning}`).join('; ')}. At the edges: ${PIPE.effects.map((e) => `${e.effect}, ${e.meaning}`).join('; ')}.` },
      { title: 'A new message format, before and after the regrouping', condition: 'new-format', state: 4, note: `${upper1(NF.change)}. Before: edit ${NF.before.edit}; in question: ${listAnd(NF.before.in_question)}, because ${NF.before.why}. After: edit ${NF.after.edit}; in question: ${listAnd(NF.after.in_question)}; untouched: ${listAnd(NF.after.untouched)}. Splitting too far: ${CR.over_split.example}; ${CR.over_split.cost}.` },
    ],
  };

  // =====================================================================
  // SCENE 4 · interface-contract (Anchor)
  // =====================================================================
  const IMPL = IC.implementations;
  const IMPL_KEYS = { 'mail-a': 'Mail A (current)', 'mail-b': 'Mail B (replacement)', 'mail-b-reported': 'Mail B, failures reported' };
  const ROWS4 = IC.contract_rows;
  const FD = IC.failed_delivery;
  const ROW_FORMAL = { shape: 'precondition', returns: 'outcome', failure: 'error expectation', confirmation: 'side effect', delivery: 'side effect' };
  const interfaceContract = {
    id: 'interface-contract', role: 'anchor',
    heading: 'Same name, same parameters. Does the replacement fit?',
    lead: `Campus Rooms wants a new email provider. The replacement keeps the call ${IC.interface.split(' ->')[0]}. Rule ${IC.rule}: a failed notification never undoes a confirmed booking.`,
    principle: 'An interface contract includes behavior and failure semantics, not just matching names or parameter lists.',
    principleShort: 'Matching names are not matching behavior.',
    conditions: [
      { id: 'mail-a', baseline: true, label: `Baseline: the current implementation, ${IMPL_KEYS['mail-a']}`, short: 'Mail A',
        states: [
          { prompt: { question: 'Mail B has the same function name and the same parameters as Mail A. Can it replace Mail A safely?', options: ['Yes: the name and parameters match', 'Only if it also behaves as promised', 'Only if it sends emails faster'] }, caption: 'One interface, the current implementation plugged in, a replacement waiting.' },
          { caption: 'The contract has five promises, not one: inputs, result, failure, the confirmation, delivery.' },
          { caption: `${IMPL_KEYS['mail-a']} keeps all five: it returns **${IMPL['Mail A (current)'].returns}** and never raises.` },
          { caption: `A failed delivery with Mail A: **${FD['Mail A (current)'].notifier}**, the handler ${FD['Mail A (current)'].handler}. ${ARI.name} keeps his booking.` },
          { caption: `Delivery is **${IMPL['Mail A (current)'].delivery}**. The contract says so, so callers expect a second email after a retry.` },
        ] },
      { id: 'mail-b', label: `Changed: the replacement, ${IMPL_KEYS['mail-b']}`, short: 'Mail B',
        states: [
          { prompt: { question: 'Mail B plugs into the same socket. What happens when its delivery fails?', options: ['The failure escapes into the booking path', 'The booking stays confirmed, the email pending', 'Nothing visible: email failures are silent'] }, caption: 'Same interface, same call. Watch a delivery fail.' },
          { caption: '**Call shape: fits.** The same name and the same parameters.' },
          { caption: `Three promises break: it returns **${IMPL['Mail B (replacement)'].returns}**, it **raises into the booking path**, and the exception stops the confirmation.` },
          { caption: `The same failed delivery: the booking is stored as **${FD['Mail B (replacement)'].stored}**, Mail B ${FD['Mail B (replacement)'].notifier}, and ${ARI.name} reads an error.` },
          { caption: `${upper1(FD['Mail B (replacement)'].consequence)}. The user promise is broken.` },
        ] },
      { id: 'mail-b-reported', label: `Changed: only Mail B's failure behavior; it reports Failed instead of raising`, short: 'Failures reported',
        states: [
          { caption: 'One condition changes: Mail B now reports a failure as **Failed** instead of raising it.' },
          { caption: `Now the failure is reported, and the confirmation never waits. Two promises still differ: **${IMPL['Mail B, failures reported'].returns}**, and ${IMPL['Mail B, failures reported'].delivery}.` },
          { caption: `The same failed delivery: Mail B ${FD['Mail B, failures reported'].notifier}, the handler ${FD['Mail B, failures reported'].handler}. ${ARI.name} keeps his booking.` },
          { caption: 'Behavior and failure semantics are part of the interface.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      // the interface and the implementation plugged into it
      h.plug = el('div', { class: 'w5-plug' });
      h.waiting = el('div', { class: 'w5-plug w5-plug--waiting' }, IMPL_KEYS['mail-b']);
      const socket = api.cue(el('div', { class: 'card w5-socket' }, [
        el('div', { class: 'card-title', style: 'margin-bottom:4px;font-size:16px' }, 'The interface'),
        el('code', { class: 'w5-sig' }, codeLine(IC.interface)),
        el('div', { class: 'w5-slot' }, [el('span', { class: 'w5-slot-label' }, 'plugged in'), h.plug, h.waiting]),
      ]), 'interface');
      api.cue(h.plug, 'implementation'); api.cue(h.waiting, 'replacement');
      // the contract table: promise | this implementation
      h.rows = {};
      const tbody = el('tbody', {}, ROWS4.map((r) => {
        const verdict = el('td', { class: 'w5-verdict' });
        const tr = api.cue(el('tr', { class: 'rv' }, [
          el('th', { scope: 'row' }, [el('span', {}, r.label), el('span', { class: 'w5-formal' }, ROW_FORMAL[r.id])]),
          el('td', {}, r.promise), verdict,
        ]), `row-${r.id}`);
        tr.verdict = verdict; h.rows[r.id] = tr;
        return tr;
      }));
      h.verdictHead = el('th', { scope: 'col' }, 'Mail A');
      const contract = el('table', { class: 'data-table data-table--compact w5-contract' }, [
        el('caption', { class: 'visually-hidden' }, 'The Notifier contract and how the plugged implementation keeps it'),
        el('thead', {}, el('tr', {}, [el('th', { scope: 'col' }, 'Promise'), el('th', { scope: 'col' }, 'The contract says'), h.verdictHead])), tbody,
      ]);
      const contractCard = api.cue(el('div', { class: 'card', style: 'padding:8px 12px' }, contract), 'contract');
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [socket, contractCard]);
      // a failed delivery, step by step
      const step = (key, icon) => {
        const t = el('span', {});
        const n = api.cue(el('div', { class: 'w5-fstep rv rv--rise' }, [el('span', { class: 'w5-fstep-ico', 'aria-hidden': 'true' }, icon), t]), `step-${key}`);
        n.t = t; return n;
      };
      h.fsteps = { stored: step('stored', '1'), notifier: step('notifier', '2'), handler: step('handler', '3') };
      h.screenStatus = el('div', { class: 'status status--wait' });
      h.screen = api.cue(window.VC.browser({ url: 'campus-rooms.example/book', who: `${ARI.name} (${ARI.id})`, cls: 'w5-screen rv rv--rise', label: 'What Ari sees', body: [h.screenStatus] }), 'screen');
      h.consequence = api.cue(el('div', { class: 'callout callout--bad rv rv--rise', 'data-cond': 'mail-b', style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'What happens next: '), `${upper1(FD['Mail B (replacement)'].consequence)}.`]), 'consequence');
      h.dup = api.cue(el('div', { class: 'callout callout--accent rv rv--rise', 'data-cond': 'mail-a', style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'At least once: '), 'a retry after a lost answer can send the same email twice. The contract says so, and callers plan for it.']), 'duplicates');
      h.r04 = api.cue(el('div', { class: 'w5-r04 rv rv--rise' }, [el('span', { class: 'w5-r04-k' }, IC.rule), h.r04t = el('span', {})]), 'rule-r04');
      const right = api.cue(el('div', { class: 'card w5-fail', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:8px;min-width:0' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:baseline' }, [cardTitle('A failed delivery', 'margin-bottom:0;font-size:16px'), chip(`${FD.booking} · ${FD.room} ${FD.start} to ${FD.end}`, 'muted', { style: 'font-size:15px;padding:2px 10px' })]),
        h.fsteps.stored, h.fsteps.notifier, h.fsteps.handler, h.screen, h.r04, h.consequence, h.dup,
      ]), 'failure');
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:700px minmax(0,1fr);gap:20px' }, [left, right]));
      return h;
    },
    render(h, view, api) {
      const st = view.state, c = view.conditionId;
      const key = IMPL_KEYS[c];
      const verdicts = IC.row_verdicts[key];
      h.plug.textContent = key;
      h.plug.className = `w5-plug${c === 'mail-a' ? '' : ' w5-plug--b'}`;
      h.waiting.style.display = c === 'mail-a' ? '' : 'none';
      h.verdictHead.textContent = key.replace(' (current)', '').replace(' (replacement)', '');
      if (api.motion && st === 0 && c !== 'mail-a') api.animate(h.plug, [{ transform: 'translateX(120px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' });
      const rowsShown = c === 'mail-a' ? st >= 1 : true;
      const verdictFor = (id) => {
        if (c === 'mail-a') return st >= 2;
        if (c === 'mail-b') return id === 'shape' ? st >= 1 : st >= 2;
        return true;
      };
      ROWS4.forEach((r) => {
        const tr = h.rows[r.id];
        showIf(tr, rowsShown);
        const [v, txt] = verdicts[r.id];
        const on = verdictFor(r.id);
        tr.verdict.replaceChildren(...(on ? [mark(v === 'fits' ? true : v === 'breaks' ? false : null), el('span', {}, txt)] : []));
        tr.classList.toggle('is-bad', on && v === 'breaks');
        tr.classList.toggle('is-diff', on && v === 'differs');
        focusIf(tr, (c === 'mail-b' && st === 1 && r.id === 'shape') || (c === 'mail-b-reported' && st === 0 && (r.id === 'failure' || r.id === 'confirmation')));
      });
      // the failed delivery story
      const story = c === 'mail-a' ? st >= 3 : c === 'mail-b' ? st >= 3 : st >= 2;
      const f = FD[key];
      h.fsteps.stored.t.replaceChildren(el('b', {}, 'Storage: '), `${FD.booking} is ${f.stored}`);
      h.fsteps.notifier.t.replaceChildren(el('b', {}, `${key.split(' (')[0].replace(', failures reported', '')}: `), f.notifier);
      h.fsteps.handler.t.replaceChildren(el('b', {}, 'Booking Handler: '), f.handler);
      h.fsteps.notifier.classList.toggle('is-bad', !f.promise_kept); h.fsteps.handler.classList.toggle('is-bad', !f.promise_kept);
      const order = [h.fsteps.stored, h.fsteps.notifier, h.fsteps.handler, h.screen];
      order.forEach((n, i) => {
        showIf(n, story);
        if (story && api.motion && ((c === 'mail-a' && st === 3) || (c === 'mail-b' && st === 3) || (c === 'mail-b-reported' && st === 2))) {
          n.classList.remove('is-shown');
          api.timeout(() => n.classList.add('is-shown'), 120 + i * 650);
        }
      });
      h.screenStatus.className = `status status--${f.promise_kept ? 'ok' : 'bad'}`;
      h.screenStatus.replaceChildren(el('span', { class: 'ico', 'aria-hidden': 'true' }, f.promise_kept ? '✓' : '✕'), el('span', {}, f.screen));
      const verdictAt = c === 'mail-b' ? 4 : c === 'mail-a' ? 3 : 2;
      showIf(h.r04, st >= verdictAt);
      h.r04.classList.toggle('is-bad', !f.promise_kept);
      h.r04t.textContent = f.promise_kept ? 'kept: the booking stands, and the email is pending for a retry.' : 'broken: the booking is stored, but Ari was told it failed.';
      const storyAt = c === 'mail-b-reported' ? 2 : 3;
      if (api.motion && st === verdictAt && verdictAt === storyAt) { h.r04.classList.remove('is-shown'); api.timeout(() => h.r04.classList.add('is-shown'), 120 + 4 * 650); }
      showIf(h.consequence, c === 'mail-b' && st >= 4);
      showIf(h.dup, c === 'mail-a' && st >= 4);
    },
    print: [
      { title: 'The contract, and the current implementation that keeps it', condition: 'mail-a', state: 4, note: `${IC.interface}. ${ROWS4.map((r) => `${r.label} (${ROW_FORMAL[r.id]}): ${r.promise}`).join('; ')}. With ${IMPL_KEYS['mail-a']}, a failed delivery: ${FD['Mail A (current)'].notifier}; the handler ${FD['Mail A (current)'].handler}; the screen says “${FD['Mail A (current)'].screen}”` },
      { title: 'The replacement raises into the booking path', condition: 'mail-b', state: 4, note: `${IMPL_KEYS['mail-b']}: ${ROWS4.map((r) => `${r.label}: ${IC.row_verdicts['Mail B (replacement)'][r.id].join(', ')}`).join('; ')}. A failed delivery: the booking is stored as ${FD['Mail B (replacement)'].stored}, Mail B ${FD['Mail B (replacement)'].notifier}, the handler ${FD['Mail B (replacement)'].handler}; the screen says “${FD['Mail B (replacement)'].screen}” ${upper1(FD['Mail B (replacement)'].consequence)}. This breaks ${IC.rule}.` },
      { title: 'Only the failure behavior changes: the failure is reported', condition: 'mail-b-reported', state: 3, principle: true, note: `${IMPL_KEYS['mail-b-reported']}: ${ROWS4.map((r) => `${r.label}: ${IC.row_verdicts['Mail B, failures reported'][r.id].join(', ')}`).join('; ')}. The booking stays confirmed and the email is pending.` },
    ],
  };

  // =====================================================================
  // PAGE · what a returned result promises (after scene 4)
  // =====================================================================
  const KIND_STYLE = { Confirmed: 'ok', Rejected: 'warn', Unavailable: 'bad' };
  const results = {
    kind: 'page', id: 'results', role: 'page',
    heading: 'One booking request, three kinds of answer',
    lead: 'The booking interface returns one of three results. Each one tells the caller something different, and a well-shaped value answers only one of four separate questions.',
    printRole: 'Results and separate claims',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const sig = codeCard(api, RP.signature, { cue: 'signature', label: 'The booking interface', cls: 'w5-code--nogutter' });
      sig.style.fontSize = '23px';
      const kinds = el('div', { style: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px' }, RP.kinds.map((k) => api.cue(el('div', { class: `card w5-kind w5-kind--${KIND_STYLE[k.kind]}` }, [
        chip(k.kind, KIND_STYLE[k.kind], { style: 'font-size:19px;align-self:flex-start' }),
        el('p', { style: 'font-size:18px;line-height:1.3' }, upper1(k.means)),
        el('p', { class: 'muted', style: 'font-size:16px;line-height:1.25' }, `carries ${k.carries}`),
      ]), `kind-${k.kind.toLowerCase()}`)));
      const exRows = RP.examples.map((x) => {
        const res = el('div', { class: 'w5-exres rv rv--rise' }, [chip(x.result, KIND_STYLE[x.result], { style: 'font-size:17px' }), el('span', {}, x.why)]);
        const btn = api.cue(el('button', { type: 'button', class: 'ctl-btn w5-ask' }, 'Answer'), `example-${x.id}`);
        const row = api.cue(el('div', { class: 'w5-exrow' }, [el('b', { class: 'w5-exreq' }, x.request), btn, res]), `request-${x.id}`);
        row.btn = btn; row.res = res;
        return row;
      });
      const exCard = api.cue(el('div', { class: 'card', style: 'padding:10px 16px;display:flex;flex-direction:column;gap:4px' }, [cardTitle('Four requests', 'margin-bottom:2px;font-size:17px'), ...exRows]), 'requests');
      const claimCards = RP.claims.map((c, i) => {
        const more = el('div', { class: 'w5-claim-more rv rv--rise' }, [el('p', {}, [el('b', {}, 'Evidence: '), c.evidence]), el('p', { class: 'muted' }, c.example)]);
        const b = api.cue(el('button', { type: 'button', class: 'w5-claim', 'aria-pressed': 'false' }, [
          el('span', { class: 'w5-claim-n' }, String(i + 1)), el('span', { class: 'w5-claim-t' }, `${c.claim}?`), more,
        ]), `claim-${c.id}`);
        b.more = more;
        return b;
      });
      const claims = el('div', { style: 'display:flex;flex-direction:column;gap:8px;min-width:0' }, [cardTitle('Four separate questions', 'margin-bottom:0;font-size:17px'), ...claimCards]);   // ends above the presenter corner (y < 696)
      const wrapUp = api.cue(el('div', { class: 'callout callout--accent rv rv--rise', style: 'font-size:19px;line-height:1.32;padding:10px 16px' }, [el('b', {}, 'Shape is one claim. '), 'Domain rules, permission and racing requests each need their own check, even when the returned value looks right.']), 'wrap-up');
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [sig, kinds, exCard, wrapUp]);
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:1130px minmax(0,1fr);gap:26px;align-items:start;height:100%' }, [left, claims]));
      const apply = () => {
        const st = Number(body.getAttribute('data-state'));
        exRows.forEach((r, i) => { showIf(r.res, st >= i + 1); r.btn.setAttribute('aria-disabled', st >= i + 1 ? 'true' : 'false'); focusIf(r, st === i + 1); });
        claimCards.forEach((b, j) => { const n = RP.examples.length + j + 1; showIf(b.more, st >= n); b.setAttribute('aria-pressed', st === n ? 'true' : 'false'); });
        showIf(wrapUp, st >= RP.examples.length + RP.claims.length);
      };
      exRows.forEach((r, i) => r.btn.addEventListener('click', () => { if (Number(body.getAttribute('data-state')) === i) { body.setAttribute('data-state', String(i + 1)); apply(); } }));
      claimCards.forEach((b, j) => b.addEventListener('click', () => { const n = RP.examples.length + j; if (Number(body.getAttribute('data-state')) === n) { body.setAttribute('data-state', String(n + 1)); apply(); } }));
      body.reset = () => { body.setAttribute('data-state', '0'); apply(); };
      apply();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('h3', {}, 'The booking interface'), el('pre', { class: 'code', style: 'font-size:12px' }, RP.signature),
          el('ul', {}, RP.kinds.map((k) => el('li', {}, `${k.kind}: ${k.means}; carries ${k.carries}.`))),
          el('h3', {}, 'Four requests'),
          el('ul', {}, RP.examples.map((x) => el('li', {}, `${x.request} → ${x.result}: ${x.why}.`))),
        ]),
        el('div', {}, [
          el('h3', {}, 'Four separate questions'),
          el('ol', {}, RP.claims.map((c) => el('li', {}, `${c.claim}? Evidence: ${c.evidence}. Example: ${c.example}.`))),
          el('p', {}, 'A well-shaped value answers the first question only. Domain rules, permission and concurrency each need their own check.'),
        ]),
      ]));
    },
  };

  // =====================================================================
  // SCENE 5 · dependency-direction (Bridge)
  // =====================================================================
  const DIRECT = DD.direct, IFACE = DD.interface, SCH = DD.storage_change;
  const dependencyDirection = {
    id: 'dependency-direction', role: 'bridge',
    heading: 'Should the booking rule know how the database stores rows?',
    lead: 'The overlap rule needs the booked intervals of a room. Two views of the same code: who depends on whom in the source, and who calls whom at runtime.',
    principle: 'Depend on the behavior a responsibility needs, and isolate details that change for other reasons.',
    principleShort: 'Depend on what you need, not on how it is stored.',
    conditions: [
      { id: 'direct', baseline: true, label: `Baseline: ${DIRECT.label}`, short: 'Direct',
        states: [
          { prompt: { question: "Should the booking rule depend on the database client's row shape?", options: ['Yes: the rule needs the data', 'It does not matter while it works', 'No: it needs intervals, not rows'] }, caption: 'Policy calls the database client and reads its rows.' },
          { caption: `Look at what the rule now knows: **${listAnd(DIRECT.knows)}**.` },
          { caption: 'The runtime view, drawn separately: Policy calls the client, the client calls the database. Here both views point the same way.' },
          { caption: `Now ${SCH.change}. **Policy must change**, although no booking rule changed.` },
        ] },
      { id: 'interface', label: `Changed: ${IFACE.label}, ${IFACE.name}`, short: 'Interface',
        states: [
          { caption: `Policy depends on **${IFACE.name}**: intervals in, nothing about rows. The **${IFACE.adapter}** depends on that interface too.` },
          { caption: 'At runtime the call still flows down: Policy, adapter, client, database. In the source, the adapter points **up** to the interface.' },
          { caption: `The row shape now lives only inside the ${IFACE.adapter}: **encapsulation**. A part that converts one interface into another is an **Adapter**.` },
          { caption: 'Each part knows only what its responsibility needs.', principle: true },
        ] },
      { id: 'new-database', label: `Changed: ${SCH.change}, with the interface in place`, short: 'New database',
        states: [
          { prompt: { question: 'The bookings move to a different database product. With the interface in place, which code must know?', options: ['Policy and the adapter', 'Only a new adapter', 'Every component that books'] }, caption: 'Same interface, same Policy. Only the storage underneath changes.' },
          { caption: `A **${SCH.interface.edit.join(', ').toLowerCase()}** replaces the ${IFACE.adapter}. ${listAnd(SCH.interface.unchanged)} are unchanged.` },
          { caption: `Still to verify: ${SCH.still_verify.map((v) => v.split(':')[0]).join('; and ')}.` },
          { caption: 'Isolating a detail moves the change; it does not remove the checks.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const node = (svg, b, label, kind, cue, cls) => {
        const n = window.VC.node({ x: b[0], y: b[1], w: b[2], h: b[3], label, kind: kind || 'box', kindLabel: kind === 'ext' ? 'interface' : null, cls: `dm w5-node ${cls || ''}` });
        svg.appendChild(n); api.cue(n, cue); return n;
      };
      const lbl = (svg, x, y, str, anchor, kind) => { const t = text(x, y, str, { class: `w5-elabel${kind ? ` w5-elabel--${kind}` : ''}`, 'text-anchor': anchor || 'middle' }); svg.appendChild(t); return t; };
      // source view: who depends on whom (solid arrows)
      const W = 620, H = 300;
      const src = window.VC.svg(W, H, { label: 'Source code view: which code depends on which', uid: (x) => api.uid(`src-${x}`), class: 'w5-dir' });
      const SP = { policy: [14, 118, 170, 64], iface: [226, 14, 198, 76], adapter: [226, 212, 198, 72], client: [446, 118, 168, 64] };
      const E = s('g', {}); E.uid = src.uid; src.appendChild(E);
      h.srcEdge = {
        direct: arrow(E, { from: { x: 184, y: 150 }, to: { x: 446, y: 150 }, kind: 'warn' }),
        toIface: arrow(E, { from: { x: 150, y: 118 }, to: { x: 226, y: 62 }, kind: 'accent' }),
        implements: arrow(E, { from: { x: 325, y: 212 }, to: { x: 325, y: 90 }, kind: 'violet' }),
        adapterClient: arrow(E, { from: { x: 424, y: 248 }, to: { x: 520, y: 182 }, kind: 'default' }),
      };
      h.srcLabel = {
        direct: lbl(src, 315, 138, 'depends on', 'middle', 'warn'),
        toIface: lbl(src, 140, 84, 'depends on', 'end', 'accent'),
        implements: lbl(src, 336, 156, 'implements', 'start', 'violet'),
        adapterClient: lbl(src, 488, 246, 'depends on', 'start'),
      };
      h.src = {
        policy: node(src, SP.policy, 'Policy', 'box', 'src-policy'),
        iface: node(src, SP.iface, IFACE.name, 'ext', 'src-interface'),
        adapter: node(src, SP.adapter, IFACE.adapter, 'box', 'src-adapter'),
        client: node(src, SP.client, 'Database client', 'box', 'src-client'),
      };
      h.src.newAdapter = node(src, SP.adapter, SCH.new_adapter.split(' ').reduce((acc, w) => { const last = acc[acc.length - 1]; if (last && (`${last} ${w}`).length <= 13) acc[acc.length - 1] = `${last} ${w}`; else acc.push(w); return acc; }, []), 'box', 'src-new-adapter');
      const tag = (svg, x, y, label, kind) => { const b = window.VC.badge({ x, y, label, kind }); svg.appendChild(b); return b; };
      h.tags = { policyEdit: tag(src, 99, 212, 'must edit', 'warn'), policyOk: tag(src, 99, 212, 'unchanged', 'ok'), ifaceOk: tag(src, 538, 36, 'unchanged', 'ok') };
      api.cue(src, 'source-view');
      // runtime view: who calls whom (dashed arrows)
      const RW = 620, RH = 190;
      const run = window.VC.svg(RW, RH, { label: 'Runtime view: which code calls which', uid: (x) => api.uid(`run-${x}`), class: 'w5-dir w5-dir--small' });
      const RP5 = { policy: [4, 74, 100, 58], adapter: [154, 74, 132, 58], client: [334, 74, 136, 58], db: [522, 56, 94, 94] };
      const RE = s('g', {}); RE.uid = run.uid; run.appendChild(RE);
      const mid = (b) => b[1] + b[3] / 2;
      h.runEdge = {
        policyClient: arrow(RE, { from: { x: 104, y: mid(RP5.policy) }, to: { x: 334, y: mid(RP5.client) }, kind: 'accent', dashed: true }),
        policyAdapter: arrow(RE, { from: { x: 104, y: mid(RP5.policy) }, to: { x: 154, y: mid(RP5.adapter) }, kind: 'accent', dashed: true }),
        adapterClient: arrow(RE, { from: { x: 286, y: mid(RP5.adapter) }, to: { x: 334, y: mid(RP5.client) }, kind: 'accent', dashed: true }),
        clientDb: arrow(RE, { from: { x: 470, y: mid(RP5.client) }, to: { x: 522, y: mid(RP5.db) }, kind: 'accent', dashed: true }),
      };
      h.runLabel = {
        policyClient: lbl(run, 219, 60, 'calls', 'middle', 'accent'),
        policyAdapter: lbl(run, 129, 60, 'calls', 'middle', 'accent'),
        adapterClient: lbl(run, 310, 60, 'calls', 'middle', 'accent'),
        clientDb: lbl(run, 496, 60, 'calls', 'middle', 'accent'),
      };
      h.run = {
        policy: node(run, RP5.policy, 'Policy', 'box', 'run-policy'),
        adapter: node(run, RP5.adapter, IFACE.adapter, 'box', 'run-adapter'),
        newAdapter: node(run, RP5.adapter, ['New database', 'adapter'], 'box', 'run-new-adapter'),
        client: node(run, RP5.client, 'Database client', 'box', 'run-client'),
        db: node(run, RP5.db, 'Database', 'store', 'run-database'),
      };
      api.cue(run, 'runtime-view');
      const view = (title, sub, svg, cue) => api.cue(el('div', { class: 'card w5-view', style: 'padding:8px 12px 4px;display:flex;flex-direction:column;gap:2px' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:baseline' }, [el('span', { class: 'card-title', style: 'margin:0;font-size:16px' }, title), el('span', { class: 'muted', style: 'font-size:15px' }, sub)]), svg,
      ]), cue);
      src.style.height = `${H}px`; run.style.height = `${RH}px`;
      h.srcCard = view('Source code: who depends on whom', 'solid arrows', src, 'source-card');
      h.runCard = view('Runtime: who calls whom', 'dashed arrows', run, 'runtime-card');
      h.runCard.classList.add('rv', 'rv--rise');
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [h.srcCard, h.runCard]);
      // right: the code Policy runs, what it knows, what to verify
      const titled = (title, card, cue, cond, extra) => api.cue(el('div', Object.assign({ class: `w5-codebox${extra ? ` ${extra}` : ''}` }, cond ? { 'data-cond': cond } : {}), [el('div', { class: 'w5-codebox-t' }, title), card]), cue);
      h.codeDirect = codeCard(api, DIRECT.code, { lineCues: 'direct-line', label: 'Policy reading rows directly' });
      h.codeIface = codeCard(api, IFACE.code, { lineCues: 'interface-line', label: 'Policy depending on its interface' });
      h.codeAdapter = codeCard(api, IFACE.adapter_code, { lineCues: 'adapter-line', label: 'The adapter' });
      [h.codeDirect, h.codeIface, h.codeAdapter].forEach((c) => { c.style.fontSize = '14.5px'; });
      h.boxDirect = titled('Policy · the overlap rule', h.codeDirect, 'code-direct', 'direct');
      h.boxIface = titled('Policy · the overlap rule', h.codeIface, 'code-interface', 'interface,new-database');
      h.boxAdapter = titled(`${IFACE.adapter} · storage side`, h.codeAdapter, 'code-adapter', 'interface', 'rv rv--rise');
      h.knows = api.cue(el('div', { class: 'card rv rv--rise', 'data-cond': 'direct', style: 'padding:8px 14px' }, [cardTitle('What the rule now knows', 'margin-bottom:2px;font-size:15px'), el('ul', { style: 'font-size:18px;line-height:1.3' }, DIRECT.knows.map((k) => el('li', {}, k)))]), 'knows');
      h.verify = api.cue(el('div', { class: 'card rv rv--rise', 'data-cond': 'new-database', style: 'padding:8px 14px;border-color:var(--accent)' }, [cardTitle('Still to verify', 'margin-bottom:2px;font-size:15px;color:var(--accent-strong)'), el('ul', { style: 'font-size:18px;line-height:1.3' }, SCH.still_verify.map((k) => el('li', {}, upper1(k))))]), 'verify');
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:10px;min-width:0' }, [h.boxDirect, h.boxIface, h.boxAdapter, h.knows, h.verify]);
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:620px minmax(0,1fr);gap:20px' }, [left, right]));
      return h;
    },
    render(h, view) {
      const st = view.state, c = view.conditionId;
      const direct = c === 'direct', iface = c === 'interface', nd = c === 'new-database';
      const vis = (n, on) => { n.style.display = on ? '' : 'none'; };
      vis(h.srcEdge.direct, direct); vis(h.srcLabel.direct, direct);
      ['toIface', 'implements', 'adapterClient'].forEach((k) => { vis(h.srcEdge[k], !direct); vis(h.srcLabel[k], !direct); });
      vis(h.src.iface, !direct); vis(h.src.adapter, iface); vis(h.src.newAdapter, nd);
      vis(h.runEdge.policyClient, direct); vis(h.runLabel.policyClient, direct);
      ['policyAdapter', 'adapterClient'].forEach((k) => { vis(h.runEdge[k], !direct); vis(h.runLabel[k], !direct); });
      vis(h.run.adapter, iface); vis(h.run.newAdapter, nd);
      showIf(h.runCard, direct ? st >= 2 : iface ? st >= 1 : true);
      h.src.policy.classList.toggle('state-edit', direct && st >= 3);
      h.src.newAdapter.classList.toggle('state-edit', nd && st >= 1);
      h.run.newAdapter.classList.toggle('state-edit', nd && st >= 1);
      [h.src.policy, h.src.iface].forEach((n) => n.classList.toggle('state-unaffected', nd && st >= 1));
      vis(h.tags.policyEdit, direct && st >= 3); vis(h.tags.policyOk, nd && st >= 1); vis(h.tags.ifaceOk, nd && st >= 1);
      h.srcEdge.implements.classList.toggle('w5-edge--emph', iface && st >= 1);
      h.codeDirect.focusLines(direct && st === 1 ? [2, 3, 5] : direct && st >= 3 ? [2, 3] : []);
      h.codeIface.focusLines(iface && st === 0 ? [1, 2] : iface && st >= 2 ? [6, 7] : []);
      showIf(h.boxAdapter, iface && st >= 2);
      h.codeAdapter.focusLines(iface && st >= 2 ? [3, 4, 5, 6] : []);
      showIf(h.knows, direct && st >= 1);
      showIf(h.verify, nd && st >= 2);
    },
    print: [
      { title: 'Policy reads the database rows: both views point the same way, and a storage change edits the rule', condition: 'direct', state: 3, note: `Source view: Policy depends on the database client. Runtime view: Policy calls the client, which calls the database. The rule code knows ${listAnd(DIRECT.knows)}. When ${SCH.direct.edit.join(', ')} must change because ${SCH.direct.why}, the rule is edited although no booking rule changed.` },
      { title: `Policy depends on ${IFACE.name}: the source and runtime arrows differ`, condition: 'interface', state: 3, principle: true, note: `Source view (solid): Policy depends on ${IFACE.name}; the ${IFACE.adapter} depends on ${IFACE.name} and on the database client. Runtime view (dashed): Policy calls the ${IFACE.adapter}, which calls the client, which calls the database. The row shape lives only in the adapter.` },
      { title: 'A different database product: a new adapter, the same Policy', condition: 'new-database', state: 3, note: `${upper1(SCH.change)}. Edit: ${SCH.interface.edit.join(', ')}. Unchanged: ${listAnd(SCH.interface.unchanged)}. Still to verify: ${SCH.still_verify.join('; ')}.` },
    ],
  };

  // =====================================================================
  // SCENE 6 · refactoring-under-checks (Anchor)
  // =====================================================================
  const SN = RC.snippets;
  const byName = (prefix) => { const x = SN.find((sn) => sn.name.startsWith(prefix)); if (!x) throw new Error(`no refactoring snippet “${prefix}”`); return x; };
  const S_BEFORE = byName('before: duplicated'), S_COPY = byName("before: the reminder's"), S1 = byName('step 1'), S2 = byName('step 2'), S3 = byName('step 3');
  const MIN = RC.cases;
  const outOf = (sn) => sn.cases.map((c) => c.expected);
  // the promise is R-02 (case.duration_minutes); every snippet's recorded answers are checked against the fixture minutes here
  const PROMISE = MIN.map((m) => m >= DUR.min && m <= DUR.max);
  [S_BEFORE, S_COPY].forEach((sn) => { if (sn.cases.map((c) => c.args[1] - c.args[0]).join() !== MIN.join()) throw new Error(`${sn.name}: cases differ from the six minutes`); });
  [S1, S2, S3].forEach((sn) => { if (sn.cases.map((c) => c.args[0]).join() !== MIN.join()) throw new Error(`${sn.name}: cases differ from the six minutes`); });
  if (outOf(S_BEFORE).join() !== PROMISE.join() || outOf(S_COPY).join() !== PROMISE.join()) throw new Error('the code before refactoring disagrees with R-02');
  const V_BEFORE = `${S_BEFORE.code}\n${S_COPY.code}`;
  const callers = RC.callers_after_step_1.split('\n\n');
  const V_STEP1 = `${S1.code}\n${callers[0]}\n\n${S_COPY.code}`;
  const V_STEP1B = `${S1.code}\n${RC.callers_after_step_1}`;
  const V_STEP2 = `${S2.code}\n${RC.callers_after_step_1}`;
  const V_STEP3 = `${S3.code}\n${RC.callers_after_step_1}`;
  const REG = RC.regression_example;
  const refactoringUnderChecks = {
    id: 'refactoring-under-checks', role: 'anchor',
    heading: 'Change the structure without quietly changing the promise',
    lead: `Two copies of the duration check, and six examples whose answers are the promise of R-02: ${DUR.min} to ${DUR.max} minutes, both included. Replay the same six after every small step.`,
    principle: 'Refactoring should preserve intended observable behavior; small steps and relevant checks make deviations easier to locate.',
    principleShort: 'Change the structure in small steps; keep the answers.',
    conditions: [
      { id: 'small-steps', baseline: true, label: 'Baseline: extract one policy function in small steps', short: 'Small steps',
        states: [
          { prompt: { question: 'We move the duration check into one policy function. Should any of the six answers change?', options: ['No: the answers are the promise', 'Yes: cleaner code gives better answers', 'Only the two boundary answers'] }, caption: 'Before: the Booking Handler and the Reminder each carry a copy.' },
          { caption: 'Replay the six examples on the code as it is: every answer matches the promise.' },
          { caption: `Step 1: extract **duration_ok(minutes)**, and let can_book call it. Replay: the same six answers.` },
          { caption: 'Step 1, finished: the Reminder calls it too, and the copy written `2 * 60` is gone. Replay: the same six.' },
          { caption: 'The structure changed and the observable answers did not. That is **refactoring**.', principle: true },
        ] },
      { id: 'slip', label: `Changed: one step retypes the bound as minutes < ${DUR.max}`, short: 'A slip',
        states: [
          { prompt: { question: `One step retypes the bound as minutes < ${DUR.max}. Which example catches it?`, options: [String(MIN[0]), String(REG.minutes), 'None of them'] }, caption: 'The same code after step 1. One small edit is coming.' },
          { caption: `Step 2: **<=** became **<**. It looks like tidying.` },
          { caption: `Replay: **${REG.minutes} minutes** now answers ${REG.after_step_2 ? 'yes' : 'no'}, but the promise says ${REG.before ? 'yes' : 'no'}. The boundary example catches the slip.` },
          { caption: `Step 3 restores **<=**. Replay: all six answers match again.` },
          { caption: 'The boundary example caught the slip.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      h.codeWrap = el('div', { class: 'w5-refcode' });
      h.versionLabel = el('span', { class: 'chip chip--muted', style: 'font-size:16px' });
      const codePanel = api.cue(el('div', { class: 'card', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:8px;min-width:0' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center' }, [cardTitle('The code', 'margin-bottom:0;font-size:16px'), h.versionLabel]), h.codeWrap,
      ]), 'code');
      h.ide = api.cue(el('div', { class: 'callout callout--accent rv rv--rise', 'data-cond': 'small-steps', style: 'font-size:17px;line-height:1.3' }, [el('b', {}, 'In practice: '), 'editors such as VS Code and IntelliJ IDEA perform small refactorings like extracting a function for you; the six examples still run after each one.']), 'in-practice');
      h.log = el('div', { class: 'w5-steplog' });
      h.logCard = api.cue(el('div', { class: 'card rv rv--rise', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:6px' }, [cardTitle('Step log', 'margin-bottom:0;font-size:15px'), h.log]), 'step-log');
      // the check table: minutes, the promise, the answer of the code on screen
      h.tr = MIN.map((m, i) => {
        const got = el('td', { class: 'num w5-got' });
        const tr = api.cue(el('tr', {}, [el('th', { scope: 'row', class: 'num' }, String(m)), el('td', {}, PROMISE[i] ? 'yes' : 'no'), got]), `case-${m}`);
        tr.got = got; return tr;
      });
      const tbl = el('table', { class: 'data-table w5-cases' }, [
        el('caption', { class: 'visually-hidden' }, 'Six duration examples: the promise and the answer of the code on screen'),
        el('thead', {}, el('tr', {}, [el('th', { scope: 'col' }, 'Minutes'), el('th', { scope: 'col' }, 'R-02 promise'), el('th', { scope: 'col' }, 'Code says')])),
        el('tbody', {}, h.tr),
      ]);
      h.verdict = api.cue(el('div', { class: 'status status--wait w5-replay' }), 'replay-result');
      const checks = api.cue(el('div', { class: 'card', style: 'padding:10px 14px;display:flex;flex-direction:column;gap:8px' }, [cardTitle('Six examples · replayed after every step', 'margin-bottom:0;font-size:16px'), tbl, h.verdict]), 'checks');
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:740px minmax(0,1fr);gap:20px' }, [
        el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [codePanel, h.logCard, h.ide]), checks,
      ]));
      return h;
    },
    render(h, view, api) {
      const st = view.state, base = view.conditionId === 'small-steps';
      let code, prev, label, answers = null;
      if (base) {
        code = [V_BEFORE, V_BEFORE, V_STEP1, V_STEP1B, V_STEP1B][st]; prev = [null, null, V_BEFORE, V_STEP1, null][st];
        label = ['before', 'before', 'after step 1', 'after step 1', 'after step 1'][st];
        answers = st >= 1 ? (st >= 2 ? outOf(S1) : outOf(S_BEFORE)) : null;
      } else {
        code = [V_STEP1B, V_STEP2, V_STEP2, V_STEP3, V_STEP3][st]; prev = [null, V_STEP1B, V_STEP1B, V_STEP2, null][st];
        label = ['after step 1', 'step 2', 'step 2', 'step 3', 'step 3'][st];
        answers = st === 2 ? outOf(S2) : st >= 3 ? outOf(S3) : null;
      }
      const card = codeCard(api, code, { label: 'The duration check, pseudocode', lineCues: 'code-line' });
      card.style.fontSize = '20px';
      if (prev) {
        const old = new Set(prev.replace(/\n$/, '').split('\n'));
        card.rows.forEach((r) => { const ln = r.textContent.replace(/^\d+/, ''); if (ln.trim() && !old.has(ln)) r.classList.add(!base && (st === 1 || st === 2) ? 'is-slip' : 'is-new'); });
      }
      // the step log: every small step with the result of its replay
      const six = (ans) => `${ans.filter((x, i) => x === PROMISE[i]).length} of ${MIN.length} match`;
      const logRows = base
        ? [['before', 'two copies of the check', st >= 1 ? six(outOf(S_BEFORE)) : null], ['step 1', 'extract duration_ok', st >= 2 ? six(outOf(S1)) : null], ['step 1', 'the Reminder calls it too', st >= 3 ? six(outOf(S1)) : null]].slice(0, Math.max(1, Math.min(3, st)))
        : [['after step 1', 'both callers use duration_ok', six(outOf(S1))], ['step 2', '<= retyped as <', st >= 2 ? six(outOf(S2)) : null], ['step 3', '<= restored', st >= 3 ? six(outOf(S3)) : null]].slice(0, st >= 3 ? 3 : st >= 1 ? 2 : 1);
      h.log.replaceChildren(...logRows.map(([k, what, res]) => el('div', { class: `w5-logrow${res && !res.startsWith(String(MIN.length)) ? ' is-bad' : ''}` }, [el('span', { class: 'w5-logk' }, k), el('span', {}, what), el('span', { class: 'w5-logres' }, res || 'not replayed yet')])));
      showIf(h.logCard, base ? st >= 1 : true);
      h.codeWrap.replaceChildren(card);
      h.versionLabel.textContent = label;
      const animateRows = (base && st >= 1 && st <= 3) || (!base && (st === 2 || st === 3));
      h.tr.forEach((tr, i) => {
        const a = answers ? answers[i] : null;
        const ok = a == null ? null : a === PROMISE[i];
        const fill = () => {
          tr.got.replaceChildren(...(a == null ? [] : [mark(ok), el('span', {}, a ? 'yes' : 'no')]));
          tr.classList.toggle('is-bad', ok === false);
          tr.classList.toggle('is-ok', ok === true);
        };
        tr.got.replaceChildren(); tr.classList.remove('is-bad', 'is-ok');
        if (a != null && api.motion && animateRows) api.timeout(fill, 150 + i * 190); else fill();
      });
      const allOk = answers && answers.every((x, i) => x === PROMISE[i]);
      const show = () => {
        h.verdict.className = `status w5-replay status--${answers ? (allOk ? 'ok' : 'bad') : 'wait'}`;
        h.verdict.replaceChildren(el('span', { class: 'ico', 'aria-hidden': 'true' }, answers ? (allOk ? '✓' : '✕') : '…'),
          el('span', {}, answers ? (allOk ? 'All six answers match the promise.' : `${MIN.filter((m, i) => answers[i] !== PROMISE[i]).join(', ')} minutes: the answer changed.`) : 'Not replayed yet.'));
      };
      if (answers && api.motion && animateRows) { h.verdict.className = 'status status--wait w5-replay'; h.verdict.replaceChildren(el('span', { class: 'ico' }, '…'), el('span', {}, 'Replaying…')); api.timeout(show, 150 + MIN.length * 190 + 120); } else show();
      showIf(h.ide, base && st >= 4);
    },
    print: [
      { title: 'Before and after step 1: the same six answers', condition: 'small-steps', state: 4, principle: true, note: `Before: can_book and worth_reminding each carry the check (the second written as 2 * 60). Step 1 extracts duration_ok(minutes) and both call it. The six examples ${MIN.join(', ')} answer ${PROMISE.map((p) => (p ? 'yes' : 'no')).join(', ')} before and after: the promise of R-02.` },
      { title: `The slip: ${REG.minutes} minutes changes its answer, and step 3 restores it`, condition: 'slip', state: 2, note: `Step 2 retypes the bound as minutes < ${DUR.max}. Replayed, ${REG.minutes} minutes answers ${REG.after_step_2 ? 'yes' : 'no'} where the promise says ${REG.before ? 'yes' : 'no'}; step 3 restores <= and all six match again (${REG.after_step_3 ? 'yes' : 'no'} for ${REG.minutes}).` },
    ],
  };

  // =====================================================================
  // SCENE 7 · abstraction-cost (Bridge)
  // =====================================================================
  const STRUCT = AC.structures, CRIT = AC.criteria, TWO = AC.two_rules, MANY = AC.many_policies, BRB = AC.build_reuse_buy;
  const BRB_OPTS = AC.curriculum_refinement.options, BRB_ROWS = AC.curriculum_refinement.compare;
  if (BRB_OPTS.some((o) => !BRB.judgments[o])) throw new Error('w05/abstraction-cost: a build/reuse/buy option has no judgments');
  const abstractionCost = {
    id: 'abstraction-cost', role: 'bridge',
    heading: 'A flexible design can still be the wrong amount of design',
    lead: 'Three ways to hold the booking rules, judged on setup, understanding, extension and debugging. Then the same question for a capability you could build, reuse or buy.',
    principle: 'Abstraction should earn its complexity by simplifying real responsibilities or plausible change.',
    principleShort: 'Add structure only when it pays for itself.',
    conditions: [
      { id: 'two-rules', baseline: true, label: `Baseline: ${TWO.condition}`, short: 'Two rules',
        states: [
          { prompt: { question: 'Two clear booking rules and a small team. Which structure fits best?', options: STRUCT.map((x) => x.name) }, caption: 'Three structures for the same two rules. Judged in words, not invented numbers.' },
          { caption: `**Setup**: ${STRUCT.map((x) => `${x.name.toLowerCase()}, ${TWO.judgments[x.id].setup}`).join('; ')}.` },
          { caption: '**Understanding**: where does a reader find the rule?' },
          { caption: '**Extension**: what happens when a rule changes?' },
          { caption: '**Debugging**: when an answer is wrong, how far do you look?' },
          { caption: `For two rules and a small team: **${STRUCT.find((x) => x.id === TWO.recommendation).name.toLowerCase()}**.`, principle: true },
        ] },
      { id: 'many-policies', label: `Changed: ${MANY.condition}`, short: 'Many policies',
        states: [
          { prompt: { question: 'Now several policies change independently. Does the answer move?', options: ['It can: look at the evidence first', 'No: the small function still wins', 'Yes: always build the framework'] }, caption: `Hypothetical policies for this comparison: ${MANY.examples.join('; ')}.` },
          { caption: 'The same three structures, judged again for many independent policies.' },
          { caption: `Evidence that justifies more structure: ${MANY.evidence.join('; ')}.` },
          { caption: `${upper1(MANY.recommendation.split(':')[0])}.`, principle: true },
        ] },
      { id: 'build-reuse-buy', label: 'Changed: the email capability could be built, reused or bought', short: 'Build, reuse, buy',
        states: [
          { prompt: { question: 'Sending the emails could be built, reused or bought. Which choice removes the need to check the Notifier contract?', options: ['Buying a managed service', 'Reusing a maintained library', 'None of them'] }, caption: 'The same flexibility question, one level up: who builds the capability.' },
          { caption: '**Integration** and **licensing**: how it plugs in, and on what terms.' },
          { caption: '**Support** and **data portability**: who fixes it, and whether your data can leave.' },
          { caption: '**Exit cost**: what leaving would take.' },
          { caption: 'Buying or reusing changes who does the work, not what you must check.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      /** A small picture of each structure or option for the column heads. */
      const mini = (kind) => {
        const g = window.VC.svg(230, 66, { label: kind, uid: (x) => api.uid(`mini-${kind}-${x}`), class: 'w5-mini' });
        const R = (x, y, w, hh, cls) => g.appendChild(s('rect', { x, y, width: w, height: hh, rx: 7, ry: 7, class: cls || 'w5-mini-box' }));
        const T = (x, y, str, cls) => g.appendChild(text(x, y, str, { 'text-anchor': 'middle', class: cls || 'w5-mini-t' }));
        const L = (x1, y1, x2, y2) => g.appendChild(s('line', { x1, y1, x2, y2, class: 'w5-mini-l' }));
        if (kind === 'copies') { [8, 82, 156].forEach((x) => { R(x, 14, 66, 38, 'w5-mini-box w5-mini-box--violet'); T(x + 33, 39, '≤ 120'); }); }
        if (kind === 'function') { R(52, 4, 126, 28, 'w5-mini-box w5-mini-box--ok'); T(115, 23, 'duration_ok', 'w5-mini-t w5-mini-mono'); [10, 86, 162].forEach((x) => { R(x, 44, 58, 20); L(x + 29, 44, 115, 32); }); }
        if (kind === 'framework') { R(4, 8, 86, 50, 'w5-mini-box w5-mini-box--warn'); T(47, 38, 'engine'); [6, 26, 46].forEach((y, i) => { R(124, y, 100, 15); T(174, y + 12, `rule ${i + 1}`, 'w5-mini-t w5-mini-small'); }); L(90, 33, 124, 33); }
        if (kind === 'build') { R(76, 6, 78, 54, 'w5-mini-box w5-mini-box--ok'); T(115, 41, '</>', 'w5-mini-t w5-mini-mono'); }
        if (kind === 'reuse') { R(76, 10, 78, 50, 'w5-mini-box w5-mini-box--violet'); L(76, 26, 154, 26); T(115, 49, 'library'); }
        if (kind === 'buy') { g.appendChild(s('path', { d: 'M78,54 C58,54 58,30 78,30 C80,12 106,8 116,22 C128,8 158,16 152,34 C168,36 166,56 150,54 Z', class: 'w5-mini-box w5-mini-box--accent' })); T(115, 46, 'service'); }
        return g;
      };
      const headCell = (name, kind, cue) => api.cue(el('th', { scope: 'col', class: 'w5-mhead' }, [mini(kind), el('span', {}, name)]), cue);
      // matrix A: the three structures
      h.headA = STRUCT.map((x) => headCell(x.name, x.id, `structure-${x.id}`));
      h.rowsA = CRIT.map((k) => {
        const cells = STRUCT.map((x) => api.cue(el('td', { class: 'w5-mcell' }), `${k}-${x.id}`));
        const tr = api.cue(el('tr', { class: 'rv' }, [el('th', { scope: 'row', class: 'w5-mrow' }, upper1(k)), ...cells]), `row-${k}`);
        tr.mcells = cells; return tr;
      });
      h.recCells = STRUCT.map((x) => api.cue(el('td', { class: 'w5-mcell w5-rec' }), `recommend-${x.id}`));
      h.recRow = el('tr', { class: 'rv' }, [el('th', { scope: 'row', class: 'w5-mrow' }, 'Fits?'), ...h.recCells]);
      h.matrixA = api.cue(el('table', { class: 'data-table w5-matrix', 'data-cond': 'two-rules,many-policies' }, [
        el('caption', { class: 'visually-hidden' }, 'Three structures judged on four criteria'),
        el('thead', {}, el('tr', {}, [el('th', { scope: 'col' }, ''), ...h.headA])), el('tbody', {}, [...h.rowsA, h.recRow]),
      ]), 'matrix');
      // matrix B: build, reuse, buy
      h.headB = BRB_OPTS.map((o, i) => headCell(upper1(o), ['build', 'reuse', 'buy'][i], `option-${slug(o)}`));
      h.rowsB = BRB_ROWS.map((k) => {
        const cells = BRB_OPTS.map((o) => api.cue(el('td', { class: 'w5-mcell' }, BRB.judgments[o][k]), `${slug(k)}-${slug(o)}`));
        const tr = api.cue(el('tr', { class: 'rv' }, [el('th', { scope: 'row', class: 'w5-mrow' }, upper1(k)), ...cells]), `row-${slug(k)}`);
        return tr;
      });
      h.matrixB = api.cue(el('table', { class: 'data-table w5-matrix', 'data-cond': 'build-reuse-buy' }, [
        el('caption', { class: 'visually-hidden' }, 'Build, reuse or buy, judged on five criteria'),
        el('thead', {}, el('tr', {}, [el('th', { scope: 'col' }, ''), ...h.headB])), el('tbody', {}, h.rowsB),
      ]), 'matrix-capability');
      h.examples = api.cue(el('div', { class: 'card rv rv--rise', 'data-cond': 'many-policies', style: 'padding:8px 14px' }, [cardTitle(upper1(MANY.examples_kind.split(',')[0]), 'margin-bottom:2px;font-size:15px'), el('p', { style: 'font-size:18px;line-height:1.3' }, MANY.examples.map(upper1).join(' · '))]), 'policies');
      h.evidence = api.cue(el('div', { class: 'callout rv rv--rise', 'data-cond': 'many-policies', style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'Evidence for more structure: '), MANY.evidence.join('; '), '.']), 'evidence');
      h.still = api.cue(el('div', { class: 'callout callout--accent rv rv--rise', 'data-cond': 'build-reuse-buy', style: 'font-size:18px;line-height:1.3' }, [el('b', {}, 'Still required: '), `${upper1(BRB.still_required)}.`]), 'still-required');
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:12px' }, [h.examples, h.matrixA, h.matrixB, h.evidence, h.still]));
      return h;
    },
    render(h, view) {
      const st = view.state, c = view.conditionId;
      if (c !== 'build-reuse-buy') {
        const data = c === 'two-rules' ? TWO : MANY;
        h.rowsA.forEach((tr, i) => {
          const k = CRIT[i];
          tr.mcells.forEach((td, j) => {
            const id = STRUCT[j].id;
            td.textContent = upper1(data.judgments[id][k]);
          });
          showIf(tr, c === 'two-rules' ? st >= i + 1 : st >= 1);
          focusIf(tr, c === 'two-rules' && st === i + 1);
        });
        const recId = c === 'two-rules' ? TWO.recommendation : null;
        h.recCells.forEach((td, j) => {
          const id = STRUCT[j].id;
          if (c === 'two-rules') td.replaceChildren(...(id === recId ? [mark(true), el('span', {}, 'fits these two rules')] : [el('span', { class: 'muted' }, id === 'copies' ? 'copies disagree' : 'more than needed')]));
          else td.replaceChildren(...(id === 'copies' ? [el('span', { class: 'muted' }, 'does not fit: every copy multiplies')] : id === 'function' ? [el('span', {}, 'start here: a policy table read by one function')] : [el('span', {}, 'grow toward it for rule shapes that really repeat')]));
          td.classList.toggle('is-pick', (c === 'two-rules' && id === recId) || (c === 'many-policies' && id !== 'copies'));
        });
        showIf(h.recRow, c === 'two-rules' ? st >= 5 : st >= 3);
        h.headA.forEach((th, j) => th.classList.toggle('is-pick', c === 'two-rules' && st >= 5 && STRUCT[j].id === recId));
      } else {
        h.rowsB.forEach((tr, i) => { const need = i < 2 ? 1 : i < 4 ? 2 : 3; showIf(tr, st >= need); focusIf(tr, st === need); });
      }
      showIf(h.examples, c === 'many-policies');
      showIf(h.evidence, c === 'many-policies' && st >= 2);
      showIf(h.still, c === 'build-reuse-buy' && st >= 4);
    },
    print: [
      { title: 'Two rules, a small team: one small policy function fits', condition: 'two-rules', state: 5, principle: true, note: `${CRIT.map((k) => `${upper1(k)}: ${STRUCT.map((x) => `${x.name.toLowerCase()}, ${TWO.judgments[x.id][k]}`).join('; ')}`).join('. ')}. Qualitative judgments for this example; no costs are measured.` },
      { title: 'Several independently changing policies: the evidence that justifies more structure', condition: 'many-policies', state: 3, note: `Hypothetical policies for this comparison: ${MANY.examples.join('; ')}. Evidence for more structure: ${MANY.evidence.join('; ')}. ${upper1(MANY.recommendation)}.` },
      { title: 'Build, reuse or buy the email capability', condition: 'build-reuse-buy', state: 4, note: `${BRB_OPTS.map((o) => `${upper1(o)}: ${BRB_ROWS.map((k) => `${k}, ${BRB.judgments[o][k]}`).join('; ')}`).join('. ')}. ${upper1(BRB.still_required)}.` },
    ],
  };

  // =====================================================================
  // SCENE 8 · design-rationale (Bridge)
  // =====================================================================
  const REC = DR.record, CS = DR.changed_scope;
  const SECTIONS = [
    { key: 'context', title: 'Context', body: () => REC.context },
    { key: 'alternatives', title: 'Alternatives considered', body: () => el('ul', {}, REC.alternatives.map((a) => el('li', {}, [el('b', {}, `${a.option}: `), `not chosen, ${a.why_not}.`]))) },
    { key: 'choice', title: 'Decision', body: () => REC.choice },
    { key: 'consequences', title: 'Consequences', body: () => el('ul', {}, [...REC.consequences.map((c) => el('li', {}, c)), el('li', { class: 'muted' }, `Scope: ${REC.scope}. Not covered: ${REC.not_generalized}.`)]) },
    { key: 'revisit', title: 'Revisit when', body: () => el('ul', {}, REC.revisit_when.map((r) => el('li', { 'data-trigger': r }, r))) },
  ];
  const designRationale = {
    id: 'design-rationale', role: 'bridge',
    heading: 'A future maintainer needs the reason, not only the diagram',
    lead: 'Months later, someone finds the Policy component and wonders why it exists. Compare a label on a diagram with a short decision record.',
    principle: 'A design decision is easier to maintain when its reasoning and limits are recorded.',
    principleShort: 'Write down why, and when to rethink it.',
    conditions: [
      { id: 'one-campus', baseline: true, label: 'Baseline: one campus, one set of booking rules', short: 'One campus',
        states: [
          { prompt: { question: `A new maintainer finds only this: “${DR.diagram_only}”. What is missing?`, options: ['Nothing: the diagram says it all', 'The name of the person who chose it', 'Why it was chosen, and when to rethink it'] }, caption: 'A label tells you what exists. Open the record behind it.' },
          { caption: '**Context**: the problem that forced a decision, in the words of scenes 1 and 2.' },
          { caption: '**Alternatives**: what else was considered, and why each was not chosen.' },
          { caption: '**Decision**: who owns the rules, who asks, and who only reads them.' },
          { caption: '**Consequences**, good and costly, and what the decision deliberately does not cover.' },
          { caption: `**Revisit when**: the conditions that would make this choice obsolete. Linked to ${listAnd(REC.requirements)}.`, principle: true },
        ] },
      { id: 'several-campuses', label: `Changed: ${CS.change}`, short: 'Several campuses',
        states: [
          { prompt: { question: 'Several campuses now have different booking limits. Keep the decision, or revisit it?', options: ['Check its revisit trigger first', 'Keep it: a decision is final', 'Start over from scratch'] }, caption: `The situation changes: ${CS.change}.` },
          { caption: `The record named this case: **${CS.trigger}**. The trigger fires.` },
          { caption: 'Keeping it blindly patches exceptions into one Policy; revisiting reopens the same questions with the new context.' },
          { caption: 'The record tells you when it has expired.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const W = 360, H = 250;
      const svg = window.VC.svg(W, H, { label: 'What the maintainer sees: one box with a label', uid: (x) => api.uid(`dr-${x}`) });
      const pol = window.VC.node({ x: 90, y: 60, w: 180, h: 70, label: 'Policy', cls: 'w5-node' });
      svg.appendChild(pol); api.cue(pol, 'diagram-policy');
      ['Booking Handler', 'Reminder', 'Browser UI'].forEach((n, i) => {
        const nb = window.VC.node({ x: 10 + i * 118, y: 184, w: 104, h: 60, label: n.split(' '), cls: 'w5-node w5-node--tiny' });
        svg.appendChild(nb);
        arrow(svg, { from: { x: 62 + i * 118, y: 184 }, to: { x: 140 + i * 40, y: 132 }, kind: 'default' });
      });
      const diagram = api.cue(el('div', { class: 'card', style: 'padding:10px 12px;display:flex;flex-direction:column;gap:8px' }, [
        cardTitle('What the maintainer sees', 'margin-bottom:0;font-size:16px'), svg,
        el('p', { class: 'w5-label-only' }, `“${DR.diagram_only}”`),
      ]), 'diagram');
      svg.style.height = `${H}px`;
      h.situation = api.cue(el('div', { class: 'callout callout--bad rv rv--rise', 'data-cond': 'several-campuses', style: 'font-size:19px;line-height:1.3' }, [el('b', {}, 'New situation: '), `${upper1(CS.change)}.`]), 'situation');
      h.blind = api.cue(el('div', { class: 'card rv rv--rise w5-choice w5-choice--bad', 'data-cond': 'several-campuses' }, [cardTitle('Keep it blindly', 'margin-bottom:2px;font-size:15px'), el('p', {}, `${upper1(CS.blind)}.`)]), 'blind');
      h.revisit = api.cue(el('div', { class: 'card rv rv--rise w5-choice w5-choice--ok', 'data-cond': 'several-campuses' }, [cardTitle('Revisit with the trigger', 'margin-bottom:2px;font-size:15px'), el('p', {}, `${upper1(CS.revisit)}.`)]), 'revisit');
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [diagram, h.situation, h.blind, h.revisit]);
      // the record
      h.secs = SECTIONS.map((sc) => {
        const b = sc.body();
        const n = api.cue(el('div', { class: 'w5-rsec rv rv--rise' }, [el('div', { class: 'w5-rsec-t' }, sc.title), el('div', { class: 'w5-rsec-b' }, b)]), `record-${sc.key}`);
        return n;
      });
      h.reqs = el('div', { class: 'w5-rreqs rv rv--rise' }, [el('span', { class: 'w5-rreqs-k' }, 'Requirements'), ...REC.requirements.map((r) => chip(r, 'violet', { style: 'font-size:16px;padding:2px 10px' }))]);
      h.status = chip(REC.status, 'ok', { style: 'font-size:15px;padding:2px 10px;margin-left:auto' });
      api.cue(h.status, 'record-status');
      const record = api.cue(el('div', { class: 'card w5-record' }, [
        el('div', { class: 'w5-rhead' }, [el('span', { class: 'w5-rid' }, REC.id), el('span', { class: 'w5-rtitle' }, REC.title), h.status]),
        ...h.secs, h.reqs,
      ]), 'record');
      stage.appendChild(el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:384px minmax(0,1fr);gap:20px' }, [left, record]));
      h.trigger = record.querySelector(`[data-trigger="${CS.trigger}"]`);
      return h;
    },
    render(h, view) {
      const st = view.state, base = view.conditionId === 'one-campus';
      h.secs.forEach((n, i) => { showIf(n, base ? st >= i + 1 : true); focusIf(n, base && st === i + 1); });
      showIf(h.reqs, base ? st >= 5 : true);
      if (h.trigger) h.trigger.classList.toggle('w5-fired', !base && st >= 1);
      const due = !base && st >= 1;
      h.status.textContent = due ? 'Revisit due' : REC.status;
      h.status.className = `chip chip--${due ? 'warn' : 'ok'}`;
      focusIf(h.secs[4], !base && st === 1);
      showIf(h.situation, !base);
      showIf(h.blind, !base && st >= 2); showIf(h.revisit, !base && st >= 2);
    },
    print: [
      { title: `The decision record behind “${DR.diagram_only}”`, condition: 'one-campus', state: 5, principle: true, note: `${REC.id}, ${REC.title} (${REC.status}; ${listAnd(REC.requirements)}). In practice, many teams keep such records as short Markdown files next to the code.` },
      { title: 'Several campuses: the revisit trigger fires', condition: 'several-campuses', state: 3, note: `${upper1(CS.change)}. Trigger: ${CS.trigger}. Keeping it blindly: ${CS.blind}. Revisiting: ${CS.revisit}.` },
    ],
  };

  // =====================================================================
  // PAGE · principles and checks
  // =====================================================================
  const CHECKS = [   // plan Section 8, questions 1 to 5, and the answered transfer question (fixtures transfer_checks.w05)
    { q: 'Why is a duplicated duration rule risky?', a: 'Copies can change inconsistently and create conflicting decisions.' },
    { q: 'Does a centralized rule mean only one check is needed?', a: 'No. Different checks should still independently examine its important behavior and integration.' },
    { q: 'Why did the replacement notifier break the design despite matching parameters?', a: 'It violated the expected failure behavior and affected confirmation.' },
    { q: 'What should an architecture or design decision record preserve?', a: 'Context, alternatives, choice, consequences, and the assumptions or triggers that warrant revisiting it.' },
    { q: 'Does a well-typed result prove that cancellation is authorized?', a: 'No. Shape, domain validity and permission are separate claims with separate evidence.' },
    { q: TRANSFER.question, a: TRANSFER.answer },
  ];
  const SCENES = [sameBehaviorDifferentDesign, dependencyExample, cohesionAndResponsibility, interfaceContract, dependencyDirection, refactoringUnderChecks, abstractionCost, designRationale];
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
    ['Design', 'The internal structure: which part holds which decision, and which part depends on which.'],
    ['Dependency', 'Code that needs another part to do its work; it may have to change when that part changes.'],
    ['Coupling', 'How strongly parts depend on each other, for example through a copied decision.'],
    ['Cohesion', 'How closely the contents of one module belong together, judged by their reason to change.'],
    ['Responsibility', 'One reason to change that a module answers for.'],
    ['Interface', 'What a part offers to its callers: its operations and their promises.'],
    ['Contract', 'The promises of an interface: inputs, results, failure behavior and side effects.'],
    ['Precondition', 'What must be true before a call, such as a stored booking id.'],
    ['Encapsulation', 'Keeping a changeable detail, such as a row shape, inside one part.'],
    ['Dependency direction', 'Which way source code depends; it can differ from the direction of runtime calls.'],
    ['Adapter', 'A small part that converts one interface into another, such as storage rows into intervals.'],
    ['Refactoring', 'A change of structure that keeps the intended observable behavior.'],
    ['Regression', 'Behavior that used to be right and changed by mistake.'],
    ['Abstraction', 'A simpler face over details; it costs setup and indirection.'],
    ['Decision record', 'A short note of context, alternatives, decision, consequences and when to revisit.'],
  ];
  const SOURCES = [
    ['S01', 'IEEE Computer Society, Guide to the Software Engineering Body of Knowledge (SWEBOK V4.0a)', 'https://www.computer.org/education/bodies-of-knowledge/software-engineering'],
    ['S02', 'ACM / IEEE-CS / AAAI, Computer Science Curricula 2023, final report', 'https://csed.acm.org/final-report/'],
    ['S07', 'Google Engineering Practices, What to look for in a code review', 'https://google.github.io/eng-practices/review/reviewer/looking-for.html'],
    ['S24', 'Titus Winters, Software Engineering at Google, chapter 1: What is software engineering?', 'https://abseil.io/resources/swe-book/html/ch01.html'],
  ];
  const IN_PRACTICE = 'Editors such as VS Code and IntelliJ IDEA automate small refactorings like extracting a function, and many teams keep decision records as short Markdown files next to the code.';
  const PRACTICE_YEAR = (String(DR.reviewed).match(/\b(\d{4})\b/) || [])[1];
  if (!PRACTICE_YEAR) throw new Error('fixture w05/design-rationale carries no year for the dated In practice examples');
  const IN_PRACTICE_TITLE = `In practice · examples from ${PRACTICE_YEAR}`;
  const HANDOFF_QUESTION = 'What changes when a dependency becomes slow, unavailable, or uncertain?';
  const CARRIED = [
    'Module responsibilities: Booking Handler, Policy, Room Catalog, Notification and Storage.',
    'Contracts: Notifier.send with its failure behavior, and the three kinds of booking result.',
    `A decision record: ${REC.id}, ${lower1(REC.title)}, with its revisit triggers.`,
  ];
  const sources = {
    kind: 'page', id: 'sources', role: 'page',
    heading: 'What carries forward, and where to read more',
    lead: 'Next week, these responsibilities cross process, network and data-consistency boundaries.',
    printRole: 'Handoff, terminology, sources',
    build(body, api) {
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-height:0' }, [
        api.cue(el('div', { class: 'handoff', style: 'font-size:27px;padding:18px 24px' }, [el('span', { class: 'muted', style: 'font-size:19px;display:block;margin-bottom:8px;font-family:var(--font-text);font-weight:500' }, 'Week 6 starts from this question:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]), 'handoff'),
        api.cue(el('div', { class: 'card', style: 'padding:14px 18px' }, [cardTitle('Carried forward to Week 6'), el('ul', { style: 'font-size:18px;line-height:1.38;display:flex;flex-direction:column;gap:6px' }, CARRIED.map((t) => el('li', {}, t)))]), 'carried'),
        api.cue(el('div', { class: 'card', style: 'padding:14px 18px' }, [cardTitle(IN_PRACTICE_TITLE), el('p', { style: 'font-size:18px;line-height:1.38' }, IN_PRACTICE)]), 'in-practice'),
      ]);
      const middle = api.cue(el('div', { class: 'card', style: 'min-height:0;padding:14px 18px;align-self:start' }, [cardTitle('Terms used this week'), el('dl', { class: 'term-list', style: 'display:block;column-count:2;column-gap:22px;font-size:15px;line-height:1.24' }, TERMS.map(([t, d]) => el('div', { style: 'break-inside:avoid;margin-bottom:5px' }, [el('dt', {}, t), el('dd', {}, d)])))]), 'terms');
      const right = api.cue(el('div', { class: 'card', style: 'min-height:0;padding:14px 18px;align-self:start' }, [cardTitle('Sources for this lecture'), el('ul', { class: 'source-list', style: 'font-size:17px;gap:8px' }, SOURCES.map(([k, t, u]) => el('li', {}, [el('span', { class: 'key' }, k), el('span', {}, [t, ' ', el(api.record ? 'span' : 'a', api.record ? { class: 'url', style: 'font-size:15px' } : { class: 'url', href: u, style: 'font-size:15px' }, u)])])))]), 'sources');   // ends above the presenter corner (y < 696)
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:560px minmax(0,1fr) 450px;gap:24px;height:100%;min-height:0' }, [left, middle, right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('div', { class: 'handoff' }, [el('span', { class: 'muted', style: 'display:block;font-size:14px' }, 'Week 6 starts from this question:'), el('span', { class: 'quote' }, HANDOFF_QUESTION)]),
          el('h3', {}, 'Carried forward to Week 6'), el('ul', {}, CARRIED.map((t) => el('li', {}, t))),
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
    week: 5, file: FILE,
    title: 'Modularity, interfaces, and the cost of change',
    question: 'When one requirement changes, which parts should need to change?',
    coverLead: `Student notes for lecture 5. One rule change, the longest booking from ${FROM} to ${TO} minutes, followed through two designs of Campus Rooms. Each scene shows a situation, asks you to predict, reveals the mechanism, changes one condition, compares the outcomes and names the principle: identical screens over different designs, a change spreading through copies, cohesion, an interface contract with its failure behavior, dependency direction, refactoring under checks, the cost of abstraction and a decision record.`,
    coverNote: 'Campus Rooms is a fictional room-booking service; every value is a teaching example. The code is Python-like pseudocode.',
    pages: [opening, outcomes, { kind: 'scene', scene: sameBehaviorDifferentDesign }, { kind: 'scene', scene: dependencyExample }, { kind: 'scene', scene: cohesionAndResponsibility },
      { kind: 'scene', scene: interfaceContract }, results, { kind: 'scene', scene: dependencyDirection }, { kind: 'scene', scene: refactoringUnderChecks },
      { kind: 'scene', scene: abstractionCost }, { kind: 'scene', scene: designRationale }, principles, sources],
  });
})();
