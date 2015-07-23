var fs = require('fs');
var path = require('path');
var readline = require('readline');

var Promise = require('bluebird');
var _db = Promise.promisifyAll(require('./lib/db.js'));
var _utils = require('./lib/utils.js');

var _todo = require('./hg-todo.js');
var _avatar = require('./hg-avatar.js');
var _daily = require('./hg-daily.js');

process.argv.splice(0,2);
var args = process.argv;
var dbFile = './default.db';
var todoListDbFile = './listing.db';
var command1 = _utils.spliceFirst(args);
var command2 = _utils.spliceFirst(args);

_db.init({filename: dbFile}, 'nedb').then(function(db){
  if(command1 === 'todo') {
    if(command2 === 'new') {
      return _todo.create(db, args);
    } else if (command2 === 'list') {
      return _todo.list(db, args);
    } else if (command2 === 'done') {
      var listIndex = Number.parseInt(_utils.spliceFirst(args));
      return _todo._doneListNumber(db, todoListDbFile, listIndex, args);
    }
  } else if(command1 === 'avatar') {
    _avatar.load(db).then(function(avatar){
      _avatar.print(avatar);
    });
  } else {
    console.log('Unknown command: ' + command1);
  }
});
