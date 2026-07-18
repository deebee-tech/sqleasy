import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      reporter: ['text', 'html'],
      exclude: [
        ...configDefaults.exclude,
        'test/*',
        'dist/*',
        'coverage/*',
        '.prettierrc.mjs',
        'eslint.config.mjs',
        'tsdown.config.ts',
        'vitest.config.mjs',
        // keep measuring dialect executors (they live in src/*/index.ts)
      ],
    },
    exclude: [...configDefaults.exclude, 'dist/*', 'coverage/*'],
  },
});
