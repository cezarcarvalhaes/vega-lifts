import type { Workout, WorkoutExercise } from '../../src/db';
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
import { ExerciseSection } from '../../src/components/ExerciseSection';
import { RestTimerOverlay } from '../../src/components/RestTimerOverlay';
import { colors, fontSize, radius, spacing } from '../../src/constants/theme';
import { usePreferences } from '../../src/contexts/PreferencesContext';
import { useWorkout } from '../../src/contexts/WorkoutContext';
import { useRestTimer } from '../../src/hooks/useRestTimer';

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

  function handleFinish() {
    Alert.alert('Finish Workout?', 'Great work! This workout will be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          stopTimer();
          await finishWorkout(workoutId, elapsed);
          router.replace('/(tabs)');
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
          {workoutExercises.map(we => (
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
