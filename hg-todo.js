var Promise = require('bluebird');
var path = require('path');

var _list = require('./lib/list.js');
var _utils = require('./lib/utils.js');
 
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
      var value =  _utils.spliceFirst(args) || 10;
      if(!_utils.isNumeric(value)) {
        throw new Error('Value must be a number; this is not a number: ' +  value);
      }
      return db.insertAsync({type: 'todo', title: title, done: false, value: value, created: new Date() }).then(function(){
        console.log('added todo: '+ title);
      });
    }
  },

  done: function doneTodo(db, id) {
    return _utils.done(db, id, {done: true});
  },

  /**
   * Marks task number `number` in the last listing as done.
   */
  _doneListNumber: function _doneListNumber(db, listDbFile, number) {
    return _list.getListItemsID(listDbFile, number).then(function(id){
      return _utils.done(db, id, {done: true});
    });
  },

  list: function list(db) {
    return _list.list(db, path.resolve('./listing.db'),  {$and: [{type: 'todo'},{done: false}]});
  }
}
