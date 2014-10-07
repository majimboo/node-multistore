'use strict';

var should = require('should');
var repo   = require('../../');
var helper = require('./helper');

describe('DataPoint', function () {
  var DataPoint;

  before(function (done) {
    repo.init({
      cassandra: {
        on: 'create',
        contactPoints: ['localhost'],
        keyspace: 'medsafe'
      }
    }, function (err) {
      DataPoint = helper.getModel();
      done(err);
    });
  });

  describe('receives one data point', function () {
    var dataPoint = helper.generateDataPoints(1)[0];

    before(function (done) {
      DataPoint.create(dataPoint, done);
    });

    it('inserts to cassandra:data_points', function (done) {
      helper.fetchDataPoint([
        dataPoint.system_id,
        dataPoint.uid,
        dataPoint.code
      ], {
        hints: ['text', 'text', 'text']
      }, function (err, results) {
        if (err) return done(err);

        var result = results.rows[0];

        // some items not validated. recheck
        result.system_id.should.equal(dataPoint.system_id);
        result.uid.should.equal(dataPoint.uid);
        result.code.should.equal(dataPoint.code);
        result.set_id.should.equal(dataPoint.set_id);
        result.sequence_id.should.equal(dataPoint.sequence_id);
        result.data_type.should.equal(dataPoint.data_type);
        result.value.should.equal(dataPoint.value);
        result.applied_at.should.eql(dataPoint.applied_at);
        result.applied_status.should.equal(dataPoint.applied_status);
        result.available_at.should.eql(dataPoint.available_at);
        result.translated_at.should.eql(dataPoint.translated_at);
        result.deleted.should.equal(dataPoint.deleted);

        // attributes
        result.attributes.should.eql(dataPoint.attributes);
        // source
        result.source.should.eql(dataPoint.source);
        done();
      });
    });

    it('inserts to cassandra:profiles', function (done) {
      helper.fetchProfile([
        dataPoint.system_id,
        dataPoint.uid
      ], {
        hints: ['text', 'text']
      }, function (err, results) {
        if (err) return done(err);

        var result = results.rows[0];

        result.system_id.should.equal(dataPoint.system_id);
        result.uid.should.equal(dataPoint.uid);
        done();
      });
    });

    it('inserts to cassandra:data_points_by_set', function (done) {
      helper.fetchDataPointSet([
        dataPoint.system_id,
        dataPoint.uid,
        dataPoint.set_id,
        dataPoint.code,
        dataPoint.sequence_id
      ], {
        hints: ['text', 'text', 'text', 'text', 'text']
      }, function (err, results) {
        if (err) return done(err);

        var result = results.rows[0];

        result.system_id.should.equal(dataPoint.system_id);
        result.uid.should.equal(dataPoint.uid);
        result.code.should.equal(dataPoint.code);
        result.set_id.should.equal(dataPoint.set_id);
        result.sequence_id.should.equal(dataPoint.sequence_id);
        done();
      });
    });

    it('inserts to cassandra:data_points_by_cutoff', function (done) {
      helper.fetchDataPointCutOff([
        dataPoint.system_id,
        dataPoint.code,
        dataPoint.available_at,
        dataPoint.uid
      ], {
        hints: ['text', 'text', 'timestamp', 'text']
      }, function (err, results) {
        if (err) return done(err);

        var result = results.rows[0];

        result.system_id.should.equal(dataPoint.system_id);
        result.uid.should.equal(dataPoint.uid);
        result.code.should.equal(dataPoint.code);
        result.available_at.should.eql(dataPoint.available_at);
        done();
      });
    });

  });

});
