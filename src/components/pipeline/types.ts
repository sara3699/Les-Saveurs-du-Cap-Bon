import type { ChannelId, PipelineStage } from "@/lib/domain/types";

/**
 * The six columns, in the order a lead travels through them. The board, the list
 * and the move buttons all read this one array, so a column cannot appear in two
 * different orders on two views of the same leads. The stage itself stays the
 * domain type, so the board cannot invent a seventh.
 */
export type StageId = PipelineStage;

export interface StageDefinition {
  id: StageId;
  label: string;
  /** One line under the column heading, in the words the owner would use. */
  hint: string;
}

export const STAGES: StageDefinition[] = [
  { id: "new", label: "New", hint: "Arrived, nobody has replied yet" },
  { id: "contacted", label: "Contacted", hint: "You replied, waiting on them" },
  { id: "qualified", label: "Qualified", hint: "They want it and can pay" },
  { id: "proposal", label: "Proposal", hint: "A price is with them" },
  { id: "won", label: "Won", hint: "Closed as a sale" },
  { id: "lost", label: "Lost", hint: "Closed, the reason is kept" },
];

export function stageLabel(id: StageId): string {
  return STAGES.find((stage) => stage.id === id)?.label ?? id;
}

export function stageIndex(id: StageId): number {
  return STAGES.findIndex((stage) => stage.id === id);
}

export interface NextStep {
  title: string;
  /** Already worded against the demo clock on the server, so no clock runs here. */
  dueLabel: string;
  overdue: boolean;
}

/**
 * A lead as the board and the list need it. Every label a card shows is built on
 * the server, so the client component does no date arithmetic at all; the only
 * figure it works out is the column total, which changes when a card moves.
 */
export interface PipelineCard {
  id: string;
  stage: StageId;
  contactName: string;
  contactHref: string;
  /** Resolved from the lead's attribution, never written by hand. */
  channelId: ChannelId;
  account: string | null;
  value: number;
  valueLabel: string;
  ageLabel: string;
  openedLabel: string;
  owner: string | null;
  nextStep: NextStep | null;
  lostReason: string | null;
}
