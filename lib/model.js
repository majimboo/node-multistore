'use strict';

var _ = require('lodash');
var schema = require('./schema');

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
    options  = null;
  }

  // for testing only
  _.each(this.schemas, function (info) {
    self.db[info.adapter].insert(info.name, data, options).finally(callback);
  });
}
