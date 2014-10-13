'use strict';

var should = require('should');
var repo   = require('../../');
var helper = require('./helper');
var purr   = require('purr');
var chance = require('chance').Chance();

describe('medsafe/datapoint', function () {
  var DataPoint;

  describe('#create', function () {

    before(function (done) {
      repo.init({
        cassandra: {
          on:            'create',
          contactPoints: ['localhost'],
          keyspace:      'medsafe_test'
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

      it('inserts to mysql:data_points', function (done) {
        var params = {
          code: dataPoint.code
        };

        helper.fetchMyDataPoint(params, function (err, results) {
          if (err) return done(err);
          var result = results[0];
          results.should.have.lengthOf(1);
          result.code.should.eql(dataPoint.code);
          done();
        });
      });

      it('inserts to mysql:patient_profiles');
      it('inserts to mysql:patients');
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
        DataPoint.find(function (err, results) {
          if (err) return done(err);

          results.length.should.be.above(0);
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

          results = results.map(purr.unpack);

          var result = results[0];
          helper.getTime(result);

          result.system_id.should.equal(dataPoint.system_id);
          result.uid.should.equal(dataPoint.uid);
          result.code.should.equal(dataPoint.code);
          result.set_id.should.equal(dataPoint.set_id);
          result.sequence_id.should.equal(dataPoint.sequence_id);
          result.data_type.should.equal(dataPoint.data_type);
          result.value.should.equal(dataPoint.value);
          result.applied_at.should.eql(dataPoint.applied_at.getTime());
          result.applied_status.should.equal(dataPoint.applied_status);
          result.available_at.should.eql(dataPoint.available_at.getTime());
          result.translated_at.should.eql(dataPoint.translated_at.getTime());
          result.deleted.should.equal(dataPoint.deleted);

          // attributes
          result.attributes.should.eql(dataPoint.attributes);
          // source
          result.source.should.eql(dataPoint.source);
          done();
        });
      });
    });

    describe('receives an array of codes', function () {
      var system_id = chance.guid().toUpperCase();
      var uid       = chance.guid().toLowerCase();
      var patientDataPoints = helper.generateDataPoints(2, {
        system_id: system_id,
        uid:       uid
      });

      var codes = patientDataPoints.map(function (y) { return y.code; });

      before(function (done) {
        DataPoint.create(patientDataPoints.map(purr.pack), done);
      });

      it('returns all patient data by system_id and uid', function (done) {
        var params = {
          uid: uid,
          system_id: system_id
        };

        DataPoint.find(params, function (err, results) {
          if (err) return done(err);

          results = results.map(purr.unpack);
          results.should.containDeep(patientDataPoints);
          done();
        });
      });

      it('returns all patient data with different codes', function (done) {
        var params = {
          uid: uid,
          system_id: system_id,
          code: codes
        };

        DataPoint.find(params, function (err, results) {
          if (err) return done(err);

          results = results.map(purr.unpack);
          results.should.eql(patientDataPoints);
          done();
        });
      });
    });

    describe('receives an array of same codes', function () {
      var system_id = chance.guid().toUpperCase();
      var uid       = chance.guid().toLowerCase();
      var code      = chance.guid().toUpperCase();
      var patientDataPoints = helper.generateDataPoints(2, {
        system_id: system_id,
        uid:       uid,
        code:      code
      });

      before(function (done) {
        DataPoint.create(patientDataPoints.map(purr.pack), done);
      });

      it('returns all patient data by code', function (done) {
        var params = {
          uid: uid,
          system_id: system_id,
          code: [code]
        };

        DataPoint.find(params, function (err, results) {
          if (err) return done(err);

          results = results.map(purr.unpack);
          results.should.eql(patientDataPoints);
          done();
        });
      });

    });
  });

  describe('#findSet', function () {
    var system_id = chance.guid().toUpperCase();
    var uid       = chance.guid().toLowerCase();
    var set_id    = chance.guid().toUpperCase();

    var setDataPoints = helper.generateDataPoints(4, {
      system_id: system_id,
      uid: uid,
      set_id: set_id
    });

    before(function (done) {
      DataPoint.create(setDataPoints.map(purr.pack), done);
    });

    describe('receives valid params', function () {
      var params = purr.pack({
        uid:       uid,
        system_id: system_id,
        set_id:    set_id
      });

      it('return relevant data points sets', function (done) {
        DataPoint.findSet(params, function (err, results) {
          if (err) return done(err);

          var expected = setDataPoints.map(function (data) {
            return {
              system_id: data.system_id,
              uid: data.uid,
              set_id: data.set_id,
              sequence_id: data.sequence_id,
              code: data.code
            };
          });

          results = results.map(purr.unpack);
          results.should.have.lengthOf(setDataPoints.length);
          results.should.containDeep(expected);
          done();
        });
      });

    });
  });

  describe('#events', function () {
    var justDataPoints = helper.generateDataPoints(1)[0];

    it('emits the creating event', function (done) {
      repo.mysql.on('beforeCreate', done);
      DataPoint.create(purr.pack(justDataPoints));
    });
  });

});
