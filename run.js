const R = require('../js/judgle-rules.js');
const res = require('./rules-tests.js')(R);
let fail = 0;
res.forEach(r => { if (!r.ok) { fail++; console.log('FAIL', r.name, r.detail); } });
console.log(res.length - fail + '/' + res.length + ' rules tests passed');
process.exit(fail ? 1 : 0);
