# Study Desk

A small static website that organizes the study tools we build during the year.
Subjects on top (Spanish, History, Science, …), each with its own page listing
tools grouped by topic and sorted by date.

Everything is plain HTML/CSS/JS. No build step is required for day-to-day use,
no server, and it works offline once a page has loaded.

---

## What's in here

```
index.html              Home page (lists every subject + its tools)
subject-<id>.html        One page per subject (e.g. subject-spanish.html)
tools.js                 ← THE ONLY FILE YOU EDIT to add tools/subjects
assets/site.css          Shared styles
assets/render.js         Builds the pages from tools.js
build-pages.js           Optional: regenerates subject pages when you add a subject
tools/<subject>/...      The actual study tool .html files
```

---

## Put it online with GitHub Pages (free)

You only do this setup once.

1. **Make a GitHub account** at github.com if you don't have one.
2. **Create a new repository.** Name it whatever you like (e.g. `study-desk`).
   Leave it **Public** (required for free GitHub Pages).
3. **Upload the files.** On the repo page click **Add file → Upload files**,
   then drag in *everything inside this `site` folder* (the `index.html`,
   `tools.js`, the `assets` folder, the `tools` folder, etc.). Commit.
4. **Turn on Pages.** Go to the repo's **Settings → Pages**. Under
   "Build and deployment", set **Source = Deploy from a branch**, pick the
   **main** branch and the **/ (root)** folder, and **Save**.
5. Wait ~1 minute. Your site is live at:
   `https://<your-username>.github.io/<repo-name>/`

That's it. Bookmark that URL on your kids' devices.

> Tip: a custom domain (e.g. `study.ourfamily.com`) is optional and can be added
> later under Settings → Pages if you ever buy one.

---

## Add a new study tool (the common case)

1. Save the tool's `.html` file under `tools/<subject>/`.
   Example: `tools/spanish/verbs.html`
2. Open **`tools.js`** and add one entry to that subject's `tools` list:

   ```js
   { title: "Ser vs. Estar", topic: "Grammar",
     file: "tools/spanish/verbs.html", date: "2026-09-20",
     note: "When to use each." }
   ```
3. Upload the new file + the edited `tools.js` to GitHub (Add file → Upload files,
   or edit `tools.js` directly on github.com with the pencil icon). Done — the
   home page and the subject page update themselves.

No need to touch any HTML. The pages read `tools.js` automatically.

---

## Add a new subject (less common)

1. Add a subject block to `tools.js`:

   ```js
   {
     id: "history",              // used for the page filename: subject-history.html
     name: "History",
     blurb: "Dates, people, and places.",
     accent: "#4c7a5a",          // the subject's stripe color
     tools: []
   }
   ```
2. Create its page. Two ways:
   - **Easiest:** copy `subject-spanish.html`, rename it to `subject-history.html`,
     and change the one line near the bottom to `renderSubject("history");`.
   - **Or**, if you have Node installed, run `node build-pages.js` from this
     folder and it writes every `subject-<id>.html` for you.
3. Make a folder for its tools: `tools/history/`.
4. Upload the changes.

---

## Notes

- **Progress saving:** each study tool saves a student's progress in that
  browser on that device (nothing is uploaded anywhere). Different device or
  browser = separate progress.
- **Dates** use the format `YYYY-MM-DD` and control the sort order within a topic
  (newest first). They're also shown on each tool.
- **Offline:** once a page has loaded in a browser it keeps working without a
  connection. To study offline, open it once while online first.
