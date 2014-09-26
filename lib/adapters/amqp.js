'use strict';

var _       = require('lodash');
var util    = require('util');
var amqplib = require('amqplib');

var BaseAdapter = require('./base');

function AmqpAdapter(options) {
  BaseAdapter.call(this);

  this.options = options;
}

util.inherits(AmqpAdapter, BaseAdapter);
module.exports = AmqpAdapter;

AmqpAdapter.prototype.connect = function () {
  var self = this;

  if (!this.client) {
    var open = amqplib.connect(self.options.host);
    open.then(function (conn) {
      self.client = conn.createChannel();
    });
    return open;
  }
};

AmqpAdapter.prototype.insert = function (table, data, config) {
  config = config || {};

  var key = config.key || table;
  var exchange = config.exchange;

  return this.client.then(function (ch) {
    if (exchange) {
      ch.checkExchange(exchange);
      ch.publish(exchange, key, new Buffer(data));
    } else {
      ch.checkQueue(key);
      ch.sendToQueue(key, new Buffer(data));
    }
  });
};
