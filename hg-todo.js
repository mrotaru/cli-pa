var Promise = require('bluebird');
var _list = require('./list.js');
 
// http://stackoverflow.com/a/1830844/447661
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = {
  create: function create(db, args) {
    if(args.length === 0) {
      return Promise.reject('Need at least two arguments');
    } else {
      var title =  spliceFirst(args);
      var value =  spliceFirst(args);
      if(!isNumeric(value)) {
        throw new Error('Value must be a number; this is not a number: ' +  value);
      }
      return db.insertAsync({type: 'todo', title: title, done: false, value: value, created: new Date() }).then(function(){
        console.log('added todo: '+ title);
      });
    }
  },

  done: function done(db, id) {
    return db.updateAsync({_id: id}, { $set: {done: true} }, {}).then(function(err, num){
      return db.findAsync({_id: id}).then(function(foundDocs){
        found = foundDocs[0];
        var doneValue = found.value ? found.value : 0;
        var newScore = Number.parseFloat(found.value) + Number.parseFloat(avatar.points);
        if(doneValue) {
          return db.updateAsync({_id: avatar._id}, { $set: {points: newScore}}, {}).then(function(err, num, updated){
            if(num !== 1) {
              throw new Error('Not updated');
            }
          });
        }
      });
    });
  },

  doneListNumber: function doneListNumber(db, number) {
    return _list.getListItemsID(db, number).then(function(id){
      return done(db, id);
    });
  },

  list: function list() {
    return _list.list('./listing.db',  {$and: [{type: 'todo'},{done: false}]});
  }
}
