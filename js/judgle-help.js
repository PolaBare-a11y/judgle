/* ==========================================================================
   JUDGLE HELP - "?" button (top-right) + tabbed help sheet.
   Page text lives in data/help.js. A page opts in with <meta name="jg-help" content="id">.
   First visit: opens automatically once. The "don't show again" box (ticked by default)
   controls whether it opens by itself next time. Requires judgle-storage.js.
   ========================================================================== */
(function (root) {
  'use strict';
  var TABS = [['quick', 'Quick start'], ['controls', 'Controls'], ['tips', 'Tips']];
  var KEY = (root.JudgleStorage && JudgleStorage.KEYS.helpSeen) || 'judgle_help_seen_v1';
  var pageId, data, btn, overlay, sheet, tabBtns = {}, panels = {}, autoBox, lastFocus, isOpen = false, activeTab = 'quick';

  function seen() { return (root.JudgleStorage ? JudgleStorage.getJSON(KEY, {}) : {}) || {}; }
  function saveSeen(m) { if (root.JudgleStorage) JudgleStorage.setJSON(KEY, m); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function buildPanels() {
    var q = el('ol', 'jg-steps');
    (data.quick || []).forEach(function (s) { q.appendChild(el('li', null, s.replace(/^\d+\.\s*/, ''))); });
    panels.quick.appendChild(el('p', 'jg-purpose', data.purpose || ''));
    panels.quick.appendChild(q);

    (data.controls || []).forEach(function (g) {
      panels.controls.appendChild(el('h3', 'jg-group', g.heading));
      var list = el('div', 'jg-rows');
      g.items.forEach(function (it) {
        var row = el('div', 'jg-row'); row.appendChild(el('span', 'jg-k', it[0])); row.appendChild(el('span', 'jg-v', it[1])); list.appendChild(row);
      });
      panels.controls.appendChild(list);
    });
    if (!(data.controls || []).length) panels.controls.appendChild(el('p', 'jg-purpose', 'No controls to list for this page.'));

    var t = el('ul', 'jg-tips');
    (data.tips || []).forEach(function (s) { t.appendChild(el('li', null, s)); });
    panels.tips.appendChild(t);
    if (root.JudgleRules && root.JudgleRules.COP) {
      var c = root.JudgleRules.COP;
      panels.tips.appendChild(el('p', 'jg-rules', 'Scoring rules in this tool: ' + c.edition + ' (' + c.status + ').'));
    }
  }

  function build() {
    btn = el('button', 'jg-help', '?');
    btn.type = 'button'; btn.title = 'Help'; btn.setAttribute('aria-label', 'Help for this tool');
    btn.addEventListener('click', function () { openSheet(); });
    document.body.appendChild(btn);

    overlay = el('div', 'jg-sheet-overlay'); overlay.hidden = true;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSheet(); });
    sheet = el('div', 'jg-sheet');
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'jg-sheet-title');

    var head = el('div', 'jg-sheet-head');
    var title = el('h2', 'jg-sheet-title', data.title || 'Help'); title.id = 'jg-sheet-title';
    var x = el('button', 'jg-sheet-x', '\u2715'); x.type = 'button'; x.setAttribute('aria-label', 'Close help');
    x.addEventListener('click', closeSheet);
    head.appendChild(title); head.appendChild(x);

    var tabs = el('div', 'jg-tabs'); tabs.setAttribute('role', 'tablist');
    TABS.forEach(function (t) {
      var b = el('button', 'jg-tab', t[1]); b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'jg-tab-' + t[0];
      b.setAttribute('aria-controls', 'jg-panel-' + t[0]);
      b.addEventListener('click', function () { selectTab(t[0]); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var i = TABS.map(function (x) { return x[0]; }).indexOf(t[0]);
          var n = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length][0];
          selectTab(n); tabBtns[n].focus(); e.preventDefault();
        }
      });
      tabBtns[t[0]] = b; tabs.appendChild(b);
    });

    var body = el('div', 'jg-sheet-body');
    TABS.forEach(function (t) {
      var p = el('div', 'jg-panel'); p.id = 'jg-panel-' + t[0]; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', 'jg-tab-' + t[0]);
      panels[t[0]] = p; body.appendChild(p);
    });

    var foot = el('div', 'jg-sheet-foot');
    var lab = el('label', 'jg-auto'); autoBox = document.createElement('input'); autoBox.type = 'checkbox';
    lab.appendChild(autoBox); lab.appendChild(document.createTextNode(" Don't show this automatically again"));
    var ok = el('button', 'jg-sheet-ok', 'Got it'); ok.type = 'button'; ok.addEventListener('click', closeSheet);
    foot.appendChild(lab); foot.appendChild(ok);

    sheet.appendChild(head); sheet.appendChild(tabs); sheet.appendChild(body); sheet.appendChild(foot);
    overlay.appendChild(sheet); document.body.appendChild(overlay);
    buildPanels(); selectTab('quick');
  }

  function selectTab(id) {
    activeTab = id;
    TABS.forEach(function (t) {
      var on = t[0] === id;
      tabBtns[t[0]].setAttribute('aria-selected', on ? 'true' : 'false'); tabBtns[t[0]].tabIndex = on ? 0 : -1;
      tabBtns[t[0]].classList.toggle('active', on); panels[t[0]].hidden = !on;
    });
  }

  function focusables() { return sheet.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])'); }

  function openSheet() {
    if (isOpen) return;
    isOpen = true; lastFocus = document.activeElement;
    autoBox.checked = seen()[pageId] !== false;      // default ticked: close = "seen"
    selectTab('quick'); overlay.hidden = false;
    var x = sheet.querySelector('.jg-sheet-x'); if (x) x.focus();
  }
  function closeSheet() {
    if (!isOpen) return;
    isOpen = false; overlay.hidden = true;
    var m = seen(); if (autoBox.checked) m[pageId] = true; else delete m[pageId]; saveSeen(m);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  /* While open, keep keystrokes away from the page (e.g. Space/Enter/ESC shortcuts) */
  window.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { closeSheet(); e.stopPropagation(); e.preventDefault(); return; }
    if (e.key === 'Tab') {
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
    e.stopPropagation();
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    var meta = document.querySelector('meta[name="jg-help"]');
    pageId = meta && meta.getAttribute('content');
    data = root.JUDGLE_HELP && pageId && root.JUDGLE_HELP[pageId];
    if (!data) return;
    build();
    if (!seen()[pageId]) setTimeout(openSheet, 450);
  });
  root.JudgleHelp = { open: function () { if (btn) openSheet(); }, close: closeSheet };
})(window);
