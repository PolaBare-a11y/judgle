/* ==========================================================================
   JUDGLE RULES - single source of truth for scoring rules used across the suite.
   Edit values here; every tool picks them up. Run tests/rules-test.html after changes.

   STATUS: values below were consolidated from the existing tools and are
   marked UNVERIFIED against the current FIG Trampoline Code of Points.
   Set COP.status to 'verified' (and fill in edition + references) once checked.
   ========================================================================== */
(function (root) {
  'use strict';

  var COP = {
    edition: 'FIG Trampoline Code of Points (edition to be confirmed)',
    status: 'unverified',
    references: {
      // e.g. landingScale: 'CoP Art. xx.x' - add as each rule is verified
    }
  };

  var DISCIPLINES = {
    TRP: { id: 'TRP', name: 'Trampoline',             fullName: 'TRAMPOLINE',            skills: 10 },
    DMT: { id: 'DMT', name: 'Double Mini-Trampoline', fullName: 'DOUBLE MINI TRAMPOLINE', skills: 2 },
    TUM: { id: 'TUM', name: 'Tumbling',               fullName: 'TUMBLING',               skills: 8 }
  };
  var SKILL_COUNTS = { TRP: 10, DMT: 2, TUM: 8 };

  /* Execution deduction scales (per skill, and landing) */
  var SKILL_SCALE   = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5];
  var LANDING_SCALE = [0.0, 0.1, 0.2, 0.3, 0.5, 1.0];

  var SWIPE_LABELS = { tap: 'Tap', up: 'Flick Up', down: 'Flick Down', right: 'Swipe Right', left: 'Swipe Left', circle: 'Circle' };

  function round1(n) { return Math.round(n * 10) / 10; }
  function maxSkills(disc) { return SKILL_COUNTS[disc] || 10; }
  function fullName(disc) { return (DISCIPLINES[disc] || DISCIPLINES.TRP).fullName; }
  function isLandingActive(disc, performed) { return performed === maxSkills(disc); }

  /* Starting score for the skills actually performed */
  function baseScore(disc, performed) {
    performed = Math.max(0, performed | 0);
    if (disc === 'DMT') return performed >= 2 ? 10.0 : (performed === 1 ? 8.0 : 0.0);
    if (disc === 'TUM') return performed > 0 ? performed + 2.0 : 0.0;
    return performed * 1.0; // TRP
  }

  /* Routine total. Landing only counts when every skill was performed. */
  function computeRoutine(disc, performed, skillDeductions, landingDeduction) {
    performed = Math.max(0, Math.min(maxSkills(disc), performed | 0));
    var skillSum = 0;
    for (var i = 0; i < performed; i++) skillSum += Number(skillDeductions[i]) || 0;
    var landingActive = isLandingActive(disc, performed);
    var totalDeduct = round1(skillSum + (landingActive ? (Number(landingDeduction) || 0) : 0));
    var base = baseScore(disc, performed);
    return { base: base, totalDeduct: totalDeduct, netScore: Math.max(0, round1(base - totalDeduct)), landingActive: landingActive };
  }

  /* Colour band for a deduction: 0.0-0.1 green, 0.2-0.3 orange, above red */
  function severity(v) {
    var t = Math.round(v * 10);
    return t <= 1 ? 'green' : (t <= 3 ? 'orange' : 'red');
  }

  /* --- Input mappings (every input method resolves to a deduction value here) --- */
  function digitValue(digit, isLanding) {
    var d = String(digit);
    if (d === '10') return isLanding ? 1.0 : 0.5;
    if (!/^[0-5]$/.test(d)) return null;
    var n = parseInt(d, 10);
    if (isLanding && n === 4) return 0.5;     // 4 is not on the landing scale; read as 5
    return round1(n / 10);
  }
  function swipeValue(dir, isLanding) {
    switch (dir) {
      case 'tap':    return 0.0;
      case 'up':     return 0.1;
      case 'right':  return 0.2;
      case 'down':   return 0.3;
      case 'left':   return isLanding ? 0.5 : 0.4;
      case 'circle': return isLanding ? 1.0 : 0.5;
    }
    return null;
  }
  function multitouchValue(fingers, swiped, isLanding) {
    if (swiped) return 0.0;
    var n = Math.min(5, Math.max(1, fingers | 0));
    return isLanding ? [0.0, 0.1, 0.2, 0.3, 0.5, 1.0][n] : round1(n / 10);
  }
  function keyboardValue(key, isLanding) {
    var k = String(key);
    if (!/^[0-9]$/.test(k)) return null;
    if (isLanding) {
      if (k === '9') return 1.0;
      return ['0', '1', '2', '3', '5'].indexOf(k) >= 0 ? round1(parseInt(k, 10) / 10) : null;
    }
    return parseInt(k, 10) <= 5 ? round1(parseInt(k, 10) / 10) : null;
  }

  var api = {
    VERSION: '1.0.0', COP: COP, DISCIPLINES: DISCIPLINES, SKILL_COUNTS: SKILL_COUNTS,
    SKILL_SCALE: SKILL_SCALE, LANDING_SCALE: LANDING_SCALE, SWIPE_LABELS: SWIPE_LABELS,
    round1: round1, maxSkills: maxSkills, fullName: fullName, isLandingActive: isLandingActive,
    baseScore: baseScore, computeRoutine: computeRoutine, severity: severity,
    digitValue: digitValue, swipeValue: swipeValue, multitouchValue: multitouchValue, keyboardValue: keyboardValue,
    formatDeduction: function (v) { return '-' + Number(v).toFixed(1); },
    formatScore: function (v) { return Number(v).toFixed(1); }
  };
  root.JudgleRules = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
