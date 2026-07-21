-- SQLite rendering of the shared harness schema. See harness/README.md and postgres.sql for the
-- rationale behind the schema and the deliberately awkward data.
--
-- SQLite has NO container in docker-compose.harness.yml — each language port opens a file or
-- in-memory database and applies this file directly.
--
-- SQLite-specific renderings of the one logical schema:
--   SERIAL        -> INTEGER PRIMARY KEY AUTOINCREMENT (the rowid alias)
--   BOOLEAN       -> INTEGER (no boolean type; 1/0)
--   NUMERIC(12,2) -> NUMERIC (affinity only — SQLite has no fixed-point type, so an exact decimal
--                    may be stored as a float. That divergence is REAL and corpus C must define the
--                    canonical form rather than hide it.)
--   TIMESTAMP     -> TEXT (ISO-8601; SQLite has no date type)
--
-- Foreign keys are declared but SQLite only ENFORCES them when `PRAGMA foreign_keys = ON` is set per
-- connection. The declaration is what introspection reads, so it belongs here regardless.

CREATE TABLE customers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        VARCHAR(255) NOT NULL,
  display_name TEXT,
  is_active    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL
);

CREATE UNIQUE INDEX customers_email_key ON customers (email);

CREATE TABLE orders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers (id),
  total       NUMERIC(12, 2) NOT NULL,
  big_ref     BIGINT,
  note        TEXT,
  placed_at   TEXT NOT NULL
);

CREATE INDEX orders_customer_idx ON orders (customer_id);

CREATE VIEW active_customers AS
  SELECT id, email FROM customers WHERE is_active = 1;

INSERT INTO customers (email, display_name, is_active, created_at) VALUES
  ('ada@example.com',   'Ada Lovelace', 1, '2024-01-15 09:30:00'),
  ('grace@example.com', NULL,           1, '2024-02-20 14:45:00'),
  ('alan@example.com',  'Alan Turing',  0, '2024-03-05 08:00:00');

INSERT INTO orders (customer_id, total, big_ref, note, placed_at) VALUES
  (1, 19.99,      9007199254740993, 'first order', '2024-04-01 10:00:00'),
  (1, 1234567.89, NULL,             NULL,          '2024-04-02 11:15:00'),
  (2, 0.01,       42,               'tiny',        '2024-04-03 12:30:00');
