/*
 * Hackathon deck — a tiny, dependency-free slide engine.
 *
 *   Audience view:   index.html            (share this window/tab)
 *   Presenter view:  index.html?presenter  (press P to open; notes, timer, slide list)
 *
 * The two windows stay in sync through a BroadcastChannel, so you can drive
 * the deck from the presenter window even while the audience window has a
 * live demo focused.
 */
(() => {
  'use strict';

  const PRESENTER = new URLSearchParams(location.search).has('presenter');
  const deck = document.getElementById('deck');
  const slides = Array.from(deck.querySelectorAll(':scope > .slide'));
  const channel = 'BroadcastChannel' in window
    ? new BroadcastChannel('hackathon-deck:' + location.pathname)
    : null;

  let current = -1;
  let blanked = false;

  // ---------- helpers ----------------------------------------------------

  /** Small element builder: h('button', {class: 'btn', onclick: fn}, 'Text') */
  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    el.append(...children);
    return el;
  }

  /** A button that drops focus after clicking, so Space/Enter keep driving the deck. */
  function button(label, title, onClick, cls = 'btn') {
    return h('button', {
      type: 'button', class: cls, title, 'aria-label': title,
      onclick: e => { e.currentTarget.blur(); onClick(e); },
    }, label);
  }

  const clamp = i => Math.max(0, Math.min(slides.length - 1, i));
  const titleOf = i =>
    slides[i].dataset.title ||
    slides[i].querySelector('h1, h2')?.textContent.trim() ||
    `Slide ${i + 1}`;
  const notesOf = i =>
    slides[i].querySelector('.notes')?.innerHTML.trim() || '<p class="muted">No notes for this slide.</p>';
  const isDemoSlide = i => slides[i].classList.contains('slide--demo');

  slides.forEach((s, i) => { if (!s.id) s.id = `slide-${i + 1}`; });

  function indexFromHash() {
    const key = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    if (!key) return 0;
    if (/^\d+$/.test(key)) return clamp(Number(key) - 1);
    const i = slides.findIndex(s => s.id === key);
    return i < 0 ? 0 : i;
  }

  function send(msg) { channel?.postMessage(msg); }

  // ---------- navigation -------------------------------------------------

  function go(i, { broadcast = true } = {}) {
    i = clamp(i);
    if (i === current) return;
    current = i;

    slides.forEach((s, j) => {
      const active = j === i;
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', String(!active));
      s.inert = !active;
    });

    const hash = '#/' + slides[i].id;
    if (location.hash !== hash) history.replaceState(null, '', hash);

    if (!PRESENTER) slides[i].querySelectorAll('.demo').forEach(d => loadDemo(d));
    render();
    if (broadcast) send({ type: 'goto', index: i });
  }

  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  // ---------- live demos -------------------------------------------------

  function setupDemo(el) {
    const src = (el.dataset.src || '').trim();
    const label = el.dataset.label || 'Live demo';
    const backup = (el.dataset.backup || '').trim();

    if (PRESENTER) {
      // Never load demos in the presenter window: it would start a second
      // copy of the app (and a second sign-in, map load, etc.).
      el.replaceChildren(h('div', { class: 'demo__placeholder' },
        h('strong', { text: label }),
        h('code', { text: src || '(no data-src set)' })));
      return;
    }

    const frame = h('div', { class: 'demo__frame' });
    const actions = h('span', { class: 'demo__actions' },
      button('Reload', 'Reload this demo (R)', () => loadDemo(el, true)),
      button('New tab ↗', 'Open this demo in a new tab', () => src && window.open(src, '_blank', 'noopener')),
      button('Fullscreen', 'Show only this demo, fullscreen', () => toggleFullscreen(el)));

    if (backup) {
      actions.append(button('Backup video', 'Swap the live demo for the recorded backup', e => {
        const on = el.classList.toggle('show-backup');
        let video = frame.querySelector('video');
        if (!video) {
          video = h('video', { class: 'demo__backup', src: backup, controls: true, playsinline: true, preload: 'auto' });
          frame.append(video);
        }
        if (on) video.play().catch(() => {}); else video.pause();
        e.currentTarget.textContent = on ? 'Back to live' : 'Backup video';
      }));
    }

    el.replaceChildren(
      h('div', { class: 'demo__bar' },
        h('span', { class: 'demo__label', text: label }),
        h('span', { class: 'demo__url', text: src, title: src }),
        actions),
      frame);

    if (!src) {
      frame.append(h('div', { class: 'demo__empty' },
        h('strong', { text: 'No demo URL yet' }),
        h('span', { text: 'Set data-src on this .demo element in index.html to your VertiGIS Studio Web app URL.' })));
    }
  }

  function loadDemo(el, force = false) {
    const src = (el.dataset.src || '').trim();
    if (PRESENTER || !src) return;
    const frame = el.querySelector('.demo__frame');
    const existing = frame.querySelector('iframe');
    if (existing && !force) return;

    // Replace rather than re-assign src so a reload is a genuinely fresh load.
    const iframe = h('iframe', {
      src,
      title: el.dataset.label || 'Live demo',
      allow: 'fullscreen; geolocation; clipboard-read; clipboard-write',
      // Everything an app normally needs, except navigating the top window.
      // Without this, an app that redirects to a sign-in page (as Studio Web
      // does) replaces the whole deck. Popups are still allowed, so popup-based
      // sign-in can work. Add data-allow-top-navigation to opt out.
      sandbox: 'allowTopNavigation' in el.dataset ? undefined : [
        'allow-scripts', 'allow-same-origin', 'allow-forms', 'allow-popups',
        'allow-popups-to-escape-sandbox', 'allow-modals', 'allow-downloads',
        'allow-pointer-lock', 'allow-presentation', 'allow-storage-access-by-user-activation',
      ].join(' '),
    });
    if (existing) existing.replaceWith(iframe); else frame.prepend(iframe);
  }

  function reloadCurrentDemos() {
    slides[current].querySelectorAll('.demo').forEach(d => loadDemo(d, true));
  }

  function toggleFullscreen(el = document.documentElement) {
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.().catch(() => {});
  }

  // ---------- overlays: slide list, help, blank screen --------------------

  const overlays = {};

  function buildOverlays() {
    const list = h('ol', { class: 'overview__list' },
      ...slides.map((_, i) => h('li', {},
        button(h('span', {}, h('span', { class: 'overview__num', text: i + 1 }), titleOf(i)),
          `Go to slide ${i + 1}`, () => { closeOverlays(); go(i); }, 'overview__item'))));

    overlays.overview = h('div', { class: 'overlay', role: 'dialog', 'aria-label': 'All slides', hidden: true },
      h('div', { class: 'overlay__panel' },
        h('div', { class: 'overlay__head' }, h('h2', { text: 'Slides' }), button('Close', 'Close (Esc)', closeOverlays)),
        list));

    const keys = [
      ['→  ↓  Space  PgDn  N', 'Next slide'],
      ['←  ↑  Shift+Space  PgUp', 'Previous slide'],
      ['Home / End', 'First / last slide'],
      ['3 then Enter', 'Jump to slide 3'],
      ['G', 'Slide list'],
      ['P', 'Open presenter view (notes + timer)'],
      ['F', 'Fullscreen'],
      ['B or .', 'Blank the screen'],
      ['R', 'Reload the demo on this slide'],
      ['S', 'Start / pause timer (presenter view)'],
      ['?', 'This help'],
    ];
    overlays.help = h('div', { class: 'overlay', role: 'dialog', 'aria-label': 'Keyboard shortcuts', hidden: true },
      h('div', { class: 'overlay__panel overlay__panel--narrow' },
        h('div', { class: 'overlay__head' }, h('h2', { text: 'Keyboard shortcuts' }), button('Close', 'Close (Esc)', closeOverlays)),
        h('dl', { class: 'keys' }, ...keys.flatMap(([k, d]) => [h('dt', { text: k }), h('dd', { text: d })])),
        h('p', { class: 'muted', text: 'Tip: once you click into a live demo, the demo has the keyboard. Use the ‹ › buttons, or drive from the presenter view.' })));

    overlays.blank = h('div', { class: 'blank', hidden: true, onclick: () => setBlank(false) });

    document.body.append(overlays.overview, overlays.help, overlays.blank);
  }

  const openOverlay = () => Object.entries(overlays).find(([k, el]) => k !== 'blank' && !el.hidden)?.[0];

  function showOverlay(name) {
    closeOverlays();
    overlays[name].hidden = false;
    const target = name === 'overview'
      ? overlays.overview.querySelectorAll('.overview__item')[current]
      : overlays[name].querySelector('button');
    target?.focus();
  }

  function closeOverlays() {
    for (const [k, el] of Object.entries(overlays)) if (k !== 'blank') el.hidden = true;
    document.activeElement?.blur?.();
  }

  function setBlank(on, { broadcast = true } = {}) {
    blanked = on;
    if (!PRESENTER) overlays.blank.hidden = !on;
    render();
    if (broadcast) send({ type: 'blank', on });
  }

  // ---------- audience chrome --------------------------------------------

  const chrome = {};

  function buildChrome() {
    chrome.bar = h('div', { class: 'progress__bar' });
    chrome.count = h('span', { class: 'nav__count' });
    document.body.append(
      h('div', { class: 'progress', 'aria-hidden': 'true' }, chrome.bar),
      h('nav', { class: 'nav', 'aria-label': 'Slide navigation' },
        button('‹', 'Previous slide (←)', prev, 'btn btn--icon'),
        button(chrome.count, 'All slides (G)', () => showOverlay('overview'), 'btn btn--count'),
        button('›', 'Next slide (→)', next, 'btn btn--icon'),
        button('P', 'Open presenter view (P)', openPresenter, 'btn btn--icon'),
        button('?', 'Keyboard shortcuts (?)', () => showOverlay('help'), 'btn btn--icon')));
  }

  function openPresenter() {
    const url = location.pathname + '?presenter' + location.hash;
    window.open(url, 'deck-presenter', 'width=1100,height=760');
  }

  // ---------- presenter view ---------------------------------------------

  const pv = {};
  const timer = {
    limit: Number(document.body.dataset.talkMinutes) * 60 || 0, // seconds, 0 = count up
    elapsed: 0, startedAt: 0, running: false,
  };

  function buildPresenter() {
    document.body.classList.add('is-presenter');
    document.title = 'Presenter — ' + document.title;

    pv.time = h('span', { class: 'pv__time' });
    pv.toggle = button('Start', 'Start / pause timer (S)', toggleTimer);
    pv.clock = h('span', { class: 'pv__clock' });
    pv.count = h('span', { class: 'pv__count' });
    pv.link = h('span', { class: 'pv__link', text: 'Audience window: not detected' });
    pv.nowLabel = h('p', { class: 'pv__label' });
    pv.nowTitle = h('h2', { class: 'pv__title' });
    pv.notes = h('div', { class: 'pv__notes' });
    pv.nextTitle = h('p', { class: 'pv__next' });
    pv.blank = button('Blank screen', 'Blank the audience screen (B)', () => setBlank(!blanked));
    pv.list = h('ol', { class: 'pv__list' },
      ...slides.map((_, i) => h('li', {},
        button(h('span', {}, h('span', { class: 'overview__num', text: i + 1 }), titleOf(i)),
          `Go to slide ${i + 1}`, () => go(i), 'pv__item'))));

    document.body.append(h('div', { class: 'pv' },
      h('header', { class: 'pv__head' },
        h('div', { class: 'pv__timer' }, pv.time, pv.toggle,
          button('Reset', 'Reset timer', resetTimer)),
        pv.count, pv.clock),
      h('section', { class: 'pv__main' },
        pv.nowLabel, pv.nowTitle, pv.notes),
      h('aside', { class: 'pv__side' },
        h('p', { class: 'pv__label', text: 'Up next' }), pv.nextTitle,
        h('p', { class: 'pv__label', text: 'All slides' }), pv.list),
      h('footer', { class: 'pv__foot' },
        button('‹ Prev', 'Previous slide (←)', prev, 'btn btn--big'),
        button('Next ›', 'Next slide (→)', next, 'btn btn--big'),
        pv.blank,
        button('Reload demo', 'Reload the live demo on the current slide (R)', () => send({ type: 'reload-demo' })),
        pv.link)));

    setInterval(renderTimer, 250);
    renderTimer();
  }

  const timerSeconds = () =>
    timer.elapsed + (timer.running ? (Date.now() - timer.startedAt) / 1000 : 0);

  function toggleTimer() {
    if (timer.running) timer.elapsed = timerSeconds();
    else timer.startedAt = Date.now();
    timer.running = !timer.running;
    renderTimer();
  }

  function resetTimer() {
    timer.running = false;
    timer.elapsed = 0;
    renderTimer();
  }

  function renderTimer() {
    if (!PRESENTER) return;
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const t = timerSeconds();
    let text = fmt(t), state = '';
    if (timer.limit) {
      const left = timer.limit - t;
      text = left >= 0 ? fmt(Math.ceil(left)) : '+' + fmt(-left);
      state = left < 0 ? 'over' : left <= 60 ? 'warn' : '';
    }
    pv.time.textContent = text;
    pv.time.dataset.state = state;
    pv.toggle.textContent = timer.running ? 'Pause' : (t ? 'Resume' : 'Start');
    pv.clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ---------- rendering --------------------------------------------------

  function render() {
    if (current < 0) return;
    const n = slides.length;

    if (PRESENTER) {
      pv.count.textContent = `Slide ${current + 1} / ${n}`;
      pv.nowLabel.textContent = isDemoSlide(current) ? 'Now · live demo slide' : 'Now';
      pv.nowTitle.textContent = titleOf(current);
      pv.notes.innerHTML = notesOf(current);
      pv.nextTitle.textContent = current < n - 1 ? titleOf(current + 1) : '— end of deck —';
      pv.list.querySelectorAll('.pv__item').forEach((b, i) => b.classList.toggle('is-current', i === current));
      pv.list.querySelectorAll('.pv__item')[current]?.scrollIntoView({ block: 'nearest' });
      pv.blank.textContent = blanked ? 'Unblank screen' : 'Blank screen';
      pv.blank.classList.toggle('is-on', blanked);
      return;
    }

    chrome.bar.style.width = `${((current + 1) / n) * 100}%`;
    chrome.count.textContent = `${current + 1} / ${n}`;
    document.body.classList.toggle('on-demo', isDemoSlide(current));
  }

  // ---------- keyboard ---------------------------------------------------

  let digits = '';
  let digitsTimer = 0;

  function onKey(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;

    if (openOverlay()) {
      if (e.key === 'Escape' || e.key === 'g' || e.key === 'G' || e.key === '?') { e.preventDefault(); closeOverlays(); }
      return; // let Tab / Enter work normally inside the overlay
    }

    if (/^[0-9]$/.test(e.key)) {
      digits += e.key;
      clearTimeout(digitsTimer);
      digitsTimer = setTimeout(() => { digits = ''; }, 2000);
      return;
    }

    const handled = () => e.preventDefault();
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case 'n': case 'N':
        handled(); next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
        handled(); prev(); break;
      case ' ':
        handled(); e.shiftKey ? prev() : next(); break;
      case 'Home': handled(); go(0); break;
      case 'End': handled(); go(slides.length - 1); break;
      case 'Enter':
        if (digits) { handled(); go(Number(digits) - 1); digits = ''; }
        break;
      case 'g': case 'G': handled(); showOverlay('overview'); break;
      case '?': handled(); showOverlay('help'); break;
      case 'b': case 'B': case '.': handled(); setBlank(!blanked); break;
      case 'f': case 'F': handled(); toggleFullscreen(); break;
      case 'p': case 'P': if (!PRESENTER) { handled(); openPresenter(); } break;
      case 'r': case 'R':
        handled();
        if (PRESENTER) send({ type: 'reload-demo' }); else reloadCurrentDemos();
        break;
      case 's': case 'S': if (PRESENTER) { handled(); toggleTimer(); } break;
      case 'Escape': if (blanked) { handled(); setBlank(false); } break;
    }
  }

  // ---------- sync between windows ---------------------------------------

  channel?.addEventListener('message', ({ data }) => {
    if (PRESENTER && pv.link) {
      pv.link.textContent = 'Audience window: connected';
      pv.link.classList.add('is-ok');
    }
    switch (data?.type) {
      case 'goto': go(data.index, { broadcast: false }); break;
      case 'blank': setBlank(data.on, { broadcast: false }); break;
      case 'hello': if (!PRESENTER) send({ type: 'state', index: current, blank: blanked }); break;
      case 'state':
        if (PRESENTER) { go(data.index, { broadcast: false }); setBlank(data.blank, { broadcast: false }); }
        break;
      case 'reload-demo': if (!PRESENTER) reloadCurrentDemos(); break;
    }
  });

  // ---------- boot -------------------------------------------------------

  document.querySelectorAll('.demo').forEach(setupDemo);
  buildOverlays();
  if (PRESENTER) buildPresenter(); else buildChrome();

  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', () => go(indexFromHash()));

  go(indexFromHash(), { broadcast: false });
  document.body.classList.add('is-ready');

  if (PRESENTER) {
    send({ type: 'hello' }); // ask the audience window where it is
  } else {
    // Warm up demos marked data-preload so they're ready when you reach them.
    window.addEventListener('load', () => {
      setTimeout(() => document.querySelectorAll('.demo[data-preload]').forEach(d => loadDemo(d)), 1000);
    });
  }
})();
