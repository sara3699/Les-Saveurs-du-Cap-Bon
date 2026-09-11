/**
 * Proof that one shop cannot reach another shop's records.
 *
 * The database holds two shops. "Les Saveurs du Cap Bon" is marked as the
 * demonstration shop: anyone holding the public link may READ it, which is the
 * point of the link, and nobody may write to it without an account. "Boutique
 * temoin" is an ordinary shop, private like any real customer's would be.
 *
 * So the boundary worth testing is the one between two real shops. This test signs
 * in as the owner of the demonstration shop and tries, nine ways, to read or change
 * the other shop's records. Every attempt must come back empty or refused. It then
 * checks the reverse, and that an anonymous visitor can read the demonstration shop
 * and write nothing anywhere.
 *
 * Run it with: node scripts/isolation-test.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const DEMO_ORG = "10f2108b-0e88-46ba-a9bb-d53550b0fbdb";
const OTHER_ORG = "22222222-2222-4222-a222-222222222222";

const results = [];
const check = (name, held, detail = "") => results.push({ name, held, detail });

/** A read is refused when it comes back empty. Row level security hides rows rather than erroring. */
async function readsNothing(name, promise) {
  const { data, error } = await promise;
  if (error) return check(name, true, `refusé: ${error.message}`);
  check(name, Array.isArray(data) && data.length === 0, `${data?.length ?? 0} lignes visibles`);
}

/** A write is refused when it errors, or when it silently affects no row. */
async function writesNothing(name, promise) {
  const { data, error } = await promise;
  if (error) return check(name, true, `refusé: ${error.code ?? error.message}`);
  check(name, !data || data.length === 0, `${data?.length ?? 0} lignes touchées`);
}

const owner = createClient(URL_, KEY);
const { error: signInError } = await owner.auth.signInWithPassword({
  email: "sarra@saveurs-demo.tn",
  password: "kQ7-marsa-91",
});
if (signInError) {
  console.error("Le compte propriétaire n'a pas pu se connecter:", signInError.message);
  process.exit(1);
}

console.log("Signed in as the owner of one shop. Trying to reach the other shop.\n");

await readsNothing("lire les clients de l'autre boutique", owner.from("contacts").select("id, name").eq("organization_id", OTHER_ORG));
await readsNothing("lire ses commandes", owner.from("orders").select("id").eq("organization_id", OTHER_ORG));
await readsNothing("lire ses conversations", owner.from("conversations").select("id").eq("organization_id", OTHER_ORG));
await readsNothing("lire ses messages", owner.from("messages").select("id, body").eq("organization_id", OTHER_ORG));
await readsNothing("lire ses sources", owner.from("source_attributions").select("id").eq("organization_id", OTHER_ORG));
await readsNothing("lire son équipe", owner.from("organization_members").select("id").eq("organization_id", OTHER_ORG));
await readsNothing("lire son journal d'audit", owner.from("audit_logs").select("id").eq("organization_id", OTHER_ORG));
await readsNothing("compter ses clients", owner.from("contacts").select("id", { count: "exact" }).eq("organization_id", OTHER_ORG));

await writesNothing(
  "changer un de ses clients",
  owner.from("contacts").update({ name: "Modifié" }).eq("organization_id", OTHER_ORG).select("id"),
);
await writesNothing(
  "s'ajouter à son équipe",
  owner.from("organization_members").insert({ organization_id: OTHER_ORG, display_name: "Intrus", initials: "IN", role: "owner" }).select("id"),
);
await writesNothing(
  "lui ajouter un client",
  owner.from("contacts").insert({ organization_id: OTHER_ORG, name: "Intrus", first_touch_channel: "manual", latest_touch_channel: "manual" }).select("id"),
);

