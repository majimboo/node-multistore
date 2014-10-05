'use strict';

var _    = require('lodash');
var fs   = require('fs');
var path = require('path');

function setup(adapters) {
  if (!adapters) throw new Error('must specify atleast one adapter');
  var expose = {};

  _.each(adapters, function (option, name) {
    var file = path.join(__dirname, 'adapters', name);
    if (fs.existsSync(file + '.js')) {
      var Adapter = require(file);
      expose[name] = new Adapter(option);
    }
  });

  return expose;
}

module.exports.setup = setup;
