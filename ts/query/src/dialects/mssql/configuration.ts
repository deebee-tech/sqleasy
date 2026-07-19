import type { Dialect } from '../../configuration/configuration';
import { RuntimeConfiguration } from '../../configuration/runtime';
import { DatabaseType } from '../../enums/database-type';

/**
 * The Microsoft SQL Server {@link Dialect}: bracket identifiers, `?` placeholders, `dbo` schema.
 *
 * @param rc - Runtime options (e.g. row limits) bound to the returned dialect.
 */
export const mssqlConfiguration = (
  rc: RuntimeConfiguration = new RuntimeConfiguration(),
): Dialect => ({
  databaseType: DatabaseType.Mssql,
  defaultOwner: 'dbo',
  identifierDelimiters: { begin: '[', end: ']' },
  preparedStatementPlaceholder: '?',
  runtimeConfiguration: rc,
  transactionDelimiters: { begin: 'BEGIN TRANSACTION', end: 'COMMIT TRANSACTION' },
});
