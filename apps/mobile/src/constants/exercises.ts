import type { Equipment, ExerciseType, MuscleGroup } from '@vega/types';

// ─── Ordered value lists ──────────────────────────────────────────────────────

export const MUSCLE_GROUPS: Array<MuscleGroup | 'all'> = [
  'all',
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
  'forearms',
  'full_body',
  'other',
];

/** Same as MUSCLE_GROUPS without the 'all' sentinel — use for form selectors. */
export const MUSCLE_OPTIONS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'core',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'full_body',
  'other',
];

export const EQUIPMENT_OPTIONS: Equipment[] = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'kettlebell',
  'bands',
  'other',
];

export const TYPE_OPTIONS: ExerciseType[] = ['weighted', 'bodyweight', 'timed'];

// ─── Display labels ───────────────────────────────────────────────────────────

export const MUSCLE_LABELS: Record<MuscleGroup | 'all', string> = {
  all: 'All',
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
  forearms: 'Forearms',
  full_body: 'Full Body',
  other: 'Other',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  bands: 'Bands',
  other: 'Other',
};

export const TYPE_LABELS: Record<ExerciseType, string> = {
  weighted: 'Weighted',
  bodyweight: 'Bodyweight',
  timed: 'Timed',
};

// ─── Exercise type badge colors ───────────────────────────────────────────────

export const EXERCISE_TYPE_BG: Record<ExerciseType, string> = {
  weighted: '#1a3a1a',
  bodyweight: '#1a1a3a',
  timed: '#3a1a3a',
};
