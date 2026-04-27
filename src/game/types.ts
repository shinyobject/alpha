export type Relation = 'before' | 'after' | 'equal';

export type Guess = {
  word: string;
  relation: Relation;
};
