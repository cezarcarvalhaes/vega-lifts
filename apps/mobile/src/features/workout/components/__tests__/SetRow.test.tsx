// SetRow's UI behaviour (rendering TextInput, firing DB writes) requires a
// full React Native + WatermelonDB environment that conflicts with pnpm's
// module resolution in the current jest-expo setup. We test the two pure
// functions that contain all the non-trivial logic instead. Component-level
// interactions are covered by the broader dogfood / E2E suite.
import { deriveState, rowReducer } from '../../setRowHelpers';

const identity = (kg: number | null) => (kg != null ? String(kg) : '');

describe('deriveState', () => {
  it('converts model fields to display strings', () => {
    const state = deriveState(100, 5, null, 8, 'normal', null, identity);
    expect(state.weightText).toBe('100');
    expect(state.repsText).toBe('5');
    expect(state.durationText).toBe('');
    expect(state.rpeText).toBe('8');
    expect(state.setType).toBe('normal');
    expect(state.isCompleted).toBe(false);
  });

  it('marks a set as completed when completedAtMs is set', () => {
    const state = deriveState(100, 5, null, null, 'normal', Date.now(), identity);
    expect(state.isCompleted).toBe(true);
  });

  it('handles timed sets — duration populated, weight and reps empty', () => {
    const state = deriveState(null, null, 60, null, 'normal', null, identity);
    expect(state.weightText).toBe('');
    expect(state.repsText).toBe('');
    expect(state.durationText).toBe('60');
    expect(state.rpeText).toBe('');
  });

  it('uses the supplied displayWeight function for unit conversion', () => {
    const lbFormatter = (kg: number | null) => (kg != null ? `${kg * 2}` : '');
    const state = deriveState(50, 5, null, null, 'normal', null, lbFormatter);
    expect(state.weightText).toBe('100');
  });

  it('treats completedAtMs of 0 (epoch) as not completed', () => {
    const state = deriveState(100, 5, null, null, 'normal', 0, identity);
    expect(state.isCompleted).toBe(false);
  });
});

describe('rowReducer', () => {
  const base = {
    weightText: '100',
    repsText: '5',
    durationText: '',
    rpeText: '',
    setType: 'normal' as const,
    isCompleted: false,
  };

  it('sync replaces the whole state', () => {
    const newState = {
      weightText: '80',
      repsText: '8',
      rpeText: '7',
      durationText: '',
      setType: 'warmup' as const,
      isCompleted: true,
    };
    expect(rowReducer(base, { type: 'sync', state: newState })).toEqual(newState);
  });

  it('patch merges partial updates without touching other fields', () => {
    const next = rowReducer(base, { type: 'patch', patch: { weightText: '120' } });
    expect(next.weightText).toBe('120');
    expect(next.repsText).toBe('5');
    expect(next.setType).toBe('normal');
  });

  it('patch can mark a set complete', () => {
    const next = rowReducer(base, { type: 'patch', patch: { isCompleted: true } });
    expect(next.isCompleted).toBe(true);
  });

  it('patch can cycle the set type', () => {
    const warmup = rowReducer(base, { type: 'patch', patch: { setType: 'warmup' } });
    expect(warmup.setType).toBe('warmup');

    const dropset = rowReducer(warmup, { type: 'patch', patch: { setType: 'dropset' } });
    expect(dropset.setType).toBe('dropset');
  });
});
