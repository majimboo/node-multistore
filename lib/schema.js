'use strict';

var schemas = {};

function add(adapter, name, schemap, options) {
  if (!schemas[adapter]) {
    schemas[adapter] = {};
  }

  var schema = schemas[adapter][name] = schemap;

  Object.defineProperty(schema, 'options', { value: (options || {}) });
  Object.defineProperty(schema, 'name',  { value: name });

  return schemas[name];
}

function get(adapter, name) {
  if (schemas[adapter]) {
    return schemas[adapter][name];
  }

  return schemas.all[name];
}

module.exports = {
  add: add,
  get: get
}
