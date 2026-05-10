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

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const raw = ctx.params['n'];
  const n = parseInt(Array.isArray(raw) ? raw[0] : raw, 10);

  if (!Number.isInteger(n) || n < 1) {
    return Response.json({ error: 'invalid' }, { status: 400 });
  }
  if (n > todayPuzzleNumber()) {
    return Response.json({ error: 'future' }, { status: 403 });
  }

  const word = await ctx.env.PUZZLES.get(`puzzle:${n}`);
  if (!word) {
    return Response.json({ error: 'unseeded' }, { status: 404 });
  }

  return Response.json({ n, word });
};
