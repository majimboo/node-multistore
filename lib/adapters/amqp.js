/**
 * status: okay
 */
'use strict';

var _       = require('lodash');
var util    = require('util');
var Schema  = require('../schema');
var amqplib = require('amqplib');

var BaseAdapter = require('./base');

function AmqpAdapter(options) {
  BaseAdapter.call(this);

  this.options = (options || {});
  this.name    = 'amqp';
}

util.inherits(AmqpAdapter, BaseAdapter);
module.exports = AmqpAdapter;

AmqpAdapter.prototype._connect = function () {
  var self = this;

  if (!this.client) {
    var open = amqplib.connect(self.options.host);
    open.then(function (conn) {
      self.client = conn.createChannel();
    });
    return open;
  }
};

AmqpAdapter.prototype._create = function (schema, data, config) {
  // configs
  var option = (config || schema.options.amqp || {});

  var key = (this.options.key || option.key || schema);
  var ex  = (this.options.exchange || option.exchange);

  return this.client.then(function (ch) {
    if (ex) {
      ch.checkExchange(ex);
      ch.publish(ex, key, new Buffer(JSON.stringify(data)));
    } else {
      ch.checkQueue(key);
      ch.sendToQueue(key, new Buffer(JSON.stringify(data)));
    }
  });
};
