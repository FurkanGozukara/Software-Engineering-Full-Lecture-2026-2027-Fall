/* =====================================================================
   Software Engineering course · visual components (window.VC)
   Shared diagram grammar and HTML primitives used by every weekly deck:
   DOM helpers, SVG nodes / arrows / people / badges, browser cards,
   status lines, semantic tables and a Chart.js histogram wrapper with an
   accessible data table. Colors are CSS variables so the same components
   render in the dark theme and in the light print view.
   ===================================================================== */
(function () {
  'use strict';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // ------------------------------------------------------------------ DOM helpers
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'style' && typeof v === 'string') node.style.cssText = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : String(v));
    }
    append(node, children);
    return node;
  }
  function append(node, children) {
    if (children == null || children === false) return node;
    if (Array.isArray(children)) { children.forEach((c) => append(node, c)); return node; }
    node.appendChild(typeof children === 'string' || typeof children === 'number' ? document.createTextNode(String(children)) : children);
    return node;
  }
  /**
   * "text with **bold**, `code` and [[tags]]" -> nodes. [[example assumption]] renders the example tag;
   * [[Rule R-01|example assumption]] keeps the words before the bar and the tag together on one line.
   */
  function rich(text) {
    const out = [];
    String(text).split(/(\*\*[^*]+\*\*|`[^`]+`|\[\[[^\]]+\]\])/g).forEach((part) => {
      if (!part) return;
      if (part.startsWith('**')) out.push(el('strong', {}, part.slice(2, -2)));
      else if (part.startsWith('`')) out.push(el('code', {}, part.slice(1, -1)));
      else if (part.startsWith('[[')) {
        const [label, tag] = part.slice(2, -2).split('|');
        out.push(tag === undefined ? el('span', { class: 'example-tag' }, label)
          : el('span', { style: 'white-space:nowrap' }, [label, ' ', el('span', { class: 'example-tag' }, tag)]));
      } else out.push(document.createTextNode(part));
    });
    return out;
  }

  // ------------------------------------------------------------------ SVG helpers
  function s(tag, attrs, children) {
    const node = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.setAttribute('class', v);
      else if (k === 'style' && typeof v === 'string') node.style.cssText = v;
      else node.setAttribute(k, v === true ? '' : String(v));
    }
    append(node, children);
    return node;
  }
  /** A diagram canvas with viewBox, defs (arrowheads per color kind, hatch pattern) and an accessible name. */
  function svg(w, h, opts = {}) {
    const root = s('svg', { class: `diagram ${opts.class || ''}`.trim(), viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': opts.label || 'Diagram', focusable: 'false', preserveAspectRatio: opts.preserve || 'xMidYMid meet' });
    const uid = opts.uid || ((x) => x);
    const defs = s('defs');
    ['default', 'accent', 'ok', 'bad', 'warn', 'violet'].forEach((kind) => {
      const m = s('marker', { id: uid(`arrow-${kind}`), viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse', class: `arrow--${kind}` });
      m.appendChild(s('path', { d: 'M0,0 L10,5 L0,10 z', class: 'a-head' }));
      defs.appendChild(m);
    });
    const hatch = s('pattern', { id: uid('hatch-bad'), width: '10', height: '10', patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    hatch.appendChild(s('rect', { width: '10', height: '10', fill: 'var(--bad-fill)' }));
    hatch.appendChild(s('line', { x1: '0', y1: '0', x2: '0', y2: '10', stroke: 'var(--bad)', 'stroke-width': '3' }));
    defs.appendChild(hatch);
    const hatchWarn = s('pattern', { id: uid('hatch-warn'), width: '10', height: '10', patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    hatchWarn.appendChild(s('rect', { width: '10', height: '10', fill: 'var(--warn-fill)' }));
    hatchWarn.appendChild(s('line', { x1: '0', y1: '0', x2: '0', y2: '10', stroke: 'var(--warn)', 'stroke-width': '2' }));
    defs.appendChild(hatchWarn);
    root.appendChild(defs);
    root.uid = uid;
    return root;
  }
  function text(x, y, str, attrs = {}) {
    const { lineHeight, ...rest } = attrs;
    const t = s('text', Object.assign({ x, y }, rest));
    if (Array.isArray(str)) {
      str.forEach((line, i) => t.appendChild(s('tspan', { x, dy: i === 0 ? 0 : (lineHeight || 24) }, line)));
    } else t.textContent = str;
    return t;
  }
  /** Rounded component box. kind: box | ext | store. Returns <g>. */
  function node(opts) {
    const { x, y, w, h, label, sub, kind = 'box', kindLabel, r = 12, cls = '' } = opts;
    const g = s('g', { class: `n-${kind} fx ${cls}`.trim(), transform: `translate(${x} ${y})` });
    if (kind === 'store') {
      const d = `M0,${h * 0.18} A${w / 2},${h * 0.18} 0 0 1 ${w},${h * 0.18} V${h - h * 0.18} A${w / 2},${h * 0.18} 0 0 1 0,${h - h * 0.18} Z`;
      g.appendChild(s('path', { d }));
      g.appendChild(s('path', { d: `M0,${h * 0.18} A${w / 2},${h * 0.18} 0 0 0 ${w},${h * 0.18}`, fill: 'none' }));
    } else {
      g.appendChild(s('rect', { width: w, height: h, rx: r, ry: r }));
    }
    const lines = Array.isArray(label) ? label : [label];
    const hasKind = !!kindLabel;
    const total = lines.length * 26 + (sub ? 22 : 0) + (hasKind ? 20 : 0);
    let cy = h / 2 - total / 2 + 20;
    if (hasKind) { g.appendChild(text(w / 2, cy - 6, kindLabel, { class: 'n-kind', 'text-anchor': 'middle' })); cy += 20; }
    lines.forEach((ln, i) => g.appendChild(text(w / 2, cy + i * 26, ln, { class: 'n-label', 'text-anchor': 'middle' })));
    if (sub) g.appendChild(text(w / 2, cy + lines.length * 26 - 2, sub, { class: 'n-sub', 'text-anchor': 'middle' }));
    g.box = { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
    return g;
  }
  /** A person glyph with a name and optional role line. */
  function person(opts) {
    const { x, y, name, role, cls = '' } = opts;
    const g = s('g', { class: `n-person fx ${cls}`.trim(), transform: `translate(${x} ${y})` });
    g.appendChild(s('circle', { cx: 0, cy: -34, r: 18 }));
    g.appendChild(s('path', { d: 'M-30,22 C-30,-4 30,-4 30,22 Z' }));
    g.appendChild(text(0, 50, name, { class: 'n-label', 'text-anchor': 'middle' }));
    if (role) g.appendChild(text(0, 74, role, { class: 'n-sub', 'text-anchor': 'middle' }));
    g.box = { x: x - 32, y: y - 54, w: 64, h: 80, cx: x, cy: y };
    return g;
  }
  /** Dashed boundary rectangle with a corner label. */
  function boundary(opts) {
    const { x, y, w, h, label } = opts;
    const g = s('g', { class: 'n-boundary' });
    g.appendChild(s('rect', { x, y, width: w, height: h, rx: 22, ry: 22 }));
    g.appendChild(text(x + 20, y + 30, label, { class: 'n-label' }));
    return g;
  }
  /** Anchor point on the border of a box facing another point. side: auto|left|right|top|bottom */
  function port(box, towards, side) {
    const b = box.box || box;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    if (!side || side === 'auto') {
      const dx = towards.x - cx, dy = towards.y - cy;
      side = Math.abs(dx) * b.h > Math.abs(dy) * b.w ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top');
    }
    switch (side) {
      case 'left': return { x: b.x, y: cy };
      case 'right': return { x: b.x + b.w, y: cy };
      case 'top': return { x: cx, y: b.y };
      default: return { x: cx, y: b.y + b.h };
    }
  }
  /**
   * Labeled arrow. opts: from{x,y} to{x,y} | fromBox/toBox with sides, label, kind (default|accent|ok|bad|warn|violet),
   * dashed, bend (perpendicular offset for a curved path), labelAt (0..1), labelDy, uid.
   */
  function arrow(svgRoot, opts) {
    const uid = svgRoot.uid || ((x) => x);
    let from = opts.from, to = opts.to;
    if (opts.fromBox) from = port(opts.fromBox, opts.toBox ? center(opts.toBox) : to, opts.fromSide);
    if (opts.toBox) to = port(opts.toBox, opts.fromBox ? center(opts.fromBox) : from, opts.toSide);
    const kind = opts.kind || 'default';
    const g = s('g', { class: `arrow arrow--${kind} ${opts.dashed ? 'arrow--dashed' : ''} ${opts.cls || ''}`.trim() });
    let d, mid;
    if (opts.bend) {
      const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
      const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const cx = mx + nx * opts.bend, cy = my + ny * opts.bend;
      d = `M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`;
      mid = { x: 0.25 * from.x + 0.5 * cx + 0.25 * to.x, y: 0.25 * from.y + 0.5 * cy + 0.25 * to.y };
    } else if (opts.via) {
      const pts = [from, ...opts.via, to];
      d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
      const k = Math.floor(pts.length / 2);
      mid = { x: (pts[k - 1].x + pts[k].x) / 2, y: (pts[k - 1].y + pts[k].y) / 2 };
    } else {
      d = `M${from.x},${from.y} L${to.x},${to.y}`;
      const t = opts.labelAt == null ? 0.5 : opts.labelAt;
      mid = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    }
    const path = s('path', { d, class: 'a-line', 'marker-end': `url(#${uid(`arrow-${kind}`)})` });
    if (opts.both) path.setAttribute('marker-start', `url(#${uid(`arrow-${kind}`)})`);
    g.appendChild(path);
    if (opts.label) {
      const lines = Array.isArray(opts.label) ? opts.label : [opts.label];
      const lx = mid.x + (opts.labelDx || 0), ly = mid.y + (opts.labelDy == null ? -12 : opts.labelDy);
      const est = Math.max(...lines.map((l) => l.length)) * 9.6 + 18;
      const bg = s('rect', { class: 'a-label-bg', x: lx - est / 2, y: ly - 20, width: est, height: 24 * lines.length + 6, rx: 6 });
      if (opts.labelAnchor === 'start') bg.setAttribute('x', lx - 6); else if (opts.labelAnchor === 'end') bg.setAttribute('x', lx - est + 6);
      g.appendChild(bg);
      g.appendChild(text(lx, ly, lines, { class: 'a-label', 'text-anchor': opts.labelAnchor || 'middle', lineHeight: 24 }));
    }
    svgRoot.appendChild(g);
    // draw-in length for .rv--draw
    try { const len = path.getTotalLength(); g.style.setProperty('--len', String(Math.ceil(len) + 2)); } catch (e) { /* not attached yet */ }
    g.path = path; g.from = from; g.to = to;
    return g;
  }
  function center(box) { const b = box.box || box; return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; }
  /** Small pill badge in SVG. */
  function badge(opts) {
    const { x, y, label, kind = 'default', anchor = 'middle' } = opts;
    const w = label.length * 10.4 + 26, h = 32;
    const bx = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    const g = s('g', { class: `badge badge--${kind} ${opts.cls || ''}`.trim() });
    g.appendChild(s('rect', { x: bx, y: y - h / 2, width: w, height: h, rx: 16, ry: 16 }));
    g.appendChild(text(bx + w / 2, y + 6, label, { 'text-anchor': 'middle' }));
    g.box = { x: bx, y: y - h / 2, w, h };
    return g;
  }
  /** An X mark to cross out an arrow or node. */
  function markX(x, y, size = 14, cls = '') {
    const g = s('g', { class: `mark-x ${cls}`.trim() });
    g.appendChild(s('line', { x1: x - size, y1: y - size, x2: x + size, y2: y + size }));
    g.appendChild(s('line', { x1: x - size, y1: y + size, x2: x + size, y2: y - size }));
    return g;
  }

  // ------------------------------------------------------------------ HTML components
  /** Fake browser window. opts: who, url, title, body (nodes) */
  function browser(opts) {
    const bar = el('div', { class: 'browser-bar' }, [
      el('span', { class: 'dots', 'aria-hidden': 'true' }, [el('i'), el('i'), el('i')]),
      el('span', { class: 'url' }, opts.url || 'campus-rooms.example/book'),
      opts.who ? el('span', { class: 'who' }, opts.who) : null,
    ]);
    const body = el('div', { class: 'browser-body' }, opts.body);
    const win = el('div', { class: `browser ${opts.cls || ''}`.trim(), role: 'group', 'aria-label': opts.label || (opts.who ? `Browser window of ${opts.who}` : 'Browser window') }, [bar, body]);
    win.body = body;
    return win;
  }
  function withClass(base, attrs) {
    const a = Object.assign({}, attrs || {});
    a.class = `${base} ${a.class || ''}`.trim();
    return a;
  }
  function field(key, value, attrs = {}) {
    return el('div', withClass('field', attrs), [el('span', { class: 'k' }, key), el('span', { class: 'v' }, value)]);
  }
  /** Status line. kind: ok | bad | wait */
  function status(kind, textStr, sub, attrs = {}) {
    const ico = kind === 'ok' ? '✓' : kind === 'bad' ? '✕' : '…';
    return el('div', Object.assign({ role: 'status' }, withClass(`status status--${kind}`, attrs)), [
      el('span', { class: 'ico', 'aria-hidden': 'true' }, ico),
      el('span', {}, [textStr, sub ? el('span', { class: 'sub' }, sub) : null]),
    ]);
  }
  function chip(textStr, kind, attrs = {}) { return el('span', withClass(`chip${kind ? ` chip--${kind}` : ''}`, attrs), textStr); }
  /**
   * Semantic table. opts: caption, columns [{key,label,scope}], rows [{cells:{key: node|string}, attrs}], rowHeader (key used as <th scope=row>)
   */
  function table(opts) {
    const t = el('table', { class: `data-table ${opts.cls || ''}`.trim() });
    if (opts.caption) t.appendChild(el('caption', {}, opts.caption));
    if (opts.captionHidden) t.appendChild(el('caption', { class: 'visually-hidden' }, opts.captionHidden));
    t.appendChild(el('thead', {}, el('tr', {}, opts.columns.map((c) => el('th', { scope: 'col', class: c.cls }, c.label)))));
    const tb = el('tbody');
    opts.rows.forEach((r) => {
      const tr = el('tr', r.attrs || {});
      opts.columns.forEach((c, i) => {
        const v = r.cells[c.key];
        const isHead = (opts.rowHeader || opts.columns[0].key) === c.key && i === 0;
        tr.appendChild(el(isHead ? 'th' : 'td', Object.assign({ class: c.cls }, isHead ? { scope: 'row' } : {}), v));
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    return t;
  }
  function legend(items) {
    return el('div', { class: 'legend', role: 'list', 'aria-label': 'Legend' }, items.map((it) => el('span', { class: 'key', role: 'listitem' }, [el('span', { class: `swatch swatch--${it.kind}`, 'aria-hidden': 'true' }), it.label])));
  }

  // ------------------------------------------------------------------ Chart.js histogram with an accessible table
  /**
   * opts: values[], unit, binEdges[] (ascending), title, color (css var name), maxY, markers [{x, label, kind}], width, height, animate
   * Returns { canvas, table, chart, update(markers) } ; Chart.js is optional at runtime (falls back to the table only).
   */
  function histogram(opts) {
    const { values, unit = '', binEdges, title, width = 560, height = 300 } = opts;
    const counts = binEdges.slice(0, -1).map((lo, i) => values.filter((v) => v >= lo && (i === binEdges.length - 2 ? v <= binEdges[i + 1] : v < binEdges[i + 1])).length);
    const labels = binEdges.slice(0, -1).map((lo, i) => `${lo}–${binEdges[i + 1]}`);
    const canvas = el('canvas', { width, height, role: 'img', 'aria-label': `${title}: ${values.length} values in ${unit}; ${labels.map((l, i) => `${counts[i]} in ${l}`).filter((_, i) => counts[i] > 0).join(', ')}` });
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    canvas.textContent = `${title}: see the data table.`;
    const sorted = values.slice().sort((a, b) => a - b);
    const freq = new Map(); sorted.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
    const tbl = table({
      caption: `${title}: values (${unit}), n = ${values.length}`, cls: 'data-table--compact',
      columns: [{ key: 'v', label: `Value (${unit})` }, { key: 'n', label: 'Count' }],
      rows: Array.from(freq.entries()).map(([v, n]) => ({ cells: { v: String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','), n: String(n) } })),
    });
    let chart = null;
    const color = getComputedStyle(document.body).getPropertyValue(opts.color || '--accent').trim() || '#7cc4ff';
    const gridColor = getComputedStyle(document.body).getPropertyValue('--line').trim() || '#2f3b4a';
    const textColor = getComputedStyle(document.body).getPropertyValue('--text-muted').trim() || '#aab7c5';
    if (window.Chart) {
      const markerPlugin = {
        id: 'markers',
        afterDatasetsDraw(ch) {
          const ms = ch.$markers || [];
          const { ctx, chartArea: ca, scales: { x } } = ch;
          ms.forEach((m) => {
            const px = x.getPixelForValue(m.x);
            if (!isFinite(px)) return;
            ctx.save();
            ctx.strokeStyle = m.color; ctx.lineWidth = 3; ctx.setLineDash(m.dash || []);
            ctx.beginPath(); ctx.moveTo(px, ca.top); ctx.lineTo(px, ca.bottom); ctx.stroke();
            ctx.fillStyle = m.color; ctx.font = `700 17px ${getComputedStyle(document.body).fontFamily}`;
            ctx.textAlign = m.align || 'left'; ctx.textBaseline = 'top';
            ctx.fillText(m.label, px + (m.align === 'right' ? -8 : 8), ca.top + (m.dy || 4));
            ctx.restore();
          });
        },
      };
      chart = new window.Chart(canvas, {
        type: 'bar',
        data: { labels: binEdges.slice(0, -1).map((lo, i) => (lo + binEdges[i + 1]) / 2), datasets: [{ label: title, data: counts.map((c, i) => ({ x: (binEdges[i] + binEdges[i + 1]) / 2, y: c })), backgroundColor: color, borderColor: color, borderWidth: 1, barPercentage: 1, categoryPercentage: 1 }] },
        options: {
          responsive: false, animation: opts.animate ? { duration: 500 } : false, parsing: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false }, title: { display: true, text: title, color: textColor, font: { size: 19, weight: '600' } } },
          scales: {
            x: { type: 'linear', min: binEdges[0], max: binEdges[binEdges.length - 1], offset: false, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 16 }, stepSize: opts.stepSize || 200, callback: (v) => `${v}` }, title: { display: true, text: `Response time (${unit})`, color: textColor, font: { size: 16 } } },
            y: { min: 0, max: opts.maxY || Math.max(...counts) + 2, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 16 }, stepSize: opts.yStep || 5 }, title: { display: true, text: 'Number of responses', color: textColor, font: { size: 16 } } },
          },
        },
        plugins: [markerPlugin],
      });
    }
    function update(markers) {
      if (!chart) return;
      chart.$markers = (markers || []).map((m) => Object.assign({}, m, { color: getComputedStyle(document.body).getPropertyValue(m.color || '--warn').trim() || '#ffd166' }));
      chart.update('none');
    }
    return { canvas, table: tbl, chart, update, counts, labels };
  }

  window.VC = { el, append, rich, s, svg, text, node, person, boundary, port, arrow, center, badge, markX, browser, field, status, chip, table, legend, histogram, withClass, SVG_NS };
})();
