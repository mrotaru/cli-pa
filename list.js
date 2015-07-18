var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var Datastore = require('nedb');
Promise.promisifyAll(Datastore.prototype);
var errorHandler = require('./utils.js').errorHandler;

// queryObject  
module.exports = {
  list: function list(db, queryObject) {
    return fs.unlinkAsync(db).then(function(){
      var listDb = new Datastore({ filename: db});
      return listDb.loadDatabaseAsync().then(function(){
        return db.findAsync(queryObject).then(function(docs){
          for (var i=0; i < docs.length; ++i) {
            var doc = docs[i];
            console.log((i+1).toString() + '. ' + doc.title + ' ' + (doc.value ? '(' + doc.value + ')':''));
            return listDb.insertAsync({listIndex: i+1, docId: doc._id})
          }
        });
      });
    }).catch(errorHandler);
  },

  // returns promise of the `_id` of item with `number` in last listing
  getListItemsID: function getListNumber(db, number) {
    var listDb = new Datastore({ filename: db});
    return listDb.loadDatabaseAsync().then(function(){
      return listDb.findAsync({listIndex: number}).then(function(foundDocs){
        if(foundDocs.length < 1) {
          throw new Error('No document found');
        }
        return Promise.resolve(foundDocs[0].docId);
      });
    }).catch(errorHandler);
  }
}
