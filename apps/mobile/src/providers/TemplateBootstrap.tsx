import type { TemplateExercise, WorkoutTemplate } from '../db';
import { useAuth } from '@clerk/clerk-expo';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useEffect, useRef } from 'react';
import { trpc } from '../shared/lib/trpc';

/**
 * Mirrors ExerciseBootstrap. On sign-in, fetches templates + their exercises
 * from tRPC and replaces the local copies. Phase 3 will introduce proper sync;
 * for now this delete-and-replace keeps the local store fresh on every launch.
 *
 * System templates store user_id as '' since they have no owner — `is_system`
 * is the source of truth for distinguishing them.
 */
export function TemplateBootstrap() {
  const database = useDatabase();
  const { isSignedIn } = useAuth();
  const isSyncingRef = useRef(false);
  const templatesQuery = trpc.templates.list.useQuery(undefined, {
    enabled: isSignedIn ?? false,
    staleTime: 10 * 60 * 1000,
    retry: 3,
  });

  useEffect(() => {
    if (!templatesQuery.data || isSyncingRef.current)
      return;

    const serverTemplates = templatesQuery.data;

    async function resetAndSync() {
      try {
        await database.write(async () => {
          const allTE = await database.get<TemplateExercise>('template_exercises').query().fetch();
          for (const te of allTE)
            await te.destroyPermanently();
          const allT = await database.get<WorkoutTemplate>('workout_templates').query().fetch();
          for (const t of allT)
            await t.destroyPermanently();
        });

        await database.write(async () => {
          for (const t of serverTemplates) {
            await database.get<WorkoutTemplate>('workout_templates').create((record) => {
              const raw = record._raw as any;
              raw.id = t.id;
              raw.user_id = t.userId ?? '';
              raw.name = t.name;
              raw.notes = t.notes ?? null;
              raw.is_system = t.isSystem ? 1 : 0;
              raw.created_at = new Date(t.createdAt).getTime();
              raw.updated_at = new Date(t.updatedAt).getTime();
            });
            for (const te of t.exercises) {
              await database.get<TemplateExercise>('template_exercises').create((record) => {
                const raw = record._raw as any;
                raw.id = te.id;
                raw.template_id = te.templateId;
                raw.exercise_id = te.exerciseId;
                raw.sort_order = te.sortOrder;
                raw.target_sets = te.targetSets ?? null;
                raw.target_reps = te.targetReps ?? null;
                raw.target_rpe = te.targetRpe ?? null;
                raw.rest_seconds = te.restSeconds ?? null;
                raw.created_at = new Date(te.createdAt).getTime();
                raw.updated_at = new Date(te.updatedAt).getTime();
              });
            }
          }
        });
      } catch (err) {
        console.warn('Template bootstrap failed:', err);
      }
    }

    isSyncingRef.current = true;
    resetAndSync().finally(() => {
      isSyncingRef.current = false;
    });
  }, [templatesQuery.data, database]);

  return null;
}
