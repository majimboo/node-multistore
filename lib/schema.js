'use strict';

var schemas = {};

function add(adapter, name, schemap, options) {
  // require params

  if (!schemas[adapter]) {
    schemas[adapter] = {};
  }

  var schema = schemas[adapter][name] = schemap;

  Object.defineProperty(schema, 'options', { value: (options || {}) });
  Object.defineProperty(schema, 'name',    { value: name });
  Object.defineProperty(schema, 'adapter', { value: adapter });

  return schema;
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
