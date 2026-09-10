"use client";

import { useState } from "react";
import { Pill, SourceBadge, TagChip } from "@/components/ui/badges";
import type { ChannelId } from "@/lib/domain/types";

export interface ThreadMessage {
  id: string;
  direction: "inbound" | "outbound" | "note";
  body: string;
  stamp: string;
  author: string | null;
  attachments: { id: string; filename: string; sizeLabel: string; kind: string }[];
}

export interface ThreadProps {
  conversationId: string;
  customerName: string;
  channelId: ChannelId;
  channelLabel: string;
  account: string | null;
  firstContactLabel: string;
  composerPlaceholder: string;
  canSend: boolean;
  cannotSendReason: string;
  messages: ThreadMessage[];
  team: { id: string; name: string }[];
  assigneeId: string | null;
  status: string;
  tags: string[];
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  open: "Open",
  waiting: "Waiting on customer",
  resolved: "Resolved",
  snoozed: "Snoozed",
};

/**
 * Demo actions change what is on screen and say so. Nothing here pretends to
 * have reached WhatsApp or Instagram: the strip under the header names exactly
 * what happened and where it stopped.
 */
export function Thread(props: ThreadProps) {
  const [messages, setMessages] = useState(props.messages);
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [draft, setDraft] = useState("");
  const [assigneeId, setAssigneeId] = useState(props.assigneeId);
  const [status, setStatus] = useState(props.status);
  const [receipt, setReceipt] = useState<string | null>(null);

  const assignee = props.team.find((m) => m.id === assigneeId) ?? null;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    if (mode === "reply" && !props.canSend) return;

    setMessages((current) => [
      ...current,
      {
        id: `local_${current.length + 1}`,
        direction: mode === "reply" ? "outbound" : "note",
        body,
        stamp: "just now",
        author: "You",
        attachments: [],
      },
    ]);
    setDraft("");
    setReceipt(
      mode === "note"
        ? "Note added. Only your team can see it."
        : "Added to the thread in demo mode. It has not been sent to the customer, because no provider account is connected yet.",
    );
  }

  return (
    <div className="flex min-h-[540px] flex-col border-line lg:border-r">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-[15px] leading-tight">{props.customerName}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
            <SourceBadge channelId={props.channelId} account={props.account} size="sm" />
            First wrote {props.firstContactLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <select
            aria-label="Assign to"
            value={assigneeId ?? ""}
            onChange={(e) => {
              const next = e.target.value || null;
              setAssigneeId(next);
              const name = props.team.find((m) => m.id === next)?.name;
              setReceipt(
                next
                  ? `Assigned to ${name}. Saved for this visit only, until the database is switched on.`
                  : "Owner removed. This request is now unassigned.",
              );
            }}
            className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[12px]"
          >
            <option value="">Assign to</option>
            {props.team.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setStatus("snoozed");
              setReceipt("Snoozed. It comes back to the top of the list tomorrow morning.");
            }}
            className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[12px]"
          >
            Snooze
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus("resolved");
              setReceipt("Marked resolved. It stays searchable in Contacts.");
            }}
            className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[12px]"
          >
            Resolve
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2 px-4 py-2">
        <Pill tone={status === "resolved" ? "success" : status === "waiting" ? "accent" : "primary"}>
          {STATUS_LABELS[status] ?? status}
        </Pill>
        <span className="text-[12px] text-muted">
          {assignee ? `Owned by ${assignee.name}` : "Nobody has picked this up"}
        </span>
        {props.tags.map((tag) => (
          <TagChip key={tag} label={tag} />
        ))}
      </div>

      {receipt ? (
        <p
          role="status"
          className="border-b border-accent-line bg-accent-soft px-4 py-2 text-[12px] text-accent-ink"
        >
          {receipt}
        </p>
      ) : null}

      <ol className="flex flex-1 flex-col gap-3 overflow-y-auto bg-surface-2 px-4 py-4">
        {messages.map((message) => {
          if (message.direction === "note") {
            return (
              <li
                key={message.id}
                className="rounded-[14px] border border-dashed border-accent-line bg-accent-soft px-3.5 py-2.5 text-[13px] text-accent-ink"
              >
                <span className="os-label mb-1 block text-accent-ink">
                  Internal note, the customer never sees this
                </span>
                {message.body}
                <span className="os-num mt-1.5 block text-[10px] opacity-70">
                  {message.author ? `${message.author}, ` : ""}{message.stamp}
                </span>
              </li>
            );
          }
          const inbound = message.direction === "inbound";
          return (
            <li
              key={message.id}
              className={`max-w-[78%] rounded-[14px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                inbound
                  ? "self-start rounded-bl-[5px] border border-line bg-surface"
                  : "self-end rounded-br-[5px] bg-primary text-white"
              }`}
            >
              {message.body}
              {message.attachments.map((file) => (
                <span
                  key={file.id}
                  className={`mt-2 flex items-center gap-2 rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-[11.5px] ${
                    inbound ? "border-line bg-surface-2 text-muted" : "border-white/25 bg-white/10 text-white/85"
                  }`}
                >
                  {file.kind === "image" ? "Photo" : "File"}, {file.filename}, {file.sizeLabel}
                </span>
              ))}
              <span className="os-num mt-1.5 block text-[10px] opacity-65">
                {message.stamp}
                {message.author ? `, ${message.author}` : ""}
              </span>
            </li>
          );
        })}
      </ol>

      <form onSubmit={submit} className="flex flex-col gap-2 border-t border-line px-4 py-3">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setMode("reply")}
            className={`rounded-full border px-3 py-1 text-[11.5px] ${
              mode === "reply" ? "border-primary/25 bg-primary-soft font-semibold text-primary" : "border-line text-muted"
            }`}
          >
            Reply on {props.channelLabel}
          </button>
          <button
            type="button"
            onClick={() => setMode("note")}
            className={`rounded-full border px-3 py-1 text-[11.5px] ${
              mode === "note" ? "border-accent-line bg-accent-soft font-semibold text-accent-ink" : "border-line text-muted"
            }`}
          >
            Internal note
          </button>
        </div>

        {mode === "reply" && !props.canSend ? (
          <p className="rounded-[var(--radius-sm)] border border-danger/20 bg-danger-soft px-3 py-2 text-[12px] text-danger">
            {props.cannotSendReason}
          </p>
        ) : null}

        <div className={`flex items-end gap-2 ${mode === "note" ? "rounded-[var(--radius-md)] bg-accent-soft p-1.5" : ""}`}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder={mode === "note" ? "Write a note for your team" : props.composerPlaceholder}
            aria-label={mode === "note" ? "Internal note" : "Reply"}
            className="min-h-[44px] flex-1 resize-none rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2 text-[13px]"
          />
          <button
            type="submit"
            disabled={mode === "reply" && !props.canSend}
            className="rounded-[var(--radius-md)] bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hi disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-muted"
          >
            {mode === "note" ? "Add note" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
