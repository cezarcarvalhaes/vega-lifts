import type { Equipment, ExerciseType, MuscleGroup } from '@vega/types'
import { Model } from '@nozbe/watermelondb'
import { date, field, nochange, readonly, text } from '@nozbe/watermelondb/decorators'

export class Exercise extends Model {
  static table = 'exercises'

  @nochange @text('name') name!: string
  @nochange @field('type') type!: ExerciseType
  @nochange @field('primary_muscle_group') primaryMuscleGroup!: MuscleGroup
  @nochange @field('equipment') equipment!: Equipment
  @text('instructions') instructions!: string | null
  @field('user_id') userId!: string | null
  @nochange @field('is_system') isSystem!: boolean
  @readonly @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
}
