'use strict';

var util = require('util');
var BaseAdapter = require('./base');

function MysqlAdapter() {
  BaseAdapter.call(this);

  this.name = 'MysqlAdapter';
}

util.inherits(MysqlAdapter, BaseAdapter);
module.exports = MysqlAdapter;
