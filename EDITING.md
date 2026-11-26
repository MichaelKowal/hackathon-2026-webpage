# How to edit the presentation

All the words on the slides live in one file: **`slides.md`**. You don't need
to know any code. If you can write a bulleted list, you can edit the slides.

## The easiest way: edit on GitHub

1. Open the deck and press **E** (or press **?** and click **Edit the slides
   on GitHub**). You can also open `slides.md` on GitHub and click the pencil
   icon.
2. Change the text.
3. Click **Commit changes…** at the top right, then **Commit changes** again.
   Write a short note about what you changed if you like.
4. After a minute or two, the website shows your changes. Refresh the page if
   it doesn't.

You need access to the GitHub repository to do this. Ask Michael if you don't
have it.

## Editing on your own computer

If you have the project on your computer, run this in the project folder:

```powershell
python -m http.server 8000
```

Then open http://localhost:8000 and edit `slides.md` in any text editor,
for example Notepad or VS Code. **Each time you save, the deck refreshes
itself** and stays on the slide you're looking at.

## What the file looks like

Slides are separated by a line with just three dashes. Here is one complete
slide:

```
---
kicker: The problem
title: The problem

# App problems stay hidden until your users find them.

- Errors in custom libraries only show up in the browser console.
- Branding gaps are easy to overlook.

Notes:
Tell a real story here. Keep it under 45 seconds.
```

| You write | You get |
|---|---|
| `---` on its own line | The start of a new slide |
| `# Some words` | The big heading on the slide |
| `- Some words` | A bullet point |
| `1. Some words` | A numbered list (useful in notes) |
| A line of plain text | A normal sentence or paragraph |
| `**words**` | **Bold** |
| `*words*` | *Italic* |
| `[text](https://example.com)` | A link |
| `### Title` + lines under it | A box (card). Boxes next to each other sit side by side. |
| `![Description](media/picture.png "Caption")` | A picture, shown to the right of the text |
| `Notes:` on its own line | Everything below it is speaker notes, only shown in the presenter view |
| `{High}` / `{Medium}` / `{Low}` / `{Info}` | The word in the scorecard's colour for that priority |
| `:sparkle:` | A small icon (see the list below) |
| `[Team member]` | Nothing special: square brackets are just our way of marking text still to fill in |

**Blank lines matter:** a blank line ends a list, a paragraph or a box. Inside
a box, keep all its lines together with no blank lines between them.

## The lines at the top of a slide (settings)

Some slides start with lines like `layout: demo` or `kicker: Impact`. These
are settings, not text on the slide (except `kicker`). It's fine to change
their values, but keep the word before the colon exactly as it is.

| Setting | What it does |
|---|---|
| `kicker:` | The small blue label above the heading, e.g. `kicker: The problem` |
| `title:` | The short name shown in the slide list and presenter view |
| `id:` | The slide's web address, e.g. `id: demo` gives `…/#/demo`. Optional. |
| `layout:` | The kind of slide. See below. Leave it out for a normal slide. |
| `icon:` | The icon on title and demo slides, e.g. `icon: scorecard` |
| `cards: compact` | Makes the boxes on that slide smaller |

### Kinds of slide (`layout:`)

| Layout | Use it for | How to write it |
|---|---|---|
| *(none)* | Most slides | Heading, bullets, boxes and an optional picture |
| `title` | The first and last slides (dark) | Heading, one sentence, and a bulleted list of names that become name tags |
| `stats` | Big numbers | Bullets like `- **10×** faster at something` (the bold part is the big number) |
| `columns` | Two lists side by side | Two `### Title` sections, each followed by bullets |
| `flow` | A row of boxes joined by arrows | Bullets like `- **Step name** — short description`. Add `(highlight)` to the end of one to make it blue. A second list after a blank line becomes normal bullets. |
| `demo` | A live demo | Settings `url:` (the app's address), `label:` (toolbar text), and optionally `backup:` (a video file in `media/`) |
| `compare` | Two live apps side by side | Settings `before:`, `before-label:`, `after:` and `after-label:` |

## Common tasks

- **Change the time limit:** at the very top of `slides.md`, change
  `talk-minutes: 7`.
- **Add a slide:** copy an existing slide, from its `---` line down to just
  before the next `---`, and paste it where you want the new one.
- **Remove a slide:** delete everything from its `---` line down to just
  before the next `---`.
- **Reorder slides:** cut a whole slide (from `---` to just before the next
  `---`) and paste it somewhere else.
- **Add a picture:** put the image file in the `media` folder (on GitHub:
  open the `media` folder → **Add file** → **Upload files**). Then add a line
  like `![What the picture shows](media/my-picture.png "Optional caption")`
  to the slide.
- **Add a backup video for the demo:** upload the video to `media`, then
  on the demo slide set `backup: media/demo.mp4`.

## Icons you can use

Write the name between colons, e.g. `:branding:`.

`:scorecard:` `:high:` `:medium:` `:fixed:` `:sparkle:` `:branding:`
`:performance:` `:maintenance:` `:internationalization:` `:dismiss:`

## The one tricky slide

The **From insight to fix** slide contains a block of HTML code (lines that
start with `<`). It draws the imitation scorecard list. You can change the
words between the `>` and `<` marks, but leave everything else as it is. If
it breaks, undo your change: on GitHub, open the file's **History** and look
at the previous version.

## Something went wrong?

- **A slide looks wrong:** check for a missing blank line, or a blank line
  inside a box.
- **The whole deck is blank:** a setting at the top of a slide may be
  misspelled. Undo your last change.
- **"Open this deck through a web server":** you opened `index.html` by
  double-clicking it. Use the `python -m http.server 8000` command above
  instead.
- **Nothing helps:** GitHub keeps every version. Open `slides.md` → **History**
  to see or restore an older one, or ask Michael.
