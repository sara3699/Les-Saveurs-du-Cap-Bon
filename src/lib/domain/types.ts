/**
 * The domain vocabulary of Les Saveurs du Cap Bon.
 *
 * The one rule this file exists to protect: a request that arrived on WhatsApp is
 * a WhatsApp request forever. Every record that can be created from an incoming
 * request therefore carries an attribution id rather than a loose string, so a
 * later screen cannot quietly relabel it "Online".
 */

export type ChannelId =
  | "website"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "google"
  | "manual";

/**
 * Connection states are deliberately five, not two. "Not connected" and "setup
 * required" look the same to a database and completely different to an owner:
 * one has never been started, the other is half done and waiting on Meta.
 */
export type ConnectionStatus =
  | "connected"
  | "setup_required"
  | "not_connected"
  | "warning"
  | "error";

export interface ChannelConnection {
  /** Referenced by SourceAttribution.connectionId. */
  id: string;
  channelId: ChannelId;
  /** What the owner recognises: a phone number, a page name, a form name. */
  accountLabel: string;
  status: ConnectionStatus;
  /** Plain-language description of what this connector does for the business. */
  summary: string;
  /** The business asset the provider requires before anything works. */
  requires: string;
  permissions: string[];
  lastSyncAt: string | null;
  lastEventAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  /** What is still missing while status is "setup_required". */
  outstanding: string[];
  /** Set when the provider gates the connector behind review or verification. */
  reviewNote: string | null;
  eventsThisWeek: number;
  setupGuideHref: string;
  /** Planned connectors are visible but cannot be started yet. */
  planned?: boolean;
}

/**
 * One attribution record per incoming request. Orders, conversations, contacts
 * and leads point at it; none of them store a channel string of their own.
 */
export interface SourceAttribution {
  id: string;
  channelId: ChannelId;
  /** null only for manual entry, where there is no connected account. */
  connectionId: string | null;
  /** The provider's own id for the message, lead or order. Used for idempotency. */
  externalId: string | null;
  /** When Les Saveurs du Cap Bon first received it, not when the customer wrote it. */
  receivedAt: string;
  campaign: string | null;
  referrer: string | null;
  conversationId: string | null;
  contactId: string | null;
}

export type PipelineStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

export interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  language: string;
  /** Never overwritten once set. */
  firstTouchChannel: ChannelId;
  /** Moves as the customer arrives through other channels. */
  latestTouchChannel: ChannelId;
  firstContactAt: string;
  stage: PipelineStage;
  tags: string[];
  leadScore: number;
  /** Why the score is what it is, in words the owner can repeat to a customer. */
  leadScoreReasons: string[];
  lifetimeValue: number;
  ownerId: string | null;
  notes: ContactNote[];
}

export interface ContactNote {
  id: string;
  authorId: string;
  createdAt: string;
  body: string;
}

export type ConversationStatus = "new" | "open" | "waiting" | "resolved" | "snoozed";

export interface Conversation {
  id: string;
  contactId: string;
  attributionId: string;
  subject: string;
  status: ConversationStatus;
  priority: boolean;
  unreadCount: number;
  assigneeId: string | null;
  tags: string[];
  lastMessageAt: string;
}

export type MessageDirection = "inbound" | "outbound" | "note";

export interface MessageAttachment {
  id: string;
  kind: "image" | "document" | "audio";
  filename: string;
  sizeLabel: string;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  body: string;
  sentAt: string;
  authorId: string | null;
  /** The provider's message id, absent on internal notes and manual entries. */
  externalId: string | null;
  attachments: MessageAttachment[];
}

export type PaymentStatus = "paid" | "cash_on_delivery" | "pending" | "refused" | "refunded";
export type DeliveryStatus = "preparing" | "dispatched" | "delivered" | "returned" | "cancelled";

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  reference: string;
  contactId: string;
  /** The only place an order's channel is recorded. */
  attributionId: string;
  conversationId: string | null;
  placedAt: string;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  assigneeId: string | null;
  items: OrderItem[];
  deliveryFee: number;
  total: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  lowStockAt: number;
  unitsSold: number;
}

export type TeamRole = "owner" | "manager" | "agent";

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: TeamRole;
  openConversations: number;
  tasksDue: number;
}

export interface TeamConversionMetric {
  id: string;
  teamMemberId: string;
  callsReceived: number;
  customersReached: number;
  customersWon: number;
  customersRejected: number;
  ordersPlaced: number;
  revenue: number;
}

export type TaskType = "call" | "reply" | "meeting" | "quote" | "reminder" | "custom";

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  contactId: string | null;
  conversationId: string | null;
  assigneeId: string;
  dueAt: string;
  priority: "low" | "normal" | "high";
  completedAt: string | null;
}

export interface Tag {
  id: string;
  label: string;
}

export interface ActivityEvent {
  id: string;
  contactId: string;
  at: string;
  /** Attribution is optional: an assignment has no channel, an order does. */
  attributionId: string | null;
  kind:
    | "message_in"
    | "message_out"
    | "order_placed"
    | "stage_changed"
    | "assigned"
    | "note_added"
    | "task_created";
  summary: string;
}
