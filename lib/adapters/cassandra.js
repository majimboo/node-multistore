/**
 * status: okay
 */
'use strict';

var _         = require('lodash');
var util      = require('util');
var cassandra = require('cassandra-driver');
var debug     = require('debug')('adapter:cassandra');

// promises
var Promise = require('bluebird');
Promise.promisifyAll(cassandra);

var BaseAdapter = require('./base');

function CassandraAdapter(options) {
  BaseAdapter.call(this);

  this.options = (options || {});
  this.name    = 'cassandra';
}

util.inherits(CassandraAdapter, BaseAdapter);
module.exports = CassandraAdapter;

CassandraAdapter.prototype._connect = function () {
  if (!this.client) {
    this.client = new cassandra.Client(this.options);
    return this.client.connectAsync();
  }
};

CassandraAdapter.prototype._create = function (schema, data, config) {
  var single  = _.isPlainObject(data);
  var batch   = _.isArray(data);
  var options = { prepare: true };
  var table   = (this.options.table || config.table || schema.name);

  if (single) {
    var sql = _private.build_insert(schema, table, data);
    debug(sql);
    options.hints = sql.hints;
    return this.client.executeAsync(sql.query, sql.params, options);
  }

  if (batch && schema.options.condition) {
    return new Promise.each(data, function (data) {
      var sql2 = _private.build_insert(schema, table, data);
      debug(sql2);
      options.hints = sql2.hints;
      return this.client.executeAsync(sql2.query, sql2.params, options);
    }.bind(this));
  }

  if (batch && !schema.options.condition) {
    var queries = [];
    var hints   = [];

    _.each(data, function (data) {
      var sql = _private.build_insert(schema, table, data);
      debug(sql);
      queries.push({ query: sql.query, params: sql.params });
      hints.push(sql.hints);
    }, this);

    options.hints = hints;
    return this.client.batchAsync(queries, options);
  }

  // fallback for edge cases
  Promise.reject(new Error('request not handled'));
};

CassandraAdapter.prototype._find = function (schema, params, config) {
  var self    = this;
  var options = { prepare: true };
  var table   = (this.options.table || config.table || schema.name);
  var sql     = _private.build_select(schema, table, params);

  if (sql._array.length) {
    return Promise.map(sql._array, function (param) {
      params[param.key] = param.value;
      var sql = _private.build_select(schema, table, params);
      return execute(sql, options);
    });
  }

  return execute(sql, options);

  function execute(sql, options) {
    return self.client.executeAsync(sql.query, options).then(function (data) {
      return data.rows;
    }).map(function (row) {
      delete row.__columns;
      return row;
    });
  }
};

/**
 * @private
 * @type {Object}
 */
var _private = {
  build_insert: function (schema, table, data) {
    // remove extra identifiers from data
    var validData = this.validate(schema, data);

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
  },

  build_select: function (schema, table, params) {
    var q = 'SELECT %s FROM %s';
    var c = _.keys(schema).join(', ');
    var selects = {};
    var _array  = [];

    _.each(params, build_params);

    var query = util.format(q, c, table);

    selects.query  = query;
    selects._array = _array;

    return selects;

    function build_params(value, key) {
      if (_.isArray(value)) {
        _.each(value, function (value) {
          _array.push({ key: key, value: value });
        });
      }

      if (_.isString(value)) {
        var noWhere = (q.toUpperCase().indexOf('WHERE') === -1);
        if (noWhere) {
          q += ' WHERE ';
        } else {
          q += ' AND ';
        }
        if (schema[key].type === 'timeuuid') {
          q += key + ' = ' + value + '';
        } else {
          q += key + ' = \'' + value + '\'';
        }
      }
    }
  },

  validate: function (schema, data) {
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
  }
};
