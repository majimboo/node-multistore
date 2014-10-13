'use strict';

var _       = require('lodash');
var Promise = require('bluebird');
var purr   = require('purr');

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

  // parser
  if (_.isFunction(this.options.parser)) {
    this.parser = this.options.parser;
  }

  // serializer
  if (_.isFunction(this.options.serializer)) {
    this.serializer = this.options.serializer;
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

  if (this.parser && Buffer.isBuffer(params)) {
    params = this.parser(params);
  }

  adapter.find(schema.name, params, function (err, results) {
    if (err) return callback(err);

    if (this.serializer) {
      results = results.map(this.serializer);
    }

    callback(null, results);
  }.bind(this));
}

Model.prototype.create = function (data, options, callback) {
  var self  = this;
  var multi = _.isArray(data);

  if (_.isFunction(options)) {
    callback = options;
    options  = {};
  }

  if (this.parser && !multi) {
    data = this.parser(data);
  }

  if (this.parser && multi) {
    data = data.map(this.parser);
  }

  // TODO:
  //  - Only have a one time validation of data
  //    instead of having it on each adapter.

  // find a way to:
  //  - retry if it fails
  //  - fail all if one fails
  Promise.each(this.schemas, function (schema) {
    var adapter = self._db.events.create[schema.adapter];
    var option  = (schema.options[schema.name] || schema.options);
    // execute all create events
    if (adapter) {
      return adapter._create(schema, data, (options[schema.adapter] || option));
    }
  }).each(function (schema) {
    var adapter = self._db.events.afterCreate[schema.adapter];
    var option  = (schema.options[schema.name] || schema.options);
    // execute all afterCreate events
    if (adapter) {
      return adapter._create(schema, data, (options[schema.adapter] || option));
    }
  }).then(function (result) {
    if (callback) callback(null, result);
  }).catch(callback);
}
