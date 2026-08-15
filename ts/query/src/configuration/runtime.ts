/** Options passed when creating Query instances or builders. */
export class RuntimeConfiguration {
  /** Optional host-defined settings carried alongside runtime options. */
  customConfiguration: any | undefined = undefined;

  /**
   * MSSQL ONLY — bind parameters through the driver instead of inlining them.
   *
   * Named for its dialect because it is the only one with a choice to make: Postgres, MySQL and
   * SQLite always hand `{ sql, params }` to the driver, so this flag does nothing there and is not
   * read. MSSQL defaults to a self-contained `exec sp_executesql` batch with the values written
   * into the EXEC argument list, which is portable — you can paste it into SSMS — and keeps the
   * INNER statement text stable.
   *
   * **Plan reuse is NOT the reason to turn this on.** Measured against SQL Server 2022 with
   * `optimize for ad hoc workloads` off: 25 executions of one shape with 25 distinct values cache
   * ONE plan under the default form, the same as under this one. The outer `exec` batch gets no
   * cache entry at all, so only the value-independent inner statement is cached. (Literal SQL, with
   * the values written into the statement itself, caches 25 — that is the pathology, and the
   * default form already avoids it.)
   *
   * Turn it on for the narrower wins: values never reach the SQL text, so a logged statement cannot
   * leak them; the payload is smaller; and the parameter TYPE comes from the driver instead of
   * being inferred from the value, which matters because `sp_executesql` keys its cache on the
   * declaration — see `mssqlParameterType` for the banding that used to split one shape into
   * several plans.
   *
   * Set this to `true` and `parsePrepared()` returns `@p0`-style placeholders with the ordered
   * values alongside, for the caller to bind (`request.input('p0', value)`).
   */
  mssqlBoundParameters: boolean = false;
}
