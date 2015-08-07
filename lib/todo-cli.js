var list = require('./list.js');
var utils = require('./utils.js');
var _ = require('lodash');
var debug = require('debug')('cli.todo');
var Todo = require('./models/todo.js');

var cliFreeArgs = ['title', 'value'];

var defaults = _.partialRight(_.assign, function(value, other) {
  return _.isUndefined(value) ? other : value;
});

module.exports._process = function _process(core, argv) {
  // which subcommand
  var subcommand = utils.getCommand(argv._, ['new', 'list', 'done'],
  "The `todo` subcommand is used to manage todos.");

  debug('args before: ', argv);

  switch (subcommand) {
    case 'new':
      var todo = new Todo(Todo.fromArgs(argv));
      return todo.create(core.db).catch(function(err){
        console.log(err);
      });
      break;
    case 'list':
      core.db.read({ $and: [{done: false}, {type: 'todo'}]}).then(function(items){
        list.listItems('todo', items, core.config.listsDir);
      });
      break;
    case 'done':
      var id = _list.getIndex('todo');
      core.TodoManager.read({id: id}).then(function(todo){
        return todo.update({done: true});
      });
      break;
    default:
      process.exit(1);
  }
}
