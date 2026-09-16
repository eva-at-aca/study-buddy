/* =============================================================================
   STUDY TOOLS — SITE CONFIG
   This is the ONLY file you edit to add a new study tool or subject.
   Everything on the home page (filter tiles + tool list) is built from this.

   HOW TO ADD A TOOL
   -----------------
   1. Save the tool's .html file under  tools/<subject>/<name>.html
      e.g.  tools/spanish/verbs.html
   2. Add an entry to the matching subject's "tools" array below.
   3. Commit & push (or drag the folder to your host). Done.

   FIELD REFERENCE (per tool)
   --------------------------
   title    Shown to the student. Keep it short.               (required)
   topic    Groups tools within a subject. e.g. "Vocabulary".  (required)
   file     Path to the HTML file, relative to the site root.  (required)
   date     "YYYY-MM-DD" — when you added it. Used for sorting. (required)
   status   "done" to move it into the Done section (test finished). Omit for active. (optional)
   note     One short line describing what it drills.           (optional)

   FIELD REFERENCE (per subject)
   -----------------------------
   id       url-safe id for the subject; also used in tool file paths (required)
   name     Shown as the subject heading. e.g. "Spanish".       (required)
   blurb    One line under the subject name.                    (optional)
   accent   A hex color for this subject's spine/tab.           (optional)
   ============================================================================= */

window.STUDY_SITE = {
  // Shown in the header of the home page.
  siteTitle: "Study Buddy",
  siteTagline: "A home for the study tools we build through the year.",

  subjects: [
    {
      id: "spanish",
      name: "Spanish",
      blurb: "Vocabulary, grammar, and geography practice.",
      accent: "#d98a2b",
      tools: [
        {
          title: "Verbs - Senderos 1",
          topic: "Verbs",
          file: "tools/spanish/verbs.html",
          date: "2026-09-03",
          note: "Verbs — infinitive practice (multiple choice, letter bank, write-in) and present-tense conjugation (by irregularity type, single or full-table)."
        },
        {
          title: "Spanish-Speaking Countries",
          topic: "Geography",
          file: "tools/spanish/countries.html",
          date: "2026-09-02",
          status: "done",
          note: "Countries, capitals, nationalities, and map locations — three levels."
        }
        // Add more Spanish tools here, e.g.:
        // { title: "Ser vs. Estar", topic: "Grammar", file: "tools/spanish/ser-estar.html", date: "2026-09-15", note: "When to use each." }
      ]
    },

    // Add more subjects by copying a block like this one:
    // {
    //   id: "history",
    //   name: "History",
    //   blurb: "Dates, people, and places.",
    //   accent: "#4c7a5a",
    //   tools: [
    //     { title: "U.S. Presidents", topic: "American History", file: "tools/history/presidents.html", date: "2026-10-01" }
    //   ]
    // },

    {
      id: "science",
      name: "Science",
      blurb: "Biology, chemistry, and lab concepts.",
      accent: "#5aa9a0",
      tools: [
        {
          title: "Cell Biology Review",
          topic: "Cell Biology",
          file: "tools/science/cell-biology.html",
          date: "2026-09-02",
          status: "done",
          note: "Cell cycle, cell structures, and levels of organization — flashcards and write-in. Test on 9/4."
        }
      ]
    },

    {
      id: "geometry",
      name: "Geometry",
      blurb: "Reasoning, proofs, and angle relationships.",
      accent: "#7a6ad8",
      tools: [
        {
          title: "Ch2: Reasoning and Proofs",
          topic: "Reasoning and Proofs",
          file: "tools/geometry/ch2.html",
          date: "2026-09-15",
          note: "Generates a brand-new randomized practice test every time it's opened — conditional statements, two-column proofs, inductive reasoning, properties of equality, and angle relationships. Matches the style of the Ch. 2 Review."
        }
      ]
    }
  ]
};
