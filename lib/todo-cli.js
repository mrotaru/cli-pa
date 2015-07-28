var list = require('./list.js');
var utils = require('./utils.js');
var _ = require('lodash');
var debug = require('debug')('cli.todo');
var validate = require('./validate.js');

module.exports.process = function process(core, argv) {
  // which subcommand
  var subcommand = argv._.splice(0,1)[0];
  var subcommands = ['new', 'list', 'done'];
  var found = _.find(subcommands, function(_subcommand){
    return subcommand === _subcommand;
  });
  if(!found) {
    console.error('Unknown command: ' + subcommand);
    process.exit(1);
  }

  switch (subcommand) {
    case 'new':
      var todo = utils.objFromArgs('todo', argv);
      validate('todo', todo).then(function(todo){
        debug('fromArgs', todo);
        return core.db.create(todo);
      });
      break;
    case 'list':
      core.db.read({ $and: [{done: false}, {type: 'todo'}]}).then(function(items){
        list.listItems('todo', items);
      });
      break;
    case 'done':
      var id = _list.getIndex('todo');
      core.TodoManager.read({id: id}).then(function(todo){
        return todo.update({done: true});
      });
      break;
    default:
  }
}
