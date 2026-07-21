export default {
  /**
   * The repo's ORIGINAL tag lineage, kept bare on purpose.
   *
   * All 17 existing tags are `v5.0.0` … `v10.1.0`, and every one of them is this package's history —
   * `sqleasy` WAS this repository before the monorepo. Prefixing it now (the migration plan's
   * `sqleasy-v*`) would make semantic-release find no prior tag and start over at 1.0.0, throwing
   * away a major-version lineage to gain symmetry with two packages that have no history here.
   *
   * So query keeps `v*` and the OTHER packages take prefixes. Stated explicitly rather than left to
   * the default, because the default is exactly what made the sibling package wrong.
   */
  tagFormat: 'v${version}',
  branches: [
    'main',
    {
      name: 'beta',
      prerelease: true,
    },
    {
      name: 'alpha',
      prerelease: true,
    },
    {
      name: 'next',
      prerelease: true,
    },
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        // Default Angular parser rejects `feat!:`; conventionalcommits supports it.
        //
        // ⚠ A body line that OPENS with `BREAKING CHANGE` is a footer, and the parser does not read
        // English. v5.0.0 is a real, published, spurious major because a commit body contained the
        // sentence "that removes the BREAKING CHANGE footer" — a commit ABOUT the footer became one.
        // A version number cannot be taken back, so: when writing about the footer, never start a
        // line with it. Say "the breaking-change footer" mid-sentence instead.
        preset: 'conventionalcommits',
      },
    ],
    // NO `preset` here, deliberately. Pointing this at 'conventionalcommits' resolves the
    // top-level conventional-changelog-conventionalcommits (v10), whose new
    // `{commits, parser, writer, whatBump}` export shape this plugin's bundled
    // conventional-changelog-writer@8 cannot read -- it silently rendered EVERY release as a
    // bare header with no body from 2.0.1 onward, hiding 3.0.0's breaking changes completely.
    // Omitting it uses the writer's own version-locked angular preset, which parses `feat!:`
    // and `refactor!:` and renders the breaking body. tests/release-notes.test.ts pins this.
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: './dist/CHANGELOG.md',
      },
    ],
    [
      'semantic-release-replace-plugin',
      {
        replacements: [
          {
            files: ['./dist/package.json'],
            from: 'dist/index',
            to: 'index',
            results: [
              {
                file: './dist/package.json',
                hasChanged: true,
                // Must equal the `dist/index` count in package.json (main + types + the
                // four nested exports conditions). The plugin asserts it and fails the
                // release on a mismatch, so it changes whenever the exports map does.
                // tests/packaging.test.ts holds these two files in lockstep.
                numMatches: 6,
                numReplacements: 6,
              },
            ],
            countMatches: true,
          },
        ],
      },
    ],
    [
      'semantic-release-replace-plugin',
      {
        replacements: [
          {
            files: ['jsr.json'],
            from: '"version": ".*"',
            to: '"version": "${nextRelease.version}"',
            results: [
              {
                file: 'jsr.json',
                hasChanged: true,
                numMatches: 1,
                numReplacements: 1,
              },
            ],
            countMatches: true,
          },
        ],
      },
    ],
    // NOTE: the arm that stamped this package's version into goldens/corpus.json is GONE, and must
    // not come back.
    //
    // It welded the cross-language contract to the TypeScript release, so a TS release that changed
    // no SQL whatsoever still bumped the corpus version and forced every language port to chase it.
    // The corpus now lives in `contract/` as @deebeetech/sqleasy-contract, carries its OWN version,
    // and is released on its own cadence under the `corpus-v*` tag. contract/tools/validate.mjs
    // enforces the version-vs-content invariant mechanically.
    [
      '@semantic-release/npm',
      {
        pkgRoot: 'dist',
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
    [
      '@semantic-release/git',
      {
        // goldens/corpus.json is deliberately absent: the corpus is no longer this package's to
        // release. It ships from contract/ on its own version line.
        assets: ['CHANGELOG.md', 'package.json', 'jsr.json', 'dist/**/*'],
      },
    ],
    // Registries BEFORE the GitHub release: on 2.0.0 the GitHub plugin crashed uploading release
    // assets ("invalid content-length header" from octokit/undici) and, because JSR was listed
    // after it, JSR never published. npm/JSR are the product; the GitHub release is cosmetic.
    '@sebbo2002/semantic-release-jsr',
    // No `assets` here: that upload is exactly what crashed, and the built files already ship via
    // npm and JSR. The GitHub release still gets its generated notes.
    '@semantic-release/github',
  ],
};
