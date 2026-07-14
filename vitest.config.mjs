import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      reporter: ['text', 'html'],
      exclude: [
        ...configDefaults.exclude,
        'tests/*',
        'dist/*',
        'coverage/*',
        '.prettierrc.mjs',
        'eslint.config.mjs',
        'release.config.mjs',
        'tsdown.config.ts',
        'vitest.config.mjs',
        'src/**/index.ts',
        'src/state/from.ts',
        'src/state/join.ts',
        'src/state/join-on.ts',
        'src/state/select.ts',
        'src/state/order-by.ts',
        'src/state/where.ts',
        'src/state/group-by.ts',
        'src/state/having.ts',
        'src/state/cte.ts',
        'src/state/union.ts',
        'src/state/update.ts',
        'src/configuration/delimiters.ts',
      ],
    },
    exclude: [
      ...configDefaults.exclude,
      'dist/*',
      'coverage/*',
      '.prettierrc.mjs',
      'eslint.config.mjs',
      'release.config.mjs',
      'tsdown.config.ts',
      'vitest.config.mjs',
    ],
  },
});
