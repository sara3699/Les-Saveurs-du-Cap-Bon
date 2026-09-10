"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { currentSession } from "@/lib/session";
import { supabaseConfigured } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * The two things that can be done to the website connector, which is the one
 * connector on that screen that genuinely works.
 *
 * Both are written here rather than in the component, so the browser never gets
 * to decide who may do them. The session is read again on this side every time:
 * a flag that arrived from a page proves nothing, and the demonstration door has
 * to be refused here as well as hidden there.
 *
 * The key is never logged, never stored in clear and never shown twice. The
 * database keeps a bcrypt hash of it and hands the plain value back exactly once,
 * at the moment it is issued. Nothing below writes it anywhere else.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NO_DATABASE =
  "Cette copie tourne sur les fichiers de démonstration, sans base de données. Créer une clé ou envoyer un test demande une base.";
const SIGNED_OUT = "Votre session a expiré. Reconnectez-vous, puis recommencez.";
const DEMO_DOOR =
  "Vous êtes entré par la porte de démonstration : rien ne peut être enregistré depuis cette visite.";
const NOT_OWNER =
  "Seul le propriétaire de la boutique peut créer une clé. Demandez-la-lui.";
const NOT_FOUND = "Ce connecteur est introuvable. Rafraîchissez la page.";
const NOT_THE_SITE = "Ce connecteur n'est pas celui du site.";
const NOT_YOUR_SHOP = "Ce connecteur n'appartient pas à votre boutique.";
const KEY_FAILED = "La clé n'a pas pu être créée. Réessayez dans un instant.";
const TEST_FAILED = "Le test n'a pas pu être enregistré. Rien n'a été ajouté à la boîte de réception.";

/**
 * Kept unexported on purpose: a "use server" file may only export async
 * functions. The screen reads these shapes off each action's return type.
 */
interface ConnectorState {
  /** False when this copy reads the demonstration files, with no database. */
  live: boolean;
  /** When the current key was issued, or null when there has never been one. */
  keyIssuedAt: string | null;
  /** True only for a signed in account. */
  canWrite: boolean;
  /** True only for a signed in owner, the only role the database lets issue a key. */
  canIssue: boolean;
}

type IssueResult = { ok: true; key: string } | { ok: false; error: string };

type TestResult = { ok: true; conversationId: string } | { ok: false; error: string };

/** The customer a test belongs to. One is reused, so tests do not pile up. */
const TEST_CONTACT_NAME = "Test du formulaire du site";
const TEST_SUBJECT = "Test du formulaire du site";
const TEST_BODY =
  "Test écrit depuis l'écran Intégrations pour vérifier que le chemin du formulaire du site arrive bien ici. " +
  "Aucun client n'a envoyé ce message et personne n'a été contacté. Vous pouvez résoudre cette conversation.";

/**
 * What the card needs before it draws anything: whether a key exists, when it was
 * issued, and what this visitor is allowed to do.
 *
 * The hash is never selected. Whether a key exists is a date and nothing more,
 * which is exactly what the column intake_key_set_at holds.
 */
export async function websiteConnectorState(connectionId: string): Promise<ConnectorState> {
  const session = await currentSession();
  const canWrite = session?.canWrite ?? false;

  if (!supabaseConfigured() || !UUID.test(connectionId)) {
    return { live: false, keyIssuedAt: null, canWrite: false, canIssue: false };
  }

  const db = await supabaseServer();
  const { data } = await db
    .from("channel_connections")
    .select("intake_key_set_at")
    .eq("id", connectionId)
    .maybeSingle<{ intake_key_set_at: string | null }>();

  // Postgres writes an offset form where the screens expect a "Z" one, the same
  // normalisation the connectors repository does for every other timestamp.
  const raw = data?.intake_key_set_at ?? null;
  const at = raw ? new Date(raw) : null;

  return {
    live: true,
    keyIssuedAt: at && !Number.isNaN(at.getTime()) ? at.toISOString() : null,
    canWrite,
    canIssue: canWrite && session?.member.role === "owner",
  };
}

/**
 * Issue a new key for the site, and hand back the only copy of it there will
 * ever be.
 *
 * The database refuses this to anyone but the owner and would raise on the
 * attempt. The role is checked here first so the reader gets a sentence instead
 * of a failure, not because that check is the one that protects anything.
 */
export async function issueWebsiteKey(connectionId: string): Promise<IssueResult> {
  if (!supabaseConfigured()) return { ok: false, error: NO_DATABASE };
  if (!UUID.test(connectionId)) return { ok: false, error: NOT_FOUND };

  const session = await currentSession();
  if (!session) return { ok: false, error: SIGNED_OUT };
  if (!session.canWrite) return { ok: false, error: DEMO_DOOR };
  if (session.member.role !== "owner") return { ok: false, error: NOT_OWNER };

  const db = await supabaseServer();
  const { data, error } = await db.rpc("set_website_intake_key", { p_connection: connectionId });

  if (error || typeof data !== "string" || data.length === 0) {
    // The reason is logged. The key never is, here or anywhere else.
    console.error("set_website_intake_key", error?.message ?? "aucune clé renvoyée");
    return { ok: false, error: KEY_FAILED };
  }

  // So the card stops saying "aucune clé" the moment there is one.
  revalidatePath("/integrations");

  return { ok: true, key: data };
}

