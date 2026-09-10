import type { ChannelId } from "./types";

export interface ChannelDefinition {
  id: ChannelId;
  /** What the badge says. Never "Online", never "Other". */
  label: string;
  /** The provider or surface the label refers to, for tooltips and détail rows. */
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
    label: "Site web",
    longLabel: "Formulaire du site web",
    colorVar: "var(--color-ch-website)",
    composerPlaceholder: (name) => `Répondre à ${name} par e-mail`,
    cannotSendReason:
      "Le formulaire du site n'est pas connecté, les réponses ne peuvent donc pas partir d'ici.",
  },
  whatsapp: {
    id: "whatsapp",
    label: "WhatsApp",
    longLabel: "WhatsApp Business",
    colorVar: "var(--color-ch-whatsapp)",
    composerPlaceholder: (name) => `Écrire à ${name} sur WhatsApp`,
    cannotSendReason:
      "La configuration de WhatsApp n'est pas terminée. Ajoutez le numéro professionnel et faites approuver un modèle de message avant l'envoi.",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    longLabel: "Compte professionnel Instagram",
    colorVar: "var(--color-ch-instagram)",
    composerPlaceholder: (name) => `Répondre à ${name} sur Instagram`,
    cannotSendReason:
      "Le compte professionnel Instagram n'est pas connecté, cette réponse ne peut donc pas quitter cet espace.",
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    longLabel: "Messenger de la page Facebook",
    colorVar: "var(--color-ch-facebook)",
    composerPlaceholder: (name) => `Répondre à ${name} sur Messenger`,
    cannotSendReason:
      "L'autorisation de la page a été retirée, les réponses Messenger échoueraient. Reconnectez d'abord la page.",
  },
  google: {
    id: "google",
    label: "Google",
    longLabel: "Formulaire de prospects Google Ads",
    colorVar: "var(--color-ch-google)",
    composerPlaceholder: (name) => `Répondre à ${name} par e-mail`,
    cannotSendReason:
      "Les formulaires de prospects Google Ads transmettent les demandes dans un seul sens. Répondez plutôt par e-mail ou par téléphone.",
  },
  manual: {
    id: "manual",
    label: "Manuel",
    longLabel: "Ajouté manuellement",
    colorVar: "var(--color-ch-manual)",
    composerPlaceholder: (name) => `Noter ce que vous avez dit à ${name}`,
    cannotSendReason:
      "Cette demande a été saisie manuellement, il n'y a donc aucun canal pour envoyer une réponse.",
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
