// ─── Enums ───────────────────────────────────────────────────────────────────

export type ExerciseType = 'weighted' | 'bodyweight' | 'timed';

export type SetType = 'normal' | 'warmup' | 'dropset';

export type MuscleGroup
  = | 'chest'
    | 'back'
    | 'shoulders'
    | 'biceps'
    | 'triceps'
    | 'forearms'
    | 'core'
    | 'quads'
    | 'hamstrings'
    | 'glutes'
    | 'calves'
    | 'full_body'
    | 'other';

export type Equipment
  = | 'barbell'
    | 'dumbbell'
    | 'cable'
    | 'machine'
    | 'bodyweight'
    | 'kettlebell'
    | 'bands'
    | 'other';

// ─── Entities ────────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  primaryMuscleGroup: MuscleGroup;
  equipment: Equipment;
  instructions: string | null;
  /** null = system exercise (read-only); string = owner user id */
  userId: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  notes: string | null;
  /** null = system template (read-only); otherwise user-owned */
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  sortOrder: number;
  targetSets: number | null;
  /** Supports text like "8-10", "AMRAP", "5" */
  targetReps: string | null;
  targetRpe: number | null;
  /** Rest duration in seconds */
  restSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workout {
  id: string;
  userId: string;
  templateId: string | null;
  name: string;
  notes: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  /** Duration in seconds */
  durationSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  sortOrder: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Set {
  id: string;
  workoutExerciseId: string;
  sortOrder: number;
  type: SetType;
  /** Always stored in kg; convert at display time */
  weightKg: number | null;
  reps: number | null;
  /** Duration in seconds for timed holds */
  durationSeconds: number | null;
  rpe: number | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  userId: string;
  unitSystem: 'kg' | 'lb';
  autoStartRestTimer: boolean;
  defaultRestSeconds: number;
  restTimerSound: boolean;
  restTimerHaptics: boolean;
  updatedAt: Date;
}

// ─── API contract types ───────────────────────────────────────────────────────

export interface CreateExerciseInput {
  name: string;
  type: ExerciseType;
  primaryMuscleGroup: MuscleGroup;
  equipment: Equipment;
  instructions?: string;
}

export interface CreateWorkoutInput {
  name: string;
  templateId?: string;
  notes?: string;
}

export interface LogSetInput {
  workoutExerciseId: string;
  type: SetType;
  weightKg?: number;
  reps?: number;
  durationSeconds?: number;
  rpe?: number;
}

// ─── Analytics helpers ────────────────────────────────────────────────────────

export function estimatedOneRepMax(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

export function setVolume(weightKg: number, reps: number): number {
  return weightKg * reps;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function getDayName(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
