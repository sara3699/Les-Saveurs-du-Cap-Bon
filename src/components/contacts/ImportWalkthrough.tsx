"use client";

import { useState } from "react";
import { ChannelDot } from "@/components/ui/badges";
import { CHANNEL_ORDER, channel } from "@/lib/domain/channels";
import type { ChannelId } from "@/lib/domain/types";

type Field = "name" | "phone" | "email" | "city" | "source" | "skip";
type MappedField = Exclude<Field, "skip">;
type Step = "file" | "map" | "preview" | "check" | "confirm" | "done";

const FIELDS: { value: Field; label: string }[] = [
  { value: "name", label: "Nom" },
  { value: "phone", label: "Téléphone" },
  { value: "email", label: "E-mail" },
  { value: "city", label: "Ville" },
  { value: "source", label: "D'où ils viennent" },
  { value: "skip", label: "Ne pas importer cette colonne" },
];

const STEPS: { id: Step; label: string }[] = [
  { id: "file", label: "Fichier" },
  { id: "map", label: "Colonnes" },
  { id: "preview", label: "Aperçu" },
  { id: "check", label: "Contrôles" },
  { id: "confirm", label: "Confirmation" },
];

const FILE_NAME = "contacts-september.csv";
const COLUMNS = ["Nom complet", "Mobile", "Adresse e-mail", "Ville", "Provenance", "Notes"];
const DEFAULT_MAPPING: Field[] = ["name", "phone", "email", "city", "source", "skip"];

/** How many rows the preview step shows before the checks run over all of them. */
const PREVIEW_ROWS = 5;

/**
 * Eight sample rows, fixed rather than generated, so the walkthrough shows the
 * same four problems every time it is opened: a row with no name, a number that
 * is not Tunisian, and two rows that already exist under another spelling.
 */
const ROWS: string[][] = [
  ["Fatma Riahi", "+216 55 210 447", "fatma.riahi@gmail.com", "Tunis", "Instagram", "Rencontrée au marché de Sidi Bou"],
  ["Nizar Hamdi", "+216 27 663 190", "nizar.hamdi@gmail.com", "Sousse", "Facebook", "A demandé la crème de pistache"],
  ["", "+216 98 445 213", "", "Nabeul", "WhatsApp", "A laissé un message vocal, nom non noté"],
  ["Sami Gharsalli", "06 78 12 34 56", "sami.gharsalli@gmail.com", "Tunis", "Site web", "Numéro recopié sur une ancienne feuille"],
  ["Rania Trabelsi", "+216 20 114 882", "", "Ariana", "WhatsApp", "Cliente fidèle"],
  ["Karim Belaid", "+216 24 900 990", "karim.belaid@gmail.com", "Tunis", "Site web", "Deuxième feuille, plateau de desserts"],
  ["Hedi Sliti", "+216 92 118 440", "hedi.sliti@topnet.tn", "Bizerte", "Site web", "Veut douze assortiments de desserts"],
  ["Awatef Mzoughi", "+216 29 771 502", "awatef.mzoughi@gmail.com", "Ben Arous", "Ajouté à la main", "A téléphoné à la boutique"],
];

