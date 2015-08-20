var assert = require('assert');
var utils = require('./utils.js');

function test(f) {
  var args = Array.prototype.slice.call(arguments, 1);
  try {
    f.apply(null,args);
    console.log('passed: ', f.name, args);
  } catch(err) {
    console.log('failed: ' + err.message);
  }
}

test(assert.deepEqual, utils.extractTags('a #foo #bar'), ['foo','bar']);
test(assert.deepEqual, utils.extractTags('a #foo bar'), ['foo']);
