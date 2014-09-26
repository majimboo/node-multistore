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

};

BaseAdapter.prototype.insert = function () {

};

BaseAdapter.prototype.delete = function () {

};
