'use strict';

var should = require('should');
var repo   = require('../../');
var helper = require('./helper');
var purr   = require('purr');

describe('medsafe/datapoint', function () {
  var DataPoint;

  describe('#create', function () {

    before(function (done) {
      repo.init({
        cassandra: {
          on: 'create',
          contactPoints: ['localhost'],
          keyspace: 'medsafe_test'
        },
        mysql: {
          on: 'create',
          connectionLimit: 10,
          operations: {
            read: {
              host:     'localhost',
              user:     'root',
              database: 'medsafe_test'
            },
            write: {
              host:     'localhost',
              user:     'root',
              database: 'medsafe_test'
            }
          }
        }
      }, function (err) {
        DataPoint = helper.getModel();
        done(err);
      });
    });

    describe('receives one data point', function () {
      var dataPoint = helper.generateDataPoints(1)[0];

      before(function (done) {
        DataPoint.create(purr.pack(dataPoint), done);
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

      // TODO
      //   - find whats causing the errors
      //
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

      it('inserts to mysql:data_points_0');
      it('inserts to mysql:patient_profile');
      it('inserts to mysql:profiles');
      it('inserts to mysql:attributes');

    });

    describe('receives multiple data points', function () {
      var dataPoint = helper.generateDataPoints(2);

      before(function (done) {
        DataPoint.create(dataPoint.map(purr.pack), done);
      });

      it('inserts all to cassandra:data_points');
    });

    describe('receives a data point with an invalid data_type', function () {
      var dataPoint = helper.generateDataPoints(1, {
        applied_list: ['wrong']
      })[0];
      var errMsg = 'value for [ applied_status ] is invalid';

      it('returns an error', function (done) {
        DataPoint.create(purr.pack(dataPoint), function (error) {
          error.should.be.instanceof(Error);
          error.message.should.equal(errMsg);
          done();
        });
      });

    });
  });

  describe('#find', function () {
    var dataPoint = helper.generateDataPoints(1)[0];

    before(function (done) {
      DataPoint.create(purr.pack(dataPoint), done);
    });

    describe('receives no params', function () {
      it('returns all data points', function (done) {
        DataPoint.find(function (err, result) {
          if (err) return done(err);

          // 11 at this point
          result.rows.should.have.lengthOf(10);
          done();
        });
      });
    });

    describe('receives a valid uid and system_id', function () {
      it('returns relevant data points', function (done) {
        var params = {
          uid: dataPoint.uid,
          system_id: dataPoint.system_id
        };

        DataPoint.find(params, function (err, results) {
          if (err) return done(err);
          var result = results.rows[0];

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
    });

  });

});
