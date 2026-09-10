"use client";

import { useState } from "react";
import { SourceBadge } from "@/components/ui/badges";
import { channel } from "@/lib/domain/channels";
import type { ChannelId } from "@/lib/domain/types";

export interface ReassignItem {
  id: string;
  /** What the row is called: a conversation subject, or an order référence. */
  label: string;
  /** The customer and how long it has been sitting there. */
  détail: string;
  channelId: ChannelId;
  account: string | null;
}

export interface ReassignOption {
  id: string;
  name: string;
  /** "Responsable", "Agent", shown so nobody is handed work their role cannot do. */
  role: string;
}

interface Move {
  itemId: string;
  itemLabel: string;
  toName: string;
}

/**
 * Moving work is the one thing an owner wants to do from this screen, so the
 * control is here rather than behind each conversation. It changes what this
 * screen shows and nothing else, and it says so under the buttons.
 */
export function ReassignControl({
  items,
  options,
  emptyLine,
}: {
  items: ReassignItem[];
  options: ReassignOption[];
  emptyLine: string;
}) {
  const [itemId, setItemId] = useState("");
  const [toId, setToId] = useState("");
  const [moves, setMoves] = useState<Move[]>([]);

  const moved = new Set(moves.map((m) => m.itemId));
  const remaining = items.filter((i) => !moved.has(i.id));
  const selected = remaining.find((i) => i.id === itemId) ?? remaining[0] ?? null;
  const target = options.find((o) => o.id === toId) ?? options[0] ?? null;

  if (items.length === 0) {
    return (
      <p className="mt-auto border-t border-line pt-3 text-[12px] text-muted">{emptyLine}</p>
    );
  }

  return (
    <div className="mt-auto flex flex-col gap-2 border-t border-line pt-3">
      <p className="os-label">Transferer du travail a quelqu&apos;un d&apos;autre</p>

      {remaining.length > 0 && selected && target ? (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              aria-label="Travail a transferer"
              value={selected.id}
              onChange={(event) => setItemId(event.target.value)}
              className="min-w-[9rem] flex-1 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2 py-1.5 text-[12.5px]"
            >
              {remaining.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}, {channel(item.channelId).label}
                </option>
              ))}
            </select>
            <select
              aria-label="Personne a qui le transferer"
              value={target.id}
              onChange={(event) => setToId(event.target.value)}
              className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2 py-1.5 text-[12.5px]"
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}, {option.role.toLowerCase()}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setMoves([...moves, { itemId: selected.id, itemLabel: selected.label, toName: target.name }]);
                setItemId("");
              }}
              className="rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-primary-hi"
            >
              Transferer
            </button>
          </div>
          <p className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
            <SourceBadge channelId={selected.channelId} account={selected.account} size="sm" />
            <span>
              {selected.détail}
              {selected.account ? `, ${selected.account}` : ""}
            </span>
          </p>
        </>
      ) : (
        <p className="text-[12px] text-muted">
          Tout ce qui est ici a été transmis a quelqu&apos;un d&apos;autre sur cet écran.
        </p>
      )}

      {moves.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {moves.map((move) => (
            <li
              key={move.itemId}
              className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[12px]"
            >
              <span className="min-w-0">
                <span className="font-semibold">{move.itemLabel}</span> revient maintenant a{" "}
                {move.toName}
              </span>
              <button
                type="button"
                onClick={() => setMoves(moves.filter((m) => m.itemId !== move.itemId))}
                className="shrink-0 font-semibold text-primary hover:underline"
              >
                Remettre en place
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-[11.5px] text-muted">
        Rien n&apos;est encore enregistré. Un vrai transfert deposerait le travail dans la boite de
        reception de la personne choisie et l&apos;en avertirait. Ici, cela ne change que cet écran,
        et c&apos;est oublie quand vous partez.
      </p>
    </div>
  );
}
