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

      /*
       * Every screen resolves an order's source through an attribution index, and
       * that index has to be read after the records it explains, never in the same
       * batch. Each repository call is a separate request with its own snapshot of
       * the database. A record and its attribution row are written together in one
       * transaction, so the two never disagree on disk, but an order the website
       * posts mid-read can land in the orders query while missing from an
       * attributions query that had already gone out. resolveSource is then right
       * to throw, and the whole screen goes with it. This was live for a while and
       * surfaced only under a full end-to-end run.
       *
       * src/lib/workspace.ts carries the long note.
       */
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='Promise'][callee.property.name=/^(all|allSettled)$/] CallExpression[callee.object.property.name='workspace'][callee.property.name='attributions']",
          message:
            "Read the attributions after the records, not alongside them: close the Promise.all first, then `const attributions = await repos.workspace.attributions()`. Batched, this query can snapshot the database before a record it has to explain exists, and resolveSource throws on the record it cannot find. See the note in src/lib/workspace.ts.",
        },
      ],
    },
  },
  /*
   * `.claude/` holds tooling state, including git worktrees that are whole second
   * copies of this repository. Linting those reports every problem twice and reports
   * problems in branches nobody is working on.
   */
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".claude/**"]),
]);

export default eslintConfig;
