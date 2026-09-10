import Link from "next/link";

export interface DuplicateMatch {
  id: string;
  /** "phone number" or "email address", in the owner's words. */
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
        This person looks like they are in your list twice
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5 text-[13px]">
        {matches.map((match) => (
          <li key={match.id}>
            <span>Another record shares the {match.field} </span>
            <span className="os-num font-semibold">{match.value}</span>
            <span>: </span>
            {match.others.map((other, position) => (
              <span key={other.id}>
                {position > 0 ? <span> and </span> : null}
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
        Merging two records into one arrives with the database, so there is no merge button yet.
        Until then, work from the record that carries the orders and leave the other one alone.
      </p>
    </section>
  );
}
