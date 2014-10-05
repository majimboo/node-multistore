'use strict';

var _     = require('lodash');

function buildOptions(options, schematas) {
  return _.reduce(options, function (result, schemas, adapter) {
    result[adapter] = _.reduce(schemas, function (result, schema) {
      result[schema] = schematas[adapter + ':' + schema][schema];
      return result;
    }, {});
    return result;
  }, {});
}

module.exports = {
  buildOptions: buildOptions
}
