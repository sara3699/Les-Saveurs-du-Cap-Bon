import { ConnectionPill, SourceBadge } from "@/components/ui/badges";
import { ConnectorActions } from "@/components/integrations/ConnectorActions";
import { Card, DemoChip, PageHeader } from "@/components/ui/surfaces";
import { channel } from "@/lib/domain/channels";
import type { ChannelConnection } from "@/lib/domain/types";
import { timeAgo } from "@/lib/format";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Integrations, Les Saveurs du Cap Bon" };

// The demo clock moves with the visit, so these pages are rendered per request
// rather than frozen into the build.
export const dynamic = "force-dynamic";

function primaryLabel(connection: ChannelConnection): string {
  if (connection.planned) return "Read what is planned";
  switch (connection.status) {
    case "connected":
      return "Setup guide";
    case "error":
      return "Reconnect";
    case "warning":
      return "Fix the warning";
    default:
      return "Continue setup";
  }
}

function ConnectorCard({ connection }: { connection: ChannelConnection }) {
  const def = channel(connection.channelId);
  const broken = connection.status === "error";
  return (
    <Card className={`flex flex-col gap-3 ${broken ? "border-danger/25" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] leading-tight">{connection.accountLabel}</h2>
          <p className="mt-1">
            <SourceBadge channelId={connection.channelId} size="sm" />
          </p>
        </div>
        <ConnectionPill status={connection.status} />
      </div>

      <p className="text-[13px] leading-relaxed text-muted">{connection.summary}</p>

      <dl className="flex flex-col gap-1 text-[12px]">
        <Row label="Needs" value={connection.requires} />
        <Row
          label="Permissions"
          value={connection.permissions.length ? connection.permissions.join(", ") : "None"}
          mono={connection.permissions.length > 0}
        />
        <Row
          label="Last order received"
          value={connection.lastEventAt ? timeAgo(connection.lastEventAt, DEMO_NOW) : "Never"}
        />
        <Row
          label="Last check"
          value={connection.lastSyncAt ? timeAgo(connection.lastSyncAt, DEMO_NOW) : "Never"}
        />
        <Row label="Events this week" value={String(connection.eventsThisWeek)} mono />
      </dl>

      {connection.lastErrorMessage ? (
        <p className="rounded-[var(--radius-sm)] border border-danger/20 bg-danger-soft px-3 py-2 text-[12px] text-danger">
          <span className="font-semibold">
            {connection.lastErrorAt ? `${timeAgo(connection.lastErrorAt, DEMO_NOW)}: ` : ""}
          </span>
          {connection.lastErrorMessage}
        </p>
      ) : null}

      {connection.outstanding.length > 0 ? (
        <div className="rounded-[var(--radius-sm)] border border-accent-line bg-accent-soft px-3 py-2 text-[12px] text-accent-ink">
          <p className="font-semibold">Still to do</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {connection.outstanding.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {connection.reviewNote ? (
        <p className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12px] text-muted">
          {connection.reviewNote}
        </p>
      ) : null}

      <ConnectorActions
        name={connection.accountLabel}
        channelLabel={def.label}
        canTest={connection.status === "connected" || connection.status === "warning"}
        canDisconnect={connection.status === "connected" || connection.status === "warning" || connection.status === "error"}
        primaryLabel={primaryLabel(connection)}
        guideHref={connection.setupGuideHref}
      />
    </Card>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className={`text-right ${mono ? "os-num text-[11px]" : ""}`}>{value}</dd>
    </div>
  );
}

export default async function IntegrationsPage() {
  const connections = await getRepositories().integrations.list();
  const working = connections.filter((c) => c.status === "connected");
  const needsWork = connections.filter(
    (c) => !c.planned && (c.status === "setup_required" || c.status === "warning" || c.status === "error"),
  );
  const planned = connections.filter((c) => c.planned);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Integrations"
        subtitle="Where your orders come in from, what is connected, and what is half done. No card here claims more than it can do."
        actions={<DemoChip />}
      />

      <section className="flex flex-col gap-3">
        <h2 className="os-label">Needs your attention, {needsWork.length}</h2>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {needsWork.map((c) => (
            <ConnectorCard key={c.id} connection={c} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="os-label">Working, {working.length}</h2>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {working.map((c) => (
            <ConnectorCard key={c.id} connection={c} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="os-label">Planned, {planned.length}</h2>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {planned.map((c) => (
            <ConnectorCard key={c.id} connection={c} />
          ))}
        </div>
        <p className="max-w-[70ch] text-xs text-muted">
          Google Business Profile and Gmail are separate connectors from Google Ads on purpose. A
          review left on your Business Profile is not a lead, and treating them as one source would
          make the Google row on your dashboard meaningless.
        </p>
      </section>
    </div>
  );
}
