var fs = require('fs');
var path = require('path');
var readline = require('readline');

var Promise = require('bluebird');
var _db = Promise.promisifyAll(require('./db.js'));

var todo = require('./hg-todo.js');
var avatar = require('./hg-avatar.js');

process.argv.splice(0,2);
var args = process.argv;
var dbFile = './default.db';
var todoListDbFile = './listing.db';
var command1 = spliceFirst(args);
var command2 = spliceFirst(args);

//var db = new Datastore({ filename: dbFile});

function spliceFirst(array) {
  return array.splice(0,1)[0];
}

_db.init({filename: dbFile}, 'nedb').then(function(db){
  if(command1 === 'todo') {
    if(command2 === 'new') {
      return todo.create(db, args);
    } else if (command2 === 'list') {
      return todo.list(db);
    } else if (command2 === 'done') {
      var listIndex = Number.parseInt(spliceFirst(args));
      return todo._doneListNumber(db, todoListDbFile, listIndex);
    }
  } else if(command1 === 'avatar') {
    avatar.load(db).then(function(_avatar){
      avatar.print(_avatar);
    });
  } else {
    console.log('Unknown command: ' + command1);
  }
});


function toHabit(obj) {
  if(!obj.hasOwnProperty('title')) {
    throw new Error('Habits must have a title');
  }
  db.insert(obj, function(err, newDoc){
    if(err) {
      console.log(err);
    }
  });
}
