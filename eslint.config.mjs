import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    ignores: ["test_*.js", "scratch/**", "test*.js", "temp*.js", "node_modules/**", "playwright.config.js"]
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "no-empty": "warn"
    }
  },
  pluginJs.configs.recommended,
];
