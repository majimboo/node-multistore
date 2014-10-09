'use strict';

var should = require('should');
var chance = require('chance').Chance();
var helper = require('../medsafe/helper');

var repo = require('../../');

describe('cases/mysql_partition', function () {
  var dataPoints   = [], Schema;
  var TABLE        = 'data_points_partition_1';
  var MAX_ROWS     = 10;
  var CREATE_TABLE = 'CREATE TABLE `' + TABLE + '` ('      +
                     'id INT(11) NOT NULL AUTO_INCREMENT,' +
                     'code TEXT NOT NULL,'                 +
                     'PRIMARY KEY (id))';

  before(function (done) {
    var count = 12;
    while (count--) { dataPoints.push({ code: chance.word() }); }

    repo.init({
      mysql: {
        connectionLimit: 10,
        host:     'localhost',
        user:     'root',
        database: 'medsafe_test'
      }
    }, function () {
      helper.cleanMysql('data_points', done);
    });
  });

  it('should connect to the mysql server', function (done) {
    repo.mysql.connect(function (err) {
      if (err) return done(err);

      repo.mysql.client.query('DROP TABLE IF EXISTS ' + TABLE, done);
    });
  });

  it('should create a mysql schema for data_points', function (done) {
    Schema = repo.mysql.schema('data_points', {
      code: 'text'
    });
    done();
  });

  it('should create 10 data points', function (done) {
    repo.mysql.create('data_points', dataPoints, done);
  });

  it('should check if table row count is more than 10', function (done) {
    repo.mysql.count('data_points', function (err, count) {
      if (err) return done(err);

      if (count > 10) {
        Schema.options.table = 'error';
      }

      done();
    });
  });

  it('should error out invalid table', function (done) {
    repo.mysql.count('data_points', function (err, count) {
      err.should.be.an.instanceof(Error);
      should.not.exist(count);
      done();
    });
  });

  it('should use another table if table has reached max', function (done) {
    Schema.options.table = 'data_points';

    repo.mysql.count('data_points', function (err, count) {
      if (err) return done(err);

      if (count > MAX_ROWS) {
        Schema.options.table = TABLE;
      }

      done();
    });
  });

  it('should create a the new partition table', function (done) {
    repo.mysql.client.query(CREATE_TABLE, function (err) {
      if (err) return done(err);

      done();
    });
  });

  it('should insert into new data_points_0 table', function (done) {
    repo.mysql.create('data_points', dataPoints, done);
  });

});
