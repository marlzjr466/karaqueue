/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: false,
  env: {
    es2022: true,
    node: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
    ],
    "no-console": ["warn", { allow: ["warn", "error"] }]
  },
  ignorePatterns: ["dist/**", ".next/**", "node_modules/**", ".expo/**"]
};
