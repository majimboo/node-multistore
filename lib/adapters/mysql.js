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
  this.cluster = this.options.operations;
}

util.inherits(MysqlAdapter, BaseAdapter);
module.exports = MysqlAdapter;

MysqlAdapter.prototype.connect = function () {
  if (!this.cluster && !this.client) {
    this.client = mysql.createPool(this.options);
    return Promise.resolve(this.client);
  }

  // TODO fix refactor
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
  var self    = this;

  // configs
  config = (config || schema.options.mysql || schema.options || {});
  var table  = this.options.table || config.table || name;

  // client cluster
  var client = this.client || this.writeClient;

  return new Promise(function (resolve, reject) {
    function callback(err, result) {
      if (result && result.insertId) return resolve();
      reject(err);
    }

    if (single) {
      var validData = self._validate(schema, data);

      var sql = (config.bulk) ? 'INSERT INTO ?? (`key`, `value`) VALUES ?' :
                                'INSERT INTO ?? SET ?';

      // temporary
      if (_.isEmpty(validData)) {
        return callback(null, { insertId: -1 });
      }

      var query = mysql.format(sql, [table, validData])
      client.query(query, callback);
    }

    // to be refactored
    if (batch) {
      _.each(data, function (data, index, list) {
        var validData = self._validate(schema, data);

        var sql = (config.bulk) ? 'INSERT INTO ?? (`key`, `value`) VALUES ?' :
                                  'INSERT INTO ?? SET ?';

        var locallback;
        if (list.length === (index + 1)) {
          locallback = callback;
        } else {
          locallback = function () {}
        }

        // temporary
        if (_.isEmpty(validData)) {
          return callback(null, { insertId: -1 });
        }

        var query = mysql.format(sql, [table, validData])
        client.query(query, callback);
      });
    }

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
};
