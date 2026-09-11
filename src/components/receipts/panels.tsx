import Link from "next/link";
import { CategoryPill, ConfidenceMark, ReceiptStatusPill } from "./badges";
import { Card, CardHead, EmptyState } from "@/components/ui/surfaces";
import {
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_CATEGORY_ORDER,
  RECEIPT_STATUS_COPY,
  RECEIPT_STATUS_ORDER,
  type Receipt,
} from "@/lib/domain/receipts";
import type { CategoryRow, MonthBar, SupplierRow } from "@/lib/receipts/expenses";
import type { ReceiptView } from "@/lib/receipts/filters";
import { formatDate, formatTND, formatTNDCompact } from "@/lib/format";

/**
 * The reading half of the expenses screen.
 *
 * Every figure here comes from verified receipts only. A panel that quietly included an
 * unconfirmed reading would make the review step decorative, which is the one thing
 * this feature cannot afford.
 */

export function ExpenseCategoryPanel({
  rows,
  current,
}: {
  rows: CategoryRow[];
  current: ReceiptView["raw"];
}) {
  const top = rows[0]?.total ?? 0;
  return (
    <Card>
      <CardHead title="Par catégorie" hint="Reçus vérifiés uniquement" />
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Aucun reçu vérifié sur cette période.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <li key={row.category}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <Link
                  href={`/receipts?categorie=${row.category}`}
                  className="font-semibold hover:text-primary hover:underline"
                >
                  {EXPENSE_CATEGORY_LABEL[row.category]}
                </Link>
                <span className="os-num tabular-nums font-semibold">{formatTND(row.total)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${top === 0 ? 0 : (row.total / top) * 100}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-xs text-muted">
                  {row.count} reçu{row.count > 1 ? "s" : ""} · {row.share} %
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {current.categorie.length > 0 ? (
        <Link href="/receipts" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
          Retirer le filtre par catégorie
        </Link>
      ) : null}
    </Card>
  );
}

export function ExpenseTrendPanel({ bars }: { bars: MonthBar[] }) {
  const tallest = Math.max(1, ...bars.map((bar) => bar.total));
  return (
    <Card>
      <CardHead title="Dépenses dans le temps" hint="Les douze derniers mois, reçus vérifiés" />
      <div className="flex h-40 items-end gap-1.5">
        {bars.map((bar) => (
          <div key={bar.month} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              title={`${bar.label} : ${formatTND(bar.total)} sur ${bar.count} reçu${bar.count > 1 ? "s" : ""}`}
              className="w-full rounded-t-[4px] bg-primary-mute transition-colors hover:bg-primary"
              style={{ height: `${Math.max(2, (bar.total / tallest) * 100)}%` }}
            />
            <span className="text-[10px] text-muted">{bar.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SupplierPanel({ rows }: { rows: SupplierRow[] }) {
  return (
    <Card>
      <CardHead title="Par fournisseur" hint="Les dix premiers, reçus vérifiés" />
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Aucun fournisseur pour l&apos;instant.</p>
      ) : (
        <div className="os-scroll overflow-x-auto">
          <table aria-label="Dépenses par fournisseur" className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="pb-2 font-semibold">Fournisseur</th>
                <th className="pb-2 text-right font-semibold">Reçus</th>
                <th className="pb-2 text-right font-semibold">Dernier achat</th>
                <th className="pb-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((row) => (
                <tr key={row.key} className="border-b border-line/60">
                  <td className="py-2 pr-2">
                    <Link
                      href={`/receipts?fournisseur=${encodeURIComponent(row.key)}`}
                      className="font-semibold hover:text-primary hover:underline"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted">{row.count}</td>
                  <td className="py-2 text-right text-muted">
                    {row.lastPurchaseDate ? formatDate(row.lastPurchaseDate) : "—"}
                  </td>
                  <td className="os-num py-2 text-right font-semibold tabular-nums">
                    {formatTNDCompact(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function ReceiptsTable({ receipts }: { receipts: Receipt[] }) {
  if (receipts.length === 0) {
    return (
      <EmptyState
        title="Aucun reçu ne correspond"
        body="Changez les filtres, ou scannez un premier reçu pour commencer à suivre les dépenses."
        action={{ label: "Scanner un reçu", href: "/receipts/nouveau" }}
      />
    );
  }

  return (
    <div className="os-scroll overflow-x-auto">
      <table aria-label="Les reçus" className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="pb-2 font-semibold">Date</th>
            <th className="pb-2 font-semibold">Fournisseur</th>
            <th className="pb-2 font-semibold">Catégorie</th>
            <th className="pb-2 font-semibold">État</th>
            <th className="pb-2 font-semibold">Lecture</th>
            <th className="pb-2 font-semibold">Déposé par</th>
            <th className="pb-2 text-right font-semibold">TVA</th>
            <th className="pb-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((receipt) => (
            <tr key={receipt.id} className="border-b border-line/60 hover:bg-surface-2">
              <td className="py-2.5 pr-2 whitespace-nowrap text-muted">
                {receipt.purchaseDate ? formatDate(receipt.purchaseDate) : "Date à saisir"}
              </td>
              <td className="py-2.5 pr-2">
                <Link
                  href={`/receipts/${receipt.id}`}
                  className="font-semibold hover:text-primary hover:underline"
                >
                  {receipt.merchantName ?? "Fournisseur à saisir"}
                </Link>
                {receipt.receiptNumber ? (
                  <span className="ml-2 text-xs text-faint">n° {receipt.receiptNumber}</span>
                ) : null}
              </td>
              <td className="py-2.5 pr-2">
                <CategoryPill category={receipt.category} />
              </td>
              <td className="py-2.5 pr-2">
                <ReceiptStatusPill status={receipt.status} />
              </td>
              <td className="py-2.5 pr-2">
                <ConfidenceMark confidence={receipt.extractionConfidence} />
              </td>
              <td className="py-2.5 pr-2 text-muted">{receipt.uploadedByName ?? "—"}</td>
              <td className="os-num py-2.5 text-right tabular-nums text-muted">
                {receipt.taxAmount === null ? "—" : formatTND(receipt.taxAmount, { withCurrency: false })}
              </td>
              <td className="os-num py-2.5 text-right font-semibold tabular-nums">
                {receipt.totalAmount === null
                  ? "—"
                  : formatTND(receipt.totalAmount, { withCurrency: false })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A plain GET form, so the filters work with no JavaScript at all and the address bar
 * carries the state. That is also what makes the export able to reproduce exactly what
 * is on the screen: it reads the same address.
 */
export function ReceiptFilters({
  view,
  suppliers,
}: {
  view: ReceiptView;
  suppliers: { key: string; name: string }[];
}) {
  const field =
    "w-full min-w-0 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-2 text-[13px]";
  const label = "flex flex-col gap-1";
  const caption = "os-label text-xs font-semibold text-muted";

  return (
    <form method="get" className="os-card flex flex-col gap-3 p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <label className={`${label} lg:col-span-2`}>
          <span className={caption}>Rechercher</span>
          <input
            type="search"
            name="q"
            defaultValue={view.raw.q}
            placeholder="Fournisseur, numéro, note"
            className={field}
          />
        </label>
        <label className={label}>
          <span className={caption}>État</span>
          <select name="statut" defaultValue={view.raw.statut[0] ?? ""} className={field}>
            <option value="">Tous</option>
            {RECEIPT_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {RECEIPT_STATUS_COPY[status].label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          <span className={caption}>Catégorie</span>
          <select name="categorie" defaultValue={view.raw.categorie[0] ?? ""} className={field}>
            <option value="">Toutes</option>
            {EXPENSE_CATEGORY_ORDER.map((category) => (
              <option key={category} value={category}>
                {EXPENSE_CATEGORY_LABEL[category]}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          <span className={caption}>Fournisseur</span>
          <select name="fournisseur" defaultValue={view.raw.fournisseur} className={field}>
            <option value="">Tous</option>
            {suppliers.map((supplier) => (
              <option key={supplier.key} value={supplier.key}>
                {supplier.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className={label}>
            <span className={caption}>Du</span>
            <input type="date" name="du" defaultValue={view.raw.du} className={field} />
          </label>
          <label className={label}>
            <span className={caption}>Au</span>
            <input type="date" name="au" defaultValue={view.raw.au} className={field} />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
        >
          Filtrer
        </button>
        {view.active ? (
          <Link
            href="/receipts"
            className="rounded-[var(--radius-md)] border border-line-strong bg-surface px-4 py-2 text-sm font-semibold"
          >
            Tout afficher
          </Link>
        ) : null}
      </div>
    </form>
  );
}

/**
 * The one line about money going out that belongs on the main dashboard. The owner's
 * only, because the rest of that screen is money coming in and everyone sees it.
 */
export function ExpensesGlance({
  summary,
  topCategory,
}: {
  summary: { total: number; taxTotal: number; awaitingCount: number; errorCount: number };
  topCategory: CategoryRow | null;
}) {
  return (
    <Card>
      <CardHead
        title="Reçus et dépenses"
        hint="Seuls les reçus vérifiés comptent"
        action={
          <Link href="/receipts" className="text-xs font-semibold text-primary hover:underline">
            Tout voir
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted">Dépenses vérifiées</p>
          <p className="os-num mt-1 font-display text-[22px] font-bold leading-none tracking-tight">
            {formatTNDCompact(summary.total)}
          </p>
          <p className="mt-1 text-xs text-muted">dont {formatTNDCompact(summary.taxTotal)} de TVA</p>
        </div>
        <div>
          <p className="text-xs text-muted">À vérifier</p>
          <p className="os-num mt-1 font-display text-[22px] font-bold leading-none tracking-tight">
            {summary.awaitingCount}
          </p>
          <p className="mt-1 text-xs text-muted">
            {summary.errorCount > 0
              ? `${summary.errorCount} lecture${summary.errorCount > 1 ? "s" : ""} en erreur`
              : "Aucune lecture en erreur"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Premier poste</p>
          <p className="mt-1 text-[15px] font-semibold leading-tight">
            {topCategory ? topCategory.label : "Aucun pour l'instant"}
          </p>
          {topCategory ? (
            <p className="mt-1 text-xs text-muted">
              {formatTNDCompact(topCategory.total)} · {topCategory.share} %
            </p>
          ) : null}
        </div>
      </div>
      <Link
        href="/receipts/nouveau"
        className="mt-4 inline-block rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
      >
        Scanner un reçu
      </Link>
    </Card>
  );
}
