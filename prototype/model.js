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

  // validate data
  this.validate(function (err) {
    if (err) return callback(err);

    // insert if validation is succesful
    Promise.each(adapter.getNames(), function (name) {
      return adapter.getAdapterByName(name).insert(self);
    }).then(function (result) {
      callback(null, result);
    }).catch(function (err) {
      callback(null, err);
    });
  });

};

/**
 * Validate model data
 */
Model.prototype.validate = function (callback) {
  var self = this;

  // data validation
  var validated = _.reduce(this.schema, validate, {});

  function validate(result, value, key) {
    var required = value.required;
    var defaults = value.defaults;

    if (_.isFunction(defaults)) {
      // if default is function execute it on the value
    }

    if (required && !self.hasOwnProperty(key)) {
      return callback('required column [ ' + key + ' ] is missing!');
    }
  }

  callback(null, validated);
};
