/* JUDGLE STORAGE - one place for every localStorage key and safe read/write helpers. */
(function (root) {
  'use strict';
  var KEYS = {
    theme: 'judgle_theme',
    patterns: 'judgle_patterns_v2',                 // shared handwriting templates [{name, points}]
    patternsMigrated: 'judgle_patterns_migrated_v2',
    legacyPatternsJed: 'judgle_custom_pdollar_templates_v1',
    legacyPatternsRtinput: 'judgle_custom_templates_v1',
    routineLogs: 'judgle_routine_logs_v1',
    branding: 'judgle_course_branding_v1',
    landingsPackage: 'fig_landing_pkg_v1',
    watchedResources: 'watchedResources',
    helpSeen: 'judgle_help_seen_v1'
  };
  function getJSON(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); } catch (e) { return fallback; }
  }
  function setJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function remove(key) { try { localStorage.removeItem(key); } catch (e) {} }

  /* One-time, non-destructive merge of patterns trained separately in jed and rtinput. */
  function migratePatterns() {
    if (getJSON(KEYS.patternsMigrated, false)) return;
    var merged = getJSON(KEYS.patterns, []);
    var jed = getJSON(KEYS.legacyPatternsJed, []);
    var rt = getJSON(KEYS.legacyPatternsRtinput, []);
    if (Array.isArray(jed)) jed.forEach(function (i) { if (i && i.name && Array.isArray(i.points)) merged.push({ name: String(i.name), points: i.points }); });
    if (Array.isArray(rt)) rt.forEach(function (i) { if (i && i.digit && Array.isArray(i.points)) merged.push({ name: String(i.digit), points: i.points }); });
    setJSON(KEYS.patterns, merged);
    setJSON(KEYS.patternsMigrated, true);
  }
  root.JudgleStorage = { KEYS: KEYS, getJSON: getJSON, setJSON: setJSON, remove: remove, migratePatterns: migratePatterns };
})(window);
