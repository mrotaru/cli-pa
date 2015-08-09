var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var Datastore = require('nedb');
var debug = require('debug')('listing');
Promise.promisifyAll(Datastore.prototype);
var errorHandler = require('./utils.js').errorHandler;

function listDbForType(listsDir, type) {
  return path.resolve(
    path.join(listsDir, 'list-' + type + '.db')
  );
}

/**
 * Removes `path` if already existing, and creates a new nedb database
 *
 * @param {String} path
 */
function forceNewDb(path) {

  function rmIfExists(path){
    return fs.statAsync(path).then(function(stat){
      return fs.unlinkAsync(path);
    }).catch(function(err){
      if(err.code === 'ENOENT') {
        return Promise.resolve();
      } else {
        return Promise.reject(err);
      }
    });
  }

  return rmIfExists(path).then(function(){
    var listDb = new Datastore({ filename: path});
    return listDb.loadDatabaseAsync().then(function(){
      return Promise.resolve(listDb);
    });
  });
}

module.exports = {

  /**
   * @param {Object} core hg core - for configs such as where to create list db
   * @param {String} type
   * @param {Array}  items
   */
  listItems: function(core, type, items) {
    var listDbFile = listDbForType(core.config.listsDir, type);
    return forceNewDb(listDbFile).then(function(listDb){
      var insertPromises = [];
      for (var i=0; i < items.length; i++) {
        var doc = items[i];
        console.log((i+1).toString() + '. ' + doc.title + ' ' + (doc.value ? '(' + doc.value + ')':''));
        insertPromises.push(listDb.insertAsync({listIndex: i+1, docId: doc._id}));
      }
      return Promise.all(insertPromises);
    });
  },

  /**
   * Queries the database, builds a small temporary database with the found
   * items and displays them, numbered.
   *
   * @param {Object} core hg core - for configs such as where to create list db
   * @param {String} type
   * @param {Object} queryObject
   * @param {Object} condition
   */
  findAndListItems: function list(core, type, queryObject, condition) {
    var listDbFile = listDbForType(core.config.listsDir, type);
    var listDb = new Datastore({ filename: listDbFile});
    return fs.unlinkAsync(listDbFile).then(function(){
      return listDb.loadDatabaseAsync().then(function(){
        return core.db.findAsync(queryObject);
      });
    }).then(function(docs){
      debug('found ' + docs.length + ' items.');
      var insertPromises = [];
      for (var i=0; i < docs.length; i++) {
        var doc = docs[i];
        var conditionPassed = typeof condition === 'function' && condition(doc) === true;
        if(typeof condition === 'function' && !conditionPassed) {
          debug('condition not passed: ' + doc.title);
        } else {
          console.log((i+1).toString() + '. ' + doc.title + ' ' + (doc.value ? '(' + doc.value + ')':''));
          insertPromises.push(listDb.insertAsync({listIndex: i+1, docId: doc._id}));
        }
      }
      return Promise.all(insertPromises);
    }).catch(errorHandler);
  },

  /**
   * Looks in the temp dir for a listing with `type` items, and returns the
   * item listed as number `number`. The returned item will contain the id of
   * the item in the main database, but not the item itself.
   *
   * @param {Object}  core
   * @param {String}  type
   * @param {Integer} number
   */
  getListItemsID: function getListNumber(core, type, number) {
    var listDbFile = listDbForType(core.config.listsDir, type);
    var listDb = new Datastore({ filename: listDbFile});
    return listDb.loadDatabaseAsync().then(function(){
      return listDb.findAsync({listIndex: number});
    }).then(function(foundDocs){
      if(foundDocs.length < 1) {
        throw new Error('No document found');
      }
      debug('item nubmer ' + number + ' in ' + listDbFile, foundDocs);
      return Promise.resolve(foundDocs[0].docId);
    }).catch(errorHandler);
  }
}
