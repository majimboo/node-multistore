'use strict';

var _       = require('lodash');
var schema  = require('./schema');
var Promise = require('bluebird');

function Model(name, schemas, db) {
  this.name    = name;
  this.schemas = schemas;
  this.db      = db;
}

module.exports = Model;

Model.prototype.create = function (data, options, callback) {
  var self = this;

  if (_.isFunction(options)) {
    callback = options;
    options  = {};
  }

  // TODO:
  //  - Only have a one time validation of data
  //    instead of having it on each adapter.

  // find a way to:
  //  - retry if it fails
  //  - fail all if one fails
  Promise.each(this.schemas, function (info) {
    var adapter = self.db.events.create[info.adapter];
    // execute all create events
    if (adapter) return adapter.insert(info.name, data, options[info.adapter]);
  }).each(function (info) {
    var adapter = self.db.events.afterCreate[info.adapter];
    // execute all afterCreate events
    if (adapter) return adapter.insert(info.name, data, options[info.adapter]);
  }).then(function (result) {
    if (callback) callback(null, result);
  }).catch(callback);
}
