/* =====================================================================
   Week 05 · Modularity, interfaces, and the cost of change
   Central question: When one requirement changes, which parts should need to change?

   Phase 0 carries one shell-test scene, dependency-example (a graph with
   must-edit, recheck and unaffected markers under two designs). The other
   seven scenes are authored in Phase 1 on the same shell.
   ===================================================================== */
(function () {
  'use strict';
  const F = window.CAMPUS_ROOMS_FIXTURES;
  const D = F.anchors['w05/dependency-example'];
  const { el, s, text, node, arrow, badge, chip, table, legend } = window.VC;
  const FILE = 'week-05.html';
  const FROM = D.change.from_minutes, TO = D.change.to_minutes;

  const opening = {
    kind: 'page', id: 'opening', role: 'page',
    heading: 'When one requirement changes, which parts should need to change?',
    lead: 'Week 5 follows a single rule change through two designs of the same booking service.',
    printRole: 'Opening',
    build(body) {
      body.appendChild(el('div', { class: 'card', style: 'max-width:1100px' }, [
        el('div', { class: 'card-title' }, 'This deck is in preparation'),
        el('p', { style: 'font-size:24px;line-height:1.4' }, `Phase 0 of the course build carries one scene of this week, the dependency example, to show that the shared shell handles graphs with must-edit, recheck and unaffected markers under two designs. The remaining seven scenes are authored in Phase 1. Open the scene with the Next button or through ${FILE}#/dependency-example.`),
      ]));
    },
    print(body) { body.appendChild(el('p', {}, 'Phase 0 shell-test deck: only the dependency example is present. The full Week 5 deck follows in Phase 1.')); },
  };

  const dependencyExample = {
    id: 'dependency-example', role: 'anchor',
    heading: 'Watch a single policy change spread',
    lead: `The maximum booking duration drops from ${FROM} to ${TO} minutes (rule R-02, a temporary variant). Which components must change, which must be rechecked, and which stay untouched?`,
    principle: 'Useful boundaries localize decisions while keeping their dependents and evidence visible.',
    conditions: [
      { id: 'design-a', baseline: true, label: `Baseline: Design A, the duration rule is copied into ${D.design_A.rule_holders.length} components`, short: 'Design A',
        states: [
          { prompt: { question: `The maximum duration drops from ${FROM} to ${TO} minutes. Which components hold that rule, and which only use its result?`, options: ['Only the Booking Handler', 'Every component that checks a duration for itself', 'The Storage, because it keeps the bookings'] }, caption: `Seven components of Campus Rooms. Arrows point from a component to the one it depends on. Step to see where the rule "at most ${FROM} minutes" lives in Design A.`, alt: 'Dependency graph of seven components, Design A.' },
          { caption: `In Design A the rule is written three times: **${D.design_A.rule_holders.join('**, **')}** each check the duration for themselves. Three copies of one decision.`, alt: 'Three components carry a copy of the duration rule.' },
          { caption: `Apply the change. Every copy must be edited: ${D.design_A.must_edit.length} edit locations for one rule. Each is marked as must edit.`, alt: 'Three components marked must edit.' },
          { caption: `Each edited component has its own checks, and each set must run again: ${D.design_A.must_recheck.join(', ')}.`, alt: 'Three sets of checks marked must recheck.' },
          { caption: `Unaffected: **${D.design_A.unaffected.join('**, **')}**. They never held the rule and only consume its result.`, alt: 'Three components marked unaffected.' },
          { caption: `One copy is missed. The **${D.design_A.missed_copy.component}** still says ${FROM}, so it accepts a ${D.design_A.missed_copy.accepts_minutes}-minute booking that the Booking Handler ${D.design_A.missed_copy.while_handler.replace('rejects', 'rejects')}: **${D.design_A.missed_copy.result}** inside one service. Change the condition to Design B.`, alt: 'The Reminder keeps the old rule and disagrees with the Booking Handler.' },
        ] },
      { id: 'design-b', label: 'Changed condition: Design B, one authoritative Policy module; the Browser UI reads the limits from Policy for early feedback', short: 'Design B',
        states: [
          { caption: 'Same components, same change, one more module: **Policy**. Which components must change now?', alt: 'Dependency graph of eight components, Design B, with a Policy module.' },
          { caption: `The rule lives once, in **Policy**. The Browser UI does not decide; it ${D.design_B.non_authoritative_mirror.replace('Browser UI ', '')}. The Booking Handler and the Reminder ask Policy.`, alt: 'Policy carries the only copy of the rule; three components depend on it.' },
          { caption: `Apply the change: one edit location, **${D.design_B.must_edit.join(', ')}**.`, alt: 'Policy marked must edit.' },
          { caption: `Rechecks do not vanish: ${D.design_B.must_recheck.join(', ')}. One module does not mean only one file ever changes; its interface and its dependents still get checked.`, alt: 'Policy checks, the handler integration check and the UI limit display marked must recheck.' },
          { caption: `Unaffected: **${D.design_B.unaffected.join('**, **')}**. The Reminder asks Policy, so its own logic did not change.`, alt: 'Four items marked unaffected.' },
          { caption: `Compare: edit locations ${D.design_A.must_edit.length} against ${D.design_B.must_edit.length}; rechecks ${D.design_A.must_recheck.length} against ${D.design_B.must_recheck.length}, of different kinds; inconsistency risk: a missed copy in A, none in B because there is one decision point.`, alt: 'Comparison table of the two designs.' },
          { caption: 'The boundary around Policy localizes the decision, and the arrows into it keep the dependents visible: you know exactly what to recheck.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) 420px;gap:22px;' });
      const W = 820, H = 680;
      const svg = window.VC.svg(W, H, { label: 'Dependency graph of the Campus Rooms components', uid: (x) => api.uid(x) });
      const nw = 200, nh = 66;
      const P = {
        'Browser UI': [40, 40], 'Policy': [310, 40], 'Booking Handler': [310, 300], 'Reminder': [40, 536],
        'Room Catalog': [600, 170], 'Notification': [600, 310], 'Storage': [600, 460],
      };
      const box = (name) => ({ box: { x: P[name][0], y: P[name][1], w: nw, h: name === 'Storage' ? 90 : nh } });
      h.nodes = {};
      // edges first (behind nodes)
      const edgeDefs = {
        'design-a': D.design_A.edges, 'design-b': D.design_B.edges,
      };
      h.edges = {};
      Object.entries(edgeDefs).forEach(([cond, edges]) => {
        edges.forEach(([from, to]) => {
          const opts = { fromBox: box(from), toBox: box(to), kind: 'default', cls: 'dep-edge' };
          if (from === 'Reminder' && to === 'Policy') Object.assign(opts, { bend: -140, fromSide: 'top', toSide: 'left' });
          if (from === 'Browser UI' && to === 'Policy') Object.assign(opts, { fromSide: 'right', toSide: 'left' });
          if (from === 'Booking Handler' && to === 'Policy') Object.assign(opts, { fromSide: 'top', toSide: 'bottom' });
          if (from === 'Browser UI' && to === 'Booking Handler') Object.assign(opts, { fromSide: 'bottom', toSide: 'left' });
          if (from === 'Reminder' && to === 'Storage') Object.assign(opts, { fromSide: 'right', toSide: 'bottom', bend: 60 });
          const a = arrow(svg, opts);
          a.setAttribute('data-cond', cond);
          h.edges[`${cond}:${from}>${to}`] = a;
        });
      });
      Object.keys(P).forEach((name) => {
        const isStore = name === 'Storage';
        const n = node({ x: P[name][0], y: P[name][1], w: nw, h: isStore ? 90 : nh, label: name, kind: isStore ? 'store' : 'box', cls: 'dep-node dm' });
        if (name === 'Policy') n.setAttribute('data-cond', 'design-b');
        svg.appendChild(n);
        api.cue(n, `node-${name.toLowerCase().replace(/ /g, '-')}`);
        h.nodes[name] = n;
      });
      // rule badges and check chips (positioned under each node)
      h.rule = {}; h.check = {};
      Object.keys(P).forEach((name) => {
        const [x, y] = P[name];
        const r = badge({ x: x + nw / 2, y: y + nh + 22, label: '', kind: 'warn', cls: 'rule-badge' });
        r.style.display = 'none';
        svg.appendChild(r); h.rule[name] = r;
        const c = badge({ x: x + nw / 2, y: y - 22, label: 'checks: run again', kind: 'accent', cls: 'check-badge' });
        c.style.display = 'none';
        svg.appendChild(c); h.check[name] = c;
      });
      h.missed = s('g', { class: 'rv rv--rise', 'data-cond': 'design-a', 'data-show-from': '5' });
      h.missed.appendChild(badge({ x: P['Reminder'][0] + nw / 2, y: P['Reminder'][1] + nh + 58, label: `still ${FROM}: accepts ${D.design_A.missed_copy.accepts_minutes} min`, kind: 'bad' }));
      h.missed.appendChild(badge({ x: P['Booking Handler'][0] + nw / 2, y: P['Booking Handler'][1] + nh + 58, label: `now ${TO}: rejects ${D.design_A.missed_copy.accepts_minutes} min`, kind: 'ok' }));
      svg.appendChild(h.missed);
      api.cue(h.missed, 'missed-copy');
      // right column: change card, impact table, missed-copy callout, comparison
      const changeCard = el('div', { class: 'card', style: 'padding:12px 16px' }, [
        el('div', { class: 'card-title', style: 'margin-bottom:4px' }, `Change · ${D.change.rule} (${D.change.label})`),
        el('p', { style: 'font-size:23px;font-weight:600' }, [`Maximum duration: ${FROM} → ${TO} minutes`]),
      ]);
      api.cue(changeCard, 'change');
      h.impact = table({ caption: 'Impact of the change', cls: 'data-table--compact', columns: [{ key: 'k', label: 'Marker' }, { key: 'v', label: 'Components' }], rows: [
        { attrs: { class: 'rv', 'data-row': 'edit' }, cells: { k: [chip('must edit', 'warn')], v: (h.editCell = el('span')) } },
        { attrs: { class: 'rv', 'data-row': 'recheck' }, cells: { k: [chip('must recheck', 'accent')], v: (h.recheckCell = el('span')) } },
        { attrs: { class: 'rv', 'data-row': 'unaffected' }, cells: { k: [chip('unaffected', 'muted')], v: (h.unaffectedCell = el('span')) } },
      ] });
      const impactCard = el('div', { class: 'card', style: 'padding:10px 14px' }, h.impact);
      api.cue(impactCard, 'impact');
      h.missedCallout = el('div', { class: 'callout callout--bad rv rv--rise', 'data-cond': 'design-a', 'data-show-from': '5', style: 'font-size:19px' }, [el('b', {}, 'Missed copy: '), `the ${D.design_A.missed_copy.component} accepts ${D.design_A.missed_copy.accepts_minutes} minutes while the Booking Handler ${D.design_A.missed_copy.while_handler}. ${D.design_A.missed_copy.result.charAt(0).toUpperCase()}${D.design_A.missed_copy.result.slice(1)}.`]);
      const cmp = table({ caption: 'Design A against Design B', cls: 'data-table--compact', columns: [{ key: 'k', label: '' }, { key: 'a', label: 'Design A' }, { key: 'b', label: 'Design B' }], rows: [
        { cells: { k: 'Edit locations', a: String(D.design_A.must_edit.length), b: String(D.design_B.must_edit.length) } },
        { cells: { k: 'Rechecks', a: `${D.design_A.must_recheck.length} (one per copy)`, b: `${D.design_B.must_recheck.length} (policy, interface, display)` } },
        { cells: { k: 'Inconsistency risk', a: el('span', { class: 'bad' }, 'a missed copy'), b: el('span', { class: 'ok' }, 'none: one decision point') } },
      ] });
      h.cmpCard = el('div', { class: 'card rv rv--rise', 'data-cond': 'design-b', 'data-show-from': '5', style: 'padding:10px 14px' }, cmp);
      api.cue(h.cmpCard, 'compare');
      const lg = legend([{ kind: 'edit', label: 'must edit' }, { kind: 'recheck', label: 'must recheck' }, { kind: 'unaffected', label: 'unaffected' }]);
      wrap.append(svg, el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [changeCard, impactCard, h.missedCallout, h.cmpCard, el('div', { style: 'margin-top:auto' }, lg)]));
      stage.appendChild(wrap);
      h.svg = svg;
      return h;
    },
    render(h, view) {
      const st = view.state, c = view.conditionId;
      const design = c === 'design-a' ? D.design_A : D.design_B;
      const holders = design.rule_holders;
      const mustEdit = design.must_edit;
      const recheckNodes = design.must_recheck.map((r) => r.replace(/ checks$| integration check$| limit display$/, ''));
      const unaffected = design.unaffected.map((u) => u.replace(/ logic$/, ''));
      const showRule = st >= 1, showEdit = st >= 2, showRecheck = st >= 3, showUnaffected = st >= 4;
      Object.keys(h.nodes).forEach((name) => {
        const n = h.nodes[name];
        n.classList.remove('state-edit', 'state-recheck', 'state-unaffected');
        n.classList.toggle('is-dim', showUnaffected && unaffected.includes(name));
        if (showEdit && mustEdit.includes(name)) n.classList.add('state-edit');
        else if (showRecheck && recheckNodes.includes(name)) n.classList.add('state-recheck');
        else if (showUnaffected && unaffected.includes(name)) n.classList.add('state-unaffected');
        const r = h.rule[name];
        const isHolder = holders.includes(name);
        const mirror = c === 'design-b' && name === 'Browser UI';
        if (showRule && (isHolder || mirror)) {
          const missed = c === 'design-a' && st >= 5 && name === D.design_A.missed_copy.component;
          const label = mirror ? 'reads limits from Policy' : (showEdit && !missed ? `rule: at most ${TO} min` : `rule: at most ${FROM} min`);
          r.querySelector('text').textContent = label;
          const w = label.length * 10.4 + 26; const rect = r.querySelector('rect'); rect.setAttribute('width', w); rect.setAttribute('x', Number(r.querySelector('text').getAttribute('x')) - w / 2);
          r.setAttribute('class', `badge badge--${missed ? 'bad' : mirror ? 'default' : showEdit ? 'warn' : 'violet'} rule-badge`);
          r.style.display = '';
        } else r.style.display = 'none';
        h.check[name].style.display = showRecheck && recheckNodes.includes(name) ? '' : 'none';
      });
      h.editCell.textContent = mustEdit.join(', ');
      h.recheckCell.textContent = design.must_recheck.join(', ');
      h.unaffectedCell.textContent = design.unaffected.join(', ');
      h.impact.querySelectorAll('tr[data-row]').forEach((tr) => {
        const k = tr.getAttribute('data-row');
        tr.classList.toggle('is-shown', (k === 'edit' && showEdit) || (k === 'recheck' && showRecheck) || (k === 'unaffected' && showUnaffected));
        tr.classList.toggle('is-focus', (k === 'edit' && st === 2) || (k === 'recheck' && st === 3) || (k === 'unaffected' && st === 4));
      });
    },
    print: [
      { title: 'Design A after the change: three edits, three rechecks, one missed copy', condition: 'design-a', state: 5, note: 'Legend: thick yellow border = must edit; dashed blue border = must recheck; faded = unaffected. The Reminder still carries the old limit.' },
      { title: 'Design B after the same change: one edit, visible rechecks', condition: 'design-b', state: 5, principle: true, note: 'One module does not mean only one file ever changes: the Policy checks, the handler integration check and the UI limit display are rechecked.' },
    ],
  };

  const closing = {
    kind: 'page', id: 'sources', role: 'page',
    heading: 'What this shell test showed',
    lead: 'A dependency graph with three marker kinds under two conditions, printable as two panels.',
    printRole: 'Closing',
    build(body) {
      body.appendChild(el('div', { class: 'card', style: 'max-width:1100px' }, [
        el('ul', { style: 'font-size:22px;line-height:1.45;display:flex;flex-direction:column;gap:8px' }, [
          el('li', {}, 'Two designs as condition presets; the change is the same in both.'),
          el('li', {}, 'Must-edit, must-recheck and unaffected markers use border style and fading, not color alone.'),
          el('li', {}, 'The remaining seven scenes of Week 5 are authored in Phase 1.'),
        ]),
      ]));
    },
    print(body) { body.appendChild(el('p', {}, 'Week 5 shell-test deck. The remaining seven scenes follow in Phase 1.')); },
  };

  window.lecture.deck({
    week: 5, file: FILE,
    title: 'Modularity, interfaces, and the cost of change',
    question: 'When one requirement changes, which parts should need to change?',
    coverLead: 'Phase 0 shell-test deck: one scene of Week 5.',
    coverNote: 'Campus Rooms is a fictional room-booking service; every value is a teaching example.',
    pages: [opening, { kind: 'scene', scene: dependencyExample }, closing],
  });
})();
