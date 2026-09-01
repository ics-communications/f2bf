# Sheet-Driven Content Pipeline — Implementation Plan

**Goal:** let a non-technical communications coordinator update the high-churn
pages of f2bf.icscanada.edu (Events, Courses) by editing a Google Sheet —
no code, no git, no AI required. The site itself stays plain static HTML.

**Architecture:**

```
Google Sheet (org-owned, one tab per content type)
      │  "File → Share → Publish to web" as CSV
      ▼
GitHub Action (hourly + manual trigger)
      │  fetches CSV → runs build script → regenerates HTML
      ▼
Committed static pages → GitHub Pages → f2bf.icscanada.edu
```

**Why baked-static instead of live-fetch:** if the pipeline ever breaks, the
site goes *stale*, not *down*. SEO (meta tags, JSON-LD) keeps working because
content is in the HTML, not rendered by JavaScript at load time.

**Defaults this plan assumes** (change them if wrong):

- One spreadsheet named **"F2BF Website Content"**, owned by a shared org
  Google account (NOT a personal account), with tabs `Events` and `Courses`.
- Data access via "Publish to web → CSV" (zero credentials to manage).
  Caveat: published CSV is technically public at an obscure URL — fine for
  content that appears on the public site anyway. Never put private data
  (emails, draft announcements) in these tabs.
- The Action runs hourly and can be triggered manually from the GitHub
  Actions tab ("Run workflow" button).
- Event/course images live in this repo under `assets/img/`, uploaded via
  github.com's web upload. The sheet references them by filename.

**How to use this plan:** each phase below says who does the work and, where
Claude does it, gives a copy-paste prompt. Prompts are written for a fresh
Claude session with no memory of previous conversations — always run them
from inside this repo folder. Do the phases in order; each has a "Done when"
check before moving on.

---

## Phase 1 — Extract the Events content into a spreadsheet schema

**Who:** Claude.
**What:** read the current Events page, design the column schema, and produce
a CSV of the current events ready to import into Google Sheets.

**Prompt:**

> Read SHEETS-IMPLEMENTATION-PLAN.md in this repo — we are doing Phase 1.
> Read `events/index.html` and identify every piece of content that changes
> over time (event titles, dates, descriptions, images, photo galleries,
> upcoming vs. past status, links). Design a flat spreadsheet schema for it:
> one row per event, columns named in plain English a non-technical editor
> will understand, with a `published` TRUE/FALSE column and a `sort_order`
> column. Prefer fewer, simpler columns over clever ones. Where an event has
> a variable-length list (e.g. gallery photos), use one cell with one item
> per line. Then extract ALL current events from the page into
> `_data/events.csv` using that schema, and write a short
> `_data/SCHEMA-events.md` documenting each column with an example. Show me
> the schema for approval before writing the CSV.

**Done when:** `_data/events.csv` exists and every event currently on the
live page appears in it, content identical.

---

## Phase 2 — Template the Events page and revive the build script

**Who:** Claude.
**What:** turn the current page markup into a template with slots, and write
a build script that renders `_data/events.csv` through it. Note: the old
`_build.py` references source files that no longer exist in this repo — it
is a leftover from the original site migration. Replace or rewrite it.

**Prompt:**

> Read SHEETS-IMPLEMENTATION-PLAN.md in this repo — we are doing Phase 2.
> Phase 1 produced `_data/events.csv` and `_data/SCHEMA-events.md`. Create
> `_templates/events.html` by lifting the CURRENT markup from
> `events/index.html` and replacing event content with template slots — do
> not redesign anything; the CSS classes and structure must stay exactly as
> they are. Then write `build.py` (Python, standard library only, no pip
> installs) that reads the CSV and regenerates `events/index.html`. Rows
> with `published` = FALSE are skipped. Handle HTML-escaping of cell text.
> Verify by building and confirming the output renders visually identical
> to the current page — open both before and after in a browser or compare
> the rendered structure carefully, and show me a summary of any differences.
> Do not delete `_build.py` yet; just stop using it.

**Done when:** running `python3 build.py` regenerates `events/index.html`
with no visible change to the live page.

---

## Phase 3 — Create the Google Sheet

**Who:** You (needs Google account access; ~20 minutes).

1. Sign in as the **shared org Google account** (create one first if it
   doesn't exist — e.g. communications@ — and document its credentials in
   the org password manager).
2. Create a spreadsheet named **F2BF Website Content**.
3. Rename the first tab to `Events`. Import `_data/events.csv`
   (File → Import → Upload → Replace current sheet).
4. Freeze the header row. Optionally add data validation: `published`
   column → dropdown TRUE/FALSE.
5. **File → Share → Publish to web** → select the `Events` tab →
   format **Comma-separated values (.csv)** → Publish. Copy the URL.
6. Also share the sheet (normal sharing) with your own account and any
   colleague who edits content.

**Done when:** opening the published CSV URL in a private browser window
downloads the events data.

---

## Phase 4 — The GitHub Action

**Who:** Claude (you supply the published CSV URL).

**Prompt:**

