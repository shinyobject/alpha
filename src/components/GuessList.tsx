import { css } from '../../styled-system/css';
import type { Guess } from '../game/types';

type Props = {
  guesses: Guess[];
};

const listStyle = css({
  listStyle: 'none',
  padding: '0',
  margin: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

const rowStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '3',
  py: '2',
  borderRadius: 'md',
  bg: 'gray.50',
  fontSize: 'sm',
  fontFamily: 'mono',
});

const wordStyle = css({
  fontWeight: 'semibold',
  color: 'gray.800',
  letterSpacing: 'wide',
});

const afterBadge = css({
  fontSize: 'xs',
  fontWeight: 'medium',
  color: 'blue.600',
  bg: 'blue.50',
  px: '2',
  py: '0.5',
  borderRadius: 'full',
});

const beforeBadge = css({
  fontSize: 'xs',
  fontWeight: 'medium',
  color: 'orange.600',
  bg: 'orange.50',
  px: '2',
  py: '0.5',
  borderRadius: 'full',
});

export function GuessList({ guesses }: Props) {
  if (guesses.length === 0) return null;

  return (
    <ul className={listStyle}>
      {[...guesses].reverse().map((g, i) => (
        <li key={guesses.length - 1 - i} className={rowStyle}>
          <span className={wordStyle}>{g.word}</span>
          {g.relation !== 'equal' && (
            <span className={g.relation === 'after' ? afterBadge : beforeBadge}>
              {g.relation === 'after' ? 'after ↑' : 'before ↓'}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
