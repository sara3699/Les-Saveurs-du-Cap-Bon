import { NextResponse } from "next/server";
import { exportRows, toCsv } from "@/lib/receipts/expenses";
import { parseReceiptFilter, type SearchParams } from "@/lib/receipts/filters";
import { getRepositories } from "@/lib/repositories";
import { canSeeFinances, currentSession } from "@/lib/session";

/**
 * The expenses, as a file.
 *
 * It is a real export, not a button that pretends. It carries the receipts the filters
 * on the screen were showing, in the order they were shown, and it is the owner's
 * alone because it is the shop's finances in one file.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Votre session a expiré. Reconnectez-vous." },
      { status: 401 },
    );
  }
  if (!canSeeFinances(session.member.role)) {
    return NextResponse.json(
      { ok: false, error: "Seule la propriétaire peut exporter les dépenses." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const params: SearchParams = {};
  for (const key of url.searchParams.keys()) {
    params[key] = url.searchParams.getAll(key);
  }
  const view = parseReceiptFilter(params);

  const receipts = await getRepositories().receipts.list({
    statuses: view.statuses,
    categories: view.categories,
    merchantKey: view.merchantKey,
    search: view.search,
    from: view.from,
    to: view.to,
  });

  const csv = toCsv(exportRows(receipts));

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="depenses-${stamp()}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
