-- MySQL rendering of the shared harness schema. See harness/README.md and postgres.sql for the
-- rationale behind the schema and the deliberately awkward data.
--
-- MySQL-specific renderings of the one logical schema:
--   SERIAL        -> INT AUTO_INCREMENT
--   BOOLEAN       -> BOOLEAN (a TINYINT(1) alias; the catalog reports tinyint(1))
--   NUMERIC(12,2) -> DECIMAL(12,2)
--   TIMESTAMP     -> DATETIME (TIMESTAMP would carry timezone conversion and a 2038 range limit)
--   TIMESTAMPTZ   -> TIMESTAMP (the ONLY MySQL type that stores an instant — see seen_at below)
--
-- WHY `seen_at` DOES NOT AGREE WITH THE OTHER THREE RENDERINGS, AND MUST NOT BE MADE TO:
-- MySQL stores a TIMESTAMP as UTC, so on paper it holds the same instant Postgres and SQL Server do.
-- The instant cannot survive the trip out, though: the server converts it into the SESSION time zone
-- and puts ZONE-LESS digits on the wire, so a driver receives a wall clock and has no offset to
-- reconstruct the instant from. The engine therefore reports this column as `naive` on both ports and
-- writes the digits with NO designator — exactly true, and independent of the reading machine's TZ.
-- Claiming the instant instead is not hypothetical: it was the live behaviour for a few hours and made
-- one stored row read as two different instants under two different TZ settings.
-- So corpus C records a MySQL `overrides` entry for this column rather than pretending to parity. The
-- digits below happen to match the UTC ones because this harness's server runs `time_zone = SYSTEM`
-- over a UTC container; the missing `Z` is the divergence, and it is the honest one.

DROP VIEW IF EXISTS active_customers;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;

-- Idempotent, like the MSSQL rendering: `pnpm harness:seed` PIPES this file in on every run, so
-- it must be safe to re-apply over an existing schema.
CREATE TABLE customers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255) NOT NULL,
  display_name TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   DATETIME NOT NULL
);

CREATE UNIQUE INDEX customers_email_key ON customers (email);

CREATE TABLE orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  total       DECIMAL(12, 2) NOT NULL,
  big_ref     BIGINT,
  note        TEXT,
  placed_at   DATETIME NOT NULL,
  seen_at     TIMESTAMP NOT NULL,
  CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers (id)
);

CREATE INDEX orders_customer_idx ON orders (customer_id);

CREATE VIEW active_customers AS
  SELECT id, email FROM customers WHERE is_active = TRUE;

INSERT INTO customers (email, display_name, is_active, created_at) VALUES
  ('ada@example.com',   'Ada Lovelace', TRUE,  '2024-01-15T09:30:00'),
  ('grace@example.com', NULL,           TRUE,  '2024-02-20T14:45:00'),
  ('alan@example.com',  'Alan Turing',  FALSE, '2024-03-05T08:00:00');

-- The seen_at literals carry their OFFSET (MySQL 8.0.19+ accepts one in a datetime literal), so this
-- file states the same three instants the other three renderings do rather than pre-converting them
-- to UTC by hand. The server does the conversion, which is the behaviour under test.
INSERT INTO orders (customer_id, total, big_ref, note, placed_at, seen_at) VALUES
  (1, 19.99,      9007199254740993, 'first order', '2024-04-01T10:00:00', '2024-04-01 10:00:00-04:00'),
  (1, 1234567.89, NULL,             NULL,          '2024-04-02T11:15:00', '2024-04-02 11:15:00+09:00'),
  (2, 0.01,       42,               'tiny',        '2024-04-03T12:30:00', '2024-04-03 12:30:00+05:30');
