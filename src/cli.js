var _ = require('lodash');
var utils = require('./utils.js');
var util = require('util');

// command line options - can override defaults and user config
var args = require('minimist')(process.argv.slice(2));
var config = utils.getConfig(args);

// core
var HabitG = require('./habitg.js');
var core = new HabitG(config);

function run() {
  core.init().then(function(){
    // which subcommand
    var todo = require('./plugins/todo.js');
    var ducks = require('./plugins/ducks.js');
    var subcommand = utils.getCommand(args, {todo: todo, ducks: ducks});
    if(!subcommand) {
      process.exit(1);
    }

    // load and execute subcommand
    return subcommand.action(core, args);
  }).catch(utils.errorHandler);
}

module.exports = run;

if(!module.parent) {
  run();
}
