"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { moveLeadToStage } from "@/app/(app)/pipeline/actions";
import { SourceBadge } from "@/components/ui/badges";
import { formatTND } from "@/lib/format";
import { STAGES, stageIndex, stageLabel, type PipelineCard, type StageId } from "./types";

interface Move {
  /** Identifies one entry in the strip, so a refused move removes its own. */
  key: number;
  cardId: string;
  name: string;
  from: StageId;
  to: StageId;
}

/**
 * Moving a card moves it on screen at once, then writes it down.
 *
 * A signed in account writes leads.stage and a lead_stage_history row, and the
 * card stays where it was dropped after a refresh. Undo is a move in its own
 * right: it walks the lead back and records that walk back as a second history
 * row, because a move that happened and was undone is two facts, not none.
 *
 * The demonstration door writes nothing. The database refuses its writes at the
 * row level security layer, so nothing is attempted, the card moves in this
 * component's state only, and the strip says so.
 */
export function PipelineBoard({ cards, canWrite }: { cards: PipelineCard[]; canWrite: boolean }) {
  const [placement, setPlacement] = useState<Record<string, StageId>>({});
  const [moves, setMoves] = useState<Move[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<StageId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  // A card that moves is pulled out of one column and rebuilt in another, so the
  // button that was just pressed no longer exists and the keyboard would be left
  // at the top of the page. This holds the button to hand focus back to.
  const focusAfter = useRef<string | null>(null);
  const nextKey = useRef(0);

  const stageOf = (card: PipelineCard): StageId => placement[card.id] ?? card.stage;

  function moveCard(card: PipelineCard, to: StageId, focusKey: string | null = null) {
    const from = stageOf(card);
    if (from === to) return;
    focusAfter.current = focusKey;
    const move: Move = { key: nextKey.current++, cardId: card.id, name: card.contactName, from, to };

    // Optimistic: the column changes now, the database catches up after.
    setPlacement((current) => ({ ...current, [card.id]: to }));
    setMoves((current) => [...current, move]);
    setError(null);

    if (!canWrite) return;

    startSaving(async () => {
      const result = await moveLeadToStage(card.id, to);
      if (result.ok) return;
      // Refused. The card goes back where it stood and the strip loses the line
      // that claimed the move, so nothing on screen says a saved move happened.
      setPlacement((current) => ({ ...current, [card.id]: from }));
      setMoves((current) => current.filter((entry) => entry.key !== move.key));
      setError(result.error ?? "Le déplacement n'a pas pu être enregistré.");
    });
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
    setError(null);

    if (!canWrite) return;

    startSaving(async () => {
      // The same action as any other move, so the walk back is written down as
      // its own history row instead of erasing the row for the first move.
      const result = await moveLeadToStage(last.cardId, last.from);
      if (result.ok) return;
      // The undo never reached the database, so the card goes back to where the
      // move had left it and the strip offers the undo again.
      setPlacement((current) => ({ ...current, [last.cardId]: last.to }));
      setMoves((current) => [...current, last]);
      setError(result.error ?? "L'annulation n'a pas pu être enregistrée.");
    });
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

  /*
   * What the strip says about the last move. It is the one sentence on this
   * screen a reader would act on, so it never calls a move saved before the
   * database has said so, and the running tally waits for the same answer.
   */
  function stripNote(move: Move): string {
    if (!canWrite) {
      const note = `Ce déplacement est gardé pour cette visite seulement, l'entrée de démonstration n'enregistre rien dans la base de données. Rien n'a été envoyé à ${move.name}.`;
      return moves.length > 1 ? `${note} ${moves.length} déplacements sont gardés pour l'instant.` : note;
    }
    if (saving) return `Enregistrement en cours. Rien n'a été envoyé à ${move.name}.`;
    const note = `Ce déplacement est enregistré, il sera encore là après un rafraîchissement. Rien n'a été envoyé à ${move.name}.`;
    return moves.length > 1
      ? `${note} ${moves.length} déplacements ont été enregistrés depuis l'ouverture de cet écran.`
      : note;
  }

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
          last || error
            ? `flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border px-3 py-2.5 ${
                error && !last ? "border-danger/20 bg-danger-soft" : "border-primary-mute bg-primary-soft"
              }`
            : "sr-only"
        }
      >
        {last || error ? (
          <>
            <div className="min-w-0">
              {last ? (
                <>
                  <p className="text-[13px] font-semibold">
                    {last.name} passe de {stageLabel(last.from)} à {stageLabel(last.to)}.
                  </p>
                  <p className="mt-0.5 max-w-[74ch] text-[12px] text-muted">{stripNote(last)}</p>
                </>
              ) : null}
              {error ? (
                <p
                  className={`max-w-[74ch] text-[12px] font-semibold text-danger ${last ? "mt-1.5" : ""}`}
                >
                  {error}
                </p>
              ) : null}
            </div>
            {last ? (
              <button
                type="button"
                onClick={undo}
                disabled={saving}
                className="shrink-0 rounded-[var(--radius-md)] bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-hi disabled:cursor-not-allowed disabled:opacity-60"
              >
                Annuler
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      <p className="text-xs text-muted">
        <span className="os-num">{openCards.length}</span> sur{" "}
        <span className="os-num">{cards.length}</span> encore en cours, soit{" "}
        <span className="os-num">{formatTND(openValue)}</span> si chacun aboutit. Gagné et perdu
        ne sont pas comptés.
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
                      Rien dans cette colonne. Déposez une carte ici, ou utilisez les boutons de
                      déplacement d'une carte.
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
                            Raison donnée, {card.lostReason.toLowerCase()}
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
                                ? `Ramener ${card.contactName} à ${previous.label}`
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
                                ? `Faire passer ${card.contactName} à ${next.label}`
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
        sont en haut.{" "}
        {canWrite
          ? "Chaque déplacement est enregistré dans la base de données, avec la date et votre nom, et Annuler ramène la carte en écrivant ce retour à son tour. Aucun message ne part vers le client."
          : "Chaque déplacement reste en mode démonstration. Il vit sur cet écran le temps de la visite, un rafraîchissement remet les six colonnes en place, et aucun message ne part vers le client."}
      </p>
    </div>
  );
}
