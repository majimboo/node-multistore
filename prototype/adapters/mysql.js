'use strict';

var util = require('util');
var BaseAdapter = require('./base');

function MysqlAdapter() {
  BaseAdapter.call(this);
}

util.inherits(MysqlAdapter, BaseAdapter);
module.exports = MysqlAdapter;

MysqlAdapter.prototype.insert = function (table, data) {

}
