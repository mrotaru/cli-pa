var list = require('./list.js');
var utils = require('./utils.js');
var Todo = require('./models/todo.js');

module.exports._process = function _process(core, argv) {

  var commands = {

    'new': function() {
      var todo = new Todo(Todo.fromArgs(argv));
      return todo.create(core.db).catch(function(err){
        console.log(err);
      });
    },

    'list': function() {
      return core.db.read({ $and: [{done: false}, {type: 'todo'}]}).then(function(items){
        if(!items.length) {
          console.log('No items.');
        } else {
          list.listItems('todo', items, core.config.listsDir);
        }
      });
    },

    'done': function() {
      var index = argv._[0];
      list.getListItemsID('todo', index, core.config.listsDir).then(function(id){
        var todo = new Todo();
        return todo.read(core.db, {_id: id}).then(function(){
          return todo.update(core.db, {done: true});
        });
      });
    }
  }

  // run subcommand, or exit
  var subcommand = utils.getCommand(argv._, require('lodash').keys(commands),
  "The `todo` subcommand is used to manage todos.");
  if(commands[subcommand]) {
    return commands[subcommand]();
  } else {
    process.exit(1);
  }
}
