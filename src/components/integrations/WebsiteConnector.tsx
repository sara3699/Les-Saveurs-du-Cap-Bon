"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, useTransition } from "react";
import { issueWebsiteKey, sendWebsiteTest } from "@/app/(app)/integrations/actions";

/**
 * The working half of the Intégrations screen.
 *
 * Every other card there describes a connector that is not connected. This one
 * describes an address that answers, a key that is checked, and a test that
 * really lands in the boîte de réception. The wording keeps that line clear in
 * both directions: nothing here suggests the other cards do the same, and nothing
 * here pretends this one does less than it does.
 */

const PATH = "/api/intake/website";

/**
 * The address is read from the browser at render time, so it is right on
 * localhost and right on the deployed site without either being written down.
 * Reading it through useSyncExternalStore rather than an effect is what keeps the
 * server's first paint and the browser's first paint in agreement: the server has
 * no origin to offer, so it renders the path alone, which is still true.
 */
const NEVER_CHANGES = () => () => {};
const readOrigin = () => window.location.origin;
const readNothing = () => "";

/** Both shapes, as the site's own server would send them. */
function curlExample(endpoint: string): string {
  return [
    `curl -X POST ${endpoint} \\`,
    `  -H "Authorization: Bearer $SAVEURS_INTAKE_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"reference":"CDE-2026-0912","name":"Rania Trabelsi","phone":"+216 20 114 882","city":"Ariana","page":"lesmillesaveursducapbon.com/panier","delivery_fee":7.5,"items":[{"name":"Crème de pistache","sku":"LMS-PIS-01","quantity":2,"unit_price":42}]}'`,
  ].join("\n");
}

const QUESTION_EXAMPLE = [
  "{",
  '  "reference": "MSG-2026-0912",',
  '  "name": "Slim Ayari",',
  '  "email": "slim.ayari@outlook.com",',
  '  "subject": "Livraison à Sousse",',
  '  "message": "Est-ce que vous livrez à Sousse avant vendredi ?"',
  "}",
].join("\n");

interface Notice {
  failed: boolean;
  text: string;
  /** Set only when the notice has somewhere to send the reader. */
  href?: string;
  linkLabel?: string;
}

