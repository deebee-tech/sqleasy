import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { mssqlStatementTop } from './default-mutation-row-cap';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import { emitMssqlOutputClause } from './default-returning';
import { emitUpsertClause, isMysqlInsertIgnore } from './default-upsert';
import type { ToSqlOptions } from './to-sql';
import { defaultToSql } from './to-sql';

export const defaultInsert = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (!state.insertState) {
    throw new ParserError(ParserArea.Insert, 'No insert state provided');
  }

  const insertState = state.insertState;

  if (insertState.raw) {
    sqlHelper.addSqlSnippet(insertState.raw);
    return sqlHelper;
  }

  // T-SQL has NO upsert primitive. `onConflict*()` used to be answered here by abandoning the
  // INSERT grammar entirely and synthesizing a MERGE — a different statement, with different
  // atomicity, trigger and error semantics, that the caller never wrote and could not see.
  //
  // It was also unsafe as written. An un-hinted MERGE used as an upsert is race-prone at READ
  // COMMITTED and can raise a duplicate-key violation under concurrency, which is exactly what
  // ON CONFLICT and ON DUPLICATE KEY UPDATE never do. This repo already knows that — forShare
  // emits WITH (HOLDLOCK) — so its absence here was an oversight rather than a decision.
  //
  // MERGE is genuine, native T-SQL and should come back as an explicit surface the caller opts
  // into knowingly, named in T-SQL's own vocabulary. That belongs with the per-engine typed
  // builders; until then, refusing is the honest answer, because MSSQL has no upsert.
  if (state.upsertState && config.databaseType === DatabaseType.Mssql) {
    throw new ParserError(
      ParserArea.Insert,
      'MSSQL has no upsert — T-SQL expresses this with MERGE, which is a different statement ' +
        'with different concurrency semantics; write it explicitly',
    );
  }

  if (!insertState.tableName) {
    throw new ParserError(ParserArea.Insert, 'INSERT requires a table');
  }

  sqlHelper.addSqlSnippet('INSERT ');
  // T-SQL: `INSERT TOP (n) INTO t …` — between the verb and INTO. Measured: caps the statement.
  sqlHelper.addSqlSnippet(mssqlStatementTop(state, config));

  if (isMysqlInsertIgnore(state.upsertState, config)) {
    sqlHelper.addSqlSnippet('IGNORE ');
  }

  sqlHelper.addSqlSnippet('INTO ');

  if (insertState.owner && insertState.owner !== '') {
    if (config.databaseType === DatabaseType.Mysql) {
      throw new ParserError(ParserArea.Insert, 'MySQL does not support table owners');
    }
    sqlHelper.addSqlSnippet(quoteIdentifier(insertState.owner, config.identifierDelimiters));
    sqlHelper.addSqlSnippet('.');
  }

  sqlHelper.addSqlSnippet(quoteIdentifier(insertState.tableName, config.identifierDelimiters));

  if (insertState.columns.length > 0) {
    sqlHelper.addSqlSnippet(' (');
    for (let i = 0; i < insertState.columns.length; i++) {
      sqlHelper.addSqlSnippet(quoteIdentifier(insertState.columns[i], config.identifierDelimiters));

      if (i < insertState.columns.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    }
    sqlHelper.addSqlSnippet(')');
  }

  // T-SQL requires OUTPUT before VALUES; PG/SQLite/MySQL's RETURNING/ON DUPLICATE equivalents
  // are trailing clauses, handled by the caller (`to-sql.ts`) after this statement returns.
  if (state.returningState && config.databaseType === DatabaseType.Mssql) {
    emitMssqlOutputClause(sqlHelper, config, state.returningState, 'INSERTED', ParserArea.Insert);
  }

  if (insertState.selectSubquery) {
    if (insertState.values.length > 0) {
      throw new ParserError(
        ParserArea.Insert,
        'INSERT cannot combine a SELECT source with VALUES rows',
      );
    }

    sqlHelper.addSqlSnippet(' ');

    const subHelper = defaultToSql(insertState.selectSubquery, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());

    if (state.upsertState) {
      emitUpsertClause(sqlHelper, config, state.upsertState, ParserArea.Insert);
    }

    return sqlHelper;
  }

  if (insertState.values.length === 0) {
    throw new ParserError(ParserArea.Insert, 'INSERT requires at least one VALUES row');
  }

  const columnCount = insertState.columns.length;

  sqlHelper.addSqlSnippet(' VALUES ');

  for (let r = 0; r < insertState.values.length; r++) {
    sqlHelper.addSqlSnippet('(');

    const row = insertState.values[r]!;

    if (columnCount > 0 && row.length !== columnCount) {
      throw new ParserError(
        ParserArea.Insert,
        `INSERT column count (${columnCount}) does not match value count (${row.length}) for row ${r + 1}`,
      );
    }

    for (let c = 0; c < row.length; c++) {
      sqlHelper.addDynamicValue(row[c]);

      if (c < row.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    }

    sqlHelper.addSqlSnippet(')');

    if (r < insertState.values.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }

  if (state.upsertState) {
    emitUpsertClause(sqlHelper, config, state.upsertState, ParserArea.Insert);
  }

  return sqlHelper;
};
