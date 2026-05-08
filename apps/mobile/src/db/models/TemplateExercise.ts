import type { Exercise } from './Exercise'
import type { WorkoutTemplate } from './WorkoutTemplate'
import { Model } from '@nozbe/watermelondb'
import { date, field, immutableRelation, readonly, text } from '@nozbe/watermelondb/decorators'

export class TemplateExercise extends Model {
  static table = 'template_exercises'
  static associations = {
    workout_templates: { type: 'belongs_to' as const, key: 'template_id' },
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
  }

  @immutableRelation('workout_templates', 'template_id') template!: WorkoutTemplate
  @immutableRelation('exercises', 'exercise_id') exercise!: Exercise
  @field('sort_order') sortOrder!: number
  @field('target_sets') targetSets!: number | null
  @text('target_reps') targetReps!: string | null
  @field('target_rpe') targetRpe!: number | null
  @field('rest_seconds') restSeconds!: number | null
  @readonly @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
}
