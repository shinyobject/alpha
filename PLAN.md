# AlphaGuess Clone — Build Plan

## Summary

Friends-only daily word game. Players guess a hidden English word; each guess reveals whether the target comes alphabetically before or after. Unlimited guesses. New puzzle every Pacific midnight. Inspired by [alphaguess.com](https://alphaguess.com), private to a small friend group.

Production URL: `https://alpha.shinyobject.app`

## Goals

- Daily word with deterministic puzzle numbering
- Before/after feedback per guess
- Past puzzles accessible by number
- Plain-text share format (Wordle-style, not emoji grid)
- Friend-group gating via Cloudflare Access on custom domain
- Local-first state; no server-side accounts or stats

## Non-goals

- User accounts beyond Cloudflare Access email gating
- Server-stored leaderboard, streaks, or play history
- Anti-cheat (results are self-reported via share text)
- Hint systems
- Mobile native apps
- Offensive-word filtering beyond a small static blocklist

## Stack (locked)

| Layer    | Choice                                  |
|----------|-----------------------------------------|
| Frontend | Vite + React 18 + TypeScript            |
| Styling  | Panda CSS                               |
| Hosting  | Cloudflare Pages                        |
| API      | Cloudflare Pages Functions (Hono)       |
| Storage  | Workers KV (one namespace)              |
| Auth     | Cloudflare Access (Zero Trust Free)     |
| Domain   | `alpha.shinyobject.app` (custom)        |

Pages Functions (not a separate Worker) so the API lives at the same hostname as the SPA and inherits the Access gate for free.

## Architecture

```
Browser
  │  (gated by Cloudflare Access — email allowlist)
  ▼
Cloudflare Pages
  ├── Static SPA
  └── /api/* (Pages Functions, Hono)
         │
         ▼
   Workers KV (puzzle:N → word)
```

Game state lives entirely in localStorage. The API is read-only and serves only the daily word.

## Data model

### Workers KV

Namespace binding name: `PUZZLES`

Keys:
- `puzzle:<n>` → string (the answer for puzzle number `n`)

Pre-seeded at deploy time via a one-shot script. Worker never writes; it only reads. Manual edits in the Cloudflare dashboard are the override mechanism for bad words.

### localStorage

```ts
type Guess = { word: string; relation: 'before' | 'after' | 'equal' };

type ActiveGame = {
  n: number;
  guesses: Guess[];
  startedAt: number | null; // ms epoch, set on first guess
};

type CompletedPuzzle = {
  n: number;
  guesses: Guess[];
  startedAt: number;
  solvedAt: number;
  durationMs: number;
};

// Keys:
// 'alphaguess:active'    → ActiveGame | null
// 'alphaguess:completed' → Record<number, CompletedPuzzle>
```

## API contract

Base: `https://alpha.shinyobject.app/api`

### `GET /api/today`

Returns the current puzzle number.

Response: `{ n: number }`

### `GET /api/word/:n`

Returns the word for puzzle `n`.

- `n` must be a positive integer
- If `n > today`: return `403 { error: 'future' }`
- If `puzzle:n` exists in KV: return it
- If missing: return `404 { error: 'unseeded' }` (operational signal — re-run seed script)

Response: `{ n: number, word: string }`

That is the entire API surface.

## Puzzle numbering

```ts
const LAUNCH_DATE = 'YYYY-MM-DD'; // Pacific date, set ONCE before launch, never changed

function todayPuzzleNumber(now = new Date()): number {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const todayPT = fmt.format(now); // 'YYYY-MM-DD'
  return daysBetween(LAUNCH_DATE, todayPT) + 1;
}
```

`Intl.DateTimeFormat` with `America/Los_Angeles` handles DST correctly. Do not store UTC offsets; always use the IANA zone name.

## Word lists

Two static JSON files in `public/words/`. Built from raw SCOWL via `scripts/build-wordlists.ts` and committed to the repo.

### `valid.json` — guess validation

- Source: SCOWL size 70 (or `dwyl/english-words`)
- Filter: lowercase a–z only, length 4–10, exclude proper nouns
- Expected size: ~80–120k words, ~1MB raw / ~300KB gzipped
- Loaded once into a `Set<string>` on app boot
- Cached forever (immutable filename hash)

### `daily.json` — daily word pool

- Source: SCOWL size 35 (more common vocabulary)
- Filter: same as valid, plus a hand-maintained blocklist of offensive terms
- Sorted alphabetically, frozen at first deploy
- Expected size: ~3–5k words

### Pool freeze

Once the seed script has populated KV, the daily pool ordering must never change for already-seeded numbers. Adding new puzzles to the end is fine; reordering or removing words from earlier indices is not.

To add words for future puzzles, append to `daily.json` and re-run the seed script. The script must skip any `puzzle:n` keys that already exist in KV.

## Daily word seeding

Script: `scripts/seed-puzzles.ts`

```ts
// Pseudocode
const pool = await readDailyPool();          // sorted, frozen
const existingKeys = await listKVKeys('puzzle:');
const startN = max existing n, default 0;
const targetN = startN + 1825;               // 5 years ahead

for (let n = startN + 1; n <= targetN; n++) {
  const idx = seededIndex(n, pool.length);   // mulberry32 or similar
  await kv.put(`puzzle:${n}`, pool[idx]);
}
```

Run at launch. Re-run when seeded coverage drops below ~1 year.

The seed script is the only place where shuffle logic exists. The Pages Function never computes; it only reads KV.

## Routes (SPA)

- `/` → today's puzzle
- `/:n` → puzzle `n` (renders an error state if API returns 403)
- 404 → unknown route

Past-puzzle plays are stored in `completed[n]` the same way as today's, allowing replay reads without re-tracking time.

## UI / UX requirements

### Game screen

- Boundary display: "after: <word>" above input, "before: <word>" below
- On first load: show `aaaa` and `zzzz` (or pool first/last) as initial bounds
- After each guess, narrow the visible bounds to the closest before/after guesses
- Guess input: text field, submit on Enter
- Inline validation:
  - Non-word → shake animation, no guess recorded
  - Already-guessed word → shake animation, no guess recorded
  - Valid word → recorded, bounds update, input clears
- Visible: current guess count, elapsed timer (ticks every second)

### Win state

- Word reveal animation
- Guess count, total time
- Share button (primary CTA)
- Link to past puzzles

### Past guesses list

- Show all guesses, most recent first
- Each row: word + before/after indicator
- Solid not scrollable on mobile until > ~8 guesses

### Past puzzles screen

- List of completed puzzles, most recent first
- Each row: puzzle #, date played, guess count, time
- Tap → loads `/:n` in replay mode (read-only completed game)

## Time tracking

- `startedAt` is set on the **first guess**, not on page load
- Persisted in localStorage so refresh-safe
- `durationMs = solvedAt - startedAt` at win
- Wall clock; no Page Visibility pause logic in v1
- If a player walks away mid-game, time keeps counting — known and accepted

## Share text

Format:

```
🧩 Puzzle #1007
🤔 14 guesses
⏱️ 1m 37s
🔗 alpha.shinyobject.app/1007
```

Implementation:
1. Try `navigator.share({ text })` if `navigator.canShare?.({ text })`
2. Otherwise `navigator.clipboard.writeText(text)` + toast "Copied"

Time formatter:
- `< 60s` → `Xs`
- `< 1h`  → `XmYs`
- `≥ 1h`  → `XhYm`

## Cloudflare Access setup

1. Confirm `shinyobject.app` is on Cloudflare DNS (it is)
2. Create Pages project, link repo
3. Add custom domain `alpha.shinyobject.app` to the Pages project
4. In Cloudflare Zero Trust dashboard:
   - Settings → Authentication → enable Google + One-time PIN identity providers
   - Access → Applications → Add → Self-hosted
   - Application domain: `alpha.shinyobject.app` (entire host, no path filter)
   - Session duration: 1 month
   - Add policy: name "Friends", action Allow, include rule "Emails: <list>"
5. Smoke test: visit the URL incognito, complete the Access flow, land on the SPA

The Access gate covers `/api/*` automatically because Pages Functions live on the same hostname.

Optional: Pages Functions can read the verified email from the `Cf-Access-Authenticated-User-Email` request header. Not used in v1, but available if later needed.

## Repo layout

```
/
├── src/
│   ├── components/
│   ├── game/              # game state machine, bounds logic
│   ├── words/             # validation Set, daily fetch
│   ├── share/             # share text + clipboard
│   ├── routes/            # / and /:n
│   └── App.tsx
├── functions/
│   └── api/
│       ├── today.ts       # GET /api/today
│       └── word/
│           └── [n].ts     # GET /api/word/:n
├── scripts/
│   ├── build-wordlists.ts # SCOWL → valid.json + daily.json
│   └── seed-puzzles.ts    # populate KV
├── public/
│   └── words/
│       ├── valid.json
│       └── daily.json
├── panda.config.ts
├── vite.config.ts
└── wrangler.toml          # KV binding for local dev
```

## Build phases

### Phase 1 — Core mechanic (no backend)
- Vite + React + TS scaffold
- Panda CSS configured
- Hardcoded target word in component state
- Guess input, before/after bounds display, win state
- Goal: nail the feel before plumbing anything else

### Phase 2 — Word lists
- `scripts/build-wordlists.ts` produces `valid.json` and `daily.json`
- Boot loads `valid.json` into a `Set`
- Validation rejects non-words and duplicates

### Phase 3 — Local-only daily
- `LAUNCH_DATE` constant + Pacific-date math
- Compute today's `n` and word entirely client-side using the seeded shuffle
- localStorage active game + completed history
- `/:n` route for past puzzles

### Phase 4 — Move daily word to API
- Set up KV namespace via Wrangler
- Implement `GET /api/today` and `GET /api/word/:n`
- Run `seed-puzzles.ts` against KV (5 years)
- Replace client-side shuffle with `fetch('/api/word/:n')`
- Remove daily pool from client bundle (validation list stays)
- Verify future puzzles return 403

### Phase 5 — Deploy
- Pages project linked to repo
- Custom domain `alpha.shinyobject.app`
- Cloudflare Access application + Friends policy
- Smoke test with one friend's email added to the policy

### Phase 6 — Polish
- Share text + button + clipboard fallback
- Past puzzles screen
- Local stats screen (computed from `completed` map: total played, avg guesses, fastest solve)
- Mobile keyboard handling, animations, empty/error states

## Decisions locked

- `LAUNCH_DATE` is set once and never changes
- Daily pool ordering once seeded into KV is immutable for existing `n`
- Pacific timezone (`America/Los_Angeles`) for puzzle reset
- Unlimited guesses
- Wall-clock time, started on first guess
- No accounts beyond Cloudflare Access
- API is read-only

## Decisions deferred

- Pause-on-blur time tracking (only if a friend complains)
- Server-side leaderboard (only if friends want it)
- Streak tracking UI
- Distribution histogram on win screen

## Acceptance checklist

- [ ] Visiting `/` while logged in via Access shows today's puzzle
- [ ] Guessing a non-word is rejected with feedback
- [ ] Guessing a duplicate is rejected with feedback
- [ ] Each valid guess updates the before/after bounds correctly
- [ ] Solving the puzzle reveals the word, count, and time
- [ ] Share button produces text matching the spec format
- [ ] `/1` (or any past `n`) loads that puzzle's word
- [ ] `/<future n>` shows a clean error, not a stack trace
- [ ] Refresh mid-game preserves guesses and timer
- [ ] Visiting from a non-allowlisted email is blocked at Access, never reaches the SPA
- [ ] Pacific-midnight rollover: at 00:00 PT, `today` increments