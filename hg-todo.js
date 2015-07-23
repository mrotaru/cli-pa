var Promise = require('bluebird');

var _list = require('./lib/list.js');
var _utils = require('./lib/utils.js');
 
/**
 * Marks task with the id `id` as "done", and adds points to the
 * current avatar, if any.
 */
function done(db, id) {
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
}

module.exports = {

  /**
   * Create a new todo in `db`. Args must be an array, and contain two
   * values: title and value in points.
   */
  create: function create(db, args) {
    if(args.length === 0) {
      return Promise.reject('Need at least two arguments');
    } else {
      var title =  _utils.spliceFirst(args);
      var value =  _utils.spliceFirst(args);
      if(!_utils.isNumeric(value)) {
        throw new Error('Value must be a number; this is not a number: ' +  value);
      }
      return db.insertAsync({type: 'todo', title: title, done: false, value: value, created: new Date() }).then(function(){
        console.log('added todo: '+ title);
      });
    }
  },

  done: done,

  /**
   * Marks task number `number` in the last listing as done.
   */
  _doneListNumber: function _doneListNumber(db, listDbFile, number) {
    return _list.getListItemsID(listDbFile, number).then(function(id){
      return done(db, id);
    });
  },

  list: function list(db) {
    return _list.list(db, './listing.db',  {$and: [{type: 'todo'},{done: false}]});
  }
}
