import Link from "next/link";
import { DemoChip, PageHeader } from "@/components/ui/surfaces";

/**
 * A screen that is planned but not built. It says so plainly and lists what it
 * will hold, which is more use to the owner than an empty page pretending to
 * be finished.
 */
export function NextPass({
  title,
  purpose,
  contents,
}: {
  title: string;
  purpose: string;
  contents: string[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={title} subtitle={purpose} actions={<DemoChip />} />
      <section className="os-card max-w-[70ch] p-5">
        <h2 className="text-[15px]">Pas encore construit</h2>
        <p className="mt-2 text-sm text-muted">
          Cet écran arrive au prochain passage, une fois que les quatre écrans qui indiquent la
          source d'une commande auront été revus. Il contiendra :
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {contents.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
          >
            Retour au tableau de bord
          </Link>
          <Link
            href="/inbox"
            className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-2 text-sm font-semibold"
          >
            Ouvrir la boîte de réception
          </Link>
        </div>
      </section>
    </div>
  );
}
