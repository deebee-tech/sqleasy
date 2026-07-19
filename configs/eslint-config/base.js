// @ts-check

import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

/**
 * Shared flat config for every TypeScript package in the monorepo.
 *
 * Carried over VERBATIM from the pre-migration sqleasy eslint.config.mjs, including the
 * `no-explicit-any` opt-out — the builder's generic surfaces rely on it. Consumers re-export this
 * rather than redefining rules, so the two published packages cannot drift apart on lint policy.
 */
export default tseslint.config(
  { ignores: ['dist/', 'coverage/'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
