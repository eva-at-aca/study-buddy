/* Study tool engine — shared behavior for every tool.
   A tool calls StudyEngine.mount(config) with:
   {
     title, subtitle, accent, storageKey,       // identity
     modes: ["flash","write","mc"],             // subset, in display order
     sections: [ { id, name, cards:[ {q,a,orig?,changed?} ] } ]
   }
   The engine implements: mode/section pickers, all modes, missed-list summary,
   persistent history + miss patterns, corrected-answer highlighting, mobile.
   See STANDARD.md for the rules this enforces. */

window.StudyEngine = (function(){
  "use strict";

  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function norm(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim(); }
  function shuffle(n){ var a=[]; for(var i=0;i<n;i++)a.push(i); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
  function shuffleArr(arr){ var a=arr.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
  function hasStore(){ return typeof window!=="undefined" && window.storage && typeof window.storage.get==="function"; }

  var MODE_LABELS = { flash:"Flashcards", write:"Write-in", mc:"Multiple choice" };

  function mount(cfg){
    // ---- Validate against the standard (fail loud in console, not silently) ----
    if(!cfg || !cfg.sections || !cfg.sections.length){ console.error("StudyEngine: no sections"); return; }
    var modes = (cfg.modes && cfg.modes.length) ? cfg.modes.slice() : ["flash"];
    var storageKey = cfg.storageKey || "tool";
    var accent = cfg.accent || "#c9a227";

    // ---- Section choices: real sections, plus "Everything" last if >1 ----
    var SECTIONS = cfg.sections.slice();
    var CHOICES = SECTIONS.slice();
    if(SECTIONS.length > 1){
      CHOICES.push({ id:"all", name:"Everything", cards: SECTIONS.reduce(function(a,s){ return a.concat(s.cards); }, []) });
    }

    // ---- State ----
    var sectionId = CHOICES[0].id;
    var mode = modes[0];
    var order=[], pos=0, reviewed=0, missed=[], answered=false;

    // ---- Build shell ----
    document.title = cfg.title + " — Study Tool";
    var root = document.getElementById("app");
    root.innerHTML =
      '<a class="back-link" href="../../index.html">&lsaquo; Study Buddy</a>'+
      '<header class="masthead">'+
        (cfg.eyebrow ? '<p class="eyebrow">'+esc(cfg.eyebrow)+'</p>' : '')+
        '<h1>'+esc(cfg.title)+'</h1>'+
        (cfg.subtitle ? '<p class="sub">'+esc(cfg.subtitle)+'</p>' : '')+
      '</header>'+
      '<div class="card" id="controlsCard">'+
        '<div class="controls-head">'+
          '<p class="section-label" style="margin:0;">'+(CHOICES.length>1?'Section &amp; mode':'Mode')+'</p>'+
          '<div class="controls-head-actions">'+
            '<button class="link-btn" id="viewResultsBtn">View results</button>'+
            '<button class="link-btn" id="controlsToggle" style="display:none;">Change</button>'+
          '</div>'+
        '</div>'+
        '<div id="controlsBody">'+
          (CHOICES.length>1 ? '<p class="section-label controls-sub">Section</p><div class="chip-row" id="sectionRow"></div>' : '')+
          (modes.length>1 ? '<p class="section-label controls-sub">Mode</p><div class="chip-row" id="modeRow"></div>' : '')+
        '</div>'+
        '<p class="controls-summary hidden" id="controlsSummary"></p>'+
      '</div>'+
      '<div id="resultsSection" class="card hidden">'+
        '<div class="controls-head"><p class="section-label" style="margin:0;">Results &amp; miss patterns</p>'+
        '<button class="link-btn" id="closeResultsBtn">&larr; Back</button></div>'+
        '<div id="resultsBody"></div>'+
      '</div>'+
      '<div class="card" id="studyCard">'+
        '<div class="stats-row"><span id="statProgress"></span><span id="statBest" class="best-badge"></span></div>'+
        '<div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>'+
        '<div id="studyArea"></div>'+
      '</div>'+
      '<footer>Progress is saved on this device.</footer>';

    document.body.style.setProperty("--accent", accent);

    var elSectionRow = document.getElementById("sectionRow");
    var elModeRow = document.getElementById("modeRow");
    var elControlsBody = document.getElementById("controlsBody");
    var elControlsToggle = document.getElementById("controlsToggle");
    var elControlsSummary = document.getElementById("controlsSummary");
    var elStudyArea = document.getElementById("studyArea");
    var elStudyCard = document.getElementById("studyCard");
    var elStatProgress = document.getElementById("statProgress");
    var elStatBest = document.getElementById("statBest");
    var elProgressFill = document.getElementById("progressFill");
    var elResults = document.getElementById("resultsSection");
    var elResultsBody = document.getElementById("resultsBody");
    var elViewResults = document.getElementById("viewResultsBtn");
    var elCloseResults = document.getElementById("closeResultsBtn");

    // ---- Chips ----
    if(CHOICES.length>1){
      CHOICES.forEach(function(s){
        var b=document.createElement("button"); b.className="chip"; b.textContent=s.name; b.dataset.id=s.id;
        b.onclick=function(){ sectionId=s.id; startRun(); }; elSectionRow.appendChild(b);
      });
    }
    if(modes.length>1){
      modes.forEach(function(m){
        var b=document.createElement("button"); b.className="chip"; b.textContent=MODE_LABELS[m]||m; b.dataset.id=m;
        b.onclick=function(){ mode=m; startRun(); }; elModeRow.appendChild(b);
      });
    }
    function renderChips(){
      if(elSectionRow) [].forEach.call(elSectionRow.children,function(c){ c.classList.toggle("active",c.dataset.id===sectionId); });
      if(elModeRow) [].forEach.call(elModeRow.children,function(c){ c.classList.toggle("active",c.dataset.id===mode); });
    }

    function choice(){ return CHOICES.filter(function(s){ return s.id===sectionId; })[0] || CHOICES[0]; }
    function cards(){ return choice().cards; }
    function sectionLabel(id){ var s=CHOICES.filter(function(x){ return x.id===id; })[0]; return s?s.name:id; }

    function collapse(){
      elControlsBody.classList.add("hidden"); elControlsSummary.classList.remove("hidden"); elControlsToggle.style.display="";
      var parts=[]; if(CHOICES.length>1) parts.push(sectionLabel(sectionId)); if(modes.length>1) parts.push(MODE_LABELS[mode]||mode);
      elControlsSummary.innerHTML = parts.map(function(p){ return '<span class="accent">'+esc(p)+'</span>'; }).join(" · ") || '<span class="accent">'+esc(MODE_LABELS[mode]||mode)+'</span>';
    }
    function expand(){ elControlsBody.classList.remove("hidden"); elControlsSummary.classList.add("hidden"); }
    elControlsToggle.onclick=function(){ if(elControlsBody.classList.contains("hidden")) expand(); else collapse(); };

    // ---- Storage: best + history ----
    function bestKey(){ return storageKey+":best:"+sectionId+":"+mode; }
    function histKey(){ return storageKey+":history"; }
    async function loadBest(){ if(!hasStore())return null; try{ var r=await window.storage.get(bestKey(),false); return r&&r.value?Number(r.value):null; }catch(e){ return null; } }
    async function saveBest(v){ if(!hasStore())return; try{ var c=await loadBest(); if(c===null||v>c) await window.storage.set(bestKey(),String(v),false); }catch(e){} }
    async function loadHistory(){ if(!hasStore())return []; try{ var r=await window.storage.get(histKey(),false); if(!r||!r.value)return []; var p=JSON.parse(r.value); return Array.isArray(p)?p:[]; }catch(e){ return []; } }
    async function appendHistory(entry){ if(!hasStore())return; try{ var l=await loadHistory(); l.push(entry); while(l.length>300)l.shift(); await window.storage.set(histKey(),JSON.stringify(l),false); }catch(e){} }
    async function clearHistory(){ if(!hasStore())return; try{ await window.storage.delete(histKey(),false); }catch(e){} }

    // ---- Lifecycle ----
    var startedOnce = false;
    async function startRun(){
      renderChips();
      // Expanded on first open so the section/mode options are visible; collapse
      // only once the student has actually started or changed something.
      if(startedOnce){ collapse(); } else { expand(); elControlsToggle.style.display=""; }
      startedOnce = true;
      order=shuffle(cards().length); pos=0; reviewed=0; missed=[]; answered=false;
      elStatBest.textContent="";
      var best=await loadBest();
      if(best!==null) elStatBest.textContent = (mode==="mc"?"Best: "+best+" / "+cards().length : "Best: "+best+" of "+cards().length+" known");
      renderCurrent();
    }
    function updateProgress(){
      var total=cards().length;
      elStatProgress.textContent=(mode==="flash"?"Card ":"Question ")+Math.min(pos+1,total)+" of "+total;
      elProgressFill.style.width=(reviewed/total*100)+"%";
    }
    function renderCurrent(){
      if(pos>=order.length) return renderSummary();
      updateProgress(); answered=false;
      var card=cards()[order[pos]];
      if(mode==="flash") renderFlash(card);
      else if(mode==="mc") renderMC(card);
      else renderWrite(card);
    }

    function changedNote(card){
      if(!card.changed || !card.orig) return "";
      return '<div class="changed-note"><p class="cn-tag">Changed from your original</p>'+
             '<p class="cn-orig">You wrote: &ldquo;'+esc(card.orig)+'&rdquo;</p></div>';
    }

    // ---- Flashcards ----
    function renderFlash(card){
      var badge=card.changed?'<span class="changed-badge">corrected</span>':'';
      var note=changedNote(card);
      elStudyArea.innerHTML=
        '<div class="flashcard"><div class="flash-inner" id="flashInner">'+
          '<div class="flash-face flash-front"><p class="flash-tag">Question</p><div class="flash-q">'+esc(card.q)+'</div></div>'+
          '<div class="flash-face flash-back"><p class="flash-tag">Answer'+badge+'</p><div class="flash-a">'+esc(card.a)+'</div></div>'+
        '</div></div>'+
        '<p class="flash-hint">Tap the card to flip</p>'+
        (note?'<div id="flashNote" class="hidden">'+note+'</div>':'')+
        '<div class="action-row">'+
          '<button class="btn btn-ghost" id="againBtn">Study again later</button>'+
          '<button class="btn btn-primary" id="gotBtn">Got it &rsaquo;</button>'+
        '</div>';
      var inner=document.getElementById("flashInner");
      var noteEl=document.getElementById("flashNote");
      function sizeCard(){
        var faces=inner.querySelectorAll(".flash-face:not(.flash-measure)"); var tallest=0;
        for(var i=0;i<faces.length;i++){
          var probe=document.createElement("div"); probe.className="flash-face flash-measure";
          probe.style.position="relative"; probe.style.display="block"; probe.innerHTML=faces[i].innerHTML;
          inner.appendChild(probe); tallest=Math.max(tallest,probe.scrollHeight); inner.removeChild(probe);
        }
        inner.style.height=Math.max(160,tallest)+"px";
      }
      sizeCard(); setTimeout(sizeCard,60);
      if(!mount._resizeHooked){
        window.addEventListener("resize",function(){
          var el=document.getElementById("flashInner"); if(!el)return;
          var faces=el.querySelectorAll(".flash-face:not(.flash-measure)"); var t=0;
          for(var i=0;i<faces.length;i++){ var p=document.createElement("div"); p.className="flash-face flash-measure"; p.style.position="relative"; p.style.display="block"; p.innerHTML=faces[i].innerHTML; el.appendChild(p); t=Math.max(t,p.scrollHeight); el.removeChild(p); }
          el.style.height=Math.max(160,t)+"px";
        });
        mount._resizeHooked=true;
      }
      inner.onclick=function(){ inner.classList.toggle("flipped"); if(noteEl) noteEl.classList.toggle("hidden",!inner.classList.contains("flipped")); };
      document.getElementById("gotBtn").onclick=function(){ reviewed++; pos++; renderCurrent(); };
      document.getElementById("againBtn").onclick=function(){ missed.push(order[pos]); reviewed++; pos++; renderCurrent(); };
    }

    // ---- Multiple choice ----
    function renderMC(card){
      var all=cards(); var pool=[];
      for(var i=0;i<all.length;i++){ if(all[i]!==card && all[i].a!==card.a) pool.push(all[i].a); }
      pool=shuffleArr(pool).slice(0,3);
      var options=shuffleArr([card.a].concat(pool));
      var badge=card.changed?'<span class="changed-badge">corrected</span>':'';
      var html='<p class="prompt-eyebrow">Choose the best answer</p><p class="prompt">'+esc(card.q)+'</p><div class="options" id="opts">';
      options.forEach(function(opt,idx){ html+='<button class="option-btn" data-opt="'+idx+'">'+esc(opt)+'</button>'; });
      html+='</div><div class="feedback" id="fb"></div>'+
        '<div id="mcNote"></div>'+
        '<div class="action-row"><button class="btn btn-primary" id="nextBtn" disabled>Next &rsaquo;</button></div>';
      elStudyArea.innerHTML=html;
      var opts=document.getElementById("opts");
      [].forEach.call(opts.children,function(btn){
        btn.onclick=function(){
          if(answered)return; answered=true;
          var chosen=options[Number(btn.dataset.opt)]; var correct=(chosen===card.a);
          [].forEach.call(opts.children,function(b){ b.disabled=true; if(options[Number(b.dataset.opt)]===card.a) b.classList.add("correct"); });
          if(!correct){ btn.classList.add("incorrect"); missed.push(order[pos]); }
          var fb=document.getElementById("fb"); fb.className="feedback show "+(correct?"good":"bad");
          fb.innerHTML=(correct?"Correct!":"Not quite — the highlighted answer is right.")+(badge&&!correct?" "+badge:"");
          if(card.changed) document.getElementById("mcNote").innerHTML=changedNote(card);
          document.getElementById("nextBtn").disabled=false; reviewed++; updateProgress();
        };
      });
      document.getElementById("nextBtn").onclick=function(){ pos++; renderCurrent(); };
    }

    // ---- Write-in (auto-grade + accept/override) ----
    function renderWrite(card){
      elStudyArea.innerHTML=
        '<p class="prompt-eyebrow">Write your answer, then check it</p><p class="prompt">'+esc(card.q)+'</p>'+
        '<textarea class="write-area" id="writeBox" placeholder="Type what you remember..."></textarea>'+
        '<div class="action-row"><button class="btn btn-primary" id="checkBtn">Check answer</button></div>'+
        '<div id="revealArea"></div>';
      var box=document.getElementById("writeBox"); box.focus();
      document.getElementById("checkBtn").onclick=function(){
        if(answered)return; answered=true; box.disabled=true; document.getElementById("checkBtn").disabled=true;
        var typed=norm(box.value);
        var aw=norm(card.a).split(" ").filter(function(w){ return w.length>4; });
        var uw=aw.filter(function(w,i){ return aw.indexOf(w)===i; });
        var hit=uw.filter(function(w){ return typed.indexOf(w)!==-1; }).length;
        var pct=uw.length?Math.round(hit/uw.length*100):0;
        var blank=!box.value.trim();
        var autoCorrect=!blank && pct>=55;
        var badge=card.changed?'<span class="changed-badge">corrected</span>':'';
        function renderVerdict(isCorrect){
          var banner='<div class="verdict '+(isCorrect?"correct":"wrong")+'">'+
            '<p class="v-line">'+(isCorrect?"Marked correct":"Marked as missed")+'</p>'+
            '<p class="v-sub">'+(blank?"Nothing was typed.":"Your answer matched about "+pct+"% of the key terms.")+' You can change this below.</p></div>';
          var actions='<div class="verdict-actions"><p class="lead">'+(isCorrect?"Not right after all?":"Actually got it?")+'</p>'+
            '<div class="action-row">'+
              (isCorrect?'<button class="btn btn-ghost" id="flipBtn">Change to missed</button>':'<button class="btn btn-ghost" id="flipBtn">Change to correct</button>')+
              '<button class="btn btn-primary" id="acceptBtn">Accept &amp; continue &rsaquo;</button>'+
            '</div></div>';
          document.getElementById("verdictWrap").innerHTML=banner+actions;
          document.getElementById("flipBtn").onclick=function(){ renderVerdict(!isCorrect); };
          document.getElementById("acceptBtn").onclick=function(){ if(!isCorrect) missed.push(order[pos]); reviewed++; pos++; renderCurrent(); };
        }
        document.getElementById("revealArea").innerHTML=
          '<div class="model-answer"><p class="ma-tag">Model answer'+badge+'</p><p>'+esc(card.a)+'</p></div>'+
          changedNote(card)+'<div id="verdictWrap"></div>';
        renderVerdict(autoCorrect);
      };
    }

    // ---- Summary (missed list per round) ----
    async function renderSummary(){
      elProgressFill.style.width="100%"; elStatProgress.textContent="Done";
      var total=cards().length; var score=total-uniq(missed).length;
      await saveBest(score);
      await appendHistory({ t:Date.now(), section:sectionId, mode:mode, total:total, score:score, missed:uniq(missed).map(function(i){ return cards()[i].q; }) });
      var best=await loadBest();
      elStatBest.textContent=(mode==="mc"?"Best: "+best+" / "+total:"Best: "+best+" of "+total+" known");

      var reviewHtml, um=uniq(missed);
      if(um.length){
        var rows=um.map(function(i){ var c=cards()[i]; var b=c.changed?'<span class="rc">corrected</span>':''; return '<li><span class="rq">'+esc(c.q)+'</span>'+b+'<span class="ra">'+esc(c.a)+'</span></li>'; }).join("");
        reviewHtml='<div class="review-block"><p class="review-title">Review these ('+um.length+'):</p><ul class="review-list">'+rows+'</ul></div>';
      } else {
        reviewHtml='<p class="review-perfect">Perfect — you knew them all! 🎉</p>';
      }
      elStudyArea.innerHTML=
        '<div class="summary"><p class="big">'+(mode==="mc"?(score+" / "+total):"Nice work!")+'</p>'+
        '<p>'+(mode==="mc"?"correct":(score+" of "+total+" known"))+'</p>'+reviewHtml+
        '<div class="action-row" style="justify-content:center"><button class="btn btn-primary" id="restartBtn">Go again</button></div></div>';
      document.getElementById("restartBtn").onclick=startRun;
    }
    function uniq(arr){ var s={},o=[]; arr.forEach(function(i){ if(!s[i]){ s[i]=1; o.push(i); } }); return o; }

    // ---- Results / patterns screen ----
    async function openResults(){
      elControlsBody.classList.add("hidden"); elControlsSummary.classList.add("hidden");
      elControlsToggle.style.display="none"; elViewResults.style.display="none";
      elStudyCard.classList.add("hidden"); elResults.classList.remove("hidden");
      elResultsBody.innerHTML='<p class="results-empty">Loading…</p>';
      var history=await loadHistory();
      if(!history.length){ elResultsBody.innerHTML='<p class="results-empty">No completed rounds yet. Finish a round and your results — including which questions you missed — will show up here.</p>'; return; }

      var groups={};
      history.forEach(function(h){ var k=h.section+":"+h.mode; (groups[k]=groups[k]||[]).push(h); });
      var html='<p class="results-intro">Every completed round is saved here. The badge shows how many times you\u2019ve missed each question across all your runs — the higher, the more worth drilling.</p>';
      Object.keys(groups).forEach(function(key){
        var parts=key.split(":"); var runs=groups[key].slice().sort(function(a,b){ return b.t-a.t; });
        html+='<p class="rp-title">'+esc(sectionLabel(parts[0]))+' · '+esc(MODE_LABELS[parts[1]]||parts[1])+' — '+runs.length+(runs.length===1?" run":" runs")+'</p>';
        var freq={}; runs.forEach(function(r){ (r.missed||[]).forEach(function(q){ freq[q]=(freq[q]||0)+1; }); });
        var items=Object.keys(freq).sort(function(a,b){ return freq[b]-freq[a]; });
        if(!items.length){ html+='<p class="run-perfect">No misses recorded here. 🎉</p>'; }
        else { html+='<div>'; items.forEach(function(q){ var n=freq[q]; html+='<div class="miss-item"><div class="miss-q">'+esc(q)+'</div><span class="miss-count '+(n===1?"count-1":"")+'">'+n+'×</span></div>'; }); html+='</div>'; }
        html+='<div>'; runs.forEach(function(r){
          var mt=(r.missed&&r.missed.length)?'<span class="m">Missed:</span> '+r.missed.map(esc).join(", "):'<span class="run-perfect">Perfect run.</span>';
          html+='<div class="run-row"><span class="run-when">'+fmtDate(r.t)+'</span>'+
            '<span class="run-meta">'+(r.mode==="mc"?(r.score+" / "+r.total+" correct"):(r.score+" of "+r.total+" known"))+'</span>'+
            '<div class="run-missed">'+mt+'</div></div>';
        }); html+='</div>';
      });
      html+='<div class="action-row" style="margin-top:18px;"><button class="link-btn" id="clearHistBtn">Clear results history</button></div>';
      elResultsBody.innerHTML=html;
      document.getElementById("clearHistBtn").onclick=async function(){ await clearHistory(); openResults(); };
    }
    function closeResults(){ elResults.classList.add("hidden"); elViewResults.style.display=""; elStudyCard.classList.remove("hidden"); }
    function fmtDate(ts){ try{ var d=new Date(ts); var mo=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return mo[d.getMonth()]+" "+d.getDate()+", "+d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}); }catch(e){ return ""; } }

    elViewResults.onclick=openResults; elCloseResults.onclick=closeResults;

    // ---- Init ----
    renderChips(); startRun();
  }

  return { mount: mount };
})();
