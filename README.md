# Hackathon 2026 — presentation site

A tiny, dependency-free slide deck that runs on GitHub Pages and can embed live
VertiGIS Studio Web apps. No build step: edit `index.html`, push, done.

```
index.html      ← all slide content lives here
css/deck.css    ← colours and layout (theme variables at the top)
js/deck.js      ← navigation, presenter view, demo embedding
.nojekyll       ← tells GitHub Pages to serve files as-is
```

## Editing slides

Each `<section class="slide">` in `index.html` is one slide, in order.

- `id="demo"` → the slide's URL is `…/#/demo` (or use its number: `#/4`).
- `data-title="…"` → the name in the slide list and presenter view.
- `<aside class="notes">…</aside>` → speaker notes, only shown in the presenter view.

Ready-made building blocks: `.kicker`, `.lead`, `.points`, `.cards`/`.card`,
`.stats`/`.stat`, `.flow`/`.flow__step` (architecture diagram), `.split`
(two columns), `.team`, and `.with-shot` (text next to a screenshot from
`media/`). Copy a slide and change the text.

App Scorecard look-alikes: `.insights`/`.insight` (a list like the All Insights
panel), `.sev sev--high` / `.sev sev--medium` (severity markers), `.tag`
(category label) and `.ui-btn` (an App Designer-style button). Icons are defined
once at the top of `index.html` and used like
`<svg class="icon"><use href="#i-sparkle"/></svg>`.

The theme colours are variables at the top of `css/deck.css`. They are matched
to App Designer: the dark rail, VertiGIS blue, and the red and orange severity
colours.

Text in `[square brackets]` is a placeholder still to be filled in.

## Live demos

```html
<section class="slide slide--demo" id="demo" data-title="Live demo">
  <header class="slide__header"><h2>Live demo</h2></header>
  <div class="demo"
       data-src="https://your-studio-web-app-url"
       data-label="Studio Web — with our changes"
       data-preload
       data-backup="media/demo-backup.mp4"></div>
</section>
```

| Attribute      | What it does |
|----------------|--------------|
| `data-src`     | URL of the app to embed in an iframe. |
| `data-label`   | Text in the demo toolbar. |
| `data-preload` | Load the app in the background when the deck opens, so maps and sign-in are done before you reach the slide. |
| `data-backup`  | Optional video file. Adds a **Backup video** button that swaps the live app for a recording. |
| `data-allow-top-navigation` | Lets the app navigate the whole deck window (off by default, see Sign-in below). |

Wrap two `.demo` elements in `<div class="demo-compare">` for a side-by-side
before/after.

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
  present. (Add `data-allow-top-navigation` to a `.demo` to turn the sandbox
  off.) ArcGIS/portal sign-in pages also often refuse to render inside an
  iframe. Also, when the deck and the app are on different sites (for example
  the deck on GitHub Pages and the app on `localhost`), browsers keep the
  iframe's storage and cookies separate. Signing in to the app in its own tab
  then does **not** sign in the copy inside the deck. Serve the deck from the
  same host as the app (see below), or use a publicly shared app and web map.
- **Local dev servers.** A `localhost` URL always points at the computer
  viewing the page. On GitHub Pages, only the presenter's own machine (running
  the app) will show the demo; anyone else opening the link sees an empty
  frame, so set `data-backup` for them. Newer Chrome/Edge versions may also ask
  for permission to reach local network devices, and Safari may block an
  `http://localhost` frame inside an HTTPS page.

**Recommended for this project:** the demo runs at `http://localhost:3000/`, so
present from a local copy of the deck at `http://localhost:8000` (see
[Running locally](#running-locally)). The deck and the app are then the same
site, which avoids the problems above. Use the GitHub Pages copy for sharing the
link only. Start the demo app before opening the deck, so `data-preload` can
warm it up.

Always record a backup video of the demo and set `data-backup`.

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
timer counts down from `data-talk-minutes` on `<body>` and turns amber in the
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
