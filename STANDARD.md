# Study Tool Standard

The contract every study tool on this site follows. If a tool can't meet a
**MUST**, we change the tool — not the standard — unless we deliberately revise
this doc. Claude will suggest updates to this standard as we build more tools and
learn what works.

Last updated: 2026-09-02 · v1

---

## 1. Modes (how a student practices)

Each tool declares which **modes** it offers. Available modes:

| Mode        | id       | What it is                                                        |
|-------------|----------|-------------------------------------------------------------------|
| Flashcards  | `flash`  | Flip card: prompt on front, answer on back.                       |
| Write-in    | `write`  | Type the answer; the tool auto-grades, student can accept/override.|
| Multiple choice | `mc` | Pick from options; auto-built distractors.                        |

**Rules**
- **MUST** — Every tool offers at least one mode.
- **MUST** — **Science tools offer Flashcards + Write-in** at minimum. (Add `mc` only if it fits the content.)
- **SHOULD** — Language/vocab tools offer Multiple choice + Write-in; add Flashcards for memorization sets.
- The tool shows a mode picker only if it has more than one mode.

## 2. Missed-questions review (non-negotiable)

- **MUST** — After completing a round, show a **"Review these"** list of every
  item missed that round, each with **the correct answer** (not just the prompt).
- **MUST** — A perfect round shows a positive "you got them all" message instead.
- **MUST** — Missed items are **de-duplicated** (each appears once per round).
- Definition of "missed" per mode:
  - `flash` → student tapped "Study again later."
  - `write` → the **accepted** verdict was "missed" (after any override).
  - `mc` → student chose a wrong option.

## 3. Results history + patterns (persists across rounds)

- **MUST** — Every completed round is saved to a persistent history (per device).
- **MUST** — A **"View results"** screen shows, per section/mode:
  - a **miss-pattern** list (which items were missed most often, highest first), and
  - a **per-run log** (date, score, what was missed).
- **MUST** — A way to **clear** the history.
- History is keyed per tool, so tools don't mix.

## 4. Corrected answers (when we fix the student's original)

When a tool's answer differs from the student's original worksheet answer:
- **MUST** — Mark that item as `changed` and store her `orig` (original wording).
- **MUST** — When the answer is revealed, show a **"corrected"** badge **and** a
  callout with her original response ("You wrote: …").
- **MUST (flashcards)** — The corrected callout is hidden until the card is
  flipped to the answer (never visible on the prompt side).
- **SHOULD** — In `View results`, corrected items are visually distinguishable.

## 5. Mobile / cross-device

- **MUST** — Works in a phone browser. Includes `<meta name="viewport" ...>`.
- **MUST** — **Flashcards** size to their tallest face so long answers never clip;
  re-measure on rotate/resize.
- **MUST** — **Multiple choice** options wrap and are tap-friendly (full-width,
  ≥44px tall targets).
- **MUST** — Buttons stack/stretch on narrow screens; no horizontal scrolling.
- **SHOULD** — Respect `prefers-reduced-motion` (no flip/slide animations then).

## 6. Content accuracy

- **MUST** — If the source (student worksheet, notes) contains an error, the tool
  uses the **corrected** answer and flags it per §4. Never teach a known-wrong
  answer.
- **SHOULD** — Where a fact is class-specific (e.g. which checkpoint names a
  teacher uses), note it so the parent can confirm.
- Study **content** stays in the subject's language (e.g. Spanish answers stay
  Spanish); **UI/instructions** are in English.

## 7. Persistence & privacy

- **MUST** — Progress, best scores, and history save on the **device/browser**
  only (via the storage API). Nothing is uploaded.
- **MUST** — If storage isn't available, the tool still works for the session
  (it just can't save best/history).
- **MUST** — Changing the internal data format resets saved progress **gracefully**
  (detect mismatch → fresh start, never crash).

## 8. Look & feel

- **MUST** — Use the shared engine + stylesheet so tools look and behave alike.
- **MUST** — A **"‹ Study Buddy"** back link to the site home.
- Subject accent color is set per tool (a CSS variable) for a light touch of identity.
- Tone: encouraging, plain language, sentence case. Errors/empties give direction.

## 9. Site integration

- **MUST** — Tool file lives at `tools/<subject>/<name>.html`.
- **MUST** — Registered in `tools.js` with `title`, `topic`, `file`, `date`, and
  (optional) `note`.
- **MUST** — Its subject exists in `tools.js` (and has a `subject-<id>.html` page).

---

## How a new tool gets built (process)

1. Copy `_template/` to `tools/<subject>/<name>.html`.
2. Fill in the **content block** (sections → cards, each with `q`, `a`, and
   optional `orig` + `changed`), and set the tool's title, subject accent, and
   `modes`.
3. Register it in `tools.js`.
4. Run through **CHECKLIST.md** before publishing.

The engine (`assets/study-engine.js`) already implements §2–§5 and §7, so a new
tool that uses it inherits the missed-list, history/patterns, corrected-answer
highlighting, and mobile behavior automatically.
