var Promise = require('bluebird');
var _ = require('lodash');
var inspector = require('schema-inspector');
var debug = require('debug')('validator');

module.exports.validate = validate;

var schemas = {
  todo: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      value: { type: 'number' },
      done:  { type: 'boolean' }
    }
  },
  daily: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      value: { type: 'number' }
    }
  }
};

module.exports.schemas = schemas;

//  check if `obj` is valid `type`
function validate(type, obj) {
  debug('validating ' + type + ':', obj);
  var result = inspector.validate(schemas[type], obj);
  if (!result.valid) {
    debug('not valid:',result);
    throw new Error(result.format());
  } else {
    debug('valid:',result);
    return Promise.resolve(obj);
  }
}
