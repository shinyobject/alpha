import React from 'react';
import { css } from '../../styled-system/css';

type Props = {
  lowerBound: string[];
  upperBound: string[];
  middle?: React.ReactNode;
};

const boundStyle = css({
  fontFamily: 'mono',
  fontSize: 'xl',
  fontWeight: 'semibold',
  letterSpacing: 'wide',
  color: 'gray.500',
  userSelect: 'none',
});

const wrapperStyle = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  minH: '0',
});

const listTopStyle = css({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  flex: '1',
  overflowY: 'auto',
  textAlign: 'center',
  py: '2',
});

const listBottomStyle = css({
  flex: '1',
  overflowY: 'auto',
  textAlign: 'center',
  py: '2',
});

export function BoundsDisplay({ lowerBound, upperBound, middle }: Props) {
  return (
    <div className={wrapperStyle}>
      <div className={listTopStyle}>
        {lowerBound.map(word => (
          <div key={word} className={boundStyle}>{word}</div>
        ))}
      </div>

      {middle}

      <div className={listBottomStyle}>
        {upperBound.map(word => (
          <div key={word} className={boundStyle}>{word}</div>
        ))}
      </div>
    </div>
  );
}
