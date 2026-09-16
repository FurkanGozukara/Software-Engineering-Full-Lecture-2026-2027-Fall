/* =====================================================================
   Week 01 · Engineering software that people can depend on
   Central question: What makes working code an engineered system?

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
  const { el, s, text, node, person, boundary, arrow, badge, markX, browser, field, status, chip, table } = window.VC;
  const CASE = F.case;
  const ARI = CASE.users[0];   // U-01 Ari
  const BO = CASE.users[1];    // U-02 Bo
  const TC = A['w01/two-confirmations'];
  const REQ = TC.requests[0];   // room C101, 10:00–11:00
  const ROOM = REQ.room, START = REQ.start, END = REQ.end;
  const ROOM2 = CASE.rooms[1];  // C202
  const SLOT = `${START}–${END}`;
  const FILE = 'week-01.html';

  // ------------------------------------------------------------------ helpers shared by the scenes
  function deckScale() {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--deck-scale'));
    return isFinite(v) && v > 0 ? v : 1;
  }
  /** Fly a small chip from one element to another inside the stage (decorative; the end state is set by render). */
  function flyToken(api, stage, fromEl, toEl, label, kind) {
    if (!api.motion || !fromEl || !toEl) return;
    const sc = deckScale();
    const sr = stage.getBoundingClientRect(), a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    if (!sr.width) return;
    const token = chip(label, kind || 'accent', { 'aria-hidden': 'true' });
    token.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;z-index:5;will-change:transform;';
    stage.appendChild(token);
    const x0 = (a.left + a.width / 2 - sr.left) / sc, y0 = (a.top + a.height / 2 - sr.top) / sc;
    const x1 = (b.left + b.width / 2 - sr.left) / sc, y1 = (b.top + b.height / 2 - sr.top) / sc;
    const anim = api.animate(token, [
      { transform: `translate(${x0}px, ${y0}px) translate(-50%, -50%) scale(0.9)`, opacity: 0 },
      { transform: `translate(${x0}px, ${y0}px) translate(-50%, -50%) scale(1)`, opacity: 1, offset: 0.15 },
      { transform: `translate(${x1}px, ${y1}px) translate(-50%, -50%) scale(1)`, opacity: 1, offset: 0.85 },
      { transform: `translate(${x1}px, ${y1}px) translate(-50%, -50%) scale(0.8)`, opacity: 0 },
    ], { duration: api.dur(900), easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
    anim.finished.then(() => token.remove(), () => token.remove());
  }
  const reveal = (attrs) => Object.assign({ class: 'rv rv--rise' }, attrs);
  function personSvg(x, y, name, cls) { return person({ x, y, name, cls }); }
  function kbd(k) { return el('kbd', { class: 'kbd' }, k); }
  function wrapText(str, width) {
    const words = str.split(' '); const lines = [''];
    words.forEach((w) => { if ((lines[lines.length - 1] + ' ' + w).trim().length > width) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim(); });
    return lines;
  }
  const lower1 = (str) => str.charAt(0).toLowerCase() + str.slice(1);
  const upper1 = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  // =====================================================================
  // PAGE · opening situation
  // =====================================================================
  const opening = {
    kind: 'page', id: 'opening', role: 'page',
    heading: 'The screen says Confirmed. Is that enough?',
    lead: 'Campus Rooms is a fictional service that reserves campus rooms. Every name, number and incident in this course is a teaching example.',
    printRole: 'Opening situation',
    build(body, api) {
      body.setAttribute('data-state', '0');
      const reserve = api.cue(el('button', { type: 'button', class: 'btn-reserve' }, 'Reserve'), 'reserve');
      const ok = status('ok', `Confirmed: ${ROOM}, ${SLOT}`, 'Your booking is saved. A confirmation message is on its way.', reveal({ 'data-show-from': '1' }));
      const win = browser({ who: `${ARI.name} · ${ARI.id}`, label: `Booking screen of ${ARI.name}`, body: [
        field('Room', ROOM), field('Date', 'today'), field('Time', SLOT), reserve, ok,
      ] });
      win.style.cssText = 'width:560px;align-self:start;';
      const q = el('div', reveal({ class: 'rail-card rail-prompt rv rv--rise', 'data-show-from': '1', style: 'align-self:start;max-width:640px' }), [
        el('div', { class: 'rail-eyebrow' }, 'The question of this week'),
        el('p', { class: 'prompt-q' }, 'What would you need to see before you trust this message?'),
        el('ul', { class: 'prompt-options' }, ['The green tick and the word Confirmed', 'The stored calendar for the room', 'What happens at the door at 10:00'].map((o, i) => el('li', {}, [el('span', { class: 'opt-key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)), el('span', {}, o)]))),
        el('p', { class: 'rail-note', style: 'margin-top:12px' }, 'Keep your answer. The first scene tests it.'),
      ]);
      api.cue(q, 'question');
      const wrap = el('div', { style: 'display:grid;grid-template-columns:560px 1fr;gap:48px;align-items:start;height:100%' }, [win, q]);
      body.appendChild(wrap);
      const apply = () => {
        const st = Number(body.getAttribute('data-state'));
        ok.classList.toggle('is-shown', st >= 1); q.classList.toggle('is-shown', st >= 1);
        reserve.setAttribute('aria-disabled', st >= 1 ? 'true' : 'false');
      };
      reserve.addEventListener('click', () => { if (body.getAttribute('data-state') === '0') { body.setAttribute('data-state', '1'); apply(); } });
      body.reset = () => { body.setAttribute('data-state', '0'); apply(); };
      apply();
    },
    onEnter(body) { body.reset(); },
    cues: [
      { cue: 'reserve', target: 'reserve', action: 'click', expect: 1, seconds: 12, teaches: 'Ari reserves C101 for 10:00 to 11:00 and the screen answers Confirmed' },
      { cue: 'question', target: 'question', action: 'hover', expect: 1, seconds: 8, teaches: 'The question of the week: what would you need to see before trusting the message' },
    ],
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('h3', {}, 'The situation'),
          el('p', {}, `${ARI.name} (${ARI.id}) reserves room ${ROOM} for ${SLOT}. The screen answers: Confirmed: ${ROOM}, ${SLOT}. Your booking is saved. A confirmation message is on its way.`),
          el('h3', {}, 'The question of this week'),
          el('p', {}, 'What would you need to see before you trust this message? (A) The green tick and the word Confirmed. (B) The stored calendar for the room. (C) What happens at the door at 10:00.'),
        ]),
        el('div', {}, [
          el('h3', {}, 'About the examples'),
          el('p', {}, 'Campus Rooms is a fictional room-booking service. Every name, number and incident in this course is a teaching example unless a source is named on the page. Room C101 and the 10:00 to 11:00 hour recur through the whole course.'),
        ]),
      ]));
    },
  };

  // =====================================================================
  // PAGE · recall and outcomes
  // =====================================================================
  const OUTCOMES = [
    'Tell a function that runs correctly on its own apart from a service that people can depend on.',
    'Name the stakeholders, the system boundary and the competing quality concerns of a service.',
    'Explain why delivery and maintenance belong inside the engineering lifecycle.',
    'Separate what you observed, what you assumed and what a check showed.',
    'Explain one technical decision by its benefit, its cost and the people it affects.',
  ];
  const outcomes = {
    kind: 'page', id: 'outcomes', role: 'page',
    heading: 'What you already know, and where this lecture goes',
    lead: 'What makes working code an engineered system?',
    printRole: 'Recall and outcomes',
    build(body) {
      const recall = el('div', { class: 'card', style: 'height:100%;display:flex;flex-direction:column;gap:14px' }, [
        el('div', { class: 'card-title' }, 'Start from a program you know'),
        el('p', { style: 'font-size:26px;line-height:1.35' }, 'Think of a program you have written or used every week: a calculator, a to-do list, a game, a script.'),
        el('ul', { style: 'font-size:23px;line-height:1.4;display:flex;flex-direction:column;gap:10px;color:var(--text-muted)' }, [
          el('li', {}, 'What does it do when everything goes as planned?'),
          el('li', {}, 'What could make it fail outside that happy path: a second user, a lost connection, a rule that changes, a wrong assumption?'),
          el('li', {}, 'Who else is affected when it fails: only you, or people who never saw the code?'),
        ]),
        el('p', { class: 'rail-note', style: 'margin-top:auto' }, 'You need to be able to read a short function, an if statement and a list. No particular language, framework or tool is needed.'),
      ]);
      const list = el('ol', { class: 'outcome-list', 'aria-label': 'By the end of this lecture you can' }, OUTCOMES.map((o, i) => el('li', {}, [el('span', { class: 'n', 'aria-hidden': 'true' }, String(i + 1)), el('span', {}, o)])));
      const right = el('div', {}, [el('div', { class: 'card-title' }, 'By the end of this lecture you can'), list]);
      body.appendChild(el('div', { class: 'page-columns' }, [recall, right]));
    },
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [el('h3', {}, 'Start from a program you know'), el('p', {}, 'Think of a program you have written or used every week. What does it do when everything goes as planned? What could make it fail outside that happy path: a second user, a lost connection, a rule that changes, a wrong assumption? Who else is affected when it fails?')]),
        el('div', {}, [el('h3', {}, 'By the end of this lecture you can'), el('ol', { class: 'outcome-list' }, OUTCOMES.map((o, i) => el('li', {}, [el('span', { class: 'n' }, String(i + 1)), el('span', {}, o)])))]),
      ]));
    },
  };

  // =====================================================================
  // SCENE 1 · two-confirmations (Anchor)
  // =====================================================================
  const twoConfirmations = {
    id: 'two-confirmations', role: 'anchor',
    heading: 'Two green confirmations cannot both be right',
    lead: `${ARI.name} and ${BO.name} both want room ${ROOM} from ${START} to ${END}. Watch what each screen says, then what the stored calendar says.`,
    principle: 'Engineering judges behavior against an intended outcome and its consequences, not appearance alone.',
    conditions: [
      { id: 'each-screen-decides', baseline: true, label: 'Baseline: each screen checks its own copy of the room calendar and decides alone', short: 'Screens decide',
        states: [
          { caption: `**${ARI.name}** and **${BO.name}** both want ${ROOM} from ${START} to ${END}. Each screen keeps its own copy of the room calendar, and both copies say the hour is free. Click Reserve on ${ARI.name}'s screen, or press Step.`, alt: `Calendar of room ${ROOM} with no bookings.` },
          { caption: `${ARI.name} clicks Reserve. ${ARI.name}'s screen checks its copy, finds ${START} free and shows **Confirmed**. The stored calendar now holds ${ARI.name}'s booking.`, alt: `Calendar with one booking, ${ARI.name}, ${SLOT}.` },
          { caption: `${BO.name} clicks Reserve. ${BO.name}'s copy still says free, so ${BO.name}'s screen also shows **Confirmed**. Two green confirmations for one room and one hour.`, alt: `Calendar with two bookings in the same hour: ${ARI.name} and ${BO.name}.` },
          { prompt: { question: 'Both screens say Confirmed. What would let you decide whether the system worked?', options: ['The two screens: both said Confirmed', `The stored calendar for ${ROOM}`, `What happens at the door at ${START}`] }, caption: 'Pause here and decide. Then step to see the stored calendar.' },
          { caption: `The stored calendar holds **two accepted bookings for ${ROOM} in the same hour**. Rule R-01 says a room never holds two accepted bookings that overlap, so the stored record is wrong even though each screen looked right.`, alt: `Calendar with two overlapping bookings marked as a conflict against rule R-01.` },
          { caption: `At ${START} two people arrive at the door of ${ROOM}. One of them was promised something the service could not deliver. The screens were the appearance; the door is the consequence.` },
          { caption: 'Each screen ran without an error. Judged against the intended outcome, one accepted booking per room and hour, the behavior failed.', principle: true },
        ] },
      { id: 'shared-decision', label: 'Changed condition: one shared decision reads the stored calendar before any screen says Confirmed', short: 'One shared decision',
        states: [
          { caption: `Same two people, same room, same hour. Now neither screen decides. Every request goes to **one shared booking decision** that reads the stored calendar.`, alt: `Calendar of room ${ROOM} with no bookings and a shared booking decision above it.` },
          { caption: `${ARI.name} clicks Reserve. The request travels to the shared decision, which finds ${START} free, stores the booking and answers **Confirmed**.`, alt: `Calendar with one booking, ${ARI.name}.` },
          { caption: `${BO.name} clicks Reserve. The shared decision finds ${ARI.name}'s booking in the same hour and answers **not available: room conflict**. ${BO.name}'s screen shows the rejection and offers ${END}–12:00 or room ${ROOM2}.`, alt: `Calendar with one booking; ${BO.name}'s request rejected as a room conflict.` },
          { caption: `Compare the two outcomes. A false promise sends two people to one door. An honest rejection costs ${BO.name} a minute at booking time and misleads nobody. How the shared decision stays correct when both requests arrive in the same instant is the question for Week 6.` },
          { caption: 'The rule is kept where the bookings are stored, not on each screen. The screens now report a decision instead of making one.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const grid = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:372px minmax(0,1fr) 372px;grid-template-rows:minmax(0,1fr) 196px;gap:16px 24px;' });
      stage.appendChild(grid);
      // --- browser cards
      const makeCard = (user, key, gridCol) => {
        const copy = field('Calendar copy', `${START} free`, { 'data-cond': 'each-screen-decides' });
        const reserve = api.cue(el('button', { type: 'button', class: 'btn-reserve' }, 'Reserve'), `reserve-${key}`);
        const okStatus = status('ok', 'Confirmed', `${ROOM}, ${SLOT}`, reveal({}));
        const badStatus = status('bad', 'Not available: room conflict', `${ROOM} is booked ${SLOT}. Try ${END}–12:00 or room ${ROOM2}.`, reveal({ 'data-cond': 'shared-decision' }));
        const win = browser({ who: `${user.name} · ${user.id}`, label: `Booking screen of ${user.name}`, body: [field('Room', ROOM), field('Time', SLOT), copy, reserve, okStatus, badStatus] });
        win.style.cssText = `grid-column:${gridCol};grid-row:1;align-self:start;`;
        return { win, copy, reserve, okStatus, badStatus };
      };
      h.ari = makeCard(ARI, 'ari', 1);
      h.bo = makeCard(BO, 'bo', 3);
      h.ari.okStatus.setAttribute('data-show-from', '1');
      h.bo.okStatus.setAttribute('data-show-from', '2'); h.bo.okStatus.setAttribute('data-cond', 'each-screen-decides');
      h.bo.badStatus.setAttribute('data-show-from', '2');
      h.bo.copy.setAttribute('data-focus-at', '2-4');
      h.ari.reserve.addEventListener('click', () => { if (api.state === 0) api.setState(1); });
      h.bo.reserve.addEventListener('click', () => { if (api.state === 1) api.setState(2); });
      grid.append(h.ari.win, h.bo.win);
      // --- middle column: shared decision (condition B) + stored calendar (SVG)
      const mid = el('div', { style: 'grid-column:2;grid-row:1;display:flex;flex-direction:column;gap:10px;min-height:0;align-items:stretch;' });
      h.decision = el('div', { class: 'card', 'data-cond': 'shared-decision', style: 'padding:10px 14px;' }, [
        el('div', { class: 'card-title', style: 'margin-bottom:4px;font-size:17px' }, 'Shared booking decision · reads the stored calendar'),
        (h.decisionText = el('p', { style: 'font-size:19px;color:var(--text-muted);line-height:1.3' }, 'Waiting for a request.')),
      ]);
      api.cue(h.decision, 'decision');
      mid.appendChild(h.decision);
      const W = 460, H = 440;
      const svg = window.VC.svg(W, H, { label: `Stored calendar of room ${ROOM}`, uid: (x) => api.uid(x) });
      svg.style.cssText = 'flex:1;min-height:0;';
      const hours = ['09:00', '10:00', '11:00', '12:00', '13:00'];
      const rowH = 84, top = 44, left = 86;
      svg.appendChild(text(left, 24, `Stored calendar · ${ROOM} · today`, { class: 'n-kind', style: 'font-size:17px' }));
      hours.forEach((hh, i) => {
        const y = top + i * rowH;
        svg.appendChild(s('line', { x1: left, y1: y, x2: W - 10, y2: y, stroke: 'var(--line)', 'stroke-width': i === 0 || i === hours.length - 1 ? 2 : 1 }));
        svg.appendChild(text(left - 12, y + 6, hh, { class: 'n-sub', 'text-anchor': 'end', style: 'font-size:18px' }));
      });
      const slotY = top + rowH; // 10:00 row
      const block = (x, w, who, attrs) => {
        const g = s('g', Object.assign({ class: 'rv rv--rise fx' }, attrs));
        g.appendChild(s('rect', { x, y: slotY + 5, width: w, height: rowH - 10, rx: 10, fill: 'var(--ok-fill)', stroke: 'var(--ok)', 'stroke-width': 2.5 }));
        g.appendChild(text(x + 12, slotY + 30, who, { class: 'n-label', style: 'font-size:20px' }));
        g.appendChild(text(x + 12, slotY + 52, 'Confirmed', { class: 'n-sub', style: 'fill:var(--ok);font-weight:700;font-size:17px' }));
        g.appendChild(text(x + 12, slotY + 71, SLOT, { class: 'n-sub', style: 'font-size:15px' }));
        return g;
      };
      h.blockAri = block(left + 8, 170, ARI.name, { 'data-show-from': '1' });
      h.blockBo = block(left + 186, 170, BO.name, { 'data-show-from': '2', 'data-cond': 'each-screen-decides' });
      svg.append(h.blockAri, h.blockBo);
      const badgeY = top + 4 * rowH + 30;
      const conflict = s('g', { class: 'rv', 'data-show-from': '4', 'data-cond': 'each-screen-decides' });
      conflict.appendChild(s('rect', { x: left + 2, y: slotY + 2, width: W - left - 14, height: rowH - 4, rx: 12, fill: `url(#${api.uid('hatch-bad')})`, stroke: 'var(--bad)', 'stroke-width': 3, 'stroke-dasharray': '10 7' }));
      conflict.appendChild(badge({ x: left + (W - left) / 2 - 6, y: badgeY, label: 'R-01 broken: two accepted bookings overlap', kind: 'bad' }));
      svg.appendChild(conflict);
      const rej = s('g', { class: 'rv rv--rise', 'data-show-from': '2', 'data-cond': 'shared-decision' });
      rej.appendChild(s('rect', { x: left + 186, y: slotY + 5, width: 170, height: rowH - 10, rx: 10, fill: 'none', stroke: 'var(--bad)', 'stroke-width': 2.5, 'stroke-dasharray': '8 6' }));
      rej.appendChild(text(left + 198, slotY + 30, BO.name, { class: 'n-label', style: 'font-size:20px;fill:var(--bad)' }));
      rej.appendChild(text(left + 198, slotY + 52, 'Rejected', { class: 'n-sub', style: 'fill:var(--bad);font-weight:700;font-size:17px' }));
      rej.appendChild(text(left + 198, slotY + 71, 'room conflict', { class: 'n-sub', style: 'font-size:15px' }));
      const keptBadge = badge({ x: left + (W - left) / 2 - 6, y: badgeY, label: 'R-01 kept: one accepted booking', kind: 'ok', cls: 'rv rv--rise' });
      keptBadge.setAttribute('data-show-from', '2'); keptBadge.setAttribute('data-cond', 'shared-decision');
      svg.append(rej, keptBadge);
      h.svg = svg; h.calendar = svg;
      mid.appendChild(svg);
      grid.appendChild(mid);
      api.cue(mid, 'calendar');
      // --- bottom strip: the door (baseline) or the comparison (changed); both share one grid cell
      const strip = el('div', { style: 'grid-column:1 / -1;grid-row:2;display:grid;min-height:0;' });
      const doorSvg = window.VC.svg(1216, 150, { label: `Two people at the door of ${ROOM} at ${START}`, uid: (x) => api.uid(`door-${x}`) });
      const doorG = s('g');
      doorG.appendChild(s('rect', { x: 566, y: 10, width: 84, height: 118, rx: 8, fill: 'var(--surface-3)', stroke: 'var(--line-strong)', 'stroke-width': 2.5 }));
      doorG.appendChild(s('circle', { cx: 636, cy: 72, r: 5, fill: 'var(--text-muted)' }));
      doorG.appendChild(badge({ x: 608, y: 142, label: `${ROOM} · ${START}`, kind: 'default' }));
      const pA = personSvg(450, 76, ARI.name); const pB = personSvg(766, 76, BO.name);
      pA.setAttribute('class', pA.getAttribute('class') + ' is-focus'); pB.setAttribute('class', pB.getAttribute('class') + ' is-focus');
      doorG.append(pA, pB);
      doorG.appendChild(text(30, 60, ['Both were told Confirmed.', 'One room, one hour, two people.'], { class: 'n-label', style: 'font-size:22px', lineHeight: 30 }));
      doorG.appendChild(text(860, 60, ['The false promise costs the person', 'who arrives second: no room, no warning.'], { class: 'n-sub', style: 'font-size:19px', lineHeight: 27 }));
      doorSvg.appendChild(doorG);
      h.door = el('div', reveal({ class: 'rv rv--rise card', 'data-show-from': '5', 'data-cond': 'each-screen-decides', style: 'grid-area:1 / 1;padding:8px 12px;min-height:0;display:flex;' }), doorSvg);
      api.cue(h.door, 'door');
      const li = (t) => el('li', {}, t);
      h.compare = el('div', reveal({ class: 'rv rv--rise compare', 'data-show-from': '3', 'data-cond': 'shared-decision', style: 'grid-area:1 / 1;min-height:0;' }), [
        el('div', { class: 'card card--bad', style: 'padding:12px 16px' }, [el('div', { class: 'card-title', style: 'margin-bottom:6px' }, [chip('✕', 'bad'), 'False promise · both screens decide']), el('ul', { style: 'font-size:18px;gap:3px' }, [li('Two confirmations, one room, one hour: rule R-01 broken in the stored calendar.'), li(`Two people at the door at ${START}; the second one loses the room without warning.`), li('Someone must find and undo the double booking after the fact.')])]),
        el('div', { class: 'card card--ok', style: 'padding:12px 16px' }, [el('div', { class: 'card-title', style: 'margin-bottom:6px' }, [chip('✓', 'ok'), 'Honest rejection · one shared decision']), el('ul', { style: 'font-size:18px;gap:3px' }, [li('One confirmation, one clear rejection: rule R-01 kept where the bookings are stored.'), li(`${BO.name} loses a minute at booking time and picks ${END}–12:00 or room ${ROOM2}.`), li('Nothing to undo; nobody is misled.')])]),
      ]);
      api.cue(h.compare, 'compare');
      strip.append(h.door, h.compare);
      grid.appendChild(strip);
      h.stage = stage; h.prevState = 0; h.prevCond = null;
      return h;
    },
    render(h, view, api) {
      const st = view.state, cond = view.conditionId, shared = cond === 'shared-decision';
      h.ari.reserve.setAttribute('aria-disabled', st === 0 ? 'false' : 'true');
      h.bo.reserve.setAttribute('aria-disabled', st === 1 ? 'false' : 'true');
      if (shared) {
        h.decisionText.textContent = st === 0 ? 'Waiting for a request.' : st === 1 ? `${ARI.name}: ${START} is free → stored → Confirmed` : `${BO.name}: ${ARI.name} holds ${SLOT} → not stored → Rejected (room conflict)`;
        h.decisionText.style.color = st === 2 ? 'var(--bad)' : st === 1 ? 'var(--ok)' : 'var(--text-muted)';
      }
      const forward = h.prevCond === cond && st === h.prevState + 1;
      if (forward && (st === 1 || st === 2)) {
        const card = st === 1 ? h.ari : h.bo;
        flyToken(api, h.stage, card.reserve, shared ? h.decision : h.calendar, `request · ${ROOM} ${SLOT}`, 'accent');
      }
      h.prevState = st; h.prevCond = cond;
    },
    cues: [
      { cue: 'reserve-ari', target: 'reserve-ari', action: 'click', expect: 1, seconds: 10, teaches: `${ARI.name} reserves ${ROOM} ${SLOT}; the screen shows Confirmed and the stored calendar gains one booking` },
      { cue: 'reserve-bo', target: 'reserve-bo', action: 'click', expect: 2, seconds: 10, teaches: `${BO.name} reserves the same hour; the stale calendar copy lets a second Confirmed appear` },
      { cue: 'step-prompt', target: 'step', action: 'click', expect: 3, seconds: 6, teaches: 'The prediction question appears: what would let you decide whether the system worked' },
      { cue: 'hover-options', target: 'prompt', action: 'hover', expect: 3, seconds: 10, teaches: 'Pause the video and choose: the screens, the stored calendar, or the door' },
      { cue: 'step-calendar', target: 'step', action: 'click', expect: 4, seconds: 14, teaches: 'The stored calendar shows two overlapping confirmed bookings; rule R-01 is broken' },
      { cue: 'step-door', target: 'step', action: 'click', expect: 5, seconds: 12, teaches: 'Two people at one door: the consequence of a false promise' },
      { cue: 'step-principle', target: 'step', action: 'click', expect: 6, seconds: 10, teaches: 'Behavior is judged against the intended outcome and its consequences, not appearance' },
      { cue: 'condition-shared', target: 'condition-shared-decision', action: 'click', expect: 0, seconds: 8, teaches: 'Change one condition: one shared decision reads the stored calendar before any screen answers' },
      { cue: 'shared-reserve-ari', target: 'reserve-ari', action: 'click', expect: 1, seconds: 10, teaches: `${ARI.name}'s request travels to the shared decision, is stored and confirmed` },
      { cue: 'shared-reserve-bo', target: 'reserve-bo', action: 'click', expect: 2, seconds: 12, teaches: `${BO.name}'s request meets the stored booking and is rejected with a clear reason and alternatives` },
      { cue: 'shared-step-compare', target: 'step', action: 'click', expect: 3, seconds: 14, teaches: 'False promise against honest rejection: who carries the cost' },
      { cue: 'shared-hover-compare', target: 'compare', action: 'hover', expect: 3, seconds: 8, teaches: 'Reading the two outcome cards side by side' },
      { cue: 'shared-step-principle', target: 'step', action: 'click', expect: 4, seconds: 8, teaches: 'The rule is kept where the bookings are stored; screens report a decision instead of making one' },
    ],
    print: [
      { title: 'Two confirmations on screen, two overlapping bookings stored', condition: 'each-screen-decides', state: 4, note: `Rule R-01, no overlapping accepted bookings for the same room, is broken in the stored calendar although each screen showed success. Each screen decided from its own copy of the calendar, and ${BO.name}'s copy was stale.` },
      { title: 'One shared decision: one confirmation, one clear rejection', condition: 'shared-decision', state: 2, note: `Rule R-01 is kept: the shared decision reads the stored calendar before any screen says Confirmed. ${BO.name} sees the reason and two alternatives.` },
      { title: 'Compare the consequences', condition: 'shared-decision', state: 3, principle: true, note: 'How the shared decision stays correct when both requests arrive in the same instant is the question for Week 6.' },
    ],
  };

  // =====================================================================
  // SCENE 2 · system-boundary (Bridge)
  // =====================================================================
  const SB = A['w01/system-boundary'];
  const systemBoundary = {
    id: 'system-boundary', role: 'bridge',
    heading: 'The Reserve button is not the whole system',
    lead: 'A context map: the booking service inside a boundary, and the people and systems it depends on outside.',
    principle: 'A system boundary identifies responsibility and dependencies; it does not make external behavior disappear.',
    conditions: [
      { id: 'all-available', baseline: true, label: 'Baseline: every external system available', short: 'All available',
        states: [
          { prompt: { question: 'Which parts of this map can the team change directly?', options: ['Everything on the map', 'Only what is inside the dashed boundary', 'The boundary plus the sign-in provider'] }, caption: 'The dashed line is the boundary of the booking service: the modules the team writes and deploys. Everything else belongs to someone else. Step to reveal the interactions one at a time.', alt: 'Context map: the Campus Rooms booking service inside a dashed boundary; people and external systems outside, no arrows yet.' },
          { caption: `**${SB.interactions[0].label}.** ${SB.interactions[0].information}`, alt: 'Arrow from students and staff into the service: booking request.' },
          { caption: `**${SB.interactions[1].label}.** ${SB.interactions[1].information}`, alt: 'Arrow from campus identity into the service: identity assertion.' },
          { caption: `**${SB.interactions[2].label}.** ${SB.interactions[2].information}`, alt: 'Arrow from room records into the service: room facts.' },
          { caption: `**${SB.interactions[3].label}**, then **${SB.interactions[4].label}**. ${SB.interactions[4].information}`, alt: 'Arrows from the service to notification delivery and from notification delivery to the users.' },
          { caption: 'A booking request, an identity assertion and a notification are three kinds of information. One **asks**, one **vouches** for a fact, one **reports** a result. The service treats them differently: it decides on the request, trusts the assertion within limits, and hands the report to a provider.', alt: 'The arrows carry the tags asks, vouches and reports.' },
          { caption: 'Only the five modules inside the boundary are the team\'s to change. Every arrow that crosses the line is a dependency: the team relies on it and does not control it.', principle: true },
        ] },
      { id: 'notification-unavailable', label: `Changed condition: ${lower1(SB.changed_condition.label)}`, short: 'Notifications unavailable',
        states: [
          { prompt: { question: `Notification delivery is unavailable. Which outcomes remain possible for ${ARI.name}?`, options: ['None: no booking without a message', 'The booking is stored and accepted; the message is delayed', 'The booking waits until the provider is back'] }, caption: 'Same boundary, same arrows. One dependency outside the boundary is down; room storage is unchanged.', alt: 'Context map with notification delivery marked unavailable: dashed red box and crossed arrows.' },
          { caption: `Still possible: the decision is made and stored; ${ARI.name}'s screen shows Confirmed and says that the message is delayed. Not possible right now: the message reaching ${ARI.name}. Rule R-04: a failed notification does not undo an accepted booking, and the pending message stays visible and recoverable.`, alt: 'Checklist beside the boundary: three outcomes still possible, one not possible.' },
          { caption: 'The boundary did not move and the dependency did not vanish. Naming it is what lets the team decide what the user sees while it is down.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const W = 1264, H = 680;
      const svg = window.VC.svg(W, H, { label: 'Context map of the Campus Rooms booking service', uid: (x) => api.uid(x) });
      stage.appendChild(svg);
      const bx = 402, by = 130, bw = 500, bh = 400;
      svg.appendChild(boundary({ x: bx, y: by, w: bw, h: bh, label: SB.boundary_label.split(' · ')[0] }));
      svg.appendChild(text(bx + 20, by + 56, 'the team changes what is inside', { class: 'n-sub', style: 'font-size:17px' }));
      const inside = SB.inside; // Booking, Policy, Room Catalog, Notification, Storage
      const pos = [[bx + 30, by + 80], [bx + 280, by + 80], [bx + 30, by + 180], [bx + 280, by + 180]];
      inside.slice(0, 4).forEach((name, i) => svg.appendChild(node({ x: pos[i][0], y: pos[i][1], w: 190, h: 66, label: name })));
      svg.appendChild(node({ x: bx + 155, y: by + 280, w: 190, h: 90, label: inside[4], kind: 'store' }));
      // outside actors
      const users = personSvg(150, 330, SB.outside[0].label); svg.appendChild(users);
      svg.appendChild(text(150, 404, SB.outside[0].sub, { class: 'n-sub', 'text-anchor': 'middle', style: 'font-size:16px' }));
      const identity = node({ x: 60, y: 60, w: 250, h: 76, label: SB.outside[1].label, sub: SB.outside[1].sub, kind: 'ext', kindLabel: 'external system' });
      const rooms = node({ x: 1000, y: 206, w: 250, h: 76, label: SB.outside[2].label, sub: SB.outside[2].sub, kind: 'ext', kindLabel: 'external system' });
      const notif = node({ x: 1000, y: 560, w: 250, h: 76, label: SB.outside[3].label, sub: SB.outside[3].sub, kind: 'ext', kindLabel: 'external system' });
      svg.append(identity, rooms, notif);
      api.cue(users, 'users'); api.cue(identity, 'identity'); api.cue(rooms, 'room-records'); api.cue(notif, 'notification-delivery');
      // arrows
      const a1 = arrow(svg, { from: { x: 184, y: 330 }, to: { x: bx, y: 330 }, label: 'booking request:', kind: 'accent', cls: 'rv rv--draw', labelDy: -14 });
      a1.appendChild(text(292, 354, 'room, start, end', { class: 'a-label', 'text-anchor': 'middle', style: 'fill:var(--accent-strong)' }));
      const a2 = arrow(svg, { from: { x: 185, y: 136 }, to: { x: bx, y: 214 }, label: ['identity assertion:', 'who is signed in'], kind: 'violet', cls: 'rv rv--draw', labelAt: 0.62, labelDy: -34, labelDx: -8 });
      const a3 = arrow(svg, { from: { x: 1000, y: 244 }, to: { x: bx + bw, y: 244 }, label: ['room facts: exists,', 'capacity, step-free access'], kind: 'default', cls: 'rv rv--draw', labelAnchor: 'start', labelDx: -40, labelDy: -74 });
      const a4 = arrow(svg, { from: { x: bx + bw, y: 480 }, to: { x: 1000, y: 592 }, label: 'message to deliver', kind: 'ok', cls: 'rv rv--draw', labelAnchor: 'start', labelDx: 22, labelDy: -20 });
      const a5 = arrow(svg, { from: { x: 1125, y: 636 }, via: [{ x: 1125, y: 662 }, { x: 150, y: 662 }], to: { x: 150, y: 422 }, label: 'confirmation message', kind: 'ok', cls: 'rv rv--draw', labelDy: -12 });
      [a1, a2, a3, a4, a5].forEach((a, i) => { a.setAttribute('data-show-from', String([1, 2, 3, 4, 4][i])); api.cue(a, `arrow-${SB.interactions[i].id}`); });
      h.arrows = [a1, a2, a3, a4, a5];
      // information kind tags (baseline state 5)
      const tag = (x, y, label, kind) => { const b = badge({ x, y, label, kind, cls: 'rv rv--rise' }); b.setAttribute('data-show-from', '5'); b.setAttribute('data-cond', 'all-available'); return b; };
      svg.append(tag(256, 270, 'asks', 'accent'), tag(310, 234, 'vouches', 'violet'), tag(1198, 662, 'reports', 'ok'), tag(1125, 304, 'reference data', 'default'));
      // unavailable marking (condition B)
      const down = s('g', { class: 'rv', 'data-cond': 'notification-unavailable', 'data-show-from': '0' });
      down.appendChild(s('rect', { x: 994, y: 554, width: 262, height: 88, rx: 14, fill: 'none', stroke: 'var(--bad)', 'stroke-width': 3, 'stroke-dasharray': '10 8' }));
      down.appendChild(markX(1246, 566, 11));
      down.appendChild(badge({ x: 1125, y: 540, label: 'unavailable', kind: 'bad' }));
      down.appendChild(markX(951, 536, 11)); down.appendChild(markX(640, 662, 11));
      svg.appendChild(down);
      api.cue(down, 'unavailable');
      // outcome checklist (condition B, state 1), top right
      const list = s('g', { class: 'rv rv--rise', 'data-cond': 'notification-unavailable', 'data-show-from': '1' });
      list.appendChild(s('rect', { x: 950, y: 332, width: 306, height: 160, rx: 14, fill: 'var(--surface)', stroke: 'var(--line-strong)', 'stroke-width': 1.5 }));
      list.appendChild(text(966, 356, `Outcomes for ${ARI.name}`, { class: 'n-kind' }));
      const shortStill = ['Decision made and stored', 'Screen shows Confirmed', 'Screen shows: message delayed'];
      shortStill.forEach((t, i) => { list.appendChild(text(966, 386 + i * 26, '✓', { class: 'n-label', style: 'fill:var(--ok);font-size:19px' })); list.appendChild(text(990, 386 + i * 26, t, { class: 'n-sub', style: 'font-size:16px;fill:var(--text)' })); });
      list.appendChild(text(966, 464, '✕', { class: 'n-label', style: 'fill:var(--bad);font-size:19px' })); list.appendChild(text(990, 464, `Message reaches ${ARI.name} now`, { class: 'n-sub', style: 'font-size:16px;fill:var(--text)' }));
      list.appendChild(text(966, 484, `${SB.changed_condition.rule}: a failed message does not undo a booking`, { class: 'n-sub', style: 'font-size:13.5px' }));
      svg.appendChild(list);
      api.cue(list, 'outcomes');
      // answer to the prompt (baseline state 6)
      const ans = badge({ x: 652, y: by + bh + 40, label: 'Changeable by the team: only what is inside the boundary', kind: 'warn', cls: 'rv rv--rise' });
      ans.setAttribute('data-show-from', '6'); ans.setAttribute('data-cond', 'all-available');
      svg.appendChild(ans);
      h.svg = svg;
      return h;
    },
    render(h, view) {
      if (view.conditionId === 'notification-unavailable') h.arrows.forEach((a) => a.classList.add('is-shown'));
      h.arrows[3].classList.toggle('arrow--unavailable', view.conditionId === 'notification-unavailable');
      h.arrows[4].classList.toggle('arrow--unavailable', view.conditionId === 'notification-unavailable');
    },
    cues: [
      { cue: 'hover-boundary-question', target: 'prompt', action: 'hover', expect: 0, seconds: 10, teaches: 'Which parts of the map can the team change directly: pause and decide' },
      { cue: 'step-request', target: 'step', action: 'click', expect: 1, seconds: 10, teaches: 'A booking request crosses the boundary: something a person asks for' },
      { cue: 'step-identity', target: 'step', action: 'click', expect: 2, seconds: 10, teaches: 'An identity assertion: a fact another system vouches for' },
      { cue: 'step-room-facts', target: 'step', action: 'click', expect: 3, seconds: 8, teaches: 'Room facts are reference data the service reads but does not own' },
      { cue: 'step-notification', target: 'step', action: 'click', expect: 4, seconds: 10, teaches: 'The message goes out through a provider and comes back to the user as a notification' },
      { cue: 'step-kinds', target: 'step', action: 'click', expect: 5, seconds: 12, teaches: 'Three kinds of information: asks, vouches, reports' },
      { cue: 'step-answer', target: 'step', action: 'click', expect: 6, seconds: 10, teaches: 'Only the inside of the boundary is the team\'s to change; every crossing arrow is a dependency' },
      { cue: 'condition-unavailable', target: 'condition-notification-unavailable', action: 'click', expect: 0, seconds: 8, teaches: 'Change one condition: notification delivery is unavailable, storage unchanged' },
      { cue: 'hover-unavailable', target: 'unavailable', action: 'hover', expect: 0, seconds: 6, teaches: 'The unavailable dependency is marked with a broken line and the word unavailable' },
      { cue: 'step-outcomes', target: 'step', action: 'click', expect: 1, seconds: 14, teaches: 'Which outcomes remain possible: stored and confirmed, message delayed; rule R-04' },
      { cue: 'step-principle-2', target: 'step', action: 'click', expect: 2, seconds: 8, teaches: 'A boundary names responsibility and dependencies; it does not remove external behavior' },
    ],
    print: [
      { title: 'The context map with every interaction labeled', condition: 'all-available', state: 5, note: 'Inside the dashed boundary: Booking, Policy, Room Catalog, Notification and Storage, the modules the team changes. Outside: students and staff, campus identity, room records and notification delivery.' },
      { title: 'One dependency unavailable: what remains possible', condition: 'notification-unavailable', state: 1, principle: true, note: `Notification delivery is marked with a broken line and the word unavailable. Still possible: ${SB.changed_condition.still_possible.join('; ')}. Not possible now: ${SB.changed_condition.no_longer_possible.join('; ')} (rule R-04).` },
    ],
  };

  // =====================================================================
  // SCENE 3 · stakeholder-lenses (Anchor)
  // =====================================================================
  const SL = A['w01/stakeholder-lenses'];
  const stakeholderLenses = {
    id: 'stakeholder-lenses', role: 'anchor',
    heading: 'The same screen can serve one person and exclude another',
    lead: 'Who is affected by the booking screen, and does it work for each of them?',
    principle: 'Quality depends on the people and conditions included in the definition of success.',
    conditions: [
      { id: 'mouse', baseline: true, label: 'Baseline: the polished booking screen, used with a mouse', short: 'Mouse',
        states: [
          { prompt: { question: `Who is affected by this screen besides ${ARI.name}, the person clicking Reserve?`, options: ['Only the person booking', 'The people who book and the people who run the rooms', 'Everyone who books, runs, supports or later maintains the service'] }, caption: `${ARI.name} is at the top of the map, clicking Reserve. Step to add the people who never click that button but depend on what it does.`, alt: `Stakeholder map with the booking service at the centre and ${ARI.name} connected to it.` },
          { caption: `**${SL.stakeholders[0].who}.** Concern: ${SL.stakeholders[0].concern} The system must answer: ${SL.stakeholders[0].system_question}`, alt: 'Stakeholder map with a student who needs step-free access added.' },
          { caption: `**${SL.stakeholders[1].who}.** Concern: ${SL.stakeholders[1].concern} The system must answer: ${SL.stakeholders[1].system_question}`, alt: 'Stakeholder map with room staff added.' },
          { caption: `**${SL.stakeholders[2].who}.** Concern: ${SL.stakeholders[2].concern} The system must answer: ${SL.stakeholders[2].system_question}`, alt: 'Stakeholder map with support staff added.' },
          { caption: `**${SL.stakeholders[3].who}.** Concern: ${SL.stakeholders[3].concern} The system must answer: ${SL.stakeholders[3].system_question}`, alt: 'Stakeholder map with a maintainer added.' },
          { caption: 'Each concern became a question the system must answer: about room data, closures, records and decisions. Room closures stay an open question until Week 14.', alt: 'Complete stakeholder map with five people around the booking service.' },
          { caption: 'With a mouse the polished screen works: click the room, click the time, click Reserve, read Confirmed. Now change the condition to keyboard only and watch the same screen.', alt: 'Mouse route through the booking screen: room, time, Reserve, Confirmed.' },
        ] },
      { id: 'keyboard', label: 'Changed condition: the same screen, used with the keyboard only', short: 'Keyboard only',
        states: [
          { prompt: { question: 'Can the booking be completed with the keyboard alone?', options: ['Yes: Tab reaches everything on the screen', 'No: something on the screen is not reachable', 'Only with a screen reader'] }, caption: 'Same screen, no mouse. A yellow focus ring shows where the keyboard is. Each step presses Tab.', alt: 'The polished booking screen with a keyboard focus ring on the address bar.' },
          { caption: `**Tab** → the focus ring lands on the room list.`, alt: 'Focus ring on the room list.' },
          { caption: `**Tab** → the focus ring lands on the time fields.`, alt: 'Focus ring on the time fields.' },
          { caption: `**Tab** → the focus ring skips Reserve and leaves the page. The polished Reserve is a painted box, not a control. **${SL.keyboard_paths.flawed[2]}**`, alt: 'Focus ring leaves the screen; Reserve is marked not reachable; the task cannot be completed.' },
          { caption: 'The corrected screen appears beside it. It looks the same. Tab reaches the room list and the time fields exactly as before.', alt: 'A second, corrected screen beside the first, focus on its time fields.' },
          { caption: `**Tab** → the corrected Reserve is a real button, so the focus ring lands on it.`, alt: 'Focus ring on the Reserve button of the corrected screen.' },
          { caption: `**Enter** → Confirmed, and the status message is announced, so a screen reader speaks it too. Rule R-05: the core task can be completed by keyboard, with status and error information you can perceive.`, alt: 'Corrected screen shows Confirmed; the status message is announced.' },
          { caption: `Compare on **${SL.compare_on}**: the polished screen completes 0 of 1 bookings by keyboard, the corrected screen 1 of 1. Same appearance, different service.`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      // ---------- baseline: stakeholder map (SVG) + concern table
      const base = el('div', { 'data-cond': 'mouse', style: 'position:absolute;inset:0;display:grid;grid-template-columns:540px minmax(0,1fr);gap:24px;' });
      const W = 540, H = 680;
      const svg = window.VC.svg(W, H, { label: 'Stakeholder map around the Campus Rooms booking service', uid: (x) => api.uid(x) });
      const centre = node({ x: 165, y: 300, w: 210, h: 80, label: ['Campus Rooms', 'booking screen'] });
      svg.appendChild(centre);
      const ari = personSvg(270, 80, `${ARI.name} · clicks Reserve`); svg.appendChild(ari);
      svg.appendChild(arrow(svg, { from: { x: 270, y: 140 }, to: { x: 270, y: 300 }, kind: 'accent', label: 'reserves a room', labelDx: -96, labelDy: 6 }));
      const spots = [[128, 236], [412, 236], [128, 566], [412, 566]];
      const short = ['Student who needs', 'Room staff handling', 'Support staff diagnosing', 'Maintainer interpreting'];
      const short2 = ['step-free access', 'closures', 'mistakes', 'old decisions'];
      h.people = SL.stakeholders.map((stk, i) => {
        const [x, y] = spots[i];
        const g = s('g', { class: 'rv rv--rise', 'data-show-from': String(i + 1), 'data-focus-at': String(i + 1) });
        const p = personSvg(x, y, short[i]); p.appendChild(text(0, 74, short2[i], { class: 'n-label', 'text-anchor': 'middle', style: 'font-size:20px' }));
        const to = { x: x < 270 ? 165 : 375, y: y < 340 ? 316 : 364 };
        g.appendChild(arrow(svg, { from: { x: x + (x < 270 ? 30 : -30), y: y + (y < 340 ? 12 : -46) }, to, kind: 'default', dashed: true }));
        g.appendChild(p);
        svg.appendChild(g);
        api.cue(g, `stakeholder-${i + 1}`);
        return g;
      });
      const tbl = table({
        caption: 'Who is affected, what they need, what the system must answer',
        columns: [{ key: 'who', label: 'Who', cls: 'col-who' }, { key: 'concern', label: 'Their concern' }, { key: 'q', label: 'Question the system must answer' }],
        rows: SL.stakeholders.map((stk, i) => ({ attrs: { class: 'rv', 'data-show-from': String(i + 1), 'data-focus-at': String(i + 1) }, cells: { who: stk.who, concern: stk.concern, q: stk.system_question } })),
      });
      tbl.querySelectorAll('th.col-who').forEach((th) => { th.style.width = '30%'; });
      api.cue(tbl, 'table');
      const mouseRoute = el('div', reveal({ class: 'rv rv--rise callout callout--ok', 'data-show-from': '6', style: 'margin-top:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap' }), [
        el('b', {}, 'Mouse route:'), chip('click the room'), '→', chip('click the time'), '→', chip('click Reserve'), '→', chip('Confirmed', 'ok'), el('span', { class: 'muted', style: 'margin-left:auto' }, 'task completed'),
      ]);
      api.cue(mouseRoute, 'mouse-route');
      base.append(svg, el('div', { style: 'min-width:0;display:flex;flex-direction:column;' }, [tbl, mouseRoute]));
      stage.appendChild(base);
      // ---------- changed: keyboard route with two screens
      const kb = el('div', { 'data-cond': 'keyboard', style: 'position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto auto;gap:14px 28px;align-items:start;align-content:start;' });
      const screen = (title, corrected) => {
        const room = field('Room list', ROOM, { 'data-focus-at': '1' });
        const time = field('Time fields', SLOT, { 'data-focus-at': corrected ? '4' : '2' });
        let reserve;
        if (corrected) {
          reserve = el('button', { type: 'button', class: 'btn-reserve', 'data-focus-at': '5-6', tabindex: '-1', 'aria-disabled': 'true' }, 'Reserve');
        } else {
          reserve = el('div', { class: 'btn-reserve', 'aria-hidden': 'true', style: 'display:inline-flex;align-items:center;' }, 'Reserve');
        }
        const notReach = el('div', reveal({ class: 'rv status status--bad', 'data-show-from': '3' }), [el('span', { class: 'ico', 'aria-hidden': 'true' }, '✕'), el('span', {}, ['Reserve is not reachable', el('span', { class: 'sub' }, 'The focus ring passed over a painted box. The task cannot be completed.')])]);
        const done = el('div', reveal({ class: 'rv status status--ok', 'data-show-from': '6' }), [el('span', { class: 'ico', 'aria-hidden': 'true' }, '✓'), el('span', {}, [`Confirmed: ${ROOM}, ${SLOT}`, el('span', { class: 'sub' }, 'Status message is announced (live region).')])]);
        const keys = el('div', { class: 'keys', style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-height:40px;font-size:19px;color:var(--text-muted)' }, [el('span', {}, 'Keys pressed:')]);
        const win = browser({ who: title, label: title, url: corrected ? 'campus-rooms.example/book (corrected)' : 'campus-rooms.example/book', body: [room, time, reserve, corrected ? done : notReach, keys] });
        return { win, room, time, reserve, keys };
      };
      h.flawed = screen('Polished screen', false);
      h.fixed = screen('Corrected screen · looks the same', true);
      h.fixed.win.classList.add('rv', 'rv--rise'); h.fixed.win.setAttribute('data-show-from', '4');
      h.flawed.win.setAttribute('data-dim-at', '5-7'); h.flawed.win.classList.add('dm');
      api.cue(h.flawed.win, 'screen-polished'); api.cue(h.fixed.win, 'screen-corrected');
      h.escape = el('div', reveal({ class: 'rv callout callout--bad', 'data-show-at': '3-6', style: 'grid-column:1;grid-row:2;font-size:19px' }), [el('b', {}, 'Focus ring:'), ' left the page and landed in the browser toolbar. Nothing on the screen accepted it after the time fields.']);
      h.compareK = el('div', reveal({ class: 'rv rv--rise card', 'data-show-from': '7', style: 'grid-column:1 / -1;grid-row:2;padding:12px 18px' }), [
        el('div', { class: 'card-title', style: 'margin-bottom:4px' }, `Compare on ${SL.compare_on}`),
        table({ cls: 'data-table--compact', columns: [{ key: 'screen', label: 'Screen' }, { key: 'look', label: 'Appearance' }, { key: 'mouse', label: 'Mouse' }, { key: 'kbd', label: 'Keyboard only' }], rows: [
          { cells: { screen: 'Polished screen', look: 'identical', mouse: el('span', { class: 'ok' }, '1 of 1 completed'), kbd: el('span', { class: 'bad' }, '0 of 1 completed') } },
          { cells: { screen: 'Corrected screen', look: 'identical', mouse: el('span', { class: 'ok' }, '1 of 1 completed'), kbd: el('span', { class: 'ok' }, '1 of 1 completed') } },
        ] }),
      ]);
      api.cue(h.compareK, 'compare-keyboard');
      h.flawed.win.style.cssText = 'grid-column:1;grid-row:1;'; h.fixed.win.style.cssText += 'grid-column:2;grid-row:1;';
      kb.append(h.flawed.win, h.fixed.win, h.escape, h.compareK);
      stage.appendChild(kb);
      h.stage = stage;
      return h;
    },
    render(h, view) {
      if (view.conditionId !== 'keyboard') return;
      const st = view.state;
      const keysFlawed = ['Tab', 'Tab', 'Tab'].slice(0, Math.min(3, st));
      const keysFixed = st >= 4 ? ['Tab', 'Tab'].concat(st >= 5 ? ['Tab'] : []).concat(st >= 6 ? ['Enter'] : []) : [];
      const setKeys = (holder, keys) => {
        const nodes = [el('span', {}, 'Keys pressed:'), ...keys.map((k) => kbd(k))];
        if (!keys.length) nodes.push(el('span', { class: 'muted' }, 'none yet'));
        holder.replaceChildren(...nodes);
      };
      setKeys(h.flawed.keys, keysFlawed); setKeys(h.fixed.keys, keysFixed);
      h.flawed.reserve.style.outline = st >= 3 ? '3px dashed var(--bad)' : '';
      h.flawed.reserve.style.outlineOffset = st >= 3 ? '3px' : '';
      h.fixed.reserve.classList.toggle('is-focus', st === 5 || st === 6);
    },
    cues: [
      { cue: 'hover-who', target: 'prompt', action: 'hover', expect: 0, seconds: 10, teaches: 'Who is affected besides the person clicking Reserve: pause and decide' },
      { cue: 'step-student', target: 'step', action: 'click', expect: 1, seconds: 12, teaches: 'A student who needs step-free access: room records need access attributes; the task must work by keyboard' },
      { cue: 'step-staff', target: 'step', action: 'click', expect: 2, seconds: 10, teaches: 'Room staff handling closures: who may record a closure stays open until Week 14' },
      { cue: 'step-support', target: 'step', action: 'click', expect: 3, seconds: 10, teaches: 'Support staff: which request identifier and outcome category are recorded' },
      { cue: 'step-maintainer', target: 'step', action: 'click', expect: 4, seconds: 10, teaches: 'A maintainer: where is the decision record' },
      { cue: 'step-table', target: 'step', action: 'click', expect: 5, seconds: 10, teaches: 'Each concern became a question the system must answer' },
      { cue: 'step-mouse', target: 'step', action: 'click', expect: 6, seconds: 8, teaches: 'With a mouse the polished screen completes the booking' },
      { cue: 'condition-keyboard', target: 'condition-keyboard', action: 'click', expect: 0, seconds: 8, teaches: 'Change one condition: the same screen with the keyboard only' },
      { cue: 'kb-tab-1', target: 'step', action: 'click', expect: 1, seconds: 6, teaches: 'Tab moves the focus ring to the room list' },
      { cue: 'kb-tab-2', target: 'step', action: 'click', expect: 2, seconds: 6, teaches: 'Tab moves the focus ring to the time fields' },
      { cue: 'kb-tab-3', target: 'step', action: 'click', expect: 3, seconds: 12, teaches: 'Tab skips the painted Reserve box; the task cannot be completed' },
      { cue: 'kb-corrected', target: 'step', action: 'click', expect: 4, seconds: 8, teaches: 'The corrected screen looks the same and reaches the same fields' },
      { cue: 'kb-tab-reserve', target: 'step', action: 'click', expect: 5, seconds: 6, teaches: 'Tab reaches the real Reserve button' },
      { cue: 'kb-enter', target: 'step', action: 'click', expect: 6, seconds: 10, teaches: 'Enter confirms the booking and the status is announced; rule R-05' },
      { cue: 'kb-compare', target: 'step', action: 'click', expect: 7, seconds: 12, teaches: 'Compare on task completion: 0 of 1 against 1 of 1 with identical appearance' },
    ],
    print: [
      { title: 'Who is affected and what the system must answer', condition: 'mouse', state: 5, note: 'Room closures stay an open need until Week 14: who may record a closure, and what happens to affected bookings.' },
      { title: 'The keyboard route that completes the booking', condition: 'keyboard', state: 6, principle: true, note: `The failed route on the polished screen: ${SL.keyboard_paths.flawed.join('; ')}. The corrected route: ${SL.keyboard_paths.corrected.join('; ')}. Compare on ${SL.compare_on}.` },
    ],
  };

  // =====================================================================
  // SCENE 4 · quality-tradeoffs (Bridge, wide)
  // =====================================================================
  const QT = A['w01/quality-tradeoffs'];
  const qualityTradeoffs = {
    id: 'quality-tradeoffs', role: 'bridge', layout: 'wide',
    heading: 'Faster is not a complete description of better',
    lead: 'Two fictional designs answer the same booking request. Decide which is better before their behavior is revealed.',
    principle: 'Compare alternatives under stated constraints; some requirements are conditions of acceptance rather than points in a score.',
    conditions: [
      { id: 'target-2s', baseline: true, label: `Baseline: ${lower1(QT.response_time_targets[0].label)}`, short: 'Target 2 s',
        states: [
          { prompt: { question: 'Two designs answer a booking request. Which is better?', options: ['Design 1: it answers faster', 'Design 2: it checks the stored bookings first', 'It depends on what better has to include'] }, caption: `${QT.designs[0].name}. ${QT.designs[1].name}. Step to reveal one quality attribute at a time.` },
          { caption: `**Response time.** Design 1 answers in ${QT.attributes[0].D1}, Design 2 in ${QT.attributes[0].D2}. Both values are example assumptions, and both are inside the 2 s target.` },
          { caption: `**Correctness (R-01).** Design 1 can produce ${QT.attributes[1].D1}; Design 2 produces ${QT.attributes[1].D2}. This row is not a score. It is a condition of acceptance.` },
          { caption: `**Recoverability.** After a wrong confirmation, Design 1 means ${QT.attributes[2].D1}. Design 2 has ${QT.attributes[2].D2}.` },
          { caption: `**Privacy.** In Design 1 ${QT.attributes[3].D1}. In Design 2 ${QT.attributes[3].D2}.` },
          { caption: `**Change effort.** When the booking rule changes, in Design 1 ${QT.attributes[4].D1}; in Design 2 ${QT.attributes[4].D2}.` },
          { caption: 'Under a 2 s target both designs are fast enough. Correctness is a condition of acceptance, so Design 1 is out before speed is compared. Faster described one attribute; better needs the stated constraints.', principle: true },
        ] },
      { id: 'target-0-3s', label: `Changed condition: ${lower1(QT.response_time_targets[1].label)}`, short: 'Target 0.3 s',
        states: [
          { prompt: { question: `Design 2 answers in ${QT.attributes[0].D2} and misses the 0.3 s target. Correctness is still required. What do you change?`, options: QT.under_tight_target.map((o) => o.option) }, caption: 'Tighten only the response-time target. The rule R-01 stays mandatory. Step through the three options.' },
          { caption: `**${QT.under_tight_target[0].option}.** This ${QT.under_tight_target[0].effect}. It meets the number by giving up the rule.` },
          { caption: `**${QT.under_tight_target[1].option}.** ${upper1(QT.under_tight_target[1].effect)}. The rule is kept and the target is met.` },
          { caption: `**${QT.under_tight_target[2].option}.** ${upper1(QT.under_tight_target[2].effect)}. The rule is kept; the delay is honest.` },
          { caption: 'Two options keep the rule and deal with the target; the first hides a delay by giving up the rule. An optimization that preserves the rule is engineering; one that hides the delay is a return to Design 1.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:28px;' });
      const okMark = (ok) => el('span', { class: ok ? 'ok' : 'bad' }, ok ? '✓ ' : '✕ ');
      const rows = QT.attributes.map((a, i) => ({
        attrs: { class: 'rv', 'data-show-from': String(i + 1), 'data-focus-at': String(i + 1) },
        cells: {
          attr: [a.attribute, a.mandatory ? [' ', chip('condition of acceptance', 'warn', { style: 'font-size:16px' })] : null, a.example ? [' ', el('span', { class: 'example-tag' }, 'example assumption')] : null],
          d1: a.D1_ok === undefined ? a.D1 : [okMark(a.D1_ok), a.D1],
          d2: a.D2_ok === undefined ? a.D2 : [okMark(a.D2_ok), a.D2],
        },
      }));
      const tbl = table({
        caption: 'Quality attributes of two designs (example assumptions)', cls: 'data-table--compact',
        columns: [{ key: 'attr', label: 'Quality attribute' }, { key: 'd1', label: QT.designs[0].short }, { key: 'd2', label: QT.designs[1].short }],
        rows,
      });
      api.cue(tbl, 'table');
      const targetBox = el('div', { class: 'card', style: 'padding:12px 16px' }, [
        el('div', { class: 'card-title', style: 'margin-bottom:4px' }, 'Stated constraints'),
        (h.targetText = el('p', { style: 'font-size:21px' }, '')),
        el('p', { class: 'muted', style: 'font-size:18px;margin-top:4px' }, 'Correctness (R-01): required in every case, not traded for speed.'),
      ]);
      const optRows = QT.under_tight_target.map((o, i) => ({
        attrs: { class: 'rv', 'data-show-from': String(i + 1), 'data-focus-at': String(i + 1) },
        cells: { option: o.option, rule: o.keeps_rule ? el('span', { class: 'ok' }, 'keeps R-01') : el('span', { class: 'bad' }, 'breaks R-01'), effect: o.effect },
      }));
      const optTbl = table({ caption: 'Options under the 0.3 s target', cls: 'data-table--compact', columns: [{ key: 'option', label: 'Option' }, { key: 'rule', label: 'Rule' }, { key: 'effect', label: 'Effect' }], rows: optRows });
      const optWrap = el('div', { 'data-cond': 'target-0-3s' }, optTbl);
      api.cue(optWrap, 'options');
      const right = el('div', { style: 'display:flex;flex-direction:column;gap:14px;min-width:0' }, [targetBox, optWrap, el('p', { class: 'rail-note', style: 'margin-top:auto;font-size:17px' }, QT.label)]);
      wrap.append(el('div', { style: 'min-width:0' }, tbl), right);
      stage.appendChild(wrap);
      h.tbl = tbl;
      return h;
    },
    render(h, view) {
      const t = QT.response_time_targets.find((x) => x.id === view.conditionId) || QT.response_time_targets[0];
      h.targetText.textContent = `Response-time target: an answer within ${t.seconds} s.`;
      if (view.conditionId === 'target-0-3s') {
        h.tbl.querySelectorAll('tbody tr').forEach((tr) => { tr.classList.add('is-shown'); tr.classList.toggle('is-focus', tr.getAttribute('data-show-from') === '1' && view.state === 0); });
      }
    },
    cues: [
      { cue: 'hover-which-better', target: 'prompt', action: 'hover', expect: 0, seconds: 10, teaches: 'Two designs, one question: which is better, and what has better to include' },
      { cue: 'step-response-time', target: 'step', action: 'click', expect: 1, seconds: 8, teaches: 'Response time: 0.1 s against 0.4 s, both example assumptions inside the 2 s target' },
      { cue: 'step-correctness', target: 'step', action: 'click', expect: 2, seconds: 10, teaches: 'Correctness under overlapping requests is a condition of acceptance, not a score' },
      { cue: 'step-recoverability', target: 'step', action: 'click', expect: 3, seconds: 8, teaches: 'Recoverability: undoing a double booking later against nothing to undo' },
      { cue: 'step-privacy', target: 'step', action: 'click', expect: 4, seconds: 8, teaches: 'Privacy: a calendar copy on every screen against a request that only the decision reads' },
      { cue: 'step-change-effort', target: 'step', action: 'click', expect: 5, seconds: 8, teaches: 'Change effort when the rule changes: every screen against one decision point' },
      { cue: 'step-principle-4', target: 'step', action: 'click', expect: 6, seconds: 10, teaches: 'Compare under stated constraints; correctness removes Design 1 before speed is compared' },
      { cue: 'condition-tight', target: 'condition-target-0-3s', action: 'click', expect: 0, seconds: 8, teaches: 'Change one condition: the target tightens to 0.3 s and Design 2 misses it' },
      { cue: 'step-answer-early', target: 'step', action: 'click', expect: 1, seconds: 8, teaches: 'Answering before the decision returns hides the delay and gives up the rule' },
      { cue: 'step-faster-lookup', target: 'step', action: 'click', expect: 2, seconds: 8, teaches: 'A faster lookup keeps the rule and meets the target in the example' },
      { cue: 'step-show-checking', target: 'step', action: 'click', expect: 3, seconds: 8, teaches: 'Showing the check in progress keeps the rule and makes the wait honest' },
      { cue: 'step-principle-4b', target: 'step', action: 'click', expect: 4, seconds: 8, teaches: 'Preserve the rule while optimizing; hiding the delay returns to Design 1' },
    ],
    print: [
      { title: 'Two designs under the stated constraints', condition: 'target-2s', state: 6, principle: true, note: 'No winner badge: the rows are the rationale. The response-time values are example assumptions for two fictional designs.' },
      { title: 'The same designs under a 0.3 s target', condition: 'target-0-3s', state: 4, note: 'Correctness (R-01) stays required. Two options keep the rule; the first hides the delay by giving up the rule.' },
    ],
  };

  // =====================================================================
  // SCENE 5 · feedback-lifecycle (Anchor)
  // =====================================================================
  const FL = A['w01/feedback-lifecycle'];
  const STAGES = FL.stages; // Need, Model, Implementation, Checks, Release, Operation, Revision
  const DISCOVERY = FL.discovery_points; // Requirements conversation, Integration check, Operation
  const feedbackLifecycle = {
    id: 'feedback-lifecycle', role: 'anchor',
    heading: 'A failure can teach the next requirement',
    lead: `One defect: ${FL.incident.toLowerCase()}. Where is it first noticed, and what has to change afterwards?`,
    principle: 'The lifecycle is a network of feedback loops, not a one-way conveyor ending when code runs.',
    conditions: [
      { id: 'found-in-operation', baseline: true, label: 'Baseline: the missing message is first noticed in operation, by a user', short: 'Found in operation',
        states: [
          { prompt: { question: 'Where would you first notice that a failed notification leaves the user with no message?', options: ['While talking about the need', 'At an integration check', 'In operation, when a user reports it'] }, caption: `Seven stages in a loop: ${STAGES.join(', ')}. An incident card will travel through them.`, alt: `Lifecycle loop with seven stages: ${STAGES.join(', ')}.` },
          { caption: `A user reports it. The booking was stored, the message never arrived, and the screen said nothing. The incident card appears at **${STAGES[5]}**.`, alt: 'Incident card at Operation.' },
          { caption: `The card moves to **${STAGES[6]}**. Incident handling: someone reads the record, finds the failed notification job, and tells the user. Two kinds of rework so far.`, alt: 'Incident card at Revision.' },
          { caption: `Back to **${STAGES[0]}** and **${STAGES[1]}**. The need is restated: a booking whose message failed must say so. The model gains a message state: sent, delayed, failed.`, alt: 'Incident card at Model.' },
          { caption: `On to **${STAGES[2]}** and **${STAGES[3]}**. A new check: when the notification fails, the booking stays accepted and the screen shows the delayed message.`, alt: 'Incident card at Checks.' },
          { caption: `**${STAGES[4]}.** The change ships. Count the rework: ${DISCOVERY[2].rework}. Five kinds, and the user found the defect.`, alt: 'Incident card at Release; five rework items listed.' },
          { caption: '**Iteration** is going around the loop again to revisit understanding. **Increment** is the usable capability each pass adds. Move the first feedback earlier with the condition presets and compare the rework.', principle: true },
        ] },
      { id: 'found-at-check', label: 'Changed condition: the same defect is first noticed at an integration check', short: 'Found at a check',
        states: [
          { caption: 'Same defect, earlier feedback. The integration check runs the booking with the notification provider switched off. Where does the card start now?', alt: 'Lifecycle loop, no card yet.' },
          { caption: `The screen stays silent during the check: found. The card appears at **${STAGES[3]}**, before any user sees it.`, alt: 'Incident card at Checks.' },
          { caption: `Back to **${STAGES[1]}** and **${STAGES[2]}**: ${DISCOVERY[1].rework}. Two kinds of rework, no incident handling, no user to apologize to.`, alt: 'Incident card at Model.' },
          { caption: `**${STAGES[4]}** with the message state in place. Compare the rework list with the baseline.`, principle: true },
        ] },
      { id: 'found-in-conversation', label: 'Changed condition: the same defect is first noticed in the requirements conversation', short: 'Found in conversation',
        states: [
          { caption: 'Same defect, earliest feedback. While writing rule R-04 someone asks: what does the user see when the message fails?', alt: 'Lifecycle loop, no card yet.' },
          { caption: `The card appears at **${STAGES[0]}**. Rework: ${DISCOVERY[0].rework}. Nothing built yet has to be undone.`, alt: 'Incident card at Need.' },
          { caption: `The example flows into **${STAGES[1]}** and **${STAGES[3]}** as they are written. Compare the three rework lists: the same defect, three different amounts of undoing.`, principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:22px;' });
      const W = 860, H = 680;
      const svg = window.VC.svg(W, H, { label: 'Lifecycle loop', uid: (x) => api.uid(x) });
      const cx = 430, cy = 358, rx = 330, ry = 222, nw = 176, nh = 60;
      h.pos = STAGES.map((_, i) => { const ang = (-90 + i * (360 / STAGES.length)) * Math.PI / 180; return { x: cx + rx * Math.cos(ang), y: cy + ry * Math.sin(ang) }; });
      STAGES.forEach((_, i) => {
        const a = h.pos[i], b = h.pos[(i + 1) % STAGES.length];
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
        const ux = dx / len, uy = dy / len;
        const from = { x: a.x + ux * 100, y: a.y + uy * 42 }, to = { x: b.x - ux * 100, y: b.y - uy * 42 };
        svg.appendChild(arrow(svg, { from, to, kind: 'default', bend: -22 }));
      });
      h.nodes = STAGES.map((name, i) => { const n = node({ x: h.pos[i].x - nw / 2, y: h.pos[i].y - nh / 2, w: nw, h: nh, label: name, cls: 'stage-node' }); svg.appendChild(n); api.cue(n, `stage-${name.toLowerCase()}`); return n; });
      svg.appendChild(text(cx, cy - 14, 'feedback loops', { class: 'n-kind', 'text-anchor': 'middle' }));
      svg.appendChild(text(cx, cy + 16, 'not a conveyor', { class: 'n-kind', 'text-anchor': 'middle' }));
      h.card = s('g', { class: 'incident-card rv', style: 'transition: transform var(--t-move) var(--ease);' });
      h.card.appendChild(s('rect', { x: -120, y: -40, width: 240, height: 80, rx: 12, fill: 'var(--warn-fill)', stroke: 'var(--warn)', 'stroke-width': 3 }));
      h.card.appendChild(text(0, -12, 'Incident', { class: 'n-kind', 'text-anchor': 'middle', style: 'fill:var(--warn)' }));
      h.card.appendChild(text(0, 12, ['Notification failed;', 'the user saw no message'], { class: 'n-sub', 'text-anchor': 'middle', style: 'font-size:17px;fill:var(--text)', lineHeight: 20 }));
      svg.appendChild(h.card);
      api.cue(h.card, 'incident-card');
      h.reworkTitle = el('div', { class: 'card-title' }, 'Rework after discovery');
      h.reworkList = el('ol', { style: 'font-size:21px;line-height:1.35;display:flex;flex-direction:column;gap:6px;padding-left:1.3em' });
      const reworkCard = el('div', { class: 'card', style: 'flex:0 0 auto' }, [h.reworkTitle, h.reworkList]);
      api.cue(reworkCard, 'rework');
      const cmpRows = DISCOVERY.map((d) => ({ attrs: { 'data-discovery': d.at }, cells: { at: d.at, rework: d.rework } }));
      h.cmp = table({ caption: 'The same defect, three discovery points', cls: 'data-table--compact', columns: [{ key: 'at', label: 'First noticed' }, { key: 'rework', label: 'Rework' }], rows: cmpRows });
      const cmpCard = el('div', reveal({ class: 'rv rv--rise card', style: 'flex:1 1 auto;min-height:0' }), h.cmp);
      h.cmpCard = cmpCard;
      api.cue(cmpCard, 'compare');
      wrap.append(svg, el('div', { style: 'display:flex;flex-direction:column;gap:16px;min-width:0' }, [reworkCard, cmpCard]));
      stage.appendChild(wrap);
      h.svg = svg;
      return h;
    },
    render(h, view) {
      const st = view.state, c = view.conditionId;
      const at = (name) => STAGES.indexOf(name);
      let stageIdx = null, items = [], showCmp = false, current = null, focus = [];
      if (c === 'found-in-operation') {
        const seq = [null, at('Operation'), at('Revision'), at('Model'), at('Checks'), at('Release'), at('Release')];
        stageIdx = seq[st];
        const all = ['incident handling', 'user communication', 'message state', 'check', 'release'];
        items = all.slice(0, [0, 0, 2, 3, 4, 5, 5][st]);
        showCmp = st >= 5; current = 'Operation';
        focus = [[], [5], [5, 6], [6, 0, 1], [1, 2, 3], [3, 4], []][st];
      } else if (c === 'found-at-check') {
        const seq = [null, at('Checks'), at('Model'), at('Release')];
        stageIdx = seq[st];
        items = ['message state', 'check'].slice(0, [0, 0, 2, 2][st]);
        showCmp = st >= 2; current = 'Integration check';
        focus = [[], [3], [3, 1, 2], [2, 4]][st];
      } else {
        const seq = [null, at('Need'), at('Model')];
        stageIdx = seq[st];
        items = ['one sentence added to R-04', 'one acceptance example'].slice(0, [0, 2, 2][st]);
        showCmp = st >= 1; current = 'Requirements conversation';
        focus = [[], [0], [0, 1, 3]][st];
      }
      h.nodes.forEach((n, i) => n.classList.toggle('is-focus', focus.includes(i)));
      const restIdx = at('Operation');
      if (stageIdx == null) { h.card.classList.remove('is-shown'); h.card.style.transform = `translate(${h.pos[restIdx].x}px, ${h.pos[restIdx].y - 78}px)`; }
      else { const p = h.pos[stageIdx]; h.card.style.transform = `translate(${p.x}px, ${p.y - 78}px)`; h.card.classList.add('is-shown'); }
      h.reworkList.replaceChildren(...items.map((t) => el('li', {}, t)));
      if (!items.length) h.reworkList.appendChild(el('li', { class: 'muted', style: 'list-style:none;margin-left:-1.3em' }, 'nothing yet'));
      h.reworkTitle.textContent = items.length ? `Rework after discovery · ${items.length} kind${items.length > 1 ? 's' : ''}` : 'Rework after discovery';
      h.cmpCard.classList.toggle('is-shown', showCmp);
      h.cmp.querySelectorAll('tbody tr').forEach((tr) => tr.classList.toggle('is-focus', tr.getAttribute('data-discovery') === current));
    },
    cues: [
      { cue: 'hover-where', target: 'prompt', action: 'hover', expect: 0, seconds: 10, teaches: 'Where would you first notice the missing message: pause and decide' },
      { cue: 'step-operation', target: 'step', action: 'click', expect: 1, seconds: 10, teaches: 'A user reports the defect in operation; the incident card appears' },
      { cue: 'step-revision', target: 'step', action: 'click', expect: 2, seconds: 10, teaches: 'Incident handling and user communication are the first two kinds of rework' },
      { cue: 'step-need-model', target: 'step', action: 'click', expect: 3, seconds: 12, teaches: 'The need is restated and the model gains a message state' },
      { cue: 'step-checks', target: 'step', action: 'click', expect: 4, seconds: 10, teaches: 'A new check: notification failure keeps the booking and shows the delayed message' },
      { cue: 'step-release', target: 'step', action: 'click', expect: 5, seconds: 10, teaches: 'Release; five kinds of rework counted' },
      { cue: 'step-terms', target: 'step', action: 'click', expect: 6, seconds: 10, teaches: 'Iteration revisits understanding; increment adds usable capability' },
      { cue: 'condition-check', target: 'condition-found-at-check', action: 'click', expect: 0, seconds: 8, teaches: 'Change one condition: the defect is first noticed at an integration check' },
      { cue: 'check-step-found', target: 'step', action: 'click', expect: 1, seconds: 8, teaches: 'The check with the provider switched off finds the silent screen' },
      { cue: 'check-step-rework', target: 'step', action: 'click', expect: 2, seconds: 10, teaches: 'Two kinds of rework: a message state and a check' },
      { cue: 'check-step-release', target: 'step', action: 'click', expect: 3, seconds: 8, teaches: 'Released with the message state; compare with the baseline' },
      { cue: 'condition-conversation', target: 'condition-found-in-conversation', action: 'click', expect: 0, seconds: 8, teaches: 'Change the condition again: the defect surfaces while talking about the need' },
      { cue: 'conv-step-found', target: 'step', action: 'click', expect: 1, seconds: 10, teaches: 'One sentence added to R-04 and one acceptance example; nothing is undone' },
      { cue: 'conv-step-compare', target: 'step', action: 'click', expect: 2, seconds: 12, teaches: 'Three discovery points, three amounts of undoing; the loop is a network of feedback' },
    ],
    print: [
      { title: 'The loop and the path of a defect found in operation', condition: 'found-in-operation', state: 5, note: 'The card travelled Operation → Revision → Need and Model → Implementation and Checks → Release. Rework: incident handling, user communication, message state, check, release.' },
      { title: 'The same defect found at an integration check', condition: 'found-at-check', state: 3, note: 'Path: Checks → Model and Implementation → Release. Rework: one message state and one check. No cost multiplier is claimed; the kinds of rework are the comparison.' },
      { title: 'The same defect found while talking about the need', condition: 'found-in-conversation', state: 2, principle: true, note: 'Rework: one sentence added to R-04 and one acceptance example. Iteration revisits understanding; an increment adds usable capability.' },
    ],
  };

  // =====================================================================
  // SCENE 6 · evidence-not-confidence (Bridge, wide)
  // =====================================================================
  const EV = A['w01/evidence-not-confidence'];
  const evidenceNotConfidence = {
    id: 'evidence-not-confidence', role: 'bridge', layout: 'wide',
    heading: 'What would make you believe this works?',
    lead: 'Three claims about the booking service. Each one deserves a check, and each check leaves something uncertain.',
    principle: 'A check supports a bounded claim; confidence without scope is difficult to evaluate.',
    conditions: [
      { id: 'one-user', baseline: true, label: `Baseline: ${lower1(EV.workloads[0].label)}`, short: 'One at a time',
        states: [
          { prompt: { question: 'Which of these claims would you accept, and on what basis?', options: EV.claims.map((c) => c.claim) }, caption: 'Three claims in the first column. Step to place the check that supports each one, and what the check leaves uncertain.' },
          { caption: `**${EV.claims[0].claim}.** Check: ${EV.claims[0].check}. Left uncertain: ${EV.claims[0].uncertainty}.` },
          { caption: `**${EV.claims[1].claim}.** Check: ${EV.claims[1].check}. Left uncertain: ${EV.claims[1].uncertainty}.` },
          { caption: `**${EV.claims[2].claim}.** Check: ${EV.claims[2].check}. Left uncertain: ${EV.claims[2].uncertainty}.` },
          { caption: 'Each check supports its claim under its own conditions. Write the conditions next to the claim, and the third column is never empty.', principle: true },
        ] },
      { id: 'simultaneous-users', label: `Changed condition: ${lower1(EV.workloads[1].label)}`, short: 'Two in the same moment',
        states: [
          { caption: `Keep the three claims and their checks. Change the workload: **${EV.counterexample.label}**.` },
          { caption: `The claim **${EV.claims[1].claim}** is unchanged, and so is the check. What the new workload exposes is an assumption: **${EV.counterexample.exposes}**. ${upper1(EV.counterexample.kept)}.` },
          { caption: 'The third claim named its conditions, and its checks include the two-at-once case at the storage boundary, so it covers the new workload. The habit of this course: state what the checks showed and the limits they showed it under.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const board = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:1fr 1.4fr 1.4fr;grid-template-rows:auto 1fr 1fr 1fr auto;gap:10px 20px;' });
      const head = (t, kind) => el('div', { class: 'card-title', style: `margin:0;padding:4px 10px;border-bottom:2px solid var(--${kind});color:var(--${kind === 'line-strong' ? 'text-muted' : kind})` }, t);
      board.append(head('Claim', 'line-strong'), head('Check that supports it', 'ok'), head('Remaining uncertainty', 'warn'));
      h.rows = EV.claims.map((c, i) => {
        const claim = el('div', { class: 'card', style: 'display:flex;align-items:center;font-size:22px;font-weight:600;padding:10px 16px;' }, c.claim);
        const check = el('div', reveal({ class: 'rv rv--rise card', 'data-show-from': String(i + 1), style: 'border-color:var(--ok);font-size:19px;line-height:1.3;padding:10px 16px' }), [el('span', { class: 'ok', style: 'font-weight:700;margin-right:8px' }, '✓'), c.check]);
        const unc = el('div', reveal({ class: 'rv rv--rise card', 'data-show-from': String(i + 1), style: 'border-color:var(--warn);font-size:19px;line-height:1.3;padding:10px 16px' }), [el('span', { style: 'color:var(--warn);font-weight:700;margin-right:8px' }, '?'), c.uncertainty]);
        api.cue(claim, `claim-${c.id}`); api.cue(check, `check-${c.id}`); api.cue(unc, `uncertainty-${c.id}`);
        board.append(claim, check, unc);
        return { claim, check, unc };
      });
      h.counter = el('div', reveal({ class: 'rv rv--rise callout', 'data-cond': 'simultaneous-users', 'data-show-from': '0', style: 'grid-column:1 / -1;font-size:19px;padding:6px 14px' }), [el('b', {}, 'Counterexample: '), EV.counterexample.label, el('span', { class: 'muted' }, ` · exposes ${EV.counterexample.exposes}`)]);
      api.cue(h.counter, 'counterexample');
      h.exposed = el('span', reveal({ class: 'rv chip chip--bad', 'data-cond': 'simultaneous-users', 'data-show-from': '1', style: 'margin-left:10px;white-space:normal;font-size:17px' }), `exposed assumption: ${EV.counterexample.exposes}`);
      h.rows[1].unc.appendChild(h.exposed);
      h.covered = el('span', reveal({ class: 'rv chip chip--ok', 'data-cond': 'simultaneous-users', 'data-show-from': '2', style: 'margin-left:10px;white-space:normal;font-size:17px' }), 'covers the new workload');
      h.rows[2].check.appendChild(h.covered);
      board.appendChild(h.counter);
      stage.appendChild(board);
      return h;
    },
    render(h, view) {
      const sim = view.conditionId === 'simultaneous-users';
      h.rows.forEach((r, i) => {
        if (sim) { r.check.classList.add('is-shown'); r.unc.classList.add('is-shown'); }
        const focus = sim ? (view.state === 1 && i === 1) || (view.state === 2 && i === 2) : view.state === i + 1;
        [r.claim, r.check, r.unc].forEach((n) => { n.style.boxShadow = focus ? '0 0 0 3px var(--warn)' : ''; });
      });
    },
    cues: [
      { cue: 'hover-claims', target: 'prompt', action: 'hover', expect: 0, seconds: 10, teaches: 'Three claims: which would you accept, and on what basis' },
      { cue: 'step-looks-right', target: 'step', action: 'click', expect: 1, seconds: 10, teaches: 'It looks right rests on one glance at a screen and says nothing about stored state' },
      { cue: 'step-one-example', target: 'step', action: 'click', expect: 2, seconds: 10, teaches: 'One passing example supports one example; other times, rooms and people stay open' },
      { cue: 'step-stated-checks', target: 'step', action: 'click', expect: 3, seconds: 12, teaches: 'Stated checks under stated conditions leave a named remainder' },
      { cue: 'step-principle-6', target: 'step', action: 'click', expect: 4, seconds: 8, teaches: 'A check supports a bounded claim' },
      { cue: 'condition-simultaneous', target: 'condition-simultaneous-users', action: 'click', expect: 0, seconds: 8, teaches: 'Change the workload: two people request the same room in the same moment' },
      { cue: 'step-exposed', target: 'step', action: 'click', expect: 1, seconds: 12, teaches: 'The claim and the check are unchanged; the workload exposes an assumption' },
      { cue: 'step-covered', target: 'step', action: 'click', expect: 2, seconds: 10, teaches: 'The claim that named its conditions covers the new workload' },
    ],
    print: [
      { title: 'Claim, check and remaining uncertainty, with the counterexample', condition: 'simultaneous-users', state: 2, principle: true, note: `Counterexample: ${EV.counterexample.label}. It exposes ${EV.counterexample.exposes}; ${EV.counterexample.kept}.` },
    ],
  };

  // =====================================================================
  // SCENE 7 · responsibility-and-impact (Bridge)
  // =====================================================================
  const RI = A['w01/responsibility-and-impact'];
  const responsibilityAndImpact = {
    id: 'responsibility-and-impact', role: 'bridge',
    heading: 'Who carries the cost of an engineering shortcut?',
    lead: `A support log entry written to answer one question: why did ${ARI.name}'s booking fail?`,
    principle: 'Professional responsibility includes the consequences imposed on people who did not make the technical choice.',
    conditions: [
      { id: 'why-failed', baseline: true, label: `Baseline: ${lower1(RI.support_questions[0].label)}`, short: 'Why did it fail?',
        states: [
          { prompt: { question: 'The log holds everything the screen sent. Who benefits from all these fields, and who takes the risk?', options: ['Support: more detail helps them', 'Users: they get faster help', 'Nobody needs most of it; the users carry the risk'] }, caption: `${RI.incident}. The entry as first written keeps seven fields. Three of them answer the support question; four describe ${ARI.name}.` },
          { caption: `**${RI.consequences[0].party}.** Logging everything: ${RI.consequences[0].verbose}. Minimal record: ${RI.consequences[0].minimal}.` },
          { caption: `**${RI.consequences[1].party}.** Logging everything: ${RI.consequences[1].verbose}. Minimal record: ${RI.consequences[1].minimal}.` },
          { caption: `**${RI.consequences[2].party}.** Logging everything: ${RI.consequences[2].verbose}. Minimal record: ${RI.consequences[2].minimal}.` },
          { caption: `**${RI.consequences[3].party}.** Logging everything: ${RI.consequences[3].verbose}. Minimal record: ${RI.consequences[3].minimal}.` },
          { caption: `The minimal record: ${RI.minimal_record.map((f) => f.field).join(', ')}. Each field has a written reason. Support finds the request by its id; ${ARI.name}'s purpose never enters the log.` },
          { caption: 'The people in the log did not choose the logging design, and they carry its risk. The choice belongs to the engineers, and so does the consequence.', principle: true },
        ] },
      { id: 'which-room', label: `Changed condition: ${lower1(RI.support_questions[1].label)}`, short: 'Is it one room?',
        states: [
          { prompt: { question: 'The support question changes: is the failure specific to one room? Which single field does the record now need?', options: ['room_id', 'the user', 'the purpose'] }, caption: 'Start from the minimal record. A new question may justify one more field.' },
          { caption: `**${RI.support_questions[1].added_field.field} = ${RI.support_questions[1].added_field.value}** is added, with its reason: ${RI.support_questions[1].added_field.reason}. Deliberate collection: one field, one written reason. Collecting everything by default needs no reason and answers no question better.` },
          { caption: 'The record grew by one justified field. Every other personal detail still stays out, because no question needs it.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const wrap = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:600px minmax(0,1fr);gap:24px;' });
      const logLine = (f) => el('div', { class: 'log-line', style: 'display:grid;grid-template-columns:150px 1fr auto;gap:12px;align-items:center;padding:7px 12px;border-bottom:1px solid var(--line);font-size:20px' }, [
        el('code', { style: 'color:var(--accent-strong)' }, f.field), el('span', { class: 'mono', style: 'color:var(--text)' }, f.value),
        f.needed === undefined ? null : chip(f.needed ? 'needed' : 'not needed', f.needed ? 'ok' : 'bad', { style: 'font-size:16px' }),
      ]);
      const verbose = el('div', { class: 'card rv', 'data-cond': 'why-failed', 'data-show-from': '0', 'data-show-until': '4', style: 'grid-area:1 / 1;padding:12px 14px;align-self:start' }, [
        el('div', { class: 'card-title' }, RI.verbose_record.label), ...RI.verbose_record.fields.map((f) => logLine(f)),
      ]);
      api.cue(verbose, 'verbose-record');
      const reasonRow = (f, extra) => el('div', Object.assign({ style: 'display:grid;grid-template-columns:150px 1fr;gap:12px;padding:7px 12px;border-bottom:1px solid var(--line);font-size:20px' }, extra || {}), [el('code', { style: 'color:var(--accent-strong)' }, f.field), el('span', {}, [el('span', { class: 'mono' }, f.value), el('span', { class: 'muted', style: 'display:block;font-size:17px' }, `why: ${f.reason}`)])]);
      const add = RI.support_questions[1].added_field;
      const addedRow = reasonRow(add, reveal({ class: 'rv rv--rise', 'data-cond': 'which-room', 'data-show-from': '1', style: 'display:grid;grid-template-columns:150px 1fr;gap:12px;padding:7px 12px;border-bottom:1px solid var(--line);font-size:20px;background:var(--warn-fill);border-left:4px solid var(--warn)' }));
      const minimal = el('div', { class: 'card rv rv--rise', 'data-show-from': '5', style: 'grid-area:1 / 1;padding:12px 14px;align-self:start' }, [el('div', { class: 'card-title' }, 'Minimal diagnostic record · each field with its reason'), ...RI.minimal_record.map((f) => reasonRow(f)), addedRow]);
      h.minimal = minimal;
      api.cue(minimal, 'minimal-record');
      const left = el('div', { style: 'display:grid;min-height:0' }, [verbose, minimal]);
      // consequence map (SVG): decision at the top, a spine down the left, parties beside their consequences
      const W = 640, H = 680;
      const svg = window.VC.svg(W, H, { label: 'Consequence map of the logging decision', uid: (x) => api.uid(x) });
      const dec = node({ x: 60, y: 16, w: 320, h: 80, label: ['Decision:', 'log everything the screen sent'], kindLabel: 'engineering shortcut' });
      const ys = [150, 280, 410, 540];
      svg.appendChild(s('line', { x1: 80, y1: 96, x2: 80, y2: ys[3] + 38, stroke: 'var(--bad)', 'stroke-width': 3, class: 'rv', 'data-show-from': '1' }));
      svg.appendChild(dec);
      h.parties = RI.consequences.map((c, i) => {
        const g = s('g', { class: 'rv rv--rise', 'data-show-from': String(i + 1), 'data-focus-at': String(i + 1) });
        const n = node({ x: 60, y: ys[i], w: 200, h: 76, label: c.party });
        g.appendChild(s('line', { x1: 260, y1: ys[i] + 38, x2: 284, y2: ys[i] + 38, stroke: 'var(--bad)', 'stroke-width': 3 }));
        g.appendChild(n);
        g.appendChild(s('rect', { x: 284, y: ys[i] + 4, width: 344, height: 68, rx: 10, fill: 'var(--bad-fill)', stroke: 'var(--bad)', 'stroke-width': 1.5 }));
        const lines = wrapText(c.verbose, 36);
        g.appendChild(text(298, ys[i] + 30, lines[0], { class: 'n-sub', style: 'fill:var(--text);font-size:17px' }));
        if (lines[1]) g.appendChild(text(298, ys[i] + 52, lines[1], { class: 'n-sub', style: 'fill:var(--text);font-size:17px' }));
        svg.appendChild(g);
        api.cue(g, `consequence-${c.id}`);
        return g;
      });
      svg.appendChild(text(60, 646, 'Red: what logging everything imposes; the minimal record removes each one.', { class: 'n-sub', style: 'font-size:16px' }));
      api.cue(svg, 'consequence-map');
      wrap.append(left, svg);
      stage.appendChild(wrap);
      return h;
    },
    render(h, view) {
      if (view.conditionId === 'which-room') { h.minimal.classList.add('is-shown'); h.parties.forEach((g) => g.classList.add('is-shown')); }
    },
    cues: [
      { cue: 'hover-log', target: 'verbose-record', action: 'hover', expect: 0, seconds: 12, teaches: 'Seven fields in the log; three answer the question, four describe the person' },
      { cue: 'hover-who-benefits', target: 'prompt', action: 'hover', expect: 0, seconds: 8, teaches: 'Who benefits and who takes the risk: pause and decide' },
      { cue: 'step-users', target: 'step', action: 'click', expect: 1, seconds: 8, teaches: 'Users: their details sit in a log many people can read' },
      { cue: 'step-support', target: 'step', action: 'click', expect: 2, seconds: 8, teaches: 'Support effort: reading through personal detail to find the failure' },
      { cue: 'step-exposure', target: 'step', action: 'click', expect: 3, seconds: 8, teaches: 'Data exposure: one copied log file exposes names and purposes' },
      { cue: 'step-change', target: 'step', action: 'click', expect: 4, seconds: 8, teaches: 'Future change: tools grow around the personal fields' },
      { cue: 'step-minimal', target: 'step', action: 'click', expect: 5, seconds: 12, teaches: 'The minimal record: request id, time, outcome category, each with a reason' },
      { cue: 'step-principle-7', target: 'step', action: 'click', expect: 6, seconds: 8, teaches: 'The people in the log did not make the choice; the engineers carry the consequence' },
      { cue: 'condition-room', target: 'condition-which-room', action: 'click', expect: 0, seconds: 8, teaches: 'Change the support question: is the failure specific to one room' },
      { cue: 'step-room-id', target: 'step', action: 'click', expect: 1, seconds: 10, teaches: 'One field added with one written reason; the rest stays out' },
      { cue: 'step-principle-7b', target: 'step', action: 'click', expect: 2, seconds: 6, teaches: 'Deliberate, justified collection against collecting everything by default' },
    ],
    print: [
      { title: 'The log as first written, and the consequences it imposes', condition: 'why-failed', state: 4, note: 'Fields marked not needed describe the person, not the failure. Each red box is a consequence for people who did not choose the logging design.' },
      { title: 'The minimal diagnostic record with the rationale for each field', condition: 'which-room', state: 1, principle: true, note: 'The changed support question justified exactly one more field, room_id, with its reason. The slot, the person and the purpose stay out of the log.' },
    ],
  };

  // =====================================================================
  // SCENE 8 · course-evidence-map (Bridge, wide)
  // =====================================================================
  const CM = A['w01/course-evidence-map'];
  const courseEvidenceMap = {
    id: 'course-evidence-map', role: 'bridge', layout: 'wide',
    heading: 'One domain, many kinds of explanation',
    lead: 'The same booking service, eight questions, and the representation that answers each one. This is the map of the course.',
    principle: 'Choose a representation for the question, not a diagram style for the whole course.',
    conditions: [
      { id: 'who-depends', baseline: true, label: `Baseline: ${lower1(CM.questions[0].label)}`, short: 'Who depends?',
        states: [
          { prompt: { question: 'Could one flowchart answer all of these questions equally well?', options: ['Yes: one diagram fits every question', 'No: each question has its own best representation', 'Only tables can answer them all'] }, caption: 'Eight questions about one booking service. Step to reveal the representation that answers each pair.' },
          { caption: `**Week ${CM.rows[0].week}:** ${CM.rows[0].question} A ${CM.rows[0].representation}. **Week ${CM.rows[1].week}:** ${CM.rows[1].question} A ${CM.rows[1].representation}.` },
          { caption: `**Week ${CM.rows[2].week}:** ${CM.rows[2].question} A ${CM.rows[2].representation}. **Week ${CM.rows[3].week}:** ${CM.rows[3].question} A ${CM.rows[3].representation}.` },
          { caption: `**Week ${CM.rows[4].week}:** ${CM.rows[4].question} A ${CM.rows[4].representation}. **Week ${CM.rows[5].week}:** ${CM.rows[5].question} A ${CM.rows[5].representation}.` },
          { caption: `**Week ${CM.rows[6].week}:** ${CM.rows[6].question} An ${CM.rows[6].representation}. **Week ${CM.rows[7].week}:** ${CM.rows[7].question} ${upper1(CM.rows[7].representation)}.` },
          { caption: 'Ask **who depends on the booking decision** and the dependency graph lights up: components and the edges between them. A sequence diagram would show the same booking, but it answers a different question.' },
          { caption: 'The booking behavior stays fixed through all fourteen lectures; the representation changes with the question.', principle: true },
        ] },
      { id: 'what-first', label: `Changed condition: ${lower1(CM.questions[1].label)}`, short: 'What first?',
        states: [
          { caption: `Same booking, different question: **what happened first when ${ARI.name} booked?** Which representation answers it?` },
          { caption: 'The sequence diagram lights up: the request, the decision, the storage write, the answer, in time order. The dependency graph has the same boxes and no order; it cannot answer this question.' },
          { caption: 'Two questions, two representations, one unchanged service.', principle: true },
        ] },
      { id: 'assistant-drafted', label: `Changed condition: ${lower1(CM.questions[2].label)}`, short: 'Assistant drafts',
        states: [
          { caption: 'Change the actor instead of the question. The same booking change is drafted by an automated assistant rather than a colleague. Which representations and checks are no longer needed?' },
          { caption: '**None.** The requirement card, the state diagram, the dependency graph, the sequence, the test table, the release path and the incident timeline all still apply, because they describe the system and its behavior, not who typed the draft. Week 13 examines this in full.', principle: true },
        ] },
    ],
    setup(stage, api) {
      const h = {};
      const grid = el('div', { style: 'position:absolute;inset:0;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr;gap:12px 16px;' });
      h.tiles = CM.rows.map((r, i) => {
        const thumb = miniDiagram(r.id, api);
        const chipText = r.representation.split(':')[0].split(' with')[0];
        const tile = el('div', { class: 'card rv rv--rise fx', 'data-show-from': String(Math.floor(i / 2) + 1), style: 'padding:8px 14px;display:grid;grid-template-rows:auto 1fr auto;gap:4px;min-height:0' }, [
          el('div', { style: 'display:flex;justify-content:space-between;align-items:center' }, [el('span', { class: 'example-tag' }, `Week ${r.week}`), chip(chipText, r.id === 'assistant' ? 'violet' : 'accent', { style: 'font-size:15px' })]),
          thumb,
          el('p', { style: 'font-size:17px;line-height:1.3;color:var(--text)' }, r.question),
        ]);
        api.cue(tile, `tile-${r.id}`);
        grid.appendChild(tile);
        return tile;
      });
      stage.appendChild(grid);
      return h;
    },
    render(h, view) {
      const c = view.conditionId, st = view.state;
      const hl = CM.questions.find((q) => q.id === c).highlight;
      const showAll = c !== 'who-depends';
      h.tiles.forEach((t, i) => {
        if (showAll) t.classList.add('is-shown');
        const active = (c === 'who-depends' && st >= 5) || (c !== 'who-depends' && st >= 1);
        const isHl = active && CM.rows[i].id === hl;
        t.classList.toggle('is-focus', isHl);
        t.style.borderColor = isHl ? 'var(--warn)' : '';
        t.style.opacity = active && !isHl && c !== 'assistant-drafted' ? '0.45' : '';
        if (c === 'assistant-drafted' && st >= 1) { t.style.borderColor = CM.rows[i].id === 'assistant' ? 'var(--violet)' : 'var(--ok)'; }
      });
    },
    cues: [
      { cue: 'hover-one-flowchart', target: 'prompt', action: 'hover', expect: 0, seconds: 10, teaches: 'Could one flowchart answer every question: pause and decide' },
      { cue: 'step-req-state', target: 'step', action: 'click', expect: 1, seconds: 12, teaches: 'Requirement card and state diagram answer the Week 2 and Week 3 questions' },
      { cue: 'step-dep-seq', target: 'step', action: 'click', expect: 2, seconds: 12, teaches: 'Dependency graph and sequence diagram answer who depends and what happened first' },
      { cue: 'step-tests-release', target: 'step', action: 'click', expect: 3, seconds: 12, teaches: 'Test table and release path answer which cases and what travels with a change' },
      { cue: 'step-timeline-assistant', target: 'step', action: 'click', expect: 4, seconds: 12, teaches: 'Incident timeline, and the row for a change drafted by an assistant' },
      { cue: 'step-highlight-dependency', target: 'step', action: 'click', expect: 5, seconds: 10, teaches: 'Who depends on this: the dependency graph answers' },
      { cue: 'step-principle-8', target: 'step', action: 'click', expect: 6, seconds: 8, teaches: 'Choose a representation for the question' },
      { cue: 'condition-what-first', target: 'condition-what-first', action: 'click', expect: 0, seconds: 8, teaches: 'Change the question: what happened first' },
      { cue: 'step-sequence', target: 'step', action: 'click', expect: 1, seconds: 12, teaches: 'The sequence diagram answers time order; the dependency graph cannot' },
      { cue: 'step-principle-8b', target: 'step', action: 'click', expect: 2, seconds: 6, teaches: 'Two questions, two representations, one service' },
      { cue: 'condition-assistant', target: 'condition-assistant-drafted', action: 'click', expect: 0, seconds: 8, teaches: 'Change the actor: the change is drafted by an automated assistant' },
      { cue: 'step-none', target: 'step', action: 'click', expect: 1, seconds: 14, teaches: 'None of the representations or checks become unnecessary; Week 13 returns to this' },
    ],
    print: [
      { title: 'The course map: question to representation', condition: 'who-depends', state: 4, note: CM.rows.map((r) => `Week ${r.week}: ${r.question} → ${r.representation}.`).join(' ') },
      { title: 'The actor changes; the representations and checks stay', condition: 'assistant-drafted', state: 1, principle: true, note: 'A change drafted by an automated assistant still needs the requirement card, the state diagram, the dependency graph, the sequence, the test table, the release path and the incident timeline. Week 13 examines this in full.' },
    ],
  };
  /** Small illustrative thumbnails for the course map (decorative; the question text carries the meaning). */
  function miniDiagram(kind, api) {
    const svg = window.VC.svg(300, 120, { label: `${kind} thumbnail`, uid: (x) => api.uid(`mini-${kind}-${x}`) });
    svg.setAttribute('aria-hidden', 'true'); svg.removeAttribute('role');
    svg.style.cssText = 'width:100%;height:100%;min-height:0;';
    const box = (x, y, w, hh, extra) => s('rect', Object.assign({ x, y, width: w, height: hh, rx: 6, fill: 'var(--surface-2)', stroke: 'var(--line-strong)', 'stroke-width': 2 }, extra || {}));
    const ln = (x1, y1, x2, y2, extra) => s('line', Object.assign({ x1, y1, x2, y2, stroke: 'var(--line-strong)', 'stroke-width': 2 }, extra || {}));
    const dot = (x, y, r, fill) => s('circle', { cx: x, cy: y, r, fill: fill || 'var(--accent)' });
    switch (kind) {
      case 'requirement':
        svg.append(box(40, 14, 220, 92), ln(60, 40, 200, 40, { 'stroke-width': 4, stroke: 'var(--accent)' }), ln(60, 60, 240, 60), ln(60, 78, 220, 78), s('path', { d: 'M212 88 l10 10 l18 -22', fill: 'none', stroke: 'var(--ok)', 'stroke-width': 4 }));
        break;
      case 'state':
        [[60, 60], [150, 30], [240, 60], [150, 95]].forEach(([x, y]) => svg.appendChild(dot(x, y, 16, 'var(--surface-3)')));
        [[60, 60], [150, 30], [240, 60], [150, 95]].forEach(([x, y]) => svg.appendChild(s('circle', { cx: x, cy: y, r: 16, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.5 })));
        svg.append(ln(76, 52, 134, 36, { stroke: 'var(--accent)' }), ln(166, 36, 224, 52, { stroke: 'var(--accent)' }), ln(224, 70, 166, 90, { stroke: 'var(--accent)' }), ln(134, 90, 76, 70, { stroke: 'var(--accent)' }));
        break;
      case 'dependency':
        svg.append(box(20, 15, 80, 34), box(200, 15, 80, 34), box(110, 76, 80, 34), ln(100, 32, 200, 32, { stroke: 'var(--accent)', 'stroke-width': 2.5 }), ln(60, 49, 140, 76, { stroke: 'var(--accent)', 'stroke-width': 2.5 }), ln(240, 49, 160, 76, { stroke: 'var(--accent)', 'stroke-width': 2.5 }));
        break;
      case 'sequence':
        [50, 150, 250].forEach((x) => { svg.append(box(x - 30, 8, 60, 22), ln(x, 30, x, 112, { 'stroke-dasharray': '4 4' })); });
        svg.append(ln(50, 50, 150, 50, { stroke: 'var(--accent)', 'stroke-width': 2.5 }), ln(150, 70, 250, 70, { stroke: 'var(--accent)', 'stroke-width': 2.5 }), ln(250, 90, 50, 90, { stroke: 'var(--ok)', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }));
        break;
      case 'tests':
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) svg.appendChild(box(30 + c * 62, 14 + r * 32, 56, 26, { fill: c === 3 ? (r === 1 ? 'var(--bad-fill)' : 'var(--ok-fill)') : 'var(--surface-2)', stroke: c === 3 ? (r === 1 ? 'var(--bad)' : 'var(--ok)') : 'var(--line-strong)' }));
        break;
      case 'release':
        [30, 120, 210].forEach((x, i) => svg.appendChild(s('path', { d: `M${x} 30 h60 l18 30 l-18 30 h-60 l18 -30 z`, fill: i === 1 ? 'var(--warn-fill)' : 'var(--surface-2)', stroke: i === 1 ? 'var(--warn)' : 'var(--line-strong)', 'stroke-width': 2 })));
        break;
      case 'timeline':
        svg.append(ln(20, 60, 280, 60, { 'stroke-width': 3 }), dot(60, 60, 8), dot(120, 60, 8), dot(175, 60, 10, 'var(--bad)'), dot(240, 60, 8, 'var(--ok)'), ln(175, 60, 175, 22, { stroke: 'var(--bad)' }), box(150, 6, 60, 16, { fill: 'var(--bad-fill)', stroke: 'var(--bad)' }));
        break;
      default: // assistant: a draft document beside the same checks
        svg.append(box(20, 12, 100, 96), ln(36, 36, 104, 36), ln(36, 54, 104, 54), ln(36, 72, 90, 72), s('text', { x: 40, y: 100, class: 'n-kind', style: 'font-size:13px;fill:var(--violet)' }, 'draft'),
          box(150, 14, 130, 24, { fill: 'var(--ok-fill)', stroke: 'var(--ok)' }), box(150, 48, 130, 24, { fill: 'var(--ok-fill)', stroke: 'var(--ok)' }), box(150, 82, 130, 24, { fill: 'var(--ok-fill)', stroke: 'var(--ok)' }),
          ln(120, 60, 150, 60, { stroke: 'var(--violet)', 'stroke-width': 2.5 }));
    }
    return svg;
  }

  // =====================================================================
  // PAGE · principles and checks
  // =====================================================================
  const CHECKS = [
    { q: 'What is wrong with two successful overlapping confirmations?', a: 'They break the intended exclusivity rule even though each screen and each request looked successful.' },
    { q: 'Why include support staff in the stakeholder map?', a: 'Their diagnostic needs shape what the system records, documents, protects and can recover.' },
    { q: 'Does passing one booking example show that simultaneous requests work?', a: 'No. The example covers one person at a time; the two-at-once condition was never exercised.' },
    { q: 'Which representation answers: what happens after a timeout?', a: 'A state model when you ask which states are possible; a sequence or timeline view when you ask about one particular interaction.' },
  ];
  const SCENES = [twoConfirmations, systemBoundary, stakeholderLenses, qualityTradeoffs, feedbackLifecycle, evidenceNotConfidence, responsibilityAndImpact, courseEvidenceMap];
  const principles = {
    kind: 'page', id: 'principles', role: 'page',
    heading: 'Eight principles, four checks',
    lead: 'One principle per scene. Then four questions: decide your answer before you open it.',
    printRole: 'Principles and checks',
    build(body, api) {
      const cards = el('div', { class: 'principle-grid' }, SCENES.map((sc, i) => api.cue(el('a', { class: 'principle-card', href: `#/${sc.id}`, style: 'text-decoration:none;color:inherit' }, [
        el('span', { class: 'pc-num' }, `${i + 1} · ${sc.role}`), el('span', { class: 'pc-text' }, sc.principle), el('span', { class: 'pc-id' }, `#/${sc.id}`),
      ]), `card-${i + 1}`)));
      const qa = el('ol', { class: 'qa-list', style: 'margin-top:18px' }, CHECKS.map((c, i) => {
        const ans = el('p', { class: 'qa-a', id: `qa-a-${i + 1}`, hidden: '' }, c.a);
        const btn = api.cue(el('button', { type: 'button', class: 'qa-q', 'aria-expanded': 'false', 'aria-controls': `qa-a-${i + 1}` }, [el('span', {}, `${i + 1}. ${c.q}`), el('span', { class: 'tw', 'aria-hidden': 'true' }, '+')]), `question-${i + 1}`);
        btn.addEventListener('click', () => { const open = btn.getAttribute('aria-expanded') === 'true'; btn.setAttribute('aria-expanded', open ? 'false' : 'true'); if (open) ans.setAttribute('hidden', ''); else ans.removeAttribute('hidden'); });
        return el('li', { class: 'qa-item' }, [btn, ans]);
      }));
      body.append(cards, qa);
      body.reset = () => body.querySelectorAll('.qa-q').forEach((b) => { b.setAttribute('aria-expanded', 'false'); document.getElementById(b.getAttribute('aria-controls')).setAttribute('hidden', ''); });
    },
    onEnter(body) { body.reset(); },
    cues: SCENES.map((sc, i) => ({ cue: `hover-card-${i + 1}`, target: `card-${i + 1}`, action: 'hover', expect: null, seconds: 7, teaches: `Principle ${i + 1}: ${sc.principle}` }))
      .concat(CHECKS.map((c, i) => ({ cue: `open-question-${i + 1}`, target: `question-${i + 1}`, action: 'click', expect: null, seconds: 12, teaches: `Check ${i + 1}: ${c.q}` }))),
    print(body) {
      body.appendChild(el('h3', {}, 'Principles'));
      body.appendChild(el('div', { class: 'principle-grid' }, SCENES.map((sc, i) => el('div', { class: 'principle-card' }, [el('span', { class: 'pc-num' }, `${i + 1} · ${sc.role}`), el('span', { class: 'pc-text' }, sc.principle), el('span', { class: 'pc-id' }, `${FILE}#/${sc.id}`)]))));
      body.appendChild(el('h3', {}, 'Checks: decide your answer before reading the one below each question'));
      body.appendChild(el('ol', { class: 'print-qa' }, CHECKS.map((c, i) => el('li', {}, [el('span', { class: 'q' }, `${i + 1}. ${c.q}`), el('span', { class: 'a' }, c.a)]))));
    },
  };

  // =====================================================================
  // PAGE · handoff, terminology and sources
  // =====================================================================
  const TERMS = [
    ['Stakeholder', 'A person or group affected by the service: the person booking, room staff, support staff, a future maintainer.'],
    ['Requirement', 'A statement of what the service must do or keep true, written so that a check can show whether it holds. R-01 is one.'],
    ['Constraint', 'A condition every acceptable design must meet, such as correctness under overlapping requests.'],
    ['Quality attribute', 'A property of how the service behaves: response time, recoverability, privacy, change effort.'],
    ['Check result', 'What a check showed, together with the conditions it ran under. Its scope is part of the result.'],
    ['Lifecycle', 'The loop of need, model, implementation, checks, release, operation and revision that a service goes around repeatedly.'],
    ['Trade-off', 'A choice between alternatives under stated constraints, where each option costs something the other keeps.'],
  ];
  const SOURCES = [
    ['S01', 'IEEE Computer Society, Guide to the Software Engineering Body of Knowledge (SWEBOK V4.0a)', 'https://www.computer.org/education/bodies-of-knowledge/software-engineering'],
    ['S02', 'ACM / IEEE-CS / AAAI, Computer Science Curricula 2023 (CS2023), published 2024', 'https://csed.acm.org/final-report/'],
    ['S24', 'Software Engineering at Google, chapter 1: What is software engineering?', 'https://abseil.io/resources/swe-book/html/ch01.html'],
    ['S25', 'W3C, Web Content Accessibility Guidelines 2.2', 'https://www.w3.org/TR/WCAG22/'],
  ];
  const HANDOFF_SENTENCE = A['w02/ambiguous-request'].sentence; // "Make room booking fair and easy."
  const CARRIED = [
    'The context map: the booking service inside its boundary, four dependencies outside.',
    'The no-overlap concern: one accepted booking per room and hour (R-01), kept where bookings are stored.',
    'Open assumptions: who may record a room closure; what the user sees while a message is delayed; how the shared decision behaves when two requests arrive in the same instant.',
  ];
  const sources = {
    kind: 'page', id: 'sources', role: 'page',
    heading: 'What carries forward, and where to read more',
    lead: 'Next week starts from one sentence and turns it into requirements you can check.',
    printRole: 'Handoff, terminology, sources',
    build(body, api) {
      const left = el('div', { style: 'display:flex;flex-direction:column;gap:18px;min-height:0' }, [
        api.cue(el('div', { class: 'handoff' }, [el('span', { class: 'muted', style: 'font-size:20px;display:block;margin-bottom:8px;font-family:var(--font-text);font-weight:500' }, 'Week 2 starts from this request:'), el('span', { class: 'quote' }, `“${HANDOFF_SENTENCE}”`)]), 'handoff'),
        el('div', { class: 'card' }, [el('div', { class: 'card-title' }, 'Carried forward to Week 2'), el('ul', { style: 'font-size:21px;line-height:1.4;display:flex;flex-direction:column;gap:8px' }, CARRIED.map((t) => el('li', {}, t)))]),
      ]);
      const middle = el('div', { class: 'card', style: 'min-height:0' }, [el('div', { class: 'card-title' }, 'Terms used this week'), el('dl', { class: 'term-list', style: 'grid-template-columns:1fr;font-size:18px;gap:2px' }, TERMS.flatMap(([t, d]) => [el('dt', {}, t), el('dd', {}, d)]))]);
      const right = el('div', { class: 'card', style: 'min-height:0' }, [el('div', { class: 'card-title' }, 'Sources for this lecture'), el('ul', { class: 'source-list' }, SOURCES.map(([k, t, u]) => el('li', {}, [el('span', { class: 'key' }, k), el('span', {}, [t, ' ', el('a', { class: 'url', href: u }, u)])])))]);
      body.appendChild(el('div', { style: 'display:grid;grid-template-columns:1.05fr 0.95fr 0.9fr;gap:28px;height:100%;min-height:0' }, [left, middle, right]));
    },
    cues: [
      { cue: 'hover-handoff', target: 'handoff', action: 'hover', expect: null, seconds: 8, teaches: 'Week 2 starts from the sentence: make room booking fair and easy' },
      { cue: 'sources-static', target: 'handoff', action: 'hover', expect: null, kind: 'static', seconds: 6, reason: 'The sources page holds only reference text; the recorded route narrates the handoff question over the final pointer pass and puts the sources in the video description (22_recording_track.txt).', teaches: 'Where to read more: the four sources of this week' },
    ],
    print(body) {
      body.appendChild(el('div', { class: 'print-columns' }, [
        el('div', {}, [
          el('div', { class: 'handoff' }, [el('span', { class: 'muted', style: 'display:block;font-size:14px' }, 'Week 2 starts from this request:'), el('span', { class: 'quote' }, `“${HANDOFF_SENTENCE}”`)]),
          el('h3', {}, 'Carried forward to Week 2'),
          el('ul', {}, CARRIED.map((t) => el('li', {}, t))),
          el('h3', {}, 'Sources for this lecture'),
          el('ul', { class: 'source-list' }, SOURCES.map(([k, t, u]) => el('li', {}, [el('span', { class: 'key' }, k), el('span', {}, [t, ' ', el('span', { class: 'url' }, u)])]))),
        ]),
        el('div', {}, [el('h3', {}, 'Terms used this week'), el('dl', { class: 'term-list' }, TERMS.flatMap(([t, d]) => [el('dt', {}, t), el('dd', {}, d)]))]),
      ]));
    },
  };

  // =====================================================================
  // DECK
  // =====================================================================
  window.lecture.deck({
    week: 1, file: FILE,
    title: 'Engineering software that people can depend on',
    question: 'What makes working code an engineered system?',
    coverLead: 'Student notes for lecture 1. Every scene shows a situation, asks you to predict, reveals the mechanism, changes one condition, compares the outcomes and names the principle. The pages that follow keep the selected states of each scene with their captions.',
    coverNote: 'Campus Rooms is a fictional room-booking service; every name, number and incident is a teaching example unless a source is named. Values marked example assumption are illustrative, not measurements.',
    pages: [
      opening,
      outcomes,
      { kind: 'scene', scene: twoConfirmations },
      { kind: 'scene', scene: systemBoundary },
      { kind: 'scene', scene: stakeholderLenses },
      { kind: 'scene', scene: qualityTradeoffs },
      { kind: 'scene', scene: feedbackLifecycle },
      { kind: 'scene', scene: evidenceNotConfidence },
      { kind: 'scene', scene: responsibilityAndImpact },
      { kind: 'scene', scene: courseEvidenceMap },
      principles,
      sources,
    ],
  });
})();
