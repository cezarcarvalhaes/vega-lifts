import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * WatermelonDB schema mirrors the Postgres schema for all synced tables
 * (everything except `users` and `user_preferences`).
 * Bump schemaVersion whenever tables or columns change.
 */
export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' }, // ExerciseType
        { name: 'primary_muscle_group', type: 'string' },
        { name: 'equipment', type: 'string' },
        { name: 'instructions', type: 'string', isOptional: true },
        { name: 'user_id', type: 'string', isOptional: true },
        { name: 'is_system', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'workout_templates',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'is_system', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'template_exercises',
      columns: [
        { name: 'template_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'sort_order', type: 'number' },
        { name: 'target_sets', type: 'number', isOptional: true },
        { name: 'target_reps', type: 'string', isOptional: true },
        { name: 'target_rpe', type: 'number', isOptional: true },
        { name: 'rest_seconds', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'workouts',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'template_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'started_at', type: 'number' },
        { name: 'finished_at', type: 'number', isOptional: true },
        { name: 'duration_seconds', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'workout_exercises',
      columns: [
        { name: 'workout_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'sort_order', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sets',
      columns: [
        { name: 'workout_exercise_id', type: 'string', isIndexed: true },
        { name: 'sort_order', type: 'number' },
        { name: 'type', type: 'string' }, // SetType
        { name: 'weight_kg', type: 'number', isOptional: true },
        { name: 'reps', type: 'number', isOptional: true },
        { name: 'duration_seconds', type: 'number', isOptional: true },
        { name: 'rpe', type: 'number', isOptional: true },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
