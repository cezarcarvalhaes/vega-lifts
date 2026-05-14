import type { Set as SetModel, Workout, WorkoutExercise, WorkoutTemplate } from '../../src/db';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferences } from '../../src/features/preferences/context/PreferencesContext';
import { ExerciseSection } from '../../src/features/workout/components/ExerciseSection';
import { RestTimerOverlay } from '../../src/features/workout/components/RestTimerOverlay';
import { useWorkout } from '../../src/features/workout/context/WorkoutContext';
import { colors, fontSize, radius, spacing } from '../../src/shared/constants/theme';
import { useRestTimer } from '../../src/shared/hooks/useRestTimer';
import { trpc } from '../../src/shared/lib/trpc';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function WorkoutScreen() {
  const { id: workoutId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const database = useDatabase();
  const { finishWorkout, discardWorkout } = useWorkout();
  const { preferences } = usePreferences();
  const { timer, startTimer, stopTimer } = useRestTimer();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number>(0);
  const createTemplate = trpc.templates.create.useMutation();
  const addTemplateExercise = trpc.templates.addExercise.useMutation();

  useEffect(() => {
    database.get<Workout>('workouts').find(workoutId).then((w) => {
      setWorkout(w);
      startedAtRef.current = (w._raw as any).started_at as number;
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    });
  }, [workoutId, database]);

  useEffect(() => {
    const sub = database
      .get<WorkoutExercise>('workout_exercises')
      .query(Q.where('workout_id', workoutId), Q.sortBy('sort_order', Q.asc))
      .observe()
      .subscribe(setWorkoutExercises);
    return () => sub.unsubscribe();
  }, [workoutId, database]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleSetComplete(restSeconds: number) {
    if (preferences.autoStartRestTimer) {
      await startTimer(restSeconds);
    }
  }

  async function handleRemoveExercise(workoutExerciseId: string) {
    const we = await database.get<WorkoutExercise>('workout_exercises').find(workoutExerciseId);
    const sets = await database
      .get('sets')
      .query(Q.where('workout_exercise_id', workoutExerciseId))
      .fetch();
    await database.write(async () => {
      for (const s of sets) {
        await s.destroyPermanently();
      }
      await we.destroyPermanently();
    });
  }

  async function commitFinish() {
    stopTimer();
    await finishWorkout(workoutId, elapsed);
    router.replace('/(tabs)');
  }

  async function saveAsTemplate(templateName: string) {
    try {
      // Per-exercise completed-set counts derived from the local DB.
      const exercisesWithCounts = await Promise.all(
        workoutExercises.map(async (we) => {
          const completedCount = await database
            .get<SetModel>('sets')
            .query(Q.where('workout_exercise_id', we.id), Q.where('completed_at', Q.gt(0)))
            .fetchCount();
          return { we, completedCount };
        }),
      );
      const meaningful = exercisesWithCounts.filter((x) => x.completedCount > 0);
      if (meaningful.length === 0) {
        Alert.alert('Nothing to save', 'Log at least one set before saving as a template.');
        return;
      }

      const created = await createTemplate.mutateAsync({ name: templateName });
      await database.write(async () => {
        await database.get<WorkoutTemplate>('workout_templates').create((record) => {
          const raw = record._raw as any;
          raw.id = created.id;
          raw.user_id = created.userId ?? '';
          raw.name = created.name;
          raw.notes = created.notes ?? null;
          raw.is_system = created.isSystem ? 1 : 0;
          raw.created_at = new Date(created.createdAt).getTime();
          raw.updated_at = new Date(created.updatedAt).getTime();
        });
      });

      for (let i = 0; i < meaningful.length; i++) {
        const { we, completedCount } = meaningful[i]!;
        await addTemplateExercise.mutateAsync({
          templateId: created.id,
          exerciseId: we.exerciseId,
          sortOrder: i,
          targetSets: completedCount,
        });
      }
    } catch {
      Alert.alert('Error', 'Could not save template.');
    }
  }

  function handleFinish() {
    Alert.alert('Finish Workout?', 'Great work! This workout will be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          // Offer to save as template only when the workout wasn't started from one.
          if (workout && !(workout._raw as any).template_id) {
            Alert.prompt(
              'Save as template?',
              'Save this workout as a template to reuse later.',
              [
                { text: 'No thanks', style: 'cancel', onPress: () => commitFinish() },
                {
                  text: 'Save',
                  onPress: async (name) => {
                    const trimmed = (name ?? '').trim();
                    if (trimmed.length > 0)
                      await saveAsTemplate(trimmed);
                    await commitFinish();
                  },
                },
              ],
              'plain-text',
              workout.name,
            );
            return;
          }
          await commitFinish();
        },
      },
    ]);
  }

  function handleDiscard() {
    Alert.alert('Discard Workout?', 'All sets will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          stopTimer();
          await discardWorkout(workoutId);
          router.replace('/(tabs)');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleDiscard} hitSlop={12} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>✕</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName} numberOfLines={1}>
            {workout?.name ?? ''}
          </Text>
          <Text style={styles.elapsedText}>{formatElapsed(elapsed)}</Text>
        </View>
        <Pressable onPress={handleFinish} style={styles.finishBtn}>
          <Text style={styles.finishBtnText}>Finish</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {workoutExercises.map((we) => (
            <ExerciseSection
              key={we.id}
              workoutExercise={we}
              workoutId={workoutId}
              defaultRestSeconds={preferences.defaultRestSeconds}
              onRemove={() => handleRemoveExercise(we.id)}
              onSetComplete={handleSetComplete}
            />
          ))}

          {workoutExercises.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No exercises yet</Text>
              <Text style={styles.emptySubText}>Tap "Add Exercise" to get started</Text>
            </View>
          )}

          <Pressable
            style={styles.addExerciseBtn}
            onPress={() =>
              router.push({
                pathname: '/workout/add-exercise',
                params: { workoutId },
              })}
          >
            <Text style={styles.addExerciseText}>+ Add Exercise</Text>
          </Pressable>

          <View style={{ height: 160 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <RestTimerOverlay timer={timer} onStop={stopTimer} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  workoutName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  elapsedText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  finishBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 64,
    alignItems: 'center',
  },
  finishBtnText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
  },
  emptySubText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  addExerciseBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  addExerciseText: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
