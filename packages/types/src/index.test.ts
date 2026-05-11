import { describe, expect, it } from 'vitest';
import {
  estimatedOneRepMax,
  formatShortDate,
  getDayName,
  setVolume,
} from './index';

describe('estimatedOneRepMax', () => {
  it('applies the Epley formula: weight × (1 + reps / 30)', () => {
    expect(estimatedOneRepMax(100, 5)).toBeCloseTo(116.67, 1);
    expect(estimatedOneRepMax(100, 10)).toBeCloseTo(133.33, 1);
    expect(estimatedOneRepMax(100, 1)).toBeCloseTo(103.33, 1);
  });

  it('returns weight unchanged at 0 reps', () => {
    expect(estimatedOneRepMax(100, 0)).toBe(100);
  });
});

describe('setVolume', () => {
  it('returns weight × reps', () => {
    expect(setVolume(100, 5)).toBe(500);
    expect(setVolume(80, 8)).toBe(640);
  });

  it('returns 0 when either value is 0', () => {
    expect(setVolume(0, 10)).toBe(0);
    expect(setVolume(100, 0)).toBe(0);
  });
});

describe('getDayName', () => {
  it('returns the full weekday name for a given date', () => {
    expect(getDayName(new Date(2024, 0, 1))).toBe('Monday');
    expect(getDayName(new Date(2024, 0, 6))).toBe('Saturday');
    expect(getDayName(new Date(2024, 0, 7))).toBe('Sunday');
  });

  it('defaults to today without crashing', () => {
    expect(() => getDayName()).not.toThrow();
  });
});

describe('formatShortDate', () => {
  it('formats as "Mon D"', () => {
    expect(formatShortDate(new Date(2024, 0, 1))).toBe('Jan 1');
    expect(formatShortDate(new Date(2024, 11, 25))).toBe('Dec 25');
  });
});
