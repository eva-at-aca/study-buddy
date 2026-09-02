/* Study Buddy — home page renderer.
   One interactive page: subject filter tiles on top, a flat list of all tools
   (newest first) below, each tool striped with its subject color. Clicking a
   tile filters to that subject; an "All" tile shows everything. No per-subject
   pages. Reads window.STUDY_SITE from tools.js. */

(function(){
  var SITE = window.STUDY_SITE || { siteTitle: "Study Buddy", subjects: [] };

  function esc(s){
    return String(s == null ? "" : s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  // "2026-09-02" -> "Sep 2, 2026" (local, no timezone surprises)
  function prettyDate(iso){
    if(!iso) return "";
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if(!m) return esc(iso);
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[Number(m[2]) - 1] + " " + Number(m[3]) + ", " + m[1];
  }

  // Flatten all tools across subjects into one list, tagged with their subject.
  function allTools(){
    var list = [];
    (SITE.subjects || []).forEach(function(sub){
      (sub.tools || []).forEach(function(t){
        list.push({
          title: t.title, topic: t.topic, file: t.file, date: t.date, note: t.note,
          subjectId: sub.id, subjectName: sub.name, accent: sub.accent || "#c9a227"
        });
      });
    });
    // newest first; tie-break by title
    list.sort(function(a,b){
      var d = (b.date || "").localeCompare(a.date || "");
      return d !== 0 ? d : (a.title || "").localeCompare(b.title || "");
    });
    return list;
  }

  var TOOLS = allTools();
  var activeSubject = "all"; // "all" or a subject id

  function toolRowHtml(t){
    var note = t.note ? '<p class="tool-note">' + esc(t.note) + '</p>' : '';
    return '' +
      '<li class="tool-li" data-subject="' + esc(t.subjectId) + '">' +
        '<a class="tool" href="' + esc(t.file) + '" style="--stripe:' + esc(t.accent) + '">' +
          '<span class="tool-top">' +
            '<span class="tool-title">' + esc(t.title) + '</span>' +
            '<span class="tool-date">' + prettyDate(t.date) + '</span>' +
          '</span>' +
          '<span class="tool-meta">' +
            '<span class="tool-subject" style="color:' + esc(t.accent) + '">' + esc(t.subjectName) + '</span>' +
            (t.topic ? '<span class="tool-dot">&middot;</span><span class="tool-topic">' + esc(t.topic) + '</span>' : '') +
          '</span>' +
          note +
        '</a>' +
      '</li>';
  }

  function applyFilter(){
    var lis = document.querySelectorAll(".tool-li");
    var shown = 0;
    [].forEach.call(lis, function(li){
      var match = (activeSubject === "all") || (li.getAttribute("data-subject") === activeSubject);
      li.classList.toggle("hidden", !match);
      if(match) shown++;
    });
    var tiles = document.querySelectorAll(".subject-tile");
    [].forEach.call(tiles, function(tile){
      var on = tile.getAttribute("data-id") === activeSubject;
      tile.classList.toggle("active", on);
      tile.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var empty = document.getElementById("emptyNote");
    if(empty) empty.classList.toggle("hidden", shown > 0);
  }

  function renderHome(){
    document.title = SITE.siteTitle || "Study Buddy";
    var host = document.getElementById("app");
    if(!host) return;

    var subjects = SITE.subjects || [];

    var head = '' +
      '<header class="masthead">' +
        '<h1>' + esc(SITE.siteTitle || "Study Buddy") + '</h1>' +
        (SITE.siteTagline ? '<p>' + esc(SITE.siteTagline) + '</p>' : '') +
      '</header>';

    var tiles = '<button class="subject-tile active" data-id="all" aria-pressed="true">All</button>';
    subjects.forEach(function(sub){
      tiles += '<button class="subject-tile" data-id="' + esc(sub.id) + '" ' +
               'style="--tile-accent:' + esc(sub.accent || "#c9a227") + '">' +
               esc(sub.name) + '</button>';
    });
    var tileBar = '<div class="tile-bar" id="tileBar">' + tiles + '</div>';

    var rows = TOOLS.map(toolRowHtml).join("");
    var list = TOOLS.length
      ? '<ul class="tool-list">' + rows + '</ul>' +
        '<p class="empty hidden" id="emptyNote">No tools in this subject yet.</p>'
      : '<div class="empty">No tools yet. Add one in <code>tools.js</code>.</div>';

    var foot = '<p class="foot">Saved on this device as you study. Works offline once loaded.</p>';

    host.innerHTML = head + tileBar + list + foot;

    var bar = document.getElementById("tileBar");
    if(bar){
      [].forEach.call(bar.querySelectorAll(".subject-tile"), function(tile){
        tile.addEventListener("click", function(){
          var id = tile.getAttribute("data-id");
          activeSubject = (id === activeSubject && id !== "all") ? "all" : id;
          applyFilter();
        });
      });
    }
    applyFilter();
  }

  window.renderHome = renderHome;
})();
