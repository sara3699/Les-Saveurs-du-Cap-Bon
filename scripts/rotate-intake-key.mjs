/**
 * Issues a new website intake key and puts it where it belongs.
 *
 * The old key was committed to a public repository on 2026-09-10, so it has to be
 * replaced rather than merely deleted: git keeps the history, and anyone reading it would
 * still hold a working key. Rotating is what actually turns the leaked one into nothing.
 *
 * It signs in as the owner rather than reaching into the database, because
 * `set_website_intake_key` is owner-only and that check is the point. The new key is
 * shown once by the database and never again, so this writes it straight into
 * `.env.local`, which `.gitignore` covers. It is never printed, never logged, and never
 * returned to the terminal.
 *
 *   node scripts/rotate-intake-key.mjs
 *
 * Whoever wires up the shop's website gets the key from `.env.local` and puts it on
 * their server, never in a page a visitor can read. See docs-website-form.md.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const ENV_PATH = new URL("../.env.local", import.meta.url);
const CONNECTION = "e08bd046-cae7-4de7-ae2a-660a9f8c289f";
const VARIABLE = "WEBSITE_INTAKE_KEY";

const raw = readFileSync(ENV_PATH, "utf8");
const env = Object.fromEntries(
  raw
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const at = line.indexOf("=");
      return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
    }),
);

/**
 * Taken from the environment, never written down here. This repository is public, and a
 * script whose whole purpose is ending a credential leak should not add one.
 *
 *   OWNER_EMAIL=... OWNER_PASSWORD=... node scripts/rotate-intake-key.mjs
 */
const email = process.env.OWNER_EMAIL;
const password = process.env.OWNER_PASSWORD;
if (!email || !password) {
  console.error(
    "Set OWNER_EMAIL and OWNER_PASSWORD for the shop's owner, then run this again.\n" +
      "Only the owner may issue an intake key, and the database enforces that.",
  );
  process.exit(1);
}

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const { error: signInError } = await client.auth.signInWithPassword({ email, password });
if (signInError) {
  console.error(`The owner could not sign in: ${signInError.message}`);
  process.exit(1);
}

const { data, error } = await client.rpc("set_website_intake_key", { p_connection: CONNECTION });
if (error) {
  console.error(`The key could not be issued: ${error.message}`);
  process.exit(1);
}
if (typeof data !== "string" || data.length < 20) {
  console.error("The database did not return a key.");
  process.exit(1);
}

const line = `${VARIABLE}=${data}`;
const hasVariable = new RegExp(`^${VARIABLE}=.*$`, "m").test(raw);
const next = hasVariable
  ? raw.replace(new RegExp(`^${VARIABLE}=.*$`, "m"), line)
  : `${raw.replace(/\n*$/, "\n")}\n# The shop's website posts orders with this. Server side only, never in a page.\n${line}\n`;

writeFileSync(ENV_PATH, next);

// Masked on purpose. The whole point of this script is that the key does not travel.
console.log(
  `A new key was issued and written to .env.local as ${VARIABLE} ` +
    `(${data.slice(0, 4)}…${data.slice(-4)}, ${data.length} characters).`,
);
console.log("The key committed to the repository no longer works.");
