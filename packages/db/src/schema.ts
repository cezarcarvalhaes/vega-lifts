import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const exerciseTypeEnum = pgEnum('exercise_type', [
  'weighted',
  'bodyweight',
  'timed',
]);

export const setTypeEnum = pgEnum('set_type', ['normal', 'warmup', 'dropset']);

export const muscleGroupEnum = pgEnum('muscle_group', [
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
]);

export const equipmentEnum = pgEnum('equipment', [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'kettlebell',
  'bands',
  'other',
]);

export const unitSystemEnum = pgEnum('unit_system', ['kg', 'lb']);

// ─── Tables ───────────────────────────────────────────────────────────────────

/**
 * Auth-managed user record. Clerk is the source of truth for identity;
 * this table stores app-level user state only.
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user id (user_xxx)
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  unitSystem: unitSystemEnum('unit_system').notNull().default('kg'),
  autoStartRestTimer: boolean('auto_start_rest_timer').notNull().default(true),
  defaultRestSeconds: integer('default_rest_seconds').notNull().default(90),
  restTimerSound: boolean('rest_timer_sound').notNull().default(true),
  restTimerHaptics: boolean('rest_timer_haptics').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Exercise definitions. System exercises (is_system = true) are global and
 * read-only on the client. User exercises are private to the owner.
 */
export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: exerciseTypeEnum('type').notNull(),
  primaryMuscleGroup: muscleGroupEnum('primary_muscle_group').notNull(),
  equipment: equipmentEnum('equipment').notNull(),
  instructions: text('instructions'),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Saved workout days. System templates are seeded globally and cloneable;
 * user templates are private.
 */
export const workoutTemplates = pgTable('workout_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  notes: text('notes'),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Exercises within a template, with prescribed targets.
 */
export const templateExercises = pgTable('template_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id')
    .notNull()
    .references(() => workoutTemplates.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'restrict' }),
  sortOrder: integer('sort_order').notNull().default(0),
  targetSets: integer('target_sets'),
  /** Supports "8-10", "AMRAP", "5", etc. */
  targetReps: text('target_reps'),
  targetRpe: real('target_rpe'),
  restSeconds: integer('rest_seconds'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A single training session — in-progress or completed.
 */
export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').references(() => workoutTemplates.id, {
    onDelete: 'set null',
  }),
  name: text('name').notNull(),
  notes: text('notes'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Exercise slots within a workout session.
 */
export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutId: uuid('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'restrict' }),
  sortOrder: integer('sort_order').notNull().default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Individual sets — the atomic unit of workout logging.
 * weight_kg is always stored in kg; convert at display time based on user preference.
 */
export const sets = pgTable('sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutExerciseId: uuid('workout_exercise_id')
    .notNull()
    .references(() => workoutExercises.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  type: setTypeEnum('type').notNull().default('normal'),
  weightKg: real('weight_kg'),
  reps: integer('reps'),
  durationSeconds: integer('duration_seconds'),
  rpe: real('rpe'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Type exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type NewWorkoutTemplate = typeof workoutTemplates.$inferInsert;

export type TemplateExercise = typeof templateExercises.$inferSelect;
export type NewTemplateExercise = typeof templateExercises.$inferInsert;

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;

export type Set = typeof sets.$inferSelect;
export type NewSet = typeof sets.$inferInsert;
