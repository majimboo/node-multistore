MultiStore
==========

Simple Node.JS O[R/D]M.

Example
-------

    var Store = require('multistore');

    // ordering gives priority. In this configuration cassandra
    // is the highest priority. If cassandra fails, the lower
    // priorities does not execute.
    var store = new Store({
      cassandra: {
        contacts: ['localhost'],
        keyspace: 'medintegrate'
      },
      amqp: {
        host: 'amqp://localhost'
      }
    });

    // load all adapters
    store.init(done_callback);

    // define a schema
    store.schema('transaction_logs', {
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

    // if a required field is missing it throws an error
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
      i_get_ignored:   'because I am not defined in store.schema()' // wont be inserted
    }

    // insert to all active adapters
    // in this case: cassandra then amqp
    store.insert('transaction_logs', transaction, done_callback);

    // insert to specific adapter
    // if 2nd argument is an array, it gets inserted in batch
    // if its an object it gets inserted with execute prepared.
    store.cassandra.insert('transaction_logs', transaction, done_callback);
