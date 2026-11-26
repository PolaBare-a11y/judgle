/* Rules test cases. Used by tests/rules-test.html (browser) and `node tests/run.js`. */
function runRulesTests(R) {
  var results = [];
  function eq(name, actual, expected) {
    var ok = JSON.stringify(actual) === JSON.stringify(expected);
    results.push({ name: name, ok: ok, detail: ok ? '' : 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) });
  }
  var none = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  // Disciplines
  eq('skill counts', R.SKILL_COUNTS, { TRP: 10, DMT: 2, TUM: 8 });
  eq('landing scale', R.LANDING_SCALE, [0, 0.1, 0.2, 0.3, 0.5, 1.0]);
  eq('skill scale', R.SKILL_SCALE, [0, 0.1, 0.2, 0.3, 0.4, 0.5]);

  // Base scores
  eq('TRP base 10 skills', R.baseScore('TRP', 10), 10);
  eq('TRP base 7 skills (incomplete)', R.baseScore('TRP', 7), 7);
  eq('DMT base 2 skills', R.baseScore('DMT', 2), 10);
  eq('DMT base 1 skill', R.baseScore('DMT', 1), 8);
  eq('DMT base 0 skills', R.baseScore('DMT', 0), 0);
  eq('TUM base 8 skills', R.baseScore('TUM', 8), 10);
  eq('TUM base 0 skills', R.baseScore('TUM', 0), 0);

  // Routine totals
  eq('clean TRP routine', R.computeRoutine('TRP', 10, none, 0).netScore, 10);
  eq('TRP with deductions', R.computeRoutine('TRP', 10, [0.1, 0.2, 0, 0, 0, 0, 0, 0, 0, 0], 0.3).netScore, 9.4);
  eq('float sum is clean (0.1+0.2)', R.computeRoutine('TRP', 10, [0.1, 0.2, 0, 0, 0, 0, 0, 0, 0, 0], 0).totalDeduct, 0.3);
  eq('landing ignored when routine incomplete', R.computeRoutine('TRP', 9, none, 1.0).totalDeduct, 0);
  eq('landing counts when complete', R.computeRoutine('TRP', 10, none, 1.0).totalDeduct, 1);
  eq('net score never below 0', R.computeRoutine('DMT', 2, [0.5, 0.5], 1.0).netScore, 8.0);
  eq('TUM complete', R.computeRoutine('TUM', 8, [0, 0, 0, 0, 0, 0, 0, 0.5], 1.0).netScore, 8.5);
  eq('empty DMT routine', R.computeRoutine('DMT', 0, [], 0).netScore, 0);

  // Severity colour bands
  eq('severity 0.0', R.severity(0), 'green');
  eq('severity 0.1', R.severity(0.1), 'green');
  eq('severity 0.2', R.severity(0.2), 'orange');
  eq('severity 0.3', R.severity(0.3), 'orange');
  eq('severity 0.4', R.severity(0.4), 'red');
  eq('severity 1.0', R.severity(1.0), 'red');

  // Input mappings: handwriting
  eq('digit 3 skill', R.digitValue('3', false), 0.3);
  eq('digit 4 skill', R.digitValue('4', false), 0.4);
  eq('digit 5 skill', R.digitValue('5', false), 0.5);
  eq('digit 10 skill', R.digitValue('10', false), 0.5);
  eq('digit 5 landing (0.5, not 1.0)', R.digitValue('5', true), 0.5);
  eq('digit 4 landing reads as 0.5', R.digitValue('4', true), 0.5);
  eq('digit 10 landing', R.digitValue('10', true), 1.0);
  eq('digit 7 invalid', R.digitValue('7', false), null);
  // Swipe
  eq('swipe left skill', R.swipeValue('left', false), 0.4);
  eq('swipe left landing', R.swipeValue('left', true), 0.5);
  eq('circle skill', R.swipeValue('circle', false), 0.5);
  eq('circle landing', R.swipeValue('circle', true), 1.0);
  eq('tap', R.swipeValue('tap', true), 0);
  // Multi-touch
  eq('5 fingers skill', R.multitouchValue(5, false, false), 0.5);
  eq('4 fingers landing', R.multitouchValue(4, false, true), 0.5);
  eq('5 fingers landing', R.multitouchValue(5, false, true), 1.0);
  eq('long swipe', R.multitouchValue(3, true, false), 0);
  // Keyboard
  eq('key 4 landing blocked', R.keyboardValue('4', true), null);
  eq('key 9 landing', R.keyboardValue('9', true), 1.0);
  eq('key 5 landing', R.keyboardValue('5', true), 0.5);
  eq('key 6 skill blocked', R.keyboardValue('6', false), null);
  eq('key 4 skill', R.keyboardValue('4', false), 0.4);

  return results;
}
if (typeof module !== 'undefined') module.exports = runRulesTests;
