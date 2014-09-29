'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var adapters = {};

function each(callback) {
  _.each(adapters, callback);
}

function getNames() {
  return _.keys(adapters);
}

function getAdapterByName(name) {
  return adapters[name];
}

function load(options) {
  _.each(options, function (option, name) {
    var file = path.join(__dirname, 'adapters', name);
    if (fs.existsSync(file + '.js')) {
      var Adapter = require(file);
      adapters[name] = new Adapter(option);
    } else {
      throw new Error('specified adapter [' + name + '] does not exist');
    }
  });
}

module.exports = {
  each: each,
  getNames: getNames,
  getAdapterByName: getAdapterByName,
  load: load
};
