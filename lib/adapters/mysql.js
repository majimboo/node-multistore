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

  var self = this;

  return new Promise(function (resolve, reject) {
    function callback(err, result) {
      if (result && result.insertId) return resolve();
      reject(err);
    }

    var sql    = util.format('INSERT INTO %s SET ?', table);
    var params = {
      txn_id: data.transaction_id,
      channel_id: data.channel_id
    };
    var query = mysql.format(sql, params);

    self.client.query(query, callback);
  });
};

MysqlAdapter.prototype._validate = function (schema, data) {

};
