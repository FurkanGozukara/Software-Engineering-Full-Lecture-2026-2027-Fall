/* =====================================================================
   Week 11 · Reliability, observability, and performance reasoning
   Central question: Which observation would help distinguish the possible causes of a failure?

   Phase 0 carries one shell-test scene, latency-is-a-distribution (two
   Chart.js histograms with an accessible data table and nearest-rank p95).
   The other seven scenes are authored in Phase 1 on the same shell.
   ===================================================================== */
(function () {
  'use strict';
  const F = window.CAMPUS_ROOMS_FIXTURES;
  const L = F.latency;
  const Q01 = F.anchors['w02/quality-with-conditions'];
  const { el, table, histogram } = window.VC;
  const FILE = 'week-11.html';
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const nearestRank = (values, p) => { const o = values.slice().sort((a, b) => a - b); return o[Math.ceil(p * o.length) - 1]; };
  const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
  const N = L.A.length;
  const RANK = Math.ceil(0.95 * N);
  const P95 = { A: nearestRank(L.A, 0.95), B: nearestRank(L.B, 0.95) };
  const MEAN = { A: mean(L.A), B: mean(L.B) };

  const opening = {
    kind: 'page', id: 'opening', role: 'page',
    heading: 'Which observation would help distinguish the possible causes of a failure?',
    lead: 'Week 11 reasons about service promises, latency, correlated observations and retries.',
    printRole: 'Opening',
    build(body) {
      body.appendChild(el('div', { class: 'card', style: 'max-width:1100px' }, [
        el('div', { class: 'card-title' }, 'This deck is in preparation'),
        el('p', { style: 'font-size:24px;line-height:1.4' }, `Phase 0 of the course build carries one scene of this week, the latency distribution, to show that the shared shell handles numeric charts with an accessible data table and a print path. The remaining seven scenes are authored in Phase 1. Open the scene with the Next button or through ${FILE}#/latency-is-a-distribution.`),
      ]));
    },
    print(body) { body.appendChild(el('p', {}, 'Phase 0 shell-test deck: only the latency distribution scene is present. The full Week 11 deck follows in Phase 1.')); },
  };

  const latencyScene = {
    id: 'latency-is-a-distribution', role: 'bridge', layout: 'wide',
    heading: 'The average can hide the experience we need to improve',
    lead: `Two sets of ${N} response times. Both average ${fmt(MEAN.A)} ms. Do the people behind them get the same service?`,
    principle: 'Use a distribution and a defined percentile method when the question concerns uneven user experience.',
    conditions: [
      { id: 'compare-average', baseline: true, label: 'Baseline: compare the two datasets by their average', short: 'By the average',
        states: [
          { prompt: { question: `Both datasets average ${fmt(MEAN.A)} ms. Are they equally responsive?`, options: ['Yes: same average, same experience', 'No: the average can hide a slow tail', 'Only if the sample were larger'] }, caption: `Twenty synthetic response times per dataset, in milliseconds. Step to reveal each dataset as a histogram; the table beside the charts lists every value.` },
          { caption: `**Dataset A:** ${N} responses, all at ${fmt(L.A[0])} ms. One bar, twenty responses tall.` },
          { caption: `**Dataset B:** ${L.B.filter((v) => v === 100).length} responses at ${fmt(100)} ms and ${L.B.filter((v) => v === 1100).length} at ${fmt(1100)} ms. Most people wait half as long as in A; two people wait more than a second.` },
          { caption: `The **mean** of both is ${fmt(MEAN.A)} ms: the marker lands on the same place in both charts. By the average, the two datasets are the same.` },
          { caption: `Two people out of twenty in Dataset B waited ${fmt(1100)} ms, and the average says nothing about them. Change the comparison to the tail.` },
        ] },
      { id: 'compare-tail', label: 'Changed condition: compare by the tail, the nearest-rank 95th percentile (p95)', short: 'By the tail (p95)',
        states: [
          { caption: `Same data, both charts shown. Now compare the tail: the **nearest-rank 95th percentile**, the value at position ceil(0.95 × ${N}) = ${RANK} in the sorted list.` },
          { caption: `**p95 of A: ${fmt(P95.A)} ms. p95 of B: ${fmt(P95.B)} ms.** The ${RANK}th sorted value of B is one of the two slow responses. Same mean, a tail more than five times longer.` },
          { caption: `Requirement Q-01 asks for a p95 of at most ${Q01.p95_ms_max} ms at the ${Q01.boundary} under ${Q01.concurrent_users} concurrent users. These twenty values show the method; a check of Q-01 uses the declared dataset, request mix and environment.`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr minmax(0,0.9fr);gap:20px;align-items:start;' });
      const edges = Array.from({ length: 13 }, (_, i) => i * 100);
      h.chartA = histogram({ values: L.A, unit: L.unit, binEdges: edges, title: `Dataset A · n = ${N}`, width: 560, height: 320, color: '--accent', maxY: 22, stepSize: 200 });
      h.chartB = histogram({ values: L.B, unit: L.unit, binEdges: edges, title: `Dataset B · n = ${N}`, width: 560, height: 320, color: '--violet', maxY: 22, stepSize: 200 });
      const chartBox = (hist, key) => {
        const c = el('div', { class: 'card rv rv--scale', style: 'padding:10px 12px;display:flex;flex-direction:column;gap:6px;align-items:center' }, [hist.canvas, el('div', { class: 'small muted', style: 'align-self:stretch;display:flex;justify-content:space-between' }, [el('span', {}, `mean ${fmt(MEAN[key])} ms`), (h[`stat${key}`] = el('span', {}, ''))])]);
        api.cue(c, `chart-${key.toLowerCase()}`);
        return c;
      };
      h.boxA = chartBox(h.chartA, 'A'); h.boxA.setAttribute('data-show-from', '1');
      h.boxB = chartBox(h.chartB, 'B'); h.boxB.setAttribute('data-show-from', '2');
      const method = el('div', { class: 'card', style: 'padding:10px 14px;font-size:18px;line-height:1.35' }, [
        el('div', { class: 'card-title', style: 'margin-bottom:4px' }, 'Method'),
        el('p', {}, [el('b', {}, 'Mean: '), 'sum of the values divided by n.']),
        el('p', {}, [el('b', {}, 'Nearest-rank p95: '), `sorted[ceil(0.95 × n) − 1], the ${RANK}th of ${N} sorted values.`]),
        el('p', { class: 'muted', style: 'font-size:16px' }, L.scope),
      ]);
      const tables = el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px' }, [h.chartA.table, h.chartB.table]);
      api.cue(tables, 'data-table');
      wrap.append(h.boxA, h.boxB, el('div', { style: 'display:flex;flex-direction:column;gap:12px;min-width:0' }, [method, tables]));
      stage.appendChild(wrap);
      h.ready = new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return h;
    },
    render(h, view) {
      const tail = view.conditionId === 'compare-tail';
      const st = view.state;
      if (tail) { h.boxA.classList.add('is-shown'); h.boxB.classList.add('is-shown'); }
      const showMean = tail || st >= 3;
      const showP95 = tail && st >= 1;
      const markers = (key) => {
        const m = [];
        if (showMean) m.push({ x: MEAN[key], label: `mean ${fmt(MEAN[key])} ms`, color: '--warn', dash: [6, 4], dy: 4, align: key === 'B' && showP95 && P95[key] > 600 ? 'left' : 'left' });
        if (showP95) m.push({ x: P95[key], label: `p95 ${fmt(P95[key])} ms`, color: '--bad', dy: 30, align: P95[key] > 600 ? 'right' : 'left' });
        return m;
      };
      h.chartA.update(markers('A')); h.chartB.update(markers('B'));
      h.statA.textContent = showP95 ? `p95 ${fmt(P95.A)} ms` : '';
      h.statB.textContent = showP95 ? `p95 ${fmt(P95.B)} ms` : '';
      h.statB.className = showP95 ? 'bad' : '';
    },
    print: [
      { title: 'Two datasets with the same mean', condition: 'compare-average', state: 3, note: `Dataset A: ${N} values at ${fmt(L.A[0])} ms. Dataset B: ${L.B.filter((v) => v === 100).length} at 100 ms and ${L.B.filter((v) => v === 1100).length} at ${fmt(1100)} ms. Both means ${fmt(MEAN.A)} ms. Synthetic data; the tables list every value.` },
      { title: 'The same datasets compared by the tail', condition: 'compare-tail', state: 1, principle: true, note: `Nearest rank: sorted[ceil(0.95 × ${N}) − 1] = the ${RANK}th sorted value. p95 of A: ${fmt(P95.A)} ms; p95 of B: ${fmt(P95.B)} ms. Q-01 asks for p95 ≤ ${Q01.p95_ms_max} ms under ${Q01.concurrent_users} concurrent users at the ${Q01.boundary}; these twenty points illustrate the method.` },
    ],
  };

  const closing = {
    kind: 'page', id: 'sources', role: 'page',
    heading: 'What this shell test showed',
    lead: 'Two numeric charts from the fixture data, an accessible table beside them, and a print path that renders the charts.',
    printRole: 'Closing',
    build(body) {
      body.appendChild(el('div', { class: 'card', style: 'max-width:1100px' }, [
        el('ul', { style: 'font-size:22px;line-height:1.45;display:flex;flex-direction:column;gap:8px' }, [
          el('li', {}, 'Chart.js draws the histograms; every value is also in a semantic table.'),
          el('li', {}, 'Mean and p95 markers are drawn only when the selected comparison asks for them; the condition is printed as text.'),
          el('li', {}, 'The remaining seven scenes of Week 11 are authored in Phase 1.'),
        ]),
      ]));
    },
    print(body) { body.appendChild(el('p', {}, 'Week 11 shell-test deck. The remaining seven scenes follow in Phase 1.')); },
  };

  window.lecture.deck({
    week: 11, file: FILE,
    title: 'Reliability, observability, and performance reasoning',
    question: 'Which observation would help distinguish the possible causes of a failure?',
    coverLead: 'Phase 0 shell-test deck: one scene of Week 11.',
    coverNote: 'Latency values are synthetic teaching data, not measurements.',
    pages: [opening, { kind: 'scene', scene: latencyScene }, closing],
  });
})();
