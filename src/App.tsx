import { useCallback, useEffect, useRef, useState } from 'react';
import { css } from '../styled-system/css';
import { BoundsDisplay } from './components/BoundsDisplay';
import { GuessInput } from './components/GuessInput';
import { GuessList } from './components/GuessList';
import { WinState } from './components/WinState';
import { compare, getLowerBound, getUpperBound, formatDuration } from './game/logic';
import type { Guess } from './game/types';

// Phase 1: hardcoded target word
const TARGET_WORD = 'planet';
const PUZZLE_N = 1;

const layoutStyle = css({
  maxW: '480px',
  mx: 'auto',
  px: '4',
  py: '6',
  minH: '100svh',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

const headerStyle = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  pb: '2',
  borderBottom: '1px solid',
  borderColor: 'gray.200',
});

const titleStyle = css({
  fontWeight: 'bold',
  fontSize: 'lg',
  color: 'gray.900',
  letterSpacing: 'tight',
});

const metaStyle = css({
  fontSize: 'sm',
  color: 'gray.400',
  display: 'flex',
  gap: '3',
});

const dividerStyle = css({
  border: 'none',
  borderTop: '1px solid',
  borderColor: 'gray.100',
  my: '1',
});

export default function App() {
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [won, setWon] = useState(false);
  const [solvedAt, setSolvedAt] = useState<number | null>(null);
  const [shareConfirmed, setShareConfirmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startedAt && !won) {
      timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startedAt, won]);

  const handleGuess = useCallback((word: string): 'ok' | 'duplicate' | 'invalid' => {
    if (guesses.some(g => g.word === word)) return 'duplicate';

    // Phase 1: no dictionary validation, accept any non-empty lowercase letters
    if (!/^[a-z]+$/.test(word)) return 'invalid';

    const relation = compare(word, TARGET_WORD);
    const ts = Date.now();

    if (!startedAt) setStartedAt(ts);

    const newGuess: Guess = { word, relation };
    setGuesses(prev => [...prev, newGuess]);

    if (relation === 'equal') {
      setWon(true);
      setSolvedAt(ts);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return 'ok';
  }, [guesses, startedAt]);

  const durationMs = won && startedAt && solvedAt
    ? solvedAt - startedAt
    : startedAt
      ? now - startedAt
      : 0;

  const lowerBound = getLowerBound(guesses);
  const upperBound = getUpperBound(guesses);

  function buildShareText() {
    const dur = won && startedAt && solvedAt ? formatDuration(solvedAt - startedAt) : '?';
    return [
      `🧩 Puzzle #${PUZZLE_N}`,
      `🤔 ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}`,
      `⏱️ ${dur}`,
      `🔗 alpha.shinyobject.me/${PUZZLE_N}`,
    ].join('\n');
  }

  async function handleShare() {
    const text = buildShareText();
    if (navigator.canShare?.({ text })) {
      try { await navigator.share({ text }); return; } catch { /* fall through */ }
    }
    await navigator.clipboard.writeText(text);
    setShareConfirmed(true);
    setTimeout(() => setShareConfirmed(false), 2000);
  }

  return (
    <div className={layoutStyle}>
      <header className={headerStyle}>
        <span className={titleStyle}>AlphaGuess</span>
        <span className={metaStyle}>
          <span>#{PUZZLE_N}</span>
          {startedAt && !won && <span>{formatDuration(durationMs)}</span>}
          {guesses.length > 0 && <span>{guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}</span>}
        </span>
      </header>

      {won && startedAt && solvedAt ? (
        <WinState
          word={TARGET_WORD}
          guessCount={guesses.length}
          durationMs={solvedAt - startedAt}
          puzzleN={PUZZLE_N}
          onShare={handleShare}
          shareConfirmed={shareConfirmed}
        />
      ) : (
        <div className={css({ display: 'flex', flexDirection: 'column', gap: '3' })}>
          <BoundsDisplay lowerBound={lowerBound} upperBound={upperBound} />
          <hr className={dividerStyle} />
          <GuessInput onSubmit={handleGuess} disabled={won} />
        </div>
      )}

      <GuessList guesses={guesses} />
    </div>
  );
}
