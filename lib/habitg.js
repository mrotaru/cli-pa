var debug = require('debug')('core');

module.exports = HabitG;

var Database = require('./db.js');

/**
 * Used by both the express app and cli app
 *
 * @param {Object} config
 * @param {String} config.dbType nedb | mongodb
 * @param {Object} config.dbOptions object passed to nedb/mongoose constructors
 * @param {Number} config.defaultValue point value for new todos/etc
 * @param {Number} config.todo.defaultValue overrides above for todos
 */
function HabitG(config) {

  debug('config', config);

  this.config = config;
  this.inited = false;

  this.todos = [];
  this.dailies = [];
}

HabitG.prototype.init = function init() {
  this.db = new Database(this.config.dbType, this.config.dbOptions);
  return this.db.init().then(function(){
    this.inited = true;
  });
}
