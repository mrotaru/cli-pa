var fs = require('fs');
var path = require('path');
var Datastore = require('nedb');
 var readline = require('readline');

function spliceFirst(array) {
  return array.splice(0,1)[0];
}

// http://stackoverflow.com/a/1830844/447661
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

process.argv.splice(0,2);
var args = process.argv;
var database = './default.db';
var command1 = spliceFirst(args);
var command2 = spliceFirst(args);

var avatar = null;

var db = new Datastore({ filename: database});
db.loadDatabase(function (err) {
  if(err) {
    throw new Error('Error opening database: ', err);
  }
  db.find({type: "avatar"}, function(err, found){
    if(found.length === 0) {
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question("No avatars found; please enter a name for your avatar: ", function(answer) {
        db.insert({type: "avatar", name: answer, points: 0}, function(err, inserted){
          avatar = inserted;
          console.log('Welcome, ' + answer + '. Start accumulating points by completing your todo\'s and dailies!');
          rl.close();
        });
      });
    } else {
      avatar = found[0];
    }

    if(command1 === 'todo') {
      if(command2 === 'new') {
        var title =  spliceFirst(args);
        var value =  spliceFirst(args);
        if(!isNumeric(value)) {
          throw new Error('Value must be a number; this is not a number: ' +  value);
        }
        db.insert({type: 'todo', title: title, done: false, value: value, created: new Date() }, function(err, newDoc){
          console.log('added todo: '+ title);
        });
      } else if (command2 === 'list') {
        // to act on an item, it must be selected first. For
        // exmaple, to mark a todo as done, first you `todo list`, see
        // what number is assigned to the item, then `todo done 35`.
        fs.unlink('./listing.db', function(err) {
          var listDb = new Datastore({ filename: './listing.db'});
          listDb.loadDatabase(function(err){
            db.find({$and: [{type: 'todo'},{done: false}]}, function(err, docs){
              for (var i=0; i < docs.length; ++i) {
                var doc = docs[i];
                listDb.insert({listIndex: i+1, docId: doc._id}, function(err, inserted){
                });
                console.log((i+1).toString() + '. ' + doc.title + ' ' + (doc.value ? '(' + doc.value + ')':''));
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
            var listingResult = foundDocs[0];
            var foundDoc = null;
            console.log(listingResult);
            db.update({_id: listingResult.docId}, { $set: {done: true} }, {}, function(err, num){
              if(err) {
                console.log(err);
              } else {
                db.find({_id: listingResult.docId}, function(err, foundDocs){
                  found = foundDocs[0];
                  var doneValue = found.value ? found.value : 0;
                  var newScore = Number.parseFloat(found.value) + Number.parseFloat(avatar.points);
                  if(doneValue) {
                    db.update({_id: avatar._id}, { $set: {points: newScore}}, {}, function(err, num, updated){
                      if(err) {
                        console.log(err);
                      } else {
                        console.log(avatar.name, 'gained', doneValue, 'points.');
                      }
                    });
                  }
                  console.log('done; ' + avatar.name + ' gained ' );
                });
              }
            });
          });
        });
      }
    } else if(command1 === 'avatar') {
      console.log(avatar);
    } else {
      console.log('Unknown command: ' + command1);
    }
  });
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
