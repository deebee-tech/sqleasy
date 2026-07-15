## [4.0.1](https://github.com/deebee-tech/sqleasy/compare/v4.0.0...v4.0.1) (2026-07-15)

## [4.0.0](https://github.com/deebee-tech/sqleasy/compare/v3.0.0...v4.0.0) (2026-07-15)

## [3.0.0](https://github.com/deebee-tech/sqleasy/compare/v2.0.1...v3.0.0) (2026-07-14)

## [2.0.1](https://github.com/deebee-tech/sqleasy/compare/v2.0.0...v2.0.1) (2026-07-14)

## [2.0.0](https://github.com/deebee-tech/sqleasy/compare/v1.0.2...v2.0.0) (2026-07-14)

### ⚠ BREAKING CHANGES

* dialect entry classes are renamed -- PostgresSqlEasy -> PostgresQuery,
MssqlSqlEasy -> MssqlQuery, MysqlSqlEasy -> MysqlQuery, SqliteSqlEasy -> SqliteQuery. The
I* interfaces (ISqlEasy, IBuilder, IJoinOnBuilder, IMultiBuilder) are removed; use the
concrete QueryBuilder, MultiBuilder and JoinOnBuilder types instead. MSSQL aliased DELETE
and UPDATE now emit valid T-SQL (DELETE [u] FROM ... / UPDATE [u] SET ... FROM ...), where
1.x emitted invalid syntax. Retained: multi_builder, Datatype, all four dialects, dual
ESM/CJS output, and JSR publishing. See "Migrating from 1.x" in the README.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

### Features

* consolidate DeeBee's refactored query engine as SQLEasy 2.0 ([100b1fc](https://github.com/deebee-tech/sqleasy/commit/100b1fcd4387cc7e1901b7606483f6deade064ec))

## [1.0.2](https://github.com/deebee-tech/sqleasy/compare/v1.0.1...v1.0.2) (2026-03-31)

### Bug Fixes

- **repo:** Adding documentation ([ec258ed](https://github.com/deebee-tech/sqleasy/commit/ec258edabf0d2dc84c7cbf31449afbd34627f994))

## [1.0.1](https://github.com/deebee-tech/sqleasy/compare/v1.0.0...v1.0.1) (2026-03-30)

### Bug Fixes

- **repo:** Fix for building releases in github ([f6e169b](https://github.com/deebee-tech/sqleasy/commit/f6e169b7af4b2f9688102d00e3ae059bc4073245))
- **repo:** Fix for building releases in github part 2 ([8af7949](https://github.com/deebee-tech/sqleasy/commit/8af794959f50a4474ccda303ac76aa6ff8d43023))
- **repo:** Fix for building releases in github part 3 ([4e1c3fa](https://github.com/deebee-tech/sqleasy/commit/4e1c3fa46f51a49c344ddf7ed8b483c5d1422b90))
- **repo:** Fix for major releases in change commits. ([ea9e659](https://github.com/deebee-tech/sqleasy/commit/ea9e65986d44bdbdbe5ec4d39e3b4d20e9a9e314))

# 1.0.0 (2026-03-30)

### Bug Fixes

- **repo:** Fix for formatting ([6c5f2f6](https://github.com/deebee-tech/sqleasy/commit/6c5f2f660e0180ce9a4d2e88eb1c658ab7e3a444))
- **repo:** Workflow updates ([9295140](https://github.com/deebee-tech/sqleasy/commit/9295140e6edcad7407f6a77f0f52bb95b8f3bd08))
