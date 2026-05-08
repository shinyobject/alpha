export type Relation = 'before' | 'after' | 'equal';

export type Guess = {
  word: string;
  relation: Relation;
};

export type ActiveGame = {
  n: number;
  guesses: Guess[];
  startedAt: number | null;
  hintsUsed: number;
};

export type CompletedPuzzle = {
  n: number;
  guesses: Guess[];
  startedAt: number;
  solvedAt: number;
  durationMs: number;
  hintsUsed: number;
};
