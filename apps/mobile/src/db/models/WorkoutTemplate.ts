import type { TemplateExercise } from './TemplateExercise';
import { Model } from '@nozbe/watermelondb';
import { children, date, field, readonly, text } from '@nozbe/watermelondb/decorators';

export class WorkoutTemplate extends Model {
  static table = 'workout_templates';
  static associations = {
    template_exercises: { type: 'has_many' as const, foreignKey: 'template_id' },
  };

  @field('user_id') userId!: string;
  @text('name') name!: string;
  @text('notes') notes!: string | null;
  @field('is_system') isSystem!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('template_exercises') templateExercises!: TemplateExercise[];
}
