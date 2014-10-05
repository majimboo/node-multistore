'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');

function setup(adapters) {
  if (!adapters) throw new Error('must specify atleast one adapter');

  var expose = {};

  _.each(adapters, function (name) {
    var file = path.join(__dirname, 'adapters', name);
    if (fs.existsSync(file + '.js')) {
      expose[name] = require(file);
    }
  });

  return expose;
}

module.exports = {
  setup: setup
};
