import { describe, expect, it } from 'vitest';

/**
 * 1.0.0 and 1.1.0 both shipped as a bare header with no body -- this package's entire CHANGELOG is
 * empty as a result. Nothing failed: semantic-release computed the right version, tagged, and
 * published; only the notes were empty, which no gate looked at.
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

// The generator is wrapped by scripts/release/path-scoped.mjs so notes are built from THIS package's
// commits. The failure guarded here — preset skew emptying the body — belongs to the generator and
// its own sub-config, which the wrapper forwards untouched.
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
    options: { repositoryUrl: 'https://github.com/deebee-tech/sqleasy-engine' },
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
