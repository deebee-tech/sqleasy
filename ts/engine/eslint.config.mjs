// Re-exports the monorepo's shared flat config so the two published TypeScript packages cannot
// drift apart on lint policy. Rules live in configs/eslint-config/base.js.
export { default } from '@sqleasy/eslint-config/base';
