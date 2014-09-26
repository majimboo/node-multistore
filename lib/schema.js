'use strict';

var schemas = {};

function add(family, schema) {
  schemas[family] = schema;
}

function get(family) {
  return schemas[family];
}

module.exports = {
  add: add,
  get: get
}
