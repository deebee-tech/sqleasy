import { DatabaseType } from '../enums/database-type';

/**
 * How a dialect is named in a refusal message, so every one of them reads `<Dialect> has no ...`.
 *
 * Refusals are part of the contract — the golden corpus pins their exact text and every language
 * port reproduces it — so the spelling has to come from one place rather than being retyped at each
 * throw site.
 *
 * `Unknown` is a real member of {@link DatabaseType} and reaches here whenever a dialect branch
 * falls through, so it gets a reading that is honest about not knowing rather than blaming whichever
 * engine happened to be last in the chain.
 */
export const dialectDisplayName = (databaseType: DatabaseType): string =>
  ({
    [DatabaseType.Mssql]: 'MSSQL',
    [DatabaseType.Mysql]: 'MySQL',
    [DatabaseType.Postgres]: 'Postgres',
    [DatabaseType.Sqlite]: 'SQLite',
    [DatabaseType.Unknown]: 'This dialect',
  })[databaseType];