const CHANNEL_WORDS: Record<string, ChannelId> = {
  website: "website",
  "site web": "website",
  site: "website",
  "web form": "website",
  "formulaire web": "website",
  whatsapp: "whatsapp",
  instagram: "instagram",
  insta: "instagram",
  facebook: "facebook",
  messenger: "facebook",
  google: "google",
  "google ads": "google",
  "added by hand": "manual",
  "ajouté à la main": "manual",
  "walk-in": "manual",
  "en boutique": "manual",
  shop: "manual",
  boutique: "manual",
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
      problems.push("Il n'y a pas de nom, la fiche n'aurait donc rien sous quoi être classée.");
    }

    if (values.phone && !isTunisianNumber(values.phone)) {
      problems.push(
        `${values.phone} n'est pas un numéro tunisien, donc personne ne pourrait être rappelé dessus.`,
      );
    }

    if (values.phone) {
      const twins = existing
        .filter((contact) => contact.phone && localNumber(contact.phone) === localNumber(values.phone))
        .map((contact) => contact.name);
      if (twins.length > 0) {
        problems.push(`Ce numéro de téléphone est déjà sur la fiche de ${twins.join(" et ")}.`);
      }
    }

    if (values.email) {
      const twins = existing
        .filter((contact) => contact.email && contact.email.toLowerCase() === values.email.toLowerCase())
        .map((contact) => contact.name);
      if (twins.length > 0) {
        problems.push(`Cette adresse e-mail est déjà sur la fiche de ${twins.join(" et ")}.`);
      }
    }

    const channelId = values.source ? toChannel(values.source) : null;
    if (!values.source) {
      problems.push(
        "La colonne de la source est vide sur cette ligne, rien ne dirait donc d'où vient ce client.",
      );
    } else if (!channelId) {
      problems.push(
        `${values.source} ne nomme aucune de vos ${CHANNEL_ORDER.length} sources.`,
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
            La lecture d'un fichier depuis votre ordinateur arrive avec la base de données. Ceci est
            une démonstration sur <span className="os-num">{ROWS.length}</span> lignes d'exemple,
            pour que vous voyiez chaque étape et chaque contrôle avant cela.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-dashed border-line-strong bg-surface-2 px-3 py-2.5">
            <span>
              <span className="os-num block text-[13px] font-semibold">{FILE_NAME}</span>
              <span className="block text-[12px] text-muted">
                <span className="os-num">{ROWS.length}</span> lignes,{" "}
                <span className="os-num">{COLUMNS.length}</span> colonnes, gardées à l'intérieur de
                cet écran
              </span>
            </span>
            <button type="button" className={PRIMARY_BUTTON} onClick={() => { setNotice(null); setStep("map"); }}>
              Ouvrir le fichier d'exemple
            </button>
          </div>
        </div>
      ) : null}

      {step === "map" ? (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-muted">
            Dites ce que contient chaque colonne du fichier. Une colonne ne peut servir qu'une
            fois, donc choisir un champ le retire de la colonne qui l'avait.
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
                    Première ligne : {ROWS[0][position] || "vide"}
                  </span>
                </span>
                <label className="flex items-center gap-2">
                  <span className="os-label">Importer comme</span>
                  <select
                    aria-label={`Importer comme, pour la colonne ${column}`}
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
              Associez une colonne au nom et une autre à d'où ils viennent. Un contact importé sans
              source resterait sur chaque écran sans canal en face de lui, et c'est la seule chose
              que ce produit refuse de faire.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={PRIMARY_BUTTON}
              disabled={!nameMapped || !sourceMapped}
              onClick={() => setStep("preview")}
            >
              Voir l'aperçu des lignes
            </button>
            <button type="button" className={PLAIN_BUTTON} onClick={() => setStep("file")}>
              Retour
            </button>
          </div>
        </div>
      ) : null}

      {step === "preview" ? (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-muted">
            Les <span className="os-num">{preview.length}</span> premières lignes, lues avec les
            colonnes que vous avez choisies. Rien n'a encore été ajouté.
          </p>
          <div className="os-scroll">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="os-label pb-2 pr-3 text-left font-normal">Ligne</th>
                  <th className="os-label pb-2 pr-3 text-left font-normal">Nom</th>
                  <th className="os-label pb-2 pr-3 text-left font-normal">Téléphone</th>
                  <th className="os-label pb-2 pr-3 text-left font-normal">E-mail</th>
                  <th className="os-label pb-2 pr-3 text-left font-normal">Ville</th>
                  <th className="os-label pb-2 text-left font-normal">Premier contact</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={row.line} className="border-t border-line">
                    <td className="os-num py-2 pr-3 text-[12px] text-muted">{row.line}</td>
                    <td className="py-2 pr-3 text-[13px]">
                      {row.values.name || <span className="text-danger">Manquant</span>}
                    </td>
                    <td className="os-num py-2 pr-3 text-[12.5px]">
                      {row.values.phone || <span className="text-faint">Vide</span>}
                    </td>
                    <td className="py-2 pr-3 text-[12.5px]">
                      {row.values.email || <span className="text-faint">Vide</span>}
                    </td>
                    <td className="py-2 pr-3 text-[12.5px]">
                      {row.values.city || <span className="text-faint">Vide</span>}
                    </td>
                    <td className="py-2 text-[12.5px]">
                      {row.channelId ? (
                        <span className="flex items-center gap-1.5">
                          <ChannelDot channelId={row.channelId} size={7} />
                          {channel(row.channelId).label}
                        </span>
                      ) : (
                        <span className="text-danger">{row.values.source || "Vide"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {checked.length > preview.length ? (
            <p className="text-[12px] text-muted">
              <span className="os-num">{checked.length - preview.length}</span> autres lignes
              suivent celles montrées ici, et les contrôles portent sur toutes.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={PRIMARY_BUTTON} onClick={() => setStep("check")}>
              Contrôler les lignes
            </button>
            <button type="button" className={PLAIN_BUTTON} onClick={() => setStep("map")}>
              Retour
            </button>
          </div>
        </div>
      ) : null}

      {step === "check" ? (
        <div className="flex flex-col gap-3">
          <p className="rounded-[var(--radius-sm)] border border-success/20 bg-success-soft px-3 py-2 text-[12.5px] text-success">
            <span className="os-num font-semibold">{clean.length}</span> lignes sur{" "}
            <span className="os-num font-semibold">{checked.length}</span> peuvent être importées
            telles quelles.
          </p>
          {blocked.length === 0 ? (
            <p className="text-[13px] text-muted">
              Toutes les lignes passent. Rien ne serait ignoré.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {blocked.map((row) => (
                <li
                  key={row.line}
                  className="rounded-[var(--radius-sm)] border border-danger/20 bg-danger-soft px-3 py-2 text-[12.5px] text-danger"
                >
                  <p className="font-semibold">
                    <span className="os-num">Ligne {row.line}</span>, {row.values.name || "sans nom"}
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
            Une ligne ignorée reste dans le fichier. Corrigez-la là-bas et ouvrez le fichier à
            nouveau, plutôt que de la modifier ici.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={PRIMARY_BUTTON}
              disabled={clean.length === 0}
              onClick={() => setStep("confirm")}
            >
              Continuer avec {clean.length} lignes
            </button>
            <button type="button" className={PLAIN_BUTTON} onClick={() => setStep("preview")}>
              Retour
            </button>
          </div>
        </div>
      ) : null}

      {step === "confirm" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-3">
            <p className="text-[13px]">
              <span className="os-num font-semibold">{clean.length}</span> contacts seraient
              ajoutés. <span className="os-num font-semibold">{blocked.length}</span> lignes
              seraient ignorées.
            </p>
            <p className="mt-2 text-[12px] text-muted">
              Chacun arriverait avec son propre premier contact :
            </p>
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
            Rien n'est enregistré. Une fois la base de données derrière cet écran, c'est cette étape
            qui ajouterait les lignes.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={PRIMARY_BUTTON} onClick={() => setStep("done")}>
              Terminer la démonstration
            </button>
            <button
              type="button"
              className={PLAIN_BUTTON}
              onClick={() => {
                setNotice("L'import a été annulé. Rien n'a été ajouté et le fichier n'a pas été touché.");
                setStep("file");
              }}
            >
              Annuler l'import
            </button>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="flex flex-col gap-3">
          <p role="status" className="rounded-[var(--radius-sm)] border border-accent-line bg-accent-soft px-3 py-2 text-[12.5px] text-accent-ink">
            Rien n'a été ajouté. La démonstration s'arrête au moment où elle écrirait. Une fois la
            base de données derrière elle, c'est cette étape qui enregistre les lignes, et chaque
            contact garde la source que sa propre ligne indiquait.
          </p>
          <div>
            <button type="button" className={PLAIN_BUTTON} onClick={restart}>
              Recommencer la démonstration
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
