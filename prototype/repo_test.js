'use strict';

var should = require('should');
var chance = require('chance').Chance();
var cassandra = require('cassandra-driver');

var Repo = require('./repo');

var db = new Repo({
  cassandra: {
    contactPoints: ['localhost'],
    keyspace: 'medintegrate'
  },
  rabbitmq: {
    host: 'amqp://localhost'
  },
  mysql: {
    host: 'localhost'
  }
});

// local vars
var TransactionSchema, Transaction, tx;

describe('Repo', function () {

  describe('#init', function () {

    it('should load all specified adapters', function (done) {
      db.init(done);
    });

  });

  describe('#schema', function () {

    it('should accept options', function (done) {
      TransactionSchema = db.schema({
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
        // inserts to both adapter
        adapters: ['cassandra', 'mysql'],
        // this adapter gets called when both inserts are done
        callback: ['rabbitmq']
      }, {
        // adapter specific options
        cassandra: { table: 'transaction_logs' },
        mysql: { ignore: ['sender_id'], table: 'transactions' },
        rabbitmq: { exchange: 'myexchange', key: 'mykey' }
      });

      done();
    });

  });

  describe('#model', function () {

    it('should accept a valid schema', function (done) {
      Transaction = db.model('transaction', TransactionSchema);

      done();
    });

  });

});

describe('Model', function () {

  describe('#new', function () {

    it('should create a new model', function (done) {
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

      tx = new Transaction(transaction);
      done();
    });

  });

  describe('#save', function () {

    it('should save the model', function (done) {
      tx.channel_id = 1; // set/change property
      tx.save(done);
    });

  });

});