/**
 * Put one test request through the ordinary tables, so the owner can see for
 * herself where a submission from the site lands.
 *
 * It is written as the signed in member, through the request scoped client, so
 * the database applies its own rules to it. Nothing here uses a service key and
 * nothing here reaches a customer. The shop is read off the connection row, never
 * taken from the browser: a page left open on another workspace would otherwise
 * write into this one.
 */
export async function sendWebsiteTest(connectionId: string): Promise<TestResult> {
  if (!supabaseConfigured()) return { ok: false, error: NO_DATABASE };
  if (!UUID.test(connectionId)) return { ok: false, error: NOT_FOUND };

  const session = await currentSession();
  if (!session) return { ok: false, error: SIGNED_OUT };
  if (!session.canWrite) return { ok: false, error: DEMO_DOOR };

  const db = await supabaseServer();

  const { data: connection } = await db
    .from("channel_connections")
    .select("id, organization_id, channel")
    .eq("id", connectionId)
    .maybeSingle<{ id: string; organization_id: string; channel: string }>();

  if (!connection) return { ok: false, error: NOT_FOUND };

  // The attribution written below says "website" in so many words. Writing it
  // against any other connector would forge the one fact this product exists to
  // keep straight, so the connector has to be the site's.
  if (connection.channel !== "website") return { ok: false, error: NOT_THE_SITE };

  const organizationId = connection.organization_id;

  const { data: member } = await db
    .from("organization_members")
    .select("organization_id")
    .eq("id", session.member.id)
    .maybeSingle<{ organization_id: string }>();

  // Readable does not mean writable: the demonstration shop is readable by
  // everyone. Saying so here gives a sentence instead of a row level refusal.
  if (!member || member.organization_id !== organizationId) {
    return { ok: false, error: NOT_YOUR_SHOP };
  }

  // A conversation cannot exist without a customer, so a test needs one to belong
  // to. The same test customer is reused every time rather than a new one per
  // test, so the contact list does not fill up with lookalikes.
  const { data: known } = await db
    .from("contacts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", TEST_CONTACT_NAME)
    .is("archived_at", null)
    .limit(1)
    .maybeSingle<{ id: string }>();

  let contactId = known?.id ?? null;

  if (!contactId) {
    const { data: created, error: contactError } = await db
      .from("contacts")
      .insert({
        organization_id: organizationId,
        name: TEST_CONTACT_NAME,
        language: "français",
        first_touch_channel: "website",
        latest_touch_channel: "website",
      })
      .select("id")
      .single<{ id: string }>();

    if (contactError || !created) return { ok: false, error: TEST_FAILED };
    contactId = created.id;
  }

  const now = new Date().toISOString();
  // Unique per test: the database refuses a second attribution carrying the same
  // external id for the same shop and channel, which is what makes a repeated
  // submission from the real site harmless.
  const externalId = `test-${randomUUID()}`;

  const { data: attribution, error: attributionError } = await db
    .from("source_attributions")
    .insert({
      organization_id: organizationId,
      channel: "website",
      connection_id: connectionId,
      external_id: externalId,
      received_at: now,
    })
    .select("id")
    .single<{ id: string }>();

  if (attributionError || !attribution) return { ok: false, error: TEST_FAILED };

  const { data: conversation, error: conversationError } = await db
    .from("conversations")
    .insert({
      organization_id: organizationId,
      contact_id: contactId,
      attribution_id: attribution.id,
      subject: TEST_SUBJECT,
      status: "new",
      unread_count: 1,
      last_message_at: now,
    })
    .select("id")
    .single<{ id: string }>();

  // PostgREST sends one request per table, so these three writes are not one
  // transaction. What follows takes the earlier rows back out rather than leaving
  // a source with nothing attached to it, which would count as a request the shop
  // never received.
  if (conversationError || !conversation) {
    await db.from("source_attributions").delete().eq("id", attribution.id);
    return { ok: false, error: TEST_FAILED };
  }

  const { error: messageError } = await db.from("messages").insert({
    organization_id: organizationId,
    conversation_id: conversation.id,
    direction: "inbound",
    body: TEST_BODY,
    sent_at: now,
    external_id: externalId,
  });

  if (messageError) {
    await db.from("conversations").delete().eq("id", conversation.id);
    await db.from("source_attributions").delete().eq("id", attribution.id);
    return { ok: false, error: TEST_FAILED };
  }

  // Written after the rows it describes, never before, so no line here claims
  // something that did not happen. A trail that fails to be written does not turn
  // a test that worked into a failure; it is logged on the server instead.
  const { error: auditError } = await db.from("audit_logs").insert({
    organization_id: organizationId,
    actor_member_id: session.member.id,
    action: "connector.test_sent",
    entity: "channel_connection",
    entity_id: connectionId,
    detail: { channel: "website", conversation_id: conversation.id },
  });

  if (auditError) {
    console.error("audit_logs: connector.test_sent non enregistré", auditError.message);
  }

  revalidatePath("/integrations");
  revalidatePath("/inbox");

  return { ok: true, conversationId: conversation.id };
}