> Read SHEETS-IMPLEMENTATION-PLAN.md in this repo — we are doing Phase 4.
> Create `.github/workflows/rebuild-content.yml`: a GitHub Action that
> (a) runs on an hourly schedule, (b) can be triggered manually via
> workflow_dispatch, and (c) runs on pushes that change `build.py`,
> `_templates/`, or `_data/`. It should: download the published Google
> Sheet CSV from the URL I give you into `_data/events.csv`, run
> `python3 build.py`, and commit the result back to `main` ONLY if the
> built HTML actually changed (use a diff check; commit as
> github-actions bot; make sure the workflow cannot trigger itself in a
> loop). If the CSV download fails, the workflow must fail loudly WITHOUT
> committing anything — never publish a page built from an empty or
> partial download. Here is the published CSV URL: [PASTE URL HERE]

**Done when:** the Action appears under the repo's Actions tab and a manual
"Run workflow" completes green.

---

## Phase 5 — End-to-end test

**Who:** You (5 minutes), Claude if anything fails.

1. In the Sheet, make a trivial edit (e.g. add "TEST" to an event title).
2. Actions tab → *Rebuild content* → **Run workflow**.
3. Wait for green; check f2bf.icscanada.edu/events shows the change
   (allow a minute for Pages + your browser cache; try a private window).
4. Revert the edit in the Sheet, run the workflow again, confirm it's gone.

If anything fails, prompt: *"Read SHEETS-IMPLEMENTATION-PLAN.md, we are on
Phase 5. The end-to-end test failed: [describe what you saw, paste any red
error text from the Actions log]. Diagnose and fix."*

**Done when:** a Sheet edit reaches the live site via the manual trigger,
and you've confirmed the hourly run also fires (check the Actions tab the
next day).

---

## Phase 6 — Repeat for the Courses page

**Who:** Claude, then you (add the tab, publish it, hand over the URL).

**Prompt:**

> Read SHEETS-IMPLEMENTATION-PLAN.md in this repo — we are doing Phase 6.
> Apply the exact same pattern Phases 1–4 established for Events to the
> Courses page (`f2bf-courses/index.html`): design the schema, extract
> current content to `_data/courses.csv` + `_data/SCHEMA-courses.md`,
> create `_templates/courses.html` from the current markup with zero visual
> changes, extend `build.py` to render it, and extend the existing workflow
> to also download the Courses tab CSV. Show me the schema for approval
> before extracting. The published CSV URL for the Courses tab is:
> [PASTE URL HERE]

**Done when:** the Phase 5 test passes for a course edit too.

---

## Phase 7 — Image workflow

**Who:** Claude writes it up; you sanity-check it feels doable for a successor.

Images can't live in a spreadsheet cell. Default workflow: upload the image
file to `assets/img/events/` using github.com's **Add file → Upload files**
button, then put its filename in the sheet's image column.

**Prompt:**

> Read SHEETS-IMPLEMENTATION-PLAN.md in this repo — we are doing Phase 7.
> Make the build script resilient to image mistakes: if a sheet row
> references an image file that doesn't exist in the repo, the build should
> still succeed but substitute a sensible fallback (e.g. omit the image or
> use a placeholder consistent with the design) and print a warning in the
> Action log. Then write step-by-step instructions (with the exact
> github.com clicks) for uploading an image and referencing it from the
> sheet, as a section in MAINTAINER.md (create the file if it doesn't
> exist yet).

**Done when:** a row pointing at a missing image no longer breaks the build,
and the upload instructions exist.

---

## Phase 8 — Handoff hardening

**Who:** Claude drafts; you verify with a colleague.

**Prompt:**

> Read SHEETS-IMPLEMENTATION-PLAN.md in this repo — we are doing Phase 8.
> Write two documents. (1) `MAINTAINER.md` — a plain-English guide for a
> non-technical communications coordinator, covering: how to edit events
> and courses via the Google Sheet; how to trigger the rebuild manually and
> how long the hourly rebuild takes; how to upload images; what "the site
> looks stale" means and why it is never an emergency; how to use
> claude.ai/code with this repo for anything the sheet can't do (give 3–4
> example requests written in plain English); and an account map section
> with placeholders for me to fill in (who owns the GitHub org, the Google
> account, the Cloudflare/DNS for f2bf.icscanada.edu, the Google Search
> Console verification). Assume the reader has never used GitHub. (2)
> `CLAUDE.md` at the repo root — for future AI sessions: site structure,
> the sheet→Action→Pages pipeline, the design language (shared CSS in
> assets/css, page-scoped styles inline per page, `f2bf-` class prefixes),
> the rule that `_templates/` + `_data/` are the source of truth for Events
> and Courses so those built pages must never be hand-edited, and which
> folders are working files rather than live site content.

Then the **dry run**: have a colleague who has never seen any of this add a
test event using only MAINTAINER.md, while you watch silently. Every place
they hesitate is a bug in the doc — prompt Claude to fix each one.

**Done when:** the colleague succeeds without your help.

---

## Rollback

Every step is a git commit. If a rebuild ever publishes something wrong:
revert the commit on github.com (Commits → "..." → Revert), or ask Claude:
*"The last content rebuild broke the events page — revert the site to the
previous state and diagnose."* Pausing the pipeline entirely = disable the
workflow from the Actions tab (Actions → Rebuild content → "..." →
Disable workflow). The site keeps serving the last-built HTML indefinitely.

## Out of scope (deliberately)

- The other five nav pages (home, Program, Community, Resources,
  Conference) stay hand-authored HTML, edited via claude.ai/code per
  MAINTAINER.md. Templating them isn't worth it — they change rarely.
- No CMS (Decap/Sveltia) for now. Revisit only if the successor needs to
  create whole new pages regularly; the fewer systems, the better the
  handoff.
