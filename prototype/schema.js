'use strict';

var _ = require('lodash');

function Schema(schema, options, adapter) {
  // argument validation
  if (!_.isPlainObject(schema)) throw new Error('invalid schema.');
  if (!_.isPlainObject(options)) options = {};
  if (!_.isPlainObject(adapter)) adapter = {};

  this.schema = schema;
  this.options = options;
  this.adapter = adapter;
}

module.exports = Schema;
