"use client";

import { useRef, useState, useTransition } from "react";
import {
  addInternalNote,
  assignConversation,
  resolveConversation,
  snoozeConversation,
} from "@/app/(app)/inbox/actions";
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
  /** True only for a signed in account. The demonstration door never writes. */
  canWrite: boolean;
  messages: ThreadMessage[];
  team: { id: string; name: string }[];
  assigneeId: string | null;
  status: string;
  tags: string[];
}

const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  open: "Ouvert",
  waiting: "En attente du client",
  resolved: "Résolu",
  snoozed: "Reporté",
};

/** The three endings of the same sentence, and the only three there are. */
const PENDING = "Enregistrement en cours.";
const SAVED = "Enregistré dans la base de données.";
const DEMO = "Visible pour cette visite seulement, la porte de démonstration n'enregistre rien.";

interface Receipt {
  text: string;
  failed: boolean;
}

/**
 * Every action here says what happened and where it stopped.
 *
 * A signed in account writes to the database: the screen changes first so it
 * stays quick, the server action runs, and the strip under the header then says
 * the change is saved. If the database refuses, the screen goes back to what it
 * showed before and the strip carries the refusal, so a failed write can never
 * be mistaken for a saved one.
 *
 * The demonstration door writes nothing at all. Its changes stay in this
 * component and the strip says so in the same breath. No action is even called,
 * because the database would refuse it at the row level security layer.
 *
 * The reply to the customer is the exception in both modes: no provider account
 * is connected, so nothing is sent and nothing is written.
 */
export function Thread(props: ThreadProps) {
  const [messages, setMessages] = useState(props.messages);
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [draft, setDraft] = useState("");
  const [assigneeId, setAssigneeId] = useState(props.assigneeId);
  const [status, setStatus] = useState(props.status);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [saving, startSaving] = useTransition();

  // A counter rather than a timestamp: two notes added in the same millisecond
  // would otherwise share a key.
  const localCount = useRef(0);

  const assignee = props.team.find((m) => m.id === assigneeId) ?? null;

  function say(text: string) {
    setReceipt({ text, failed: false });
  }

  /**
   * The optimistic step is the same in both modes. What differs is what comes
   * after it: a write and its answer, or a sentence saying there was no write.
   */
  function save(done: string, write: () => Promise<{ ok: boolean; error?: string }>, undo: () => void) {
    if (!props.canWrite) {
      say(`${done} ${DEMO}`);
      return;
    }

    say(`${done} ${PENDING}`);
    startSaving(async () => {
      const result = await write();
      if (result.ok) {
        say(`${done} ${SAVED}`);
        return;
      }
      undo();
      setReceipt({
        text: result.error ?? "Le changement n'a pas pu être enregistré.",
        failed: true,
      });
    });
  }

  function assign(next: string | null) {
    const previous = assigneeId;
    const name = props.team.find((m) => m.id === next)?.name;
    setAssigneeId(next);
    save(
      next ? `Attribué à ${name}.` : "Responsable retiré.",
      () => assignConversation(props.conversationId, next),
      () => setAssigneeId(previous),
    );
  }

  function changeStatus(next: "resolved" | "snoozed") {
    const previous = status;
    setStatus(next);
    save(
      next === "resolved" ? "Marqué comme résolu." : "Reporté.",
      () =>
        next === "resolved"
          ? resolveConversation(props.conversationId)
          : snoozeConversation(props.conversationId),
      () => setStatus(previous),
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;

    if (mode === "reply") {
      // Nothing is sent and nothing is written: no provider account is connected.
      if (!props.canSend) return;
      localCount.current += 1;
      const id = `local_${localCount.current}`;
      setMessages((current) => [
        ...current,
        { id, direction: "outbound", body, stamp: "à l'instant", author: "Vous", attachments: [] },
      ]);
      setDraft("");
      say(
        "Ajouté à la conversation en mode démonstration. Rien n'a été envoyé au client, car aucun compte fournisseur n'est connecté pour le moment.",
      );
      return;
    }

    localCount.current += 1;
    const id = `local_${localCount.current}`;
    setMessages((current) => [
      ...current,
      { id, direction: "note", body, stamp: "à l'instant", author: "Vous", attachments: [] },
    ]);
    setDraft("");

    save(
      "Note ajoutée. Seule votre équipe peut la voir.",
      () => addInternalNote(props.conversationId, body),
      () => {
        // The note never reached the table, so it leaves the thread, and the text
        // goes back into the composer rather than being lost.
        setMessages((current) => current.filter((message) => message.id !== id));
        setDraft(body);
      },
    );
  }

  return (
    <div className="flex min-h-[540px] flex-col border-line lg:border-r">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-[15px] leading-tight">{props.customerName}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
            <SourceBadge channelId={props.channelId} account={props.account} size="sm" />
            Premier message le {props.firstContactLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <select
            aria-label="Attribuer à"
            value={assigneeId ?? ""}
            disabled={saving}
            onChange={(e) => assign(e.target.value || null)}
            className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[12px] disabled:opacity-60"
          >
            <option value="">Attribuer à</option>
            {props.team.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={saving}
            onClick={() => changeStatus("snoozed")}
            className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[12px] disabled:opacity-60"
          >
            Reporter
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => changeStatus("resolved")}
            className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[12px] disabled:opacity-60"
          >
            Résoudre
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2 px-4 py-2">
        <Pill tone={status === "resolved" ? "success" : status === "waiting" ? "accent" : "primary"}>
          {STATUS_LABELS[status] ?? status}
        </Pill>
        <span className="text-[12px] text-muted">
          {assignee ? `Responsable : ${assignee.name}` : "Personne ne s'en occupe"}
        </span>
        {props.tags.map((tag) => (
          <TagChip key={tag} label={tag} />
        ))}
      </div>

      {receipt ? (
        <p
          role="status"
          className={`border-b px-4 py-2 text-[12px] ${
            receipt.failed
              ? "border-danger/20 bg-danger-soft text-danger"
              : "border-accent-line bg-accent-soft text-accent-ink"
          }`}
        >
          {receipt.text}
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
                  Note interne, le client ne la voit jamais
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
                  {file.kind === "image" ? "Photo" : "Fichier"}, {file.filename}, {file.sizeLabel}
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
            Répondre sur {props.channelLabel}
          </button>
          <button
            type="button"
            onClick={() => setMode("note")}
            className={`rounded-full border px-3 py-1 text-[11.5px] ${
              mode === "note" ? "border-accent-line bg-accent-soft font-semibold text-accent-ink" : "border-line text-muted"
            }`}
          >
            Note interne
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
            placeholder={mode === "note" ? "Écrire une note pour votre équipe" : props.composerPlaceholder}
            aria-label={mode === "note" ? "Note interne" : "Réponse"}
            className="min-h-[44px] flex-1 resize-none rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2 text-[13px]"
          />
          <button
            type="submit"
            disabled={(mode === "reply" && !props.canSend) || (mode === "note" && saving)}
            className="rounded-[var(--radius-md)] bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hi disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-muted"
          >
            {mode === "note" ? "Ajouter la note" : "Envoyer"}
          </button>
        </div>
      </form>
    </div>
  );
}
