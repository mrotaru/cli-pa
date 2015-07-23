module.exports.spliceFirst = function spliceFirst(array) {
  return array.splice(0,1)[0];
}

module.exports.errorHandler = function error(err) {
  console.log(err);
  console.log(err.stack);
}

// http://stackoverflow.com/a/1830844/447661
module.exports.isNumeric = function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports.getAvatar = function getAvatar(db) {
  return db.findAsync({type: "avatar"}).then(function(foundDocs){
    return Promise.resolve(foundDocs[0]);
  });
}

/**
 * Searches `db` for item wiht `id`, sets `setAttributes`, and adds the item's
 * `value` to the points of the current avatar.
 * @return {Function}
 */
module.exports.done = function done(db, id, setAttributes) {
  return db.updateAsync({_id: id}, { $set: setAttributes }, {}).then(function(err, num){
    return db.findAsync({_id: id}).then(function(foundDocs){
      found = foundDocs[0];
      var doneValue = found.value ? found.value : 0;
      return module.exports.getAvatar(db).then(function(avatar){
        var newScore = Number.parseFloat(found.value) + Number.parseFloat(avatar.points);
        if(doneValue) {
          return db.updateAsync({_id: avatar._id}, { $set: {points: newScore}}, {}).then(function(ret){
            if(ret !== 1) {
              throw new Error('Not updated');
            }
          });
        }
      });
    });
  });
}
