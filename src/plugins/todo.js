var list = require('../list.js');
var utils = require('../utils.js');
var Todo = require('./todo.model.js');
var debug = require('debug')('todo:plugin');
var _ = require('lodash');

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
          return core.db.read({
            $where: function(){
              if(this.type !== 'todo') return false;
              if(this.done  === false || this.recurringToday) {
                return true;
              }
              return false;
            }
          }).then(function(items){
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
              return todo.update(core.db, {done: true, doneDate: new Date()});
            });
          });
        }
      },
      'remove': {
        description: 'Remove todo item from database.',
        aliases: ['rm','delete'],
        action: function() {
          var index = argv._[0];
          list.getListItemsID(core, 'todo', index).then(function(id){
            var todo = new Todo();
            return todo.read(core.db, {_id: id}).then(function(){
              return todo.delete(core.db).then(function(){
                console.log('Removed.');
              });
            });
          });
        }
      },
      'update': {
        description: 'Update item from database.',
        action: function() {
          var index = argv._[0];
          list.getListItemsID(core, 'todo', index).then(function(id){
            var _todo = Todo.fromArgs(argv);
            _todo.updated = new Date();
            _todo = _.omit(_todo,'created');
            debug('fromArgs for update:', _todo);
            var todo = new Todo();
            return todo.read(core.db, {_id: id}).then(function(){
              return todo.update(core.db, _todo).then(function(){
                console.log('Updated.');
              });
            });
          });
        }
      },
      'raw': {
        description: 'View raw item data.',
        action: function() {
          var index = argv._[0];
          list.getListItemsID(core, 'todo', index).then(function(id){
            var todo = new Todo();
            return todo.read(core.db, {_id: id}).then(function(){
              console.log(require('util').inspect(todo, {colors: true}));
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
