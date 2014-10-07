'use strict';

var _       = require('lodash');
var util    = require('util');
var Schema  = require('../schema');
var mysql   = require('mysql');
var Promise = require('bluebird');

var BaseAdapter = require('./base');

function MysqlAdapter(options) {
  BaseAdapter.call(this);

  this.options = (options || {});
}

util.inherits(MysqlAdapter, BaseAdapter);
module.exports = MysqlAdapter;

MysqlAdapter.prototype.connect = function () {
  if (!this.client) {
    this.client = mysql.createPool(this.options);
    return Promise.resolve(this.client);
  }
};

MysqlAdapter.prototype.schema = function (name, schema, options) {
  return Schema.add('mysql', name, schema, options);
};

MysqlAdapter.prototype.insert = function (table, data, config) {
  var schema  = Schema.get('mysql', table);

  // configs
  config = (config || schema.options.mysql || schema.options || {});
  table  = this.options.table || config.table || table;

  var validData = this._validate(schema, data);

  var self = this;

  return new Promise(function (resolve, reject) {
    function callback(err, result) {
      if (result && result.insertId) return resolve();
      reject(err);
    }

    var sql    = util.format('INSERT INTO %s SET ?', table);
    var query = mysql.format(sql, validData);

    self.client.query(query, callback);
  });
};

MysqlAdapter.prototype._validate = function (schema, data) {
  // data validation
  var validated = _.reduce(schema, validate, {});

  function validate(result, s, key) {
    var required = (s.required || false);
    var fallback = s.default;
    var morpher  = s.morph;
    var mapping  = (schema.options.mapping || {});
    var column   = mapping[key] || key;
    var value    = data[column];

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

    return result;
  }

  return validated;
};
