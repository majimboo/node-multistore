'use strict';

var _       = require('lodash');
var Promise = require('bluebird');

var adapter = require('./adapter');

function Model(name, schema, data) {
  var self = this;

  // un-enumerable properties
  Object.defineProperty(this, 'name', { value: name });
  Object.defineProperty(this, 'schema', { value: schema });

  // copy data as properties
  _.each(data, function (value, key) {
    self[key] = value;
  });
}

module.exports = Model;

/**
 * Persist model
 */
Model.prototype.save = function (callback) {
  if (!_.isFunction(callback)) callback = function () {};

  var self = this;

  // insert if validation is succesful
  Promise.each(adapter.getNames(), function (name) {
    return adapter.getAdapterByName(name).insert(self.name, self);
  }).then(function (result) {
    callback(null, result);
  }).catch(callback);
};
