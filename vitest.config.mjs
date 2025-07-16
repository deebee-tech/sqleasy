import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
   test: {
      globals: true,
      coverage: {
         reporter: ["text", "html"],
         exclude: [
            ...configDefaults.exclude,
            "tests/*",
            "dist/*",
            "coverage/*",
            ".prettierrc.mjs",
            "eslint.config.mjs",
            "release.config.mjs",
            "rollup.config.mjs",
            "vitest.config.mjs",
         ],
      },
      exclude: [
         ...configDefaults.exclude,
         "dist/*",
         "coverage/*",
         ".prettierrc.mjs",
         "eslint.config.mjs",
         "release.config.mjs",
         "rollup.config.mjs",
         "vitest.config.mjs",
      ],
   },
});
