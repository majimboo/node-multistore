'use strict';

var _         = require('lodash');
var util      = require('util');
var Schema    = require('../schema');
var cassandra = require('cassandra-driver');
var Promise   = require('bluebird');

var BaseAdapter = require('./base');

function CassandraAdapter(options) {
  BaseAdapter.call(this);

  this.options = (options || {});
}

util.inherits(CassandraAdapter, BaseAdapter);
module.exports = CassandraAdapter;

CassandraAdapter.prototype.connect = function () {
  var self = this;

  if (!this.client) {
    this.client = new cassandra.Client(this.options);

    return new Promise(function (resolve, reject) {
      self.client.connect(function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }
};

CassandraAdapter.prototype.schema = function (name, schema, options) {
  return Schema.add('cassandra', name, schema, options);
};

CassandraAdapter.prototype.insert = function (name, data, config) {
  var single  = (_.isString(name) && _.isPlainObject(data));
  var batch   = (_.isString(name) && _.isArray(data));
  var options = { prepare: true };
  var schema  = Schema.get('cassandra', name);

  // configs
  config = (config || schema.options.cassandra || schema.options);
  var table  = this.options.table || config.table || name;

  var self = this;

  return new Promise(function (resolve, reject) {
    function callback(err, result) {
      if (err) reject(err);
      if (result) resolve();
    }

    if (single) {
      var sql = self._build_insert(schema, table, data);
      options.hints = sql.hints;
      self.client.execute(sql.query, sql.params, options, callback);
    }

    // problem with batch queries and hinting
    // issue: https://datastax-oss.atlassian.net/browse/NODEJS-11
    // When this gets fixed treat all inserts to the same keyspace in batch
    if (batch) {
      var queries = [];
      var hints   = [];

      _.each(data, function (data) {
        var sql = self._build_insert(schema, table, data);
        queries.push({ query: sql.query, params: sql.params });
        if (sql.hints) hints.push(sql.hints);
      }, this);

      options.hints = hints;
      return self.client.batch(queries, options, callback);
    }
  });
};

CassandraAdapter.prototype.select = function (table, options, eachRow) {
  // use single execute
  if (!eachRow) {
  }

  // use eachRow
  if (eachRow) {
  }
};

CassandraAdapter.prototype.delete = function () {

};

CassandraAdapter.prototype._build_insert = function (schema, table, data) {
  // remove extra identifiers from data
  var validData = this._validate(schema, data);

  var q = 'INSERT INTO %s (%s) VALUES (%s)';
  var c = _.keys(validData);
  var n = _.map(c, function () { return '?' }).join(', ');
  var query  = util.format(q, table, c.join(', '), n);
  var params = _.map(validData, 'value');
  var hints  = _.map(validData, 'hint');

  var inserts = {
    query: query,
    params: params,
    hints: hints
  };

  return inserts;
};

CassandraAdapter.prototype._validate = function (schema, data) {
  // data validation
  var validated = _.reduce(schema, validate, {});

  function validate(result, s, key) {
    var type     = (s.type || s);
    var required = (s.required || false);
    var fallback = s.default;
    var wrapper  = s.wrap;
    var morpher  = s.morph;

    // check requirements early
    if (required && !data.hasOwnProperty(key)) {
      throw new Error('required column [ ' + key + ' ] is missing!');
    }

    var value = data[key];

    // if there is a value and value should be wrapped
    if (value && wrapper) {
      value = wrapper(value);
    }

    // if no value and fallback is string
    if (_.isUndefined(value) && _.isString(fallback)) {
      value = fallback;
    }

    // if no value and fallback is function
    if (_.isUndefined(value) && _.isFunction(fallback)) {
      value = fallback();
    }

    // if there is a value and value should be morphed
    if (value && _.isString(morpher)) {
      value = value[morpher]();
    }

    // if there is a value and morpher is a function - NOT NEEDED
    if (value && _.isFunction(morpher)) {
      value = morpher(value);
    }

    // add hints
    result[key] = { value: value, hint: type };

    return result;
  }

  return validated;
};
