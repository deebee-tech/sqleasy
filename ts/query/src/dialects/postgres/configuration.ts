import type { Dialect } from '../../configuration/configuration';
import { RuntimeConfiguration } from '../../configuration/runtime';
import { DatabaseType } from '../../enums/database-type';

/**
 * The PostgreSQL {@link Dialect}: double-quoted identifiers, `$` placeholders, `public` schema.
 *
 * @param rc - Runtime options (e.g. row limits) bound to the returned dialect.
 */
export const postgresConfiguration = (
  rc: RuntimeConfiguration = new RuntimeConfiguration(),
): Dialect => ({
  databaseType: DatabaseType.Postgres,
  defaultOwner: 'public',
  identifierDelimiters: { begin: '"', end: '"' },
  preparedStatementPlaceholder: '$',
  runtimeConfiguration: rc,
  transactionDelimiters: { begin: 'BEGIN', end: 'COMMIT' },
});
