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
  { id: "at_c02", channelId: "instagram", connectionId: "cn_instagram", externalId: "ig_msg_178394021", receivedAt: minutesAgo(24), campaign: null, referrer: "Story reply", conversationId: "cv_02", contactId: "ct_yosr" },
  { id: "at_c03", channelId: "website", connectionId: "cn_website_form", externalId: "form_7d31c0", receivedAt: hoursAgo(1), campaign: null, referrer: "Les Saveurs delivery page", conversationId: "cv_03", contactId: "ct_slim" },
  { id: "at_c04", channelId: "google", connectionId: "cn_google_ads", externalId: "gads_lead_88213", receivedAt: hoursAgo(3), campaign: "Gift sets, September", conversationId: "cv_04", contactId: "ct_amine", referrer: null },
  { id: "at_c05", channelId: "facebook", connectionId: "cn_facebook", externalId: "mid.$cAAB1x9k", receivedAt: daysAgo(1), campaign: null, referrer: null, conversationId: "cv_05", contactId: "ct_nadia" },
  { id: "at_c06", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.HBgLMjE2OTgyMjExMD", receivedAt: hoursAgo(5), campaign: null, referrer: null, conversationId: "cv_06", contactId: "ct_olfa" },
  { id: "at_c07", channelId: "website", connectionId: "cn_website_form", externalId: "form_9a02be", receivedAt: hoursAgo(7), campaign: null, referrer: "Les Saveurs wholesale page", conversationId: "cv_07", contactId: "ct_mehdi" },
  { id: "at_c08", channelId: "manual", connectionId: null, externalId: null, receivedAt: hoursAgo(6), campaign: null, referrer: "Walk-in, Nabeul shop", conversationId: "cv_08", contactId: "ct_ines" },
  { id: "at_c09", channelId: "instagram", connectionId: "cn_instagram", externalId: "ig_msg_178391884", receivedAt: daysAgo(2), campaign: null, referrer: "Post comment", conversationId: "cv_09", contactId: "ct_hatem" },
  { id: "at_c10", channelId: "google", connectionId: "cn_google_ads", externalId: "gads_lead_88104", receivedAt: daysAgo(2), campaign: "Brand, always on", conversationId: "cv_10", contactId: "ct_leila", referrer: null },
  { id: "at_c11", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.HBgLMjE2NTUxMjM0NT", receivedAt: daysAgo(3), campaign: null, referrer: null, conversationId: "cv_11", contactId: "ct_sonia" },
  { id: "at_c12", channelId: "facebook", connectionId: "cn_facebook", externalId: "mid.$cAAB1w7Rz", receivedAt: daysAgo(8), campaign: null, referrer: null, conversationId: "cv_12", contactId: "ct_walid" },
  { id: "at_c13", channelId: "website", connectionId: "cn_website_form", externalId: "form_51ccd9", receivedAt: daysAgo(4), campaign: null, referrer: "Les Saveurs celebration platter page", conversationId: "cv_13", contactId: "ct_karim" },
  { id: "at_c14", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.HBgLMjE2MjAxMTQ4ODJ2", receivedAt: daysAgo(5), campaign: null, referrer: null, conversationId: "cv_14", contactId: "ct_rania" },
  { id: "at_c15", channelId: "instagram", connectionId: "cn_instagram", externalId: "ig_msg_178388120", receivedAt: daysAgo(12), campaign: null, referrer: "Story reply", conversationId: "cv_15", contactId: "ct_mehdi" },
  { id: "at_c16", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.HBgLMjE2OTQ0MTIzMT", receivedAt: daysAgo(6), campaign: null, referrer: null, conversationId: "cv_16", contactId: "ct_yosr" },
  { id: "at_c17", channelId: "website", connectionId: "cn_website_form", externalId: "form_2bb47f", receivedAt: daysAgo(9), campaign: null, referrer: "Les Saveurs contact page", conversationId: "cv_17", contactId: "ct_leila" },
  { id: "at_c18", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.HBgLMjE2MjIzNDU2Nz", receivedAt: daysAgo(14), campaign: null, referrer: null, conversationId: "cv_18", contactId: "ct_sonia" },
];

export const CONTACTS: Contact[] = [
  {
    id: "ct_rania", name: "Rania Trabelsi", phone: "+216 20 114 882", email: "rania.trabelsi@gmail.com",
    city: "Ariana", language: "Arabic", firstTouchChannel: "whatsapp", latestTouchChannel: "whatsapp",
    firstContactAt: daysAgo(26), stage: "qualified", tags: ["Repeat buyer", "Priority customer", "Gift set"],
    leadScore: 78,
    leadScoreReasons: [
      "She has bought twice before, in June and August",
      "She replied within an hour on her last three messages",
      "She asked about one specific product rather than browsing",
    ],
    lifetimeValue: 560, ownerId: "tm_sarra",
    notes: [
      { id: "nt_01", authorId: "tm_sarra", createdAt: minutesAgo(31), body: "Bought the seasonal jar in June and asked about the dessert box too. Worth offering a pair price." },
    ],
  },
  {
    id: "ct_slim", name: "Slim Ayari", phone: "+216 98 220 145", email: "slim.ayari@outlook.com",
    city: "Sousse", language: "French", firstTouchChannel: "website", latestTouchChannel: "website",
    firstContactAt: hoursAgo(1), stage: "contacted", tags: ["Delivery question"],
    leadScore: 54,
    leadScoreReasons: ["First message came in today", "He gave a delivery date he needs to hit"],
    lifetimeValue: 0, ownerId: "tm_mouna", notes: [],
  },
  {
    id: "ct_yosr", name: "Yosr Mahfoudh", phone: "+216 55 901 337", email: "yosr.mahfoudh@gmail.com",
    city: "Tunis", language: "Arabic", firstTouchChannel: "instagram", latestTouchChannel: "whatsapp",
    firstContactAt: daysAgo(19), stage: "proposal", tags: ["Gift set", "Repeat buyer"],
    leadScore: 66,
    leadScoreReasons: [
      "She found the shop on Instagram and then moved to WhatsApp herself",
      "She has an order in progress worth over 400 dinars",
    ],
    lifetimeValue: 412, ownerId: "tm_khaled",
    notes: [
      { id: "nt_02", authorId: "tm_khaled", createdAt: daysAgo(1), body: "Came from Instagram originally. She prefers voice notes on WhatsApp." },
    ],
  },
  {
    id: "ct_amine", name: "Amine Bouzid", phone: "+216 74 310 220", email: "a.bouzid@sfaxnet.tn",
    city: "Sfax", language: "French", firstTouchChannel: "google", latestTouchChannel: "google",
    firstContactAt: hoursAgo(3), stage: "new", tags: ["Price question"],
    leadScore: 41,
    leadScoreReasons: ["He came from a paid ad, so intent is unproven", "No reply yet since the form was submitted"],
    lifetimeValue: 0, ownerId: null, notes: [],
  },
  {
    id: "ct_nadia", name: "Nadia Chaabane", phone: "+216 22 447 019", email: "nadia.chaabane@gmail.com",
    city: "La Marsa", language: "French", firstTouchChannel: "facebook", latestTouchChannel: "facebook",
    firstContactAt: daysAgo(34), stage: "won", tags: ["Repeat buyer"],
    leadScore: 82,
    leadScoreReasons: ["Three completed orders", "She has never asked for a return"],
    lifetimeValue: 1180, ownerId: "tm_yassine", notes: [],
  },
  {
    id: "ct_ines", name: "Ines Gharbi", phone: "+216 71 882 004", email: null,
    city: "Tunis", language: "Arabic", firstTouchChannel: "manual", latestTouchChannel: "manual",
    firstContactAt: daysAgo(41), stage: "won", tags: ["Wholesale", "Priority customer"],
    leadScore: 60,
    leadScoreReasons: ["She orders by phone every few weeks", "Largest single order in the demo data"],
    lifetimeValue: 2080, ownerId: "tm_sarra", notes: [],
  },
  {
    id: "ct_mehdi", name: "Mehdi Karoui", phone: "+216 92 663 118", email: "mehdi.karoui@gmail.com",
    city: "Bizerte", language: "French", firstTouchChannel: "website", latestTouchChannel: "instagram",
    firstContactAt: daysAgo(22), stage: "qualified", tags: ["Wholesale"],
    leadScore: 58,
    leadScoreReasons: ["He asked about buying twelve at a time", "He arrived through the site and now writes on Instagram"],
    lifetimeValue: 148, ownerId: "tm_khaled", notes: [],
  },
  {
    id: "ct_olfa", name: "Olfa Ben Salah", phone: "+216 98 221 100", email: null,
    city: "Nabeul", language: "Arabic", firstTouchChannel: "whatsapp", latestTouchChannel: "whatsapp",
    firstContactAt: daysAgo(11), stage: "contacted", tags: ["Delivery question"],
    leadScore: 47,
    leadScoreReasons: ["One order, delivered", "She asks about delivery cost before every purchase"],
    lifetimeValue: 118, ownerId: "tm_mouna", notes: [],
  },
  {
    id: "ct_hatem", name: "Hatem Zouari", phone: null, email: null,
    city: "Tunis", language: "Arabic", firstTouchChannel: "instagram", latestTouchChannel: "instagram",
    firstContactAt: daysAgo(2), stage: "new", tags: ["Price question"],
    leadScore: 35,
    leadScoreReasons: ["No phone number yet", "One message, no reply from us"],
    lifetimeValue: 0, ownerId: null, notes: [],
  },
  {
    id: "ct_leila", name: "Leila Ferchichi", phone: "+216 73 445 890", email: "leila.ferchichi@gmail.com",
    city: "Monastir", language: "French", firstTouchChannel: "google", latestTouchChannel: "website",
    firstContactAt: daysAgo(9), stage: "proposal", tags: ["Gift set", "Ramadan range"],
    leadScore: 71,
    leadScoreReasons: [
      "She came from an ad and then returned through the site on her own",
      "She asked for a quote for eight gift sets",
    ],
    lifetimeValue: 0, ownerId: "tm_khaled", notes: [],
  },
  {
    id: "ct_walid", name: "Walid Jaziri", phone: "+216 29 118 220", email: null,
    city: "Ben Arous", language: "Arabic", firstTouchChannel: "facebook", latestTouchChannel: "facebook",
    firstContactAt: daysAgo(8), stage: "lost", tags: ["Price question"],
    leadScore: 22,
    leadScoreReasons: ["He said the price was above his budget", "No reply for eight days"],
    lifetimeValue: 0, ownerId: "tm_yassine", notes: [],
  },
  {
    id: "ct_sonia", name: "Sonia Mejri", phone: "+216 22 340 771", email: "sonia.mejri@gmail.com",
    city: "Ariana", language: "Arabic", firstTouchChannel: "manual", latestTouchChannel: "whatsapp",
    firstContactAt: daysAgo(48), stage: "contacted", tags: ["Repeat buyer", "Ramadan range"],
    leadScore: 49,
    leadScoreReasons: ["She was added by hand after a phone call", "Two orders since, both on WhatsApp"],
    lifetimeValue: 336, ownerId: "tm_mouna", notes: [],
  },
  /**
   * Two records that a CSV import left behind: the same phone number under a
   * shortened name, and the same email under initials. The Contacts screen has
   * to be able to say so rather than quietly holding both.
   */
  {
    id: "ct_rania_dup", name: "Rania T.", phone: "+216 20 114 882", email: null,
    city: "Ariana", language: "Arabic", firstTouchChannel: "manual", latestTouchChannel: "manual",
    firstContactAt: daysAgo(3), stage: "new", tags: [],
    leadScore: 30,
    leadScoreReasons: ["Added by a spreadsheet import on 6 September 2026", "No conversation on this record"],
    lifetimeValue: 0, ownerId: null, notes: [],
  },
  {
    id: "ct_leila_dup", name: "L. Ferchichi", phone: null, email: "leila.ferchichi@gmail.com",
    city: "Monastir", language: "French", firstTouchChannel: "website", latestTouchChannel: "website",
    firstContactAt: daysAgo(3), stage: "new", tags: [],
    leadScore: 28,
    leadScoreReasons: ["Added by a spreadsheet import on 6 September 2026", "No conversation on this record"],
    lifetimeValue: 0, ownerId: null, notes: [],
  },
  {
    id: "ct_karim", name: "Karim Belaid", phone: "+216 24 900 116", email: "karim.belaid@gmail.com",
    city: "Tunis", language: "French", firstTouchChannel: "website", latestTouchChannel: "website",
    firstContactAt: daysAgo(4), stage: "new", tags: ["Price question"],
    leadScore: 44,
    leadScoreReasons: ["He looked at the dessert platter page before writing", "No reply from us for four days"],
    lifetimeValue: 0, ownerId: null, notes: [],
  },
];

export const CONVERSATIONS: Conversation[] = [
  { id: "cv_01", contactId: "ct_rania", attributionId: "at_c01", subject: "Crème de pistache in stock", status: "open", priority: true, unreadCount: 2, assigneeId: "tm_sarra", tags: ["Priority customer"], lastMessageAt: minutesAgo(9) },
  { id: "cv_02", contactId: "ct_yosr", attributionId: "at_c02", subject: "Photo of the pistachio dessert", status: "waiting", priority: false, unreadCount: 0, assigneeId: "tm_khaled", tags: ["Gift set"], lastMessageAt: minutesAgo(24) },
  { id: "cv_03", contactId: "ct_slim", attributionId: "at_c03", subject: "Delivery to Sousse before Friday", status: "new", priority: false, unreadCount: 1, assigneeId: "tm_mouna", tags: ["Delivery question"], lastMessageAt: hoursAgo(1) },
  { id: "cv_04", contactId: "ct_amine", attributionId: "at_c04", subject: "Gift set price", status: "new", priority: false, unreadCount: 1, assigneeId: null, tags: ["Price question"], lastMessageAt: hoursAgo(3) },
  { id: "cv_05", contactId: "ct_nadia", attributionId: "at_c05", subject: "Order arrived this morning", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_yassine", tags: [], lastMessageAt: daysAgo(1) },
  { id: "cv_06", contactId: "ct_olfa", attributionId: "at_c06", subject: "Delivery cost to Nabeul", status: "open", priority: false, unreadCount: 1, assigneeId: "tm_mouna", tags: ["Delivery question"], lastMessageAt: hoursAgo(5) },
  { id: "cv_07", contactId: "ct_mehdi", attributionId: "at_c07", subject: "Price for twelve dessert assortments", status: "open", priority: false, unreadCount: 0, assigneeId: "tm_khaled", tags: ["Wholesale"], lastMessageAt: hoursAgo(7) },
  { id: "cv_08", contactId: "ct_ines", attributionId: "at_c08", subject: "Repeat order taken in the shop", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_sarra", tags: ["Wholesale"], lastMessageAt: hoursAgo(6) },
  { id: "cv_09", contactId: "ct_hatem", attributionId: "at_c09", subject: "How much is the dessert assortment", status: "new", priority: false, unreadCount: 1, assigneeId: null, tags: ["Price question"], lastMessageAt: daysAgo(2) },
  { id: "cv_10", contactId: "ct_leila", attributionId: "at_c10", subject: "Quote for eight gift sets", status: "open", priority: true, unreadCount: 0, assigneeId: "tm_khaled", tags: ["Gift set"], lastMessageAt: daysAgo(2) },
  { id: "cv_11", contactId: "ct_sonia", attributionId: "at_c11", subject: "Dessert assortment back in stock", status: "waiting", priority: false, unreadCount: 0, assigneeId: "tm_mouna", tags: ["Ramadan range"], lastMessageAt: daysAgo(3) },
  { id: "cv_12", contactId: "ct_walid", attributionId: "at_c12", subject: "Pistachio dessert, is there a discount", status: "snoozed", priority: false, unreadCount: 0, assigneeId: "tm_yassine", tags: ["Price question"], lastMessageAt: daysAgo(8) },
  { id: "cv_13", contactId: "ct_karim", attributionId: "at_c13", subject: "Dessert platter dimensions", status: "new", priority: false, unreadCount: 1, assigneeId: null, tags: [], lastMessageAt: daysAgo(4) },
  { id: "cv_14", contactId: "ct_rania", attributionId: "at_c14", subject: "Seasonal jar delivered", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_sarra", tags: [], lastMessageAt: daysAgo(5) },
  { id: "cv_15", contactId: "ct_mehdi", attributionId: "at_c15", subject: "Are the dessert boxes handmade", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_khaled", tags: [], lastMessageAt: daysAgo(12) },
  { id: "cv_16", contactId: "ct_yosr", attributionId: "at_c16", subject: "Change of delivery address", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_khaled", tags: [], lastMessageAt: daysAgo(6) },
  { id: "cv_17", contactId: "ct_leila", attributionId: "at_c17", subject: "Do you ship to Monastir", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_mouna", tags: ["Delivery question"], lastMessageAt: daysAgo(9) },
  { id: "cv_18", contactId: "ct_sonia", attributionId: "at_c18", subject: "Ramadan range dates", status: "resolved", priority: false, unreadCount: 0, assigneeId: "tm_mouna", tags: ["Ramadan range"], lastMessageAt: daysAgo(14) },
];

export const MESSAGES: Message[] = [
  { id: "ms_0101", conversationId: "cv_01", direction: "inbound", body: "Hello, is the pistachio cream still available?", sentAt: minutesAgo(38), authorId: null, externalId: "wamid.HBgLMjE2MjAxMTQ4ODIVAgAR", attachments: [] },
  { id: "ms_0102", conversationId: "cv_01", direction: "inbound", body: "I need it before Saturday if possible.", sentAt: minutesAgo(37), authorId: null, externalId: "wamid.HBgLMjE2MjAxMTQ4ODIVAgAS", attachments: [{ id: "at_img_01", kind: "image", filename: "pistachio-jar.jpg", sizeLabel: "240 KB" }] },
  { id: "ms_0103", conversationId: "cv_01", direction: "outbound", body: "Good morning Rania. Yes, the green one is in stock. Delivery to Ariana takes two days, so Saturday works.", sentAt: minutesAgo(33), authorId: "tm_sarra", externalId: "wamid.HBgLMjE2MjAxMTQ4ODIVAgAT", attachments: [] },
  { id: "ms_0104", conversationId: "cv_01", direction: "note", body: "She bought the seasonal jar in June and asked about the dessert box too. Worth offering a pair price.", sentAt: minutesAgo(31), authorId: "tm_sarra", externalId: null, attachments: [] },
  { id: "ms_0105", conversationId: "cv_01", direction: "inbound", body: "Perfect, can you keep one for me?", sentAt: minutesAgo(9), authorId: null, externalId: "wamid.HBgLMjE2MjAxMTQ4ODIVAgAU", attachments: [] },

  { id: "ms_0201", conversationId: "cv_02", direction: "inbound", body: "This is the pistachio dessert I meant, the one from your story.", sentAt: hoursAgo(3), authorId: null, externalId: "ig_msg_178394021", attachments: [{ id: "at_img_02", kind: "image", filename: "story-screenshot.jpg", sizeLabel: "612 KB" }] },
  { id: "ms_0202", conversationId: "cv_02", direction: "outbound", body: "That is the pistachio dessert, 68 TND in the demo catalog. I can put one aside for you.", sentAt: hoursAgo(2), authorId: "tm_khaled", externalId: "ig_msg_178394044", attachments: [] },
  { id: "ms_0203", conversationId: "cv_02", direction: "inbound", body: "Let me think about it tonight.", sentAt: minutesAgo(24), authorId: null, externalId: "ig_msg_178394090", attachments: [] },

  { id: "ms_0301", conversationId: "cv_03", direction: "inbound", body: "Bonjour, je voudrais commander deux assortiments de desserts. Livraison possible a Sousse avant vendredi?", sentAt: hoursAgo(1), authorId: null, externalId: "form_7d31c0", attachments: [] },

  { id: "ms_0401", conversationId: "cv_04", direction: "inbound", body: "Combien coûte le coffret gourmand avec les desserts et le pot?", sentAt: hoursAgo(3), authorId: null, externalId: "gads_lead_88213", attachments: [] },

  { id: "ms_0501", conversationId: "cv_05", direction: "inbound", body: "Bonjour, la commande est bien arrivee ce matin. Merci beaucoup.", sentAt: daysAgo(1), authorId: null, externalId: "mid.$cAAB1x9k", attachments: [] },
  { id: "ms_0502", conversationId: "cv_05", direction: "outbound", body: "Merci Nadia, a bientot.", sentAt: daysAgo(1), authorId: "tm_yassine", externalId: "mid.$cAAB1x9m", attachments: [] },

  { id: "ms_0601", conversationId: "cv_06", direction: "inbound", body: "Combien la livraison a Nabeul?", sentAt: hoursAgo(6), authorId: null, externalId: "wamid.HBgLMjE2OTgyMjExMD", attachments: [] },
  { id: "ms_0602", conversationId: "cv_06", direction: "outbound", body: "7,500 TND, et c'est gratuit au dela de 200 TND.", sentAt: hoursAgo(6), authorId: "tm_mouna", externalId: "wamid.HBgLMjE2OTgyMjExME", attachments: [] },
  { id: "ms_0603", conversationId: "cv_06", direction: "inbound", body: "D'accord, je prepare ma liste.", sentAt: hoursAgo(5), authorId: null, externalId: "wamid.HBgLMjE2OTgyMjExMF", attachments: [] },

  { id: "ms_0701", conversationId: "cv_07", direction: "inbound", body: "I run a small hotel in Bizerte. What is the price for twelve dessert assortments?", sentAt: hoursAgo(8), authorId: null, externalId: "form_9a02be", attachments: [] },
  { id: "ms_0702", conversationId: "cv_07", direction: "outbound", body: "For twelve I can do 70 TND each in the demo catalog instead of 78. Delivery included.", sentAt: hoursAgo(7), authorId: "tm_khaled", externalId: null, attachments: [] },
  { id: "ms_0703", conversationId: "cv_07", direction: "note", body: "He first wrote through the site, then moved to Instagram in August. Same person, same phone.", sentAt: hoursAgo(7), authorId: "tm_khaled", externalId: null, attachments: [] },

  { id: "ms_0801", conversationId: "cv_08", direction: "note", body: "Came into the shop in Nabeul and repeated her usual order. Taken by hand at the counter.", sentAt: hoursAgo(6), authorId: "tm_sarra", externalId: null, attachments: [] },
  { id: "ms_0802", conversationId: "cv_08", direction: "outbound", body: "Order recorded, delivery Thursday.", sentAt: hoursAgo(6), authorId: "tm_sarra", externalId: null, attachments: [] },

  { id: "ms_0901", conversationId: "cv_09", direction: "inbound", body: "bech na3ref el prix mta3 assortiment el hlou?", sentAt: daysAgo(2), authorId: null, externalId: "ig_msg_178391884", attachments: [] },

  { id: "ms_1001", conversationId: "cv_10", direction: "inbound", body: "Je cherche huit coffrets cadeaux pour mes clients. Vous faites un prix?", sentAt: daysAgo(2), authorId: null, externalId: "gads_lead_88104", attachments: [] },
  { id: "ms_1002", conversationId: "cv_10", direction: "outbound", body: "Oui. Pour huit coffrets, 940 TND l'unite au lieu de 1 040. Je vous envoie le devis aujourd'hui.", sentAt: daysAgo(2), authorId: "tm_khaled", externalId: null, attachments: [] },
  { id: "ms_1003", conversationId: "cv_10", direction: "note", body: "She arrived on a Google ad in August, then came back through the site herself. First touch stays Google.", sentAt: daysAgo(2), authorId: "tm_khaled", externalId: null, attachments: [] },

  { id: "ms_1101", conversationId: "cv_11", direction: "outbound", body: "The dessert assortments are back in stock, as you asked.", sentAt: daysAgo(3), authorId: "tm_mouna", externalId: "wamid.HBgLMjE2NTUxMjM0NT", attachments: [] },
  { id: "ms_1102", conversationId: "cv_11", direction: "inbound", body: "Great, I will pass by on Saturday.", sentAt: daysAgo(3), authorId: null, externalId: "wamid.HBgLMjE2NTUxMjM0NU", attachments: [] },

  { id: "ms_1201", conversationId: "cv_12", direction: "inbound", body: "El dessert b 68 barcha. Famma discount?", sentAt: daysAgo(8), authorId: null, externalId: "mid.$cAAB1w7Rz", attachments: [] },
  { id: "ms_1202", conversationId: "cv_12", direction: "outbound", body: "The pistachio dessert price is fixed in the demo catalog. I can offer free delivery.", sentAt: daysAgo(8), authorId: "tm_yassine", externalId: "mid.$cAAB1w7Sa", attachments: [] },
  { id: "ms_1203", conversationId: "cv_12", direction: "note", body: "Snoozed for a week. If he does not reply, mark the lead lost.", sentAt: daysAgo(8), authorId: "tm_yassine", externalId: null, attachments: [] },

  { id: "ms_1301", conversationId: "cv_13", direction: "inbound", body: "Quelles sont les dimensions exactes du plateau de fête?", sentAt: daysAgo(4), authorId: null, externalId: "form_51ccd9", attachments: [] },

  { id: "ms_1401", conversationId: "cv_14", direction: "inbound", body: "The seasonal jar arrived, thank you.", sentAt: daysAgo(5), authorId: null, externalId: "wamid.HBgLMjE2MjAxMTQ4ODJ2", attachments: [] },
  { id: "ms_1402", conversationId: "cv_14", direction: "outbound", body: "Glad it arrived safely, Rania.", sentAt: daysAgo(5), authorId: "tm_sarra", externalId: "wamid.HBgLMjE2MjAxMTQ4ODJ3", attachments: [] },

  { id: "ms_1501", conversationId: "cv_15", direction: "inbound", body: "Are the dessert boxes prepared by hand?", sentAt: daysAgo(12), authorId: null, externalId: "ig_msg_178388120", attachments: [] },
  { id: "ms_1502", conversationId: "cv_15", direction: "outbound", body: "They are prepared by hand. No two celebration boxes are exactly the same.", sentAt: daysAgo(12), authorId: "tm_khaled", externalId: "ig_msg_178388133", attachments: [] },

  { id: "ms_1601", conversationId: "cv_16", direction: "inbound", body: "Can you deliver to my office instead? Rue de Marseille, Tunis.", sentAt: daysAgo(6), authorId: null, externalId: "wamid.HBgLMjE2OTQ0MTIzMT", attachments: [] },
  { id: "ms_1602", conversationId: "cv_16", direction: "outbound", body: "Address changed, the driver has the new one.", sentAt: daysAgo(6), authorId: "tm_khaled", externalId: "wamid.HBgLMjE2OTQ0MTIzMU", attachments: [] },

  { id: "ms_1701", conversationId: "cv_17", direction: "inbound", body: "Est-ce que vous livrez a Monastir?", sentAt: daysAgo(9), authorId: null, externalId: "form_2bb47f", attachments: [] },
  { id: "ms_1702", conversationId: "cv_17", direction: "outbound", body: "Oui, en deux a trois jours.", sentAt: daysAgo(9), authorId: "tm_mouna", externalId: null, attachments: [] },

  { id: "ms_1801", conversationId: "cv_18", direction: "inbound", body: "Wa9tech tokhrej el gamme mta3 Ramadan?", sentAt: daysAgo(14), authorId: null, externalId: "wamid.HBgLMjE2MjIzNDU2Nz", attachments: [] },
  { id: "ms_1802", conversationId: "cv_18", direction: "outbound", body: "Two weeks before Ramadan, as every year.", sentAt: daysAgo(14), authorId: "tm_mouna", externalId: "wamid.HBgLMjE2MjIzNDU2Ng", attachments: [] },
  { id: "ms_1803", conversationId: "cv_18", direction: "inbound", body: "Perfect, keep me posted.", sentAt: daysAgo(14), authorId: null, externalId: "wamid.HBgLMjE2MjIzNDU2Nx", attachments: [] },
];
