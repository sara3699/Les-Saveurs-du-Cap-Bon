import { readFileSync } from "node:fs";

/**
 * The demonstration accounts the tests sign in as.
 *
 * Read from `.env.local`, which `.gitignore` covers. These used to be written out in
 * full across ten files in a public repository, and the owner's account can write, so
 * anyone who read them could have signed in and changed the shop's data. They have been
 * changed; the ones in the history open nothing. Nothing that unlocks the shop goes back
 * into a file git tracks.
 *
 * Playwright compiles these specs to CommonJS, where `import.meta` does not exist, so
 * the path is relative to the working directory. Playwright always runs from the project
 * root, and both configurations here are rooted there.
 */

function fromEnvFile(name: string): string {
  const line = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((entry) => entry.startsWith(`${name}=`));
  if (!line) {
    throw new Error(
      `${name} is missing from .env.local. Set the demonstration passwords with:\n` +
        "  node scripts/rotate-demo-passwords.mjs",
    );
  }
  return line.slice(name.length + 1).trim();
}

export interface DemoAccount {
  email: string;
  password: string;
}

/** Sees everything, and is the only one who may verify a receipt. */
export const OWNER: DemoAccount = {
  email: fromEnvFile("DEMO_OWNER_EMAIL"),
  password: fromEnvFile("DEMO_OWNER_PASSWORD"),
};

/** Files receipts and answers customers, and sees none of the shop's figures. */
export const AGENT: DemoAccount = {
  email: fromEnvFile("DEMO_AGENT_EMAIL"),
  password: fromEnvFile("DEMO_AGENT_PASSWORD"),
};
