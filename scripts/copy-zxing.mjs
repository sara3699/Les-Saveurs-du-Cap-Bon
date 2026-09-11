/**
 * Puts the QR reader's WebAssembly file where the browser can fetch it from this
 * application rather than from somebody else's CDN.
 *
 * zxing-wasm loads its binary at runtime and, left alone, loads it from jsdelivr. That
 * would make scanning a receipt depend on a third party being up, and would send a
 * request to them every time somebody in the shop opens the scanner. Copying the file
 * into `public/` at build time costs a megabyte and removes both.
 *
 * It runs before `dev` and before `build`, so nothing has to be committed and nobody
 * has to remember. Run it on its own with: node scripts/copy-zxing.mjs
 */
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const from = join(root, "node_modules", "zxing-wasm", "dist", "reader", "zxing_reader.wasm");
const into = join(root, "public", "zxing");
const to = join(into, "zxing_reader.wasm");

try {
  statSync(from);
} catch {
  console.error(
    "zxing-wasm is not installed, so the QR reader has no WebAssembly file to serve.\n" +
      "Run npm install, then this script again.",
  );
  process.exit(1);
}

mkdirSync(into, { recursive: true });
copyFileSync(from, to);
console.log(`zxing reader copied to public/zxing/ (${Math.round(statSync(to).size / 1024)} KB)`);
