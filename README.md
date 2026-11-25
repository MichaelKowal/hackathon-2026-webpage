# Hackathon 2026 — presentation site

A tiny, dependency-free slide deck that runs on GitHub Pages and can embed live
VertiGIS Studio Web apps. No build step: edit `slides.md`, push, done.

**Just want to change the words on the slides? Read [EDITING.md](EDITING.md).**

```
slides.md           ← all slide text lives here (plain text, see EDITING.md)
index.html          ← page shell and icons; points at slides.md
css/deck.css        ← colours and layout (theme variables at the top)
js/slides-md.js     ← turns slides.md into slides
js/deck.js          ← navigation, presenter view, demo embedding
media/              ← screenshots, backup videos
.nojekyll           ← tells GitHub Pages to serve files as-is
```

## Editing slides

The slides are written in `slides.md`, a simple Markdown-like format that
`js/slides-md.js` turns into HTML when the page loads. The format, layouts and
settings are documented for non-developers in [EDITING.md](EDITING.md).

- The deck has to be served over HTTP (GitHub Pages, or
  `python -m http.server`), because browsers won't let a page read
  `slides.md` from a `file://` URL.
- When the deck is served from `localhost`, it checks `slides.md` every 1.5
  seconds and reloads itself when the file changes.
- Press **E** (or use the link in the **?** help) to open `slides.md` in
  GitHub's web editor. The link comes from `data-edit-url` on `<main>` in
  `index.html`.
- Lines starting with `<` are passed through as raw HTML, so anything the
  format can't express can still be written by hand. The "From insight to fix"
  slide does this for its imitation scorecard list.

Available CSS building blocks for raw HTML: `.kicker`, `.lead`, `.points`,
`.cards`/`.card`, `.stats`/`.stat`, `.flow`/`.flow__step`, `.split`, `.team`,
`.with-shot`/`.shot`, and the App Scorecard look-alikes `.insights`/`.insight`,
`.sev sev--high` / `.sev sev--medium`, `.tag` and `.ui-btn`. Icons are SVG
symbols at the top of `index.html`: `:name:` in `slides.md`, or
`<svg class="icon"><use href="#i-name"/></svg>` in HTML.

The theme colours are variables at the top of `css/deck.css`, matched to App
Designer: the dark rail, VertiGIS blue, and the red and orange severity colours.

To write slides directly in HTML instead, remove `data-source` from `<main>`
and put `<section class="slide">` elements inside it.

## Live demos

```
---
layout: demo
title: Live demo
url: http://localhost:3000/
label: Studio Web — with our changes
backup: media/demo-backup.mp4

# Live demo
```

| Setting | What it does |
|---|---|
| `url:` | Address of the app to embed in an iframe. |
| `label:` | Text in the demo toolbar. |
| `preload:` | Loads the app in the background when the deck opens, so maps and sign-in are done before you reach the slide. On by default; `preload: no` turns it off. |
| `backup:` | Optional video file. Adds a **Backup video** button that swaps the live app for a recording. |
| `allow-top-navigation: yes` | Lets the app navigate the whole deck window (off by default, see Sign-in below). |

`layout: compare` shows two apps side by side, using `before:`,
`before-label:`, `after:` and `after-label:`.

Each demo has a toolbar with **Reload**, **New tab ↗** and **Fullscreen**. A
demo keeps its state when you move between slides, so you can go back to it
during Q&A.

### Will my app load inside the deck?

Test this early. Things that can stop an app loading in an iframe:

- **The server blocks embedding.** If the iframe shows "refused to connect",
  the host sends `X-Frame-Options` or a CSP `frame-ancestors` header. Use
  **New tab ↗**, or allow `https://<you>.github.io` as a frame ancestor on a
  server you control.
- **Sign-in.** Studio Web normally signs in by redirecting the whole browser
  window, which would replace the deck. So demo frames are sandboxed: an app
  can't navigate the deck window, and Studio Web falls back to a **Sign in**
  button that opens a popup instead. Sign in through that popup before you
  present. (Add `allow-top-navigation: yes` to a demo slide to turn the sandbox
  off.) ArcGIS/portal sign-in pages also often refuse to render inside an
  iframe. Also, when the deck and the app are on different sites (for example
  the deck on GitHub Pages and the app on `localhost`), browsers keep the
  iframe's storage and cookies separate. Signing in to the app in its own tab
  then does **not** sign in the copy inside the deck. Serve the deck from the
  same host as the app (see below), or use a publicly shared app and web map.
- **Local dev servers.** A `localhost` URL always points at the computer
  viewing the page. On GitHub Pages, only the presenter's own machine (running
  the app) will show the demo; anyone else opening the link sees an empty
  frame, so set `backup:` for them. Newer Chrome/Edge versions may also ask
  for permission to reach local network devices, and Safari may block an
  `http://localhost` frame inside an HTTPS page.

**Recommended for this project:** the demo runs at `http://localhost:3000/`, so
present from a local copy of the deck at `http://localhost:8000` (see
[Running locally](#running-locally)). The deck and the app are then the same
site, which avoids the problems above. Use the GitHub Pages copy for sharing the
link only. Start the demo app before opening the deck, so preloading can
warm it up.

Always record a backup video of the demo and set `backup:` on the demo slide.

## Presenting

| Key | Action |
|-----|--------|
| → ↓ Space PgDn N | Next slide |
| ← ↑ Shift+Space PgUp | Previous slide |
| Home / End | First / last slide |
| `3` then Enter | Jump to slide 3 |
| G | Slide list |
| P | Open presenter view |
| F | Fullscreen |
| B or . | Blank the screen |
| R | Reload the demo on the current slide |
| S | Start/pause the timer (presenter view) |
| ? | Shortcut help |

Presentation clickers that send PageUp/PageDown work too.

**Presenter view** (press **P**, or open `index.html?presenter`) opens a second
window with your notes, the next slide, a list of all slides, and a timer. The
timer counts down from `talk-minutes` at the top of `slides.md` and turns amber in the
last minute and red when you run over. The two windows stay in sync, and the
presenter window does not load the demo apps.

**For a virtual presentation:** share only the audience window or tab, not
your whole screen. Keep the presenter view on another monitor, or on the same
screen outside the shared window. When you click into a live demo, the demo
gets the keyboard and the arrow keys go to the map. To change slides, use the
‹ › buttons at the top right or the presenter window.

## Running locally

Any static file server works:

```powershell
python -m http.server 8000
```

Then open http://localhost:8000.

## Publishing on GitHub Pages

1. Create a GitHub repository and push these files to `main`.
2. In the repository, go to **Settings → Pages**. Under **Source**, choose
   **Deploy from a branch**, then select `main` and `/ (root)`.
3. After about a minute the deck is live at `https://<user-or-org>.github.io/<repo>/`.

## Backup PDF

In the audience window, use the browser's **Print → Save as PDF** to get one
page per slide. Live demos are left out. This is useful if the network fails.
