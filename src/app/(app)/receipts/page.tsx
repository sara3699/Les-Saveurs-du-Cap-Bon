import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ExpenseCategoryPanel,
  ExpenseTrendPanel,
  ReceiptFilters,
  ReceiptsTable,
  SupplierPanel,
} from "@/components/receipts/panels";
import { DemoReaderNotice } from "@/components/receipts/badges";
import { Card, CardHead, DemoChip, PageHeader, Stat } from "@/components/ui/surfaces";
import { formatTND, formatTNDCompact } from "@/lib/format";
import { DEMO_NOW } from "@/lib/mock/time";
import { ocrIsDemo } from "@/lib/ocr";
import {
  expensesByCategory,
  expensesBySupplier,
  expensesOverTime,
  summarizeExpenses,
  supplierOptions,
} from "@/lib/receipts/expenses";
import { parseReceiptFilter, type SearchParams } from "@/lib/receipts/filters";
import { getRepositories } from "@/lib/repositories";
import { canSeeFinances, currentSession } from "@/lib/session";

export const metadata = { title: "Reçus et dépenses, Les Saveurs du Cap Bon" };
export const dynamic = "force-dynamic";

/**
 * Reçus et dépenses.
 *
 * Two screens behind one address. The owner sees the shop's money going out: totals,
 * TVA, categories, suppliers, and every receipt anyone filed. Everyone else sees the
 * receipts they filed themselves and no totals at all, because the finances are not
 * theirs to read. For a real account the database enforces that as well; for the
 * demonstration shop, which anyone with the link may read, this is where it is enforced.
 */
export default async function ReceiptsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await currentSession();
  if (!session) redirect("/connexion");

  const view = parseReceiptFilter(await searchParams);
  const owner = canSeeFinances(session.member.role);
  const repos = getRepositories();

  const receipts = await repos.receipts.list({
    statuses: view.statuses,
    categories: view.categories,
    merchantKey: view.merchantKey,
    search: view.search,
    from: view.from,
    to: view.to,
    // Belt and braces for the demonstration shop, where the database cannot tell one
    // visitor from another.
    uploadedById: owner ? undefined : session.member.id,
  });

  const everything = view.active
    ? await repos.receipts.list({ uploadedById: owner ? undefined : session.member.id })
    : receipts;

  const demoReader = ocrIsDemo();
  const summary = summarizeExpenses(receipts);

  const scanButton = (
    <Link
      href="/receipts/nouveau"
      className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
    >
      Scanner un reçu
    </Link>
  );

  if (!owner) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Mes reçus"
          subtitle="Les reçus que vous avez déposés. Les totaux de la boutique ne sont visibles que par la propriétaire."
          actions={
            <>
              {scanButton}
              <DemoChip />
            </>
          }
        />
        {demoReader ? <DemoReaderNotice /> : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Reçus déposés" value={String(summary.receiptCount)} />
          <Stat
            label="En attente de vérification"
            value={String(summary.awaitingCount)}
            detail="La propriétaire les confirme"
          />
          <Stat
            label="Lectures en erreur"
            value={String(summary.errorCount)}
            detail="À relire ou à saisir à la main"
          />
        </div>
        <Card padded={false} className="p-4 sm:p-5">
          <CardHead title="Ce que vous avez déposé" hint="Du plus récent au plus ancien" />
          <ReceiptsTable receipts={receipts} />
        </Card>
      </div>
    );
  }

  const categories = expensesByCategory(receipts);
  const suppliers = expensesBySupplier(receipts);
  const trend = expensesOverTime(receipts, 12, DEMO_NOW);
  const options = supplierOptions(everything);

  // The export reads the same address as the screen, so a downloaded file holds
  // exactly what was being looked at.
  const query = new URLSearchParams();
  if (view.raw.statut.length) query.set("statut", view.raw.statut.join(","));
  if (view.raw.categorie.length) query.set("categorie", view.raw.categorie.join(","));
  if (view.raw.fournisseur) query.set("fournisseur", view.raw.fournisseur);
  if (view.raw.q) query.set("q", view.raw.q);
  if (view.raw.du) query.set("du", view.raw.du);
  if (view.raw.au) query.set("au", view.raw.au);
  const exportUrl = query.toString()
    ? `/api/receipts/export.csv?${query}`
    : "/api/receipts/export.csv";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Reçus et dépenses"
        subtitle={
          view.active
            ? `${receipts.length} reçus correspondent aux filtres. Seuls les reçus vérifiés comptent dans les totaux.`
            : "Ce que la boutique dépense. Un reçu ne compte dans les totaux qu'une fois que vous l'avez vérifié."
        }
        actions={
          <>
            {scanButton}
            <a
              href={exportUrl}
              className="rounded-[var(--radius-md)] border border-line-strong bg-surface px-4 py-2 text-sm font-semibold"
            >
              Exporter en CSV
            </a>
            <DemoChip />
          </>
        }
      />

      {demoReader ? <DemoReaderNotice /> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Dépenses vérifiées"
          value={formatTNDCompact(summary.total)}
          detail={`Sur ${summary.verifiedCount} reçu${summary.verifiedCount > 1 ? "s" : ""} vérifié${summary.verifiedCount > 1 ? "s" : ""}`}
          tone="money"
        />
        <Stat
          label="TVA totale"
          value={formatTNDCompact(summary.taxTotal)}
          detail={`Ticket moyen ${formatTND(summary.average)}`}
        />
        <Stat
          label="Reçus enregistrés"
          value={String(summary.receiptCount)}
          detail={`${summary.draftCount} brouillon${summary.draftCount > 1 ? "s" : ""}, ${summary.archivedCount} archivé${summary.archivedCount > 1 ? "s" : ""}`}
        />
        <Stat
          label="À vérifier"
          value={String(summary.awaitingCount)}
          detail={
            summary.errorCount > 0
              ? `${summary.errorCount} lecture${summary.errorCount > 1 ? "s" : ""} en erreur`
              : "Aucune lecture en erreur"
          }
        />
      </div>

      {summary.awaitingCount > 0 || summary.errorCount > 0 ? (
        <div className="flex flex-wrap gap-2">
          {summary.awaitingCount > 0 ? (
            <Link
              href="/receipts?statut=to_verify"
              className="rounded-full border border-accent-line bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-ink"
            >
              Voir les {summary.awaitingCount} reçus à vérifier
            </Link>
          ) : null}
          {summary.errorCount > 0 ? (
            <Link
              href="/receipts?statut=error"
              className="rounded-full border border-danger/25 bg-danger-soft px-3 py-1.5 text-xs font-semibold text-danger"
            >
              Voir les {summary.errorCount} lectures en erreur
            </Link>
          ) : null}
        </div>
      ) : null}

      <ReceiptFilters view={view} suppliers={options} />

      <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
        <ExpenseCategoryPanel rows={categories} current={view.raw} />
        <SupplierPanel rows={suppliers} />
      </div>

      <ExpenseTrendPanel bars={trend} />

      <Card>
        <CardHead
          title="Les reçus"
          hint="Un reçu à vérifier est visible ici mais ne compte dans aucun total"
        />
        <ReceiptsTable receipts={receipts} />
      </Card>
    </div>
  );
}
