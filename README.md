MultiStore [![Build Status](https://travis-ci.org/majimboo/node-multistore.svg?branch=master)](https://travis-ci.org/majimboo/node-multistore)
==========

Simple Node.JS O[R/D]M.

Testing
-------

- [Data Points](https://github.com/majimboo/node-multistore/blob/master/test/medsafe/datapoint.js)
- [Data Point Schema](https://github.com/majimboo/node-multistore/blob/master/test/medsafe/helper.js)

Example
-------

    var _      = require('lodash');
    var db     = require('multistore');
    var uuid   = require('node-uuid');
    var moment = require('moment');

    function toUpperCase(value) {
      return value.toUpperCase();
    }

    function toLowerCase(value) {
      return value.toLowerCase();
    }

    function toTime(value) {
      return moment(value).valueOf();
    }

    db.init({
      cassandra: {
        on: 'create',
        contactPoints: ['localhost'],
        keyspace: 'medsafe'
      }
    }, done);

    var Cassandra = {
      DataPoints: db.cassandra.schema('DataPoints', {
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
        table: 'data_points',
        batch: 'one'
      }),

      Profiles: db.cassandra.schema('Profiles', {
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
      }),

      DataPointsBySet: db.cassandra.schema('DataPointsBySet', {
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
        table: 'data_points_by_set',
        batch: 'one'
      }),

      DataPointsByCutoff: db.cassandra.schema('DataPointsByCutoff', {
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
        table: 'data_points_by_cutoff',
        batch: 'one'
      })
    }

    var Mysql = {
      DataPoints: db.mysql.schema('DataPoints', {
        code: 'text'
      }, {
        table: 'data_points_0'
      }),

      PatientProfiles: db.mysql.schema('PatientProfiles', {
        system_code: 'text'
      }, {
        table: 'patient_profile',
        mapping: {
          // equivalent to cassandra
          system_code: 'system_id'
        }
      }),

      Profiles: db.mysql.schema('Profiles', {
        medsafe_guid: 'text'
      }, {
        table: 'profiles',
        mapping: {
          // equivalent to cassandra
          medsafe_guid: 'uid'
        }
      }),

      Attributes: db.mysql.schema('Attributes', {
        key: 'text',
        value: 'text'
      }, {
        table: 'attributes',
        mapping: {
          key: 'attributes',
          value: 'attributes'
        },
        bulk: true,
        factory: function (data) {
          var attr = [];
          _.each(data, function (value, key) {
            attr.push([key, value]);
          });
          return attr;
        }
      })
    };

    var ModelSchema = [
      Cassandra.DataPoints,
      Cassandra.Profiles,
      Cassandra.DataPointsBySet,
      Cassandra.DataPointsByCutoff,
      Mysql.DataPoints,
      Mysql.PatientProfiles,
      Mysql.Profiles,
      Mysql.Attributes
    ];

    var DataPoint = db.model('DataPoint', ModelSchema);

    DataPoint.create(dataPoint, done);
