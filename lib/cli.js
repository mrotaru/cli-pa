var _ = require('lodash');
var utils = require('./utils.js');
var util = require('util');

// options - db, defaultValue, etc
var defaults = require('./config.defaults.cli.js');
var argv = require('minimist')(process.argv.slice(2), {default: defaults});

// core
var HabitG = require('./habitg.js');
var core = new HabitG(_.omit(argv,['_']));

function run() {
  core.init().then(function(){
    // which subcommand
    var subcommand = utils.getCommand(argv._, ['todo', 'daily', 'avatar'],
    "");
    if(!subcommand) {
      process.exit(1);
    }

    // load and execute subcommand
    return require('./' + subcommand + '-cli')._process(core, argv);
  }).catch(utils.errorHandler);
}

module.exports = run;

if(!module.parent) {
  run();
}
