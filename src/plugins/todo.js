var list = require('../list.js');
var utils = require('../utils.js');
var Todo = require('../models/todo.js');

module.exports = {
  aliases: ['t'],
  description: '',
  action: function todoAction(core, argv) {

    var commands = {
      'new': {
        aliases: ['add','create'],
        description: 'Create a new todo item.',
        action: function() {
          var todo = new Todo(Todo.fromArgs(argv));
          return todo.create(core.db).catch(function(err){
            console.log(err);
          });
        }
      },
      'list': {
        aliases: ['ls'],
        description: 'List todo items.',
        action: function() {
          return core.db.read({ $and: [{done: false}, {type: 'todo'}]}).then(function(items){
            if(!items.length) {
              console.log('No items.');
            } else {
              list.listItems(core, 'todo', items);
            }
          });
        }
      },
      'done': {
        description: 'Mark a previously listed todo item as done.',
        action: function() {
          var index = argv._[0];
          list.getListItemsID(core, 'todo', index).then(function(id){
            var todo = new Todo();
            return todo.read(core.db, {_id: id}).then(function(){
              return todo.update(core.db, {done: true});
            });
          });
        }
      }
    };

    // run subcommand, or exit
    var subcommand = utils.getCommand(argv, commands, {
      messageBefore: "The `todo` subcommand is used to manage todos.",
      defaultNoArgs: 'list',
      defaultWithArgs: 'new'
    });
    if(subcommand) {
      return subcommand.action();
    } else {
      process.exit(1);
    }
  }
};
