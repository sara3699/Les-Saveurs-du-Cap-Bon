import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /*
       * The interface is in French, where an apostrophe appears in almost every
       * sentence: l'ordre, d'exemple, n'est pas. This rule asks for each one to be
       * written as &apos; inside JSX, which would make the source unreadable to
       * anyone editing the wording. The rule guards against a stray quote breaking
       * the markup, and TypeScript plus the build already catch that.
       */
      "react/no-unescaped-entities": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
