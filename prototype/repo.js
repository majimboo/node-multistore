'use strict';

var _       = require('lodash');
var Promise = require('bluebird');

var Schema  = require('./schema');
var Model   = require('./model');
var adapter = require('./adapter');

function Repo(options) {
  this.options = options;

  adapter.load(options);
}

module.exports = Repo;
module.exports.Schema = Schema;

Repo.prototype.init = function (callback) {
  Promise.each(adapter.getNames(), function (name) {
    return adapter.getAdapterByName(name).connect();
  }).then(function (result) {
    callback(null, result);
  }).catch(callback);
}

Repo.prototype.schema = function (schema, options, adapter) {
  return new Schema(schema, options, adapter);
};

/**
 * Registers a new Model.
 *
 * @param  {String} name   - The name for this model.
 * @param  {Schema} schema - The schema object for this model.
 *
 * @return {Model}         - Returns a model.
 */
Repo.prototype.model = function (name, schema) {
  // argument validation
  if (!_.isString(name)) throw new Error('invalid name.');
  if (!(schema instanceof Schema)) throw new Error('invalid schema.');

  return Model.bind(null, name, schema);
};
