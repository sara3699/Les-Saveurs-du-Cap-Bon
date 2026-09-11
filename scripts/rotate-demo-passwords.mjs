/**
 * Changes the demonstration accounts' passwords and puts the new ones out of reach.
 *
 * Two of these accounts had their password written out in full across ten files in a
 * public repository. The owner's account can write, so anyone who read them could sign
 * in and change the shop's data. Deleting the lines does not fix that, because git keeps
 * the history; only a new password does.
 *
 * It changes each password the ordinary way: sign in as that person, then ask Supabase to
 * set a new one. No service key is involved, and there is none in this project to use.
 *
 * The new passwords are written straight into `.env.local`, which `.gitignore` covers.
 * They are never printed, never logged, and never returned to the terminal.
 *
 *   CURRENT_OWNER_PASSWORD=... CURRENT_AGENT_PASSWORD=... node scripts/rotate-demo-passwords.mjs
 *
 * After the first run the current passwords are read from `.env.local`, so later
 * rotations need no arguments at all.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const ENV_PATH = new URL("../.env.local", import.meta.url);

function readEnv() {
  const raw = readFileSync(ENV_PATH, "utf8");
  const values = Object.fromEntries(
    raw
      .split("\n")
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
      }),
  );
  return { raw, values };
}

function writeVariables(raw, entries) {
  let next = raw;
  for (const [name, value] of Object.entries(entries)) {
    const line = `${name}=${value}`;
    const pattern = new RegExp(`^${name}=.*$`, "m");
    next = pattern.test(next) ? next.replace(pattern, line) : `${next.replace(/\n*$/, "\n")}${line}\n`;
  }
  writeFileSync(ENV_PATH, next);
}

/** Long and random. Nobody types these: the tests read them from .env.local. */
function newPassword() {
  return randomBytes(24).toString("base64url");
}

const ACCOUNTS = [
  {
    label: "owner",
    email: "sarra@saveurs-demo.tn",
    currentFrom: "CURRENT_OWNER_PASSWORD",
    emailVariable: "DEMO_OWNER_EMAIL",
    passwordVariable: "DEMO_OWNER_PASSWORD",
  },
  {
    label: "agent",
    email: "mouna@saveurs-demo.tn",
    currentFrom: "CURRENT_AGENT_PASSWORD",
    emailVariable: "DEMO_AGENT_EMAIL",
    passwordVariable: "DEMO_AGENT_PASSWORD",
  },
];

const { raw, values } = readEnv();
const url = values.NEXT_PUBLIC_SUPABASE_URL;
const key = values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be in .env.local.");
  process.exit(1);
}

const changed = {};
for (const account of ACCOUNTS) {
  const current = process.env[account.currentFrom] ?? values[account.passwordVariable];
  if (!current) {
    console.error(
      `No current password for the ${account.label}. Pass it as ${account.currentFrom}, ` +
        `or put ${account.passwordVariable} in .env.local.`,
    );
    process.exit(1);
  }

  const client = createClient(url, key, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({
    email: account.email,
    password: current,
  });
  if (signInError) {
    console.error(`The ${account.label} could not sign in with the password given: ${signInError.message}`);
    process.exit(1);
  }

  const password = newPassword();
  const { error: updateError } = await client.auth.updateUser({ password });
  if (updateError) {
    console.error(`The ${account.label}'s password could not be changed: ${updateError.message}`);
    process.exit(1);
  }
  await client.auth.signOut();

  // Prove it before recording it. A password written down that does not work is worse
  // than one that was never changed.
  const check = createClient(url, key, { auth: { persistSession: false } });
  const { error: recheckError } = await check.auth.signInWithPassword({
    email: account.email,
    password,
  });
  if (recheckError) {
    console.error(`The ${account.label}'s new password does not work: ${recheckError.message}`);
    process.exit(1);
  }
  await check.auth.signOut();

  changed[account.emailVariable] = account.email;
  changed[account.passwordVariable] = password;
  console.log(`${account.label}: changed and confirmed (${password.length} characters).`);
}

writeVariables(raw, changed);
console.log("Written to .env.local. The passwords in the repository's history no longer work.");
