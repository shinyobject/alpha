import { useCallback, useEffect, useRef, useState } from 'react';
import { css } from '../styled-system/css';
import { BoundsDisplay } from './components/BoundsDisplay';
import { GuessInput } from './components/GuessInput';
import { WinState } from './components/WinState';
import { compare, getLowerBound, getUpperBound, formatDuration } from './game/logic';
import type { Guess } from './game/types';
import { getValidWords } from './words';

// Phase 1: hardcoded target word
const TARGET_WORD = 'planet';
const PUZZLE_N = 1;

const layoutStyle = css({
  maxW: '480px',
  mx: 'auto',
  px: '4',
  py: '6',
  h: '100svh',
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

export default function App() {
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [won, setWon] = useState(false);
  const [solvedAt, setSolvedAt] = useState<number | null>(null);
  const [shareConfirmed, setShareConfirmed] = useState(false);
  const [validWords, setValidWords] = useState<Set<string> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getValidWords().then(setValidWords);
  }, []);

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

    if (!validWords || !validWords.has(word)) return 'invalid';

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
  }, [guesses, startedAt, validWords]);

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
          {won && <span>{formatDuration(durationMs)}</span>}
          {won && <span>{guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}</span>}
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
        <BoundsDisplay
          lowerBound={lowerBound}
          upperBound={upperBound}
          middle={<GuessInput onSubmit={handleGuess} disabled={won || !validWords} />}
        />
      )}

    </div>
  );
}
