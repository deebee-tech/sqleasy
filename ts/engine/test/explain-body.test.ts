import { describe, expect, it } from 'vitest';
import { explainBody, trimExplainSql } from '../src/explain-body';

describe('explainBody', () => {
  it('strips trailing semicolons and whitespace', () => {
    expect(explainBody('  SELECT 1;  ')).toBe('SELECT 1');
  });

  it('allows a semicolon inside a string literal', () => {
    expect(explainBody("SELECT ';' AS s")).toBe("SELECT ';' AS s");
  });

  it('rejects multiple top-level statements', () => {
    expect(() => explainBody('SELECT 1; SELECT 2')).toThrow(/single statement/);
  });

  it('rejects empty SQL', () => {
    expect(() => explainBody('   ;  ')).toThrow(/non-empty/);
  });
});

describe('trimExplainSql', () => {
  it('allows a DECLARE + SELECT batch (MSSQL SHOWPLAN shape)', () => {
    expect(trimExplainSql('DECLARE @p0 int = 1;\nSELECT @p0;')).toBe(
      'DECLARE @p0 int = 1;\nSELECT @p0',
    );
  });
});
