import Link from "next/link";
import { redirect } from "next/navigation";
import { ReceiptCapture } from "@/components/receipts/ReceiptCapture";
import { Card, CardHead, DemoChip, PageHeader } from "@/components/ui/surfaces";
import { ocrIsDemo } from "@/lib/ocr";
import { currentSession } from "@/lib/session";

export const metadata = { title: "Scanner un reçu, Les Saveurs du Cap Bon" };
export const dynamic = "force-dynamic";

/**
 * Scanner un reçu.
 *
 * Open to everyone who works here. Sarra's rule is that the team can photograph a
 * receipt into the workspace even though only she sees what the shop spends, so this
 * screen carries no role gate at all. What happens to the receipt afterwards does.
 */
export default async function NewReceiptPage() {
  const session = await currentSession();
  if (!session) redirect("/connexion");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Scanner un reçu"
        subtitle="Photographiez le reçu, scannez son code QR s'il en a un, ou déposez un fichier. Vous vérifierez ce qui a été lu juste après."
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

      <ReceiptCapture canWrite={session.canWrite} demoReader={ocrIsDemo()} />

      <Card>
        <CardHead title="Ce qui se passe ensuite" />
        <ol className="flex flex-col gap-2 text-sm text-muted">
          <li>
            <span className="font-semibold text-ink">1.</span> Le fichier est vérifié, puis rangé
            dans un espace privé. Il n&apos;a pas d&apos;adresse publique et n&apos;est visible
            qu&apos;à travers un lien signé qui expire au bout de cinq minutes.
          </li>
          <li>
            <span className="font-semibold text-ink">2.</span> Le code QR, s&apos;il y en a un, est
            conservé tel quel. Il n&apos;est jamais ouvert automatiquement.
          </li>
          <li>
            <span className="font-semibold text-ink">3.</span> Le reçu est lu et les montants sont
            proposés, avec pour chacun une indication de fiabilité.
          </li>
          <li>
            <span className="font-semibold text-ink">4.</span> Vous corrigez ce qui est faux. Rien
            n&apos;entre dans les dépenses avant que la propriétaire ne l&apos;ait vérifié.
          </li>
        </ol>
      </Card>
    </div>
  );
}
