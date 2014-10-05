'use strict';

var should = require('should');
var chance = require('chance').Chance();
var cassandra = require('cassandra-driver');

var Repo = require('../');

var db = new Repo({
  cassandra: {
    on: 'create',
    contactPoints: ['localhost'],
    keyspace:      'medintegrate'
  },
  amqp: {
    after:    'create',
    host:     'amqp://localhost',
    key:      'export',
    exchange: 'caresharing.medintegrate'
  },
  mysql: {
    on: 'create',
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    database: 'medintegrate'
  }
});

describe('Repo', function () {
  describe('#init', function () {
    it('should load all enabled adapters', function (done) {
      db.init(done);
    });
  });

  describe('#schema', function () {
    it('should return a model', function (done) {
      var Transaction = db.schema('transaction_logs', {
        channel_id:       { type: 'text',     required: true },
        date:             { type: 'text',     required: true },
        event_id:         { type: 'timeuuid', required: true },
        transaction_id:   { type: 'uuid',     required: true },
        source_system_id: { type: 'text',     required: true },
        target_system_id: { type: 'text',     required: true },
        subject_id:       { type: 'text',     required: true },
        sender_id:        { type: 'text',     required: true },
        recipient_id:     { type: 'text',     required: true },
        data_id:          { type: 'text',     required: true },
        event_status:     { type: 'text',     required: true }
      }, {
        mysql: {
          table: 'txl'
        }
      });

      Transaction.should.be.an.instanceof(Object);
      done();
    });
  });

  describe('#insert', function () {
    it('should insert to all enabled adapters', function (done) {
      var transaction = {
        channel_id:       chance.word(),
        date:             chance.date({string: true}),
        event_id:         cassandra.types.timeuuid(),
        transaction_id:   cassandra.types.uuid(),
        source_system_id: chance.word(),
        target_system_id: chance.word(),
        subject_id:       chance.word(),
        sender_id:        chance.word(),
        recipient_id:     chance.word(),
        data_id:          chance.word(),
        event_status:     chance.word()
      }

      var options = {
        /**
        amqp: {
          key: 'export',
          exchange: 'caresharing.medintegrate'
        }
        **/
      };

      db.insert('transaction_logs', transaction, options, done);
    });
  });
});

describe('Model', function () {
  describe('#create', function () {
    // it('should work as expected with model syntax', function (done) {

    //   // cassandra inserts
    //   var CaTransaction = db.cassandra.schema('Transaction', {
    //     channel_id:       { type: 'text',     required: true },
    //     date:             { type: 'text',     required: true },
    //     event_id:         { type: 'timeuuid', required: true },
    //     transaction_id:   { type: 'uuid',     required: true },
    //     source_system_id: { type: 'text',     required: true },
    //     target_system_id: { type: 'text',     required: true },
    //     subject_id:       { type: 'text',     required: true },
    //     sender_id:        { type: 'text',     required: true },
    //     recipient_id:     { type: 'text',     required: true },
    //     data_id:          { type: 'text',     required: true },
    //     event_status:     { type: 'text',     required: true }
    //   }, {
    //     table: 'transaction_logs'
    //   });

    //   // mysql inserts
    //   var MyTransaction = db.mysql.schema('Transaction', {
    //     channel_id:     { type: 'text', required: true },
    //     transaction_id: { type: 'uuid', required: true }
    //   }, {
    //     table: 'txl'
    //   });

    //   var Transaction = db.model('Transaction', [CaTransaction, MyTransaction]);

    //   var transaction = {
    //     channel_id:       chance.word(),
    //     date:             chance.date({string: true}),
    //     event_id:         cassandra.types.timeuuid(),
    //     transaction_id:   cassandra.types.uuid(),
    //     source_system_id: chance.word(),
    //     target_system_id: chance.word(),
    //     subject_id:       chance.word(),
    //     sender_id:        chance.word(),
    //     recipient_id:     chance.word(),
    //     data_id:          chance.word(),
    //     event_status:     chance.word()
    //   }

    //   Transaction.create(transaction, done);
    // });
  });
});
