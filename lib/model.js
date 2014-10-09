'use strict';

var _       = require('lodash');
var Promise = require('bluebird');

function Model(name, schemas, db, options) {
  if (!_.isArray(schemas)) {
    throw new Error('must be an array of schemas');
  }

  var self     = this;
  this.name    = name;
  this.schemas = schemas;

  // options?
  this.options = (options || {});
  this.methods = (this.options.methods || {});

  // unpacker
  if (_.isFunction(this.options.unpack)) {
    this.unpacker = this.options.unpack;
  }

  // private
  this._db = db;

  // searching methods
  _.each(this.methods.search, function (schema, fn) {
    // load method
    self[fn] = self.search.bind(self, schema);
  });
}

module.exports = Model;

Model.prototype.search = function (schema, params, callback) {
  var adapter = this._db[schema.adapter];

  if (this.unpacker && Buffer.isBuffer(params)) {
    params = this.unpacker(params);
  }

  adapter.find(schema.name, params, callback);
}

Model.prototype.create = function (data, options, callback) {
  var self  = this;
  var multi = _.isArray(data);

  if (_.isFunction(options)) {
    callback = options;
    options  = {};
  }

  if (this.unpacker && !multi) {
    data = this.unpacker(data);
  }

  if (this.unpacker && multi) {
    data = data.map(this.unpacker);
  }

  // TODO:
  //  - Only have a one time validation of data
  //    instead of having it on each adapter.

  // find a way to:
  //  - retry if it fails
  //  - fail all if one fails
  Promise.each(this.schemas, function (info) {
    var adapter = self._db.events.create[info.adapter];
    // execute all create events
    if (adapter) {
      return adapter.create(info.name, data, options[info.adapter]);
    }
  }).each(function (info) {
    var adapter = self._db.events.afterCreate[info.adapter];
    // execute all afterCreate events
    if (adapter) {
      return adapter.create(info.name, data, options[info.adapter]);
    }
  }).then(function (result) {
    if (callback) callback(null, result);
  }).catch(callback);
}
