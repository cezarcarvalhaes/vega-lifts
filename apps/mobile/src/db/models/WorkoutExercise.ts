import type { Exercise } from './Exercise'
import type { Set } from './Set'
import type { Workout } from './Workout'
import { Model } from '@nozbe/watermelondb'
import { children, date, field, immutableRelation, readonly, text } from '@nozbe/watermelondb/decorators'

export class WorkoutExercise extends Model {
  static table = 'workout_exercises'
  static associations = {
    workouts: { type: 'belongs_to' as const, key: 'workout_id' },
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
    sets: { type: 'has_many' as const, foreignKey: 'workout_exercise_id' },
  }

  @immutableRelation('workouts', 'workout_id') workout!: Workout
  @immutableRelation('exercises', 'exercise_id') exercise!: Exercise
  @field('sort_order') sortOrder!: number
  @text('notes') notes!: string | null
  @readonly @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date

  @children('sets') sets!: Set[]
}
