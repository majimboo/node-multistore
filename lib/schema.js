'use strict';

var schemas = {};

function add(family, schema, options) {
  schemas[family] = schema;
  Object.defineProperty(schemas[family], 'options', { value: (options || {}) });
}

function get(family) {
  return schemas[family];
}

module.exports = {
  add: add,
  get: get
}
