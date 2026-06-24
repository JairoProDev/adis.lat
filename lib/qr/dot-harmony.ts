import type { QrCornerDotType, QrCornerSquareType, QrDotType } from './types';

/** Esquinas que combinan con cada forma de punto. */
export const DOT_CORNER_HARMONY: Record<
  QrDotType,
  { cornerSquareType: QrCornerSquareType; cornerDotType: QrCornerDotType }
> = {
  square: { cornerSquareType: 'square', cornerDotType: 'square' },
  dots: { cornerSquareType: 'dot', cornerDotType: 'dot' },
  rounded: { cornerSquareType: 'extra-rounded', cornerDotType: 'dot' },
  'extra-rounded': { cornerSquareType: 'extra-rounded', cornerDotType: 'dot' },
  classy: { cornerSquareType: 'extra-rounded', cornerDotType: 'square' },
  'classy-rounded': { cornerSquareType: 'extra-rounded', cornerDotType: 'dot' },
};

export function harmoniousCorners(dotType: QrDotType) {
  return DOT_CORNER_HARMONY[dotType] ?? DOT_CORNER_HARMONY.rounded;
}
