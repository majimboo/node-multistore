'use strict';

var should = require('should');
var uuid   = require('node-uuid');
var chance = require('chance').Chance();
var moment = require('moment');
var cassandra = require('cassandra-driver');

var repo = require('../../');

function toUpperCase(value) {
  return value.toUpperCase();
}

function toLowerCase(value) {
  return value.toLowerCase();
}

function getTime(value) {
  return moment(value).valueOf();
}

repo.schema('data_points', {
  system_id: {
    type: 'text',
    required: true,
    morph: toUpperCase
  },
  uid: {
    type: 'text',
    required: true,
    morph: toLowerCase
  },
  code: {
    type: 'text',
    required: true,
    morph: toUpperCase
  },
  journal_id: {
    type: 'timeuuid',
    default: uuid.v1
  },
  set_id: {
    type: 'text',
    required: true,
    morph: toUpperCase
  },
  sequence_id: {
    type: 'text',
    default: '',
    morph: toUpperCase
  },
  data_type: {
    type: 'text',
    required: false,
    morph: toUpperCase
  },
  value: 'text',
  attributes: 'map',
  source: 'map',
  applied_at: {
    type: 'timestamp',
    morph: getTime
  },
  applied_status: {
    type: 'text',
    required: true
  },
  available_at: {
    type: 'timestamp',
    morph: getTime
  },
  translated_at: {
    type: 'timestamp',
    morph: getTime
  },
  deleted: 'boolean'
});

var attrs = {};
attrs[chance.word()] = chance.word();
attrs[chance.word()] = chance.word();
attrs[chance.word()] = chance.word();

var source = {
  system_id:  chance.word().toUpperCase(),
  journal_id: uuid.v1(),
  uid:        uuid.v4().toLowerCase(),
  data_type:  chance.word().toUpperCase(),
  code:       chance.word().toUpperCase()
};

var dataPoint = {
  system_id:      source.system_id,
  uid:            source.uid,
  journal_id:     source.journal_id,
  data_type:      source.data_type,
  sequence_id:    chance.word().toUpperCase(),
  code:           source.code,
  value:          chance.word(),
  attributes:     attrs,
  source:         source,
  applied_at:     chance.date({year: 2013}),
  applied_status: chance.pick(['', 'made', 'reported', 'prepared']),
  deleted:        false,
  set_id:         chance.word().toUpperCase(),
  available_at:   chance.date({year: 2013}),
  translated_at:  chance.date({year: 2013})
};

describe('adapters/cassandra', function () {
  before(function (done) {
    repo.init({
      cassandra: {
        contactPoints: ['localhost'],
        keyspace: 'medsafe'
      }
    }, done);
  });

  describe('#connect', function () {
    it('connects to the cassandra server', function (done) {
      repo.cassandra.connect().then(done).catch(done);
    });
  });

  describe('#insert', function () {
    it('receives a single transaction', function (done) {
      repo.cassandra.insert('data_points', dataPoint)
        .then(done).catch(done);
    });

    // https://datastax-oss.atlassian.net/browse/NODEJS-23
    it('recieves multiple transactions'/**, function (done) {
      var count = 5;

      var attrs      = {};
      var source     = {};
      var dataPoints = [];

      while (count--) {
        attrs = {};
        attrs[chance.word()] = chance.word();
        attrs[chance.word()] = chance.word();
        attrs[chance.word()] = chance.word();

        source = {
          system_id:  chance.word().toUpperCase(),
          journal_id: uuid.v1(),
          uid:        uuid.v4().toLowerCase(),
          data_type:  chance.word().toUpperCase(),
          code:       chance.word().toUpperCase()
        };

        dataPoints.push({
          system_id:      source.system_id,
          uid:            source.uid,
          journal_id:     source.journal_id,
          data_type:      source.data_type,
          sequence_id:    chance.word().toUpperCase(),
          code:           source.code,
          value:          chance.word(),
          attributes:     attrs,
          source:         source,
          applied_at:     chance.date({year: 2013}),
          applied_status: chance.pick(['', 'made', 'reported', 'prepared']),
          deleted:        false,
          set_id:         chance.word().toUpperCase(),
          available_at:   chance.date({year: 2013}),
          translated_at:  chance.date({year: 2013})
        });
      }

      repo.cassandra.insert('data_points', dataPoints)
        .then(done).catch(done);
    }**/);
  });

  describe('#select', function () {
    it('recieves no parameters', function (done) {
      repo.cassandra.select('data_points').then(function (results) {
        results.rows.should.be.an.instanceof(Array);
        done();
      }).catch(done);
    })

    it('recieves an existing uid and system_id', function (done) {
      var params = {
        uid: dataPoint.uid,
        system_id: dataPoint.system_id
      };

      repo.cassandra.select('data_points', params).then(function (results) {
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
      }).catch(done);
    });
  });

});
