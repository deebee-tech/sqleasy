/**
 * Normalize a statement body before prefixing EXPLAIN / EXPLAIN QUERY PLAN.
 *
 * Callers may pass arbitrary SQL (not only SQLEasy output). Trailing semicolons are stripped so
 * `EXPLAIN …;` does not become a second empty statement on drivers that split on `;`. Multiple
 * top-level statements are rejected — explain is single-statement by contract across dialects.
 */

/** Trim and strip trailing `;` only — used when a dialect must send a short batch (e.g. MSSQL
 * `DECLARE …; SELECT …` for SHOWPLAN). */
export function trimExplainSql(sql: string): string {
  const trimmed = sql.trim().replace(/;+\s*$/u, '');
  if (!trimmed) throw new Error('explain() requires a non-empty statement');
  return trimmed;
}

/** Trim, strip trailing `;`, reject empty / multi-statement SQL. */
export function explainBody(sql: string): string {
  const trimmed = trimExplainSql(sql);
  if (hasTopLevelSemicolon(trimmed)) {
    throw new Error(
      'explain() expects a single statement; remove extra statements or split the batch',
    );
  }
  return trimmed;
}

/** True when a `;` appears outside `'…'`, `"…"`, and `` `…` `` literals (incl. doubled escapes). */
function hasTopLevelSemicolon(sql: string): boolean {
  let quote: "'" | '"' | '`' | null = null;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i]!;
    if (quote) {
      if (c === quote) {
        if (sql[i + 1] === quote) {
          i++;
          continue;
        }
        quote = null;
      }
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      quote = c;
      continue;
    }
    if (c === ';') return true;
  }
  return false;
}
