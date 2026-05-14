import type { ExerciseType } from '@vega/types';
import type { Exercise, Set as SetModel, Workout, WorkoutExercise } from '../../../db';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { formatShortDate } from '@vega/types';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, fontSize, radius, spacing } from '../../../shared/constants/theme';
import { SetRow } from './SetRow';

interface Props {
  workoutExercise: WorkoutExercise;
  workoutId: string;
  defaultRestSeconds: number;
  onRemove: () => void;
  onSetComplete: (restSeconds: number) => void;
}

interface PrevSession {
  date: Date;
  sets: Array<{ weightKg: number | null; reps: number | null; durationSeconds: number | null }>;
}

export function ExerciseSection({ workoutExercise, workoutId, defaultRestSeconds, onRemove, onSetComplete }: Props) {
  const database = useDatabase();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState<SetModel[]>([]);
  const [prevSession, setPrevSession] = useState<PrevSession | null>(null);

  // exerciseId is immutable for this workoutExercise — fetch the definition once
  useEffect(() => {
    database
      .get<Exercise>('exercises')
      .find(workoutExercise.exerciseId)
      .then(setExercise)
      .catch(() => {});
  }, [database, workoutExercise.exerciseId]);

  // Observe sets reactively
  useEffect(() => {
    const sub = database
      .get<SetModel>('sets')
      .query(Q.where('workout_exercise_id', workoutExercise.id), Q.sortBy('sort_order', Q.asc))
      .observe()
      .subscribe(setSets);
    return () => sub.unsubscribe();
  }, [database, workoutExercise.id]);

  const loadPreviousSession = useCallback(async (exerciseId: string) => {
    try {
      const previousWEs = await database
        .get<WorkoutExercise>('workout_exercises')
        .query(
          Q.where('exercise_id', exerciseId),
          Q.on('workouts', [Q.where('finished_at', Q.gt(0)), Q.where('id', Q.notEq(workoutId))]),
          Q.sortBy('created_at', Q.desc),
          Q.take(1),
        )
        .fetch();

      if (previousWEs.length === 0)
        return;

      const prevWE = previousWEs[0]!;
      const prevWorkout = await database.get<Workout>('workouts').find(prevWE.workoutId);

      if (!prevWorkout.finishedAt)
        return;

      const prevSets = await database
        .get<SetModel>('sets')
        .query(Q.where('workout_exercise_id', prevWE.id), Q.sortBy('sort_order', Q.asc))
        .fetch();

      setPrevSession({
        date: prevWorkout.finishedAt,
        sets: prevSets.map((s) => ({
          weightKg: s.weightKg,
          reps: s.reps,
          durationSeconds: s.durationSeconds,
        })),
      });
    } catch {}
  }, [database, workoutId]);

  useEffect(() => {
    if (!exercise)
      return;
    loadPreviousSession(exercise.id);
  }, [exercise, loadPreviousSession]);

  const lastCompletedSet = sets.filter((s) => s.completedAt != null).at(-1);

  async function addSet() {
    const nextOrder = sets.length;
    const now = new Date();
    await database.write(async () => {
      await database.get<SetModel>('sets').create((s) => {
        const raw = s._raw as any;
        raw.workout_exercise_id = workoutExercise.id;
        raw.sort_order = nextOrder;
        raw.type = 'normal';
        raw.weight_kg = lastCompletedSet?.weightKg ?? null;
        raw.reps = lastCompletedSet?.reps ?? null;
        raw.duration_seconds = lastCompletedSet?.durationSeconds ?? null;
        raw.rpe = null;
        raw.completed_at = null;
        raw.created_at = now.getTime();
        raw.updated_at = now.getTime();
      });
    });
  }

  async function deleteSet(setId: string) {
    const s = await database.get<SetModel>('sets').find(setId);
    await database.write(async () => {
      await s.destroyPermanently();
    });
  }

  const handleRemove = useCallback(() => {
    Alert.alert('Remove exercise?', 'All sets for this exercise will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onRemove },
    ]);
  }, [onRemove]);

  if (!exercise)
    return null;

  const exerciseType: ExerciseType = exercise.type;

  function formatPrevSet(s: PrevSession['sets'][number]) {
    if (exerciseType === 'weighted')
      return `${s.weightKg ?? '-'} × ${s.reps ?? '-'}`;
    if (exerciseType === 'bodyweight')
      return `${s.reps ?? '-'} reps`;
    return `${s.durationSeconds ?? '-'}s`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.exerciseName} numberOfLines={1}>{exercise.name}</Text>
        <Pressable onPress={handleRemove} hitSlop={12} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>✕</Text>
        </Pressable>
      </View>

      {prevSession && (
        <View style={styles.prevSession}>
          <Text style={styles.prevLabel}>{formatShortDate(prevSession.date)}</Text>
          <Text style={styles.prevSets} numberOfLines={1}>
            {prevSession.sets.map(formatPrevSet).join('  ·  ')}
          </Text>
        </View>
      )}

      <View style={styles.colHeaders}>
        <Text style={[styles.colHeader, { width: 32 }]}>Set</Text>
        {exerciseType === 'weighted' && <Text style={[styles.colHeader, { flex: 1 }]}>Weight</Text>}
        {(exerciseType === 'weighted' || exerciseType === 'bodyweight') && (
          <Text style={[styles.colHeader, { flex: 1 }]}>Reps</Text>
        )}
        {exerciseType === 'timed' && <Text style={[styles.colHeader, { flex: 1 }]}>Duration</Text>}
        <Text style={[styles.colHeader, { width: 56 }]}>RPE</Text>
        <Text style={[styles.colHeader, { width: 44 }]}></Text>
      </View>

      {sets.map((set, i) => (
        <SetRow
          key={set.id}
          set={set}
          exerciseType={exerciseType}
          setNumber={i + 1}
          previousSet={prevSession?.sets[i] ?? (lastCompletedSet
            ? {
                weightKg: lastCompletedSet.weightKg,
                reps: lastCompletedSet.reps,
                durationSeconds: lastCompletedSet.durationSeconds,
              }
            : null)}
          onComplete={() => onSetComplete(defaultRestSeconds)}
          onDelete={() => deleteSet(set.id)}
        />
      ))}

      <Pressable style={styles.addSetBtn} onPress={addSet}>
        <Text style={styles.addSetText}>+ Add Set</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exerciseName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  removeBtn: {
    padding: spacing.xs,
  },
  removeBtnText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  prevSession: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  prevLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    minWidth: 48,
  },
  prevSets: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  colHeader: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addSetBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addSetText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
