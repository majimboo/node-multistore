'use strict';

var _        = require('lodash');

function Model(options, adapters) {
  this.options = options;
  this.adapters = adapters;
}

module.exports = Model;

Model.prototype.create = function (data, callback) {
  var self = this;

  // each adapter
  _.each(this.options, function (schemas, adapter) {
    // each schema on adapter
    _.each(schemas, function (schema) {
      // validate data against schema
      var validated = self.validation(schema, data);
    });
    self.adapters[adapter].insert();
  });
};

Model.prototype.find = function (properties, callback) {

};

Model.prototype.validation = function (schema, data) {
  // validated paths
  var validated = _.reduce(schema.paths, validate, {});

  function validate(result, value, key) {
    var type     = value.type;
    var required = value.required;
    var map      = schema.options.map || {};
    var column   = map[key] || key;
    console.log(map[key]);
    console.log(column);

    if (required && !data.hasOwnProperty(column)) {
      throw new Error('required column [ ' + column + ' ] is missing!');
    }

    // add hints
    result[column] = { value: data[column], hint: type };

    return result;
  }

  return validated;
};
