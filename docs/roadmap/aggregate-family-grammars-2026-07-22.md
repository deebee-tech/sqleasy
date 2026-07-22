# Aggregate family grammars — measured 2026-07-22

Source: workflow `wf_620cb88f-ed0`, 33 agents, every illegal rule challenged (0 overturned).
For roadmap #24 (FILTER), #14 (string aggregation), #15 (JSON aggregation).

## The trap that spans all three

`FILTER` and `SEPARATOR` are NOT reserved words on MySQL/MSSQL — they parse as column aliases.
A malformed emission produces a silently mis-aliased column, not a syntax error, so every refusal
in this family must fire at the BUILDER, before emission.

An integer `ORDER BY` ordinal means different things across the family: a no-op constant on
Postgres/SQLite, a positional argument reference on MySQL. Always emit the explicit expression.

## filter

| dialect  | verdict | template                                                                                                                                                  |
| -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| postgres | legal   | COUNT(_) FILTER (WHERE <predicate>) — e.g. SELECT COUNT(_) FILTER (WHERE total > 1) FROM orders GROUP BY customer_id                                      |
| sqlite   | legal   | COUNT(_) FILTER (WHERE <predicate>) — e.g. SELECT COUNT(_) FILTER (WHERE total > 1) FROM orders GROUP BY customer_id                                      |
| mysql    | illegal | REFUSE. Do not emit. MySQL has no FILTER clause; the builder must reject the aggregate-filter request for this dialect rather than rewrite it.            |
| mssql    | illegal | REFUSE. Do not emit. T-SQL has no FILTER clause; the builder must reject the aggregate-filter request for this dialect rather than rewrite it.            |
| postgres | legal   | COUNT(*) FILTER (WHERE <predicate>) OVER (PARTITION BY <cols>) — FILTER goes BEFORE OVER, always.                                                         |
| sqlite   | legal   | COUNT(_) FILTER (WHERE <predicate>) OVER (PARTITION BY <cols>) — FILTER before OVER. Named windows also accepted: COUNT(_) FILTER (WHERE <predicate>) […] |
| mysql    | illegal | REFUSE. Do not emit.                                                                                                                                      |
| mssql    | illegal | REFUSE. Do not emit.                                                                                                                                      |
| postgres | legal   | HAVING COUNT(_) FILTER (WHERE <predicate>) <op> <value> — e.g. HAVING COUNT(_) FILTER (WHERE total > 1) > 0                                               |
| sqlite   | legal   | HAVING COUNT(*) FILTER (WHERE <predicate>) <op> <value>                                                                                                   |
| postgres | illegal | REFUSE / never generate this order. The only legal order is <agg>(<args>) FILTER (WHERE <pred>) OVER (<window>).                                          |
| sqlite   | illegal | REFUSE / never generate this order. The only legal order is <agg>(<args>) FILTER (WHERE <pred>) OVER (<window>).                                          |
| postgres | illegal | REFUSE. FILTER is only attachable to an aggregate. A builder must reject .filter() on pure window functions (ROW_NUMBER, RANK, DENSE_RANK, NTILE […]      |
| sqlite   | illegal | REFUSE. FILTER is only attachable to an aggregate window function.                                                                                        |
| postgres | legal   | COUNT(DISTINCT <expr>) FILTER (WHERE <predicate>) — DISTINCT stays inside the parens, FILTER stays outside them.                                          |
| sqlite   | legal   | COUNT(DISTINCT <expr>) FILTER (WHERE <predicate>) — DISTINCT inside the parens, FILTER outside.                                                           |
| postgres | legal   | json_agg(<expr>)                                                                                                                                          |
| postgres | legal   | jsonb_agg(<expr>)                                                                                                                                         |
| postgres | legal   | json_object_agg(<key>, <value>)                                                                                                                           |
| postgres | legal   | jsonb_object_agg(<key>, <value>)                                                                                                                          |
| postgres | legal   | json_agg(DISTINCT <expr>) \| jsonb_agg(DISTINCT <expr>) \| json_object_agg(DISTINCT <key>, <value>)                                                       |
| postgres | legal   | json_agg(<expr> ORDER BY <sort_expr> [ASC\|DESC]) \| json_object_agg(<key>, <value> ORDER BY <sort_expr>)                                                 |
| postgres | illegal | REFUSE. Postgres accepts DISTINCT + ORDER BY only when every ORDER BY expression also appears among the aggregate's arguments. Legal […]                  |
| postgres | legal   | json_agg(<expr>) FILTER (WHERE <predicate>)                                                                                                               |
| mysql    | legal   | JSON_ARRAYAGG(<expr>)                                                                                                                                     |
| mysql    | legal   | JSON_OBJECTAGG(<key>, <value>)                                                                                                                            |
| mysql    | illegal | REFUSE. There is no DISTINCT form. MySQL's grammar for these two functions admits the argument list only. If a caller asks for distinct JSON […]          |
| mysql    | illegal | REFUSE. Only GROUP_CONCAT takes an inner ORDER BY in MySQL; JSON_ARRAYAGG does not. Element order is unspecified. Do not emit it and do not fake it […]   |
| mysql    | illegal | REFUSE. No DISTINCT form.                                                                                                                                 |
| mysql    | illegal | REFUSE. No inner ORDER BY form.                                                                                                                           |
| sqlite   | legal   | json_group_array(<expr>)                                                                                                                                  |
| sqlite   | legal   | json_group_object(<key>, <value>)                                                                                                                         |
| sqlite   | legal   | json_group_array(DISTINCT <expr>)                                                                                                                         |
| sqlite   | illegal | REFUSE. SQLite permits DISTINCT only on single-argument aggregates, so the object form can never take it. Note this diverges from Postgres, which […]     |
| sqlite   | legal   | json_group_array(<expr> ORDER BY <sort_expr> [ASC\|DESC])                                                                                                 |
| sqlite   | legal   | json_group_object(<key>, <value> ORDER BY <sort_expr> [ASC\|DESC])                                                                                        |
| mssql    | illegal | REFUSE on the MSSQL dialect at the 2022 target. The method must not exist on the MSSQL builder surface. Do not substitute FOR JSON (see the FOR JSON […]  |
| mssql    | illegal | REFUSE on the MSSQL dialect at the 2022 target. No approximation.                                                                                         |
| mssql    | legal   | JSON_ARRAY(<v1>, <v2>, ...) \| JSON_OBJECT('<k1>':<v1>, '<k2>':<v2>) — note the COLON separator, not a comma. These are scalar per-row constructors […]   |
| mssql    | legal   | <full SELECT> FOR JSON PATH [, ROOT('<name>')] [, WITHOUT_ARRAY_WRAPPER] [, INCLUDE_NULL_VALUES] — a trailing statement-level clause, NOT an […]          |
| mssql    | legal   | (SELECT [DISTINCT] <cols> FROM <child> WHERE <child>.<fk> = <parent>.<pk> [ORDER BY <sort>] FOR JSON PATH) AS <alias> — offer this ONLY as an […]         |

## string-agg

| dialect  | verdict | template                                                                                                                                                  |
| -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| postgres | legal   | string_agg(<expr>, <sep>)                                                                                                                                 |
| postgres | illegal | REFUSE — the separator is mandatory. There is no 1-arg overload; the builder must require a separator argument for Postgres.                              |
| postgres | legal   | string_agg(<expr>, <sep> ORDER BY <key> [ASC\|DESC] [NULLS FIRST\|LAST][, <key2> ...]) — note: NO comma before ORDER BY                                   |
| postgres | illegal | REFUSE — never emit WITHIN GROUP for Postgres string_agg; the ordering goes inside the parens.                                                            |
| postgres | legal   | string_agg(DISTINCT <expr>, <sep>)                                                                                                                        |
| postgres | legal   | string_agg(DISTINCT <expr>, <sep> ORDER BY <expr> [ASC\|DESC]) — the ORDER BY key must be the same expression as the aggregated argument                  |
| postgres | illegal | REFUSE — when DISTINCT is set, the builder must reject any ORDER BY key that is not syntactically the aggregated argument. This is the one-variable […]   |
| postgres | legal   | NEVER emit an integer ordinal here. It parses, but it is a CONSTANT, not a positional reference — the ordering is silently a no-op. Always emit the […]   |
| mysql    | legal   | GROUP_CONCAT(<expr>) — implicit default separator is ','                                                                                                  |
| mysql    | legal   | GROUP_CONCAT(<expr> ORDER BY <key> [ASC\|DESC][, <key2> ...])                                                                                             |
| mysql    | legal   | GROUP_CONCAT(<expr> SEPARATOR <sep>) — SEPARATOR is a KEYWORD clause, never a second argument                                                             |
| mysql    | legal   | GROUP_CONCAT([DISTINCT] <expr> [ORDER BY <key> [ASC\|DESC][, ...]] [SEPARATOR <sep>]) — ORDER BY must precede SEPARATOR                                   |
| mysql    | illegal | REFUSE — the clause order is fixed. The builder must always emit ORDER BY before SEPARATOR.                                                               |
| mysql    | illegal | REFUSE — string_agg does not exist on MySQL. The engine-native name is GROUP_CONCAT.                                                                      |
| mysql    | legal   | NEVER emit this. It is syntactically valid but semantically WRONG: the comma list is a per-row expression concatenation, not a separator. The builder […] |
| mysql    | illegal | REFUSE — never emit WITHIN GROUP for MySQL.                                                                                                               |
| mysql    | legal   | GROUP_CONCAT(DISTINCT <expr> [ORDER BY <key> [ASC\|DESC]] [SEPARATOR <sep>]) — DISTINCT composes freely with both clauses                                 |
| mysql    | legal   | GROUP_CONCAT(DISTINCT <expr> ORDER BY <other-expr> ... SEPARATOR <sep>) is ACCEPTED and was observed to be honored — but this is a genuine dialect […]    |
| mysql    | legal   | NEVER emit an integer ordinal. On MySQL it IS a positional reference into the aggregate's argument list, so it silently means something different […]     |
| mssql    | legal   | STRING_AGG(<expr>, <sep>)                                                                                                                                 |
| mssql    | illegal | REFUSE — the separator is mandatory on MSSQL, exactly as on Postgres.                                                                                     |
| mssql    | legal   | STRING_AGG(<expr>, <sep>) WITHIN GROUP (ORDER BY <key> [ASC\|DESC][, <key2> ...]) — ordering lives OUTSIDE the parens, in its own WITHIN GROUP clause     |
| mssql    | illegal | REFUSE — an in-parens ORDER BY does not work on MSSQL; it must be WITHIN GROUP.                                                                           |
| mssql    | illegal | REFUSE — if the builder emits WITHIN GROUP at all it must contain at least one ORDER BY key; otherwise omit the whole clause.                             |
| mssql    | illegal | REFUSE — MSSQL is the ONLY engine of the four with no DISTINCT support in this family. The builder must either refuse distinct+string-agg on MSSQL or […] |
| mssql    | illegal | REFUSE — GROUP_CONCAT does not exist on MSSQL. The engine-native name is STRING_AGG.                                                                      |
| sqlite   | legal   | group_concat(<expr>[, <sep>]) — separator is OPTIONAL, defaults to ','                                                                                    |
| sqlite   | legal   | string_agg(<expr>, <sep>) — works, but prefer group_concat as the engine-native name since string_agg requires a modern SQLite                            |
| sqlite   | illegal | REFUSE — the string_agg alias requires exactly 2 arguments even though group_concat accepts 1. If the builder emits the alias it must always supply a […] |
| sqlite   | legal   | group_concat(<expr>[, <sep>] ORDER BY <key> [ASC\|DESC][, <key2> ...]) — Postgres-style, inside the parens, no comma before ORDER BY                      |
| sqlite   | illegal | REFUSE — never emit WITHIN GROUP for SQLite.                                                                                                              |
| sqlite   | illegal | REFUSE — SQLite takes the separator as a positional argument, never as a SEPARATOR keyword.                                                               |
| sqlite   | illegal | REFUSE — this is the key SQLite constraint: DISTINCT and a separator are MUTUALLY EXCLUSIVE, because the separator is a second argument and DISTINCT […]  |
| sqlite   | legal   | group_concat(DISTINCT <expr>[ ORDER BY <key> [ASC\|DESC]]) — one argument only, so no custom separator; result uses the default ','                       |
| sqlite   | legal   | NEVER emit an integer ordinal. It parses but is an inert CONSTANT — the ordering silently does nothing. Always emit the explicit expression.              |
