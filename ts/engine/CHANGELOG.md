# [2.0.0-beta.1](https://github.com/deebee-tech/sqleasy/compare/sqleasy-engine-v1.2.0...sqleasy-engine-v2.0.0-beta.1) (2026-07-22)


### Bug Fixes

* **release:** give each package its own tag namespace — the engine would have shipped as 11.x ([e8524b6](https://github.com/deebee-tech/sqleasy/commit/e8524b615ec242430e5c86f6a198a5298d52877f))
* **release:** scope each package's commit analysis to its own paths ([fc6e03b](https://github.com/deebee-tech/sqleasy/commit/fc6e03bab30385cf5aa7184869438c4b01db9cff))


### Features

* bring the execution engine in as ts/engine ([ddce114](https://github.com/deebee-tech/sqleasy/commit/ddce11492bd3fa185925fde8a0e37f07a1fd4b43))
* **contract:** mint corpus D — schema introspection, replayed on all four dialects ([0d5a029](https://github.com/deebee-tech/sqleasy/commit/0d5a0295c9917fff85dbbef5c8a82c09ad5e4b03))
* fold the Dart query port in and delete the corpus fetch dance ([9d58388](https://github.com/deebee-tech/sqleasy/commit/9d58388096545431592b16dc03c7f741a60949d0))

# [1.2.0](https://github.com/deebee-tech/sqleasy-engine/compare/v1.1.2...v1.2.0) (2026-07-19)


### Features

* uniform statementTimeoutMs across all drivers; guard the pg idle-client error ([2489033](https://github.com/deebee-tech/sqleasy-engine/commit/2489033758c6ae7089e132b3054996d5bd19465b))

## [1.1.2](https://github.com/deebee-tech/sqleasy-engine/compare/v1.1.1...v1.1.2) (2026-07-18)


### Bug Fixes

* harden the engine for general SQL and close review gaps ([fe6f192](https://github.com/deebee-tech/sqleasy-engine/commit/fe6f19248dda1e8647f1baf369885c35bd1d593e))

## [1.1.1](https://github.com/deebee-tech/sqleasy-engine/compare/v1.1.0...v1.1.1) (2026-07-16)


### Bug Fixes

* **introspection:** read indexes and row counts for partitioned Postgres tables ([deac3bd](https://github.com/deebee-tech/sqleasy-engine/commit/deac3bd71eaf51f77a1690c43032e42f0e0df7bc))
* **mssql:** report a truthful rowCount for writes instead of always 0 ([654e324](https://github.com/deebee-tech/sqleasy-engine/commit/654e324c616f75c865d4f9851844aaedc046ca19))
* **mysql:** find the tables a UNION or subquery hides in the plan ([9f508fa](https://github.com/deebee-tech/sqleasy-engine/commit/9f508fa611eb743e77798511e374b1e7bfb40039))
* resolve CJS types per lane on all six subpaths (TS1479) ([250d2ac](https://github.com/deebee-tech/sqleasy-engine/commit/250d2ac4e16ad64d0acd1ed26ed0e50fe2dbaff2))

## [1.1.0](https://github.com/deebee-tech/sqleasy-engine/compare/v1.0.0...v1.1.0) (2026-07-15)

## 1.0.0 (2026-07-15)

# Changelog

All notable changes to `@deebeetech/sqleasy-engine` are documented here. This file is maintained
automatically by [semantic-release](https://github.com/semantic-release/semantic-release).
