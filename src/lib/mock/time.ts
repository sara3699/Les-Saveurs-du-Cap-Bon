/**
 * Demo timestamps hang off the moment the server starts, so the inbox always
 * looks like it was used this morning. Every value is produced here and every
 * relative label is rendered on the server, which keeps client components free
 * of clock arithmetic and free of hydration mismatches.
 */
export const DEMO_NOW = new Date();

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function minutesAgo(n: number): string {
  return new Date(DEMO_NOW.getTime() - n * MINUTE).toISOString();
}

export function hoursAgo(n: number): string {
  return new Date(DEMO_NOW.getTime() - n * HOUR).toISOString();
}

export function daysAgo(n: number): string {
  return new Date(DEMO_NOW.getTime() - n * DAY).toISOString();
}

export function hoursAhead(n: number): string {
  return new Date(DEMO_NOW.getTime() + n * HOUR).toISOString();
}

export function daysAhead(n: number): string {
  return new Date(DEMO_NOW.getTime() + n * DAY).toISOString();
}

export function startOfToday(): Date {
  const d = new Date(DEMO_NOW);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
