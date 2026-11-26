<!--
  ===================================================================
  THE PRESENTATION — edit the text in this file to change the slides.
  ===================================================================

  Full guide: EDITING.md. The short version:

  - Slides are separated by a line with just three dashes:  ---
  - "# Heading" is the big heading on a slide.
  - "- text" is a bullet point.
  - "### Heading" starts a box (card). Keep the box's lines together,
    with no blank lines inside it.
  - "**bold**" for bold, "[text](https://link)" for a link.
  - "Notes:" on its own line: everything after it is speaker notes, only
    shown in the presenter view (press P).
  - Lines at the top of a slide like "layout: demo" or "kicker: The problem"
    are settings. Leave them as they are unless you mean to change them.
  - Text in [square brackets] is a placeholder still to be filled in.

  Anything between these arrow markers is ignored, like this note.
-->

talk-minutes: 7
page-title: App Scorecard — Hackathon 2026

---
layout: title
kicker: VertiGIS Hackathon 2026
icon: scorecard
title: Title

# App Scorecard

A health check for VertiGIS Studio Web apps, built into App Designer.

- Jack Basha
- Jimmy Chung
- Omar Jawhar
- Michael Kowal
- Alisa Lindley
- Penny Berard-Toupin (Honorary)

Team: Latitude Geographacks

Notes:
"Hi everyone, we are the Latitude Geographacks team. Onboard are Jack Basha, Jimmy Chung, Omar Jawhar, Michael Kowal, myself, and our honorary member, Penny Berard-Toupin. Together, we built a scorecard in App Designer that gives you areas of improvement for your app and helps you implement fixes."

---
kicker: The problem
id: problem
title: The problem

# App problems stay hidden until your users find them.

- Errors and deprecated APIs in custom libraries only show up in the browser console.
- Branding gaps, like a missing description or favicon, are easy to overlook.
- Performance pitfalls, like layers re-projecting on the fly, are invisible while you design.
- App authors have to spend a significant amount of time trying to identify potential problem areas.

Notes:
"So why do this? We essentially wanted to help app authors identify problem spots in their apps that are easy to miss. To give you a real-world example, Prince Edward County was running into some issues with their production app some time ago and had to contact support since they couldn't identify where the problem was coming from. It turned out to be because of an image URL that had been copied over from their development app, which was inaccessible since it was in a different environment. Having a tool in App Designer identify this simple issue for them could have saved them some time and stress."

---
kicker: Our solution
id: solution
title: Meet App Scorecard

# One click scans the app and lists what needs attention.

![The App Scorecard dialog in App Designer, listing insights by priority](media/scorecard.png "App Scorecard in App Designer (work in progress)")

### :branding: Branding
Does the app look finished?

### :performance: Performance
Will the app be fast?

### :maintenance: Maintenance
Will the app keep working?

### Internationalization
Are there any regional issues?

Priorities: {High} · {Medium} · {Low} · {Info}

Notes:
"This is where the app scorecard comes in. It can be opened from the Scorecard button in the left rail of App Designer, and at first glance it gives you a score out of 100 for your app as well as a list of all insights. These insights can be narrowed down by drilling down into the categories on the left. High impact items, like things that could break the app, are listed first, followed by medium impact, low impact, and purely informational items. There is also an AI-powered smart tool to give you additional suggestions that aren't covered by the standard checks."

---
kicker: From insight to fix
id: fixing
title: From insight to fix
cards: compact

# Every insight comes with a way to fix it.

<!-- This list is drawn to look like the real scorecard. It's HTML, so edit the words carefully. -->
<ul class="insights">
  <li class="insight">
    <span class="sev sev--high"><svg class="icon"><use href="#i-high"/></svg>High</span>
    <div><p class="insight__title">Error in main.js <span class="tag">Maintenance</span></p><p class="insight__desc">A custom library raised an error in the preview.</p></div>
    <span class="insight__actions"><span class="ui-btn">Go to Setting</span></span>
  </li>
  <li class="insight">
    <span class="sev sev--medium"><svg class="icon"><use href="#i-medium"/></svg>Medium</span>
    <div><p class="insight__title">No App Description <span class="tag">Branding</span></p><p class="insight__desc">Descriptions are shown in the portal and in search results.</p></div>
    <span class="insight__actions"><span class="ui-btn ui-btn--outline">Add Description</span><span class="ui-btn ui-btn--outline"><svg class="icon"><use href="#i-sparkle"/></svg>Smart Fix</span></span>
  </li>
  <li class="insight">
    <span class="sev sev--medium"><svg class="icon"><use href="#i-medium"/></svg>Medium</span>
    <div><p class="insight__title">Layers in a Different Spatial Reference <span class="tag">Performance</span></p><p class="insight__desc">Each layer is reprojected as it draws.</p></div>
    <span class="insight__actions"><span class="ui-btn">Go to Setting</span></span>
  </li>
