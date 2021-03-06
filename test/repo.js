// 'use strict';

// var should = require('should');
// var chance = require('chance').Chance();
// var cassandra = require('cassandra-driver');
// var Model = require('../lib/model');

// var db = require('../');

// describe('Repo', function () {
//   var TransactionSchema;

//   describe('#init', function () {
//     it('should load all enabled adapters', function (done) {
//       db.init({
//         cassandra: {
//           on:            'create',
//           contactPoints: ['localhost'],
//           keyspace:      'medintegrate_test'
//         },
//         amqp: {
//           after:    'create',
//           host:     'amqp://localhost',
//           key:      'caresharing.medsafe.export',
//           exchange: 'caresharing.medintegrate'
//         },
//         mysql: {
//           on:              'create',
//           connectionLimit: 10,
//           host:            'localhost',
//           user:            'root',
//           database:        'medintegrate_test'
//         }
//       }, done);
//     });
//   });

//   describe('#schema', function () {
//     it('should return a schema', function (done) {
//       var schema = {
//         channel_id:       { type: 'text',     required: true },
//         date:             { type: 'text',     required: true },
//         event_id:         { type: 'timeuuid', required: true },
//         transaction_id:   { type: 'uuid',     required: true },
//         source_system_id: { type: 'text',     required: true },
//         target_system_id: { type: 'text',     required: true },
//         subject_id:       { type: 'text',     required: true },
//         sender_id:        { type: 'text',     required: true },
//         recipient_id:     { type: 'text',     required: true },
//         data_id:          { type: 'text',     required: true },
//         event_status:     { type: 'text',     required: true }
//       };

//       TransactionSchema = db.schema('transaction_logs', schema);

//       TransactionSchema.should.eql(schema);

//       done();
//     });
//   });

//   describe('#model', function () {
//     it('should return a model', function (done) {
//       var Transaction = db.model('Transaction', [TransactionSchema]);

//       Transaction.should.be.an.instanceof(Model);
//       done();
//     });
//   });

// });

// describe('Model', function () {
//   describe('#create', function () {
//     it('should insert to all database specified', function (done) {

//       // cassandra inserts
//       var CaTransaction = db.cassandra.schema('Transaction', {
//         channel_id:       { type: 'text',     required: true },
//         date:             { type: 'text',     required: true },
//         event_id:         { type: 'timeuuid', required: true },
//         transaction_id:   { type: 'uuid',     required: true },
//         source_system_id: { type: 'text',     required: true },
//         target_system_id: { type: 'text',     required: true },
//         subject_id:       { type: 'text',     required: true },
//         sender_id:        { type: 'text',     required: true },
//         recipient_id:     { type: 'text',     required: true },
//         data_id:          { type: 'text',     required: true },
//         event_status:     { type: 'text',     required: true }
//       }, {
//         table: 'transaction_logs'
//       });

//       // mysql inserts
//       var MyTransaction = db.mysql.schema('Transaction', {
//         channel_id: { type: 'text', required: true },
//         txn_id:     { type: 'uuid', required: true }
//       }, {
//         table: 'txl',
//         mapping: {
//           txn_id: 'transaction_id'
//         }
//       });

//       // afterCreate rabbit insert
//       var MqTransaction = db.amqp.schema('Transaction', {
//         channel_id:       { type: 'text',     required: true },
//         date:             { type: 'text',     required: true },
//         event_id:         { type: 'timeuuid', required: true },
//         transaction_id:   { type: 'uuid',     required: true },
//         source_system_id: { type: 'text',     required: true },
//         target_system_id: { type: 'text',     required: true },
//         subject_id:       { type: 'text',     required: true },
//         sender_id:        { type: 'text',     required: true },
//         recipient_id:     { type: 'text',     required: true },
//         data_id:          { type: 'text',     required: true },
//         event_status:     { type: 'text',     required: true }
//       });

//       var Transaction = db.model('Transaction', [
//                                                   CaTransaction,
//                                                   MyTransaction,
//                                                   MqTransaction
//                                                 ]);

//       var transaction = {
//         channel_id:       chance.word(),
//         date:             chance.date({string: true}),
//         event_id:         cassandra.types.timeuuid(),
//         transaction_id:   cassandra.types.uuid(),
//         source_system_id: chance.word(),
//         target_system_id: chance.word(),
//         subject_id:       chance.word(),
//         sender_id:        chance.word(),
//         recipient_id:     chance.word(),
//         data_id:          chance.word(),
//         event_status:     chance.word()
//       }

//       Transaction.create(transaction, done);
//     });
//   });
// });
