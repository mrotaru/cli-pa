var utils = require('../utils.js');
var Promise = require('bluebird');
var list = require('../list.js');
var debug = require('debug')('ducks');
var _ = require('lodash');

/**
 * Check if all user given numbers are in `items`, and return the array with
 * the item's id in the database, and title.
 *
 * @param {Array} numbers array of integers from cli
 * @param {Array} items items in the list
 *
 * @return {Array} 
 */
function getValidItems(numbers, items) {
  var ducks = [];
  for (var i=0; i < numbers.length; ++i) {
    var found = false;
    for (var j=0; j < items.length; ++j) {
      if(items[j].listIndex === numbers[i]) {
        found = true;
        var obj = {
          listIndex: numbers[i],
          id: items[j].docId,
          title: items[j].title
        };
        ducks.push(obj);
      }
    }
    if(!found) {
      throw new Error('Not found in listing: ' + numbers[i].toString());
    }
  }
  return ducks;
}

module.exports = {
  description: '',
  action: function ducksAction(core, argv) {
    
    var commands = {
      'row': {
        description: 'Get your ducks in a row.',
        action: function ducksRow() {
          debug('row: ', argv);
          if(!argv._.length) {
          } else {
            var numbers = utils.arrayFromCommaSeparatedNumbers(argv._[0]);
            debug('numbers:', numbers);
            var listedItems = list.getListedItems(core, 'todo').then(function(items){
              debug('listed: ', items);
              var ducks = getValidItems(numbers, items);
              debug('ducks: ', ducks);
              return core.db.create({type: 'duckrow', ducks: ducks});
            });
          }
        }
      },

      // shows the current row
      'list': {
        aliases: ['ls'],
        action: function ducksList() {
          debug('list: ', argv);
          return core.db.read({type: 'duckrow'}).then(function(rows){
            if(!rows.length) {
              return;
            }
            debug('duckrows:', rows);

            // load "ducks" from main db, to check item status
            var ducks = [];
            Promise.map(rows[0].ducks, function(duck){
              debug('duck in db:', duck);
              return core.db.read({_id: duck.id}).then(function(res){
                if(res.length === 1) {
                  res[0].listIndex = duck.listIndex;
                  ducks.push(res[0]);
                }
              });
            }, {concurrency: 1}).then(function(){
              debug('all ducks, with listIndex:', ducks);
              // display
              for (var i=0; i < ducks.length; ++i) {
                var duck = ducks[i];
                var c   = duck.done ? 0: 7;
                var dim = duck.done ? 1: 2;
                var out = '\u001b[3' + c + ';' + dim + 'm' + duck.listIndex + '. ' + duck.title
                + '\u001b[0m';
                console.log(out);
              }
            });
          });
        }
      },

      // mark the first one in line as done, or the one passed as a param
      'bang': {
        aliases: ['done'],
        action: function duckBang() {
          debug('bang: ', argv);
          // find duck list index
        }
      },

      'reset': {
        aliases: ['rm','cancel'],
        action: function duckReset() {
          return getRow().then(function(rows){
            debug('resetting: ',rows[0]);
            return core.db.remove(rows[0]._id);
          });
        }
      }
    };

    function getRow() {
      return core.db.read({type: 'duckrow'});
    }

    var subcommand = utils.getCommand(argv, commands, {
      defaultNoArgs: 'list',
      defaultWithArgs: 'row',
      noSpliceWhenUnrecognized: true
    });
    if(subcommand) {
      return subcommand.action();
    } else {
      return getRow().then(function(row){
        if(row.length) {
          debug('row: ' + row.toString());
          return commands.list.action();
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
  }
};
