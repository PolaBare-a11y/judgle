/* Judgle Suite shared theme switcher. Load in <head>, before the stylesheets. */
(function () {
  var KEY = 'judgle_theme';
  var ORDER = ['dark', 'light', 'mono'];
  var LABELS = { dark: 'Dark', light: 'Light', mono: 'Mono' };
  var root = document.documentElement;

  function get() {
    try { var v = localStorage.getItem(KEY); if (ORDER.indexOf(v) > -1) return v; } catch (e) {}
    return 'dark';
  }
  function syncButtons() {
    var t = get();
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.textContent = '\uD83C\uDF17 ' + LABELS[t];
      b.title = 'Theme: ' + LABELS[t] + ' (tap to change)';
    });
  }
  function set(t, persist) {
    if (ORDER.indexOf(t) < 0) t = 'dark';
    root.setAttribute('data-theme', t);
    if (persist !== false) { try { localStorage.setItem(KEY, t); } catch (e) {} }
    syncButtons();
    document.dispatchEvent(new CustomEvent('judgle-themechange', { detail: t }));
  }
  function cycle() { set(ORDER[(ORDER.indexOf(get()) + 1) % ORDER.length]); }

  root.setAttribute('data-theme', get());
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) { b.addEventListener('click', cycle); });
    syncButtons();
  });

  /* ---- Shared shell: home button + footer ---- */
  var HOME_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>';
  function buildShell() {
    var body = document.body;
    var onIndex = /(^|\/)(index\.html)?$/.test(location.pathname) || body.hasAttribute('data-no-home');
    if (!onIndex && !document.querySelector('.jg-home')) {
      var a = document.createElement('a');
      a.className = 'jg-home'; a.href = 'index.html'; a.title = 'Home';
      a.setAttribute('aria-label', 'Back to Judgle home');
      a.innerHTML = HOME_SVG;
      body.appendChild(a);
    }
    if (!document.querySelector('.jg-footer')) {
      var f = document.createElement('footer'); f.className = 'jg-footer';
      var credit = document.createElement('div');
      credit.appendChild(document.createTextNode('Vibe Coded/Created by '));
      var st = document.createElement('strong'); st.textContent = 'Jed \uD83C\uDDE6\uD83C\uDDFA';
      credit.appendChild(st); f.appendChild(credit);
      var meta = document.querySelector('meta[name="jg-footer"]');
      var note = meta && meta.getAttribute('content');
      if (note) { var n = document.createElement('div'); n.className = 'jg-footer-note'; n.textContent = note; f.appendChild(n); }
      (document.querySelector('[data-jg-footer-mount]') || body).appendChild(f);
    }
  }
  document.addEventListener('DOMContentLoaded', buildShell);
  window.JudgleTheme = { get: get, set: set, cycle: cycle, order: ORDER };
})();
