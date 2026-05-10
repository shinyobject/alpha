import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { css } from '../styled-system/css';
import { BoundsDisplay } from './components/BoundsDisplay';
import { GuessInput } from './components/GuessInput';
import { WinState } from './components/WinState';
import { compare, getLowerBound, getUpperBound, formatDuration } from './game/logic';
import { todayPuzzleNumber, getDailyWord, FuturePuzzleError } from './game/daily';
import { loadActiveGame, saveActiveGame, loadCompletedPuzzles, saveCompletedPuzzle } from './game/storage';
import type { Guess } from './game/types';
import { getValidWords } from './words';

function parseUrlPuzzleN(): number | null {
  const match = window.location.pathname.match(/^\/(\d+)$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return n > 0 ? n : null;
}

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

const hintAreaStyle = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2',
  pt: '1',
});

const revealBtnStyle = css({
  px: '4',
  py: '2',
  bg: 'white',
  border: '1px solid',
  borderColor: 'gray.300',
  borderRadius: 'md',
  fontSize: 'sm',
  color: 'gray.600',
  cursor: 'pointer',
  _hover: { bg: 'gray.50', borderColor: 'gray.400' },
  _disabled: { opacity: '0.4', cursor: 'not-allowed' },
  transition: 'all 0.15s',
});

const devBarStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  px: '3',
  py: '1.5',
  bg: 'yellow.50',
  border: '1px dashed',
  borderColor: 'yellow.300',
  borderRadius: 'md',
  fontSize: 'xs',
  color: 'yellow.800',
});

const devBtnStyle = css({
  px: '2',
  py: '0.5',
  bg: 'yellow.200',
  border: 'none',
  borderRadius: 'sm',
  fontWeight: 'semibold',
  cursor: 'pointer',
  _hover: { bg: 'yellow.300' },
  _disabled: { opacity: '0.4', cursor: 'not-allowed' },
});

