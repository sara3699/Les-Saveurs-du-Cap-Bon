import Link from "next/link";

export interface DuplicateMember {
  id: string;
  name: string;
  href: string;
}

export interface DuplicatePair {
  id: string;
  /** The shared field, named with its article so a sentence can hold it. */
  field: string;
  value: string;
  members: DuplicateMember[];
}

/**
 * Two records holding one phone number is a data problem the owner can act on,
 * so it is named on the screen rather than left for her to notice. There is no
 * merge button because merging cannot be done honestly without a database.
 *
 * allShown says whether every record named here survived the filters. Telling
 * her to look for a marked row that a filter has hidden would be a small lie.
 */
export function DuplicateNotice({
  pairs,
  allShown,
}: {
  pairs: DuplicatePair[];
  allShown: boolean;
}) {
  if (pairs.length === 0) return null;

  return (
    <section className="rounded-[var(--radius-card)] border border-accent-line bg-accent-soft p-4 text-accent-ink sm:p-5">
      <h2 className="text-[15px] leading-tight text-accent-ink">
        {pairs.length === 1 ? (
          "Une paire de fiches pourrait être la même personne"
        ) : (
          <>
            <span className="os-num">{pairs.length}</span> paires de fiches pourraient chacune être
            la même personne
          </>
        )}
      </h2>
      <p className="mt-1 text-[13px]">
        Un import de tableur a laissé une deuxième fiche derrière lui.{" "}
        {allShown
          ? "Chaque fiche nommée ici est dans la liste ci-dessous, et chacune y est signalée."
          : "Vos filtres retirent au moins une de ces fiches de la liste ci-dessous."}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {pairs.map((pair) => (
          <li key={pair.id} className="text-[13px]">
            {pair.members.map((member, position) => (
              <span key={member.id}>
                {position > 0 ? <span> et </span> : null}
                <Link href={member.href} className="font-semibold underline underline-offset-2">
                  {member.name}
                </Link>
              </span>
            ))}
            <span> partagent {pair.field}, </span>
            <span className="os-num">{pair.value}</span>
            <span>.</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-accent-line pt-3 text-[12px]">
        La fusion de deux fiches en une seule arrive avec la base de données, donc il n'y a pas
        encore de bouton de fusion ici. En attendant, continuez à travailler depuis la fiche qui
        porte les commandes.
      </p>
    </section>
  );
}
