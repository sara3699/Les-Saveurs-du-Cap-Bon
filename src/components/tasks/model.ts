import type { ChannelId, TaskType } from "@/lib/domain/types";
import { formatClock, formatDateTime, isOverdue } from "@/lib/format";

/**
 * Everything the Tasks screen needs about one follow-up, already turned into
 * strings on the server. The checkbox lives in a client component, and the demo
 * clock must not be read twice, so no date arithmetic crosses that boundary.
 */
export interface TaskRow {
  id: string;
  title: string;
  type: TaskType;
  bucket: TaskBucket;
  /** null for shop work that belongs to nobody in particular. */
  contactId: string | null;
  customerName: string | null;
  /** The message that caused the follow-up, when there was one. */
  conversationHref: string | null;
  /** Resolved from the conversation's attribution, never written by hand. */
  channelId: ChannelId | null;
  account: string | null;
  dueLabel: string;
  lateLabel: string | null;
  ownerName: string;
  priority: "low" | "normal" | "high";
  doneLabel: string | null;
}

export type TaskBucket = "overdue" | "today" | "upcoming";

export const TASK_TYPES: TaskType[] = ["call", "reply", "meeting", "quote", "reminder", "custom"];

export const TYPE_LABEL: Record<TaskType, string> = {
  call: "Appel",
  reply: "Réponse",
  meeting: "Rendez-vous",
  quote: "Devis",
  reminder: "Rappel",
  custom: "Autre",
};

/**
 * Three tints, not six. The swatch says what kind of work it is, talking to a
 * customer, money, or shop admin, and the word next to it says exactly which.
 * Yellow is spent only where a price is involved.
 */
export const TYPE_SWATCH: Record<TaskType, string> = {
  call: "bg-primary",
  reply: "bg-primary",
  meeting: "bg-primary",
  quote: "bg-accent",
  reminder: "bg-line-strong",
  custom: "bg-line-strong",
};

export const TYPE_MEANING: Record<TaskType, string> = {
  call: "Prenez le téléphone. Le client a demandé une voix, pas un message.",
  reply: "Répondez sur le canal par lequel la question est arrivée.",
  meeting: "Voyez le client, à l'atelier ou chez lui.",
  quote: "Mettez un prix par écrit et envoyez-le.",
  reminder: "Quelque chose à mettre de côté, à réserver ou à vérifier avant une date.",
  custom: "Du travail de boutique qui n'entre dans aucune des cinq catégories ci-dessus.",
};

export const PRIORITY_LABEL: Record<TaskRow["priority"], string> = {
  high: "Haute",
  normal: "Normale",
  low: "Basse",
};

export const PRIORITY_TONE: Record<TaskRow["priority"], "accent" | "muted"> = {
  high: "accent",
  normal: "muted",
  low: "muted",
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Whole calendar days between the due date and now. Today is 0, tomorrow is 1. */
function dayGap(iso: string, now: Date): number {
  return Math.round((startOfDay(new Date(iso)).getTime() - startOfDay(now).getTime()) / DAY);
}

/**
 * Overdue wins over today. A follow-up that was due at nine this morning is not
 * a thing to do later, it is a thing that is already late.
 */
export function bucketFor(dueAt: string, now: Date): TaskBucket {
  if (isOverdue(dueAt, now)) return "overdue";
  return dayGap(dueAt, now) === 0 ? "today" : "upcoming";
}

export function dueInWords(dueAt: string, now: Date): string {
  const gap = dayGap(dueAt, now);
  if (gap === 0) return `Aujourd'hui, ${formatClock(dueAt)}`;
  if (gap === 1) return `Demain, ${formatClock(dueAt)}`;
  if (gap === -1) return `Hier, ${formatClock(dueAt)}`;
  return formatDateTime(dueAt);
}

/**
 * How late, rounded down, so the screen never claims a follow-up is worse than
 * it is. A minute is the smallest unit worth saying out loud.
 */
export function lateInWords(dueAt: string, now: Date): string {
  const diff = now.getTime() - new Date(dueAt).getTime();
  if (diff < HOUR) {
    const minutes = Math.max(1, Math.floor(diff / MINUTE));
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} de retard`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} ${hours === 1 ? "heure" : "heures"} de retard`;
  }
  const days = Math.floor(diff / DAY);
  return `${days} ${days === 1 ? "jour" : "jours"} de retard`;
}
