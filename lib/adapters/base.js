'use strict';

var util   = require('util');
var events = require('events');

function BaseAdapter() {
  events.EventEmitter.call(this);

  this.client = null;
}

util.inherits(BaseAdapter, events.EventEmitter);
module.exports = BaseAdapter;

BaseAdapter.prototype.connect = function () {
  throw new Error('Not Implemented');
};

BaseAdapter.prototype.insert = function () {
  throw new Error('Not Implemented');
};

BaseAdapter.prototype.find = function () {
  throw new Error('Not Implemented');
};

BaseAdapter.prototype.close = function () {
  throw new Error('Not Implemented');
};

BaseAdapter.prototype.count = function () {
  throw new Error('Not Implemented');
};

BaseAdapter.prototype.update = function () {
  throw new Error('Not Implemented');
};

BaseAdapter.prototype.delete = function () {
  throw new Error('Not Implemented');
};

BaseAdapter.prototype.schema = function () {
  throw new Error('Not Implemented');
};
