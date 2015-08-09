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
    var subcommand = utils.getCommand(args, ['todo', 'ducks']);
    if(!subcommand) {
      process.exit(1);
    }

    // load and execute subcommand
    return require('./' + subcommand + '-cli')._process(core, args);
  }).catch(utils.errorHandler);
}

module.exports = run;

if(!module.parent) {
  run();
}
