'use strict';

var schemas = {};

function add(family, schema, options) {
  schemas[family] = schema;
  Object.defineProperty(schemas[family], 'options', { value: (options || {}) });
  Object.defineProperty(schemas[family], 'family', { value: family });

  return schemas[family];
}

function get(family) {
  return schemas[family];
}

module.exports = {
  add: add,
  get: get
}
