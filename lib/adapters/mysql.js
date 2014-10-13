/**
 * status: okay
 */
'use strict';

var _     = require('lodash');
var util  = require('util');
var mysql = require('mysql');
var debug = require('debug')('adapter:mysql');

// promises
var Promise = require('bluebird');
Promise.promisifyAll(mysql);
Promise.promisifyAll(require('mysql/lib/Pool').prototype);

var BaseAdapter = require('./base');

function MysqlAdapter(options) {
  BaseAdapter.call(this);

  this.options = (options || {});
  this.name    = 'mysql';
  this.cluster = this.options.operations;
}

util.inherits(MysqlAdapter, BaseAdapter);
module.exports = MysqlAdapter;

MysqlAdapter.prototype._getClient = function (type) {
  return this.client || this[type + 'Client'];
}

MysqlAdapter.prototype._connect = function () {
  if (!this.cluster && !this.client) {
    this.client = mysql.createPool(this.options);
    return Promise.resolve();
  }

  if (this.cluster && !this.readClient && !this.writeClient) {
    this.readClient  = mysql.createPool(this.cluster.read);
    this.writeClient = mysql.createPool(this.cluster.write);
    return Promise.resolve();
  }
};

MysqlAdapter.prototype._create = function (schema, data, config) {
  var single = _.isPlainObject(data);
  var batch  = _.isArray(data);
  var table  = (this.options.table || config.table || schema.name);
  var client = this._getClient('write');

  // to be refactored
  this.emit('beforeCreate');

  if (single) {
    var query = _private.insert_query(table, schema, data, config.bulk);
    debug(query);
    return client.queryAsync(query);
  }

  if (batch) {
    return Promise.each(data, function (data) {
      var query = _private.insert_query(table, schema, data, config.bulk);
      debug(query);
      return client.queryAsync(query);
    });
  }

  // fallback for edge cases
  Promise.reject(new Error('request not handled'));
};

MysqlAdapter.prototype._count = function (schema, params, config) {
  var table  = (this.options.table || config.table || schema.name);
  var client = this._getClient('read');

  var query = _private.count_query(table, schema, params);
  return client.queryAsync(query).then(function (results) {
    // assuming count always only returns 1 item
    return parseInt(results[0][0].count);
  });
};

/**
 * @private
 * @type {Object}
 */
var _private = {
  insert_query: function (table, schema, data, bulk) {
    var validData = this.validate(schema, data);

    var sql = 'INSERT INTO ?? SET ?';

    if (bulk) {
      var cols = this.build_columns(validData);
      sql = 'INSERT INTO ?? (' + cols.join(', ') + ') VALUES ?';
      validData = _.map(validData, _.values);
    }

    return mysql.format(sql, [table, validData]);
  },
  count_query: function (table, schema, params) {
    var sql = 'SELECT COUNT(*) AS count FROM ??';

    if (params) { sql += ' WHERE ?'; }

    return mysql.format(sql, table, params);
  },
  validate: function (schema, data) {
    // data validation
    var validated = _.reduce(schema, validate, {});

    function validate(result, s, key) {
      var required = (s.required || false);
      var fallback = s.default;
      var morpher  = s.morph;
      var mapping  = (schema.options.mapping || {});
      var column   = mapping[key] || key;
      var value    = data[column];
      var factory  = (schema.options.factory || function () { return null; });

      if (required && !data.hasOwnProperty(column)) {
        throw new Error('required column [ ' + column + ' ] is missing!');
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

      result[key] = value;
      return factory(value) || result;
    }

    return validated;
  },

  build_columns: function (data) {
    return _.chain(data).sample().keys().map(this.escape).value();
  },

  escape: function (c) {
    return util.format('`%s`', c);
  }
}
