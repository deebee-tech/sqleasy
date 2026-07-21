-- MySQL rendering of the shared harness schema. See harness/README.md and postgres.sql for the
-- rationale behind the schema and the deliberately awkward data.
--
-- MySQL-specific renderings of the one logical schema:
--   SERIAL        -> INT AUTO_INCREMENT
--   BOOLEAN       -> BOOLEAN (a TINYINT(1) alias; the catalog reports tinyint(1))
--   NUMERIC(12,2) -> DECIMAL(12,2)
--   TIMESTAMP     -> DATETIME (TIMESTAMP would carry timezone conversion and a 2038 range limit)

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
  CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers (id)
);

CREATE INDEX orders_customer_idx ON orders (customer_id);

CREATE VIEW active_customers AS
  SELECT id, email FROM customers WHERE is_active = TRUE;

INSERT INTO customers (email, display_name, is_active, created_at) VALUES
  ('ada@example.com',   'Ada Lovelace', TRUE,  '2024-01-15 09:30:00'),
  ('grace@example.com', NULL,           TRUE,  '2024-02-20 14:45:00'),
  ('alan@example.com',  'Alan Turing',  FALSE, '2024-03-05 08:00:00');

INSERT INTO orders (customer_id, total, big_ref, note, placed_at) VALUES
  (1, 19.99,      9007199254740993, 'first order', '2024-04-01 10:00:00'),
  (1, 1234567.89, NULL,             NULL,          '2024-04-02 11:15:00'),
  (2, 0.01,       42,               'tiny',        '2024-04-03 12:30:00');
