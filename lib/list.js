var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var Datastore = require('nedb');
var debug = require('debug')('listing');
Promise.promisifyAll(Datastore.prototype);
var errorHandler = require('./utils.js').errorHandler;

// queryObject  
module.exports = {

  /**
   * Query `dbFile`, and write results into `listDbFile`. Output
   * each found result, with it's corresponding number.
   */
  list: function list(db, listDbFile, queryObject, condition) {
    return fs.unlinkAsync(listDbFile).then(function(){
      var listDb = new Datastore({ filename: listDbFile});
      return listDb.loadDatabaseAsync().then(function(){
        return db.findAsync(queryObject).then(function(docs){
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
        });
      });
    }).catch(errorHandler);
  },

  // returns promise of the `_id` of item with `number` in last listing
  getListItemsID: function getListNumber(listDbFile, number) {
    var listDb = new Datastore({ filename: listDbFile});
    return listDb.loadDatabaseAsync().then(function(){
      return listDb.findAsync({listIndex: number}).then(function(foundDocs){
        if(foundDocs.length < 1) {
          throw new Error('No document found');
        }
        debug('item nubmer ' + number + ' in ' + listDbFile, foundDocs);
        return Promise.resolve(foundDocs[0].docId);
      });
    }).catch(errorHandler);
  }
}
