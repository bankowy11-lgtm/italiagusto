/* Nauka — Klasa 5: wspólny rdzeń (powtórka błędów, dziennik prób, plan sprawdzianów, kopia zapasowa, tryb offline). */
(function(){
  "use strict";
  var DAY = 86400000;
  var cs = document.currentScript;
  var SRC = cs && cs.src ? cs.src : (function(){ var s=document.querySelectorAll('script[src*="shared/app.js"]'); return s.length ? s[s.length-1].src : location.href; })();
  var BASE = new URL('../', SRC).href;
  var CFG = cs ? { s: cs.getAttribute('data-subj')||'', k: cs.getAttribute('data-key')||'', l: cs.getAttribute('data-label')||'' } : { s:'', k:'', l:'' };

  var K_ATT = 'nauka_attempts_v1', K_SR = 'nauka_sr_v1', K_PLAN = 'nauka_plan_v1', K_PRE = 'nauka_precache_v1';
  var CACHE_NAME = 'nauka-v1';

  var SUBJECTS = {
    'matematyka':  { l:'Matematyka',   i:'📑', h:'matematyka/' },
    'jezyk-polski':{ l:'Język polski', i:'📖', h:'jezyk-polski/' },
    'jezyk-angielski':{ l:'Język angielski', i:'🇬🇧', h:'jezyk-angielski/' },
    'biologia':    { l:'Biologia',     i:'🌱', h:'biologia/' },
    'historia':    { l:'Historia',     i:'🏛️', h:'historia/' },
    'geografia':   { l:'Geografia',    i:'🌎', h:'geografia/' }
  };
  var SUBJECT_ORDER = ['matematyka','jezyk-polski','jezyk-angielski','biologia','historia','geografia'];

  // s = przedmiot, k = klucz najlepszego wyniku (localStorage), l = nazwa, h = adres strony, mx = maks. punktów, lv = poziomy
  var CATALOG = [
    {s:'matematyka', k:'dzial_pam_best_v1', l:'Działania pamięciowe', h:'matematyka/dzialania-pamieciowe/', mx:20, lv:['addsub','mult']},
    {s:'matematyka', k:'pot_best_v1', l:'Potęgowanie', h:'matematyka/potegowanie/', mx:40, lv:['squares','ten','mixed','order']},
    {s:'matematyka', k:'kolej_best_v1', l:'Kolejność wykonywania działań', h:'matematyka/kolejnosc-dzialan/', mx:20, lv:['noparen','paren']},
    {s:'matematyka', k:'rzym_best_v1', l:'Cyfry rzymskie', h:'matematyka/cyfry-rzymskie/', mx:20, lv:['basic','big']},
    {s:'matematyka', k:'przybl_best_v1', l:'Obliczenia przybliżone', h:'matematyka/obliczenia-przyblizone/', mx:20, lv:['round','estimate']},
    {s:'matematyka', k:'pierwsze_best_v1', l:'Liczby pierwsze i złożone', h:'matematyka/liczby-pierwsze/', mx:20, lv:['easy','hard']},
    {s:'matematyka', k:'rownania_best_v1', l:'Równania', h:'matematyka/rownania/', mx:20, lv:['addsub','muldiv']},
    {s:'matematyka', k:'powtorka_kartkowka_best_v1', l:'Powtórka przed kartkówką', h:'matematyka/powtorka-kartkowka/', mx:15},
    {s:'matematyka', k:'test_dzial1_best_v1', l:'Test z działu I (liczby naturalne)', h:'matematyka/test-dzial-1/', mx:50},
    {s:'jezyk-polski', k:'polski_odmiana_rzeczownika_best_v1', l:'Odmiana rzeczownika', h:'jezyk-polski/odmiana-rzeczownika/', mx:10},
    {s:'jezyk-polski', k:'polski_pustynia_puszcza_best_v1', l:'„W pustyni i w puszczy”', h:'jezyk-polski/w-pustyni-i-w-puszczy/', mx:15},
    {s:'jezyk-angielski', k:'ang_unit1_best_v1', l:'Unit 1 — One big family', h:'jezyk-angielski/unit-1-one-big-family/', mx:29},
    {s:'biologia', k:'bio_skladniki_chemiczne_best_v1', l:'Składniki chemiczne organizmów', h:'biologia/skladniki-chemiczne-organizmow/', mx:10},
    {s:'biologia', k:'bio_komorka_zwierzeca_best_v1', l:'Budowa komórki zwierzęcej', h:'biologia/budowa-komorki-zwierzecej/', mx:10},
    {s:'biologia', k:'bio_komorka_roslinna_best_v1', l:'Komórka roślinna. Inne rodzaje komórek', h:'biologia/komorka-roslinna/', mx:10},
    {s:'biologia', k:'bio_grzyby_porosty_best_v1', l:'Grzyby i porosty', h:'biologia/grzyby-porosty/', mx:10},
    {s:'biologia', k:'bio_budowa_komorek_best_v1', l:'Budowa komórek — test', h:'biologia/test-budowa-komorek/', mx:36},
    {s:'historia', k:'hist_zycie_pierwszych_ludzi_best_v1', l:'Życie pierwszych ludzi', h:'historia/zycie-pierwszych-ludzi/', mx:10},
    {s:'historia', k:'hist_mezopotamia_best_v1', l:'Miasta-państwa Mezopotamii', h:'historia/miasta-panstwa-mezopotamii/', mx:10},
    {s:'historia', k:'hist_egipt_faraonow_best_v1', l:'W Egipcie faraonów', h:'historia/w-egipcie-faraonow/', mx:10},
    {s:'historia', k:'hist_rozdzial1_best_v1', l:'Test z rozdziału I (historia)', h:'historia/test-rozdzial-1/', mx:20},
    {s:'geografia', k:'geo_mapa_i_skala_best_v1', l:'Mapa i skala', h:'geografia/mapa-i-skala/', mx:10}
  ];
  var EXTRA_KEYS = ['sg_defender_best_v1','sg_quiz_best_v1','sg_memory_best_v1','sg_math_best_v1'];
  var BYKEY = {}; CATALOG.forEach(function(c){ BYKEY[c.k] = c; });

  /* ---------- storage ---------- */
  function read(k, f){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : f; }catch(e){ return f; } }
  function write(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
  function hash(str){ var h = 5381; for (var i=0;i<str.length;i++){ h = ((h<<5) + h + str.charCodeAt(i)) | 0; } return (h>>>0).toString(36); }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function safeHtml(s){ return esc(s).replace(/&lt;(\/?)sup&gt;/g, '<$1sup>'); }
  function plural(n, one, few, many){ var m10 = n % 10, m100 = n % 100; if (n === 1) return one; if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return few; return many; }
  function dayKey(t){ var d = new Date(t); return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2); }
  function todayKey(){ return dayKey(Date.now()); }
  function daysBetween(fromKey, toKey){ var a = new Date(fromKey+'T00:00:00'), b = new Date(toKey+'T00:00:00'); return Math.round((b - a) / DAY); }

  /* ---------- attempts log ---------- */
  var newMistakes = 0;
  function attempt(o){
    if (!CFG.k) return;
    var a = read(K_ATT, []);
    a.push({ t:Date.now(), s:CFG.s, k:CFG.k, l:CFG.l, lv:o.level||'', sc:o.score, mx:o.max });
    if (a.length > 1000) a = a.slice(-1000);
    write(K_ATT, a);
    if (newMistakes > 0){
      var n = newMistakes; newMistakes = 0;
      toast('Zapisano ' + n + ' ' + plural(n,'pytanie','pytania','pytań') + ' do powtórki.', BASE + 'powtorka/', 'Powtórz teraz');
    }
  }
  function attempts(){ return read(K_ATT, []); }

  /* ---------- mistake bank (powtórki) ---------- */
  var STEPS = [1,3,7]; // dni po kolejnych poprawnych odpowiedziach; 4. poprawna = opanowane
  function db(){ var d = read(K_SR, null); if (!d || typeof d !== 'object' || !d.items) d = { items:{}, mastered:0 }; return d; }
  function promote(d, it){
    it.b++;
    if (it.b >= 4){ delete d.items[it.id]; d.mastered = (d.mastered||0) + 1; return 'mastered'; }
    it.d = Date.now() + STEPS[it.b-1] * DAY; return 'later';
  }
  function answered(it, correct){
    if (!CFG.k || !it || !it.q) return;
    var d = db(), now = Date.now();
    var id = hash(CFG.k + '|' + it.type + '|' + it.q + '|' + (it.hint||''));
    var cur = d.items[id];
    if (!correct){
      if (cur){ cur.n++; cur.b = 0; cur.d = now; cur.last = now; }
      else {
        d.items[id] = { id:id, s:CFG.s, k:CFG.k, l:CFG.l, tp:it.type, q:String(it.q), o:it.o||null, c:(it.c==null?-1:it.c), a:(it.answer==null?'':String(it.answer)), h:it.hint||'', sx:it.suffix||'', e:it.e||'', html:!!it.html, b:0, d:now, n:1, t0:now, last:now };
      }
      newMistakes++;
    } else if (cur && cur.d <= now){
      promote(d, cur);
    }
    write(K_SR, d);
  }
  var sr = {
    all: function(){ var d = db(); return Object.keys(d.items).map(function(k){ return d.items[k]; }); },
    mastered: function(){ return db().mastered || 0; },
    due: function(filter){
      var now = Date.now(), keys = filter && filter.keys, subj = filter && filter.subj;
      return sr.all().filter(function(it){ return it.d <= now && (!keys || keys.indexOf(it.k) !== -1) && (!subj || it.s === subj); }).sort(function(a,b){ return a.d - b.d; });
    },
    nextDue: function(){ var a = sr.all().filter(function(it){ return it.d > Date.now(); }).sort(function(a,b){ return a.d - b.d; }); return a.length ? a[0].d : 0; },
    grade: function(id, correct){
      var d = db(), it = d.items[id]; if (!it) return 'none';
      it.last = Date.now();
      if (correct) { var r = promote(d, it); write(K_SR, d); return r; }
      it.b = 0; it.n++; it.d = Date.now(); write(K_SR, d); return 'again';
    },
    clear: function(){ write(K_SR, { items:{}, mastered:0 }); }
  };

  /* ---------- statystyki ---------- */
  function pct(sc, mx){ return mx ? Math.round(sc / mx * 100) : 0; }
  function bestFromStorage(c){
    var v = read(c.k, 0);
    if (c.lv){ var s = 0; c.lv.forEach(function(l){ s += (v && v[l]) || 0; }); return s; }
    return typeof v === 'number' ? v : 0;
  }
  function byTopic(){
    var m = {};
    attempts().forEach(function(a){
      var o = m[a.k] || (m[a.k] = { k:a.k, n:0, last:null, lastT:0, bestPct:0, sumPct:0 });
      var p = pct(a.sc, a.mx);
      o.n++; o.sumPct += p; if (p > o.bestPct) o.bestPct = p;
      if (a.t >= o.lastT){ o.lastT = a.t; o.last = p; }
    });
    CATALOG.forEach(function(c){
      var b = bestFromStorage(c);
      if (b > 0){
        var o = m[c.k] || (m[c.k] = { k:c.k, n:0, last:null, lastT:0, bestPct:0, sumPct:0 });
        var p = pct(b, c.mx); if (p > o.bestPct) o.bestPct = p;
      }
    });
    return m;
  }
  function streak(){
    var set = {}; attempts().forEach(function(a){ set[dayKey(a.t)] = 1; });
    var n = 0, t = Date.now();
    if (!set[dayKey(t)]) t -= DAY;
    while (set[dayKey(t)]){ n++; t -= DAY; }
    return n;
  }

  /* ---------- plan sprawdzianów ---------- */
  var plan = {
    list: function(){ return read(K_PLAN, []).sort(function(a,b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }); },
    add: function(ex){ var l = read(K_PLAN, []); ex.id = 'e' + Date.now().toString(36) + Math.floor(Math.random()*1000).toString(36); l.push(ex); write(K_PLAN, l); return ex; },
    remove: function(id){ write(K_PLAN, read(K_PLAN, []).filter(function(e){ return e.id !== id; })); },
    upcoming: function(){ var t = todayKey(); return plan.list().filter(function(e){ return e.date >= t; }); },
    countdown: function(date){
      var n = daysBetween(todayKey(), date);
      if (n < 0) return 'minął';
      if (n === 0) return 'dziś';
      if (n === 1) return 'jutro';
      return 'za ' + n + ' ' + plural(n,'dzień','dni','dni');
    }
  };

  /* ---------- kopia zapasowa ---------- */
  function ownKeys(){
    var keys = {}; CATALOG.forEach(function(c){ keys[c.k] = 1; }); EXTRA_KEYS.forEach(function(k){ keys[k] = 1; });
    var out = [];
    for (var i=0;i<localStorage.length;i++){ var k = localStorage.key(i); if (/^nauka_/.test(k) || keys[k]) out.push(k); }
    return out;
  }
  function exportAll(){
    var data = {}; ownKeys().forEach(function(k){ if (k !== K_PRE) data[k] = localStorage.getItem(k); });
    return { app:'nauka-klasa5', v:1, exported:new Date().toISOString(), data:data };
  }
  function parseJ(s){ try{ return JSON.parse(s); }catch(e){ return null; } }
  function mergeBest(a, b){
    if (typeof a === 'number' || a == null){ if (typeof b === 'number' || b == null) return Math.max(a||0, b||0); }
    if (a && typeof a === 'object' && b && typeof b === 'object'){ var o = {}; Object.keys(a).concat(Object.keys(b)).forEach(function(k){ o[k] = Math.max(a[k]||0, b[k]||0); }); return o; }
    return b != null ? b : a;
  }
  function importAll(obj, mode){
    if (!obj || obj.app !== 'nauka-klasa5' || !obj.data || typeof obj.data !== 'object') throw new Error('To nie jest kopia zapasowa aplikacji Nauka.');
    var data = obj.data, n = 0;
    Object.keys(data).forEach(function(k){
      if (!(/^nauka_/.test(k) || BYKEY[k] || EXTRA_KEYS.indexOf(k) !== -1) || k === K_PRE) return;
      var incoming = parseJ(data[k]); if (incoming == null) return;
      if (mode === 'replace'){ localStorage.setItem(k, data[k]); n++; return; }
      var cur = parseJ(localStorage.getItem(k));
      if (k === K_ATT){
        var seen = {}, all = (cur||[]).concat(incoming).filter(function(a){ var id = a.t + '|' + a.k; if (seen[id]) return false; seen[id] = 1; return true; }).sort(function(a,b){ return a.t - b.t; });
        write(k, all.slice(-1000));
      } else if (k === K_PLAN){
        var ids = {}, merged = (cur||[]).concat(incoming).filter(function(e){ if (ids[e.id]) return false; ids[e.id] = 1; return true; });
        write(k, merged);
      } else if (k === K_SR){
        var d = db(), inc = incoming.items || {};
        Object.keys(inc).forEach(function(id){ if (!d.items[id] || (inc[id].last||0) > (d.items[id].last||0)) d.items[id] = inc[id]; });
        d.mastered = Math.max(d.mastered||0, incoming.mastered||0); write(k, d);
      } else { write(k, mergeBest(cur, incoming)); }
      n++;
    });
    return n;
  }
  function resetAll(){ ownKeys().forEach(function(k){ localStorage.removeItem(k); }); }

  /* ---------- tryb offline ---------- */
  function urls(){
    var u = ['nauka/', 'powtorka/', 'plan/', 'rodzic/', 'instaluj/', 'shared/app.js', 'shared/nauka.css', 'shared/manifest.webmanifest', 'shared/icons/icon-192.png', 'shared/icons/icon-512.png', 'shared/icons/icon-maskable-512.png', 'shared/icons/icon-96.png'];
    SUBJECT_ORDER.forEach(function(s){ u.push(SUBJECTS[s].h); });
    CATALOG.forEach(function(c){ u.push(c.h); });
    u.push('stacja-gier/');
    return u.filter(function(x, i){ return u.indexOf(x) === i; }).map(function(x){ return BASE + x; });
  }
  function registerSW(){
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker.register(BASE + 'sw.js', { scope: BASE }).catch(function(){});
  }
  function offlineStatus(){
    if (!('caches' in window)) return Promise.resolve({ supported:false, have:0, total:0 });
    var list = urls();
    return caches.open(CACHE_NAME).then(function(c){
      return Promise.all(list.map(function(u){ return c.match(u, { ignoreSearch:true }); })).then(function(r){
        var have = r.filter(Boolean).length; return { supported:true, have:have, total:list.length };
      });
    }).catch(function(){ return { supported:false, have:0, total:0 }; });
  }
  function precache(progress){
    if (!('caches' in window)) return Promise.reject(new Error('Ta przeglądarka nie obsługuje trybu offline.'));
    var list = urls(), done = 0, finished = 0;
    function fetchOne(c, u){
      return fetch(u, { cache:'reload' }).then(function(res){
        if (!res || !res.ok) return false;
        return c.put(u, res).then(function(){ return true; });
      }).catch(function(){ return false; });
    }
    return caches.open(CACHE_NAME).then(function(c){
      var failed = [];
      return list.reduce(function(p, u){
        return p.then(function(){ return fetchOne(c, u).then(function(ok){ finished++; if (ok) done++; else failed.push(u); if (progress) progress(finished, list.length); }); });
      }, Promise.resolve()).then(function(){
        return failed.reduce(function(p, u){
          return p.then(function(){ return fetchOne(c, u).then(function(ok){ if (ok){ done++; } }); });
        }, Promise.resolve());
      });
    }).then(function(){
      var fail = list.length - done;
      if (!fail) write(K_PRE, Date.now());
      return { done:done, fail:fail, total:list.length };
    });
  }
  function autoPrecache(){
    if (!('caches' in window) || !navigator.onLine) return;
    var last = read(K_PRE, 0);
    if (Date.now() - last < DAY) return;
    var go = function(){ precache().catch(function(){}); };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 8000 }); else setTimeout(go, 3000);
  }

  /* ---------- toast ---------- */
  function toast(msg, href, linkText){
    try{
      var old = document.getElementById('nauka-toast'); if (old) old.remove();
      var el = document.createElement('div'); el.id = 'nauka-toast'; el.setAttribute('role','status');
      el.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;max-width:min(92vw,460px);display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center;padding:12px 16px;border-radius:12px;background:#2a2f3a;color:#fff;font:600 13.5px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.28)';
      var t = document.createElement('span'); t.textContent = msg; el.appendChild(t);
      if (href){ var a = document.createElement('a'); a.href = href; a.textContent = linkText || 'Otwórz'; a.style.cssText = 'color:#ffd9c2;text-decoration:underline;font-weight:800'; el.appendChild(a); }
      var x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label','Zamknij'); x.style.cssText = 'background:none;border:none;color:#fff;font-size:20px;line-height:1;cursor:pointer;padding:0 2px'; x.onclick = function(){ el.remove(); }; el.appendChild(x);
      document.body.appendChild(el); setTimeout(function(){ if (el.parentNode) el.remove(); }, 12000);
    }catch(e){}
  }

  var api = {
    base: BASE, subjects: SUBJECTS, subjectOrder: SUBJECT_ORDER, catalog: CATALOG, byKey: BYKEY,
    attempt: attempt, attempts: attempts, answered: answered, sr: sr, plan: plan,
    stats: { byTopic: byTopic, streak: streak, pct: pct, best: bestFromStorage },
    exportAll: exportAll, importAll: importAll, resetAll: resetAll,
    offline: { urls: urls, status: offlineStatus, precache: precache, auto: autoPrecache },
    util: { esc: esc, safeHtml: safeHtml, plural: plural, dayKey: dayKey, todayKey: todayKey, daysBetween: daysBetween, hash: hash },
    toast: toast, _cfg: CFG, _DAY: DAY
  };
  window.Nauka = api;
  registerSW();
})();
