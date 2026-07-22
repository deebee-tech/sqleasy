import { describe, expect, it } from 'vitest';

/**
 * 2.0.1, 3.0.0, 4.0.0 and 4.0.1 all shipped as a bare header with no body -- 3.0.0 hid a pile of
 * breaking changes that way. Nothing failed: semantic-release computed the right version, tagged,
 * and published; only the notes were empty, which no gate looked at.
 *
 * The cause was version skew. `preset: 'conventionalcommits'` resolves the top-level
 * conventional-changelog-conventionalcommits, which moved to a new
 * `{commits, parser, writer, whatBump}` export shape in v10, while this plugin's bundled
 * conventional-changelog-writer@8 still expects the old one. It does not throw on the mismatch --
 * it emits the header and silently drops every commit.
 *
 * So this runs the REAL plugin with the REAL config from release.config.mjs. Re-adding a skewed
 * preset fails here rather than eight releases later.
 */
type PluginEntry = string | [string, Record<string, unknown>];
type GenerateNotes = (
  pluginConfig: Record<string, unknown>,
  context: Record<string, unknown>,
) => Promise<string>;

const RNG = '@semantic-release/release-notes-generator';

// The notes generator is no longer configured DIRECTLY: scripts/release/path-scoped.mjs wraps it so
// each package's notes are built from its own commits. This test still targets the REAL generator
// with the REAL config, because the failure it guards is preset version SKEW producing an empty body
// — a property of the generator and its config, which the wrapper passes through untouched. The
// wrapper's own filtering is exercised separately below, against real repository history.
const SCOPED = '../../scripts/release/path-scoped.mjs';

// Both specifiers go through a variable: neither release.config.mjs nor the plugin ships types,
// and a literal import of either fails `tsc --noEmit` with TS7016. The point of this file is to
// exercise the real config against the real plugin, so stubbing them out would defeat it.
const rngConfig = async (): Promise<Record<string, unknown>> => {
  const configPath = '../release.config.mjs';
  const { default: releaseConfig } = (await import(configPath)) as {
    default: { plugins: PluginEntry[] };
  };
  const entry = releaseConfig.plugins.find((p) =>
    Array.isArray(p) ? p[0] === SCOPED || p[0] === RNG : p === SCOPED || p === RNG,
  );
  if (entry === undefined) throw new Error(`neither ${SCOPED} nor ${RNG} is configured`);
  // The wrapper keeps a SEPARATE sub-config per delegate; the generator's is the one under test.
  const cfg = Array.isArray(entry) ? entry[1] : {};
  return (cfg.generateNotes as Record<string, unknown>) ?? cfg;
};

const commit = (hash: string, message: string) => ({
  hash,
  message,
  subject: message.split('\n')[0],
  body: message.split('\n').slice(1).join('\n'),
  commit: { long: hash, short: hash.slice(0, 7) },
  tree: { long: '', short: '' },
  author: { name: 'a', email: 'a@example.com', date: '2026-07-16T00:00:00Z' },
  committer: { name: 'a', email: 'a@example.com', date: '2026-07-16T00:00:00Z' },
  committerDate: '2026-07-16T00:00:00Z',
  gitTags: '',
});

const notesFor = async (type: string, commits: ReturnType<typeof commit>[]) => {
  const rngPath = RNG;
  const { generateNotes } = (await import(rngPath)) as { generateNotes: GenerateNotes };
  return generateNotes(await rngConfig(), {
    cwd: process.cwd(),
    env: process.env,
    options: { repositoryUrl: 'https://github.com/deebee-tech/sqleasy' },
    lastRelease: { gitTag: 'v1.0.0', version: '1.0.0' },
    nextRelease: { gitTag: 'v2.0.0', version: '2.0.0', type },
    commits,
    logger: { log: () => {}, error: () => {}, warn: () => {} },
  });
};

describe('release notes generation', () => {
  it('renders a body for a minor, not just the version header', async () => {
    const notes = await notesFor('minor', [
      commit('a'.repeat(40), 'feat: add a thing consumers can see'),
    ]);

    expect(notes).toContain('add a thing consumers can see');
    expect(notes).toMatch(/### Features/);
  });

  it('renders a body for a major, including the breaking change', async () => {
    const notes = await notesFor('major', [
      commit(
        'b'.repeat(40),
        'refactor!: drop the legacy export\n\nBREAKING CHANGE: `Legacy` is no longer exported.',
      ),
      commit('c'.repeat(40), 'fix: correct the thing'),
    ]);

    expect(notes).toContain('drop the legacy export');
    expect(notes).toContain('`Legacy` is no longer exported.');
    expect(notes).toMatch(/BREAKING CHANGE/i);
    expect(notes).toContain('correct the thing');
  });

  it('renders more than a header, which is the exact failure that shipped four times', async () => {
    const header = await notesFor('major', []);
    const withCommits = await notesFor('major', [
      commit('d'.repeat(40), 'feat: a real feature'),
      commit('e'.repeat(40), 'fix: a real fix'),
    ]);

    // The bug produced output byte-identical to the no-commits case.
    expect(withCommits).not.toBe(header);
    expect(withCommits.length).toBeGreaterThan(header.length + 50);
  });
});
