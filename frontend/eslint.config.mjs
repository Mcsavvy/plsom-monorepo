import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...compat.extends("prettier"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // Auto-fixable rules
      "@typescript-eslint/no-unused-vars": "warn", // Change to warning instead of error
      "react/no-unescaped-entities": "off", // Disable this rule since it's often not needed in modern React
      // Keep other rules as they are important for code quality
    }
  }
];

export default eslintConfig;
