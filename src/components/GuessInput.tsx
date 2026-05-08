import { forwardRef, useState } from 'react';
import { css, cx } from '../../styled-system/css';

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (word: string) => 'ok' | 'duplicate' | 'invalid';
  disabled?: boolean;
};

const inputStyle = css({
  fontFamily: 'mono',
  fontSize: '2xl',
  fontWeight: 'bold',
  letterSpacing: 'wider',
  textAlign: 'center',
  textTransform: 'lowercase',
  width: '100%',
  py: '3',
  px: '4',
  border: '2px solid',
  borderColor: 'gray.300',
  borderRadius: 'lg',
  outline: 'none',
  bg: 'white',
  color: 'gray.900',
  _focus: {
    borderColor: 'blue.500',
  },
  _placeholder: {
    color: 'gray.300',
  },
});

const shakeStyle = css({
  animation: 'shake 0.35s ease',
});

const hintStyle = css({
  mt: '2',
  fontSize: 'sm',
  color: 'red.500',
  minH: '5',
  textAlign: 'center',
});

export const GuessInput = forwardRef<HTMLInputElement, Props>(function GuessInput(
  { value, onChange, onSubmit, disabled },
  ref,
) {
  const [hint, setHint] = useState('');
  const [shaking, setShaking] = useState(false);

  function shake(message: string) {
    setHint(message);
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const word = value.trim().toLowerCase();
    if (!word) return;

    const result = onSubmit(word);
    if (result === 'ok') {
      setHint('');
    } else if (result === 'duplicate') {
      shake('Already guessed');
    } else {
      shake('Not a valid word');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={ref}
        className={cx(inputStyle, shaking && shakeStyle)}
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value.toLowerCase());
          setHint('');
        }}
        placeholder="type a word…"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        disabled={disabled}
      />
      <div className={hintStyle}>{hint}</div>
    </form>
  );
});
