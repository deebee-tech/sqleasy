-- SQLite rendering of the shared harness schema. See harness/README.md and postgres.sql for the
-- rationale behind the schema and the deliberately awkward data.
--
-- SQLite has NO container in docker-compose.harness.yml — each language port opens a file or
-- in-memory database and applies this file directly.
--
-- SQLite-specific renderings of the one logical schema:
--   SERIAL        -> INTEGER PRIMARY KEY AUTOINCREMENT (the rowid alias)
--   BOOLEAN       -> INTEGER (no boolean type; 1/0)
--   NUMERIC(12,2) -> TEXT — see below
--   TIMESTAMP     -> TEXT (ISO-8601; SQLite has no date type)
--
-- WHY DECIMAL IS **TEXT** HERE (decided 2026-07-20): SQLite has no fixed-point type. Declaring the
-- column NUMERIC gives it REAL affinity, so 1234567.89 is stored as a float and the exact value is
-- lost AT REST — the driver never had a chance. Postgres and MySQL both hand decimals back as exact
-- strings, so "decimal is a string" is the canonical form; TEXT is the only SQLite rendering that can
-- actually reach it. This library does not ship approximations, so it stores the digits.
--
-- The honest trade-off: a TEXT-affinity column follows SQLite's text comparison rules, so ordering
-- and range predicates on `total` are lexicographic unless the query casts (`CAST(total AS REAL)`).
-- Exactness is preserved; numeric comparison becomes explicit. That is the deliberate choice —
-- silently rounding money to make `>` convenient is the trade this project refuses.
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
  total       TEXT NOT NULL,
  big_ref     BIGINT,
  note        TEXT,
  placed_at   TEXT NOT NULL
);

CREATE INDEX orders_customer_idx ON orders (customer_id);

CREATE VIEW active_customers AS
  SELECT id, email FROM customers WHERE is_active = 1;

INSERT INTO customers (email, display_name, is_active, created_at) VALUES
  ('ada@example.com',   'Ada Lovelace', 1, '2024-01-15T09:30:00'),
  ('grace@example.com', NULL,           1, '2024-02-20T14:45:00'),
  ('alan@example.com',  'Alan Turing',  0, '2024-03-05T08:00:00');

-- The decimals are QUOTED: an unquoted 19.99 is parsed as a REAL first and only then coerced to the
-- column's TEXT affinity, which would round-trip the value through the float we are trying to avoid.
-- Quoting stores the digits verbatim.
INSERT INTO orders (customer_id, total, big_ref, note, placed_at) VALUES
  (1, '19.99',      9007199254740993, 'first order', '2024-04-01T10:00:00'),
  (1, '1234567.89', NULL,             NULL,          '2024-04-02T11:15:00'),
  (2, '0.01',       42,               'tiny',        '2024-04-03T12:30:00');
