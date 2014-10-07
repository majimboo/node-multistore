CREATE KEYSPACE IF NOT EXISTS medintegrate
  WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE medintegrate;

-- delete table if exist
DROP TABLE IF EXISTS transaction_logs;
-- create transaction_logs
CREATE TABLE transaction_logs
(
  channel_id text,
  date text,
  event_id timeuuid,
  transaction_id uuid,
  source_system_id text,
  target_system_id text,
  subject_id text,
  sender_id text,
  recipient_id text,
  data_id text,
  event_status text,
  primary key ((channel_id, date), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);
