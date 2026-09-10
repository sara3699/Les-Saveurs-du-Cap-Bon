import Link from "next/link";
import { notFound } from "next/navigation";
import { DeliveryPill, PaymentPill, SourceBadge } from "@/components/ui/badges";
import { Card, CardHead, PageHeader } from "@/components/ui/surfaces";
import { buildAttributionIndex, orderSource, touchSummary } from "@/lib/domain/attribution";
import { channel } from "@/lib/domain/channels";
import { formatDateTime, formatTND, timeAgo } from "@/lib/format";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";

type Params = Promise<{ reference: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { reference } = await params;
  return { title: `${decodeURIComponent(reference)}, Les Saveurs du Cap Bon` };
}

export default async function OrderDetailPage({ params }: { params: Params }) {
  const { reference } = await params;
  const repos = getRepositories();
  const order = await repos.orders.byReference(decodeURIComponent(reference));
  if (!order) notFound();

  const [contact, team, connections, attributions] = await Promise.all([
    repos.contacts.byId(order.contactId),
    repos.workspace.team(),
    repos.integrations.list(),
    repos.workspace.attributions(),
  ]);

  const index = buildAttributionIndex(attributions, connections);
  const source = orderSource(order, index);
  const assignee = team.find((m) => m.id === order.assigneeId) ?? null;
  const goods = order.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const touches = contact
    ? touchSummary(contact.firstTouchChannel, contact.latestTouchChannel)
    : null;

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: "Channel", value: <SourceBadge channelId={source.channelId} account={source.accountLabel} /> },
    {
      label: "Connected account",
      value: source.accountLabel ?? (
        <span className="text-muted">None. This order was typed in by your team.</span>
      ),
    },
    {
      label: "Provider reference",
      value: source.externalId ? (
        <span className="os-num text-[12px]">{source.externalId}</span>
      ) : (
        <span className="text-muted">None, there is no provider behind a manual order</span>
      ),
    },
    { label: "Received here", value: formatDateTime(source.receivedAt) },
    {
      label: "Campaign",
      value: source.campaign ?? <span className="text-muted">Not supplied by {channel(source.channelId).label}</span>,
    },
    {
      label: "Page or referrer",
      value: source.referrer ?? <span className="text-muted">Not supplied</span>,
    },
    {
      label: "Linked conversation",
      value: order.conversationId ? (
        <Link href={`/inbox?c=${order.conversationId}`} className="font-semibold text-primary hover:underline">
          Open the conversation
        </Link>
      ) : (
        <span className="text-muted">This order did not come out of a conversation</span>
      ),
    },
    {
      label: "Linked customer",
      value: contact ? (
        <Link href={`/contacts/${contact.id}`} className="font-semibold text-primary hover:underline">
          {contact.name}
        </Link>
      ) : (
        <span className="text-muted">Unknown</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/orders" className="text-xs font-semibold text-primary hover:underline">
          Back to orders
        </Link>
      </div>

      <PageHeader
        title={order.reference}
        subtitle={`Placed ${timeAgo(order.placedAt, DEMO_NOW)} by ${contact?.name ?? "an unknown customer"}, ${formatDateTime(order.placedAt)}.`}
        actions={
          <>
            <PaymentPill status={order.paymentStatus} />
            <DeliveryPill status={order.deliveryStatus} />
            <SourceBadge channelId={source.channelId} account={source.accountLabel} />
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHead title="What was ordered" hint={`${order.items.length} ${order.items.length === 1 ? "line" : "lines"}, delivery counted below`} />
          <div className="os-scroll">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="os-label pb-2 text-left font-normal">Product</th>
                  <th className="os-label pb-2 text-right font-normal">Quantity</th>
                  <th className="os-label pb-2 text-right font-normal">Unit</th>
                  <th className="os-label pb-2 text-right font-normal">Line</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="py-2.5 pr-3 text-[13px]">{item.name}</td>
                    <td className="os-num py-2.5 pr-3 text-right text-[13px]">{item.quantity}</td>
                    <td className="os-num py-2.5 pr-3 text-right text-[13px]">
                      {formatTND(item.unitPrice, { withCurrency: false })}
                    </td>
                    <td className="os-num py-2.5 text-right text-[13px]">
                      {formatTND(item.quantity * item.unitPrice, { withCurrency: false })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line">
                  <td className="py-2 text-[13px] text-muted" colSpan={3}>Goods</td>
                  <td className="os-num py-2 text-right text-[13px]">{formatTND(goods, { withCurrency: false })}</td>
                </tr>
                <tr>
                  <td className="py-2 text-[13px] text-muted" colSpan={3}>Delivery</td>
                  <td className="os-num py-2 text-right text-[13px]">
                    {order.deliveryFee === 0 ? "Free" : formatTND(order.deliveryFee, { withCurrency: false })}
                  </td>
                </tr>
                <tr className="border-t border-line">
                  <td className="py-2.5 text-[13px] font-semibold" colSpan={3}>Total</td>
                  <td className="os-num py-2.5 text-right text-[15px] font-semibold">{formatTND(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card>
            <CardHead title="Customer" />
            {contact ? (
              <dl className="flex flex-col gap-1.5 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Name</dt>
                  <dd className="font-medium">{contact.name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Phone</dt>
                  <dd className="os-num">{contact.phone ?? "Not given"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">City</dt>
                  <dd>{contact.city ?? "Not given"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Owner</dt>
                  <dd>{assignee?.name ?? <span className="text-danger">Nobody yet</span>}</dd>
                </div>
                {touches?.changed ? (
                  <p className="mt-2 rounded-[var(--radius-sm)] border border-accent-line bg-accent-soft px-3 py-2 text-xs text-accent-ink">
                    This customer first arrived through {touches.first} and now writes on {touches.latest}. This
                    order keeps its own source either way.
                  </p>
                ) : null}
              </dl>
            ) : null}
          </Card>

          <Card className="border-primary/25">
            <CardHead
              title="Where this order came from"
              hint="Recorded once, when the request arrived, and never rewritten"
            />
            <dl className="flex flex-col gap-2 text-[13px]">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-start justify-between gap-3 border-b border-line pb-2 last:border-b-0 last:pb-0">
                  <dt className="text-muted">{fact.label}</dt>
                  <dd className="text-right">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
