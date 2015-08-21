var assert = require('assert');
var nodeUtils = require('util');
var utils = require('./utils.js');

function okMessage(msg) {
  console.log('  \u001b[32;1m' + '√' + '\u001b[0m' + ' passed: ', msg);
}
function errorMessage(msg) {
  console.log('  \u001b[31;1m' + 'x' + '\u001b[0m' + ' failed: ', msg);
}
var assert = require('assert');
var monkeyPathed = ['equal', 'deepEqual' ];
for (var i=0; i < monkeyPathed.length; ++i) {
  var f = monkeyPathed[i];
  var original = assert[f];
  assert[f] = function() {
    var args = Array.prototype.slice.call(arguments);
    try {
      original.apply(args);
      okMessage(args);
    } catch(err) {
      errorMessage(err.message);
    }
  };
}
var originalThrow = assert.throws;
assert['throws'] = function(a, b, c) {
  try {
    originalThrow.call(null, a, b, c);
    okMessage(arguments);
  } catch(err) {
    errorMessage(err.message);
  }
}

console.log('\u001b[37;1m' + __filename + '\u001b[0m');
assert.deepEqual(utils.extractTags('a #foo bar'), ['foo']);
