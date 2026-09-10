"use client";

import { useActionState } from "react";
import { signIn } from "@/app/connexion/actions";

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <form action={action} className="os-card flex flex-col gap-3 p-4">
      <div>
        <h2 className="text-[15px] leading-tight">Se connecter</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          Avec un compte, ce que vous faites est enregistré : une conversation attribuée, une
          étape déplacée, un appel noté.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="os-label">Adresse e-mail</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-2 text-[13px]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="os-label">Mot de passe</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-2 text-[13px]"
        />
      </label>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] border border-danger/20 bg-danger-soft px-3 py-2 text-[12.5px] text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi disabled:bg-line-strong disabled:text-muted"
      >
        {pending ? "Connexion en cours" : "Se connecter"}
      </button>
    </form>
  );
}
