/**
 * Bulk-seeds Workers KV with 5 years of puzzle words.
 *
 * Remote (writes to Cloudflare KV — requires .env):
 *   npm run seed
 *
 * Local (seeds local wrangler KV simulation for dev:pages):
 *   npm run seed:local
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localMode = process.argv.includes('--local');

function getArg(flag: string): number | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  const val = parseInt(process.argv[idx + 1], 10);
  return Number.isFinite(val) ? val : undefined;
}

// ── same shuffle used to pick puzzle words ──────────────────────────────────
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

function seededIndex(n: number, length: number): number {
  return Math.floor(mulberry32(n)() * length);
}
// ───────────────────────────────────────────────────────────────────────────

const pool: string[] = JSON.parse(
  readFileSync(resolve(__dirname, '../public/words/daily.json'), 'utf8'),
);
console.log(`Daily pool: ${pool.length} words`);

const TARGET_PUZZLES = 3650; // 10 years
const startN = getArg('--start') ?? 1;
const endN = getArg('--end') ?? TARGET_PUZZLES;

if (startN < 1 || endN > TARGET_PUZZLES || startN > endN) {
  console.error(`--start/--end must be in range 1–${TARGET_PUZZLES} with start ≤ end`);
  process.exit(1);
}

const entries: Array<{ key: string; value: string }> = [];

for (let n = startN; n <= endN; n++) {
  const word = pool[seededIndex(n, pool.length)];
  entries.push({ key: `puzzle:${n}`, value: word });
}

if (localMode) {
  const outPath = resolve(__dirname, 'seed-data.json');
  writeFileSync(outPath, JSON.stringify(entries));
  console.log(`Wrote ${entries.length} entries to scripts/seed-data.json`);
  console.log('wrangler will import this into local KV next…');
  process.exit(0);
}

// ── remote upload ────────────────────────────────────────────────────────────
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

if (!accountId || !namespaceId || !apiToken) {
  console.error('Missing env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_KV_NAMESPACE_ID, CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

console.log(`Uploading puzzles ${startN}–${endN} (${entries.length} entries) to KV…`);

const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/bulk`;

const res = await fetch(url, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(entries),
});

const body = await res.json() as { success: boolean; errors?: unknown[] };

if (!body.success) {
  console.error('KV bulk upload failed:', JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log(`Done. Puzzles ${startN}–${endN} are now seeded.`);
