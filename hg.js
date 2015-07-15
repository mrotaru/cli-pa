var fs = require('fs');
var path = require('path');
var Datastore = require('nedb');

function spliceFirst(array) {
  return array.splice(0,1)[0];
}

process.argv.splice(0,2);
var args = process.argv;
var database = './default.db';
var command1 = spliceFirst(args);
var command2 = spliceFirst(args);

var db = new Datastore({ filename: database});
db.loadDatabase(function (err) {
  if(err) {
    throw new Error('Error opening database: ', err);
  }
});

// to act on an item, it must be selected first. For
// exmaple, to mark a todo as done, first you `todo list`, see
// what number is assigned to the item, then `todo done 35`.

if(command1 === 'todo') {
  if(command2 === 'new') {
    var title =  spliceFirst(args);
    db.insert({type: 'todo', title: title, done: false, created: new Date() }, function(err, newDoc){
      console.log('added todo: '+ title);
    });
  } else if (command2 === 'list') {
    fs.unlink('./listing.db', function(err) {
      var listDb = new Datastore({ filename: './listing.db'});
      listDb.loadDatabase(function(err){
        db.find({$and: [{type: 'todo'},{done: false}]}, function(err, docs){
          for (var i=0; i < docs.length; ++i) {
            var doc = docs[i];
            listDb.insert({listIndex: i+1, docId: doc._id}, function(err, inserted){
            });
            console.log((i+1).toString() + '. ' + doc.title);
          }
        });
      });
    });
  } else if (command2 === 'done') {
    var listIndex = Number.parseInt(spliceFirst(args));
    var listDb = new Datastore({ filename: './listing.db'});
    listDb.loadDatabase(function (err) {
      listDb.find({listIndex: listIndex}, function(err, foundDocs){
        if(foundDocs.length < 1) {
          throw new Error('No document found');
        }
        var foundDoc = foundDocs[0];
        db.update({_id: foundDoc.docId}, { $set: {done: true} }, {}, function(err, found){
          if(err) {
            console.log(err);
          } else {
            console.log('done: ', found);
          }
        });
      });
    });
  }
} else {
  console.log('Unknown command: ' + command1);
}

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
