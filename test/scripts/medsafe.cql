CREATE KEYSPACE IF NOT EXISTS medsafe_test
  with replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE medsafe_test;

-- delete table if exist
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS data_points;
DROP TABLE IF EXISTS data_points_by_set;
DROP TABLE IF EXISTS data_points_by_cutoff;

CREATE TABLE profiles (
  uid text,
  system_id text,
  created_at timestamp,
  primary key ((uid, system_id))
);

CREATE TABLE data_points (
  system_id text,
  uid text,
  code text,
  journal_id timeuuid,
  set_id text,
  sequence_id text,
  data_type text,
  value text,
  attributes map<text, text>,
  source map<text, text>,
  applied_at timestamp,
  applied_status text,
  available_at timestamp,
  translated_at timestamp,
  deleted boolean,
  primary key ((system_id, uid), code, journal_id)
);

CREATE TABLE data_points_by_set (
  system_id text,
  uid text,
  set_id text,
  code text,
  sequence_id text,
  journal_id timeuuid,
  primary key ((system_id, uid, set_id), code, sequence_id)
);

CREATE TABLE data_points_by_cutoff (
  system_id text,
  code text,
  available_at timestamp,
  uid text,
  primary key ((system_id, code), available_at, uid)
);
