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
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    // Publish from the repo ROOT — `files: ["dist"]` ships the tsdown build, and the exports already
    // point at `./dist/...`. No pkgRoot / path-strip dance (unlike the zero-dep sibling packages).
    '@semantic-release/npm',
    ['@semantic-release/git', { assets: ['CHANGELOG.md', 'package.json'] }],
    '@semantic-release/github',
  ],
};
