API
---

    var Store = require('multistore');

    var store = new Store({
      cassandra: {
        contacts: ['localhost'],
        keyspace: 'medsafe'
      },
      amqp: {
        host: 'amqp://localhost'
      },
      mysql: {
        database: 'medsafe'
      }
    });

    store.init({
      adapters: ['cassandra', 'mysql'],
      callback: ['amqp']
    });

    // schemas
    store.schema(store.cassandra, 'data_points', {
      uid:        { type: 'string',          required: true },
      system_id:  { type: 'string',          required: true },
      code:       { type: 'timeuuid',        required: true },
      journal_id: { type: 'uuid',            required: true },
      attributes: { type: 'map<text, text>', required: true },
    }, {
      table: 'data_points'
    });

    store.schema(store.mysql, 'data_points_0', {
      id:   { type: 'integer', required: true },
      code: { type: 'string',  required: true }
    }, {
      table: 'data_points_0'
    });

    store.schema(store.mysql, 'patient_profile', {
      id:          { type: 'integer', required: true },
      system_code: { type: 'integer', required: true }
    }, {
      table: 'patient_profile'
    });

    store.schema(store.mysql, 'profiles', {
      id:           { type: 'integer', required: true },
      medsafe_guid: { type: 'integer', required: true }
    }, {
      table: 'profiles'
    });

    store.schema(store.mysql, 'attributes', {
      id:    { type: 'integer', required: true },
      key:   { type: 'string',  required: true },
      value: { type: 'string',  required: true }
    }, {
      table: 'attributes'
    });

    var DataPoint = store.model('DataPoint', {
      cassandra: ['data_points'],
      mysql: ['data_points_0', 'patient_profile', 'profiles', 'attributes']
    });

    DataPoint.create({
      uid:        'foo',
      system_id:  'bar',
      code:       'baz',
      journal_id: 123
      attributes: {}
    }, function (err, res) {

    });
