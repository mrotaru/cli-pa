var util = require('util');
var _ = require('lodash');
var _path = require('path');

module.exports.spliceFirst = function spliceFirst(array) {
  return array.splice(0,1)[0];
}

/**
 *  Returns a function that parses an item of type `type` from command line
 *  args, and adds `type` and `created`.
 *
 *  If cliFreeArgs is: ['foo', 'bar'], and args._ is ['33',44'], then two
 *  properties will be added to the object: {foo: 33, bar: 44}. So, free args
 *  should be given in orderd. If there are more in `_`, the extra ones are
 *  ignored. If fewer, likewise.
 *
 *  @param {String} type "todo"|"daily"|"reward" ...
 *  @param {Object} schema not used for validating, but to see which props to get
 *  @param {Array} cliFreeArgs
 *  @return {Function}
 */
module.exports.itemFromArgsGen = function itemFromArgsGen(type, schema, cliFreeArgs) {

  itemFromArgs.schema = schema;
  itemFromArgs.cliFreeArgs = cliFreeArgs;

  /*
   * Returns an item of type `type`
   * @param {Object} args as returned by minimist
   */
  function itemFromArgs(args) {

    var debug = require('debug')(type + ':from-args');
    var obj = new Object();
    obj.type = type;
    obj.created = new Date();

    // free args
    for (var i=0; i < cliFreeArgs.length; ++i) {
      if(args._.length) {
        var val = args._.splice(0,1)[0];
        debug('free arg: ' + cliFreeArgs[i] + ' = ' + val.toString());
        obj[cliFreeArgs[i]] = val;
      } else {
        break;
      }
    }
    debug(arguments);
    debug('after parsing free args: ', obj);

    // other params
    for(var prop in schema.properties) {
      if(args.hasOwnProperty(prop)) {
        obj[prop] = args[prop];
      }
    }
    debug('after parsing the rest of args: ', obj);
    return obj;
  }
  return itemFromArgs;
};


/**
 * Returns command in `args` if it's in `legal`, or `false` if not
 *
 * ['foo'], ['bar'] -> false
 * ['bar'], ['bar'] -> 'bar'
 * ['baz'], ['foo', 'baz'] -> 'baz'
 *
 * @param {Array} argv
 * @param {Array} legal
 * @param {String} msg optional message to display when not legal
 * @return {String|false} subcommand, or false
 */
module.exports.getCommand = function getCommand(args, legal, msg) {
  var subcommand = args.splice(0,1)[0];
  var found = _.find(legal, function(_subcommand){
    return subcommand === _subcommand;
  });
  if(!found) {
    if(msg) {
      console.error(msg);
    }
    var err = 'Available commands: ' + legal.toString();
    console.error(
      subcommand
        ? 'Unknown command: ' + subcommand + '\n' + err
        : err
    );
    return false;
  } else {
    return subcommand;
  }
}

// http://stackoverflow.com/a/9081436/447661 
function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

// based on:https://github.com/azer/expand-home-dir/blob/master/index.js
function expandHomeDir (path) {
  if (!path) return path;
  var homedir = getUserHome();
  if (path == '~') return homedir;
  if (path.slice(0, 2) != '~/') return path;
  return _path.join(homedir, path.slice(2));
}

module.exports.getConfig = function getConfig(args) {
  var debug = require('debug')('config');
  var config = require('./config.defaults.cli.js');
  debug('default config: ' + util.inspect(config));
  var userConfig = require(_path.resolve(getUserHome() + '/.habitg.json'));
  debug('user config: ' + util.inspect(userConfig));
  if(userConfig.dbOptions.filename) {
    userConfig.dbOptions.filename = _path.resolve(expandHomeDir(userConfig.dbOptions.filename));
  }
  config = _.assign(config, userConfig );
  config = _.omit(config, ['_']);
  debug('final config: ' + util.inspect(config));
  return config;
}

module.exports.errorHandler = function error(err) {
  console.error(err);
  if(process.env.DEBUG) {
    console.log(err.stack);
  }
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
