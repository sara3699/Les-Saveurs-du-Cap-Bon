import type {
  Contact,
  Conversation,
  Message,
  SourceAttribution,
} from "@/lib/domain/types";
import { daysAgo, hoursAgo, minutesAgo } from "./time";

/**
 * One attribution row per incoming conversation. Orders reuse these rows when
 * the order came out of a conversation, which is what keeps a WhatsApp order
 * labelled WhatsApp on the Orders screen, in Statistics and in an export.
 */
export const CONVERSATION_ATTRIBUTIONS: SourceAttribution[] = [
  { id: "at_c01", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.HBgLMjE2MjAxMTQ4ODIVAgAR", receivedAt: minutesAgo(9), campaign: null, referrer: null, conversationId: "cv_01", contactId: "ct_rania" },
  { id: "at_c02", channelId: "instagram", connectionId: "cn_instagram", externalId: "ig_msg_178394021", receivedAt: minutesAgo(24), campaign: null, referrer: "Réponse a une story", conversationId: "cv_02", contactId: "ct_yosr" },
  { id: "at_c03", channelId: "website", connectionId: "cn_website_form", externalId: "form_7d31c0", receivedAt: hoursAgo(1), campaign: null, referrer: "Page livraison Les Saveurs", conversationId: "cv_03", contactId: "ct_slim" },
  { id: "at_c04", channelId: "google", connectionId: "cn_google_ads", externalId: "gads_lead_88213", receivedAt: hoursAgo(3), campaign: "Coffrets cadeaux, septembre", conversationId: "cv_04", contactId: "ct_amine", referrer: null },
  { id: "at_c05", channelId: "facebook", connectionId: "cn_facebook", externalId: "mid.$cAAB1x9k", receivedAt: daysAgo(1), campaign: null, referrer: null, conversationId: "cv_05", contactId: "ct_nadia" },
  { id: "at_c06", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.HBgLMjE2OTgyMjExMD", receivedAt: hoursAgo(5), campaign: null, referrer: null, conversationId: "cv_06", contactId: "ct_olfa" },
  { id: "at_c07", channelId: "website", connectionId: "cn_website_form", externalId: "form_9a02be", receivedAt: hoursAgo(7), campaign: null, referrer: "Page vente en gros Les Saveurs", conversationId: "cv_07", contactId: "ct_mehdi" },
  { id: "at_c08", channelId: "manual", connectionId: null, externalId: null, receivedAt: hoursAgo(6), campaign: null, referrer: "Passage en boutique, Nabeul", conversationId: "cv_08", contactId: "ct_ines" },
  { id: "at_c09", channelId: "instagram", connectionId: "cn_instagram", externalId: "ig_msg_178391884", receivedAt: daysAgo(2), campaign: null, referrer: "Commentaire sous une publication", conversationId: "cv_09", contactId: "ct_hatem" },
  { id: "at_c10", channelId: "google", connectionId: "cn_google_ads", externalId: "gads_lead_88104", receivedAt: daysAgo(2), campaign: "Marque, en continu", conversationId: "cv_10", contactId: "ct_leila", referrer: null },
  { id: "at_c11", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.HBgLMjE2NTUxMjM0NT", receivedAt: daysAgo(3), campaign: null, referrer: null, conversationId: "cv_11", contactId: "ct_sonia" },
  { id: "at_c12", channelId: "facebook", connectionId: "cn_facebook", externalId: "mid.$cAAB1w7Rz", receivedAt: daysAgo(8), campaign: null, referrer: null, conversationId: "cv_12", contactId: "ct_walid" },
  { id: "at_c13", channelId: "website", connectionId: "cn_website_form", externalId: "form_51ccd9", receivedAt: daysAgo(4), campaign: null, referrer: "Page plateau de fete Les Saveurs", conversationId: "cv_13", contactId: "ct_karim" },
  { id: "at_c14", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.HBgLMjE2MjAxMTQ4ODJ2", receivedAt: daysAgo(5), campaign: null, referrer: null, conversationId: "cv_14", contactId: "ct_rania" },
  { id: "at_c15", channelId: "instagram", connectionId: "cn_instagram", externalId: "ig_msg_178388120", receivedAt: daysAgo(12), campaign: null, referrer: "Réponse a une story", conversationId: "cv_15", contactId: "ct_mehdi" },
  { id: "at_c16", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.HBgLMjE2OTQ0MTIzMT", receivedAt: daysAgo(6), campaign: null, referrer: null, conversationId: "cv_16", contactId: "ct_yosr" },
  { id: "at_c17", channelId: "website", connectionId: "cn_website_form", externalId: "form_2bb47f", receivedAt: daysAgo(9), campaign: null, referrer: "Page contact Les Saveurs", conversationId: "cv_17", contactId: "ct_leila" },
  { id: "at_c18", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.HBgLMjE2MjIzNDU2Nz", receivedAt: daysAgo(14), campaign: null, referrer: null, conversationId: "cv_18", contactId: "ct_sonia" },
];

export const CONTACTS: Contact[] = [
  {
    id: "ct_rania", name: "Rania Trabelsi", phone: "+216 20 114 882", email: "rania.trabelsi@gmail.com",
    city: "Ariana", language: "arabe", firstTouchChannel: "whatsapp", latestTouchChannel: "whatsapp",
    firstContactAt: daysAgo(26), stage: "qualified", tags: ["Client fidele", "Client prioritaire", "Coffret cadeau"],
    leadScore: 78,
    leadScoreReasons: [
      "Elle a déjà acheté deux fois, en juin et en aout",
      "Elle a répondu en moins d'une heure sur ses trois derniers messages",
      "Elle a demande un produit precis au lieu de regarder au hasard",
    ],
    lifetimeValue: 560, ownerId: "tm_sarra",
    notes: [
      { id: "nt_01", authorId: "tm_sarra", createdAt: minutesAgo(31), body: "A acheté le pot saisonnier en juin et a aussi demande le coffret de desserts. Cela vaut la peine de proposer un prix pour les deux." },
    ],
  },
  {
    id: "ct_slim", name: "Slim Ayari", phone: "+216 98 220 145", email: "slim.ayari@outlook.com",
    city: "Sousse", language: "francais", firstTouchChannel: "website", latestTouchChannel: "website",
    firstContactAt: hoursAgo(1), stage: "contacted", tags: ["Question livraison"],
    leadScore: 54,
    leadScoreReasons: ["Premier message arrive aujourd'hui", "Il a donne une date de livraison a respecter"],
    lifetimeValue: 0, ownerId: "tm_mouna", notes: [],
  },
  {
    id: "ct_yosr", name: "Yosr Mahfoudh", phone: "+216 55 901 337", email: "yosr.mahfoudh@gmail.com",
    city: "Tunis", language: "arabe", firstTouchChannel: "instagram", latestTouchChannel: "whatsapp",
    firstContactAt: daysAgo(19), stage: "proposal", tags: ["Coffret cadeau", "Client fidele"],
    leadScore: 66,
    leadScoreReasons: [
      "Elle a trouve la boutique sur Instagram puis est passee d'elle-même sur WhatsApp",
      "Elle a une commande en cours de plus de 400 dinars",
    ],
    lifetimeValue: 412, ownerId: "tm_khaled",
    notes: [
      { id: "nt_02", authorId: "tm_khaled", createdAt: daysAgo(1), body: "Arrivee au depart par Instagram. Elle préfère les messages vocaux sur WhatsApp." },
    ],
  },
  {
    id: "ct_amine", name: "Amine Bouzid", phone: "+216 74 310 220", email: "a.bouzid@sfaxnet.tn",
    city: "Sfax", language: "francais", firstTouchChannel: "google", latestTouchChannel: "google",
    firstContactAt: hoursAgo(3), stage: "new", tags: ["Question prix"],
    leadScore: 41,
    leadScoreReasons: ["Il vient d'une annonce payante, son intention reste a confirmer", "Aucune réponse depuis l'envoi du formulaire"],
    lifetimeValue: 0, ownerId: null, notes: [],
  },
  {
    id: "ct_nadia", name: "Nadia Chaabane", phone: "+216 22 447 019", email: "nadia.chaabane@gmail.com",
    city: "La Marsa", language: "francais", firstTouchChannel: "facebook", latestTouchChannel: "facebook",
    firstContactAt: daysAgo(34), stage: "won", tags: ["Client fidele"],
    leadScore: 82,
    leadScoreReasons: ["Trois commandes terminées", "Elle n'a jamais demande de retour"],
    lifetimeValue: 1180, ownerId: "tm_yassine", notes: [],
  },
  {
    id: "ct_ines", name: "Ines Gharbi", phone: "+216 71 882 004", email: null,
    city: "Tunis", language: "arabe", firstTouchChannel: "manual", latestTouchChannel: "manual",
    firstContactAt: daysAgo(41), stage: "won", tags: ["Vente en gros", "Client prioritaire"],
    leadScore: 60,
    leadScoreReasons: ["Elle commande par téléphone toutes les quelques semaines", "Plus grosse commande des données d'exemple"],
    lifetimeValue: 2080, ownerId: "tm_sarra", notes: [],
  },
  {
    id: "ct_mehdi", name: "Mehdi Karoui", phone: "+216 92 663 118", email: "mehdi.karoui@gmail.com",
    city: "Bizerte", language: "francais", firstTouchChannel: "website", latestTouchChannel: "instagram",
    firstContactAt: daysAgo(22), stage: "qualified", tags: ["Vente en gros"],
    leadScore: 58,
    leadScoreReasons: ["Il a demande le prix pour douze pieces a la fois", "Il est arrive par le site et ecrit maintenant sur Instagram"],
    lifetimeValue: 148, ownerId: "tm_khaled", notes: [],
  },
  {
    id: "ct_olfa", name: "Olfa Ben Salah", phone: "+216 98 221 100", email: null,
    city: "Nabeul", language: "arabe", firstTouchChannel: "whatsapp", latestTouchChannel: "whatsapp",
    firstContactAt: daysAgo(11), stage: "contacted", tags: ["Question livraison"],
    leadScore: 47,
    leadScoreReasons: ["Une commande, livrée", "Elle demande le prix de la livraison avant chaque achat"],
    lifetimeValue: 118, ownerId: "tm_mouna", notes: [],
  },
  {
    id: "ct_hatem", name: "Hatem Zouari", phone: null, email: null,
    city: "Tunis", language: "arabe", firstTouchChannel: "instagram", latestTouchChannel: "instagram",
    firstContactAt: daysAgo(2), stage: "new", tags: ["Question prix"],
    leadScore: 35,
    leadScoreReasons: ["Pas encore de numéro de téléphone", "Un message, aucune réponse de notre part"],
    lifetimeValue: 0, ownerId: null, notes: [],
  },
  {
    id: "ct_leila", name: "Leila Ferchichi", phone: "+216 73 445 890", email: "leila.ferchichi@gmail.com",
    city: "Monastir", language: "francais", firstTouchChannel: "google", latestTouchChannel: "website",
    firstContactAt: daysAgo(9), stage: "proposal", tags: ["Coffret cadeau", "Gamme Ramadan"],
    leadScore: 71,
    leadScoreReasons: [
      "Elle est venue par une annonce puis est revenue d'elle-même par le site",
      "Elle a demande un devis pour huit coffrets cadeaux",
    ],
    lifetimeValue: 0, ownerId: "tm_khaled", notes: [],
  },
  {
    id: "ct_walid", name: "Walid Jaziri", phone: "+216 29 118 220", email: null,
    city: "Ben Arous", language: "arabe", firstTouchChannel: "facebook", latestTouchChannel: "facebook",
    firstContactAt: daysAgo(8), stage: "lost", tags: ["Question prix"],
    leadScore: 22,
    leadScoreReasons: ["Il a dit que le prix depassait son budget", "Aucune réponse depuis huit jours"],
    lifetimeValue: 0, ownerId: "tm_yassine", notes: [],
  },
  {
    id: "ct_sonia", name: "Sonia Mejri", phone: "+216 22 340 771", email: "sonia.mejri@gmail.com",
    city: "Ariana", language: "arabe", firstTouchChannel: "manual", latestTouchChannel: "whatsapp",
    firstContactAt: daysAgo(48), stage: "contacted", tags: ["Client fidele", "Gamme Ramadan"],
    leadScore: 49,
    leadScoreReasons: ["Elle a été ajoutée a la main après un appel", "Deux commandes depuis, les deux sur WhatsApp"],
    lifetimeValue: 336, ownerId: "tm_mouna", notes: [],
  },
  /**
   * Two records that a CSV import left behind: the same phone number under a
   * shortened name, and the same email under initials. The Contacts screen has
   * to be able to say so rather than quietly holding both.
   */
  {
    id: "ct_rania_dup", name: "Rania T.", phone: "+216 20 114 882", email: null,
    city: "Ariana", language: "arabe", firstTouchChannel: "manual", latestTouchChannel: "manual",
    firstContactAt: daysAgo(3), stage: "new", tags: [],
    leadScore: 30,
    leadScoreReasons: ["Ajoutee par un import de tableur le 6 septembre 2026", "Aucune conversation sur cette fiche"],
    lifetimeValue: 0, ownerId: null, notes: [],
  },
  {
    id: "ct_leila_dup", name: "L. Ferchichi", phone: null, email: "leila.ferchichi@gmail.com",
    city: "Monastir", language: "francais", firstTouchChannel: "website", latestTouchChannel: "website",
    firstContactAt: daysAgo(3), stage: "new", tags: [],
    leadScore: 28,
    leadScoreReasons: ["Ajoutee par un import de tableur le 6 septembre 2026", "Aucune conversation sur cette fiche"],
    lifetimeValue: 0, ownerId: null, notes: [],
  },
  {
    id: "ct_karim", name: "Karim Belaid", phone: "+216 24 900 116", email: "karim.belaid@gmail.com",
    city: "Tunis", language: "francais", firstTouchChannel: "website", latestTouchChannel: "website",
    firstContactAt: daysAgo(4), stage: "new", tags: ["Question prix"],
    leadScore: 44,
    leadScoreReasons: ["Il a consulte la page du plateau de desserts avant d'ecrire", "Aucune réponse de notre part depuis quatre jours"],
    lifetimeValue: 0, ownerId: null, notes: [],
  },
];

export const CONVERSATIONS: Conversation[] = [
  { id: "cv_01", contactId: "ct_rania", attributionId: "at_c01", subject: "Creme de pistache en stock", status: "open", priority: true, unreadCount: 2, assigneeId: "tm_sarra", tags: ["Client prioritaire"], lastMessageAt: minutesAgo(9) },
  { id: "cv_02", contactId: "ct_yosr", attributionId: "at_c02", subject: "Photo du dessert a la pistache", status: "waiting", priority: false, unreadCount: 0, assigneeId: "tm_khaled", tags: ["Coffret cadeau"], lastMessageAt: minutesAgo(24) },
  { id: "cv_03", contactId: "ct_slim", attributionId: "at_c03", subject: "Livraison a Sousse avant vendredi", status: "new", priority: false, unreadCount: 1, assigneeId: "tm_mouna", tags: ["Question livraison"], lastMessageAt: hoursAgo(1) },
  { id: "cv_04", contactId: "ct_amine", attributionId: "at_c04", subject: "Prix du coffret cadeau", status: "new", priority: false, unreadCount: 1, assigneeId: null, tags: ["Question prix"], lastMessageAt: hoursAgo(3) },
  { id: "cv_05", contactId: "ct_nadia", attributionId: "at_c05", subject: "Commande arrivée ce matin", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_yassine", tags: [], lastMessageAt: daysAgo(1) },
  { id: "cv_06", contactId: "ct_olfa", attributionId: "at_c06", subject: "Prix de la livraison a Nabeul", status: "open", priority: false, unreadCount: 1, assigneeId: "tm_mouna", tags: ["Question livraison"], lastMessageAt: hoursAgo(5) },
  { id: "cv_07", contactId: "ct_mehdi", attributionId: "at_c07", subject: "Prix pour douze assortiments de desserts", status: "open", priority: false, unreadCount: 0, assigneeId: "tm_khaled", tags: ["Vente en gros"], lastMessageAt: hoursAgo(7) },
  { id: "cv_08", contactId: "ct_ines", attributionId: "at_c08", subject: "Commande habituelle prise en boutique", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_sarra", tags: ["Vente en gros"], lastMessageAt: hoursAgo(6) },
  { id: "cv_09", contactId: "ct_hatem", attributionId: "at_c09", subject: "Combien coute l'assortiment de desserts", status: "new", priority: false, unreadCount: 1, assigneeId: null, tags: ["Question prix"], lastMessageAt: daysAgo(2) },
  { id: "cv_10", contactId: "ct_leila", attributionId: "at_c10", subject: "Devis pour huit coffrets cadeaux", status: "open", priority: true, unreadCount: 0, assigneeId: "tm_khaled", tags: ["Coffret cadeau"], lastMessageAt: daysAgo(2) },
  { id: "cv_11", contactId: "ct_sonia", attributionId: "at_c11", subject: "Assortiment de desserts de retour en stock", status: "waiting", priority: false, unreadCount: 0, assigneeId: "tm_mouna", tags: ["Gamme Ramadan"], lastMessageAt: daysAgo(3) },
  { id: "cv_12", contactId: "ct_walid", attributionId: "at_c12", subject: "Dessert a la pistache, y a-t-il une remise", status: "snoozed", priority: false, unreadCount: 0, assigneeId: "tm_yassine", tags: ["Question prix"], lastMessageAt: daysAgo(8) },
  { id: "cv_13", contactId: "ct_karim", attributionId: "at_c13", subject: "Dimensions du plateau de desserts", status: "new", priority: false, unreadCount: 1, assigneeId: null, tags: [], lastMessageAt: daysAgo(4) },
  { id: "cv_14", contactId: "ct_rania", attributionId: "at_c14", subject: "Pot saisonnier livre", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_sarra", tags: [], lastMessageAt: daysAgo(5) },
  { id: "cv_15", contactId: "ct_mehdi", attributionId: "at_c15", subject: "Les coffrets de desserts sont-ils faits main", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_khaled", tags: [], lastMessageAt: daysAgo(12) },
  { id: "cv_16", contactId: "ct_yosr", attributionId: "at_c16", subject: "Changement d'adresse de livraison", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_khaled", tags: [], lastMessageAt: daysAgo(6) },
  { id: "cv_17", contactId: "ct_leila", attributionId: "at_c17", subject: "Livrez-vous a Monastir", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_mouna", tags: ["Question livraison"], lastMessageAt: daysAgo(9) },
  { id: "cv_18", contactId: "ct_sonia", attributionId: "at_c18", subject: "Dates de la gamme Ramadan", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_mouna", tags: ["Gamme Ramadan"], lastMessageAt: daysAgo(14) },
];

export const MESSAGES: Message[] = [
  { id: "ms_0101", conversationId: "cv_01", direction: "inbound", body: "Bonjour, est-ce que la creme de pistache est toujours disponible ?", sentAt: minutesAgo(38), authorId: null, externalId: "wamid.HBgLMjE2MjAxMTQ4ODIVAgAR", attachments: [] },
  { id: "ms_0102", conversationId: "cv_01", direction: "inbound", body: "J'en ai besoin avant samedi si possible.", sentAt: minutesAgo(37), authorId: null, externalId: "wamid.HBgLMjE2MjAxMTQ4ODIVAgAS", attachments: [{ id: "at_img_01", kind: "image", filename: "pistachio-jar.jpg", sizeLabel: "240 KB" }] },
  { id: "ms_0103", conversationId: "cv_01", direction: "outbound", body: "Bonjour Rania. Oui, la verte est en stock. La livraison a Ariana prend deux jours, samedi est donc possible.", sentAt: minutesAgo(33), authorId: "tm_sarra", externalId: "wamid.HBgLMjE2MjAxMTQ4ODIVAgAT", attachments: [] },
  { id: "ms_0104", conversationId: "cv_01", direction: "note", body: "Elle a acheté le pot saisonnier en juin et a aussi demande le coffret de desserts. Cela vaut la peine de proposer un prix pour les deux.", sentAt: minutesAgo(31), authorId: "tm_sarra", externalId: null, attachments: [] },
  { id: "ms_0105", conversationId: "cv_01", direction: "inbound", body: "Parfait, pouvez-vous m'en garder un ?", sentAt: minutesAgo(9), authorId: null, externalId: "wamid.HBgLMjE2MjAxMTQ4ODIVAgAU", attachments: [] },

  { id: "ms_0201", conversationId: "cv_02", direction: "inbound", body: "C'est le dessert a la pistache dont je parlais, celui de votre story.", sentAt: hoursAgo(3), authorId: null, externalId: "ig_msg_178394021", attachments: [{ id: "at_img_02", kind: "image", filename: "story-screenshot.jpg", sizeLabel: "612 KB" }] },
  { id: "ms_0202", conversationId: "cv_02", direction: "outbound", body: "C'est le dessert a la pistache, 68 TND dans le catalogue d'exemple. Je peux vous en mettre un de cote.", sentAt: hoursAgo(2), authorId: "tm_khaled", externalId: "ig_msg_178394044", attachments: [] },
  { id: "ms_0203", conversationId: "cv_02", direction: "inbound", body: "Je vais y reflechir ce soir.", sentAt: minutesAgo(24), authorId: null, externalId: "ig_msg_178394090", attachments: [] },

  { id: "ms_0301", conversationId: "cv_03", direction: "inbound", body: "Bonjour, je voudrais commander deux assortiments de desserts. Livraison possible a Sousse avant vendredi ?", sentAt: hoursAgo(1), authorId: null, externalId: "form_7d31c0", attachments: [] },

  { id: "ms_0401", conversationId: "cv_04", direction: "inbound", body: "Combien coute le coffret gourmand avec les desserts et le pot ?", sentAt: hoursAgo(3), authorId: null, externalId: "gads_lead_88213", attachments: [] },

  { id: "ms_0501", conversationId: "cv_05", direction: "inbound", body: "Bonjour, la commande est bien arrivée ce matin. Merci beaucoup.", sentAt: daysAgo(1), authorId: null, externalId: "mid.$cAAB1x9k", attachments: [] },
  { id: "ms_0502", conversationId: "cv_05", direction: "outbound", body: "Merci Nadia, a bientot.", sentAt: daysAgo(1), authorId: "tm_yassine", externalId: "mid.$cAAB1x9m", attachments: [] },

  { id: "ms_0601", conversationId: "cv_06", direction: "inbound", body: "Combien la livraison a Nabeul ?", sentAt: hoursAgo(6), authorId: null, externalId: "wamid.HBgLMjE2OTgyMjExMD", attachments: [] },
  { id: "ms_0602", conversationId: "cv_06", direction: "outbound", body: "7,500 TND, et c'est gratuit au dela de 200 TND.", sentAt: hoursAgo(6), authorId: "tm_mouna", externalId: "wamid.HBgLMjE2OTgyMjExME", attachments: [] },
  { id: "ms_0603", conversationId: "cv_06", direction: "inbound", body: "D'accord, je prepare ma liste.", sentAt: hoursAgo(5), authorId: null, externalId: "wamid.HBgLMjE2OTgyMjExMF", attachments: [] },

  { id: "ms_0701", conversationId: "cv_07", direction: "inbound", body: "Je géré un petit hotel a Bizerte. Quel est le prix pour douze assortiments de desserts ?", sentAt: hoursAgo(8), authorId: null, externalId: "form_9a02be", attachments: [] },
  { id: "ms_0702", conversationId: "cv_07", direction: "outbound", body: "Pour douze, je peux faire 70 TND piece dans le catalogue d'exemple au lieu de 78. Livraison comprise.", sentAt: hoursAgo(7), authorId: "tm_khaled", externalId: null, attachments: [] },
  { id: "ms_0703", conversationId: "cv_07", direction: "note", body: "Il a d'abord ecrit par le site, puis est passe sur Instagram en aout. Meme personne, même numéro.", sentAt: hoursAgo(7), authorId: "tm_khaled", externalId: null, attachments: [] },

  { id: "ms_0801", conversationId: "cv_08", direction: "note", body: "Elle est passee a la boutique de Nabeul et a repris sa commande habituelle. Saisie a la main au comptoir.", sentAt: hoursAgo(6), authorId: "tm_sarra", externalId: null, attachments: [] },
  { id: "ms_0802", conversationId: "cv_08", direction: "outbound", body: "Commande enregistrée, livraison jeudi.", sentAt: hoursAgo(6), authorId: "tm_sarra", externalId: null, attachments: [] },

  { id: "ms_0901", conversationId: "cv_09", direction: "inbound", body: "bech na3ref el prix mta3 assortiment el hlou?", sentAt: daysAgo(2), authorId: null, externalId: "ig_msg_178391884", attachments: [] },

  { id: "ms_1001", conversationId: "cv_10", direction: "inbound", body: "Je cherche huit coffrets cadeaux pour mes clients. Vous faites un prix ?", sentAt: daysAgo(2), authorId: null, externalId: "gads_lead_88104", attachments: [] },
  { id: "ms_1002", conversationId: "cv_10", direction: "outbound", body: "Oui. Pour huit coffrets, 940 TND l'unite au lieu de 1 040. Je vous envoie le devis aujourd'hui.", sentAt: daysAgo(2), authorId: "tm_khaled", externalId: null, attachments: [] },
  { id: "ms_1003", conversationId: "cv_10", direction: "note", body: "Elle est arrivée par une annonce Google en aout, puis est revenue d'elle-même par le site. Le premier contact reste Google.", sentAt: daysAgo(2), authorId: "tm_khaled", externalId: null, attachments: [] },

  { id: "ms_1101", conversationId: "cv_11", direction: "outbound", body: "Les assortiments de desserts sont de retour en stock, comme vous l'aviez demande.", sentAt: daysAgo(3), authorId: "tm_mouna", externalId: "wamid.HBgLMjE2NTUxMjM0NT", attachments: [] },
  { id: "ms_1102", conversationId: "cv_11", direction: "inbound", body: "Tres bien, je passe samedi.", sentAt: daysAgo(3), authorId: null, externalId: "wamid.HBgLMjE2NTUxMjM0NU", attachments: [] },

  { id: "ms_1201", conversationId: "cv_12", direction: "inbound", body: "El dessert b 68 barcha. Famma discount?", sentAt: daysAgo(8), authorId: null, externalId: "mid.$cAAB1w7Rz", attachments: [] },
  { id: "ms_1202", conversationId: "cv_12", direction: "outbound", body: "Le prix du dessert a la pistache est fixe dans le catalogue d'exemple. Je peux offrir la livraison.", sentAt: daysAgo(8), authorId: "tm_yassine", externalId: "mid.$cAAB1w7Sa", attachments: [] },
  { id: "ms_1203", conversationId: "cv_12", direction: "note", body: "Reporté d'une semaine. S'il ne repond pas, marquez le prospect comme perdu.", sentAt: daysAgo(8), authorId: "tm_yassine", externalId: null, attachments: [] },

  { id: "ms_1301", conversationId: "cv_13", direction: "inbound", body: "Quelles sont les dimensions exactes du plateau de fete ?", sentAt: daysAgo(4), authorId: null, externalId: "form_51ccd9", attachments: [] },

  { id: "ms_1401", conversationId: "cv_14", direction: "inbound", body: "Le pot saisonnier est bien arrive, merci.", sentAt: daysAgo(5), authorId: null, externalId: "wamid.HBgLMjE2MjAxMTQ4ODJ2", attachments: [] },
  { id: "ms_1402", conversationId: "cv_14", direction: "outbound", body: "Content qu'il soit arrive en bon etat, Rania.", sentAt: daysAgo(5), authorId: "tm_sarra", externalId: "wamid.HBgLMjE2MjAxMTQ4ODJ3", attachments: [] },

  { id: "ms_1501", conversationId: "cv_15", direction: "inbound", body: "Les coffrets de desserts sont-ils prepares a la main ?", sentAt: daysAgo(12), authorId: null, externalId: "ig_msg_178388120", attachments: [] },
  { id: "ms_1502", conversationId: "cv_15", direction: "outbound", body: "Ils sont prepares a la main. Deux coffrets de fete ne sont jamais exactement identiques.", sentAt: daysAgo(12), authorId: "tm_khaled", externalId: "ig_msg_178388133", attachments: [] },

  { id: "ms_1601", conversationId: "cv_16", direction: "inbound", body: "Pouvez-vous livrer a mon bureau plutot ? Rue de Marseille, Tunis.", sentAt: daysAgo(6), authorId: null, externalId: "wamid.HBgLMjE2OTQ0MTIzMT", attachments: [] },
  { id: "ms_1602", conversationId: "cv_16", direction: "outbound", body: "Adresse modifiee, le livreur a la nouvelle.", sentAt: daysAgo(6), authorId: "tm_khaled", externalId: "wamid.HBgLMjE2OTQ0MTIzMU", attachments: [] },

  { id: "ms_1701", conversationId: "cv_17", direction: "inbound", body: "Est-ce que vous livrez a Monastir ?", sentAt: daysAgo(9), authorId: null, externalId: "form_2bb47f", attachments: [] },
  { id: "ms_1702", conversationId: "cv_17", direction: "outbound", body: "Oui, en deux a trois jours.", sentAt: daysAgo(9), authorId: "tm_mouna", externalId: null, attachments: [] },

  { id: "ms_1801", conversationId: "cv_18", direction: "inbound", body: "Wa9tech tokhrej el gamme mta3 Ramadan?", sentAt: daysAgo(14), authorId: null, externalId: "wamid.HBgLMjE2MjIzNDU2Nz", attachments: [] },
  { id: "ms_1802", conversationId: "cv_18", direction: "outbound", body: "Deux semaines avant le Ramadan, comme chaque année.", sentAt: daysAgo(14), authorId: "tm_mouna", externalId: "wamid.HBgLMjE2MjIzNDU2Ng", attachments: [] },
  { id: "ms_1803", conversationId: "cv_18", direction: "inbound", body: "Parfait, tenez-moi au courant.", sentAt: daysAgo(14), authorId: null, externalId: "wamid.HBgLMjE2MjIzNDU2Nx", attachments: [] },
];
