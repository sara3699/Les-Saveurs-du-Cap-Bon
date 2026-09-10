"use client";

import { useState } from "react";
import { ChannelDot } from "@/components/ui/badges";
import { CHANNEL_ORDER, channel } from "@/lib/domain/channels";
import type { ChannelId } from "@/lib/domain/types";

type Field = "name" | "phone" | "email" | "city" | "source" | "skip";
type MappedField = Exclude<Field, "skip">;
type Step = "file" | "map" | "preview" | "check" | "confirm" | "done";

const FIELDS: { value: Field; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "city", label: "City" },
  { value: "source", label: "Where they came from" },
  { value: "skip", label: "Leave this column out" },
];

const STEPS: { id: Step; label: string }[] = [
  { id: "file", label: "File" },
  { id: "map", label: "Columns" },
  { id: "preview", label: "Preview" },
  { id: "check", label: "Checks" },
  { id: "confirm", label: "Confirm" },
];

const FILE_NAME = "contacts-september.csv";
const COLUMNS = ["Full name", "Mobile", "Email address", "Town", "Came from", "Notes"];
const DEFAULT_MAPPING: Field[] = ["name", "phone", "email", "city", "source", "skip"];

/** How many rows the preview step shows before the checks run over all of them. */
const PREVIEW_ROWS = 5;

/**
 * Eight sample rows, fixed rather than generated, so the walkthrough shows the
 * same four problems every time it is opened: a row with no name, a number that
 * is not Tunisian, and two rows that already exist under another spelling.
 */
const ROWS: string[][] = [
  ["Fatma Riahi", "+216 55 210 447", "fatma.riahi@gmail.com", "Tunis", "Instagram", "Met her at the Sidi Bou market"],
  ["Nizar Hamdi", "+216 27 663 190", "nizar.hamdi@gmail.com", "Sousse", "Facebook", "Asked about the pistachio cream"],
  ["", "+216 98 445 213", "", "Nabeul", "WhatsApp", "Left a voice note, name not written down"],
  ["Sami Gharsalli", "06 78 12 34 56", "sami.gharsalli@gmail.com", "Tunis", "Website", "Number copied from an old sheet"],
  ["Rania Trabelsi", "+216 20 114 882", "", "Ariana", "WhatsApp", "Repeat buyer"],
  ["Karim Belaid", "+216 24 900 990", "karim.belaid@gmail.com", "Tunis", "Website", "Second sheet, dessert platter"],
  ["Hedi Sliti", "+216 92 118 440", "hedi.sliti@topnet.tn", "Bizerte", "Website", "Wants twelve dessert assortments"],
  ["Awatef Mzoughi", "+216 29 771 502", "awatef.mzoughi@gmail.com", "Ben Arous", "Added by hand", "Phoned the shop"],
];

const CHANNEL_WORDS: Record<string, ChannelId> = {
  website: "website",
  site: "website",
  "web form": "website",
  whatsapp: "whatsapp",
  instagram: "instagram",
  insta: "instagram",
  facebook: "facebook",
  messenger: "facebook",
  google: "google",
  "google ads": "google",
  "added by hand": "manual",
  "walk-in": "manual",
  shop: "manual",
};

const PRIMARY_BUTTON =
  "rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-hi disabled:cursor-not-allowed disabled:bg-primary-mute";
const PLAIN_BUTTON =
  "rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-1.5 text-[12px] font-medium";

function toChannel(raw: string): ChannelId | null {
  return CHANNEL_WORDS[raw.trim().toLowerCase()] ?? null;
}

function localNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("216") ? digits.slice(3) : digits;
}

/** Eight digits, and the leading digit that Tunisian numbering actually uses. */
function isTunisianNumber(raw: string): boolean {
  return /^[2345789]\d{7}$/.test(localNumber(raw));
}

function readRow(row: string[], mapping: Field[]): Record<MappedField, string> {
  const out: Record<MappedField, string> = { name: "", phone: "", email: "", city: "", source: "" };
  mapping.forEach((field, column) => {
    if (field !== "skip") out[field] = (row[column] ?? "").trim();
  });
  return out;
}

export interface ExistingContact {
  name: string;
  phone: string | null;
  email: string | null;
}

interface CheckedRow {
  line: number;
  values: Record<MappedField, string>;
  channelId: ChannelId | null;
  problems: string[];
}

