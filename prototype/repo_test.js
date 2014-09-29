'use strict';

var should = require('should');
var chance = require('chance').Chance();
var cassandra = require('cassandra-driver');

var Repo = require('../');

var db = new Repo({
  cassandra: {
    contacts: ['localhost'],
    keyspace: 'medintegrate'
  },
  rabbitmq: {
    host: 'amqp://localhost'
  },
  mysql: {
    host: 'localhost'
  }
});

/**
 * @param  {Object} schema  [description]
 * @param  {Object} options [description]
 * @param  {Object} adapter [description]
 *
 * @return {Schema}         [description]
 */

var TransactionSchema = db.schema({
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

var Transaction = db.model('transaction', TransactionSchema);

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

var tx = new Transaction(transaction);
tx.channel_id = 1; // set/change property
tx.save(function (err) {

});
