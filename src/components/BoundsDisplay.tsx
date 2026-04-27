import { css } from '../../styled-system/css';

type Props = {
  lowerBound: string;
  upperBound: string;
};

const boundStyle = css({
  fontFamily: 'mono',
  fontSize: 'xl',
  fontWeight: 'semibold',
  letterSpacing: 'wide',
  color: 'gray.500',
  userSelect: 'none',
});

const labelStyle = css({
  fontSize: 'xs',
  fontWeight: 'medium',
  textTransform: 'uppercase',
  letterSpacing: 'widest',
  color: 'gray.400',
  mb: '1',
});

const containerStyle = css({
  textAlign: 'center',
  py: '2',
});

export function BoundsDisplay({ lowerBound, upperBound }: Props) {
  return (
    <div>
      <div className={containerStyle}>
        <div className={labelStyle}>after</div>
        <div className={boundStyle}>{lowerBound}</div>
      </div>

      <div className={containerStyle}>
        <div className={labelStyle}>before</div>
        <div className={boundStyle}>{upperBound}</div>
      </div>
    </div>
  );
}
