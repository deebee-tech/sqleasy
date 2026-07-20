// A COMPILE-ERROR fixture — every statement below is expected to FAIL analysis, because it calls a
// method a dialect's view does not expose. `test/views_ceiling_test.dart` runs `dart analyze` on this
// file and asserts each expected error is present; it is the Dart analog of TypeScript's
// `@ts-expect-error` block in `typed-views.test.ts`.
//
// This directory is EXCLUDED from the package's own `dart analyze` gate (see analysis_options.yaml),
// so these deliberate errors do not fail the build — only the ceiling test, which targets the file
// explicitly, sees them.
//
// ignore_for_file: unused_local_variable
import 'package:sqleasy/sqleasy.dart';

// top() is MSSQL-only (T-SQL keyword; the row cap elsewhere is limit()).
void topIsMssqlOnly() {
  PostgresQuery()
      .newBuilder()
      .top(5); // expect-error: top on PostgresQueryBuilder
  MysqlQuery().newBuilder().top(5); // expect-error: top on MysqlQueryBuilder
  SqliteQuery().newBuilder().top(5); // expect-error: top on SqliteQueryBuilder
}

// merge() is native T-SQL only.
void mergeIsMssqlOnly() {
  PostgresQuery()
      .newBuilder()
      .merge((m) {}); // expect-error: merge on PostgresQueryBuilder
}

// distinctOn() is Postgres-only.
void distinctOnIsPostgresOnly() {
  MssqlQuery()
      .newBuilder()
      .distinctOn([]); // expect-error: distinctOn on MssqlQueryBuilder
}

// MSSQL has no shared row lock and no upsert.
void mssqlLacks() {
  MssqlQuery()
      .newBuilder()
      .forShare(); // expect-error: forShare on MssqlQueryBuilder
  MssqlQuery()
      .newBuilder()
      .onConflictDoNothing(); // expect-error: onConflictDoNothing on MssqlQueryBuilder
}

// MySQL has no RETURNING and no WITH TIES.
void mysqlLacks() {
  MysqlQuery()
      .newBuilder()
      .returning(['id']); // expect-error: returning on MysqlQueryBuilder
  MysqlQuery()
      .newBuilder()
      .limitWithTies(5); // expect-error: limitWithTies on MysqlQueryBuilder
}

// Index hints are MySQL-only, so absent on the Postgres view.
void hintsAreMysqlOnly() {
  PostgresQuery().newBuilder().hintUseIndex(
      'u', 'idx'); // expect-error: hintUseIndex on PostgresQueryBuilder
}

// Engine-native renames: each dialect shows only its own spelling. The generic name is hidden where
// the engine-native alias is shown, and the alias is absent on dialects it does not belong to.
void engineNativeRenames() {
  MssqlQuery()
      .newBuilder()
      .forUpdate(); // expect-error: forUpdate renamed to updlock on MSSQL
  MysqlQuery()
      .newBuilder()
      .onConflictDoNothing(); // expect-error: onConflictDoNothing renamed to insertIgnore on MySQL
  PostgresQuery().newBuilder().updlock(); // expect-error: updlock is MSSQL-only
  PostgresQuery()
      .newBuilder()
      .insertIgnore(); // expect-error: insertIgnore is MySQL-only
}

// SQLite is the narrowest — no stored procedures, no row locking.
void sqliteLacks() {
  SqliteQuery()
      .newBuilder()
      .callProcedure('p'); // expect-error: callProcedure on SqliteQueryBuilder
  SqliteQuery()
      .newBuilder()
      .forUpdate(); // expect-error: forUpdate on SqliteQueryBuilder
}

// The ceiling holds ONE LEVEL DOWN: a subquery callback's builder is the SAME narrow view, so a
// wrong-dialect method is just as absent inside the callback.
void callbackNarrowsToTheView() {
  PostgresQuery().newBuilder().fromWithBuilder('s', (inner) {
    inner.top(5); // expect-error: top on the inner PostgresQueryBuilder
  });
}

// The ceiling also holds inside a MERGE USING (SELECT ...) subquery. MERGE is MSSQL-only, so its
// using-select builder is the MSSQL view — a Postgres-only method is absent there too.
void mergeUsingSelectNarrows() {
  MssqlQuery().newBuilder().merge((m) {
    m.usingSelect('s', (sub) {
      sub.distinctOn(
        const [],
      ); // expect-error: distinctOn on the inner MssqlQueryBuilder
    });
  });
}
