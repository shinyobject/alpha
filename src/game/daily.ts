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

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededIndex(n: number, length: number): number {
  const rand = mulberry32(n);
  return Math.floor(rand() * length);
}

let dailyPool: string[] | null = null;
let loadingPool: Promise<string[]> | null = null;

export function getDailyPool(): Promise<string[]> {
  if (dailyPool) return Promise.resolve(dailyPool);
  if (!loadingPool) {
    loadingPool = fetch('/words/daily.json')
      .then(r => r.json() as Promise<string[]>)
      .then(words => {
        dailyPool = words;
        return words;
      });
  }
  return loadingPool;
}

export async function getDailyWord(n: number): Promise<string> {
  const pool = await getDailyPool();
  return pool[seededIndex(n, pool.length)];
}
