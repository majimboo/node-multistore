'use strict';

var _     = require('lodash');
var utils = require('./utils');
var Model = require('./model');
var adapters = require('./adapter');

function Store(options) {
  this.adapters = _.keys(options);
  this.options  = options;
  this.loadedAdapters = {};

  this.schemas  = {};
  this.models   = {};
}

module.exports = Store;

Store.prototype.init = function (events) {
  var self = this;

  this.registeredEvents = events;
  _.each(adapters.setup(this.adapters), function (Adapter, name) {
    var option = self.options[name];
    self.loadedAdapters[name] = new Adapter(option);
  });
};

Store.prototype.schema = function (adapter, name, paths, options) {
  var schema = this.schemas[adapter + ':' + name] = {};
  schema[name] = {};
  schema[name].paths = paths;
  schema[name].options = options;
};

Store.prototype.model = function (name, options) {
  options = utils.buildOptions(options, this.schemas);

  var model = this.models[name] = new Model(options, this.loadedAdapters);

  return model;
};
