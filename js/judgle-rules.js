/* ==========================================================================
   JUDGLE RULES - single source of truth for scoring rules used across the suite.
   Edit values here; every tool picks them up. Run tests/rules-test.html after changes.

   STATUS: verified against the FIG Trampoline Gymnastics Code of Points 2025-2028 and
   Newsletters 31, 32 and 33 (newsletters take precedence over the CoP text).
   ========================================================================== */
(function (root) {
  'use strict';

  var COP = {
    edition: 'FIG Trampoline Gymnastics Code of Points 2025-2028, with Newsletters 31, 32 and 33',
    status: 'verified',
    note: 'Newsletters take precedence over the Code of Points text. HD uses the scale in force from 1 Nov 2026.',
    references: {
      skillScale:   'TRA 20.1, TUM 19.1, DMT 19.1 (0.0 to 0.5 per element)',
      landingScale: 'TRA 20.2.2, TUM 19.2.2, DMT 19.2.2 (0.1-0.3, 0.5, 1.0)',
      baseScore:    'Maximum mark for interrupted exercises, CJP duties (TRA, TUM 18.7, DMT 18.7)',
      greaterFault: 'TRA 20.2.2: a single deduction for the greater fault only',
      hd:           'TRA 22 and Newsletter 32 (0.1 / 0.3 / 0.5 from 1 Nov 2026)',
      zoneChange:   'TUM 18.8.2, DMT 18.8.3 (+0.2 stepping into a worse zone)',
      tumTrack:     'TUM 15.3 (0.4 CJP penalty when the last element is not landed in the landing area)',
      stability:    'Newsletter 32 Q&A 1 (turning before totally stable: 0.2 TRA, 0.3 TUM/DMT)'
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

  /* TRA landing: the outbounce and landing-movement deductions (together at most 0.3) are replaced
     by a single deduction when a greater fault occurs (hand touch 0.5, fall / off the bed 1.0). */
  function trpLanding(outbounce, stability) {
    var ob = round1(outbounce || 0), st = round1(stability || 0);
    if (st >= 0.5) return { outbounce: 0, stability: st, total: st, greaterFault: true };
    return { outbounce: ob, stability: st, total: round1(Math.min(0.3, ob + st)), greaterFault: false };
  }

  /* Horizontal displacement (TRA). Scale in force from 1 Nov 2026 (Newsletter 32).
     Zones as fractions of the half-length / half-width of the bed:
       centre |u|<=0.28 and |v|<=0.5 -> 0.0 ; inner sides 0.28<|u|<=0.5 (middle row) -> 0.1
       top/bottom middle and side middles -> 0.3 ; four corners -> 0.5 */
  var HD_SCALE = { centre: 0.0, inner: 0.1, edge: 0.3, corner: 0.5 };
  function hdZone(xCm, yCm, halfLengthCm, halfWidthCm) {
    var u = Math.abs(xCm) / (halfLengthCm || 214), v = Math.abs(yCm) / (halfWidthCm || 107);
    if (v > 0.5) return u > 0.5 ? 'corner' : 'edge';
    if (u > 0.5) return 'edge';
    return u > 0.28 ? 'inner' : 'centre';
  }
  function hdDeduction(xCm, yCm, halfLengthCm, halfWidthCm) { return HD_SCALE[hdZone(xCm, yCm, halfLengthCm, halfWidthCm)]; }

  /* DMT / TUM: stepping completely out of the landing area means a worse zone was crossed,
     unless the gymnast started in the worst zone already. */
  var ZONE_CHANGE_PENALTY = 0.2;
  var TUM_TRACK_PENALTY = 0.4;
  function exitZoneChange(initialZoneRank, worstZoneRank) { return initialZoneRank < worstZoneRank ? ZONE_CHANGE_PENALTY : 0.0; }

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
    trpLanding: trpLanding, HD_SCALE: HD_SCALE, hdZone: hdZone, hdDeduction: hdDeduction,
    ZONE_CHANGE_PENALTY: ZONE_CHANGE_PENALTY, TUM_TRACK_PENALTY: TUM_TRACK_PENALTY, exitZoneChange: exitZoneChange,
    digitValue: digitValue, swipeValue: swipeValue, multitouchValue: multitouchValue, keyboardValue: keyboardValue,
    formatDeduction: function (v) { return '-' + Number(v).toFixed(1); },
    formatScore: function (v) { return Number(v).toFixed(1); }
  };
  root.JudgleRules = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
