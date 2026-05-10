import type { Exercise } from '../db';
import { useAuth } from '@clerk/clerk-expo';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useEffect } from 'react';
import { trpc } from '../lib/trpc';

export function ExerciseBootstrap() {
  const database = useDatabase();
  const { isSignedIn } = useAuth();
  const exercisesQuery = trpc.exercises.list.useQuery(undefined, {
    enabled: isSignedIn ?? false,
    staleTime: 10 * 60 * 1000,
    retry: 3,
  });

  useEffect(() => {
    if (!exercisesQuery.data || exercisesQuery.data.length === 0)
      return;

    const serverExercises = exercisesQuery.data;

    async function syncToLocal() {
      try {
        const existing = await database.get<Exercise>('exercises').query().fetch();
        const existingIds = new Set(existing.map(e => e.id));
        const toCreate = serverExercises.filter(e => !existingIds.has(e.id));
        if (toCreate.length === 0)
          return;

        await database.write(async () => {
          for (const ex of toCreate) {
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
      }
      catch (err) {
        console.warn('Exercise bootstrap failed:', err);
      }
    }

    syncToLocal();
  }, [exercisesQuery.data, database]);

  return null;
}
