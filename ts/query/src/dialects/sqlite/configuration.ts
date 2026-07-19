import type { Dialect } from '../../configuration/configuration';
import { RuntimeConfiguration } from '../../configuration/runtime';
import { DatabaseType } from '../../enums/database-type';

/**
 * The SQLite {@link Dialect}: double-quoted identifiers, `?` placeholders, no default owner.
 *
 * @param rc - Runtime options (e.g. row limits) bound to the returned dialect.
 */
export const sqliteConfiguration = (
  rc: RuntimeConfiguration = new RuntimeConfiguration(),
): Dialect => ({
  databaseType: DatabaseType.Sqlite,
  defaultOwner: '',
  identifierDelimiters: { begin: '"', end: '"' },
  preparedStatementPlaceholder: '?',
  runtimeConfiguration: rc,
  transactionDelimiters: { begin: 'BEGIN', end: 'COMMIT' },
});
