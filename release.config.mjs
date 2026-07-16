export default {
  branches: [
    'main',
    { name: 'beta', prerelease: true },
    { name: 'alpha', prerelease: true },
    { name: 'next', prerelease: true },
  ],
  plugins: [
    // Default Angular parser rejects `feat!:`; conventionalcommits supports it.
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    // NO `preset` here, deliberately. Pointing this at 'conventionalcommits' resolves the
    // top-level conventional-changelog-conventionalcommits (v10), whose new
    // `{commits, parser, writer, whatBump}` export shape this plugin's bundled
    // conventional-changelog-writer@8 cannot read -- it silently rendered 1.0.0 and 1.1.0 as
    // bare headers, which is why this package's entire CHANGELOG is empty.
    // Omitting it uses the writer's own version-locked angular preset, which parses `feat!:`
    // and renders the breaking body. test/release-notes.test.ts pins this.
    '@semantic-release/release-notes-generator',
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    // Keep jsr.json's version in lockstep with the release.
    [
      'semantic-release-replace-plugin',
      {
        replacements: [
          {
            files: ['jsr.json'],
            from: '"version": ".*"',
            to: '"version": "${nextRelease.version}"',
            results: [{ file: 'jsr.json', hasChanged: true, numMatches: 1, numReplacements: 1 }],
            countMatches: true,
          },
        ],
      },
    ],
    // Publish from the repo ROOT — `files: ["dist"]` ships the tsdown build, and the exports already
    // point at `./dist/...`. No pkgRoot / path-strip dance (unlike the zero-dep sibling packages).
    '@semantic-release/npm',
    ['@semantic-release/git', { assets: ['CHANGELOG.md', 'package.json', 'jsr.json'] }],
    // Registries BEFORE the GitHub release, so a GitHub-plugin hiccup can't block JSR. JSR
    // authenticates via OIDC from the release workflow (id-token: write) — no token needed.
    '@sebbo2002/semantic-release-jsr',
    '@semantic-release/github',
  ],
};
