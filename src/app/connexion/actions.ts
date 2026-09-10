"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { DEMO_COOKIE } from "@/lib/session";

/** The demonstration door. No account, and the database refuses every write. */
export async function enterAs(formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) return;
  const jar = await cookies();
  jar.set(DEMO_COOKIE, memberId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/dashboard");
}

/** A real account. What this person does is saved. */
export async function signIn(_prev: { error: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Entrez une adresse e-mail et un mot de passe." };
  }
  if (!supabaseConfigured()) {
    return { error: "La base de données n'est pas configurée sur cette installation." };
  }

  const db = await supabaseServer();
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    // The same sentence whether the address is unknown or the password is wrong,
    // so the form never confirms which addresses exist.
    return { error: "Adresse e-mail ou mot de passe incorrect." };
  }

  const jar = await cookies();
  jar.delete(DEMO_COOKIE);
  redirect("/dashboard");
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(DEMO_COOKIE);
  if (supabaseConfigured()) {
    const db = await supabaseServer();
    await db.auth.signOut();
  }
  redirect("/connexion");
}
