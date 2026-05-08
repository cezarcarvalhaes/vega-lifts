import type { SetType } from '@vega/types'
import type { WorkoutExercise } from './WorkoutExercise'
import { Model } from '@nozbe/watermelondb'
import { date, field, immutableRelation, readonly } from '@nozbe/watermelondb/decorators'

export class Set extends Model {
  static table = 'sets'
  static associations = {
    workout_exercises: { type: 'belongs_to' as const, key: 'workout_exercise_id' },
  }

  @immutableRelation('workout_exercises', 'workout_exercise_id') workoutExercise!: WorkoutExercise
  @field('sort_order') sortOrder!: number
  @field('type') type!: SetType
  @field('weight_kg') weightKg!: number | null
  @field('reps') reps!: number | null
  @field('duration_seconds') durationSeconds!: number | null
  @field('rpe') rpe!: number | null
  @date('completed_at') completedAt!: Date | null
  @readonly @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
}
