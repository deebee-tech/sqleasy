/**
 * Path-scoped commit analysis for the monorepo's per-package releases.
 *
 * WHY THIS EXISTS. semantic-release reads EVERY commit in the repository between a package's last
 * tag and HEAD. In a monorepo that means each package's CHANGELOG claims work it never did — measured
 * on this branch before the fix:
 *
 *   @deebeetech/sqleasy         45 of 70 feat/fix commits since v10.1.0 do not touch ts/query
 *   @deebeetech/sqleasy-engine  44 of 54 since sqleasy-engine-v1.2.0 do not touch ts/engine,
 *                               including `fix(query)!` BREAKING entries attributed to the engine
 *
 * A changelog ships inside the package and cannot be corrected once published, and the hazard is not
 * only cosmetic: a breaking change in the sibling package would cut a spurious major here.
 *
 * WHY NOT `semantic-release-monorepo`. It is the usual answer and it was tried first. It is
 * unmaintained (last published 2024-02) and fails to load under semantic-release 25 with
 * ERR_MODULE_NOT_FOUND, and it also imposes its own `tagFormat`, which would destroy the bare
 * `v${version}` lineage `@deebeetech/sqleasy` has carried for ten majors. Forty lines here beat an
 * abandoned dependency on the release path.
 *
 * HOW. Both hooks filter `context.commits` to those touching this package's paths, then delegate to
 * the real plugin. Filtering is by the commit's changed files, read from git once per run.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as commitAnalyzer from '@semantic-release/commit-analyzer';
import * as notesGenerator from '@semantic-release/release-notes-generator';

/**
 * The repository root, NOT the caller's cwd.
 *
 * semantic-release runs from the PACKAGE directory (the release workflow sets
 * `working-directory: ts/query`), so a repo-relative pathspec like `ts/query` resolves against
 * `ts/query/ts/query` and matches nothing. That is not hypothetical: the first dispatched release
 * logged "path-scoped: 0 of 115 commits" and then reported SUCCESS having published nothing, because
 * "no commits" is indistinguishable from "no changes" to semantic-release.
 */
const repoRoot = (cwd) =>
  execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' }).trim();

/** Commit hashes that touched at least one of `paths`, for the whole history reachable from HEAD. */
const hashesTouching = (paths, root) => {
  // A path that does not exist is almost always a typo or a wrong base, and its only symptom would be
  // a release that silently does not happen. Fail loudly instead.
  for (const path of paths) {
    if (!existsSync(join(root, path))) {
      throw new Error(
        `path-scoped: configured path "${path}" does not exist at the repository root (${root}). ` +
          'Paths are resolved from the repo root, not from the package directory.',
      );
    }
  }
  const out = execFileSync('git', ['log', '--format=%H', '--', ...paths], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return new Set(out.split('\n').filter(Boolean));
};

/**
 * Keep only the commits that touched this package.
 *
 * A commit whose hash git does not report for these paths is dropped — including merge commits,
 * which git omits from a path-filtered log. That is the intent: a merge carries no authorship of its
 * own, and semantic-release would otherwise read its subject line as a release-worthy change.
 */
const scope = (pluginConfig, context) => {
  const paths = pluginConfig.paths;
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error('path-scoped: `paths` is required and must be a non-empty array');
  }
  const root = repoRoot(context.cwd ?? process.cwd());
  const touched = hashesTouching(paths, root);
  const commits = (context.commits ?? []).filter((commit) => touched.has(commit.hash));
  context.logger?.log(
    `path-scoped: ${commits.length} of ${context.commits?.length ?? 0} commits touch ${paths.join(', ')}`,
  );
  return { ...context, commits };
};

/**
 * The two delegates take DIFFERENT options, and merging them is a real bug rather than a tidiness
 * issue. `commit-analyzer` needs `preset: 'conventionalcommits'`; `release-notes-generator` must NOT
 * have it — pointing the generator at that preset resolves a v10 module whose export shape its
 * bundled writer@8 does not understand, and it then emits the version header and SILENTLY DROPS
 * EVERY COMMIT. Four releases shipped that way (2.0.1, 3.0.0, 4.0.0, 4.0.1) before
 * ts/query/tests/release-notes.test.ts was written to catch it — and it caught this wrapper doing it
 * again the moment the configs were merged.
 *
 * So each delegate gets its own sub-config, and `paths` is never forwarded to either.
 */
const optionsFor = (pluginConfig, key) => pluginConfig[key] ?? {};

export const analyzeCommits = (pluginConfig, context) =>
  commitAnalyzer.analyzeCommits(
    optionsFor(pluginConfig, 'analyzeCommits'),
    scope(pluginConfig, context),
  );

export const generateNotes = (pluginConfig, context) =>
  notesGenerator.generateNotes(
    optionsFor(pluginConfig, 'generateNotes'),
    scope(pluginConfig, context),
  );
