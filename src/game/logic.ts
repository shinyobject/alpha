import type { Guess, Relation } from './types';

export function compare(guess: string, target: string): Relation {
  if (guess === target) return 'equal';
  return guess < target ? 'after' : 'before';
}

// Closest lower bound: largest 'after' guess (target is alphabetically after it)
export function getLowerBound(guesses: Guess[]): string {
  const candidates = guesses.filter(g => g.relation === 'after').map(g => g.word);
  return candidates.length ? candidates.reduce((a, b) => (a > b ? a : b)) : 'aaaa';
}

// Closest upper bound: smallest 'before' guess (target is alphabetically before it)
export function getUpperBound(guesses: Guess[]): string {
  const candidates = guesses.filter(g => g.relation === 'before').map(g => g.word);
  return candidates.length ? candidates.reduce((a, b) => (a < b ? a : b)) : 'zzzz';
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${rem}s`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h}h ${remM}m`;
}
