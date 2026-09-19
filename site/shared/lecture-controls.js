/* =====================================================================
   Software Engineering course · lecture shell (window.lecture)

   Implements docs/scene-contract.md:
     pages        body[data-page-index], body[data-page-count], section[data-page][data-page-id]
                  [data-nav="next|prev|overview"], deep links weeks/week-NN.html#/<scene-id>
     scene root   [data-scene][data-state][data-state-count][data-running][data-condition][data-baseline]
     controls     button[data-control="step|back|replay|reset|run"], [data-control="condition"][data-condition-id]
                  [data-condition-label], input[type=range][data-control="slider"]
     pointer      data-cue-target="<scene-id>:<name>" on every control and element a pointer may operate
     modes        ?record=1 (fixed timing, no autoplay), ?motion=off (instant), ?print=1 (print panels,
                  html[data-print-ready="true"])
     interface    lecture.gotoScene, step, back, replay, reset, setCondition, state, activeWork, pages

   A week defines its deck with lecture.deck({...}); see site/weeks/week-01.js for the shape.
   Page navigation and scene state are separate control paths: Next/Prev change the page and
   nothing else; Step/Back/Replay/Reset change the demonstration on the page and never the page.
   ===================================================================== */
(function () {
  'use strict';

  const doc = document;
  const html = doc.documentElement;
  const VC = window.VC;
  const params = new URLSearchParams(location.search);
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MODE = {
    record: params.get('record') === '1',
    print: params.get('print') === '1',
    motion: !(params.get('motion') === 'off' || prefersReduced),
  };
  html.setAttribute('data-record', MODE.record ? 'true' : 'false');
  html.setAttribute('data-motion', MODE.motion ? 'on' : 'off');
  if (MODE.print) html.setAttribute('data-print-mode', 'true');

  const DECK_W = 1920, DECK_H = 1080;
  const STORAGE_KEY = 'se-course.letterShortcuts';

  // ------------------------------------------------------------------ small helpers
  const el = (tag, attrs, children) => VC.el(tag, attrs, children);
  const svgIcon = (d) => {
    const s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    const p = doc.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); s.appendChild(p);
    return s;
  };
  const ICON = {
    prev: 'M15 5l-7 7 7 7', next: 'M9 5l7 7-7 7', grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    help: 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01',
    back: 'M11 6l-6 6 6 6M19 12H6', step: 'M13 6l6 6-6 6M5 12h13',
    replay: 'M4 12a8 8 0 1 0 2.6-5.9M4 4v5h5', reset: 'M20 12a8 8 0 1 1-8-8M17 3l3 3-3 3M12 8v4l3 2',
    run: 'M7 5v14l11-7z', pause: 'M8 5v14M16 5v14',
  };

  /** "3" | "2-4" | "1,3,5-7" | "4-" ; inclusive; returns true when n is inside the spec. */
  function inSpec(spec, n) {
    if (spec == null || spec === '') return false;
    return String(spec).split(',').some((part) => {
      part = part.trim();
      if (!part) return false;
      const m = part.match(/^(\d+)?\s*-\s*(\d+)?$/);
      if (m) {
        const a = m[1] == null ? -Infinity : Number(m[1]);
        const b = m[2] == null ? Infinity : Number(m[2]);
        return n >= a && n <= b;
      }
      return Number(part) === n;
    });
  }

  function isEditable(target) {
    if (!target || target === doc.body) return false;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (target.isContentEditable) return true;
    return !!target.closest('[data-no-shortcuts]');
  }

  // ------------------------------------------------------------------ work registry (timers, animations, rAF)
  const work = new Set();
  function makeWorkApi(owner) {
    const own = new Set();
    const add = (item) => { item.owner = owner; work.add(item); own.add(item); return item; };
    const drop = (item) => { work.delete(item); own.delete(item); };
    return {
      timeout(fn, ms) {
        const item = { kind: 'timeout' };
        const id = setTimeout(() => { drop(item); fn(); }, ms);
        item.cancel = () => clearTimeout(id);
        return add(item);
      },
      interval(fn, ms) {
        const item = { kind: 'interval' };
        const id = setInterval(fn, ms);
        item.cancel = () => clearInterval(id);
        return add(item);
      },
      raf(fn) {
        const item = { kind: 'raf' };
        const id = requestAnimationFrame((t) => { drop(item); fn(t); });
        item.cancel = () => cancelAnimationFrame(id);
        return add(item);
      },
      animate(target, keyframes, options) {
        const anim = target.animate(keyframes, options);
        const item = { kind: 'animation', cancel: () => { try { anim.cancel(); } catch (e) { /* already done */ } } };
        add(item);
        anim.finished.then(() => drop(item), () => drop(item));
        return anim;
      },
      cancel(item) { if (item && own.has(item)) { item.cancel(); drop(item); } },
      cancelAll() { for (const item of Array.from(own)) { item.cancel(); drop(item); } },
      get size() { return own.size; },
    };
  }

  // ------------------------------------------------------------------ declarative reveal
  function applyReveal(root, state, conditionId) {
    root.setAttribute('data-state', String(state));
    root.setAttribute('data-condition', conditionId);
    root.querySelectorAll('[data-cond]').forEach((n) => {
      const ok = n.getAttribute('data-cond').split(',').map((s) => s.trim()).includes(conditionId);
      n.classList.toggle('is-cond-hidden', !ok);
      if (!ok) { n.setAttribute('hidden', ''); n.setAttribute('aria-hidden', 'true'); } else { n.removeAttribute('hidden'); n.removeAttribute('aria-hidden'); }
    });
    root.querySelectorAll('[data-show-from],[data-show-until],[data-show-at]').forEach((n) => {
      if (n.hasAttribute('hidden')) { n.classList.remove('is-shown'); return; }
      let shown;
      if (n.hasAttribute('data-show-at')) shown = inSpec(n.getAttribute('data-show-at'), state);
      else {
        const from = n.hasAttribute('data-show-from') ? Number(n.getAttribute('data-show-from')) : -Infinity;
        const until = n.hasAttribute('data-show-until') ? Number(n.getAttribute('data-show-until')) : Infinity;
        shown = state >= from && state <= until;
      }
      n.classList.toggle('is-shown', shown);
      if (n.hasAttribute('data-aria-hide')) n.setAttribute('aria-hidden', shown ? 'false' : 'true');
    });
    root.querySelectorAll('[data-focus-at]').forEach((n) => n.classList.toggle('is-focus', inSpec(n.getAttribute('data-focus-at'), state)));
    root.querySelectorAll('[data-dim-at]').forEach((n) => n.classList.toggle('is-dim', inSpec(n.getAttribute('data-dim-at'), state)));
  }

  // ------------------------------------------------------------------ scene instance (live or print)
  let instanceCounter = 0;
  class SceneInstance {
    constructor(def, mountEl, mode, controller) {
      this.def = def; this.mode = mode; this.controller = controller;
      this.n = ++instanceCounter;
      this.stage = el('div', { class: 'scene-stage', 'data-instance': String(this.n) });
      mountEl.appendChild(this.stage);
      this.work = makeWorkApi(def.id);
      const motion = mode === 'live' && MODE.motion;
      const self = this;
      this.api = {
        id: def.id, instance: this.n, mode, motion, record: MODE.record,
        fixtures: window.CAMPUS_ROOMS_FIXTURES || {},
        dur: (ms) => (motion ? ms : 0),
        uid: (name) => `${def.id}-${self.n}-${name}`,
        cue: (node, name) => { if (mode === 'live') node.setAttribute('data-cue-target', `${def.id}:${name}`); return node; },
        el, svg: VC.svg, timeout: (fn, ms) => self.work.timeout(fn, ms), interval: (fn, ms) => self.work.interval(fn, ms),
        raf: (fn) => self.work.raf(fn), animate: (t, k, o) => self.work.animate(t, k, o),
        step: () => controller && controller.step(), back: () => controller && controller.back(),
        setState: (i) => controller && controller.setState(i),
        get state() { return controller ? controller.state : 0; },
        get condition() { return controller ? controller.condition : def.conditions[0].id; },
        inSpec,
      };
      this.h = def.setup(this.stage, this.api) || {};
      this.ready = Promise.resolve(this.h.ready || null);
    }
    render(conditionId, state) {
      this.work.cancelAll();
      const cond = this.def.conditions.find((c) => c.id === conditionId) || this.def.conditions[0];
      const st = cond.states[state] || cond.states[0];
      const view = { condition: cond, conditionId: cond.id, state, stateObj: st, count: cond.states.length, last: state === cond.states.length - 1 };
      applyReveal(this.stage, state, cond.id);
      if (this.def.render) this.def.render(this.h, view, this.api);
      const svg = this.stage.querySelector('svg[role="img"]');
      if (svg && st && st.alt) svg.setAttribute('aria-label', st.alt);
    }
    destroy() { this.work.cancelAll(); }
  }

  // ------------------------------------------------------------------ scene controller (the live demonstration on a page)
  class Scene {
    constructor(def, root, deck) {
      this.def = def; this.root = root; this.deck = deck;
      this.conditions = def.conditions;
      this.baseline = (def.conditions.find((c) => c.baseline) || def.conditions[0]).id;
      this.condition = this.baseline;
      this.state = 0;
      this.running = false;
      this.runTimer = null;
      this.work = makeWorkApi(def.id);
      this.build();
      this.updateAttrs();
    }

    get cond() { return this.conditions.find((c) => c.id === this.condition) || this.conditions[0]; }
    get count() { return this.cond.states.length; }
    get stateObj() { return this.cond.states[this.state] || this.cond.states[0]; }

    build() {
      const d = this.def, id = d.id;
      const cue = (node, name) => { node.setAttribute('data-cue-target', `${id}:${name}`); return node; };
      const live = el('div', { class: `scene-live${d.layout === 'wide' ? ' scene--wide' : ''}` });
      this.root.appendChild(live);
      // head
      const head = el('div', { class: 'page-head' }, [
        el('h2', { class: 'page-title', id: `h-${id}` }, d.heading),
        d.lead ? el('p', { class: 'page-lead' }, d.lead) : null,
      ]);
      live.appendChild(head);
      // controls
      const btn = (name, label, icon, extra) => {
        const b = el('button', { type: 'button', class: `ctl-btn ctl-btn--${name}`, 'data-control': name, 'aria-label': label }, [svgIcon(ICON[icon || name]), el('span', {}, extra || label)]);
        return cue(b, name);
      };
      this.btnBack = btn('back', 'Back one step', 'back', 'Back');
      this.btnStep = btn('step', 'Step forward', 'step', 'Step');
      this.btnReplay = btn('replay', 'Replay this condition from its first step', 'replay', 'Replay');
      this.btnReset = btn('reset', 'Reset to the baseline condition and first step', 'reset', 'Reset');
      this.progress = el('span', { class: 'ctl-progress', 'aria-hidden': 'true' });
      this.progressText = el('span', { class: 'visually-hidden' });
      const row1 = el('div', { class: 'ctl-row' }, [this.btnBack, this.btnStep, this.btnReplay, this.btnReset, this.progressText]);
      if (d.run) {
        this.btnRun = btn('run', 'Run or pause the model', 'run', 'Run');
        this.btnRun.setAttribute('aria-pressed', 'false');
        row1.insertBefore(this.btnRun, this.btnReplay);
      }
      const presets = el('div', { class: 'ctl-presets', role: 'group', 'aria-label': 'Condition presets' });
      this.presetButtons = {};
      for (const c of this.conditions) {
        const b = el('button', { type: 'button', class: 'preset-btn', 'data-control': 'condition', 'data-condition-id': c.id, 'aria-pressed': c.id === this.condition ? 'true' : 'false', 'aria-label': `Condition: ${c.label}` }, c.short || c.label);
        cue(b, `condition-${c.id}`);
        b.addEventListener('click', () => this.setCondition(c.id));
        this.presetButtons[c.id] = b;
        presets.appendChild(b);
      }
      const controls = el('div', { class: 'scene-controls', role: 'group', 'aria-label': `Scene controls for ${d.heading}` }, [row1]);
      live.appendChild(controls);
      // stage
      const stageWrap = el('div', { class: 'scene-stage-wrap' });
      stageWrap.style.cssText = 'grid-column:1;grid-row:2;position:relative;min-width:0;min-height:0;';
      if (d.layout === 'wide') stageWrap.style.cssText = 'grid-column:1 / -1;grid-row:3;position:relative;min-width:0;min-height:0;';
      live.appendChild(stageWrap);
      this.instance = new SceneInstance(d, stageWrap, 'live', this);
      this.instance.stage.style.cssText = 'position:absolute;inset:0;';
      // rail
      this.condLabel = el('p', { class: 'condition-label', 'data-condition-label': '' });
      const railCondition = el('div', { class: 'rail-card rail-condition' }, [el('div', { class: 'rail-eyebrow' }, 'Condition'), presets, this.condLabel]);
      this.promptQ = el('p', { class: 'prompt-q' });
      this.promptOpts = el('ul', { class: 'prompt-options' });
      this.railPrompt = cue(el('div', { class: 'rail-card rail-prompt', hidden: '' }, [el('div', { class: 'rail-eyebrow' }, 'Decide before the reveal'), this.promptQ, this.promptOpts]), 'prompt');
      this.captionText = el('p', { class: 'caption-text' });
      this.captionCount = el('span', { class: 'eyebrow-count' });
      this.railCaption = cue(el('div', { class: 'rail-card rail-caption' }, [el('div', { class: 'rail-eyebrow' }, [el('span', {}, 'What is happening'), this.progress, this.captionCount]), el('div', { 'aria-live': 'polite' }, this.captionText)]), 'caption');
      this.principleText = el('p', { class: 'principle-text' }, d.principle || '');
      const principleShort = d.principleShort ? el('p', { class: 'principle-short' }, [el('span', { class: 'ps-label' }, 'In short'), d.principleShort]) : null;
      this.railPrinciple = cue(el('div', { class: 'rail-card rail-principle', hidden: '' }, [el('div', { class: 'rail-eyebrow' }, 'Principle'), this.principleText, principleShort]), 'principle');
      this.railNote = el('p', { class: 'rail-note', hidden: '' });
      const rail = el('div', { class: 'scene-rail' }, [railCondition, this.railPrompt, this.railCaption, this.railPrinciple, this.railNote]);
      live.appendChild(rail);
      // print container (filled by the deck in print mode)
      this.printMount = el('div', { class: 'scene-print' });
      this.root.appendChild(this.printMount);
      // wiring
      this.btnStep.addEventListener('click', () => this.step());
      this.btnBack.addEventListener('click', () => this.back());
      this.btnReplay.addEventListener('click', () => this.replay());
      this.btnReset.addEventListener('click', () => this.reset());
      if (this.btnRun) this.btnRun.addEventListener('click', () => this.toggleRun());
      this.render();
    }

    // -- control semantics -------------------------------------------------
    step() { if (this.state < this.count - 1) { this.state += 1; this.render(); } else if (this.running) { this.stopRun(); } }
    back() { if (this.state > 0) { this.stopRun(); this.state -= 1; this.render(); } }
    setState(i) { const n = Math.max(0, Math.min(this.count - 1, i | 0)); if (n !== this.state) { this.state = n; this.render(); } }
    replay() { this.stopRun(); this.state = 0; this.render(); }
    reset() { this.stopRun(); this.condition = this.baseline; this.state = 0; this.render(); }
    setCondition(id) {
      if (!this.conditions.some((c) => c.id === id)) return;
      this.stopRun(); this.condition = id; this.state = 0; this.render();
    }
    toggleRun() { if (this.running) this.stopRun(); else this.startRun(); }
    startRun() {
      if (this.running || !this.def.run) return;
      if (this.state >= this.count - 1) { this.state = 0; }
      this.running = true;
      const ms = this.def.run.intervalMs || 1200;
      this.runTimer = this.work.interval(() => {
        if (this.state < this.count - 1) { this.state += 1; this.render(); } else { this.stopRun(); }
      }, MODE.motion ? ms : Math.min(ms, 300));
      this.render();
    }
    stopRun() {
      if (this.runTimer) { this.work.cancel(this.runTimer); this.runTimer = null; }
      if (this.running) { this.running = false; this.updateAttrs(); }
    }
    enter() { this.reset(); }
    leave() { this.stopRun(); this.work.cancelAll(); this.instance.work.cancelAll(); }

    // -- rendering ---------------------------------------------------------
    updateAttrs() {
      const r = this.root;
      r.setAttribute('data-state', String(this.state));
      r.setAttribute('data-state-count', String(this.count));
      r.setAttribute('data-running', this.running ? 'true' : 'false');
      r.setAttribute('data-condition', this.condition);
      r.setAttribute('data-baseline', this.condition === this.baseline ? 'true' : 'false');
      if (this.btnRun) { this.btnRun.setAttribute('aria-pressed', this.running ? 'true' : 'false'); this.btnRun.lastChild.textContent = this.running ? 'Pause' : 'Run'; this.btnRun.replaceChild(svgIcon(this.running ? ICON.pause : ICON.run), this.btnRun.firstChild); }
    }
    render() {
      const c = this.cond, s = this.stateObj, last = this.state === this.count - 1;
      this.updateAttrs();
      this.btnStep.setAttribute('aria-disabled', last ? 'true' : 'false');
      this.btnBack.setAttribute('aria-disabled', this.state === 0 ? 'true' : 'false');
      for (const [id, b] of Object.entries(this.presetButtons)) b.setAttribute('aria-pressed', id === this.condition ? 'true' : 'false');
      this.condLabel.textContent = c.label;
      // progress dots
      this.progress.replaceChildren(...c.states.map((_, i) => el('span', { class: `dot${i < this.state ? ' is-done' : ''}${i === this.state ? ' is-now' : ''}` })));
      this.captionCount.textContent = `${this.state + 1} of ${this.count}`;
      this.progressText.textContent = `State ${this.state + 1} of ${this.count}`;
      // rail
      if (s.prompt) {
        this.promptQ.textContent = s.prompt.question;
        this.promptOpts.replaceChildren(...s.prompt.options.map((o, i) => {
          const li = el('li', {}, [el('span', { class: 'opt-key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)), el('span', {}, o)]);
          li.setAttribute('data-cue-target', `${this.def.id}:option-${i + 1}`);
          return li;
        }));
        this.railPrompt.removeAttribute('hidden');
      } else this.railPrompt.setAttribute('hidden', '');
      this.captionText.replaceChildren(...VC.rich(s.caption || ''));
      if (s.principle) this.railPrinciple.removeAttribute('hidden'); else this.railPrinciple.setAttribute('hidden', '');
      if (s.note) { this.railNote.textContent = s.note; this.railNote.removeAttribute('hidden'); } else this.railNote.setAttribute('hidden', '');
      this.instance.render(this.condition, this.state);
    }
  }

  // ------------------------------------------------------------------ deck
  const deck = {
    def: null, pages: [], scenes: {}, index: 0, letterShortcuts: true,
  };

  function pageIndexFromHash() {
    const m = location.hash.match(/^#\/?([a-z0-9-]+)/i);
    if (!m) return 0;
    const id = m[1];
    const i = deck.pages.findIndex((p) => p.id === id);
    return i >= 0 ? i : 0;
  }

  function gotoPage(i, opts = {}) {
    if (MODE.print) return;
    i = Math.max(0, Math.min(deck.pages.length - 1, i));
    const prev = deck.pages[deck.index];
    const next = deck.pages[i];
    if (prev && prev !== next) {
      if (prev.scene) prev.scene.leave();
      if (prev.def.onLeave) prev.def.onLeave(prev.bodyEl, prev.api);
      prev.el.setAttribute('hidden', '');
    }
    deck.index = i;
    next.el.removeAttribute('hidden');
    doc.body.setAttribute('data-page-index', String(i));
    if (next.scene) next.scene.enter();
    else if (next.def.onEnter) next.def.onEnter(next.bodyEl, next.api);
    // header
    deck.positionEl.textContent = `Page ${i + 1} of ${deck.pages.length}`;
    const role = next.def.kind === 'scene' ? next.def.scene.role : 'page';
    deck.roleChip.textContent = role === 'anchor' ? 'Anchor' : role === 'bridge' ? 'Bridge' : '';
    deck.roleChip.className = `role-chip role-chip--${role}`;
    deck.roleChip.hidden = role === 'page';
    deck.refEl.textContent = `${deck.def.file}#/${next.id}`;
    deck.progressEl.style.width = `${((i + 1) / deck.pages.length) * 100}%`;
    if (!opts.fromHash) history.replaceState(null, '', `#/${next.id}`);
    else if (location.hash !== `#/${next.id}`) history.replaceState(null, '', `#/${next.id}`);
    doc.title = `${deck.def.shortTitle} · ${next.def.kind === 'scene' ? next.def.scene.heading : next.def.heading}`;
  }

  function currentScene() { const p = deck.pages[deck.index]; return p && p.scene ? p.scene : null; }

  function fit() {
    if (MODE.print) return;
    const s = Math.min(window.innerWidth / DECK_W, window.innerHeight / DECK_H);
    html.style.setProperty('--deck-scale', String(s));
  }

  // -- dialogs -----------------------------------------------------------
  function buildDialogs(root) {
    const closeBtn = (dlg) => { const b = el('button', { type: 'button', class: 'nav-btn dialog-close', 'aria-label': 'Close' }, '×'); b.addEventListener('click', () => dlg.close()); return b; };
    // overview
    const ov = el('dialog', { class: 'deck-dialog', 'aria-labelledby': 'overview-title' });
    const list = el('ul', { class: 'overview-list' });
    deck.pages.forEach((p, i) => {
      const role = p.def.kind === 'scene' ? p.def.scene.role : 'page';
      const a = el('a', { href: `#/${p.id}`, class: 'overview-link' }, [
        el('span', { class: 'num' }, String(i + 1).padStart(2, '0')),
        el('span', {}, p.def.kind === 'scene' ? p.def.scene.heading : p.def.heading),
        el('span', { class: 'id' }, role === 'page' ? '' : `${role} · ${p.id}`),
      ]);
      a.addEventListener('click', (e) => { e.preventDefault(); ov.close(); gotoPage(i); });
      list.appendChild(el('li', {}, a));
    });
    ov.append(closeBtn(ov), el('h2', { id: 'overview-title' }, 'Pages in this lecture'), list);
    // help
    const hp = el('dialog', { class: 'deck-dialog', 'aria-labelledby': 'help-title' });
    const rows = [
      ['Next page / previous page', 'Right arrow or Page Down · Left arrow or Page Up (also the ▶ and ◀ buttons)'],
      ['First page / last page', 'Home · End'],
      ['Step forward / back one step in the scene', 'Down arrow · Up arrow (also the Step and Back buttons)'],
      ['Replay the selected condition', 'r  (letter shortcut)'],
      ['Reset to the baseline condition', 'Shift + R  (letter shortcut)'],
      ['Page overview / this help', 'o · ?  (letter shortcuts)'],
      ['Close a dialog', 'Escape'],
    ];
    const table = el('table', { class: 'help-table' }, [el('tbody', {}, rows.map((r) => el('tr', {}, [el('th', { scope: 'row' }, r[0]), el('td', {}, r[1])])))]);
    const chk = el('input', { type: 'checkbox', id: 'letter-shortcuts' });
    chk.checked = deck.letterShortcuts;
    chk.addEventListener('change', () => { deck.letterShortcuts = chk.checked; try { localStorage.setItem(STORAGE_KEY, chk.checked ? 'on' : 'off'); } catch (e) { /* storage unavailable */ } });
    hp.append(closeBtn(hp), el('h2', { id: 'help-title' }, 'Keyboard'), table,
      el('div', { class: 'setting-row' }, [chk, el('label', { for: 'letter-shortcuts' }, 'Letter shortcuts on (r, Shift+R, o, ?). Arrow keys keep working inside text fields and sliders; letter keys are ignored there too.')]),
      el('p', { class: 'small muted', style: 'margin-top:14px' }, `Deep links: ${deck.def.file}#/<scene-id> opens a scene at its baseline, paused. Query modes: ?motion=off instant states, ?print=1 print view.`));
    root.append(ov, hp);
    deck.overviewDialog = ov; deck.helpDialog = hp;
  }

  function anyDialogOpen() { return !!doc.querySelector('dialog[open]'); }

  // -- keyboard ------------------------------------------------------------
  function onKey(e) {
    if (MODE.print) return;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (anyDialogOpen()) return; // dialogs handle Escape natively
    if (isEditable(e.target)) return;
    const scene = currentScene();
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': e.preventDefault(); gotoPage(deck.index + 1); return;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); gotoPage(deck.index - 1); return;
      case 'Home': e.preventDefault(); gotoPage(0); return;
      case 'End': e.preventDefault(); gotoPage(deck.pages.length - 1); return;
      case 'ArrowDown': if (scene) { e.preventDefault(); scene.step(); } return;
      case 'ArrowUp': if (scene) { e.preventDefault(); scene.back(); } return;
      default: break;
    }
    if (!deck.letterShortcuts) return;
    if (e.key === 'r' && scene) { e.preventDefault(); scene.replay(); }
    else if (e.key === 'R' && scene) { e.preventDefault(); scene.reset(); }
    else if (e.key === 'o') { e.preventDefault(); deck.overviewDialog.showModal(); }
    else if (e.key === '?') { e.preventDefault(); deck.helpDialog.showModal(); }
  }

  // -- print view ------------------------------------------------------------
  function buildPrint() {
    doc.body.setAttribute('data-print', 'true');
    const d = deck.def;
    const weekLabel = `Week ${String(d.week).padStart(2, '0')}`;
    const foot = (left, right) => el('div', { class: 'print-foot' }, [el('span', {}, left), el('span', {}, right)]);
    let pageNo = 0;
    const sheet = (cls, children, refText, roleText) => {
      pageNo += 1;
      const s = el('section', { class: `print-page ${cls || ''}` }, children);
      s.appendChild(foot(`${weekLabel} · ${d.file} · ${refText || ''}`, `${roleText ? roleText + ' · ' : ''}page ${pageNo}`));
      return s;
    };
    const head = (title, role) => el('div', { class: 'print-head' }, [
      el('div', {}, [el('div', { class: 'ph-week' }, `${weekLabel} · ${d.title}`), el('div', { class: 'ph-title' }, title)]),
      el('div', { class: 'ph-role' }, role || ''),
    ]);
    // cover with the scene overview
    const scenes = deck.pages.filter((p) => p.def.kind === 'scene');
    const toc = el('table', { class: 'print-toc' }, [
      el('thead', {}, el('tr', {}, ['#', 'Scene (student heading)', 'Role', 'Deep link'].map((t) => el('th', { scope: 'col' }, t)))),
      el('tbody', {}, scenes.map((p, i) => el('tr', {}, [
        el('td', {}, String(i + 1).padStart(2, '0')), el('td', {}, p.def.scene.heading), el('td', {}, p.def.scene.role === 'anchor' ? 'Anchor' : 'Bridge'),
        el('td', { class: 'id' }, `${d.file}#/${p.id}`),
      ]))),
    ]);
    const cover = sheet('print-cover', [
      head('Student notes', 'Cover'),
      el('div', { class: 'pc-question' }, d.question),
      el('p', { class: 'pc-lead' }, d.coverLead || ''),
      el('h3', { style: 'font-size:15px;margin:6px 0' }, 'Scenes in this lecture'),
      toc,
      el('p', { class: 'small', style: 'margin-top:12px;font-size:13px;color:var(--text-muted)' }, d.coverNote || ''),
    ], 'cover', 'Cover');
    deck.pagesEl.insertBefore(cover, deck.pagesEl.firstChild);
    const readiness = [];
    for (const p of deck.pages) {
      p.el.removeAttribute('hidden');
      if (p.def.kind === 'scene') {
        const s = p.scene, def = p.def.scene;
        const panels = def.print && def.print.length ? def.print : [{ title: 'Final state', condition: s.baseline, state: s.count - 1 }];
        panels.forEach((pn, k) => {
          const cond = def.conditions.find((c) => c.id === (pn.condition || s.baseline)) || def.conditions[0];
          const stateIdx = Math.min(cond.states.length - 1, pn.state == null ? cond.states.length - 1 : pn.state);
          const st = cond.states[stateIdx];
          const inner = el('div', { class: 'print-stage-inner' });
          const design = def.layout === 'wide' ? { w: 1824, h: 496 } : { w: 1264, h: 680 };
          inner.style.width = `${design.w}px`; inner.style.height = `${design.h}px`;
          const zoom = Math.min(1000 / design.w, (pn.maxHeight || 470) / design.h);
          inner.style.setProperty('--print-zoom', zoom.toFixed(3));
          const stage = el('div', { class: 'print-stage' }, inner);
          const inst = new SceneInstance(def, inner, 'print', null);
          inst.stage.style.cssText = 'position:absolute;inset:0;';
          inst.render(cond.id, stateIdx);
          readiness.push(inst.ready);
          const children = [
            head(def.heading, def.role === 'anchor' ? 'Anchor scene' : 'Bridge scene'),
            el('div', { class: 'print-panel-title' }, `Panel ${k + 1} of ${panels.length} · ${pn.title}`),
            el('div', { class: 'print-meta' }, [el('span', { class: 'pm-condition' }, el('b', {}, cond.label)), el('span', { class: 'pm-state' }, el('b', {}, `${stateIdx + 1} of ${cond.states.length}`))]),
          ];
          if (st.prompt && pn.showPrompt !== false) children.push(el('p', { class: 'print-prompt' }, [el('b', {}, 'Decide first: '), st.prompt.question + ' ', ...st.prompt.options.map((o, i) => el('span', {}, ` (${String.fromCharCode(65 + i)}) ${o}`))]));
          if (st.caption && pn.showCaption !== false) children.push(el('p', { class: 'print-caption' }, VC.rich(pn.caption || st.caption)));
          children.push(stage);
          if (pn.note) children.push(el('p', { class: 'print-note' }, pn.note));
          if (pn.principle || (st.principle && pn.principle !== false)) {
            children.push(el('p', { class: 'print-principle' }, def.principle));
            if (def.principleShort) children.push(el('p', { class: 'print-principle-short' }, def.principleShort));
          }
          const article = sheet('print-panel', children, `#/${p.id}`, def.role === 'anchor' ? 'Anchor' : 'Bridge');
          article.setAttribute('data-print-panel', '');
          article.setAttribute('data-print-condition', cond.id);
          article.setAttribute('data-print-state', String(stateIdx));
          s.printMount.appendChild(article);
        });
      } else {
        const printEl = el('div', { class: 'page-print' });
        const body = el('div', { class: 'print-body' });
        if (p.def.print) p.def.print(body, p.api);
        else body.appendChild(p.bodyEl.cloneNode(true));
        const s = sheet('', [head(p.def.heading, p.def.printRole || ''), p.def.lead ? el('p', { class: 'print-caption' }, p.def.lead) : null, body], `#/${p.id}`, 'Page');
        printEl.appendChild(s);
        p.el.appendChild(printEl);
      }
    }
    Promise.all(readiness).then(() => (doc.fonts && doc.fonts.ready) || Promise.resolve()).then(() => {
      requestAnimationFrame(() => { fitPrintSheets(); requestAnimationFrame(() => { html.setAttribute('data-print-ready', 'true'); }); });
    });
  }

  /** Scale the stage or the text body of any sheet that would overflow one printed page (A4 landscape minus margins). */
  function fitPrintSheets() {
    const BUDGET = 690;
    doc.querySelectorAll('.print-page').forEach((sheet) => {
      const target = sheet.querySelector('.print-stage-inner') || sheet.querySelector('.print-body');
      if (!target) return;
      for (let i = 0; i < 6; i += 1) {
        const over = sheet.scrollHeight - BUDGET;
        if (over <= 0) break;
        const box = target.getBoundingClientRect().height;
        if (!box) break;
        const current = parseFloat(getComputedStyle(target).zoom) || 1;
        const next = Math.max(0.35, current * ((box - over - 6) / box));
        target.style.zoom = next.toFixed(3);
        if (target.classList.contains('print-stage-inner')) target.style.setProperty('--print-zoom', next.toFixed(3));
      }
    });
  }

  // -- deck construction ---------------------------------------------------------
  function buildDeck(def) {
    deck.def = def;
    def.shortTitle = def.shortTitle || `Week ${String(def.week).padStart(2, '0')}`;
    try { deck.letterShortcuts = localStorage.getItem(STORAGE_KEY) !== 'off'; } catch (e) { deck.letterShortcuts = true; }
    doc.title = `${def.shortTitle} · ${def.title}`;
    const root = el('div', { class: 'deck' });
    // header
    const navBtn = (name, label, icon) => el('button', { type: 'button', class: 'nav-btn', 'data-nav': name, 'aria-label': label, 'data-cue-target': `deck:${name}` }, svgIcon(ICON[icon]));
    deck.positionEl = el('span', { class: 'deck-position' });
    deck.roleChip = el('span', { class: 'role-chip', hidden: '' });
    deck.refEl = el('span', { class: 'deck-ref' });
    const header = el('header', { class: 'deck-header' }, [
      el('div', { class: 'deck-identity' }, [el('span', { class: 'deck-week' }, def.shortTitle), el('span', { class: 'deck-title' }, def.title)]),
      deck.refEl,
      el('nav', { class: 'deck-nav', 'aria-label': 'Lecture pages' }, [deck.positionEl, deck.roleChip, navBtn('prev', 'Previous page', 'prev'), navBtn('next', 'Next page', 'next'), navBtn('overview', 'Page overview', 'grid'), navBtn('help', 'Keyboard help', 'help')]),
    ]);
    root.appendChild(header);
    const h1 = el('h1', { class: 'visually-hidden' }, `${def.shortTitle}: ${def.title}. ${def.question}`);
    root.appendChild(h1);
    deck.pagesEl = el('main', { class: 'deck-pages', id: 'deck-main' });
    root.appendChild(deck.pagesEl);
    const skip = el('a', { class: 'skip-link', href: '#deck-main' }, 'Skip to the current page');
    doc.body.prepend(skip);
    // pages
    def.pages.forEach((pdef, i) => {
      const id = pdef.kind === 'scene' ? pdef.scene.id : pdef.id;
      const section = el('section', { class: 'page', 'data-page': '', 'data-page-id': id, hidden: '', 'aria-labelledby': `h-${id}` });
      const page = { id, def: pdef, el: section, index: i };
      if (pdef.kind === 'scene') {
        section.setAttribute('data-scene-id', pdef.scene.id);
        section.setAttribute('data-scene-role', pdef.scene.role);
        const sroot = el('div', { class: 'scene', 'data-scene': pdef.scene.id });
        section.appendChild(sroot);
        page.scene = new Scene(pdef.scene, sroot, deck);
        deck.scenes[pdef.scene.id] = page.scene;
      } else {
        const live = el('div', { class: 'page-live', style: 'display:contents' });
        const head = el('div', { class: 'page-head' }, [el('h2', { class: 'page-title', id: `h-${id}` }, pdef.heading), pdef.lead ? el('p', { class: 'page-lead' }, pdef.lead) : null]);
        const body = el('div', { class: 'page-body' });
        const foot = el('div', { class: 'page-foot' }, el('span', { class: 'wordmark' }, def.wordmark || 'Campus Rooms · Software Engineering'));
        live.append(head, body, foot);
        section.appendChild(live);
        page.bodyEl = body;
        const pageWork = makeWorkApi(id);
        page.api = {
          id, el, svg: VC.svg, fixtures: window.CAMPUS_ROOMS_FIXTURES || {}, motion: MODE.motion && !MODE.print, record: MODE.record,
          dur: (ms) => (MODE.motion && !MODE.print ? ms : 0), cue: (node, name) => { node.setAttribute('data-cue-target', `${id}:${name}`); return node; },
          timeout: (fn, ms) => pageWork.timeout(fn, ms), animate: (t, k, o) => pageWork.animate(t, k, o), raf: (fn) => pageWork.raf(fn), inSpec,
          gotoPage: (n) => gotoPage(n),
        };
        page.work = pageWork;
        if (pdef.build) pdef.build(body, page.api);
      }
      deck.pages.push(page);
      deck.pagesEl.appendChild(section);
    });
    // progress
    deck.progressEl = el('div', { class: 'deck-progress' });
    root.appendChild(el('div', { class: 'deck-progress-track', 'aria-hidden': 'true' }, deck.progressEl));
    doc.body.appendChild(root);
    doc.body.setAttribute('data-page-count', String(deck.pages.length));
    buildDialogs(root);
    root.querySelector('[data-nav="prev"]').addEventListener('click', () => gotoPage(deck.index - 1));
    root.querySelector('[data-nav="next"]').addEventListener('click', () => gotoPage(deck.index + 1));
    root.querySelector('[data-nav="overview"]').addEventListener('click', () => deck.overviewDialog.showModal());
    root.querySelector('[data-nav="help"]').addEventListener('click', () => deck.helpDialog.showModal());
    if (MODE.print) { buildPrint(); return; }
    doc.addEventListener('keydown', onKey);
    window.addEventListener('resize', fit);
    window.addEventListener('hashchange', () => gotoPage(pageIndexFromHash(), { fromHash: true }));
    fit();
    deck.pages.forEach((p) => p.el.setAttribute('hidden', ''));
    deck.index = -1;
    gotoPage(pageIndexFromHash(), { fromHash: true });
  }

  // ------------------------------------------------------------------ public interface
  window.lecture = {
    mode: MODE,
    deck: buildDeck,
    gotoScene(id) { const i = deck.pages.findIndex((p) => p.id === id); if (i >= 0) gotoPage(i); },
    gotoPage,
    step() { const s = currentScene(); if (s) s.step(); },
    back() { const s = currentScene(); if (s) s.back(); },
    replay() { const s = currentScene(); if (s) s.replay(); },
    reset() { const s = currentScene(); if (s) s.reset(); },
    setCondition(presetId) { const s = currentScene(); if (s) s.setCondition(presetId); },
    state(sceneId) {
      const s = sceneId ? deck.scenes[sceneId] : currentScene();
      if (!s) return null;
      return { state: s.state, count: s.count, running: s.running, condition: s.condition, baseline: s.condition === s.baseline };
    },
    activeWork() { return work.size; },
    pages() { return deck.pages.map((p) => ({ id: p.id, kind: p.def.kind, role: p.def.kind === 'scene' ? p.def.scene.role : 'page', heading: p.def.kind === 'scene' ? p.def.scene.heading : p.def.heading })); },
    currentPage() { return deck.index; },
    inSpec,
  };
})();
