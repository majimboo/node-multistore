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

CassandraAdapter.prototype.create = function (name, data, config) {
  var single  = (_.isString(name) && _.isPlainObject(data));
  var batch   = (_.isString(name) && _.isArray(data));
  var options = { prepare: true };
  var schema  = Schema.get('cassandra', name);
  var self    = this;

  // configs
  config = (config || schema.options.cassandra || schema.options);
  var table  = this.options.table || config.table || name;

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

    // TODO
    //   - treat all inserts to the same keyspace in batch
    if (batch && schema.options.condition) {
      return _.each(data, function (data, index, list) {
        var sql = self._build_insert(schema, table, data);
        options.hints = sql.hints;

        var locallback;
        if (list.length === (index + 1)) {
          locallback = callback;
        } else {
          locallback = function () {}
        }

        self.client.execute(sql.query, sql.params, options, locallback);
      });
    }

    if (batch && !schema.options.condition) {
      var queries = [];
      var hints   = [];

      _.each(data, function (data) {
        var sql = self._build_insert(schema, table, data);
        queries.push({ query: sql.query, params: sql.params });
        hints.push(sql.hints);
      });

      options.hints = hints;
      return self.client.batch(queries, options, callback);
    }
  });
};

CassandraAdapter.prototype.select = function (name, params) {
  var self    = this;
  var options = { prepare: true };
  var schema  = Schema.get('cassandra', name);

  // configs
  var config = (schema.options.cassandra || schema.options);
  var table  = this.options.table || config.table || name;
  var sql    = this._build_select(schema, table, params);

  // HUDE PLEASE REFACTOR SIGN
  // OMG PLEASE REFACTOR MEEEE!!!!!!
  if (!_.isEmpty(sql.__array)) {
    return Promise.map(sql.__array, function (param) {
      params[param.key] = param.value;
      var sql = self._build_select(schema, table, params);
      return new Promise(function (resolve, reject) {
        function callback(err, results) {
          if (err) reject(err);
          if (results) {
            var rows = results.rows;

            return Promise.map(rows, function (row) {
              delete row.__columns;
              return row;
            }).then(resolve);
          }
        }

        self.client.execute(sql.query, options, callback);
      });
    });
  } else {
    return new Promise(function (resolve, reject) {
      function callback(err, result) {
        if (err) reject(err);
        if (result) resolve(result);
      }

      self.client.execute(sql.query, options, callback);
    });
  }
};

// model stuff. refactor design.
CassandraAdapter.prototype.find = function (name, params, callback) {
  if (_.isFunction(params)) {
    callback = params;
    params   = {};
  }

  this.select(name, params).then(function (results) {
    if (_.isArray(results)) {
      results = _.flatten(results);
    }
    callback(null, results);
  }).catch(callback);
};

CassandraAdapter.prototype.delete = function () {

};

CassandraAdapter.prototype._build_insert = function (schema, table, data) {
  // remove extra identifiers from data
  var validData = this._validate(schema, data);

  var condition = schema.options.condition || '';

  var q = 'INSERT INTO %s (%s) VALUES (%s) %s';
  var c = _.keys(validData);
  var n = _.map(c, function () { return '?' }).join(', ');
  var query  = util.format(q, table, c.join(', '), n, condition);
  var params = _.map(validData, 'value');
  var hints  = _.map(validData, 'hint');

  var inserts = {
    query: query,
    params: params,
    hints: hints
  };

  return inserts;
};

CassandraAdapter.prototype._build_select = function (schema, table, params) {
  var q = 'SELECT %s FROM %s';
  var c = _.keys(schema).join(', ');
  var selects = {};
  var __array = [];

  // if there are params
  _.each(params, function (value, key) {
    if (_.isArray(value)) {
      _.each(value, function (value) {
        __array.push({ key: key, value: value });
      });
    }

    if (_.isString(value)) {
      var noWhere = (q.toUpperCase().indexOf('WHERE') === -1);
      if (noWhere) {
        q += ' WHERE ';
      } else {
        q += ' AND ';
      }
      q += key + ' = \'' + value + '\'';
    }
  });

  var query = util.format(q, c, table);

  selects.query = query;
  selects.__array = __array;

  return selects;
};

CassandraAdapter.prototype._validate = function (schema, data) {
  // data validation
  var validated = _.reduce(schema, validate, {});

  function validate(result, s, key) {
    var type     = (s.type || s);
    var required = (s.required || false);
    var fallback = s.default;
    var morpher  = s.morph;
    var allowed  = s.enum;
    var value    = data[key];

    // check requirements early
    if (required && !data.hasOwnProperty(key)) {
      throw new Error('required column [ ' + key + ' ] is missing!');
    }

    if (allowed && (allowed.indexOf(value) < 0)) {
      throw new Error('value for [ ' + key + ' ] is invalid');
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

    // if there is a value and morpher is a function
    if (value && _.isFunction(morpher)) {
      value = morpher(value);
    }

    // add hints
    result[key] = { value: value, hint: type };

    return result;
  }

  return validated;
};
