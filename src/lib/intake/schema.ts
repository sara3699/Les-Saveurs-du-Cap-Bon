import { z } from "zod";

/**
 * What a website is allowed to send. Anything else is refused with a sentence the
 * person wiring up the form can act on, rather than a silent failure.
 *
 * A submission carrying items is an order. One without is a question, and becomes a
 * conversation the shop can answer. Both keep Site web as their source forever.
 */
export const websiteItem = z.object({
  name: z.string().trim().min(1).max(200),
  sku: z.string().trim().max(60).optional(),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
  unit_price: z.coerce.number().min(0).max(1_000_000).default(0),
});

export const websiteIntake = z
  .object({
    name: z.string().trim().min(1, "Le nom du client est obligatoire.").max(200),
    phone: z.string().trim().max(40).optional(),
    email: z.string().trim().email("L'adresse e-mail n'est pas valide.").max(200).optional(),
    city: z.string().trim().max(120).optional(),
    language: z.string().trim().max(40).optional(),
    subject: z.string().trim().max(200).optional(),
    message: z.string().trim().max(4000).optional(),
    /** The site's own id for this submission. Sending it twice changes nothing. */
    reference: z.string().trim().max(200).optional(),
    /** The page the customer was on, kept so the shop can see what sells. */
    page: z.string().trim().max(500).optional(),
    campaign: z.string().trim().max(200).optional(),
    delivery_fee: z.coerce.number().min(0).max(10_000).optional(),
    items: z.array(websiteItem).max(50).optional(),
  })
  .refine((v) => Boolean(v.phone || v.email), {
    message: "Il faut un numéro de téléphone ou une adresse e-mail.",
    path: ["phone"],
  });

export type WebsiteIntake = z.infer<typeof websiteIntake>;
