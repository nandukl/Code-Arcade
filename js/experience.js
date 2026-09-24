/**
 * Code Arcade - experience layer
 *  1. "Start where you are" explorer
 *  2. Conversational lead flow (name -> need -> optional note -> phone)
 *  3. Drag-to-scroll project rail, floating "Let's talk" button
 * Uses submitLead() and showToast() from main.js.
 */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const h = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    n.append(...kids);
    return n;
  };

  /* ---------------- 1. Explorer ---------------- */
  const PATHS = [
    { title: 'From a rough idea to a live app', img: 'service-mobile', svc: 'A mobile app',
      blurb: 'Describe it in plain words. We turn it into a working mobile or web app you can hold, tap and show to people.',
      pts: ['We help shape the idea, so no tech knowledge is needed', 'You see a working version early, not just at the end', 'Android, iOS and web from one clear plan'],
      steps: ['Tell us the idea', 'Watch it come alive', 'Launch it'] },
    { title: 'A website your customers can actually find', img: 'service-web-dev', svc: 'A website',
      blurb: 'Fast, good-looking, search-friendly websites for shops, services and growing brands.',
      pts: ['Looks great on every phone and screen', 'Built to be found on Google', 'Simple for you to update and grow'],
      steps: ['Share your business', 'Review the design', 'Go live'] },
    { title: 'Software shaped around how you work', img: 'service-web-app', svc: 'Web app / business software',
      blurb: 'Replace notebooks and spreadsheets with a simple system built for your exact workflow.',
      pts: ['Inventory, billing, bookings, reports: you choose', 'Real-time dashboards that make sense at a glance', 'Secure logins and cloud storage'],
      steps: ['Show us your process', 'Approve the plan', 'Save hours every week'] },
    { title: 'A project you can proudly present', img: 'project-academic', svc: 'A college project',
      blurb: 'Guided, well-documented final-year and mini projects, with clean code you will actually understand and be able to explain.',
      pts: ['IEEE-aligned documentation', 'Code walkthroughs so you can present with confidence', 'Planned around your submission date'],
      steps: ['Share your topic', 'Build it together', 'Present with confidence'] },
    { title: 'Keep it running. Make it better.', img: 'service-maintenance', svc: 'Fix or improve something',
      blurb: 'Bugs, slow pages, new features: we take care of what you already have.',
      pts: ['Bug fixes and performance tune-ups', 'New features whenever you are ready', 'Ongoing monitoring and updates'],
      steps: ['Tell us what hurts', 'We diagnose it', 'It just works'] }
  ];

  function initExplorer() {
    const panel = $('#path-panel');
    const tabs = [...document.querySelectorAll('.ex-tab')];
    if (!panel || !tabs.length) return;

    const show = (i, focus) => {
      const p = PATHS[i];
      tabs.forEach((t, j) => {
        t.classList.toggle('active', j === i);
        t.setAttribute('aria-selected', String(j === i));
        t.tabIndex = j === i ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', `tab-${i}`);
      panel.innerHTML =
        `<div class="path-media"><img src="assets/images/${p.img}.webp" alt="" width="600" height="400" decoding="async"></div>
         <div class="path-info">
           <h3>${p.title}</h3><p>${p.blurb}</p>
           <ul class="path-points">${p.pts.map(x => `<li>${x}</li>`).join('')}</ul>
           <ol class="path-steps" aria-label="How it works">${p.steps.map(x => `<li>${x}</li>`).join('')}</ol>
           <button type="button" class="btn-primary" data-open-talk data-service="${p.svc}"><span>Start this with us</span></button>
         </div>`;
      panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
      if (focus) tabs[i].focus();
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(i));
      t.addEventListener('keydown', (e) => {
        const n = tabs.length; let to = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') to = (i + 1) % n;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') to = (i - 1 + n) % n;
        if (to !== null) { e.preventDefault(); show(to, true); }
      });
    });
    show(0);
  }

  /* ---------------- 2. Conversational lead flow ---------------- */
  function initTalk() {
    const modal = $('#quote-modal'), stage = $('#talk-stage'), bar = $('#talk-bar');
    if (!modal || !stage || !bar) return;

    const SERVICES = [['\uD83C\uDF10', 'A website'], ['\uD83D\uDCF1', 'A mobile app'], ['\uD83E\uDDE9', 'Web app / business software'],
      ['\uD83C\uDF93', 'A college project'], ['\uD83D\uDEE0\uFE0F', 'Fix or improve something'], ['\uD83E\uDD14', 'Not sure yet, help me decide']];
    const PREFS = ['Call me', 'WhatsApp me', 'Either is fine'];
    const fresh = () => ({ i: 0, name: '', service: '', note: '', phone: '', pref: PREFS[2], preset: false, busy: false, mode: '' });
    let S = fresh();
    const first = () => S.name.split(/\s+/)[0] || 'there';
    const closeModal = () => $('#close-quote-modal')?.click();

    const go = (n, dir = 1) => { if (n === 1 && S.preset) n += dir; S.i = Math.max(0, n); render(); };
    const back = () => h('button', { type: 'button', class: 'talk-back', onclick: () => go(S.i - 1, -1), text: '\u2190 Back' });

    function mount(question, ...body) {
      const step = h('div', { class: 'talk-step' }, h('p', { class: 'talk-q', id: 'talk-q', text: question }), ...body);
      stage.replaceChildren(step);
      modal.setAttribute('aria-labelledby', 'talk-q');
      bar.style.transform = `scaleX(${Math.min((S.i + 0.4) / 4, 1)})`;
      const f = step.querySelector('input:not([tabindex="-1"]), textarea, .chip');
      if (f) setTimeout(() => f.focus({ preventScroll: true }), reduce ? 0 : 80);
    }

    function render() {
      if (S.i === 1 && S.preset) S.i = 2;
      const err = h('p', { class: 'talk-err', role: 'alert' });

      if (S.i === 0) {
        const inp = h('input', { class: 'talk-input', type: 'text', autocomplete: 'given-name', maxlength: '60', placeholder: 'Your name', 'aria-labelledby': 'talk-q' });
        inp.value = S.name;
        const next = () => {
          const v = inp.value.trim();
          if (v.length < 2) { err.textContent = 'Just a first name is perfect.'; return; }
          S.name = v; go(1);
        };
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); next(); } });
        mount('Hi there \uD83D\uDC4B What should we call you?',
          h('div', { class: 'talk-row' }, inp, h('button', { type: 'button', class: 'talk-next', 'aria-label': 'Continue', onclick: next, text: '\u2192' })), err);

      } else if (S.i === 1) {
        mount(`Nice to meet you, ${first()}! What would you like to build?`,
          h('div', { class: 'chips', role: 'group', 'aria-labelledby': 'talk-q' },
            ...SERVICES.map(([e, t]) => h('button', { type: 'button', class: 'chip' + (S.service === t ? ' on' : ''), onclick: () => { S.service = t; go(2); } },
              h('span', { 'aria-hidden': 'true', text: e }), t))),
          h('div', { class: 'talk-actions' }, back()));

      } else if (S.i === 2) {
        const ta = h('textarea', { class: 'talk-area', maxlength: '600', placeholder: 'A line or two is plenty. No need to be technical.', 'aria-labelledby': 'talk-q' });
        ta.value = S.note;
        const next = () => { S.note = ta.value.trim(); go(3); };
        mount('Got it! Want to tell us a little more?', ta,
          h('div', { class: 'talk-actions' }, back(),
            h('span', {}, h('button', { type: 'button', class: 'talk-back', onclick: () => { S.note = ''; go(3); }, text: 'Skip' }), ' ',
              h('button', { type: 'button', class: 'btn-primary', onclick: next }, h('span', { text: 'Next' })))));

      } else if (S.i === 3) {
        const inp = h('input', { class: 'talk-input', type: 'tel', inputmode: 'tel', autocomplete: 'tel', maxlength: '20', placeholder: '+91 98765 43210', 'aria-labelledby': 'talk-q' });
        inp.value = S.phone;
        const trap = h('input', { type: 'text', name: 'botcheck', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true', style: 'position:absolute;left:-9999px;opacity:0' });
        const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'How should we reach you?' },
          ...PREFS.map(p => h('button', { type: 'button', class: 'chip' + (S.pref === p ? ' on' : ''), text: p,
            onclick: (e) => { S.pref = p; chips.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === e.currentTarget)); } })));
        const sendBtn = h('button', { type: 'button', class: 'btn-primary' }, h('span', { text: 'Send it' }), h('i', { class: 'fa-solid fa-paper-plane', 'aria-hidden': 'true' }));
        const send = async () => {
          const digits = inp.value.replace(/\D/g, '');
          if (!/^[+\d][\d\s\-()]{6,}$/.test(inp.value.trim()) || digits.length < 8 || digits.length > 15) {
            err.textContent = 'That number looks a bit short. Could you check it?'; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return;
          }
          if (S.busy) return;
          S.phone = inp.value.trim(); S.busy = true; sendBtn.disabled = true; err.textContent = '';
          try {
            S.mode = trap.value ? 'sent' : await submitLead('Conversation lead', {
              name: S.name, phone: S.phone, service: S.service, note: S.note || '(none)', contact_preference: S.pref, page: location.href });
            go(4);
          } catch (_) {
            err.textContent = 'Could not send right now. Please try again or email us directly.';
          } finally { S.busy = false; sendBtn.disabled = false; }
        };
        sendBtn.addEventListener('click', send);
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
        mount(`Last thing, ${first()}. Where can we reach you?`, inp, err,
          h('p', { class: 'talk-sub', text: 'How would you like to hear from us?' }), chips, trap,
          h('div', { class: 'talk-actions' }, back(), sendBtn));

      } else {
        bar.style.transform = 'scaleX(1)';
        const done = h('div', { class: 'talk-done' });
        done.innerHTML = '<svg class="tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l8 8 15-17"/></svg>';
        done.append(
          h('h3', { text: `Thank you, ${first()}!` }),
          h('p', { text: S.mode === 'mailto'
            ? 'Your email app has opened with everything filled in. Just press send and we will take it from there.'
            : `We have your details and will reach out on ${S.phone} within 24 hours.` }),
          h('button', { type: 'button', class: 'btn-secondary', onclick: closeModal, text: 'Close' }));
        stage.replaceChildren(done);
        modal.setAttribute('aria-labelledby', 'talk-q');
        S = fresh();          // next visit starts clean
        S.i = 4;
      }
    }

    // Any element with data-open-talk opens the flow (optionally pre-selecting a service)
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-open-talk]');
      if (!b) return;
      if (S.i === 4) S = fresh();
      const svc = b.dataset.service;
      if (svc) { S.service = svc; S.preset = true; } else S.preset = false;
      render();
      if (b.id !== 'btn-get-quote') window.__openTalk?.();   // hero button is already wired by createModal
    });
    render();
  }

  /* ---------------- 3. Rail drag + floating CTA ---------------- */
  function initRailAndFab() {
    const rail = $('.projects-grid');
    if (rail) {
      let down = false, moved = false, sx = 0, sl = 0;
      rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
      window.addEventListener('pointermove', (e) => {
        if (!down) return; const dx = e.clientX - sx;
        if (Math.abs(dx) > 5) { moved = true; rail.classList.add('dragging'); }
        rail.scrollLeft = sl - dx;
      });
      window.addEventListener('pointerup', () => { down = false; rail.classList.remove('dragging'); });
      rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    }
    const fab = $('#talk-fab'), hero = $('#home');
    if (fab && hero) {
      new IntersectionObserver(([en]) => fab.classList.toggle('visible', !en.isIntersecting), { threshold: 0.15 }).observe(hero);
    }
  }

  initExplorer();
  initTalk();
  initRailAndFab();
})();
