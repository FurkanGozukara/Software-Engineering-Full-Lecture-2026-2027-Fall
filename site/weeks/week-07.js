/* Week 07. Original teaching data: plan/assets/demo-fixtures.json, anchors w07/*.
   The frozen shared shell owns navigation, state, recording mode and print.
   Each motion follows an operated step and leaves a readable, deterministic state. */
(function () {
  'use strict';
  const F = window.CAMPUS_ROOMS_FIXTURES;
  const { el, s, text, arrow, chip, rich } = window.VC;
  const A = F.anchors, C = F.case;
  const CG = A['w07/commit-graph'], CI = A['w07/conflict-and-intent'];
  const CM = A['w07/clean-merge-wrong-behavior'], RV = A['w07/review-with-context'];
  const IF = A['w07/integration-frequency'], RP = A['w07/same-code-different-result'];
  const HX = A['w07/history-as-explanation'], RD = A['w07/ready-to-integrate'];
  const FILE = 'week-07.html', WEEK_Q = 'How can several people change one system without losing intent or trust?';
  const TRANSFER = F.transfer_checks.w07, LOC = CG.location_demo;
  const show = (node, on) => node.classList.toggle('is-shown', !!on);
  const focus = (node, on) => node.classList.toggle('is-focus', !!on);
  const title = (str) => el('div', { class: 'w7-title' }, str);
  const card = (children, cls = '') => el('div', { class: `card w7-card ${cls}` }, children);
  const rv = (node) => { node.classList.add('rv', 'rv--rise'); return node; };
  const cue = (api, node, name) => api.cue(node, name);
  const printApi = { cue: (node) => node, motion: false };
  const verdict = (ok) => ok ? 'Accepted' : 'Rejected';
  const list = (items, attrs = {}) => el('ul', attrs, items.map((t) => el('li', {}, t)));
  const badge = (str, cls = '') => el('span', { class: `w7-tag ${cls}` }, str);
  const upper1 = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  const mark = (ok) => el('span', { class: `w7-mark ${ok ? 'is-ok' : 'is-bad'}`, 'aria-hidden': 'true' }, ok ? '✓' : '×');
  function status(str, kind = 'warn') {
    const node = el('div', { class: `w7-status w7-status--${kind}`, role: 'status' }, [el('span', { class: 'w7-symbol', 'aria-hidden': 'true' }, kind === 'ok' ? '✓' : kind === 'bad' ? '×' : '?'), el('span', {}, str)]);
    // Only the kind changes: reveal classes (rv, is-shown) stay on the node.
    node.set = (txt, k) => { ['ok', 'bad', 'warn'].forEach((x) => node.classList.toggle(`w7-status--${x}`, x === k)); node.children[0].textContent = k === 'ok' ? '✓' : k === 'bad' ? '×' : '?'; node.children[1].textContent = txt; };
    return node;
  }
  const KW = new Set(['def', 'return', 'if', 'and', 'or', 'not', 'True', 'False', 'None', 'in', 'for', 'else', 'from', 'import']);
  function colored(src) {
    return src.split(/("[^"]*"|\b\d+\b|\b[A-Za-z_][A-Za-z0-9_]*\b|\s+|[^\sA-Za-z0-9_"]+)/).filter(Boolean).map((t) =>
      t.startsWith('"') ? el('span', { class: 'str' }, t) : /^\d+$/.test(t) ? el('span', { class: 'num' }, t) : KW.has(t) ? el('span', { class: 'kw' }, t) : document.createTextNode(t));
  }
  function code(api, src, name, small = false) {
    const root = el('div', { class: `w7-code${small ? ' w7-code--small' : ''}`, role: 'group', 'aria-label': name });
    root.setCode = (source) => {
      root.replaceChildren(...source.split('\n').map((ln, i) => cue(api, el('div', { class: 'w7-line' }, [el('span', { class: 'w7-ln', 'aria-hidden': 'true' }, String(i + 1)), el('span', { class: 'w7-src' }, ln ? colored(ln) : ' ')]), `${name}-line-${i + 1}`)));
    };
    root.setCode(src);
    root.focusLines = (lines) => [...root.children].forEach((row, i) => focus(row, lines.includes(i + 1)));
    return root;
  }
  function diff(api, before, after, name) {
    const root = el('div', { class: 'w7-diff', role: 'group', 'aria-label': 'Diff: minus removes a line, plus adds a line' }, [
      cue(api, el('div', { class: 'w7-diff-row w7-diff-row--remove' }, [el('span', { class: 'w7-diff-sign' }, '−'), el('span', { class: 'w7-diff-source' }, before)]), `${name}-removed`),
      cue(api, el('div', { class: 'w7-diff-row w7-diff-row--add' }, [el('span', { class: 'w7-diff-sign' }, '+'), el('span', { class: 'w7-diff-source' }, after)]), `${name}-added`),
    ]);
    return root;
  }
  function glow(api, node, color = '255,209,102') {
    if (api.motion) api.animate(node, [{ filter: `drop-shadow(0 0 0 rgba(${color},0))` }, { filter: `drop-shadow(0 0 16px rgba(${color},.8))` }, { filter: `drop-shadow(0 0 0 rgba(${color},0))` }], { duration: 900, easing: 'ease-out' });
  }
  function changePulse(api, node, delay = 0) {
    if (api.motion) api.animate(node, [{ opacity: .3, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 460, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
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
    api.animate(token, [{ transform: `translate(${fx}px,${fy}px)`, opacity: 0 }, { transform: `translate(${fx}px,${fy}px)`, opacity: 1, offset: .12 }, { transform: `translate(${tx}px,${ty}px)`, opacity: 1, offset: .85 }, { transform: `translate(${tx}px,${ty}px)`, opacity: 0 }], { duration: opts.duration || 950, delay: opts.delay || 0, easing: 'cubic-bezier(.2,.7,.2,1)' });
  }
  function textRows(api, rows, prefix) {
    return rows.map(([k, v], i) => cue(api, el('div', { class: 'w7-review-row' }, [el('b', {}, k), el('span', {}, v)]), `${prefix}-${i + 1}`));
  }

  // Opening: two collaborators touch different files, and the promise drifts.
  const opening = {
    kind: 'page', id: 'opening', heading: 'The merge is green. Which limit should you believe?',
    lead: `${RV.author} changes the booking rule. ${RV.reviewer} adds a message. They edit different files in Campus Rooms.`,
    printRole: 'Opening situation',
    build(body, api) {
      const left = cue(api, card([title(`${RV.author} · ${CM.policy_file}`), badge('R-02 · temporary variant', 'w7-variant'), diff(api, LOC.before, LOC.after, 'policy-diff')]), 'policy-edit');
      const right = cue(api, card([title(`${RV.reviewer} · ${CM.message_file}`), code(api, CM.copied_code, 'message-code')]), 'message-edit');
      // Two edits flow into one combined change: arrows draw in, then the join turns green.
      const join = window.VC.svg(1196, 92, { label: 'The two edits combine into one change', uid: (x) => `opening-${x}` });
      join.classList.add('w7-join');
      // arrows meet the top of the join circle, clear of its label
      const joins = [299, 897].map((x, i) => cue(api, arrow(join, { from: { x, y: 4 }, to: { x: i ? 614 : 582, y: 46 }, kind: 'accent', cls: 'rv rv--draw' }), `join-${i + 1}`));
      const node = s('g', { class: 'w7-join-node' }, [s('circle', { cx: 598, cy: 66, r: 21 }), text(598, 75, '✓', { class: 'w7-join-tick', 'text-anchor': 'middle' }), text(632, 74, 'One combined change', { class: 'w7-join-t' })]);
      join.appendChild(node); cue(api, node, 'combined-change');
      const merge = status('The edits are still separate.');
      const mergeBtn = cue(api, el('button', { type: 'button', class: 'btn-reserve w7-action' }, 'Combine the edits'), 'combine');
      const checkBtn = cue(api, el('button', { type: 'button', class: 'btn-reserve w7-action', disabled: true }, 'Check one request'), 'check-request');
      const answer = rv(el('div', { class: 'w7-note w7-note--warn' }, 'The files combined cleanly. The message and the rule still disagree, so the combined behavior needs its own check.'));
      // What Ari sees: the new message makes a promise; the changed rule answers the request.
      const duration = el('div', { class: 'field' }, [el('span', { class: 'k' }, 'Duration'), el('span', { class: 'v' }, `${CM.request_minutes} minutes`)]);
      const message = cue(api, rv(el('div', { class: 'w7-screen-msg' }, [el('small', {}, 'Message'), el('span', {}, CM.copied_message)])), 'screen-message');
      const result = cue(api, status('Not sent yet'), 'screen-result');
      const screen = cue(api, window.VC.browser({ who: `${C.users[0].name} (${C.users[0].id})`, url: 'campus-rooms.example/book', cls: 'w7-screen', body: [
        el('div', { class: 'field' }, [el('span', { class: 'k' }, 'Room'), el('span', { class: 'v' }, C.rooms[0])]), duration, message,
        el('span', { class: 'w7-fake-btn', 'aria-hidden': 'true' }, 'Book'), result] }), 'booking-screen');
      const question = card([title('Decide before the reveal'), el('p', { class: 'w7-big', style: 'font-size:26px' }, 'If both edits combine, is the behavior ready?'), el('p', { class: 'w7-body', style: 'margin-top:8px' }, `${C.users[0].name} tries ${CM.request_minutes} minutes: inside the range the message offers, beyond the changed rule.`)]);
      body.append(el('div', { class: 'w7-grid', style: 'grid-template-columns:minmax(0,1fr) 600px;gap:28px;height:100%' }, [
        el('div', { class: 'w7-stack' }, [el('div', { class: 'w7-grid w7-two' }, [left, right]), join, merge, el('div', { style: 'display:flex;gap:14px' }, [mergeBtn, checkBtn]), answer,
          el('p', { class: 'w7-small' }, 'Campus Rooms is fictional. The 90-minute rule is a temporary trial; the canonical 30-to-120-minute rule returns at the end of this lecture.')]),
        el('div', { class: 'w7-stack' }, [question, el('div', { class: 'w7-title', style: 'margin:4px 0 -6px' }, `What ${C.users[0].name} sees`), screen]),
      ]));
      const render = (st) => {
        body.dataset.state = String(st);
        merge.set(st ? CM.merge_result : 'The edits are still separate.', st ? 'ok' : 'warn');
        joins.forEach((a) => show(a, st >= 1)); node.classList.toggle('is-merged', st >= 1); node.querySelector('.w7-join-tick').style.opacity = st >= 1 ? 1 : 0;
        show(message, st >= 1); show(answer, st >= 2);
        result.set(st >= 2 ? `${CM.outcome}: ${CM.request_minutes} minutes` : st ? 'Ready to send' : 'Not sent yet', st >= 2 ? 'bad' : 'warn');
        duration.classList.toggle('is-bad', st >= 2);
        mergeBtn.disabled = st >= 1; checkBtn.disabled = st !== 1;
        if (st === 1) { glow(api, node, '111,220,154'); glow(api, message); }
        if (st === 2) { glow(api, result, '255,139,123'); glow(api, message); }
      };
      mergeBtn.addEventListener('click', () => render(1)); checkBtn.addEventListener('click', () => render(2));
      body.reset = () => render(0); body.reset();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      body.append(el('p', {}, `${RV.author} edits ${CM.policy_file}; ${RV.reviewer} edits ${CM.message_file}. Minus removes a line; plus adds a line.`),
        el('div', { class: 'print-columns', style: 'margin:16px 0' }, [el('div', {}, [title('Policy · temporary R-02 variant'), diff(printApi, LOC.before, LOC.after, 'policy')]), el('div', {}, [title('Message'), code(printApi, CM.copied_code, 'message', true)])]),
        el('p', {}, `Prediction: if the edits combine, is the behavior ready? The text merges cleanly. A ${CM.request_minutes}-minute request returns “${CM.outcome}”, while the message says “${CM.copied_message}.” The message and the policy describe different behavior.`),
        el('div', { class: 'print-note' }, 'A shared change needs an intended behavior, a history, focused review, and checks of the combined result. The 90-minute rule is temporary.'));
    },
  };

  const OUTCOMES = [   // plan Section 2
    'Read a small commit graph and distinguish commits, branch references, and merges.',
    'Explain the difference between a textual conflict and an incompatible behavioral change.',
    'Identify the context and evidence needed to review a change.',
    'Explain how dependency and configuration choices affect reproducibility.',
    'Use history and decision records to explain why a change was made.',
  ];
  const outcomes = {
    kind: 'page', id: 'outcomes', heading: 'The software has contracts. The change needs context.',
    lead: 'Week 6 followed requests across boundaries. Now those promises must survive several people changing the system.', printRole: 'Recall and outcomes',
    build(body, api) {
      const rows = OUTCOMES.map((t, i) => cue(api, el('li', {}, [el('span', { class: 'n' }, String(i + 1)), el('span', {}, t)]), `outcome-${i + 1}`));
      body.append(el('div', { class: 'w7-grid', style: 'grid-template-columns:760px minmax(0,1fr);gap:28px;height:100%' }, [
        el('ol', { class: 'outcome-list' }, rows), el('div', { class: 'w7-stack' }, [
          card([title('From Week 6'), el('p', { class: 'w7-body' }, 'A booking contract includes its results, failure meanings, and retry identity. A decision record carries the reasons and revisit triggers.')]),
          card([title('The promises we keep'), ...textRows(api, [['R-01', 'Overlapping bookings cannot both be confirmed.'], ['R-02', `${C.duration_minutes.min} to ${C.duration_minutes.max} minutes, inclusive.`], ['R-03', `${upper1(RV.ownership.rule.replace('R-03: ', ''))}.`]], 'rule')]),
          cue(api, el('div', { class: 'w7-note w7-note--warn' }, `${CI.reason} Each scene that uses the 90-minute trial marks it as temporary.`), 'temporary-rule'),
          card([title('The question for this lecture'), el('p', { class: 'w7-big' }, WEEK_Q)]),
        ]),
      ]));
    },
    print(body) { body.append(el('h3', {}, 'What you will be able to explain'), list(OUTCOMES), el('h3', {}, 'Recall'), el('p', {}, 'Week 6 established request and result contracts, safe retry identity, and decisions with revisit triggers.'), el('h3', {}, 'Case baseline'), el('p', {}, `R-02 accepts ${C.duration_minutes.min} to ${C.duration_minutes.max} minutes inclusive. R-03 keeps cancellation with the booking owner. ${CI.reason}`)); },
  };

  // Preparation for the graph: saved, selected, committed and shared are separate states.
  const locations = {
    kind: 'page', id: 'what-is-saved', heading: 'Saved on your machine is different from shared with the team',
    lead: 'Follow one policy edit through four places. Each action changes a different part of the record.', printRole: 'Before the graph',
    build(body, api) {
      const cards = [], values = [], buttons = [];
      const strip = el('div', { class: 'w7-grid', style: 'grid-template-columns:repeat(4,minmax(0,1fr));gap:20px' });
      LOC.locations.forEach((item, i) => {
        const val = cue(api, el('div', { class: 'w7-location-value' }), `value-${item.id}`);
        const btn = cue(api, el('button', { type: 'button', class: 'preset-btn w7-location-btn' }, item.action), `action-${item.id}`);
        const box = cue(api, el('div', { class: 'w7-location' }, [el('div', { class: 'w7-location-num' }, String(i + 1)), el('h3', { style: 'font-size:26px' }, item.name), el('p', { class: 'w7-location-detail' }, item.detail), val, btn]), item.id);
        cards.push(box); values.push(val); buttons.push(btn); strip.append(box);
      });
      const state = status('The next commit and the remote still contain the old policy.');
      const refs = cue(api, card([title('Which reference has moved?'), el('div', { class: 'w7-grid w7-two' }, [el('div', { class: 'w7-body w7-mono', 'data-ref-local': '' }), el('div', { class: 'w7-body w7-mono', 'data-ref-shared': '' })])]), 'references');
      // The edit travels from place to place: the moving copy shows what each action carries.
      const token = el('div', { class: 'w7-flying', 'aria-hidden': 'true' });
      body.append(el('div', { class: 'w7-stack' }, [strip, state, refs, el('p', { class: 'w7-small' }, `${LOC.unsaved} Selected changes can differ from later edits to the working files.`)]), token);
      const render = (st) => {
        body.dataset.state = String(st);
        values.forEach((v, i) => { v.textContent = i < 2 ? (st > i ? LOC.after : LOC.before) : (st > i ? LOC.local_after : LOC.local_before); });
        cards.forEach((n, i) => { n.classList.toggle('is-now', st === i); n.classList.toggle('is-done', st > i); });
        buttons.forEach((b, i) => { b.disabled = st !== i; });
        refs.querySelector('[data-ref-local]').textContent = `${LOC.branch} → ${st >= 3 ? LOC.local_after : LOC.local_before} · local`;
        refs.querySelector('[data-ref-shared]').textContent = `${LOC.shared_ref} → ${st >= 4 ? LOC.local_after : LOC.local_before}`;
        const captions = ['The editor has a proposed edit; save it to change the working file.', 'The working file changed. The next commit still has the old selected content.', 'The next snapshot is prepared. No new commit has been recorded yet.', 'The commit exists locally. Sharing is a separate action.', 'The remote accepted the update. The remote-tracking reference now reflects it.'];
        state.set(captions[st], st === 4 ? 'ok' : 'warn');
        if (st > 1) fly(api, body, token, values[st - 2], values[st - 1], { label: st === 2 ? LOC.after : LOC.local_after });
        if (st > 0) { changePulse(api, values[st - 1], st > 1 ? 760 : 0); glow(api, cards[st - 1]); }
      };
      buttons.forEach((b, i) => b.addEventListener('click', () => render(i + 1)));
      body.reset = () => render(0); body.reset();
    },
    onEnter(body) { body.reset(); },
    print(body) { body.append(el('div', { class: 'print-columns' }, LOC.locations.map((item, i) => el('div', {}, [el('h3', {}, `${i + 1}. ${item.name}`), el('p', {}, `${item.action}. ${item.detail}`)]))), el('h3', {}, 'The edit and the references'), el('p', {}, `${LOC.file}: ${LOC.before} becomes ${LOC.after}. The local ${LOC.branch} reference moves from ${LOC.local_before} to ${LOC.local_after} when the commit is recorded. ${LOC.shared_ref} stays at ${LOC.local_before} until sharing updates it. ${LOC.unsaved}`)); },
  };

  // 1. A branch label moves independently of the recorded nodes.
  const commitGraph = {
    id: 'commit-graph', role: 'anchor', heading: 'A branch name moves. A recorded commit stays put.',
    lead: 'Read the parent links: they show which snapshots each change builds on.',
    principle: 'History records relationships between changes; branch names are movable references, not the changes themselves.',
    principleShort: 'Follow the parents; watch the names move.',
    conditions: [
      { id: 'diverged', baseline: true, label: 'Two lines of work from the same ancestor', short: 'Diverged work', states: [
        { caption: 'The same starting snapshot can lead to two different changes.', prompt: { question: 'What is a branch name?', options: ['A permanent copy of every file', 'A movable reference to a commit', 'A guarantee that its changes are correct'] } },
        { caption: `**${CG.commits[0].id}:** record the duration policy. A commit represents a snapshot and its recorded ancestry.` },
        { caption: `**${CG.commits[1].id}:** add cancellation ownership. Its parent is ${CG.commits[0].id}. The branch name moves to this new snapshot.` },
        { caption: `**${CG.commits[2].id}:** ${LOC.branch} moves ahead. It changes the maximum to **${CI.variant_max} minutes**, a temporary variant.` },
        { caption: `**${CG.commits[3].id}:** limit-message develops from **${CG.commits[1].id}**. The descendants share an ancestor; neither contains the other.` },
        { caption: `**${CG.commits[4].id}:** a merge commit has **two parents**, ${CG.commits[4].parents.join(' and ')}. Both histories are connected; their behavior still needs checking.` },
        { caption: `**${CG.commits[5].id}:** a later commit restores the canonical **${C.duration_minutes.max}-minute** rule, and main moves forward along the parent links to it. The earlier snapshots remain in history.`, principle: true },
      ] },
      { id: 'fast-forward', label: 'The current tip is an ancestor of the other tip', short: 'No divergence', states: [
        { caption: `main is at ${LOC.local_before}; the policy branch is at ${LOC.local_after}. No separate main change appeared.`, prompt: { question: 'How can main include the policy change?', options: ['Duplicate the files', 'Always create a two-parent commit', 'Move main to the descendant commit'] } },
        { caption: 'Follow the existing parent link. All of main’s current history is already in the policy branch.' },
        { caption: `main moves from **${LOC.local_before} to ${LOC.local_after}**. This is a **fast-forward**; it adds no merge commit.` },
        { caption: 'A divergent history needs reconciliation. A fast-forward only moves a reference along existing ancestry.', principle: true },
      ] },
    ],
    setup(stage, api) {
      const svg = window.VC.svg(1264, 370, { label: 'Six recorded snapshots with parent relationships and moving branch names', uid: api.uid });
      svg.classList.add('w7-graph'); cue(api, svg, 'graph');
      const points = { c1: [88, 207], c2: [300, 207], c3: [560, 104], c4: [560, 315], c5: [890, 207], c6: [1140, 207] };
      const edges = [];
      CG.commits.forEach((commit, i) => commit.parents.forEach((parent) => {
        const a = points[parent], b = points[commit.id];
        const edge = arrow(svg, { from: { x: a[0] + 24, y: a[1] }, to: { x: b[0] - 27, y: b[1] }, kind: i === 4 ? 'violet' : 'accent', cls: 'rv rv--draw' });
        cue(api, edge, `parent-${parent}-${commit.id}`); edges.push({ node: edge, at: i + 1, id: commit.id });
      }));
      const nodes = CG.commits.map((commit, i) => {
        const [x, y] = points[commit.id];
        // Use absolute SVG coordinates: the shared print rule clears reveal transforms.
        const g = s('g', { class: `w7-commit rv${commit.parents.length > 1 ? ' w7-merge' : ''}` }, [s('circle', { cx: x, cy: y, r: 25 }), text(x, y + 7, commit.id, { class: 'w7-cid' })]);
        // Each message is explained in the snapshot card; concise graph labels stay clear of the edges.
        const labels = [ 'Duration policy', 'Ownership check', 'Temporary limit', 'Copied message', 'Two parents', 'Restore baseline' ];
        g.appendChild(text(x, y + 49, labels[i], { class: 'w7-cmsg' }));
        cue(api, g, `commit-${commit.id}`); svg.appendChild(g); return g;
      });
      const branch = (name, kind) => {
        const w = name.length * 10 + 26;
        const g = s('g', { class: `w7-branch w7-branch--${kind}` }, [s('rect', { x: -w / 2, y: -15, width: w, height: 30, rx: 8 }), text(0, 6, name, { 'text-anchor': 'middle' })]);
        svg.appendChild(g); cue(api, g, `branch-${name}`); return g;
      };
      const branches = { main: branch('main', 'main'), policy: branch(LOC.branch, 'policy'), message: branch('limit-message', 'message') };
      const snapshotTitle = el('div', { class: 'w7-title' });
      const snapshotBody = el('div', { class: 'w7-body' });
      const snapshot = cue(api, card([snapshotTitle, snapshotBody]), 'snapshot');
      const meaning = cue(api, card([title('How to read this picture'), ...CG.legend.map((l) => el('p', { class: 'w7-small', style: 'margin-bottom:7px' }, l))]), 'legend');
      const message = cue(api, rv(el('div', { class: 'w7-note w7-note--warn' })), 'comparison');
      stage.append(el('div', { class: 'w7-stack' }, [svg, el('div', { class: 'w7-grid w7-two', style: 'min-height:170px' }, [snapshot, meaning]), message]));
      return { svg, nodes, edges, branches, snapshotTitle, snapshotBody, message, positions: {} };
    },
    render(h, v, api) {
      const st = v.state, base = v.conditionId === 'diverged';
      const visible = base ? Math.max(1, st) : 3;
      h.nodes.forEach((node, i) => { show(node, i < visible); node.classList.toggle('is-now', base ? i === Math.max(0, st - 1) : i === 2); });
      h.edges.forEach((e) => show(e.node, base ? e.at <= visible : e.id === 'c2' || e.id === 'c3'));
      const place = (key, pos, on) => {
        const node = h.branches[key]; node.style.display = on ? '' : 'none'; if (!on) return;
        const from = h.positions[key]; node.setAttribute('transform', `translate(${pos[0]} ${pos[1]})`);
        if (api.motion && from && (from[0] !== pos[0] || from[1] !== pos[1])) api.animate(node, [{ transform: `translate(${from[0]}px,${from[1]}px)` }, { transform: `translate(${pos[0]}px,${pos[1]}px)` }], { duration: 700, easing: 'cubic-bezier(.2,.7,.2,1)' });
        h.positions[key] = pos;
      };
      place('main', base ? (st >= 6 ? [1140, 151] : st >= 2 ? [300, 151] : [88, 151]) : st >= 2 ? [560, 14] : [300, 151], true);
      place('policy', base ? st >= 5 ? [890, 151] : [560, 48] : [560, 48], base ? st >= 3 : true);
      place('message', [560, 260], base && st >= 4);
      const cid = base ? CG.commits[Math.max(0, st - 1)].id : 'c3';
      const snapshot = CG.snapshots[cid];
      h.snapshotTitle.textContent = `${cid} · ${base && st < 1 ? 'first recorded snapshot' : 'recorded content'}`;
      h.snapshotBody.replaceChildren(el('p', { class: 'w7-mono' }, `MAX_MINUTES = ${snapshot.max_minutes}`), el('p', { class: 'w7-small', style: 'margin-top:7px' }, CG.commits.find((c) => c.id === cid).message), el('p', { class: 'w7-small', style: 'margin-top:6px' }, snapshot.message_max ? `Message limit: ${snapshot.message_max} minutes.` : 'No duration message in this snapshot.'));
      show(h.message, (base && st >= 5) || (!base && st >= 2));
      h.message.textContent = base ? (st === 5 ? `At c5, the rule says ${snapshot.max_minutes} and the message says ${snapshot.message_max}. Two connected histories can still make a contradictory promise.` : 'The restoration is another recorded change. Moving a name preserves the earlier commits and their parent links.') : `${CG.fast_forward_example}.`;
      if (api.motion && base && st > 0) glow(api, h.nodes[st - 1]);
    },
    print: [
      { title: 'The common ancestor and its parent', condition: 'diverged', state: 2, caption: 'Which part can move: a recorded snapshot, its parent relationship, or a branch name? The branch name moves to the next recorded commit.', note: 'A commit records a snapshot and its parent relationship. A branch name points to a commit; a later commit can move that name.' },
      { title: 'Two descendants of the same ancestor', condition: 'diverged', state: 4, note: 'c3 and c4 both descend from c2. One changes the policy; the other adds a copied message. Neither descendant includes the other.' },
      { title: 'A two-parent merge and the later restoration', condition: 'diverged', state: 6, principle: true, caption: 'c5 connects c3 and c4 as a two-parent merge. The later c6 records the restoration and main moves to it. All six recorded commits remain in the history.', note: 'At c5, the 90-minute policy and 120-minute message disagree. c6 restores the canonical 120-minute limit; the readiness scene checks that restoration. A merge connects ancestry; its combined behavior needs its own checks.' },
      { title: 'Changed: no divergence, so a reference can fast-forward', condition: 'fast-forward', state: 2, note: 'main at c2 is an ancestor of c3. Moving main to c3 needs no new merge commit. The shorter limit remains a labeled temporary variant.' },
    ],
  };

  // 2. Resolve a conflict using both intended changes and observable boundaries.
  const predicate = (name) => CI.snippets.find((x) => x.name === `${name} duration predicate`);
  const allowed = (n) => CI.min_minutes <= n && n <= CI.variant_max;   // R-02 under the temporary variant
  const resultOf = (name, n) => predicate(name).cases.find((c) => c.args[0] === n).expected;
  const WRONG = CI.check_values.filter((n) => resultOf('bad', n) !== allowed(n));
  const conflict = {
    id: 'conflict-and-intent', role: 'anchor', heading: 'Removing the conflict can remove the rule.',
    lead: `The same validation is edited twice: a temporary ${CI.variant_max}-minute limit and a clearer function. Which meaning survives?`,
    principle: 'A merge resolution must reconcile intent and verify the combined behavior, not merely remove conflict markers.',
    principleShort: 'Keep both intentions, then check the boundary.',
    conditions: [
      { id: 'lost-bound', baseline: true, label: 'The resolution loses the upper bound', short: 'Text fixed, rule lost', states: [
        { caption: 'Start with the shared original and the two proposed edits. Both rewrite the same lines of one function.', prompt: { question: 'Which version should the resolution keep?', options: ['The intended rule and the useful restructuring', 'The left version, as it is', 'The right version, as it is'] } },
        { caption: `Both edits rewrite the same lines, so the merge stops with a **textual conflict**. Edit A changes **${CI.original_max} to ${CI.variant_max}** and rewrites the upper check; edit B replaces the body with one Boolean decision.` },
        { caption: 'This resolution is valid pseudocode, and the conflict markers are gone. Its return value checks only the **lower bound**.' },
        { caption: `**${WRONG.join(', ').replace(/, (?=[^,]*$)/, ' and ')} minutes are accepted.** R-02 rejects each of them: the temporary upper bound has disappeared.` },
        { caption: 'A clean file can still contain the wrong decision. Compare the boundary results with R-02.', principle: true },
      ] },
      { id: 'intent-kept', label: 'The resolution preserves both intentions', short: 'Intent preserved', states: [
        { caption: 'Keep the temporary rule and the shorter validation function.', prompt: { question: 'Which evidence distinguishes the two resolutions?', options: ['Whether conflict markers disappeared', 'Whether the combined function enforces the approved bounds', 'Whether the file became shorter'] } },
        { caption: `Keep **MAX_MINUTES = ${CI.variant_max}** and the inclusive lower and upper comparisons.` },
        { caption: `**${CI.variant_max} accepted, ${CI.variant_max + 1} rejected, ${CI.check_values[5]} rejected.** The intended boundary survives.` },
        { caption: 'The resolution preserves the new rule and the structural improvement.', principle: true },
      ] },
    ],
    setup(stage, api) {
      const inputs = [['Shared ancestor', CI.display.ancestor, 'ancestor'], ['Edit A · temporary policy', CI.display.policy, 'policy'], ['Edit B · restructure', CI.display.structure, 'structure']].map(([label, src, key]) => {
        // highlight the lines each edit changed; edit B rewrites the whole body that edit A also touched
        const c = code(api, src, `input-${key}`, true); c.focusLines(key === 'policy' ? [1, 5] : key === 'structure' ? [3, 4, 5, 6] : []);
        return cue(api, card([title(label), c]), key);
      });
      // The requirement both edits serve stays beside them.
      const requirement = cue(api, card([title('R-02 · temporary variant'), el('div', { class: 'w7-req' }, [
        el('p', { class: 'w7-req-rule' }, ['A booking lasts ', el('b', {}, `${CI.min_minutes} to ${CI.variant_max} minutes`), ', both included.']),
        el('p', { class: 'w7-small' }, 'Edit A implements this limit. Edit B keeps the same rule in a clearer shape.')])], 'w7-req-card'), 'requirement');
      const resolutionCode = code(api, CI.display.bad, 'resolution');
      const resolution = cue(api, rv(card([title('Chosen resolution'), resolutionCode, el('p', { class: 'w7-small', style: 'margin-top:8px' }, 'Python-like pseudocode: the return value answers whether the duration is allowed.')])), 'chosen-resolution');
      const rows = CI.check_values.map((n, i) => cue(api, el('tr', {}, [el('th', { scope: 'row' }, String(n)), el('td', {}, ''), el('td', {}, verdict(allowed(n))), el('td', {})]), `boundary-${i + 1}`));
      const table = el('table', { class: 'w7-table', 'aria-label': 'Duration results under the temporary 90-minute rule' }, [el('thead', {}, el('tr', {}, [el('th', {}, 'Minutes'), el('th', {}, 'Resolution does'), el('th', {}, 'R-02 requires'), el('th', {}, 'Agree?')])), el('tbody', {}, rows)]);
      const checks = cue(api, rv(card([title('Boundary comparison · temporary variant'), table])), 'checks');
      stage.append(el('div', { class: 'w7-stack' }, [el('div', { class: 'w7-grid w7-three', style: 'height:253px;flex:0 0 auto' }, inputs),
        el('div', { class: 'w7-grid', style: 'grid-template-columns:minmax(0,1fr) minmax(0,1.08fr);flex:1' }, [el('div', { class: 'w7-stack', style: 'gap:12px' }, [requirement, resolution]), checks])]));
      const tokens = [CI.display.good.split('\n')[0], CI.display.good.split('\n')[2].trim()].map((str, i) => cue(api, el('div', { class: 'w7-flying', 'aria-hidden': 'true' }, str), `combined-intent-${i + 1}`));
      stage.append(...tokens);
      return { stage, inputs, requirement, resolution, resolutionCode, checks, rows, tokens };
    },
    render(h, v, api) {
      const good = v.conditionId === 'intent-kept', st = v.state;
      show(h.resolution, st >= (good ? 1 : 2)); show(h.checks, st >= (good ? 2 : 3));
      h.resolutionCode.setCode(good ? CI.display.good : CI.display.bad);
      h.resolutionCode.focusLines(st > 0 ? [3] : []);
      h.resolution.classList.toggle('is-bad', !good); h.resolution.classList.toggle('is-ok', good);
      h.inputs.forEach((n, i) => focus(n, st === 1 && i > 0));
      focus(h.requirement, st === (good ? 2 : 3));
      h.rows.forEach((row, i) => { const n = CI.check_values[i], actual = resultOf(good ? 'good' : 'bad', n), agree = actual === allowed(n); row.children[1].textContent = verdict(actual); row.children[3].replaceChildren(mark(agree), agree ? 'Yes' : 'No'); row.classList.toggle('is-bad', !agree); row.classList.toggle('is-ok', agree); });
      // The correct resolution visibly carries both pieces of intent into one function.
      // The final code is already in place, so cancelling motion or stepping back loses no information.
      if (api.motion && good && st === 1) {
        const stageRect = h.stage.getBoundingClientRect(), scale = stageRect.width / 1264;
        const target = h.resolutionCode.getBoundingClientRect();
        h.tokens.forEach((token, i) => {
          const source = h.inputs[i + 1].getBoundingClientRect();
          const fromX = (source.left - stageRect.left) / scale + 12, fromY = (source.top - stageRect.top) / scale + 46;
          const toX = (target.left - stageRect.left) / scale + 28, toY = (target.top - stageRect.top) / scale + 6 + i * 54;
          api.animate(token, [{ transform: `translate(${fromX}px,${fromY}px)`, opacity: 0 }, { transform: `translate(${fromX}px,${fromY}px)`, opacity: 1, offset: .12 }, { transform: `translate(${toX}px,${toY}px)`, opacity: 1, offset: .85 }, { transform: `translate(${toX}px,${toY}px)`, opacity: 0 }], { duration: 1050, delay: i * 150, easing: 'cubic-bezier(.2,.7,.2,1)' });
        });
      }
      if (!good && st === 2) changePulse(api, h.resolutionCode);
      if (st === (good ? 2 : 3)) glow(api, h.checks, good ? '111,220,154' : '255,139,123');
    },
    print: [
      { title: 'Original and edits: two intentions touch one validation', condition: 'lost-bound', state: 1, caption: 'Which intentions must survive? Keep the temporary shorter policy and the clearer validation structure. Read the shared original and both edits before examining the resolution.', note: 'The policy changes from 120 to a temporary 90-minute maximum; the other edit rewrites the inclusive range check. A textual conflict asks how to combine these intentions.' },
      { title: 'A valid-looking resolution loses the upper bound', condition: 'lost-bound', state: 3, note: 'The shown resolution accepts 91, 120 and 121 minutes. Each violates the temporary R-02 maximum. Syntax and marker removal answer a different question from policy behavior.' },
      { title: 'Keep the new rule and the clearer structure', condition: 'intent-kept', state: 3, principle: true, note: 'The resolution retains MAX_MINUTES = 90 and both inclusive comparisons. The table covers the lower bound, the changed upper bound, and durations beyond it.' },
    ],
  };

  // 3. Different files can describe incompatible behavior after a clean merge.
  const cleanMerge = {
    id: 'clean-merge-wrong-behavior', role: 'bridge', heading: 'Different files can still disagree about one promise.',
    lead: `The temporary policy rejects ${CM.request_minutes} minutes. What will the new message tell you?`,
    principle: 'Textual integration and semantic integration are different kinds of evidence.',
    principleShort: 'Check the promise across the combined files.',
    conditions: [
      { id: 'copied', baseline: true, label: 'The message stores a second limit', short: 'Copied limit', states: [
        { caption: 'The two files were changed on separate lines of work.', prompt: { question: 'What does a clean textual merge establish here?', options: ['The user promise is consistent', 'The text combined without an unresolved textual conflict', 'Every relevant check passed'] } },
        { caption: '**Text merged cleanly.** The policy and message were edited in different files.' },
        { caption: `A **${CM.request_minutes}-minute** request is **${CM.outcome}**. The message still invites durations up to **${CM.hard_coded_max}**.` },
        { caption: 'Two copies of the same decision have drifted. Inspect the combined user experience.', principle: true },
      ] },
      { id: 'derived', label: 'The message reads the approved policy', short: 'One policy source', states: [
        { caption: 'Change how the message gets its values; keep the same request and rule.', prompt: { question: 'Which value should supply the message?', options: ['The approved policy used by validation', 'A second constant in messages.py', 'The old message copied from main'] } },
        { caption: 'The message imports the lower and upper limits from policy.py. It follows the same approved values as validation.' },
        { caption: `The same **${CM.request_minutes}-minute** request is rejected. Now the message says **${CI.min_minutes} to ${CI.variant_max} minutes**, which agrees with the decision.` },
        { caption: 'One policy source connects the user message to the behavior it explains.', principle: true },
      ] },
    ],
    setup(stage, api) {
      const merge = cue(api, status('The two edits are separate.'), 'merge-status');
      const policyCode = code(api, CM.policy_code, 'policy-code');
      const messageCode = code(api, CM.copied_code, 'message-code');
      const policy = cue(api, card([el('div', { class: 'w7-title w7-mono', style: 'text-transform:none' }, CM.policy_file), badge('R-02 · temporary variant', 'w7-variant'), el('div', { style: 'height:8px' }), policyCode]), 'policy-file');
      const message = cue(api, card([el('div', { class: 'w7-title w7-mono', style: 'text-transform:none' }, CM.message_file), messageCode]), 'message-file');
      const userMessage = el('div', { class: 'w7-big' });
      const result = cue(api, rv(card([title(`${C.users[0].name} requests ${CM.request_minutes} minutes`), status(CM.outcome, 'bad'), el('div', { class: 'w7-title', style: 'margin-top:15px' }, 'What the message says'), userMessage])), 'user-result');
      // One promise, two places: the limit validation enforces beside the limit the message announces.
      const sides = [el('span', { class: 'chip chip--accent' }), el('span', { class: 'w7-compare-op', 'aria-hidden': 'true' }), el('span', { class: 'chip chip--warn' }), el('span', { class: 'w7-small' })];
      const compare = cue(api, rv(el('div', { class: 'w7-compare', role: 'group', 'aria-label': 'The validated limit compared with the announced limit' }, sides)), 'limit-comparison');
      const conclusion = cue(api, rv(el('div', { class: 'w7-note' })), 'conclusion');
      stage.append(el('div', { class: 'w7-stack' }, [merge, el('div', { class: 'w7-grid w7-two', style: 'height:236px;flex:0 0 auto' }, [policy, message]), compare, result, conclusion]));
      return { merge, policyCode, messageCode, message, userMessage, result, compare, sides, conclusion };
    },
    render(h, v, api) {
      const derived = v.conditionId === 'derived', st = v.state;
      h.merge.set(st > 0 ? CM.merge_result : 'The two edits are separate.', st > 0 ? 'ok' : 'warn');
      h.messageCode.setCode(derived && st >= 1 ? CM.derived_code : CM.copied_code);
      h.userMessage.textContent = derived ? CM.derived_message : CM.copied_message;
      h.userMessage.className = `w7-big ${derived ? 'w7-ok' : 'w7-warn'}`;
      show(h.result, st >= 2); show(h.compare, st >= 2); show(h.conclusion, st >= 3);
      const announced = derived ? CM.variant_max : CM.hard_coded_max, agree = announced === CM.variant_max;
      h.sides[0].textContent = `${CM.policy_file} enforces ${CM.variant_max}`;
      h.sides[1].textContent = agree ? '=' : '≠'; h.sides[1].className = `w7-compare-op ${agree ? 'is-ok' : 'is-bad'}`;
      h.sides[2].textContent = `${CM.message_file} announces ${announced}`; h.sides[2].className = `chip ${agree ? 'chip--ok' : 'chip--warn'}`;
      h.sides[3].textContent = agree ? 'one source, one promise' : 'two copies of one promise';
      h.conclusion.textContent = derived ? 'The rejection and its explanation now follow the same policy.' : 'The textual merge succeeded; the combined user promise contradicts itself.';
      focus(h.message, st === 1 && derived);
      h.policyCode.focusLines(st >= 2 ? [CM.policy_code.split('\n').findIndex((ln) => /^MAX_MINUTES\s*=/.test(ln)) + 1] : []);
      h.messageCode.focusLines(st >= 2 ? (derived ? [1, 4] : [2]) : []);
      if (st === 2) { glow(api, h.result, derived ? '111,220,154' : '255,139,123'); glow(api, h.compare, derived ? '111,220,154' : '255,139,123'); }
    },
    print: [
      { title: 'A clean merge, followed by contradictory behavior', condition: 'copied', state: 3, principle: true, note: 'The two files combine without a textual conflict. A 100-minute booking is rejected under the temporary 90-minute rule, while the message still offers up to 120 minutes.' },
      { title: 'Changed: the message reads the same approved policy', condition: 'derived', state: 3, note: 'Keep the same request and the same temporary policy. Deriving the message from Policy produces “Choose 30 to 90 minutes,” which agrees with the rejection.' },
    ],
  };

  // 4. A review packet connects purpose, diff, checks, required concerns and a decision.
  const review = {
    id: 'review-with-context', role: 'anchor', heading: 'A diff needs a claim you can check.',
    lead: 'Read the change, then reveal the purpose, constraints, checks, and reasons behind each review comment.',
    principle: 'Review is an evidence-based conversation about a change, not a vote on how convincing its author sounds.',
    principleShort: 'Make the purpose and the checks visible.',
    conditions: [
      { id: 'mixed', baseline: true, label: 'The policy change includes an unrelated rename', short: 'Mixed change', states: reviewStates('mixed') },
      { id: 'focused', label: 'The unrelated rename is reviewed separately', short: 'Focused change', states: reviewStates('focused') },
      { id: 'automated', label: 'The same mixed diff was drafted by an assistant', short: 'Assistant draft', states: reviewStates('automated') },
    ],
    setup(stage, api) {
      const author = cue(api, el('p', { class: 'w7-small', style: 'margin-bottom:8px' }), 'description');
      const dc = diff(api, LOC.before, LOC.after, 'policy-diff');
      const msg = el('p', { class: 'w7-small w7-mono', style: 'margin-top:8px' });
      const rename = el('p', { class: 'w7-small', style: 'margin-top:6px' });
      const changes = cue(api, card([title('The proposed change · − removes, + adds'), author, dc, msg, rename]), 'diff');
      const packet = cue(api, rv(card([title('What the reviewer needs'), ...textRows(api, [['Purpose', RV.packet.requirement], ['Constraint', RV.constraint], ['Alternatives', RV.alternatives.join(' / ')]], 'context')])), 'context');
      const checkLines = [el('p', { class: 'w7-small' }), el('p', { class: 'w7-small' }), el('p', { class: 'w7-small' })];
      const checks = cue(api, rv(card([title('Checks on this combined change'), ...checkLines])), 'checks');
      const comments = RV.packet.comments.map((c, i) => cue(api, el('div', { class: 'w7-comment' }, [
        el('div', {}, [el('span', { class: 'w7-comment-category' }, upper1(c.category)), el('span', { class: `w7-comment-level${RV.comment_levels[c.category] === 'Optional' ? ' is-optional' : ''}` }, RV.comment_levels[c.category])]),
        el('p', { class: 'w7-comment-text' }, c.text),
      ]), `comment-${i + 1}`));
      const commentsBox = cue(api, rv(card([title('Review the change, with a reason'), el('div', { style: 'display:flex;flex-direction:column;gap:7px' }, comments)])), 'comments');
      const concernText = el('p', { class: 'w7-small' });
      const concernTitle = title('A substantive concern stays open');
      const concern = cue(api, rv(card([concernTitle, concernText])), 'remaining-concern');
      const decisionText = el('p', { class: 'w7-small' });
      const decision = cue(api, rv(card([title('Decision and durable rationale'), decisionText])), 'decision');
      stage.append(el('div', { class: 'w7-grid w7-two', style: 'height:100%;gap:16px' }, [
        el('div', { class: 'w7-stack', style: 'gap:12px' }, [changes, packet, checks, cue(api, el('p', { class: 'w7-small' }, 'Linters and formatters handle routine style. Human review examines correctness, security, design, and meaning.'), 'automation-boundary')]),
        el('div', { class: 'w7-stack', style: 'gap:12px' }, [commentsBox, concern, decision]),
      ]));
      return { author, msg, rename, changes, packet, checks, checkLines, comments, commentsBox, concern, concernTitle, concernText, decision, decisionText };
    },
    render(h, v, api) {
      const st = v.state, automated = v.conditionId === 'automated', focused = v.conditionId === 'focused';
      h.author.textContent = automated ? (st >= 5 ? `Assistant draft · “${HX.title}”` : `Drafted by ${RV.ai_beat.drafted_by}. Description: “${RV.ai_beat.description_shown}”.`) : `Change by ${RV.author}; review by ${RV.reviewer}.`;
      h.msg.textContent = st >= 3 ? 'Message: derive the displayed limit from Policy.' : `Message: “${CM.copied_message}”.`;
      h.rename.textContent = focused || st >= 5 ? 'The helper rename is in its own change.' : 'Also included: an unrelated helper rename.';
      h.rename.classList.toggle('w7-warn', !focused && st < 5);
      show(h.packet, st >= 1); show(h.checks, st >= 2); show(h.commentsBox, st >= 2); show(h.concern, st >= 2); show(h.decision, st >= 5);
      h.checkLines[0].textContent = `✓ Boundary table: ${RV.packet.checks[0].result}.`;
      h.checkLines[0].className = 'w7-small w7-ok';
      h.checkLines[1].textContent = st >= 3 ? `✓ Message agrees with Policy: says ${CI.variant_max}.` : `× Message agrees with Policy: ${RV.packet.checks[1].result}.`;
      h.checkLines[1].className = `w7-small ${st >= 3 ? 'w7-ok' : 'w7-bad'}`;
      h.checkLines[2].textContent = st >= 4 ? `✓ R-03: ${RV.ownership.evidence}` : '? R-03: combined-change cancellation results are missing.';
      h.checkLines[2].className = `w7-small ${st >= 4 ? 'w7-ok' : 'w7-warn'}`;
      h.concernText.textContent = st >= 4 ? `${RV.disagreement.record} ${RV.disagreement.owner}` : `${RV.disagreement.claim} Missing evidence: ${RV.disagreement.missing}`;
      h.concernTitle.textContent = st >= 4 ? 'Evidence resolves the concern' : 'A substantive concern stays open';
      h.concern.classList.toggle('is-ok', st >= 4); h.concern.classList.toggle('is-focus', st === 3);
      h.commentsBox.querySelector('.w7-title').textContent = st >= 3 ? 'Review comments · original concerns' : 'Review the change, with a reason';
      h.comments.forEach((node, i) => {
        const category = RV.packet.comments[i].category;
        const resolved = category === 'correctness' ? st >= 3 : category === 'security' ? st >= 4 : category === 'understandability' ? st >= 1 : category === 'design' ? focused || st >= 5 : false;
        const level = node.querySelector('.w7-comment-level');
        level.textContent = resolved ? (category === 'design' ? 'Separate change' : 'Resolved') : RV.comment_levels[category];
        level.classList.toggle('w7-ok', resolved);
      });
      h.decisionText.textContent = RV.decision;
      if (st === 3) changePulse(api, h.msg);
      if (st === 4) glow(api, h.concern, '111,220,154');
    },
    print: [
      { title: 'The mixed diff with its purpose and unresolved concerns', condition: 'mixed', state: 2, caption: 'What can you decide from a diff alone? You can see the edits. To judge them, connect the intended behavior, constraints and checks to the actual change.', note: 'The boundary table passes, but the message disagrees with Policy and cancellation evidence is missing. Required comments address the change and name the reason. An optional naming preference is labeled optional.' },
      { title: 'Changed: review the unrelated rename separately', condition: 'focused', state: 4, note: 'A focused change keeps the policy claim and its checks together. The message now follows Policy. Required authorization evidence shows that Ari can cancel B-001 and Bo is rejected; the ownership check remains.' },
      { title: 'The review decision survives the conversation', condition: 'focused', state: 5, principle: true, note: 'Restate the claim, identify missing evidence, record who decides, and preserve the rationale. A short paired investigation can establish missing context; asynchronous comments can do the same when their findings remain with the change.' },
      { title: 'Changed: the same diff is labeled as an assistant draft', condition: 'automated', state: 2, note: 'The description “fix stuff” omits the intended behavior and constraints. The reviewer still needs the same requirement, checks, and rationale. Authorship changes the label, not the review questions.' },
    ],
  };
  function reviewStates(kind) {
    const prompts = {
      mixed: { question: 'What can you decide from this diff alone?', options: ['Every requirement is satisfied', 'The author’s confidence settles it', 'You can see the edits; purpose and evidence are still needed'] },
      focused: { question: 'The rename now has its own change. What gets easier?', options: ['Nothing: a small diff is safe by itself', 'Following the policy claim and its checks', 'Skipping the checks of a short diff'] },
      automated: { question: 'An assistant drafted this diff as “fix stuff”. What changes for the reviewer?', options: ['Nothing: the requirement, checks and rationale are still needed', 'Less: the assistant checked its own change', 'Only the style needs a human'] },
    };
    return [
      { caption: kind === 'automated' ? 'The assistant draft says “fix stuff.” Its code still needs an intended behavior.' : kind === 'focused' ? 'The rename has its own change. The policy claim is easier to follow.' : 'A policy edit and an unrelated rename arrive together.', prompt: prompts[kind] },
      { caption: kind === 'automated' ? `Nothing changes for the reviewer. The claim is still **R-02 at ${CI.variant_max} minutes, temporarily**, and “${RV.ai_beat.description_shown}” states none of it.` : `The claim is **R-02 at ${CI.variant_max} minutes, temporarily**. Read why the variant exists and which behavior must stay the same.` },
      { caption: 'Classify the comments by their reason. Each one addresses the change, not the person. **Required correctness and security concerns** differ from an **optional preference**.' },
      { caption: 'The message is repaired and checked. The **R-03 authorization concern stays open** until its missing evidence arrives.' },
      { caption: '**Ari can cancel B-001; Bo is rejected.** The combined change retains ownership. The substantive disagreement now has evidence and a decision owner.' },
      { caption: 'Asynchronous review or a short paired investigation can resolve missing context. Keep the claim, checks, decision owner, and rationale with the change.', principle: true },
    ];
  }

  // 5. The same work meets a changed contract at different integration points.
  const integration = {
    id: 'integration-frequency', role: 'bridge', heading: 'When will the incompatible assumption become visible?',
    lead: 'The intended work is the same. Only the points at which you check it against shared work differ.',
    principle: 'Choose a collaboration strategy that exposes incompatible assumptions early enough to act on them.',
    principleShort: 'Meet changed assumptions while the work is small.',
    conditions: [
      { id: 'contract-changes', baseline: true, label: 'The shared message contract changes during the work', short: 'Contract changes', states: integrationStates(true) },
      { id: 'contract-stable', label: 'The shared message contract stays the same', short: 'Contract stays', states: integrationStates(false) },
    ],
    setup(stage, api) {
      const contractText = el('p', { class: 'w7-body' });
      const contract = cue(api, card([title('The contract both lines of work depend on'), contractText]), 'shared-contract');
      // Two lines of work leave shared work at A. One integrates along the way, one only at the end.
      const svg = window.VC.svg(1264, 372, { label: 'Two timelines meet the same shared work at different points', uid: api.uid });
      svg.classList.add('w7-tl'); cue(api, svg, 'timelines');
      const X = { A: 300, B: 520, C: 740, D: 960 }, Y = { small: 74, shared: 188, long: 302 };
      const g = (cls, kids, name) => { const n = s('g', { class: cls }, kids); svg.appendChild(n); if (name) cue(api, n, name); return n; };
      const now = g('w7-now', [s('rect', { x: -78, y: 30, width: 156, height: 302, rx: 12, style: 'fill:var(--accent-fill)' })], 'current-point');
      const evLabels = IF.events.map((ev) => {
        const lbl = text(X[ev.id], 360, ev.label, { class: 'w7-tl-evl' });
        g('', [s('line', { x1: X[ev.id], y1: 30, x2: X[ev.id], y2: 334, class: 'w7-tl-guide' }), text(X[ev.id], 22, ev.id, { class: 'w7-tl-ev' }), lbl], `event-${ev.id}`);
        return lbl;
      });
      g('', [s('line', { x1: 262, y1: Y.shared, x2: 1236, y2: Y.shared, class: 'w7-tl-shared' }), text(16, Y.shared + 7, 'Shared work', { class: 'w7-tl-name' })], 'shared-work');
      g('', [s('path', { d: `M${X.A},${Y.shared} Q${X.A},${Y.small} ${X.A + 64},${Y.small} H1180`, class: 'w7-tl-lane w7-tl-lane--small' }), text(16, Y.small - 2, 'Small integrations', { class: 'w7-tl-name' }), text(16, Y.small + 22, 'checks along the way', { class: 'w7-tl-sub' })], 'lane-small');
      g('', [s('path', { d: `M${X.A},${Y.shared} Q${X.A},${Y.long} ${X.A + 64},${Y.long} H${X.D}`, class: 'w7-tl-lane w7-tl-lane--long' }), text(16, Y.long - 2, 'Long-lived branch', { class: 'w7-tl-name' }), text(16, Y.long + 22, 'checks at the end', { class: 'w7-tl-sub' })], 'lane-long');
      g('', [s('circle', { cx: X.A, cy: Y.shared, r: 11, class: 'w7-tl-dot', style: 'fill:var(--accent)' })], 'common-start');
      // the changed or unchanged contract on shared work at B
      const contractMarkText = text(X.B, Y.shared + 6, '');
      // an opaque backing keeps the shared-work line from showing through the tinted label
      const contractMark = g('w7-tl-contract rv rv--scale', [s('rect', { x: X.B - 88, y: Y.shared - 18, width: 176, height: 36, rx: 9, style: 'fill:var(--bg);stroke:none' }), s('rect', { x: X.B - 88, y: Y.shared - 18, width: 176, height: 36, rx: 9 }), contractMarkText], 'contract-change');
      // where each line of work is combined with shared work
      const merge = (x, from, to, kind, name) => cue(api, arrow(svg, { from: { x, y: from }, to: { x, y: to }, kind, cls: 'rv rv--draw' }), name);
      const merges = { smallC: merge(X.C, Y.small + 12, Y.shared - 14, 'accent', 'integration-small-C'), smallD: merge(X.D, Y.small + 12, Y.shared - 14, 'accent', 'integration-small-D'), longD: merge(X.D, Y.long - 12, Y.shared + 14, 'violet', 'integration-long-D') };
      // work done on the old assumption before the mismatch became visible
      const rework = {
        small: g('rv', [s('rect', { x: X.B, y: Y.small - 11, width: X.C - X.B, height: 22, rx: 5, fill: `url(#${api.uid('hatch-bad')})`, class: 'w7-tl-rework' }), text((X.B + X.C) / 2, Y.small + 38, 'rework: B to C', { class: 'w7-tl-label is-bad', 'text-anchor': 'middle' })], 'rework-small'),
        long: g('rv', [s('rect', { x: X.B, y: Y.long - 11, width: X.D - X.B, height: 22, rx: 5, fill: `url(#${api.uid('hatch-bad')})`, class: 'w7-tl-rework' }), text((X.B + X.D) / 2, Y.long - 22, 'built on the old assumption: B to D', { class: 'w7-tl-label is-bad', 'text-anchor': 'middle' })], 'rework-long'),
      };
      const dot = (x, y, lx, ly, anchor, name) => {
        const c = s('circle', { cx: x, cy: y, r: 16, class: 'w7-tl-dot' }), m = text(x, y + 6, '', { class: 'w7-tl-mark' }), l = text(lx, ly, '', { class: 'w7-tl-label', 'text-anchor': anchor });
        const n = g('rv rv--scale', [c, m, l], name);
        n.set = (ok, label) => { c.setAttribute('class', `w7-tl-dot ${ok ? 'is-ok' : 'is-bad'}`); m.textContent = ok ? '✓' : '×'; l.textContent = label; l.setAttribute('class', `w7-tl-label ${ok ? 'is-ok' : 'is-bad'}`); };
        return n;
      };
      const dots = { smallC: dot(X.C, Y.small, X.C, Y.small - 26, 'middle', 'check-small-C'), smallD: dot(X.D, Y.small, X.D, Y.small - 26, 'middle', 'check-small-D'), longD: dot(X.D, Y.long, X.D + 24, Y.long - 18, 'start', 'check-long-D') };
      const flag = g('w7-tl-flag rv rv--scale', [s('line', { x1: X.A + 104, y1: Y.small - 4, x2: X.A + 104, y2: Y.small - 44 }), s('path', { d: `M${X.A + 104},${Y.small - 44} L${X.A + 140},${Y.small - 36} L${X.A + 104},${Y.small - 28} Z` }), text(X.A + 148, Y.small - 30, 'flag off', { class: 'w7-tl-label is-ok' })], 'feature-flag');
      const found = ['Small integrations', 'Long-lived branch'].map((name, k) => cue(api, rv(el('div', { class: 'w7-note' }, [el('b', {}, name), el('span', {})])), `discovery-${k ? 'long' : 'small'}`));
      const flagNote = cue(api, rv(el('div', { class: 'w7-note w7-note--warn' }, IF.unfinished)), 'unfinished-behavior');
      stage.append(el('div', { class: 'w7-stack', style: 'gap:12px' }, [contract, svg, el('div', { class: 'w7-found' }, found), flagNote]));
      return { X, contract, contractText, now, evLabels, contractMark, contractMarkText, merges, rework, dots, flag, found, flagNote };
    },
    render(h, v, api) {
      const changed = v.conditionId === 'contract-changes', st = v.state;
      h.contractText.textContent = changed && st >= 1 ? IF.contract_after : IF.contract_before;
      focus(h.contract, changed && st === 1);
      h.evLabels[1].textContent = changed ? IF.events[1].label : 'Contract stays the same';
      show(h.contractMark, st >= 1); h.contractMark.classList.toggle('is-change', changed);
      h.contractMarkText.textContent = changed ? 'Contract changes' : 'Contract stays';
      show(h.merges.smallC, st >= 2); show(h.merges.smallD, st >= 3); show(h.merges.longD, st >= 3);
      h.dots.smallC.set(!changed, changed ? 'Old assumption found at C' : 'Agrees at C'); show(h.dots.smallC, st >= 2);
      h.dots.smallD.set(true, 'Check passes at D'); show(h.dots.smallD, st >= 3);
      h.dots.longD.set(!changed, changed ? 'Old assumption found at D' : 'Agrees at D'); show(h.dots.longD, st >= 3);
      show(h.rework.small, changed && st >= 2); show(h.rework.long, changed && st >= 3);
      show(h.flag, st >= 4); show(h.flagNote, st >= 4);
      h.now.style.transform = `translateX(${h.X['ABCDD'[st]]}px)`;
      h.found.forEach((note, k) => { show(note, st >= (k ? 3 : 2)); note.lastChild.textContent = changed ? (k ? IF.long_discovery : IF.short_discovery) : 'The message assumption still matches the shared contract at this check.'; });
      if (st === 2) glow(api, h.dots.smallC, changed ? '255,139,123' : '111,220,154');
      if (st === 3) glow(api, h.dots.longD, changed ? '255,139,123' : '111,220,154');
      if (st === 1 && changed) glow(api, h.contractMark);
    },
    print: [
      { title: 'The contract changes before the message work is finished', condition: 'contract-changes', state: 3, principle: true, note: 'Both timelines begin with the same contract and make the same intended changes. The changed contract appears at B. Small integrations expose the old assumption at C; the long-lived branch finds it at D, after more work was built on it. The letters mark the order of events, not elapsed time.' },
      { title: 'Smaller integrations still need a safe unfinished path', condition: 'contract-changes', state: 4, note: 'A feature flag can keep unfinished behavior unavailable while changes are integrated. The flag states and the combined behavior still need useful checks. Choose the strategy that fits the team and the change.' },
      { title: 'Changed: the contract stays the same', condition: 'contract-stable', state: 3, note: 'With no changed assumption, both timelines agree at every check. Integration frequency decides when a mismatch becomes visible, not whether one exists.' },
    ],
  };
  function integrationStates(changed) {
    const prompt = changed
      ? { question: 'The shared contract changes at B. Which line of work learns about it sooner?', options: ['The long-lived branch: it has more commits to compare', 'Both at once: the contract changed for both', 'The small integrations: their next check meets the new contract'] }
      : { question: 'The contract stays the same. Will either line of work find a mismatch?', options: ['No: there is no changed assumption to find', 'Yes: a long-lived branch always finds one at the end', 'Yes: frequent integrations create their own mismatches'] };
    return [
      { caption: 'Compare the points where each line of work meets shared work.', prompt },
      { caption: changed ? 'At **B**, the message contract changes: read the approved limit from Policy.' : 'At **B**, the contract remains the same; no new mismatch has been introduced.' },
      { caption: changed ? 'At **C**, the next small integration checks the message against the new contract. The old assumption is visible now.' : 'At **C**, the small integration still agrees with the unchanged contract.' },
      { caption: changed ? 'At **D**, the long-lived branch finally meets the same changed assumption. More work was built before that feedback arrived.' : 'At **D**, the later integration also agrees. Integration frequency affects when you discover a mismatch, not whether a mismatch exists.' },
      { caption: 'Keep unfinished behavior unavailable while integrating. A **feature flag** separates integration from making a feature available.', principle: true },
    ];
  }

  // 6. Source held fixed; dependency resolution or configuration changes one input.
  const reproducibility = {
    id: 'same-code-different-result', role: 'bridge', heading: 'The source is the same. Why did the answer change?',
    lead: 'Hold the source revision and request fixed. Inspect the inputs the run actually used.',
    principle: 'Reproducibility requires control of the relevant inputs, not just possession of the source files.',
    principleShort: 'Keep the inputs that explain the result.',
    conditions: [
      { id: 'dependency', baseline: true, label: 'Only the resolved dependency changes', short: 'Dependency drifts', states: reproductionStates('dependency') },
      { id: 'configuration', label: 'Only the configured upper limit changes', short: 'Config drifts', states: reproductionStates('configuration') },
    ],
    setup(stage, api) {
      const machines = ['Declared run', 'Second machine'].map((label, k) => {
        const values = RP.manifest_rows.map((name, i) => cue(api, el('tr', {}, [el('th', { scope: 'row' }, name), el('td', { class: 'w7-mono' })]), `machine-${k + 1}-input-${i + 1}`));
        const table = el('table', { class: 'w7-table', 'aria-label': `${label}: relevant run inputs` }, el('tbody', {}, values));
        const manifest = card([title(label), table, el('p', { class: 'w7-small', style: 'margin-top:8px' }, ['Allowed constraint: ', el('span', { class: 'w7-mono' }, `${RP.dependency} ${RP.constraint}`)])], 'w7-manifest');
        const src = code(api, RP.baseline_code, `dependency-${k + 1}`, true);
        const implementation = rv(card([title('Dependency’s range decision'), src]));
        const result = cue(api, rv(status(`${RP.request_minutes} minutes → Accepted`, 'ok')), `machine-${k + 1}-result`);
        return { values, manifest, src, implementation, result, root: el('div', { class: 'w7-stack', style: 'gap:12px' }, [manifest, implementation, result]) };
      });
      const lock = cue(api, rv(el('div', { class: 'w7-note' })), 'record-inputs');
      stage.append(el('div', { class: 'w7-stack', style: 'gap:12px' }, [el('div', { class: 'w7-grid w7-two' }, machines.map((x) => x.root)), lock, cue(api, el('p', { class: 'w7-small' }, `${RP.note} ${RP.secret_ref}; store the reference with configuration, and keep the secret value outside the repository.`), 'model-and-secrets')]));
      return { machines, lock };
    },
    render(h, v, api) {
      const dep = v.conditionId === 'dependency', st = v.state, drift = st >= 1 && st < 4;
      h.machines.forEach((machine, k) => {
        const changed = k === 1 && drift;
        const version = changed && dep ? RP.changed_resolved : RP.resolved;
        const max = changed && !dep ? RP.changed_config : RP.config;
        const vals = [RP.source, `${RP.dependency} ${version}`, RP.runtime, `${RP.config_key} = ${max}`, RP.data_fixture, RP.artifact];
        machine.values.forEach((row, i) => { row.children[1].textContent = vals[i]; row.classList.toggle('is-focus', changed && i === (dep ? 1 : 3)); });
        machine.src.setCode(changed && dep ? RP.changed_code : RP.baseline_code);
        machine.src.focusLines(st >= 2 ? [2] : []);
        show(machine.implementation, st >= 2); show(machine.result, st >= 3);
        const expected = RP.snippets[changed && dep ? 1 : 0].cases[changed && !dep ? 1 : 0].expected;
        machine.result.set(`${RP.request_minutes} minutes → ${verdict(expected)}`, expected ? 'ok' : 'bad');
      });
      show(h.lock, st >= 4);
      h.lock.textContent = dep ? `Restore the resolved ${RP.dependency} ${RP.resolved} dependency. A lockfile records the selected versions; a constraint such as ${RP.constraint} allows more than one selection.` : `Restore ${RP.config_key} = ${RP.config}. The source stayed at ${RP.source}; the changed configured limit caused the different answer.`;
      if (st === 1) glow(api, h.machines[1].values[dep ? 1 : 3]);
      if (st === 4) glow(api, h.machines[1].result, '111,220,154');
    },
    print: [
      { title: 'Same source; the resolved dependency differs', condition: 'dependency', state: 3, note: 'The second machine selects teaching-range 1.1, which uses an exclusive upper boundary. A 120-minute request changes from accepted to rejected while source, configuration, runtime and data stay fixed. The dependency is invented for this comparison.' },
      { title: 'Changed: the configured maximum differs', condition: 'configuration', state: 3, note: 'Both machines use teaching-range 1.0. Only MAX_MINUTES changes from 120 to 90, so the same 120-minute request is rejected. Change one relevant input at a time to explain the result.' },
      { title: 'Restore the declared inputs and repeat the teaching result', condition: 'dependency', state: 5, principle: true, note: 'The resolved dependency set, runtime, configuration, data fixture and build record travel with the source revision. package-lock.json and uv.lock are examples of lockfiles. Keep secret values in a secret store; a placeholder reference belongs in the configuration record.' },
    ],
  };
  function reproductionStates(kind) {
    return [
      { caption: `Both runs start from **${RP.source}** with the same request.`, prompt: kind === 'dependency'
        ? { question: 'The second machine gives a different answer. Which inputs could explain it?', options: ['Only the source revision: the same code gives the same answer', 'Resolved dependencies, runtime, configuration, or data', 'Nothing: the same request must give the same answer'] }
        : { question: `Only ${RP.config_key} differs. What happens to the ${RP.request_minutes}-minute request?`, options: [`Rejected: that run reads a maximum of ${RP.changed_config}`, 'Accepted: the source and dependency are unchanged', 'Accepted: configuration is not part of a run'] } },
      { caption: kind === 'dependency' ? `Only **${RP.dependency}** changes: resolved **${RP.resolved} to ${RP.changed_resolved}**. The version constraint permits both.` : `Only **${RP.config_key}** changes: **${RP.config} to ${RP.changed_config}**. The source and dependency stay fixed.` },
      { caption: kind === 'dependency' ? 'Read the dependency’s comparison: the changed version excludes the upper endpoint.' : 'The same inclusive comparison reads a different configured maximum.' },
      { caption: `The same **${RP.request_minutes}-minute** request now gets a different answer on the second machine.` },
      { caption: 'Restore the declared input. Repeat the request: both teaching runs agree again.' },
      { caption: 'Record resolved inputs, not only allowed version ranges. Reproducibility and dependency trust are separate questions.', principle: true },
    ];
  }

  // 7. The reason should survive after the author leaves.
  const history = {
    id: 'history-as-explanation', role: 'bridge', heading: 'Will “fix stuff” help you understand this change later?',
    lead: 'The diff shows what changed. A useful record explains the problem, the intended behavior, and the constraint.',
    principle: 'Documentation earns its place by preserving information that cannot be reliably reconstructed from the code.',
    principleShort: 'Keep the reason that the code cannot tell.',
    conditions: [
      { id: 'author-present', baseline: true, label: 'The original author can still answer questions', short: 'Author available', states: historyStates(false) },
      { id: 'author-away', label: HX.author_unavailable, short: 'Author unavailable', states: historyStates(true) },
    ],
    setup(stage, api) {
      const availability = cue(api, status('The original author can answer questions.'), 'author-availability');
      // What each record points to: the weak one is linked to nothing a maintainer can follow.
      const link = (kind, value, name) => cue(api, el('span', { class: 'w7-link' }, [el('small', {}, kind), el('span', {}, value)]), name);
      const arrowTo = () => el('span', { class: 'w7-link-arrow', 'aria-hidden': 'true' }, '→');
      const weak = cue(api, card([title('A weak change description'), el('p', { class: 'w7-big w7-mono' }, HX.weak),
        el('div', { class: 'w7-links', style: 'margin:12px 0 0' }, [el('span', { class: 'w7-link w7-link--none' }, [el('small', {}, 'Linked to'), el('span', {}, 'nothing')])]),
        el('p', { class: 'w7-small', style: 'margin-top:12px' }, 'Which problem? Which expected behavior? Which constraint?')]), 'weak-description');
      const recordRows = [['Observed problem', HX.problem], ['Intended behavior', HX.intended], ['Constraint', HX.constraint], ['Alternative and reason', HX.alternative], ['Checks', HX.checks]].map(([k, val], i) => cue(api, rv(el('div', { class: 'w7-record-row' }, [el('b', {}, k), el('p', {}, val)])), `record-${i + 1}`));
      const links = el('div', { class: 'w7-links' }, [link('Change', HX.change_id, 'link-change'), arrowTo(), link('Decision', HX.decision_id, 'link-decision'), arrowTo(), link('Requirements', 'R-02 · R-03', 'link-requirements')]);
      const record = cue(api, card([title(`${HX.decision_id} · decision record`), links, el('p', { class: 'w7-body', style: 'font-weight:650;margin-bottom:10px' }, HX.title), el('div', { style: 'display:flex;flex-direction:column;gap:9px' }, recordRows)]), 'durable-record');
      record.style.alignSelf = 'start';
      const result = cue(api, rv(el('div', { class: 'w7-note' })), 'future-maintainer');
      stage.append(el('div', { class: 'w7-stack' }, [availability, el('div', { class: 'w7-grid', style: 'grid-template-columns:360px minmax(0,1fr);gap:18px;flex:1' }, [el('div', { class: 'w7-stack' }, [weak, result]), record])]));
      return { availability, weak, recordRows, links, result };
    },
    render(h, v, api) {
      const away = v.conditionId === 'author-away', st = v.state;
      h.availability.set(away ? HX.author_unavailable : 'The original author can answer questions.', away ? 'warn' : 'ok');
      h.recordRows.forEach((row, i) => { show(row, st >= i + 1); focus(row, st === i + 1); });
      show(h.result, st >= 5);
      h.result.textContent = away ? 'The record still explains the choice. You can ask whether the original constraint still applies without needing the author.' : 'A conversation supplies context now. Keeping its useful conclusion supplies that context to the next maintainer.';
      if (st > 0 && st <= h.recordRows.length) glow(api, h.recordRows[st - 1]);
      if (st === h.recordRows.length) glow(api, h.links, '124,196,255');
    },
    print: [
      { title: 'The useful record states the problem, behavior, constraint, and checks', condition: 'author-present', state: 5, principle: true, note: 'The title and DR-07 link the change to its reason. Preserve the conclusion and rejected alternative that help a later decision; a transcript of every conversation is unnecessary.' },
      { title: 'Changed: the author is no longer available', condition: 'author-away', state: 5, note: 'The same durable record explains why the message follows Policy and why cancellation ownership remains unchanged. A future maintainer can reconsider the constraint rather than guessing from “fix stuff.”' },
    ],
  };
  function historyStates(away) {
    return [
      { caption: away ? 'The original author is unavailable. The two records are all you have.' : 'The original author can explain this in a conversation today.', prompt: away
        ? { question: 'The author is unavailable. Where can you still find why the message follows Policy?', options: ['In the diff of messages.py', 'In the description “fix stuff”', `In ${HX.decision_id}: its problem, constraint and rejected alternative`] }
        : { question: 'What will a future maintainer learn from “fix stuff”?', options: ['The reason for the decision', 'Very little about the problem, contract, or constraint', 'Which alternative was rejected'] } },
      { caption: 'Name the observed problem: the policy and message describe different limits.' },
      { caption: 'State the intended behavior: both use the same approved policy.' },
      { caption: 'Keep the constraint: preserve ownership and restore the temporary limit afterward.' },
      { caption: 'Explain why the obvious alternative was rejected: another copied constant can drift again.' },
      { caption: 'Link the relevant checks. A maintainer can now trace the purpose and reconsider whether its constraints still apply.', principle: true },
    ];
  }

  // A readable continuation of scene 7: operate a separate diagnostic history.
  // The linear diagnostic history, its suspect range and each change's observed result after `st` checks.
  // The live page and the reading copy draw the same picture.
  function bisectDiagram(api, uid) {
    const B = HX.bisect;
    const svg = window.VC.svg(1760, 196, { label: 'A linear eight-commit diagnostic history with good and bad endpoints', uid });
    svg.style.height = '214px';
    // The suspect range: every change that could still be the first bad one. Each check halves it.
    const rangeRect = s('rect', { y: 4, height: 186, rx: 18 }), rangeText = text(0, 0, '');
    const range = s('g', { class: 'w7-range' }, [rangeRect, rangeText]);
    svg.appendChild(range); cue(api, range, 'suspect-range');
    const xOf = (i) => 100 + i * 216;
    const nodes = B.commits.map((commit, i) => {
      const x = xOf(i);
      if (i > 0) arrow(svg, { from: { x: x - 184, y: 55 }, to: { x: x - 36, y: 55 }, kind: 'accent' });
      const g = s('g', { class: 'w7-bisect-node', transform: `translate(${x} 55)` }, [s('circle', { r: 33 }), text(0, 7, commit.id), text(0, 70, '', { class: 'w7-bisect-label' })]);
      cue(api, g, `commit-${commit.id}`); svg.appendChild(g); return g;
    });
    const candidatesAt = (st) => (st ? B.probes[st - 1].remaining : B.commits.slice(1).map((c) => c.id));
    const rangeOf = (st) => {   // at least wide enough for its own label
      const idx = candidatesAt(st).map((id) => B.commits.findIndex((c) => c.id === id)), a = xOf(Math.min(...idx)) - 84, b = xOf(Math.max(...idx)) + 84, pad = Math.max(0, (240 - (b - a)) / 2);
      return [a - pad, b + pad];
    };
    const setRange = ([a, b]) => { rangeRect.setAttribute('x', a); rangeRect.setAttribute('width', b - a); rangeText.setAttribute('x', (a + b) / 2); rangeText.setAttribute('y', 179); };
    const paint = (st) => {
      const observed = Object.fromEntries([[B.known_good, 'Good'], [B.known_bad, 'Bad'], ...B.probes.slice(0, st).map((p) => [p.id, p.result])]);
      const candidates = candidatesAt(st);
      nodes.forEach((node, i) => { const id = B.commits[i].id; node.classList.toggle('is-good', observed[id] === 'Good'); node.classList.toggle('is-bad', observed[id] === 'Bad'); node.classList.toggle('is-out', !candidates.includes(id)); node.classList.toggle('is-probe', st > 0 && id === B.probes[st - 1].id); node.lastChild.textContent = observed[id] || 'Not tested'; });
      rangeText.textContent = `Suspect range: ${candidates.length} ${candidates.length === 1 ? 'change' : 'changes'}`;
    };
    return { svg, nodes, range, rangeOf, setRange, paint };
  }
  const bisect = {
    kind: 'page', id: 'locate-the-change', heading: 'Which change first broke the boundary?',
    lead: 'Test a midpoint, keep the part containing the failure, and repeat. This use of history is called bisection.', printRole: 'History as a debugging tool',
    build(body, api) {
      const B = HX.bisect;
      const { svg, nodes, range, rangeOf, setRange, paint } = bisectDiagram(api, (x) => `bisect-${x}`);
      const logRows = B.probes.map((probe, i) => cue(api, rv(el('div', { class: 'w7-probe' }, [el('b', { class: 'w7-mono' }, probe.id), el('b', { class: probe.result === 'Good' ? 'w7-ok' : 'w7-bad' }, probe.result), el('span', {}, `Remaining candidates: ${probe.remaining.join(', ')}`)])), `probe-result-${i + 1}`));
      const buttons = B.probes.map((probe, i) => cue(api, el('button', { type: 'button', class: 'preset-btn w7-action' }, `Check ${probe.id}`), `check-${probe.id}`));
      const reset = cue(api, el('button', { type: 'button', class: 'preset-btn w7-action' }, 'Reset the search'), 'reset-search');
      const finding = cue(api, rv(el('div', { class: 'w7-note' }, B.finding)), 'finding');
      body.append(el('div', { class: 'w7-stack' }, [
        el('div', { class: 'w7-grid', style: 'grid-template-columns:minmax(0,1fr) 500px' }, [card([title('The repeatable check'), el('p', { class: 'w7-body' }, B.predicate)]), card([title('What Good and Bad mean'), el('p', { class: 'w7-body' }, `Good: ${CI.variant_max + 1} is rejected. Bad: ${CI.variant_max + 1} is accepted.`)])]),
        svg, el('div', { style: 'display:flex;gap:12px' }, [...buttons, reset]), el('div', { class: 'w7-probe-log' }, logRows), finding, el('p', { class: 'w7-small' }, `${B.note} ${B.assumption}`),
      ]));
      // The range slides from its previous extent to the new one; its label already states the new size.
      const placeRange = (st, instant) => {
        const to = rangeOf(st), from = range.geo || to;
        range.geo = to;
        if (instant || !api.motion || (from[0] === to[0] && from[1] === to[1])) { setRange(to); return; }
        let t0 = null;
        const frame = (t) => { if (t0 == null) t0 = t; const p = Math.min(1, (t - t0) / 600), e = 1 - (1 - p) ** 3; setRange([from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e]); if (p < 1) api.raf(frame); };
        setRange(from); api.raf(frame);
      };
      const render = (st, instant) => {
        body.dataset.state = String(st);
        paint(st); placeRange(st, instant);
        logRows.forEach((row, i) => show(row, st > i)); buttons.forEach((button, i) => { button.disabled = st !== i; }); show(finding, st === B.probes.length);
        if (st) glow(api, nodes[B.commits.findIndex((c) => c.id === B.probes[st - 1].id)]);
      };
      buttons.forEach((button, i) => button.addEventListener('click', () => render(i + 1))); reset.addEventListener('click', () => render(0));
      body.reset = () => render(0, true); body.reset();
    },
    onEnter(body) { body.reset(); },
    print(body) {
      const B = HX.bisect, final = bisectDiagram(printApi, (x) => `print-bisect-${x}`);
      final.paint(B.probes.length); final.setRange(final.rangeOf(B.probes.length));
      final.svg.style.cssText = 'height:auto;width:100%;margin:10px 0 4px';
      body.append(el('p', {}, `${B.note} ${B.predicate}`), el('p', {}, `Good means ${CI.variant_max + 1} minutes is rejected; Bad means it is accepted. Known endpoints: ${B.known_good} is Good; ${B.known_bad} is Bad.`),
        el('h3', {}, 'Follow the repeated decisions'), list(B.probes.map((probe) => `${probe.id}: ${probe.result}. Remaining candidates: ${probe.remaining.join(', ')}.`)),
        el('h3', {}, `After ${B.probes.length} checks, one change remains`), final.svg, el('div', { class: 'print-note' }, B.finding), el('p', { style: 'margin-top:12px' }, B.assumption));
    },
  };

  // 8. Readiness requires each actual concern to be answered. Restore the canonical rule.
  const ready = {
    id: 'ready-to-integrate', role: 'bridge', heading: 'Which missing evidence blocks this change?',
    lead: 'Passing checks, human approval, and combined behavior answer different questions.',
    principle: 'Integration readiness is a justified judgment about the change and its context, not a single green indicator.',
    principleShort: 'Resolve the concern behind each indicator.',
    conditions: [
      { id: 'missing-auth', baseline: true, label: 'Checks pass; an authorization question remains', short: 'Concern open', states: readyStates(false) },
      { id: 'failing-integration', label: 'Review is approved; the integration check fails', short: 'Integration fails', states: readyStates(true) },
    ],
    setup(stage, api) {
      const rows = RD.rows.map((r, i) => cue(api, el('div', { class: 'w7-ready-row' }, [el('b', {}, r.name), el('p', {}, r.detail), el('span', { class: 'w7-ready-tag' })]), `evidence-${i + 1}`));
      const decision = cue(api, status(RD.statuses[0]), 'readiness');
      const restoreText = el('p', { class: 'w7-body' });
      const restored = cue(api, rv(card([title('Later weeks use the canonical baseline'), restoreText])), 'restored-policy');
      stage.append(el('div', { class: 'w7-stack', style: 'gap:10px' }, [el('div', { class: 'w7-stack', style: 'gap:7px;height:auto' }, rows), decision, restored]));
      return { rows, decision, restored, restoreText };
    },
    render(h, v, api) {
      const failing = v.conditionId === 'failing-integration', st = v.state;
      h.rows.forEach((row, i) => {
        const key = RD.rows[i].key;
        let label = 'Satisfied', kind = 'ok', detail = RD.rows[i].detail;
        if (st < 2 && key === (failing ? 'integration' : 'ownership')) { label = failing ? 'Failing' : 'Unanswered'; kind = failing ? 'bad' : 'warn'; detail = failing ? 'The combined-change check fails. Approval cannot repair its behavior.' : 'The cancellation question has no owner/non-owner result yet.'; }
        if (!failing && st < 2 && key === 'review') { label = 'Concern open'; kind = 'warn'; detail = 'The R-03 authorization concern remains open until its evidence is reviewed.'; }
        if (failing && key === 'review') label = 'Approved';
        if (st >= 4 && key === 'intent') detail = `R-02 restored: ${RD.canonical.min} to ${RD.canonical.max} minutes, inclusive.`;
        if (st >= 4 && key === 'boundary') detail = RD.canonical.checks.slice(0, 2).join('; ') + '.';
        if (st >= 4 && key === 'message') detail = RD.canonical.message + '.';
        row.className = `w7-ready-row is-${kind}`; row.children[1].textContent = detail; row.children[2].textContent = label;
      });
      h.decision.set(st >= 4 ? RD.statuses[3] : st >= 3 ? RD.statuses[2] : st >= 2 ? RD.statuses[1] : RD.statuses[0], st >= 2 ? 'ok' : 'warn');
      show(h.restored, st >= 4);
      h.restoreText.textContent = `R-02: ${RD.canonical.min} to ${RD.canonical.max} minutes, inclusive. ${RD.canonical.checks.slice(0, 3).join('; ')}. R-03 ownership is unchanged.`;
      if (st === 2) glow(api, h.rows[failing ? 5 : 3], '111,220,154');
      if (st === 4) glow(api, h.restored, '111,220,154');
    },
    print: [
      { title: 'Passing checks leave a substantive authorization concern unanswered', condition: 'missing-auth', state: 1, note: 'The boundary and message checks pass. The change still needs evidence for the open R-03 concern. The relevant cancellation check addresses that question.' },
      { title: 'Changed: approval accompanies a failing integration check', condition: 'failing-integration', state: 1, note: 'Review approval describes the human judgment at that point. Repair the combined behavior and rerun the affected check before integrating.' },
      { title: 'Resolve concerns, then restore the canonical policy', condition: 'missing-auth', state: 5, principle: true, note: 'The temporary comparison is over. R-02 again accepts 30 to 120 minutes inclusive. The boundary checks accept 120 and reject 121; the message says 120. R-03 ownership remains unchanged. Week 8 examines how useful checks are chosen.' },
    ],
  };
  function readyStates(failing) {
    return [
      { caption: failing ? 'The review is approved, but the combined-change check fails.' : 'The listed checks pass, but one authorization question has no evidence.', prompt: failing
        ? { question: 'The review is approved. What needs to happen before this change is ready?', options: ['Count the green indicators', 'Let the approval settle the failing check', 'Repair the integration failure and rerun its check'] }
        : { question: 'The checks pass. What needs to happen before this change is ready?', options: ['Check the unresolved authorization behavior', 'Count the green indicators', 'Let one approval settle every question'] } },
      { caption: failing ? 'Approval and a failing integration check describe different things. The failing behavior still needs repair.' : 'The open question is specific: can Bo cancel Ari’s booking after this change?' },
      { caption: failing ? 'Repair the combined behavior and rerun the affected integration check. It now passes.' : 'Run the relevant check: Ari can cancel B-001; Bo is rejected under R-03. The concern is resolved.' },
      { caption: 'The intent, review decision, and relevant checks now support integrating this change.' },
      { caption: `The trial ends. Restore **${C.duration_minutes.min} to ${C.duration_minutes.max} minutes**, inclusive, and rerun the affected boundary and message checks.` },
      { caption: `**Canonical baseline restored.** ${C.duration_minutes.max} accepted; ${RD.canonical.max + 1} rejected; the message agrees; ownership stays the same.`, principle: true },
    ];
  }

  const SCENES = [commitGraph, conflict, cleanMerge, review, integration, reproducibility, history, ready];
  const CHECKS = [   // plan Section 8, questions 1 to 5, and the answered transfer question (fixtures transfer_checks.w07)
    { q: 'What distinguishes a branch label from a commit?', a: 'A branch label points to a commit and can move; the recorded commit represents a particular snapshot and ancestry.' },
    { q: 'Can two changes merge cleanly and still conflict?', a: 'Yes. Their behavior or assumptions can contradict even when the edited text does not overlap.' },
    { q: 'What context should accompany a policy change?', a: 'The intended requirement, affected behavior, relevant design constraints, and checks demonstrating the change.' },
    { q: 'Why record dependency inputs?', a: 'The same source can run differently when its resolved dependencies or configuration differ.' },
    { q: 'What should resolve a substantive review disagreement?', a: 'A clear claim, the evidence needed to decide it and an accountable decision; durable rationale should survive the discussion.' },
    { q: TRANSFER.question, a: TRANSFER.answer },
  ];
  const principles = {
    kind: 'page', id: 'principles', heading: 'Eight principles, six checks',
    lead: 'Decide your answer, then open each check. The final question applies the same reasoning outside room booking.', printRole: 'Principles and checks',
    build(body, api) {
      const attrs = (sc) => api.record ? { class: 'principle-card', role: 'link', tabindex: '0', onclick: () => { location.hash = `#/${sc.id}`; }, onkeydown: (e) => { if (e.key === 'Enter') location.hash = `#/${sc.id}`; }, style: 'text-decoration:none;color:inherit;padding:10px 16px;cursor:pointer' }
        : { class: 'principle-card', href: `#/${sc.id}`, style: 'text-decoration:none;color:inherit;padding:10px 16px' };
      const cards = el('div', { class: 'principle-grid', style: 'gap:10px' }, SCENES.map((sc, i) => cue(api, el('a', attrs(sc), [el('span', { class: 'pc-num' }, `${i + 1} · ${sc.role}`), el('span', { class: 'pc-text', style: 'font-size:18px' }, sc.principle), el('span', { class: 'pc-short', style: 'font-size:16px' }, sc.principleShort)]), `principle-${i + 1}`)));
      const qa = el('ol', { class: 'qa-list', style: 'margin-top:8px;grid-template-columns:1fr 1fr 1fr;max-width:1600px' }, CHECKS.map((item, i) => {
        const answer = el('p', { class: 'qa-a', id: `w7-answer-${i + 1}`, hidden: '', style: 'font-size:16px;line-height:1.28' }, item.a);
        const button = cue(api, el('button', { type: 'button', class: 'qa-q', 'aria-expanded': 'false', 'aria-controls': answer.id, style: 'font-size:18px' }, [el('span', {}, `${i + 1}. ${item.q}`), el('span', { class: 'tw', 'aria-hidden': 'true' }, '+')]), `question-${i + 1}`);
        button.addEventListener('click', () => { const open = button.getAttribute('aria-expanded') === 'true'; button.setAttribute('aria-expanded', String(!open)); answer.hidden = open; });
        return el('li', { class: 'qa-item', style: 'padding:5px 12px' }, [button, answer]);
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
    ['Commit', 'A recorded snapshot with its parent relationships.'],
    ['Branch reference', 'A name pointing to a commit; it can move as work advances.'],
    ['Working tree', 'The saved files you are editing on your machine.'],
    ['Staging area', 'The selected content prepared for the next Git commit.'],
    ['Remote-tracking reference', 'Your local record of an observed remote branch position.'],
    ['Diff', 'A view of removed and added content between two versions.'],
    ['Merge commit', 'A commit with more than one parent, connecting histories.'],
    ['Fast-forward', 'Moving a reference to a descendant already in the history.'],
    ['Textual conflict', 'Edits the merge operation cannot reconcile automatically.'],
    ['Semantic conflict', 'Combined behavior or assumptions that contradict each other.'],
    ['Review packet', 'Purpose, diff, constraints, checks, and rationale for a change.'],
    ['Version constraint', 'A rule describing which dependency versions are allowed.'],
    ['Lockfile', 'A record of the selected dependency versions and resolution details.'],
    ['Feature flag', 'A switch controlling whether a behavior is available.'],
    ['Bisection', 'Narrowing a suspect history by testing a midpoint repeatedly.'],
    ['Decision record', 'The decision, context, alternatives, and reasons worth preserving.'],
  ];
  const SOURCES = [
    ['S01', 'IEEE Computer Society · SWEBOK', 'https://www.computer.org/education/bodies-of-knowledge/software-engineering'],
    ['S02', 'ACM / IEEE-CS / AAAI · CS2023 final report', 'https://csed.acm.org/final-report/'],
    ['S06', 'Pro Git · Basic Branching and Merging', 'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging'],
    ['S07', 'Google Engineering Practices · Code Review', 'https://google.github.io/eng-practices/review/reviewer/looking-for.html'],
    ['S61', 'Git · Bisection', 'https://git-scm.com/docs/git-bisect'],
    ['S62', 'npm · package-lock.json', 'https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/'],
    ['S63', 'Astral uv · The lockfile', 'https://docs.astral.sh/uv/concepts/projects/layout/#the-lockfile'],
  ];
  const PRACTICE = 'Git records history. GitHub and GitLab host pull or merge requests for review. package-lock.json and uv.lock record resolved dependencies. Ruff, ESLint, and Prettier handle routine linting or formatting before human review.';
  const CARRIED = ['The review packet: a clear claim, relevant checks, resolved concerns, and durable rationale.', 'The canonical R-02 range and R-03 ownership rule, restored after the temporary comparison.', 'A question about the quality of the checks, ready for Week 8.'];
  const sources = {
    kind: 'page', id: 'sources', heading: 'The change has a reason. How good are its checks?',
    lead: 'Week 8 challenges the evidence that travels with a change.', printRole: 'Handoff, terminology, sources',
    build(body, api) {
      const left = el('div', { class: 'w7-stack' }, [
        cue(api, el('div', { class: 'handoff', style: 'font-size:25px;padding:16px 20px' }, [el('span', { class: 'muted', style: 'font-size:17px;display:block;margin-bottom:8px' }, 'Week 8 starts from this question:'), RD.handoff]), 'handoff'),
        cue(api, card([title('What carries forward'), list(CARRIED, { class: 'w7-small', style: 'display:flex;flex-direction:column;gap:8px' })]), 'carried-forward'),
        cue(api, card([title('In practice · examples from 2026'), el('p', { class: 'w7-small' }, PRACTICE)]), 'in-practice'),
      ]);
      const middle = cue(api, card([title('Terms used this week'), el('dl', { class: 'term-list', style: 'display:block;column-count:2;column-gap:18px;font-size:14.5px;line-height:1.24' }, TERMS.map(([term, meaning]) => el('div', { style: 'break-inside:avoid;margin-bottom:7px' }, [el('dt', {}, term), el('dd', {}, meaning)])))]), 'terms');
      middle.style.alignSelf = 'start';
      const right = cue(api, card([title('Sources for this lecture'), el('ul', { class: 'source-list', style: 'font-size:15px;gap:9px' }, SOURCES.map(([key, name, url]) => el('li', {}, [el('span', { class: 'key' }, key), el('span', {}, [name, ' ', el(api.record ? 'span' : 'a', api.record ? { class: 'url', style: 'font-size:12.5px' } : { class: 'url', href: url, style: 'font-size:12.5px' }, url)])])))]), 'sources');
      right.style.alignSelf = 'start';
      body.append(el('div', { class: 'w7-grid', style: 'grid-template-columns:520px minmax(0,1fr) 460px;gap:22px;height:100%' }, [left, middle, right]));
    },
    print(body) { body.append(el('div', { class: 'print-columns' }, [
      el('div', {}, [el('h3', {}, 'Week 8 starts here'), el('p', { class: 'handoff', style: 'font-size:20px' }, RD.handoff), el('h3', {}, 'What carries forward'), list(CARRIED), el('h3', {}, 'In practice · examples from 2026'), el('p', {}, PRACTICE), el('h3', {}, 'Sources'), el('ul', { class: 'source-list', style: 'font-size:12px;gap:5px' }, SOURCES.map(([key, name, url]) => el('li', {}, [el('span', { class: 'key' }, key), el('span', {}, [name, ' ', el('span', { class: 'url', style: 'font-size:10.5px' }, url)])])))]),
      el('div', {}, [el('h3', {}, 'Terms used this week'), el('dl', { class: 'term-list', style: 'display:block;column-count:2;column-gap:16px' }, TERMS.map(([term, meaning]) => el('div', { style: 'break-inside:avoid;margin-bottom:7px' }, [el('dt', {}, term), el('dd', {}, meaning)])))]),
    ])); },
  };
  window.lecture.deck({
    week: 7, file: FILE, title: 'Collaboration, version history, and reviewable change', question: WEEK_Q,
    coverLead: 'Student notes for lecture 7. Follow a change from saved files to shared history, read a commit graph, reconcile conflicting intentions, inspect a clean merge with contradictory behavior, build a useful review packet, compare integration points, reproduce a result from its inputs, and preserve the reason for a decision. A separate history shows how bisection locates a regression.',
    coverNote: 'Campus Rooms and the dependency teaching-range are fictional teaching examples. The 90-minute policy is temporary; the canonical 30-to-120-minute inclusive range returns at the end. Code is Python-like pseudocode.',
    pages: [opening, outcomes, locations, { kind: 'scene', scene: commitGraph }, { kind: 'scene', scene: conflict }, { kind: 'scene', scene: cleanMerge },
      { kind: 'scene', scene: review }, { kind: 'scene', scene: integration }, { kind: 'scene', scene: reproducibility }, { kind: 'scene', scene: history }, bisect,
      { kind: 'scene', scene: ready }, principles, sources],
  });
})();
