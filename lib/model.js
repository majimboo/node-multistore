'use strict';

var _ = require('lodash');

function Model(schema, repo) {
  this.schema = schema;
  this.repo   = repo;
}

module.exports = Model;

Model.prototype.create = function (data, options, callback) {
  this.repo.insert(this.schema.family, data, options, callback);
}