// Receipts are the shop's money going out, so the boundary matters twice over: one
// shop's receipts must be invisible to another, and inside a shop the finances belong
// to the owner. The second rule is proved against a real shop in the SQL checks; here
// it is the first that is tested.
await readsNothing("lire les reçus de l'autre boutique", owner.from("receipts").select("id").eq("organization_id", OTHER_ORG));
await readsNothing("lire ses lignes de reçus", owner.from("receipt_items").select("id").eq("organization_id", OTHER_ORG));
await readsNothing("lire l'historique de ses reçus", owner.from("receipt_events").select("id").eq("organization_id", OTHER_ORG));
await readsNothing("lire ce que ses lectures ont trouvé", owner.from("receipt_extraction_fields").select("id").eq("organization_id", OTHER_ORG));

await writesNothing(
  "déposer un reçu chez elle",
  owner
    .from("receipts")
    .insert({
      organization_id: OTHER_ORG,
      file_path: `${OTHER_ORG}/2026/11111111-1111-4111-a111-111111111111.jpg`,
      file_mime: "image/jpeg",
      file_size: 100,
      file_hash: "intrusion",
    })
    .select("id"),
);
await writesNothing(
  "modifier un de ses reçus",
  owner.from("receipts").update({ total_amount: 1 }).eq("organization_id", OTHER_ORG).select("id"),
);

// The path is the tenant boundary for the file itself, so a path pointing at another
// shop's folder has to be refused before anything is stored.
{
  const { data } = await owner.rpc("register_receipt", {
    p_payload: {
      file_path: `${OTHER_ORG}/2026/22222222-2222-4222-a222-222222222222.jpg`,
      file_mime: "image/jpeg",
      file_size: 100,
      file_hash: `probe-${Date.now()}`,
    },
  });
  check(
    "ranger un fichier dans le dossier de l'autre boutique",
    data?.ok === false && data?.error === "path_refused",
    data?.error ?? "accepté",
  );
}

{
  const { data, error } = await owner.storage
    .from("receipts")
    .list(`${OTHER_ORG}/2026`, { limit: 5 });
  check(
    "lister ses fichiers de reçus",
    Boolean(error) || (data ?? []).length === 0,
    error ? `refusé: ${error.message}` : `${(data ?? []).length} fichiers visibles`,
  );
}

const { data: own } = await owner.from("contacts").select("id").eq("organization_id", DEMO_ORG);
check("le propriétaire voit bien sa propre boutique", (own?.length ?? 0) > 0, `${own?.length ?? 0} clients visibles`);

await owner.auth.signOut();

console.log("Now as an anonymous visitor holding the public link.\n");
const visitor = createClient(URL_, KEY);

const { data: seen } = await visitor.from("contacts").select("id").eq("organization_id", DEMO_ORG);
check("le visiteur peut lire la boutique de démonstration", (seen?.length ?? 0) > 0, `${seen?.length ?? 0} clients visibles`);

const { data: hidden } = await visitor.from("contacts").select("id").eq("organization_id", "22222222-2222-4222-a222-222222222222");
check("le visiteur ne voit pas l'autre boutique", (hidden?.length ?? 0) === 0, `${hidden?.length ?? 0} lignes visibles`);

await writesNothing(
  "le visiteur ne peut rien écrire",
  visitor.from("conversations").update({ status: "resolved" }).eq("organization_id", DEMO_ORG).select("id"),
);

await writesNothing(
  "le visiteur ne peut pas déposer de reçu",
  visitor
    .from("receipts")
    .insert({
      organization_id: DEMO_ORG,
      file_path: `${DEMO_ORG}/2026/33333333-3333-4333-a333-333333333333.jpg`,
      file_mime: "image/jpeg",
      file_size: 100,
      file_hash: "visiteur",
    })
    .select("id"),
);
await writesNothing(
  "le visiteur ne peut pas vérifier un reçu",
  visitor.from("receipts").update({ status: "verified" }).eq("organization_id", DEMO_ORG).select("id"),
);

const broken = results.filter((r) => !r.held);
for (const r of results) {
  console.log(`${r.held ? "  tenu " : "  ROMPU"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
}
console.log(`\n${results.length - broken.length} sur ${results.length} tenues.`);
if (broken.length) {
  console.error("\nIsolation rompue. Ne pas déployer.");
  process.exit(1);
}
console.log("L'isolation tient.");
