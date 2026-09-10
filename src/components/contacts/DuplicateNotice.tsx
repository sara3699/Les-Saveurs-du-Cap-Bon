import Link from "next/link";

export interface DuplicateMember {
  id: string;
  name: string;
  href: string;
}

export interface DuplicatePair {
  id: string;
  /** "phone number" or "email address", in the owner's words. */
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
          "One pair of records may be the same person"
        ) : (
          <>
            <span className="os-num">{pairs.length}</span> pairs of records may each be the same
            person
          </>
        )}
      </h2>
      <p className="mt-1 text-[13px]">
        A spreadsheet import left a second record behind.{" "}
        {allShown
          ? "Every record named here is in the list below, and each one is marked."
          : "Your filters are hiding at least one of these records from the list below."}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {pairs.map((pair) => (
          <li key={pair.id} className="text-[13px]">
            {pair.members.map((member, position) => (
              <span key={member.id}>
                {position > 0 ? <span> and </span> : null}
                <Link href={member.href} className="font-semibold underline underline-offset-2">
                  {member.name}
                </Link>
              </span>
            ))}
            <span> share the {pair.field} </span>
            <span className="os-num">{pair.value}</span>
            <span>.</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-accent-line pt-3 text-[12px]">
        Merging two records into one arrives with the database, so there is no merge button here
        yet. Until then, keep working from the record that carries the orders.
      </p>
    </section>
  );
}
