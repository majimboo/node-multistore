/**
 * status: experimental
 */
'use strict';

var _       = require('lodash');
var util    = require('util');
var Schema  = require('../schema');
var mysql   = require('mysql');

// promises
var Promise = require('bluebird');
Promise.promisifyAll(mysql);
Promise.promisifyAll(require('mysql/lib/Pool').prototype);

var BaseAdapter = require('./base');

function MysqlAdapter(options) {
  BaseAdapter.call(this);

  this.options = (options || {});
  this.cluster = this.options.operations;
}

util.inherits(MysqlAdapter, BaseAdapter);
module.exports = MysqlAdapter;

MysqlAdapter.prototype._getClient = function (type) {
  return this.client || this[type + 'Client'];
}

MysqlAdapter.prototype.connect = function () {
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

MysqlAdapter.prototype.schema = function (name, schema, options) {
  return Schema.add('mysql', name, schema, options);
};

MysqlAdapter.prototype.create = function (name, data, config) {
  var single  = (_.isString(name) && _.isPlainObject(data));
  var batch   = (_.isString(name) && _.isArray(data));
  var schema  = Schema.get('mysql', name);

  // configs
  var option = (config || schema.options.mysql || schema.options || {});
  var table  = this.options.table || option.table || name;

  // client cluster
  var client = this._getClient('write');

  if (single) {
    var query = _private.query_builder(table, schema, data, option.bulk);
    return client.queryAsync(query);
  }

  if (batch) {
    return Promise.each(data, function (data) {
      var query = _private.query_builder(table, schema, data, option.bulk);
      return client.queryAsync(query);
    });
  }
};

/**
 * @private
 * @type {Object}
 */
var _private = {
  query_builder: function (table, schema, data, bulk) {
    var validData = this.validate(schema, data);

    var sql = 'INSERT INTO ?? SET ?';

    if (bulk) {
      var cols = this.build_columns(validData);
      sql = 'INSERT INTO ?? (' + cols.join(', ') + ') VALUES ?';

      validData = _.map(validData, _.values);
    }

    return mysql.format(sql, [table, validData]);
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
