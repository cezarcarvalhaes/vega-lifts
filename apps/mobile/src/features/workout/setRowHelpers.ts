import type { SetType } from '@vega/types';

export interface RowState {
  weightText: string;
  repsText: string;
  durationText: string;
  setType: SetType;
  isCompleted: boolean;
}

export type RowAction
  = | { type: 'sync'; state: RowState }
    | { type: 'patch'; patch: Partial<RowState> };

export function rowReducer(state: RowState, action: RowAction): RowState {
  if (action.type === 'sync')
    return action.state;
  return { ...state, ...action.patch };
}

export function deriveState(
  weightKg: number | null,
  reps: number | null,
  durationSeconds: number | null,
  rawType: string,
  completedAtMs: number | null,
  displayWeight: (kg: number | null) => string,
): RowState {
  return {
    weightText: displayWeight(weightKg),
    repsText: reps != null ? String(reps) : '',
    durationText: durationSeconds != null ? String(durationSeconds) : '',
    setType: (rawType as SetType | undefined) ?? 'normal',
    isCompleted: completedAtMs != null && completedAtMs > 0,
  };
}
