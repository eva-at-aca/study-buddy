#!/usr/bin/env node
/* Regenerates one subject-<id>.html per subject listed in tools.js.
   You only need this when you ADD A NEW SUBJECT (not for adding tools).

   Run it from the site folder:   node build-pages.js

   It reads tools.js, then writes a subject-<id>.html shell for each subject.
   Existing files are overwritten (they're just shells), your tools.js is untouched.
*/

const fs = require("fs");
const path = require("path");

// Load tools.js by evaluating it in a tiny sandbox that captures window.STUDY_SITE.
const cfgPath = path.join(__dirname, "tools.js");
const cfgSrc = fs.readFileSync(cfgPath, "utf8");
const sandbox = { window: {} };
new Function("window", cfgSrc)(sandbox.window);
const SITE = sandbox.window.STUDY_SITE;

if(!SITE || !Array.isArray(SITE.subjects)){
  console.error("Could not read STUDY_SITE.subjects from tools.js");
  process.exit(1);
}

function pageShell(subject){
  const title = subject.name + " — " + (SITE.siteTitle || "Study Buddy");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="assets/site.css">
</head>
<body>
  <main class="wrap" id="app"></main>
  <script src="tools.js"></script>
  <script src="assets/render.js"></script>
  <script>renderSubject(${JSON.stringify(subject.id)});</script>
</body>
</html>
`;
}

let count = 0;
SITE.subjects.forEach(function(sub){
  if(!sub.id){ console.warn("Skipping a subject with no id:", sub.name); return; }
  const file = path.join(__dirname, "subject-" + sub.id + ".html");
  fs.writeFileSync(file, pageShell(sub));
  console.log("wrote", path.basename(file));
  count++;
});
console.log("\nDone — " + count + " subject page(s). Home page (index.html) needs no rebuild.");
