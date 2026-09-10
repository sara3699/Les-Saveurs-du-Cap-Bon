import Link from "next/link";
import { ManualOrderForm } from "@/components/orders/ManualOrderForm";
import { DemoChip, PageHeader } from "@/components/ui/surfaces";
import { getRepositories } from "@/lib/repositories";
import { currentSession } from "@/lib/session";

export const metadata = { title: "Nouvelle commande, Les Saveurs du Cap Bon" };

/**
 * The counter and the telephone. Everything the form needs to be filled in
 * without leaving the screen is loaded here and handed down, so the search box
 * and the product list answer instantly while someone is waiting to be served.
 */
export default async function NewOrderPage() {
  const repos = getRepositories();
  const [session, contacts, products, team] = await Promise.all([
    currentSession(),
    repos.contacts.list(),
    repos.workspace.products(),
    repos.workspace.team(),
  ]);

  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "fr");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Nouvelle commande"
        subtitle="Pour une commande prise au téléphone ou au comptoir. Le client, les articles, le total, et c'est enregistré."
        actions={
          <>
            <Link
              href="/orders"
              className="rounded-[var(--radius-md)] border border-line-strong bg-surface px-4 py-2 text-sm font-semibold"
            >
              Retour aux commandes
            </Link>
            <DemoChip />
          </>
        }
      />

      <ManualOrderForm
        canWrite={session?.canWrite ?? false}
        contacts={[...contacts]
          .sort(byName)
          .map((c) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email, city: c.city }))}
        products={[...products].sort(byName).map((p) => ({ id: p.id, name: p.name, price: p.price }))}
        team={team.map((m) => ({ id: m.id, name: m.name }))}
      />
    </div>
  );
}
