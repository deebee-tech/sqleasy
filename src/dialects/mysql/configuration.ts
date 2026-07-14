import type { Dialect } from '../../configuration/configuration';
import { RuntimeConfiguration } from '../../configuration/runtime';
import { DatabaseType } from '../../enums/database-type';

/**
 * The MySQL {@link Dialect}: backtick identifiers, `?` placeholders, no default owner.
 *
 * @param rc - Runtime options (e.g. row limits) bound to the returned dialect.
 */
export const mysqlConfiguration = (
  rc: RuntimeConfiguration = new RuntimeConfiguration(),
): Dialect => ({
  databaseType: DatabaseType.Mysql,
  defaultOwner: '',
  identifierDelimiters: { begin: '`', end: '`' },
  preparedStatementPlaceholder: '?',
  runtimeConfiguration: rc,
  transactionDelimiters: { begin: 'START TRANSACTION', end: 'COMMIT' },
});
