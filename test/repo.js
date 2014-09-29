'use strict';

var should = require('should');
var chance = require('chance').Chance();
var cassandra = require('cassandra-driver');

var Repo = require('../');

var repo = new Repo({
  cassandra: {
    contacts: ['localhost'],
    keyspace: 'medintegrate'
  },
  amqp: {
    host: 'amqp://localhost',
    key: 'export',
    exchange: 'caresharing.medintegrate'
  }
});

describe('repo', function () {

  describe('#init', function () {
    it('should load all enabled adapters', function (done) {
      repo.init(done);
    });
  });

  describe('#schema', function () {
    it('should define the schema', function (done) {
      repo.schema('transaction_logs', {
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
      }
      /** , {
        amqp: {
          key: 'export',
          exchange: 'caresharing.medintegrate'
        }
      } **/
      );
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

      repo.insert('transaction_logs', transaction, options, done);
    });
  });

});
