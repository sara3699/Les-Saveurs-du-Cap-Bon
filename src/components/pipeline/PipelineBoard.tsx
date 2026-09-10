"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SourceBadge } from "@/components/ui/badges";
import { formatTND } from "@/lib/format";
import { STAGES, stageIndex, stageLabel, type PipelineCard, type StageId } from "./types";

interface Move {
  cardId: string;
  name: string;
  from: StageId;
  to: StageId;
}

/**
 * Moving a card changes this component's state and nothing else. There is no
 * pipeline table to write to yet, so the screen says that in the undo strip
 * rather than pretending the move was saved.
 */
export function PipelineBoard({ cards }: { cards: PipelineCard[] }) {
  const [placement, setPlacement] = useState<Record<string, StageId>>({});
  const [moves, setMoves] = useState<Move[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<StageId | null>(null);
  // A card that moves is pulled out of one column and rebuilt in another, so the
  // button that was just pressed no longer exists and the keyboard would be left
  // at the top of the page. This holds the button to hand focus back to.
  const focusAfter = useRef<string | null>(null);

  const stageOf = (card: PipelineCard): StageId => placement[card.id] ?? card.stage;

  function moveCard(card: PipelineCard, to: StageId, focusKey: string | null = null) {
    const from = stageOf(card);
    if (from === to) return;
    focusAfter.current = focusKey;
    setPlacement((current) => ({ ...current, [card.id]: to }));
    setMoves((current) => [...current, { cardId: card.id, name: card.contactName, from, to }]);
  }

  function undo() {
    const last = moves[moves.length - 1];
    if (!last) return;
    // Undo removes the strip the Undo button sits in, so focus goes back to the
    // button on the card that would make the move again.
    focusAfter.current = `${last.cardId}:${
      stageIndex(last.to) > stageIndex(last.from) ? "right" : "left"
    }`;
    setPlacement((current) => ({ ...current, [last.cardId]: last.from }));
    setMoves((current) => current.slice(0, -1));
  }

  /** Gives focus back to this button when it is the one a move just displaced. */
  function takeFocus(key: string) {
    return (element: HTMLButtonElement | null) => {
      if (element && focusAfter.current === key) {
        focusAfter.current = null;
        element.focus();
      }
    };
  }

  function handleDrop(to: StageId, droppedId: string) {
    setOver(null);
    setDragging(null);
    const card = cards.find((c) => c.id === droppedId);
    if (card) moveCard(card, to);
  }

  const last = moves.length > 0 ? moves[moves.length - 1] : null;

  // Counted off where the cards are standing now, so a move changes this line at
  // the same moment it changes the column totals underneath it.
  const openCards = cards.filter((card) => stageOf(card) !== "won" && stageOf(card) !== "lost");
  const openValue = openCards.reduce((sum, card) => sum + card.value, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* The strip is always here so a screen reader is listening to it before the
          first move happens. With nothing to say it takes no space on screen. */}
      <div
        role="status"
        aria-live="polite"
        className={
          last
            ? "flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-primary-mute bg-primary-soft px-3 py-2.5"
            : "sr-only"
        }
      >
        {last ? (
          <>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">
                {last.name} passe de {stageLabel(last.from)} a {stageLabel(last.to)}.
              </p>
              <p className="mt-0.5 max-w-[74ch] text-[12px] text-muted">
                Ce deplacement est garde pour cette visite seulement, la base de données qui
                l'enregistrerait viendra plus tard. Rien n'a été envoyé a {last.name}.
                {moves.length > 1 ? ` ${moves.length} deplacements sont gardes pour l'instant.` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={undo}
              className="shrink-0 rounded-[var(--radius-md)] bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-hi"
            >
              Annuler
            </button>
          </>
        ) : null}
      </div>

      <p className="text-xs text-muted">
        <span className="os-num">{openCards.length}</span> sur{" "}
        <span className="os-num">{cards.length}</span> encore en cours, soit{" "}
        <span className="os-num">{formatTND(openValue)}</span> si chacun aboutit. Gagné et perdu
        ne sont pas comptes.
      </p>

      <div className="os-scroll pb-1">
        <div className="flex min-w-[1140px] gap-3">
          {STAGES.map((stage, columnIndex) => {
            const columnCards = cards.filter((card) => stageOf(card) === stage.id);
            const total = columnCards.reduce((sum, card) => sum + card.value, 0);
            const active = over === stage.id;
            const previous = columnIndex > 0 ? STAGES[columnIndex - 1] : null;
            const next = columnIndex < STAGES.length - 1 ? STAGES[columnIndex + 1] : null;

            return (
              <section
                key={stage.id}
                aria-label={`${stage.label}, ${columnCards.length} ${
                  columnCards.length === 1 ? "prospect" : "prospects"
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (over !== stage.id) setOver(stage.id);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setOver((current) => (current === stage.id ? null : current));
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(stage.id, event.dataTransfer.getData("text/plain") || dragging || "");
                }}
                className={`flex min-w-[180px] flex-1 basis-0 flex-col rounded-[var(--radius-card)] border p-2 ${
                  active ? "border-primary bg-primary-soft" : "border-line bg-surface-2"
                }`}
              >
                <header className="px-1 pb-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-[13px] leading-tight">{stage.label}</h2>
                    <span className="os-num rounded-full border border-line bg-surface px-1.5 text-[11px] text-muted">
                      {columnCards.length}
                    </span>
                  </div>
                  <p className="os-num mt-1 text-[12.5px] font-semibold text-accent-ink">
                    {formatTND(total)}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted">{stage.hint}</p>
                </header>

                <div className="flex flex-col gap-2">
                  {columnCards.length === 0 ? (
                    <p className="rounded-[var(--radius-md)] border border-dashed border-line-strong px-2 py-5 text-center text-[11.5px] leading-snug text-muted">
                      Rien dans cette colonne. Deposez une carte ici, ou utilisez les boutons de
                      deplacement d'une carte.
                    </p>
                  ) : (
                    columnCards.map((card) => (
                      <article
                        key={card.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", card.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDragging(card.id);
                        }}
                        onDragEnd={() => {
                          setDragging(null);
                          setOver(null);
                        }}
                        className={`cursor-grab rounded-[var(--radius-md)] border border-line bg-surface p-2.5 active:cursor-grabbing ${
                          dragging === card.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={card.contactHref}
                            draggable={false}
                            className="text-[13px] font-semibold leading-tight hover:underline"
                          >
                            {card.contactName}
                          </Link>
                          <span className="os-num shrink-0 text-[11.5px] font-semibold">
                            {card.valueLabel}
                          </span>
                        </div>

                        <p className="mt-1.5">
                          <SourceBadge channelId={card.channelId} account={card.account} size="sm" />
                        </p>

                        <p className="mt-1.5 text-[11.5px] text-muted">
                          <span className="os-num">{card.ageLabel}</span>, le{" "}
                          {card.openedLabel}
                        </p>

                        <p className="text-[11.5px]">
                          {card.owner ? (
                            <span className="text-muted">Suivi par {card.owner}</span>
                          ) : (
                            <span className="font-semibold text-danger">
                              Aucun responsable pour l'instant
                            </span>
                          )}
                        </p>

                        {stageOf(card) === "lost" && card.lostReason ? (
                          <p className="mt-1.5 text-[11.5px] text-muted">
                            Raison donnee, {card.lostReason.toLowerCase()}
                          </p>
                        ) : null}

                        {card.nextStep ? (
                          <div className="mt-2 rounded-[var(--radius-sm)] bg-surface-2 px-2 py-1.5">
                            <p className="os-label">Prochaine action</p>
                            <p className="mt-0.5 text-[11.5px] leading-snug">{card.nextStep.title}</p>
                            <p
                              className={`os-num mt-0.5 text-[11px] ${
                                card.nextStep.overdue ? "font-semibold text-danger" : "text-muted"
                              }`}
                            >
                              {card.nextStep.overdue
                                ? `En retard, échéance ${card.nextStep.dueLabel}`
                                : `Échéance ${card.nextStep.dueLabel}`}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-2 text-[11.5px] text-faint">Aucune action prévue</p>
                        )}

                        <div className="mt-2 flex items-center justify-between gap-1 border-t border-line pt-2">
                          <button
                            type="button"
                            ref={takeFocus(`${card.id}:left`)}
                            disabled={!previous}
                            onClick={() => {
                              if (previous) moveCard(card, previous.id, `${card.id}:left`);
                            }}
                            aria-label={
                              previous
                                ? `Ramener ${card.contactName} a ${previous.label}`
                                : `${card.contactName} est déjà dans la première colonne`
                            }
                            className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2 py-1 text-[11px] font-semibold hover:bg-surface disabled:cursor-not-allowed disabled:text-faint"
                          >
                            Gauche
                          </button>
                          <span className="os-label truncate">{stage.label}</span>
                          <button
                            type="button"
                            ref={takeFocus(`${card.id}:right`)}
                            disabled={!next}
                            onClick={() => {
                              if (next) moveCard(card, next.id, `${card.id}:right`);
                            }}
                            aria-label={
                              next
                                ? `Faire passer ${card.contactName} a ${next.label}`
                                : `${card.contactName} est déjà dans la dernière colonne`
                            }
                            className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2 py-1 text-[11px] font-semibold hover:bg-surface disabled:cursor-not-allowed disabled:text-faint"
                          >
                            Droite
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <p className="max-w-[86ch] text-xs text-muted">
        Faites glisser une carte vers une autre colonne, ou utilisez les boutons Gauche et Droite,
        qui font la même chose sans souris. Dans une colonne, les cartes les plus fortes en valeur
        sont en haut. Chaque deplacement reste en mode démonstration. Il vit sur cet écran le temps
        de la visite, un rafraichissement remet les six colonnes en place, et aucun message ne part
        vers le client.
      </p>
    </div>
  );
}
