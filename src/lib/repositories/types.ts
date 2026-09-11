import type { Budget, BudgetLine, Bundle, Lead } from "@/lib/mock/operations";
import type {
  ExpenseCategory,
  Receipt,
  ReceiptEvent,
  ReceiptStatus,
} from "@/lib/domain/receipts";
import type { ReceiptFingerprint } from "@/lib/receipts/duplicates";
import type {
  ChannelConnection,
  ChannelId,
  Contact,
  Conversation,
  ConversationStatus,
  Message,
  Order,
  Product,
  SourceAttribution,
  Tag,
  Task,
  TeamConversionMetric,
  TeamMember,
} from "@/lib/domain/types";

/**
 * Screens talk to these interfaces and never to the mock files directly.
 * Swapping the demo data for Supabase later is a new implementation of the same
 * five interfaces, with no change above this line.
 */

export interface ConversationFilter {
  channels?: ChannelId[];
  statuses?: ConversationStatus[];
  assigneeId?: string | null;
  unreadOnly?: boolean;
  search?: string;
}

export interface ConversationRepository {
  list(filter?: ConversationFilter): Promise<Conversation[]>;
  byId(id: string): Promise<Conversation | null>;
  messages(conversationId: string): Promise<Message[]>;
}

export interface ContactRepository {
  list(): Promise<Contact[]>;
  byId(id: string): Promise<Contact | null>;
  /** Contacts sharing a phone number or email, so the screen can warn about duplicates. */
  duplicates(): Promise<{ value: string; contactIds: string[] }[]>;
}

export interface OrderFilter {
  channels?: ChannelId[];
  search?: string;
  paymentStatuses?: string[];
  deliveryStatuses?: string[];
  assigneeId?: string | null;
  minTotal?: number;
  sinceDays?: number;
}

export interface OrderRepository {
  list(filter?: OrderFilter): Promise<Order[]>;
  byReference(reference: string): Promise<Order | null>;
}

export interface IntegrationRepository {
  list(): Promise<ChannelConnection[]>;
  byId(id: string): Promise<ChannelConnection | null>;
}

export interface WorkspaceRepository {
  attributions(): Promise<SourceAttribution[]>;
  team(): Promise<TeamMember[]>;
  conversionMetrics(): Promise<TeamConversionMetric[]>;
  tags(): Promise<Tag[]>;
  products(): Promise<Product[]>;
  tasks(): Promise<Task[]>;
  leads(): Promise<Lead[]>;
  budgets(): Promise<{ budgets: Budget[]; lines: BudgetLine[] }>;
  bundles(): Promise<Bundle[]>;
  lostReasons(): Promise<{ reason: string; count: number }[]>;
}

export interface ReceiptFilter {
  statuses?: ReceiptStatus[];
  categories?: ExpenseCategory[];
  /** The normalised supplier key, not the printed name. */
  merchantKey?: string;
  search?: string;
  /** Both inclusive, on the purchase date, written YYYY-MM-DD. */
  from?: string;
  to?: string;
  /** Set to show one person only their own. Row level security enforces the rest. */
  uploadedById?: string;
}

/**
 * Receipts read the same way orders do: through an interface, so the demonstration set
 * and the database are interchangeable and no screen knows which one it is reading.
 */
export interface ReceiptRepository {
  list(filter?: ReceiptFilter): Promise<Receipt[]>;
  byId(id: string): Promise<Receipt | null>;
  /** Just enough of every receipt to warn about a duplicate without loading them all. */
  fingerprints(): Promise<ReceiptFingerprint[]>;
  events(receiptId: string): Promise<ReceiptEvent[]>;
}

export interface Repositories {
  conversations: ConversationRepository;
  contacts: ContactRepository;
  orders: OrderRepository;
  integrations: IntegrationRepository;
  workspace: WorkspaceRepository;
  receipts: ReceiptRepository;
}
