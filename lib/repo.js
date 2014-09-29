'use strict';

var _       = require('lodash');
var schema  = require('./schema');
var adapter = require('./adapter');
var Promise = require('bluebird');

function Repo(options) {
  this.options  = options;
  this.adapters = _.keys(options);
}

module.exports = Repo;

Repo.prototype.init = function (options, callback) {
  // optional options
  if (_.isFunction(options)) {
    callback = options;
    options  = {};
  }

  var self = this;
  var adapters = adapter.setup(this.adapters);

  Promise.each(this.adapters, function (key) {
    var Adapter = adapters[key];
    self[key] = new Adapter(self.options[key]);
    return self[key].connect();
  }).then(function (result) {
    callback(null, result);
  });
};

Repo.prototype.schema = function (table, data, options) {
  var valid = (_.isString(table) && _.isPlainObject(data));

  if (!valid) {
    throw new Error('invalid schema definition');
  }

  schema.add(table, data, options);
};

Repo.prototype.insert = function (table, data, options, callback) {
  var self = this;

  // optional options
  if (_.isFunction(options)) {
    callback = options;
    options  = {};
  }

  // should retry if high priority passes and low priority fails
  Promise.map(this.adapters, function (adapter) {
    return self[adapter].insert(table, data, options[adapter]);
  }).then(function (result) {
    callback(null, result);

    // if logging is enabled, log to rabbit
    if (options.log) return self.amqp.insert(table, data);
  }).catch(callback);
}
