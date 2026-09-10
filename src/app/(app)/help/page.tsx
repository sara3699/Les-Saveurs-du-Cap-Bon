import Link from "next/link";
import { SourceBadge } from "@/components/ui/badges";
import { Card, DemoChip, PageHeader } from "@/components/ui/surfaces";
import type { ChannelId } from "@/lib/domain/types";

export const metadata = { title: "Need help, Les Saveurs du Cap Bon" };

interface Guide {
  id: string;
  channelId: ChannelId;
  title: string;
  what: string;
  youNeed: string[];
  weDo: string[];
  gotcha?: string;
}

const GUIDES: Guide[] = [
  {
    id: "website-form",
    channelId: "website",
    title: "Website lead form",
    what: "Requests sent from your own site arrive as conversations, with the page they came from.",
    youNeed: ["A site you can add a form to", "Ten minutes with whoever manages the site"],
    weDo: [
      "Give you an address on your Les Saveurs du Cap Bon workspace that the form posts to",
      "Check every request before it is accepted, and refuse anything malformed",
      "Limit how often the address can be called, so nobody can flood your inbox",
    ],
  },
  {
    id: "whatsapp",
    channelId: "whatsapp",
    title: "WhatsApp Business",
    what: "Read and answer WhatsApp messages here instead of on a phone passed between people.",
    youNeed: [
      "A business verified with Meta",
      "A phone number that is not already in use on the WhatsApp app",
      "One message template approved by Meta",
    ],
    weDo: [
      "Connect through the official WhatsApp Business Platform, never through your personal account",
      "Keep inbound messages, your replies and delivery receipts as separate records",
      "Refuse to send a template that Meta has not approved, rather than failing silently",
    ],
    gotcha:
      "Answering within 24 hours of a customer message needs nothing extra. Starting a conversation after that needs an approved template, and approval takes days.",
  },
  {
    id: "instagram",
    channelId: "instagram",
    title: "Instagram",
    what: "Messages sent to your Instagram professional account arrive in the same list.",
    youNeed: [
      "An Instagram professional account",
      "A Facebook page linked to it that you administer",
    ],
    weDo: [
      "Ask Meta only for the permission needed to read and answer messages",
      "Keep story replies and post comments distinguishable from direct messages",
    ],
    gotcha:
      "Only professional accounts can be connected. No product can read a personal Instagram inbox, including this one.",
  },
  {
    id: "facebook",
    channelId: "facebook",
    title: "Facebook Messenger",
    what: "Messages sent to your Facebook page, answered from here.",
    youNeed: ["A Facebook page you administer"],
    weDo: [
      "Connect the page through the official Messenger platform",
      "Tell you the moment the page permission is withdrawn, instead of quietly receiving nothing",
    ],
    gotcha: "Messages sent to a personal Facebook profile are never available. Only pages.",
  },
  {
    id: "google-ads",
    channelId: "google",
    title: "Google Ads lead forms",
    what: "Someone who fills in a lead form on your ad becomes a request here, with the campaign name.",
    youNeed: ["A Google Ads account", "At least one lead form on a campaign"],
    weDo: [
      "Check the key on every notification, so a stranger cannot post fake leads",
      "Record the campaign, so you can tell which advert paid for itself",
    ],
  },
  {
    id: "google-business",
    channelId: "google",
    title: "Google Business Profile",
    what: "Messages and reviews from your Google Business Profile. Planned, not built.",
    youNeed: ["A verified Google Business Profile"],
    weDo: ["Keep it as its own source, so a review is never counted as a lead"],
  },
  {
    id: "gmail",
    channelId: "google",
    title: "Gmail",
    what: "Emails to your shop address as conversations. Planned, not built.",
    youNeed: ["A Gmail or Google Workspace account"],
    weDo: ["Keep it separate from Google Ads, because the two answer different questions"],
  },
  {
    id: "manual",
    channelId: "manual",
    title: "Typed in by hand",
    what: "Orders and requests taken on the phone or at the counter.",
    youNeed: ["Nothing"],
    weDo: ["Label them Manual, never as one of the connected channels"],
  },
];

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Need help?"
        subtitle="What you are looking at, and what happens when you want it connected to your real accounts."
        actions={<DemoChip />}
      />

      <Card className="max-w-[75ch]">
        <h2 className="text-[15px]">You are in demo mode</h2>
        <div className="mt-2 flex flex-col gap-2 text-sm text-muted">
          <p>
            Every customer, message and order you see was invented for this demo. No Instagram,
            WhatsApp, Facebook or Google account is connected, and nothing you do here reaches a
            customer.
          </p>
          <p>
            The point of the demo is to let you judge the product before handing over access to
            anything. Assign a conversation, filter the orders by source, and see whether the
            answers feel right.
          </p>
          <p>
            The next step is a real database and a way to sign in. After that, the website form is
            the first connector, because it is the only one that needs nothing from Meta or Google.
          </p>
        </div>
      </Card>

      <section className="grid gap-3 lg:grid-cols-2">
        {GUIDES.map((guide) => (
          <Card key={guide.id} className="scroll-mt-24" >
            <div id={guide.id} className="flex items-start justify-between gap-3">
              <h2 className="text-[15px] leading-tight">{guide.title}</h2>
              <SourceBadge channelId={guide.channelId} size="sm" />
            </div>
            <p className="mt-2 text-[13px] text-muted">{guide.what}</p>

            <p className="os-label mt-3">What you need</p>
            <ul className="mt-1 flex flex-col gap-1 text-[13px]">
              {guide.youNeed.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <p className="os-label mt-3">What Les Saveurs du Cap Bon does</p>
            <ul className="mt-1 flex flex-col gap-1 text-[13px]">
              {guide.weDo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            {guide.gotcha ? (
              <p className="mt-3 rounded-[var(--radius-sm)] border border-accent-line bg-accent-soft px-3 py-2 text-[12px] text-accent-ink">
                {guide.gotcha}
              </p>
            ) : null}
          </Card>
        ))}
      </section>

      <p className="text-xs text-muted">
        Ready to look at what is connected?{" "}
        <Link href="/integrations" className="font-semibold text-primary hover:underline">
          Open Integrations
        </Link>
        .
      </p>
    </div>
  );
}
