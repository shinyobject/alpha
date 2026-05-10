export const LAUNCH_DATE = '2026-05-08'; // Pacific date, set once, never changed

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function todayPuzzleNumber(dayOffset = 0): number {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const now = new Date(Date.now() + dayOffset * 86400000);
  const todayPT = fmt.format(now);
  return daysBetween(LAUNCH_DATE, todayPT) + 1;
}

export class FuturePuzzleError extends Error {
  constructor(n: number) {
    super(`Puzzle #${n} is in the future`);
    this.name = 'FuturePuzzleError';
  }
}

export async function getDailyWord(n: number): Promise<string> {
  const res = await fetch(`/api/word/${n}`);
  if (res.status === 403) throw new FuturePuzzleError(n);
  if (!res.ok) throw new Error(`Failed to load puzzle ${n}: ${res.status}`);
  const data = await res.json() as { word: string };
  return data.word;
}
