import type { ChannelId } from "./types";

export interface ChannelDefinition {
  id: ChannelId;
  /** What the badge says. Never "Online", never "Other". */
  label: string;
  /** The provider or surface the label refers to, for tooltips and detail rows. */
  longLabel: string;
  /** CSS custom property holding this channel's dot colour. */
  colorVar: string;
  /** Placeholder in the reply box, so the writer knows where the text lands. */
  composerPlaceholder: (name: string) => string;
  /** Shown when the channel cannot send, in place of an enabled button. */
  cannotSendReason: string;
}

export const CHANNELS: Record<ChannelId, ChannelDefinition> = {
  website: {
    id: "website",
    label: "Website",
    longLabel: "Website lead form",
    colorVar: "var(--color-ch-website)",
    composerPlaceholder: (name) => `Reply to ${name} by email`,
    cannotSendReason: "The website form is not connected, so replies cannot be sent from here.",
  },
  whatsapp: {
    id: "whatsapp",
    label: "WhatsApp",
    longLabel: "WhatsApp Business",
    colorVar: "var(--color-ch-whatsapp)",
    composerPlaceholder: (name) => `Write to ${name} on WhatsApp`,
    cannotSendReason:
      "WhatsApp setup is not finished. Add the business phone number and get one message template approved before sending.",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    longLabel: "Instagram professional account",
    colorVar: "var(--color-ch-instagram)",
    composerPlaceholder: (name) => `Reply to ${name} on Instagram`,
    cannotSendReason:
      "The Instagram professional account is not connected, so this reply cannot leave this workspace.",
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    longLabel: "Facebook Page Messenger",
    colorVar: "var(--color-ch-facebook)",
    composerPlaceholder: (name) => `Reply to ${name} on Messenger`,
    cannotSendReason:
      "The page permission was withdrawn, so Messenger replies would fail. Reconnect the page first.",
  },
  google: {
    id: "google",
    label: "Google",
    longLabel: "Google Ads lead form",
    colorVar: "var(--color-ch-google)",
    composerPlaceholder: (name) => `Reply to ${name} by email`,
    cannotSendReason:
      "Google Ads lead forms deliver leads one way. Reply by email or phone instead.",
  },
  manual: {
    id: "manual",
    label: "Manual",
    longLabel: "Added by hand",
    colorVar: "var(--color-ch-manual)",
    composerPlaceholder: (name) => `Record what you told ${name}`,
    cannotSendReason:
      "This request was typed in by hand, so there is no channel to send a reply on.",
  },
};

/** Display order used by filters, the source panel and the statistics table. */
export const CHANNEL_ORDER: ChannelId[] = [
  "website",
  "whatsapp",
  "instagram",
  "facebook",
  "google",
  "manual",
];

export function channel(id: ChannelId): ChannelDefinition {
  return CHANNELS[id];
}
