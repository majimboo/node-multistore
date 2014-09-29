'use strict';

var util      = require('util');
var Promise   = require('bluebird');
var cassandra = require('cassandra-driver');

var BaseAdapter = require('./base');

function CassandraAdapter(options) {
  BaseAdapter.call(this);

  this.name = 'CassandraAdapter';
  this.options = options;
}

util.inherits(CassandraAdapter, BaseAdapter);
module.exports = CassandraAdapter;

CassandraAdapter.prototype.connect = function () {
  var self = this;

  this.client = new cassandra.Client(this.options);
  return new Promise(function (resolve, reject) {
    self.client.connect(function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
};
