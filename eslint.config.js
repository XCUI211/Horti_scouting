import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        ...globals.vitest,
      }
    },
    rules: {
      "no-unused-vars": "error",
      "no-console": "off",
      "no-debugger": "warn",
      "no-undef": "error",
      "no-use-before-define": "error"
    },
    // tells ESLint to ignore specific heavy custom plugins if they clash
    plugins: {}
  }
];