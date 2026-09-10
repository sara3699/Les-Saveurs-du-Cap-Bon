import Link from "next/link";

export interface DuplicateMatch {
  id: string;
  /** "numéro de téléphone" or "adresse e-mail", in the owner's words. */
  field: string;
  value: string;
  others: { id: string; name: string }[];
}

/**
 * A spreadsheet import left a second record behind. Saying so at the top of the
 * page is the only honest thing to do: the orders sit on one record and the
 * phone number sits on both, and merging them properly needs a database, so
 * there is no merge button here.
 */
export function DuplicateBanner({ matches }: { matches: DuplicateMatch[] }) {
  if (matches.length === 0) return null;

  return (
    <section className="rounded-[var(--radius-card)] border border-accent-line bg-accent-soft p-4 text-accent-ink sm:p-5">
      <h2 className="text-[15px] leading-tight text-accent-ink">
        Cette personne semble figurer deux fois dans votre liste
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5 text-[13px]">
        {matches.map((match) => (
          <li key={match.id}>
            <span>Même {match.field}, </span>
            <span className="os-num font-semibold">{match.value}</span>
            <span>, sur une autre fiche : </span>
            {match.others.map((other, position) => (
              <span key={other.id}>
                {position > 0 ? <span> et </span> : null}
                <Link
                  href={`/contacts/${other.id}`}
                  className="font-semibold underline underline-offset-2"
                >
                  {other.name}
                </Link>
              </span>
            ))}
            <span>.</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-accent-line pt-3 text-[12px]">
        La fusion de deux fiches en une seule arrivera avec la base de données, il n'y a donc pas
        encore de bouton de fusion. En attendant, travaillez depuis la fiche qui porte les
        commandes et laissez l'autre de côté.
      </p>
    </section>
  );
}
