/*
 * Builds the slides from a plain-text file (slides.md) so that anyone can edit
 * the presentation without touching HTML. See EDITING.md for the format.
 *
 * Exposes window.deckReady, a promise that deck.js waits for before starting.
 */
window.deckReady = (async () => {
  'use strict';

  const deck = document.getElementById('deck');
  const source = deck?.dataset.source;
  if (!source) return; // slides are written directly in index.html

  // Settings a slide can start with ("layout: demo", "kicker: The problem", ...)
  const SLIDE_KEYS = new Set([
    'layout', 'kicker', 'id', 'title', 'icon', 'cards',
    'url', 'label', 'backup', 'preload', 'allow-top-navigation',
    'before', 'before-label', 'after', 'after-label',
  ]);

  const ICONS = new Set(
    Array.from(document.querySelectorAll('symbol[id^="i-"]'), s => s.id.slice(2)));

  // ---------- load ---------------------------------------------------------

  let text;
  try {
    const res = await fetch(source, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    text = await res.text();
  } catch (err) {
    const local = location.protocol === 'file:';
    deck.innerHTML = `
      <section class="slide is-active">
        <p class="kicker">Can't load the slides</p>
        <h2>${local ? 'Open this deck through a web server' : `Couldn't load ${esc(source)}`}</h2>
        <p class="lead">${local
          ? 'Browsers block reading slides.md from a file. In this folder, run <code>python -m http.server 8000</code> and open <code>http://localhost:8000</code>.'
          : esc(String(err.message || err))}</p>
      </section>`;
    return;
  }

  const { settings, slides } = parseDeck(text);
  if (settings['talk-minutes']) document.body.dataset.talkMinutes = settings['talk-minutes'];
  if (settings['page-title']) document.title = settings['page-title'];

  const usedIds = new Set();
  deck.innerHTML = slides.map(s => renderSlide(s, usedIds)).join('\n');

  watchForEdits(text);

  // ---------- parsing ------------------------------------------------------

  function parseDeck(src) {
    src = src.replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '');
    const chunks = src.split(/^[ \t]*-{3,}[ \t]*$/m).filter(c => c.trim());
    let settings = {};

    // An optional first block holding only "key: value" lines is the deck's settings.
    if (chunks.length && chunks[0].trim().split('\n').every(l => !l.trim() || /^\s*[a-z][\w-]*\s*:/i.test(l))) {
      for (const l of chunks.shift().split('\n')) {
        const m = l.match(/^\s*([a-z][\w-]*)\s*:\s*(.*?)\s*$/i);
        if (m) settings[m[1].toLowerCase()] = m[2];
      }
    }
    return { settings, slides: chunks.map(parseSlide) };
  }

  function parseSlide(chunk) {
    const lines = chunk.split('\n');
    let i = 0;
    while (i < lines.length && !lines[i].trim()) i++;

    const settings = {};
    for (; i < lines.length; i++) {
      const m = lines[i].match(/^\s*([a-z][a-z-]*)\s*:\s*(.*?)\s*$/i);
      if (!m || !SLIDE_KEYS.has(m[1].toLowerCase())) break;
      settings[m[1].toLowerCase()] = m[2];
    }

    const rest = lines.slice(i);
    const notesAt = rest.findIndex(l => /^\s*notes\s*:\s*$/i.test(l));
    return {
      settings,
      blocks: parseBlocks(notesAt < 0 ? rest : rest.slice(0, notesAt)),
      notes: notesAt < 0 ? [] : parseBlocks(rest.slice(notesAt + 1)),
    };
  }

  function parseBlocks(lines) {
    const out = [];
    const blank = l => !l.trim();
    const LIST = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/;
    const SPECIAL = /^(#{1,3}\s|\s*(?:[-*+]|\d+[.)])\s|\s*<|\s*!\[)/;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      let m;
      if (blank(line)) { i++; continue; }

      if (/^\s*</.test(line)) {                                   // raw HTML block
        const buf = [];
        while (i < lines.length && !blank(lines[i])) buf.push(lines[i++]);
        out.push({ type: 'html', html: buf.join('\n') });
      } else if ((m = line.match(/^###\s+(.*)$/))) {              // card / column
        i++;
        const buf = [];
        while (i < lines.length && !blank(lines[i]) && !/^#{1,3}\s/.test(lines[i])) buf.push(lines[i++]);
        out.push({ type: 'card', title: m[1], blocks: parseBlocks(buf) });
      } else if ((m = line.match(/^#{1,2}\s+(.*)$/))) {           // slide heading
        out.push({ type: 'heading', text: m[1] });
        i++;
      } else if ((m = line.match(/^\s*!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)\s*$/))) { // picture
        out.push({ type: 'image', alt: m[1], src: m[2], caption: m[3] || '' });
        i++;
      } else if (LIST.test(line)) {                               // bullet / numbered list
        const ordered = /^\s*\d/.test(line);
        const items = [];
        while (i < lines.length && !blank(lines[i])) {
          const li = lines[i].match(LIST);
          if (li) items.push(li[1]);
          else items[items.length - 1] += ' ' + lines[i].trim();
          i++;
        }
        out.push({ type: 'list', ordered, items });
      } else {                                                    // paragraph
        const buf = [lines[i++].trim()];
        while (i < lines.length && !blank(lines[i]) && !SPECIAL.test(lines[i])) buf.push(lines[i++].trim());
        out.push({ type: 'para', text: buf.join(' ') });
      }
    }
    return out;
  }

  // ---------- rendering ----------------------------------------------------

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function icon(name) { return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`; }

  /** **bold**, *italic*, `code`, [link](url), :icon-name:, {High} / {Medium} / {Low} / {Info} */
  function inline(s) {
    const codes = [];
    s = s.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(esc(c)) - 1}\u0000`);
    s = s.replace(/\[([^\]]+)\]\(\s*([^)\s]+)\s*\)/g,
      (_, t, u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>`);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/:([a-z][a-z-]*):/g, (whole, n) => ICONS.has(n) ? icon(n) : whole);
    s = s.replace(/\{(High|Medium|Low|Info)\}/gi,
      (_, w) => `<span class="sev-inline sev--${w.toLowerCase()}">${w}</span>`);
    return s.replace(/\u0000(\d+)\u0000/g, (_, n) => `<code>${codes[n]}</code>`);
  }

  function plain(html) { const d = document.createElement('div'); d.innerHTML = html; return d.textContent.trim(); }

  function list(items, ordered, cls) {
    const tag = ordered ? 'ol' : 'ul';
    return `<${tag}${cls ? ` class="${cls}"` : ''}>${items.map(t => `<li>${inline(t)}</li>`).join('')}</${tag}>`;
  }

  function figure(b) {
    return `<figure class="shot"><img src="${esc(b.src)}" alt="${esc(b.alt)}">` +
      (b.caption ? `<figcaption>${inline(b.caption)}</figcaption>` : '') + '</figure>';
  }

  /** Generic rendering, used by most layouts. Consecutive cards are grouped. */
  function blocksHtml(blocks, { heading = 'h2', listClass = 'points', cards = 'cards' } = {}) {
    let html = '';
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.type === 'card') {
        const group = [];
        while (blocks[i]?.type === 'card') group.push(blocks[i++]);
        i--;
        html += `<div class="${cards}">` + group.map(c =>
          `<article class="card"><h3>${inline(c.title)}</h3>${blocksHtml(c.blocks, { listClass: 'points points--compact' })}</article>`
        ).join('') + '</div>';
      } else if (b.type === 'heading') html += `<${heading}>${inline(b.text)}</${heading}>`;
      else if (b.type === 'para') html += `<p>${inline(b.text)}</p>`;
      else if (b.type === 'list') html += list(b.items, b.ordered, listClass);
      else if (b.type === 'image') html += figure(b);
      else if (b.type === 'html') html += b.html;
    }
    return html;
  }

  function demoHtml(url, label, { preload = false, backup = '', topNav = false } = {}) {
    return `<div class="demo" data-src="${esc(url || '')}" data-label="${esc(label || 'Live demo')}"` +
      (preload ? ' data-preload' : '') + (backup ? ` data-backup="${esc(backup)}"` : '') +
      (topNav ? ' data-allow-top-navigation' : '') + '></div>';
  }

  function renderSlide({ settings: s, blocks, notes }, usedIds) {
    const layout = (s.layout || 'standard').toLowerCase();
    const heading = blocks.find(b => b.type === 'heading');
    const others = blocks.filter(b => b !== heading);
    const kicker = s.kicker ? `<p class="kicker">${inline(s.kicker)}</p>` : '';
    const title = s.title || (heading ? plain(inline(heading.text)) : '') || s.kicker || 'Slide';
    let cls = 'slide';
    let body;

    switch (layout) {
      case 'title': {
        cls += ' slide--title';
        const h1 = heading ? `<h1>${inline(heading.text)}</h1>` : '';
        body = kicker +
          (s.icon ? `<div class="brand"><span class="brand__icon"><svg><use href="#i-${esc(s.icon)}"/></svg></span>${h1}</div>` : h1) +
          others.map(b =>
            b.type === 'para' ? `<p class="lead">${inline(b.text)}</p>` :
            b.type === 'list' ? list(b.items, false, 'team') : blocksHtml([b])).join('');
        break;
      }
      case 'stats':
        body = kicker + (heading ? `<h2>${inline(heading.text)}</h2>` : '') + others.map(b => {
          if (b.type !== 'list') return blocksHtml([b]);
          return '<div class="stats">' + b.items.map(t => {
            const m = t.match(/^\*\*(.+?)\*\*\s*(.*)$/);
            return `<div class="stat"><span class="stat__value">${inline(m ? m[1] : t)}</span>` +
              `<span class="stat__label">${m ? inline(m[2]) : ''}</span></div>`;
          }).join('') + '</div>';
        }).join('');
        break;
      case 'columns': {
        const cards = others.filter(b => b.type === 'card');
        body = kicker + (heading ? `<h2>${inline(heading.text)}</h2>` : '') +
          blocksHtml(others.filter(b => b.type !== 'card')) +
          '<div class="split">' + cards.map(c =>
            `<div><h3>${inline(c.title)}</h3>${blocksHtml(c.blocks, { listClass: 'points points--compact' })}</div>`).join('') + '</div>';
        break;
      }
      case 'flow': {
        let flowDone = false;
        body = kicker + (heading ? `<h2>${inline(heading.text)}</h2>` : '') + others.map(b => {
          if (b.type !== 'list' || flowDone) return blocksHtml([b], { listClass: 'points points--compact' });
          flowDone = true;
          return '<ol class="flow">' + b.items.map(t => {
            const ours = /\(highlight\)\s*$/i.test(t);
            t = t.replace(/\s*\(highlight\)\s*$/i, '');
            const m = t.match(/^\*\*(.+?)\*\*\s*[—–:-]?\s*(.*)$/);
            return `<li class="flow__step${ours ? ' flow__step--ours' : ''}">` +
              (m ? `<strong>${inline(m[1])}</strong><span>${inline(m[2])}</span>` : `<strong>${inline(t)}</strong>`) + '</li>';
          }).join('') + '</ol>';
        }).join('');
        break;
      }
      case 'demo':
      case 'compare': {
        cls += ' slide--demo';
        const head = `<header class="slide__header">${icon(s.icon || 'scorecard')}<h2>${heading ? inline(heading.text) : 'Live demo'}</h2></header>`;
        const no = v => /^(no|false|off)$/i.test(v || '');
        const topNav = /^(yes|true|on)$/i.test(s['allow-top-navigation'] || '');
        body = head + (layout === 'demo'
          ? demoHtml(s.url, s.label, { preload: !no(s.preload), backup: s.backup, topNav })
          : '<div class="demo-compare">' +
              demoHtml(s.before, s['before-label'] || 'Before', { preload: !no(s.preload) && !!s.before, topNav }) +
              demoHtml(s.after, s['after-label'] || 'After', { preload: !no(s.preload) && !!s.after, topNav }) + '</div>');
        break;
      }
      default: {
        const cards = s.cards && /compact|small/i.test(s.cards) ? 'cards cards--compact' : 'cards';
        const images = others.filter(b => b.type === 'image');
        if (images.length) {
          // Text on the left, picture on the right.
          body = `<div class="with-shot"><div>${kicker}${heading ? `<h2>${inline(heading.text)}</h2>` : ''}` +
            `${blocksHtml(others.filter(b => b.type !== 'image'), { listClass: 'points points--compact', cards })}</div>` +
            `${figure(images[0])}</div>`;
        } else {
          body = kicker + (heading ? `<h2>${inline(heading.text)}</h2>` : '') + blocksHtml(others, { cards });
        }
      }
    }

    let id = (s.id || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'slide';
    while (usedIds.has(id)) id += '-2';
    usedIds.add(id);

    const notesHtml = notes.length ? `<aside class="notes">${blocksHtml(notes, { listClass: '' })}</aside>` : '';
    return `<section class="${cls}" id="${esc(id)}" data-title="${esc(title)}">${body}${notesHtml}</section>`;
  }

  // ---------- live refresh while editing locally ----------------------------

  function watchForEdits(original) {
    if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(source, { cache: 'no-store' });
        if (res.ok && (await res.text()) !== original) location.reload();
      } catch { /* server stopped; try again next time */ }
    }, 1500);
  }
})();
