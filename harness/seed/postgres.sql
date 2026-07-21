-- Postgres rendering of the shared harness schema. See harness/README.md.
--
-- One logical schema, four renderings. All four must introspect to the SAME canonical shape (modulo
-- the raw per-dialect `dataType` string), and the same query must normalize to the SAME rows.
--
-- The data is chosen to expose the divergences the 2026-07-19 audit found:
--   • orders.big_ref carries 9007199254740993 (2^53 + 1) — past IEEE-754 exact integer range, so any
--     port that routes a BIGINT through a double silently corrupts it (the MySQL BIGINT finding, and
--     the Dart int/double split between native and web).
--   • orders.total is DECIMAL(12,2) with 1234567.89 — MSSQL used to return DECIMAL as a lossy float.
--   • Nullable columns carry real NULLs, so "absent" and "null" cannot be conflated.
-- Timestamps are fixed literals, never now(), so rows are byte-comparable across runs and dialects.

CREATE TABLE customers (
  id           SERIAL PRIMARY KEY,
  email        VARCHAR(255) NOT NULL,
  display_name TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX customers_email_key ON customers (email);

CREATE TABLE orders (
  id          SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers (id),
  total       NUMERIC(12, 2) NOT NULL,
  big_ref     BIGINT,
  note        TEXT,
  placed_at   TIMESTAMP NOT NULL
);

CREATE INDEX orders_customer_idx ON orders (customer_id);

CREATE VIEW active_customers AS
  SELECT id, email FROM customers WHERE is_active = TRUE;

-- Identity columns assign 1,2,3 in insert order; orders reference those ids.
INSERT INTO customers (email, display_name, is_active, created_at) VALUES
  ('ada@example.com',   'Ada Lovelace', TRUE,  '2024-01-15T09:30:00'),
  ('grace@example.com', NULL,           TRUE,  '2024-02-20T14:45:00'),
  ('alan@example.com',  'Alan Turing',  FALSE, '2024-03-05T08:00:00');

INSERT INTO orders (customer_id, total, big_ref, note, placed_at) VALUES
  (1, 19.99,      9007199254740993, 'first order', '2024-04-01T10:00:00'),
  (1, 1234567.89, NULL,             NULL,          '2024-04-02T11:15:00'),
  (2, 0.01,       42,               'tiny',        '2024-04-03T12:30:00');
