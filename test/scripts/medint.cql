CREATE KEYSPACE medintegrate
  WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE medintegrate;

-- create transaction_logs
CREATE TABLE transaction_logs
(
  channel_id text,
  date text,
  event_id timeuuid,
  transaction_id text,
  source_system_id text,
  target_system_id text,
  subject_id text,
  sender_id text,
  recipient_id text,
  data_id text,
  event_status text,
  primary key ((channel_id, date), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);
