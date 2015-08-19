var util = require('util');
var _ = require('lodash');
var _path = require('path');

module.exports.spliceFirst = function spliceFirst(array) {
  return array.splice(0,1)[0];
}

module.exports.extractTags = function extractTags(str) {
  var tagRegex = /\s(?:#([\S]+)\s)/g;
  var res = tagRegex.exec(str);
  console.log(res);
  return res.slice(1);
}

/**
 * @returns {Array|false}
 */
module.exports.arrayFromCommaSeparatedNumbers = function arrayFromCommaSeparatedNumbers(str) {
  if(typeof str !== 'string') {
    return false;
  }
  var result = [];
  var parts = str.split(',');
  if(parts.length) {
    for (var i=0; i < parts.length; ++i) {
      var p = parts[i];
      if(p.match(/\d+/)) {
        result.push(parseInt(p));
      } else {
        return false;
      }
    }
    return result;
  }
  return false;
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

function findCommand(searchedName, commands) {
  for (var command in commands) {
    var c = commands[command];
    if(command === searchedName) {
      return c;
    }
    if(c.aliases && c.aliases.length) {
      for (var j=0; j < c.aliases.length; ++j) {
        if(c.aliases[j] === searchedName) {
          return c;
        }
      }
    }
  }
  return false;
}


/**
 * Returns command in `args` if it's in `commands`, or `false` if not
 *
 * @param {Array} argv
 * @param {Object} commands each prop is an object with `name`, `action`, etc
 * @param {String}        options.messageBefore 
 * @param {String}        options.messageAfter 
 * @param {Boolean=false} options.silent prints nothing
 * @param {Boolean=false} options.noSplice will not remove anything from `args._`
 * @param {Boolean=false} options.noSpliceWhenUnrecognized
 * @param {Boolean=false} options.showLegal when cmd is illegal, show legal cmds
 * @param {String}        options.defaultNoArgs
 * @param {String}        options.defaultWithArgs
 *
 * @return {Function|false} legal subcommand, or false
 */
module.exports.getCommand = function getCommand(args, commands, options) {
  var debug = require('debug')('getCommand');
  debug(args);
  var opts = {
    messageBefore: null,
    messageAfter: null,
    silent: false,
    noSplice: false,
    noSpliceWhenUnrecognized: false,
    showLegal: true,
    defaultNoArgs: null,
    defaultWithArgs: null
  };
  _.assign(opts, options);

  if(!args._.length) {
    if(opts.defaultNoArgs) {
      if(commands.hasOwnProperty(opts.defaultNoArgs)) {
        return commands[opts.defaultNoArgs];
      } else {
        return false;
      }
    }
  }

  var subcommand = opts.noSplice ? args._[0] : args._.splice(0,1)[0];
  var found = findCommand(subcommand, commands);
  if(!found) {
    if(opts.noSpliceWhenUnrecognized) {
      args._.push(subcommand);
    }
    if(opts.defaultWithArgs && commands.hasOwnProperty(opts.defaultWithArgs)) {
      return commands[opts.defaultWithArgs];
    }
  }

  if(!found) {
    if(!opts.silent) {
      if(opts.messageBefore) {
        console.error(opts.messageBefore);
      }
      if(subcommand) {
        console.error('Unknown command: ' + subcommand);
      }
      if(opts.showLegal) {
        console.error('Available comands: ' + _.keys(commands).join(', '));
      }
      if(opts.messageAfter) {
        console.error(opts.messageAfter);
      }
    }
    return false;
  } else {
    return found;
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
