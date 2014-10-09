'use strict';

var _      = require('lodash');
var uuid   = require('node-uuid');
var chance = require('chance').Chance();
var moment = require('moment');
var purr   = require('purr');
var mysql  = require('mysql');
var cassandra = require('cassandra-driver');

var cassandraClient = new cassandra.Client({
  contactPoints: ['localhost'],
  keyspace:      'medsafe_test'
});

var mysqlClient  = mysql.createPool({
  connectionLimit : 10,
  user:             'root',
  database:         'medsafe_test'
});

// queries
var FETCH_DATA_POINT_QUERY =
  'SELECT * FROM data_points' +
  ' WHERE system_id = ?'      +
  ' AND uid = ?'              +
  ' AND code = ?';

var FETCH_PROFILE_QUERY =
  'SELECT * FROM profiles' +
  ' WHERE system_id = ?'      +
  ' AND uid = ?';

var FETCH_DATA_POINT_SET_QUERY =
  'SELECT * FROM data_points_by_set' +
  ' WHERE system_id = ?'      +
  ' AND uid = ?'              +
  ' AND set_id = ?'           +
  ' AND code = ?'             +
  ' AND sequence_id = ?';

var FETCH_DATA_POINT_CUTOFF_QUERY =
  'SELECT * FROM data_points_by_cutoff' +
  ' WHERE system_id = ?'  +
  ' AND code = ?'         +
  ' AND available_at = ?' +
  ' AND uid = ?';

function toUpperCase(value) {
  return value.toUpperCase();
}

function toLowerCase(value) {
  return value.toLowerCase();
}

function getTime(value) {
  return moment(value).valueOf();
}

module.exports = {
  getModel: function () {
    var db = require('../../');

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
        attributes: 'map<text, text>',
        source: 'map<text, text>',
        applied_at: {
          type: 'timestamp',
          morph: getTime
        },
        applied_status: {
          type: 'text',
          required: true,
          enum: ['', 'made', 'reported', 'prepared']
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
          required: true,
          morph: toUpperCase
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
          required: true,
          morph: toLowerCase
        }
      }, {
        table: 'data_points_by_cutoff'
      })
    }

    var Mysql = {
      DataPoints: db.mysql.schema('DataPoints', {
        code: 'text'
      }, {
        table: 'data_points',
        partition: {
          max: 5000
        }
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
        partition: {
          max: 5000
        },
        mapping: {
          key: 'attributes',
          value: 'attributes'
        },
        bulk: true,
        factory: function (data) {
          var attr = [];
          _.each(data, function (value, key) {
            attr.push({ key: key, value: value });
          });
          return attr;
        }
      })
    };

    var ModelSchemas = [
      Cassandra.DataPoints,
      Cassandra.Profiles,
      Cassandra.DataPointsBySet,
      Cassandra.DataPointsByCutoff,
      Mysql.DataPoints,
      Mysql.PatientProfiles,
      Mysql.Profiles,
      Mysql.Attributes
    ];

    var options = {
      unpack: purr.unpack,
      methods: {
        search: {
          find: Cassandra.DataPoints,
          findSet: Cassandra.DataPointsBySet
        }
      }
    };

    return db.model('DataPoints', ModelSchemas, options);
  },

  fetchDataPoint: function (params, opts, callback) {
    cassandraClient.execute(FETCH_DATA_POINT_QUERY, params, opts, callback);
  },

  fetchProfile: function (params, opts, callback) {
    cassandraClient.execute(FETCH_PROFILE_QUERY, params, opts, callback);
  },

  fetchDataPointSet: function (params, opts, callback) {
    cassandraClient.execute(FETCH_DATA_POINT_SET_QUERY, params, opts, callback);
  },

  fetchDataPointCutOff: function (params, opts, callback) {
    cassandraClient.execute(FETCH_DATA_POINT_CUTOFF_QUERY,
                            params,
                            opts,
                            callback);
  },

  fetchMyDataPoint: function (params, callback) {
    var code = params.code;
    var sql = mysql.format('SELECT * FROM data_points WHERE code = ?', code);
    mysqlClient.query(sql, callback);
  },

  generateDataPoints: function (count, options) {
    options = options || {};

    var attrs      = {};
    var source     = {};
    var dataPoints = [];
    count          = count || 1;

    var appliedStatuses = ['', 'made', 'reported', 'prepared'];

    while (count--) {
      attrs                = {};
      attrs[chance.word()] = chance.word();
      attrs[chance.word()] = chance.word();
      attrs[chance.word()] = chance.word();

      source = {
        system_id:  (options.system_id || chance.word()).toUpperCase(),
        journal_id: uuid.v1(),
        uid:        (options.uid || uuid.v4()).toLowerCase(),
        data_type:  chance.word().toUpperCase(),
        code:       (options.code || chance.word()).toUpperCase()
      };

      dataPoints.push({
        system_id:      source.system_id,
        uid:            source.uid,
        journal_id:     source.journal_id,
        data_type:      source.data_type,
        sequence_id:    chance.word().toUpperCase(),
        code:           source.code,
        value:          chance.word(),
        attributes:     attrs,
        source:         source,
        applied_at:     chance.date({year: 2013}),
        applied_status: chance.pick(options.applied_list || appliedStatuses),
        deleted:        false,
        set_id:         (options.set_id || chance.word()).toUpperCase(),
        available_at:   chance.date({year: 2013}),
        translated_at:  chance.date({year: 2013})
      });
    }

    return dataPoints;
  }
}
