var Promise = require('bluebird');
var readline = require('readline');

module.exports = {

  // check if databse contains an avatar and load it
  // @return {Promise(Object)} avatar
  load:  function load(db) {
    return db.findAsync({type: "avatar"}).then(function(found){
      if(found.length === 0) {
        var rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        var question = Promise.promisify(function(question, callback) {
          rl.question(question, callback.bind(null, null));
        });
        return question("No avatars found; please enter a name for your avatar: ").then(function(answer){
          var avatar = {type: "avatar", name: answer, points: 0};
          return db.insertAsync(avatar).then(function(ret){
            rl.close();
            console.log('Welcome, ' + answer + '. Start accumulating points by completing your todo\'s and dailies!');
            return Promise.resolve(avatar);
          });
        });
      } else {
        return Promise.resolve(found[0]);
      }                          
    });
  },

  // print the current avatar's basic stats
  print: function print(avatar) {
    console.log(avatar.name + ',' + ' ' + avatar.points + ' points');
  }
}
