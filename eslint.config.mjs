import { FlatCompat } from "@eslint/eslintrc";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
const compat = new FlatCompat({
  baseDirectory: process.cwd(),
  resolvePluginsRelativeTo: path.dirname(
    require.resolve("eslint-config-next/package.json"),
  ),
});
const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "tmp/**",
      "public/sw.js",
      "next-env.d.ts",
      "screenshots/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
];

export default config;
