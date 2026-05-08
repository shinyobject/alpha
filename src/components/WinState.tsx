import { css } from '../../styled-system/css';
import { formatDuration } from '../game/logic';

type Props = {
  word: string;
  guessCount: number;
  durationMs: number;
  puzzleN: number;
  onShare: () => void;
  shareConfirmed: boolean;
};

const containerStyle = css({
  textAlign: 'center',
  py: '6',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4',
});

const wordStyle = css({
  fontFamily: 'mono',
  fontSize: '4xl',
  fontWeight: 'bold',
  letterSpacing: 'wider',
  color: 'green.600',
  animation: 'fadeIn 0.4s ease',
});

const statsStyle = css({
  display: 'flex',
  gap: '6',
  color: 'gray.600',
  fontSize: 'sm',
});

const statStyle = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1',
});

const statValueStyle = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'gray.900',
});

const shareButtonStyle = css({
  mt: '2',
  px: '6',
  py: '3',
  bg: 'gray.900',
  color: 'white',
  borderRadius: 'lg',
  fontWeight: 'semibold',
  fontSize: 'sm',
  cursor: 'pointer',
  border: 'none',
  _hover: { bg: 'gray.700' },
  transition: 'background 0.15s',
});

export function WinState({ word, guessCount, durationMs, puzzleN, onShare, shareConfirmed }: Props) {
  return (
    <div className={containerStyle}>
      <div className={css({ fontSize: 'lg', color: 'gray.500' })}>Puzzle #{puzzleN} — you got it!</div>
      <div className={wordStyle}>{word}</div>
      <div className={statsStyle}>
        <div className={statStyle}>
          <span className={statValueStyle}>{guessCount}</span>
          <span>{guessCount === 1 ? 'guess' : 'guesses'}</span>
        </div>
        <div className={statStyle}>
          <span className={statValueStyle}>{formatDuration(durationMs)}</span>
          <span>time</span>
        </div>
      </div>
      <button className={shareButtonStyle} onClick={onShare}>
        {shareConfirmed ? 'Copied!' : 'Share'}
      </button>
    </div>
  );
}
