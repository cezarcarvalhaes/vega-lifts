import type { WorkoutExercise } from './WorkoutExercise';
import { Model } from '@nozbe/watermelondb';
import { children, date, field, readonly, text } from '@nozbe/watermelondb/decorators';

export class Workout extends Model {
  static table = 'workouts';
  static associations = {
    workout_exercises: { type: 'has_many' as const, foreignKey: 'workout_id' },
  };

  @field('user_id') userId!: string;
  @field('template_id') templateId!: string | null;
  @text('name') name!: string;
  @text('notes') notes!: string | null;
  @date('started_at') startedAt!: Date;
  @date('finished_at') finishedAt!: Date | null;
  @field('duration_seconds') durationSeconds!: number | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('workout_exercises') workoutExercises!: WorkoutExercise[];
}
