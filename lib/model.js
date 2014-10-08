'use strict';

var _       = require('lodash');
var schema  = require('./schema');
var Promise = require('bluebird');

function Model(name, schemas, db, options) {
  if (!_.isArray(schemas)) {
    throw new Error('must be an array of schemas');
  }

  this.name    = name;
  this.schemas = schemas;

  // options?
  this.options = (options || {});

  // unpacker
  if (_.isFunction(this.options.unpack)) {
    this.unpacker = this.options.unpack;
  }

  // private
  this._db = db;
}

module.exports = Model;

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
      return adapter.insert(info.name, data, options[info.adapter]);
    }
  }).each(function (info) {
    var adapter = self._db.events.afterCreate[info.adapter];
    // execute all afterCreate events
    if (adapter) {
      return adapter.insert(info.name, data, options[info.adapter]);
    }
  }).then(function (result) {
    if (callback) callback(null, result);
  }).catch(callback);
}
