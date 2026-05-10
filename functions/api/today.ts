import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  PUZZLES: KVNamespace;
}

const LAUNCH_DATE = '2026-05-08'; // Pacific date, set once, never changed — must match src/game/daily.ts

function todayPuzzleNumber(): number {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const todayPT = fmt.format(new Date());
  const days = Math.round(
    (new Date(todayPT).getTime() - new Date(LAUNCH_DATE).getTime()) / 86400000,
  );
  return days + 1;
}

export const onRequestGet: PagesFunction<Env> = async () => {
  return Response.json({ n: todayPuzzleNumber() });
};