</ul>

### Go to Setting
Jumps straight to the setting that needs changing.

### Fix
Quick fixes are available for easy settings like adding a generic app description.

### :sparkle: Smart Fix
Uses AI to fix it, like writing the description. Fix All does them all.

### :dismiss: Dismiss
Hides what doesn't apply. Rescan to check your work.

Notes:
This slide is the summary of the demo. If time is short, skip it and show this live instead.

---
layout: demo
id: demo
title: Live demo
url: http://localhost:3000/#app=2b4b50401cdf493f977417d8ab1b6208
label: VertiGIS Studio Web (localhost:3000)
backup:

# Live demo — App Scorecard

Notes:
1. Open the app in App Designer and click **Scorecard** in the left rail.
2. Walk the categories: Branding, Performance, Maintenance. High items are at the top.
3. Open a High item and click **Go to Setting**.
4. On "No App Description", click **Smart Fix**. This is the wow moment.
5. Dismiss one insight, then **Rescan** and show the count go down.

The demo runs at http://localhost:3000, so start it before presenting and present from the local copy of the deck (http://localhost:8000), not GitHub Pages. If it won't load or sign in here, use **New tab ↗**. If anything breaks, use **Backup video**.

---

layout: flow
kicker: How it works
id: how-it-works
title: How it works

# [How the scorecard is put together]

- **App Designer** — App config + live preview
- **Scorecard checks** — Branding · Performance · Maintenance (highlight)
- **Insights** — Prioritized, with what, why and how to fix
- **Fixes** — Go to Setting · Fix · :sparkle: Smart Fix

- [How a check is defined, and how easy it is to add one]
- [How errors from the preview are captured]
- [What powers Smart Fix]

Notes:
Judges like to know it's real: say what's production-ready and what's hacked together.

---
kicker: Development benefits
id: development
title: Development benefits

# Benefits for development and testing within VertiGIS

### Known issues
The tool can check whether known issues are still occurring, helping to identify regressions.
- BUG 538021: Layer icons copied over from another application's Map configuration retain their original resource URLs

### Finding issues
The process of building the tool helped identify a new bug, and more could be found through its development.
- BUG 538401: Above a certain number of unique values, the unique value renderer reverts to the default symbology

Notes:
"In addition to helping app authors debug and optimize their apps, this can also help our own processes. Having checks that identify known issues can help us keep track of them in our test apps and detect potential regressions. They can also speed up the support process and identify new bugs, especially since the AI tool gives insight into the app that the conventional checks do not cover. Working on the tool already helped us identify a new bug. Checks are easy to add - I mean we managed to squeeze in this many in just a day and a half - so the tool can be improved as development progresses in other areas of App Designer and VertiGIS Studio Web."

---
layout: columns
kicker: What's next
id: next
title: What's next

# Where does the App Scorecard go after the hackathon?

### Built this week
- Scorecard in App Designer with number grade
- Branding, Performance, Maintenance, and Internationalization checks ranked by priority
- AI Smart Suggestions
- Problem resolution via Go to Setting, Fix All, Smart Fix, and Dismiss

### Next steps
- More categories, e.g. Accessibility
- More checks in each category
- Implementation in other VertiGIS Studio Designers

Notes:
End on the ask: what would it take to ship this in App Designer?

---
layout: title
kicker: Thank you
icon: scorecard
id: thanks
title: Thank you / Q&A

# Questions?

App Scorecard Demo:

[https://webzoo.latitudegeo.com/builds/AppDesigner/54235/](https://webzoo.latitudegeo.com/builds/AppDesigner/54235/)

Notes:
Press G to jump to any slide during Q&A, or 6 + Enter to go straight to the demo.