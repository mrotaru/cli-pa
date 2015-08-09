var utils = require('./utils.js');
var debug = require('debug')('ducks');
var _ = require('lodash');

module.exports._process = function _process(core, argv) {
  var commands = {
    'row': function() {
      // parse numbers
      debug('row: ', argv);
      if(!argv._.length) {
      } else {
        var numbers = arrayFromCommaSeparatedNumbers(argv._[0]);
        console.log(numbers);
      }
    },

    // shows the current row
    'list': function() {
      debug('list: ', argv);
    },

    // mark the first one in line as done, or the one passed as a param
    'bang': function() {
      debug('bang: ', argv);
    }
  };

  function getRow() {
    return core.db.read({type: 'duckrow'});
  }

  /**
   * @returns {Array|false}
   */
  function arrayFromCommaSeparatedNumbers(str) {
    if(typeof str !== 'string') {
      return false;
    }
    var result = [];
    var parts = str.split(',');
    if(parts.length) {
      for (var i=0; i < parts.length; ++i) {
        var p = parts[i];
        if(p.match(/\d+/)) {
          result.push(parseInt(p));
        } else {
          return false;
        }
      }
      return result;
    }
    return false;
  }

  var subcommand = utils.getCommand(argv, _.keys(commands), {
    defaultCmd: 'list',
    defaultUnrecognized: 'row',
    noSpliceWhenUnrecognized: true
  });
  if(commands[subcommand]) {
    return commands[subcommand]();
  } else {
    return getRow().then(function(row){
      if(row.length) {
        debug('row: ' + row.toString());
        return commands.list();
      } else {
        debug(argv);
        console.log('You don\'t currently have ducks in a row.');
        console.log('To do that, first list your todos, and then:\n');
        console.log('  habitg ducks 1,2,3\n');
        console.log('That will add todos listed as 1,2 and 3 to a duck row.');
        return process.exit(1);
      }
    });
  }
};
