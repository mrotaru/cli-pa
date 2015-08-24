var Promise = require('bluebird');
var _ = require('lodash');
var _validate = require('schema-inspector').validate;
var utils = require('../utils.js');
var debug = require('debug')('plugin:todo:model');

module.exports = Todo;

Todo.schema = {
  type: 'object',
  properties: {
    type:  { type: 'string', eq: 'todo' },
    title: { type: 'string' },
    value: { type: 'number' },
    recurring: { type: 'string' },
    created: { type: 'date' }
  }
};

Todo.cliFreeArgs = ['title', 'value'];

// parse from args
Todo.fromArgs = utils.itemFromArgsGen(
  'todo', Todo.schema, Todo.cliFreeArgs
);

/**
 * Todo model
 *
 * @param {Object} obj it's attriutes will be copied on this
 */
function Todo(obj) {

  this.type = 'todo';
  this.done = false;
  this.value = 10;

  this._meta = {};
  this._meta.created = false;

  // deep copy to this
  if(obj) {
    _.assign(this, obj);
  };

  // for chaining
  return this;
}

// validate, and create on database
Todo.prototype.create = function create(db) {
  debug('creating');
  var self = this;
  return this.validate()
    .then(function(todo){
      return db.create(_.omit(todo, '_meta'));
    })
    .then(function(){
      self._meta.created = true;
      debug('created');
    });
}

Todo.prototype.recurringToday = function recurringToday() {

  /**
   * @param {Date} d
   * @return {Number} week number
   * http://stackoverflow.com/a/6117889/447661*
   */
  function getWeekNumber(d) {
    d = new Date(+d);
    d.setHours(0,0,0);
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    var yearStart = new Date(d.getFullYear(),0,1);
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return weekNo;
  }

  if(!this.recurring) {
    return false;
  }
  if(!this.doneDate) {
    return true;
  }
  var today = new Date().setHours(0,0,0,0);
  var doneDate = this.doneDate.setHours(0,0,0,0);
  // daily
  if(this.recurring === 'D') {
    if(doneDate < today) {
      debug('doneDate:',doneDate,'<', today, ' => recurringToday = true');
      return true;
    } else {
      return false;
    }
  // weekly
  } else if(this.recurring === 'W') {
    var lastWeekDone = getWeekNumber(this.doneDate);
    if(lastWeekDone < getWeekNumber(new Date())) {
      debug('lastWeekDone >= getWeekNumber => recurringToday = true');
      return true;
    } 
  }
  return false;
}

// read from database (will overwrite current props)
Todo.prototype.read = function read(db, queryObject) {
  var self = this;
  queryObject.type = 'todo';
  return db.read(queryObject).then(function(res){
    if(!res.length) {
      throw new Error('"todo" not found; query: ' + queryObject.toString());
    }
    _.assign(self,res[0]);
    self._meta.created = true;
  });
}

// validate, and sync to db
Todo.prototype.update = function update(db, updateObj) {
  var self = this;
  if(this._meta.created) {
    return this.validate().then(function(){
      return db.update(self._id, updateObj);
    });
  } else {
    throw new Error('Must be created on database first.');
  }
}

// delete
Todo.prototype.delete = function create(db) {
  var self = this;
  if(this._meta.created) {
    return db.remove(this._id).then(function(){
      self._meta.created = false;
    });
  } else {
    throw new Error('Must be created on database first.');
  }
}

// validate
Todo.prototype.validate = function validate() {
  debug('validating: ',this);
  var deferred = Promise.pending();
  var self = this;
  _validate(Todo.schema, this.noMeta(), function(valid, res) {
    if(res.valid) {
      debug('is valid');
      deferred.fulfill(self);
    } else {
      debug('not valid');
      deferred.reject(res.format());
    }
  });
  return deferred.promise;
}

/**
 * @return {Object} new object with meta properties (such
 * as `__db` removed. Does not affect `this`.
 */
Todo.prototype.noMeta = function noMeta() {
  return _.omit(this, ['_meta']);
}
