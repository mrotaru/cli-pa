var Datastore = require('nedb');
var Promise = require('bluebird');
Promise.promisifyAll(Datastore.prototype);

// explicitly specify type: nedb or mongodb
module.exports.init = function init(options, type) {
  if(type === 'nedb') {
    var db = new Datastore(options);
    return db.loadDatabaseAsync().then(function(){
      return Promise.resolve(db);
    });
  } else if (type === 'mongodb') {
    throw new Error('mongodb not implemented');
  } else {
    throw new Error('Unknown database type: ' + type);
  }
}
