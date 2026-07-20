@TestOn('vm')
library;

import 'dart:mirrors';

import 'package:sqleasy/sqleasy.dart';
import 'package:test/test.dart';

import '../tool/view_manifest.dart';

/// Anti-drift, layer 3 (defense-in-depth behind the generator's `--check` gate and the `implements`
/// compile guard). Using reflection, this asserts that each per-engine view exposes EXACTLY the
/// builder methods `QueryBuilder` has minus that dialect's `absent` set — present-by-default, the
/// Dart analog of TypeScript's `Exclude<keyof QueryBuilder, AbsentOnX>`. It fails even if someone
/// hand-edits a generated file or skips the generator, so a capability hole cannot open silently.
///
/// VM-only: `dart:mirrors` is unavailable under dart2js, so `dart test -p chrome` skips this file.
void main() {
  Set<String> publicInstanceMembers(Type type) {
    final result = <String>{};
    reflectClass(type).declarations.forEach((symbol, decl) {
      if (decl is MethodMirror &&
          !decl.isStatic &&
          !decl.isConstructor &&
          !decl.isPrivate &&
          !decl.isSetter &&
          !decl.isOperator) {
        result.add(MirrorSystem.getName(symbol));
      }
    });
    return result;
  }

  // The runtime surface, split into the non-builder terminals (shared by every view via
  // SqlBuilderView) and the builder methods that views subset.
  final terminals = publicInstanceMembers(SqlBuilderView);
  final allMembers = publicInstanceMembers(QueryBuilder);
  // Mirror the generator's discovery: alias surface names (e.g. updlock) are real QueryBuilder
  // delegators but are emitted ONLY on their home view, so they are not part of the present-by-default
  // set every view subsets. Excluding them keeps this test correct once engine-native aliases land.
  final builderMethods =
      allMembers.difference(terminals).difference(allAliasSurfaceNames());

  test('SqlBuilderView is exactly the non-builder members', () {
    // Sanity: the terminals are the parse/state/configuration tail and nothing dialect-specific.
    expect(terminals, isNotEmpty);
    expect(terminals, everyElement(isIn(allMembers)));
  });

  const views = <String, Type>{
    'mssql': MssqlQueryBuilder,
    'mysql': MysqlQueryBuilder,
    'postgres': PostgresQueryBuilder,
    'sqlite': SqliteQueryBuilder,
  };

  views.forEach((dialect, viewType) {
    final policy = viewManifest[dialect]!;
    final viewOwn =
        publicInstanceMembers(viewType); // present builders + alias surfaces

    group('$dialect view', () {
      test(
          'every builder method is present unless the manifest marks it absent',
          () {
        for (final method in builderMethods) {
          // An alias target (e.g. forUpdate under updlock) is hidden here by being in `absent`.
          final isPresent = viewOwn.contains(method);
          final isAbsent = policy.absent.contains(method);
          expect(
            isPresent,
            !isAbsent,
            reason:
                '$method: present=$isPresent but absent-in-manifest=$isAbsent on $dialect — '
                'the view has drifted from tool/view_manifest.dart (run `dart run tool/gen_views.dart`)',
          );
        }
      });

      test(
          'exposes no phantom method — every view member is a real QueryBuilder method',
          () {
        for (final method in viewOwn) {
          expect(
            allMembers,
            contains(method),
            reason: '$method is on the $dialect view but not on QueryBuilder',
          );
        }
      });

      test(
          'every engine-native alias is shown here and its generic target hidden',
          () {
        policy.aliases.forEach((surface, target) {
          expect(viewOwn, contains(surface),
              reason: 'alias $surface missing from $dialect view');
          expect(policy.absent, contains(target),
              reason: 'alias target $target must be absent on $dialect');
          expect(viewOwn, isNot(contains(target)),
              reason:
                  'generic $target must be hidden where alias $surface is shown');
          expect(allMembers, contains(surface),
              reason:
                  'alias $surface has no runtime delegator on QueryBuilder');
        });
      });
    });
  });
}
