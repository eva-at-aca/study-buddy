/* Study Buddy — renders pages from window.STUDY_SITE (defined in tools.js).
   Two entry points:
     renderHome()            -> builds the home page (all subjects, all tools)
     renderSubject(subjectId)-> builds one subject page (topics -> tools by date)
*/

(function(){
  var SITE = window.STUDY_SITE || { siteTitle: "Study Buddy", subjects: [] };

  function esc(s){
    return String(s == null ? "" : s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  // "2026-09-02" -> "Sep 2, 2026" (parsed as local, no timezone surprises)
  function prettyDate(iso){
    if(!iso) return "";
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if(!m) return esc(iso);
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[Number(m[2]) - 1] + " " + Number(m[3]) + ", " + m[1];
  }

  function toolCount(subject){
    return (subject.tools || []).length;
  }

  // Group a subject's tools by topic, then sort each topic's tools newest-first.
  function groupByTopic(tools){
    var groups = {};
    var order = [];
    (tools || []).forEach(function(t){
      var key = t.topic || "Other";
      if(!groups[key]){ groups[key] = []; order.push(key); }
      groups[key].push(t);
    });
    order.sort(function(a,b){ return a.localeCompare(b); });
    order.forEach(function(k){
      groups[k].sort(function(a,b){ return (b.date || "").localeCompare(a.date || ""); });
    });
    return { order: order, groups: groups };
  }

  function toolRow(t){
    var note = t.note ? '<p class="tool-note">' + esc(t.note) + '</p>' : '';
    return '' +
      '<li><a class="tool" href="' + esc(t.file) + '">' +
        '<span class="tool-top">' +
          '<span class="tool-title">' + esc(t.title) + '</span>' +
          '<span class="tool-date">' + prettyDate(t.date) + '</span>' +
        '</span>' +
        note +
      '</a></li>';
  }

  function topicBlock(name, tools){
    var rows = tools.map(toolRow).join("");
    return '' +
      '<div class="topic">' +
        '<p class="topic-name">' + esc(name) + '</p>' +
        '<ul class="tool-list">' + rows + '</ul>' +
      '</div>';
  }

  // ---------- Home ----------
  function renderHome(){
    document.title = SITE.siteTitle || "Study Buddy";
    var host = document.getElementById("app");
    if(!host) return;

    var head = '' +
      '<header class="masthead">' +
        '<h1>' + esc(SITE.siteTitle || "Study Buddy") + '</h1>' +
        (SITE.siteTagline ? '<p>' + esc(SITE.siteTagline) + '</p>' : '') +
      '</header>';

    var body = "";
    var subjects = SITE.subjects || [];

    if(!subjects.length){
      body = '<div class="empty">No subjects yet. Add one in <code>tools.js</code>.</div>';
    } else {
      subjects.forEach(function(sub){
        var accent = sub.accent || "";
        var styleAttr = accent ? ' style="--subject-accent:' + esc(accent) + '"' : '';
        var n = toolCount(sub);
        var countLabel = n + (n === 1 ? " tool" : " tools");

        var inner;
        if(!n){
          inner = '<div class="empty">No tools here yet.</div>';
        } else {
          var g = groupByTopic(sub.tools);
          inner = g.order.map(function(topic){
            return topicBlock(topic, g.groups[topic]);
          }).join("");
        }

        body += '' +
          '<section class="subject"' + styleAttr + '>' +
            '<div class="subject-head">' +
              '<h2>' + esc(sub.name) + '</h2>' +
              '<span class="count">' + countLabel + '</span>' +
            '</div>' +
            (sub.blurb ? '<p class="subject-blurb">' + esc(sub.blurb) + '</p>' : '') +
            '<p class="subject-link"><a href="subject-' + esc(sub.id) + '.html">Open ' + esc(sub.name) + ' &rsaquo;</a></p>' +
            inner +
          '</section>';
      });
    }

    var foot = '<p class="foot">Saved on this device as you study. Works offline once loaded.</p>';
    host.innerHTML = head + body + foot;
  }

  // ---------- Subject ----------
  function renderSubject(subjectId){
    var host = document.getElementById("app");
    if(!host) return;
    var sub = (SITE.subjects || []).find(function(s){ return s.id === subjectId; });

    if(!sub){
      document.title = "Not found — " + (SITE.siteTitle || "Study Buddy");
      host.innerHTML =
        '<p class="crumb"><a href="index.html">' + esc(SITE.siteTitle || "Home") + '</a></p>' +
        '<header class="masthead"><h1>Subject not found</h1>' +
        '<p>There is no subject with id &ldquo;' + esc(subjectId) + '&rdquo; in tools.js.</p></header>';
      return;
    }

    document.title = sub.name + " — " + (SITE.siteTitle || "Study Buddy");
    var accent = sub.accent || "";
    var styleAttr = accent ? ' style="--subject-accent:' + esc(accent) + '"' : '';
    var n = toolCount(sub);

    var crumb =
      '<p class="crumb"><a href="index.html">' + esc(SITE.siteTitle || "Home") + '</a>' +
      '<span class="sep">/</span>' + esc(sub.name) + '</p>';

    var head = '' +
      '<header class="masthead">' +
        '<h1>' + esc(sub.name) + '</h1>' +
        (sub.blurb ? '<p>' + esc(sub.blurb) + '</p>' : '') +
      '</header>';

    var body;
    if(!n){
      body = '<div class="empty">No tools here yet. Add one to the &ldquo;' + esc(sub.name) +
             '&rdquo; subject in <code>tools.js</code>.</div>';
    } else {
      var g = groupByTopic(sub.tools);
      body = '<section class="subject"' + styleAttr + '>' +
        g.order.map(function(topic){ return topicBlock(topic, g.groups[topic]); }).join("") +
      '</section>';
    }

    host.innerHTML = crumb + head + body +
      '<p class="foot">Progress in each tool is saved on this device.</p>';
  }

  // expose
  window.renderHome = renderHome;
  window.renderSubject = renderSubject;
})();
