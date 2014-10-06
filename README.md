MultiStore [![Build Status](https://travis-ci.org/majimboo/node-multistore.svg?branch=master)](https://travis-ci.org/majimboo/node-multistore)
==========

Simple Node.JS O[R/D]M.

Testing
-------

- [Repo Test](https://github.com/majimboo/node-multistore/blob/master/test/repo.js)

Example
-------

    var Store = require('multistore');

    // ordering gives priority. In this configuration cassandra
    // is the highest priority. If cassandra fails, the lower
    // priorities does not execute.
    var db = new Store({
      cassandra: {
        on            : 'create',
        contactPoints : ['localhost'],
        keyspace      : 'medintegrate'
      },
      amqp: {
        after    : 'create',
        host     : 'amqp://localhost',
        // will act as default ex and key if no schema options are given
        exchange : 'default',
        key      : 'default'
      },
      mysql: {
        on              : 'create',
        connectionLimit : 10,
        host            : 'localhost',
        user            : 'root',
        database        : 'medintegrate'
      }
    });

    // load all adapters
    db.init(callback);

    // if a required field is missing schema throws an error
    var schema = {
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
    };

    // this defines a universal schema that conforms to each adapter.
    // there is also an option to create a schema for a specific adapter
    // Example:
    //   db.cassanda.schema('Transactions'...
    TransactionSchema = db.schema('transaction_logs', schema, {
      // including optional adapter specific options
      // if included here it modifies how all insert or actions behave
      cassandra: { table: 'transaction_logs' },
      mysql: {
        table: 'transactions',
        mapping: {
          txn_id: 'transaction_id'
        }
      },
      amqp: { exchange: 'myexchange', key: 'mykey' }
    });

    // define a model
    var Transaction = db.model('Transaction', [TransactionSchema]);

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
      event_status:     chance.word(),
      i_get_ignored:   'because I am not defined in db.schema()' // wont be inserted
    }

    // insert to specific adapter
    // if 2nd argument is an array, it gets inserted in batch
    // if its an object it gets inserted with execute prepared.
    db.cassandra.insert('transaction_logs', transaction, done_callback);

    // if included, it modifies how each insert or actions behave
    var options = {
      amqp: {
        key: 'export',
        exchange: 'caresharing.medintegrate'
      }
    };

    // inserts to all schema/adapters given to model
    // in this case it is:
    //    - create: cassandra
    //    - create: mysql
    //    - afterCreate: amqp
    Transaction.create(transaction, options, done);
