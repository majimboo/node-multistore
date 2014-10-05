'use strict';

var util = require('util');
var BaseAdapter = require('./base');

function CassandraAdapter() {
  BaseAdapter.call(this);
}

util.inherits(CassandraAdapter, BaseAdapter);
module.exports = CassandraAdapter;

CassandraAdapter.prototype.insert = function (table, data) {

}
