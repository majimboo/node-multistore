var Store = require('./store');

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
  create: ['cassandra', 'mysql'],
  afterCreate: ['amqp'] // do after create event
});

store.schema('cassandra', 'data_points', {
  uid:        { type: 'string',          required: true },
  system_id:  { type: 'string',          required: true },
  code:       { type: 'timeuuid',        required: true },
  journal_id: { type: 'uuid',            required: true }
}, {
  table: 'data_points' // optional. will use schema name if not defined.
});

store.schema('mysql', 'data_points_0', {
  id:   { type: 'integer', required: true },
  code: { type: 'string',  required: true }
}, {
  table: 'data_points_0',
  map: {
    id: 'uid'
  }
});

store.schema('mysql', 'patient_profile', {
  id:          { type: 'integer', required: true },
  system_code: { type: 'integer', required: true }
}, {
  table: 'patient_profile',
  map: {
    id: 'uid',
    system_code: 'system_id'
  }
});

store.schema('mysql', 'profiles', {
  id:           { type: 'integer', required: true },
  medsafe_guid: { type: 'integer', required: true }
}, {
  table: 'profiles',
  map: {
    id: 'uid',
    medsafe_guid: 'uid'
  }
});

var DataPoint = store.model('DataPoint', {
  cassandra: ['data_points'], // schema names
  mysql: ['data_points_0', 'patient_profile', 'profiles']
});

DataPoint.create({
  uid:        'foo',
  system_id:  'bar',
  code:       'baz',
  journal_id: 123
}, function (err, res) {

});
