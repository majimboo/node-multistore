'use strict';

var _      = require('lodash');
var util   = require('util');
var events = require('events');
var Schema = require('../schema');

function BaseAdapter() {
  events.EventEmitter.call(this);

  this.client = null;
}

util.inherits(BaseAdapter, events.EventEmitter);
module.exports = BaseAdapter;

BaseAdapter.prototype.schema = function (name, schema, options) {
  if (!_.isPlainObject(schema)) {
    throw new Error('invalid schema definition');
  }

  return Schema.add(this.name, name, schema, options);
};

/**
 * Implement as `_connect` on adapter.
 */
BaseAdapter.prototype.connect = function (callback) {
  this._connect().then(function () {
    if (callback) return callback();
  }).catch(callback);
}

/**
 * Implement as `_create` on adapter.
 */
BaseAdapter.prototype.create = function (schema, data, config, callback) {
  // race conditions?
  this.emit('creating');

  // required params
  if (!schema || !data) {
    return callback(new Error('required parameter is missing'));
  }

  // optional config
  if (_.isFunction(config)) {
    callback = config;
    config   = null;
  }

  // load the actual schema
  if (_.isString(schema)) {
    schema = Schema.get(this.name, schema);
  }

  // get the final configs
  config = (config || schema.options[this.name] || schema.options);

  this._create(schema, data, config).then(function () {
    if (callback) return callback();
  }).catch(callback);
}

/**
 * Implement as `_find` on adapter.
 */
BaseAdapter.prototype.find = function (schema, params, callback) {
  // optional params
  if (_.isFunction(params)) {
    callback = params;
    params   = {};
  }

  // load the actual schema
  if (_.isString(schema)) {
    schema = Schema.get(this.name, schema);
  }

  var config = (schema.options.cassandra || schema.options);

  // re-investigate clone
  this._find(schema, params, config)
    .then(_.flatten)
    .map(_.clone)
    .then(function (results) {
      callback(null, results);
    }).catch(callback);
};

BaseAdapter.prototype.count = function (schema, params, config, callback) {
  // optional params
  if (_.isFunction(params)) {
    callback = params;
    params   = null;
    config   = null;
  }

  // optional config
  if (_.isFunction(config)) {
    callback = config;
    config   = null;
  }

  // load the actual schema
  if (_.isString(schema)) {
    schema = Schema.get(this.name, schema);
  }

  // get the final configs
  config = (config || schema.options[this.name] || schema.options);
  this._count(schema, params, config).then(function (results) {
    callback(null, results);
  }).catch(callback);
};

BaseAdapter.prototype.update = function () {
  throw new Error('Not Implemented');
};

BaseAdapter.prototype.delete = function () {
  throw new Error('Not Implemented');
};
