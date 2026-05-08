import type { ActiveGame, CompletedPuzzle } from './types';

const ACTIVE_KEY = 'alphaguess:active';
const COMPLETED_KEY = 'alphaguess:completed';

export function loadActiveGame(): ActiveGame | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as ActiveGame) : null;
  } catch {
    return null;
  }
}

export function saveActiveGame(game: ActiveGame | null): void {
  if (game === null) {
    localStorage.removeItem(ACTIVE_KEY);
  } else {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(game));
  }
}

export function loadCompletedPuzzles(): Record<number, CompletedPuzzle> {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    return raw ? (JSON.parse(raw) as Record<number, CompletedPuzzle>) : {};
  } catch {
    return {};
  }
}

export function saveCompletedPuzzle(puzzle: CompletedPuzzle): void {
  const all = loadCompletedPuzzles();
  all[puzzle.n] = puzzle;
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(all));
}
