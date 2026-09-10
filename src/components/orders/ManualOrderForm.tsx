"use client";

import Link from "next/link";
import { useActionState, useId, useMemo, useState } from "react";
import { createManualOrder } from "@/app/(app)/orders/actions";
import type { ManualOrderResult } from "@/app/(app)/orders/actions";
import { formatTND } from "@/lib/format";
import { orderTotal } from "@/lib/intake/manual";

export interface ManualOrderContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
}

export interface ManualOrderProduct {
  id: string;
  name: string;
  price: number;
}

export interface ManualOrderMember {
  id: string;
  name: string;
}

const FIELD =
  "w-full min-w-0 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-2 text-[13px]";

const PAYMENTS = [
  { value: "paid", label: "Payée" },
  { value: "cash_on_delivery", label: "À la livraison" },
  { value: "pending", label: "En attente de paiement" },
  { value: "refused", label: "Refusée" },
  { value: "refunded", label: "Remboursée" },
];

const DELIVERIES = [
  { value: "preparing", label: "En préparation" },
  { value: "dispatched", label: "En route" },
  { value: "delivered", label: "Livrée" },
  { value: "returned", label: "Retournée" },
  { value: "cancelled", label: "Annulée" },
];

/**
 * The names the server sends back on a refusal are the database's own, so they
 * are translated here into the words printed above each control. A name with no
 * translation is shown as it arrived rather than swallowed.
 */
const CHAMP_LABEL: Record<string, string> = {
  contact_id: "Le client choisi",
  name: "Nom du client",
  phone: "Téléphone",
  email: "Adresse e-mail",
  city: "Ville",
  items: "Les articles",
  delivery_fee: "Frais de livraison, TND",
  payment_status: "Paiement",
  delivery_status: "Livraison",
  assignee_member_id: "Responsable",
  note: "Note",
};

const ITEM_FIELD_LABEL: Record<string, string> = {
  name: "le nom",
  quantity: "la quantité",
  unit_price: "le prix unitaire",
  product_id: "le produit",
};

function champLabel(champ: string): string {
  const parts = champ.split(".");
  if (parts[0] === "items" && parts.length > 1) {
    const index = Number(parts[1]);
    if (Number.isInteger(index)) {
      const detail = parts[2] ? ` ${ITEM_FIELD_LABEL[parts[2]] ?? parts[2]}` : "";
      return `Article ${index + 1}${detail}`;
    }
  }
  return CHAMP_LABEL[champ] ?? champ;
}

interface ArticleRow {
  key: number;
  productId: string;
  name: string;
  quantity: string;
  unitPrice: string;
}

let rowSeq = 0;

function emptyRow(): ArticleRow {
  rowSeq += 1;
  return { key: rowSeq, productId: "", name: "", quantity: "1", unitPrice: "" };
}

/** An empty box is a zero here, never a NaN that would poison the running total. */
function toNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * The label wraps its control, so nothing has to carry a matching id, and the
 * hint sits outside that wrapper on purpose: inside it, the hint would be read
 * out as part of the control's name and the label would no longer be the words
 * printed above the box.
 */
