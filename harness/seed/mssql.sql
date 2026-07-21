-- MSSQL rendering of the shared harness schema. See harness/README.md and postgres.sql for the
-- rationale behind the schema and the deliberately awkward data.
--
-- Unlike the Postgres and MySQL images, the SQL Server image has NO /docker-entrypoint-initdb.d
-- mechanism, so this file is applied explicitly AFTER the container is healthy (`pnpm harness:seed`)
-- by PIPING it in -- never by bind-mounting it and passing -i, which pins the container to the
-- inode this file had when the container started. It is therefore responsible for creating its own
-- database, and must be idempotent.
--
-- MSSQL-specific renderings of the one logical schema:
--   SERIAL        -> INT IDENTITY(1,1)
--   BOOLEAN       -> BIT (no boolean type; DEFAULT 1 for true)
--   TEXT          -> NVARCHAR(MAX) (TEXT is deprecated)
--   TIMESTAMP     -> DATETIME2 (TIMESTAMP in T-SQL is a rowversion, not a time at all)
--   TIMESTAMPTZ   -> DATETIMEOFFSET (the only T-SQL type that stores an offset alongside the clock)
--
-- The PRIMARY KEY constraints are NAMED here, unlike the other three renderings, because SQL Server
-- is the only one whose auto-generated name is not reproducible: it mints `PK__customers__3213E83F`
-- plus a random hex suffix that changes every time the table is recreated. Introspection reports the
-- backing index by name, so an unnamed PK would make that golden unpinnable. Postgres derives
-- `customers_pkey` deterministically and MySQL always calls it `PRIMARY`; only this one needs saying
-- out loud.

IF DB_ID('sqleasy_ci') IS NULL CREATE DATABASE sqleasy_ci;
GO

USE sqleasy_ci;
GO

DROP VIEW IF EXISTS active_customers;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;
GO

CREATE TABLE customers (
  id           INT IDENTITY(1,1) CONSTRAINT customers_pkey PRIMARY KEY,
  email        NVARCHAR(255) NOT NULL,
  display_name NVARCHAR(MAX) NULL,
  is_active    BIT NOT NULL CONSTRAINT customers_is_active_df DEFAULT 1,
  created_at   DATETIME2 NOT NULL
);
GO

CREATE UNIQUE INDEX customers_email_key ON customers (email);
GO

CREATE TABLE orders (
  id          INT IDENTITY(1,1) CONSTRAINT orders_pkey PRIMARY KEY,
  customer_id INT NOT NULL,
  total       DECIMAL(12, 2) NOT NULL,
  big_ref     BIGINT NULL,
  note        NVARCHAR(MAX) NULL,
  placed_at   DATETIME2 NOT NULL,
  seen_at     DATETIMEOFFSET NOT NULL,
  CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers (id)
);
GO

CREATE INDEX orders_customer_idx ON orders (customer_id);
GO

CREATE VIEW active_customers AS
  SELECT id, email FROM customers WHERE is_active = 1;
GO

INSERT INTO customers (email, display_name, is_active, created_at) VALUES
  ('ada@example.com',   'Ada Lovelace', 1, '2024-01-15T09:30:00'),
  ('grace@example.com', NULL,           1, '2024-02-20T14:45:00'),
  ('alan@example.com',  'Alan Turing',  0, '2024-03-05T08:00:00');
GO

INSERT INTO orders (customer_id, total, big_ref, note, placed_at, seen_at) VALUES
  (1, 19.99,      9007199254740993, 'first order', '2024-04-01T10:00:00', '2024-04-01T10:00:00-04:00'),
  (1, 1234567.89, NULL,             NULL,          '2024-04-02T11:15:00', '2024-04-02T11:15:00+09:00'),
  (2, 0.01,       42,               'tiny',        '2024-04-03T12:30:00', '2024-04-03T12:30:00+05:30');
GO
