MultiStore [![Build Status](https://travis-ci.org/majimboo/node-multistore.svg?branch=master)](https://travis-ci.org/majimboo/node-multistore)
==========

Simple Node.JS O[R/D]M.

Testing
-------

- [Data Points](https://github.com/majimboo/node-multistore/blob/master/test/medsafe/datapoint.js)
- [Data Point Schema](https://github.com/majimboo/node-multistore/blob/master/test/medsafe/helper.js)

Example
-------

    var db = require('../../');

    db.init({
      cassandra: {
        on: 'create',
        contactPoints: ['localhost'],
        keyspace: 'medsafe'
      }
    }, done);

    var DataPoints = db.cassandra.schema('DataPoints', {
      system_id: {
        type: 'text',
        required: true,
        morph: toUpperCase
      },
      uid: {
        type: 'text',
        required: true,
        morph: toLowerCase
      },
      code: {
        type: 'text',
        required: true,
        morph: toUpperCase
      },
      journal_id: {
        type: 'timeuuid',
        default: uuid.v1
      },
      set_id: {
        type: 'text',
        required: true,
        morph: toUpperCase
      },
      sequence_id: {
        type: 'text',
        default: '',
        morph: toUpperCase
      },
      data_type: {
        type: 'text',
        required: false,
        morph: toUpperCase
      },
      value: 'text',
      attributes: 'map',
      source: 'map',
      applied_at: {
        type: 'timestamp',
        morph: getTime
      },
      applied_status: {
        type: 'text',
        required: true
      },
      available_at: {
        type: 'timestamp',
        morph: getTime
      },
      translated_at: {
        type: 'timestamp',
        morph: getTime
      },
      deleted: 'boolean'
    }, {
      table: 'data_points'
    });

    var Profiles = db.cassandra.schema('Profiles', {
      uid: {
        type: 'text',
        required: true,
        morph: toLowerCase
      },
      system_id: {
        type: 'text',
        required: true,
        morph: toUpperCase
      },
      created_at: {
        type: 'timestamp',
        default: Date.now
      }
    }, {
      table: 'profiles',
      condition: 'IF NOT EXISTS'
    });

    var DataPointsBySet = db.cassandra.schema('DataPointsBySet', {
      system_id: {
        type: 'text',
        required: true,
        morph: toUpperCase
      },
      uid: {
        type: 'text',
        required: true,
        morph: toLowerCase
      },
      set_id: {
        type: 'text',
        required: true
      },
      code: {
        type: 'text',
        required: true,
        morph: toUpperCase
      },
      sequence_id: {
        type: 'text',
        default: '',
        morph: toUpperCase
      },
      journal_id: {
        type: 'timeuuid',
        default: uuid.v1
      }
    }, {
      table: 'data_points_by_set'
    });

    var DataPointsByCutoff = db.cassandra.schema('DataPointsByCutoff', {
      system_id: {
        type: 'text',
        required: true,
        morph: toUpperCase
      },
      code: {
        type: 'text',
        required: true,
        morph: toUpperCase
      },
      available_at: {
        type: 'timestamp',
        morph: getTime
      },
      uid: {
        type: 'text',
        required: true
      }
    }, {
      table: 'data_points_by_cutoff'
    });

    var ModelSchema = [
      DataPoints,
      Profiles,
      DataPointsBySet,
      DataPointsByCutoff
    ];

    var DataPoint = db.model('DataPoint', ModelSchema);

    DataPoint.create(dataPoint, done);