export function WebsiteConnector({
  connectionId,
  keyIssuedLabel,
  canIssue,
  canWrite,
  live,
}: {
  connectionId: string;
  /** The day the current key was issued, already written out. null if none. */
  keyIssuedLabel: string | null;
  /** True only for a signed in owner. */
  canIssue: boolean;
  /** True only for a signed in account. */
  canWrite: boolean;
  /** False when this copy reads the demonstration files, with no database. */
  live: boolean;
}) {
  const origin = useSyncExternalStore(NEVER_CHANGES, readOrigin, readNothing);
  const endpoint = `${origin}${PATH}`;

  // Held here and nowhere else. It is gone as soon as this page is left, which
  // is the same promise the block around it makes to the reader.
  const [key, setKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, startBusy] = useTransition();

  function issue() {
    setNotice(null);
    startBusy(async () => {
      const result = await issueWebsiteKey(connectionId);
      if (result.ok) {
        setKey(result.key);
        setCopied(false);
        return;
      }
      setNotice({ failed: true, text: result.error });
    });
  }

  function test() {
    setNotice(null);
    startBusy(async () => {
      const result = await sendWebsiteTest(connectionId);
      if (result.ok) {
        setNotice({
          failed: false,
          text: "Une demande de test a été ajoutée à la boîte de réception, avec Site web comme source.",
          href: `/inbox?c=${result.conversationId}`,
          linkLabel: "L'ouvrir",
        });
        return;
      }
      setNotice({ failed: true, text: result.error });
    });
  }

  async function copy() {
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
    } catch {
      setCopied(false);
      setNotice({
        failed: true,
        text: "La copie n'a pas fonctionné dans ce navigateur. Sélectionnez la clé et copiez-la à la main.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-3">
      <div>
        <h3 className="text-[13px] leading-tight">Brancher le formulaire de votre site</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Ce connecteur ne demande d'autorisation à personne : votre site envoie ses commandes à
          l'adresse ci-dessous avec une clé, et elles arrivent ici. Les autres cartes de cet
          écran attendent encore un compte, et rien de ce qui suit ne les concerne.
        </p>
      </div>

      <div>
        <p className="os-label">Adresse à appeler</p>
        <p className="os-scroll mt-1 whitespace-pre rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2 text-[12px]">
          <span className="os-num">POST {endpoint}</span>
        </p>
      </div>

      <div>
        <p className="os-label">La clé</p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          {keyIssuedLabel
            ? `Une clé est en place depuis le ${keyIssuedLabel}. Seule son empreinte est conservée, donc elle ne peut plus être affichée.`
            : "Aucune clé n'a encore été créée. Tant qu'il n'y en a pas, l'adresse refuse tout envoi."}
        </p>

        {live && canIssue ? (
          <button
            type="button"
            disabled={busy}
            onClick={issue}
            className="mt-2 rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-hi disabled:opacity-60"
          >
            {keyIssuedLabel ? "Créer une nouvelle clé" : "Créer une clé"}
          </button>
        ) : null}

        {live && !canIssue ? (
          <p className="mt-2 text-[12px] text-muted">
            {canWrite
              ? "Seul le propriétaire de la boutique peut créer une clé."
              : "La porte de démonstration ne peut rien enregistrer : la clé se crée depuis un compte propriétaire."}
          </p>
        ) : null}
      </div>

      {key ? (
        <div className="rounded-[var(--radius-md)] border border-accent-line bg-accent-soft p-3 text-accent-ink">
          <p className="os-label">La clé, affichée une seule fois</p>
          <div className="mt-1.5 flex flex-wrap items-start gap-2">
            <code className="os-num os-scroll min-w-0 flex-1 whitespace-pre rounded-[var(--radius-sm)] border border-accent-line bg-surface px-2.5 py-1.5 text-[12px]">
              {key}
            </code>
            <button
              type="button"
              onClick={() => void copy()}
              className="shrink-0 rounded-[var(--radius-sm)] border border-accent-line bg-surface px-2.5 py-1.5 text-[12px] font-semibold"
            >
              {copied ? "Copiée" : "Copier"}
            </button>
          </div>
          <p className="mt-2 rounded-[var(--radius-sm)] bg-danger-soft px-2.5 py-2 text-[12px] leading-relaxed text-danger">
            Copiez-la maintenant : elle ne sera plus jamais affichée. Elle se pose sur le serveur de
            votre site, jamais dans une page qu'un visiteur peut lire. Créer une nouvelle clé
            arrête immédiatement l'ancienne.
          </p>
        </div>
      ) : null}

      <div>
        <p className="os-label">Vérifier que cela arrive bien</p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Un test écrit une demande dans la boîte de réception, comme si elle venait du site. Rien
          n'est envoyé à un client.
        </p>

        {live && canWrite ? (
          <button
            type="button"
            disabled={busy}
            onClick={test}
            className="mt-2 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-1.5 text-[12px] font-medium disabled:opacity-60"
          >
            Envoyer une demande de test
          </button>
        ) : null}

        {live && !canWrite ? (
          <p className="mt-2 text-[12px] text-muted">
            Vous êtes entré par la porte de démonstration : rien ne peut être enregistré depuis cette
            visite.
          </p>
        ) : null}
      </div>

      {!live ? (
        <p className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2 text-[12px] leading-relaxed text-muted">
          Cette copie tourne sur les fichiers de démonstration, sans base de données. L'adresse
          et les exemples ci-dessous sont les bons, mais aucune clé ne peut être créée ici et
          l'adresse ne répondra pas.
        </p>
      ) : null}

      {notice ? (
        <p
          role="status"
          className={`rounded-[var(--radius-md)] border px-3 py-2 text-[12px] leading-relaxed ${
            notice.failed
              ? "border-line bg-danger-soft text-danger"
              : "border-accent-line bg-accent-soft text-accent-ink"
          }`}
        >
          {notice.text}
          {notice.href ? (
            <>
              {" "}
              <Link href={notice.href} className="font-semibold underline">
                {notice.linkLabel}
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <div>
        <p className="os-label">À donner à la personne qui branche le formulaire</p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Une soumission qui porte des articles devient une commande. Une soumission sans articles
          devient une conversation. La même <span className="os-num">reference</span> envoyée deux
          fois ne crée rien une seconde fois.
        </p>

        <p className="mt-2 text-[12px] text-muted">Une commande :</p>
        <pre className="os-scroll mt-1 whitespace-pre rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed">
          <code className="os-num">{curlExample(endpoint)}</code>
        </pre>

        <p className="mt-2 text-[12px] text-muted">
          Une demande, le même appel avec ce corps à la place :
        </p>
        <pre className="os-scroll mt-1 whitespace-pre rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed">
          <code className="os-num">{QUESTION_EXAMPLE}</code>
        </pre>
      </div>
    </div>
  );
}
