var Promise = require('bluebird');
var _ = require('lodash');
//var _validate = Promise.promisify(require('schema-inspector').validate);
var _validate = require('schema-inspector').validate;
var utils = require('../utils.js');
var debug = require('debug')('model:todo');

module.exports = Todo;

Todo.schema = {
  type: 'object',
  properties: {
    type:  { type: 'string', eq: 'todo' },
    title: { type: 'string' },
    value: { type: 'number' },
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
    .then(db.create(_.omit(this, '_meta')))
    .then(function(){
      self._meta.created = true;
      debug('created');
    });
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
  var deferred = Promise.pending();
  var self = this;
  _validate(Todo.schema, this.noMeta(), function(valid, res) {
    if(res.valid) {
      deferred.fulfill(self);
    } else {
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