function checkRows(mapping: Field[], existing: ExistingContact[]): CheckedRow[] {
  return ROWS.map((row, position) => {
    const values = readRow(row, mapping);
    const problems: string[] = [];

    if (!values.name) {
      problems.push("There is no name, so the record would have nothing to be filed under.");
    }

    if (values.phone && !isTunisianNumber(values.phone)) {
      problems.push(`${values.phone} is not a Tunisian number, so nobody could be called back on it.`);
    }

    if (values.phone) {
      const twins = existing
        .filter((contact) => contact.phone && localNumber(contact.phone) === localNumber(values.phone))
        .map((contact) => contact.name);
      if (twins.length > 0) {
        problems.push(`This phone number is already on ${twins.join(" and ")}.`);
      }
    }

    if (values.email) {
      const twins = existing
        .filter((contact) => contact.email && contact.email.toLowerCase() === values.email.toLowerCase())
        .map((contact) => contact.name);
      if (twins.length > 0) {
        problems.push(`This email address is already on ${twins.join(" and ")}.`);
      }
    }

    const channelId = values.source ? toChannel(values.source) : null;
    if (!values.source) {
      problems.push("The source column is empty on this row, so there would be nothing to say where this customer came from.");
    } else if (!channelId) {
      problems.push(
        `${values.source} does not name one of your ${CHANNEL_ORDER.length} sources.`,
      );
    }

    return { line: position + 1, values, channelId, problems };
  });
}

