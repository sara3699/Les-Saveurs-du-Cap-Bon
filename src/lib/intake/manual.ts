import { z } from "zod";

/**
 * An order typed in by the shop. The customer is either one already on file, chosen
 * from the list, or a new one described here. Everything else mirrors what the
 * website connector accepts, so both paths produce the same shape of order.
 */
export const manualOrderItem = z.object({
  product_id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Chaque ligne a besoin d'un nom.").max(200),
  quantity: z.coerce.number().int().min(1).max(999),
  unit_price: z.coerce.number().min(0).max(1_000_000),
});

export const manualOrder = z
  .object({
    contact_id: z.string().uuid().optional(),
    name: z.string().trim().max(200).optional(),
    phone: z.string().trim().max(40).optional(),
    email: z.string().trim().email("L'adresse e-mail n'est pas valide.").max(200).optional(),
    city: z.string().trim().max(120).optional(),
    items: z.array(manualOrderItem).min(1, "Ajoutez au moins un article.").max(50),
    delivery_fee: z.coerce.number().min(0).max(10_000).default(0),
    payment_status: z
      .enum(["paid", "cash_on_delivery", "pending", "refused", "refunded"])
      .default("pending"),
    delivery_status: z
      .enum(["preparing", "dispatched", "delivered", "returned", "cancelled"])
      .default("preparing"),
    assignee_member_id: z.string().uuid().optional(),
    note: z.string().trim().max(2000).optional(),
  })
  .refine((v) => Boolean(v.contact_id || v.name), {
    message: "Choisissez un client ou donnez un nom.",
    path: ["name"],
  });

export type ManualOrder = z.infer<typeof manualOrder>;

/** The same arithmetic the database does, so the form can show the total as it is typed. */
export function orderTotal(items: { quantity: number; unit_price: number }[], deliveryFee: number) {
  const goods = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  return { goods, deliveryFee, total: goods + deliveryFee };
}
