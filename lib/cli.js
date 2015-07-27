var _ = require('lodash');
var utils = require('./utils.js');

// options - db, defaultValue, etc
var defaults = require('./config.defaults.cli.js');
var argv = require('minimist')(process.argv.slice(2), {default: defaults});

// core
var HabitG = require('./habitg.js');
var core = new HabitG(_.omit(argv,['_']));

core.init().then(function(){
  // which subcommand
  var subcommand = argv._.splice(0,1)[0];
  var subcommands = ['todo', 'daily', 'avatar'];
  var found = _.find(subcommands, function(_subcommand){
    return subcommand === _subcommand;
  });
  if(!found) {
    console.error('Unknown command: ' + subcommand);
    process.exit(1);
  }

  // execute subcommand
  var sc = require('./' + subcommand + '-cli');
  return sc.process(core, argv);
}).catch(utils.errorHandler);