export function ImportWalkthrough({ existing }: { existing: ExistingContact[] }) {
  const [step, setStep] = useState<Step>("file");
  const [mapping, setMapping] = useState<Field[]>(DEFAULT_MAPPING);
  const [notice, setNotice] = useState<string | null>(null);

  const nameMapped = mapping.includes("name");
  const sourceMapped = mapping.includes("source");
  const checked = checkRows(mapping, existing);
  const preview = checked.slice(0, PREVIEW_ROWS);
  const clean = checked.filter((row) => row.problems.length === 0);
  const blocked = checked.filter((row) => row.problems.length > 0);
  const stepIndex = step === "done" ? STEPS.length : STEPS.findIndex((s) => s.id === step);

  const tally = new Map<ChannelId, number>();
  for (const row of clean) {
    if (row.channelId) tally.set(row.channelId, (tally.get(row.channelId) ?? 0) + 1);
  }

  const setField = (column: number, field: Field) => {
    setMapping((current) =>
      current.map((held, position) => {
        if (position === column) return field;
        if (field !== "skip" && held === field) return "skip";
        return held;
      }),
    );
  };

  const restart = () => {
    setMapping(DEFAULT_MAPPING);
    setNotice(null);
    setStep("file");
  };

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-wrap gap-1.5">
        {STEPS.map((entry, position) => {
          const done = position < stepIndex;
          const current = position === stepIndex;
          return (
            <li
              key={entry.id}
              aria-current={current ? "step" : undefined}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                current
                  ? "border-primary bg-primary text-white"
                  : done
                    ? "border-line bg-primary-soft text-primary"
                    : "border-line bg-surface-2 text-muted"
              }`}
            >
              <span className="os-num">{position + 1}</span>
              {entry.label}
            </li>
          );
        })}
      </ol>

      {/* Mounted whether or not there is anything to say, so a reader on a screen
          reader hears the cancellation instead of the region appearing after it. */}
      <p
        role="status"
        className={
          notice
            ? "rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12px] text-muted"
            : "sr-only"
        }
      >
        {notice}
      </p>

      {step === "file" ? (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-muted">
            Reading a file from your computer arrives with the database. This is a walkthrough on{" "}
            <span className="os-num">{ROWS.length}</span> sample rows, so you can see every step and
            every check before then.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-dashed border-line-strong bg-surface-2 px-3 py-2.5">
            <span>
              <span className="os-num block text-[13px] font-semibold">{FILE_NAME}</span>
              <span className="block text-[12px] text-muted">
                <span className="os-num">{ROWS.length}</span> rows,{" "}
                <span className="os-num">{COLUMNS.length}</span> columns, held inside this screen
              </span>
            </span>
            <button type="button" className={PRIMARY_BUTTON} onClick={() => { setNotice(null); setStep("map"); }}>
              Open the sample file
            </button>
          </div>
        </div>
      ) : null}

      {step === "map" ? (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-muted">
            Say what each column in the file holds. A column can only be used once, so choosing a
            field takes it off the column that had it.
          </p>
          <ul className="flex flex-col gap-2">
            {COLUMNS.map((column, position) => (
              <li
                key={column}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">{column}</span>
                  <span className="block text-[12px] text-muted">
                    First row: {ROWS[0][position] || "empty"}
                  </span>
                </span>
                <label className="flex items-center gap-2">
                  <span className="os-label">Import as</span>
                  <select
                    aria-label={`Import as, for the column ${column}`}
                    value={mapping[position]}
                    onChange={(event) => setField(position, event.target.value as Field)}
                    className="rounded-[var(--radius-sm)] border border-line bg-surface px-2.5 py-1.5 text-[12.5px]"
                  >
                    {FIELDS.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
          {!nameMapped || !sourceMapped ? (
            <p className="rounded-[var(--radius-sm)] border border-accent-line bg-accent-soft px-3 py-2 text-[12px] text-accent-ink">
              Map one column to the name and one to where they came from. A contact imported without
              a source would sit on every screen with no channel against it, and that is the one
              thing this product refuses to do.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={PRIMARY_BUTTON}
              disabled={!nameMapped || !sourceMapped}
              onClick={() => setStep("preview")}
            >
              Preview the rows
            </button>
            <button type="button" className={PLAIN_BUTTON} onClick={() => setStep("file")}>
              Back
            </button>
          </div>
        </div>
      ) : null}

      {step === "preview" ? (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-muted">
            The first <span className="os-num">{preview.length}</span> rows, read with the columns
            you chose. Nothing has been added yet.
          </p>
          <div className="os-scroll">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="os-label pb-2 pr-3 text-left font-normal">Row</th>
                  <th className="os-label pb-2 pr-3 text-left font-normal">Name</th>
                  <th className="os-label pb-2 pr-3 text-left font-normal">Phone</th>
                  <th className="os-label pb-2 pr-3 text-left font-normal">Email</th>
                  <th className="os-label pb-2 pr-3 text-left font-normal">City</th>
                  <th className="os-label pb-2 text-left font-normal">First touch</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={row.line} className="border-t border-line">
                    <td className="os-num py-2 pr-3 text-[12px] text-muted">{row.line}</td>
                    <td className="py-2 pr-3 text-[13px]">
                      {row.values.name || <span className="text-danger">Missing</span>}
                    </td>
                    <td className="os-num py-2 pr-3 text-[12.5px]">
                      {row.values.phone || <span className="text-faint">Empty</span>}
                    </td>
                    <td className="py-2 pr-3 text-[12.5px]">
                      {row.values.email || <span className="text-faint">Empty</span>}
                    </td>
                    <td className="py-2 pr-3 text-[12.5px]">
                      {row.values.city || <span className="text-faint">Empty</span>}
                    </td>
                    <td className="py-2 text-[12.5px]">
                      {row.channelId ? (
                        <span className="flex items-center gap-1.5">
                          <ChannelDot channelId={row.channelId} size={7} />
                          {channel(row.channelId).label}
                        </span>
                      ) : (
                        <span className="text-danger">{row.values.source || "Empty"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {checked.length > preview.length ? (
            <p className="text-[12px] text-muted">
              <span className="os-num">{checked.length - preview.length}</span> more rows follow the
              ones shown here, and the checks run over all of them.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={PRIMARY_BUTTON} onClick={() => setStep("check")}>
              Check the rows
            </button>
            <button type="button" className={PLAIN_BUTTON} onClick={() => setStep("map")}>
              Back
            </button>
          </div>
        </div>
      ) : null}

      {step === "check" ? (
        <div className="flex flex-col gap-3">
          <p className="rounded-[var(--radius-sm)] border border-success/20 bg-success-soft px-3 py-2 text-[12.5px] text-success">
            <span className="os-num font-semibold">{clean.length}</span> of the{" "}
            <span className="os-num font-semibold">{checked.length}</span> rows can be imported as
            they are.
          </p>
          {blocked.length === 0 ? (
            <p className="text-[13px] text-muted">Every row passed. Nothing would be skipped.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {blocked.map((row) => (
                <li
                  key={row.line}
                  className="rounded-[var(--radius-sm)] border border-danger/20 bg-danger-soft px-3 py-2 text-[12.5px] text-danger"
                >
                  <p className="font-semibold">
                    <span className="os-num">Row {row.line}</span>, {row.values.name || "no name"}
                  </p>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {row.problems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[12px] text-muted">
            A skipped row is left in the file. Fix it there and open the file again, rather than
            editing it here.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={PRIMARY_BUTTON}
              disabled={clean.length === 0}
              onClick={() => setStep("confirm")}
            >
              Continue with {clean.length} rows
            </button>
            <button type="button" className={PLAIN_BUTTON} onClick={() => setStep("preview")}>
              Back
            </button>
          </div>
        </div>
      ) : null}

      {step === "confirm" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-3">
            <p className="text-[13px]">
              <span className="os-num font-semibold">{clean.length}</span> contacts would be added.{" "}
              <span className="os-num font-semibold">{blocked.length}</span> rows would be skipped.
            </p>
            <p className="mt-2 text-[12px] text-muted">Each one would arrive with its own first touch:</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {[...tally.entries()].map(([channelId, count]) => (
                <li
                  key={channelId}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold"
                >
                  <ChannelDot channelId={channelId} size={7} />
                  {channel(channelId).label}
                  <span className="os-num text-muted">{count}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[12px] text-muted">
            Nothing is written. Once the database is behind this screen, this is the step that would
            add the rows.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={PRIMARY_BUTTON} onClick={() => setStep("done")}>
              Finish the walkthrough
            </button>
            <button
              type="button"
              className={PLAIN_BUTTON}
              onClick={() => {
                setNotice("The import was cancelled. Nothing was added and the file was left alone.");
                setStep("file");
              }}
            >
              Cancel the import
            </button>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="flex flex-col gap-3">
          <p role="status" className="rounded-[var(--radius-sm)] border border-accent-line bg-accent-soft px-3 py-2 text-[12.5px] text-accent-ink">
            Nothing was added. The walkthrough stops at the moment it would write. Once the database
            is behind it, this is the step that saves the rows, and every contact keeps the source
            that its own row named.
          </p>
          <div>
            <button type="button" className={PLAIN_BUTTON} onClick={restart}>
              Walk through it again
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
