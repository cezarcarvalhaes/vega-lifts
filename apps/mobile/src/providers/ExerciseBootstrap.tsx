import type { Exercise } from '../db';
import { useAuth } from '@clerk/clerk-expo';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useEffect, useRef } from 'react';
import { trpc } from '../shared/lib/trpc';

export function ExerciseBootstrap() {
  const database = useDatabase();
  const { isSignedIn } = useAuth();
  const isSyncingRef = useRef(false);
  const exercisesQuery = trpc.exercises.list.useQuery(undefined, {
    enabled: isSignedIn ?? false,
    staleTime: 10 * 60 * 1000,
    retry: 3,
  });

  useEffect(() => {
    if (!exercisesQuery.data || exercisesQuery.data.length === 0 || isSyncingRef.current)
      return;

    const serverExercises = exercisesQuery.data;

    async function resetAndSync() {
      try {
        await database.write(async () => {
          const all = await database.get<Exercise>('exercises').query().fetch();
          for (const ex of all)
            await ex.destroyPermanently();
        });
        await database.write(async () => {
          for (const ex of serverExercises) {
            await database.get<Exercise>('exercises').create((record) => {
              const raw = record._raw as any;
              raw.id = ex.id;
              raw.name = ex.name;
              raw.type = ex.type;
              raw.primary_muscle_group = ex.primaryMuscleGroup;
              raw.equipment = ex.equipment;
              raw.instructions = ex.instructions ?? null;
              raw.user_id = ex.userId ?? null;
              raw.is_system = ex.isSystem ? 1 : 0;
              raw.created_at = new Date(ex.createdAt).getTime();
              raw.updated_at = new Date(ex.updatedAt).getTime();
            });
          }
        });
      } catch (err) {
        console.warn('Exercise bootstrap failed:', err);
      }
    }

    isSyncingRef.current = true;
    resetAndSync().finally(() => {
      isSyncingRef.current = false;
    });
  }, [exercisesQuery.data, database]);

  return null;
}
