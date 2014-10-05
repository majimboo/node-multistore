'use strict';

var _       = require('lodash');
var schema  = require('./schema');
var adapter = require('./adapter');
var Model   = require('./model');
var Promise = require('bluebird');

function Repo(options) {
  this.options  = options;
  this.adapters = _.keys(options);

  // valid events
  this.events = {
    create: {},
    afterCreate: {}
  }
}

module.exports = Repo;

Repo.prototype.init = function (callback) {
  var self = this;
  var loadedAdapter = adapter.setup(this.options);

  // initialize the adapters
  Promise.each(this.adapters, function (name) {
    var adapter = loadedAdapter[name];
    var event   = adapter.options.on || adapter.options.after;

    // expose adapter for
    // special mentions
    self[name] = adapter;

    if (event) {
      self.events[event][name] = adapter;
      return adapter.connect();
    }
  }).then(function (result) {
    callback(null, result)
  }).catch(callback);
};

Repo.prototype.schema = function (table, data, options) {
  var valid = (_.isString(table) && _.isPlainObject(data));

  if (!valid) {
    throw new Error('invalid schema definition');
  }

  return new Model(schema.add('all', table, data, options), this);
};

Repo.prototype.insert = function (table, data, options, callback) {
  var self = this;

  // optional options
  if (_.isFunction(options)) {
    callback = options;
    options  = {};
  }

  Promise.each(this.adapters, function (name) {
    var adapter = self.events.create[name];
    // execute all create events
    if (adapter) return adapter.insert(table, data, options[name]);
  }).each(function (name) {
    var adapter = self.events.afterCreate[name];
    // execute all afterCreate events
    if (adapter) return adapter.insert(table, data, options[name]);
  }).then(function (result) {
    if (callback) callback(null, result);
  }).catch(callback);
}
