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

CassandraAdapter.prototype._build_insert = function (schema, table, data, hint) {
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
    params: params
  };

  if (hint) {
    inserts.hints = hints;
  }

  return inserts;
};

CassandraAdapter.prototype._validate = function (schema, data) {
  // data validation
  var validated = _.reduce(schema, validate, {});

  function validate(result, value, key) {
    var type     = value.type;
    var required = value.required;

    if (required && !data.hasOwnProperty(key)) {
      throw new Error('required column [ ' + key + ' ] is missing!');
    }

    // add hints
    result[key] = { value: data[key], hint: type };

    return result;
  }

  return validated;
};
