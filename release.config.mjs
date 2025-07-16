export default {
   branches: [
      "main",
      {
         name: "beta",
         prerelease: true,
      },
      {
         name: "alpha",
         prerelease: true,
      },
      {
         name: "next",
         prerelease: true,
      },
   ],
   plugins: [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      [
         "@semantic-release/changelog",
         {
            changelogFile: "CHANGELOG.md",
         },
      ],
      [
         "@semantic-release/changelog",
         {
            changelogFile: "./dist/CHANGELOG.md",
         },
      ],
      [
         "semantic-release-replace-plugin",
         {
            replacements: [
               {
                  files: ["./dist/package.json"],
                  from: "dist/index",
                  to: "index",
                  results: [
                     {
                        file: "./dist/package.json",
                        hasChanged: true,
                        numMatches: 4,
                        numReplacements: 4,
                     },
                  ],
                  countMatches: true,
               },
            ],
         },
      ],
      [
         "semantic-release-replace-plugin",
         {
            replacements: [
               {
                  files: ["jsr.json"],
                  from: '"version": ".*"',
                  to: '"version": "${nextRelease.version}"',
                  results: [
                     {
                        file: "jsr.json",
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
         "@semantic-release/npm",
         {
            pkgRoot: "dist",
         },
      ],
      [
         "@semantic-release/npm",
         {
            npmPublish: false,
         },
      ],
      [
         "@semantic-release/git",
         {
            assets: ["CHANGELOG.md", "package.json", "jsr.json", "dist/**/*", "coverage/**/*"],
         },
      ],
      [
         "@semantic-release/github",
         {
            assets: [
               {
                  path: "dist/index.js",
                  label: "JavaScript Distribution (ESM)",
               },
               {
                  path: "dist/index.cjs",
                  label: "JavaScript Distribution (CommonJS)",
               },
               {
                  path: "dist/index.d.ts",
                  label: "JavaScript Distribution (Types)",
               },
            ],
         },
      ],
      "@sebbo2002/semantic-release-jsr",
   ],
};
