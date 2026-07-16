export default {
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
    // Stamp the release version into the golden corpus. The corpus is the cross-language contract:
    // `sqleasy-dart` pins a version and fetches it from this repo's TAG
    // (raw.githubusercontent.com/deebee-tech/sqleasy/v<version>/goldens/corpus.json), so it must be
    // committed and tagged, and its `version` must match the release. Deliberately NOT a GitHub
    // release asset — that upload is the one that crashed on 2.0.0 (see the note below).
    [
      'semantic-release-replace-plugin',
      {
        replacements: [
          {
            files: ['goldens/corpus.json'],
            from: '"version": ".*"',
            to: '"version": "${nextRelease.version}"',
            results: [
              {
                file: 'goldens/corpus.json',
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
        assets: [
          'CHANGELOG.md',
          'package.json',
          'jsr.json',
          'goldens/corpus.json',
          'dist/**/*',
          'coverage/**/*',
        ],
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
