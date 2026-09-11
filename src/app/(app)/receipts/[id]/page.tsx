import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReceiptReviewForm } from "@/components/receipts/ReceiptReviewForm";
import { ReceiptStatusPill, SourcePill } from "@/components/receipts/badges";
import { Card, CardHead, DemoChip, PageHeader } from "@/components/ui/surfaces";
import { RECEIPT_STATUS_COPY } from "@/lib/domain/receipts";
import { formatDateTime, timeAgo } from "@/lib/format";
import { DEMO_NOW } from "@/lib/mock/time";
import { ocrIsDemo } from "@/lib/ocr";
import { findDuplicates } from "@/lib/receipts/duplicates";
import { parseQrPayload } from "@/lib/receipts/qr";
import { getRepositories } from "@/lib/repositories";
import { canSeeFinances, currentSession } from "@/lib/session";

type Params = Promise<{ id: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Vérifier un reçu, Les Saveurs du Cap Bon" };
}

const EVENT_LABEL: Record<string, string> = {
  uploaded: "Déposé",
  extracted: "Lu automatiquement",
  extraction_failed: "Lecture échouée",
  corrected: "Corrigé",
  verified: "Vérifié",
  archived: "Archivé",
  reprocess_requested: "Relecture demandée",
};

/**
 * Vérifier un reçu.
 *
 * The original on one side, what was read from it on the other, and a person between
 * the two. Nothing here counts as an expense until that person says so, and only the
 * owner's word turns it into a figure.
 */
export default async function ReceiptReviewPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await currentSession();
  if (!session) redirect("/connexion");

  const repos = getRepositories();
  const receipt = await repos.receipts.byId(id);
  if (!receipt) notFound();

  const owner = canSeeFinances(session.member.role);
  // The database already hides a colleague's receipt from a real account. The
  // demonstration shop is readable by anyone, so the same rule is applied here too.
  if (!owner && receipt.uploadedById !== session.member.id) notFound();

  const [fingerprints, events] = await Promise.all([
    repos.receipts.fingerprints(),
    repos.receipts.events(receipt.id),
  ]);

  const duplicates = findDuplicates(
    {
      id: receipt.id,
      fileHash: null,
      merchantName: receipt.merchantName,
      receiptNumber: receipt.receiptNumber,
      purchaseDate: receipt.purchaseDate,
      totalAmount: receipt.totalAmount,
      currency: receipt.currency,
    },
    fingerprints,
  );

  const qr = receipt.qrPayload ? parseQrPayload(receipt.qrPayload) : null;
  const status = RECEIPT_STATUS_COPY[receipt.status];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={receipt.merchantName ?? "Reçu à identifier"}
        subtitle={status.hint}
        actions={
          <>
            <Link
              href="/receipts"
              className="rounded-[var(--radius-md)] border border-line-strong bg-surface px-4 py-2 text-sm font-semibold"
            >
              Retour aux reçus
            </Link>
            <DemoChip />
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHead title="L'original" hint="Lien signé, valable cinq minutes" />
            {receipt.fileMime === "application/pdf" ? (
              <object
                data={`/api/receipts/${receipt.id}/file`}
                type="application/pdf"
                aria-label="Le reçu d'origine"
                className="h-[52vh] w-full rounded-[var(--radius-md)] border border-line bg-surface-2"
              >
                <p className="p-4 text-sm text-muted">
                  Ce navigateur n&apos;affiche pas le PDF ici.{" "}
                  <a
                    href={`/api/receipts/${receipt.id}/file`}
                    className="font-semibold text-primary hover:underline"
                  >
                    L&apos;ouvrir dans un onglet
                  </a>
                </p>
              </object>
            ) : receipt.fileMime === "image/heic" || receipt.fileMime === "image/heif" ? (
              <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-6 text-center">
                <p className="text-sm font-semibold">Fichier HEIC</p>
                <p className="mx-auto mt-1 max-w-[38ch] text-sm text-muted">
                  Aucun navigateur n&apos;affiche ce format, il n&apos;y a donc pas d&apos;aperçu
                  ici. Le fichier est bien enregistré.
                </p>
                <a
                  href={`/api/receipts/${receipt.id}/file`}
                  className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                >
                  Télécharger le fichier
                </a>
              </div>
            ) : (
              // Not next/image: the address is signed, expires, and is different every
              // time, so there is nothing for an optimiser to cache.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/receipts/${receipt.id}/file`}
                alt="Le reçu d'origine"
                className="w-full rounded-[var(--radius-md)] border border-line bg-surface-2"
              />
            )}

            <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
              <dt className="text-muted">État</dt>
              <dd className="text-right">
                <ReceiptStatusPill status={receipt.status} />
              </dd>
              <dt className="text-muted">Arrivé par</dt>
              <dd className="text-right">
                <SourcePill source={receipt.sourceType} />
              </dd>
              <dt className="text-muted">Déposé par</dt>
              <dd className="text-right font-semibold">{receipt.uploadedByName ?? "—"}</dd>
              <dt className="text-muted">Déposé</dt>
              <dd className="text-right font-semibold">{timeAgo(receipt.createdAt, DEMO_NOW)}</dd>
              <dt className="text-muted">Fichier</dt>
              <dd className="truncate text-right font-semibold" title={receipt.fileName ?? ""}>
                {receipt.fileName ?? "—"}
              </dd>
              <dt className="text-muted">Lu par</dt>
              <dd className="text-right font-semibold">
                {receipt.extractionProvider === "demo"
                  ? "Lecture de démonstration"
                  : receipt.extractionProvider ?? "Pas encore lu"}
              </dd>
              {receipt.verifiedByName ? (
                <>
                  <dt className="text-muted">Vérifié par</dt>
                  <dd className="text-right font-semibold">{receipt.verifiedByName}</dd>
                </>
              ) : null}
            </dl>

            {receipt.verificationUrl ? (
              <div className="mt-4 rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2">
                <p className="os-label text-xs font-semibold text-muted">
                  Adresse de vérification du code QR
                </p>
                <p className="mt-1 break-all font-mono text-xs">{receipt.verificationUrl}</p>
                <p className="mt-1 text-xs text-muted">
                  Conservée telle quelle. Ce produit ne l&apos;ouvre pas et ne l&apos;interroge pas.
                  Copiez-la si vous voulez la vérifier vous-même.
                </p>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHead title="Historique" hint="Ce qui est arrivé à ce reçu" />
            {events.length === 0 ? (
              <p className="text-sm text-muted">Rien encore.</p>
            ) : (
              <ol className="flex flex-col gap-2 text-sm">
                {events.map((event) => (
                  <li key={event.id} className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">
                      {EVENT_LABEL[event.action] ?? event.action}
                      {event.actorName ? (
                        <span className="ml-1 font-normal text-muted">par {event.actorName}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{formatDateTime(event.at)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <ReceiptReviewForm
          receipt={receipt}
          duplicates={duplicates}
          canWrite={session.canWrite}
          canVerify={owner}
          demoReader={ocrIsDemo()}
          qrReason={qr?.needsReview ? qr.reason : null}
        />
      </div>
    </div>
  );
}
