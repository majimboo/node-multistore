'use strict';

var util = require('util');
var BaseAdapter = require('./base');

function RabbitAdapter() {
  BaseAdapter.call(this);

  this.name = 'RabbitAdapter';
}

util.inherits(RabbitAdapter, BaseAdapter);
module.exports = RabbitAdapter;
