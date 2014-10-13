'use strict';

var should = require('should');
var chance = require('chance').Chance();

var repo = require('../../');

describe('adapters/mysql', function () {
  var dataPoint, dataPoints = [];

  before(function (done) {
    dataPoint = { code: chance.word() };
    var count = 2;
    while (count--) { dataPoints.push({ code: chance.word() }); }

    repo.init({
      mysql: {
        connectionLimit: 10,
        host:     'localhost',
        user:     'root',
        database: 'medsafe_test'
      }
    }, done);
  });

  describe('#connect', function () {
    it('connects to the mysql server', function (done) {
      repo.mysql.connect(done);
    });
  });

  describe('#schema', function () {
    it('creates a new schema for a table', function (done) {
      repo.mysql.schema('data_points', {
        code: 'text'
      });
      done();
    });

    it('throws an error if no schema is given', function (done) {
      should(function () {
        repo.mysql.schema('data_points');
      }).throw('invalid schema definition');
      done();
    });
  });

  describe('#create', function () {
    it('creates a single data point from an object', function (done) {
      repo.mysql.create('data_points', dataPoint, done);
    });

    it('creates multiple data points from array', function (done) {
      repo.mysql.create('data_points', dataPoints, done);
    });
  });

  describe('#count', function () {
    it('returns full table count if no params are given', function (done) {
      repo.mysql.count('data_points', function (err, count) {
        should.not.exist(err);
        count.should.be.a.Number;
        count.should.be.above(0);
        done();
      });
    });
  });

  describe('#events', function () {
    it('emits the creating event', function (done) {
      repo.mysql.on('beforeCreate', done);
      repo.mysql.create('data_points', dataPoints);
    });
  });

});
