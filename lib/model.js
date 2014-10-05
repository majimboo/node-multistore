'use strict';

var _ = require('lodash');

function Model(name, schemas, db) {
  this.name    = name;
  this.schemas = schemas;
  this.db      = db;
}

module.exports = Model;

Model.prototype.create = function (data, options, callback) {
  options();
  // this.repo.insert(this.schema.family, data, options, callback);
}
