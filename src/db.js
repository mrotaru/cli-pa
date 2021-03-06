var debug = require('debug')('db');
var Datastore = require('nedb');
var Promise = require('bluebird');
Promise.promisifyAll(Datastore.prototype);

module.exports = Database;

function Database(type, options) {
  this.type = type;
  this.options = options;
  this.inited = false;
  this.realDb = null;
}

Database.prototype.init = function init() {
  debug('init with', this.options);
  if(this.type === 'nedb') {
    this.realDb = new Datastore(this.options);
  } else if (this.type === 'mongodb') {
    throw new Error('mongodb not implemented');
  } else {
    throw new Error('Unknown database type: ' + this.type);
  }
  return this.realDb.loadDatabaseAsync().then(function(){
    this.inited = true;
  });
}

Database.prototype.create = function create(obj) {
  debug('inserting', obj);
  return this.realDb.insertAsync(obj);
}

Database.prototype.read = function(queryObject) {
  debug('reading', queryObject);
  return this.realDb.findAsync(queryObject);
}

Database.prototype.update = function(id, updateObj) {
  debug('updating', id, updateObj);
  return this.realDb.updateAsync({_id: id}, {$set: updateObj});
}

Database.prototype.remove = function(id) {
  debug('deleting', id);
  return this.realDb.removeAsync({_id: id},{});
}
Database.prototype.delete = Database.prototype.remove;
