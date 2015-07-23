var Promise = require('bluebird');
var path = require('path');
var debug = require('debug')('daily');

var _list = require('./lib/list.js');
var _utils = require('./lib/utils.js');

function isToday(date) {
  var today = new Date();
  return today.toDateString() === date.toDateString();
}

function isYesterday(date) {
  var yesterday = new Date().getDay()-1;
  return yesterday.toDateString() === date.toDateString();
}

function doneDaily(db, id) {
  return db.findAsync({$and: [{type: "daily"}, {_id: id}]}).then(function(foundDocs){
    var doc = foundDocs[0];
    var today = new Date()
    var yesterday = today.getDay()-1;
    if(doc.lastDone == today) {
      debug('already done: ' + doc.title);
    } else {
      return _utils.done(db, id, {lastDone: new Date()}).then(function(){
      });
    }
  });
}

module.exports = {

  process: function process(db) {
    return db.findAsync({type: "daily"}).then(function(foundDocs){
      for (var i=0; i < foundDocs.length; ++i) {
        var doc = foundDocs[i];
        var today = new Date()
        var yesterday = today.getDay()-1;
        if(doc.lastDone == yesterday) {
          debug('daily not done: ' + doc.title);
        }
      }
    });
  },

  /**
   * Create a new daily in `db`. Args must be an array, and contain two
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
      return db.insertAsync({type: 'daily', title: title, value: value, created: new Date() }).then(function(){
        console.log('added daily: '+ title);
      });
    }
  },


  /**
   * Marks task number `number` in the last listing as done.
   */
  _doneListNumber: function _doneListNumber(db, listDbFile, number) {
    return _list.getListItemsID(listDbFile, number).then(function(id){
      return doneDaily(db, id);
    });
  },

  list: function list(db, listDbFile, args) {
    return _list.list(db, listDbFile, {$and: [{type: 'daily'}]}, function(daily){
      return typeof daily.lastDone === 'undefined' || !isToday(daily.lastDone);
    });
  }
}
