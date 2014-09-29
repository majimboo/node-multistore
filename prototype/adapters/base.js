'use strict';

var util = require('util');
var events = require('events');
var Promise = require('bluebird');

function BaseAdapter() {
  events.EventEmitter.call(this);

  this.name   = 'BaseAdapter';
  this.client = null;

  // supported API
  var methods = [
    'connect',
    'insert',
    'find',
    'update',
    'delete',
    'count',
    'close'
  ];
}

util.inherits(BaseAdapter, events.EventEmitter);
module.exports = BaseAdapter;

BaseAdapter.prototype.connect = function () {
  var self = this;
  return new Promise(function (resolve, reject) {
    var warning = util.format('%s: no [connect] method', self.name);
    if (warning) return reject(warning);
    resolve();
  });
};

BaseAdapter.prototype.insert = function () {
  var self = this;
  return new Promise(function (resolve, reject) {
    var warning = util.format('%s: no [insert] method', self.name);
    if (warning) return reject(warning);
    resolve();
  });
};

BaseAdapter.prototype.find = function () {
  var self = this;
  return new Promise(function (resolve, reject) {
    var warning = util.format('%s: no [find] method', self.name);
    if (warning) return reject(warning);
    resolve();
  });
};
