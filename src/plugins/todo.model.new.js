var Model = require('../Model.js');

module.exports = Todo;

Todo.schema = {
  type: 'object',
  properties: {
    type:  { type: 'string', eq: 'todo' },
    title: { type: 'string' },
    value: { type: 'number' },
    recurring: { type: 'string' },
    created: { type: 'date' }
  }
};

/**
 *
 */
function Todo(obj) {
  this.done = false;
  return this;
}

Todo.prototype = Object.create(Model.prototype);
