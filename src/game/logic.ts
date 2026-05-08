import type { Guess, Relation } from './types';

export function compare(guess: string, target: string): Relation {
  if (guess === target) return 'equal';
  return guess < target ? 'after' : 'before';
}

export function getLowerBound(guesses: Guess[]): string[] {
  return guesses.filter(g => g.relation === 'after').map(g => g.word).sort();
}

export function getUpperBound(guesses: Guess[]): string[] {
  return guesses.filter(g => g.relation === 'before').map(g => g.word).sort();
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
