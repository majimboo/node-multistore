'use strict';

var _       = require('lodash');
var schema  = require('./schema');
var adapter = require('./adapter');
var Model   = require('./model');
var Promise = require('bluebird');

function Repo() {
  // valid events
  this.events = {
    create: {},
    afterCreate: {}
  }
}

module.exports = new Repo();

Repo.prototype.init = function (options, callback) {
  var self = this;

  this.options  = options;
  this.adapters = _.keys(options);

  var loadedAdapter = adapter.setup(this.options);

  // initialize the adapters
  Promise.each(this.adapters, function (name) {
    var adapter = loadedAdapter[name];

    // TODO
    //  - refactor this (api & implemenation)
    var onEvent = adapter.options.on;
    var afterEvent = adapter.options.after;

    // expose adapter for
    // special mentions
    self[name] = adapter;

    if (onEvent) {
      self.events[onEvent][name] = adapter;
    }

    if (afterEvent) {
      var event = afterEvent.charAt(0).toUpperCase() + afterEvent.slice(1);
      self.events['after' + event][name] = adapter;
    }

    if (onEvent || afterEvent) return adapter.connect();
  }).then(function (result) {
    callback(null, result)
  }).catch(callback);
};

Repo.prototype.schema = function (table, data, options) {
  var valid = (_.isString(table) && _.isPlainObject(data));

  if (!valid) {
    throw new Error('invalid schema definition');
  }

  return schema.add('all', table, data, options);
};

Repo.prototype.model = function (name, schemas, options) {
  return new Model(name, schemas, this, options);
};
