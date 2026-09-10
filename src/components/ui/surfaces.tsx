import Link from "next/link";

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return <section className={`os-card ${padded ? "p-4 sm:p-5" : ""} ${className}`}>{children}</section>;
}

export function CardHead({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] leading-tight">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl leading-tight sm:text-[26px]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

/**
 * Demo mode is stated wherever figures are shown. A reader should never have to
 * wonder whether these are their real orders.
 */
export function DemoChip({ className = "" }: { className?: string }) {
  return (
    <span
      title="Données d'exemple. Aucun compte Instagram, WhatsApp, Facebook ou Google n'est connecté, et rien ici ne contacte un client."
      className={`inline-flex items-center gap-2 rounded-full border border-accent-line bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-ink ${className}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
      Données d'exemple, aucun compte n'est connecté
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface-2 px-6 py-10 text-center">
      <h3 className="text-[15px]">{title}</h3>
      <p className="max-w-[46ch] text-sm text-muted">{body}</p>
      {action ? (
        <Link
          href={action.href}
          className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  détail,
  tone = "plain",
}: {
  label: string;
  value: string;
  détail?: string;
  tone?: "plain" | "money";
}) {
  const money = tone === "money";
  return (
    <div
      className={`os-card p-4 ${money ? "border-accent-line bg-gradient-to-b from-[#FFFDF6] to-[#FFF8E7]" : ""}`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`os-num mt-1 font-display text-[26px] font-bold leading-none tracking-tight ${money ? "text-accent-ink" : ""}`}
      >
        {value}
      </p>
      {détail ? <p className="mt-1.5 text-xs font-semibold text-muted">{détail}</p> : null}
    </div>
  );
}
