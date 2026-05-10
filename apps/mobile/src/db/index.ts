import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Exercise } from './models/Exercise';
import { Set } from './models/Set';
import { TemplateExercise } from './models/TemplateExercise';
import { Workout } from './models/Workout';
import { WorkoutExercise } from './models/WorkoutExercise';
import { WorkoutTemplate } from './models/WorkoutTemplate';
import { schema } from './schema';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'VegaLifts',
  jsi: true,
  onSetUpError: (error) => {
    console.error('WatermelonDB setup failed:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Exercise, WorkoutTemplate, TemplateExercise, Workout, WorkoutExercise, Set],
});

export { Exercise, Set, TemplateExercise, Workout, WorkoutExercise, WorkoutTemplate };
