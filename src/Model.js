var debug = require('debug')('model');

function Model(obj) {
}

Model.prototype.init = function init() {
  this._meta = {};
  this._meta.created = false;
  this._meta.model = Model;
  return this;
}

Model.prototype.fromObject = function fromObject(obj) {
  var tmp = {};
  _.assign(tmp, obj);
  return this.validate.call(tmp);
}

// validate, and create on database
Model.prototype.create = function create() {
  debug('creating model:', this._meta.model.typeString);
  var self = this;
  var db = this._meta.model.db;
  return this.validate()
    .then(function(item){
      return db.create(_.omit(item, '_meta'));
    })
    .then(function(){
      self._meta.created = true;
      debug('created');
    });
}

// read from database (will overwrite current props)
Model.prototype.read = function read(queryObject) {
  var self = this;
  var db = this._meta.model.db;
  queryObject.type = this._meta.model.typeString;
  return db.read(queryObject).then(function(res){
    if(!res.length) {
      throw new Error('"todo" not found; query: ' + queryObject.toString());
    }
    _.assign(self,res[0]);
    self._meta.created = true;
  });
}

// validate, and sync to db
Model.prototype.update = function update(db, updateObj) {
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
Model.prototype.delete = function create(db) {
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
Model.prototype.validate = function validate() {
  debug('validating: ',this);
  var deferred = Promise.pending();
  var self = this;
  if(!this._meta.model.schema) {
    debug('no schema; assuming valid');
    deferred.fulfill(self);
  }
  _validate(this._meta.model.schema, this.noMeta(), function(valid, res) {
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