export default function App() {
  const urlPuzzleN = useMemo(() => parseUrlPuzzleN(), []);
  const [dayOffset, setDayOffset] = useState(0);

  const puzzleN = urlPuzzleN ?? todayPuzzleNumber(dayOffset);

  const [targetWord, setTargetWord] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [won, setWon] = useState(false);
  const [solvedAt, setSolvedAt] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [revealError, setRevealError] = useState('');
  const [shareConfirmed, setShareConfirmed] = useState(false);
  const [puzzleError, setPuzzleError] = useState<'future' | 'unavailable' | null>(null);
  const [validWords, setValidWords] = useState<Set<string> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getValidWords().then(setValidWords);
  }, []);

  // When puzzle changes: restore game state from localStorage, load word
  useEffect(() => {
    setTargetWord(null);
    setPuzzleError(null);
    setInputValue('');
    setRevealError('');
    setShareConfirmed(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const active = loadActiveGame();
    if (active && active.n === puzzleN) {
      setGuesses(active.guesses);
      setStartedAt(active.startedAt);
      setHintsUsed(active.hintsUsed ?? 0);
      setWon(false);
      setSolvedAt(null);
    } else {
      const completed = loadCompletedPuzzles();
      const cp = completed[puzzleN];
      if (cp) {
        setGuesses(cp.guesses);
        setStartedAt(cp.startedAt);
        setHintsUsed(cp.hintsUsed ?? 0);
        setWon(true);
        setSolvedAt(cp.solvedAt);
      } else {
        setGuesses([]);
        setStartedAt(null);
        setHintsUsed(0);
        setWon(false);
        setSolvedAt(null);
      }
    }

    getDailyWord(puzzleN).then(setTargetWord).catch(err => {
      setPuzzleError(err instanceof FuturePuzzleError ? 'future' : 'unavailable');
    });
  }, [puzzleN]);

  useEffect(() => {
    if (startedAt && !won) {
      timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startedAt, won]);

  const handleGuess = useCallback((word: string): 'ok' | 'duplicate' | 'invalid' => {
    if (!targetWord) return 'invalid';
    if (guesses.some(g => g.word === word)) return 'duplicate';
    if (!validWords || !validWords.has(word)) return 'invalid';

    const relation = compare(word, targetWord);
    const ts = Date.now();
    const newStartedAt = startedAt ?? ts;
    const newGuesses: Guess[] = [...guesses, { word, relation }];

    if (!startedAt) setStartedAt(newStartedAt);
    setGuesses(newGuesses);
    setInputValue('');
    setRevealError('');

    if (relation === 'equal') {
      const durationMs = ts - newStartedAt;
      setWon(true);
      setSolvedAt(ts);
      if (timerRef.current) clearInterval(timerRef.current);
      saveActiveGame(null);
      saveCompletedPuzzle({ n: puzzleN, guesses: newGuesses, startedAt: newStartedAt, solvedAt: ts, durationMs, hintsUsed });
    } else {
      saveActiveGame({ n: puzzleN, guesses: newGuesses, startedAt: newStartedAt, hintsUsed });
    }

    return 'ok';
  }, [guesses, startedAt, validWords, targetWord, puzzleN, hintsUsed]);

  const handleReveal = useCallback(() => {
    if (!targetWord || !inputValue || !targetWord.startsWith(inputValue)) {
      setRevealError('not correct');
      return;
    }
    const next = inputValue + targetWord[inputValue.length];
    const newHints = hintsUsed + 1;
    setInputValue(next);
    setRevealError('');
    setHintsUsed(newHints);
    saveActiveGame({ n: puzzleN, guesses, startedAt, hintsUsed: newHints });
    inputRef.current?.focus();
  }, [targetWord, inputValue, hintsUsed, puzzleN, guesses, startedAt]);

  const durationMs = won && startedAt && solvedAt
    ? solvedAt - startedAt
    : startedAt
      ? now - startedAt
      : 0;

  const lowerBound = getLowerBound(guesses);
  const upperBound = getUpperBound(guesses);

  function buildShareText() {
    const dur = won && startedAt && solvedAt ? formatDuration(solvedAt - startedAt) : '?';
    const lines = [
      `🧩 Puzzle #${puzzleN}`,
      `🤔 ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}`,
      `⏱️ ${dur}`,
    ];
    if (hintsUsed > 0) lines.push(`🫪 ${hintsUsed} ${hintsUsed === 1 ? 'hint' : 'hints'}`);
    return lines.join('\n');
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

  const minPuzzleN = 1;
  const canDecrementDay = urlPuzzleN === null && todayPuzzleNumber(dayOffset - 1) >= minPuzzleN;

  return (
    <div className={layoutStyle}>
      <header className={headerStyle}>
        <span className={titleStyle}>Alpha Guesser</span>
        <span className={metaStyle}>
          <span>#{puzzleN}</span>
          {won && <span>{formatDuration(durationMs)}</span>}
          {won && <span>{guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}</span>}
        </span>
      </header>

      {import.meta.env.DEV && urlPuzzleN === null && (
        <div className={devBarStyle}>
          <span>dev: day offset {dayOffset > 0 ? `+${dayOffset}` : dayOffset} → puzzle #{puzzleN}</span>
          <button
            className={devBtnStyle}
            onClick={() => setDayOffset(d => d - 1)}
            disabled={!canDecrementDay}
          >−</button>
          <button
            className={devBtnStyle}
            onClick={() => setDayOffset(d => d + 1)}
          >+</button>
        </div>
      )}

      {puzzleError && (
        <div className={css({ textAlign: 'center', py: '10', color: 'gray.500', fontSize: 'sm' })}>
          {puzzleError === 'future'
            ? `Puzzle #${puzzleN} hasn't been released yet.`
            : `Puzzle #${puzzleN} couldn't be loaded. Try again.`}
        </div>
      )}

      {!puzzleError && <BoundsDisplay
        lowerBound={lowerBound}
        upperBound={upperBound}
        middle={
          won && startedAt && solvedAt ? (
            <WinState
              word={targetWord ?? ''}
              guessCount={guesses.length}
              durationMs={solvedAt - startedAt}
              puzzleN={puzzleN}
              hintsUsed={hintsUsed}
              onShare={handleShare}
              shareConfirmed={shareConfirmed}
            />
          ) : (
            <>
              <GuessInput
                ref={inputRef}
                value={inputValue}
                onChange={v => { setInputValue(v); setRevealError(''); }}
                onSubmit={handleGuess}
                disabled={won || !validWords || !targetWord}
              />
              <div className={hintAreaStyle}>
                <button
                  className={revealBtnStyle}
                  onClick={handleReveal}
                  disabled={!targetWord || inputValue.length >= (targetWord?.length ?? 0)}
                >
                  Reveal next letter
                </button>
                {revealError && (
                  <span className={css({ fontSize: 'sm', color: 'red.500' })}>{revealError}</span>
                )}
              </div>
            </>
          )
        }
      />}

    </div>
  );
}
