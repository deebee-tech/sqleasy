# Changelog

## 0.1.0-dev

Initial scaffold of the Dart port.

- Pure Dart package — no Flutter SDK dependency, so it runs on Flutter mobile, desktop and web, and
  on plain Dart servers.
- The value-rendering layer (`lib/src/values/`): numbers, dates, and MSSQL `sp_executesql` parameter
  typing. Written first and deliberately: it is the only place a Dart value becomes SQL text, and the
  only place the Flutter-web-vs-mobile number divergence can be contained.
- The golden-corpus harness, verifying the value layer against the frozen TypeScript output on the
  Dart VM **and** under dart2js.

The builder, parser and dialects are next.