function Field({
  label,
  hint,
  hintId,
  children,
}: {
  label: string;
  hint?: string;
  hintId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label className="flex min-w-0 flex-col gap-1">
        <span className="os-label">{label}</span>
        {children}
      </label>
      {hint ? (
        <span id={hintId} className="text-[11px] leading-relaxed text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/**
 * The screen for an order taken on the telephone or at the counter.
 *
 * The customer is one thing or the other, never both at once: either a name
 * already on file, found by typing, or a new person described here. The whole
 * order travels to the server as one JSON field, so the shape the database
 * validates is the shape this form builds, and the total on screen is computed
 * by the same function the database uses.
 */
export function ManualOrderForm({
  contacts,
  products,
  team,
  canWrite,
}: {
  contacts: ManualOrderContact[];
  products: ManualOrderProduct[];
  team: ManualOrderMember[];
  canWrite: boolean;
}) {
  const uid = useId();
  const [state, formAction, pending] = useActionState<ManualOrderResult | null, FormData>(
    createManualOrder,
    null,
  );

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [search, setSearch] = useState("");
  const [contactId, setContactId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [rows, setRows] = useState<ArticleRow[]>(() => [emptyRow()]);
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [deliveryStatus, setDeliveryStatus] = useState("preparing");
  const [assignee, setAssignee] = useState("");
  const [note, setNote] = useState("");
  // The reference already acknowledged, so "en saisir une autre" can put the
  // form back without the success panel reappearing under it.
  const [acknowledged, setAcknowledged] = useState<string | null>(null);

  const chosen = contacts.find((c) => c.id === contactId) ?? null;

  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return [];
    return contacts
      .filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          (c.phone ?? "").toLowerCase().includes(needle),
      )
      .slice(0, 6);
  }, [contacts, search]);

  const totals = orderTotal(
    rows.map((r) => ({ quantity: Math.trunc(toNumber(r.quantity)), unit_price: toNumber(r.unitPrice) })),
    toNumber(deliveryFee),
  );

  const payload = useMemo(() => {
    const body: Record<string, unknown> = {
      items: rows.map((r) => ({
        ...(r.productId ? { product_id: r.productId } : {}),
        name: r.name.trim(),
        quantity: Math.trunc(toNumber(r.quantity)),
        unit_price: toNumber(r.unitPrice),
      })),
      delivery_fee: toNumber(deliveryFee),
      payment_status: paymentStatus,
      delivery_status: deliveryStatus,
    };
    if (mode === "existing" && chosen) {
      body.contact_id = chosen.id;
    } else if (mode === "new") {
      if (name.trim()) body.name = name.trim();
      if (phone.trim()) body.phone = phone.trim();
      if (email.trim()) body.email = email.trim();
      if (city.trim()) body.city = city.trim();
    }
    if (assignee) body.assignee_member_id = assignee;
    if (note.trim()) body.note = note.trim();
    return JSON.stringify(body);
  }, [
    assignee,
    chosen,
    city,
    deliveryFee,
    deliveryStatus,
    email,
    mode,
    name,
    note,
    paymentStatus,
    phone,
    rows,
  ]);

  function updateRow(key: number, patch: Partial<ArticleRow>) {
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  /** Picking from the catalogue fills the name and the price; both stay editable. */
  function chooseProduct(key: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      updateRow(key, { productId: "" });
      return;
    }
    updateRow(key, { productId, name: product.name, unitPrice: String(product.price) });
  }

  function addRow() {
    setRows((current) => [...current, emptyRow()]);
  }

  function removeRow(key: number) {
    setRows((current) => (current.length <= 1 ? current : current.filter((r) => r.key !== key)));
  }

  function startAnother(reference: string) {
    setAcknowledged(reference);
    setMode("existing");
    setSearch("");
    setContactId("");
    setName("");
    setPhone("");
    setEmail("");
    setCity("");
    setRows([emptyRow()]);
    setDeliveryFee("0");
    setPaymentStatus("pending");
    setDeliveryStatus("preparing");
    setAssignee("");
    setNote("");
  }

  const savedReference =
    state?.ok && state.reference && state.reference !== acknowledged ? state.reference : null;

  if (savedReference) {
    return (
      <section className="os-card p-4 sm:p-5">
        <p className="os-label">Commande enregistrée</p>
        <p className="os-num mt-1.5 font-display text-[26px] font-bold leading-none tracking-tight">
          {savedReference}
        </p>
        <p className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-muted">
          Elle figure maintenant dans la liste des commandes. Rien n&apos;a été envoyé au client,
          cet espace ne contacte personne.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/orders/${encodeURIComponent(savedReference)}`}
            className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
          >
            Ouvrir la commande
          </Link>
          <button
            type="button"
            onClick={() => startAnother(savedReference)}
            className="rounded-[var(--radius-md)] border border-line-strong bg-surface px-4 py-2 text-sm font-semibold"
          >
            En saisir une autre
          </button>
        </div>
      </section>
    );
  }

  const customerNamed = mode === "existing" ? Boolean(chosen) : name.trim() !== "";
  const articleNamed = rows.some((r) => r.name.trim() !== "");
  const missing = [
    customerNamed ? null : "un client",
    articleNamed ? null : "le nom d'au moins un article",
  ].filter(Boolean) as string[];

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="payload" value={payload} readOnly />

      <section className="os-card p-4 sm:p-5">
        <h2 className="text-[15px] leading-tight">Le client</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">
          Quelqu&apos;un qui a déjà commandé, ou une personne nouvelle que vous notez ici.
        </p>

        <fieldset className="mt-3 border-0 p-0">
          <legend className="os-label">Ce client est</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {[
              { value: "existing" as const, label: "Déjà enregistré" },
              { value: "new" as const, label: "Nouveau" },
            ].map((choice) => (
              <label
                key={choice.value}
                className={`flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-[13px] font-semibold ${
                  mode === choice.value
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-line bg-surface-2 text-muted"
                }`}
              >
                <input
                  type="radio"
                  name="type_de_client"
                  value={choice.value}
                  checked={mode === choice.value}
                  onChange={() => setMode(choice.value)}
                />
                {choice.label}
              </label>
            ))}
          </div>
        </fieldset>

        {mode === "existing" ? (
          <div className="mt-3 flex flex-col gap-2">
            {chosen ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-primary bg-primary-soft px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-primary">{chosen.name}</p>
                  <p className="os-num mt-0.5 text-[11.5px] text-muted">
                    {[chosen.phone, chosen.city].filter(Boolean).join(", ") ||
                      "Aucun numéro enregistré"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setContactId("");
                    setSearch("");
                  }}
                  className="rounded-[var(--radius-sm)] border border-line-strong bg-surface px-2.5 py-1 text-[12px] font-semibold"
                >
                  Changer de client
                </button>
              </div>
            ) : (
              <>
                <Field
                  label="Chercher un client"
                  hint="Tapez les premières lettres du nom, ou les premiers chiffres du numéro."
                  hintId={`${uid}-recherche-aide`}
                >
                  <input
                    type="search"
                    autoComplete="off"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Un nom ou un numéro de téléphone"
                    aria-describedby={`${uid}-recherche-aide`}
                    className={FIELD}
                  />
                </Field>

                {search.trim() === "" ? null : matches.length === 0 ? (
                  <p className="text-[12px] text-muted">
                    Personne ne correspond. Passez à un nouveau client pour le noter maintenant.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {matches.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setContactId(c.id);
                            setSearch("");
                          }}
                          className="flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-2 text-left hover:border-line-strong"
                        >
                          <span className="text-[13px] font-semibold">{c.name}</span>
                          <span className="os-num text-[11.5px] text-muted">
                            {[c.phone, c.city].filter(Boolean).join(", ")}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Nom du client">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className={FIELD}
              />
            </Field>
            <Field label="Téléphone">
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                className={`${FIELD} os-num`}
              />
            </Field>
            <Field label="Adresse e-mail" hint="Facultative. Laissez vide si le client n'en donne pas.">
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className={FIELD}
              />
            </Field>
            <Field label="Ville">
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                autoComplete="address-level2"
                className={FIELD}
              />
            </Field>
          </div>
        )}
      </section>

      <section className="os-card p-4 sm:p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] leading-tight">Les articles</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Un produit du catalogue, ou un nom tapé à la main pour ce qui n&apos;y est pas. Le
              prix reste modifiable, une remise se saisit ici.
            </p>
          </div>
          <p className="os-num text-[13px] font-semibold">{formatTND(totals.goods)}</p>
        </header>

        <ul className="mt-3 flex flex-col gap-2.5">
          {rows.map((row, index) => (
            <li
              key={row.key}
              className="rounded-[var(--radius-md)] border border-line bg-surface-2 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="os-label">Article {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length <= 1}
                  aria-label={`Retirer l'article ${index + 1}`}
                  className="rounded-[var(--radius-sm)] border border-line-strong bg-surface px-2.5 py-1 text-[11.5px] font-semibold disabled:border-line disabled:text-faint"
                >
                  Retirer
                </button>
              </div>

              <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                <Field label="Produit du catalogue">
                  <select
                    value={row.productId}
                    onChange={(event) => chooseProduct(row.key, event.target.value)}
                    className={FIELD}
                  >
                    <option value="">Hors catalogue, nom tapé à la main</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Nom de l'article">
                  <input
                    value={row.name}
                    onChange={(event) => updateRow(row.key, { name: event.target.value })}
                    className={FIELD}
                  />
                </Field>
                <Field label="Quantité">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={row.quantity}
                    onChange={(event) => updateRow(row.key, { quantity: event.target.value })}
                    className={`${FIELD} os-num`}
                  />
                </Field>
                <Field label="Prix unitaire, TND">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.001"
                    value={row.unitPrice}
                    onChange={(event) => updateRow(row.key, { unitPrice: event.target.value })}
                    className={`${FIELD} os-num`}
                  />
                </Field>
              </div>

              <p className="mt-2 text-[11.5px] text-muted">
                Sous-total{" "}
                <span className="os-num font-semibold">
                  {formatTND(Math.trunc(toNumber(row.quantity)) * toNumber(row.unitPrice))}
                </span>
              </p>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={addRow}
          className="mt-3 rounded-[var(--radius-md)] border border-line-strong bg-surface-2 px-3.5 py-2 text-[13px] font-semibold hover:border-primary"
        >
          Ajouter un article
        </button>
      </section>

      <section className="os-card p-4 sm:p-5">
        <h2 className="text-[15px] leading-tight">La livraison et le suivi</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">
          Où en est la commande au moment où vous la notez. Tout cela se change plus tard.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Frais de livraison, TND">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.001"
              value={deliveryFee}
              onChange={(event) => setDeliveryFee(event.target.value)}
              className={`${FIELD} os-num`}
            />
          </Field>
          <Field label="Responsable">
            <select
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              className={FIELD}
            >
              <option value="">Personne pour l&apos;instant</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Paiement">
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              className={FIELD}
            >
              {PAYMENTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Livraison">
            <select
              value={deliveryStatus}
              onChange={(event) => setDeliveryStatus(event.target.value)}
              className={FIELD}
            >
              {DELIVERIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-3">
          <Field
            label="Note"
            hint="Facultative. Une heure de retrait, un emballage cadeau, une allergie."
          >
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={FIELD}
            />
          </Field>
        </div>
      </section>

      <section className="os-card p-4 sm:p-5">
        <div
          aria-live="polite"
          className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-3"
        >
          <dl className="flex flex-col gap-1.5 text-[13px]">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="os-label">Articles</dt>
              <dd className="os-num font-semibold">{formatTND(totals.goods)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="os-label">Livraison</dt>
              <dd className="os-num font-semibold">{formatTND(totals.deliveryFee)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-1.5">
              <dt className="os-label">Total à payer</dt>
              <dd className="os-num font-display text-[20px] font-bold leading-none tracking-tight">
                {formatTND(totals.total)}
              </dd>
            </div>
          </dl>
        </div>

        {state && !state.ok ? (
          <div
            role="alert"
            className="mt-3 rounded-[var(--radius-sm)] border border-danger/20 bg-danger-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-danger"
          >
            <p className="font-semibold">{state.error}</p>
            {state.fields && state.fields.length > 0 ? (
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {state.fields.map((field) => (
                  <li key={`${field.champ}-${field.probleme}`}>
                    <span className="font-semibold">{champLabel(field.champ)}</span>,{" "}
                    {field.probleme}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex flex-col gap-2">
          <button
            type="submit"
            disabled={pending || !canWrite}
            className="rounded-[var(--radius-md)] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hi disabled:bg-line-strong disabled:text-muted"
          >
            {pending ? "Enregistrement en cours" : "Enregistrer la commande"}
          </button>

          {canWrite ? (
            missing.length > 0 ? (
              <p className="text-[12px] leading-relaxed text-muted">
                Il manque encore {missing.join(" et ")}.
              </p>
            ) : (
              <p className="text-[12px] leading-relaxed text-muted">
                L&apos;enregistrement écrit la commande dans la base de données. Rien n&apos;est
                envoyé au client, cet espace ne contacte personne.
              </p>
            )
          ) : (
            <p className="rounded-[var(--radius-sm)] border border-accent-line bg-accent-soft px-3 py-2 text-[12.5px] leading-relaxed text-accent-ink">
              Cette visite peut tout consulter et rien enregistrer, et enregistrer une commande
              demande un vrai compte.
            </p>
          )}
        </div>
      </section>
    </form>
  );
}
