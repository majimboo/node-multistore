'use strict';

var should = require('should');
var chance = require('chance').Chance();
var cassandra = require('cassandra-driver');

var repo = require('../../');

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
});

describe('adapters/amqp', function () {
  before(function (done) {
    repo.init({
      amqp: {
        host: 'amqp://localhost'
      }
    }, done);
  });

  describe('#connect', function () {
    it('connects to the amqp server', function (done) {
      // promise returns a connection object
      // so then(done) doesnt work
      repo.amqp.connect(done);
    });
  });

  describe('#create', function () {
    it('receives a single transaction', function (done) {
      var transaction = {
        channel_id:       chance.word(),
        date:             chance.date({string: true, year: 2013}),
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
        key: 'caresharing.medsafe.export',
        exchange: 'caresharing.medintegrate'
      };

      repo.amqp.create('transaction_logs', transaction, options, done);
    });
  });

});
